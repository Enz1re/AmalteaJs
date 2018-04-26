function view(viewObject) {
    this.view = viewObject;
}

view.prototype = {
    contructor: view,

    presenter: function (name, presenterFn, dependencies) {
        return new presenter(name, presenterFn, dependencies);
    }
}