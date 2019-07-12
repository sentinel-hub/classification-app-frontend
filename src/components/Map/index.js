import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { observable, reaction } from 'mobx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import _ from 'lodash';
import { getZoomHome } from './zoomHome.js';
import './map.css';

@inject('uiStore')
@observer
class Map extends Component {
  @observable lat = 45;
  @observable lng = 13;
  @observable zoom = null;
  @observable bounds = null;
  @observable areaName = null;

  constructor(props) {
    super(props);

    this.mainMap = null;
    this.overlayMaps = {};
    this.highlightList = [];
    this.vectorLayers = [];

    this.geojson = null;
    this.highlight = null;
    this.areaLocation = null;
    this.areaName = null;

    this.centerZoom = null;

    this.config = {
      tileSize: 512,
    };

    this.state = {
      isLoaded: false,
    };

    reaction(() => this.props.uiStore.state.bbox, this.updatePolygon); // TODO: New task should trigger this however it is important that bbox is calculated first
    reaction(() => this.props.uiStore.state.activePreset, activePreset => this.updatePreset(activePreset));
  }

  updatePreset = activePreset => {
    if (!this.props.uiStore.campaignConfig.ui) return;

    const mapLayer = this.props.uiStore.campaignConfig.ui.mapLayers[activePreset.mapIdx];
    this.overlayMaps[mapLayer.name].setParams({ layers: activePreset.name });
  };

  updatePolygon = () => {
    if (!this.mainMap) return;
    if (!this.props.uiStore.task) return;

    if (this.mainMap.hasLayer(this.highlight)) {
      this.mainMap.removeLayer(this.highlight);
    }
    this.vectorLayers.forEach(layer => {
      if (this.mainMap.hasLayer(layer)) {
        this.mainMap.removeLayer(layer);
      }
    });
    this.vectorLayers = [];

    const bbox = this.props.uiStore.state.bbox;
    const datetime = this.props.uiStore.task.datetime;

    this.geojson = this.createGeoJsonBBox(bbox);

    this.highlight = L.geoJSON([this.geojson], { style: { fill: false } });
    this.mainMap.addLayer(this.highlight);

    if (this.props.uiStore.task.vectorData) {
      this.props.uiStore.task.vectorData.forEach(vectorGeoJson => {
        const vectorShape = L.geoJSON(
          [
            {
              type: 'Feature',
              geometry: vectorGeoJson,
            },
          ],
          {
            style: {
              fill: false,
              color: '#ff0000', // "#9400d3",
              weight: 1,
              opacity: 1,
              dashArray: '4',
            },
          },
        );
        this.vectorLayers.push(vectorShape);
        this.mainMap.addLayer(vectorShape);
      });
    }

    if (!this.props.uiStore.state.keepView) {
      this.centerMapToWindow();
    } else {
      this.props.uiStore.state.keepView = false;
    }

    Object.values(this.overlayMaps).forEach(layer => {
      layer.setParams({ time: `${datetime}/${datetime}` });
    });

    for (let mapLayerName in this.overlayMaps) {
      if (!this.mainMap.hasLayer(this.overlayMaps[mapLayerName])) {
        this.mainMap.addLayer(this.overlayMaps[mapLayerName]);
      }
    }

    if (bbox) {
      this.areaLocation = this.getLocation(bbox);
      this.getAreaName();
    }
  };

