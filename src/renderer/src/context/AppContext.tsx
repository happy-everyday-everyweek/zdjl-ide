import React, { createContext, useContext, useState, useEffect } from 'react'
import { EditorTab, FileTreeItem, ProjectInfo, NodeLibrary, AppSettings } from '../types'
import { CodeError } from '../services/errorChecker'

interface AppState {
  projectPath: string | null
  projectInfo: ProjectInfo | null
  fileTree: FileTreeItem[]
  openTabs: EditorTab[]
  activeTabId: string | null
  nodeLibraries: NodeLibrary[]
  settings: AppSettings
  isLoading: boolean
  showApiKeyModal: boolean
  showNodeLibraryModal: boolean
  showNewProjectModal: boolean
  showExportModal: boolean
  showHeaderEditorModal: boolean
  showErrorPanel: boolean
  codeErrors: CodeError[]
}

interface AppContextType extends AppState {
  setProjectPath: (path: string | null) => void
  setProjectInfo: (info: ProjectInfo | null) => void
  setFileTree: (tree: FileTreeItem[]) => void
  openFile: (path: string, name: string) => Promise<void>
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabContent: (id: string, content: string) => void
  saveCurrentTab: () => Promise<void>
  saveAllTabs: () => Promise<void>
  createNewFile: (parentPath: string, name: string, isDirectory: boolean) => Promise<void>
  refreshFileTree: () => Promise<void>
  addNodeLibrary: (library: NodeLibrary) => void
  removeNodeLibrary: (id: string) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  setShowApiKeyModal: (show: boolean) => void
  setShowNodeLibraryModal: (show: boolean) => void
  setShowNewProjectModal: (show: boolean) => void
  setShowExportModal: (show: boolean) => void
  setShowHeaderEditorModal: (show: boolean) => void
  setShowErrorPanel: (show: boolean) => void
  setCodeErrors: (errors: CodeError[]) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    projectPath: null,
    projectInfo: null,
    fileTree: [],
    openTabs: [],
    activeTabId: null,
    nodeLibraries: [],
    settings: {
      fontSize: 14,
      theme: 'vs-dark',
      autoSave: true,
    },
    isLoading: false,
    showApiKeyModal: false,
    showNodeLibraryModal: false,
    showNewProjectModal: false,
    showExportModal: false,
    showHeaderEditorModal: false,
    showErrorPanel: false,
    codeErrors: [],
  })

  useEffect(() => {
    loadSettings()
    loadNodeLibraries()
    setupMenuListeners()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await window.electronAPI.store.get('settings')
      if (settings) {
        setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }))
      }
      const apiKey = await window.electronAPI.store.get('apiKey')
      if (!apiKey) {
        setState(prev => ({ ...prev, showApiKeyModal: true }))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const loadNodeLibraries = async () => {
    try {
      const libraries = await window.electronAPI.store.get('nodeLibraries')
      if (libraries && Array.isArray(libraries)) {
        setState(prev => ({ ...prev, nodeLibraries: libraries }))
      }
    } catch (error) {
      console.error('Failed to load node libraries:', error)
    }
  }

  const setupMenuListeners = () => {
    window.electronAPI.on('menu:new-project', () => {
      setState(prev => ({ ...prev, showNewProjectModal: true }))
    })
    window.electronAPI.on('menu:open-project', async () => {
      const path = await window.electronAPI.dialog.openDirectory()
      if (path) {
        await openProject(path)
      }
    })
    window.electronAPI.on('menu:save', async () => {
      await saveCurrentTab()
    })
    window.electronAPI.on('menu:save-as', async () => {
      await saveCurrentTab()
    })
    window.electronAPI.on('menu:export-zjs', () => {
      setState(prev => ({ ...prev, showExportModal: true }))
    })
    window.electronAPI.on('menu:header-editor', () => {
      setState(prev => ({ ...prev, showHeaderEditorModal: true }))
    })
    window.electronAPI.on('menu:import-node-lib', () => {
      setState(prev => ({ ...prev, showNodeLibraryModal: true }))
    })
    window.electronAPI.on('menu:manage-node-libs', () => {
      setState(prev => ({ ...prev, showNodeLibraryModal: true }))
    })
    window.electronAPI.on('menu:settings', () => {
      setState(prev => ({ ...prev, showApiKeyModal: true }))
    })
  }

  const openProject = async (path: string) => {
    setState(prev => ({ ...prev, isLoading: true, projectPath: path }))
    try {
      const projectInfoPath = `${path}/Information/project.json`
      const exists = await window.electronAPI.fs.exists(projectInfoPath)
      if (exists) {
        const result = await window.electronAPI.fs.readFile(projectInfoPath)
        if (result.success && result.content) {
          const info = JSON.parse(result.content)
          setState(prev => ({ ...prev, projectInfo: info }))
        }
      }
      await refreshFileTree()
      const recentProjects = await window.electronAPI.store.get('recentProjects') || []
      const updatedRecent = [path, ...recentProjects.filter((p: string) => p !== path)].slice(0, 10)
      await window.electronAPI.store.set('recentProjects', updatedRecent)
    } catch (error) {
      console.error('Failed to open project:', error)
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const setProjectPath = (path: string | null) => {
    if (path) {
      openProject(path)
    } else {
      setState(prev => ({ ...prev, projectPath: path, projectInfo: null, fileTree: [] }))
    }
  }

  const setProjectInfo = (info: ProjectInfo | null) => {
    setState(prev => ({ ...prev, projectInfo: info }))
  }

  const setFileTree = (tree: FileTreeItem[]) => {
    setState(prev => ({ ...prev, fileTree: tree }))
  }

  const buildFileTree = async (dirPath: string): Promise<FileTreeItem[]> => {
    const result = await window.electronAPI.fs.readDir(dirPath)
    if (!result.success || !result.files) return []
    
    const items: FileTreeItem[] = []
    for (const file of result.files) {
      const item: FileTreeItem = {
        name: file.name,
        path: file.path,
        isDirectory: file.isDirectory,
      }
      if (file.isDirectory && !file.name.startsWith('.') && file.name !== 'node_modules') {
        item.children = await buildFileTree(file.path)
      }
      items.push(item)
    }
    return items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })
  }

  const refreshFileTree = async () => {
    if (!state.projectPath) return
    const tree = await buildFileTree(state.projectPath)
    setFileTree(tree)
  }

  const openFile = async (path: string, name: string) => {
    const existingTab = state.openTabs.find(tab => tab.path === path)
    if (existingTab) {
      setState(prev => ({ ...prev, activeTabId: existingTab.id }))
      return
    }
    const result = await window.electronAPI.fs.readFile(path)
    if (result.success && result.content !== undefined) {
      const ext = name.split('.').pop()?.toLowerCase()
      let language = 'javascript'
      if (ext === 'ts') language = 'typescript'
      else if (ext === 'json') language = 'json'
      else if (ext === 'html') language = 'html'
      else if (ext === 'css') language = 'css'
      
      const newTab: EditorTab = {
        id: Date.now().toString(),
        name,
        path,
        content: result.content,
        isDirty: false,
        language,
      }
      setState(prev => ({
        ...prev,
        openTabs: [...prev.openTabs, newTab],
        activeTabId: newTab.id,
      }))
    }
  }

  const closeTab = (id: string) => {
    setState(prev => {
      const newTabs = prev.openTabs.filter(tab => tab.id !== id)
      let newActiveId = prev.activeTabId
      if (prev.activeTabId === id) {
        const index = prev.openTabs.findIndex(tab => tab.id === id)
        if (newTabs.length > 0) {
          newActiveId = newTabs[Math.min(index, newTabs.length - 1)].id
        } else {
          newActiveId = null
        }
      }
      return { ...prev, openTabs: newTabs, activeTabId: newActiveId }
    })
  }

  const setActiveTab = (id: string) => {
    setState(prev => ({ ...prev, activeTabId: id }))
  }

  const updateTabContent = (id: string, content: string) => {
    setState(prev => ({
      ...prev,
      openTabs: prev.openTabs.map(tab =>
        tab.id === id ? { ...tab, content, isDirty: true } : tab
      ),
    }))
  }

  const saveCurrentTab = async () => {
    const activeTab = state.openTabs.find(tab => tab.id === state.activeTabId)
    if (!activeTab || !activeTab.isDirty) return
    await window.electronAPI.fs.writeFile(activeTab.path, activeTab.content)
    setState(prev => ({
      ...prev,
      openTabs: prev.openTabs.map(tab =>
        tab.id === activeTab.id ? { ...tab, isDirty: false } : tab
      ),
    }))
  }

  const saveAllTabs = async () => {
    for (const tab of state.openTabs.filter(t => t.isDirty)) {
      await window.electronAPI.fs.writeFile(tab.path, tab.content)
    }
    setState(prev => ({
      ...prev,
      openTabs: prev.openTabs.map(tab => ({ ...tab, isDirty: false })),
    }))
  }

  const createNewFile = async (parentPath: string, name: string, isDirectory: boolean) => {
    const fullPath = `${parentPath}/${name}`
    if (isDirectory) {
      await window.electronAPI.fs.mkdir(fullPath)
    } else {
      await window.electronAPI.fs.writeFile(fullPath, '')
    }
    await refreshFileTree()
    if (!isDirectory) {
      await openFile(fullPath, name)
    }
  }

  const addNodeLibrary = async (library: NodeLibrary) => {
    const newLibraries = [...state.nodeLibraries.filter(l => l.id !== library.id), library]
    setState(prev => ({ ...prev, nodeLibraries: newLibraries }))
    await window.electronAPI.store.set('nodeLibraries', newLibraries)
  }

  const removeNodeLibrary = async (id: string) => {
    const newLibraries = state.nodeLibraries.filter(l => l.id !== id)
    setState(prev => ({ ...prev, nodeLibraries: newLibraries }))
    await window.electronAPI.store.set('nodeLibraries', newLibraries)
  }

  const updateSettings = async (settings: Partial<AppSettings>) => {
    const newSettings = { ...state.settings, ...settings }
    setState(prev => ({ ...prev, settings: newSettings }))
    await window.electronAPI.store.set('settings', newSettings)
  }

  const setShowApiKeyModal = (show: boolean) => {
    setState(prev => ({ ...prev, showApiKeyModal: show }))
  }

  const setShowNodeLibraryModal = (show: boolean) => {
    setState(prev => ({ ...prev, showNodeLibraryModal: show }))
  }

  const setShowNewProjectModal = (show: boolean) => {
    setState(prev => ({ ...prev, showNewProjectModal: show }))
  }

  const setShowExportModal = (show: boolean) => {
    setState(prev => ({ ...prev, showExportModal: show }))
  }

  const setShowHeaderEditorModal = (show: boolean) => {
    setState(prev => ({ ...prev, showHeaderEditorModal: show }))
  }

  const setShowErrorPanel = (show: boolean) => {
    setState(prev => ({ ...prev, showErrorPanel: show }))
  }

  const setCodeErrors = (errors: CodeError[]) => {
    setState(prev => ({ ...prev, codeErrors: errors }))
  }

  const value: AppContextType = {
    ...state,
    setProjectPath,
    setProjectInfo,
    setFileTree,
    openFile,
    closeTab,
    setActiveTab,
    updateTabContent,
    saveCurrentTab,
    saveAllTabs,
    createNewFile,
    refreshFileTree,
    addNodeLibrary,
    removeNodeLibrary,
    updateSettings,
    setShowApiKeyModal,
    setShowNodeLibraryModal,
    setShowNewProjectModal,
    setShowExportModal,
    setShowHeaderEditorModal,
    setShowErrorPanel,
    setCodeErrors,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
