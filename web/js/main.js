var app = new Vue({
    el: '#app',
    data: {
        components: [
            "c0",
            "c1",
            "c2",
            "c3",
            "c4",
            "c5",
            "c6",
            "c7",
            "c8",
            "c9",
            "c10",
            "c11",
            "c12",
            "c13",
            "c14",
            "c15",
            "c16",
            "c17",
            "c18",
            "c19",
        ],
    }
});

var evtSource = new EventSource("/subscribe");
evtSource.onmessage = function(e) {
    console.info(e)
}
  