import React, { useState, useEffect, useRef } from 'react';
import ScriptingService from '../../services/ScriptingService';
import { Editor } from '@monaco-editor/react';

interface ScriptEditorProps {
  onScriptExecute?: (result: any) => void;
  onError?: (error: Error) => void;
}

interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  script: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    default?: any;
    required?: boolean;
  }[];
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({
  onScriptExecute,
  onError
}) => {
  const [script, setScript] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplate | null>(null);
  const [templateParams, setTemplateParams] = useState<Record<string, any>>({});
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [output, setOutput] = useState<string>('');
  const editorRef = useRef<any>(null);

  // Load templates on mount
  useEffect(() => {
    setTemplates(ScriptingService.getTemplates());

    // Subscribe to script execution events
    const handleScriptOutput = (data: any) => {
      setOutput(prev => prev + '\n' + JSON.stringify(data, null, 2));
    };

    const handleScriptError = (error: Error) => {
      setOutput(prev => prev + '\n[ERROR] ' + error.message);
      onError?.(error);
    };

    ScriptingService.on('scriptCompleted', handleScriptOutput);
    ScriptingService.on('error', handleScriptError);

    return () => {
      ScriptingService.removeListener('scriptCompleted', handleScriptOutput);
      ScriptingService.removeListener('error', handleScriptError);
    };
  }, []);

  // Handle editor mount
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  // Execute script
  const executeScript = async () => {
    try {
      setIsExecuting(true);
      setOutput('');

      let scriptToExecute = script;
      let params = {};

      if (selectedTemplate) {
        scriptToExecute = selectedTemplate.script;
        params = templateParams;
      }

      const result = await ScriptingService.executeScript(scriptToExecute, params);
      onScriptExecute?.(result);
      setOutput(prev => prev + '\n[SUCCESS] Script executed successfully');
    } catch (error) {
      setOutput(prev => prev + '\n[ERROR] ' + error.message);
      onError?.(error as Error);
    } finally {
      setIsExecuting(false);
    }
  };

  // Load template
  const loadTemplate = (template: ScriptTemplate) => {
    setSelectedTemplate(template);
    setScript(template.script);

    // Initialize template parameters with default values
    const defaultParams = template.parameters.reduce((acc, param) => {
      acc[param.name] = param.default;
      return acc;
    }, {} as Record<string, any>);
    setTemplateParams(defaultParams);
  };

  // Update template parameter
  const updateTemplateParam = (name: string, value: any) => {
    setTemplateParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          {/* Template Selection */}
          <select
            value={selectedTemplate?.id || ''}
            onChange={(e) => {
              const template = templates.find(t => t.id === e.target.value);
              if (template) {
                loadTemplate(template);
              } else {
                setSelectedTemplate(null);
                setScript('');
                setTemplateParams({});
              }
            }}
            className="bg-gray-800 text-white rounded px-3 py-2"
          >
            <option value="">Custom Script</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>

          {/* Execute Button */}
          <button
            onClick={executeScript}
            disabled={isExecuting}
            className={`px-4 py-2 rounded ${
              isExecuting
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isExecuting ? 'Executing...' : 'Execute Script'}
          </button>
        </div>

        {/* Template Parameters */}
        {selectedTemplate && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {selectedTemplate.parameters.map(param => (
              <div key={param.name}>
                <label className="block text-sm font-medium mb-1">
                  {param.name}
                  {param.required && <span className="text-red-500">*</span>}
                </label>
                {param.type === 'number' ? (
                  <input
                    type="number"
                    value={templateParams[param.name] || ''}
                    onChange={(e) => updateTemplateParam(param.name, parseFloat(e.target.value))}
                    className="w-full bg-gray-800 rounded px-3 py-2"
                  />
                ) : param.type === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={templateParams[param.name] || false}
                    onChange={(e) => updateTemplateParam(param.name, e.target.checked)}
                    className="bg-gray-800 rounded"
                  />
                ) : (
                  <input
                    type="text"
                    value={templateParams[param.name] || ''}
                    onChange={(e) => updateTemplateParam(param.name, e.target.value)}
                    className="w-full bg-gray-800 rounded px-3 py-2"
                  />
                )}
                <p className="text-xs text-gray-400 mt-1">{param.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={script}
          onChange={(value) => setScript(value || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true
          }}
        />
      </div>

      {/* Output Console */}
      <div className="h-48 bg-gray-800 p-4 overflow-auto font-mono text-sm">
        <div className="whitespace-pre-wrap">{output}</div>
      </div>
    </div>
  );
};

export default ScriptEditor;