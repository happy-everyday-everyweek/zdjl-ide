import { zdjlAPIHints, APIHint } from '../data/apiHints'

export interface CompletionContext {
  textBeforeCursor: string
  textAfterCursor: string
  currentLine: string
  lineNumber: number
  column: number
  fileContent: string
}

export interface AICompletionResult {
  text: string
  displayText: string
  documentation?: string
  kind: 'function' | 'property' | 'snippet' | 'text'
  isAI: boolean
  sortText?: string
}

const CONTEXT_PATTERNS = {
  zdjlMethod: /zdjl\.(\w*)$/,
  coordinate: /\b(\d+)\s*,\s*(\d+)\b/,
  color: /["']?(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|\d{7,})["']?/,
  percentage: /["'](\d+%)["']/,
  functionCall: /(\w+)\s*\([^)]*$/,
  variable: /\b(\w+)\s*$/,
  comment: /\/\/\s*(.*)$/,
  stringLiteral: /["']([^"']*)$/,
}

export function analyzeContext(context: CompletionContext): {
  type: string
  matched: RegExpMatchArray | null
  suggestions: AICompletionResult[]
} {
  const { textBeforeCursor, currentLine } = context

  const zdjlMatch = textBeforeCursor.match(CONTEXT_PATTERNS.zdjlMethod)
  if (zdjlMatch) {
    return {
      type: 'zdjl_method',
      matched: zdjlMatch,
      suggestions: getZdjlMethodSuggestions(zdjlMatch[1]),
    }
  }

  const functionCallMatch = textBeforeCursor.match(CONTEXT_PATTERNS.functionCall)
  if (functionCallMatch) {
    const funcName = functionCallMatch[1]
    if (funcName.startsWith('zdjl.') || funcName === 'zdjl') {
      return {
        type: 'function_args',
        matched: functionCallMatch,
        suggestions: getFunctionArgSuggestions(funcName, textBeforeCursor),
      }
    }
  }

  const commentMatch = textBeforeCursor.match(CONTEXT_PATTERNS.comment)
  if (commentMatch) {
    return {
      type: 'comment',
      matched: commentMatch,
      suggestions: getCommentSuggestions(commentMatch[1]),
    }
  }

  return {
    type: 'general',
    matched: null,
    suggestions: [],
  }
}

function getZdjlMethodSuggestions(partial: string): AICompletionResult[] {
  const hints = zdjlAPIHints.filter(hint =>
    hint.name.toLowerCase().startsWith(partial.toLowerCase())
  )

  return hints.map(hint => ({
    text: hint.signature || hint.name,
    displayText: hint.name,
    documentation: `${hint.description}\n\n${hint.example || ''}`,
    kind: hint.kind === 'function' ? 'function' : 'property',
    isAI: false,
    sortText: hint.name,
  }))
}

function getFunctionArgSuggestions(funcName: string, textBeforeCursor: string): AICompletionResult[] {
  const methodName = funcName.replace('zdjl.', '')
  const hint = zdjlAPIHints.find(h => h.name === methodName)

  if (!hint || !hint.parameters) return []

  const openParens = (textBeforeCursor.match(/\(/g) || []).length
  const closeParens = (textBeforeCursor.match(/\)/g) || []).length
  const argDepth = openParens - closeParens

  if (argDepth === 0) return []

  const argsText = textBeforeCursor.slice(textBeforeCursor.lastIndexOf('(') + 1)
  const currentArgs = parseCurrentArgs(argsText)

  const suggestions: AICompletionResult[] = []

  if (currentArgs.length < hint.parameters.length) {
    const nextParam = hint.parameters[currentArgs.length]
    suggestions.push({
      text: nextParam.name,
      displayText: nextParam.name,
      documentation: `${nextParam.description}\n类型: ${nextParam.type}${nextParam.optional ? ' (可选)' : ''}`,
      kind: 'property',
      isAI: false,
      sortText: `0_${nextParam.name}`,
    })
  }

  if (methodName === 'click' || methodName === 'clickAsync' || methodName === 'longClick') {
    suggestions.push(...getCoordinateSuggestions())
  }

  if (methodName === 'getScreenColor' || methodName === 'getScreenColorAsync') {
    suggestions.push(...getCoordinateSuggestions())
  }

  if (methodName === 'swipe' || methodName === 'swipeAsync') {
    suggestions.push(...getSwipeCoordinateSuggestions())
  }

  return suggestions
}

function parseCurrentArgs(argsText: string): string[] {
  const args: string[] = []
  let current = ''
  let depth = 0
  let inString = false
  let stringChar = ''

  for (const char of argsText) {
    if ((char === '"' || char === "'") && !inString) {
      inString = true
      stringChar = char
    } else if (char === stringChar && inString) {
      inString = false
    } else if (char === '(' && !inString) {
      depth++
    } else if (char === ')' && !inString) {
      depth--
    } else if (char === ',' && depth === 0 && !inString) {
      args.push(current.trim())
      current = ''
      continue
    }
    current += char
  }

  if (current.trim()) {
    args.push(current.trim())
  }

  return args
}

function getCoordinateSuggestions(): AICompletionResult[] {
  return [
    {
      text: 'x, y',
      displayText: '坐标 (x, y)',
      documentation: '点击坐标，例如: 500, 800',
      kind: 'snippet',
      isAI: true,
      sortText: '1_coord',
    },
    {
      text: '"50%", "30%"',
      displayText: '百分比坐标',
      documentation: '使用百分比的坐标，例如: "50%", "30%"',
      kind: 'snippet',
      isAI: true,
      sortText: '1_percent',
    },
  ]
}

function getSwipeCoordinateSuggestions(): AICompletionResult[] {
  return [
    {
      text: 'x1, y1, x2, y2, duration',
      displayText: '滑动坐标',
      documentation: '从(x1,y1)滑动到(x2,y2)，duration为滑动时间',
      kind: 'snippet',
      isAI: true,
      sortText: '1_swipe',
    },
    {
      text: '500, 1500, 500, 500, 500',
      displayText: '向上滑动示例',
      documentation: '从下往上滑动',
      kind: 'snippet',
      isAI: true,
      sortText: '2_swipe_up',
    },
  ]
}

function getCommentSuggestions(commentContent: string): AICompletionResult[] {
  const suggestions: AICompletionResult[] = []
  const lowerContent = commentContent.toLowerCase()

  if (lowerContent.includes('等待') || lowerContent.includes('wait')) {
    suggestions.push({
      text: 'await zdjl.sleep(1000);',
      displayText: '等待1秒',
      documentation: '等待指定时间',
      kind: 'snippet',
      isAI: true,
      sortText: '0_wait',
    })
  }

  if (lowerContent.includes('点击') || lowerContent.includes('click')) {
    suggestions.push({
      text: 'zdjl.click(x, y);',
      displayText: '点击坐标',
      documentation: '点击指定坐标',
      kind: 'snippet',
      isAI: true,
      sortText: '0_click',
    })
  }

  if (lowerContent.includes('滑动') || lowerContent.includes('swipe')) {
    suggestions.push({
      text: 'zdjl.swipe(x1, y1, x2, y2, duration);',
      displayText: '滑动',
      documentation: '从一点滑动到另一点',
      kind: 'snippet',
      isAI: true,
      sortText: '0_swipe',
    })
  }

  if (lowerContent.includes('判断') || lowerContent.includes('if') || lowerContent.includes('检查')) {
    suggestions.push({
      text: 'if (condition) {\n  \n}',
      displayText: '条件判断',
      documentation: '条件判断语句',
      kind: 'snippet',
      isAI: true,
      sortText: '0_if',
    })
  }

  if (lowerContent.includes('循环') || lowerContent.includes('loop') || lowerContent.includes('重复')) {
    suggestions.push({
      text: 'for (let i = 0; i < count; i++) {\n  \n}',
      displayText: '循环',
      documentation: '循环执行',
      kind: 'snippet',
      isAI: true,
      sortText: '0_loop',
    })
  }

  return suggestions
}

export async function getAICompletion(
  context: CompletionContext,
  apiKey: string
): Promise<AICompletionResult[]> {
  const { textBeforeCursor, currentLine, fileContent } = context

  const analysis = analyzeContext(context)
  if (analysis.suggestions.length > 0) {
    return analysis.suggestions
  }

  if (!apiKey) {
    return []
  }

  try {
    const prompt = buildAIPrompt(context)
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-coder',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 256,
      }),
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const completion = data.choices?.[0]?.message?.content || ''

    return parseAICompletion(completion)
  } catch (error) {
    console.error('AI completion error:', error)
    return []
  }
}

function getSystemPrompt(): string {
  return `你是自动精灵脚本代码补全助手。根据用户输入的代码上下文，提供智能的代码补全建议。

自动精灵主要API:
- zdjl.toast(message) - 显示提示
- zdjl.click(x, y) - 点击坐标
- zdjl.swipe(x1, y1, x2, y2, duration) - 滑动
- zdjl.findLocation(posData, findAll) - 查找坐标
- zdjl.findNode(posData) - 查找节点
- zdjl.getScreenColor(x, y) - 获取屏幕颜色
- zdjl.recognitionScreen(config) - 屏幕OCR识别
- zdjl.getVar(name) / zdjl.setVar(name, value) - 变量操作
- zdjl.sleep(ms) - 等待

规则:
1. 只返回补全内容，不要解释
2. 每行一个建议，格式: 代码|显示文本|文档说明
3. 最多提供5个建议
4. 代码要简洁实用`
}

function buildAIPrompt(context: CompletionContext): string {
  const { textBeforeCursor, currentLine, fileContent } = context

  const lines = fileContent.split('\n')
  const startLine = Math.max(0, context.lineNumber - 20)
  const endLine = Math.min(lines.length, context.lineNumber + 5)
  const contextCode = lines.slice(startLine, endLine).join('\n')

  return `当前代码上下文:
\`\`\`javascript
${contextCode}
\`\`\`

当前行: ${currentLine}
光标前内容: ${textBeforeCursor.slice(-50)}

请提供代码补全建议:`
}

function parseAICompletion(completion: string): AICompletionResult[] {
  const results: AICompletionResult[] = []
  const lines = completion.split('\n').filter(line => line.trim())

  for (const line of lines.slice(0, 5)) {
    const parts = line.split('|')
    if (parts.length >= 1) {
      results.push({
        text: parts[0].trim(),
        displayText: parts[1]?.trim() || parts[0].trim(),
        documentation: parts[2]?.trim() || '',
        kind: 'snippet',
        isAI: true,
        sortText: `9_${results.length}`,
      })
    }
  }

  return results
}

export function extractCoordinates(text: string): Array<{ x: string; y: string; startIndex: number; endIndex: number }> {
  const results: Array<{ x: string; y: string; startIndex: number; endIndex: number }> = []
  const regex = /["']?(\d+(?:\.\d+)?%?)["']?\s*,\s*["']?(\d+(?:\.\d+)?%?)["']?/g
  let match

  while ((match = regex.exec(text)) !== null) {
    results.push({
      x: match[1],
      y: match[2],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return results
}

export function extractColors(text: string): Array<{ color: string; startIndex: number; endIndex: number }> {
  const results: Array<{ color: string; startIndex: number; endIndex: number }> = []
  
  const hexRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g
  let match
  while ((match = hexRegex.exec(text)) !== null) {
    results.push({
      color: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  const decRegex = /\b(\d{7,})\b/g
  while ((match = decRegex.exec(text)) !== null) {
    const num = parseInt(match[1])
    if (num >= 0 && num <= 16777215) {
      results.push({
        color: `#${num.toString(16).padStart(6, '0')}`,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
  }

  return results
}

export function parseColor(color: string): { r: number; g: number; b: number } | null {
  let hex = color.replace('#', '')
  
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }
  
  if (hex.length !== 6) {
    return null
  }

  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null
  }

  return { r, g, b }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function getSmartSnippets(context: CompletionContext): AICompletionResult[] {
  const { textBeforeCursor, currentLine } = context
  const snippets: AICompletionResult[] = []

  if (textBeforeCursor.trim() === '' || textBeforeCursor.endsWith('\n')) {
    snippets.push(
      {
        text: 'zdjl.click(x, y);',
        displayText: '点击坐标',
        documentation: '点击指定坐标位置',
        kind: 'snippet',
        isAI: false,
        sortText: '0_click',
      },
      {
        text: 'zdjl.swipe(x1, y1, x2, y2, duration);',
        displayText: '滑动',
        documentation: '从一点滑动到另一点',
        kind: 'snippet',
        isAI: false,
        sortText: '0_swipe',
      },
      {
        text: 'const loc = zdjl.findLocation({ type: "text", text: "文字内容" }, false);\nif (loc) {\n  zdjl.click(loc.x, loc.y);\n}',
        displayText: '查找并点击文字',
        documentation: '查找屏幕上的文字并点击',
        kind: 'snippet',
        isAI: false,
        sortText: '0_find_text',
      },
      {
        text: 'const node = zdjl.findNode({ text: "按钮文字" });\nif (node) {\n  zdjl.click((node.boundLeft + node.boundRight) / 2, (node.boundTop + node.boundBottom) / 2);\n}',
        displayText: '查找节点并点击',
        documentation: '通过节点查找并点击',
        kind: 'snippet',
        isAI: false,
        sortText: '0_find_node',
      },
      {
        text: 'const color = zdjl.getScreenColor(x, y);\nif (color === expectedColor) {\n  \n}',
        displayText: '获取并比较颜色',
        documentation: '获取屏幕颜色并判断',
        kind: 'snippet',
        isAI: false,
        sortText: '0_color',
      },
      {
        text: 'const text = zdjl.recognitionScreen({\n  recognitionArea: "0 0 100% 100%",\n  recognitionMode: "ocr_local"\n});',
        displayText: 'OCR识别屏幕',
        documentation: '识别屏幕上的文字',
        kind: 'snippet',
        isAI: false,
        sortText: '0_ocr',
      },
      {
        text: 'for (let i = 0; i < 10; i++) {\n  \n}',
        displayText: '循环10次',
        documentation: '循环执行代码块',
        kind: 'snippet',
        isAI: false,
        sortText: '1_loop',
      },
      {
        text: 'while (true) {\n  \n  await new Promise(r => setTimeout(r, 1000));\n}',
        displayText: '无限循环',
        documentation: '无限循环执行',
        kind: 'snippet',
        isAI: false,
        sortText: '1_infinite',
      }
    )
  }

  return snippets
}
