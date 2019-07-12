import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LC from 'literallycanvas';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import { pencil, eraser } from './DrawingTool';
import { bucketFill } from './BucketFill';
import {
  addPixels,
  repaintShapes,
  setColorOpacity,
  getOpacity,
  rgbaToRgb,
  canvasIsFull,
  getShapesByColor,
} from './paintUtils.js';
import './tools.css';

require('literallycanvas/lib/css/literallycanvas.css');

@inject('uiStore')
@observer
class Sketch extends Component {
  constructor(props) {
    super(props);

    this.state = {
      bgImgUrl: null,
      activeLayer: null,
      activeClass: null,
      taskId: null,
    };
    this.defaultSettings = {
      //zoom: 7
    };

    this.LC = null;
    this.canvasList = []; // list of all LC canvases
    this.bgImg = null;

    reaction(
      () => this.props.uiStore.state.updateCanvasClassColor,
      () => {
        if (this.props.uiStore.state.updateCanvasClassColor) this.setClassColorOpacity();
      },
    );
    reaction(
      () => this.props.uiStore.state.updateLockedColors,
      () => {
        if (this.props.uiStore.state.updateLockedColors) this.setLockedColors();
      },
    );
    reaction(
      () => this.props.uiStore.state.saveImage,
      () => {
        if (this.props.uiStore.state.saveImage) this.saveCanvasImages();
      },
    );
  }

  componentDidMount() {
    this.resetComponent();
  }

  componentWillUnmount() {
    this.props.uiStore.campaignConfig.layers.forEach(layer => {
      const el = document.getElementById(`canvas_${layer.idx}`);
      ReactDOM.unmountComponentAtNode(el);
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.uiStore.task && this.props.uiStore.task.id !== this.state.taskId) {
      this.resetComponent();
    } else if (this.props.uiStore.state.activeLayer !== this.state.activeLayer) {
      this.setActiveLayer();
    } else if (this.props.uiStore.state.mainUrl !== this.state.bgImgUrl) {
      this.setBackgroundImage();
    } else if (this.props.uiStore.state.activeClass !== this.state.activeClass) {
      this.setActiveCanvasClass();
    }
  }

  resetComponent = () => {
    this.setState({
      taskId: this.props.uiStore.task.id,
    });

    if (this.canvasList.length > 0) {
      this.canvasList.forEach(lc => {
        lc.teardown();
      });
      this.LC = null;
    }
    this.props.uiStore.campaignConfig.layers.forEach((layer, index) => {
      this.canvasList[index] = this.getNewCanvas(layer.idx);
      // TODO target canvas
    });
    for (var i = 0; i < this.props.uiStore.classList.length; i++) {
      this.props.uiStore.classList[i].lock = false;
    }

    this.setActiveLayer(true);
  };

  setActiveLayer = (getDefaultZoom = false) => {
    this.state.activeLayer = this.props.uiStore.state.activeLayer;

    var settings = {};
    if (this.LC === null) {
      Object.assign(settings, this.defaultSettings);
      settings.zoom = this.calculateOptimalZoom();
    } else {
      settings.zoom = getDefaultZoom ? this.defaultSettings.zoom : this.LC.scale;
      settings.pan = { x: -this.LC.position.x, y: -this.LC.position.y };
      settings.tool = this.LC.tool.name;
      settings.toolWidth = this.LC.tool.strokeWidth;
    }

    this.LC = this.canvasList[this.props.uiStore.state.activeLayer.idx];

    this.LC.backgroundShapes = [];
    this.setBackgroundImage();

    this.LC.setZoom(settings.zoom);
    if (settings.pan !== undefined) {
      this.LC.setPan(settings.pan.x, settings.pan.y);
    }
    if (settings.tool !== undefined) {
      document.querySelectorAll(`.lc-pick-tool[title="${settings.tool}"]`).forEach(btn => btn.click());
    }
    if (settings.toolWidth !== undefined) {
      this.LC.tool.strokeWidth = settings.toolWidth;
    }

    this.setActiveCanvasClass();
    this.setMaskShapes();
    this.setLockedColors();
  };

  setMaskShapes = () => {
    if (this.props.uiStore.task.data.length === 0) {
      return;
    }
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var base64Str = this.props.uiStore.task.data[0].image;
    var img = new Image();
    img.src = 'data:image/png;base64,' + base64Str;
    var width = this.props.uiStore.task.window.width;
    var height = this.props.uiStore.task.window.height;
    canvas.width = width;
    canvas.height = height;
    var layerColor = rgbaToRgb(this.props.uiStore.classList[this.props.uiStore.state.activeLayer.idx].color);
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      var imageData = ctx.getImageData(0, 0, width, height);
      var data = imageData.data;
      var pixelList = [];
      for (var i = 0; i < data.length; i += 4) {
        if ('rgba(' + data[i] + ', ' + data[i + 1] + ', ' + data[i + 2] + ')' === layerColor) {
          var j = Math.floor(i / 4);
          pixelList.push({ x: j % width, y: Math.floor(j / width) });
        }
      }
      addPixels(pixelList, this.LC);
      this.LC.repaintLayer('main');
    };
  };

