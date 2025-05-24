import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const instance = axios.create({
  baseURL: 'http://192.168.1.16:3040', // ganti sesuai backend mu
  timeout: 10000,
});

instance.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  // Check if token exist and Authorization headers not set.
  if (token && !config.headers.Authorization) {
    config.headers['Authorization'] = 'Bearer ' + token
  }

  return config
})

export default instance;
