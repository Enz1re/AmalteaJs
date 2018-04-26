"use strict";

(function () {
    function Amaltea() {
        /*

        Schema

        modules = {
            "moduleName": {
                views: {
                    "tagName": { tagName: "tagName", template: "template", stylesheet: "stylesheet" }
                },
                presenters: {
                    "tagName": { p: { <presenter> }, d: [ <dependencies> ] }
                },
                models: {
                    "tagName": [ { <model1> }, [{ <model2> }] ]
                }
            }
        }

        */
        var modules = Object.create(null);

        /*

        Schema

        viewsById = {
            0: { tagName: "tagName", template: "template", stylesheet: "stylesheet" }
        }

        */
        var viewsById = Object.create(null);

        /*

        Schema

        markedNodes = {
            "tagName": 0
        }

        */
        var markedNodes = Object.create(null);
        var registeredDependencies = Object.create(null);

        this.object = function (dependencyName, object) {
            if (dependencyName in registeredDependencies) {
                throw new Error("Dependency \"" + dependencyName + "\" is already registered");
            }
            var objType = typeof object;
            if (objType !== 'object' || objType !== 'string') {
                throw new Error("Dependency \"" + dependencyName + "\" must be object or string, not " + objType);
            }

            registeredDependencies[dependencyName] = object;
        };

        this.module = function (moduleName, views, dependencies) {
            if (!moduleName) {
                throw new Error("moduleName is required for module registration");
            }
            if (!views) {
                throw new Error("view list is required for module registration");
            }
            if (moduleName in modules) {
                throw new Error("Module \"" + moduleName + "\" is already registered");
            }
            

        };

        this.run = function (mainModule) {

        };

        this.view = function (viewObject) {
            if (!viewObject.tagName) {
                throw new Error("tagName is required for view");
            }
            if (!viewObject.template) {
                throw new Error("template is required for view " + viewObject.tagName);
            }

            return new view(viewObject);
        };

        this.contains = function (array, value, comparerFn) {
            comparerFn = comparerFn || function (elem, value) { return elem === value; }

            for (var i = 0; i < array.length; i++) {
                if (comparerFn(array[i], value)) {
                    return true;
                }
            }

            return false;
        };

        this.containsAny = function (sourceArray, destinationArray, comparerFn) {
            comparerFn = comparerFn || function (elem, value) { return elem === value; }

            for (var i = 0; i < destinationArray.length; i++) {
                if (this.contains(sourceArray, destinationArray[i], comparerFn)) {
                    return true;
                }
            }

            return false;
        };

        this.containsAll = function (sourceArray, destinationArray, comparerFn) {
            comparerFn = comparerFn || function (elem, value) { return elem === value; }

            for (var i = 0; i < destinationArray.length; i++) {
                if (!this.contains(sourceArray, destinationArray[i], comparerFn)) {
                    return false;
                }
            }

            return true;
        };

        this.unique = function (array) {
            var map = {};

            for (let i = 0; i < array.length; i++) {
                if (map[array[i]]) {
                    array.splice(i, 1);
                } else {
                    map[array[i]] = true;
                }
            }

            return array;
        };

        this.merge = function (src, obj) {
            var srcType = typeof src;
            if (srcType !== typeof obj) {
                throw new Error("'src' and 'obj' arguments should have the same type");
            }
            if (srcType !== 'object') {
                throw new Error("'src' must be either object or array, not \"" + srcType + "\"");
            }
            if (Array.isArray(src) && Array.isArray(obj)) {
                return this.mergeArrays(src, obj);
            }

            for (var prop in obj) {
                src[prop] = obj[prop];
            }

            return src;
        };

        this.mergeArrays = function (src, obj) {
            for (var item of obj) {
                if (!this.contains(src, item)) {
                    src.push(item);
                }
            }

            return src;
        };

        this.shallowCopy = function (obj) {
            var copy = {};
            return this.merge(copy, obj);
        };

        this.mergeCopy = function (src, obj) {
            src = this.shallowCopy(src);
            return this.merge(src, obj);
        };

        this.getObject = function (mainObject, callString) {
            var object;
            var prev = mainObject;
            var callChain = callString.split('.');
            var prop = callChain[callChain.length - 1].replace('()', '');
            callChain.splice(0, 1);
            callChain.splice(callChain.length - 1, 1);

            for (var callee of callChain) {
                if (callee.indexOf('(') !== -1 || callee.indexOf(')') !== -1) {
                    if (matchesFunctionCall(callee)) {
                        var functionName = callee.replace('()', '');
                        object = prev[functionName].call(prev);
                    } else {
                        throw new Error("Syntax error: " + callee);
                    }
                } else {
                    if (!(callee in prev)) {
                        throw new Error("Presenter has no member called '" + callee + "'");
                    }
                    object = prev[callee];
                }

                prev = object;
            }

            return { object: object || mainObject, prop: prop };
        };

        this.getResult = function (mainObject, callString) {
            const objectData = this.getObject(mainObject, callString);
            const object = objectData.object;
            const prop = objectData.prop;
            var value = object[prop];

            if (typeof value === 'function') {
                return value.call(object);
            } else {
                return value;
            }
        };

        this.isUndefined = function (value) {
            return value === undefined;
        };

        this.isNull = function (value) {
            return value === null;
        }
    }

    Amaltea.prototype = Object.create(null);

    window.amaltea = window.amaltea || new Amaltea();
})();