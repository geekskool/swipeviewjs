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