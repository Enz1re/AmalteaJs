"use strict";

define([], function () {
    function Model(modelObj, viewNode, presenter) {
        const propChangeEventName = modelObj.name + "PropertyChanged";
        this._watch = false;
        this._inner = {};
        var self = this;
        Object.getOwnPropertyNames(modelObj.object).forEach(function (prop) {
            if (typeof modelObj.object[prop] === 'object') {
                self._inner[prop] = modelObj.object[prop];
                if (!self._inner[prop]) {
                    self._inner[prop].value = null;
                }
            } else {
                self._inner[prop] = { type: modelObj.object[prop], value: null };
            }

            (function () {
                var propName = prop;
                Object.defineProperty(self, propName, {
                    get: function () {
                        return self._inner[propName].value;
                    },
                    set: function (value) {
                        var valueChangedEvent = new CustomEvent(propChangeEventName, { detail: { model: self, prop: propName, value: value } });
                        viewNode.dispatchEvent(valueChangedEvent);
                    }
                });
            })();
        });
        this.onValueChanged = function (callback, throwException) {
            self._watch = true;
            callback = callback || function () { return true; };
            viewNode.addEventListener(propChangeEventName, function (e) {
                var value = callback.call(presenter, e.detail.model, e.detail.prop, e.detail.value);
                if (value) {
                    self._inner[e.detail.prop].value = e.detail.value;
                } else if (throwException) {
                    throw new Error("Error validating model '" + e.detail.prop + "' with value " + e.detail.value);
                }
            });
        }
    }

    Model.prototype = {
        constructor: Model,
    };

    function $model(modelList, viewNode, presenter) {
        for (var modelObj of modelList) {
            Object.defineProperty(this, modelObj.name, {
                value: new Model(modelObj, viewNode, presenter),
                writable: false,
                configurable: false,
                enumerable: false,
            });
        }
    }

    $model.prototype = {
        constructor: $model
    };

    return $model;
});