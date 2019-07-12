import React from 'react';
import { observer, inject } from 'mobx-react';

import Sketch from '../Sketch';
import CommandsPanel from '../CommandsPanel';
import Map from '../Map';
import ImageSlides from '../ImageSlides';
import TaskHelp from '../TaskHelp';
import Header from '../../header/Header';
import InformationLinks from '../InformationLinks';

@inject('uiStore')
@observer
export default class Campaign extends React.Component {
  render() {
    return (
      <div className="rootVerticalApp">
        <Header appVersion={this.props.appVersion} />
        <div
          className="horizontalWrap"
          style={{
            height: `calc(100% - 95px)`,
          }}
        >
          <Map />
          <div className="verticalWrap">
            <Sketch btnPanel={<CommandsPanel />} />
          </div>
        </div>
        <div className="footer">
          {this.props.uiStore.task ? <ImageSlides /> : 'Loading tile'}
          {this.props.uiStore.state.showTaskHelp && <TaskHelp />}
          <img src="./sentinel-logo.png" className="logo-footer" />
          <InformationLinks />
        </div>
      </div>
    );
  }
}
