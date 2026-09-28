import React from 'react'

const Exam = () => {
    return (
        <div>
            <h1>Exam</h1>
            <p>Question 1 of 10</p>

            <h3>What is the capital of France?</h3>

            <div>
                <label>
                    <input type="radio" name="answer" /> Paris
                </label>
                <br />
                <label>
                    <input type="radio" name="answer" /> London
                </label>
                <br />
                <label>
                    <input type="radio" name="answer" /> Berlin
                </label>
                <br />
                <label>
                    <input type="radio" name="answer" /> Madrid
                </label>
            </div>

            <br />

            <button>Previous</button>
            <button>Next</button>
        </div>
    )
}

export default Exam