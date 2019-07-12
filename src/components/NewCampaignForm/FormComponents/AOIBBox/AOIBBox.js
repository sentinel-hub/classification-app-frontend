import React from 'react';

import Select from '../Select';

import './AOIBBox.css';

export const CRS_LIST = {
  'EPSG:3857': 'EPSG:3857',
  'EPSG:4326': 'EPSG:4326',
};

export default class AIOBBox extends React.PureComponent {
  static defaultProps = {
    initialFormData: {
      crs: CRS_LIST['EPSG:3857'],
      latS: '',
      lngW: '',
      latN: '',
      lngE: '',
    },
    onChange: () => {},
  };

  constructor(props) {
    super(props);
    this.state = {
      formData: this.props.initialFormData,
    };
  }

  setFormDataValue = (key, newValue, ev) => {
    ev.preventDefault();
    this.setState(
      prevState => ({
        formData: {
          ...prevState.formData,
          [key]: newValue,
        },
      }),
      () => {
        this.props.onChange(this.state.formData);
      },
    );
  };

  render() {
    const { formData } = this.state;
    return (
      <div className="aoibbox">
        <div className="crs">
          <label>CRS:</label>
          <Select
            name="crs"
            options={CRS_LIST}
            value={formData.crs}
            onChange={ev => this.setFormDataValue('crs', ev.target.value, ev)}
          />
        </div>
        <div>
          <label>Lat: </label>
          <input
            className="aoi-lat-long"
            type="number"
            step="0.0001"
            value={formData.latS}
            onChange={ev => this.setFormDataValue('latS', ev.target.value, ev)}
          />
          <label>Long: </label>
          <input
            className="aoi-lat-long"
            type="number"
            step="0.0001"
            value={formData.lngW}
            onChange={ev => this.setFormDataValue('lngW', ev.target.value, ev)}
          />
        </div>
        <div>
          <label>Lat: </label>
          <input
            className="aoi-lat-long"
            type="number"
            step="0.0001"
            value={formData.latN}
            onChange={ev => this.setFormDataValue('latN', ev.target.value, ev)}
          />
          <label>Long: </label>
          <input
            className="aoi-lat-long"
            type="number"
            step="0.0001"
            value={formData.lngE}
            onChange={ev => this.setFormDataValue('lngE', ev.target.value, ev)}
          />
        </div>
      </div>
    );
  }
}
