import { observable, action, computed } from 'mobx';
import _ from 'lodash';

import { PAGES } from '../utils/const-pages';
import { classificationService, googleMapsService } from '../utils/services';
import { isUtmCrs, getWmsRequestUrl, utmToWgs, wgsToUtm, hexToRGBA } from '../utils/utils';

class UiStore {
  @observable currentPage = PAGES.LOGIN;
  @observable state;
  @observable task;
  @observable classList;
  @observable presetList;

  constructor(gpdStore) {
    this.gpdStore = gpdStore;
    this.initStore();
  }

  @action
  initStore() {
    this.appConfig = {
      // this parameters are constant
      urlPrefix: process.env.NODE_ENV === 'development' ? '../../' : './',
      googleApiKey: process.env.REACT_APP_GOOGLE_API_KEY,
      baseWmsUrl: 'https://services.sentinel-hub.com/ogc/wms',
      imageFormat: 'png', // for wms requests
      maxOpacity: 100, // for opacity of colors in canvas
      saveType: 'Service',
      activeTeaching: false,
      tileSize: [10890, 10890],
    };
    this.campaignConfig = {
      name: null,
      id: null,
      layers: [],
      ui: null,
    };
    this.task = null;

    this.state = {
      activeClass: null,
      activeLayer: null,
      activePreset: null,
      bbox: null,
      mainUrl: null,
      loadingStatus: null,
      updateCanvasClassColor: null,
      updateLockedColors: false,
      saveImage: false,
      keepView: false,
      keepMapHighlight: null,
      resetMapHighlights: null,
      showTaskHelp: false,
    };
    this.canvasImages = null;
    this.classList = [];
    this.presetList = [];
  }

  @action
  setCurrentPage(currentPage) {
    this.currentPage = currentPage;
  }

  async fetch(client, url, loading = true, method = 'get', payload = null) {
    if (loading) {
      this.loadingStatus = 'Loading tile';
    }
    const defaultHeader = client.defaults.headers.common; // axios has an issue that it always uses default header which in our case also contains x-gpd-session ... this 2 lines temporarly switch headers, which is not very nice fix
    client.defaults.headers.common = { accept: 'application/json, text/plain, */*' };
    try {
      const { data } = await client({
        method: method,
        url: url,
        data: payload,
      });
      return data;
    } catch (e) {
      throw e;
    } finally {
      client.defaults.headers.common = defaultHeader;
      if (loading) {
        this.loadingStatus = null;
      }
    }
  }

  async setCampaignConfig(campaignId) {
    const { data } = await classificationService.get(`/campaigns/${campaignId}`);
    this.campaignConfig = data;

    if (this.campaignConfig.ui.showRanking) {
      await this.gpdStore.fetchGpdInfo();
    }

    this.classList = this.initClassProps(this.campaignConfig.layers);
    this.setActiveClass(0);

    this.presetList = this.initPresetProps(this.campaignConfig.ui.mapLayers);

    await this.getNewTask();
  }

