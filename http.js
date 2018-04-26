"use strict";

function lowercaseMatch(elem1, elem2) {
	return elem1.toLowerCase() === elem2.toLowerCase();
}

var requestHeaders = [
	"Accept", "Accept-Charset", "Accept-Encoding", "Accept-Language", "Authorization", "Content-Disposition", 
	"Expect", "From", "Host", "If-Match", "If-Modified-Since", "If-None-Match", "If-Range", "If-Modified-Since", 
	"Max-Forwards", "Proxy-Authorization", "Range", "Referer", "TE", "User-Agent"
];
var generalHeaders = [
	"Cache-Control", "Connection", "Date", "MIME-Version", "Pragma", "Trailer", "Transfer-Encoding", 
	"Upgrade", "Via", "Warning"
];

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
	    if (!amaltea.contains(generalHeaders, header, lowercaseMatch) || !amaltea.contains(requestHeaders, header, lowercaseMatch)) {
			throw new Error(header + " is not a valid request header");
		}
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

var http = {
	get: function (url, params, headers) {
		var xhr = createXHR("GET", url, params, headers);
		var promise = asPromise(xhr);
		xhr.send();
		return promise;
	},
	post: function (url, body, headers) {
		var xhr = createXHR("POST", url, null, headers);
		var promise = asPromise(xhr);
		xhr.send(JSON.stringify(body || {}));
		return promise;
	},
	put: function (url, body, headers) {
		var xhr = createXHR("PUT", url, null, headers);
		var promise = asPromise(xhr);
		xhr.send(JSON.stringify(body || {}));
		return promise;
	},
	delete: function (url, headers) {
		var xhr = createXHR("DELETE", url, null, headers);
		var promise = asPromise(xhr);
		xhr.send();
		return promise;
	},
	patch: function (url, body, headers) {
		var xhr = createXHR("PATCH", url, null, headers);
		var promise = asPromise(xhr);
		xhr.send(JSON.stringify(body || {}));
		return promise;
	},
	head: function (url, headers) {
		var xhr = createXHR("HEAD", url, null, headers);
		var promise = asPromise(xhr);
		xhr.send();
		return promise;
	}
};