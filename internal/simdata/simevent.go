package simdata

import (
	sim "github.com/grumpypixel/msfs2020-simconnect-go/simconnect"
)

// SimEvent Use for generate action in the simulator
type SimEvent struct {
	Mapping KeySimEvent
	Value   sim.DWord
	run     func(simEvent SimEvent)
	cb      <-chan sim.DWord
	eventID sim.DWord
}

// Run return chan bool when receive the event is finish
func (s SimEvent) Run() <-chan sim.DWord {
	s.run(s)
	return s.cb
}

// RunWithValue return chan bool when receive the event is finish
func (s SimEvent) RunWithValue(value int) <-chan sim.DWord {
	s.Value = sim.DWord(value)
	return s.Run()
}
