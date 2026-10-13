import axios from 'axios';
import { setupInterceptors } from './interceptors';

/** Instance axios duy nhất của app. Test thay `http.defaults.adapter` (xem test/support/mock-api.ts). */
export const http = axios.create({ baseURL: '/api' });

setupInterceptors(http);
