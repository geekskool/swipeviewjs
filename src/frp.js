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

frp.compose = function(eventStream) {
    let operations = Array.prototype.slice.call(arguments, 1)
    if (operations.length == 0)
        return eventStream
    else
        return frp.compose.apply(null, [operations[0](eventStream)].concat(operations.slice(1)))
}

module.exports = frp