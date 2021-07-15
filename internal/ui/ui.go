package ui

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/jagobagascon/FSControl/internal/event"
	"github.com/jagobagascon/FSControl/internal/simconnect"
)

type Server struct {
	httpServer *http.Server
	shutdown   chan bool

	// change requests from ui to server
	valueChangeRequests chan<- event.Event

	//SSE

	// New events are sent to this channel
	valueChanged <-chan simconnect.SimData

	// New client connections
	newClients chan chan simconnect.SimData

	// Closed client connections
	closingClients chan chan simconnect.SimData

	// Client connections registry
	clients map[chan simconnect.SimData]bool
}

func NewServer(valueChanged <-chan simconnect.SimData, valueChangeRequests chan<- event.Event) *Server {
	// Starts simconnect service
	return &Server{
		httpServer: &http.Server{
			Addr: "localhost:8080",
		},
		shutdown: make(chan bool),

		valueChangeRequests: valueChangeRequests,
		valueChanged:        valueChanged,
		newClients:          make(chan chan simconnect.SimData),
		closingClients:      make(chan chan simconnect.SimData),
		clients:             make(map[chan simconnect.SimData]bool),
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
	http.HandleFunc("/value-change-request", s.valueChangeRequest)
	http.HandleFunc("/subscribe", s.serverEvents)

	if err := s.httpServer.ListenAndServe(); err != http.ErrServerClosed {
		// unexpected error. port in use?
		log.Fatalf("ListenAndServe(): %v", err)
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

func (s *Server) valueChangeRequest(w http.ResponseWriter, req *http.Request) {
	log.Println("Received request for " + req.URL.Path)

	// get values
	req.ParseForm()
	n := req.PostForm["name"][0]
	v, _ := strconv.ParseBool(req.PostForm["value"][0])
	select { // use a timeout in case the reader fails
	case s.valueChangeRequests <- event.Event{Name: n, Value: v}:
	case <-time.After(time.Second * 5):
	}

	fmt.Fprintln(w, "ok")
}

// SSE

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
	messageChan := make(chan simconnect.SimData)

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

		jsonData, err := json.Marshal(result)
		if err != nil {
			log.Printf("Error marshalling event: %v\n", result)
		}

		fmt.Fprintf(w, "data: %s\n\n", jsonData)

		// Flush the data immediatly instead of buffering it for later.
		flusher.Flush()
	}

}
