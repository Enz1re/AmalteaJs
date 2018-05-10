define([
    "src/$view",
    "src/$model",

    "src/core/shallowCopy"
], function ($view, $model, shallowCopy) {
    "use strict";

    var arrow = true;
    var funcArgs = arrow ? /^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m : /^(function)\s*[^\(]*\(\s*([^\)]*)\)/m;
    var funcArgSplit = /,/;
    var funcArg = /^\s*(_?)(.+?)\1\s*$/;
    var stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

    var getFunctionArguments = function(func) {
        return ((func || '').toString().replace(stripComments, '').match(funcArgs) || ['', '', ''])[2]
            .split(funcArgSplit)
            .map(function (arg) {
                return arg.replace(funcArg, function (all, underscore, name) {
                    return name.split('=')[0].trim();
                });
            })
            .filter(String);
    }

    var Injector = function (dependencyDict) {
        var dependencyDict = dependencyDict;

        this.inject = function (node, modelList, objName, constructor, dependencies) {
            if (typeof constructor !== 'function') {
                throw new Error("Constructor of \"" + objName + "\" should be a function not " + typeof constructor);
            }
            if (!Array.isArray(dependencies)) {
                throw new Error("Dependency list of \"" + objName + "\" should be an array, not " + typeof dependencies);
            }
            if (constructor.length !== dependencies.length) {
                throw new Error("Number of parameters of \"" + objName + "\" constructor function should be equal with to a number of dependencies.");
            }
            for (var depName of dependencies) {
                if (!(depName in dependencyDict)) {
                    throw new Error("Unknown dependency in \"" + objName + "\": " + depName + ". Be sure you registered this dependency and spelled its name right.");
                }
            }

            var object = constructor.call();
            var constructorArguments = getFunctionArguments(constructor);
            var _dependencies = shallowCopy(dependencies);

            // resolve $view and $model separately, because they must have definite order
            var index;
            if ((index = _dependencies.indexOf('$model')) !== -1) {
                object[constructorArguments[index]] = new $model(modelList, node, object, constructorArguments[index]);
                _dependencies.splice(index, 1);
                constructorArguments.splice(index, 1);
            }
            if ((index = _dependencies.indexOf('$view')) !== -1) {
                object[constructorArguments[index]] = new $view(modelList, node, object);
                _dependencies.splice(index, 1);
                constructorArguments.splice(index, 1);
            }

            for (var i = 0; i < _dependencies.length; i++) {
                if (_dependencies[i] in object) {
                    throw new Error("Duplicate dependency: '" + _dependencies[i] + "' in " + objName);
                }

                object[constructorArguments[i]] = dependencyDict[_dependencies[i]].value;
            }

            return object;
        };

        this.get = function (depName) {
            if (!(depName in dependencyDict)) {
                throw new Error("No such dependency: '" + depName + "'");
            }

            return dependencyDict[depName].value;
        };

        this.tryGet = function (depName, result) {
            if (!(depName in dependencyDict)) {
                return false;
            }

            result = dependencyDict[depName].value;
            return true;
        };
    }

    return Injector;
});