"use strict";

define(["src/core/getObject"], function (getObject) {
    var getResult = function (mainObject, callString) {
        const objectData = getObject(mainObject, callString);
        const object = objectData.object;
        const prop = objectData.prop;
        var value = object[prop];

        if (typeof value === 'function') {
            return value.call(object);
        } else {
            return value;
        }
    };

    return getResult;
});