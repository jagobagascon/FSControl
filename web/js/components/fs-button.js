// fs-button component
Vue.component('fs-button', {
    props: [
        "active",

    ],
    computed: {
        inputListeners: function () {
            var vm = this
            // `Object.assign` merges objects together to form a new object
            return Object.assign({},
                // We add all the listeners from the parent
                this.$listeners,
                // Then we can add custom listeners or override the
                // behavior of some listeners.
                {
                    // This ensures that the component works with v-model
                    input: function (event) {
                        vm.$emit('input', event.target.value)
                    }
                }
            )
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
        <button class="panel-button"
                v-bind:class="{active: active}" 
                v-bind:style="buttonStyle"
                v-on="inputListeners">
            <slot></slot>
            <div class="indicator"></div>
        </button>
    `
})