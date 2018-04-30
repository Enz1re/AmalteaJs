"use strict";

define([], function () {
    function model(name, modelObj) {
        this.name = name;
        this.object = modelObj;
    }

    model.prototype = {
        constructor: model,
    }

    return model;
});