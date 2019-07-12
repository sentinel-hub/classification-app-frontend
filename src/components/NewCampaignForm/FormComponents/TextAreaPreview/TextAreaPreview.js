import React, { Component } from 'react';
import InformationDisplayModal from '../../../InformationDisplayModal';
import './TextAreaPreview.css';

class TextAreaPreview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showPreview: false,
    };
  }

  onOpen = ev => {
    if (ev) {
      ev.preventDefault();
    }
    this.setState({
      showPreview: true,
    });
  };

  onClose = () => {
    this.setState({
      showPreview: false,
    });
  };
  render() {
    return (
      <div className="textAreaPreview">
        <div>
          <label>{this.props.label} </label>
          <button onClick={this.onOpen} className="preview">
            <i className="fa fa-eye" />
          </button>
        </div>
        <textarea
          className="textArea"
          name={this.props.name}
          value={this.props.value}
          rows="5"
          onChange={this.props.onChange}
        />
        <InformationDisplayModal
          open={this.state.showPreview}
          title="Instructions preview"
          content={this.props.value}
          onClose={this.onClose}
        />
      </div>
    );
  }
}

export default TextAreaPreview;
