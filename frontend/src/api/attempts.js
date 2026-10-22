import { request } from './client'

// start / get return { attempt, test }
export const startAttempt = (testId) =>
    request('/attempts', { method: 'POST', body: { testId } })
export const getAttempt = (id) => request(`/attempts/${id}`)
export const listAttempts = () => request('/attempts').then((d) => d.attempts)
export const saveAnswers = (id, answers) =>
    request(`/attempts/${id}/answers`, { method: 'PATCH', body: { answers } })
export const submitAttempt = (id, answers) =>
    request(`/attempts/${id}/submit`, { method: 'POST', body: { answers } }).then((d) => d.attempt)