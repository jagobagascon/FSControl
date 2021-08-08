
var app = new Vue({
    el: '#app',
    data: {
        "values": {/*
            AutopilotAvailable: true,
            AutopilotMaster: false,
            YawDamper: false,
            AutopilotAlt: false,
            AutopilotAltVar: 0,
            CurrentAlt: 0,
            AutopilotVS: false,
            AutopilotVSVar: 0,
            AutopilotHdg: false,
            AutopilotHdgVar: 0,
            LeverPos1: 0,
            LeverPos2: 0,
            FlapsAvail: false,
            FlapsCurrent: 0,
            FlapsPositions: 4,
            FlapsPercent: 0,
            ElevatorTrimPct: 0.1,
            ElevatorTrimNeutral: 0.03,
            ElevatorTrimPosition: 0.12,
        */}
    },
    methods: {
        onValueChanged: function(index, newValue, strict, typeHint) {
            console.info("Value of index " + index + " changed to " + newValue + (strict ? "(strict)" : ""))
            // send the value to the server
            postValueChanged(index, newValue, strict, typeHint)
        },
        onFullScreenPressed: function() {
            if (this.$el.requestFullscreen) {
                this.$el.requestFullscreen();
            }
        }
    },
    computed: {
        commsAmmount: function() {
            let am = 0;
            let comms = 2;

            for (let i = 0; i < comms; i++) {
                if (this.values["ComAvailable" + (i + 1)] === true) {
                    am++;
                }
            }
            return am;
        }
    }
});

var evtSource = new EventSource("/subscribe");
evtSource.onmessage = function(e) {
    let d = JSON.parse(e.data)
    // set value using vue to update the UI
    app.values = d
}


// value might be empty
// strict flag represents how important is this value
//       true -> this is a button press and wont be sent again
//       false -> this is a value from a knob or other input that sends a lot of values
function postValueChanged(name, value, strict) {
    var opts = {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: "name=" + name + "&strict=" + (strict == true)
    };

    if (value !== undefined) {
        if (typeof(value) !== "number") {
            opts.body += "&value=" + value;
        } else {
            // send numeric values as integer
            opts.body += "&value=" + Math.floor( value );
        }
    }

    fetch('/value-change-request', opts).then(function (response) {
        // ignore
    })      
}