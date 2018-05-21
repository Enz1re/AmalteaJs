define([], function () {
    "use strict";

    var deepCopy = function (obj) {
        if (Array.isArray(obj)) {
            var arrayCopy = [];
            for (var elem of obj) {
                var copy;
                if (typeof elem === 'object') {
                    copy = deepCopy(elem);
                } else {
                    copy = elem;
                }
                arrayCopy.push(copy);
            }

            return arrayCopy;
        }
        else if (typeof obj === 'object') {
            var objCopy = {};
            for (var prop of Object.getOwnPropertyNames(obj)) {
                var copy;
                if (typeof obj[prop] === 'object') {
                    copy = deepCopy(obj[prop]);
                } else {
                    copy = obj[prop];
                }
                objCopy[prop] = copy;
            }

            return objCopy;
        }       
    };

    return deepCopy;
});