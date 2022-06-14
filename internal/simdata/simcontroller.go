package simdata

import (
	"fmt"
	"log"
	"sync"
	"time"

	sim "github.com/grumpypixel/msfs2020-simconnect-go/simconnect"
	"github.com/jagobagascon/FSControl/internal/event"
)

type Var struct {
	DefineID sim.DWord
	Name     string
}

type Controller struct {
	shutdown chan bool

	valueChanged       chan<- SimData
	valueChangeRequest <-chan event.ValueChangeRequest

	vars         []*Var
	simdataReady chan SimData
	mate         *sim.SimMate

	indexEvent   sim.DWord
	listEvent    map[sim.DWord]func(sim.DWord)
	listSimEvent map[KeySimEvent]SimEvent
}

type Config struct {
	ValueChanged       chan<- SimData
	ValueChangeRequest <-chan event.ValueChangeRequest
}

func NewSimController(cfg *Config) *Controller {
	return &Controller{
		shutdown:           make(chan bool),
		valueChanged:       cfg.ValueChanged,
		valueChangeRequest: cfg.ValueChangeRequest,
		simdataReady:       make(chan SimData),
		mate:               sim.NewSimMate(),
		indexEvent:         0,
		listEvent:          make(map[sim.DWord]func(sim.DWord)),
		listSimEvent:       make(map[KeySimEvent]SimEvent),
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
	// open connection with the game
	if err := c.mate.Open("FSControl"); err != nil {
		return err
	}

	// variables:
	// These are the sim vars we are looking for
	c.vars = nil
	requests := GetVarsFromSimData()
	c.vars = make([]*Var, 0)
	for _, request := range requests {
		defineID := c.mate.AddSimVar(request.Name, request.Unit, request.DataType)
		c.vars = append(c.vars, &Var{defineID, request.Name})
	}

	requestDataInterval := time.Millisecond * 100
	receiveDataInterval := time.Millisecond * 30

	stop := make(chan interface{}, 1)
	defer close(stop)
	go c.mate.HandleEvents(requestDataInterval, receiveDataInterval, stop, &sim.EventListener{
		OnOpen:      c.OnOpen,
		OnQuit:      c.OnQuit,
		OnDataReady: c.OnDataReady,
		OnEventID:   c.OnEventID,
		OnException: c.OnException,
	})

	// loop until notified about shutdown
	for {
		select {
		case result := <-c.simdataReady:
			// received a value from the SIM. Notify the front
			go c.notifyDataChanged(result)
		case request := <-c.valueChangeRequest:
			// value from the front
			go c.triggerServerEvent(request)
		case <-c.shutdown:
			select {
			case stop <- true:
			case <-time.After(time.Second * 5):
			}
			return c.mate.Close()
		}
	}
}

// notifyFront sends the data into the frontend channel
func (c *Controller) notifyDataChanged(d SimData) {
	c.valueChanged <- d
}

func (c *Controller) triggerServerEvent(request event.ValueChangeRequest) {
	e := c.NewSimEvent(KeySimEvent(request.Name))
	log.Printf("Event received. Strict ? %v Val: %v", request.IsStrict, request.Value)
	if request.HasValue {
		<-e.RunWithValue(request.Value)
	} else {
		<-e.Run()
	}
}

func (c *Controller) OnOpen(applName, applVersion, applBuild, simConnectVersion, simConnectBuild string) {
	fmt.Println("\nConnected.")
	flightSimVersion := fmt.Sprintf(
		"Flight Simulator:\n Name: %s\n Version: %s (build %s)\n SimConnect: %s (build %s)",
		applName, applVersion, applBuild, simConnectVersion, simConnectBuild)
	fmt.Printf("\n%s\n\n", flightSimVersion)
	fmt.Printf("CLEAR PROP!\n\n")
}

func (c *Controller) OnQuit() {
	fmt.Println("Disconnected.")
}

func (c *Controller) OnEventID(eventID sim.DWord) {
	fmt.Println("Received event ID", eventID)
	cb, found := c.listEvent[eventID]
	if !found {
		fmt.Print("Ignored event")
	}
	go cb(eventID)
	fmt.Println("Done event ID", eventID)

}

func (c *Controller) OnException(exceptionCode sim.DWord) {
	fmt.Printf("Exception (code: %d)\n", exceptionCode)
}

func (c *Controller) OnDataReady() {
	simData := SimData{}
	for _, v := range c.vars {
		// todo set simvar
		value, _, ok := c.mate.SimVarValueAndDataType(v.DefineID)
		if !ok {
			continue
		}
		simData.Put(v.Name, value)
	}
	c.simdataReady <- simData
}

func (c *Controller) NewSimEvent(simEventStr KeySimEvent) SimEvent {

	log.Println(simEventStr)
	instance, found := c.listSimEvent[simEventStr]
	if found {
		return instance
	}

	c.indexEvent++
	cb := make(chan sim.DWord)
	simEvent := SimEvent{
		simEventStr,
		0,
		c.runSimEvent,
		cb,
		c.indexEvent,
	}
	c.listEvent[c.indexEvent] = func(data sim.DWord) {
		cb <- data
	}

	if err := c.mate.MapClientEventToSimEvent(c.indexEvent, string(simEventStr)); err != nil {
		log.Println(err)
	}
	if err := c.mate.AddClientEventToNotificationGroup(0, c.indexEvent, false); err != nil {
		log.Println(err)
	}
	if err := c.mate.SetNotificationGroupPriority(0, sim.GroupPriorityHighest); err != nil {
		log.Println(err)
	}
	c.listSimEvent[simEventStr] = simEvent
	return simEvent
}

func (c *Controller) runSimEvent(simEvent SimEvent) {
	c.mate.TransmitClientEvent(uint32(sim.ObjectIDUser), uint32(simEvent.eventID), simEvent.Value, sim.GroupPriorityHighest, sim.EventFlagGroupIDIsPriority)
}
