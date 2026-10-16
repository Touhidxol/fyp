import React from 'react'
import { Link } from 'react-router-dom'

const EmptyState = ({ title, text, actionTo, actionLabel }) => (
    <div className="card empty-state">
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        {actionTo && (
            <Link to={actionTo} className="btn btn-primary">
                {actionLabel}
            </Link>
        )}
    </div>
)

export default EmptyState