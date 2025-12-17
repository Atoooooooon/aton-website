# CMS 系统设计文档

## 项目概述

为 Aton 个人作品集网站设计的内容管理系统，主要用于管理摄影作品展示墙和其他页面内容。

### 核心目标
- 轻松上传和管理摄影作品
- 无需改代码即可更新网站内容
- 简单直观的管理界面

---

## 技术栈选型

### 后端方案对比

| 方案 | 技术栈 | 优势 | 劣势 | 推荐度 |
|------|--------|------|------|--------|
| **方案 A** | Go + PostgreSQL + 云存储 | 性能强、你熟悉、可扩展 | 需要单独部署维护 | ⭐⭐⭐⭐ |
| **方案 B** | Next.js API Routes + PostgreSQL | 单体应用、部署简单、类型共享 | 性能不如 Go | ⭐⭐⭐⭐⭐ |
| **方案 C** | Headless CMS (Strapi) | 开箱即用、功能完善 | 定制性差、依赖第三方 | ⭐⭐⭐ |

**最终选择：方案 B (Next.js API Routes)**

理由：
1. 摄影墙是轻量级应用，不需要 Go 的性能优势
2. 单体应用，Docker 一键部署
3. 前后端类型共享，开发效率高
4. 如果以后需要高性能功能，可以增加 Go 微服务

---

## 系统架构

```
atonWeb/
├── web/                          # Next.js 前端 + 后端
│   ├── app/
│   │   ├── api/                  # 后端 API
│   │   │   ├── auth/             # 认证接口
│   │   │   ├── photos/           # 摄影作品 CRUD
│   │   │   ├── upload/           # 图片上传
│   │   │   └── profile/          # 个人信息管理
│   │   ├── admin/                # CMS 管理界面
│   │   │   ├── login/            # 登录页
│   │   │   ├── dashboard/        # 仪表盘
│   │   │   └── photos/           # 摄影作品管理
│   │   └── gallery/              # 公开摄影墙页面
│   ├── lib/
│   │   ├── db.ts                 # 数据库连接
│   │   ├── storage.ts            # 云存储客户端
│   │   └── auth.ts               # 认证逻辑
│   └── prisma/
│       └── schema.prisma         # 数据库模型
└── docs/
    └── CMS_DESIGN.md
```

---

## 数据库设计

### 核心表结构

```sql
-- 用户表（管理员）
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 摄影作品表
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url VARCHAR(500) NOT NULL,      -- 云存储 URL
  thumbnail_url VARCHAR(500),            -- 缩略图 URL
  category VARCHAR(50),                  -- 分类（风景/人像/街拍等）
  tags TEXT[],                           -- 标签数组
  location VARCHAR(200),                 -- 拍摄地点
  camera_info JSONB,                     -- 相机信息 {model, lens, iso, aperture, shutter}
  is_featured BOOLEAN DEFAULT false,     -- 是否精选
  display_order INTEGER DEFAULT 0,       -- 显示顺序
  status VARCHAR(20) DEFAULT 'draft',    -- draft/published/archived
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 摄影集表（可选，用于分组管理）
CREATE TABLE photo_albums (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cover_photo_id INTEGER REFERENCES photos(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 个人资料表
CREATE TABLE profile (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  tagline TEXT,
  bio TEXT,
  avatar_url VARCHAR(500),
  github_url VARCHAR(200),
  linkedin_url VARCHAR(200),
  email VARCHAR(100),
  skills TEXT[],
  hobbies TEXT[],
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photos_featured ON photos(is_featured);
CREATE INDEX idx_photos_order ON photos(display_order);
CREATE INDEX idx_photos_category ON photos(category);
```

### Prisma Schema (推荐使用)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique @db.VarChar(50)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  email        String?  @db.VarChar(100)
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("users")
}

model Photo {
  id           Int       @id @default(autoincrement())
  title        String    @db.VarChar(200)
  description  String?   @db.Text
  imageUrl     String    @map("image_url") @db.VarChar(500)
  thumbnailUrl String?   @map("thumbnail_url") @db.VarChar(500)
  category     String?   @db.VarChar(50)
  tags         String[]
  location     String?   @db.VarChar(200)
  cameraInfo   Json?     @map("camera_info")
  isFeatured   Boolean   @default(false) @map("is_featured")
  displayOrder Int       @default(0) @map("display_order")
  status       String    @default("draft") @db.VarChar(20)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  @@index([status])
  @@index([isFeatured])
  @@index([displayOrder])
  @@index([category])
  @@map("photos")
}

