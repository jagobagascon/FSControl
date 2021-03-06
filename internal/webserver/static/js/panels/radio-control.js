// flap-control component
Vue.component('radio-control', {
    props: [
        "values",
        "maxcoms",
    ],
    data: function() {
        return {
            //writes
            evComSet: [
                "",
                "COM_STBY_RADIO_SET_HZ",
                "COM2_STBY_RADIO_SET_HZ",
                "COM3_STBY_RADIO_SET_HZ",
            ],
            evComSelect: [
                "",
                "COM1_TRANSMIT_SELECT",
                "COM2_TRANSMIT_SELECT",
                "COM3_TRANSMIT_SELECT",
            ]
        }
    },
    mounted: function() {
    },
    methods: {
        comChanged: function(which, mhz, hz) {
            console.info(which, mhz, hz);
            // change values in mhz
            // 126.700Mhz => 126700000
            // 119.000Mhz => 119000000
            this.$emit('value-changed', this.evComSet[which], mhz * 1000000 + hz * 1000, true);
        },
        printableMHz: function(n) {
            return String(n.mhz) + "." + String(n.hz).padStart(3, "0")
        },
    },
    computed: {
        // reads
        comCurrent: function() {
            return [
                false,
                this.values["ComCurrent1"],
                this.values["ComCurrent2"],
                this.values["ComCurrent3"],
            ]
        },
        comAvailable: function() {
            return [
                false,
                this.values["ComAvailable1"],
                this.values["ComAvailable2"],
                this.values["ComAvailable3"],
            ];
        },
        comActive: function() {
            let com1 = this.values["ComActiveFrequency1"];
            let com1MHz = Math.floor(com1 / 1_000_000) * 1_000_000
            let com1Hz = Math.floor( (com1 % com1MHz) / 1_000)

            let com2 = this.values["ComActiveFrequency2"];
            let com2MHz = Math.floor(com2 / 1_000_000) * 1_000_000
            let com2Hz = Math.floor( (com2 % com2MHz) / 1_000)

            let com3 = this.values["ComActiveFrequency3"];
            let com3MHz = Math.floor(com3 / 1_000_000) * 1_000_000
            let com3Hz = Math.floor( (com3 % com3MHz) / 1_000)
            return [
                false,
                {
                    mhz: com1MHz / 1_000_000,
                    hz: com1Hz,
                },
                {
                    mhz: com2MHz / 1_000_000,
                    hz: com2Hz,
                },
                {
                    mhz: com3MHz / 1_000_000,
                    hz: com3Hz,
                },
            ];
        },
        comStandBy: function() {
            let com1 = this.values["ComStandByFrequency1"];
            let com1MHz = Math.floor(com1 / 1_000_000) * 1_000_000
            let com1Hz = Math.floor( (com1 % com1MHz) / 1_000)

            let com2 = this.values["ComStandByFrequency2"];
            let com2MHz = Math.floor(com2 / 1_000_000) * 1_000_000
            let com2Hz = Math.floor( (com2 % com2MHz) / 1_000)

            let com3 = this.values["ComStandByFrequency3"];
            let com3MHz = Math.floor(com3 / 1_000_000) * 1_000_000
            let com3Hz = Math.floor( (com3 % com3MHz) / 1_000)
            return [
                false,
                {
                    mhz: com1MHz / 1_000_000,
                    hz: com1Hz,
                },
                {
                    mhz: com2MHz / 1_000_000,
                    hz: com2Hz,
                },
                {
                    mhz: com3MHz / 1_000_000,
                    hz: com3Hz,
                },
            ];
        },

        commsAmmount: function() {
            let am = 0;
            let comms = this.maxcoms;

            for (let i = 0; i < comms; i++) {
                if (this.comAvailable[i + 1] === true) {
                    am++;
                }
            }
            return am;
        },

        // css
        containerStyle: function() {
            return {
                "width": "100%",
                "height": "100%",
            }
        },
        comPanelStyle: function() {
            return {
                "width": (100 / this.commsAmmount) + "%",
            }
        },
    },
    template: `
        <div v-bind:style="containerStyle">
            <template v-for="n in commsAmmount">
                <div v-if="comAvailable[n]"
                    class="com-panel"
                    v-bind:class="{ current: comCurrent[n] }"
                    v-bind:style="comPanelStyle">
                    
                    <div class="com-name" 
                        v-on:click="comCurrent[n] ? null : $emit('value-changed', evComSelect[n], n, true)">
                        COM {{n}}
                    </div>

                    <div class="com-value-container">
                        <div class="com-value com-active">
                            {{ printableMHz(comActive[n]) }} MHz
                        </div>

                        <div class="com-value com-stand-by">
                            {{ printableMHz(comStandBy[n]) }} MHz
                        </div>
                    </div>

                    <div class="com-controls">
                        <fs-knob 
                            v-on:change="(newVal, oldVal) => $emit('value-changed', evComSet[n], newVal * 1000000 + comStandBy[n].hz * 1000, true)"
                            v-bind:active="true"
                            v-bind:value="comStandBy[n].mhz"
                            v-bind:min="118"
                            v-bind:max="137"
                            v-bind:cycle="true"
                            v-bind:step="1">
                        </fs-knob>
                        <fs-knob 
                            v-on:change="(newVal, oldVal) => $emit('value-changed', evComSet[n], comStandBy[n].mhz * 1000000 + newVal * 1000, true)"
                            v-bind:active="true"
                            v-bind:value="comStandBy[n].hz"
                            v-bind:min="0"
                            v-bind:max="1000"
                            v-bind:cycle="true"
                            v-bind:step="5">
                        </fs-knob>
                        <fs-button
                            v-bind:isToggle="false"
                            v-bind:active="false"
                                v-on:click="
                                $emit('value-changed', 'COM_RADIO', undefined, true);
                                $emit('value-changed', 'SELECT_' + n, undefined, true);
                                $emit('value-changed', 'FREQUENCY_SWAP', undefined, true)">
                            <span class="material-icons">
                                import_export
                            </span>
                        </fs-button>
                    </div>
                </div>
            </template>
        </div>
    `
})