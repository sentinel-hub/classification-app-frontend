import React from 'react';
import ReactDOM from 'react-dom';
import { toJS } from 'mobx';

import App from './App';
import UiStore from './store/UiStore';
import GpdStore from './store/GpdStore';
import CampaignsStore from './store/CampaignsStore';

import 'font-awesome/css/font-awesome.css';

// Stores
const gpdStore = new GpdStore();
const uiStore = new UiStore(gpdStore);
const campaignsStore = new CampaignsStore();
gpdStore.inject(uiStore);

window.toJS = toJS;
window.uiStore = toJS(uiStore);

ReactDOM.render(<App stores={{ uiStore, gpdStore, campaignsStore }} />, document.getElementById('root'));
