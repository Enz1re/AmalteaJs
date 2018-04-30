"use strict";

define(["amaltea"], function () {
    var view1 = amaltea.view({
        tagName: "my-tag",
        template: "layout/myTag.html",
    });

    var validator = amaltea.object('validator', function () {
        return {
            validate: function (value) {
                return Number.parseFloat(value) < 0.5 || value === "";
            }
        };
    });

    var presenter1 = view1.presenter('mainPresenter', function ($view, $model, validator) {
        return {
            src: "https://i.ytimg.com/vi/4-oDmlYgrNY/hqdefault.jpg",

            onclick1: function (e) {
                this.$model.User.name = Math.random() + "";
            },

            _onInit: function () {
                this.$model.User.onValueChanged(function (model, property, value) {
                    return this.validator.validate(value);
                });
            }
        }
    }, ['$view', '$model', 'validator']);

    var userModel = presenter1.model('User', {
        name: "text",
        phone: "number"
    });

    var mainModule = amaltea.module({
        name: "main",
        views: [view1],
        dependencies: [validator],
        submodules: [],
    });

    amaltea.run(mainModule);
});