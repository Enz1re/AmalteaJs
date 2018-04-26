"use strict";

var functionRegex = /.+\(([\w, ]*)\)/gi;

function matchesFunctionCall(exp) {
	return !!exp.match(functionRegex);
}

function getNestedViews(node, views) {
	node = node.firstElementChild;
	while (!!node) {
		var tagName = node.tagName.toLowerCase();
		if (!viewsObject[tagName]) {
			getNestedViews(node, views);
		} else {
			views.push({ view: viewsObject[tagName], node: node });
		}
		node = node.nextElementSibling;
	}
}

function gatherRootViewObjects(node, rootViews) {
	var rootViews = [];

	for (var child of node.children) {
		if (child.nodeType === 1) {
			var tagName = child.tagName.toLowerCase();
			if (viewsObject[tagName]) {
				rootViews.push({ view: viewsObject[tagName], node: child });
			} else {
				getNestedViews(child, rootViews);
			}
		}
	}

	return rootViews;
}

var viewsById = {};

function buildInheritanceTree() {
	var inheritanceTree = { name: "root", deps: [] };
	var rootViews = [];
	var rootDocumentViews = gatherRootViewObjects(document.body, rootViews);

	for (var viewObj of rootDocumentViews) {
		var nodeDependencies = [];
		viewsById[viewObj.node.attributes.getNamedItem("view-id").value] = viewObj.view;
		resolveNestedViewsInheritance(viewObj.node, nodeDependencies, viewObj.view.presenter);
		inheritanceTree.deps.push({ presenter: viewObj.view.presenter, deps: nodeDependencies });
	}
}

var useInheritance = true;
var markedNodes = {};

function resolveNestedViewsInheritance(node, inheritanceTree, presenterBase) {
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
			resolveNestedViewsInheritance(node, deps, presenter);
		}

		resolveNestedViewsInheritance(node, deps, presenter);
		node = node.nextElementSibling;
	}
}

function viewPromise(view) {
	return http.get(view.templateUrl);
}

var viewPromises = views.map(function (view) {
	return viewPromise(view);
});

function afterEach(promises, callback) {
	callback = callback || function () {};
	promises.forEach(function (promise) {
		promise.then(callback);
	});
}

function afterAll(promises) {
	var counter = promises.length;
	var result = [];
	return new Promise(function (resolve, reject) {
		promises.forEach(function (promise, i) {
			promise.then(function (response) {
				result[i] = response;
				if (!(--counter)) {
					resolve(result);
				}
			}, function (failure) {
				reject(failure);
			});
		});
	});
}

function bindInitial() {
	var amSrcAttributes = document.querySelectorAll("[am-src]");
	for (var amSrcElement of amSrcAttributes) {
	    var callString = amSrcElement.getAttribute("am-src");
		var presenter = viewsById[amSrcElement.getAttribute("view-id")].presenter;
		amSrcElement.setAttribute("src", amaltea.getResult(presenter, callString));
	}
	var amClickAttributes = document.querySelectorAll("[am-click]");
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
	var oneWayBindings = document.getElementsByTagName("_am-bind");
	for (var oneWayBinding of oneWayBindings) {
		var callString = oneWayBinding.getAttribute("value");
		var presenter = viewsById[oneWayBinding.parentElement.getAttribute("view-id")].presenter;
		oneWayBinding.textContent = amaltea.getResult(presenter, callString);
	}
	var twoWayBindings = document.querySelectorAll("[am-value]");
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
		    presenter[objData.prop] = this.value;
		    var oneWayBindings = document.getElementsByTagName("_am-bind");
		    for (var oneWayBinding of oneWayBindings) {
		        var callString = oneWayBinding.getAttribute("value");
		        var presenter = viewsById[oneWayBinding.parentElement.getAttribute("view-id")].presenter;
		        oneWayBinding.textContent = amaltea.getResult(presenter, callString);
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
	            if (excludeElements[child.tagName]) {
	                break;
				}

	            matchText(child, regex, callback, excludeElements);
	            break;
	        case 3:
	            var bk = 0;
	            child.data.replace(regex, function(all) {
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

var htmlCompileEvent = new Event("HTMLCompiled");
var dataCompileEvent = new Event("DataCompiled");

document.addEventListener("DOMContentLoaded", function () {
	window.viewCache = cache.create('viewCache');

	afterAll(viewPromises).then(function (responses) {
		for (let i = 0; i < views.length; i++) {
			views[i].template = responses[i];
			viewCache.put(views[i].tagName, views[i].template);
		}

		//var routeConfig = registerRoutes(routes);
		//initializeRouting(routeConfig);
		placeHtml();
		document.dispatchEvent(htmlCompileEvent);
		buildInheritanceTree();
		document.dispatchEvent(dataCompileEvent);
		matchText(document.body, /{.[^{}]+}/g, function (node, match, offset) {
			var amBind = document.createElement("_am-bind");
			amBind.setAttribute("value", match.replace('{', '').replace('}', ''));
			node.parentNode.insertBefore(amBind, node.nextSibling);
			return amBind;
		});
		bindInitial();
		console.log(viewsById);
		console.log(markedNodes);
	});
});
