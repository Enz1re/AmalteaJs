define(["src/core/contains"], function (contains) {
    "use strict";

    var containsAll = function (sourceArray, destinationArray, comparerFn) {
        comparerFn = comparerFn || function (elem, value) { return elem === value; }

		if (destinationArray.length > sourceArray.length) {
			return false;
		}
		
        for (var i = 0; i < destinationArray.length; i++) {
            if (!contains(sourceArray, destinationArray[i], comparerFn)) {
                return false;
            }
        }

        return true;
    }

    return containsAll;
});