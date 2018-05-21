define([], function () {
    "use strict";

    var getObject = function (mainObject, callString) {
		var object = mainObject;
        var prev = mainObject;
        var callChain = callString.split('.');
        var prop = callChain[callChain.length - 1].replace('()', '');
		callChain.splice(0, 1);
        callChain.splice(callChain.length - 1, 1);
		
        for (var callee of callChain) {
            if (callee.indexOf('(') !== -1 || callee.indexOf(')') !== -1) {
                if (matchesFunctionCall(callee)) {
                    var functionName = callee.replace('()', '');
                    object = prev[functionName].call(prev);
                } else {
                    throw new Error("Syntax error: " + callee);
                }
            } else {
                if (!(callee in prev)) {
                    throw new Error("Presenter has no member called '" + callee + "'");
                }
                object = prev[callee];
            }

            prev = object;
        }

		if (!(prop in object)) {
			throw new Error("Presenter has no member called '" + prop + "'");
		}
		
        return { object: object, prop: prop };
    };

    return getObject;
});