"use strict";

define(["src/core/shallowCopy", "src/core/merge"], function (shallowCopy, merge) {
    var mergeCopy = function (src, obj) {
        src = shallowCopy(src);
        return merge(src, obj);
    }

    return mergeCopy;
});