  createGeoJsonBBox = bbox => {
    const [latMin, lngMin, latMax, lngMax] = bbox.split(',');
    const min = { lat: parseFloat(latMin), lng: parseFloat(lngMin) };
    const max = { lat: parseFloat(latMax), lng: parseFloat(lngMax) };

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [min.lng, min.lat],
            [min.lng, max.lat],
            [max.lng, max.lat],
            [max.lng, min.lat],
            [min.lng, min.lat],
          ],
        ],
      },
    };
  };

  async getAreaName() {
    this.areaName = await this.props.uiStore.getLocationName(this.areaLocation);
  }

  centerMapToWindow = () => {
    // leaflet doesnt work correctly if I first use fitBounds and then zoomOut(), so I use this trick:
    this.mainMap.fitBounds(this.highlight.getBounds().pad(6)); // pad increases bbox for given factor in every direction
  };

  getLocation = bbox => {
    let loc = {};
    bbox = bbox.split(',').map(function(e) {
      return parseFloat(e);
    });
    loc.lat = ((bbox[0] + bbox[2]) / 2).toFixed(3);
    loc.lng = ((bbox[1] + bbox[3]) / 2).toFixed(3);
    return loc;
  };

  keepMapHighlight = () => {
    const currentHighlight = L.geoJSON([this.geojson], { style: { fill: false, color: 'red' } });
    this.mainMap.addLayer(currentHighlight);
    this.highlightList.push(currentHighlight);
  };

  resetMapHighlights = () => {
    this.highlightList.forEach(highlight => {
      this.mainMap.removeLayer(highlight);
    });
    this.highlightList = [];
  };

  setOverlayMaps = () => {
    // For now overlay map names should be distinct
    const ui = this.props.uiStore.campaignConfig.ui;
    this.overlayMaps = {};
    let mapNameSet = new Set();
    if (ui) {
      ui.mapLayers.forEach((mapLayer, idx) => {
        if (mapNameSet.has(mapLayer.name)) {
          window.alert('Error: some map layers have the same name');
        }
        mapNameSet.add(mapLayer.name);

        let [baseUrl, params] = this.splitWmsUrl(mapLayer.url);

        if (mapLayer.attribution) {
          params.attribution = `&copy; <a href="${mapLayer.attribution.href}" target="_blank">${
            mapLayer.attribution.name
          }</a>`;
        }
        if (!params.layers && mapLayer.presets) {
          params.layers = mapLayer.presets[0];
        }
        // if (!params.format) {
        //   params.format = 'image/png'
        // }
        this.overlayMaps[mapLayer.name] = L.tileLayer.wms(
          baseUrl,
          Object.assign({}, params, {
            tileSize: this.config.tileSize,
            minZoom: 5,
          }),
        );
      });
      this.mapControls = L.control.layers(null, this.overlayMaps).addTo(this.mainMap);
    }
  };

  splitWmsUrl = url => {
    const [baseUrl, paramString] = url.split('?', 2);
    const params = {};
    paramString.split('&').forEach(param => {
      if (param.includes('=')) {
        const [paramName, paramValue] = param.split('=', 2);
        params[paramName] = paramValue;
      }
    });
    return [`${baseUrl}?`, params];
  };

  componentDidMount() {
    const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    });

    this.mainMap = L.map('map', {
      minZoom: 3,
      layers: [carto],
      maxZoom: 17,
      zoomControl: false, // this disables classical zoom buttons
    });

    this.setOverlayMaps();

    this.zoomHome = getZoomHome(this.centerMapToWindow);
    this.zoomHome.addTo(this.mainMap);

    this.mainMap.on('moveend', _.throttle(() => {}), 4000);

    this.mainMap.on('move', () => {
      this.bounds = this.mainMap.getBounds();
      this.lat = this.mainMap.getCenter().lat;
      this.lng = this.mainMap.getCenter().wrap().lng;
      this.zoom = this.mainMap.getZoom();
      this.setPath();
    });

    this.mainMap.on('resize', () => {});

    if (this.props.uiStore.appConfig.activeTeaching) {
      this.mainMap.on('click', event => {
        this.props.uiStore.setLocation(event.latlng.lat, event.latlng.lng);
      });
    }

    L.control
      .scale({
        updateWhenIdle: true,
        imperial: false,
        position: 'bottomleft',
      })
      .addTo(this.mainMap);

    this.handleNewHash();
    this.mainMap.setView([this.lat, this.lng], this.zoom);
    this.setState({ isLoaded: true });

    window.addEventListener('hashchange', this.handleNewHash, false);

    this.props.uiStore.state.keepMapHighlight = this.keepMapHighlight;
    this.props.uiStore.state.resetMapHighlights = this.resetMapHighlights;

    if (this.props.uiStore.state.bbox) {
      this.updatePolygon();
    }
  }

  componentWillMount() {
    this.handleNewHash();
  }

  setPath = _.debounce(() => {
    window.location.hash = `lat=${this.lat}&lng=${this.lng}&zoom=${this.zoom}`;
    this.mainMap.setView([this.lat, this.lng], this.zoom);
  }, 1000);

  handleNewHash = _.debounce(() => {
    var path = window.location.hash.replace(/^#\/?|\/$/g, '');
    // let params = path.split('&')
    // figure out what's happening with hash changes
    // params.forEach(val => {
    //   const [key, value] = val.split('=')
    //   this[key] = value
    // })
  }, 1000);

  render() {
    const {
      state: { mainUrl, bbox, activePreset },
      task,
      appConfig: { activeTeaching },
    } = this.props.uiStore;
    const name = this.areaName;
    return (
      <div id="mapWrap">
        <div id="map" />
        {this.areaLocation && (
          <div className="mapField" id="infoField">
            {name && (
              <div>
                {' '}
                Location: {name} <br />{' '}
              </div>
            )}
            Latitude: {this.areaLocation.lat} <br />
            Longitude: {this.areaLocation.lng} <br />
            Date: {task && task.datetime.split('T')[0]}
          </div>
        )}

        {activeTeaching && (
          <div className="mapField" id="offsetField">
            <table>
              <tr>
                <td> Horizontal offset: </td>
                <td>
                  {' '}
                  <input
                    className="offsetInput"
                    type="number"
                    value={task && task.windowOffset[0]}
                    onChange={event => this.props.uiStore.setOffset([event.target.value, undefined])}
                  />{' '}
                </td>
              </tr>
              <tr>
                <td> Vertical offset: </td>
                <td>
                  {' '}
                  <input
                    className="offsetInput"
                    type="number"
                    value={task && task.windowOffset[1]}
                    onChange={event => this.props.uiStore.setOffset([undefined, event.target.value])}
                  />{' '}
                </td>
              </tr>
            </table>
          </div>
        )}
      </div>
    );
  }
}

export default Map;
