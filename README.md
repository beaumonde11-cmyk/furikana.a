🇯🇵 日文学习全能助手 (Japanese Study Helper)本项目是一个专为日语学习者打造的 Web 工具，集成了汉字注音（Furigana）、即时中文翻译以及**智能语音合成（TTS）**三大核心功能。🌟 核心功能 (Features)汉字注音 (Furigana): 利用 Kuromoji 引擎精准识别日文汉字，并标注平假名。即时翻译 (Translation): 一键将日文文本翻译为中文，方便对比理解。智能发音 (Text-to-Speech): * 通过协议直连 Edge TTS，发音自然。安全防护: 实时监测字数，限制单次朗读不超过 500 字，确保系统运行流畅。自动恢复: 当文本从超长状态减删至 500 字内时，朗读功能自动激活并恢复。交互优化: 包含实时字数统计和超长红色警告提示。🛠️ 技术栈 (Technology Stack)模块技术名称说明后端Node.js / Express核心逻辑与 API 路由管理。注音引擎Kuromoji日文分词与假名转换。发音技术Edge TTS Protocol采用 WebSocket 直连微软语音合成接口。前端HTML5 / CSS3 / Vanilla JS轻量级原生开发，无需沉重的框架。⚙️ 本地环境配置 (Local Setup)要在你的电脑（如 C 盘当前目录）运行此项目，请按照以下步骤操作：1. 准备环境确保你的电脑已安装 Node.js (推荐 v18 或更高版本)。2. 安装依赖在项目根目录下打开终端，运行：Bashnpm install express kuromoji ws uuid
3. 运行项目执行以下命令启动服务器：Bashnpm start
或者直接运行：Bashnode server.js
成功后，在浏览器访问：http://localhost:3000📂 项目结构 (Project Structure)Plaintext/furigana-app
├── server.js            # 后端核心逻辑 (注音接口 + TTS 路由)
├── package.json         # 项目配置文件与依赖管理
├── /public              # 前端静态资源目录
│   └── index.html       # 用户交互界面 (含字数监控与翻译逻辑)
└── /node_modules        # 依赖包 (自动生成)
⚠️ 开发注意事项 (Important Notes)字数限制: 为了防止内存溢出和接口被封禁，发音功能严格限制在 500 字以内。网络要求: 翻译和发音功能需要连接互联网才能正常工作。路径兼容性: server.js 中使用了 path.join 修复了 kuromoji 字典在某些环境（如 Linux 容器）下路径报错的问题。📈 未来规划 (Roadmap)[ ] 增加多音色选择（男声/女声）。[ ] 增加生词本保存功能。[ ] 导出注音后的 PDF 或图片。