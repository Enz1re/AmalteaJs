"use strict";

define([], function () {
    var unique = function (array) {
        var map = {};

        for (let i = 0; i < array.length; i++) {
            if (map[array[i]]) {
                array.splice(i, 1);
            } else {
                map[array[i]] = true;
            }
        }

        return array;
    }

    return unique;
});