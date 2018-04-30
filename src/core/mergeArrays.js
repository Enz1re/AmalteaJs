"use strict";

define(["src/core/contains"], function (contains) {
    var mergeArrays = function (src, obj) {
        for (var item of obj) {
            if (!contains(src, item)) {
                src.push(item);
            }
        }

        return src;
    }

    return mergeArrays;
});