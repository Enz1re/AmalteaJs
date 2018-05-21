define(["src/presenter"], function (Presenter) {
    "use strict";

    function view(viewObject) {
        this.tagName = viewObject.tagName;
        this.template = viewObject.template;
        if (viewObject.stylesheet) {
            this.stylesheet = viewObject.stylesheet;
        }

        this.presenter = function (name, presenterFn, dependencies) {
			if (this.registeredPresenter) {
				throw new Error("Presenter for " + this.tagName + " is already registered");
			}
			
            this.registeredPresenter = new Presenter(name, presenterFn, dependencies);
            return this.registeredPresenter;
        }
    }

    view.prototype = {
        contructor: view,
    };

    return view;
});