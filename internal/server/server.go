package server

import (
	"log"
	"os"
	"os/signal"
	"sync"

	"github.com/jagobagascon/FSControl/internal/event"
	"github.com/jagobagascon/FSControl/internal/simconnect"
	"github.com/jagobagascon/FSControl/internal/ui"
)

type Server struct {
	uiServer   *ui.Server
	simconnect *simconnect.Controller
}

func NewServer() *Server {
	// Starts simconnect service
	simValueChanged := make(chan simconnect.SimData)
	simValueRequest := make(chan event.Event)
	return &Server{
		uiServer:   ui.NewServer(simValueChanged, simValueRequest),
		simconnect: simconnect.NewSimConnectController(simValueChanged, simValueRequest),
	}
}

func (s *Server) Run() error {
	serverExitDone := &sync.WaitGroup{}

	s.uiServer.Run(serverExitDone)
	s.simconnect.Run(serverExitDone)

	// capture ctrl+c
	// Setting up signal capturing
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)

	<-stop

	s.simconnect.Stop()
	s.uiServer.Stop()

	// Wait for gracefull stop
	log.Println("Shutting down....")
	serverExitDone.Wait()

	return nil
}
