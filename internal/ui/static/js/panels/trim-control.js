// trim-control component
Vue.component('trim-control', {
    props: [
        "values"
    ],
    data: function() {
        return {
            //writes
            targetTrimPct: 0,
            evTrimSet: "AXIS_ELEV_TRIM_SET",
            maxDegrees: 75,
        }
    },
    watch: {
        'values.ElevatorTrimPct': function(newVal, oldVal) {
            if (oldVal == null || oldVal.toFixed(2) == this.targetTrimPct.toFixed(2)) {
                this.targetTrimPct = newVal;
            }
        }
    },
    mounted: function() {
        this.targetTrimPct = this.elevatorTrimPct;
    },
    computed: {
        // reads
        leverPos1: function() { return this.values["LeverPos1"] },
        leverPos2: function() { return this.values["LeverPos2"] },
        elevatorTrimPct: function() { return this.values["ElevatorTrimPct"] },
        elevatorTrimNeutral: function() { return this.values["ElevatorTrimNeutral"] },
        elevatorTrimPosition: function() { return this.values["ElevatorTrimPosition"] },
        elevatorTrimPositionDeg: function() { return this.elevatorTrimPosition * 180 / Math.PI },

        wheelStyle: function() {
            return {
                transform: "rotateX(" + (-this.maxDegrees * this.targetTrimPct) + "deg)",
            };
        },
    },
    methods: {
        mouseDown: function(e) {
            this.lastScreenY = e.screenY;
            this.isMouseDown = true;
        },
        mouseUp: function(e) {
            this.isMouseDown = false;
        },
        mouseMove: function(e) {
            if (!this.isMouseDown) return;

            let delta = this.lastScreenY - e.screenY;
            this.lastScreenY = e.screenY;

            let step = 0.01;

            delta = delta * step / 10;
            if (this.updateTarget(delta)) {
                this.emitChange()
            }

        },
        onTouch: function(e) {
            let touch = e.touches[0] || e.changedTouches[0];
            this.lastTouchY = touch.pageY;
        },
        onScroll: function(e) {
            e.preventDefault()
            let visualAm = 0;
            
            if (e.deltaX !== undefined) {
                visualAm = -(e.deltaX + e.deltaY);
            } else {
                let touch = e.touches[0] || e.changedTouches[0];
                let y = this.lastTouchY - touch.pageY;
                this.lastTouchY = touch.pageY;
                // make touch more responsive
                visualAm = y * 50;
            }

            let step = 0.01;

            // normalize am with the step
            let delta = visualAm * step / 100;
            if (this.updateTarget(delta)) {
                this.emitChange()
            }
        },
        updateTarget: function(delta) {
            let newTarget = this.targetTrimPct - delta;
            newTarget = Math.min(newTarget, 1);
            newTarget = Math.max(newTarget, -1);

            if (this.targetTrimPct != newTarget) {
                this.targetTrimPct = newTarget;
                return true;
            }

            return false;
        },
        emitChange: function() {
            clearTimeout(this.debounceChange)
            this.debounceChange = setTimeout(() => {
                this.$emit('value-changed', this.evTrimSet, -this.targetTrimPct * 16383, false);
            }, 20)
        },
    },
    template: `
        <div class="trim-container">
            <div class="trim-wheel-canal">
                <div class="trim-wheel-container">
                    <div class="trim-wheel" 
                            v-bind:style="wheelStyle"
                            v-on:wheel="onScroll"
                            v-on:touchstart="onTouch"
                            v-on:touchmove="onScroll"
                            v-on:mousedown="mouseDown"
                            v-on:mousemove="mouseMove"
                            v-on:mouseup="mouseUp">
                        <div class="trim-wheel-cell"
                            v-for="n in 36"></div>
                    </div>
                </div>
            </div>
            <div class="trim-wheel-degrees">
                {{elevatorTrimPositionDeg.toFixed(1)}} °
            </div>
        </div>
    `
})