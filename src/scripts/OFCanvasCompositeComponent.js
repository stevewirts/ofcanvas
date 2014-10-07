'use strict';

var g = require('rectangles');
var LayoutManager = require('./FractionalLayoutManager');
var OFCanvasComponent = require('./OFCanvasComponent');

function OFCanvasCompositeComponent() {

    OFCanvasComponent.call(this);
    var supr = {};
    var components = [];
    var layoutManager = new LayoutManager();

    this.addComponent = function(component) {
        components.push(component);
    };

    this.removeComponent = function(component) {
        var i = components.indexOf(component);
        if (i && i > -1) {
            components.splice(i, 1);
        }
    };

    this.clearComponents = function() {
        components.length = 0;
    };

    this.getLayoutManager = function() {
        return layoutManager;
    };

    this.setLayoutManager = function(manager) {
        layoutManager = manager;
    };

    this.paint = function(gc) {
        for (var c = 0; c < components.length; c++) {
            var comp = components[c];
            comp._paint(gc);
        }
    };

    supr.setBounds = this.setBounds;
    this.setBounds = function(rectangle) {
        supr.setBounds(rectangle);
        var rect = new g.Rectangle(0, 0, rectangle.width(), rectangle.height());
        this.getLayoutManager().layoutComponentsIn(rect, components);
    };

}

var proto = OFCanvasCompositeComponent.prototype = Object.create(OFCanvasComponent.prototype);

module.exports = proto.constructor = OFCanvasCompositeComponent;
