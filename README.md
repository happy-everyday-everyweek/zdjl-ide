# 自动精灵IDE

一个专为自动精灵脚本开发设计的集成开发环境，支持AI辅助编写、节点库管理、图片自动编码、ZJS打包等功能。

## 功能特性

- **智能代码提示** - 自动精灵API自动补全和悬停提示
- **节点库管理** - 从GitHub导入和管理节点库
- **图片自动编码** - 自动将图片转换为base64编码
- **AI辅助编写** - 集成DeepSeek AI助手，智能生成代码
- **ZJS打包** - 一键导出为ZJS格式文件

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **React** - UI组件库
- **TypeScript** - 类型安全
- **Monaco Editor** - 代码编辑器
- **Vite** - 构建工具

## 开发

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 打包

```bash
npm run dist
```

## 项目结构

```
zdjl-ide/
├── src/
│   ├── main/                 # Electron主进程
│   │   ├── main.ts           # 主进程入口
│   │   └── preload.ts        # 预加载脚本
│   └── renderer/             # 渲染进程
│       ├── src/
│       │   ├── components/   # React组件
│       │   ├── context/      # React Context
│       │   ├── data/         # 静态数据
│       │   ├── services/     # 服务层
│       │   └── types/        # TypeScript类型
│       └── styles/           # CSS样式
├── doc/                      # 文档
├── resources/                # 资源文件
└── package.json
```

## 文档

- [使用说明](doc/使用说明.md)
- [节点库开发指南](doc/节点库开发指南.md)
- [API参考](doc/API参考.md)

## 许可证

MIT License
