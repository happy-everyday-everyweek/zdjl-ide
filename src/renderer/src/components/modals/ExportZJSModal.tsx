import React, { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { FiX, FiDownload, FiSettings, FiEdit3 } from 'react-icons/fi'
import { generateZJSContent, ExportOptions, countScriptActions } from '../../services/zjsExporter'
import { ZJSHeader } from '../../types'

const ExportZJSModal: React.FC = () => {
  const { projectPath, projectInfo, openTabs, setShowExportModal, showExportModal, setShowHeaderEditorModal } = useApp()
  const [header, setHeader] = useState<Partial<ZJSHeader>>({})
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  const mainTab = openTabs.find(tab => tab.path?.includes('/main/main.js'))

  useEffect(() => {
    const loadHeader = async () => {
      if (projectPath) {
        const result = await window.electronAPI.fs.readFile(`${projectPath}/Information/header.json`)
        if (result.success && result.content) {
          try {
            setHeader(JSON.parse(result.content))
          } catch (e) {
            console.error('Failed to parse header.json')
          }
        }
      }
    }
    loadHeader()
  }, [projectPath])

  if (!showExportModal) return null

  const handleExport = async () => {
    if (!projectPath || !mainTab) {
      setError('没有可导出的内容')
      return
    }

    setIsExporting(true)
    setError('')

    try {
      let mainScript = mainTab.content
      
      const picturesDir = `${projectPath}/main/pictures`
      const pictureRegex = /@picture\(['"]([^'"]+)['"]\)|@img\(['"]([^'"]+)['"]\)/g
      const matches = [...mainScript.matchAll(pictureRegex)]
      
      const pictures = new Map<string, string>()
      for (const match of matches) {
        const pictureName = match[1] || match[2]
        const picturePath = `${picturesDir}/${pictureName}`
        const result = await window.electronAPI.fs.readImageBase64(picturePath)
        if (result.success && result.base64) {
          pictures.set(pictureName, result.base64)
        }
      }

      const listeningScripts: ExportOptions['listeningScripts'] = {}
      
      const beforeScript = openTabs.find(tab => tab.path?.includes('/listening/每个动作运行前监听.js'))
      if (beforeScript) listeningScripts.beforeEveryScript = beforeScript.content
      
      const afterScript = openTabs.find(tab => tab.path?.includes('/listening/每个动作运行结束后.js'))
      if (afterScript) listeningScripts.afterEveryScriptFinish = afterScript.content
      
      const failScript = openTabs.find(tab => tab.path?.includes('/listening/错误.js'))
      if (failScript) listeningScripts.afterEveryScriptFail = failScript.content
      
      const loopScript = openTabs.find(tab => tab.path?.includes('/listening/列表开头监听.js'))
      if (loopScript) listeningScripts.beforeEveryLoop = loopScript.content
      
      const startScript = openTabs.find(tab => tab.path?.includes('/listening/脚本开始前监听.js'))
      if (startScript) listeningScripts.beforeFirstLoop = startScript.content

      const actionCount = countScriptActions(mainScript)
      
      const exportOptions: ExportOptions = {
        projectName: projectInfo?.name || '未命名项目',
        description: header.description || projectInfo?.description || '',
        mainScript,
        header: {
          ...header,
          count: actionCount,
        },
        listeningScripts,
        pictures,
      }

      const zjsContent = generateZJSContent(exportOptions)
      
      const defaultName = `${projectInfo?.name || 'script'}.zjs`
      const savePath = await window.electronAPI.dialog.saveFile(defaultName)
      
      if (savePath) {
        await window.electronAPI.fs.writeFile(savePath, zjsContent)
        setShowExportModal(false)
      }
    } catch (err: any) {
      setError(err.message || '导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal export-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            <FiDownload /> 导出为 ZJS 文件
          </h3>
          <button className="modal-close" onClick={() => setShowExportModal(false)}>
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <div className="export-info">
            <div className="info-item">
              <span className="info-label">项目名称</span>
              <span className="info-value">{projectInfo?.name || '未命名'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">主脚本</span>
              <span className="info-value">{mainTab ? '已准备' : '未找到'}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              脚本描述
              <button 
                className="edit-header-btn" 
                style={{ marginLeft: 'auto', fontSize: '11px' }}
                onClick={() => {
                  setShowExportModal(false)
                  setShowHeaderEditorModal(true)
                }}
                title="打开完整文件头编辑器"
              >
                <FiEdit3 /> 编辑更多选项
              </button>
            </label>
            <textarea
              className="input form-input textarea"
              value={header.description || ''}
              onChange={(e) => setHeader({ ...header, description: e.target.value })}
              placeholder="输入脚本描述..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">重复次数</label>
              <input
                type="number"
                className="input form-input"
                value={header.repeatCount ?? -1}
                onChange={(e) => setHeader({ ...header, repeatCount: parseInt(e.target.value) || -1 })}
              />
              <span className="form-hint">-1表示单次，0表示无限循环</span>
            </div>
            <div className="form-group half">
              <label className="form-label">失败暂停</label>
              <select
                className="input form-input"
                value={header.pauseOnFail ? 'true' : 'false'}
                onChange={(e) => setHeader({ ...header, pauseOnFail: e.target.value === 'true' })}
              >
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">最小版本号</label>
              <input
                type="text"
                className="input form-input"
                value={header.minVerName || '2.15.0'}
                onChange={(e) => setHeader({ ...header, minVerName: e.target.value })}
              />
            </div>
            <div className="form-group half">
              <label className="form-label">版本代号</label>
              <input
                type="number"
                className="input form-input"
                value={header.minVerCode || 2015000}
                onChange={(e) => setHeader({ ...header, minVerCode: parseInt(e.target.value) || 2015000 })}
              />
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="export-tips">
            <h4><FiSettings /> 导出说明</h4>
            <ul>
              <li>图片引用 @picture('filename.png') 将自动转换为 base64</li>
              <li>监听脚本将自动合并到全局回调中</li>
              <li>导出的文件可直接在自动精灵中运行</li>
            </ul>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowExportModal(false)}
            disabled={isExporting}
          >
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting || !mainTab}
          >
            {isExporting ? '导出中...' : '导出'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportZJSModal
