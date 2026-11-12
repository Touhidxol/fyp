import { request } from './client'

// { success, available, languages }
export const getCodingStatus = () => request('/coding/status')