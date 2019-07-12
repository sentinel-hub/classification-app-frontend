import React from 'react';

export default class ImageSize extends React.PureComponent {
  static defaultProps = {
    initialFormData: {
      w: 512,
      h: 512,
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
      <div className="imagesize">
        <input
          className="img-size"
          min="1"
          max="9999"
          type="number"
          value={formData.w}
          onChange={ev => this.setFormDataValue('w', ev.target.value, ev)}
        />{' '}
        x{' '}
        <input
          className="img-size"
          min="1"
          max="9999"
          type="number"
          value={formData.h}
          onChange={ev => this.setFormDataValue('h', ev.target.value, ev)}
        />{' '}
        px
      </div>
    );
  }
}
