import { request } from './client'

export const listNotebooks = () => request('/notebooks').then((d) => d.notebooks)
export const getNotebook = (id) => request(`/notebooks/${id}`).then((d) => d.notebook)
export const createNotebook = (body) =>
    request('/notebooks', { method: 'POST', body }).then((d) => d.notebook)
export const deleteNotebook = (id) => request(`/notebooks/${id}`, { method: 'DELETE' })

export const uploadDocument = (id, file) => {
    const form = new FormData()
    form.append('file', file) // field name must be "file"
    return request(`/notebooks/${id}/documents`, { method: 'POST', form })
}
export const deleteDocument = (id, documentId) =>
    request(`/notebooks/${id}/documents/${documentId}`, { method: 'DELETE' })

export const listNotebookTests = (id) => request(`/notebooks/${id}/tests`).then((d) => d.tests)
export const generateTest = (id, body) =>
    request(`/notebooks/${id}/tests`, { method: 'POST', body }).then((d) => d.test)
