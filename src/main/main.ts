import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import * as path from 'path'
import Store from 'electron-store'
import * as fs from 'fs'

interface StoreSchema {
  apiKey: string
  recentProjects: string[]
  nodeLibraries: NodeLibrary[]
  settings: {
    fontSize: number
    theme: string
    autoSave: boolean
  }
}

interface NodeLibrary {
  id: string
  name: string
  githubUrl: string
  localPath: string
  lastUpdated: string
}

const store = new Store<StoreSchema>({
  defaults: {
    apiKey: '',
    recentProjects: [],
    nodeLibraries: [],
    settings: {
      fontSize: 14,
      theme: 'vs-dark',
      autoSave: true,
    },
  },
})

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? true : false,
    icon: path.join(__dirname, '../../resources/icon.ico'),
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  createMenu()
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建项目',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new-project'),
        },
        {
          label: '打开项目',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:open-project'),
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save'),
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu:save-as'),
        },
        { type: 'separator' },
        {
          label: '导出为ZJS',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('menu:export-zjs'),
        },
        {
          label: '编辑文件头',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => mainWindow?.webContents.send('menu:header-editor'),
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
      ],
    },
    {
      label: '节点库',
      submenu: [
        {
          label: '导入节点库',
          click: () => mainWindow?.webContents.send('menu:import-node-lib'),
        },
        {
          label: '管理节点库',
          click: () => mainWindow?.webContents.send('menu:manage-node-libs'),
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '设置API密钥',
          click: () => mainWindow?.webContents.send('menu:settings'),
        },
        { type: 'separator' },
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于自动精灵IDE',
              message: '自动精灵IDE v1.0.0',
              detail: '一个专为自动精灵脚本开发设计的集成开发环境\n支持AI辅助编写、节点库管理、图片自动编码、ZJS打包',
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('store:get', (_, key: keyof StoreSchema) => {
  return store.get(key)
})

ipcMain.handle('store:set', (_, key: keyof StoreSchema, value: any) => {
  store.set(key, value)
  return true
})

ipcMain.handle('store:get-settings', () => {
  return store.store
})

ipcMain.handle('dialog:open-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })
  return result.filePaths[0] || null
})

ipcMain.handle('dialog:open-file', async (_, filters: any[]) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
  })
  return result.filePaths[0] || null
})

ipcMain.handle('dialog:save-file', async (_, defaultPath: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath,
    filters: [{ name: 'ZJS Files', extensions: ['zjs'] }],
  })
  return result.filePath || null
})

ipcMain.handle('fs:read-file', async (_, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return { success: true, content }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:write-file', async (_, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:read-dir', async (_, dirPath: string) => {
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true })
    return {
      success: true,
      files: files.map(f => ({
        name: f.name,
        isDirectory: f.isDirectory(),
        path: path.join(dirPath, f.name),
      })),
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:exists', async (_, filePath: string) => {
  return fs.existsSync(filePath)
})

ipcMain.handle('fs:mkdir', async (_, dirPath: string) => {
  try {
    fs.mkdirSync(dirPath, { recursive: true })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:read-image-base64', async (_, imagePath: string) => {
  try {
    const buffer = fs.readFileSync(imagePath)
    const base64 = buffer.toString('base64')
    const ext = path.extname(imagePath).toLowerCase()
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg'
    return { success: true, base64: `data:${mimeType};base64,${base64}` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('project:create', async (_, projectPath: string, projectName: string) => {
  try {
    const dirs = [
      projectPath,
      path.join(projectPath, 'main'),
      path.join(projectPath, 'main/pictures'),
      path.join(projectPath, 'listening'),
      path.join(projectPath, 'Information'),
    ]
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })

    const mainJs = `// ${projectName} 主脚本
// 自动精灵IDE生成

zdjl.toast("脚本开始运行");

// 在这里编写你的脚本逻辑

`

    fs.writeFileSync(path.join(projectPath, 'main', 'main.js'), mainJs)

    const projectInfo = {
      name: projectName,
      version: '1.0.0',
      description: '',
      author: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    fs.writeFileSync(
      path.join(projectPath, 'Information', 'project.json'),
      JSON.stringify(projectInfo, null, 2)
    )

    const headerInfo = {
      repeatCount: -1,
      pauseOnFail: true,
      count: 1,
      minVerCode: 2015000,
      minVerName: '2.15.0',
      screenWidth: 0,
      screenHeight: 0,
      screenDpi: 0,
      lastSaveScreenWidth: 1080,
      lastSaveScreenHeight: 2340,
      lastSaveScreenDpi: 3,
      savedVerCode: 2028020,
      savedVerName: '2.28.2',
      delay: '',
      globalCallbacks: {
        beforeEveryScript: {
          type: '运行JS代码',
          delayUnit: 1,
          jsCode: '//这个替换成项目目录/listening/每个动作运行前监听.js中的代码',
        },
        afterEveryScriptFinish: {
          type: '运行JS代码',
          delayUnit: 1,
          jsCode: '//这个替换成项目目录/listening/每个动作运行结束后.js中的代码',
        },
        afterEveryScriptFail: {
          type: '运行JS代码',
          delayUnit: 1,
          jsCode: '//这个替换成项目目录/listening/错误.js中的代码',
        },
        beforeEveryLoop: {
          type: '运行JS代码',
          delayUnit: 1,
          jsCode: '//这个替换成项目目录/listening/列表开头监听.js中的代码',
        },
        beforeFirstLoop: {
          type: '运行JS代码',
          delayUnit: 1,
          jsCode: '//这个替换成项目目录/listening/脚本开始前监听.js中的代码',
        },
      },
      description: `${projectName} - 自动精灵脚本`,
    }

    fs.writeFileSync(
      path.join(projectPath, 'Information', 'header.json'),
      JSON.stringify(headerInfo, null, 2)
    )

    return { success: true, projectPath }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})
