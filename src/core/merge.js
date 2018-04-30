"use strict";

define(["src/core/mergeArrays"], function (mergeArrays) {
    var merge = function (src, obj) {
        var srcType = typeof src;
        if (srcType !== typeof obj) {
            throw new Error("'src' and 'obj' arguments should have the same type");
        }
        if (srcType !== 'object') {
            throw new Error("'src' must be either object or array, not \"" + srcType + "\"");
        }
        if (Array.isArray(src) && Array.isArray(obj)) {
            return mergeArrays(src, obj);
        }

        for (var prop in obj) {
            src[prop] = obj[prop];
        }

        return src;
    };

    return merge;
});