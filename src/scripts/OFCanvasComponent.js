'use strict';

var g = require('rectangles');


function prototypeName(o) {
    /*jshint validthis:true */
    var string = Object.getPrototypeOf(o).constructor.toString();
    var chop = string.indexOf('(');
    string = string.substring(8, chop);
    return string;
}

function OFCanvasComponent() {

    var parent = null;
    var bounds = new g.Rectangle(0, 0, 0, 0);
    var layoutProperties = {
        top: [0, 0],
        right: [1, 0],
        bottom: [1, 0],
        left: [0, 0]
    };
    var color = 'black';
    var backgroundColor = null;

    this.setBounds = function(rectangle) {
        bounds = rectangle;
    };

    this.getBounds = function() {
        return bounds;
    };

    this._paint = function(gc) {
        try {
            gc.save();
            gc.translate(bounds.left(), bounds.top());
            gc.rect(0, 0, bounds.width(), bounds.height());
            gc.clip();
            var bgColor = this.getBackgroundColor();
            if (bgColor) {
                var rect = this.getBounds();
                gc.beginPath();
                gc.fillStyle = bgColor;
                gc.fillRect(0, 0, rect.width(), rect.height());
                gc.stroke();
            }
            this.paint(gc);
        } finally {
            gc.restore();
        }
    };
    this.paint = function(gc) {
        gc.beginPath();
        gc.fillStyle = this.getColor();
        gc.fillText(prototypeName(this) + ' ' + this.getBounds(), 5, 15);
        gc.stroke();
    };
    this.getColor = function() {
        return color;
    };
    this.setColor = function(colorValue) {
        color = colorValue;
    };
    this.getBackgroundColor = function() {
        return backgroundColor;
    };
    this.setBackgroundColor = function(colorValue) {
        backgroundColor = colorValue;
    };
    this.repaint = function() {
        if (parent) {
            parent.repaint();
        }
    };
    this.setParent = function(newParent) {
        parent = newParent;
    };
    this.getLayoutProperties = function() {
        return layoutProperties;
    };
    this.setLayoutProperties = function(properties) {
        layoutProperties = properties;
    };

}

var proto = OFCanvasComponent.prototype = Object.create(Object.prototype);

module.exports = proto.constructor = OFCanvasComponent;
