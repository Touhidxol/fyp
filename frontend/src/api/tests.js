import { request } from './client'

export const listTests = () => request('/tests').then((d) => d.tests)
export const getTest = (id) => request(`/tests/${id}`).then((d) => d.test)
export const deleteTest = (id) => request(`/tests/${id}`, { method: 'DELETE' })