define(["amaltea"], function () {
    "use strict";

    var validator = amaltea.object('validator', function () {
        return {
            validate: function (value) {
                return Number.parseFloat(value) < 0.5 || value === "";
            }
        };
    }, []);

    var serviceValidator = amaltea.object('serviceValidator', function (validator) {
        return {
            validate: function (value) {
                return this.validator.validate(value);
            }
        }
    }, ['validator']);

    var complexValidator = amaltea.object('complexValidator', function (serviceValidator, validator) {
        return {
            validate: function (value) {
                return this.serviceValidator.validate(value);
            }
        }
    }, ['serviceValidator', 'validator']);

    var view1 = amaltea.view({
        tagName: "my-tag",
        template: "layout/myTag.html",
    });

    var presenter1 = view1.presenter('mainPresenter', function ($view, $model, validator) {
        return {
            id: 0,
            table: [
                ['Id', 'Name', 'Role'],
                [
                    ['1', 'Kostia', 'Admin'],
                    ['2', 'Ivan', 'Admin'],
                    ['3', 'Anton', 'Admin']
                ],                                 
                [                          
                    ['4', 'Sveta', 'User'],
                    ['5', 'Dmytro', 'User'],
                    ['6', 'Vlad', 'User']   
                ]
            ],
            src: "https://i.ytimg.com/vi/4-oDmlYgrNY/hqdefault.jpg",

            onclick1: function (e) {
                this.$model.User.name = Math.random() + "";
            },

            _onInit: function () {
                this.$model.User.onValueChanged(function (model, property, value) {
                    return this.validator.validate(value);
                });
                this.id = Math.random();
            }
        }
    }, ['$view', '$model', 'validator']);

    var userModel = presenter1.model('User', {
        name: "text",
        phone: "number"
    });

    var view2 = amaltea.view({
        tagName: "other-tag",
        template: "layout/otherTag.html",
    });

    var presenter2 = view2.presenter('otherPresenter', function ($view) {
        return {
            index: 0,
            list: [322, 64, 256, 9000, 228],
            src: "http://i0.kym-cdn.com/entries/icons/original/000/020/401/HereDatBoi.jpg",

            onclick2: function (e) {
                this.$view.list1.addItem("Hello");
            },

            onclick22: function (e) {
                this.$view.list1.removeItem(this.index);
            }
        }
    }, ['$view']);

    var model2 = presenter2.model('SecondaryModel', {
        name: { type: "text", value: "Kostia" },
        age: { type: "number", value: 22 },
        status: {
            type: "select", value: "Free", values: [
                "Busy",
                "Free"
            ]
        }
    });

    var view3 = amaltea.view({
        tagName: "my-tag-2",
        template: "layout/myTag2.html",
    });

    var presenter3 = view3.presenter('myTag2Presenter', function ($view) {
        return {
            text: "",
            src: "http://i0.kym-cdn.com/entries/icons/original/000/020/401/HereDatBoi.jpg",

            onclick3: function (e) {
                console.log("Presenter3");
            },

            presenter3Method: function () {
                this.text = "My text";
            }
        }
    }, ['$view']);

    var model3 = presenter3.model('ThirdModel', {
        name: "text"
    });

    var view4 = amaltea.view({
        tagName: "my-tag-3",
        template: "layout/myTag3.html",
        stylesheet: "style.css"
    });

    var presenter4 = view4.presenter('myTag3Presenter', function ($view, $model) {
        return {
            text: "Kostia",
            src: "https://i.ytimg.com/vi/4-oDmlYgrNY/hqdefault.jpg",
            number: 42,

            get42: function () {
                return 42;
            },

            onGoClick: function () {
                console.log("SOS");
            },

            printModel: function () {
                console.log(this.$model.SecondaryModel.name);
                console.log(this.$model.SecondaryModel.age);
                console.log(this.$model.SecondaryModel.status);
            }
        }
    }, ['$view', '$model']);

    var model4 = presenter4.model('SecondaryModel', {
        name: { type: "text", value: "Kostia" },
        age: { type: "number", value: 22 },
        status: {
            type: "select", value: "Free", values: [
                "Busy",
                "Free"
            ]
        }
    });

    var mainModule = amaltea.module({
        name: "main",
        views: [view1, view2, view3, view4],
        dependencies: [complexValidator, serviceValidator, validator],
        submodules: [],
        inheritance: true
    });

    amaltea.run(mainModule);
});