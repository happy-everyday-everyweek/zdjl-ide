import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { FiX, FiKey } from 'react-icons/fi'

const ApiKeyModal: React.FC = () => {
  const { settings, updateSettings, setShowApiKeyModal } = useApp()
  const [apiKey, setApiKey] = useState(settings.apiKey || '')
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('请输入API密钥')
      return
    }
    
    await window.electronAPI.store.set('apiKey', apiKey.trim())
    updateSettings({ apiKey: apiKey.trim() })
    setShowApiKeyModal(false)
  }

  const handleSkip = () => {
    setShowApiKeyModal(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">
            <FiKey /> 设置 DeepSeek API 密钥
          </h3>
          <button className="modal-close" onClick={handleSkip}>
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-description">
            首次使用需要设置 DeepSeek API 密钥以启用 AI 辅助编写功能。
            您可以在 <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer">DeepSeek 平台</a> 获取 API 密钥。
          </p>
          <div className="form-group">
            <label className="form-label">API 密钥</label>
            <input
              type="password"
              className="input form-input"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setError('')
              }}
            />
            {error && <span className="form-error">{error}</span>}
          </div>
          <p className="form-hint">
            您的 API 密钥将安全存储在本地，不会上传到任何服务器。
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleSkip}>
            稍后设置
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApiKeyModal
