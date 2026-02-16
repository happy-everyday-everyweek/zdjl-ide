import { zdjlAPIHints } from '../data/apiHints'

export interface CodeError {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  line: number
  column: number
  endColumn: number
  code: string
  suggestion?: string
  category: ErrorCategory
}

export type ErrorCategory = 
  | 'function-spell' 
  | 'bracket-mismatch' 
  | 'case-error' 
  | 'variable-unused'
  | 'variable-undefined'
  | 'variable-once-used'
  | 'syntax-error'
  | 'parameter-error'

interface VariableInfo {
  name: string
  line: number
  column: number
  isDefined: boolean
  usageCount: number
  scope: string
}

const ZDJL_FUNCTIONS = new Set(zdjlAPIHints.map(h => h.name))

const COMMON_MISSPELLINGS: Record<string, string> = {
  'cick': 'click',
  'clik': 'click',
  'clck': 'click',
  'swip': 'swipe',
  'swpe': 'swipe',
  'gestur': 'gesture',
  'gestre': 'gesture',
  'toas': 'toast',
  'toost': 'toast',
  'alrt': 'alert',
  'confim': 'confirm',
  'cnofirm': 'confirm',
  'confrm': 'confirm',
  'promt': 'prompt',
  'promp': 'prompt',
  'slect': 'select',
  'selec': 'select',
  'getvar': 'getVar',
  'setvar': 'setVar',
  'deletvar': 'deleteVar',
  'delvar': 'deleteVar',
  'clearvar': 'clearVars',
  'getclipbord': 'getClipboard',
  'setclipbord': 'setClipboard',
  'writefile': 'writeFile',
  'readfile': 'readFile',
  'apendfile': 'appendFile',
  'appendfile': 'appendFile',
  'getscreencolor': 'getScreenColor',
  'getscreenareacolor': 'getScreenAreaColors',
  'findloction': 'findLocation',
  'findlocaton': 'findLocation',
  'findnod': 'findNode',
  'recognitionscreen': 'recognitionScreen',
  'reqesturl': 'requestUrl',
  'requesurl': 'requestUrl',
  'getdeviceinfo': 'getDeviceInfo',
  'getuser': 'getUser',
  'getappversion': 'getAppVersion',
  'vibratr': 'vibrator',
  'vibrat': 'vibrator',
  'wakupScreen': 'wakeupScreen',
  'wakeupscreen': 'wakeupScreen',
  'longcick': 'longClick',
  'longclik': 'longClick',
  'longclck': 'longClick',
}

export class ErrorChecker {
  private errors: CodeError[] = []
  private lines: string[] = []
  private variables: Map<string, VariableInfo> = new Map()
  private scopeStack: string[] = ['global']

