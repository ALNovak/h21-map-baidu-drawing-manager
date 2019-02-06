
/**
 * @fileoverview 百度地图的鼠标绘制工具，对外开放。
 * 允许用户在地图上点击完成鼠标绘制的功能。
 * 使用者可以自定义所绘制结果的相关样式，例如线宽、颜色、测线段距离、面积等等。
 * 主入口类是<a href="symbols/BMapLib.DrawingManager.html">DrawingManager</a>，
 * 基于Baidu Map API 1.4。
 *
 * @author Baidu Map Api Group 
 * @version 1.4
 */

var BMapLib = window.BMapLib = BMapLib || {};

var BMAP_DRAWING_MARKER    = "marker",     // 鼠标画点模式
    BMAP_DRAWING_POLYLINE  = "polyline",   // 鼠标画线模式
    BMAP_DRAWING_CIRCLE    = "circle",     // 鼠标画圆模式
    BMAP_DRAWING_RECTANGLE = "rectangle",  // 鼠标画矩形模式
    BMAP_DRAWING_POLYGON   = "polygon";    // 鼠标画多边形模式

(function() {

    /**
     * 声明baidu包
     */
    var baidu = baidu || {guid : "$BAIDU$"};
    (function() {
        window[baidu.guid] = {};

        baidu.extend = function (target, source) {
            for (var p in source) {
                if (source.hasOwnProperty(p)) {
                    target[p] = source[p];
                }
            }    
            return target;
        };

        baidu.lang = baidu.lang || {};

        baidu.lang.guid = function() {
            return "TANGRAM__" + (window[baidu.guid]._counter ++).toString(36);
        };

        window[baidu.guid]._counter = window[baidu.guid]._counter || 1;

        window[baidu.guid]._instances = window[baidu.guid]._instances || {};

        baidu.lang.Class = function(guid) {
            this.guid = guid || baidu.lang.guid();
            window[baidu.guid]._instances[this.guid] = this;
        };

        window[baidu.guid]._instances = window[baidu.guid]._instances || {};

        baidu.lang.isString = function (source) {
            return '[object String]' == Object.prototype.toString.call(source);
        };

        baidu.lang.isFunction = function (source) {
            return '[object Function]' == Object.prototype.toString.call(source);
        };

        baidu.lang.Class.prototype.toString = function(){
            return "[object " + (this._className || "Object" ) + "]";
        };
		
        baidu.lang.Class.prototype.dispose = function(){
            delete window[baidu.guid]._instances[this.guid];
            for(var property in this){
                if (!baidu.lang.isFunction(this[property])) {
                    delete this[property];
                }
            }
            this.disposed = true;
        };

        baidu.lang.Event = function (type, target) {
            this.type = type;
            this.returnValue = true;
            this.target = target || null;
            this.currentTarget = null;
        };

        baidu.lang.Class.prototype.addEventListener = function (type, handler, key) {
            if (!baidu.lang.isFunction(handler)) {
                return;
            }
            !this.__listeners && (this.__listeners = {});
            var t = this.__listeners, id;
            if (typeof key == "string" && key) {
                if (/[^\w\-]/.test(key)) {
                    throw("nonstandard key:" + key);
                } else {
                    handler.hashCode = key; 
                    id = key;
                }
            }
            type.indexOf("on") != 0 && (type = "on" + type);
            typeof t[type] != "object" && (t[type] = {});
            id = id || baidu.lang.guid();
            handler.hashCode = id;
            t[type][id] = handler;
        };
         
        baidu.lang.Class.prototype.removeEventListener = function (type, handler) {
            if (baidu.lang.isFunction(handler)) {
                handler = handler.hashCode;
            } else if (!baidu.lang.isString(handler)) {
                return;
            }
            !this.__listeners && (this.__listeners = {});
            type.indexOf("on") != 0 && (type = "on" + type);
            var t = this.__listeners;
            if (!t[type]) {
                return;
            }
            t[type][handler] && delete t[type][handler];
        };

        baidu.lang.Class.prototype.dispatchEvent = function (event, options) {
            if (baidu.lang.isString(event)) {
                event = new baidu.lang.Event(event);
            }
            !this.__listeners && (this.__listeners = {});
            options = options || {};
            for (var i in options) {
                event[i] = options[i];
            }
            var i, t = this.__listeners, p = event.type;
            event.target = event.target || this;
            event.currentTarget = this;
            p.indexOf("on") != 0 && (p = "on" + p);
            baidu.lang.isFunction(this[p]) && this[p].apply(this, arguments);
            if (typeof t[p] == "object") {
                for (i in t[p]) {
                    t[p][i].apply(this, arguments);
                }
            }
            return event.returnValue;
        };

        baidu.lang.inherits = function (subClass, superClass, className) {
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

        baidu.dom = baidu.dom || {};
        baidu._g = baidu.dom._g = function (id) {
            if (baidu.lang.isString(id)) {
                return document.getElementById(id);
            }
            return id;
        };

      
        baidu.g = baidu.dom.g = function (id) {
            if ('string' == typeof id || id instanceof String) {
                return document.getElementById(id);
            } else if (id && id.nodeName && (id.nodeType == 1 || id.nodeType == 9)) {
                return id;
            }
            return null;
        };

        baidu.insertHTML = baidu.dom.insertHTML = function (element, position, html) {
            element = baidu.dom.g(element);
            var range,begin;

            if (element.insertAdjacentHTML) {
                element.insertAdjacentHTML(position, html);
            } else {
            
                range = element.ownerDocument.createRange();
                position = position.toUpperCase();
                if (position == 'AFTERBEGIN' || position == 'BEFOREEND') {
                    range.selectNodeContents(element);
                    range.collapse(position == 'AFTERBEGIN');
                } else {
                    begin = position == 'BEFOREBEGIN';
                    range[begin ? 'setStartBefore' : 'setEndAfter'](element);
                    range.collapse(begin);
                }
                range.insertNode(range.createContextualFragment(html));
            }
            return element;
        };

        baidu.ac = baidu.dom.addClass = function (element, className) {
            element = baidu.dom.g(element);
            var classArray = className.split(/\s+/),
                result = element.className,
                classMatch = " " + result + " ",
                i = 0,
                l = classArray.length;

            for (; i < l; i++){
                 if ( classMatch.indexOf( " " + classArray[i] + " " ) < 0 ) {
                     result += (result ? ' ' : '') + classArray[i];
                 }
            }

            element.className = result;
            return element;
        };

        baidu.event = baidu.event || {};

        baidu.event._listeners = baidu.event._listeners || [];

        baidu.on = baidu.event.on = function (element, type, listener) {
            type = type.replace(/^on/i, '');
            element = baidu._g(element);
            var realListener = function (ev) {
           
                listener.call(element, ev);
            },
            lis = baidu.event._listeners,
            filter = baidu.event._eventFilter,
            afterFilter,
            realType = type;
            type = type.toLowerCase();
            if(filter && filter[type]){
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

        baidu.un = baidu.event.un = function (element, type, listener) {
            element = baidu._g(element);
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

        baidu.getEvent = baidu.event.getEvent = function (event) {
            return window.event || event;
        }

        baidu.getTarget = baidu.event.getTarget = function (event) {
            var event = baidu.getEvent(event);
            return event.target || event.srcElement;
        }

        baidu.preventDefault = baidu.event.preventDefault = function (event) {
           var event = baidu.getEvent(event);
           if (event.preventDefault) {
               event.preventDefault();
           } else {
               event.returnValue = false;
           }
        };

        /**
         * 停止事件冒泡传播
         * @param {Event}
         */
        baidu.stopBubble = baidu.event.stopBubble = function (event) {
            event = baidu.getEvent(event);
            event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
        }

    })();

    var DrawingManager =
        BMapLib.DrawingManager = function(map, opts){
            if (!map) {
                return;
            }
            instances.push(this);
            
            opts = opts || {};

            this._initialize(map, opts);
        }

    baidu.lang.inherits(DrawingManager, baidu.lang.Class, "DrawingManager");

    DrawingManager.prototype.open = function() {
        if (this._isOpen == true){
            return true;
        }
        closeInstanceExcept(this);

        this._open();
    }

    DrawingManager.prototype.close = function() {
        if (this._isOpen == false){
            return true;
        }

        this._close();
    }

    DrawingManager.prototype.setDrawingMode = function(drawingType) {
        if (this._drawingType != drawingType) {
            closeInstanceExcept(this);
            this._setDrawingMode(drawingType);
        }
    }

   
    DrawingManager.prototype.getDrawingMode = function() {
        return this._drawingType;
    }

   
    DrawingManager.prototype.enableCalculate = function() {
        this._enableCalculate = true;
        this._addGeoUtilsLibrary();
    }

   
    DrawingManager.prototype.disableCalculate = function() {
        this._enableCalculate = false;
    }

	
    DrawingManager.prototype._initialize = function(map, opts) {
		
        this._map = map;

        this._opts = opts;

        this._drawingType = opts.drawingMode || BMAP_DRAWING_MARKER;

        if (opts.enableDrawingTool) {
            var drawingTool  = new DrawingTool(this, opts.drawingToolOptions);
            this._drawingTool = drawingTool;
            map.addControl(drawingTool);
        }
 
        if (opts.enableCalculate === true) {
            this.enableCalculate();
        } else {
            this.disableCalculate();
        }

        this._isOpen = !!(opts.isOpen === true);
        if (this._isOpen) {
            this._open();
        }

        this.markerOptions    = opts.markerOptions    || {};
        this.circleOptions    = opts.circleOptions    || {};
        this.polylineOptions  = opts.polylineOptions  || {};
        this.polygonOptions   = opts.polygonOptions   || {};
        this.rectangleOptions = opts.rectangleOptions || {};

    },

    DrawingManager.prototype._open = function() {

        this._isOpen = true;
        if (!this._mask) {
            this._mask = new Mask();
        }
        this._map.addOverlay(this._mask);
        this._setDrawingMode(this._drawingType);

    }

    DrawingManager.prototype._setDrawingMode = function(drawingType) {

        this._drawingType = drawingType;
        if (this._isOpen) {
            this._mask.__listeners = {};

            switch (drawingType) {
                case BMAP_DRAWING_MARKER:
                    this._bindMarker();
                    break;
                case BMAP_DRAWING_CIRCLE:
                    this._bindCircle();
                    break;
                case BMAP_DRAWING_POLYLINE:
                case BMAP_DRAWING_POLYGON:
                    this._bindPolylineOrPolygon();
                    break;
                case BMAP_DRAWING_RECTANGLE:
                    this._bindRectangle();
                    break;
            }
        }

        if (this._drawingTool && this._isOpen) {
            this._drawingTool.setStyleByDrawingMode(drawingType);
        }
    }

    DrawingManager.prototype._close = function() {

        this._isOpen = false;

        if (this._mask) {
            this._map.removeOverlay(this._mask);
        }

        if (this._drawingTool) {
            this._drawingTool.setStyleByDrawingMode("hander");
        }
    }

    DrawingManager.prototype._bindMarker = function() {

        var me   = this,
            map  = this._map,
            mask = this._mask;
			
        var clickAction = function (e) {
            var marker = new BMap.Marker(e.point, me.markerOptions);
            map.addOverlay(marker);
            me._dispatchOverlayComplete(marker);
        }

        mask.addEventListener('click', clickAction);
    }

    DrawingManager.prototype._bindCircle = function() {

        var me           = this,
            map          = this._map,
            mask         = this._mask,
            circle       = null,
            centerPoint  = null; 

        var startAction = function (e) {
            centerPoint = e.point;
            circle = new BMap.Circle(centerPoint, 0, me.circleOptions);
            map.addOverlay(circle);
            mask.enableEdgeMove();
            mask.addEventListener('mousemove', moveAction);
            baidu.on(document, 'mouseup', endAction);
        }

        var moveAction = function(e) {
            circle.setRadius(me._map.getDistance(centerPoint, e.point));
        }

        var endAction = function (e) {
            var calculate = me._calculate(circle, e.point);
            me._dispatchOverlayComplete(circle, calculate);
            centerPoint = null;
            mask.disableEdgeMove();
            mask.removeEventListener('mousemove', moveAction);
            baidu.un(document, 'mouseup', endAction);
        }

        var mousedownAction = function (e) {
            baidu.preventDefault(e);
            baidu.stopBubble(e);
            if (centerPoint == null) {
                startAction(e);
            } 
        }

        mask.addEventListener('mousedown', mousedownAction);
    }

    DrawingManager.prototype._bindPolylineOrPolygon = function() {

        var me           = this,
            map          = this._map,
            mask         = this._mask,
            points       = [],   //用户绘制的点
            drawPoint    = null; //实际需要画在地图上的点
            overlay      = null,
            isBinded     = false;

        var startAction = function (e) {
            points.push(e.point);
            drawPoint = points.concat(points[points.length - 1]);
            if (points.length == 1) {
                if (me._drawingType == BMAP_DRAWING_POLYLINE) {
                    overlay = new BMap.Polyline(drawPoint, me.polylineOptions);
                } else if (me._drawingType == BMAP_DRAWING_POLYGON) {
                    overlay = new BMap.Polygon(drawPoint, me.polygonOptions);
                }
                map.addOverlay(overlay);
            } else {
                overlay.setPath(drawPoint);
            }
            if (!isBinded) {
                isBinded = true;
                mask.enableEdgeMove();
                mask.addEventListener('mousemove', mousemoveAction);
                mask.addEventListener('dblclick', dblclickAction);
            }
        }

        var mousemoveAction = function(e) {
            overlay.setPositionAt(drawPoint.length - 1, e.point);
        }

        var dblclickAction = function (e) {
            baidu.stopBubble(e);
            isBinded = false;
            mask.disableEdgeMove();
            mask.removeEventListener('mousemove', mousemoveAction);
            mask.removeEventListener('dblclick', dblclickAction);
            overlay.setPath(points);
            var calculate = me._calculate(overlay, points.pop());
            me._dispatchOverlayComplete(overlay, calculate);
            points.length = 0;
            drawPoint.length = 0;
        }

        mask.addEventListener('click', startAction);
        mask.addEventListener('dblclick', function(e){
            baidu.stopBubble(e);
        });
    }

    DrawingManager.prototype._bindRectangle = function() {

        var me           = this,
            map          = this._map,
            mask         = this._mask,
            polygon      = null,
            startPoint   = null;

        var startAction = function (e) {
            baidu.stopBubble(e);
            baidu.preventDefault(e);
            startPoint = e.point;
            var endPoint = startPoint;
            polygon = new BMap.Polygon(me._getRectanglePoint(startPoint, endPoint), me.rectangleOptions);
            map.addOverlay(polygon);
            mask.enableEdgeMove();
            mask.addEventListener('mousemove', moveAction);
            baidu.on(document, 'mouseup', endAction);
        }

        var moveAction = function(e) {
            polygon.setPath(me._getRectanglePoint(startPoint, e.point));
        }

        var endAction = function (e) {
            var calculate = me._calculate(polygon, polygon.getPath()[2]);
            me._dispatchOverlayComplete(polygon, calculate);
            startPoint = null;
            mask.disableEdgeMove();
            mask.removeEventListener('mousemove', moveAction);
            baidu.un(document, 'mouseup', endAction);
        }

        mask.addEventListener('mousedown', startAction);
    }

    DrawingManager.prototype._calculate = function (overlay, point) {
        var result = {
            data  : 0,   
            label : null  
        };
        if (this._enableCalculate && BMapLib.GeoUtils) {
            var type = overlay.toString();
            switch (type) {
                case "[object Polyline]":
                    result.data = BMapLib.GeoUtils.getPolylineDistance(overlay);
                    break;
                case "[object Polygon]":
                    result.data = BMapLib.GeoUtils.getPolygonArea(overlay);
                    break;
                case "[object Circle]":
                    var radius = overlay.getRadius();
                    result.data = Math.PI * radius * radius;
                    break;
            }
            if (!result.data || result.data < 0) {
                result.data = 0;
            } else {
             
                result.data = result.data.toFixed(2);
            }
            result.label = this._addLabel(point, result.data);
        }
        return result;
    }

    DrawingManager.prototype._addGeoUtilsLibrary = function () {
        if (!BMapLib.GeoUtils) {
            var script = document.createElement('script');
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", 'http://api.map.baidu.com/library/GeoUtils/1.2/src/GeoUtils_min.js');
            document.body.appendChild(script);
        }
    }

    DrawingManager.prototype._addLabel = function (point, content) {
        var label = new BMap.Label(content, {
            position: point
        });
        this._map.addOverlay(label);
        return label;
    }

    DrawingManager.prototype._getRectanglePoint = function (startPoint, endPoint) {
        return [
            new BMap.Point(startPoint.lng,startPoint.lat),
            new BMap.Point(endPoint.lng,startPoint.lat),
            new BMap.Point(endPoint.lng,endPoint.lat),
            new BMap.Point(startPoint.lng,endPoint.lat)
        ];
    }

    DrawingManager.prototype._dispatchOverlayComplete = function (overlay, calculate) {
        var options = {
            'overlay'     : overlay,
            'drawingMode' : this._drawingType
        };
        if (calculate) {
            options.calculate = calculate.data || null;
            options.label = calculate.label || null;
        }
        this.dispatchEvent(this._drawingType + 'complete', overlay);
        this.dispatchEvent('overlaycomplete', options);
    }

 
    function Mask(){
        this._enableEdgeMove = false;
    }

    Mask.prototype = new BMap.Overlay();
    Mask.prototype.dispatchEvent = baidu.lang.Class.prototype.dispatchEvent;
    Mask.prototype.addEventListener = baidu.lang.Class.prototype.addEventListener;
    Mask.prototype.removeEventListener = baidu.lang.Class.prototype.removeEventListener;

    Mask.prototype.initialize = function(map){
        var me = this;
        this._map = map;
        var div = this.container = document.createElement("div");
        var size = this._map.getSize();
        div.style.cssText = "position:absolute;background:url(about:blank);cursor:crosshair;width:" + size.width + "px;height:" + size.height + "px";
        this._map.addEventListener('resize', function(e) {
            me._adjustSize(e.size);
        });
        this._map.getPanes().floatPane.appendChild(div);
        this._bind();
        return div; 
    };

    Mask.prototype.draw = function() {
        var map   = this._map,
            point = map.pixelToPoint(new BMap.Pixel(0, 0)),
            pixel = map.pointToOverlayPixel(point);
        this.container.style.left = pixel.x + "px";
        this.container.style.top  = pixel.y + "px"; 
    };

    Mask.prototype.enableEdgeMove = function() {
        this._enableEdgeMove = true;
    }

    Mask.prototype.disableEdgeMove = function() {
        clearInterval(this._edgeMoveTimer);
        this._enableEdgeMove = false;
    }

    Mask.prototype._bind = function() {

        var me = this,
            map = this._map,
            container = this.container,
            lastMousedownXY = null,
            lastClickXY = null;

        var getXYbyEvent = function(e){
            return {
                x : e.clientX,
                y : e.clientY
            }
        };

        var domEvent = function(e) {
            var type = e.type;
                e = baidu.getEvent(e);
                point = me.getDrawPoint(e); 

            var dispatchEvent = function(type) {
                e.point = point;
                me.dispatchEvent(e);
            }

            if (type == "mousedown") {
                lastMousedownXY = getXYbyEvent(e);
            }

            var nowXY = getXYbyEvent(e);
            if (type == "click") {
                if (Math.abs(nowXY.x - lastMousedownXY.x) < 5 && Math.abs(nowXY.y - lastMousedownXY.y) < 5 ) {
                    if (!lastClickXY || !(Math.abs(nowXY.x - lastClickXY.x) < 5 && Math.abs(nowXY.y - lastClickXY.y) < 5)) {
                        dispatchEvent('click');
                        lastClickXY = getXYbyEvent(e);
                    } else {
                        lastClickXY = null;
                    }
                }
            } else {
                dispatchEvent(type);
            }
        }

        var events = ['click', 'mousedown', 'mousemove', 'mouseup', 'dblclick'],
            index = events.length;
        while (index--) {
            baidu.on(container, events[index], domEvent);
        }

        baidu.on(container, 'mousemove', function(e) {
            if (me._enableEdgeMove) {
                me.mousemoveAction(e);
            }
        });
    };

    Mask.prototype.mousemoveAction = function(e) {
        function getClientPosition(e) {
            var clientX = e.clientX,
                clientY = e.clientY;
            if (e.changedTouches) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            }
            return new BMap.Pixel(clientX, clientY);
        }

        var map       = this._map,
            me        = this,
            pixel     = map.pointToPixel(this.getDrawPoint(e)),
            clientPos = getClientPosition(e),
            offsetX   = clientPos.x - pixel.x,
            offsetY   = clientPos.y - pixel.y;
        pixel = new BMap.Pixel((clientPos.x - offsetX), (clientPos.y - offsetY));
        this._draggingMovePixel = pixel;
        var point = map.pixelToPoint(pixel),
            eventObj = {
                pixel: pixel,
                point: point
            };
        this._panByX = this._panByY = 0;
        if (pixel.x <= 20 || pixel.x >= map.width - 20
            || pixel.y <= 50 || pixel.y >= map.height - 10) {
            if (pixel.x <= 20) {
                this._panByX = 8;
            } else if (pixel.x >= map.width - 20) {
                this._panByX = -8;
            }
            if (pixel.y <= 50) {
                this._panByY = 8;
            } else if (pixel.y >= map.height - 10) {
                this._panByY = -8;
            }
            if (!this._edgeMoveTimer) {
                this._edgeMoveTimer = setInterval(function(){
                    map.panBy(me._panByX, me._panByY, {"noAnimation": true});
                }, 30);
            }
        } else {
            if (this._edgeMoveTimer) {
                clearInterval(this._edgeMoveTimer);
                this._edgeMoveTimer = null;
            }
        }
    }

    Mask.prototype._adjustSize = function(size) {
        this.container.style.width  = size.width + 'px';
        this.container.style.height = size.height + 'px';
    };
    Mask.prototype.getDrawPoint = function(e) {
        
        var map = this._map,
        trigger = baidu.getTarget(e),
        x = e.offsetX || e.layerX || 0,
        y = e.offsetY || e.layerY || 0;
        if (trigger.nodeType != 1) trigger = trigger.parentNode;
        while (trigger && trigger != map.getContainer()) {
            if (!(trigger.clientWidth == 0 &&
                trigger.clientHeight == 0 &&
                trigger.offsetParent && trigger.offsetParent.nodeName == 'TD')) {
                x += trigger.offsetLeft || 0;
                y += trigger.offsetTop || 0;
            }
            trigger = trigger.offsetParent;
        }
        var pixel = new BMap.Pixel(x, y);
        var point = map.pixelToPoint(pixel);
        return point;

    }

    function DrawingTool(drawingManager, drawingToolOptions) {
        this.drawingManager = drawingManager;

        drawingToolOptions = this.drawingToolOptions = drawingToolOptions || {};
        this.defaultAnchor = BMAP_ANCHOR_TOP_LEFT;
        this.defaultOffset = new BMap.Size(10, 10);

        this.defaultDrawingModes = [
            BMAP_DRAWING_MARKER,
            BMAP_DRAWING_CIRCLE,
            BMAP_DRAWING_POLYLINE,
            BMAP_DRAWING_POLYGON,
            BMAP_DRAWING_RECTANGLE
        ];
        if (drawingToolOptions.drawingModes) {
            this.drawingModes = drawingToolOptions.drawingModes;
        } else {
            this.drawingModes = this.defaultDrawingModes
        }

        if (drawingToolOptions.anchor) {
            this.setAnchor(drawingToolOptions.anchor);
        }
        if (drawingToolOptions.offset) {
            this.setOffset(drawingToolOptions.offset);
        }
    }

    DrawingTool.prototype = new BMap.Control();
    DrawingTool.prototype.initialize = function(map){
        var container = this.container = document.createElement("div");
        container.className = "BMapLib_Drawing";
        var panel = this.panel = document.createElement("div");
        panel.className = "BMapLib_Drawing_panel";
        if (this.drawingToolOptions && this.drawingToolOptions.scale) {
            this._setScale(this.drawingToolOptions.scale);
        }
        container.appendChild(panel);
        panel.innerHTML = this._generalHtml();
        this._bind(panel);
        map.getContainer().appendChild(container);
        return container;
    }

    DrawingTool.prototype._generalHtml = function(map){

        var tips = {};
        tips["hander"]               = "拖动地图";
        tips[BMAP_DRAWING_MARKER]    = "画点";
        tips[BMAP_DRAWING_CIRCLE]    = "画圆";
        tips[BMAP_DRAWING_POLYLINE]  = "画折线";
        tips[BMAP_DRAWING_POLYGON]   = "画多边形";
        tips[BMAP_DRAWING_RECTANGLE] = "画矩形";

        var getItem = function(className, drawingType) {
            return '<a class="' + className + '" drawingType="' + drawingType + '" href="javascript:void(0)" title="' + tips[drawingType] + '" onfocus="this.blur()"></a>';
        }

        var html = [];
        html.push(getItem("BMapLib_box BMapLib_hander", "hander"));
        for (var i = 0, len = this.drawingModes.length; i < len; i++) {
            var classStr = 'BMapLib_box BMapLib_' + this.drawingModes[i];
            if (i == len-1) {
                classStr += ' BMapLib_last';
            }
            html.push(getItem(classStr, this.drawingModes[i]));
        }
        return html.join('');
    }

    DrawingTool.prototype._setScale = function(scale){
        var width  = 390,
            height = 50,
            ml = -parseInt((width - width * scale) / 2, 10),
            mt = -parseInt((height - height * scale) / 2, 10);
        this.container.style.cssText = [
            "-moz-transform: scale(" + scale + ");",
            "-o-transform: scale(" + scale + ");",
            "-webkit-transform: scale(" + scale + ");",
            "transform: scale(" + scale + ");",
            "margin-left:" + ml + "px;",
            "margin-top:" + mt + "px;",
            "*margin-left:0px;", //ie6、7
            "*margin-top:0px;",  //ie6、7
            "margin-left:0px\\0;", //ie8
            "margin-top:0px\\0;",  //ie8
            "filter: progid:DXImageTransform.Microsoft.Matrix(",
            "M11=" + scale + ",",
            "M12=0,",
            "M21=0,",
            "M22=" + scale + ",",
            "SizingMethod='auto expand');"
        ].join('');
    }

    DrawingTool.prototype._bind = function(panel){
        var me = this;
        baidu.on(this.panel, 'click', function (e) {
            var target = baidu.getTarget(e);
            var drawingType = target.getAttribute('drawingType');
            me.setStyleByDrawingMode(drawingType);
            me._bindEventByDraingMode(drawingType);
        });
    }

    DrawingTool.prototype.setStyleByDrawingMode = function(drawingType){
        if (!drawingType) {
            return;
        }
        var boxs = this.panel.getElementsByTagName("a");
        for (var i = 0, len = boxs.length; i < len; i++) {
            var box = boxs[i];
            if (box.getAttribute('drawingType') == drawingType) {
                var classStr = "BMapLib_box BMapLib_" + drawingType + "_hover";
                if (i == len - 1) {
                    classStr += " BMapLib_last";
                }
                box.className = classStr;
            } else {
                box.className = box.className.replace(/_hover/, "");
            }
        }
    }

    DrawingTool.prototype._bindEventByDraingMode = function(drawingType){
        var drawingManager = this.drawingManager;
        if (drawingType == "hander") {
            drawingManager.close();
        } else {
            drawingManager.setDrawingMode(drawingType);
            drawingManager.open();
        }
    }
    var instances = [];
    function closeInstanceExcept(instance) {
        var index = instances.length;
        while (index--) {
            if (instances[index] != instance) {
                instances[index].close();
            }
        }
    }

})();
