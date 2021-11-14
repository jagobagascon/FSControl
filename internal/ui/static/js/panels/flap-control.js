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
                <fs-lever 
                    v-bind:positions="flapsPositions"
                    v-bind:positionPercent="flapsPercent"
                    v-bind:inverted="true"
                    v-on:change="(newVal, oldVal) => $emit('value-changed', 'FLAPS_SET', newVal * 16383, true)">
                </fs-lever>
                <ul class="flaps-indicators">
                    <li v-for="p in (flapsPositions + 1)">
                    {{Math.round(p - 1)}}
                    </li>
                </ul>
            </div>
        </div>
    `
})