import { saveCanvasShapes, addCanvasShapes, pointToPixel, fillArea } from './paintUtils';

export function bucketFill(lc) {
  var self = this;

  self.onCanvas = function(pixel) {
    return pixel.x >= 0 && pixel.x < lc.width && pixel.y >= 0 && pixel.y < lc.height;
  };

  return {
    usesSimpleAPI: false,
    name: 'Bucket fill',
    iconName: 'bucket-fill',

    didBecomeActive: function(lc) {
      var onPointerDown = function(pt) {
        self.position = pointToPixel(pt);
        if (self.onCanvas(self.position)) {
          saveCanvasShapes(lc);
        }
      };

      var onPointerDrag = function(pt) {
        var pixel = pointToPixel(pt);
        if (self.position.x !== pixel.x || self.position.y !== pixel.y) {
          self.position = { x: undefined, y: undefined };
        }
      };

      var onPointerUp = function(pt) {
        var pixel = pointToPixel(pt);
        if (self.position.x === pixel.x && self.position.y === pixel.y) {
          fillArea(pixel, lc);
          addCanvasShapes(lc);
          lc.repaintLayer('main');
        }
      };

      var onPointerMove = function(pt) {};

      self.unsubscribeFuncs = [
        lc.on('lc-pointerdown', onPointerDown),
        lc.on('lc-pointerdrag', onPointerDrag),
        lc.on('lc-pointerup', onPointerUp),
        lc.on('lc-pointermove', onPointerMove),
      ];
    },

    willBecomeInactive: function(lc) {
      self.unsubscribeFuncs.map(function(f) {
        f();
      });
    },
  };
}
