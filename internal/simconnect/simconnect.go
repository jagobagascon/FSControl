package simconnect

import (
	"log"
	"sync"
	"time"

	"github.com/jagobagascon/FSControl/internal/event"
	sim "github.com/micmonay/simconnect"
)

type Controller struct {
	shutdown chan bool

	valueChanged       chan<- SimData
	valueChangeRequest <-chan event.Event
}

func NewSimConnectController(valueChanged chan<- SimData, valueChangeRequest <-chan event.Event) *Controller {
	return &Controller{
		shutdown:           make(chan bool),
		valueChanged:       valueChanged,
		valueChangeRequest: valueChangeRequest,
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

	cSimVar, err := c.connectVars(sc)
	if err != nil {
		return err
	}

	// main event loop
	for {
		select {
		case status := <-cSimStatus:
			log.Printf("Simulator status changed %v\n", status)
			if status {
				// reconnect
				cSimVar, err = c.connectVars(sc)
				if err != nil {
					return err
				}
			}
		case iFace := (<-cSimVar):
			if result, ok := iFace.(SimData); ok {
				select { // use a timeout in case the reader fails
				case c.valueChanged <- result:
				case <-time.After(time.Second * 5):
				}
			}
		case request := <-c.valueChangeRequest:
			switch request.Name {
			case AutopilotMaster:
				select {
				case <-autopilotEnable(sc, request.Value == true):
				case <-time.After(time.Second * 5):
				}
			case YawDamper:
				select {
				case <-yawDamperEnable(sc, request.Value == true):
				case <-time.After(time.Second * 5):
				}
			}
		case <-c.shutdown:
			select {
			case <-sc.Close():
			case <-time.After(time.Second * 5):
			}
			return nil
		}
	}
}

func (c *Controller) connectVars(sc *sim.EasySimConnect) (<-chan interface{}, error) {
	return sc.ConnectInterfaceToSimVar(SimData{})
}

func autopilotEnable(sc *sim.EasySimConnect, enabled bool) <-chan int32 {
	if enabled {
		autopilotOn := sc.NewSimEvent(sim.KeyAutopilotOn)
		return autopilotOn.Run()
	} else {
		autopilotOff := sc.NewSimEvent(sim.KeyAutopilotOff)
		return autopilotOff.Run()
	}
}

func yawDamperEnable(sc *sim.EasySimConnect, enabled bool) <-chan int32 {
	ydSet := sc.NewSimEvent(sim.KeyYawDamperSet)
	enabledValue := 0
	if enabled {
		enabledValue = 1
	}
	return ydSet.RunWithValue(enabledValue)
}
