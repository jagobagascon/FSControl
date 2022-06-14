package event

// ValueChangeRequest represents a request to update a value in the sim.
type ValueChangeRequest struct {
	// defining struct variables
	Name     string
	Value    int
	HasValue bool
	IsStrict bool
}
