"use strict"

const frp = require("./frp.js")

module.exports = function(container, slideWidth, slideHeight) {
    slideWidth  = slideWidth  || window.innerWidth
    slideHeight = slideHeight || window.innerHeight

    const slider = container.firstElementChild
    const slides = slider.children

    const numSlides   = slides.length
    const edgePadding = slideWidth / 10

    setupStyles(container, slider, slides)
    setupTouchHandler()

    function setupStyles(container, slider, slides) {
        container.style["width"]    = slideWidth + "px"
        container.style["height"]   = slideHeight + "px"
        container.style["overflow"] = "hidden"

        slider.style["width"]     = numSlides * 100 + "%"
        slider.style["height"]    = "100%"
        slider.style["transform"] = "translate3d(0, 0, 0)"

        Array.prototype.forEach.call(slides, function(slide) {
            slide.style["width"]  = slideWidth + "px"
            slide.style["height"] = slideHeight + "px"
            slide.style["float"]  = "left"
        })
    }

    function setupTouchHandler() {
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

        touchEvents$(event => {
            if (event.type == "touchmove") {
                if (canSlideLeft(event) || canSlideRight(event)) {
                    let distance = -(event.slideIndex * slideWidth) + event.displacement
                    move(distance)
                } else if (isPullingEdge(event)) {
                    let distance = -(event.slideIndex * slideWidth) + (edgePadding / slideWidth) * event.displacement
                    move(distance)
                }
            }

            if (event.type == "touchend") {
                if (hasCrossedMidPoint(event) || isFlicked(event)) {
                    if (canSlideRight(event))
                        event.slideIndex++
                    else if (canSlideLeft(event))
                        event.slideIndex--
                }

                let distance = -(event.slideIndex * slideWidth)
                let time     = isFlicked(event) ? 150 : 300
                animate(distance, time)
            }
        })
    }

    function canSlideLeft(event) {
        return (event.displacement > 0 && event.slideIndex > 0)
    }

    function canSlideRight(event) {
        return (event.displacement < 0 && event.slideIndex < numSlides - 1)
    }

    function isPullingEdge(event) {
        let sliderPosition = slider.getBoundingClientRect().left
        let nMinusOneSlides = (numSlides - 1) * slideWidth // width of (n - 1) slides

        return ((0 <= sliderPosition && sliderPosition < edgePadding) ||
                (-nMinusOneSlides - edgePadding < sliderPosition && sliderPosition <= -nMinusOneSlides))
    }

    function hasCrossedMidPoint(event) {
        return Math.abs(event.displacement) > slideWidth/2
    }

    function isFlicked(event) {
        return getSpeed(event) > 1
    }

    function getSpeed(event) {
        return Math.abs(event.displacement) / (event.time - event.startTime)
    }

    function getPageX(event) {
        return (event.type == "touchend") ?
          event.changedTouches[0].pageX : event.targetTouches[0].pageX
    }

    function animate(translateX, ms) {
        slider.style["transition"] = "transform " + ms +"ms ease-out"
        slider.style["transform"]  = "translate3d(" + translateX + "px, 0, 0)"
    }

    function move(translateX) {
        slider.style["transition"] = "none"
        slider.style["transform"]  = "translate3d(" + translateX + "px, 0, 0)"
    }
}