  setActiveCanvasClass = () => {
    this.state.activeClass = this.props.uiStore.state.activeClass;
    this.LC.setColor('primary', this.props.uiStore.state.activeClass.color);
    this.LC.setColor('secondary', this.props.uiStore.state.activeClass.color);
  };

  setClassColorOpacity = () => {
    const newClass = this.props.uiStore.state.updateCanvasClassColor;
    const oldColor = newClass.color;
    const newColor = setColorOpacity(oldColor, newClass.opacity);
    newClass.color = newColor;

    var lc = this.canvasList[newClass.layerIdx];
    if (lc) {
      repaintShapes(lc.shapes, oldColor, newColor);
      lc.repaintLayer('main');
      if (newClass.classIdx === this.props.uiStore.state.activeClass.classIdx) {
        this.setActiveCanvasClass();
      }
    }

    if (this.props.uiStore.state.activeLayer.idx !== newClass.layerIdx) {
      this.updateBackgroundClassColor(newClass, oldColor);
    }
    this.props.uiStore.state.updateCanvasClassColor = null;
  };

  setBackground = (img = null) => {
    if (this.LC) {
      if (img) {
        this.LC.backgroundShapes[0] = LC.createShape('Image', {
          x: 0,
          y: 0,
          image: img,
          scale: 1,
        });
      }
      this.LC.repaintLayer('background');
    }
  };

  setBackgroundImage = () => {
    this.LC.backgroundCtx.imageSmoothingEnabled = false;
    if (this.state.bgImgUrl !== this.props.uiStore.state.mainUrl) {
      this.state.bgImgUrl = this.props.uiStore.state.mainUrl;
      this.bgImg = new Image();
      this.bgImg.src = this.props.uiStore.getActiveImageUrl;
      this.bgImg.setAttribute('crossOrigin', 'Anonymous'); // Important for security reasons!
      this.bgImg.onload = () => {
        this.setBackground(this.bgImg);
      };
    } else if (this.bgImg !== null) {
      this.setBackground(this.bgImg);
    }
  };

  updateBackgroundClassColor = (newClass, oldColor) => {
    if (this.LC) {
      const { color: newColor, opacity: newOpacity, layerIdx } = newClass;
      const oldOpacity = getOpacity(oldColor);
      if (newOpacity) {
        if (oldOpacity === 0) {
          this.LC.backgroundShapes = this.LC.backgroundShapes.concat(
            getShapesByColor(this.canvasList[layerIdx].shapes, oldColor),
          );
        } else {
          repaintShapes(this.LC.backgroundShapes, oldColor, newColor);
        }
      } else {
        this.LC.backgroundShapes = getShapesByColor(this.LC.backgroundShapes, oldColor, true);
      }
      this.setBackground();
    }
  };

  updateCanvasColors = () => {
    var colorMap = {};
    this.props.uiStore.classList.forEach(cls => {
      if (cls.layerIdx === this.props.uiStore.state.activeLayer.idx) {
        colorMap[rgbaToRgb(cls.color)] = cls.color;
      }
    });
    this.LC.shapes.forEach(shape => {
      const newColor = colorMap[rgbaToRgb(shape.fillColor)];
      shape.fillColor = newColor;
      shape.strokeColor = newColor;
    });
    this.LC.repaintLayer('main');
  };

  setLockedColors = () => {
    this.LC.lockedColors = new Set(); // <- lockedColors is new attribute of LC
    for (let i = 0; i < this.props.uiStore.classList.length; i++) {
      if (this.props.uiStore.classList[i].lock) {
        this.LC.lockedColors.add(rgbaToRgb(this.props.uiStore.classList[i].color));
      }
    }
    this.props.uiStore.state.updateLockedColors = false;
  };

