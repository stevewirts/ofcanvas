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
    var repeatKeyCount = 0;
    var repeatKey = null;
    var repeatKeyStartTime = 0;
    var currentKeys = [];

    focuser.style.position = 'static';
    focuser.style.top = 0;
    focuser.style.right = '100%';
    focuser.style.bottom = '100%';
    focuser.style.left = 0;
    focuser.style.padding = 0;
    focuser.style.border = 0;

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
                self.paintNow();
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
                self.paintNow();
            }
        });

    }, ['update']);

    this.paintNow = function() {
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
                    mouse: mouseLocation,
                    keys: currentKeys.slice(0)
                }
            }));
            dragstart = new g.Point(mouseLocation.x, mouseLocation.y);
        }
        mouseLocation = new g.Point(e.x - o.x, e.y - o.y);
        if (dragging) {
            self.dispatchEvent(new CustomEvent('of-drag', {
                detail: {
                    mouse: mouseLocation,
                    dragstart: dragstart,
                    keys: currentKeys
                }
            }));
        }
        if (self.bounds.contains(mouseLocation)) {
            self.dispatchEvent(new CustomEvent('of-mousemove', {
                detail: {
                    mouse: mouseLocation,
                    keys: currentKeys.slice(0)
                }
            }));
        }
    };

    var ofmousedown = function(e) {

        mouseLocation = new g.Point(e.offsetX, e.offsetY);
        mousedown = true;

        self.dispatchEvent(new CustomEvent('of-mousedown', {
            detail: {
                mouse: new g.Point(e.offsetX, e.offsetY),
                keys: currentKeys.slice(0)
            }
        }));
        self.takeFocus();

    };

    var ofmouseup = function() {
        if (dragging) {
            self.dispatchEvent(new CustomEvent('of-dragend', {
                detail: {
                    mouse: mouseLocation,
                    dragstart: dragstart,
                    keys: currentKeys.slice(0)
                }
            }));
            dragging = false;
        }
        mousedown = false;
        mouseLocation = new g.Point(-1, -1);
        self.dispatchEvent(new CustomEvent('of-mouseup', {
            detail: {
                mouse: mouseLocation,
                keys: currentKeys.slice(0)
            }
        }));
    };

    var ofmouseout = function() {
        if (!mousedown) {
            mouseLocation = new g.Point(-1, -1);
        }
        self.dispatchEvent(new CustomEvent('of-mouseout', {
            detail: {
                mouse: mouseLocation,
                keys: currentKeys.slice(0)
            }
        }));
    };

    var ofclick = function(e) {
        mouseLocation = new g.Point(e.offsetX, e.offsetY);
        self.dispatchEvent(new CustomEvent('of-click', {
            detail: {
                mouse: mouseLocation,
                keys: currentKeys.slice(0)
            }
        }));
    };

    var ofdblclick = function(e) {
        mouseLocation = new g.Point(e.offsetX, e.offsetY);
        self.dispatchEvent(new CustomEvent('of-dblclick', {
            detail: {
                mouse: mouseLocation,
                keys: currentKeys.slice(0)
            }
        }));
    };

    var ofkeydown = function(e) {
        var keyChar = e.shiftKey ? charMap[e.keyCode][1] : charMap[e.keyCode][0];
        if (e.repeat) {
            if (repeatKey === keyChar) {
                repeatKeyCount++;
            } else {
                repeatKey = keyChar;
                repeatKeyStartTime = Date.now();
            }
        } else {
            repeatKey = null;
            repeatKeyCount = 0;
            repeatKeyStartTime = 0;
        }
        if (currentKeys.indexOf(keyChar) === -1) {
            currentKeys.push(keyChar);
        }
        self.dispatchEvent(new CustomEvent('of-keydown', {
            detail: {
                alt: e.altKey,
                ctrl: e.ctrlKey,
                char: keyChar,
                code: e.charCode,
                key: e.keyCode,
                meta: e.metaKey,
                repeatCount: repeatKeyCount,
                repeatStartTime: repeatKeyStartTime,
                shift: e.shiftKey,
                identifier: e.keyIdentifier
            }
        }));
    };

    var ofkeyup = function(e) {
        var keyChar = e.shiftKey ? charMap[e.keyCode][1] : charMap[e.keyCode][0];
        repeatKeyCount = 0;
        repeatKey = null;
        repeatKeyStartTime = 0;
        currentKeys.splice(currentKeys.indexOf(keyChar), 1);
        self.dispatchEvent(new CustomEvent('of-keyup', {
            detail: {
                alt: e.altKey,
                ctrl: e.ctrlKey,
                char: keyChar,
                code: e.charCode,
                key: e.keyCode,
                meta: e.metaKey,
                repeat: e.repeat,
                shift: e.shiftKey,
                identifier: e.keyIdentifier
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
        resize();
    };

    this.removeComponent = function(comp) {
        component.removeComponent(comp);
        resize();
    };

    this.clearComponents = function() {
        component.clearComponents();
        resize();
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

    this.takeFocus = function() {
        if (document.activeElement !== focuser) {
            setTimeout(function() {
                focuser.focus();
            }, 10);
        }
    };

    document.addEventListener('mousemove', ofmousemove);
    document.addEventListener('mouseup', ofmouseup);
    focuser.addEventListener('focus', offocusgained);
    focuser.addEventListener('blur', offocuslost);
    this.addEventListener('mousedown', ofmousedown);
    this.addEventListener('mouseout', ofmouseout);
    this.addEventListener('keydown', ofkeydown);
    this.addEventListener('keyup', ofkeyup);
    this.addEventListener('click', ofclick);
    this.addEventListener('dblclick', ofdblclick);

    // this.addEventListener('of-click', function(e) {
    //     console.log(e.detail);
    // });

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


//80/20 key mappings

var charMap = [];
var empty = ['', ''];
for (var i = 0; i < 256; i++) {
    charMap[i] = empty;
}

charMap[27] = ['ESC', 'ESCSHIFT'];
charMap[192] = ['`', '~'];
charMap[49] = ['1', '!'];
charMap[50] = ['2', '@'];
charMap[51] = ['3', '#'];
charMap[52] = ['4', '$'];
charMap[53] = ['5', '%'];
charMap[54] = ['6', '^'];
charMap[55] = ['7', '&'];
charMap[56] = ['8', '*'];
charMap[57] = ['9', '('];
charMap[48] = ['0', ')'];
charMap[189] = ['-', '_'];
charMap[187] = ['=', '+'];
charMap[8] = ['DELETE', 'DELETESHIFT'];
charMap[9] = ['TAB', 'TABSHIFT'];
charMap[81] = ['q', 'Q'];
charMap[87] = ['w', 'W'];
charMap[69] = ['e', 'E'];
charMap[82] = ['r', 'R'];
charMap[84] = ['t', 'T'];
charMap[89] = ['y', 'Y'];
charMap[85] = ['u', 'U'];
charMap[73] = ['i', 'I'];
charMap[79] = ['o', 'O'];
charMap[80] = ['p', 'P'];
charMap[219] = ['[', '{'];
charMap[221] = [']', '}'];
charMap[220] = ['\\', '|'];
charMap[220] = ['CAPSLOCK', 'CAPSLOCKSHIFT'];
charMap[65] = ['a', 'A'];
charMap[83] = ['s', 'S'];
charMap[68] = ['d', 'D'];
charMap[70] = ['f', 'F'];
charMap[71] = ['g', 'G'];
charMap[72] = ['h', 'H'];
charMap[74] = ['j', 'J'];
charMap[75] = ['k', 'K'];
charMap[76] = ['l', 'L'];
charMap[186] = [';', ':'];
charMap[222] = ['\'', '|'];
charMap[13] = ['RETURN', 'RETURNSHIFT'];
charMap[16] = ['SHIFT', 'SHIFT'];
charMap[90] = ['z', 'Z'];
charMap[88] = ['x', 'X'];
charMap[67] = ['c', 'C'];
charMap[86] = ['v', 'V'];
charMap[66] = ['b', 'B'];
charMap[78] = ['n', 'N'];
charMap[77] = ['m', 'M'];
charMap[188] = [',', '<'];
charMap[190] = ['.', '>'];
charMap[191] = ['/', '?'];
charMap[16] = ['SHIFT', 'SHIFT'];
charMap[17] = ['CTRL', 'CTRLSHIFT'];
charMap[18] = ['ALT', 'ALTSHIFT'];
charMap[91] = ['COMMANDLEFT', 'COMMANDLEFTSHIFT'];
charMap[32] = ['SPACE', 'SPACESHIFT'];
charMap[93] = ['COMMANDRIGHT', 'COMMANDRIGHTSHIFT'];
charMap[18] = ['ALT', 'ALTSHIFT'];
charMap[38] = ['UP', 'UPSHIFT'];
charMap[37] = ['LEFT', 'LEFTSHIFT'];
charMap[40] = ['DOWN', 'DOWNSHIFT'];
charMap[39] = ['RIGHT', 'RIGHTSHIFT'];
