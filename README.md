# 📝 My Supabase App - 智能协作笔记平台

一个基于 Next.js 和 Supabase 构建的现代化协作笔记应用，集成了实时协作编辑、AI 智能功能、社交互动等丰富特性。

## ✨ 核心功能

### 📚 笔记编辑与管理

- **富文本编辑器**：基于 Plate.js 构建的强大编辑器，支持 Markdown、代码块、表格、数学公式等
- **实时协作编辑**：多人同时编辑同一文档，实时同步内容变更
- **文档分享**：支持将笔记分享给其他用户，设置访问权限
- **版本历史**：自动保存文档版本，支持历史版本查看和恢复

### 🤖 AI 智能功能

- **文字识别 (OCR)**：截图识别图片中的文字内容
- **智能写作辅助**：集成 AI SDK，提供智能写作建议
- **内容生成**：基于 AI 的内容创作和优化功能

### 💬 社交与协作

- **好友系统**：添加好友、管理好友列表
- **实时聊天**：支持文字、图片、语音消息的即时通讯
- **消息通知**：实时接收好友请求、新消息、文档分享等通知
- **在线状态**：显示好友在线状态和活跃度

### 🎨 交互功能

- **截图工具**：网页截图、区域选择、画笔标注
- **语音消息**：录制和发送语音消息，支持最长 60 秒
- **表情支持**：丰富的表情符号和 Emoji 表情
- **主题切换**：支持明暗主题切换

## 🛠 技术栈

### 前端框架

- **Next.js 16.1.0** - React 全栈框架
- **React 19.2.3** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript

### 编辑器与协作

- **Plate.js** - 基于 Slate.js 的富文本编辑器
- **@hocuspocus** - 实时协作服务器
- **Yjs** - 共享数据类型库

### 后端服务

- **Supabase** - 后端即服务平台（数据库、认证、存储）
- **PostgreSQL** - 主数据库
- **Supabase Storage** - 文件存储服务

### UI 与样式

- **Tailwind CSS** - 原子化 CSS 框架
- **Radix UI** - 无头组件库
- **Lucide React** - 图标库
- **shadcn/ui** - 高质量组件库

### 状态管理

- **Zustand** - 轻量级状态管理
- **Redux Toolkit** - 应用状态管理

### AI 与工具

- **AI SDK** - OpenAI 集成
- **html2canvas** - 截图功能
- **dexie** - 本地 IndexedDB 操作

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 环境配置

1. 复制环境变量模板：

```bash
cp .env.example .env.local
```

2. 配置 Supabase 环境变量（在 `.env.local` 中）：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. 配置其他服务（可选）：

```env
OPENAI_API_KEY=your_openai_api_key  # 用于 AI 功能
```

### 启动开发服务器

```bash
# 启动前端和协作服务器
npm run dev

# 或分别启动
npm run dev:next    # 前端服务 (http://localhost:3000)
npm run dev:collab  # 协作服务器 (http://localhost:1234)
```

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
my-supabase-app/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── auth/              # 认证相关页面
│   ├── dashboard/         # 主应用界面
│   ├── components/        # 页面级组件
│   ├── store/            # 状态管理
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 首页
├── components/            # 可复用组件
│   ├── editor/           # 编辑器相关组件
│   └── ui/               # UI 基础组件
├── collab-server/         # 协作服务器
│   ├── package.json
│   └── server.js
├── lib/                   # 工具库和 API
│   ├── supabase/         # Supabase 客户端
│   ├── api/              # API 函数
│   └── utils/            # 工具函数
├── hooks/                 # 自定义 React Hooks
└── public/               # 静态资源
```

## 🔧 开发指南

### 数据库设置

1. 在 Supabase 中创建新项目
2. 运行 SQL 迁移脚本（位于 `supabase/migrations/`）
3. 配置 Row Level Security (RLS) 策略

### 主要功能模块

#### 认证系统

- 使用 Supabase Auth 进行用户认证
- 支持邮箱密码登录和第三方登录
- 自动处理用户会话和权限

#### 实时协作

- 基于 Yjs 和 Hocuspocus 的协作编辑
- WebSocket 实时通信
- 冲突解决和操作转换

#### 文件上传

- 使用 Supabase Storage 存储文件
- 支持图片、音频等多种文件类型
- 自动生成公开访问 URL

### API 接口

主要 API 路由：

- `/api/auth/*` - 认证相关
- `/api/documents/*` - 文档管理
- `/api/friends/*` - 好友系统
- `/api/messages/*` - 消息系统
- `/api/recognize-text` - OCR 文字识别

## 🎯 部署

### Vercel 部署（推荐）

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 自动部署完成

### 其他平台

支持部署到任何支持 Next.js 的平台：

- Netlify
- Railway
- Digital Ocean App Platform
- 自建服务器

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org) - 全栈 React 框架
- [Supabase](https://supabase.com) - 开源 Firebase 替代方案
- [Plate.js](https://platejs.org) - 强大的富文本编辑器
- [Tailwind CSS](https://tailwindcss.com) - 实用优先的 CSS 框架
- [Radix UI](https://www.radix-ui.com) - 无头组件库

---

⭐ 如果这个项目对你有帮助，请给它一个星标！

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
