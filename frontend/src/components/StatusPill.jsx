import React from 'react'

const labels = {
    ready: 'Ready',
    generating: 'Generating…',
    failed: 'Failed',
}

const StatusPill = ({ status }) => (
    <span className={'status-pill ' + status}>
        <span className="dot" />
        {labels[status] || status}
    </span>
)

export default StatusPill