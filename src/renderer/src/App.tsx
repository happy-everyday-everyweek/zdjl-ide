import React from 'react'
import { AppProvider } from './context/AppContext'
import MainLayout from './components/MainLayout'
import ApiKeyModal from './components/modals/ApiKeyModal'
import NewProjectModal from './components/modals/NewProjectModal'
import NodeLibraryModal from './components/modals/NodeLibraryModal'
import ExportZJSModal from './components/modals/ExportZJSModal'
import HeaderEditorModal from './components/modals/HeaderEditorModal'
import { useApp } from './context/AppContext'

function AppContent() {
  const { showApiKeyModal, showNodeLibraryModal, showNewProjectModal, showExportModal, showHeaderEditorModal } = useApp()

  return (
    <>
      <MainLayout />
      {showApiKeyModal && <ApiKeyModal />}
      {showNodeLibraryModal && <NodeLibraryModal />}
      {showNewProjectModal && <NewProjectModal />}
      {showExportModal && <ExportZJSModal />}
      {showHeaderEditorModal && <HeaderEditorModal />}
    </>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
