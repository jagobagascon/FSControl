
var app = new Vue({
    el: '#app',
    data: {
        "values": {}
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
    Vue.set(app.values, d.Index, d.Value)
}


function postValueChanged(index, value) {
    var opts = {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: "index=" + index + "&value=" + value,
    };

    fetch('/value-change-request', opts).then(function (response) {
        // ignore
    })      
}