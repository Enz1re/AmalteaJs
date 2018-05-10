define([
    "src/cache",
    "src/http",

    "src/core/contains",
    "src/core/create",
    "src/core/shallowCopy",
    "src/core/traverseDOM",
    "src/core/isUndefined"
], function (cache, http, contains, create, shallowCopy, traverseDOM, isUndefined) {
    "use strict";

    var openingTagRegex = /<[a-zA-Z]+(>|.*?[^?]>)/gi;
    var closingTagRegex = /<\/[a-zA-Z]+(>|.*?[^?]>)/gi;
    var tagRegex = /<(.+)>/gi;
    var boundContentRegex = /{[^{}]+}/gi;

    function getTagListWithoutAttributes(list) {
        return list.map(function (element, index, array) {
            var tokens = element.split(' ');
            if (tokens.length <= 1) {
                return element;
            }
            var last = array.length - 1;
            // < div >
            if (tokens[0] === '<' && tokens[last] === '>') {
                return '<' + tokens[1] + '>';
            }
            // <div >
            if (tokens[0] !== '<' && tokens[last] === '>') {
                return tokens[0] + '>';
            }
            // < div>
            if (tokens[0] === '<' && tokens[last] !== '>') {
                return '<' + tokens[1] + '>';
            }
            // <div class="">
            if (tokens[0] !== '<' && tokens[last] !== '>') {
                return tokens[0] + '>';
            }
        });
    }

    function validateHtml(html) {
        /*
        var openingTags = getTagListWithoutAttributes(html.match(openingTagRegex));
        var closingTags = getTagListWithoutAttributes(html.match(closingTagRegex));
    
        for (var i = 0, j = closingTags.length - 1; i < openingTags.length || j >= 0; i++, j--) {
            if (openingTags[i].toLowerCase() !== closingTags[j].toLowerCase().replace('/', '')) {
                console.warn("Unexpected closing tag " + closingTags[j] + ". " + "Expected </" + tagRegex.exec(openingTags[i])[1] + ">");
            }
        }
        */
    }

    function setStyleElementContents(style, css) {
        if (style.styleSheet) {		// IE
            style.styleSheet.cssText = css;
        } else {                // the world
            style.appendChild(document.createTextNode(css));
        }
    }

    function getStyleSheet(style) {
        document.body.appendChild(style);
        var styleSheet = style.sheet;
        document.body.removeChild(style);
        return styleSheet;
    }

    var forbiddenIsolationCSSselectors = {
        "html": true,
        "head": true,
        "body": true,
        "title": true,
        "link": true,
        "meta": true
    };

    function getViewHTMLNode(view) {
        var container = document.createElement('div');
        container.innerHTML = view.innerHTML;
        return container;
    }

    function detectCircularDependencies(viewsObject) {
        try {
            for (var viewName of Object.getOwnPropertyNames(viewsObject)) {
                var viewDependencies = [];
                gatherDependentViews(getViewHTMLNode(viewsObject[viewName]), viewsObject[viewName].tagName, viewDependencies, viewsObject);
            }
            return { status: "ok" };
        } catch (e) {
            return e;
        }
    }

    function gatherDependentViews(node, parentView, dependencies, viewsObject) {
        if (node.nodeType === 1 && (node.tagName.toLowerCase() in viewsObject)) {
            checkViewNode(node, parentView, dependencies);
        }

        node = node.firstChild;
        while (!!node) {
            gatherDependentViews(node, parentView, dependencies, viewsObject);
            node = node.nextSibling;
        }
    }

    function checkViewNode(node, parentView, dependencies) {
        var tagName = node.tagName.toLowerCase();
        if (contains(dependencies, tagName)) {
            // in case if there is an unresolved self-dependency in dependent view
            if (dependencies[dependencies.length - 1] === tagName) {
                dependencies.push(tagName);
            }
            throw { status: "$circulardep", parent: parentView, chain: dependencies };
        }
        if (contains(tagNames, tagName) && !contains(dependencies, tagName)) {
            dependencies.push(tagName);
            node.innerHTML = viewsObject[tagName].innerHTML;
        }
    }

    var markedNodes = create();
    var htmlRenderedViews = create();
    var nodeId = 0;
    var indexes = create();
    var presenterCache = cache.create('presenters');

    function placeHtml(viewsById, module, injector) {
        var result = detectCircularDependencies(module.views);
        if (result.status !== "ok") {
            throw new Error(result.status + ":", result.chain.reduce(function (str, dep, index, array) {
                return str += dep + (index !== array.length - 1 ? "->" : ".");
            }, result.parent + "->"));
        }

        /*
        for (var view of views) {
            validateHtml(view.template);
        }
        */

        traverseDOM(document.body, function (node) {
            if (node.nodeType !== 1) {
                return;
            }

            var tagName = node.tagName.toLowerCase();
            if (tagName in module.views) {
                if (!(tagName in markedNodes)) {
                    markedNodes[tagName] = nodeId++;
                }
                if (!(tagName in indexes)) {
                    indexes[tagName] = 0;
                } else {
                    indexes[tagName]++;
                }
                
                if (!isUndefined(viewsById[markedNodes[tagName]]) && isUndefined(module.views[tagName]._viewList[indexes[tagName]])) {
                    module.views[tagName]._viewList.push(
                        shallowCopy(module.views[tagName]._viewList[module.views[tagName]._viewList.length - 1])
                    );
                }
                module.views[tagName]._nodes = module.views[tagName]._nodes || [];

                var isolationAttribute = "am" + markedNodes[tagName];
                node.setAttribute(isolationAttribute, "");
                node.setAttribute("view-id", markedNodes[tagName]);
                node.setAttribute("am-index", indexes[tagName]);
                node.innerHTML = module.views[tagName]._viewList[indexes[tagName]].template;
                viewsById[markedNodes[tagName]] = module.views[tagName]._viewList[indexes[tagName]];

                traverseDOM(node, function (node) {
                    if (node.nodeType === 1 && (tagName in module.views)) {
                        node.setAttribute(isolationAttribute, "");
                        node.setAttribute("view-id", markedNodes[tagName]);
                        node.setAttribute("am-index", indexes[tagName]);
                    }
                });

                var presenter = injector.inject(node, module.models[tagName], module.presenters[tagName].p.name, module.presenters[tagName].p.constructor, module.presenters[tagName].d);
                module.views[tagName]._viewList[indexes[tagName]].presenter = presenter;
                module.views[tagName]._nodes.push(node);

                if (module.views[tagName]._viewList[indexes[tagName]].presenter._onInit) {
                    module.views[tagName]._viewList[indexes[tagName]].presenter._onInit();
                }

                if (module.views[tagName]._viewList[indexes[tagName]].presenter) {
                    var $model;
                    for (var prop of Object.getOwnPropertyNames(module.views[tagName]._viewList[indexes[tagName]].presenter)) {
                        if (module.views[tagName]._viewList[indexes[tagName]].presenter[prop]) {
                            if (!!module.views[tagName]._viewList[indexes[tagName]].presenter[prop]._model) {
                                $model = module.views[tagName]._viewList[indexes[tagName]].presenter[prop];
                            }
                        }
                    }

                    if ($model) {
                        for (var modelName of Object.getOwnPropertyNames($model)) {
                            if ($model[modelName]._watch !== undefined && !$model[modelName]._watch) {
                                $model[modelName].onValueChanged(null, false);
                            }
                        }
                    }
                }

                if (module.views[tagName]._viewList[indexes[tagName]].stylesheet && !htmlRenderedViews[tagName]) {
                    htmlRenderedViews[tagName] = true;
                    http.get(module.views[tagName]._viewList[indexes[tagName]].stylesheet).then(function (css) {
                        var style = document.createElement("style");
                        style.setAttribute("type", "text/css");

                        setStyleElementContents(style, css);

                        // WebKit hack
                        style.appendChild(document.createTextNode(""));

                        var styleSheet = getStyleSheet(style);
                        var newCss = "";

                        for (var cssRule of styleSheet.cssRules) {
                            if (forbiddenIsolationCSSselectors[cssRule.selectorText]) {
                                throw new Error(cssRule.selectorText + " is forbidden in isolated stylesheets");
                            }
                            cssRule.selectorText = cssRule.selectorText + "[" + isolationAttribute + "]";
                            newCss += cssRule.cssText.replace(' ', '');
                        }

                        style.innerText = "";
                        setStyleElementContents(style, newCss);
                        document.head.appendChild(style);
                    });
                }
            }
        });
    }

    return placeHtml;
});