define([], function () {
    "use strict";

    var traverseDOM = function (node, func) {
        func(node);
        node = node.firstChild;
        while (!!node) {
            traverseDOM(node, func);
            node = node.nextSibling;
        }
    }

    return traverseDOM;
});