  check(code: string): CodeError[] {
    this.errors = []
    this.lines = code.split('\n')
    this.variables = new Map()
    this.scopeStack = ['global']

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]
      const lineNum = i + 1
      this.checkLine(line, lineNum)
    }

    this.checkVariableUsage()
    this.checkBracketBalance(code)

    return this.errors
  }

  private checkLine(line: string, lineNum: number): void {
    this.checkZdjlFunctionCalls(line, lineNum)
    this.checkBracketsInLine(line, lineNum)
    this.checkVariableDeclarations(line, lineNum)
    this.checkVariableUsage(line, lineNum)
    this.checkSyntaxErrors(line, lineNum)
  }

  private checkZdjlFunctionCalls(line: string, lineNum: number): void {
    const zdjlCallRegex = /zdjl\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)/g
    let match

    while ((match = zdjlCallRegex.exec(line)) !== null) {
      const funcName = match[1]
      const startCol = match.index + 5

      while (startCol < line.length && line[startCol - 5] !== '.') {
        break
      }

      const actualStartCol = line.indexOf(funcName, match.index)

      if (!ZDJL_FUNCTIONS.has(funcName)) {
        const suggestion = this.findSimilarFunction(funcName)
        
        if (suggestion) {
          this.addError({
            type: 'error',
            message: `未知的函数名 "${funcName}"，您是否想使用 "${suggestion}"？`,
            line: lineNum,
            column: actualStartCol + 1,
            endColumn: actualStartCol + funcName.length + 1,
            code: 'UNKNOWN_FUNCTION',
            suggestion,
            category: 'function-spell',
          })
        } else {
          this.addError({
            type: 'error',
            message: `未知的函数名 "${funcName}"`,
            line: lineNum,
            column: actualStartCol + 1,
            endColumn: actualStartCol + funcName.length + 1,
            code: 'UNKNOWN_FUNCTION',
            category: 'function-spell',
          })
        }
      } else {
        this.checkFunctionCase(funcName, lineNum, actualStartCol, line)
      }
    }
  }

  private checkFunctionCase(funcName: string, lineNum: number, column: number, line: string): void {
    const correctName = zdjlAPIHints.find(h => h.name.toLowerCase() === funcName.toLowerCase())?.name
    
    if (correctName && correctName !== funcName) {
      this.addError({
        type: 'warning',
        message: `函数名大小写错误："${funcName}" 应为 "${correctName}"`,
        line: lineNum,
        column: column + 1,
        endColumn: column + funcName.length + 1,
        code: 'CASE_ERROR',
        suggestion: correctName,
        category: 'case-error',
      })
    }
  }

  private findSimilarFunction(name: string): string | undefined {
    const lowerName = name.toLowerCase()
    
    if (COMMON_MISSPELLINGS[lowerName]) {
      return COMMON_MISSPELLINGS[lowerName]
    }

    for (const funcName of ZDJL_FUNCTIONS) {
      if (this.levenshteinDistance(lowerName, funcName.toLowerCase()) <= 2) {
        return funcName
      }
    }

    for (const funcName of ZDJL_FUNCTIONS) {
      if (funcName.toLowerCase().startsWith(lowerName) && funcName.length - lowerName.length <= 3) {
        return funcName
      }
    }

    return undefined
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[b.length][a.length]
  }

  private checkBracketsInLine(line: string, lineNum: number): void {
    const openBrackets: { char: string; pos: number }[] = []
    const bracketPairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
    }
    const closingBrackets = new Set([')', ']', '}'])

    let inString = false
    let stringChar = ''
    let i = 0

    while (i < line.length) {
      const char = line[i]

      if ((char === '"' || char === "'" || char === '`') && (i === 0 || line[i - 1] !== '\\')) {
        if (!inString) {
          inString = true
          stringChar = char
        } else if (char === stringChar) {
          inString = false
        }
      }

      if (!inString) {
        if (bracketPairs[char]) {
          openBrackets.push({ char, pos: i })
        } else if (closingBrackets.has(char)) {
          if (openBrackets.length === 0) {
            this.addError({
              type: 'error',
              message: `多余的闭合括号 "${char}"`,
              line: lineNum,
              column: i + 1,
              endColumn: i + 2,
              code: 'EXTRA_CLOSING_BRACKET',
              category: 'bracket-mismatch',
            })
          } else {
            const lastOpen = openBrackets.pop()!
            const expectedClose = bracketPairs[lastOpen.char]
            if (char !== expectedClose) {
              this.addError({
                type: 'error',
                message: `括号不匹配：期望 "${expectedClose}" 但找到 "${char}"`,
                line: lineNum,
                column: i + 1,
                endColumn: i + 2,
                code: 'BRACKET_MISMATCH',
                category: 'bracket-mismatch',
              })
            }
          }
        }
      }
      i++
    }

    for (const unclosed of openBrackets) {
      this.addError({
        type: 'error',
        message: `未闭合的括号 "${unclosed.char}"`,
        line: lineNum,
        column: unclosed.pos + 1,
        endColumn: unclosed.pos + 2,
        code: 'UNCLOSED_BRACKET',
        category: 'bracket-mismatch',
      })
    }
  }

  private checkBracketBalance(code: string): void {
    const stack: { char: string; line: number; col: number }[] = []
    const bracketPairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
    }
    const closingBrackets = new Set([')', ']', '}'])

    let lineNum = 1
    let colNum = 1
    let inString = false
    let stringChar = ''
    let inComment = false
    let inBlockComment = false

    for (let i = 0; i < code.length; i++) {
      const char = code[i]
      const nextChar = code[i + 1]

      if (char === '\n') {
        lineNum++
        colNum = 1
        inComment = false
        continue
      }

      if (!inString && !inBlockComment) {
        if (char === '/' && nextChar === '/') {
          inComment = true
          colNum++
          continue
        }
        if (char === '/' && nextChar === '*') {
          inBlockComment = true
          colNum++
          continue
        }
      }

      if (inBlockComment && char === '*' && nextChar === '/') {
        inBlockComment = false
        colNum++
        continue
      }

      if (inComment || inBlockComment) {
        colNum++
        continue
      }

      if ((char === '"' || char === "'" || char === '`') && (i === 0 || code[i - 1] !== '\\')) {
        if (!inString) {
          inString = true
          stringChar = char
        } else if (char === stringChar) {
          inString = false
        }
      }

      if (!inString) {
        if (bracketPairs[char]) {
          stack.push({ char, line: lineNum, col: colNum })
        } else if (closingBrackets.has(char)) {
          if (stack.length === 0) {
            this.addError({
              type: 'error',
              message: `多余的闭合括号 "${char}"`,
              line: lineNum,
              column: colNum,
              endColumn: colNum + 1,
              code: 'EXTRA_CLOSING_BRACKET',
              category: 'bracket-mismatch',
            })
          } else {
            const lastOpen = stack.pop()!
            const expectedClose = bracketPairs[lastOpen.char]
            if (char !== expectedClose) {
              this.addError({
                type: 'error',
                message: `括号不匹配：在第 ${lastOpen.line} 行打开的 "${lastOpen.char}" 应该用 "${expectedClose}" 关闭，但找到 "${char}"`,
                line: lineNum,
                column: colNum,
                endColumn: colNum + 1,
                code: 'BRACKET_MISMATCH',
                category: 'bracket-mismatch',
              })
            }
          }
        }
      }

      colNum++
    }

    for (const unclosed of stack) {
      this.addError({
        type: 'error',
        message: `未闭合的括号 "${unclosed.char}"，在第 ${unclosed.line} 行`,
        line: unclosed.line,
        column: unclosed.col,
        endColumn: unclosed.col + 1,
        code: 'UNCLOSED_BRACKET',
        category: 'bracket-mismatch',
      })
    }
  }

  private checkVariableDeclarations(line: string, lineNum: number): void {
    const varDeclRegex = /\b(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
    let match

    while ((match = varDeclRegex.exec(line)) !== null) {
      const varName = match[1]
      const existingVar = this.variables.get(varName)
      
      if (existingVar && existingVar.isDefined) {
        this.addError({
          type: 'warning',
          message: `变量 "${varName}" 重复声明`,
          line: lineNum,
          column: match.index + 1,
          endColumn: match.index + match[0].length + 1,
          code: 'DUPLICATE_DECLARATION',
          category: 'variable-undefined',
        })
      } else {
        this.variables.set(varName, {
          name: varName,
          line: lineNum,
          column: match.index + 1,
          isDefined: true,
          usageCount: 0,
          scope: this.currentScope,
        })
      }
    }

    const setVarRegex = /zdjl\s*\.\s*setVar\s*\(\s*["']([^"']+)["']/g
    while ((match = setVarRegex.exec(line)) !== null) {
      const varName = match[1]
      if (!this.variables.has(varName)) {
        this.variables.set(varName, {
          name: varName,
          line: lineNum,
          column: match.index + 1,
          isDefined: true,
          usageCount: 0,
          scope: 'zdjl-var',
        })
      }
    }
  }

  private checkVariableUsage(line: string, lineNum: number): void {
    const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g
    let match

    const keywords = new Set([
      'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while',
      'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally',
      'throw', 'new', 'typeof', 'instanceof', 'in', 'of', 'true', 'false', 'null',
      'undefined', 'this', 'class', 'extends', 'super', 'import', 'export', 'default',
      'async', 'await', 'yield', 'static', 'get', 'set', 'zdjl', 'console', 'Math',
      'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'RegExp',
      'Error', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Proxy',
      'Reflect', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURI',
      'decodeURI', 'encodeURIComponent', 'decodeURIComponent', 'eval', 'setTimeout',
      'setInterval', 'clearTimeout', 'clearInterval', 'requestAnimationFrame',
    ])

    while ((match = identifierRegex.exec(line)) !== null) {
      const varName = match[1]
      
      if (keywords.has(varName)) continue
      
      if (ZDJL_FUNCTIONS.has(varName)) continue

      const beforeMatch = line.substring(0, match.index)
      if (/\b(?:var|let|const)\s*$/.test(beforeMatch)) continue

      const varInfo = this.variables.get(varName)
      if (varInfo) {
        varInfo.usageCount++
      } else if (/^zdjl\s*\.\s*getVar\s*\(/.test(line) === false) {
        const isPropertyAccess = line[match.index - 1] === '.'
        if (!isPropertyAccess) {
          const afterMatch = line.substring(match.index + varName.length)
          if (!/^\s*:/.test(afterMatch)) {
            const isFunctionCall = /^\s*\(/.test(afterMatch)
            if (!isFunctionCall) {
              const isInString = this.isInsideString(line, match.index)
              if (!isInString) {
                this.addError({
                  type: 'warning',
                  message: `变量 "${varName}" 未定义`,
                  line: lineNum,
                  column: match.index + 1,
                  endColumn: match.index + varName.length + 1,
                  code: 'UNDEFINED_VARIABLE',
                  category: 'variable-undefined',
                })
              }
            }
          }
        }
      }
    }

    const getVarRegex = /zdjl\s*\.\s*getVar\s*\(\s*["']([^"']+)["']/g
    while ((match = getVarRegex.exec(line)) !== null) {
      const varName = match[1]
      const varInfo = this.variables.get(varName)
      if (varInfo) {
        varInfo.usageCount++
      } else {
        this.variables.set(varName, {
          name: varName,
          line: lineNum,
          column: match.index + 1,
          isDefined: false,
          usageCount: 1,
          scope: 'zdjl-var',
        })
      }
    }
  }

  private isInsideString(line: string, position: number): boolean {
    let inString = false
    let stringChar = ''
    
    for (let i = 0; i < position; i++) {
      const char = line[i]
      if ((char === '"' || char === "'" || char === '`') && (i === 0 || line[i - 1] !== '\\')) {
        if (!inString) {
          inString = true
          stringChar = char
        } else if (char === stringChar) {
          inString = false
        }
      }
    }
    
    return inString
  }

  private checkVariableUsage(): void {
    for (const [varName, varInfo] of this.variables) {
      if (varInfo.isDefined && varInfo.usageCount === 0) {
        this.addError({
          type: 'warning',
          message: `变量 "${varName}" 已声明但从未使用`,
          line: varInfo.line,
          column: varInfo.column,
          endColumn: varInfo.column + varName.length,
          code: 'UNUSED_VARIABLE',
          category: 'variable-unused',
        })
      } else if (varInfo.usageCount === 1 && varInfo.scope === 'zdjl-var') {
        this.addError({
          type: 'info',
          message: `变量 "${varName}" 只被使用了一次，请检查是否有遗漏`,
          line: varInfo.line,
          column: varInfo.column,
          endColumn: varInfo.column + varName.length,
          code: 'ONCE_USED_VARIABLE',
          category: 'variable-once-used',
        })
      }
    }
  }

  private checkSyntaxErrors(line: string, lineNum: number): void {
    const trailingCommaRegex = /,\s*[)\]}]/g
    let match
    while ((match = trailingCommaRegex.exec(line)) !== null) {
      this.addError({
        type: 'warning',
        message: '可能存在多余的逗号',
        line: lineNum,
        column: match.index + 1,
        endColumn: match.index + 2,
        code: 'TRAILING_COMMA',
        category: 'syntax-error',
      })
    }

    const doubleSemicolonRegex = /;;+/g
    while ((match = doubleSemicolonRegex.exec(line)) !== null) {
      this.addError({
        type: 'info',
        message: '发现多余的分号',
        line: lineNum,
        column: match.index + 1,
        endColumn: match.index + match[0].length + 1,
        code: 'DOUBLE_SEMICOLON',
        category: 'syntax-error',
      })
    }

    const emptyBlockRegex = /\{\s*\}/g
    while ((match = emptyBlockRegex.exec(line)) !== null) {
      this.addError({
        type: 'info',
        message: '空的代码块',
        line: lineNum,
        column: match.index + 1,
        endColumn: match.index + match[0].length + 1,
        code: 'EMPTY_BLOCK',
        category: 'syntax-error',
      })
    }
  }

  private get currentScope(): string {
    return this.scopeStack[this.scopeStack.length - 1]
  }

  private addError(error: Omit<CodeError, 'id'>): void {
    this.errors.push({
      ...error,
      id: `${error.line}-${error.column}-${error.code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    })
  }
}

export const errorChecker = new ErrorChecker()

export function checkCodeErrors(code: string): CodeError[] {
  return errorChecker.check(code)
}
