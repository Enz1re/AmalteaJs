define(["src/core/getResult"], function (getResult) {
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
    };

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

        this.addRow = function (rowArray) {
            if (!Array.isArray(rowArray)) {
                throw new Error("rowArray must be an array, not " + typeof rowArray);
            }

            var newRow = document.createElement('tr');
            for (var cellData of rowArray) {
                var newCell = document.createElement('td');
                newCell.innerText = cellData;
                newRow.appendChild(newCell);
            }

            rows.appendChild(newRow);
        },

        this.removeRow = function (index) {
            if (rows.length === 0) {
                return;
            }
            if (rows.length <= index || index < 0) {
                throw new Error("Index should be less than table row number and non-negative.");
            }

            rows.removeChild(rows[index]);
        }
    }

    AmTableBody.prototype = {
        constructor: AmTableBody,
    };

    function AmTable(tableElement, presenter) {
        var _tbodies;
        var _rows;
        var table = tableElement;
        var tableContents = Array.prototype.slice.call(tableElement.children);

        var sourceName = tableElement.getAttribute('am-source');
        if (sourceName) {
            var source = getResult(presenter, sourceName);

            tableElement.innerHtml = "";
            tableElement.innerText = "";
            table = document.createElement('table');

            if (!Array.isArray(source)) {
                throw new Error("am-table data must be an array, not " + typeof source);
            }

            var header = document.createElement('thead');
            for (var td of source[0]) {
                var cell = document.createElement('td');
                cell.innerText = td;
                header.appendChild(cell);
            }

            this.header = new AmTableRow(header);
            table.appendChild(header);

            this.rows = [];
            this.body = null;
            this.bodies = [];
            source.splice(0, 1);
            var containsTBody = Array.isArray(source[0][0]);
            for (var rowOrBody of source) {
                if (containsTBody) {
                    if (!Array.isArray(rowOrBody)) {
                        throw new Error("body must be an array, not " + typeof tbodyData);
                    }

                    var tbody = document.createElement('tbody');

                    for (var rowData of rowOrBody) {
                        if (!Array.isArray(rowData)) {
                            throw new Error("All body elements must be arrays");
                        }
                        var row = document.createElement('tr');
                        for (var cellData of rowData) {
                            var cell = document.createElement('td');
                            cell.innerText = cellData;
                            row.appendChild(cell);
                        }
                        tbody.appendChild(row);
                        this.rows.push(new AmTableRow(row));
                    }

                    this.bodies.push(new AmTableBody(tbody));
                    table.appendChild(tbody);
                } else {
                    if (!Array.isArray(rowOrBody)) {
                        throw new Error("row must be an array, not " + typeof rowOrBody);
                    }
        
                    var newRow = document.createElement('tr');
                    for (var cellData of rowOrBody) {
                        var newCell = document.createElement('td');
                        newCell.innerText = cellData;
                        newRow.appendChild(newCell);
                    }

                    this.rows.push(new AmTableRow(newRow));
                    table.appendChild(newRow);
                }

                tableElement.appendChild(table);
            }
        } else {
            if (amaltea.contains(tableContents, 'thead', function (elem) { return elem.tagName === 'THEAD' })) {
                this.header = new AmTableRow(tableElement.querySelector('thead').querySelector('tr'));
            }
            if (amaltea.contains(tableContents, 'tbody', function (elem) { return elem.tagName === 'TBODY' })) {
                _tbodies = tableElement.getElementsByTagName('tbody');
                if (_tbodies.length === 1) {
                    this.body = new AmTableBody(_tbodies[0]);
                    this.bodies = null;
                } else {
                    this.body = null;
                    this.bodies = Array.prototype.slice.call(_tbodies).map(function (tbody) {
                        return new AmTableBody(tbody);
                    });
                }
                for (var i = 0; i < _tbodies.length; i++) {
                    this[i] = new AmTableBody(_tbodies[i]);
                }
                var nextIndex = 0;
                Object.defineProperty(this, Symbol.iterator, {
                    enumerable: false,
                    value: function () {
                        return {
                            next: function () {
                                return nextIndex < this.length ?
                                    { value: _tbodies[nextIndex++].innerText, done: false } :
                                    { done: true };
                            }
                        }
                    }
                });
            } else {
                _rows = tableElement.getElementsByTagName('tr');
                for (var i = 0; i < _rows.length; i++) {
                    this[i] = new AmTableRow(_rows[i]);
                }
                var nextIndex = 0;
                Object.defineProperty(this, Symbol.iterator, {
                    enumerable: false,
                    value: function () {
                        return {
                            next: function () {
                                return nextIndex < this.length ?
                                    { value: _rows[nextIndex++].innerText, done: false } :
                                    { done: true };
                            }
                        }
                    }
                });
                this.rows = Array.prototype.slice.call(_rows).map(function (row) {
                    return new AmTableRow(row);
                });
            }
        }

        this.addRow = function (rowArray) {
            if (!Array.isArray(rowArray)) {
                throw new Error("rowArray must be an array, not " + typeof rowArray);
            }

            var newRow = document.createElement('tr');
            for (var cellData of rowArray) {
                var newCell = document.createElement('td');
                newCell.innerText = cellData;
                newRow.appendChild(newCell);
            }

            table.appendChild(newRow);
            if (source) {
                source.push(new AmTableRow(newRow));
            }
        },

        this.removeRow = function (index) {
            if (_rows.length === 0) {
                return;
            }
            if (_rows.length <= index || index < 0) {
                throw new Error("Index should be less than table row number and non-negative.");
            }

            _rows.removeChild(_rows[index]);
            if (source) {
                source.splice(index, 1);
            }
        },

        this.addTBody = function (tbodyData) {
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
            table.appendChild(tbody);
            if (source) {
                source.push(tbody);
            }
        },

        this.removeTBody = function (index) {
            if (index) {
                if (!this.bodies || _tbodies.length === 0) {
                    return;
                }
                if (_tbodies.length <= index || index < 0) {
                    throw new Error("Index should be less than tbody number and non-negative.");
                }

                this.bodies.splice(index, 1);
                _tbodies.removeChild(_tbodies[index]);
            } else {
                if (!!this.body) {
                    this.body = null;
                } else {
                    this.bodies.splice(index, 1);
                }

                _tbodies.removeChild(_tbodies[_tbodies.length - 1]);
            }

            if (source) {
                source.splice(index, 1);
            }
        }
    }

    AmTable.prototype = {
        constructor: AmTable
    };

    return AmTable;
});