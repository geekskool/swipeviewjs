A library for smooth touch-based content sliders. Built on principles of Functional Reactive Programming.

**Example**

See the sample app under `/example`

    cd example && npm start

**Usage**

Create a container div as per the structure below.

    <div id="container">
        <div id="slider">
            <div id="slide-1"></div>
            <div id="slide-2"></div>
            <div id="slide-3"></div>
            <div id="slide-4"></div>    
        </div>
    </div>

Require `swipeview` and call it with the container element.

    const swipeview = require('./lib/swipeview')

    const container = document.getElementById("container")
    swipeview(container)
