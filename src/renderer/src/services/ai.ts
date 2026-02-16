export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  error?: string
}

export async function callDeepSeek(
  apiKey: string,
  messages: AIMessage[],
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<AIResponse> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'deepseek-coder',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2048,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        content: '',
        error: errorData.error?.message || `API请求失败: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      content: data.choices?.[0]?.message?.content || '',
    }
  } catch (error: any) {
    return {
      content: '',
      error: error.message || '网络请求失败',
    }
  }
}

export const systemPrompt = `你是一个自动精灵脚本编写助手。你精通自动精灵的API和脚本编写技巧。

自动精灵是一个Android自动化脚本工具，主要API包括：

1. 提示弹窗类：
- zdjl.toast(message, duration?) - 显示短暂提示
- zdjl.alert(message, options?) - 显示弹窗
- zdjl.confirm(message, options?) - 显示确认弹窗
- zdjl.prompt(message, defaultValue?, options?) - 显示输入弹窗
- zdjl.select(config) - 显示选择弹窗

2. 点击滑动类：
- zdjl.click(x, y, duration?) - 点击坐标
- zdjl.longClick(x, y) - 长按
- zdjl.swipe(x1, y1, x2, y2, duration?) - 滑动
- zdjl.gesture(duration, ...xyArray) - 手势操作

3. 设备信息类：
- zdjl.getDeviceInfo() - 获取设备信息
- zdjl.getUser() - 获取用户信息
- zdjl.getInstalledAppInfo() - 获取安装应用列表

4. 文件操作类：
- zdjl.readFile(filePath, options?) - 读取文件
- zdjl.writeFile(filePath, content) - 写入文件
- zdjl.appendFile(filePath, content) - 追加文件内容

5. 屏幕识别类：
- zdjl.findLocation(posData, findAll) - 查找坐标（图片/文字/颜色）
- zdjl.findNode(posData, config) - 查找节点
- zdjl.recognitionScreen(config) - 屏幕OCR识别
- zdjl.getScreenColor(x, y) - 获取屏幕颜色

6. 变量存储类：
- zdjl.getVar(name, scope?) - 获取变量
- zdjl.setVar(name, value, scope?) - 设置变量
- zdjl.getStorage(key, scope?) - 获取本地存储
- zdjl.setStorage(key, content, scope?) - 设置本地存储

7. 网络请求类：
- zdjl.requestUrl(config) - 发送网络请求

请根据用户的需求，生成符合自动精灵API规范的JavaScript代码。代码应该：
1. 简洁高效
2. 包含必要的注释
3. 处理可能的错误情况
4. 使用异步API时使用await

如果用户询问的是API用法，请提供详细的说明和示例代码。`

export function generateCodePrompt(userRequest: string, context?: string): AIMessage[] {
  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
  ]
  
  if (context) {
    messages.push({
      role: 'user',
      content: `当前代码上下文：\n\`\`\`javascript\n${context}\n\`\`\`\n\n用户需求：${userRequest}`,
    })
  } else {
    messages.push({
      role: 'user',
      content: userRequest,
    })
  }
  
  return messages
}

export function explainCodePrompt(code: string): AIMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `请解释以下自动精灵脚本代码的功能和逻辑：\n\`\`\`javascript\n${code}\n\`\`\``,
    },
  ]
}

export function optimizeCodePrompt(code: string): AIMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `请优化以下自动精灵脚本代码，使其更高效、更健壮：\n\`\`\`javascript\n${code}\n\`\`\`\n\n请保持原有功能，同时：\n1. 减少冗余代码\n2. 添加错误处理\n3. 优化性能\n4. 添加必要注释`,
    },
  ]
}
