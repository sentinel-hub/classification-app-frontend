import LC from 'literallycanvas';

export function saveCanvasShapes(lc) {
  // <- this stores current shapes
  lc.oldShapes = lc.shapes.slice();
}

export function addCanvasShapes(lc) {
  // <- if there is any change on canvas, shapes are updated
  const oldShapes = lc.oldShapes;
  delete lc.oldShapes;
  if (!equalShapes(lc.shapes, oldShapes)) {
    const newShapes = lc.shapes;
    lc.clear();
    lc.shapes = newShapes;
    lc.undoStack[lc.undoStack.length - 1].oldShapes = oldShapes;
    lc.undoStack[lc.undoStack.length - 1].newShapes = lc.shapes.slice();
  }
}

function equalShapes(shapes1, shapes2) {
  if (shapes1.constructor !== Array || shapes2.constructor !== Array || shapes1.length !== shapes2.length) {
    return false;
  }
  for (let i = 0; i < shapes1.length; i++) {
    if (
      shapes1[i].x !== shapes2[i].x ||
      shapes1[i].y !== shapes2[i].y ||
      shapes1[i].fillColor !== shapes2[i].fillColor
    ) {
      return false;
    }
  }
  return true;
}

export function pointToPixel(pt) {
  return { x: Math.floor(pt.x), y: Math.floor(pt.y) };
}

function shapeToPixel(shape) {
  return { x: Math.ceil(shape.x), y: Math.ceil(shape.y) };
}

export function addPixels(pixelList, lc) {
  if (pixelList.length > 0) {
    let color = lc.getColor('primary');
    for (let i = 0; i < pixelList.length; i++) {
      lc.shapes.push(getPixelShape(pixelList[i], color));
    }
  }
}

function getPixelShape(pixel, color, size = 1) {
  const w = 0.125; // <- border width, has to be >0 and for some numerical reason in form 1/2^k otherwise saved images are wierd
  return LC.createShape('Rectangle', {
    x: pixel.x - 0.5 + w / 2,
    y: pixel.y - 0.5 + w / 2,
    width: size - w,
    height: size - w,
    strokeWidth: w,
    strokeColor: color,
    fillColor: color,
  });
}

export function getPolygonShape(pixel, polygon) {
  let pointList = [];
  for (let i = 0; i < polygon.length; i++) {
    pointList.push(getPointShape({ x: polygon[i][0] + pixel.x - 0.5, y: polygon[i][1] + pixel.y - 0.5 }));
  }
  return LC.createShape('Polygon', {
    points: pointList,
    fillColor: 'rgba(255, 255, 255, 0.0)',
    strokeColor: '#3388ff', // same color as polygon in Map
    strokeWidth: 0.2,
    isClosed: true,
  });
}

function getPointShape(pt) {
  return LC.createShape('Point', {
    x: pt.x,
    y: pt.y,
    size: 0.5,
    color: 'white',
  });
}

export function fillArea(pixel, lc) {
  let imageArray = getImageArray(lc.shapes, lc.width, lc.height, lc.lockedColors);
  if (
    pixel.x >= 0 &&
    pixel.x < lc.width &&
    pixel.y >= 0 &&
    pixel.y < lc.height &&
    !imageArray[pixel.x][pixel.y].locked
  ) {
    const oldColor = imageArray[pixel.x][pixel.y].color;
    const newColor = lc.getColor('primary');
    if (oldColor !== newColor) {
      let stack = [pixel];
      imageArray[pixel.x][pixel.y].color = newColor;
      let moves = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      let k = 0;
      while (k < stack.length) {
        for (let i = 0; i < moves.length; i++) {
          let newPixel = { x: stack[k].x + moves[i][0], y: stack[k].y + moves[i][1] };
          if (
            newPixel.x >= 0 &&
            newPixel.x < lc.width &&
            newPixel.y >= 0 &&
            newPixel.y < lc.height &&
            imageArray[newPixel.x][newPixel.y].color === oldColor
          ) {
            stack.push(newPixel);
            imageArray[newPixel.x][newPixel.y].color = newColor;
          }
        }
        k++;
      }
      addPixels(stack, lc);
      reduceShapes(imageArray, lc);
    }
  }
}

export function canvasIsFull(lc) {
  let imageArray = getImageArray(lc.shapes, lc.width, lc.height);
  for (let i = 0; i < lc.width; i++) {
    for (let j = 0; j < lc.height; j++) {
      if (imageArray[i][j].color === null) {
        return false;
      }
    }
  }
  return true;
}

export function getImageArray(shapes, width, height, lockedColors = new Set()) {
  let imageArray = [];
  for (let i = 0; i < width; i++) {
    imageArray.push([]);
    for (let j = 0; j < height; j++) {
      imageArray[i].push({ color: null, locked: false });
    }
  }
  for (let k = 0; k < shapes.length; k++) {
    let pt = shapeToPixel(shapes[k]);
    if (pt.x >= 0 && pt.x < width && pt.y >= 0 && pt.y < height) {
      imageArray[pt.x][pt.y] = {
        color: shapes[k].fillColor,
        locked: lockedColors.has(rgbaToRgb(shapes[k].fillColor)),
      };
    }
  }
  return imageArray;
}

export function reduceShapes(imageArray, lc) {
  let reducedShapes = [];
  for (let i = 0; i < imageArray.length; i++) {
    for (let j = 0; j < imageArray[i].length; j++) {
      if (imageArray[i][j].color !== null) {
        reducedShapes.push(getPixelShape({ x: i, y: j }, imageArray[i][j].color));
      }
    }
  }
  lc.shapes = reducedShapes;
}

