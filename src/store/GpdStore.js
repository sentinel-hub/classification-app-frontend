import axios from 'axios';
import { observable, action, runInAction } from 'mobx';
import md5 from 'md5';

import { PAGES } from '../utils/const-pages';
import { classificationService } from '../utils/services';

class GpdStore {
  @observable isLoggedIn = false;
  @observable sessionId = null;
  @observable showLoginError = false;
  @observable username = null;
  @observable gpdInfo = null;
  constructor() {
    this.gpdClient = axios.create({
      baseURL: 'https://www.geopedia.world',
      responseType: 'json',
      withCredentials: true, // Geopedia runs on multiple servers, so credentials need to be used for correct upload
      headers: {
        'X-Gpd-SentinelHubClassificator': 'true', // this doen't make any difference
      },
    });
    this.password = null;
    this.connectionFailed = false;
  }

  inject = uiStore => {
    this.uiStore = uiStore;
  };

  @action
  async doLogin(username = this.username, password = this.password) {
    try {
      const params = {
        username: username,
        password: md5(password),
      };
      const { data } = await classificationService.post('/login', params);
      classificationService.interceptors.request.use(config => {
        config.headers.Authorization = data.Authorization;
        return config;
      });
      this.isLoggedIn = true;
      this.showLoginError = false;
      this.uiStore.setCurrentPage(PAGES.SELECT_CAMPAIGN);
      runInAction(() => {
        this.username = username;
      });
    } catch (e) {
      console.error(e);
      this.showLoginError = true;
    }
  }

  appendPartToForm(form, partName, content, addFileName, contentType) {
    var blob;
    if (contentType.indexOf('image/') === 0) {
      const base64ImageContent = content.replace(/^data:image\/(png|jpg);base64,/, '');
      blob = this.base64ToBlob(base64ImageContent, contentType);
    } else {
      blob = new Blob([content], { type: contentType });
    }
    if (addFileName) {
      form.append(partName, blob, partName);
    } else {
      form.append(partName, blob);
    }
    return form;
  }

  base64ToBlob(base64, mime) {
    mime = mime || '';
    const sliceSize = 1024;
    const byteChars = window.atob(base64);
    const byteArrays = [];

    for (let offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
      const slice = byteChars.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: mime });
  }

  async fetchGpdInfo() {
    if (this.sessionId) {
      try {
        const { data } = await this.gpdClient({
          method: 'post',
          url: 'rest/data/v1/features/executeQuery?includeSessionFilters=false',
          data: this.createQueryPayload(),
        });
        this.deleteInvalidData(data);
        this.gpdInfo = this.dataToInfo(data);
      } catch (e) {
        console.error('Error fetching scoreboard from Geopedia'); // either connection failed or session has expired
      }
    }
  }

  createQueryPayload() {
    let payload = {
      styleJS: null,
      scale: null,
      themeTableLink: null,
      options: ['TOTALCOUNT'],
      offset: 0, // <- start from this sample
      count: null, //<- limit number of samples e.g. 50
      tableId: '1749',
      themeTableId: null,
      resultSelector: {
        type: 'FeatureResultSelector',
        fieldSelectionSet: ['SYSTEM_FIELDS', 'USER_FIELDS_WITHOUT_GEOMETRIES', 'ENVELOPE'],
        queryOnlyVisible: true,
        resolveReferences: false,
        symbologyEvaluation: 'STANDARD',
        fieldSelectors: [],
      },
    };
    return payload;
  }

  deleteInvalidData(data) {
    var validResults = [];
    data.results.forEach(res => {
      if (!res.properties[2].value) {
        validResults.push(res);
      }
    });
    data.results = validResults;
    data.totalCount = validResults.length;
  }

  dataToInfo(data) {
    let info = {
      totalSamples: data.results.length,
      samplesPerUser: {},
    };
    data.results.forEach(res => {
      const userId = res.properties[1].value;
      if (!info.samplesPerUser[userId]) {
        info.samplesPerUser[userId] = 0;
      }
      info.samplesPerUser[userId]++;
    });

    return info;
  }
}

export default GpdStore;
