import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { FiFolder, FiFile, FiChevronRight, FiChevronDown, FiPlus, FiRefreshCw } from 'react-icons/fi'
import { FileTreeItem } from '../types'

const Sidebar: React.FC = () => {
  const { projectPath, fileTree, openFile, refreshFileTree, setShowNewProjectModal } = useApp()
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedPaths(newExpanded)
  }

  const handleItemClick = (item: FileTreeItem) => {
    if (item.isDirectory) {
      toggleExpand(item.path)
    } else {
      openFile(item.path, item.name)
    }
  }

  const renderTreeItem = (item: FileTreeItem, depth: number = 0) => {
    const isExpanded = expandedPaths.has(item.path)
    const paddingLeft = depth * 16 + 8

    return (
      <div key={item.path}>
        <div
          className="tree-item"
          style={{ paddingLeft }}
          onClick={() => handleItemClick(item)}
        >
          {item.isDirectory && (
            <span className={`tree-chevron ${isExpanded ? 'expanded' : ''}`}>
              {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          )}
          <span className="tree-icon">
            {item.isDirectory ? <FiFolder /> : <FiFile />}
          </span>
          <span>{item.name}</span>
        </div>
        {item.isDirectory && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!projectPath) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <span>项目</span>
        </div>
        <div className="sidebar-content empty">
          <p>暂无打开的项目</p>
          <button className="btn btn-primary" onClick={() => setShowNewProjectModal(true)}>
            <FiPlus /> 新建项目
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>项目文件</span>
        <div className="sidebar-actions">
          <button className="icon-btn" onClick={refreshFileTree} title="刷新">
            <FiRefreshCw />
          </button>
        </div>
      </div>
      <div className="sidebar-content">
        {fileTree.map(item => renderTreeItem(item))}
      </div>
    </div>
  )
}

export default Sidebar
