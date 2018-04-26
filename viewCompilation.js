"use strict";

function traverseDOM(node, func) {
	func(node);
	node = node.firstChild;
	while (!!node) {
		traverseDOM(node, func);
		node = node.nextSibling;
	}
}

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
	name: "text",
	phone: "number"
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

var presenter1 = function ($view, $model, sos, hi) {
	return {
		src: "https://i.ytimg.com/vi/4-oDmlYgrNY/hqdefault.jpg",

		onclick1: function (e) {
			this.$model.MainModel.name = Math.random() + "";
		},

		_onInit: function () {
			this.$model.MainModel.onValueChanged(function (model, property, value) {
				if (Number.parseFloat(value) > 0.5) {
				    return false;
				}
				return true;
			}, true);
		}
	}
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

var arrow = true;
var funcArgs = arrow ? /^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m : /^(function)\s*[^\(]*\(\s*([^\)]*)\)/m;
var funcArgSplit = /,/;
var funcArg = /^\s*(_?)(.+?)\1\s*$/;
var stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function getFunctionArguments(func) {
    return ((func || '').toString().replace(stripComments, '').match(funcArgs) || ['', '', ''])[2]
        .split(funcArgSplit)
        .map(function (arg) {
            return arg.replace(funcArg, function (all, underscore, name) {
                return name.split('=')[0].trim();
            });
        })
        .filter(String);
}

function resolvePresenter(node, modelList, presenterFn, dependencies) {
    if (typeof presenterFn !== 'function') {
        // TODO: add presenter name in error message
        throw new Error("Presenter should be a function, not " + typeof presenterFn);
    }
    if (!Array.isArray(dependencies)) {
        // TODO: add presenter name in error message
        throw new Error("Dependency list should be an array, not " + typeof dependencies);
    }
    if (presenterFn.length !== dependencies.length) {
        // TODO: add presenter name in error message
        throw new Error("Number of parameters of presenter constructor function should be equal with to a number of dependencies.");
    }
    for (var depName of dependencies) {
        if (!(depName in registeredDependencies)) {
            // TODO: add presenter name in error message
            throw new Error("Unknown dependency: " + depName + ". Be sure you registered this dependency or spelled its name right.");
        }
    }

    var presenter = presenterFn();
    var presenterFnArguments = getFunctionArguments(presenterFn);

    for (var i = 0; i < dependencies.length; i++) {
        if (!!presenter[presenterFnArguments[i]]) {
            // TODO: add presenter name in error message
            throw new Error("Duplicate dependency: '" + dependencies[i] + "'");
        }
        switch (dependencies[i]) {
            case '$view':
                presenter[presenterFnArguments[i]] = new $view(node, presenter);
                break;
            case '$model':
                presenter[presenterFnArguments[i]] = new $model(modelList, node, presenter);
                break;
            default:
                presenter[presenterFnArguments[i]] = registeredDependencies[dependencies[i]];
        }
    }
    
    return presenter;
}

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

var markedNodes = {};
var htmlRenderedViews = {};
var nodeId = 0;
var presenterCache = new CacheObject();

function processNode(node) {
	if (node.nodeType !== 1) {
		return;
	}

	var tagName = node.tagName.toLowerCase();
	if (!!viewsObject[tagName]) {
	    if (amaltea.isUndefined(markedNodes[tagName])) {
			markedNodes[tagName] = nodeId;
			nodeId++;
		}

		var isolationAttribute = "am" + markedNodes[tagName];
		node.setAttribute(isolationAttribute, "");
		node.setAttribute("view-id", markedNodes[tagName]);

		node.innerHTML = viewsObject[tagName].template;

		traverseDOM(node, function (node) {
			if (node.nodeType === 1 && !viewsObject[node.tagName.toLowerCase()]) {
				node.setAttribute(isolationAttribute, "");
				node.setAttribute("view-id", markedNodes[tagName]);
			}
		});

		var presenter = presenterCache.get(tagName);
		if (!presenter) {
		    presenter = resolvePresenter(node, models[tagName], presenters[tagName].p, presenters[tagName].d);
		    presenterCache.put(tagName, presenter);
		}
		viewsObject[tagName].presenter = presenter;

		if (viewsObject[tagName].presenter._onInit) {
			viewsObject[tagName].presenter._onInit();
		}
		var $model = viewsObject[tagName].presenter.$model;
		if ($model) {
		    for (var modelName of Object.getOwnPropertyNames($model)) {
		        if (!$model[modelName]._watch) {
		            $model[modelName].onValueChanged(null, false);
		        }
		    }
		}
		if (viewsObject[tagName].stylesheetUrl && !htmlRenderedViews[tagName]) {
			htmlRenderedViews[tagName] = true;
			http.get(viewsObject[tagName].stylesheetUrl).then(function (css) {
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
}

function placeHtml() {
	var result = detectCircularDependencies(views);
	if (result.status !== "ok") {
		throw new Error(result.status + ":", result.chain.reduce(function (str, dep, index, array) {
			return str += dep + (index !== array.length - 1 ? "->" : ".");
		}, result.parent + "->"));
	}

	for (var view of views) {
		validateHtml(view.template);
	}

	traverseDOM(document.body, processNode);
}

var dependencyTrees = {};

function detectCircularDependencies(viewList) {
	try {
		for (var view of viewList) {
			var viewDependencies = [];
			gatherDependentViews(getViewHTMLNode(view), view.tagName, viewDependencies);
		}
		return { status: "ok" };
	} catch (e) {
		return e;
	}
}

function gatherDependentViews(node, parentView, dependencies) {
	if (node.nodeType === 1 && viewsObject.hasOwnProperty(node.tagName.toLowerCase())) {
		checkViewNode(node, parentView, dependencies);
	}

	node = node.firstChild;
	while (!!node) {
		gatherDependentViews(node, parentView, dependencies);
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

function getViewHTMLNode(view) {
	var container = document.createElement('div');
	container.innerHTML = view.innerHTML;
	return container;
}
