import React from 'react';

import './LabelingClasses.css';

export default class LabelingClasses extends React.PureComponent {
  static defaultProps = {
    initialFormData: [],
    onChange: () => {},
  };

  constructor(props) {
    super(props);
    this.state = {
      formData: this.props.initialFormData,
    };
  }

  addClass = newClass => {
    this.setState(
      prevState => ({
        formData: [...prevState.formData, newClass],
      }),
      () => {
        this.props.onChange(this.state.formData);
      },
    );
  };

  removeClass = index => {
    this.setState(prevState => {
      const newFormData = prevState.formData.slice();
      newFormData.splice(index, 1);
      return {
        formData: newFormData,
      };
    });
  };

  render() {
    const { formData } = this.state;
    return (
      <div className="labeling-classes">
        {formData.map((labelingClass, i) => (
          <div className="labeling-class" key={i}>
            <div className="color-indicator" style={{ backgroundColor: labelingClass.color }} />
            <label>{labelingClass.name}</label>
            <i className="fas fa-times remove" onClick={() => this.removeClass(i)} />
          </div>
        ))}
        <AddLabelingClass onAdd={this.addClass} />
      </div>
    );
  }
}

class AddLabelingClass extends React.PureComponent {
  state = {
    name: '',
    color: '',
  };

  setName = ev => {
    ev.preventDefault();
    this.setState({ name: ev.target.value });
  };

  setColor = ev => {
    ev.preventDefault();
    this.setState({ color: ev.target.value });
  };

  handleButtonClick = ev => {
    ev.preventDefault();
    this.props.onAdd({
      name: this.state.name,
      color: this.state.color,
    });
    this.setState({
      name: '',
      color: '',
    });
  };

  render() {
    const { name, color } = this.state;
    return (
      <div className="add-labeling-class">
        <div>
          <label>Name:</label>
          <input type="text" value={name} onChange={this.setName} className="labeling-classes-name" />
        </div>
        <div>
          <label>Color:</label>
          <input type="color" value={color} onChange={this.setColor} />
        </div>
        <div>
          <button onClick={this.handleButtonClick} disabled={!name || !color}>
            Add
          </button>
        </div>
      </div>
    );
  }
}
