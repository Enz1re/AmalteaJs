define(["src/core/contains"], function (contains) {
    "use strict";

    var containsAny = function (sourceArray, destinationArray, comparerFn) {
        comparerFn = comparerFn || function (elem, value) { return elem === value; }

        for (var i = 0; i < destinationArray.length; i++) {
            if (contains(sourceArray, destinationArray[i], comparerFn)) {
                return true;
            }
        }

        return false;
    }

    return containsAny;
});