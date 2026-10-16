export class ApiError extends Error {
    constructor(message, status) {
        super(message)
        this.status = status
    }
}

// One place for fetch settings: cookies, JSON, and clean error messages
export const request = async (path, { method = 'GET', body, form } = {}) => {
    const options = { method, credentials: 'include', headers: {} }

    if (form) {
        options.body = form // the browser sets the multipart boundary itself
    } else if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json'
        options.body = JSON.stringify(body)
    }

    let res
    try {
        res = await fetch(`/api${path}`, options)
    } catch {
        throw new ApiError('Cannot reach the server. Is the backend running?', 0)
    }

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
        const message = data.errors?.length
            ? data.errors.map((e) => e.message).join('. ')
            : data.message || 'Something went wrong'
        throw new ApiError(message, res.status)
    }

    return data
}