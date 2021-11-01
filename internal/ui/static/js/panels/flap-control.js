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
            let indicator = this.$el.querySelector('.flaps-current-indicator')
            indicator.style.marginTop = this.flapIndicatorY(this.flapsPercent) + "px";
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

        leverPos1: function() { return this.values["LeverPos1"] },
        leverPos2: function() { return this.values["LeverPos2"] },

        // css
        containerStyle: function() {
            return {
                "width": "100%",
                "height": "100%",
                "padding": "10px",
            }
        },
        flapCanalContainerStyle: function() {
            return {
                "height": "100%",
                "width": "10%",
                "min-width": "6em",
                "position": "relative",
            }
        },
        flapCanalStyle: function() {
            return {
                "height": "100%",
                "width": "30%",
                "background": "var(--background-color-dark)",
                "border-radius": "1em",
            }
        },
        flapCurrentStyle: function() {
            return {
                "height": "5%",
                "width": "100%",
                "min-width": "2em",
                "background": "#555",
                "border-radius": "3px",
                "position": "absolute",
                "transition": "all 500ms",
            }
        },
        flapNumbers: function() {
            return {
                "position": "absolute",
                "right": "0",
                "top": "0",
                "bottom": "0",
                "width": "70%",
                "text-align": "right",
                "list-style": "none",
                "display": "grid",
                "align-content": "space-between",
                "font-size": "1.2rem",
            }
        },
    },
    template: `
        <div v-bind:style="containerStyle">
            <div class="flaps-canal-container" v-bind:style="flapCanalContainerStyle">
                <div v-bind:style="flapCanalStyle">
                    <div class="flaps-current-indicator" v-bind:style="flapCurrentStyle">
                    </div>
                </div>
                <ul v-bind:style="flapNumbers">
                    <li v-for="p in (flapsPositions + 1)">
                    {{Math.round((p - 1) / flapsPositions * 100)}} %
                    </li>
                </ul>
            </div>

            <div style="position: absolute; top: 1em; left: 50%;">
                1: {{ leverPos1 }}
                <br />
                2: {{ leverPos2 }}
            </div>
        </div>
    `
})