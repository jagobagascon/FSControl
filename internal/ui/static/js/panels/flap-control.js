// flap-control component
Vue.component('flap-control', {
    props: [
        "values"
    ],
    data: function() {
        return {
            //writes
        }
    },
    mounted: function() {
        this.updateFlapsIndicator();
    },
    watch: {
        'values.FlapsPercent': function() {
            this.updateFlapsIndicator();
        }
    },
    methods: {
        updateFlapsIndicator: function() {
            let maxAngle = 15;
            let indicator = this.$el.querySelector('.flaps-current-indicator')
            indicator.style.setProperty("--position-angle", (maxAngle - this.flapsPercent * (2*maxAngle)) + "deg");
        },
        flapIndicatorY: function(percent) {
            if (!this.$el) return // not ready yet
            let indicator = this.$el.querySelector('.flaps-current-indicator');
            let flapsCanal = this.$el.querySelector('.flaps-canal-container');
            
            let containerHeight = flapsCanal.clientHeight;
            let indicatorHeight = indicator.clientHeight;
            let availHeight = containerHeight - indicatorHeight;
            return availHeight * percent;
        }
    },
    computed: {
        // reads
        flapsAvail: function() { return this.values["FlapsAvail"] == true },
        flapsCurrent: function() { return this.values["FlapsCurrent"] },
        flapsPercent: function() { return this.values["FlapsPercent"] },
        flapsPositions: function() { return this.values["FlapsPositions"] },

        // css
        containerStyle: function() {
            return {
                "width": "100%",
                "height": "100%",
                "padding": "10px",
            }
        },
    },
    template: `
        <div v-bind:style="containerStyle">
            <div class="flaps-canal-container">
                <div class="panel-title">FLAPS</div>
                <div class="flaps-canal">
                    <div class="flaps-canal-bg">
                    </div>
                    <div class="flaps-current-indicator">
                    </div>
                </div>
                <ul class="flaps-indicators">
                    <li v-for="p in (flapsPositions + 1)">
                    {{Math.round(p - 1)}}
                    </li>
                </ul>
            </div>
        </div>
    `
})