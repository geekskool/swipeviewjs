(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict"

const swipeview = require('./lib/swipeview')

const container = document.getElementById("container")
swipeview(container)
},{"./lib/swipeview":3}],2:[function(require,module,exports){
// Functional Reactive Programming utils from frpjs
// See: https://github.com/santoshrajan/frpjs

"use strict"

const frp = {}

frp.createEventStream = function(element, name, useCapture) {
    return function(next) {
        element.addEventListener(name, next, !!useCapture)
    }
}

frp.mapEventStream = function(eventStream, valueTransform) {
    return function(next) {
        eventStream(function(value) {
            next(valueTransform(value))
        })
    }
}

frp.foldEventStream = function(eventStream, step, initial) {
    return (function(next) {
        let accumulated = initial
        eventStream(function (value) {
            next(accumulated = step(accumulated, value))
        })
    })
}

frp.mergeEventStreams = function() {
    let eventStreams = Array.prototype.slice.call(arguments)
    return function(next) {
        eventStreams.forEach(function(eventStream) {
            eventStream(function(value) {
                next(value)
            })
        })
    }
}

module.exports = frp
},{}],3:[function(require,module,exports){
"use strict"

const frp = require("./frp.js")

module.exports = function(container, slideWidth, slideHeight) {
    const view = new SwipeView(container, slideWidth, slideHeight)

    view.setupStyles()

    const touchStart$ = frp.createEventStream(container, "touchstart")
    const touchMove$  = frp.createEventStream(container, "touchmove")
    const touchEnd$   = frp.createEventStream(container, "touchend")

    let touchEvents$ = frp.mergeEventStreams(touchStart$, touchMove$, touchEnd$)

    touchEvents$ = frp.mapEventStream(touchEvents$, event => {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()

        return {
            type: event.type,
            pageX: getPageX(event),
            time: event.timeStamp
        }
    })

    touchEvents$ = frp.foldEventStream(touchEvents$, (prev, curr) => {
        curr.startX = (curr.type == "touchstart") ? curr.pageX : prev.startX
        curr.startTime = (curr.type == "touchstart") ? curr.time : prev.startTime
        curr.displacement = curr.pageX - curr.startX
        curr.slideIndex = prev.slideIndex
      
        return curr
    }, { slideIndex: 0 })

    touchEvents$(event => activateEventStream(event, view))

}

function activateEventStream(event, view) {
    if (event.type == "touchmove") {
        if (view.canSlideLeft(event) || view.canSlideRight(event)) {
            let distance = -(event.slideIndex * view.slideWidth) + event.displacement
            view.move(distance)
        } else if (view.isPullingEdge(event)) {
            let distance = -(event.slideIndex * view.slideWidth) + (view.edgePadding / view.slideWidth) * event.displacement
            view.move(distance)
        }
    }

    if (event.type == "touchend") {
        if (view.hasCrossedMidPoint(event) || view.isFlicked(event)) {
            if (view.canSlideRight(event))
                event.slideIndex++
            else if (view.canSlideLeft(event))
                event.slideIndex--
        }

        let distance = -(event.slideIndex * view.slideWidth)
        let time     = view.isFlicked(event) ? 150 : 300
        view.animate(distance, time)
    }
}

function SwipeView(container, slideWidth, slideHeight) {
    this.slideWidth  = slideWidth  || window.innerWidth
    this.slideHeight = slideHeight || window.innerHeight

    this.container = container
    this.slider    = this.container.firstElementChild
    this.slides    = this.slider.children

    this.numSlides   = this.slides.length
    this.edgePadding = this.slideWidth / 10
}

SwipeView.prototype.setupStyles = function() {
    this.container.style["width"]    = this.slideWidth + "px"
    this.container.style["height"]   = this.slideHeight + "px"
    this.container.style["overflow"] = "hidden"

    this.slider.style["width"]     = this.numSlides * 100 + "%"
    this.slider.style["height"]    = "100%"
    this.slider.style["transform"] = "translate3d(0, 0, 0)"

    let slideWidth = this.slideWidth, slideHeight = this.slideHeight
    Array.prototype.forEach.call(this.slides, function(slide) {
        slide.style["width"]  = slideWidth + "px"
        slide.style["height"] = slideHeight + "px"
        slide.style["float"]  = "left"
    })        
}

SwipeView.prototype.canSlideLeft = function(event) {
    return (event.displacement > 0 && event.slideIndex > 0)
}

SwipeView.prototype.canSlideRight = function(event) {
    return (event.displacement < 0 && event.slideIndex < this.numSlides - 1)
}

SwipeView.prototype.isPullingEdge = function(event) {
    let sliderPosition = this.slider.getBoundingClientRect().left
    let nMinusOneSlides = (this.numSlides - 1) * this.slideWidth // width of (n - 1) slides

    return ((0 <= sliderPosition && sliderPosition < this.edgePadding) ||
            (-nMinusOneSlides - this.edgePadding < sliderPosition && sliderPosition <= -nMinusOneSlides))
}

SwipeView.prototype.hasCrossedMidPoint = function(event) {
    return Math.abs(event.displacement) > this.slideWidth/2
}

SwipeView.prototype.isFlicked = function(event) {
    return getSpeed(event) > 1
}

SwipeView.prototype.animate = function(translateX, ms) {
    this.slider.style["transition"] = "transform " + ms +"ms ease-out"
    this.slider.style["transform"]  = "translate3d(" + translateX + "px, 0, 0)"
}

SwipeView.prototype.move = function(translateX) {
    this.slider.style["transition"] = "none"
    this.slider.style["transform"]  = "translate3d(" + translateX + "px, 0, 0)"
}


function getSpeed(event) {
    return Math.abs(event.displacement) / (event.time - event.startTime)
}

function getPageX(event) {
    return (event.type == "touchend") ?
      event.changedTouches[0].pageX : event.targetTouches[0].pageX
}
},{"./frp.js":2}]},{},[1]);
