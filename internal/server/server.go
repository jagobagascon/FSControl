package server

import (
	"log"
	"os"
	"os/signal"
	"sync"

	"github.com/jagobagascon/FSControl/internal/simconnect"
	"github.com/jagobagascon/FSControl/internal/ui"

	sim "github.com/micmonay/simconnect"
)

type Server struct {
	uiServer   *ui.Server
	simconnect *simconnect.Controller
}

func NewServer() *Server {
	// Starts simconnect service
	simValueChanged := make(chan []sim.SimVar)
	return &Server{
		uiServer:   ui.NewServer(simValueChanged),
		simconnect: simconnect.NewSimConnectController(simValueChanged),
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

	s.uiServer.Stop()
	s.simconnect.Stop()

	// Wait for gracefull stop
	log.Println("Shutting down....")
	serverExitDone.Wait()

	return nil
}
