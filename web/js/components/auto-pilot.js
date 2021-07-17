// auto-pilot component
Vue.component('auto-pilot', {
    props: [
        "values"
    ],
    data: function() {
        return {
            // autopilot
            // reads
            keyAutopilotMaster: "AutopilotMaster",

            keyYawDamper: "YawDamper",

            keyAutopilotAlt: "AutopilotAlt",
            keyAutopilotAltVar: "AutopilotAltVar",

            keyAutopilotVS: "AutopilotVS",
            keyAutopilotVSVar: "AutopilotVSVar",
            keyCurrentAlt: "CurrentAlt",

            keyAutopilotHdg: "AutopilotHdg",
            keyAutopilotHdgVar: "AutopilotHdgVar",

            //writes
            evAutopilotOn: "AUTOPILOT_ON",
            evAutopilotOff: "AUTOPILOT_OFF",

            evYawDamperSet: "YAW_DAMPER_SET",

            evAutopilotAltOn: "AP_PANEL_ALTITUDE_ON",
            evAutopilotAltOff: "AP_PANEL_ALTITUDE_OFF",
            evAutopilotAltSet: "AP_ALT_VAR_SET_ENGLISH",

            evAutopilotVSOn: "AP_PANEL_VS_ON",
            evAutopilotVSOff: "AP_PANEL_VS_OFF",
            evAutopilotVSSet: "AP_VS_VAR_SET_ENGLISH",
            
            evAutopilotHdgOn: "AP_HDG_HOLD_ON",
            evAutopilotHdgOff: "AP_HDG_HOLD_OFF",
            evAutopilotHdgSet: "HEADING_BUG_SET",

            // other
            targetAltVal: null,
            targetVSVal: null,
            targetHdgVal: null,
        }
    },
    computed: {
        apEnabled: function() { return this.values[this.keyAutopilotMaster] == true },
        ydEnabled: function() { return this.values[this.keyYawDamper] == true },
        altEnabled: function() { return this.values[this.keyAutopilotAlt] == true },
        vsEnabled: function() { return this.values[this.keyAutopilotVS] == true },
        hdgEnabled: function() { return this.values[this.keyAutopilotHdg] == true },
        targetAlt: function() {
            if (this.targetAltVal == null) {
                this.targetAltVal = this.values[this.keyAutopilotAltVar];
             }
             
             return this.targetAltVal;
        },
        targetVS: function() {
            if (this.targetVSVal == null) {
                this.targetVSVal = this.values[this.keyAutopilotVSVar];
             }
             
             return this.targetVSVal;
        },
        targetHdg: function() {
            if (this.targetHdgVal == null) {
                this.targetHdgVal = this.values[this.keyAutopilotHdgVar];
             }
             
             this.targetHdgVal = this.targetHdgVal % 360;
             return this.targetHdgVal;
        },
        containerStyle: function() {
            return {
                "width": "100%",
                "height": "100%",
                "display": "grid",
                "grid-template-columns": "repeat(7, 1fr)",
                "grid-template-rows": "repeat(2, 1fr)",
                "grid-gap": "0.5em",
                "padding": "10px",
            }
        },
    },
    methods: {
        altChanged: function(delta) {
            // debounce the event to not send so too many of them
            clearTimeout(this.debounceChangeAlt)
            this.targetAltVal += delta;
            this.debounceChangeAlt = setTimeout(() => {
                this.$emit('value-changed', this.evAutopilotAltSet, this.targetAlt)
            }, 200)
        },
        vsChanged: function(delta) {
            if (!this.vsEnabled) {
                return
            }
            // debounce the event to not send so too many of them
            clearTimeout(this.debounceChangeVS)
            this.targetVSVal += delta;
            this.debounceChangeVS = setTimeout(() => {
                this.$emit('value-changed', this.evAutopilotVSSet, this.targetVS)
            }, 200)
        },
        hdgChanged: function(delta) {
            if (!this.hdgEnabled) {
                return
            }
            // debounce the event to not send so too many of them
            clearTimeout(this.debounceChangeHdg)
            this.targetHdgVal += delta;
            this.debounceChangeHdg = setTimeout(() => {
                this.$emit('value-changed', this.evAutopilotHdgSet, this.targetHdg)
            }, 200)
        },
        altPressed: function() {
            this.$emit('value-changed', this.altEnabled ? this.evAutopilotAltOff : this.evAutopilotAltOn, undefined, true)

            if (!this.altEnabled) {
                // disable vs
                if (this.vsEnabled) {
                    this.vsPressed()                
                }

                // set to current height
                this.$emit('value-changed', this.evAutopilotAltSet, this.values[this.keyCurrentAlt], true)
            }
        },
        vsPressed: function() {
            if (this.vsEnabled) this.$emit('value-changed', this.evAutopilotVSSet, 0, true);
            this.$emit('value-changed', this.vsEnabled ? this.evAutopilotVSOff : this.evAutopilotVSOn, undefined, true);
        },
    },
    template: `
        <div v-bind:style="containerStyle">
            <fs-button
                    v-bind:active="hdgEnabled"
                    v-on:click="$emit('value-changed', hdgEnabled ? evAutopilotHdgOff : evAutopilotHdgOn, undefined, true)">
                HDG
            </fs-button>
            <fs-button
                    v-bind:active="apEnabled"
                    v-on:click="$emit('value-changed', apEnabled ? evAutopilotOff : evAutopilotOn, undefined, true)">
                A/P
            </fs-button>
            <fs-button 
                    v-bind:active="ydEnabled"
                    v-on:click="$emit('value-changed', evYawDamperSet, ydEnabled ? 0 : 1, true)">
                YD
            </fs-button>
            <fs-button
                    v-bind:active="altEnabled"
                    v-on:click="altPressed">
                ALT
            </fs-button>
            <div />
            <fs-button
                    v-bind:active="vsEnabled"
                    v-on:click="vsPressed">
                V/S
            </fs-button>
            <div />
            <fs-knob 
                    v-on:change="hdgChanged"
                    v-bind:active="hdgEnabled"
                    v-bind:value="values[keyAutopilotHdgVar]"
                    v-bind:target="targetHdg"
                    v-bind:step="1">
            </fs-knob>
            <div />
            <div />
            <fs-knob 
                    v-on:change="altChanged"
                    v-bind:active="altEnabled"
                    v-bind:value="values[keyAutopilotAltVar]"
                    v-bind:target="targetAlt"
                    v-bind:step="100">
            </fs-knob>
            <div />
            <fs-knob 
                    v-on:change="vsChanged"
                    v-bind:active="vsEnabled"
                    v-bind:value="vsEnabled ? values[keyAutopilotVSVar] : 0"
                    v-bind:target="vsEnabled ? targetVS : 0"
                    v-bind:step="100">
            </fs-knob>
        </div>
    `
})