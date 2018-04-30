"use strict";

define([
    "src/presenterCompilation",
    "src/viewCompilation",
    "src/cache",
    "src/http",
    "src/view",
    "src/injector",

    "src/core/contains",
    "src/core/containsAny",
    "src/core/containsAll",
    "src/core/getObject",
    "src/core/getResult",
    "src/core/isNull",
    "src/core/isUndefined",
    "src/core/merge",
    "src/core/mergeArrays",
    "src/core/mergeCopy",
    "src/core/shallowCopy",
    "src/core/unique",
    "src/core/create"
], function (compileData, compileView, cache, http, view, Injector, contains, containsAny, containsAll,
             getObject, getResult, isNull, isUndefined, merge, mergeArrays, mergeCopy,
             shallowCopy, unique, create) {
    function Amaltea() {
        /*

        Schema

        modules = {
            "moduleName": {
                views: {
                    "tagName": { tagName: "tagName", template: "template", stylesheet: "stylesheet", _node: <node> }
                },
                presenters: {
                    "tagName": { p: { <presenter> }, d: [ <dependencies> ] }
                },
                models: {
                    "tagName": [ { <model1> }, [{ <model2> }] ]
                },
                dependencies: {
                    "dependencyName": { <dependency> } | "<dependency>"
                },
                submodules: [
                    { <module> }
                ]
            }
        }

        */
        var modules = create();

        /*

        Schema

        viewsById = {
            0: { tagName: "tagName", template: "template", stylesheet: "stylesheet" }
        }

        */
        var viewsById = create();

        /*

        Schema

        markedNodes = {
            "tagName": 0
        }

        */
        var markedNodes = create();
        var globalDependencies = create({
            '$view': true,
            '$model': true,
            'http': { sos: 420 }
        });
        var injector = new Injector(globalDependencies);

        var validateModuleDescriptor = function (moduleDescriptor) {
            if (!('name' in moduleDescriptor)) {
                throw new Error("Module name is required for module registration");
            }
            if (!('views' in moduleDescriptor)) {
                throw new Error("View list is required for module registration for module \"" + moduleDescriptor.name + "\"");
            }
            if (moduleDescriptor.name in modules) {
                throw new Error("Module \"" + moduleDescriptor.name + "\" is already registered");
            }
            if (!!moduleDescriptor.dependencies) {
                for (var dependencyName of moduleDescriptor.dependencies) {
                    if (!(dependencyName in globalDependencies)) {
                        throw new Error("Unknown dependency: " + dependencyName + ". Be sure you registered this dependency and spelled its name right.");
                    }
                }
            }
        }

        this.object = function (dependencyName, constructor, dependencies) {
            if (dependencyName in globalDependencies) {
                throw new Error("Dependency \"" + dependencyName + "\" is already registered");
            }
            var objType = typeof constructor;
            if (objType !== 'function') {
                throw new Error("'" + dependencyName + "' constructor must be a function, not " + objType);
            }

            dependencies = dependencies || [];
            ['$view', '$model'].forEach(function (item) {
                if (contains(dependencies, item)) {
                    throw new Error("Can't inject \"" + item + "\" to " + dependencyName + ". $view and $model injectables can be used only in presenter constructor function.");
                }
            });

            globalDependencies[dependencyName] = injector.inject(null, null, dependencyName, constructor, dependencies)

            return globalDependencies[dependencyName];
        };

        this.module = function (moduleDescriptor) {
            validateModuleDescriptor(moduleDescriptor);

            modules[moduleDescriptor.name] = create();
            modules[moduleDescriptor.name].views = create();
            modules[moduleDescriptor.name].presenters = create();
            modules[moduleDescriptor.name].models = create();
            modules[moduleDescriptor.name].submodules = [];

            for (var view of moduleDescriptor.views) {
                modules[moduleDescriptor.name].views[view.tagName] = view;
                modules[moduleDescriptor.name].presenters[view.tagName] = view.presenter;
                modules[moduleDescriptor.name].models[view.tagName] = view.presenter.models;
            }

            for (var dep of moduleDescriptor.dependencies) {
                modules[moduleDescriptor.name].dependencies[dep.name] = dep;
            }

            for (var submodule of moduleDescriptor.submodules) {
                modules[moduleDescriptor.name].submodules.push(submodule);
            }

            return modules[moduleDescriptor.name];
        };

        this.run = function (mainModule) {
            var htmlCompileEvent = new Event("HTMLCompiled");
            var dataCompileEvent = new Event("DataCompiled");

           //document.addEventListener("DOMContentLoaded", function () {
                var viewCache = cache.create('viewCache');

                for (var moduleName of Object.getOwnPropertyNames(modules)) {
                    var viewList = Object.values(modules[moduleName].views);
                    http.afterAll(viewList.map(function (view) {
                        return http.get(view.template);
                    })).then(function (responses) {
                        for (let i = 0; i < viewList.length; i++) {
                            viewList[i].template = responses[i];
                            viewCache.put(viewList[i].tagName, viewList[i].template);
                        }

                        //var routeConfig = registerRoutes(routes);
                        //initializeRouting(routeConfig);
                        compileView(modules[moduleName], injector);
                        document.dispatchEvent(htmlCompileEvent);
                        compileData(viewsById, modules[moduleName].views);
                        document.dispatchEvent(dataCompileEvent);
                    });
                }
            //});
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

        this.contains = contains;

        this.containsAny = containsAny;

        this.containsAll = containsAll;

        this.unique = unique;

        this.merge = merge;

        this.mergeArrays = mergeArrays;

        this.shallowCopy = shallowCopy;

        this.mergeCopy = mergeCopy;

        this.getObject = getObject;

        this.getResult = getResult;

        this.create = create;

        this.isUndefined = isUndefined;

        this.isNull = isNull;
    }

    Amaltea.prototype = create();

    window.amaltea = window.amaltea || new Amaltea();
});