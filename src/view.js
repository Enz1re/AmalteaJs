"use strict";

define(["src/presenter"], function (presenter) {
    function view(viewObject) {
        this.tagName = viewObject.tagName;
        this.template = viewObject.template;
        if (viewObject.stylesheetUrl) {
            this.stylesheet = viewObject.stylesheetUrl;
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