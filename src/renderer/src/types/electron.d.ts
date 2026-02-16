export interface ElectronAPI {
  store: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<boolean>
    getSettings: () => Promise<Record<string, any>>
  }
  dialog: {
    openDirectory: () => Promise<string | null>
    openFile: (filters?: any[]) => Promise<string | null>
    saveFile: (defaultPath: string) => Promise<string | null>
  }
  fs: {
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
    readDir: (dirPath: string) => Promise<{ success: boolean; files?: any[]; error?: string }>
    exists: (filePath: string) => Promise<boolean>
    mkdir: (dirPath: string) => Promise<{ success: boolean; error?: string }>
    readImageBase64: (imagePath: string) => Promise<{ success: boolean; base64?: string; error?: string }>
  }
  project: {
    create: (projectPath: string, projectName: string) => Promise<{ success: boolean; projectPath?: string; error?: string }>
  }
  on: (channel: string, callback: (...args: any[]) => void) => void
  removeListener: (channel: string, callback: (...args: any[]) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
