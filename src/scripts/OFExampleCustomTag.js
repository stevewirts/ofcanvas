/* globals HTMLElement, document */

'use strict';

var OFCanvas = require('./OFCanvas');
var OFCanvasComponent = require('./OFCanvasComponent');
var OFCanvasBorderComponent = require('./OFCanvasBorderComponent');

var OFExampleCustomTag = Object.create(HTMLElement.prototype);

OFExampleCustomTag.attachedCallback = function() {

    var canvas = new OFCanvas();
    canvas.setAttribute('fps', 30);

    this.shadowRoot = this.createShadowRoot();
    this.shadowRoot.appendChild(canvas);
    this.canvas = this.shadowRoot.querySelector('open-canvas');

    //lets make the canvas take our entire space
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = 0;
    this.canvas.style.right = 0;
    this.canvas.style.bottom = 0;
    this.canvas.style.left = 0;

    var comp = new OFCanvasBorderComponent(new OFCanvasComponent());
    comp.setColor('red');
    var props = {
        top: [0, 0],
        right: [1, 0],
        bottom: [0.5, 0],
        left: [0, 0]
    };
    comp.setLayoutProperties(props);
    this.canvas.addComponent(comp);

    var comp2 = new OFCanvasBorderComponent(new OFCanvasComponent());
    comp2.setColor('green');
    var props2 = {
        top: [0.5, 0],
        right: [1, 0],
        bottom: [1, 0],
        left: [0, 0]
    };
    comp2.setLayoutProperties(props2);
    this.canvas.addComponent(comp2);

};

module.exports = document.registerElement('of-example-custom-tag', {
    prototype: OFExampleCustomTag
});
