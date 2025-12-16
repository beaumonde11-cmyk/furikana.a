# 🇯🇵 日文学习工具：Furigana 注音与即时翻译服务

## 🌟 项目简介 (Project Overview)

本项目是一个功能完整的 Web 应用程序，专为日文学习者设计。它通过 Node.js 后端服务提供高精度的 **汉字注音（Furigana）** 功能，并集成纯前端调用，实现快速的**中文翻译**。

本项目的核心目标是解决 Node.js 应用在云托管平台（如 Render）上部署时遇到的复杂文件路径和依赖加载问题。

## 🚀 最终功能 (Features)

* **汉字注音 (Furigana Annotation):** 对日文文本中的汉字进行精确分词，并标注假名（振假名/ふりがな）。
* **即时中文翻译 (Instant Translation):** 将输入的日文文本快速翻译成中文。
* **单一输入区 (Optimized UI):** 采用统一的输入界面，操作流畅高效。

---

## 🛠️ 技术栈 (Technology Stack)

| 模块 | 技术名称 | 核心用途 |
| :--- | :--- | :--- |
| **后端** | Node.js / Express | 提供 RESTful API 服务，处理静态文件。 |
| **核心算法** | Kuromoji | 负责日文分词和注音。 |
| **前端** | HTML5 / CSS3 / JavaScript | 构建用户界面，处理用户交互和 API 调用。 |
| **部署** | Render (PaaS) | 持续集成与云端托管。 |

---

## ⚙️ 本地安装与运行 (Local Setup)

您可以在本地环境中快速启动并运行本项目。

### 1. 克隆仓库

```bash
git clone [您的GitHub仓库URL]
cd [您的项目文件夹名]

2. 安装依赖 (接续上一部分)
Bash

# 安装 Express, Kuromoji 等所有依赖
npm install
3. 启动服务器
Bash

# 启动服务器，使用 package.json 中定义的 start 脚本
npm start
4. 访问应用
服务器启动后，打开浏览器访问：

http://localhost:3000
💡 部署挑战与解决方案 (Key Deployment Insights)
本项目在部署到 Render 平台时，遇到了两个关键的配置和路径难题，这些经验对于任何 Node.js 云部署项目都非常有价值：

1. Kuromoji 字典路径问题 (Pathing Issue)
问题： 在本地环境中运行正常，但在 Render 的 Linux 云环境中，Kuromoji 无法找到其字典文件 (dict)，导致服务功能失效。

解决方案： 放弃使用简单的相对路径，改为使用 Node.js 的 path 模块构造绝对路径，确保跨平台兼容性。

JavaScript

// server.js 修复后的核心代码片段
const path = require('path');

kuromoji.builder({
    dicPath: path.join(__dirname, 'node_modules', 'kuromoji', 'dict') 
}).build((err, tokenizer) => {
    // ... 初始化成功逻辑
});
2. 端口监听与路由匹配
端口监听： 确保服务器使用 process.env.PORT 来动态获取 Render 分配的端口，而不是硬编码的端口。

路由统一： 确保前端 fetch('/furigana') 调用与后端 app.post('/furigana') 定义的 API 路径完全一致，避免 404 错误。



📄 许可证 (License)
本项目采用 MIT 许可证。