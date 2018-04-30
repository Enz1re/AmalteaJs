"use strict";

define([], function () {
    var functionRegex = /.+\(([\w, ]*)\)/gi;

    function matchesFunctionCall(exp) {
        return !!exp.match(functionRegex);
    }

    function getNestedViews(node, views, viewsObject) {
        node = node.firstElementChild;
        while (!!node) {
            var tagName = node.tagName.toLowerCase();
            if (!viewsObject[tagName]) {
                getNestedViews(node, views, viewsObject);
            } else {
                views.push({ view: viewsObject[tagName], node: node });
            }
            node = node.nextElementSibling;
        }
    }

    function gatherRootViewObjects(node, rootViews, viewsObject) {
        var rootViews = [];

        for (var child of node.children) {
            if (child.nodeType === 1) {
                var tagName = child.tagName.toLowerCase();
                if (viewsObject[tagName]) {
                    rootViews.push({ view: viewsObject[tagName], node: child });
                } else {
                    getNestedViews(child, rootViews, viewsObject);
                }
            }
        }

        return rootViews;
    }

    function buildInheritanceTree(viewsById, viewsObject) {
        var inheritanceTree = { name: "root", deps: [] };
        var rootViews = [];
        var rootDocumentViews = gatherRootViewObjects(document.body, rootViews, viewsObject);

        for (var viewObj of rootDocumentViews) {
            var nodeDependencies = [];
            viewsById[viewObj.node.attributes.getNamedItem("view-id").value] = viewObj.view;
            resolveNestedViewsInheritance(viewObj.node, nodeDependencies, viewObj.view.presenter, viewsObject, viewsById);
            inheritanceTree.deps.push({ presenter: viewObj.view.presenter, deps: nodeDependencies });
        }

        return inheritanceTree;
    }

    var useInheritance = true;

    function resolveNestedViewsInheritance(node, inheritanceTree, presenterBase, viewsObject, viewsById) {
        node = node.firstElementChild;
        while (!!node) {
            var deps = [];
            var tagName = node.tagName.toLowerCase();
            if (!!viewsObject[tagName]) {
                var presenter = useInheritance ?
                                amaltea.mergeCopy(presenterBase, viewsObject[tagName].presenter) :
                                viewsObject[tagName].presenter;
                viewsById[node.getAttribute("view-id")] = viewsObject[tagName];
                inheritanceTree.push({ presenter: presenter, deps: deps });
                resolveNestedViewsInheritance(node, deps, presenter, viewsObject, viewsById);
            }

            resolveNestedViewsInheritance(node, deps, presenter, viewsObject, viewsById);
            node = node.nextElementSibling;
        }
    }

    function bindInitial(viewsById, nodeList) {
        for (var node of nodeList) {
            var amSrcAttributes = node.querySelectorAll("[am-src]");
            for (var amSrcElement of amSrcAttributes) {
                var callString = amSrcElement.getAttribute("am-src");
                var presenter = viewsById[amSrcElement.getAttribute("view-id")].presenter;
                amSrcElement.setAttribute("src", amaltea.getResult(presenter, callString));
            }
            var amClickAttributes = node.querySelectorAll("[am-click]");
            for (var amClickElement of amClickAttributes) {
                var amClick = amClickElement.getAttribute("am-click");
                var onClick = amClickElement.getAttribute("onclick");

                if (!!onClick && !!amClick) {
                    throw new Error("onclick and am-click on the same element are not allowed: onclick=\"" + onClick + "\" am-click=\"" + amClick + "\"");
                }

                var presenter = viewsById[amClickElement.getAttribute("view-id")].presenter;
                var objData = amaltea.getObject(presenter, amClick);
                var fn = objData.object[objData.prop];
                amClickElement.onclick = fn.bind(presenter);
            }
            matchText(node, /{.[^{}]+}/g, function (node, match, offset) {
                var amBind = document.createElement("_am-bind");
                amBind.setAttribute("value", match.replace('{', '').replace('}', ''));
                node.parentNode.insertBefore(amBind, node.nextSibling);
                return amBind;
            });
            var oneWayBindings = node.getElementsByTagName("_am-bind");
            for (var oneWayBinding of oneWayBindings) {
                var callString = oneWayBinding.getAttribute("value");
                var presenter = viewsById[oneWayBinding.parentElement.getAttribute("view-id")].presenter;
                oneWayBinding.textContent = amaltea.getResult(presenter, callString);
            }
            var twoWayBindings = node.querySelectorAll("[am-value]");
            for (var twoWayBinding of twoWayBindings) {
                var objData = amaltea.getObject(viewsById[twoWayBinding.getAttribute("view-id")].presenter, twoWayBinding.getAttribute("am-value"));
                var value = objData.object[objData.prop];
                if (typeof value === 'function') {
                    throw new Error("Two data-binding to function is not allowed")
                }
                twoWayBinding.value = value;
                twoWayBinding.onkeyup = function (e) {
                    var presenter = viewsById[this.getAttribute("view-id")].presenter;
                    var objData = amaltea.getObject(presenter, this.getAttribute("am-value"));
                    var before = objData.object[objData.prop];
                    objData.object[objData.prop] = this.value;
                    var after = objData.object[objData.prop];
                    
                    if (this.getAttribute("am-invalidate") !== null && before === after) {
                        this.value = before;
                    }

                    var oneWayBindings = document.getElementsByTagName("_am-bind");
                    for (var oneWayBinding of oneWayBindings) {
                        var callString = oneWayBinding.getAttribute("value");
                        var presenter = viewsById[oneWayBinding.parentElement.getAttribute("view-id")].presenter;
                        oneWayBinding.textContent = amaltea.getResult(presenter, callString);
                    }
                }
            }
        }
    }

    var excludeElements = {
        SCRIPT: true,
        STYLE: true,
        IFRAME: true,
        CANVAS: true
    };

    function matchText(node, regex, callback) {
        var child = node.firstChild;

        while (child) {
            switch (child.nodeType) {
                case 1:
                    if (child.tagName in excludeElements) {
                        break;
                    }

                    matchText(child, regex, callback);
                    break;
                case 3:
                    var bk = 0;
                    child.data.replace(regex, function (all) {
                        var args = [].slice.call(arguments),
                            offset = args[args.length - 2],
                            newTextNode = child.splitText(offset + bk), tag;
                        bk -= child.data.length + all.length;

                        newTextNode.data = newTextNode.data.substr(all.length);
                        tag = callback.apply(window, [child].concat(args));
                        child.parentNode.insertBefore(tag, newTextNode);
                        child = newTextNode;
                    });

                    regex.lastIndex = 0;
                    break;
            }

            child = child.nextSibling;
        }

        return node;
    }

    var routes = [
        { view: 'my-tag', url: '/' },
        { router: 'main', view: 'other-tag', url: '/main' },
        { router: 'main', view: 'my-tag-2', url: '/other' },
        { router: 'secondary', view: 'my-tag-3', url: '/secondary' },
    ];

    return function (viewsById, viewsObject) {
        buildInheritanceTree(viewsById, viewsObject);

        var nodes = Object.values(viewsObject).map(function (view) { return view._node });

        bindInitial(viewsById, nodes);
    };
});