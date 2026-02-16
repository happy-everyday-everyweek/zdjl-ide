import { ZJSHeader } from '../types'

export const defaultHeader: ZJSHeader = {
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
      jsCode: '',
    },
    afterEveryScriptFinish: {
      type: '运行JS代码',
      delayUnit: 1,
      jsCode: '',
    },
    afterEveryScriptFail: {
      type: '运行JS代码',
      delayUnit: 1,
      jsCode: '',
    },
    beforeEveryLoop: {
      type: '运行JS代码',
      delayUnit: 1,
      jsCode: '',
    },
    beforeFirstLoop: {
      type: '运行JS代码',
      delayUnit: 1,
      jsCode: '',
    },
  },
  description: '',
}

export interface ExportOptions {
  projectName: string
  description?: string
  mainScript: string
  header?: Partial<ZJSHeader>
  listeningScripts?: {
    beforeEveryScript?: string
    afterEveryScriptFinish?: string
    afterEveryScriptFail?: string
    beforeEveryLoop?: string
    beforeFirstLoop?: string
  }
  pictures?: Map<string, string>
}

export function generateZJSContent(options: ExportOptions): string {
  const header: ZJSHeader = {
    ...defaultHeader,
    ...options.header,
    description: options.description || options.projectName,
  }

  if (options.listeningScripts) {
    const { beforeEveryScript, afterEveryScriptFinish, afterEveryScriptFail, beforeEveryLoop, beforeFirstLoop } = options.listeningScripts
    
    if (beforeEveryScript) {
      header.globalCallbacks.beforeEveryScript.jsCode = beforeEveryScript
    }
    if (afterEveryScriptFinish) {
      header.globalCallbacks.afterEveryScriptFinish.jsCode = afterEveryScriptFinish
    }
    if (afterEveryScriptFail) {
      header.globalCallbacks.afterEveryScriptFail.jsCode = afterEveryScriptFail
    }
    if (beforeEveryLoop) {
      header.globalCallbacks.beforeEveryLoop.jsCode = beforeEveryLoop
    }
    if (beforeFirstLoop) {
      header.globalCallbacks.beforeFirstLoop.jsCode = beforeFirstLoop
    }
  }

  let mainScript = options.mainScript

  if (options.pictures) {
    options.pictures.forEach((base64, name) => {
      const regex = new RegExp(`@picture\\(['"]${name}['"]\\)`, 'g')
      mainScript = mainScript.replace(regex, `"${base64}"`)
      
      const regex2 = new RegExp(`@img\\(['"]${name}['"]\\)`, 'g')
      mainScript = mainScript.replace(regex2, `"${base64}"`)
    })
  }

  const headerJSON = JSON.stringify(header)
  const actionJSON = JSON.stringify({
    type: '运行JS代码',
    delayUnit: 1,
    jsCode: mainScript,
  })

  return `${headerJSON}\n${actionJSON}`
}

export function parseZJSContent(content: string): { header: ZJSHeader; mainScript: string } | null {
  try {
    const lines = content.trim().split('\n')
    if (lines.length < 2) return null

    const header = JSON.parse(lines[0]) as ZJSHeader
    const action = JSON.parse(lines[1])
    
    let mainScript = ''
    if (action.type === '运行JS代码' && action.jsCode) {
      mainScript = action.jsCode
    }

    return { header, mainScript }
  } catch (error) {
    console.error('Failed to parse ZJS content:', error)
    return null
  }
}

export async function processPicturesInScript(
  script: string,
  picturesDir: string,
  readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>
): Promise<string> {
  const pictureRegex = /@picture\(['"]([^'"]+)['"]\)|@img\(['"]([^'"]+)['"]\)/g
  let result = script
  const matches = script.matchAll(pictureRegex)
  
  for (const match of matches) {
    const pictureName = match[1] || match[2]
    const picturePath = `${picturesDir}/${pictureName}`
    
    try {
      const fileResult = await readFile(picturePath)
      if (fileResult.success && fileResult.content) {
        result = result.replace(match[0], `"data:image/png;base64,${fileResult.content}"`)
      }
    } catch (error) {
      console.warn(`Failed to process picture: ${pictureName}`, error)
    }
  }
  
  return result
}

export function countScriptActions(script: string): number {
  let count = 1
  
  const patterns = [
    /zdjl\.\w+\(/g,
    /runAction\(/g,
    /check\(/g,
  ]
  
  patterns.forEach(pattern => {
    const matches = script.match(pattern)
    if (matches) {
      count += matches.length
    }
  })
  
  return count
}
