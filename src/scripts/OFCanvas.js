/* globals HTMLElement, document, requestAnimationFrame */
'use strict';

var g = require('rectangles');
var OFCanvasCompositeComponent = require('./OFCanvasCompositeComponent');

var CanvasPrototype = Object.create(HTMLElement.prototype);

CanvasPrototype.attachedCallback = function() {

    var self = this;
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

        if (component) {
            var bounds = new g.Rectangle(0, 0, size.width, size.height);
            component.setBounds(bounds);
        }

        paintNow();
    };

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
        paintNow = true;
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

    this.style.overflow = 'hidden';

    resize();
    beginPainting();
};

module.exports = document.registerElement('open-canvas', {
    prototype: CanvasPrototype
});
