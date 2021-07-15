// auto-pilot component
Vue.component('auto-pilot', {
    props: [
        "values"
    ],
    data: function() {
        return {
            indexAutopilotMaster: indexAutopilotMaster,
            indexYawDamper: indexYawDamper,
        }
    },
    computed: {
        apEnabled: function() { return this.values[this.indexAutopilotMaster] == true },
        ydEnabled: function() { return this.values[this.indexYawDamper] == true },
        containerStyle: function() {
            return {
                "width": "100%",
                "height": "100%",
                "display": "flex",
                "justify-content": "center",
                "align-items": "center",
            }
        },
        buttonStyle: function() {
            return {
                "display": "inline-block",
                "height": "40%",
                "width": "30%",
                "font-weight": "bold",
                "font-size": "1.1rem",
            }
        },
    },
    template: `
        <div v-bind:style="containerStyle">
            <button v-bind:class="{active: apEnabled}" 
                    v-bind:style="buttonStyle"
                    v-on:click="$emit('value-changed', indexAutopilotMaster, !apEnabled)">
                A/P
            </button>
            <button v-bind:class="{active: ydEnabled}" 
                    v-bind:style="buttonStyle"
                    v-on:click="$emit('value-changed', indexYawDamper, !ydEnabled)">
                YD
            </button>
        </div>
    `
})