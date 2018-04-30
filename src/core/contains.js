"use strict";

define([], function () {
	var contains = function (array, value, comparerFn) {
        comparerFn = comparerFn || function (elem, value) { return elem === value; }

        for (var i = 0; i < array.length; i++) {
            if (comparerFn(array[i], value)) {
                return true;
            }
        }

        return false;
    }
	
	return contains;
});