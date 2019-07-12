import React from 'react';
import moment from 'moment';
import axios from 'axios';
import turfBboxPolygon from '@turf/bbox-polygon';
import { point as turfPoint } from '@turf/helpers';
import { observer, inject } from 'mobx-react';

import { classificationService } from '../../utils/services';
import { PAGES } from '../../utils/const-pages';
import RadioButtons from './FormComponents/RadioButtons/RadioButtons';
import Select from './FormComponents/Select';
import SelectDataSources from './FormComponents/SelectDataSources';
import SliderCC from './FormComponents/SliderCC/SliderCC';
import ImageSize from './FormComponents/ImageSize';
import AOIBBox from './FormComponents/AOIBBox/AOIBBox';
import LabelingClasses from './FormComponents/LabelingClasses/LabelingClasses';
import TextAreaPreview from './FormComponents/TextAreaPreview/TextAreaPreview';

import './NewCampaignForm.css';

const CAMPAIGN_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
};

const LABELING_TASK = {
  PIXEL_WISE: 'pixel-wise',
};

const AOI_TYPES = {
  ALL_DATA: 'All',
  BBOX: 'Bounding box',
};

const SAMPLING_MODE = {
  RANDOM_SELECTION: 'random-selection',
};
@inject('uiStore')
@observer
class NewCampaignForm extends React.PureComponent {
  static defaultProps = {
    initialFormData: {
      name: '',
      description: '',
      campaignType: CAMPAIGN_TYPES.PUBLIC,
      dataSource: '',
      labelingTask: LABELING_TASK.PIXEL_WISE,
      labelingClasses: [],
      aoiType: AOI_TYPES.ALL_DATA,
      aoiBBox: {
        crs: 'EPSG:3857',
        latS: '',
        lngW: '',
        latN: '',
        lngE: '',
      },
      aoiCustomArea: '',
      dateFrom: moment()
        .subtract(1, 'month')
        .startOf('day')
        .format('YYYY-MM-DD'),
      dateTo: moment()
        .endOf('day')
        .format('YYYY-MM-DD'),
      maxCCPercent: 100,
      imageSize: {
        w: 512,
        h: 512,
      },
      samplingMode: SAMPLING_MODE.RANDOM_SELECTION,
      showInstructions: false,
      instructions: '',
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      formData: this.props.initialFormData,
      dataSources: null,
      posting: false,
      postingError: false,
    };
  }

  cancelTokenSource = axios.CancelToken.source();

  componentDidMount() {
    this.fetchDataSources();
  }

  componentWillUnmount() {
    this.cancelTokenSource.cancel();
  }

  fetchDataSources = async () => {
    try {
      const { data } = await classificationService.get('/sources', {
        cancelToken: this.cancelTokenSource.token,
      });

      const formData = { ...this.state.formData };
      formData.dataSource = data.sources.length > 0 ? data.sources[0].name : '';
      this.setState({ dataSources: data.sources, formData });
    } catch (e) {
      if (!axios.isCancel(e)) {
        console.error(e);
      }
    }
  };

  postCampaign = async () => {
    try {
      this.setState({ posting: true, postingError: false });
      const postData = this.createBackendResponseObject();
      await classificationService.post('/campaigns', postData, { cancelToken: this.cancelTokenSource.token });

      this.props.uiStore.setCurrentPage(PAGES.SELECT_CAMPAIGN);
      this.setState({
        posting: false,
      });
    } catch (e) {
      if (axios.isCancel(e)) {
        return;
      }
      console.error(e);
      this.setState({
        posting: false,
        postingError: true,
      });
    }
  };

  createBackendResponseObject = () => {
    const { formData, dataSources } = this.state;

    const dataSource = dataSources.find(dataSource => dataSource.name === formData.dataSource);
    const responseObj = {
      access: {
        accessType: formData.campaignType,
      },
      description: formData.description,
      inputSourceId: dataSource.id,
      layers: [
        {
          title: 'Surface',
          paintAll: false,
          classes: formData.labelingClasses.map(c => ({
            color: c.color,
            title: c.name,
          })),
        },
      ],
      name: formData.name,
      sampling: {
        method: formData.samplingMode,
        resolution: 10,
        windowWidth: formData.imageSize.w,
        windowHeight: formData.imageSize.h,
        buffer: 0,
      },
      ui: {
        showInstructions: formData.showInstructions,
        instructions: formData.instructions,
        showRanking: false,
      },
    };

    switch (formData.aoiType) {
      case AOI_TYPES.ALL_DATA:
        responseObj.sampling.aoi = {
          type: 'Archive',
        };
        break;
      case AOI_TYPES.BBOX:
        const SW = turfPoint([formData.aoiBBox.latS, formData.aoiBBox.lngW]);
        const NE = turfPoint([formData.aoiBBox.latN, formData.aoiBBox.lngE]);
        const bbox = [...SW.geometry.coordinates, ...NE.geometry.coordinates];
        const polygon = turfBboxPolygon(bbox);
        responseObj.sampling.aoi = {
          type: 'Polygon',
          crs: formData.aoiBBox.crs,
          coordinates: [[polygon.geometry.coordinates[0]]],
        };
        break;
      default:
        throw new Error('Invalid AOI_TYPES value');
    }
    return responseObj;
  };

  handleSubmit = async ev => {
    ev.preventDefault();
    this.postCampaign();
  };

