// auto-pilot component
Vue.component('auto-pilot', {
    props: [
        "values"
    ],
    data: function() {
        return {
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

            evAutopilotNavOn: "AP_NAV1_HOLD_ON",
            evAutopilotNavOff: "AP_NAV1_HOLD_OFF",

            evAutopilotAprOn: "AP_APR_HOLD_ON",
            evAutopilotAprOff: "AP_APR_HOLD_OFF",
        }
    },
    computed: {
        // reads
        apEnabled: function() { return this.values["AutopilotMaster"] == true },
        
        ydEnabled: function() { return this.values["YawDamper"] == true },
        
        autopilotAltEnabled: function() { return this.values["AutopilotAlt"] == true },
        autopilotAltVar: function() { return this.values["AutopilotAltVar"]; },
        currentAlt: function() { return this.values["CurrentAlt"]; },
        
        autopilotVsEnabled: function() { return this.values["AutopilotVS"] == true },
        autopilotVSVar: function() { return this.values["AutopilotVSVar"]; },
        
        autopilotHdgEnabled: function() { return this.values["AutopilotHdg"] == true },
        autopilotHdgVar: function() { return this.values["AutopilotHdgVar"]; },
        
        autopilotNavEnabled: function() { return this.values["AutopilotNav"] == true },

        autopilotAprEnabled: function() { return this.values["AutopilotApr"] == true },

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
        altChanged: function(newVal) {
            this.$emit('value-changed', this.evAutopilotAltSet, newVal)
        },
        vsChanged: function(newVal) {
            this.$emit('value-changed', this.evAutopilotVSSet, newVal)
        },
        hdgChanged: function(newVal) {
            this.$emit('value-changed', this.evAutopilotHdgSet, newVal)
        },
        altPressed: function() {
            this.$emit('value-changed', this.autopilotAltEnabled ? this.evAutopilotAltOff : this.evAutopilotAltOn, undefined, true)

            if (!this.autopilotAltEnabled) {
                // disable vs
                if (this.autopilotVsEnabled) {
                    this.vsPressed()                
                }

                // set to current height
                this.$emit('value-changed', this.evAutopilotAltSet, this.currentAlt, true)
            }
        },
        vsPressed: function() {
            if (this.autopilotVsEnabled) this.$emit('value-changed', this.evAutopilotVSSet, 0, true);
            this.$emit('value-changed', this.autopilotVsEnabled ? this.evAutopilotVSOff : this.evAutopilotVSOn, undefined, true);
        },
    },
    template: `
        <div v-bind:style="containerStyle">
            <fs-button
                    v-bind:active="autopilotHdgEnabled"
                    v-on:click="$emit('value-changed', autopilotHdgEnabled ? evAutopilotHdgOff : evAutopilotHdgOn, undefined, true)">
                HDG
            </fs-button>
            <fs-button
                    v-bind:active="autopilotNavEnabled"
                    v-on:click="$emit('value-changed', autopilotNavEnabled ? evAutopilotNavOff : evAutopilotNavOn, undefined, true)">
                NAV
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
                    v-bind:active="autopilotAltEnabled"
                    v-on:click="altPressed">
                ALT
            </fs-button>
            <div />
            <fs-button
                    v-bind:active="autopilotVsEnabled"
                    v-on:click="vsPressed">
                V/S
            </fs-button>
            <fs-knob 
                    v-on:change="hdgChanged"
                    v-bind:active="autopilotHdgEnabled"
                    v-bind:value="autopilotHdgVar"
                    v-bind:min="0"
                    v-bind:max="360"
                    v-bind:cycle="true"
                    v-bind:step="1">
            </fs-knob>
            <div />
            <fs-button
                v-bind:active="autopilotAprEnabled"
                v-on:click="$emit('value-changed', autopilotAprEnabled ? evAutopilotAprOff : evAutopilotAprOn, undefined, true)">
                APR
            </fs-button>
            <div />
            <fs-knob 
                    v-on:change="altChanged"
                    v-bind:active="autopilotAltEnabled"
                    v-bind:value="autopilotAltVar"
                    v-bind:min="0"
                    v-bind:step="100">
            </fs-knob>
            <div />
            <fs-knob 
                    v-on:change="vsChanged"
                    v-bind:active="autopilotVsEnabled"
                    v-bind:value="autopilotVsEnabled ? autopilotVSVar : 0"
                    v-bind:step="100">
            </fs-knob>
        </div>
    `
})