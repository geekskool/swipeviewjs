A library for smooth touch-based content sliders. Built on principles of Functional Reactive Programming.

**Example**

See the sample app under `/example`

    cd example && npm start

**Usage**

Create a container for holding the slides. Use `swipeview-container`, `swipeview-slider` and `swipeview-slide` as shown below.

    <div class="swipeview-container" id="container">
        <div class="swipeview-slider" id="slider">
          <div class="swipeview-slide slide" id="slide-1"></div>
          <div class="swipeview-slide slide" id="slide-2"></div>
          <div class="swipeview-slide slide" id="slide-3"></div>
          <div class="swipeview-slide slide" id="slide-4"></div>    
        </div>
    </div>

Load `frp.js` and `swipeview.js` and call `SwipeView` with the container id.

      <script src="frp.js"></script>
      <script src="swipeview.js"></script>
      <script>
        SwipeView("container")
      </script>
