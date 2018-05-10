define(["src/core/create"], function (create) {
    "use strict";

    var getModelDescriptor = function (modelObj) {
        var descriptor = create();

        for (var prop of Object.getOwnPropertyNames(modelObj)) {
            if (typeof modelObj[prop] === 'object') {
                descriptor[prop] = modelObj[prop];
                if (!descriptor[prop].value) {
                    descriptor[prop].value = null;
                }
            } else {
                descriptor[prop] = create({ type: modelObj[prop], value: null });
            }
        }

        return descriptor;
    };

    return getModelDescriptor;
});