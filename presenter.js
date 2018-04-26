function presenter(name, presenterFn, dependencies) {
    this.p = { name: name, constructor: presenterFn };
    this.d = dependencies;
}

presenter.prototype = {
    constructor: presenter,

    model: function (name, modelObj) {
        return new model(name, modelObj);
    }
}