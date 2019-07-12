import {
  saveCanvasShapes,
  addCanvasShapes,
  addPixels,
  pointToPixel,
  getImageArray,
  generateBuffers,
  generateBufferPolygons,
  reduceShapes,
  getRepaintPixels,
  interpolate,
  getPolygonShape,
} from './paintUtils';

export function pencil(lc) {
  return drawingTool(lc, this, false);
}

export function eraser(lc) {
  return drawingTool(lc, this, true);
}

function drawingTool(lc, self, eraser) {
  self.bufferList = generateBuffers(lc.opts.strokeWidths);
  self.bufferPolygons = generateBufferPolygons(self.bufferList);
  self.imageArray = null;
  self.color = null;

  self.position = { x: -1000, y: -1000 };

  self.repaintLayer = function() {
    var polygon = getPolygonShape(self.position, self.bufferPolygons[lc.tool.strokeWidth]);
    lc.shapes.push(polygon);
    lc.repaintLayer('main');
    lc.shapes.pop();
  };

  return {
    usesSimpleAPI: false,
    name: eraser ? 'Eraser' : 'Pencil',
    iconName: eraser ? 'eraser' : 'pencil',
    strokeWidth: lc.opts.defaultStrokeWidth,
    optionsStyle: 'stroke-width',

    didBecomeActive: function(lc) {
      var onPointerDown = function(pt) {
        saveCanvasShapes(lc);
        self.imageArray = getImageArray(lc.shapes, lc.width, lc.height, lc.lockedColors);
        self.position = pointToPixel(pt);
        self.color = eraser ? null : lc.getColor('primary');
        var pixelList = getRepaintPixels(
          self.position,
          self.color,
          self.bufferList[lc.tool.strokeWidth],
          self.imageArray,
        );
        if (eraser) {
          reduceShapes(self.imageArray, lc);
        } else {
          addPixels(pixelList, lc);
        }
        self.repaintLayer();
      };

      var onPointerDrag = function(pt) {
        var newPosition = pointToPixel(pt);
        if (newPosition.x !== self.position.x || newPosition.y !== self.position.y) {
          var positionList = interpolate(self.position, newPosition);
          var pixelList = [];
          for (var i = 0; i < positionList.length; i++) {
            pixelList = pixelList.concat(
              getRepaintPixels(
                positionList[i],
                self.color,
                self.bufferList[lc.tool.strokeWidth],
                self.imageArray,
              ),
            );
          }
          if (eraser) {
            reduceShapes(self.imageArray, lc);
          } else {
            addPixels(pixelList, lc);
          }
          self.position = newPosition;
          self.repaintLayer();
        }
      };

      var onPointerUp = function(pt) {
        if (!eraser) {
          reduceShapes(self.imageArray, lc);
        }
        addCanvasShapes(lc);
        self.repaintLayer();
      };

      var onPointerMove = function(pt) {
        var newPosition = pointToPixel(pt);
        if (newPosition.x !== self.position.x || newPosition.y !== self.position.y) {
          self.position = newPosition;
          self.repaintLayer();
        }
      };

      self.unsubscribeFuncs = [
        lc.on('lc-pointerdown', onPointerDown),
        lc.on('lc-pointerdrag', onPointerDrag),
        lc.on('lc-pointerup', onPointerUp),
        lc.on('lc-pointermove', onPointerMove),
        lc.on(
          'setStrokeWidth',
          (function(_this) {
            return function(strokeWidth) {
              _this.strokeWidth = strokeWidth;
              self.repaintLayer();
              lc.trigger('toolDidUpdateOptions');
            };
          })(this),
        ),
      ];
    },

    willBecomeInactive: function(lc) {
      self.unsubscribeFuncs.map(function(f) {
        f();
      });
      lc.repaintLayer('main');
    },
  };
}
