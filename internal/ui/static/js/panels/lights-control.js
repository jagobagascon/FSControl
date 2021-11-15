// lights-control component
Vue.component('lights-control', {
    props: [
        "values"
    ],
    data: function() {
        return {
            //writes
            evTaxiLightsSet: "TAXI_LIGHTS_SET",
            evLandingLightsSet: "LANDING_LIGHTS_SET",
            
            evNavLightsSet: "NAV_LIGHTS_SET",
            evStrobeLightsSet: "STROBES_SET",
        }
    },
    computed: {
        // reads
        taxiLightEnabled: function() { return this.values["LightTaxi"] == true },
        landingLightEnabled: function() { return this.values["LightLanding"] == true },
        navLightEnabled: function() { return this.values["LightNav"] == true },
        strobeLightEnabled: function() { return this.values["LightStrobe"] == true },
        
        lightStatus: function() {
            return this.landingLightEnabled ? 1 : this.taxiLightEnabled ? 0.5 : 0;
        },
        containerStyle: function() {
            return {
                "width": "100%",
                "height": "100%",
                "display": "grid",
                "grid-template-columns": "30% auto",
                "grid-gap": "0.5em",
                "padding": "10px",
            }
        },
        taxiLdgContainerStyle: function() {
            return {
                "width": "100%",
                "height": "100%",
                "display": "grid",
                "grid-template-columns": "repeat(2, 1fr)",
                "grid-template-rows": "20% auto",
                "grid-gap": "0.5em",
            }
        },
        otherLightsContainerStyle: function() {
            return {
                "width": "100%",
                "height": "100%",
                "display": "grid",
                "grid-template-columns": "repeat(5, 1fr)",
                "grid-template-rows": "50% 50%",
                "grid-gap": "0.5em",
            }
        },
    },
    methods: {
        onLightsChanged: function(newVal) {
            if (newVal == 0) {
                this.$emit('value-changed', this.evTaxiLightsSet, 0, true);
                this.$emit('value-changed', this.evLandingLightsSet, 0, true);
            } else if (newVal == 0.5) {
                this.$emit('value-changed', this.evLandingLightsSet, 0, true);
                this.$emit('value-changed', this.evTaxiLightsSet, 1, true);
            } else {
                this.$emit('value-changed', this.evTaxiLightsSet, 0, true);
                this.$emit('value-changed', this.evLandingLightsSet, 1, true);
            }
        }
    },
    template: `
        <div v-bind:style="containerStyle">
            <div v-bind:style="taxiLdgContainerStyle">
                <div class="panel-title">Lights</div>
                <div></div>
                <fs-lever
                    v-bind:positions="2"
                    v-bind:positionPercent="lightStatus"
                    v-on:change="onLightsChanged">
                </fs-lever>
                <ul class="flaps-indicators">
                    <li>
                        LDG
                    </li>
                    <li>
                        TAXI
                    </li>
                    <li>
                        OFF
                    </li>
                </ul>
            </div>
            <div v-bind:style="otherLightsContainerStyle">
                <fs-button
                    v-bind:active="navLightEnabled"
                    v-on:click="(v) => $emit('value-changed', evNavLightsSet, navLightEnabled ? 0 : 1, true)">
                    NAV
                </fs-button>
                <fs-button
                    v-bind:active="strobeLightEnabled"
                    v-on:click="(v) => $emit('value-changed', evStrobeLightsSet, strobeLightEnabled ? 0 : 1, true)">
                    STROBE
                </fs-button>
            </div>
        </div>
    `
})