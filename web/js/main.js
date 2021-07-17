
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
        onValueChanged: function(index, newValue) {
            console.info("Value of index " + index + " changed to " + newValue)
            // send the value to the server
            postValueChanged(index, newValue)
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
function postValueChanged(name, value) {
    var opts = {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: "name=" + name
    };
    if (value !== undefined) {
        opts.body += "&value=" + value
    }

    fetch('/value-change-request', opts).then(function (response) {
        // ignore
    })      
}