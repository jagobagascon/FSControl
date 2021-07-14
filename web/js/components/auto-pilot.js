// auto-pilot component
Vue.component('auto-pilot', {
    props: [
        "autopilot"
    ],
    template: `
        <li v-on:click="$emit('resize')">
            is autopilot enabled? {{autopilot?.enabled == true}}
        </li>
    `
})