model Profile {
  id          Int      @id @default(autoincrement())
  name        String?  @db.VarChar(100)
  tagline     String?  @db.Text
  bio         String?  @db.Text
  avatarUrl   String?  @map("avatar_url") @db.VarChar(500)
  githubUrl   String?  @map("github_url") @db.VarChar(200)
  linkedinUrl String?  @map("linkedin_url") @db.VarChar(200)
  email       String?  @db.VarChar(100)
  skills      String[]
  hobbies     String[]
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("profile")
}
```

---

## API 接口设计

### 认证接口

```typescript
// POST /api/auth/login
// 登录
{
  "username": "aton",
  "password": "your_password"
}
// 响应: { "token": "jwt_token", "user": {...} }

// POST /api/auth/logout
// 登出

// GET /api/auth/me
// 获取当前用户信息
```

### 摄影作品接口

```typescript
// GET /api/photos
// 获取摄影作品列表（支持分页、过滤）
// 查询参数:
//   - page: 页码
//   - limit: 每页数量
//   - status: draft/published/archived
//   - category: 分类
//   - featured: true/false

// GET /api/photos/:id
// 获取单个作品详情

// POST /api/photos
// 创建新作品
{
  "title": "作品标题",
  "description": "作品描述",
  "imageUrl": "https://cdn.example.com/photo.jpg",
  "category": "landscape",
  "tags": ["nature", "sunset"],
  "location": "Huangshan, China",
  "cameraInfo": {
    "model": "Sony A7R4",
    "lens": "24-70mm f/2.8",
    "iso": 100,
    "aperture": "f/8",
    "shutter": "1/125"
  },
  "isFeatured": false
}

// PATCH /api/photos/:id
// 更新作品信息

// DELETE /api/photos/:id
// 删除作品

// POST /api/photos/:id/publish
// 发布作品

// POST /api/photos/:id/feature
// 设为精选

// PUT /api/photos/reorder
// 批量调整顺序
{
  "orders": [
    { "id": 1, "order": 0 },
    { "id": 2, "order": 1 }
  ]
}
```

### 上传接口

```typescript
// POST /api/upload
// 上传图片到云存储
// Content-Type: multipart/form-data
// Body: { file: File }
// 响应: { "url": "https://cdn.example.com/xxx.jpg", "thumbnailUrl": "..." }
```

### 个人资料接口

```typescript
// GET /api/profile
// 获取个人资料

// PATCH /api/profile
// 更新个人资料
{
  "name": "Aton",
  "tagline": "Java Developer & Photographer",
  "bio": "...",
  "skills": ["Java", "Spring Boot", "Photography"],
  "hobbies": ["摄影", "骑行", "健身"]
}
```

---

## 云存储方案

### 推荐：阿里云 OSS

**配置步骤：**

1. 创建 OSS Bucket
   - 区域：选择就近区域
   - 访问权限：公共读
   - 开启 CDN 加速

2. 获取访问凭证
   - AccessKey ID
   - AccessKey Secret
   - Bucket Name
   - Region

3. 环境变量配置
```env
# .env.local
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=aton-photos
OSS_ACCESS_KEY_ID=your_access_key
OSS_ACCESS_KEY_SECRET=your_secret
OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
```

4. 图片处理策略
   - 上传原图（自动压缩）
   - 自动生成缩略图（300x300）
   - 自动生成预览图（1200x800）

### 备选：AWS S3 / 腾讯云 COS

配置类似，根据你的云服务商选择。

---

## 前端界面设计

### 1. 管理后台 (`/admin`)

#### 登录页 (`/admin/login`)
```tsx
// 简单的用户名密码登录
// 使用 NextAuth.js 或 JWT
```

#### 仪表盘 (`/admin/dashboard`)
```tsx
// 统计信息
- 总作品数
- 已发布 / 草稿数量
- 最近上传
- 快捷操作按钮
```

#### 摄影作品管理 (`/admin/photos`)
```tsx
// 功能：
- 作品列表（卡片视图 / 列表视图）
- 搜索、过滤、排序
- 批量操作（发布、删除、调整顺序）
- 拖拽排序
- 快速编辑

// 表单字段：
- 标题（必填）
- 描述
- 图片上传（拖拽或点击上传）
- 分类（下拉选择）
- 标签（多选或输入）
- 拍摄地点
- 相机信息（可选）
- 是否精选
- 状态（草稿/发布）
```

### 2. 公开摄影墙 (`/gallery`)

```tsx
// 布局风格：
- Masonry 瀑布流布局（推荐）
- Grid 网格布局
- 全屏幻灯片模式

