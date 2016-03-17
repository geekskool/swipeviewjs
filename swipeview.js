"use strict"

import frp from "frpjs"
import dom from "frpjs/dom"

function setup(selector, slideWidth, slideHeight) {
    const view = new SwipeView(selector, slideWidth, slideHeight)

    let stream$ = frp.compose(
        dom.onTouchStart(selector),
        frp.merge(dom.onTouchMove(selector)),
        frp.merge(dom.onTouchEnd(selector)),

        frp.map(event => ({
            type: event.type,
            pageX: getPageX(event),
            pageY: getPageY(event),
            time: event.timeStamp,
            preventDefault: event.preventDefault.bind(event)
        })),

        frp.fold((prev, curr) => {
            curr.startX = (curr.type == "touchstart") ? curr.pageX : prev.startX
            curr.startY = (curr.type == "touchstart") ? curr.pageY : prev.startY
            curr.startTime = (curr.type == "touchstart") ? curr.time : prev.startTime

            curr.xDisplacement = curr.pageX - curr.startX
            curr.yDisplacement = curr.pageY - curr.startY

            curr.slideIndex = prev.slideIndex

            return curr
        }, { slideIndex: 0 }),

        frp.map(event => {
            const displacementAngle = Math.abs(event.yDisplacement / event.xDisplacement)

            if (event.type == "touchmove" && displacementAngle < 2)
                event.move = view.handleTouchMove(event)
            if (event.type == "touchend" && displacementAngle < 2)
                event.move = view.handleTouchEnd(event)

            return event
        })
    )

    stream$(event => activateEventStream(event, view))
}

function activateEventStream(event, view) {
    if (event.move) {
        event.preventDefault()

        let { type, distance, time } = event.move
        if (type == "move")
            view.move(distance)
        if (type == "animate")
            view.animate(distance, time)
    }
}

function SwipeView(selector, slideWidth, slideHeight) {
    this.slideWidth  = slideWidth  || window.innerWidth
    this.slideHeight = slideHeight || window.innerHeight

    this.container = dom.select(selector)
    this.slider    = this.container.firstElementChild
    this.slides    = this.slider.children

    this.numSlides   = this.slides.length
    this.edgePadding = this.slideWidth / 10

    this.setupStyles()
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
    return (event.xDisplacement > 0 && event.slideIndex > 0)
}

SwipeView.prototype.canSlideRight = function(event) {
    return (event.xDisplacement < 0 && event.slideIndex < this.numSlides - 1)
}

SwipeView.prototype.isPullingEdge = function(event) {
    let sliderPosition = this.slider.getBoundingClientRect().left
    let nMinusOneSlides = (this.numSlides - 1) * this.slideWidth // width of (n - 1) slides

    return ((0 <= sliderPosition && sliderPosition < this.edgePadding) ||
            (-nMinusOneSlides - this.edgePadding < sliderPosition && sliderPosition <= -nMinusOneSlides))
}

SwipeView.prototype.hasCrossedMidPoint = function(event) {
    return Math.abs(event.xDisplacement) > this.slideWidth/2
}

SwipeView.prototype.isFlicked = function(event) {
    return getSpeed(event) > 0.8
}

SwipeView.prototype.handleTouchMove = function(event) {
    if (this.canSlideLeft(event) || this.canSlideRight(event)) {
        let distance = -(event.slideIndex * this.slideWidth) + event.xDisplacement
        return { type: "move", distance: distance }
    } else if (this.isPullingEdge(event)) {
        let distance = -(event.slideIndex * this.slideWidth) + (this.edgePadding / this.slideWidth) * event.xDisplacement
        return { type: "move", distance: distance }
    }
}

SwipeView.prototype.handleTouchEnd = function(event) {
    if (this.hasCrossedMidPoint(event) || this.isFlicked(event)) {
        if (this.canSlideRight(event))
            event.slideIndex++
        else if (this.canSlideLeft(event))
            event.slideIndex--
    }

    let distance = -(event.slideIndex * this.slideWidth)
    let time     = this.isFlicked(event) ? 150 : 300
    return { type: "animate", distance: distance, time: time }
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
    return Math.abs(event.xDisplacement) / (event.time - event.startTime)
}

function getPageX(event) {
    return (event.type == "touchend") ?
      event.changedTouches[0].pageX : event.targetTouches[0].pageX
}

function getPageY(event) {
    return (event.type == "touchend") ?
      event.changedTouches[0].pageY : event.targetTouches[0].pageY
}

export { setup }
