"use strict";

define(["src/model"], function (model) {
    function presenter(name, presenterFn, dependencies) {
        this.p = { name: name, constructor: presenterFn };
        this.d = dependencies;
        var modelDict = Object.create(null);

        this.model = function (name, modelObj) {
            if (name in modelDict) {
                throw new Error("Model \"" + name + "\" is already registered for " + this.p.name);
            }

            modelDict[name] = new model(name, modelObj);

            return modelDict[name];
        };

        Object.defineProperty(this, 'models', {
            get: function () {
                return Object.values(modelDict);
            }
        });
    }

    presenter.prototype = {
        constructor: presenter
    };

    return presenter;
});