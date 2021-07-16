// auto-pilot component
Vue.component('auto-pilot', {
    props: [
        "values"
    ],
    data: function() {
        return {
            // reads
            keyAutopilotMaster: "AutopilotMaster",
            keyYawDamper: "YawDamper",
            //writes
            keyAutopilotOn: "AUTOPILOT_ON",
            keyAutopilotOff: "AUTOPILOT_OFF",
            keyYawDamperSet: "YAW_DAMPER_SET",
        }
    },
    computed: {
        apEnabled: function() { return this.values[this.keyAutopilotMaster] == true },
        ydEnabled: function() { return this.values[this.keyYawDamper] == true },
        containerStyle: function() {
            return {
                "width": "100%",
                "height": "100%",
                "display": "grid",
                "grid-auto-rows": "100px", // button size
                "grid-template-columns": "repeat(auto-fill, minmax(60px, 1fr))",
                "grid-gap": "0.5em",
                "padding": "10px",
            }
        },
        buttonStyle: function() {
            return {
                "display": "inline-block",
                "font-weight": "bold",
                "font-size": "1.1rem",
            }
        },
    },
    template: `
        <div v-bind:style="containerStyle">
            <button v-bind:class="{active: apEnabled}" 
                    v-bind:style="buttonStyle"
                    v-on:click="$emit('value-changed', apEnabled ? keyAutopilotOff : keyAutopilotOn)">
                A/P
                <div class="indicator"></div>
            </button>
            <button v-bind:class="{active: ydEnabled}" 
                    v-bind:style="buttonStyle"
                    v-on:click="$emit('value-changed', keyYawDamperSet, !ydEnabled)">
                YD
                <div class="indicator"></div>
            </button>
        </div>
    `
})