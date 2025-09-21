import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import * as mockApi from '../mocks/mockApi';

const USE_MOCK_API = true;

const API_BASE_URL = 'http://localhost:8080/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        try {
            const decodedToken: { exp: number } = jwtDecode(accessToken);
            const currentTime = Date.now() / 1000;
            if (decodedToken.exp < currentTime) {
                console.warn("Access token đã hết hạn.");
            }
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        } catch (e) {
            console.error("Token không hợp lệ:", e);
        }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// --- Chặn và thay thế bằng API giả ---
if (USE_MOCK_API) {
    console.log("%c[LUMIERE] Chế độ Mock API đang được bật.", "color: #4f46e5; font-weight: bold;");

    axiosClient.get = async (url, config) => {
        console.log(`[Mock API] GET: ${url}`, { params: config?.params });
        const params = new URLSearchParams(config?.params);
        return Promise.resolve(mockApi.handleGet(url, params));
    };

    axiosClient.post = async (url, data) => {
        console.log(`[Mock API] POST: ${url}`, { data });
        return Promise.resolve(mockApi.handlePost(url, data));
    };
    
}

export default axiosClient;
