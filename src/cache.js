"use strict";

define([], function () {
    var CacheObject = function (capacity) {
        this.capacity = capacity;
        this.map = Object.create(null);
    };

    CacheObject.prototype = {
        constructor: CacheObject,

        size: 0,

        put: function (key, value) {
            if (amaltea.isUndefined(key) || amaltea.isNull(key)) {
                throw new Error("Key cannot be " + key);
            }
            if (amaltea.isUndefined(value) || amaltea.isNull(value)) {
                return;
            }
            var keys = Object.keys(this.map);
            if (keys.length === this.capacity) {
                var oldest = keys[0];
                delete this.map[oldest];
            }
            if (key in this.map) {
                // push up new value for the key which is already added
                delete this.map[key];
            }

            this.map[key] = value;
            return value;
        },

        get: function (key) {
            if (amaltea.isUndefined(key) || amaltea.isNull(key)) {
                throw new Error("Key cannot be " + key);
            }

            var value = this.map[key];
            if (!!value) {
                delete this.map[key];
                this.map[key] = value;
                return value;
            }

            return null;
        },

        remove: function (key) {
            if (amaltea.isUndefined(key) || amaltea.isNull(key)) {
                throw new Error("Key cannot be " + key);
            }
            if (!(key in this.map)) {
                return null;
            }

            var value = this.map[key];
            delete this.map[key];

            return value;
        },

        removeAll: function () {
            this.map = object();
        }
    }

    var cache = Object.create(null);

    cache.caches = Object.create(null),

    cache.create = function (name, capacity) {
        if (name in this.caches) {
            throw new Error("Cache object '" + name + "' is already registered");
        }

        capacity = capacity || Number.MAX_VALUE;
        if (capacity <= 0) {
            throw new Error("Capacity cannot be less or equal than zero");
        }

        var cache = new CacheObject(capacity);
        this.caches[name] = cache;

        return cache;
    };

    cache.getCache = function (name) {
        if (!(name in this.caches)) {
            return null;
        }

        return this.caches[name];
    };

    cache.removeCache = function (name) {
        if (!(name in this.caches)) {
            throw new Error("There is no cache object called '" + name + "'");
        }

        delete this.caches[name];
    };

    cache.tryRemoveCache = function (name) {
        if (!(name in this.caches)) {
            return false;
        }

        return delete this.caches[name];
    };

    cache.removeAllCaches = function () {
        this.caches = object();
    };

    return cache;
});