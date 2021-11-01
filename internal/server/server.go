package server

import (
	"log"
	"os"
	"os/signal"
	"sync"

	"github.com/jagobagascon/FSControl/internal/event"
	"github.com/jagobagascon/FSControl/internal/simdata"
	"github.com/jagobagascon/FSControl/internal/ui"
)

type Server struct {
	uiServer      *ui.Server
	simcontroller *simdata.Controller

	simValueChanged chan simdata.SimData
	simValueRequest chan event.Event
}

type Config struct {
	Dev     bool
	Address string
}

func NewServer(cfg *Config) *Server {
	// Starts simcontroller service
	simValueChanged := make(chan simdata.SimData)
	simValueRequest := make(chan event.Event)
	log.Println("Starting server.")
	if cfg.Dev {
		log.Println("DEVELOPMENT MODE.")
	}
	return &Server{
		uiServer: ui.NewServer(&ui.Config{
			Dev:                 cfg.Dev,
			Address:             cfg.Address,
			ValueChanged:        simValueChanged,
			ValueChangeRequests: simValueRequest,
		}),
		simcontroller: simdata.NewSimController(&simdata.Config{
			ValueChanged:       simValueChanged,
			ValueChangeRequest: simValueRequest,
		}),
		simValueChanged: simValueChanged,
		simValueRequest: simValueRequest,
	}
}

func NewConfig() *Config {
	return &Config{
		Dev:     false,
		Address: ":8080",
	}
}

func (s *Server) Run() error {
	serverExitDone := &sync.WaitGroup{}

	s.uiServer.Run(serverExitDone)
	s.simcontroller.Run(serverExitDone)

	// capture ctrl+c
	// Setting up signal capturing
	stop := make(chan os.Signal, 1)
	defer close(stop)

	signal.Notify(stop, os.Interrupt)

	<-stop

	s.simcontroller.Stop()
	s.uiServer.Stop()

	// Wait for gracefull stop
	log.Println("Shutting down....")
	serverExitDone.Wait()

	close(s.simValueChanged)
	close(s.simValueRequest)

	return nil
}
