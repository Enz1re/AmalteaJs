define([], function () {
    "use strict";

    function lowercaseMatch(elem1, elem2) {
        return elem1.toLowerCase() === elem2.toLowerCase();
    }

    function formatRequestParams(params) {
        return '?' + Object.keys(params).map(function (name) {
            return name + '=' + encodeURIComponent(params[name]);
        }).join('&');
    }

    function createErrorResponse(xhr) {
        return { status: xhr.status, statusText: xhr.statusText, message: JSON.parse(xhr.response).message };
    }

    function setDefaultRequestHeaders(xhr) {
        xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        xhr.setRequestHeader("Accept", "application/json,text/plain,*/*");
    }

    function createXHR(requestType, url, params, requestHeaders) {
        var xhr = new XMLHttpRequest();

        if (params) {
            url += formatRequestParams(params);
        }

        xhr.open(requestType, url, true);
        for (var header in requestHeaders) {
            xhr.setRequestHeader(header, requestHeaders[header]);
        }

        setDefaultRequestHeaders(xhr);

        return xhr;
    }

    function asPromise(xhr) {
        return new Promise(function (resolve, reject) {
            xhr.onload = function () {
                if (this.status === 200) {
                    resolve(this.response);
                } else {
                    reject(createErrorResponse(this));
                }
            }
            xhr.onerror = function () {
                reject(createErrorResponse(this));
            }
        });
    }

    var http = Object.create(null);

    http.get = function (url, params, headers) {
        var xhr = createXHR("GET", url, params, headers);
        var promise = asPromise(xhr);
        xhr.send();
        return promise;
    };

    http.post = function (url, body, headers) {
        var xhr = createXHR("POST", url, null, headers);
        var promise = asPromise(xhr);
        xhr.send(JSON.stringify(body || {}));
        return promise;
    };
    
    http.put = function (url, body, headers) {
        var xhr = createXHR("PUT", url, null, headers);
        var promise = asPromise(xhr);
        xhr.send(JSON.stringify(body || {}));
        return promise;
    };
    
    http.delete = function (url, headers) {
        var xhr = createXHR("DELETE", url, null, headers);
        var promise = asPromise(xhr);
        xhr.send();
        return promise;
    };
    
    http.patch = function (url, body, headers) {
        var xhr = createXHR("PATCH", url, null, headers);
        var promise = asPromise(xhr);
        xhr.send(JSON.stringify(body || {}));
        return promise;
    };
    
    http.head = function (url, headers) {
        var xhr = createXHR("HEAD", url, null, headers);
        var promise = asPromise(xhr);
        xhr.send();
        return promise;
    };

    http.afterEach = function (promises, callback) {
        callback = callback || function () { };
        promises.forEach(function (promise) {
            promise.then(callback);
        });
    };

    http.afterAll = function (promises) {
        var counter = promises.length;
        var result = [];
        return new Promise(function (resolve, reject) {
            promises.forEach(function (promise, i) {
                promise.then(function (response) {
                    result[i] = response;
                    if (!(--counter)) {
                        resolve(result);
                    }
                }, function (failure) {
                    reject(failure);
                });
            });
        });
    };

    return http;
});