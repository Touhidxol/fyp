import React from 'react'
import Editor from '@monaco-editor/react'

// language ids match Monaco's: python | javascript | cpp | java
const CodeEditor = ({ language, value, onChange, height = 380 }) => (
    <div className="code-editor">
        <Editor
            height={height}
            language={language}
            value={value}
            onChange={(v) => onChange(v ?? '')}
            theme="vs"
            loading={<div className="code-editor-loading">Loading editor…</div>}
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: '"IBM Plex Mono", Consolas, monospace',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 12, bottom: 12 },
            }}
        />
    </div>
)

export default CodeEditor