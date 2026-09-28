import React from 'react'

const Results = () => {
    return (
        <div>
            <h1>Results</h1>
            <p>Here's how you did.</p>

            <div>
                <h2>8 / 10</h2>
                <p>Score: 80%</p>
            </div>

            <table border="1" cellPadding="10">
                <thead>
                    <tr>
                        <th>Question</th>
                        <th>Your Answer</th>
                        <th>Correct Answer</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>Paris</td>
                        <td>Paris</td>
                        <td>Correct</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Berlin</td>
                        <td>London</td>
                        <td>Wrong</td>
                    </tr>
                </tbody>
            </table>

            <br />

            <button>Back to Dashboard</button>
        </div>
    )
}

export default Results