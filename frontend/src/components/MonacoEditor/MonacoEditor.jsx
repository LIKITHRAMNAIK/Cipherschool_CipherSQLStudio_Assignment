import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './MonacoEditor.scss';

function MonacoEditor({ value, onChange, placeholder = 'Write your SQL query here...' }) {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('sqlTheme', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1f2937',
      },
    });
    monaco.editor.setTheme('sqlTheme');

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
      });
      editor.getDomNode().dispatchEvent(event);
    });
  };

  return (
    <div className="monaco-editor-wrapper">
      <Editor
        height="300px"
        defaultLanguage="sql"
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
        }}
        placeholder={placeholder}
      />
    </div>
  );
}

export default MonacoEditor;

