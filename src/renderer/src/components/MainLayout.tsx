import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import Sidebar from './Sidebar'
import EditorArea from './EditorArea'
import StatusBar from './StatusBar'
import WelcomeScreen from './WelcomeScreen'
import AIPanel from './AIPanel'
import { FiChevronRight, FiMessageCircle } from 'react-icons/fi'

const MainLayout: React.FC = () => {
  const { projectPath } = useApp()
  const [showAIPanel, setShowAIPanel] = useState(true)

  return (
    <div className="main-layout">
      <div className="content-area">
        <Sidebar />
        <div className="editor-wrapper">
          {projectPath ? <EditorArea /> : <WelcomeScreen />}
        </div>
        {projectPath && showAIPanel && <AIPanel />}
        {projectPath && (
          <button
            className="ai-toggle-btn"
            onClick={() => setShowAIPanel(!showAIPanel)}
            title={showAIPanel ? '隐藏AI面板' : '显示AI面板'}
          >
            {showAIPanel ? <FiChevronRight /> : <FiMessageCircle />}
          </button>
        )}
      </div>
      <StatusBar />
    </div>
  )
}

export default MainLayout
