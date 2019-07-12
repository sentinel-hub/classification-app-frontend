import React, { Component } from 'react';

import InformationDisplayModal from '../../components/InformationDisplayModal/';
import './InformationLinks.css';

import termsPage from '../../assets/policy/terms.md';

const INFORMATION_PAGES = {
  TERMS: { title: 'Legal  ', content: termsPage },
};

class InformationLinks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      content: '',
    };
  }

  onClick = page => {
    fetch(page.content)
      .then(response => response.text())
      .then(text => {
        this.setState({ open: true, content: text, title: page.title });
      });
  };

  onClose = () => {
    this.setState({
      open: false,
      content: '',
      title: '',
    });
  };

  render() {
    return (
      <div>
        <div className="informationLinks">
          {Object.keys(INFORMATION_PAGES).map((page, i) => (
            <div key={i} className="informationLink" onClick={() => this.onClick(INFORMATION_PAGES[page])}>
              {INFORMATION_PAGES[page].title}
            </div>
          ))}
        </div>

        <InformationDisplayModal
          open={this.state.open}
          title={this.state.title}
          content={this.state.content}
          onClose={this.onClose}
        />
      </div>
    );
  }
}

export default InformationLinks;
