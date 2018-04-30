"use strict";

define([
    "src/core/merge",
    "src/core/mergeArrays"
], function (merge, mergeArrays) {
    var shallowCopy = function (obj) {
        return Array.isArray(obj) ? mergeArrays([], obj) : merge({}, obj);
    }

    return shallowCopy;
});