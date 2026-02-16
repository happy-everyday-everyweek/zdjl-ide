import React from 'react'
import { useApp } from '../context/AppContext'
import { FiFolderPlus, FiFolder, FiSettings } from 'react-icons/fi'

const WelcomeScreen: React.FC = () => {
  const { setShowNewProjectModal, setProjectPath, setShowApiKeyModal } = useApp()

  const handleOpenProject = async () => {
    if (!window.electronAPI) return
    const path = await window.electronAPI.dialog.openDirectory()
    if (path) {
      setProjectPath(path)
    }
  }

  const handleOpenSettings = () => {
    setShowApiKeyModal(true)
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <h1>自动精灵 IDE</h1>
        <p className="welcome-subtitle">智能脚本开发环境</p>
        
        <div className="welcome-actions">
          <button
            className="welcome-action-btn"
            onClick={() => setShowNewProjectModal(true)}
          >
            <FiFolderPlus />
            <span>新建项目</span>
          </button>
          <button
            className="welcome-action-btn"
            onClick={handleOpenProject}
          >
            <FiFolder />
            <span>打开项目</span>
          </button>
        </div>

        <div className="welcome-features">
          <h3>功能特性</h3>
          <ul>
            <li>智能代码提示 - 自动精灵API自动补全</li>
            <li>节点库管理 - 从GitHub导入和管理节点库</li>
            <li>图片自动编码 - 自动将图片转换为base64</li>
            <li>AI辅助编写 - 集成DeepSeek AI助手</li>
            <li>ZJS打包 - 一键导出为ZJS格式</li>
          </ul>
        </div>

        <div className="welcome-links">
          <button
            className="welcome-link"
            onClick={handleOpenSettings}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <FiSettings /> 设置
          </button>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen
