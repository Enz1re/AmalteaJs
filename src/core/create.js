"use strict";

define([], function () {
    var create = function (obj, proto) {
        if (!obj) {
            return Object.create(proto || null);
        }

        var isArray = Array.isArray(obj);
        var type = typeof obj;

        if (type !== 'object' || isArray) {
            throw new Error("'obj' must be object, not " + (isArray ? "array" : type));
        }

        var object = Object.create(proto || null);

        for (var prop of Object.getOwnPropertyNames(obj)) {
            object[prop] = obj[prop];
        }

        return object;
    };

    return create;
});