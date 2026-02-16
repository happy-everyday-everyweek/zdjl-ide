import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
    getSettings: () => ipcRenderer.invoke('store:get-settings'),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
    openFile: (filters?: any[]) => ipcRenderer.invoke('dialog:open-file', filters),
    saveFile: (defaultPath: string) => ipcRenderer.invoke('dialog:save-file', defaultPath),
  },
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:write-file', filePath, content),
    readDir: (dirPath: string) => ipcRenderer.invoke('fs:read-dir', dirPath),
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
    mkdir: (dirPath: string) => ipcRenderer.invoke('fs:mkdir', dirPath),
    readImageBase64: (imagePath: string) => ipcRenderer.invoke('fs:read-image-base64', imagePath),
  },
  project: {
    create: (projectPath: string, projectName: string) => 
      ipcRenderer.invoke('project:create', projectPath, projectName),
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback)
  },
})
