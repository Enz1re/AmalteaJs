define(["src/core/contains"], function (contains) {
    "use strict";

    var mergeArrays = function (src, objects) {
        for (var i = 1; i < arguments.length; i++) {
            if (typeof arguments[i][Symbol.iterator] !== 'function') {
                throw new Error(arguments[i] + " is not array.");
            }
            for (var item of arguments[i]) {
                if (!contains(src, item)) {
                    src.push(item);
                }
            }

            return src;
        }
    }

    return mergeArrays;
});