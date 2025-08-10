# 基于RAG的网页内容聊天应用程序

> 🌍 **语言**: [English](README_EN.md) | **中文** | [日本語](README.md)

本项目是一个全栈Web应用程序，允许您从多个网站抓取内容，将其存储在分区向量数据库中，并使用检索增强生成（RAG）技术与特定网站的内容进行聊天。

采用现代技术栈构建，容器化部署，提供简洁易用的用户界面。

## 📚 初学者指南

如果您是技术新手，想通过使用此仓库学习技术栈：
👉 **[详细初学者指南](BEGINNER_GUIDE_ZH.md)**

## ✨ 主要功能

- **网页抓取**: 从任意数量的URL获取内容
- **多上下文聊天**: 每个获取的URL创建独立的上下文，与特定网站内容聊天
- **向量嵌入**: 使用Ollama的`mxbai-embed-large`模型为网页内容生成嵌入
- **分区向量存储**: 在本地Milvus向量数据库中为每个URL独立分区存储文本和嵌入
- **RAG聊天**: 使用Ollama生成模型基于存储的内容回答问题
- **现代Web界面**: 用于网站获取和聊天交互的React前端

## 🛠️ 技术栈

- **后端**: FastAPI (Python)
- **前端**: React (TypeScript) + Vite + `shadcn/ui`
- **向量数据库**: Milvus (v2.3.10)
- **LLM服务**: Ollama（在主机上运行）
  - **嵌入模型**: `mxbai-embed-large`
  - **生成模型**: 可配置
    - `gpt-oss:20b` - 完整模型（需要13GB+内存）
    - `tinyllama` - 轻量级模型（638MB）
- **容器化**: Docker 和 Docker Compose

## ⚠️ 重要架构说明

### 为什么在主机上运行Ollama？

本项目采用**Ollama在主机上运行**，通过Docker容器访问的架构。选择此方法的原因：

1. **GPU加速**: 直接访问主机GPU（Metal Performance Shaders等）
2. **内存效率**: 绕过Docker内存限制，高效利用系统内存
3. **性能**: 通过原生执行实现更快推理

💡 **这意味着您无需修改Docker Desktop内存设置**

## 📋 前置条件

### 必需组件

1. **[Docker Desktop](https://www.docker.com/get-started/)** 已安装并正在运行
2. **[Ollama](https://ollama.ai/)** 已安装并在主机上运行

### 内存要求（主机）

- **gpt-oss:20b模型**: 建议最少16GB RAM（模型大小：约13GB）
- **tinyllama模型**: 4GB RAM（轻量级版本，638MB）

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Ollama设置（重要！）

#### 安装Ollama
```bash
# macOS
curl -fsSL https://ollama.ai/install.sh | sh

# 或通过Homebrew
brew install ollama
```

#### 启动Ollama
```bash
# 后台运行
ollama serve
```

#### 下载必需模型
```bash
# 嵌入模型（必需）
ollama pull mxbai-embed-large

# 生成模型（选择其一）
ollama pull gpt-oss:20b      # 高质量模型（需要16GB+ RAM）
# 或
ollama pull tinyllama        # 轻量级模型（4GB RAM可运行）
```

### 3. 模型配置（可选）

编辑`.env`文件选择模型：

```bash
# 高质量模型（需要16GB+ RAM）
GENERATION_MODEL=gpt-oss:20b

# 轻量级模型（4GB RAM可运行，默认）
GENERATION_MODEL=tinyllama
```

### 4. 启动应用程序

```bash
docker-compose up --build
```

### 5. 访问

在网页浏览器中打开：
**http://localhost:5173**

## 📖 使用方法

### 1. 网站内容获取

- 在"1. Ingest a Website"部分，输入要处理的网站URL
- 例如：`https://zh.wikipedia.org/wiki/人工智能`
- 点击"Process URL"按钮
- 可以处理多个URL

### 2. 选择上下文

- 获取网站后，将出现"Select a context to chat with"下拉菜单
- 选择您想要聊天的网站

### 3. 聊天

- 在"2. Chat"部分，询问有关所选网站内容的问题
- 输入问题并按Enter键或点击发送按钮
- 应用程序仅基于所选网站的信息生成答案

## 🔧 故障排除

### Ollama连接错误

**症状**: "Could not connect to Ollama"错误

**解决方案**:
```bash
# 检查Ollama是否正在运行
ollama serve

# 或在另一个终端
ollama list
```

### 内存不足错误

**症状**: "out of memory"错误

**解决方案**:
1. **切换到轻量级模型**:
   ```bash
   # 编辑.env文件
   GENERATION_MODEL=tinyllama
   ```

2. **重启应用程序**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### 模型性能比较

| 模型 | 内存使用 | 质量 | 使用场景 |
|------|----------|------|----------|
| gpt-oss:20b | ~13GB | 高质量 | 生产环境，需要高质量答案 |
| tinyllama | 638MB | 基础质量 | 测试，学习，受限环境 |

## 🐳 Docker服务配置

`docker-compose.yml`中定义的服务：

- **etcd**, **minio**, **milvus**: Milvus向量数据库及其依赖项
- **backend**: 提供主要API的FastAPI应用程序
- **frontend**: React前端的Vite开发服务器

注意：**ollama**服务已注释，使用主机Ollama（`host.docker.internal:11434`）

## 🔧 环境变量

`.env`文件支持的环境变量：

- `GENERATION_MODEL`: 文本生成的LLM模型（默认：`gpt-oss:20b`）
- `EMBEDDING_MODEL`: 生成嵌入的模型（默认：`mxbai-embed-large`）

## 📄 许可证

[MIT License](LICENSE)

---

### 🆘 需要帮助？

- 初学者：[详细初学者指南](BEGINNER_GUIDE_ZH.md)
- 技术问题：请在Issues标签中随时提问
- 其他语言：[English](README_EN.md) | [日本語](README.md)