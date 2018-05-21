define(["src/core/getResult"], function (getResult) {
    "use strict";

    var listTypes = {
        ol: true,
        ul: true
    };

    function AmList(listElement, presenter) {
        var list = listElement.querySelector('ol') || listElement.querySelector('ul');
        var source = null;
        var sourceName = listElement.getAttribute('am-source');

        if (sourceName) {
            source = getResult(presenter, sourceName);
            if (!Array.isArray(source)) {
                throw new Error("Invalid source: " + sourceName + ". Source must be array, not " + typeof source);
            }

            listElement.innerHtml = "";
            listElement.innerText = "";
            var type = (listElement.getAttribute('type') || 'ol').toLowerCase();
            if (!(type in listTypes)) {
                throw new Error("Unknown list type: " + type + ". Possible values: ul, ol");
            }

            list = document.createElement(type);
            for (var li of source) {
                var listItem = document.createElement('li');
                listItem.innerText = li;
                list.appendChild(listItem);
            }
            listElement.appendChild(list);

            for (var i = 0; i < source.length; i++) {
                this[i] = source[i];
            }

            var nextIndex = 0;
            Object.defineProperty(this, Symbol.iterator, {
                enumerable: false,
                value: function () {
                    return {
                        next: function () {
                            return nextIndex < source.length ?
                                    { value: source[nextIndex++], done: false } :
                                    { done: true };
                        }
                    }
                }
            });

            Object.defineProperty(this, length, {
                configurable: false,
                enumerable: false,
                get: function () {
                    return source.length;
                }
            });
        } else {
            var elements = listElement.getElementsByTagName('li');

            for (var i = 0; i < elements.length; i++) {
                this[i] = elements[i].innerText;
            }

            var nextIndex = 0;
            Object.defineProperty(this, Symbol.iterator, {
                enumerable: false,
                value: function () {
                    return {
                        next: function () {
                            return nextIndex < elements.length ?
                                    { value: elements[nextIndex++].innerText, done: false } :
                                    { done: true };
                        }
                    }
                }
            });
    
            Object.defineProperty(this, length, {
                configurable: false,
                enumerable: false,
                get: function () {
                    return elements.length;
                }
            });
        }

        this.addItem = function (item) {
            item = item.toString();

            var listItem = document.createElement("li");
            listItem.innerText = item;
            list.appendChild(listItem);
            if (source) {
                source.push(item);
            }
        },

        this.removeItem = function (index) {
            if (list.children.length === 0) {
                return;
            }
            if (list.children.length <= index || index < 0) {
                throw new Error("Index should be less than list length and non-negative.");
            }

            var itemToDelete = list.children[index];
            list.removeChild(itemToDelete);

            if (source) {
                source.splice(index, 1);
            }
        },

        this.removeItems = function (item) {
            var listItems = Array.prototype.slice.call(list.children);
            var elementsToDelete = [];
            item = item.toString();

            for (var li of listItems) {
                if (li.innerText === item || li.innerHtml == item) {
                    elementsToDelete.push(li);
                }
            }

            for (var element of elementsToDelete) {
                list.removeChild(element);
                if (source) {
                    source.splice(source.indexof(element), 1);
                }
            }
        }
    }

    AmList.prototype = {
        constructor: AmList
    };

    return AmList;
});