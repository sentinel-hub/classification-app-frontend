import { inject, observer } from 'mobx-react';
import React, { Component } from 'react';
import { PAGES } from '../../utils/const-pages';
import Loader from '../Loader';
import ModalError from '../ModalError';
import './CampaignList.css';

@inject('uiStore')
@inject('campaignsStore')
@observer
class CampaignList extends Component {
  state = {
    loadingCampaign: false,
    loadingCampaignError: false,
  };

  async componentDidMount() {
    // No matter what, when you are selecting the campaigns, the stores should be reset to
    // initial state:
    this.props.uiStore.initStore();
    this.props.campaignsStore.initStore();
    try {
      await this.props.campaignsStore.getCampaigns();
    } catch (e) {
      console.error(e);
    }
  }

  async selectCampaign(campaignId) {
    this.setState({ loadingCampaign: true });
    try {
      await this.props.uiStore.setCampaignConfig(campaignId);
      await this.props.campaignsStore.getCampaign(campaignId);
      this.props.uiStore.setCurrentPage(PAGES.SHOW_CAMPAIGN);
    } catch (e) {
      console.error(e);
      this.setState({ loadingCampaignError: true });
    }
  }

  newCampaign = () => {
    this.props.uiStore.setCurrentPage(PAGES.NEW_CAMPAIGN);
  };

  render() {
    const { campaigns, campaignsError } = this.props.campaignsStore;
    const { loadingCampaign, loadingCampaignError } = this.state;

    if (loadingCampaignError) {
      return <ModalError>Campaign can't be retrieved at the moment.</ModalError>;
    }
    if (loadingCampaign) {
      return <Loader />;
    }
    if (campaignsError) {
      return <ModalError>Campaigns can't be retrieved at the moment - invalid data.</ModalError>;
    }
    if (!campaigns.length) {
      return <Loader />;
    }
    return (
      <div className="page page-campaign-list bg-image">
        <div className="content-box">
          <h1 className="heading-1">CLASSIFICATION App</h1>
          <label className="header">Select campaign:</label>
          {campaigns.map(campaign => (
            <div>
              <button
                onClick={() => this.selectCampaign(campaign.id)}
                title={campaign.description}
                className="select-camp"
              >
                <div className="campaign-title">{campaign.name}</div>
              </button>
            </div>
          ))}
          <label className="header">or create new:</label>
          <button onClick={this.newCampaign} className="new-camp like-link">
            new campaign +
          </button>
          <div className="logos">
            <div className="logo-EOR">
              <img src="./eor-black.svg" />
            </div>
            <div>
              <img src="./sentinel_hub_by_sinergise_logo_black.png" className="logo-SH" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CampaignList;
