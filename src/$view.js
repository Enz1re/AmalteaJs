"use strict";

define([
    "src/am-list",
    "src/am-form",
    "src/am-dynamic-form",
    "src/am-table",

    "src/core/merge"
], function (AmList, AmForm, AmDynamicForm, AmTable, merge) {
    const classNameRegex = /.?[_a-zA-Z]+[_a-zA-Z0-9-]*/g;
    const tagNameRegex = /[\w-_]+/g;
    const attrNameRegex = /[\w-_]+/g;

    function asArray(collection) {
        return Array.prototype.slice.call(collection);
    }

    function elementsFromTagString(str) {
        str = str.trim();
        var tagList = str.split(' ');
        if (tagList.length > 1) {
            return elementsFromTagArray(tagList);
        } else {
            str = tagList[0].replace('<', '').replace('>', '');
            if (!str.match(tagNameRegex)) {
                throw new Error("\"" + str + "\" is not a valid tag name");
            }

            return asArray(this._viewNode.getElementsByTagName(str));
        }
    }

    function elementsFromTagArray(arr) {
        validateArray(array, classNameRegex, "tag name");

        var arr = [];
        for (var tagName of arr) {
            var collection = asArray(this._viewNode.getElementsByTagName(str));
            arr = merge(arr, collection);
        }

        return arr;
    }

    function elementsFromClassString(str) {
        str = str.trim();
        var classList = str.split(' ');
        if (classList.length > 1) {
            return elementsFromArray(classList);
        } else {
            str = classList[0];
            if (!str.match(classNameRegex)) {
                throw new Error("\"" + str + "\" is not a valid class name");
            }

            return asArray(this._viewNode.getElementsByClassName(str.replace('.')));
        }
    }

    function elementsFromClassArray(arr) {
        validateArray(array, classNameRegex, "class name");

        var arr = [];
        for (var className of arr) {
            var collection = asArray(this._viewNode.getElementsByClassName(className.replace('.')));
            arr = merge(arr, collection);
        }

        return arr;
    }

    function elementsFromAttributeString(str) {
        str = str.trim();
        var classList = str.split(' ');
        if (classList.length > 1) {
            return elementsFromArray(classList);
        } else {
            str = classList[0];
            if (!str.match(attrNameRegex)) {
                throw new Error("\"" + str + "\" is not a valid class name");
            }

            return asArray(this._viewNode.querySelectorAll('[' + str + ']'));
        }
    }

    function elementsFromAttributeArray(arr) {
        validateArray(array, classNameRegex, "class name");

        var arr = [];
        for (var className of arr) {
            var collection = asArray(this._viewNode.querySelectorAll('[' + str + ']'));
            arr = merge(arr, collection);
        }

        return arr;
    }

    function validateExpression(expr) {
        var type = typeof expr;
        if (type !== 'string' || !Array.isArray(expr)) {
            throw new Error("Expression must be either a string or array of strings, not \"" + type + "\"");
        }
    }

    function validateArray(arr, regex, elementName) {
        for (var item of arr) {
            if (!item.match(regex)) {
                throw new Error("Item " + item + " doesn't match " + elementName + " regex: " + regex);
            }
        }
    }

    function $view(viewNode, presenter) {
        this._viewNode = viewNode;

        var elementsWithId = this._viewNode.querySelectorAll('[id]');
        for (var elem of elementsWithId) {
            var id = elem.getAttribute('id');
            if (!this[id]) {
                Object.defineProperty(this, id, {
                    enumerable: false,
                    configurable: false,
                    get: function () {
                        return elem;
                    },
                });
            }
        }

        var amLists = this._viewNode.querySelectorAll('[am-list]');
        for (var elem of amLists) {
            var listName = elem.getAttribute('am-list');
            var list = new AmList(elem);
            if (!this[listName]) {
                Object.defineProperty(this, listName, {
                    enumerable: false,
                    configurable: false,
                    get: function () {
                        return list;
                    },
                });
            }
        }

        var amTables = this._viewNode.querySelectorAll('[am-table]');
        for (var elem of amTables) {
            var tableName = elem.getAttribute('am-table');
            var table = new AmTable(elem);
            if (!this[tableName]) {
                Object.defineProperty(this, tableName, {
                    enumerable: false,
                    configurable: false,
                    get: function () {
                        return table;
                    },
                });
            }
        }
        
        // TODO: add data binding
        var simpleForms = this._viewNode.querySelectorAll('[am-form]');
        for (var formElement of simpleForms) {
            var model = amaltea.getResult(presenter, formElement.getAttribute('am-form'));
            var form = new AmForm(formElement, model);
            if (formElement.name) {
                Object.defineProperty(this, form.name, {
                    enumerable: false,
                    configurable: false,
                    get: function () {
                        return form;
                    }
                });
            }
        }
    
        // TODO: add data binding
        var dynamicForms = this._viewNode.querySelectorAll('[am-dynamic-form]');
        for (var formElement of dynamicForms) {
            var model = amaltea.getResult(presenter, formElement.getAttribute('am-dynamic-form'));
            var form = new AmDynamicForm(formElement, model);
            if (formElement.name) {
                Object.defineProperty(this, form.name, {
                    enumerable: false,
                    configurable: false,
                    get: function () {
                        return form;
                    }
                });
            }
        }
    }

    $view.prototype = {
        constructor: $view,

        elements: function (expr) {
            validateExpression(expr);
            if (type === 'string') {
                return elementsFromTagString(expr);
            } else {
                return elementsFromTagArray(expr);
            }
        },

        classes: function (expr) {
            validateExpression(expr);
            if (type === 'string') {
                return elementsFromClassString(expr);
            } else {
                return elementsFromClassArray(expr);
            }
        },

        attributes: function (expr) {
            validateExpression(expr);
            if (type === 'string') {
                return elementsFromAttributeString(expr);
            } else {
                return elementsFromAttributeArray(expr);
            }
        },

        querySelector: function (expr) {
            return this._viewNode.querySelectorAll(expr);
        }
    };

    return $view;
});