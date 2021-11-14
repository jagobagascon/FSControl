// fs-lever component
Vue.component('fs-lever', {
    props: [
        "positionPercent",
        "positions",
        "indicatorValues",
    ],
    data: function() {
        return {
            targetPercent: this.positionPercent,
            angle: 0,
            accumulated: 0,
            lastTouchY: 0,
            dragging: false,
            touchHeight: 0,
        }
    },
    mounted: function() {
        this.updateLeverIndicator();
        
        this.touchHeight = this.$el.clientHeight;

        // setup click events. With touch devices we can move the finger anywhere in the screen,
        // while with the mouse we can only change the lever while keeping the mouse inside the indicator
        document.addEventListener("mouseup", this.onTouchEnd);
        document.addEventListener("mousemove", this.onTouchMove);
        // keep "mousedown" in the indicator so that we only "grab" it
        // when clicking inside the indicator
    },
    watch: {
        positionPercent: function(newPercent, oldPercent) {
            if (oldPercent == this.targetPercent) {
                this.targetPercent = newPercent;
            }
            this.updateLeverIndicator();
        },
    },
    methods: {
        updateLeverIndicator: function(e) {
            let maxAngle = 15;
            let indicator = this.$el.querySelector('.lever-current-indicator')
            indicator.style.setProperty("--position-angle", (maxAngle - this.targetPercent * (2*maxAngle)) + "deg");
        },
        onTouchStart: function(e) {
            e.preventDefault()

            let pageY = 0
            if (e.pageY !== undefined) {
                pageY = e.pageY;
            } else {
                let touch = e.touches[0] || e.changedTouches[0];
                pageY = touch.pageY;
            }

            this.lastTouchY = pageY;
            this.dragging = true;

        },
        onTouchMove: function(e) {
            if (!this.dragging) {
                return;
            }
            
            e.preventDefault()

            let pageY = 0
            if (e.pageY !== undefined) {
                pageY = e.pageY;
            } else {
                let touch = e.touches[0] || e.changedTouches[0];
                pageY = touch.pageY;
            }

            let y = this.lastTouchY - pageY;
            this.lastTouchY = pageY;

            let delta = -y / this.touchHeight;
            this.targetPercent = this.targetPercent + delta;
            this.targetPercent = Math.max(this.targetPercent, 0);
            this.targetPercent = Math.min(this.targetPercent, 1);

            this.updateLeverIndicator();
        },
        onTouchEnd: function(e) {
            e.preventDefault()

            // move target percent to closest available position
            let stepSize = 1 / this.positions;
            let closestPercent = 0;
            let closestPercentDist = 2; // max should be 1 so this is fine
            for (let i = 0; i <= this.positions; i++) {
                let currentPercent = i*stepSize;
                let currentDist = Math.abs(this.targetPercent - currentPercent);
                if (closestPercentDist > currentDist) {
                    closestPercentDist = currentDist;
                    closestPercent = currentPercent;
                }
            }

            this.targetPercent = closestPercent;
            this.updateLeverIndicator();

            // trigger update
            this.emitChange();

            this.dragging = false;
        },
        emitChange: function() {
            clearTimeout(this.debounceChange)
            this.debounceChange = setTimeout(() => {
                this.$emit("change", this.targetPercent)
            }, 200)
        },
    },
    template: `
        <div class="lever-canal">
            <div class="lever-canal-bg"></div>
            <div class="lever-current-indicator"
                v-on:touchstart="onTouchStart"
                v-on:touchend="onTouchEnd"
                v-on:touchmove="onTouchMove"
                v-on:mousedown="onTouchStart">
            </div>
        </div>
    `
})