'use strict';

var g = require('rectangles');

function FractionalLayoutManager() {

    }
    //this is simply a relational layout manager
    //we can build others as needed

var proto = FractionalLayoutManager.prototype = Object.create(Object.prototype);

proto.layoutComponentsIn = function(rectangle, components) {

    var x = rectangle.left();
    var y = rectangle.top();

    var totalwidth = rectangle.width();
    var totalheight = rectangle.height();

    for (var c = 0; c < components.length; c++) {
        var comp = components[c];
        var props = comp.getLayoutProperties();
        if (props) {
            var xo = x + props.left[0] * totalwidth + props.left[1];
            var yo = y + props.top[0] * totalheight + props.top[1];
            var xe = props.right[0] * totalwidth + props.right[1] - xo;
            var ye = props.bottom[0] * totalheight + props.bottom[1] - yo;
            var eachBounds = new g.Rectangle(xo, yo, xe, ye);
            comp.setBounds(eachBounds);
        }
    }
};

module.exports = proto.constructor = FractionalLayoutManager;
