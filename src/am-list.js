"use strict";

define([], function () {
    function AmList(listElement) {
        this._list = listElement;
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

    AmList.prototype = {
        constructor: AmList,

        addItem: function (item) {
            var listItem = document.createElement("li");
            listItem.innerText = item;
            this._list.appendChild(listItem);
        },

        removeItem: function (index) {
            if (this._list.children.length === 0) {
                return;
            }
            if (this._list.children.length <= index || index < 0) {
                throw new Error("Index should be less than list length and non-negative.");
            }

            var itemToDelete = this._list.children[index];
            this._list.removeChild(itemToDelete);
        },

        removeItems: function (item) {
            var listItems = Array.prototype.slice.call(this._list.children);
            var elementsToDelete = [];
            item = item.toString();

            for (var li of listItems) {
                if (li.innerText === item || li.innerHtml == item) {
                    elementsToDelete.push(li);
                }
            }

            for (var element of elementsToDelete) {
                this._list.removeChild(element);
            }
        }
    };

    return AmList;
});