import React, { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { FiX, FiSave, FiRefreshCw, FiInfo, FiSettings, FiMonitor, FiLock, FiCode } from 'react-icons/fi'
import { ZJSHeader } from '../../types'
import { defaultHeader } from '../../services/zjsExporter'

const HeaderEditorModal: React.FC = () => {
  const { projectPath, showHeaderEditorModal, setShowHeaderEditorModal } = useApp()
  const [header, setHeader] = useState<Partial<ZJSHeader>>({})
  const [activeTab, setActiveTab] = useState<'basic' | 'screen' | 'version' | 'encrypt' | 'advanced'>('basic')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalHeader, setOriginalHeader] = useState<string>('')

  useEffect(() => {
    const loadHeader = async () => {
      if (projectPath && showHeaderEditorModal && window.electronAPI) {
        const result = await window.electronAPI.fs.readFile(`${projectPath}/Information/header.json`)
        if (result.success && result.content) {
          try {
            const parsed = JSON.parse(result.content)
            setHeader(parsed)
            setOriginalHeader(result.content)
          } catch (e) {
            console.error('Failed to parse header.json')
            setHeader(defaultHeader)
          }
        } else {
          setHeader(defaultHeader)
        }
        setHasChanges(false)
      }
    }
    loadHeader()
  }, [projectPath, showHeaderEditorModal])

  if (!showHeaderEditorModal) return null

  const updateHeader = (updates: Partial<ZJSHeader>) => {
    setHeader(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!projectPath || !window.electronAPI) return
    
    setIsSaving(true)
    try {
      const headerPath = `${projectPath}/Information/header.json`
      await window.electronAPI.fs.writeFile(headerPath, JSON.stringify(header, null, 2))
      setOriginalHeader(JSON.stringify(header, null, 2))
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save header:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setHeader(defaultHeader)
    setHasChanges(true)
  }

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('有未保存的更改，确定要关闭吗？')) {
        setShowHeaderEditorModal(false)
      }
    } else {
      setShowHeaderEditorModal(false)
    }
  }

  const renderBasicTab = () => (
    <div className="header-editor-section">
      <div className="form-group">
        <label className="form-label">脚本描述</label>
        <textarea
          className="input form-input textarea"
          value={header.description || ''}
          onChange={(e) => updateHeader({ description: e.target.value })}
          placeholder="输入脚本描述..."
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group half">
          <label className="form-label">
            重复次数
            <span className="label-hint">(-1=单次, 0=无限循环)</span>
          </label>
          <input
            type="number"
            className="input form-input"
            value={header.repeatCount ?? -1}
            onChange={(e) => updateHeader({ repeatCount: parseInt(e.target.value) || -1 })}
          />
        </div>
        <div className="form-group half">
          <label className="form-label">失败暂停</label>
          <select
            className="input form-input"
            value={header.pauseOnFail ? 'true' : 'false'}
            onChange={(e) => updateHeader({ pauseOnFail: e.target.value === 'true' })}
          >
            <option value="true">是 - 失败后暂停脚本</option>
            <option value="false">否 - 失败后继续执行</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group half">
          <label className="form-label">
            等待时间
            <span className="label-hint">(全局默认)</span>
          </label>
          <input
            type="text"
            className="input form-input"
            value={header.delay || ''}
            onChange={(e) => updateHeader({ delay: e.target.value })}
            placeholder="例如: 1 或 500"
          />
        </div>
        <div className="form-group half">
          <label className="form-label">动作数量</label>
          <input
            type="number"
            className="input form-input"
            value={header.count ?? 1}
            onChange={(e) => updateHeader({ count: parseInt(e.target.value) || 1 })}
            placeholder="自动计算"
          />
          <span className="form-hint">导出时自动计算</span>
        </div>
      </div>
    </div>
  )

  const renderScreenTab = () => (
    <div className="header-editor-section">
      <div className="section-info">
        <FiInfo />
        <span>推荐分辨率用于提示用户最佳运行环境，不影响脚本实际执行</span>
      </div>

      <div className="form-section-title">推荐分辨率</div>
      <div className="form-row">
        <div className="form-group third">
          <label className="form-label">宽度</label>
          <input
            type="number"
            className="input form-input"
            value={header.screenWidth || 0}
            onChange={(e) => updateHeader({ screenWidth: parseInt(e.target.value) || 0 })}
            placeholder="0 = 通用"
          />
        </div>
        <div className="form-group third">
          <label className="form-label">高度</label>
          <input
            type="number"
            className="input form-input"
            value={header.screenHeight || 0}
            onChange={(e) => updateHeader({ screenHeight: parseInt(e.target.value) || 0 })}
            placeholder="0 = 通用"
          />
        </div>
        <div className="form-group third">
          <label className="form-label">DPI</label>
          <input
            type="number"
            className="input form-input"
            value={header.screenDpi || 0}
            onChange={(e) => updateHeader({ screenDpi: parseInt(e.target.value) || 0 })}
            placeholder="0 = 通用"
            step="0.5"
          />
        </div>
      </div>

      <div className="form-section-title">保存时分辨率</div>
      <div className="form-row">
        <div className="form-group third">
          <label className="form-label">宽度</label>
          <input
            type="number"
            className="input form-input"
            value={header.lastSaveScreenWidth || 1080}
            onChange={(e) => updateHeader({ lastSaveScreenWidth: parseInt(e.target.value) || 1080 })}
          />
        </div>
        <div className="form-group third">
          <label className="form-label">高度</label>
          <input
            type="number"
            className="input form-input"
            value={header.lastSaveScreenHeight || 2340}
            onChange={(e) => updateHeader({ lastSaveScreenHeight: parseInt(e.target.value) || 2340 })}
          />
        </div>
        <div className="form-group third">
          <label className="form-label">DPI</label>
          <input
            type="number"
            className="input form-input"
            value={header.lastSaveScreenDpi || 3}
            onChange={(e) => updateHeader({ lastSaveScreenDpi: parseInt(e.target.value) || 3 })}
            step="0.5"
          />
        </div>
      </div>

      <div className="preset-buttons">
        <span className="preset-label">快速设置:</span>
        <button className="btn btn-sm btn-secondary" onClick={() => updateHeader({ screenWidth: 1080, screenHeight: 2340, screenDpi: 3 })}>
          1080x2340 (主流)
        </button>
        <button className="btn btn-sm btn-secondary" onClick={() => updateHeader({ screenWidth: 1080, screenHeight: 1920, screenDpi: 3 })}>
          1080x1920 (16:9)
        </button>
        <button className="btn btn-sm btn-secondary" onClick={() => updateHeader({ screenWidth: 720, screenHeight: 1280, screenDpi: 2 })}>
          720x1280 (低配)
        </button>
        <button className="btn btn-sm btn-secondary" onClick={() => updateHeader({ screenWidth: 0, screenHeight: 0, screenDpi: 0 })}>
          通用分辨率
        </button>
      </div>
    </div>
  )

  const renderVersionTab = () => (
    <div className="header-editor-section">
      <div className="section-info">
        <FiInfo />
        <span>版本信息用于控制脚本兼容性，过低版本可能无法运行脚本</span>
      </div>

      <div className="form-section-title">最低版本要求</div>
      <div className="form-row">
        <div className="form-group half">
          <label className="form-label">版本名称</label>
          <input
            type="text"
            className="input form-input"
            value={header.minVerName || '2.15.0'}
            onChange={(e) => updateHeader({ minVerName: e.target.value })}
            placeholder="例如: 2.15.0"
          />
        </div>
        <div className="form-group half">
          <label className="form-label">版本代号</label>
          <input
            type="number"
            className="input form-input"
            value={header.minVerCode || 2015000}
            onChange={(e) => updateHeader({ minVerCode: parseInt(e.target.value) || 2015000 })}
          />
          <span className="form-hint">2.15.0 = 2015000</span>
        </div>
      </div>

      <div className="form-section-title">保存时版本</div>
      <div className="form-row">
        <div className="form-group half">
          <label className="form-label">版本名称</label>
          <input
            type="text"
            className="input form-input"
            value={header.savedVerName || '2.28.2'}
            onChange={(e) => updateHeader({ savedVerName: e.target.value })}
            placeholder="例如: 2.28.2"
          />
        </div>
        <div className="form-group half">
          <label className="form-label">版本代号</label>
          <input
            type="number"
            className="input form-input"
            value={header.savedVerCode || 2028020}
            onChange={(e) => updateHeader({ savedVerCode: parseInt(e.target.value) || 2028020 })}
          />
        </div>
      </div>

      <div className="preset-buttons">
        <span className="preset-label">快速设置最低版本:</span>
        <button className="btn btn-sm btn-secondary" onClick={() => updateHeader({ minVerName: '2.15.0', minVerCode: 2015000 })}>
          2.15.0
        </button>
        <button className="btn btn-sm btn-secondary" onClick={() => updateHeader({ minVerName: '2.20.0', minVerCode: 2020000 })}>
          2.20.0
        </button>
        <button className="btn btn-sm btn-secondary" onClick={() => updateHeader({ minVerName: '2.28.0', minVerCode: 2028000 })}>
          2.28.0
        </button>
      </div>
    </div>
  )

  const renderEncryptTab = () => (
    <div className="header-editor-section">
      <div className="section-info warning">
        <FiLock />
        <span>加密设置仅对通过市场发布的脚本有效，本地导出无法实现真正的加密</span>
      </div>

      <div className="form-group">
        <label className="form-label">是否加密</label>
        <select
          className="input form-input"
          value={header.encrypt ? 'true' : 'false'}
          onChange={(e) => updateHeader({ encrypt: e.target.value === 'true' })}
        >
          <option value="false">否 - 不加密</option>
          <option value="true">是 - 加密（需通过市场）</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          限制用户ID
          <span className="label-hint">(指定用户才能运行)</span>
        </label>
        <input
          type="text"
          className="input form-input"
          value={header.encryptUserId || ''}
          onChange={(e) => updateHeader({ encryptUserId: e.target.value })}
          placeholder="例如: sub_12_1g23upker"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          过期时间
          <span className="label-hint">(时间戳，过期后无法运行)</span>
        </label>
        <div className="input-with-buttons">
          <input
            type="number"
            className="input form-input"
            value={header.encryptLimitUseTime || 0}
            onChange={(e) => updateHeader({ encryptLimitUseTime: parseInt(e.target.value) || 0 })}
            placeholder="13位时间戳"
          />
          <button 
            className="btn btn-sm btn-secondary"
            onClick={() => {
              const oneYearLater = Date.now() + 365 * 24 * 60 * 60 * 1000
              updateHeader({ encryptLimitUseTime: oneYearLater })
            }}
          >
            一年后
          </button>
        </div>
      </div>
    </div>
  )

  const renderAdvancedTab = () => (
    <div className="header-editor-section">
      <div className="section-info">
        <FiCode />
        <span>高级设置包含手势变形和来源信息，通常不需要修改</span>
      </div>

      <div className="form-section-title">手势变形矩阵</div>
      <div className="form-group">
        <label className="form-label">
          Matrix值
          <span className="label-hint">(6个逗号分隔的数值)</span>
        </label>
        <input
          type="text"
          className="input form-input"
          value={header.gestureMatrix || ''}
          onChange={(e) => updateHeader({ gestureMatrix: e.target.value })}
          placeholder="例如: 1,0,0,0,1,0"
        />
        <span className="form-hint">参考CSS matrix变换，用于全局手势变形</span>
      </div>

      <div className="form-section-title">来源信息（只读展示）</div>
      {header.fromStore ? (
        <div className="source-info">
          <div className="source-badge">来自市场</div>
          <div className="source-details">
            <div className="info-row">
              <span>市场ID:</span>
              <span>{header.fromStore.id}</span>
            </div>
            <div className="info-row">
              <span>作者ID:</span>
              <span>{header.fromStore.userId}</span>
            </div>
            <div className="info-row">
              <span>下载时间:</span>
              <span>{new Date(header.fromStore.downloadTime).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : header.fromShare ? (
        <div className="source-info">
          <div className="source-badge">来自分享</div>
          <div className="source-details">
            <div className="info-row">
              <span>分享ID:</span>
              <span>{header.fromShare.id}</span>
            </div>
            <div className="info-row">
              <span>作者ID:</span>
              <span>{header.fromShare.userId}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="source-info empty">
          <span>无来源信息（本地创建的脚本）</span>
        </div>
      )}
    </div>
  )

  return (
    <div className="modal-overlay">
      <div className="modal header-editor-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            <FiSettings /> 文件头编辑器
          </h3>
          <button className="modal-close" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            <FiSettings /> 基本设置
          </button>
          <button
            className={`tab ${activeTab === 'screen' ? 'active' : ''}`}
            onClick={() => setActiveTab('screen')}
          >
            <FiMonitor /> 分辨率
          </button>
          <button
            className={`tab ${activeTab === 'version' ? 'active' : ''}`}
            onClick={() => setActiveTab('version')}
          >
            版本信息
          </button>
          <button
            className={`tab ${activeTab === 'encrypt' ? 'active' : ''}`}
            onClick={() => setActiveTab('encrypt')}
          >
            <FiLock /> 加密
          </button>
          <button
            className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            <FiCode /> 高级
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'basic' && renderBasicTab()}
          {activeTab === 'screen' && renderScreenTab()}
          {activeTab === 'version' && renderVersionTab()}
          {activeTab === 'encrypt' && renderEncryptTab()}
          {activeTab === 'advanced' && renderAdvancedTab()}
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            {hasChanges && <span className="changes-indicator">有未保存的更改</span>}
          </div>
          <div className="footer-right">
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={isSaving}
            >
              <FiRefreshCw /> 重置为默认
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              <FiSave /> {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeaderEditorModal
