import { observable, action, runInAction } from 'mobx';
import { classificationService } from '../utils/services';

class CampaignsStore {
  @observable campaigns;
  @observable campaignsError;

  constructor() {
    this.initStore();
  }

  @action
  initStore() {
    this.campaigns = [];
    this.campaignsError = false;
    this.campaign = null;
    this.campaignError = null;
  }

  @action
  async getCampaigns() {
    try {
      const { data } = await classificationService.get('/campaigns');
      runInAction(() => {
        this.campaigns = data.campaigns;
      });
    } catch (e) {
      runInAction(() => {
        this.campaignsError = true;
        throw Error(e);
      });
    }
  }

  @action
  async getCampaign(campaignId) {
    try {
      const { data } = await classificationService.get(`/campaigns/${campaignId}`);
      runInAction(() => {
        this.campaign = data;
      });
    } catch (e) {
      runInAction(() => {
        this.campaignError = true;
        throw Error(e);
      });
    }
  }
}
export default CampaignsStore;
