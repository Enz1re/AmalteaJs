define([], function () {
    "use strict";

    function Dependency(name, obj) {
        this.name = name;
        this.value = obj;
    };

    return Dependency;
});