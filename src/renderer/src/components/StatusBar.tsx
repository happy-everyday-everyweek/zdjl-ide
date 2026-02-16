import React from 'react'
import { useApp } from '../context/AppContext'
import { FiFolder } from 'react-icons/fi'

const StatusBar: React.FC = () => {
  const { projectPath, projectInfo, openTabs, activeTabId, settings } = useApp()
  
  const activeTab = openTabs.find(tab => tab.id === activeTabId)

  return (
    <div className="status-bar">
      <div className="status-left">
        {projectPath && (
          <span className="status-item">
            <FiFolder /> {projectInfo?.name || '项目'}
          </span>
        )}
        {activeTab && (
          <span className="status-item">
            {activeTab.isDirty ? '未保存' : '已保存'}
          </span>
        )}
      </div>
      <div className="status-right">
        <span className="status-item">
          字体: {settings.fontSize}px
        </span>
        <span className="status-item">
          主题: {settings.theme === 'vs-dark' ? '深色' : '浅色'}
        </span>
        {settings.apiKey && (
          <span className="status-item">
            AI: 已连接
          </span>
        )}
      </div>
    </div>
  )
}

export default StatusBar
