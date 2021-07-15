package simconnect

type SimData struct {
	AutopilotMaster bool `sim:"AUTOPILOT MASTER"`
	YawDamper       bool `sim:"AUTOPILOT YAW DAMPER"`
}

const AutopilotMaster = "AutopilotMaster"
const YawDamper = "YawDamper"
