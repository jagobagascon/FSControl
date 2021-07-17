// fs-knob component
Vue.component('fs-knob', {
    props: [
        "active",
        "value",
        "target",
        "step"
    ],
    data: function() {
        return {
            angle: 0,
            accumulated: 0,
            lastTouchX: 0,
            lastTouchY: 0,
        }
    },
    computed: {
        knobContainerStyle: function() {
            return {
                "width": "100%",
                "height": "100%",
                "position": "relative",
            }
        },
        knobStyle: function() {
            return {
                "width": "100%",
                "padding-top": "100%",
                "border-radius": "100%",
                "bottom": "0",
                "position": "absolute",
            }
        },
        indicatorContainerStyle: function() {
            return {
                "position": "absolute",
                "left": "0",
                "right": "0",
                "top": "0",
                "bottom": "10%",
                "transform": "rotate(" + (this.angle/10) + "deg)",
            }
        },
        indicatorStyle: function() {
            return {
                "background": this.active ? "var(--indicator-color)" : "var(--indicator-color-inactive)",
                "width": ".5rem",
                "height": ".5rem",
                "position": "absolute",
                "border-radius": "100%",
                "left": "50%",
                "margin-left": "-0.25rem",
                "top": "5%",
            }
        }
    },
    methods: {
        onTouch: function(e) {
            let touch = e.touches[0] || e.changedTouches[0];
            this.lastTouchX = touch.pageX;
            this.lastTouchY = touch.pageY;
        },
        onScroll: function(e) {
            e.preventDefault()
            let am = 0;
            
            if (e.deltaX !== undefined) {
                am = -(e.deltaX + e.deltaY);
            } else {
                let touch = e.touches[0] || e.changedTouches[0];
                let x = touch.pageX - this.lastTouchX;
                let y = this.lastTouchY - touch.pageY;
                this.lastTouchX = touch.pageX;
                this.lastTouchY = touch.pageY;
                am = (x + y) * 5;
            }

            this.angle += am
            this.accumulated += am
            if (Math.abs(this.accumulated) >= this.step) {
                let rem = this.accumulated % this.step
                this.$emit("change", this.accumulated - rem)
                this.accumulated = rem
            }
        }      
    },
    template: `
        <div v-bind:style="knobContainerStyle"
                v-bind:class="{active: active}">
                <div class="knob-display">
                    <transition name="fade">
                        <span v-if="target != value">
                            {{ target }} -> 
                        </span>
                    </transition>
                    {{ value }}
                </div>

                <div class="knob"
                    v-bind:style="knobStyle"
                    v-on:wheel="onScroll"
                    v-on:touchstart="onTouch"
                    v-on:touchmove="onScroll">
                <div class="indicator-container" v-bind:style="indicatorContainerStyle">
                    <div class="indicator" v-bind:style="indicatorStyle"></div>
                </div>
            </div>
        </div>
    `
})