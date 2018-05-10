define(["src/core/getModelDescriptor"], function (getModelDescriptor) {
    "use strict";

    function model(name, modelObj) {
        this.name = name;
        this.object = modelObj;
        this.descriptor = getModelDescriptor(modelObj);
    }

    model.prototype = {
        constructor: model,
    }

    return model;
});