define(["src/core/contains"], function (contains) {
    "use strict";

    var merge = function (src, objects) {
        var srcType = typeof src;
        var isSrcArray = Array.isArray(src);
        var temporaryMerged = isSrcArray ? [] : {};
        
        for (var i = 1; i < arguments.length; i++) {
            var objType = typeof arguments[i];
            var isObjArray = Array.isArray(arguments[i]);
            
            if (srcType !== 'object' || objType !== 'object') {
                throw new Error("arguments must be either object or array, not \"" + srcType + "\"");
            }
            if (srcType !== objType || (isSrcArray ? !isObjArray : isObjArray)) {
                throw new Error("all arguments should have the same type: " + srcType + ". Met type: " + (isObjArray ? "array" : objType) + " at the position " + i);
            }

            if (isSrcArray) {
                for (var item of arguments[i]) {
                    if (!contains(src, item) && !contains(temporaryMerged, item)) {
                        temporaryMerged.push(item);
                    }
                }
            } else {
                for (var prop in arguments[i]) {
					if (!(prop in src)) {
						temporaryMerged[prop] = arguments[i][prop];
					}
                }
            }
        }
        
        if (isSrcArray) {
            for (var item of temporaryMerged) {
                if (!contains(src, item)) {
                    src.push(item);
                }
            }
        } else {
            for (var prop in temporaryMerged) {
                src[prop] = temporaryMerged[prop];
            }
        }

        return src;
    };

    return merge;
});