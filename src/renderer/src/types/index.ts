export interface NodeLibraryItem {
  id: string
  name: string
  description: string
  data: Record<string, any>
  tags?: string[]
  author?: string
  createdAt?: string
}

export interface NodeLibrary {
  id: string
  name: string
  githubUrl: string
  localPath: string
  lastUpdated: string
  items: NodeLibraryItem[]
}

export interface ProjectInfo {
  name: string
  version: string
  description: string
  author: string
  createdAt: string
  updatedAt: string
}

export interface FileTreeItem {
  name: string
  path: string
  isDirectory: boolean
  children?: FileTreeItem[]
}

export interface EditorTab {
  id: string
  name: string
  path: string
  content: string
  isDirty: boolean
  language: string
}

export interface AppSettings {
  fontSize: number
  theme: string
  autoSave: boolean
  apiKey?: string
}

export interface ZJSHeader {
  repeatCount: number
  pauseOnFail: boolean
  count: number
  minVerCode: number
  minVerName: string
  screenWidth: number
  screenHeight: number
  screenDpi: number
  lastSaveScreenWidth: number
  lastSaveScreenHeight: number
  lastSaveScreenDpi: number
  savedVerCode: number
  savedVerName: string
  delay: string
  globalCallbacks: Record<string, any>
  description: string
  encrypt?: boolean
  encryptUserId?: string
  encryptLimitUseTime?: number
  gestureMatrix?: string
  fromStore?: {
    id: string
    userId: string
    md5: string
    downloadTime: number
    images?: string[]
    videoUrl?: string
  }
  fromShare?: {
    id: string
    userId: string
    md5: string
    downloadTime: number
    images?: string[]
    videoUrl?: string
  }
}
