"use strict";

define([
    "src/cache",
    "src/core/create"
], function (cache, create) {
    function traverseDOM(node, func) {
        func(node);
        node = node.firstChild;
        while (!!node) {
            traverseDOM(node, func);
            node = node.nextSibling;
        }
    }

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
        if (amaltea.contains(dependencies, tagName)) {
            // in case if there is an unresolved self-dependency in dependent view
            if (dependencies[dependencies.length - 1] === tagName) {
                dependencies.push(tagName);
            }
            throw { status: "$circulardep", parent: parentView, chain: dependencies };
        }
        if (amaltea.contains(tagNames, tagName) && !amaltea.contains(dependencies, tagName)) {
            dependencies.push(tagName);
            node.innerHTML = viewsObject[tagName].innerHTML;
        }
    }

    var markedNodes = create();
    var htmlRenderedViews = create();
    var nodeId = 0;
    var presenterCache = cache.create('presenters');

    function placeHtml(module, injector) {
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
            if (!!module.views[tagName]) {
                if (amaltea.isUndefined(markedNodes[tagName])) {
                    markedNodes[tagName] = nodeId;
                    nodeId++;
                }

                var isolationAttribute = "am" + markedNodes[tagName];
                node.setAttribute(isolationAttribute, "");
                node.setAttribute("view-id", markedNodes[tagName]);

                node.innerHTML = module.views[tagName].template;

                traverseDOM(node, function (node) {
                    if (node.nodeType === 1 && !module.views[node.tagName.toLowerCase()]) {
                        node.setAttribute(isolationAttribute, "");
                        node.setAttribute("view-id", markedNodes[tagName]);
                    }
                });

                var presenter = presenterCache.get(tagName);
                if (!presenter) {
                    presenter = injector.inject(node, module.models[tagName], module.presenters[tagName].p.name, module.presenters[tagName].p.constructor, module.presenters[tagName].d);
                    presenterCache.put(tagName, presenter);
                }
                module.views[tagName].presenter = presenter;
                module.views[tagName]._node = node;

                if (module.views[tagName].presenter._onInit) {
                    module.views[tagName].presenter._onInit();
                }
                var $model = module.views[tagName].presenter.$model;
                if ($model) {
                    for (var modelName of Object.getOwnPropertyNames($model)) {
                        if (!$model[modelName]._watch) {
                            $model[modelName].onValueChanged(null, false);
                        }
                    }
                }
                if (module.views[tagName].stylesheetUrl && !htmlRenderedViews[tagName]) {
                    htmlRenderedViews[tagName] = true;
                    http.get(module.views[tagName].stylesheetUrl).then(function (css) {
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

/*
var view1 = {
	tagName: "my-tag",
	templateUrl: "myTag.html",
};
var view2 = {
	tagName: "other-tag",
	templateUrl: "otherTag.html",
};
var view3 = {
	tagName: "my-tag-2",
	templateUrl: "myTag2.html",
};
var view4 = {
	tagName: "my-tag-3",
	templateUrl: "myTag3.html",
	stylesheetUrl: "style.css"
};
var model1 = {
	
};

var model2 = {
    name: { type: "text", value: "Kostia" },
    age: { type: "number", value: 22 },
    status: {
        type: "select", value: "Free", values: [
            "Busy",
            "Free"
        ]
    }
};

var model3 = {
	name: "text"
};

var registeredDependencies = {
    'sos': { sos: 420 },
    'hello': { hello: 9000 },
    'hi': 420,
    'hey': 'hey',
    '$view': true,
    '$model': true
};

var presenter2 = function ($view, kek, mda) {
    return {
        index: 0,
		src: "http://i0.kym-cdn.com/entries/icons/original/000/020/401/HereDatBoi.jpg",

		onclick2: function (e) {
		    this.$view.list1.addItem("Hello");
		},

		onclick22: function (e) {
		    this.$view.list1.removeItem(this.index);
		}
	}
};

var presenter3 = function($view, hi) {
	return {
		text: "",
		src: "http://i0.kym-cdn.com/entries/icons/original/000/020/401/HereDatBoi.jpg",

		onclick3: function (e) {
			console.log("Presenter3");
		},

		presenter3Method: function () {
			this.text = "My text";
		}
	}
};

var presenter4 = function ($view, $model, kek, sos) {
    return {
		text: "Kostia",
		src: "https://i.ytimg.com/vi/4-oDmlYgrNY/hqdefault.jpg",
		number: 42,

		get42: function () {
			return 42;
		},

		onGoClick: function () {
			console.log("SOS");
		},

		printModel: function () {
		    console.log(this.$model.SecondaryModel.name);
		    console.log(this.$model.SecondaryModel.age);
		    console.log(this.$model.SecondaryModel.status);
		}
	}
};

var views = [view1, view2, view3, view4];
var tagNames = views.map(function (view) { return view.tagName; });
var viewsObject = {
	"my-tag": view1,
	"other-tag": view2,
	"my-tag-2": view3,
	"my-tag-3": view4
};
var models = {
	"my-tag": [{ name: "MainModel", model: model1}],
	"other-tag": [{ name: "SecondaryModel", model: model2}],
	"my-tag-2": [{ name: "ThirdModel", model: model3}],
	"my-tag-3": [{ name: "SecondaryModel", model: model2}]
};
var presenters = {
    "my-tag": { p: presenter1, d: ['$view', '$model', 'sos', 'hi'] },
    "other-tag": { p: presenter2, d: ['$view', 'hey', 'hello'] },
    "my-tag-2": { p: presenter3, d: ['$view', 'hi'] },
    "my-tag-3": { p: presenter4, d: ['$view', '$model', 'hello', 'hey'] }
};
*/