// fs-knob component
Vue.component('fs-knob', {
    props: [
        "active",
        "value",
        "step",
        "min",
        "max",
        "cycle",
    ],
    data: function() {
        return {
            targetValue: this.value,
            angle: 0,
            accumulated: 0,
            lastTouchX: 0,
            lastTouchY: 0,
        }
    },
    watch: {
        "value": function(newVal, oldVal) {
            if (oldVal == this.targetValue) {
                this.targetValue = newVal;
            }
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
        },
    },
    methods: {
        onTouch: function(e) {
            let touch = e.touches[0] || e.changedTouches[0];
            this.lastTouchX = touch.pageX;
            this.lastTouchY = touch.pageY;
        },
        onScroll: function(e) {
            e.preventDefault()
            let visualAm = 0;
            
            if (e.deltaX !== undefined) {
                visualAm = -(e.deltaX + e.deltaY);
            } else {
                let touch = e.touches[0] || e.changedTouches[0];
                let x = touch.pageX - this.lastTouchX;
                let y = this.lastTouchY - touch.pageY;
                this.lastTouchX = touch.pageX;
                this.lastTouchY = touch.pageY;
                visualAm = (x + y) * 5;
            }

            // normalize am with the step
            let normalizedAm = visualAm * this.step / 100;

            this.accumulated += normalizedAm
            if (Math.abs(this.accumulated) >= this.step) {
                let rem = this.accumulated % this.step;
                let delta = this.accumulated - rem;
                if (this.updateTarget(delta)) {
                    this.accumulated = rem;
                    this.emitChange()
                    // visual update
                    this.angle += visualAm
                } else {
                    this.accumulated -= normalizedAm;
                }
            }
        },
        updateTarget: function(delta) {
            let newTarget = this.targetValue + delta;
            if (this.cycle == true) {
                let min = this.min || 0;
                let max = this.max || 999999;
                let range = max - min;
                let valueInRange = newTarget - min;
                let modulus = ((valueInRange % range) + range) % range;
                newTarget = min + modulus;
            } else {
                if (this.max != null) {
                    newTarget = Math.min(newTarget, this.max);
                }

                if (this.min != null) {
                    newTarget = Math.max(newTarget, this.min);
                }
            }

            if (this.targetValue != newTarget) {
                this.targetValue = newTarget;
                return true;
            }

            return false;
        },
        emitChange: function() {
            clearTimeout(this.debounceChange)
            this.debounceChange = setTimeout(() => {
                this.$emit("change", this.targetValue)
            }, 200)
        },
    },
    template: `
        <div v-bind:style="knobContainerStyle"
                v-bind:class="{active: active}">
                <div class="knob-display" v-bind:class="{current: targetValue == value}">
                    {{ targetValue }}
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