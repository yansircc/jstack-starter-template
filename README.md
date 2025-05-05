# JStack Starter Template

这是一个基于 JStack 的全栈脚手架项目。后端部署在 Cloudflare Workers，前端部署在 Vercel。你可以充分利用 Cloudflare 的生态链，比如 KV、R2、D1 等服务。JStack 提供了极强的类型安全，开发体验优秀，非常适合作为一个项目的起点。

## 特性

- **后端 Cloudflare Workers**：极致性能，弹性扩展，生态丰富
- **前端 Vercel**：极速部署，支持 SSR/SSG
- **类型安全**：前后端 TypeScript 全链路类型校验
- **灵活开发**：本地开发体验流畅，配置简单

## 快速开始

1. 配置 `wrangler.jsonc`，绑定你自己的 Cloudflare 服务（如 KV、R2、D1 等）
2. 前端启动：`bun dev`
3. 后端启动：`wrangler dev`（开发环境默认使用 miniflare）
4. 开发完成后，部署到生产环境：`bun deploy`

## 适用场景

- 快速搭建全栈应用
- 需要类型安全和高性能的项目
- 希望利用 Cloudflare 生态链能力的开发者

这是一个很不错的起点，具体可以参考 [JStack 官方文档](https://jstack.app/docs/introduction/jstack)