"use strict";

define([], function () {
    const formElements = {
        "INPUT": true,
        "SELECT": true,
        "TEXTAREA": true,
        "BUTTON": true,
        "LABEL": true,
        "FIELDSET": true,
        "LEGEND": true,
        "OPTGROUP": true,
        "OPTION": true,
        "DATALIST": true,
        "OUTPUT": true
    };

    const amRegex = /am\d+/gi;

    function resolveFormType(node, type, value, values) {
        type = type.toLowerCase();
        switch (type) {
            case 'text':
            case 'number':
            case 'image':
            case 'file':
            case 'color':
            case 'date':
            case 'datetime':
            case 'email':
            case 'time':
            case 'url':
                node.type = type;
                node.value = value;
                return node;
            case 'textarea':
                node.value = value;
                return node;
            case 'legend':
            case 'output':
            case 'label':
                node.innerText = value;
                return label;
            case 'select':
                if (!values) {
                    throw new Error("Values field is required for select input box.");
                }
                if (!Array.isArray(values)) {
                    throw new Error("Values for select input box should be an array, not " + typeof values);
                }

                var option, optgroup;
                for (var element of values) {
                    if (Array.isArray(element)) {
                        optgroup = document.createElement('optgroup');

                        for (var opt of element) {
                            option = document.createElement('option');
                            if (typeof opt === 'object') {
                                option.value = opt.value;
                                option.innerText = opt.text;
                                if (opt.value === value) {
                                    option.selected = true;
                                }
                            } else {
                                option.value = opt;
                                option.innerText = opt;
                                if (opt === value) {
                                    option.selected = true;
                                }
                            }

                            optgroup.appendChild(option);
                        }

                        node.appendChild(optgroup);
                    } else {
                        option = document.createElement('option');

                        if (typeof element === 'object') {
                            option.value = element.value;
                            option.innerText = element.text;
                            if (element.value === value) {
                                option.selected = true;
                            }
                        } else {
                            option.value = element;
                            option.innerText = element;
                            if (element === value) {
                                option.selected = true;
                            }
                        }

                        node.appendChild(option);
                    }
                }

                return node;
            case 'datalist':
                if (!values) {
                    throw new Error("Value is required for datalist.");
                }
                if (!Array.isArray(values)) {
                    throw new Error("Value for datalist should be an array, not " + typeof values);
                }

                var option;
                for (var element of values) {
                    option = document.createElement('option');

                    if (typeof element === 'object') {
                        option.value = element.value;
                        option.innerText = element.text;
                        if (element.value === value) {
                            option.selected = true;
                        }
                    } else {
                        option.value = element;
                        option.innerText = element;
                        if (element === value) {
                            option.selected = true;
                        }
                    }

                    node.appendChild(option);
                }

                return node;
            default:
                throw new Error("Incorrect type: " + type);
        }
    }

    function AmForm(formNode, model) {
        for (var prop of Object.getOwnPropertyNames(model._inner)) {
            if (!model._inner[prop].type) {
                throw new Error("Type is missing in form description.");
            }
        }

        var formChildNodes = formNode.children;
        var matches = Object.assign({}, model._inner);
        var propName;

        var modelName = formNode.getAttribute('am-form');
        for (var formElement of formChildNodes) {
            propName = formElement.name;
            if (!propName) {
                throw new Error("All form elements should contain 'name' attribute that equals the form property name.");
            }
            if (!(formElement.tagName in formElements)) {
                throw new Error(formElement.tagName.toLowerCase() + " is not a valid form element.");
            }
            if (matches.hasOwnProperty(propName)) {
                delete matches[propName];
                resolveFormType(formElement, model._inner[propName].type, model._inner[propName].value, model._inner[propName].values);
                formElement.setAttribute('am-value', modelName + '.' + propName);
                this[propName] = model._inner[propName];
            } else {
                throw new Error("No such property: " + propName);
            }
        }
    }

    AmForm.prototype = {
        constructor: AmForm
    };

    return AmForm;
});