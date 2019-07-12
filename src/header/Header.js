import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import { PAGES } from '../utils/const-pages';

import './header.css';

@inject('uiStore')
@inject('gpdStore')
@observer
class Header extends Component {
  campaignList() {
    this.props.uiStore.setCurrentPage(PAGES.SELECT_CAMPAIGN);
  }

  render() {
    const { username } = this.props.gpdStore;
    const { appVersion } = this.props;
    return (
      <div className="mainAppHeader">
        <h3 style={{ paddingLeft: '20px' }} className="app-title">
          CLASSIFICATION App
        </h3>
        <span className="app-version"> {appVersion}</span>
        <div className="welcomeMsg">
          <div>Welcome {username}</div>
          <div className="campaign-selection">
            <button onClick={() => this.campaignList()}>Campaign Selection</button>
          </div>
        </div>
      </div>
    );
  }
}

export default Header;
