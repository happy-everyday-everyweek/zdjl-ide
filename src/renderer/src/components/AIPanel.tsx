import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { FiSend, FiTrash2, FiCode, FiZap, FiMessageCircle } from 'react-icons/fi'
import { callDeepSeek, generateCodePrompt, explainCodePrompt, optimizeCodePrompt, AIMessage } from '../services/ai'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AIPanel: React.FC = () => {
  const { settings, activeTabId, openTabs } = useApp()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeTab = openTabs.find(tab => tab.id === activeTabId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, message])
    return message
  }

  const sendMessage = async (userMessage: string) => {
    if (!settings.apiKey) {
      addMessage('assistant', '请先设置 DeepSeek API 密钥')
      return
    }

    addMessage('user', userMessage)
    setIsLoading(true)

    try {
      const context = activeTab?.content
      const aiMessages: AIMessage[] = generateCodePrompt(userMessage, context)
      
      const response = await callDeepSeek(settings.apiKey, aiMessages)
      
      if (response.error) {
        addMessage('assistant', `错误: ${response.error}`)
      } else {
        addMessage('assistant', response.content)
      }
    } catch (error: any) {
      addMessage('assistant', `发生错误: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleExplainCode = async () => {
    if (!activeTab?.content) {
      addMessage('assistant', '请先打开一个脚本文件')
      return
    }
    
    setIsLoading(true)
    addMessage('user', '请解释当前代码')
    
    try {
      const response = await callDeepSeek(settings.apiKey!, explainCodePrompt(activeTab.content))
      if (response.error) {
        addMessage('assistant', `错误: ${response.error}`)
      } else {
        addMessage('assistant', response.content)
      }
    } catch (error: any) {
      addMessage('assistant', `发生错误: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptimizeCode = async () => {
    if (!activeTab?.content) {
      addMessage('assistant', '请先打开一个脚本文件')
      return
    }
    
    setIsLoading(true)
    addMessage('user', '请优化当前代码')
    
    try {
      const response = await callDeepSeek(settings.apiKey!, optimizeCodePrompt(activeTab.content))
      if (response.error) {
        addMessage('assistant', `错误: ${response.error}`)
      } else {
        addMessage('assistant', response.content)
      }
    } catch (error: any) {
      addMessage('assistant', `发生错误: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  const insertCode = (code: string) => {
    const codeMatch = code.match(/```(?:javascript|js)?\n([\s\S]*?)```/)
    if (codeMatch && codeMatch[1]) {
      navigator.clipboard.writeText(codeMatch[1].trim())
      addMessage('assistant', '代码已复制到剪贴板，您可以在编辑器中粘贴使用')
    }
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h3><FiMessageCircle /> AI 助手</h3>
        <div className="ai-panel-actions">
          <button className="icon-btn" onClick={handleExplainCode} title="解释代码">
            <FiCode />
          </button>
          <button className="icon-btn" onClick={handleOptimizeCode} title="优化代码">
            <FiZap />
          </button>
          <button className="icon-btn" onClick={clearMessages} title="清空对话">
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className="ai-messages">
        {messages.length === 0 && (
          <div className="ai-welcome">
            <p>👋 你好！我是自动精灵脚本编写助手</p>
            <p>你可以：</p>
            <ul>
              <li>询问自动精灵 API 用法</li>
              <li>让我帮你生成脚本代码</li>
              <li>解释和优化你的代码</li>
              <li>解决脚本编写问题</li>
            </ul>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-message ${msg.role}`}>
            <div className="message-content">
              {msg.content.split('```').map((part, index) => {
                if (index % 2 === 1) {
                  const codeContent = part.replace(/^(javascript|js)?\n/, '')
                  return (
                    <div key={index} className="code-block">
                      <pre><code>{codeContent}</code></pre>
                      <button 
                        className="copy-btn"
                        onClick={() => insertCode(`\`\`\`${part}\`\`\``)}
                      >
                        复制代码
                      </button>
                    </div>
                  )
                }
                return <span key={index}>{part}</span>
              })}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="ai-message assistant">
            <div className="message-content loading">
              <span className="spinner"></span>
              <span>思考中...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题或需求..."
          rows={3}
          disabled={isLoading}
        />
        <button
          className="btn btn-primary send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <FiSend /> 发送
        </button>
      </div>
    </div>
  )
}

export default AIPanel
