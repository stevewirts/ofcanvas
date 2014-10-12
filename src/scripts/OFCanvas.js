/* globals HTMLElement, document, requestAnimationFrame */
'use strict';

var g = require('rectangles');
var OFCanvasCompositeComponent = require('./OFCanvasCompositeComponent');

var CanvasPrototype = Object.create(HTMLElement.prototype);

CanvasPrototype.attachedCallback = function() {

    var self = this;
    this.style.overflow = 'hidden';
    var documentFragment = document.createDocumentFragment();
    documentFragment.appendChild(document.createElement('canvas'));
    var shadowRoot = this.createShadowRoot();
    shadowRoot.appendChild(document.createElement('canvas'));
    var canvas = shadowRoot.querySelector('canvas');
    var canvasCTX = canvas.getContext('2d');
    var buffer = documentFragment.querySelector('canvas');
    var fps = this.getAttribute('fps') || 60;
    var repaintNow = false;
    var size = null;
    var component = new OFCanvasCompositeComponent();
    var mouseLocation = new g.Point(-1, -1);
    var mousedown = false;
    var dragging = false;
    var dragstart = new g.Point(-1,-1);
    var origin = new g.Point(0,0);

    component.setParent(this);

    var beginPainting = function() {
        repaintNow = true;
        var interval = 1000 / fps;
        var lastRepaintTime = 0;
        var animate = function(now) {
            checksize();
            var delta = now - lastRepaintTime;
            if (delta > interval && repaintNow) {
                lastRepaintTime = now - (delta % interval);
                paintNow();
            }
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    };

    var checksize = function() {
        var sizeNow = self.getBoundingClientRect();
        if (sizeNow.width !== size.width || sizeNow.height !== size.height) {
            sizeChanged();
        }
    };

    var sizeChanged = function() {
        resize();
    };

    var resize = function() {
        canvas.width = buffer.width = self.scrollWidth;
        canvas.height = buffer.height = self.scrollHeight;
        size = self.getBoundingClientRect();
        origin = new g.Point(size.left,size.top);
        self.bounds = new g.Rectangle(0, 0, size.width, size.height);
    };

    Object.observe(this, function(changes) {
        changes.forEach(function(e) {
            if (e.name === 'bounds') {
                if (component) {
                    component.setBounds(self.bounds);
                }
                self.resizeNotification();
                paintNow();
            }
        });

    }, ['update']);

    var paintNow = function() {
        var gc = buffer.getContext('2d');
        try {
            gc.save();
            gc.clearRect(0, 0, canvas.width, canvas.height);
            paint(gc);
        } finally {
            gc.restore();
        }
        flushBuffer();
        repaintNow = false;
    };

    var paint = function(gc) {
        if (component) {
            component._paint(gc);
        }
    };

    var flushBuffer = function() {
        canvasCTX.drawImage(buffer, 0, 0);
    };

    this.repaint = function() {
        repaintNow = true;
    };

    this.addComponent = function(comp) {
        component.addComponent(comp);
    };

    this.removeComponent = function(comp) {
        component.removeComponent(comp);
    };

    this.clearComponents = function() {
        component.clearComponents();
    };

    this.getMouseLocation = function() {
        return mouseLocation;
    };

    this.getOrigin = function() {
        return origin;
    };

    document.addEventListener('mousemove', function(e) {
        var o = self.getOrigin();
        if (!dragging && mousedown) {
            dragging = true;
            self.dispatchEvent(new CustomEvent('of-dragstart',{
                detail: {
                    mouse:mouseLocation
                }
            }));
            dragstart = new g.Point(mouseLocation.x, mouseLocation.y);
        }
        mouseLocation = new g.Point(e.x - o.x, e.y - o.y);
        if (dragging) {
            self.dispatchEvent(new CustomEvent('of-drag',{
                detail: {
                    mouse:mouseLocation,
                    dragstart: dragstart
                }
            }));
        }
        if (self.bounds.contains(mouseLocation)) {
            self.dispatchEvent(new CustomEvent('of-mousemove',{
                detail: {
                    mouse:mouseLocation
                }
            }));
        }
    });

    this.addEventListener('mousedown', function(e) {

        mouseLocation = new g.Point(e.offsetX, e.offsetY);
        mousedown = true;

        self.dispatchEvent(new CustomEvent('of-mousedown',{
            detail: {
                mouse: new g.Point(e.offsetX, e.offsetY)
            }
        }));

    });

    document.addEventListener('mouseup', function() {
        if (dragging) {
            self.dispatchEvent(new CustomEvent('of-dragend',{
                detail: {
                    mouse:mouseLocation,
                    dragstart: dragstart
                }
            }));
            dragging = false;
        }
        mousedown = false;
        mouseLocation = new g.Point(-1, -1);
        self.dispatchEvent(new CustomEvent('of-mouseup',{
            detail: {
                    mouse:mouseLocation
            }
        }));
    });

    this.addEventListener('mouseout', function() {
        if (!mousedown) {
            mouseLocation = new g.Point(-1, -1);
        }
        self.dispatchEvent(new CustomEvent('of-mouseout',{
            detail: {
                mouse:mouseLocation
            }
        }));
    });

    resize();
    beginPainting();
};

CanvasPrototype.resizeNotification = function() {
    //to be overridden
};

CanvasPrototype.getBounds = function() {
    return this.bounds;
};

module.exports = document.registerElement('open-canvas', {
    prototype: CanvasPrototype
});
