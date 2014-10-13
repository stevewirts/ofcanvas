/* globals HTMLElement, document, requestAnimationFrame, CustomEvent */
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
    var dragstart = new g.Point(-1, -1);
    var origin = new g.Point(0, 0);
    shadowRoot.appendChild(document.createElement('button'));
    var focuser = shadowRoot.querySelector('button');
    var focused = false;
    focuser.style.position = 'static';
    focuser.style.top = 0;
    focuser.style.right = '100%';
    focuser.style.bottom = '100%';
    focuser.style.left = 0;
    focuser.style.padding = 0;
    focuser.style.border = 0;

    //<button class="focuser" id="focuser-<%=id%>" style="position:static;top:0;left:0;right:100%;bottom:100%;margin:0;padding:0;border:0"></button>

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
        origin = new g.Point(size.left, size.top);
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

    var ofmousemove = function(e) {
        var o = self.getOrigin();
        if (!dragging && mousedown) {
            dragging = true;
            self.dispatchEvent(new CustomEvent('of-dragstart', {
                detail: {
                    mouse: mouseLocation
                }
            }));
            dragstart = new g.Point(mouseLocation.x, mouseLocation.y);
        }
        mouseLocation = new g.Point(e.x - o.x, e.y - o.y);
        if (dragging) {
            self.dispatchEvent(new CustomEvent('of-drag', {
                detail: {
                    mouse: mouseLocation,
                    dragstart: dragstart
                }
            }));
        }
        if (self.bounds.contains(mouseLocation)) {
            self.dispatchEvent(new CustomEvent('of-mousemove', {
                detail: {
                    mouse: mouseLocation
                }
            }));
        }
    };

    var ofmousedown = function(e) {

        mouseLocation = new g.Point(e.offsetX, e.offsetY);
        mousedown = true;

        self.dispatchEvent(new CustomEvent('of-mousedown', {
            detail: {
                mouse: new g.Point(e.offsetX, e.offsetY)
            }
        }));
        if (document.activeElement !== focuser) {
            setTimeout(function() {
                focuser.focus();
            }, 1);
        }
    };

    var ofmouseup = function() {
        if (dragging) {
            self.dispatchEvent(new CustomEvent('of-dragend', {
                detail: {
                    mouse: mouseLocation,
                    dragstart: dragstart
                }
            }));
            dragging = false;
        }
        mousedown = false;
        mouseLocation = new g.Point(-1, -1);
        self.dispatchEvent(new CustomEvent('of-mouseup', {
            detail: {
                mouse: mouseLocation
            }
        }));
    };

    var ofmouseout = function() {
        if (!mousedown) {
            mouseLocation = new g.Point(-1, -1);
        }
        self.dispatchEvent(new CustomEvent('of-mouseout', {
            detail: {
                mouse: mouseLocation
            }
        }));
    };

    var ofkeydown = function(e) {
        console.log(e);
        self.dispatchEvent(new CustomEvent('of-keydown', {
            detail: {
                e: e
            }
        }));
    };

    var ofkeyup = function(e) {
        console.log(e);
        self.dispatchEvent(new CustomEvent('of-up', {
            detail: {
                e: e
            }
        }));
    };

    var offocusgained = function(e) {
        focused = true;
        self.dispatchEvent(new CustomEvent('of-focus-gained', {
            detail: {
                e: e
            }
        }));
    };

    var offocuslost = function(e) {
        focused = false;
        self.dispatchEvent(new CustomEvent('of-focus-lost', {
            detail: {
                e: e
            }
        }));
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

    this.hasFocus = function() {
        return focused;
    };

    document.addEventListener('mousemove', ofmousemove);
    document.addEventListener('mouseup', ofmouseup);
    focuser.addEventListener('focus', offocusgained);
    focuser.addEventListener('blur', offocuslost);
    this.addEventListener('mousedown', ofmousedown);
    this.addEventListener('mouseout', ofmouseout);
    this.addEventListener('keydown', ofkeydown);
    this.addEventListener('keyup', ofkeyup);


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
