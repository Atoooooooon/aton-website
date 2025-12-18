# 改密码功能测试指南

## 📋 后端改动总结

### 1. 修复的安全问题

**❌ 修改前(不安全)**:
```go
type ChangePassRequest struct {
    Username    string `json:"username" binding:"required"`  // 危险!
    OldPassword string `json:"oldPassword" binding:"required"`
    NewPassword string `json:"newPassword" binding:"required"`
}
```
问题:任何人都可以通过传 username 改别人的密码!

**✅ 修改后(安全)**:
```go
type ChangePasswordRequest struct {
    OldPassword string `json:"oldPassword" binding:"required,min=6"`
    NewPassword string `json:"newPassword" binding:"required,min=6"`
}
```
改进:
- 删除 `username` 参数
- 从 JWT token 获取当前用户 ID
- 添加密码最小长度验证(6位)
- 检查新旧密码不能相同

### 2. 修改的文件

#### [api/internal/delivery/http/handler/user.go](../../api/internal/delivery/http/handler/user.go:50-94)
- 重命名:`ChangePassRequest` → `ChangePasswordRequest`
- 添加:从 JWT 获取 `userID`
- 添加:新旧密码相同检查
- 改进:错误消息更明确

#### [api/internal/usecase/auth_service.go](../../api/internal/usecase/auth_service.go:82-104)
- 重命名:`ChangePassword()` → `ChangePasswordByUserID()`
- 参数改变:从 `username` 改为 `userID`
- 改进:用 `db.First(&user, userID)` 按 ID 查询

#### [api/internal/server/server.go](../../api/internal/server/server.go:95-107)
- 添加:`/api/v1/user/change-password` 路由
- 应用:JWT 认证中间件
- 分组:User 路由组(独立于 Auth)

---

## 🚀 测试步骤

### 前提条件
1. 后端运行在 `http://localhost:8080`
2. 前端运行在 `http://localhost:3000`
3. 已有测试用户(username: `admin`, password: `password`)

### 测试 1:正常修改密码

```bash
# 1. 先登录获取 token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# 响应:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {...}
}

# 2. 用 token 修改密码
curl -X POST http://localhost:8080/api/v1/user/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "oldPassword": "password",
    "newPassword": "newpass123"
  }'

# 预期响应:
{
  "message": "Password changed successfully",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}

# 3. 用新密码登录验证
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "newpass123"}'

# 应该成功!
```

### 测试 2:旧密码错误

```bash
curl -X POST http://localhost:8080/api/v1/user/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "oldPassword": "wrongpass",
    "newPassword": "newpass123"
  }'

# 预期响应 401:
{
  "error": "Old password is incorrect"
}
```

### 测试 3:新密码太短

```bash
curl -X POST http://localhost:8080/api/v1/user/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "oldPassword": "password",
    "newPassword": "123"
  }'

# 预期响应 400:
{
  "error": "Password must be at least 6 characters"
}
```

### 测试 4:新旧密码相同

```bash
curl -X POST http://localhost:8080/api/v1/user/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "oldPassword": "password",
    "newPassword": "password"
  }'

# 预期响应 400:
{
  "error": "New password must be different from old password"
}
```

### 测试 5:未登录(无 token)

```bash
curl -X POST http://localhost:8080/api/v1/user/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "password",
    "newPassword": "newpass123"
  }'

# 预期响应 401:
{
  "error": "Unauthorized"
}
```

---

## 🎨 前端测试

### 1. 启动前端
```bash
cd /home/aton/IdeaProjects/atonWeb/web
npm run dev
```

### 2. 访问页面
打开浏览器:`http://localhost:3000/admin/change-password`

### 3. 测试流程
1. **未登录访问**:应该自动跳转到登录页
2. **登录后访问**:
   - 输入旧密码
   - 输入新密码(至少 6 位)
   - 确认新密码
   - 点击 "Change Password"
3. **成功后**:
   - 显示绿色成功提示
   - 2 秒后自动跳转到登录页
   - 需要用新密码重新登录

### 4. 测试错误场景
- ✅ 旧密码错误 → 显示 "Old password is incorrect"
- ✅ 新密码太短 → 显示 "Password must be at least 6 characters"
- ✅ 两次新密码不一致 → 显示 "New passwords do not match"
- ✅ 新旧密码相同 → 显示 "New password must be different from old password"

---

## 📁 新增文件

### 前端
- [web/app/admin/change-password/page.tsx](../../web/app/admin/change-password/page.tsx) - 改密码页面
- [web/lib/api.ts](../../web/lib/api.ts) - API 工具函数(可复用)

### 后端
无新增文件,只修改了 3 个现有文件。

---

## 🔑 API 参考

### POST /api/v1/user/change-password

**需要认证**:是(JWT token)

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "oldPassword": "string (min 6)",
  "newPassword": "string (min 6)"
}
```

**成功响应** (200):
```json
{
  "message": "Password changed successfully",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

**错误响应**:
- `400`:密码验证失败
- `401`:未认证或旧密码错误
- `500`:服务器错误

---

## ✅ 完成清单

- [x] 删除不安全的 `username` 参数
- [x] 从 JWT token 获取用户 ID
- [x] 添加密码长度验证(最小 6 位)
- [x] 检查新旧密码不能相同
- [x] 注册路由到 `/api/v1/user/change-password`
- [x] 应用 JWT 认证中间件
- [x] 前端创建改密码页面
- [x] 前端添加 API 工具函数
- [x] Photos 页面添加"修改密码"按钮
- [x] 后端编译测试通过

---

## 🎯 使用方式

### 方式 1:通过 UI
1. 登录后台:`http://localhost:3000/admin/login`
2. 点击右上角 "Change Password" 按钮
3. 填写表单并提交

### 方式 2:直接访问
访问:`http://localhost:3000/admin/change-password`

### 方式 3:通过 API
参考上面的 curl 命令。

---

## 📝 注意事项

1. **修改密码后需要重新登录**:前端会自动清除 token 并跳转到登录页
2. **密码最小长度是 6 位**:前后端都有验证
3. **新旧密码必须不同**:避免用户无意义的操作
4. **只能改自己的密码**:从 JWT token 获取用户 ID,无法改别人的密码

---

## 🐛 常见问题

### Q: 提示 "Unauthorized"
**A**: 检查是否已登录,token 是否有效。

### Q: 改密码后无法登录
**A**: 确认新密码是否输入正确,是否被浏览器自动填充旧密码。

### Q: 前端访问改密码页面报 404
**A**: 检查文件是否创建在正确位置:`web/app/admin/change-password/page.tsx`

### Q: 后端编译失败
**A**: 运行 `cd api && go mod tidy` 更新依赖。

---

## 🎉 测试完成后

记得把测试用的密码改回来:
```bash
# 旧密码: newpass123
# 新密码: password
```

或者创建一个新用户测试,不影响现有账号。