  setFormDataValue = (key, newValue, ev = undefined) => {
    if (ev) {
      ev.preventDefault();
    }

    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [key]: newValue,
      },
    }));
  };

  toggleCheckBox = key => {
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [key]: !prevState.formData[key],
      },
    }));
  };

  cancelNewCampaign(ev) {
    ev.preventDefault();
    this.props.uiStore.setCurrentPage(PAGES.SELECT_CAMPAIGN);
  }

  renderImageSize() {
    const { formData, dataSources } = this.state;
    if (!dataSources) {
      return null;
    }
    const selectedDataSource = dataSources.find(dataSource => dataSource.name === formData.dataSource);
    if (selectedDataSource.samplingParams.includes('windowWidth')) {
      return (
        <div className="row">
          <label>Image size: </label>
          <div className="column-right-2">
            <ImageSize
              initialFormData={this.props.initialFormData.imageSize}
              onChange={v => this.setFormDataValue('imageSize', v)}
            />
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  render() {
    const { formData, dataSources, posting, postingError } = this.state;

    if (!dataSources) {
      return <i className="fas fa-circle-notch fa-spin fa-3x loading-form-icon" />;
    }

    return (
      <div className="page bg-image">
        <div className="form-container">
          <form onSubmit={this.handleSubmit}>
            <h3 className="page heading-1 new">Create new campaign:</h3>
            <div className="row">
              <label>Name: </label>
              <input
                className="column-right"
                type="text"
                value={formData.name}
                onChange={ev => this.setFormDataValue('name', ev.target.value, ev)}
              />
            </div>
            <div className="row">
              <label>Description: </label>
              <input
                className="column-right"
                type="text"
                value={formData.description}
                onChange={ev => this.setFormDataValue('description', ev.target.value, ev)}
              />
            </div>
            <div className="row">
              <label>Type: </label>
              <div className="column-right-2">
                <RadioButtons
                  className="radiobtn"
                  name="campaignTypes"
                  options={CAMPAIGN_TYPES}
                  selectedOption={formData.campaignType}
                  // event is not passed since radio buttons don't work if preventDefault is enabled
                  onChange={ev => this.setFormDataValue('campaignType', ev.target.value)}
                />
              </div>
            </div>
            <div className="row">
              <label>Data source: </label>
              <div className="column-right-2">
                <SelectDataSources
                  name="dataSource"
                  options={dataSources}
                  value={formData.dataSource}
                  onChange={ev => this.setFormDataValue('dataSource', ev.target.value, ev)}
                />
              </div>
            </div>
            <div className="row">
              <label>Labeling task: </label>
              <div className="column-right-2">
                <Select
                  name="labelingTask"
                  options={LABELING_TASK}
                  value={formData.labelingTask}
                  onChange={ev => this.setFormDataValue('labelingTask', ev.target.value, ev)}
                />
              </div>
            </div>
            <div className="row">
              <label>Labeling classes: </label>
              <div className="column-right-2">
                <LabelingClasses
                  initialFormData={this.props.initialFormData.labelingClasses}
                  onChange={v => this.setFormDataValue('labelingClasses', v)}
                />
              </div>
            </div>
            <div className="row">
              <label>Area of Interest: </label>
              <div className="column-right-2">
                <Select
                  name="aoiType"
                  options={AOI_TYPES}
                  value={formData.aoiType}
                  onChange={ev => this.setFormDataValue('aoiType', ev.target.value, ev)}
                />
              </div>
            </div>
            <div className="row">
              <div className="column-right-2">
                {formData.aoiType === AOI_TYPES.BBOX && (
                  <AOIBBox
                    initialFormData={this.props.initialFormData.aoiBBox}
                    onChange={v => this.setFormDataValue('aoiBBox', v)}
                  />
                )}
              </div>
            </div>
            <div className="row">
              <label>Time range: </label>
              <div className="form-date-container column-right-2">
                <input
                  type="date"
                  value={formData.dateFrom}
                  onChange={ev => this.setFormDataValue('dateFrom', ev.target.value, ev)}
                />
                <input
                  type="date"
                  value={formData.dateTo}
                  onChange={ev => this.setFormDataValue('dateTo', ev.target.value, ev)}
                />
              </div>
            </div>
            <div className="row">
              <label>Max cloud coverage: </label>
              <SliderCC
                className="column-right-2"
                min="0"
                max="100"
                value={formData.maxCCPercent}
                onChange={ev => this.setFormDataValue('maxCCPercent', ev.target.value, ev)}
              />
            </div>
            {this.renderImageSize()}
            <div className="row">
              <label>Sampling mode: </label>
              <div className="column-right-2">
                <Select
                  name="samplingMode"
                  options={SAMPLING_MODE}
                  value={formData.samplingMode}
                  onChange={ev => this.setFormDataValue('samplingMode', ev.target.value, ev)}
                />
              </div>
            </div>
            <div className="row">
              <label>Show instructions: </label>
              <div className="column-right-2">
                <input
                  type="checkbox"
                  name="showInstructions"
                  checked={formData.showInstructions}
                  onChange={ev => this.toggleCheckBox('showInstructions')}
                />
              </div>
            </div>
            <div className="row">
              <TextAreaPreview
                label="Instructions"
                name="instructions"
                value={formData.instructions}
                onChange={ev => this.setFormDataValue('instructions', ev.target.value, ev)}
              />
            </div>

            <div className="row">
              <button className="btn new-cmp">Create new campaign</button>
              <button className="btn cancel" onClick={ev => this.cancelNewCampaign(ev)}>
                Cancel
              </button>
              {posting && <i className="fas fa-circle-notch fa-spin save-campaign-loading-icon" />}
              {postingError && (
                <div className="error">Error occurred, campaign can't be saved at the moment.</div>
              )}
            </div>
          </form>
        </div>
        <div className="logos">
          <div className="logo-EOR">
            <img src="./eor-black.svg" />
          </div>
          <div>
            <img src="./sentinel_hub_by_sinergise_logo_black.png" className="logo-SH" />
          </div>
        </div>
      </div>
    );
  }
}

export default NewCampaignForm;
