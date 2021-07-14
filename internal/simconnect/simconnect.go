package simconnect

import (
	"log"
	"sync"
	"time"

	sim "github.com/micmonay/simconnect"
)

type Controller struct {
	shutdown chan bool

	valueChanged chan<- []sim.SimVar
}

func NewSimConnectController(valueChanged chan<- []sim.SimVar) *Controller {
	return &Controller{
		shutdown:     make(chan bool),
		valueChanged: valueChanged,
	}
}

func (c *Controller) Run(wg *sync.WaitGroup) {
	wg.Add(1)
	go func() {
		defer wg.Done() // let main know we are done cleaning up

		// Start main event loop
		var retryWaitTime = time.Second * 15
		for {
			if err := c.serverMainLoop(); err != nil {
				// should we retry ?
				log.Printf("SimConnect server not available. Is your game running? ")
				log.Printf("Retrying in %d seconds\n", int64(retryWaitTime.Seconds()))

				select {
				case <-c.shutdown:
					// we were told to shutdown, so no retrying
				case <-time.After(retryWaitTime):
					// this represents our retry sleep
					continue
				}
			}
			// no error, gracefully shut
			log.Println("Shuting down event sender")
			return
		}
	}()
}

func (c *Controller) Stop() {
	c.shutdown <- true
}

func (c *Controller) serverMainLoop() error {
	sc, err := sim.NewEasySimConnect()
	if err != nil {
		return err
	}

	sc.SetLoggerLevel(sim.LogInfo)

	conn, err := sc.Connect("FSControl")
	if err != nil {
		return err
	}
	//wait for connection
	<-conn

	cSimStatus := sc.ConnectSysEventSim()
	//wait for start
	log.Println("Waiting for sim start")
	for {
		if <-cSimStatus {
			log.Println("Started")
			break
		}
	}

	log.Println("Connecting to vars")
	cSimVar, err := sc.ConnectToSimVar(
		sim.SimVarAutopilotMaster(INDEX_AUTOPILOT_MASTER),
	)
	if err != nil {
		return err
	}

	log.Println("Connecting to crash")
	crashed := sc.ConnectSysEventCrashed()

	//log.Println("Connecting to throtle")
	//throtleFull := sc.NewSimEvent(sim.KeyThrottleFull)

	// main event loop
	for {
		select {
		case result := <-cSimVar:
			c.valueChanged <- result
		case <-crashed:
			log.Println("Plane crashed")
		case <-c.shutdown:
			<-sc.Close()
			return nil
		}
	}
}
