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

            keyAutopilotAlt: "AutopilotAlt",
            keyAutopilotAltVar: "AutopilotAltVar",
            //writes
            keyAutopilotOn: "AUTOPILOT_ON",
            keyAutopilotOff: "AUTOPILOT_OFF",
            keyYawDamperSet: "YAW_DAMPER_SET",
            targetAltVal: null,
    },
    watch: {
        'values.AutopilotAltVar': function(newVal, oldVal) {
            // reset target values
            console.info(newVal, oldVal)
            this.targetAltVal = this.values[this.keyAutopilotAltVar];
        },
        }
    },
    computed: {
        apEnabled: function() { return this.values[this.keyAutopilotMaster] == true },
        ydEnabled: function() { return this.values[this.keyYawDamper] == true },
        altEnabled: function() { return this.values[this.keyAutopilotAlt] == true },
        targetAlt: function() {
            if (this.targetAltVal == null) {
                this.targetAltVal = this.values[this.keyAutopilotAltVar];
             }
             
             return this.targetAltVal;
        },
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
    },
    methods: {
        altChanged: function(delta) {
            // debounce the event to not send so too many of them
            clearTimeout(this.debounceChange)
            this.targetAltVal += delta;
            this.debounceChange = setTimeout(() => {
                this.$emit('value-changed', this.keyAutopilotAltSet, this.targetAltVal)
            }, 100)
        },
            }
        },
    },
    template: `
        <div v-bind:style="containerStyle">
            <fs-button
                    v-bind:active="apEnabled"
                    v-on:click="$emit('value-changed', apEnabled ? keyAutopilotOff : keyAutopilotOn)">
                A/P
            </fs-button>
            <fs-button 
                    v-bind:active="ydEnabled"
                    v-on:click="$emit('value-changed', keyYawDamperSet, ydEnabled ? 0 : 1)">
                YD
            </fs-button>
            <fs-button
                    v-bind:active="altEnabled"
                    v-on:click="$emit('value-changed', altEnabled ? keyAutopilotAltOff : keyAutopilotAltOn)">
                ALT
            </fs-button>
            <div />
            <div />
            <div />
            <fs-knob 
                    v-on:change="altChanged"
                    v-bind:active="altEnabled"
                    v-bind:value="values[keyAutopilotAltVar]"
                    v-bind:target="targetAlt"
                    v-bind:step="100">
            </fs-knob>
        </div>
    `
})