  getNewCanvas = idx => {
    const LCObj = {
      imageSize: this.props.uiStore.task.window,
      imageURLPrefix: this.props.uiStore.appConfig.urlPrefix + 'lc/img',
      tools: [pencil, eraser, bucketFill, LC.tools.Pan],
      backgroundColor: 'purple',
      zoomMax: 20.0,
      zoomStep: 1.0,
      strokeWidths: [1, 2, 4, 8, 16],
      defaultStrokeWidth: 1,
    };
    let lc = LC.init(document.getElementById(`canvas_${idx}`), LCObj);
    lc.on('undo', this.updateCanvasColors);
    lc.on('redo', this.updateCanvasColors);
    return lc;
  };

  calculateOptimalZoom = () => {
    const maxImageSize = Math.max(
      this.props.uiStore.task.window.width,
      this.props.uiStore.task.window.height,
    );
    const canvas = document.querySelectorAll(`.lc-drawing`)[0].childNodes[0]; // gets one of the LC canvases
    const size = Math.min(parseInt(canvas.style.width, 10), parseInt(canvas.style.height, 10));
    return Math.floor((size - maxImageSize + 64) / 70); // <-this is just my approximation
  };

  saveCanvasImages = () => {
    for (let i = 0; i < this.props.uiStore.campaignConfig.layers.length; i++) {
      const layer = this.props.uiStore.campaignConfig.layers[i];
      if (layer.paintAll && !canvasIsFull(this.canvasList[i])) {
        this.props.uiStore.savingDone(
          `Masks were not saved because all pixels of ${layer.title} layer must be painted. → Read Help!`,
        );
        this.props.uiStore.state.saveImage = false;
        return;
      }
    }

    this.props.uiStore.canvasImages = [];
    this.props.uiStore.classList.forEach((cls, index) => {
      var shapes = getShapesByColor(this.canvasList[cls.layerIdx].shapes, cls.color);
      repaintShapes(shapes, cls.color, 'white');
      if (shapes.length > 0) {
        this.props.uiStore.canvasImages[index] = this.shapesToImage(shapes);
      } else if (
        shapes.length === 0 &&
        !this.props.uiStore.campaignConfig.layers[this.props.uiStore.state.activeLayer.idx].paintAll
      ) {
        this.props.uiStore.canvasImages[index] = this.emptyCanvasImage();
      } else {
        this.props.uiStore.canvasImages[index] = null;
      }
      repaintShapes(shapes, 'white', cls.color);
    });
    this.props.uiStore.state.saveImage = false;
    this.props.uiStore.uploadData();
  };

  emptyCanvasImage = () => {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var width = this.props.uiStore.task.window.width;
    var height = this.props.uiStore.task.window.height;
    canvas.width = width;
    canvas.height = height;
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i + 3] = 1;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  shapesToImage = shapes => {
    var tempNode = document.createElement('tempNode');
    var tempLC = LC.init(tempNode, {
      imageSize: this.props.uiStore.task.window,
    });
    tempLC.backgroundShapes = []; // <- this is temporary fix ... i have no idea why does tempLC get background image
    tempLC.shapes = shapes;
    var img = tempLC.getImage();
    tempLC.teardown();
    return img;
  };

  render() {
    if (this.LC) {
      window.addEventListener('resize', () => {
        this.LC.backgroundCtx.imageSmoothingEnabled = false;
        this.LC.repaintLayer('background');
      });
    }
    const {
      state: { mainUrl, activePreset, activeLayer, activeClass },
      campaignConfig: { layers },
    } = this.props.uiStore;
    if (this.props.uiStore.task) {
      // This is for canvas reset
      const { id } = this.props.uiStore.task;
    }
    return (
      <div style={{ width: '60vw', height: '100%' }}>
        {this.props.btnPanel}
        <div
          id="classificationComponent"
          style={{ height: `calc(100% - ${window.innerWidth <= 1135 ? 68 : 40}px)`, width: '60vw' }}
          // preset={activePreset.name}
        >
          {layers &&
            layers.map(layer => (
              <div
                key={layer.idx}
                className={`canvasHolder ${layer.title === activeLayer.title && 'activeCanvas'}`}
                id={`canvas_${layer.idx}`}
                style={{
                  zIndex: layer.title === activeLayer.title ? '1' : '0',
                  opacity: layer.title === activeLayer.title ? '1' : '0',
                }}
              />
            ))}
        </div>
      </div>
    );
  }
}
export default Sketch;
