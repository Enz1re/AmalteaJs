function model(name, modelObj) {
    this.name = name;
    this.model = modelObj;
}

model.prototype = {
    constructor: model,
}