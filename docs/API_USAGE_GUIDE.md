# API 模块使用指南

## 📁 目录结构

```
web/lib/api/
├── index.ts      # 统一导出
├── base.ts       # 基础请求函数
├── auth.ts       # 认证相关 API
├── photo.ts      # 照片相关 API
└── storage.ts    # 存储相关 API
```

---

## 🎯 设计原则

### ✅ 好品味(Good Taste)

**模块化分离**:
- 每个模块只负责一件事
- `auth.ts` 只管认证,`photo.ts` 只管照片
- 修改某个模块不影响其他模块

**类型安全**:
- 所有请求/响应都有 TypeScript 类型定义
- 编译时就能发现错误

**统一错误处理**:
- 所有错误在 `base.ts` 统一处理
- 自动抛出带消息的 Error

---

## 📖 使用方式

### 方式 1:按模块导入(推荐)

```typescript
import * as authAPI from '@/lib/api/auth';
import * as photoAPI from '@/lib/api/photo';
import * as storageAPI from '@/lib/api/storage';
import { isAuthenticated, logout } from '@/lib/api';

// 使用
const data = await authAPI.login(username, password);
const photos = await photoAPI.listPhotos();
```

### 方式 2:解构导入

```typescript
import { login, changePassword } from '@/lib/api/auth';
import { listPhotos, deletePhoto } from '@/lib/api/photo';

// 使用
const data = await login(username, password);
const photos = await listPhotos();
```

---

## 📚 API 参考

### Auth API ([auth.ts](../../web/lib/api/auth.ts))

#### `login(username, password)`
```typescript
const data = await authAPI.login("admin", "password");
// 返回: { token: string, user: {...} }

// 保存 token
localStorage.setItem("token", data.token);
```

#### `createUser(username, password, email?)`
```typescript
const data = await authAPI.createUser("newuser", "password123", "user@example.com");
// 返回: { message: string, user: {...} }
```

#### `changePassword(oldPassword, newPassword)`
```typescript
await authAPI.changePassword("oldpass", "newpass123");
// 返回: { message: string, user: {...} }
```

---

### Photo API ([photo.ts](../../web/lib/api/photo.ts))

#### `listPhotos()`
```typescript
const { data, total } = await photoAPI.listPhotos();
// data: Photo[]
// total: number
```

#### `getPhotoById(id)`
```typescript
const photo = await photoAPI.getPhotoById(1);
// photo: Photo
```

#### `createPhoto(photo)`
```typescript
const newPhoto = await photoAPI.createPhoto({
  title: "Sunset",
  imageUrl: "https://example.com/sunset.jpg",
  description: "Beautiful sunset",
  category: "nature",
  isFeatured: true,
});
```

#### `updatePhoto(id, photo)`
```typescript
await photoAPI.updatePhoto(1, {
  title: "New Title",
  isFeatured: false,
});
```

#### `deletePhoto(id)`
```typescript
await photoAPI.deletePhoto(1);
// 返回: { message: "Photo deleted successfully" }
```

#### `reorderPhotos(orders)`
```typescript
await photoAPI.reorderPhotos([
  { id: 1, displayOrder: 0 },
  { id: 2, displayOrder: 1 },
  { id: 3, displayOrder: 2 },
]);
```

---

### Storage API ([storage.ts](../../web/lib/api/storage.ts))

#### `generateUploadToken(filename, contentType)`
```typescript
const { uploadUrl, downloadUrl } = await storageAPI.generateUploadToken(
  "photo.jpg",
  "image/jpeg"
);

// 使用 uploadUrl 上传文件
await fetch(uploadUrl, {
  method: "PUT",
  body: file,
  headers: { "Content-Type": "image/jpeg" },
});
```

---

### 工具函数 ([base.ts](../../web/lib/api/base.ts))

#### `isAuthenticated()`
```typescript
if (isAuthenticated()) {
  // 已登录
} else {
  router.push("/admin/login");
}
```

#### `logout()`
```typescript
logout(); // 清除 token
router.push("/admin/login");
```

---

## 🔧 配置

### 修改 API Base URL