// 功能：
- 按分类筛选
- 按标签筛选
- 点击查看大图 + EXIF 信息
- 图片懒加载
- 响应式设计
```

---

## 认证方案

### 推荐：NextAuth.js

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/db"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { username: credentials?.username }
        })

        if (user && bcrypt.compareSync(credentials?.password || "", user.passwordHash)) {
          return { id: user.id, name: user.username, email: user.email }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: "/admin/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      return session
    }
  }
})

export { handler as GET, handler as POST }
```

### 中间件保护

```typescript
// middleware.ts
export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/admin/:path*", "/api/photos/:path*", "/api/profile/:path*"]
}
```

---

## 部署方案

### Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: atonweb
      POSTGRES_USER: aton
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://aton:${DB_PASSWORD}@postgres:5432/atonweb
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      OSS_REGION: ${OSS_REGION}
      OSS_BUCKET: ${OSS_BUCKET}
      OSS_ACCESS_KEY_ID: ${OSS_ACCESS_KEY_ID}
      OSS_ACCESS_KEY_SECRET: ${OSS_ACCESS_KEY_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### 环境变量

```env
# .env
DB_PASSWORD=your_secure_password
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://yourdomain.com
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=aton-photos
OSS_ACCESS_KEY_ID=your_access_key
OSS_ACCESS_KEY_SECRET=your_secret
```

---

## 实施计划

### 阶段 1：基础架构（1-2 天）
- [x] 安装 Prisma 和配置数据库连接
- [ ] 创建数据库模型并迁移
- [ ] 配置云存储客户端
- [ ] 实现认证系统（NextAuth.js）
- [ ] 创建基础 API 路由

### 阶段 2：管理后台（2-3 天）
- [ ] 设计并实现登录页
- [ ] 实现摄影作品管理界面
  - 列表展示
  - 新增/编辑表单
  - 图片上传组件
  - 拖拽排序
- [ ] 实现个人资料管理

### 阶段 3：公开页面（1-2 天）
- [ ] 设计并实现摄影墙页面
  - 瀑布流布局
  - 分类筛选
  - 图片详情弹窗
- [ ] 集成到主站导航

### 阶段 4：优化与测试（1 天）
- [ ] 性能优化（图片懒加载、CDN）
- [ ] 响应式适配
- [ ] 功能测试
- [ ] 部署到生产环境

**总计：5-8 天**

---

## 安全考虑

1. **认证**
   - 密码使用 bcrypt 加密
   - JWT token 有效期设置（7 天）
   - HTTPS 强制使用

2. **权限控制**
   - 所有管理接口需要认证
   - API 使用中间件验证 token

3. **输入验证**
   - 使用 Zod 验证所有输入
   - 防止 SQL 注入（Prisma 自动防护）
   - 文件上传限制（类型、大小）

4. **图片安全**
   - 云存储防盗链
   - 缩略图自动压缩
   - 原图水印（可选）

---

## 技术栈总结

| 层级 | 技术 | 用途 |
|------|------|------|
| 前端框架 | Next.js 15 | React 框架 |
| 后端 API | Next.js API Routes | RESTful API |
| 数据库 | PostgreSQL | 关系型数据库 |
| ORM | Prisma | 数据库访问 |
| 认证 | NextAuth.js | 用户认证 |
| 云存储 | 阿里云 OSS | 图片存储 |
| UI 组件 | shadcn/ui + Tailwind | UI 库 |
| 表单验证 | Zod | 输入验证 |
| 图片处理 | sharp | 缩略图生成 |
| 部署 | Docker + Docker Compose | 容器化部署 |

---

## 参考资源

- [Next.js API Routes 文档](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma 文档](https://www.prisma.io/docs)
- [NextAuth.js 文档](https://next-auth.js.org)
- [阿里云 OSS SDK](https://help.aliyun.com/document_detail/32068.html)

---

## 附录：备选方案

### 如果选择 Go 后端

```
api/                              # Go 后端服务
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── handler/                 # HTTP 处理器
│   ├── service/                 # 业务逻辑
│   ├── repository/              # 数据访问层
│   └── model/                   # 数据模型
├── pkg/
│   ├── auth/                    # JWT 认证
│   └── storage/                 # 云存储客户端
└── go.mod
```

技术栈：
- 框架：Gin / Echo / Fiber
- ORM：GORM
- 认证：JWT-go
- 云存储：aliyun-oss-go-sdk

**优势**：
- 更高性能
- 更好的并发处理
- 你更熟悉

**劣势**：
- 需要单独部署
- 前后端类型不共享
- 开发周期稍长

---

**文档版本**: v1.0
**最后更新**: 2025-12-15
**作者**: Claude (基于 Aton 需求设计)
