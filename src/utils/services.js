import axios from 'axios';

export const classificationService = new axios.create({
  baseURL: process.env.REACT_APP_CLASSIFICATION_SERVICE,
});
export const shService = new axios.create({ baseURL: process.env.REACT_APP_SH_SERVICE });
export const googleMapsService = new axios.create({ baseURL: process.env.REACT_APP_G_MAPS_SERVICE });
