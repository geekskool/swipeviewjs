// Functional Reactive Programming utils from frpjs
// See: https://github.com/santoshrajan/frpjs

"use strict"

function createEventStream(element, name, useCapture) {
    return function(next) {
        element.addEventListener(name, next, !!useCapture)
    }
}

function mapEventStream(eventStream, valueTransform) {
    return function(next) {
        eventStream(function(value) {
            next(valueTransform(value))
        })
    }
}

function foldEventStream(eventStream, step, initial) {
    return (function(next) {
        let accumulated = initial
        eventStream(function (value) {
            next(accumulated = step(accumulated, value))
        })
    })
}

function mergeEventStreams() {
    let eventStreams = Array.prototype.slice.call(arguments)
    return function(next) {
        eventStreams.forEach(function(eventStream) {
            eventStream(function(value) {
                next(value)
            })
        })
    }
}