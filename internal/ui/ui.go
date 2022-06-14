package ui

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/jagobagascon/FSControl/internal/event"
	"github.com/jagobagascon/FSControl/internal/simdata"
)

//go:embed static/*
var staticFiles embed.FS

type Server struct {
	dev bool

	httpServer *http.Server

	staticFileServer http.Handler

	shutdown chan bool

	// change requests from ui to server
	valueChangeRequests chan<- event.ValueChangeRequest

	//SSE

	// New events are sent to this channel
	valueChanged <-chan simdata.SimData

	// New client connections
	newClients chan chan simdata.SimData

	// Closed client connections
	closingClients chan chan simdata.SimData

	// Client connections registry
	clients map[chan simdata.SimData]bool
}

type Config struct {
	Dev bool

	Address string

	// receives events from the SIM
	ValueChanged <-chan simdata.SimData

	// receives commands from the UI
	ValueChangeRequests chan<- event.ValueChangeRequest
}

func NewServer(cfg *Config) *Server {
	// Starts simdata service
	sf, _ := fs.Sub(staticFiles, "static")
	fs := http.FileServer(http.FS(sf))

	return &Server{
		dev: cfg.Dev,
		httpServer: &http.Server{
			Addr: cfg.Address,
		},
		staticFileServer: fs,

		shutdown: make(chan bool),

		valueChangeRequests: cfg.ValueChangeRequests,
		valueChanged:        cfg.ValueChanged,
		newClients:          make(chan chan simdata.SimData),
		closingClients:      make(chan chan simdata.SimData),
		clients:             make(map[chan simdata.SimData]bool),
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
	http.HandleFunc("/value-change-request", s.valueChangeRequest)
	http.HandleFunc("/subscribe", s.serverEvents)
	http.HandleFunc("/", func(rw http.ResponseWriter, r *http.Request) {
		if !s.dev {
			s.staticFileServer.ServeHTTP(rw, r)
		} else {
			s.index(rw, r)
		}
	})

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
	http.ServeFile(w, req, "internal/ui/static"+req.URL.Path)
}

func (s *Server) valueChangeRequest(w http.ResponseWriter, req *http.Request) {
	log.Println("Received request for " + req.URL.Path)

	// get values
	req.ParseForm()
	n := req.PostForm["name"][0]
	var v int = 0
	hasval := false
	if val, ok := req.PostForm["value"]; ok {
		// has value
		v, _ = strconv.Atoi(val[0])
		hasval = true
	}

	go func() {
		strict := req.PostForm["strict"][0] == "true"
		s.valueChangeRequests <- event.ValueChangeRequest{Name: n, Value: v, HasValue: hasval, IsStrict: strict}
	}()

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
	messageChan := make(chan simdata.SimData)

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
