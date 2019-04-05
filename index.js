/**
 * @fileoverview 百度地图的鼠标绘制工具，对外开放。
 * 允许用户在地图上点击完成鼠标绘制的功能。
 * 使用者可以自定义所绘制结果的相关样式，例如线宽、颜色、测线段距离、面积等等。
 * 主入口类是<a href="symbols/DrawingManager"></a>，
 * 基于Baidu Map API 1.0。
 *
 * @author Baidu Map Api Group 
 * @version 1.0
 */


window['BMapLib'] = window['BMapLib'] || {};
window['BMapLib']['EventWrapper'] = window['BMapLib']['EventWrapper'] || {};

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = { default: factory(), DrawingManager: factory() };
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.BMapLib = root.BMapLib || {};
        root.BMapLib.DrawingManager = root.BMapLib.DrawingManager || factory();
    }
})(this, function () {

    var EventWrapper = window['BMapLib']['EventWrapper'];

    EventWrapper['addDomListener'] = function (instance, eventName, handler) {
        if (instance.addEventListener) {
            instance.addEventListener(eventName, handler, false);
        }
        else if (instance.attachEvent) {
            instance.attachEvent('on' + eventName, handler);
        }
        else {
            instance['on' + eventName] = handler;
        }
        return new MapsEventListener(instance, eventName, handler, MapsEventListener.DOM_EVENT);
    };

    EventWrapper['addDomListenerOnce'] = function (instance, eventName, handler) {
        var eventListener = EventWrapper['addDomListener'](instance, eventName, function () {
            EventWrapper['removeListener'](eventListener);
            return handler.apply(this, arguments);
        });
        return eventListener;
    };

    EventWrapper['addListener'] = function (instance, eventName, handler) {
        instance.addEventListener(eventName, handler);
        return new MapsEventListener(instance, eventName, handler, MapsEventListener.MAP_EVENT);
    };

    EventWrapper['addListenerOnce'] = function (instance, eventName, handler) {
        var eventListener = EventWrapper['addListener'](instance, eventName, function () {
            EventWrapper['removeListener'](eventListener);
            return handler.apply(this, arguments);
        });
        return eventListener;
    };

    EventWrapper['clearInstanceListeners'] = function (instance) {
        var listeners = instance._e_ || {};
        for (var i in listeners) {
            EventWrapper['removeListener'](listeners[i]);
        }
        instance._e_ = {};
    };

    EventWrapper['clearListeners'] = function (instance, eventName) {
        var listeners = instance._e_ || {};
        for (var i in listeners) {
            if (listeners[i]._eventName == eventName) {
                EventWrapper['removeListener'](listeners[i]);
            }
        }
    };

    EventWrapper['removeListener'] = function (listener) {
        var instance = listener._instance;
        var eventName = listener._eventName;
        var handler = listener._handler;
        var listeners = instance._e_ || {};
        for (var i in listeners) {
            if (listeners[i]._guid == listener._guid) {
                if (listener._eventType == MapsEventListener.DOM_EVENT) {
                    if (instance.removeEventListener) {
                        instance.removeEventListener(eventName, handler, false);
                    }
                    else if (instance.detachEvent) {
                        instance.detachEvent('on' + eventName, handler);
                    }
                    else {
                        instance['on' + eventName] = null;
                    }
                }
                else if (listener._eventType == MapsEventListener.MAP_EVENT) {
                    instance.removeEventListener(eventName, handler);
                }
                delete listeners[i];
            }
        }
    };

    EventWrapper['trigger'] = function (instance, eventName) {
        var listeners = instance._e_ || {};
        for (var i in listeners) {
            if (listeners[i]._eventName == eventName) {
                var args = Array.prototype.slice.call(arguments, 2);
                listeners[i]._handler.apply(instance, args);
            }
        }
    };

    function MapsEventListener(instance, eventName, handler, eventType) {

        this._instance = instance;
        this._eventName = eventName;
        this._handler = handler;
        this._eventType = eventType;
        this._guid = MapsEventListener._guid++;
        this._instance._e_ = this._instance._e_ || {};
        this._instance._e_[this._guid] = this;
    }
    MapsEventListener._guid = 1;

    MapsEventListener.DOM_EVENT = 1;
    MapsEventListener.MAP_EVENT = 2;

    var DRAWING_MODE_MARKER = "marker",
        DRAWING_MODE_CIRCLE = "circle";
    DRAWING_MODE_AREA = "area";

    function extend(subClass, superClass, className) {
        var key, proto,
            selfProps = subClass.prototype,
            clazz = new Function();

        clazz.prototype = superClass.prototype;
        proto = subClass.prototype = new clazz();
        for (key in selfProps) {
            proto[key] = selfProps[key];
        }

        subClass.prototype.constructor = subClass;
        subClass.superClass = superClass.prototype;
        if ("string" == typeof className) {
            proto._className = className;
        }
    };

    var T, baidu = T = baidu || { version: '1.5.0' };
    baidu.guid = '$BAIDU$';
    window[baidu.guid] = window[baidu.guid] || {};

    baidu.lang = baidu.lang || {};
    baidu.lang.isString = function (source) {
        return '[object String]' == Object.prototype.toString.call(source);
    };
    baidu.lang.isFunction = function (source) {
        return '[object Function]' == Object.prototype.toString.call(source);
    };
    baidu.lang.Event = function (type, target) {
        this.type = type;
        this.returnValue = true;
        this.target = target || null;
        this.currentTarget = null;
    };


    baidu.object = baidu.object || {};
    baidu.extend =
        baidu.object.extend = function (target, source) {
            for (var p in source) {
                if (source.hasOwnProperty(p)) {
                    target[p] = source[p];
                }
            }

            return target;
        };
    baidu.event = baidu.event || {};
    baidu.event._listeners = baidu.event._listeners || [];
    baidu.dom = baidu.dom || {};

    baidu.dom._g = function (id) {
        if (baidu.lang.isString(id)) {
            return document.getElementById(id);
        }
        return id;
    };
    baidu._g = baidu.dom._g;
    baidu.event.on = function (element, type, listener) {
        type = type.replace(/^on/i, '');
        element = baidu.dom._g(element);
        var realListener = function (ev) {

            listener.call(element, ev);
        },
            lis = baidu.event._listeners,
            filter = baidu.event._eventFilter,
            afterFilter,
            realType = type;
        type = type.toLowerCase();
        if (filter && filter[type]) {
            afterFilter = filter[type](element, type, realListener);
            realType = afterFilter.type;
            realListener = afterFilter.listener;
        }

        if (element.addEventListener) {
            element.addEventListener(realType, realListener, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + realType, realListener);
        }
        lis[lis.length] = [element, type, listener, realListener, realType];
        return element;
    };

    baidu.on = baidu.event.on;
    baidu.event.un = function (element, type, listener) {
        element = baidu.dom._g(element);
        type = type.replace(/^on/i, '').toLowerCase();

        var lis = baidu.event._listeners,
            len = lis.length,
            isRemoveAll = !listener,
            item,
            realType, realListener;
        while (len--) {
            item = lis[len];

            if (item[1] === type
                && item[0] === element
                && (isRemoveAll || item[2] === listener)) {
                realType = item[4];
                realListener = item[3];
                if (element.removeEventListener) {
                    element.removeEventListener(realType, realListener, false);
                } else if (element.detachEvent) {
                    element.detachEvent('on' + realType, realListener);
                }
                lis.splice(len, 1);
            }
        }

        return element;
    };
    baidu.un = baidu.event.un;
    baidu.dom.g = function (id) {
        if ('string' == typeof id || id instanceof String) {
            return document.getElementById(id);
        } else if (id && id.nodeName && (id.nodeType == 1 || id.nodeType == 9)) {
            return id;
        }
        return null;
    };
    baidu.g = baidu.G = baidu.dom.g;
    baidu.dom._styleFixer = baidu.dom._styleFixer || {};
    baidu.dom._styleFilter = baidu.dom._styleFilter || [];
    baidu.dom._styleFilter.filter = function (key, value, method) {
        for (var i = 0, filters = baidu.dom._styleFilter, filter; filter = filters[i]; i++) {
            if (filter = filter[method]) {
                value = filter(key, value);
            }
        }
        return value;
    };
    baidu.string = baidu.string || {};

    baidu.string.toCamelCase = function (source) {
        if (source.indexOf('-') < 0 && source.indexOf('_') < 0) {
            return source;
        }
        return source.replace(/[-_][^-_]/g, function (match) {
            return match.charAt(1).toUpperCase();
        });
    };

    baidu.dom.setStyle = function (element, key, value) {
        var dom = baidu.dom, fixer;
        element = dom.g(element);
        key = baidu.string.toCamelCase(key);

        if (fixer = dom._styleFilter) {
            value = fixer.filter(key, value, 'set');
        }

        fixer = dom._styleFixer[key];
        (fixer && fixer.set) ? fixer.set(element, value) : (element.style[fixer || key] = value);

        return element;
    };

    baidu.setStyle = baidu.dom.setStyle;

    baidu.dom.setStyles = function (element, styles) {
        element = baidu.dom.g(element);
        for (var key in styles) {
            baidu.dom.setStyle(element, key, styles[key]);
        }
        return element;
    };
    baidu.setStyles = baidu.dom.setStyles;
    baidu.browser = baidu.browser || {};
    baidu.browser.ie = baidu.ie = /msie (\d+\.\d+)/i.test(navigator.userAgent) ? (document.documentMode || + RegExp['\x241']) : undefined;
    baidu.dom._NAME_ATTRS = (function () {
        var result = {
            'cellpadding': 'cellPadding',
            'cellspacing': 'cellSpacing',
            'colspan': 'colSpan',
            'rowspan': 'rowSpan',
            'valign': 'vAlign',
            'usemap': 'useMap',
            'frameborder': 'frameBorder'
        };

        if (baidu.browser.ie < 8) {
            result['for'] = 'htmlFor';
            result['class'] = 'className';
        } else {
            result['htmlFor'] = 'for';
            result['className'] = 'class';
        }

        return result;
    })();

    baidu.dom.setAttr = function (element, key, value) {
        element = baidu.dom.g(element);
        if ('style' == key) {
            element.style.cssText = value;
        } else {
            key = baidu.dom._NAME_ATTRS[key] || key;
            element.setAttribute(key, value);
        }
        return element;
    };
    baidu.setAttr = baidu.dom.setAttr;
    baidu.dom.setAttrs = function (element, attributes) {
        element = baidu.dom.g(element);
        for (var key in attributes) {
            baidu.dom.setAttr(element, key, attributes[key]);
        }
        return element;
    };
    baidu.setAttrs = baidu.dom.setAttrs;
    baidu.dom.create = function (tagName, opt_attributes) {
        var el = document.createElement(tagName),
            attributes = opt_attributes || {};
        return baidu.dom.setAttrs(el, attributes);
    };
    T.undope = true;

    var DrawingManager = function (map, opts) {

        try {
            BMap;
        } catch (e) {
            throw Error('Baidu Map JS API is not ready yet!');
        }

        if (!DrawingManager._isExtended) {
            DrawingManager._isExtended = true;

            extend(DrawingManager, BMap.Overlay, "DrawingManager");
            var drawingManager = new DrawingManager(map, opts);

            this.__proto__ = drawingManager.__proto__;
        }

        let me = this;
        me.map = map;
        me._opts = opts;
        me._drawingType = opts.drawingMode;
        me._enableDraw = opts.enableDraw || false;
        me._fitBounds = opts._fitBounds || true;
        me.markerOptions = opts.markerOptions || {};
        me.circleOptions = opts.circleOptions || {};
        me.areaOptions = opts.areaOptions || {};
        me.radius = opts.circleOptions.radius;

        EventWrapper.addListener(me.map, 'zoomend', () => {
            me._dispatchEvent(me, "draw:zoom_map", me._getZoom());
        });
    }


    DrawingManager.prototype.initialize = function (map) { }

    DrawingManager.prototype.draw = function () { }

    DrawingManager.prototype.open = function () { }

    DrawingManager.prototype.close = function () { }

    DrawingManager.prototype._remove = function () { },

        baidu.object.extend(DrawingManager.prototype, {

            setDrawingMode: function (drawingType) {

                let me = this;

                this._drawingType = drawingType;

                switch (drawingType) {
                    case DRAWING_MODE_MARKER:
                        me._bindMarker();
                        break;
                    case DRAWING_MODE_CIRCLE:
                        me._bindCircle();
                        break;
                    case DRAWING_MODE_AREA:
                        me._bindArea();
                        break;
                    default:
                        me._redraw();
                        break;
                }
            },

            _bindMarker: function () {

                var me = this;

                me._removeCenterMarker();
                me._removeCircle();

                EventWrapper.clearListeners(me.map, 'click');

                var createCenterMarker = (e) => {

                    me._removeArea();
                    me._removeCenterMarker();
                    me._removeCircle();

                    if (e) {

                        me._setPosition(e);
                    }

                    me._removeCircle();

                    if (me.position) {
                        const icon = me.markerOptions.iconUrl ?
                            new BMap.Icon(me.markerOptions.iconUrl, new BMap.Size(24, 28)) : null;
                        me._centerMarker = new BMap.Marker(me.position, me.markerOptions);
                        me.map.addOverlay(me._centerMarker);
                        me._centerMarker.setIcon(icon);

                        me._centerMarker.setZIndex(9999);

                        me.map.setCenter(me.position);
                        if (me.map.getZoom() < 9) {
                            me.map.setZoom(9);
                        }

                        me._dispatchEvent(me, "draw:marker_create", null);

                        me.position = null;
                    }
                }

                if (!this._enableDraw) {
                    createCenterMarker();
                    EventWrapper.clearListeners(me.map, 'click');
                }

                EventWrapper.addListener(me.map, 'click', (event) => {
                    if (this._enableDraw) {
                        createCenterMarker(event)
                    }
                });
            },

            _bindCircle: function () {

                let me = this;

                if (me.circle) {
                    me.map.removeOverlay(me.circle);
                    me.map.removeOverlay(me._vertexMarker);
                    me._dispatchEvent(me, "draw:circle_remove", null);
                }

                let options = {
                    fillOpacity: me.circleOptions.fillOpacity,
                    strokeOpacity: me.circleOptions.strokeOpacity,
                    strokeColor: me.circleOptions.strokeColor,
                    strokeWeight: me.circleOptions.strokeWeight,
                }

                if (me._centerMarker) {

                    me.circle = new BMap.Circle(me._centerMarker.getPosition(), me.radius, options);
                    me.map.addOverlay(me.circle);

                    me._dispatchEvent(me, "draw:circle_create", this._getInfo());

                    me._createVertexMarker();

                    me._centerMarker.enableDragging();

                    me._centerMarkerAddEventListener();

                    me.setCircleFitBounds();

                }

            },

            _bindArea: function () {

                var me = this;

                me._removeArea();
                me._removeCenterMarker();
                me._removeCircle();

                var createArea = () => {

                    var patch = [];

                    me._setDrawing(false);

                    let options = {
                        strokeColor: me.areaOptions.strokeColor,
                        strokeOpacity: me.areaOptions.strokeOpacity,
                        fillColor: me.areaOptions.fillColor,
                        fillOpacity: me.areaOptions.fillOpacity,
                        strokeWeight: me.areaOptions.strokeWeight,
                    }

                    me.area = new BMap.Polyline([], options);
                    me.map.addOverlay(me.area);

                    var move = EventWrapper.addListener(me.map, 'mousemove', (event) => {
                        patch.push(event.point);
                        me.area.setPath(patch);

                    });


                    EventWrapper.addListenerOnce(me.map, 'mouseup', () => {

                        EventWrapper.removeListener(move);
                        me.map.removeOverlay(me.area);

                        me.area = new BMap.Polygon(patch, options);
                        me.map.addOverlay(me.area);

                        me._dispatchEvent(me, "draw:area_create", me._convertCoordinates(me.area.getPath()));

                        me._setDrawing(true);

                        me._fitBoundsArea(patch);

                    });
                }


                EventWrapper.addListenerOnce(me.map, 'mousedown', () => {
                    createArea();
                });
            },


            _redraw: function () {

                let me = this;

                me._removeArea();
                me._removeCenterMarker();
                me._removeCircle();
            },

            _setDrawing: function (enabled) {

                let me = this;

                enabled ? me.map.enableDragging() : me.map.disableDragging();
                enabled ? me.map.enableScrollWheelZoom() : me.map.disableScrollWheelZoom();
                enabled ? me.map.enableDoubleClickZoom() : me.map.disableDoubleClickZoom();

            },

            _fitBoundsArea: function () {

                let me = this;

                me.map.setViewport(me.area.getBounds());

            },

            _convertCoordinates: function (coordinates) {

                let positions = [];

                for (var n = 0; n < coordinates.length; n++) {
                    let item = coordinates[n];
                    let position = {
                        latitude: item.lat,
                        longitude: item.lng,
                    }
                    positions.push(position);
                }
                return positions;

            },

            setPosition: function (latitude, longitude) {
                let me = this;

                me.position = null;
                me.position = new BMap.Point(longitude, latitude);
            },

            _setPosition: function (e) {
                let me = this;

                me.position = null;
                me.position = e.point;
            },

            setEnableDraw: function (enabled) {
                this._enableDraw = enabled;
            },

            setDefaultCursor: function (cursor) {
                let me = this;
                me.map.setDefaultCursor(cursor);
            },

            setAreaFitBounds: function (enabled) {

            },

            setMarkerFitBounds: function (enabled) {

            },


            _removeCircle: function () {

                let me = this;

                if (me.circle) {
                    me.map.removeOverlay(me.circle);
                    me.map.removeOverlay(me._vertexMarker);
                    me.circle = null;
                    me._vertexMarker = null;
                    me._dispatchEvent(me, "draw:circle_remove", null);
                }
            },

            _removeCenterMarker: function () {

                let me = this;

                if (me._centerMarker) {
                    me.map.removeOverlay(me._centerMarker);
                    me._centerMarker = null;
                    me._dispatchEvent(me, "draw:marker_remove", null);
                }

            },

            _removeArea: function () {

                let me = this;

                if (me.area) {
                    me.map.removeOverlay(me.area);
                    me.area = null;
                    me._dispatchEvent(me, "draw:area_remove", null);
                }

            },

            setCircleFitBounds: function (enabled) {
                let me = this;
                me.map.setViewport(me.circle.getBounds());
            },

            _getInfo: function () {

                let me = this;
                let position = {
                    latitude: me._centerMarker.getPosition().lat,
                    longitude: me._centerMarker.getPosition().lng
                }
                let info = {
                    radius: me.circle.getRadius(),
                    position,
                };

                return info;
            },

            _getZoom: function () {

                let me = this;

                let zoom = {
                    zoom: me.map.getZoom()
                }
                return zoom;
            },

            _vertexMarkerAddEventListener: function () {

                let me = this;

                me._vertexMarker.addEventListener('dragging', function (event) {

                    let distance = me.getDistanceTo(me._centerMarker.getPosition(), event.point);

                    me.radius = distance;

                    if (me.circle) {
                        me.circle.setRadius(distance);
                    }

                    let pixel = {
                        clientX: event.pixel.x,
                        clientY: event.pixel.y + 10,
                    }
                    let ev = {
                        pixel,
                        radius: me.circle.getRadius(),
                    }
                    me._dispatchEvent(me, "draw:circle_radius_change", ev);
                });

                me._vertexMarker.addEventListener('dragging', function (event) {
                    let pixel = {
                        clientX: event.pixel.x,
                        clientY: event.pixel.y,
                    }
                    let ev = {
                        pixel,
                        radius: me.circle.getRadius(),
                    }
                    me._dispatchEvent(me, "draw:circle_radius_change", ev);
                })

                me._vertexMarker.addEventListener('dragend', function () {

                    let position = {
                        latitude: me._centerMarker.getPosition().lat,
                        longitude: me._centerMarker.getPosition().lng
                    }
                    let info = {
                        radius: me.circle.getRadius(),
                        position,
                        latLng: me._centerMarker.getPosition()
                    };

                    me._dispatchEvent(me, "draw:circle_radius_complete", info);
                });
            },

            _centerMarkerAddEventListener: function () {

                let me = this;

                me._centerMarker.addEventListener('dragging', (event) => {
                    me.circle.setCenter(event.point);

                    let to = me.destination(event.point, 90, me.radius);
                    if (me._vertexMarker) {
                        me._vertexMarker.setPosition(to);
                    }

                    me._dispatchEvent(me, "draw:circle_centre_change", me._getInfo());
                });

                me._centerMarker.addEventListener('dragend', () => {

                    me._dispatchEvent(me, "draw:circle_center_complete", me._getInfo());

                });

                me._centerMarker.addEventListener('mouseout', () => {

                    me._dispatchEvent(me, "draw:marker_mouseout", me._getInfo());
                });

                me._centerMarker.addEventListener('mouseover', () => {

                    me._dispatchEvent(me, "draw:marker_mouseover", me._getInfo());

                });

                me._centerMarker.addEventListener('click', () => {

                    me._dispatchEvent(me, "draw:marker_click", me._getInfo(event));

                });

            },

            _createVertexMarker: function () {

                let me = this;
                this.to = null;
                this.to = me.destination(this._centerMarker.getPosition(), 90, this.radius);

                if (me._vertexMarker) {
                    me.map.removeOverlay(this._vertexMarker);
                }

                me._vertexMarker = new BMap.Marker(me.to, me.markerOptions);

                me.map.addOverlay(me._vertexMarker);

                me._vertexMarker.enableDragging();

                const svg = [
                    '<?xml version="1.0"?>',
                    '<svg width="15px" height="15px" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg">',
                    '<circle stroke="#003dd9" fill="white" stroke-width="10" cx="50" cy="50" r="35"/>',
                    '</svg>'
                ].join('\n');

                const iconU = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);

                const icon = 'me.markerOptions.iconUrl' ?
                    new BMap.Icon(iconU, new BMap.Size(15, 15)) : null;

                me._vertexMarker.setIcon(icon);

                me._vertexMarkerAddEventListener();

            },

            destination: function (latlng, heading, distance) {

                heading = (heading + 360) % 360;
                var rad = Math.PI / 180,
                    radInv = 180 / Math.PI,
                    R = 6378137,
                    lon1 = latlng.lng * rad,
                    lat1 = latlng.lat * rad,
                    rheading = heading * rad,
                    sinLat1 = Math.sin(lat1),
                    cosLat1 = Math.cos(lat1),
                    cosDistR = Math.cos(distance / R),
                    sinDistR = Math.sin(distance / R),
                    lat2 = Math.asin(sinLat1 * cosDistR + cosLat1 *
                        sinDistR * Math.cos(rheading)),
                    lon2 = lon1 + Math.atan2(Math.sin(rheading) * sinDistR *
                        cosLat1, cosDistR - sinLat1 * Math.sin(lat2));
                lon2 = lon2 * radInv;
                lon2 = lon2 > 180 ? lon2 - 360 : lon2 < -180 ? lon2 + 360 : lon2;
                return new BMap.Point(lon2, lat2 * radInv);
            }
            ,

            degreeToRad: function (degree) {

                return Math.PI * degree / 180;
            },

            _getRange: function (v, a, b) {

                if (a != null) {
                    v = Math.max(v, a);
                }
                if (b != null) {
                    v = Math.min(v, b);
                }
                return v;
            },

            _getLoop: function (v, a, b) {

                while (v > b) {
                    v -= b - a
                }
                while (v < a) {
                    v += b - a
                }
                return v;
            },

            getDistanceTo: function (point1, point2) {
                var me = this;
                if (!(point1 instanceof BMap.Point) ||
                    !(point2 instanceof BMap.Point)) {
                    return 0;
                }

                point1.lng = me._getLoop(point1.lng, -180, 180);
                point1.lat = me._getRange(point1.lat, -74, 74);
                point2.lng = me._getLoop(point2.lng, -180, 180);
                point2.lat = me._getRange(point2.lat, -74, 74);

                var x1, x2, y1, y2;
                x1 = this.degreeToRad(point1.lng);
                y1 = this.degreeToRad(point1.lat);
                x2 = this.degreeToRad(point2.lng);
                y2 = this.degreeToRad(point2.lat);

                return 6370996.81 * Math.acos((Math.sin(y1) * Math.sin(y2) + Math.cos(y1) * Math.cos(y2) * Math.cos(x2 - x1)));
            },

            _stopBubble: function (e) {

                if (e && e.stopPropagation) {
                    e.stopPropagation();
                } else {
                    window.event.cancelBubble = true;
                }
            },

            _dispatchEvent: function (instance, type, opts) {

                type.indexOf("on") != 0 && (type = "on" + type);
                var event = new baidu.lang.Event(type);
                if (!!opts) {
                    for (var p in opts) {
                        event[p] = opts[p];
                    }
                }
                instance.dispatchEvent(event);
            }
        });
    return DrawingManager;
});
