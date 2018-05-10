define(["src/presenter"], function (presenter) {
    "use strict";

    function view(viewObject) {
        this.tagName = viewObject.tagName;
        this.template = viewObject.template;
        if (viewObject.stylesheet) {
            this.stylesheet = viewObject.stylesheet;
        }

        this.presenter = function (name, presenterFn, dependencies) {
            this.presenter = new presenter(name, presenterFn, dependencies);
            return this.presenter;
        }
    }

    view.prototype = {
        contructor: view,
    };

    return view;
});