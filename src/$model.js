define([
    "src/core/create",
    "src/core/mergeArrays"
], function (create, mergeArrays) {
    "use strict";

    function Model(modelObj, viewNode, presenter, parameterName) {
        const propChangeEventName = modelObj.name + "PropertyChanged";
        var inner = create();
        var self = this;
        Object.getOwnPropertyNames(modelObj.object).forEach(function (prop) {
            if (typeof modelObj.object[prop] === 'object') {
                inner[prop] = modelObj.object[prop];
                if (!inner[prop]) {
                    inner[prop].value = null;
                }
            } else {
                inner[prop] = { type: modelObj.object[prop], value: null };
            }

            (function () {
                var propName = prop;
                var node = viewNode;
                Object.defineProperty(self, propName, {
                    get: function () {
                        return inner[propName].value;
                    },
                    set: function (value) {
                        var valueChangedEvent = new CustomEvent(propChangeEventName, { detail: { model: self, prop: propName, value: value } });
                        node.dispatchEvent(valueChangedEvent);
                    }
                });
            })();
        });
        (function () {
            var p = presenter;
            var _inner = inner;
            var node = viewNode;
            var m = modelObj;
            var modelAlias = parameterName;
            self.onValueChanged = function (callback, throwException) {
                self._watch = true;
                callback = callback || function () { return true; };
                node.addEventListener(propChangeEventName, function (e) {
                    var value = callback.call(p, e.detail.model, e.detail.prop, e.detail.value);
                    if (!!value) {
                        _inner[e.detail.prop].value = e.detail.value;

                        var callString = "presenter." + modelAlias + "." + m.name + "." + e.detail.prop;
                        var oneWayBindings = Array.prototype.slice.call(this.getElementsByTagName('_am-bind')).filter(function (node) { return node.getAttribute('value') === callString; });
                        for (var oneWayBinding of oneWayBindings) {
                            oneWayBinding.textContent = e.detail.value;
                        }

                        var twoWayBindings = Array.prototype.slice.call(this.querySelectorAll('[am-value]')).filter(function (node) { return node.getAttribute('am-value') === callString; });
                        for (var twoWayBinding of twoWayBindings) {
                            if (twoWayBinding !== this) {
                                twoWayBinding.value = e.detail.value;
                            }
                        }
                    } else if (throwException) {
                        throw new Error("Error validating model '" + e.detail.prop + "' with value " + e.detail.value);
                    }
                });
            }
        })();
    }

    Model.prototype = {
        constructor: Model,

        _watch: false
    };

    function $model(modelList, viewNode, presenter, parameterName) {
        this._model = true;
        for (var modelObj of modelList) {
            Object.defineProperty(this, modelObj.name, {
                value: new Model(modelObj, viewNode, presenter, parameterName),
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