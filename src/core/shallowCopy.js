define(["src/core/merge"], function (merge, mergeArrays) {
    "use strict";

    var shallowCopy = function (obj) {
		if (typeof obj !== 'object') {
			var copy = obj;
			return copy;
		}
		
        return merge((Array.isArray(obj) ? [] : {}), obj);
    }

    return shallowCopy;
});