在项目根目录创建 `.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

或者直接修改 [base.ts](../../web/lib/api/base.ts:5):
```typescript
const API_BASE_URL = "http://your-api.com/api/v1";
```

---

## 📝 完整示例

### 登录页面
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as authAPI from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = await authAPI.login(username, password);
      localStorage.setItem("token", data.token);
      router.push("/admin/photos");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={username} onChange={e => setUsername(e.target.value)} />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" />
      <button type="submit">Login</button>
      {error && <div>{error}</div>}
    </form>
  );
}
```

### 照片列表页面
```typescript
"use client";

import { useEffect, useState } from "react";
import * as photoAPI from "@/lib/api/photo";
import type { Photo } from "@/lib/api/photo";

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const { data } = await photoAPI.listPhotos();
      setPhotos(data);
    } catch (error) {
      console.error("Failed to load photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await photoAPI.deletePhoto(id);
      loadPhotos(); // 重新加载
    } catch (error) {
      console.error("Failed to delete photo:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {photos.map(photo => (
        <div key={photo.id}>
          <h3>{photo.title}</h3>
          <img src={photo.thumbnailUrl} alt={photo.title} />
          <button onClick={() => handleDelete(photo.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### 改密码页面
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as authAPI from "@/lib/api/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await authAPI.changePassword(oldPassword, newPassword);
      alert("Password changed successfully!");
      localStorage.removeItem("token");
      router.push("/admin/login");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={oldPassword}
        onChange={e => setOldPassword(e.target.value)}
        placeholder="Old Password"
      />
      <input
        type="password"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        placeholder="New Password"
      />
      <button type="submit">Change Password</button>
      {error && <div>{error}</div>}
    </form>
  );
}
```

---

## 🛡️ 错误处理

所有 API 函数都会抛出错误,需要用 try-catch 处理:

```typescript
try {
  await authAPI.login(username, password);
} catch (error: any) {
  // error.message 包含后端返回的错误消息
  console.error(error.message);
}
```

常见错误:
- `400`:请求参数错误
- `401`:未认证或认证失败
- `403`:无权限
- `404`:资源不存在
- `500`:服务器错误

---

## 🔑 类型定义

### Photo 类型
```typescript
interface Photo {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  category: string;
  location: string;
  isFeatured: boolean;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🎯 对比旧版

### ❌ 旧版(不推荐)
```typescript
// 混在一起,难维护
import { authAPI, photoAPI, storageAPI } from '@/lib/api';

authAPI.login();
photoAPI.list();
```

### ✅ 新版(推荐)
```typescript
// 模块清晰,职责分明
import * as authAPI from '@/lib/api/auth';
import * as photoAPI from '@/lib/api/photo';

authAPI.login();
photoAPI.listPhotos();
```

---

## 📦 添加新 API

### 步骤 1:创建新模块

创建 `web/lib/api/user.ts`:
```typescript
import { request } from "./base";

export interface User {
  id: number;
  username: string;
  email: string;
}

export async function getUserProfile(): Promise<User> {
  return request<User>("/user/profile");
}
```

### 步骤 2:导出模块

修改 `web/lib/api/index.ts`:
```typescript
export * as userAPI from "./user";
```

### 步骤 3:使用

```typescript
import * as userAPI from '@/lib/api/user';

const profile = await userAPI.getUserProfile();
```

---

## ✅ 最佳实践

1. **总是用 try-catch**:所有 API 调用都可能失败
2. **检查认证**:使用 `isAuthenticated()` 保护路由
3. **清除 token**:退出登录时用 `logout()`
4. **类型定义**:导出并使用类型(如 `Photo`)
5. **模块化导入**:用 `import * as` 保持命名空间清晰

---

## 🐛 常见问题

### Q: 报错 "Cannot find module '@/lib/api/auth'"
**A**: 检查 `tsconfig.json` 是否配置了路径别名:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Q: 所有请求都返回 401
**A**: 检查 token 是否正确保存:
```typescript
localStorage.getItem("token"); // 应该有值
```

### Q: 修改 API 函数后没生效
**A**: 重启 Next.js 开发服务器:
```bash
npm run dev
```

---

## 🎉 总结

- ✅ 模块化分离,职责清晰
- ✅ 类型安全,减少错误
- ✅ 统一错误处理
- ✅ 易于扩展和维护
- ✅ 符合 Go 的"好品味"哲学

Have fun coding! 🚀
