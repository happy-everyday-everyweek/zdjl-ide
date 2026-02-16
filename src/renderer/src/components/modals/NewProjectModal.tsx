import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { FiX, FiFolder } from 'react-icons/fi'

const NewProjectModal: React.FC = () => {
  const { setShowNewProjectModal, setProjectPath } = useApp()
  const [projectName, setProjectName] = useState('')
  const [projectPath, setProjectPathLocal] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleBrowse = async () => {
    if (!window.electronAPI) return
    const path = await window.electronAPI.dialog.openDirectory()
    if (path) {
      setProjectPathLocal(path)
    }
  }

  const handleCreate = async () => {
    if (!projectName.trim()) {
      setError('请输入项目名称')
      return
    }
    if (!projectPath.trim()) {
      setError('请选择项目位置')
      return
    }
    if (!window.electronAPI) {
      setError('Electron API 不可用')
      return
    }

    setIsCreating(true)
    setError('')

    const fullPath = `${projectPath}/${projectName}`
    const result = await window.electronAPI.project.create(fullPath, projectName)

    if (result.success) {
      setProjectPath(result.projectPath || fullPath)
      setShowNewProjectModal(false)
    } else {
      setError(result.error || '创建项目失败')
    }

    setIsCreating(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">新建项目</h3>
          <button className="modal-close" onClick={() => setShowNewProjectModal(false)}>
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">项目名称 *</label>
            <input
              type="text"
              className="input form-input"
              placeholder="我的自动精灵脚本"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value)
                setError('')
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">项目位置 *</label>
            <div className="input-with-button">
              <input
                type="text"
                className="input form-input"
                placeholder="选择项目保存位置"
                value={projectPath}
                onChange={(e) => {
                  setProjectPathLocal(e.target.value)
                  setError('')
                }}
              />
              <button className="btn btn-secondary" onClick={handleBrowse}>
                <FiFolder /> 浏览
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">项目描述</label>
            <textarea
              className="input form-input textarea"
              placeholder="项目描述（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-hint">
            项目将创建以下目录结构：
            <ul>
              <li>main/ - 主脚本目录</li>
              <li>main/pictures/ - 图片资源目录</li>
              <li>listening/ - 监听脚本目录</li>
              <li>Information/ - 项目信息目录</li>
            </ul>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowNewProjectModal(false)}
            disabled={isCreating}
          >
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? '创建中...' : '创建项目'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewProjectModal
