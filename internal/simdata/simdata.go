package simdata

import (
	"reflect"

	sim "github.com/grumpypixel/msfs2020-simconnect-go/simconnect"
)

type SimData struct {
	// Autopilot
	AutopilotAvailable bool `sim:"AUTOPILOT AVAILABLE" `
	AutopilotMaster    bool `sim:"AUTOPILOT MASTER"`
	YawDamper          bool `sim:"AUTOPILOT YAW DAMPER"`

	AutopilotAlt    bool    `sim:"AUTOPILOT ALTITUDE LOCK"`
	AutopilotAltVar float64 `sim:"AUTOPILOT ALTITUDE LOCK VAR" simUnit:"Feet"`
	CurrentAlt      float64 `sim:"INDICATED ALTITUDE" simUnit:"Feet"`

	AutopilotVS    bool    `sim:"AUTOPILOT VERTICAL HOLD"`
	AutopilotVSVar float64 `sim:"AUTOPILOT VERTICAL HOLD VAR" simUnit:"Feet/minute"`

	AutopilotHdg    bool    `sim:"AUTOPILOT HEADING LOCK"`
	AutopilotHdgVar float64 `sim:"AUTOPILOT HEADING LOCK DIR" simUnit:"Degrees"`

	AutopilotNav bool `sim:"AUTOPILOT NAV1 LOCK"`

	AutopilotApr bool `sim:"AUTOPILOT APPROACH HOLD"`

	LeverPos1 float64 `sim:"GENERAL ENG THROTTLE LEVER POSITION:1"`
	LeverPos2 float64 `sim:"GENERAL ENG THROTTLE LEVER POSITION:2"`

	// COM

	ComAvailable1        bool  `sim:"COM AVAILABLE:1"`
	ComActiveFrequency1  int32 `sim:"COM ACTIVE FREQUENCY:1" simUnit:"Hz"`
	ComStandByFrequency1 int32 `sim:"COM STANDBY FREQUENCY:1" simUnit:"Hz"`
	ComCurrent1          bool  `sim:"COM TRANSMIT:1"`

	ComAvailable2        bool  `sim:"COM AVAILABLE:2"`
	ComActiveFrequency2  int32 `sim:"COM ACTIVE FREQUENCY:2" simUnit:"Hz"`
	ComStandByFrequency2 int32 `sim:"COM STANDBY FREQUENCY:2" simUnit:"Hz"`
	ComCurrent2          bool  `sim:"COM TRANSMIT:2"`

	ComAvailable3        bool  `sim:"COM AVAILABLE:3"`
	ComActiveFrequency3  int32 `sim:"COM ACTIVE FREQUENCY:3" simUnit:"Hz"`
	ComStandByFrequency3 int32 `sim:"COM STANDBY FREQUENCY:3" simUnit:"Hz"`
	ComCurrent3          bool  `sim:"COM TRANSMIT:3"`

	// Flaps
	FlapsAvail     bool    `sim:"FLAPS AVAILABLE"`
	FlapsCurrent   int32   `sim:"FLAPS HANDLE INDEX"`
	FlapsPositions int32   `sim:"FLAPS NUM HANDLE POSITIONS"`
	FlapsPercent   float64 `sim:"FLAPS HANDLE PERCENT"`
}

func (sd *SimData) Put(name string, value interface{}) {
	rt := reflect.TypeOf(*sd)
	for i := 0; i < rt.NumField(); i++ {
		f := rt.Field(i)

		tag := f.Tag.Get("sim")
		if tag != name {
			continue
		}

		ps := reflect.ValueOf(sd)
		s := ps.Elem()
		rv := s.FieldByName(f.Name)
		if !rv.IsValid() {
			continue
		}

		// A Value can be changed only if it is
		// addressable and was not obtained by
		// the use of unexported struct fields.
		if !rv.CanSet() {
			continue
		}

		//log.Printf("Raw value %v (%v)\n", value, reflect.TypeOf(value))
		switch rv.Kind() {
		case reflect.Bool:
			v := valueAsBool(value)
			//log.Printf("%s (%v) = %v \n", name, rv.Kind(), v)
			rv.SetBool(v)
		case reflect.Float64:
			v := valueAsFloat(value)
			//log.Printf("%s (%v) = %v \n", name, rv.Kind(), v)
			rv.SetFloat(v)
		case reflect.Int32:
			v := valueAsInt(value)
			//log.Printf("%s (%v) = %v \n", name, rv.Kind(), v)
			rv.SetInt(v)
		}
	}
}

func valueAsBool(value interface{}) bool {
	k := reflect.ValueOf(value).Kind()
	if k == reflect.Float64 {
		return value.(float64) > 0
	} else if k == reflect.Int32 {
		return value.(int32) > 0
	}

	return false
}

func valueAsFloat(value interface{}) float64 {
	k := reflect.ValueOf(value).Kind()
	if k == reflect.Float64 {
		return value.(float64)
	} else if k == reflect.Int32 {
		return float64(value.(int32))
	}

	return 0
}

func valueAsInt(value interface{}) int64 {
	k := reflect.ValueOf(value).Kind()
	if k == reflect.Int32 {
		return int64(value.(int32))
	} else if k == reflect.Float64 {
		return int64(value.(float64))
	}

	return 0
}

func inferFromSimDataField(f reflect.StructField) sim.DWord {
	switch f.Type.Name() {
	case "int", "int32":
		return sim.DataTypeInt32
	case "int64":
		return sim.DataTypeInt64
	case "float32":
		return sim.DataTypeFloat32
	case "float64", "bool":
		return sim.DataTypeFloat64
	case "string":
		return sim.DataTypeString260
	default:
		return sim.DataTypeInvalid
	}
}

// get variables from SimData struct
func GetVarsFromSimData() []Request {
	rt := reflect.TypeOf(SimData{})

	requests := []Request{}
	for i := 0; i < rt.NumField(); i++ {
		f := rt.Field(i)
		tag := f.Tag.Get("sim")
		if tag == "" {
			// ignore empty tags
			continue
		}

		unit := f.Tag.Get("simUnit")

		typeName := f.Tag.Get("simType")
		var simType sim.DWord
		if typeName == "" {
			simType = inferFromSimDataField(f)
		} else {
			simType = sim.StringToDataType(typeName)
		}

		r := Request{tag, unit, simType}
		requests = append(requests, r)
	}
	return requests
}
