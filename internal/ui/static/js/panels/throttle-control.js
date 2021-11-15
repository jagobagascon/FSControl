// throttle-control component
Vue.component('throttle-control', {
    props: [
        "values"
    ],
    data: function() {
        return {
            //writes
        }
    },
    computed: {
        // reads
        leverPos1: function() { 
            return this.values["LeverPos1"]
        },
        leverPos2: function() { 
            return this.values["LeverPos2"]
        },

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
            <div class="throttle-canal-container">
                <div class="panel-title">Eng 1</div>
                <div></div>
                <div class="panel-title">Eng 2</div>
                <div></div>
                <fs-lever 
                    v-bind:positions="100"
                    v-bind:positionPercent="leverPos1"
                    v-on:change="(newVal, oldVal) => $emit('value-changed', 'THROTTLE1_SET', newVal * 16383, true)">
                </fs-lever>
                <div></div>
                <fs-lever 
                    v-bind:positions="100"
                    v-bind:positionPercent="leverPos2"
                    v-on:change="(newVal, oldVal) => $emit('value-changed', 'THROTTLE2_SET', newVal * 16383, true)">
                </fs-lever>
                <ul class="throttle-indicators">
                    <li>
                    MAX
                    </li>
                    <li>
                    IDLE
                    </li>
                </ul>
            </div>
        </div>
    `
})