package ui

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	sim "github.com/micmonay/simconnect"
)

type Server struct {
	httpServer *http.Server
	shutdown   chan bool

	//SSE

	// New events are sent to this channel
	valueChanged <-chan []sim.SimVar

	// New client connections
	newClients chan chan []sim.SimVar

	// Closed client connections
	closingClients chan chan []sim.SimVar

	// Client connections registry
	clients map[chan []sim.SimVar]bool
}

type Event struct {
	// defining struct variables
	Index int
	Value string
}

func NewServer(valueChanged <-chan []sim.SimVar) *Server {
	// Starts simconnect service
	return &Server{
		httpServer: &http.Server{
			Addr: "localhost:8080",
		},
		shutdown: make(chan bool),

		valueChanged:   valueChanged,
		newClients:     make(chan chan []sim.SimVar),
		closingClients: make(chan chan []sim.SimVar),
		clients:        make(map[chan []sim.SimVar]bool),
	}
}

func (s *Server) Run(wg *sync.WaitGroup) {
	wg.Add(1)
	go s.listenAndServe(wg)
	wg.Add(1)
	go s.processChangedValuesLoop(wg)
}

func (s *Server) listenAndServe(wg *sync.WaitGroup) {
	defer wg.Done() // let main know we are done cleaning up

	// Starts web UI server
	http.HandleFunc("/", s.index)
	http.HandleFunc("/subscribe", s.serverEvents)

	if err := s.httpServer.ListenAndServe(); err != http.ErrServerClosed {
		// unexpected error. port in use?
		log.Fatalf("ListenAndServe(): %v", err)
	}
}

func (s *Server) processChangedValuesLoop(wg *sync.WaitGroup) {
	defer wg.Done() // let main know we are done cleaning up

	for {
		select {
		case c := <-s.newClients:
			// A new client has connected.
			// Register their message channel
			s.clients[c] = true
			log.Printf("Client added. %d registered clients", len(s.clients))

		case c := <-s.closingClients:
			// A client has dettached and we want to
			// stop sending them messages.
			close(c)
			delete(s.clients, c)
			log.Printf("Removed client. %d registered clients", len(s.clients))

		case result := <-s.valueChanged:
			// We got a new event from the outside!
			// Send event to all connected clients
			for clientMessageChan := range s.clients {
				clientMessageChan <- result
			}

		case <-s.shutdown:
			// we were told to shutdown
			for c := range s.clients {
				close(c)
				delete(s.clients, c)
				log.Printf("Removed client. %d registered clients", len(s.clients))
			}
			log.Println("Shuting down event reader")
			return

		}
	}
}

func (s *Server) Stop() {
	s.shutdown <- true
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	s.httpServer.Shutdown(ctx)
	log.Println("Shuting down http server")
}

func (s *Server) index(w http.ResponseWriter, req *http.Request) {
	log.Println("Received request for " + req.URL.Path)
	http.ServeFile(w, req, "web"+req.URL.Path)
}

func (s *Server) serverEvents(w http.ResponseWriter, req *http.Request) {
	log.Println("Received request for " + req.URL.Path)

	// Make sure that the writer supports flushing.
	flusher, ok := w.(http.Flusher)

	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	// Set the headers related to event streaming.
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Each connection registers its own message channel with the Broker's connections registry
	messageChan := make(chan []sim.SimVar)

	log.Println("Signal new connection to broker")
	// Signal the broker that we have a new connection
	s.newClients <- messageChan

	// Listen to connection close and un-register messageChan
	ctx := req.Context()
	go func() {
		<-ctx.Done()
		s.closingClients <- messageChan
	}()

	// block waiting for messages broadcast on this connection's messageChan
	for {
		// Write to the ResponseWriter
		// Server Sent Events compatible
		result, open := <-messageChan
		if !open {
			return
		}

		for _, simVar := range result {
			v, _ := simVar.GetBool()
			e := Event{
				Index: simVar.Index,
				Value: fmt.Sprintf("%v", v),
			}

			jsonData, err := json.Marshal(e)
			if err != nil {
				log.Printf("Error marshalling event: %v\n", e)
			}

			fmt.Fprintf(w, "data: %s\n\n", jsonData)

		}

		// Flush the data immediatly instead of buffering it for later.
		flusher.Flush()
	}

}
