import React, { Component } from 'react';
import { observer, Provider } from 'mobx-react';

import { PAGES } from './utils/const-pages';
import Login from './components/Login';
import { getVersionInfo } from './utils/version';
import CampaignList from './components/CampaignList';
import NewCampaignForm from './components/NewCampaignForm';

import 'semantic-ui-css/semantic.min.css';
import './App.css';
import Campaign from './components/Campaign/Campaign';

@observer
class App extends Component {
  state = {
    width: window.innerWidth,
    height: window.innerHeight,
    appVersion: getVersionInfo(),
  };

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  updateDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  };

  render() {
    return (
      <Provider {...this.props.stores}>
        <div className="rootApp">
          {this.props.stores.uiStore.currentPage === PAGES.LOGIN && <Login />}
          {this.props.stores.uiStore.currentPage === PAGES.SELECT_CAMPAIGN && <CampaignList />}
          {this.props.stores.uiStore.currentPage === PAGES.NEW_CAMPAIGN && <NewCampaignForm />}
          {this.props.stores.uiStore.currentPage === PAGES.SHOW_CAMPAIGN && (
            <Campaign appVersion={this.state.appVersion} />
          )}
        </div>
      </Provider>
    );
  }
}

export default App;
