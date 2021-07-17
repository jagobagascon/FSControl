
var app = new Vue({
    el: '#app',
    data: {
        "values": {/*
            "AutopilotAlt": false,
            "AutopilotAltVar": 4700,
            "AutopilotAvailable": true,
            "AutopilotMaster": false,
            "Alt": 800.12,
            "FlapsAvail": true,
            "FlapsCurrent": 1,
            "FlapsPercent": 0.5,
            "FlapsPositions": 2,
            "LeverPos1": 0,
            "LeverPos2": 0,
            "YawDamper": false,*/
        }
    },
    methods: {
        onValueChanged: function(index, newValue, strict) {
            console.info("Value of index " + index + " changed to " + newValue + (strict ? "(strict)" : ""))
            // send the value to the server
            postValueChanged(index, newValue, strict)
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
        if (Number.isNaN(value)) {
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