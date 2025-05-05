# Cloudflare Workers CI/CD 部署指南

本项目使用 GitHub Actions 自动部署到 Cloudflare Workers。当代码推送到 `main` 分支时，将自动触发部署流程。

## 配置步骤

### 1. 设置 GitHub Secrets

在 GitHub 仓库中添加以下 Secrets:

1. `CLOUDFLARE_API_TOKEN` - Cloudflare API 令牌
2. `CLOUDFLARE_ACCOUNT_ID` - Cloudflare 账户 ID
3. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk 的可共享公钥
4. `CLERK_JWKS_ENDPOINT` - Clerk JWKS 端点 URL
5. `CLERK_JWT_ISSUER` - Clerk JWT 颁发者 URL
6. `CLERK_SECRET_KEY` - Clerk 密钥
7. `OPENAI_API_KEY` - OpenAI API 密钥

#### 如何获取 Cloudflare API Token:

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击右上角的个人头像 → 我的个人资料
3. 选择 "API 令牌" 标签
4. 点击 "创建令牌"
5. 选择 "编辑 Cloudflare Workers" 模板或创建自定义令牌
6. 确保令牌有以下权限:
   - Account.Workers Scripts:Edit
   - Account.Workers Routes:Edit
   - Workers KV Storage:Edit
   - Workers R2 Storage:Edit
   - Workers D1:Edit
   - Account.Account Settings:Read
7. 在 "区域资源" 部分选择您的账户
8. 点击 "继续查看摘要" 然后 "创建令牌"
9. 复制生成的令牌值

#### 如何获取 Cloudflare Account ID:

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在右侧边栏，您的账户 ID 显示在账户名称下方
3. 或者在 Workers 页面的 URL 中也可以找到 (`https://dash.cloudflare.com/<account-id>/workers`)

### 2. 添加 Clerk 应用密钥和端点

从 Clerk 仪表板获取:

1. `CLERK_JWKS_ENDPOINT` - 通常形式为 `https://api.clerk.dev/v1/jwks/<YOUR_CLERK_INSTANCE_ID>`
2. `CLERK_JWT_ISSUER` - 通常形式为 `https://<YOUR_CLERK_FRONTEND_API>.clerk.accounts.dev`
3. `CLERK_SECRET_KEY` - Clerk 后端 API 密钥

### 3. 添加 OpenAI API 密钥

`OPENAI_API_KEY` - 从 OpenAI 开发者平台获取您的 API 密钥

### 4. 添加 Secrets 到 GitHub 仓库

1. 在 GitHub 仓库页面，点击 "Settings"
2. 在左侧导航栏中选择 "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. 添加所有上述 secrets

## 工作流功能

此工作流程将:

1. 安装项目依赖
2. 运行 D1 数据库迁移 
3. 部署 Worker 应用程序
4. 自动配置所有环境变量和密钥
5. 输出部署 URL

## 手动触发部署

您还可以通过 GitHub Actions 界面手动触发部署:

1. 在 GitHub 仓库页面，点击 "Actions" 标签
2. 从左侧列表选择 "Deploy to Cloudflare Workers" 工作流
3. 点击 "Run workflow"
4. 选择要部署的分支和环境
5. 点击 "Run workflow" 按钮

## 验证部署

部署成功后，您可以:

1. 在 GitHub Actions 工作流运行日志中查看部署详情
2. 查看日志中显示的部署 URL
3. 访问 Cloudflare Dashboard 中的 Workers 部分验证部署 