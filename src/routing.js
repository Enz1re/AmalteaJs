define([
    "src/core/contains",
    "src/core/traverseDOM"
], function (contains, traverseDOM) {
    "use strict";

    function getRouters() {
        return document.getElementsByTagName('router');
    }

    function getRouterName(routerElement) {
        var nameAttr = routerElement.attributes.getNamedItem("name");
        return !!nameAttr ? nameAttr.value : null;
    }

    function findRouter(name, pageRouters) {
        name = name || "ROUTER";

        var routers = getRouters();
        if (routers.length === 0) {
            throw new Error("No routers are available on the page");
        }
        if (!pageRouters[name]) {
            throw new Error("There was no router named '" + name + "'. Please make sure you added this router to the page");
        }

        return pageRouters[name];
    }

    function checkRouterNames(routers) {
        var routersByName = {};

        for (var router of routers) {
            const name = getRouterName(router)
            if (!name) {
                if (!routersByName['router']) {
                    routersByName['router'] = router;
                } else {
                    throw new Error("There was more than one default router. Please remove redundant routers or add 'name' attribute");
                }
            } else {
                if (name.toLowerCase() === 'router') {
                    throw new Error("A router cannot have default name 'router'");
                }
                if (!routersByName[name]) {
                    routersByName[name] = router;
                } else {
                    throw new Error("There were more than one router named '" + name + "'. Please remove or rename redundant routers");
                }
            }
        }

        return routersByName;
    }

    function registerRoutes(routes) {
        var routers = getRouters();
        var routersByName = checkRouterNames(routers);
        var routeConfig = {};

        for (var route of routes) {
            if (route.url.replace('\\', '/')[0] !== '/') {
                route.url = '/' + route.url;
            }

            var routeUrl = route.url;
            if (!routeConfig[routeUrl]) {
                routeConfig[routeUrl] = [];
            }

            var r = { view: route.view, router: findRouter(route.name || 'router', routersByName) };
            if (!contains(routeConfig[routeUrl], r, function (r1, r2) {
                return r1.url === r2.url;
            })) {
                routeConfig[routeUrl].push(r);
            } else {
                throw new Error("URL '" + route.url + "' is already registered");
            }
        }

        return routeConfig;
    }

    function placeViewToRouter(router, selector) {
        var template = viewCache.get(selector);
        router.innerHTML = template;
        traverseDOM(router, processNode);
    }

    function initializeRouting(routeConfig) {
        var routers = getRouters();
        if (!routeConfig || Object.keys(routeConfig).length === 0) {
            throw new Error("No routes were registered, but " +
                (routers.length > 1 ? routers.length + " routers were found on the page." :
                    (getRouterName(routers[0]) ? "router with name '" + getRouterName(routers[0]) + "'" : "default router") + " was found on the page."));
        }

        var matchedRouters = {};
        var path = document.location.pathname;
        var availableRoutes = routeConfig[path];

        for (var route of availableRoutes) {
            placeViewToRouter(route.router, route.view);
        }
    }

    return initializeRouting;
});