export function generateBuffers(strokeWidths) {
  let bufferList = [];
  for (let i = 0; i < strokeWidths.length; i++) {
    let buffer = [];
    let size = strokeWidths[i];
    for (let j = -size + 1; j < size; j++) {
      buffer.push(Math.floor(Math.sqrt(size * size - j * j) - 0.0001));
    }
    bufferList[strokeWidths[i]] = buffer;
  }
  return bufferList;
}

export function getBufferPixels(pixel, buffer, width, height) {
  let size = Math.floor(buffer.length / 2);
  let pixelList = [];
  for (let i = Math.max(pixel.x - size, 0); i <= Math.min(pixel.x + size, width - 1); i++) {
    let h = buffer[i - pixel.x + size];
    for (let j = Math.max(pixel.y - h, 0); j <= Math.min(pixel.y + h, height - 1); j++) {
      pixelList.push({ x: i, y: j });
    }
  }
  return pixelList;
}

export function generateBufferPolygons(bufferList) {
  let bufferPolygons = [];
  for (let k = 0; k < bufferList.length; k++) {
    if (bufferList[k] !== undefined) {
      let polygon = [];
      let size = Math.floor(bufferList[k].length / 2);
      for (let i = 0; i < bufferList[k].length; i++) {
        if (i === 0 || bufferList[k][i - 1] !== bufferList[k][i]) {
          polygon.push([i - size, -bufferList[k][i]]);
        }
        if (i === bufferList[k].length - 1 || bufferList[k][i] !== bufferList[k][i + 1]) {
          polygon.push([i - size + 1, -bufferList[k][i]]);
        }
      }
      for (let i = bufferList[k].length - 1; i >= 0; i--) {
        if (i === bufferList[k].length - 1 || bufferList[k][i] !== bufferList[k][i + 1]) {
          polygon.push([i - size + 1, bufferList[k][i] + 1]);
        }
        if (i === 0 || bufferList[k][i - 1] !== bufferList[k][i]) {
          polygon.push([i - size, bufferList[k][i] + 1]);
        }
      }
      bufferPolygons[k] = polygon;
    }
  }
  return bufferPolygons;
}

export function getRepaintPixels(pixel, newColor, buffer, imageArray) {
  // returns pixels that have to be repainted and also updates imageArray
  let pixelList = getBufferPixels(pixel, buffer, imageArray.length, imageArray[0].length);
  let reducedList = [];
  for (let i = 0; i < pixelList.length; i++) {
    if (
      newColor !== imageArray[pixelList[i].x][pixelList[i].y].color &&
      !imageArray[pixelList[i].x][pixelList[i].y].locked
    ) {
      reducedList.push(pixelList[i]);
      imageArray[pixelList[i].x][pixelList[i].y].color = newColor;
    }
  }
  return reducedList;
}

export function interpolate(prevPixel, nextPixel) {
  let pixelList = [];
  if (prevPixel.x !== nextPixel.x || prevPixel.y !== nextPixel.y) {
    pixelList.push({ x: nextPixel.x, y: nextPixel.y });
  }
  let p1 = {};
  let p2 = {};
  if (prevPixel.x <= nextPixel.x) {
    Object.assign(p1, prevPixel);
    Object.assign(p2, nextPixel);
  } else {
    Object.assign(p1, nextPixel);
    Object.assign(p2, prevPixel);
  }
  let reverseCoef = 1;
  if (p2.y < p1.y) {
    p2.y = -p2.y;
    p1.y = -p1.y;
    reverseCoef = -1;
  }
  if (p2.x - p1.x >= p2.y - p1.y) {
    for (let i = p1.x + 1; i < p2.x; i++) {
      let yi = Math.round(((p2.y - p1.y) * i + p2.x * p1.y - p1.x * p2.y) / (p2.x - p1.x)); // this takes only one of two possible pixels in i-th column
      pixelList.push({ x: i, y: reverseCoef * yi });
    }
  } else {
    for (let j = p1.y + 1; j < p2.y; j++) {
      let xj = Math.round(((p2.x - p1.x) * j + p2.y * p1.x - p1.y * p2.x) / (p2.y - p1.y)); // this takes only one of two possible pixels in j-th row
      pixelList.push({ x: xj, y: reverseCoef * j });
    }
  }
  return pixelList;
}

export function getShapesByColor(shapeList, color, filterColor = false) {
  const rgbColor = isRgbaColor(color) ? rgbaToRgb(color) : color;
  let shapes = [];
  shapeList.forEach(shape => {
    if ((shape.fillColor && rgbaToRgb(shape.fillColor) === rgbColor) ^ filterColor) {
      shapes.push(shape);
    }
  });
  return shapes;
}

export function repaintShapes(shapes, oldColor, newColor) {
  const rgbColor = isRgbaColor(oldColor) ? rgbaToRgb(oldColor) : oldColor;
  shapes.forEach(shape => {
    if (shape.fillColor && rgbaToRgb(shape.fillColor) === rgbColor) {
      shape.fillColor = newColor;
      shape.strokeColor = newColor;
    }
  });
}

export function setColorOpacity(rgbaColor, alpha) {
  let componentList = rgbaColor.split(',');
  componentList.pop();
  componentList.push(` ${alpha})`);
  return componentList.join(',');
}

export function getOpacity(color) {
  return parseFloat(
    color
      .split(',')
      .pop()
      .replace(' ', '')
      .replace(')', ''),
  );
}

export function rgbaToRgb(color) {
  return color.replace(/, *\d*(\.\d*)?\)/, ')');
}

export function isRgbaColor(color) {
  return (color.match(/,/g) || []).length === 3;
}
