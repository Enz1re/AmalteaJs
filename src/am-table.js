define([], function () {
    "use strict";

    function AmTableRow(rowData) {
        var cells = rowData.getElementsByTagName('td');

        for (var i = 0; i < cells.length; i++) {
            this[i] = cells[i].innerText;
        }

        var nextIndex = 0;
        Object.defineProperty(this, Symbol.iterator, {
            enumerable: false,
            value: function () {
                return {
                    next: function () {
                        return nextIndex < this.length ?
                        { value: cells[nextIndex++].innerText, done: false } :
                        { done: true };
                    }
                }
            }
        });
    }

    AmTableRow.prototype = {
        constructor: AmTableRow
    }

    function AmTableBody(tbodyData) {
        var rows = tbodyData.getElementsByTagName('tr');

        for (var i = 0; i < rows.length; i++) {
            this[i] = new AmTableRow(rows[i]);
        }

        var nextIndex = 0;
        Object.defineProperty(this, Symbol.iterator, {
            enumerable: false,
            value: function () {
                return {
                    next: function () {
                        return nextIndex < this.length ?
                        { value: rows[nextIndex++].innerText, done: false } :
                        { done: true };
                    }
                }
            }
        });
    }

    AmTableBody.prototype = {
        constructor: AmTableBody,

        addRow: function (rowArray) {
            if (!Array.isArray(rowArray)) {
                throw new Error("rowArray must be an array, not " + typeof rowArray);
            }

            var newRow = document.createElement('tr');
            for (var cellData of rowArray) {
                var newCell = document.createElement('td');
                newCell.innerText = cellData;
                newRow.appendChild(newCell);
            }

            this._rows.appendChild(newRow);
        },

        removeRow: function (index) {
            if (this._rows.length === 0) {
                return;
            }
            if (this._rows.length <= index || index < 0) {
                throw new Error("Index should be less than table row number and non-negative.");
            }

            this._rows.removeChild(this._rows[index]);
        }
    }

    function AmTable(tableElement) {
        this._table = tableElement;
        var tableContents = Array.prototype.slice.call(tableElement.children);

        if (amaltea.contains(tableContents, 'thead', function (elem) { return elem.tagName === 'THEAD' })) {
            this._headerRow = tableElement.querySelector('thead').querySelector('tr');
            this.header = new AmTableRow(this._headerRow);
        }
        if (amaltea.contains(tableContents, 'tbody', function (elem) { return elem.tagName === 'TBODY' })) {
            this._tbodies = tableElement.getElementsByTagName('tbody');
            if (this._tbodies.length === 1) {
                this.body = new AmTableBody(this._tbodies[0]);
                this.bodies = null;
            } else {
                this.body = null;
                this.bodies = Array.prototype.slice.call(this._tbodies).map(function (tbody) {
                    return new AmTableBody(tbody);
                });
            }
            for (var i = 0; i < this._tbodies.length; i++) {
                this[i] = new AmTableBody(this._tbodies[i]);
            }
            var nextIndex = 0;
            Object.defineProperty(this, Symbol.iterator, {
                enumerable: false,
                value: function () {
                    return {
                        next: function () {
                            return nextIndex < this.length ?
                        { value: this._tbodies[nextIndex++].innerText, done: false } :
                        { done: true };
                        }
                    }
                }
            });
        } else {
            this._rows = tableElement.getElementsByTagName('tr');
            for (var i = 0; i < this._rows.length; i++) {
                this[i] = new AmTableRow(this._rows[i]);
            }
            var nextIndex = 0;
            Object.defineProperty(this, Symbol.iterator, {
                enumerable: false,
                value: function () {
                    return {
                        next: function () {
                            return nextIndex < this.length ?
                        { value: this._rows[nextIndex++].innerText, done: false } :
                        { done: true };
                        }
                    }
                }
            });
            this.rows = Array.prototype.slice.call(this._rows).map(function (row) {
                return new AmTableRow(row);
            });
        }
    }

    AmTable.prototype = {
        constructor: AmTable,

        init(headerRow, data) {
            if (!Array.isArray(headerRow)) {
                throw new Error("headerRow must be an array, not " + typeof headerRow);
            }
            if (!Array.isArray(data)) {
                throw new Error("data must be an array, not " + typeof data);
            }
            if (headerRow) {
                var header = document.createElement('thead');
                for (var td of headerRow) {
                    var cell = document.createElement('td');
                    cell.innerText = td;
                    header.appendChild(cell);
                }

                this._table.appendChild(header);
            }

            var containsTBody = Array.isArray(data[0][0]);
            for (var rowOrBody of data) {
                if (amaltea.containsTBody) {
                    this.addTBody(rowOrBody);
                } else {
                    this.addRow(rowOrBody);
                }
            }
        },

        addRow: function (rowArray) {
            if (!Array.isArray(rowArray)) {
                throw new Error("rowArray must be an array, not " + typeof rowArray);
            }

            var newRow = document.createElement('tr');
            for (var cellData of rowArray) {
                var newCell = document.createElement('td');
                newCell.innerText = cellData;
                newRow.appendChild(newCell);
            }

            this._table.appendChild(newRow);
        },

        removeRow: function (index) {
            if (this._rows.length === 0) {
                return;
            }
            if (this._rows.length <= index || index < 0) {
                throw new Error("Index should be less than table row number and non-negative.");
            }

            this._rows.removeChild(this._rows[index]);
        },

        addTBody: function (tbodyData) {
            if (!Array.isArray(tbodyData)) {
                throw new Error("tbodyData must be an array, not " + typeof tbodyData);
            }

            var tbody = document.createElement('tbody');

            for (var rowData of tbodyData) {
                if (!Array.isArray(rowData)) {
                    throw new Error("All tbodyData elements must be arrays");
                }
                var row = document.createElement('tr');
                for (var cellData of rowData) {
                    var cell = document.createElement('td');
                    cell.innerText = cellData;
                    row.appendChild(cell);
                }
                tbody.appendChild(row);
            }

            if (this.body) {
                this.bodies = [this.body];
                this.body = null;
            }

            this.bodies.push(new AmTableBody(tbody));
            this._table.appendChild(tbody);
        },

        removeTBody(index) {
            if (index) {
                if (!this.bodies || this._tbodies.length === 0) {
                    return;
                }
                if (this._tbodies.length <= index || index < 0) {
                    throw new Error("Index should be less than tbody number and non-negative.");
                }

                this.bodies.splice(index, 1);
                this._tbodies.removeChild(this._tbodies[index]);
            } else {
                if (!!this.body) {
                    this.body = null;
                } else {
                    this.bodies.splice(index, 1);
                }

                this._tbodies.removeChild(this._tbodies[this._tbodies.length - 1]);
            }
        }
    }

    return AmTable;
});