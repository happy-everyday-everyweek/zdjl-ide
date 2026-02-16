import React, { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useApp } from '../context/AppContext'
import { FiX, FiCircle } from 'react-icons/fi'
import { zdjlAPIHints } from '../data/apiHints'
import { NodeLibraryItem } from '../types'
import NodeLibraryPanel from './NodeLibraryPanel'
import { checkCodeErrors, CodeError } from '../services/errorChecker'
import ErrorPanel from './ErrorPanel'
import { 
  CoordinateHoverPanel, 
  ColorHoverPanel,
  NodeHoverPanel
} from './HoverPanels'
import {
  analyzeContext,
  getAICompletion,
  getSmartSnippets,
  extractCoordinates,
  extractColors,
  CompletionContext,
  AICompletionResult,
} from '../services/aiCompletion'

interface HoverInfo {
  type: 'coordinate' | 'color' | 'node'
  position: { x: number; y: number }
  data: any
  range: { startColumn: number; endColumn: number; lineNumber: number }
}

const EditorArea: React.FC = () => {
  const {
    openTabs,
    activeTabId,
    setActiveTab,
    closeTab,
    updateTabContent,
    saveCurrentTab,
    settings,
    nodeLibraries,
    setCodeErrors,
    codeErrors,
    showErrorPanel,
    setShowErrorPanel,
  } = useApp()
  
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const [showNodePanel, setShowNodePanel] = useState(false)
  const [nodePanelPosition, setNodePanelPosition] = useState({ x: 0, y: 0 })
  const [nodeFilter, setNodeFilter] = useState('')
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)
  const [isAILoading, setIsAILoading] = useState(false)
  const [aiCompletionCache, setAiCompletionCache] = useState<Map<string, AICompletionResult[]>>(new Map())
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const errorCheckDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const errorDecorationsRef = useRef<string[]>([])

  const activeTab = openTabs.find(tab => tab.id === activeTabId)

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco

    monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ['.', ' ', '(', ',', '\n'],
      provideCompletionItems: async (model: any, position: any, context: any) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        const lineContent = model.getLineContent(position.lineNumber)
        const textBeforeCursor = lineContent.substring(0, position.column - 1)
        const fullText = model.getValue()
        
        const completionContext: CompletionContext = {
          textBeforeCursor,
          textAfterCursor: lineContent.substring(position.column - 1),
          currentLine: lineContent,
          lineNumber: position.lineNumber,
          column: position.column,
          fileContent: fullText,
        }

        const suggestions: any[] = []

        if (textBeforeCursor.endsWith('zdjl.')) {
          const zdjlSuggestions = zdjlAPIHints.map(hint => ({
            label: hint.name,
            kind: hint.kind === 'function' 
              ? monaco.languages.CompletionItemKind.Function 
              : monaco.languages.CompletionItemKind.Property,
            insertText: hint.signature || hint.name,
            insertTextRules: hint.signature?.includes('(') 
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet 
              : undefined,
            documentation: hint.description,
            detail: hint.category,
            range,
            sortText: `0_${hint.name}`,
          }))
          suggestions.push(...zdjlSuggestions)
        }

        const analysis = analyzeContext(completionContext)
        if (analysis.suggestions.length > 0) {
          analysis.suggestions.forEach(s => {
            suggestions.push({
              label: {
                label: s.displayText,
                description: s.isAI ? '🤖 AI建议' : s.kind,
              },
              kind: s.kind === 'function' 
                ? monaco.languages.CompletionItemKind.Function 
                : s.kind === 'snippet' 
                  ? monaco.languages.CompletionItemKind.Snippet
                  : monaco.languages.CompletionItemKind.Property,
              insertText: s.text,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: s.documentation,
              range,
              sortText: s.sortText || '5',
            })
          })
        }

        const smartSnippets = getSmartSnippets(completionContext)
        smartSnippets.forEach(s => {
          suggestions.push({
            label: {
              label: s.displayText,
              description: '📝 快捷代码段',
            },
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: s.text,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: s.documentation,
            range,
            sortText: s.sortText || '8',
          })
        })

        if (settings.apiKey && suggestions.length === 0 && context.triggerCharacter === '\n') {
          const cacheKey = `${position.lineNumber}_${textBeforeCursor.slice(-50)}`
          let aiResults = aiCompletionCache.get(cacheKey)
          
          if (!aiResults) {
            setIsAILoading(true)
            try {
              aiResults = await getAICompletion(completionContext, settings.apiKey)
              setAiCompletionCache(prev => {
                const newCache = new Map(prev)
                newCache.set(cacheKey, aiResults!)
                return newCache
              })
            } catch (e) {
              console.error('AI completion error:', e)
            } finally {
              setIsAILoading(false)
            }
          }

          if (aiResults && aiResults.length > 0) {
            aiResults.forEach(s => {
              suggestions.push({
                label: {
                  label: s.displayText,
                  description: '🤖 AI智能补全',
                },
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: s.text,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: s.documentation,
                range,
                sortText: '9',
              })
            })
          }
        }

        return { suggestions }
      },
    })

    monaco.languages.registerHoverProvider('javascript', {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position)
        if (!word) return null

        const lineContent = model.getLineContent(position.lineNumber)
        const textBeforeWord = lineContent.substring(0, word.startColumn - 1)
        
        if (textBeforeWord.endsWith('zdjl.')) {
          const hint = zdjlAPIHints.find(h => h.name === word.word)
          if (hint) {
            return {
              contents: [
                { value: `**${hint.name}**` },
                { value: hint.description },
                { value: '```javascript\n' + (hint.example || '') + '\n```' },
              ],
            }
          }
        }

        return null
      },
    })

    const model = editor.getModel()
    registerHoverProviderForCoordinatesAndColors(monaco, model, editor)

    editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      const position = editor.getPosition()
      if (!model || !position) return

      const lineContent = model.getLineContent(position.lineNumber)
      const textBeforeCursor = lineContent.substring(0, position.column - 1)
      
      const nodeParamMatch = textBeforeCursor.match(/node:\s*["']?([^"'\s]*)$/)
      if (nodeParamMatch) {
        setNodeFilter(nodeParamMatch[1] || '')
        const editorPosition = editor.getScrolledVisiblePosition(position)
        if (editorPosition) {
          const layoutInfo = editor.getLayoutInfo()
          setNodePanelPosition({
            x: editorPosition.left + layoutInfo.contentLeft,
            y: editorPosition.top + 20,
          })
        }
        setShowNodePanel(true)
      } else {
        setShowNodePanel(false)
      }
    })

    editor.onMouseMove((e: any) => {
      if (e.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) {
        setHoverInfo(null)
        return
      }

      const position = e.target.position
      if (!position) {
        setHoverInfo(null)
        return
      }

      const model = editor.getModel()
      if (!model) return

      const lineContent = model.getLineContent(position.lineNumber)
      
      const coords = extractCoordinates(lineContent)
      for (const coord of coords) {
        if (position.column >= coord.startIndex + 1 && position.column <= coord.endIndex + 1) {
          const editorPos = editor.getScrolledVisiblePosition(position)
          if (editorPos) {
            const layoutInfo = editor.getLayoutInfo()
            setHoverInfo({
              type: 'coordinate',
              position: {
                x: editorPos.left + layoutInfo.contentLeft,
                y: editorPos.top + 20,
              },
              data: { x: coord.x, y: coord.y },
              range: {
                startColumn: coord.startIndex + 1,
                endColumn: coord.endIndex + 1,
                lineNumber: position.lineNumber,
              },
            })
          }
          return
        }
      }

      const colors = extractColors(lineContent)
      for (const color of colors) {
        if (position.column >= color.startIndex + 1 && position.column <= color.endIndex + 1) {
          const editorPos = editor.getScrolledVisiblePosition(position)
          if (editorPos) {
            const layoutInfo = editor.getLayoutInfo()
            setHoverInfo({
              type: 'color',
              position: {
                x: editorPos.left + layoutInfo.contentLeft,
                y: editorPos.top + 20,
              },
              data: { color: color.color },
              range: {
                startColumn: color.startIndex + 1,
                endColumn: color.endIndex + 1,
                lineNumber: position.lineNumber,
              },
            })
          }
          return
        }
      }

      const nodeMatch = lineContent.match(/node:\s*["']([^"']+)["']/)
      if (nodeMatch) {
        const nodeName = nodeMatch[1]
        const nodeStartIndex = lineContent.indexOf(nodeMatch[0]) + nodeMatch[0].indexOf(nodeName)
        const nodeEndIndex = nodeStartIndex + nodeName.length
        
        if (position.column >= nodeStartIndex + 1 && position.column <= nodeEndIndex + 1) {
          const allNodes = getAllNodes()
          const matchedNode = allNodes.find(n => n.name === nodeName)
          
          const editorPos = editor.getScrolledVisiblePosition(position)
          if (editorPos) {
            const layoutInfo = editor.getLayoutInfo()
            setHoverInfo({
              type: 'node',
              position: {
                x: editorPos.left + layoutInfo.contentLeft,
                y: editorPos.top + 20,
              },
              data: { nodeName, nodeData: matchedNode || null },
              range: {
                startColumn: nodeStartIndex + 1,
                endColumn: nodeEndIndex + 1,
                lineNumber: position.lineNumber,
              },
            })
          }
          return
        }
      }

      setHoverInfo(null)
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveCurrentTab()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {})
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
      setShowErrorPanel(!showErrorPanel)
    })

    if (activeTab) {
      runErrorCheck(activeTab.content)
    }
  }

  const runErrorCheck = (code: string) => {
    if (errorCheckDebounceRef.current) {
      clearTimeout(errorCheckDebounceRef.current)
    }
    errorCheckDebounceRef.current = setTimeout(() => {
      const errors = checkCodeErrors(code)
      setCodeErrors(errors)
      updateErrorDecorations(errors)
    }, 500)
  }

  const updateErrorDecorations = (errors: CodeError[]) => {
    if (!editorRef.current || !monacoRef.current) return
    
    const editor = editorRef.current
    const monaco = monacoRef.current

    const decorations = errors.map(error => ({
      range: new monaco.Range(
        error.line,
        error.column,
        error.line,
        error.endColumn
      ),
      options: {
        className: error.type === 'error' 
          ? 'error-line-error' 
          : error.type === 'warning' 
            ? 'error-line-warning' 
            : 'error-line-info',
        glyphMarginClassName: error.type === 'error'
          ? 'error-glyph-error'
          : error.type === 'warning'
            ? 'error-glyph-warning'
            : 'error-glyph-info',
        hoverMessage: { value: error.message },
        minimap: {
          position: 1,
          color: error.type === 'error' ? '#ff0000' : error.type === 'warning' ? '#ffaa00' : '#0088ff'
        }
      }
    }))

    errorDecorationsRef.current = editor.deltaDecorations(errorDecorationsRef.current, decorations)
  }

  const jumpToError = (error: CodeError) => {
    if (!editorRef.current) return
    
    const editor = editorRef.current
    editor.revealLineInCenter(error.line)
    editor.setPosition({
      lineNumber: error.line,
      column: error.column
    })
    editor.focus()
  }

  const fixError = (error: CodeError) => {
    if (!error.suggestion || !editorRef.current) return

    const editor = editorRef.current
    const model = editor.getModel()
    if (!model) return

    editor.executeEdits('error-fixer', [{
      range: {
        startLineNumber: error.line,
        endLineNumber: error.line,
        startColumn: error.column,
        endColumn: error.endColumn,
      },
      text: error.suggestion,
    }])

    setCodeErrors(codeErrors.filter(e => e.id !== error.id))
  }

  const registerHoverProviderForCoordinatesAndColors = (monaco: any, model: any, editor: any) => {
    const decorations: string[] = []

    const updateDecorations = () => {
      if (!model) return

      const text = model.getValue()
      const lines = text.split('\n')
      const newDecorations: any[] = []

      lines.forEach((line: string, lineIndex: number) => {
        const coords = extractCoordinates(line)
        coords.forEach(coord => {
          newDecorations.push({
            range: new monaco.Range(
              lineIndex + 1,
              coord.startIndex + 1,
              lineIndex + 1,
              coord.endIndex + 1
            ),
            options: {
              inlineClassName: 'coordinate-highlight',
              hoverMessage: { value: `**坐标**: (${coord.x}, ${coord.y})` },
            },
          })
        })

        const colors = extractColors(line)
        colors.forEach(color => {
          newDecorations.push({
            range: new monaco.Range(
              lineIndex + 1,
              color.startIndex + 1,
              lineIndex + 1,
              color.endIndex + 1
            ),
            options: {
              inlineClassName: 'color-highlight',
              hoverMessage: { value: `**颜色**: ${color.color}` },
            },
          })
        })
      })

      decorations.length = 0
      decorations.push(...editor.deltaDecorations(decorations, newDecorations))
    }

    updateDecorations()
    model.onDidChangeContent(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(updateDecorations, 300)
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeTabId) {
      updateTabContent(activeTabId, value)
      runErrorCheck(value)
    }
  }

  const handleNodeSelect = (node: NodeLibraryItem) => {
    if (!editorRef.current || !activeTab) return
    
    const editor = editorRef.current
    const model = editor.getModel()
    const position = editor.getPosition()
    if (!model || !position) return

    const lineContent = model.getLineContent(position.lineNumber)
    const match = lineContent.match(/node:\s*["']?([^"'\s]*)["']?/)
    if (match) {
      const startColumn = lineContent.indexOf(match[1]) + 1
      const endColumn = startColumn + match[1].length
      
      editor.executeEdits('', [{
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn,
          endColumn,
        },
        text: node.name,
      }])
    }
    
    setShowNodePanel(false)
  }

  const handleCoordinateApply = (x: string, y: string) => {
    if (!editorRef.current || !hoverInfo) return
    
    const editor = editorRef.current
    const model = editor.getModel()
    if (!model) return

    const lineContent = model.getLineContent(hoverInfo.range.lineNumber)
    const coords = extractCoordinates(lineContent)
    
    if (coords.length > 0) {
      const coord = coords[0]
      const newText = `"${x}", "${y}"`
      
      editor.executeEdits('', [{
        range: {
          startLineNumber: hoverInfo.range.lineNumber,
          endLineNumber: hoverInfo.range.lineNumber,
          startColumn: coord.startIndex + 1,
          endColumn: coord.endIndex + 1,
        },
        text: newText,
      }])
    }
    
    setHoverInfo(null)
  }

  const handleColorApply = (color: string) => {
    if (!editorRef.current || !hoverInfo) return
    
    const editor = editorRef.current
    const model = editor.getModel()
    if (!model) return

    editor.executeEdits('', [{
      range: {
        startLineNumber: hoverInfo.range.lineNumber,
        endLineNumber: hoverInfo.range.lineNumber,
        startColumn: hoverInfo.range.startColumn,
        endColumn: hoverInfo.range.endColumn,
      },
      text: color,
    }])
    
    setHoverInfo(null)
  }

  const handleNodeInsert = (nodeName: string) => {
    if (!editorRef.current) return
    
    const editor = editorRef.current
    const model = editor.getModel()
    const position = editor.getPosition()
    if (!model || !position) return

    const lineContent = model.getLineContent(position.lineNumber)
    const nodeMatch = lineContent.match(/node:\s*["']([^"']+)["']/)
    
    if (nodeMatch) {
      const startColumn = lineContent.indexOf(nodeMatch[1]) + 1
      const endColumn = startColumn + nodeMatch[1].length
      
      editor.executeEdits('', [{
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn,
          endColumn,
        },
        text: nodeName,
      }])
    }
    
    setHoverInfo(null)
  }

  const getAllNodes = (): NodeLibraryItem[] => {
    const allNodes: NodeLibraryItem[] = []
    nodeLibraries.forEach(lib => {
      if (lib.items) {
        allNodes.push(...lib.items)
      }
    })
    return allNodes
  }

  const filteredNodes = getAllNodes().filter(node => 
    node.name.toLowerCase().includes(nodeFilter.toLowerCase()) ||
    node.description.toLowerCase().includes(nodeFilter.toLowerCase())
  )

  return (
    <div className="editor-area">
      <div className="tabs-container">
        {openTabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-name">
              {tab.isDirty && <FiCircle className="dirty-indicator" />}
              {tab.name}
            </span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
            >
              <FiX />
            </button>
          </div>
        ))}
      </div>
      <div className="editor-container">
        {activeTab ? (
          <>
            <Editor
              height="100%"
              language={activeTab.language}
              value={activeTab.content}
              theme={settings.theme}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                fontSize: settings.fontSize,
                minimap: { enabled: true },
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
                quickSuggestions: {
                  other: true,
                  comments: true,
                  strings: true,
                },
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                snippetSuggestions: 'top',
                wordBasedSuggestions: 'allDocuments',
                parameterHints: { enabled: true },
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
            {showNodePanel && filteredNodes.length > 0 && (
              <NodeLibraryPanel
                nodes={filteredNodes}
                position={nodePanelPosition}
                filter={nodeFilter}
                onFilterChange={setNodeFilter}
                onSelect={handleNodeSelect}
                onClose={() => setShowNodePanel(false)}
              />
            )}
            {hoverInfo && hoverInfo.type === 'coordinate' && (
              <CoordinateHoverPanel
                x={hoverInfo.data.x}
                y={hoverInfo.data.y}
                position={hoverInfo.position}
                onApply={handleCoordinateApply}
                onClose={() => setHoverInfo(null)}
              />
            )}
            {hoverInfo && hoverInfo.type === 'color' && (
              <ColorHoverPanel
                color={hoverInfo.data.color}
                position={hoverInfo.position}
                onApply={handleColorApply}
                onClose={() => setHoverInfo(null)}
              />
            )}
            {hoverInfo && hoverInfo.type === 'node' && (
              <NodeHoverPanel
                nodeName={hoverInfo.data.nodeName}
                nodeData={hoverInfo.data.nodeData}
                position={hoverInfo.position}
                onClose={() => setHoverInfo(null)}
                onInsert={handleNodeInsert}
              />
            )}
            {isAILoading && (
              <div className="ai-loading-indicator">
                <span className="spinner"></span>
                <span>AI补全中...</span>
              </div>
            )}
            {showErrorPanel && (
              <ErrorPanel
                errors={codeErrors}
                onJumpToError={jumpToError}
                onClose={() => setShowErrorPanel(false)}
                onFixError={fixError}
              />
            )}
          </>
        ) : (
          <div className="editor-placeholder">
            <p>选择一个文件开始编辑</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditorArea
