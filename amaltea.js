define([
    "src/presenterCompilation",
    "src/viewCompilation",
    "src/cache",
    "src/http",
    "src/view",
    "src/injector",
    "src/dependency",

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
], function (compileData, compileView, cache, http, view, Injector, Dependency, contains, containsAny, containsAll,
             getObject, getResult, isNull, isUndefined, merge, mergeArrays, mergeCopy,
             shallowCopy, unique, create) {
    "use strict";

    function Amaltea() {
        /*

        Schema

        modules = {
            "moduleName": {
                views: {
                    "tagName": {
                        _viewList: [
                            { tagName: "tagName", template: "template", stylesheet: "stylesheet" },
                            { tagName: "tagName", template: "template", stylesheet: "stylesheet" }
                        ],
                        _nodes: [<node>, <node>]
                    }
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
                ],
                useInheritance: true | false
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
            'http': new Dependency('http', http)
        });
        var injector = new Injector(globalDependencies);
        globalDependencies['injector'] = new Dependency('injector', injector);

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
                    throw new Error("Can't inject \"" + item + "\" to " + dependencyName + ". $view and $model injectables are available only for presenter constructor.");
                }
            });

            return new Dependency(dependencyName, { constructor: constructor, dependencies: dependencies || [] });
        };

        var canResolve = function (moduleDependencies, dependencies) {
            for (var dep of dependencies) {
                if (!(dep in moduleDependencies)) {
                    return false;
                }
            }

            return true;
        }

        var resolveDependenciesForModule = function (moduleName, dependencyList, moduleDependencies, injector) {
            var resolvedCount = 0;
            var tempList = shallowCopy(dependencyList);
            var resolvedIndices = [];

            while (resolvedCount !== dependencyList.length) {
                for (var i = 0; i < tempList.length; i++) {
                    if (tempList[i].value.dependencies.length === 0) {
                        var resolved = injector.inject(null, null, tempList[i].name, tempList[i].value.constructor, []);
                        moduleDependencies[tempList[i].name] = new Dependency(tempList[i].name, resolved);
                        resolvedIndices.push(i);
                        resolvedCount++;
                    } else {
                        if (canResolve(moduleDependencies, tempList[i].value.dependencies)) {
                            var resolved = injector.inject(null, null, tempList[i].name, tempList[i].value.constructor, tempList[i].value.dependencies);
                            moduleDependencies[tempList[i].name] = new Dependency(tempList[i].name, resolved);
                            resolvedIndices.push(i);
                            resolvedCount++;
                        }
                    }
                }

                if (resolvedIndices.length === 0) {
                    throw new Error("Failed to resolve modules for module '" + moduleName +
                        "'. Please make sure you do not have circular dependency or at least one of the list's dependencies can be resolved without invoking another ones.");
                }
                for (var i of resolvedIndices) {
                    tempList.splice(i, 1);
                }

                resolvedIndices = [];
            }

            return moduleDependencies;
        };

        this.module = function (moduleDescriptor) {
            validateModuleDescriptor(moduleDescriptor);

            modules[moduleDescriptor.name] = create();
            modules[moduleDescriptor.name].views = create();
            modules[moduleDescriptor.name].presenters = create();
            modules[moduleDescriptor.name].models = create();
            modules[moduleDescriptor.name].dependencies = create();
            modules[moduleDescriptor.name].submodules = [];

            for (var view of moduleDescriptor.views) {
                modules[moduleDescriptor.name].views[view.tagName] = create();
                modules[moduleDescriptor.name].views[view.tagName]._nodes = [];
                modules[moduleDescriptor.name].views[view.tagName]._viewList = [view];
                modules[moduleDescriptor.name].presenters[view.tagName] = view.presenter;
                modules[moduleDescriptor.name].models[view.tagName] = view.presenter.models;
            }

            var moduleDeps = shallowCopy(globalDependencies);
            var moduleInjector = new Injector(moduleDeps);
            modules[moduleDescriptor.name].dependencies = resolveDependenciesForModule(moduleDescriptor.name, moduleDescriptor.dependencies, moduleDeps, moduleInjector);
            modules[moduleDescriptor.name].injector = moduleInjector;

            for (var submodule of moduleDescriptor.submodules) {
                modules[moduleDescriptor.name].submodules.push(submodule);
            }

            modules[moduleDescriptor.name].inheritance = moduleDescriptor.inheritance || false;

            return modules[moduleDescriptor.name];
        };

        this.run = function (mainModule) {
            var htmlCompileEvent = new Event("HTMLCompiled");
            var dataCompileEvent = new Event("DataCompiled");

            //document.addEventListener("DOMContentLoaded", function () {
            for (var moduleName of Object.getOwnPropertyNames(modules)) {
                var viewList = Object.values(modules[moduleName].views);
                http.afterAll(viewList.map(function (view) {
                    return http.get(view._viewList[0].template);
                })).then(function (responses) {
                    for (let i = 0; i < responses.length; i++) {
                        for (let j = 0; j < viewList[i]._viewList.length; j++) {
                            viewList[i]._viewList[j].template = responses[i];
                        }
                    }

                    //var routeConfig = registerRoutes(routes);
                    //initializeRouting(routeConfig);
                    compileView(viewsById, modules[moduleName], modules[moduleName].injector);
                    document.dispatchEvent(htmlCompileEvent);
                    compileData(viewsById, modules[moduleName].views, modules[moduleName].inheritance);
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