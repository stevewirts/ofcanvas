'use strict';

(function(root) {

    var FractionalLayoutManager = require('./FractionalLayoutManager');
    var OFCanvas = require('./OFCanvas');
    var OFCanvasBorderComponent = require('./OFCanvasBorderComponent');
    var OFCanvasComponent = require('./OFCanvasComponent');
    var OFCanvasCompositeComponent = require('./OFCanvasCompositeComponent');
    var OFExampleComponent = require('./OFExampleComponent');

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports.FractionalLayoutManager = FractionalLayoutManager;
        module.exports.OFCanvas = OFCanvas;
        module.exports.OFCanvasBorderComponent = OFCanvasBorderComponent;
        module.exports.OFCanvasComponent = OFCanvasComponent;
        module.exports.OFCanvasCompositeComponent = OFCanvasCompositeComponent;
        module.exports.OFExampleComponent = OFExampleComponent;
    } else {
        root.ofcanvas = {
            FractionalLayoutManager: FractionalLayoutManager,
            OFCanvas: OFCanvas,
            OFCanvasBorderComponent: OFCanvasBorderComponent,
            OFCanvasComponent: OFCanvasComponent,
            OFCanvasCompositeComponent: OFCanvasCompositeComponent,
            OFExampleComponent: OFExampleComponent
        };
    }
})(this); //jshint ignore:line