  initClassProps(layers) {
    let classList = [];
    let colorSet = new Set();
    for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
      let classes = layers[layerIdx].classes;
      for (let classIdx = 0; classIdx < classes.length; classIdx++) {
        let classProps = {
          title: classes[classIdx].title,
          color: hexToRGBA(classes[classIdx].color),
          lock: false,
          layerIdx: layerIdx,
          classIdx: classList.length,
          opacity: 0,
        };
        classList.push(classProps);
        classes[classIdx] = classProps; // For some reason this sets a copy of classProps object!

        if (colorSet.has(classProps.color)) {
          window.alert('Error: some classes use the same color');
        }
        colorSet.add(classProps.color);
      }
      layers[layerIdx].idx = layerIdx;
    }
    return classList;
  }

  initPresetProps(mapLayers) {
    let presetList = [];
    mapLayers.forEach((mapLayer, mapIdx) => {
      if (mapLayer.presets) {
        mapLayer.presets.forEach((preset, presetIdx) => {
          presetList.push({
            name: preset,
            presetIdx: presetIdx,
            mapIdx: mapIdx,
          });
        });
      }
    });
    return presetList;
  }

  @action
  async getNewTask() {
    const { data } = await classificationService.post(`/campaigns/${this.campaignConfig.id}/tasks`);
    this.task = data;

    // some tasks don't have vectorData, and for some vectorData is `"None"`
    try {
      this.task.vectorData = JSON.parse(data.vectorData); // vectorData is received as string, we need to unpack it here
    } catch (ex) {
      this.task.vectorData = [];
    }

    // HOTFIX for water bodies campaign: we must have switched the lat/lng somewhere on the backend:
    if (data.crs === 4326) {
      this.task.bbox = [data.bbox[1], data.bbox[0], data.bbox[3], data.bbox[2]];
    }

    if (this.task.id === undefined) {
      throw new Error('Failed to obtain the task');
    }

    this.state.bbox = isUtmCrs(this.task.crs)
      ? utmToWgs(this.task.bbox, this.task.crs)
      : this.task.bbox.join(',');

    this.setActivePreset(0);
  }

  getOutputName(classIdx = null) {
    let content = [this.task.crs, this.task.id, this.task.window.width, this.task.window.height];
    if (classIdx !== null) {
      content.push(this.campaignConfig.layers[this.classList[classIdx].layerIdx].title);
      content.push(this.classList[classIdx].title);
    }
    return content.join('_');
  }

  getClassificationMethod() {
    // For now 1 = random, 2 = active_teaching, check gpd for others
    // In future this options should be obtained by request from Geopedia
    if (this.appConfig.activeTeaching) {
      return 2;
    } else {
      return 1;
    }
  }

  @action
  setActiveClass(newClassIdx) {
    let newClass = this.classList[newClassIdx];
    if (this.state.activeClass === null || this.state.activeClass.classIdx !== newClass.classIdx) {
      this.state.activeClass = newClass;
      this.setActiveLayer(newClass.layerIdx);
      this.state.updateLockedColors = true;
    }
  }

  @action
  setActiveLayer(newLayerIdx) {
    let newLayer = this.campaignConfig.layers[newLayerIdx];
    if (this.state.activeLayer === null || this.state.activeLayer.title !== newLayer.title) {
      // Assumes layers have different titles
      this.state.activeLayer = newLayer;
      for (let i = 0; i < this.classList.length; i++) {
        this.classList[i].lock = false;
      }
    }
  }

  @action
  setOpacity(selectedClassIdx, opacityInt) {
    let selectedClass = this.classList[selectedClassIdx];
    const newOpacity = opacityInt / this.appConfig.maxOpacity;
    if (selectedClass.opacity !== newOpacity) {
      selectedClass.opacity = newOpacity;
      this.state.updateCanvasClassColor = selectedClass;
    }
  }

  @action
  setLockClass(newClassIdx) {
    this.classList[newClassIdx].lock = !this.classList[newClassIdx].lock;
    this.state.updateLockedColors = true;
  }

  setLocation(lat, lng) {
    // TODO: fix this
    const point = isUtmCrs(this.task.crs)
      ? wgsToUtm(lat, lng, this.task.crs)
      : [parseInt(lng, 10), parseInt(lat, 10)];
    const offset = [
      Math.round((point.x - this.task.tileCoords[0]) / 10 - this.task.window.width / 2),
      Math.round((this.task.tileCoords[1] - point.y) / 10 - this.task.window.height / 2),
    ];
    this.setOffset(offset);
  }

  @action
  setOffset(offset) {
    let offsetIsValid = true;
    offset.forEach((num, index) => {
      if (
        num !== undefined &&
        (parseInt(num, 10) < 0 ||
          parseInt(num, 10) + this.task.window[index] >= this.appConfig.tileSize[index])
      ) {
        offsetIsValid = false;
      }
    });
    if (offsetIsValid) {
      offset.forEach((num, index) => {
        if (num !== undefined) {
          this.task.windowOffset[index] = parseInt(num, 10); // This will not trigger observers of windowOffset array
        }
      });
      this.keepView = true;
      this.setParameters();
    }
  }

  @computed
  get getActiveImageUrl() {
    return `${this.state.mainUrl}`;
  }

  @action
  setActivePreset(idx) {
    this.state.activePreset = this.presetList[idx];
    this.state.mainUrl = this.getPresetUrl(this.state.activePreset);
  }

  getPresetUrl(preset) {
    return getWmsRequestUrl(this.task, preset, this.campaignConfig.ui.mapLayers[preset.mapIdx]); // TODO
  }

  @action
  closeTaskHelp() {
    this.state.showTaskHelp = false;
  }

  async getLocationName(loc) {
    const latlng = [loc.lat.toString(), loc.lng.toString()].join(',');
    const locationInfo = await this.fetch(
      googleMapsService,
      `/geocode/json?key=${this.appConfig.googleApiKey}&latlng=${latlng}`,
      false,
    );
    let locationName = null;
    if (locationInfo.status === 'OK') {
      let index = locationInfo.results.length - 1;
      if (locationInfo.results.length > 1) {
        index--;
      }
      locationName = locationInfo.results[index].formatted_address;
    }
    return locationName;
  }

  savingDone = msg => {
    this.loadingStatus = null;
    if (msg) {
      window.alert(msg);
    } else if (!this.appConfig.activeTeaching) {
      this.getNewTask();
    } else {
      // In this case windowOffset is reset in order to reset canvas
      this.keepMapHighlight();
      this.task.windowOffset = [this.task.windowOffset[0], this.task.windowOffset[1]];
    }
  };

  async uploadData() {
    this.loadingStatus = 'Saving';
    // we can have stored data here or create new Store we can have separated data from uiStore
    return new Promise(resolve => {
      setTimeout(() => {
        if (this.appConfig.saveType === 'Service') {
          let images = [];
          for (let i = 0; i < this.canvasImages.length; i++) {
            if (this.canvasImages[i] !== null) {
              images.push({
                name: this.getOutputName(i) + '.png',
                src: this.canvasImages[i].toDataURL('image/png'),
              });
            }
          }
          if (images.length > 0) {
            this.uploadImages(images);
          } else {
            this.savingDone('Empty masks were not saved to Geopedia');
          }
        }
        resolve('Successfully uploaded');
      }, 1000);
    });
  }

  async uploadImages(images) {
    console.log('Started uploading');
    try {
      let formData = new FormData();
      images.forEach(obj => {
        this.gpdStore.appendPartToForm(formData, obj.name, obj.src, true, 'image/png');
      });

      classificationService
        .post(
          `/campaigns/${this.campaignConfig.id}/tasks/${this.task.id}/save`, // Session id should probably be in headers`,
          formData,
        )
        .then(res => {
          this.savingDone();
        })
        .catch(e => {
          const msg = 'Error saving data to Service. Please check your internet connection.';
          console.error(msg, e);
          this.savingDone(msg);
        });
    } catch (e) {
      const msg = 'Error uploading images to service.';
      console.error(msg, e);
      this.savingDone(msg);
    }
  }
}
export default UiStore;
