"use strict"

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
  console.log(eventStreams)
  return function(next) {
    eventStreams.forEach(function(eventStream) {
      eventStream(function(value) {
        next(value)
      })
    })
  }
}

function throttle(eventStream, ms) {
  return (function(next) {
    let last = 0
    eventStream(function(value) {
      let now = performance.now()
      if (last == 0 || (now - last) > ms) {
        next(value)
        last = now
      }
    })
  })
}

function touchHandler(element) {
  const container = document.getElementById(element)

  let touchStart$ = on(container, "touchstart", false)
  let touchMove$ = on(container, "touchmove", false)
  let touchEvents$ = merge(touchStart$, touchMove$)

  touchEvents$ = map(touchEvents$, event => ({
    eType: event.type,
    pageX: event.targetTouches[0].pageX,
    pageY: event.targetTouches[0].pageY
  }))

  touchEvents$ = foldp(touchEvents$, (prev, curr) => {
    if (curr.eType != "touchstart") {
      let dx = curr.pageX - prev.pageX
      let current = parseFloat(container.style.left) || 0
      container.style.left = current + dx + "px"
    }
    return curr
  }, null)

  touchEvents$ = throttle(touchEvents$, 60)
  touchEvents$(value => value)
}
