// Functional Reactive Programming utils from frpjs
// See: https://github.com/santoshrajan/frpjs

"use strict"

const frp = {}

frp.createEventStream = function(element, name, useCapture) {
    return function(next) {
        element.addEventListener(name, next, !!useCapture)
    }
}

frp.map = function(valueTransform) {
    return function(eventStream) {
        return function(next) {
            eventStream(function(value) {
                next(valueTransform(value))
            })
        }
    }
}

frp.fold = function(step, initial) {
    return function(eventStream) {
        return function(next) {
            let accumulated = initial
            eventStream(function (value) {
                next(accumulated = step(accumulated, value))
            })
        }
    }
}

frp.merge = function(eventStreamA) {
    return function(eventStreamB) {
        return function(next) {
            eventStreamA(value => next(value))
            eventStreamB(value => next(value))
        }
    }
}

frp.compose = function() {
    var eventStreams = Array.prototype.slice.call(arguments)
    return eventStreams.reduce((eventStream, operation) => operation(eventStream))
}

module.exports = frp