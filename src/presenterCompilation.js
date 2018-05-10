define([
    "src/core/mergeCopy",
    "src/core/mergeArrays"
], function (mergeCopy, mergeArrays) {
    "use strict";

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
                views.push({ view: viewsObject[tagName]._viewList[node.getAttribute('am-index')], node: node });
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
                    rootViews.push({ view: viewsObject[tagName]._viewList[child.getAttribute('am-index')], node: child });
                } else {
                    getNestedViews(child, rootViews, viewsObject);
                }
            }
        }

        return rootViews;
    }

    function buildInheritanceTree(viewsById, viewsObject) {
        var rootViews = [];
        var rootDocumentViews = gatherRootViewObjects(document.body, rootViews, viewsObject);

        for (var viewObj of rootDocumentViews) {
            resolveNestedViewsInheritance(viewObj.node, viewObj.view.presenter, viewsObject, viewsById);
        }
    }

    function resolveNestedViewsInheritance(node, presenterBase, viewsObject, viewsById) {
        node = node.firstElementChild;
        while (!!node) {
            var tagName = node.tagName.toLowerCase();
            if (!!viewsObject[tagName]) {
                var presenter = mergeCopy(presenterBase, viewsObject[tagName]._viewList[node.getAttribute('am-index')].presenter);
                viewsObject[tagName]._viewList[node.getAttribute('am-index')].presenter = presenter;
                resolveNestedViewsInheritance(node, presenter, viewsObject, viewsById);
            }

            resolveNestedViewsInheritance(node, presenter, viewsObject, viewsById);
            node = node.nextElementSibling;
        }
    }

    var getPresenter = function (viewsById, viewsObject, viewId, viewIndex) {
        return viewsObject[viewsById[viewId].tagName]._viewList[viewIndex].presenter;
    }

    var events = {
        'input#text': ['keyup'],
        'input#url': ['keyup'],
        'input#button': ['click'],
        'button': ['click'],
        'input#submit': ['click'],
        'input#checkbox': ['change'],
        'input#color': ['change'],
        'input#date': ['change'],
        'input#datetime-local': ['change'],
        'input#email': ['keyup'],
        'input#file': ['change'],
        'input#radio': ['change'],
        'textarea': ['keyup'],
        'input#number': ['keyup', 'input'],
        'select': ['change'],
        'fieldset': ['change'],
    };

    function bindInitial(viewsById, viewsObject, nodeList) {
        for (var subnodes of nodeList) {
            for (var node of subnodes) {
                var amSrcAttributes = node.querySelectorAll('[am-src]');
                for (var amSrcElement of amSrcAttributes) {
                    var callString = amSrcElement.getAttribute('am-src');
                    var presenter = getPresenter(viewsById, viewsObject, amSrcElement.getAttribute('view-id'), amSrcElement.getAttribute('am-index'));
                    amSrcElement.setAttribute('src', amaltea.getResult(presenter, callString));
                }
                var amClickAttributes = node.querySelectorAll('[am-click]');
                for (var amClickElement of amClickAttributes) {
                    var amClick = amClickElement.getAttribute('am-click');
                    var onClick = amClickElement.getAttribute('onclick');

                    if (!!onClick && !!amClick) {
                        throw new Error("onclick and am-click on the same element are not allowed: onclick=\"" + onClick + "\" am-click=\"" + amClick + "\"");
                    }

                    var presenter = getPresenter(viewsById, viewsObject, amClickElement.getAttribute('view-id'), amClickElement.getAttribute('am-index'));
                    var objData = amaltea.getObject(presenter, amClick);
                    var fn = objData.object[objData.prop];
                    amClickElement.onclick = fn.bind(presenter);
                }
                matchText(node, /{.[^{}]+}/g, function (node, match, offset) {
                    var amBind = document.createElement('_am-bind');
                    amBind.setAttribute('value', match.replace('{', '').replace('}', ''));
                    node.parentNode.insertBefore(amBind, node.nextSibling);
                    return amBind;
                });
                var oneWayBindings = node.getElementsByTagName('_am-bind');
                for (var oneWayBinding of oneWayBindings) {
                    var callString = oneWayBinding.getAttribute('value');
                    var presenter = getPresenter(viewsById, viewsObject, oneWayBinding.parentElement.getAttribute('view-id'), oneWayBinding.parentElement.getAttribute('am-index'));
                    oneWayBinding.textContent = amaltea.getResult(presenter, callString);
                }

                (function () {
                    var twoWayBindings = node.querySelectorAll('[am-value]');
                    for (var twoWayBinding of twoWayBindings) {
                        var objData = amaltea.getObject(getPresenter(viewsById, viewsObject, twoWayBinding.getAttribute('view-id'), twoWayBinding.getAttribute('am-index')), twoWayBinding.getAttribute('am-value'));
                        var value = objData.object[objData.prop];
                        if (typeof value === 'function') {
                            throw new Error("Two data-binding to function is not allowed")
                        }

                        var tag = twoWayBinding.tagName.toLowerCase();
                        var fieldType = tag + (tag === 'input' ? '#' + twoWayBinding.type : '');
                        twoWayBinding.value = value;

                        for (var event of events[fieldType]) {
                            twoWayBinding['on' + event] = function (e) {
                                var presenter = getPresenter(viewsById, viewsObject, this.getAttribute('view-id'), this.getAttribute('am-index'));
                                var callString = this.getAttribute('am-value');
                                var objData = amaltea.getObject(presenter, callString);
                                var before = objData.object[objData.prop];
                                objData.object[objData.prop] = this.value;
                                var after = objData.object[objData.prop];

                                // if the value didn't pass validation (its value hasn't changed)
                                // and input field has 'am-invalidate' attribute, don't update input input field,
                                // if input field doesn't have 'am-invalidate' attribute, don't update bindings
                                // if value passed the validation successfully, update bindings
                                if (before === after) {
                                    if (this.getAttribute('am-invalidate') !== null) {
                                        this.value = before;
                                    }
                                } else {
                                    var oneWayBindings = Array.prototype.slice.call(node.getElementsByTagName('_am-bind')).filter(function (node) { return node.getAttribute('value') === callString; });
                                    for (var oneWayBinding of oneWayBindings) {
                                        oneWayBinding.textContent = after;
                                    }

                                    var twoWayBindings = Array.prototype.slice.call(this.querySelectorAll('[am-value]')).filter(function (node) { return node.getAttribute('am-value') === callString; });
                                    for (var twoWayBinding of twoWayBindings) {
                                        if (twoWayBinding !== this) {
                                            twoWayBinding.value = after;
                                        }
                                    }
                                }
                            };
                        }
                    }
                })();
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

    return function (viewsById, viewsObject, useInheritance) {
        if (useInheritance) {
            buildInheritanceTree(viewsById, viewsObject);
        }

        var nodes = Object.values(viewsObject).map(function (view) { return view._nodes });

        bindInitial(viewsById, viewsObject, nodes);
    };
});