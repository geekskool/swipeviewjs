"use strict"

const classNames = {
  "container": "swipeview-container",
  "slider"   : "swipeview-slider",
  "slide"    : "swipeview-slide"
}

function SwipeView(containerId, slideWidth, slideHeight) {
  slideWidth  = slideWidth  || window.innerWidth
  slideHeight = slideHeight || window.innerHeight

  const container = document.getElementById(containerId)
  const slider    = container.getElementsByClassName(classNames.slider)[0]
  const slides    = slider.getElementsByClassName(classNames.slide)

  const numSlides = slides.length

  setupStyles(container, slider, slides)

  const touchStart$ = on(container, "touchstart")
  const touchMove$  = on(container, "touchmove")
  const touchEnd$   = on(container, "touchend")

  let touchEvents$ = merge(touchStart$, touchMove$, touchEnd$)

  touchEvents$ = map(touchEvents$, event => ({
    type: event.type,
    pageX: getPageX(event),
    time: event.timeStamp
  }))

  touchEvents$ = foldp(touchEvents$, (prev, curr) => {
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

  function canSlideLeft(event) {
    return (event.displacement > 0 && event.slideIndex > 0)
  }

  function canSlideRight(event) {
    return (event.displacement < 0 && event.slideIndex < numSlides - 1)
  }

  function hasCrossedMidPoint(event) {
    return Math.abs(event.displacement) > slideWidth/2
  }

  function isFlicked(event) {
    return getSpeed(event) > 0.4
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

// Functional Reactive Programming utils from frpjs
// See: https://github.com/santoshrajan/frpjs

function on(element, name, useCapture) {
  return function(next) {
    element.addEventListener(name, next, !!useCapture)
  }
 }

function map(eventStream, valueTransform) {
  return function(next) {
    eventStream(function(value) {
      next(valueTransform(value))
    })
  }
}

function foldp(eventStream, step, initial) {
  return (function(next) {
    let accumulated = initial
    eventStream(function (value) {
      next(accumulated = step(accumulated, value))
    })
  })
}

function merge() {
  let eventStreams = Array.prototype.slice.call(arguments)
  return function(next) {
    eventStreams.forEach(function(eventStream) {
      eventStream(function(value) {
        next(value)
      })
    })
  }
}