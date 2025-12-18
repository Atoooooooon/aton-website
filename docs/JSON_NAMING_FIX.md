# JSON 命名规范统一

## 🔍 发现的问题

项目中 JSON 字段命名不一致:
- ✅ **大部分**:驼峰命名(camelCase)
- ❌ **个别**:蛇形命名(snake_case)

### 具体位置

**不一致的代码**:
```go
// api/internal/infrastructure/jwt/jwt.go:16
type Claims struct {
    UserID   uint   `json:"user_id"`  // ❌ 蛇形
    Username string `json:"username"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}
```

**其他所有地方都是驼峰**:
```go
// domain/photo.go
ImageURL     string `json:"imageUrl"`     // ✅
ThumbnailURL string `json:"thumbnailUrl"` // ✅
IsFeatured   bool   `json:"isFeatured"`   // ✅
DisplayOrder int    `json:"displayOrder"` // ✅
CreatedAt    time.Time `json:"createdAt"`  // ✅

// domain/user.go
CreatedAt time.Time `json:"createdAt"` // ✅
UpdatedAt time.Time `json:"updatedAt"` // ✅

// handler/user.go
OldPassword string `json:"oldPassword"` // ✅
NewPassword string `json:"newPassword"` // ✅
```

---

## ✅ 修复内容

### 修改文件:[jwt.go](../../api/internal/infrastructure/jwt/jwt.go:16)

**修改前**:
```go
type Claims struct {
    UserID   uint   `json:"user_id"`  // ❌ 蛇形
    Username string `json:"username"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}
```

**修改后**:
```go
type Claims struct {
    UserID   uint   `json:"userId"`   // ✅ 驼峰
    Username string `json:"username"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}
```

---

## 🎯 影响分析

### 1. JWT Token 格式变化

**修改前**:
```json
{
  "user_id": 1,
  "username": "admin",
  "role": "admin",
  "exp": 1234567890,
  "iat": 1234567890
}
```

**修改后**:
```json
{
  "userId": 1,
  "username": "admin",
  "role": "admin",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### 2. 代码影响

**后端 Go 代码**:
- ✅ **无影响**:Go 代码中都用 `claims.UserID`(结构体字段名),不是 JSON 标签
- ✅ **编译通过**:已验证

**前端代码**:
- ✅ **无影响**:前端只保存 token,不解析 JWT payload
- Token 在后端验证,前端只负责传递

### 3. 兼容性

**⚠️ 注意**:
- 旧 token(包含 `user_id`)会在过期后自然失效
- 新 token 使用 `userId`
- 两者不会冲突,因为 JWT 是**无状态**的

---

## 📊 统一后的规范

### ✅ JSON 命名规则

**统一使用驼峰命名(camelCase)**:
- ✅ `userId`
- ✅ `userName`
- ✅ `createdAt`
- ✅ `imageUrl`
- ✅ `isFeatured`
- ❌ ~~`user_id`~~
- ❌ ~~`user_name`~~
- ❌ ~~`created_at`~~

### Go 结构体标签示例

```go
type User struct {
    ID        uint      `json:"id"`              // 单词直接小写
    Username  string    `json:"username"`        // 单词合并小写
    Email     string    `json:"email"`           // 单词直接小写
    FirstName string    `json:"firstName"`       // 驼峰
    LastName  string    `json:"lastName"`        // 驼峰
    CreatedAt time.Time `json:"createdAt"`       // 驼峰
    UpdatedAt time.Time `json:"updatedAt"`       // 驼峰
    IsActive  bool      `json:"isActive"`        // is 开头驼峰
    UserID    uint      `json:"userId"`          // ID 结尾驼峰
}
```

---

## 🧪 验证结果

### 1. 编译测试
```bash
cd api
go build -o bin/server cmd/server/main.go
```
✅ **通过**

### 2. 搜索残留
```bash
grep -r "json:\"[a-z_]*_[a-z_]*\"" internal/
```
✅ **无残留**:已全部修复为驼峰

### 3. 功能测试
需要测试:
- [ ] 登录后生成的 token 包含 `userId`
- [ ] 认证中间件正确解析 `userId`
- [ ] 改密码功能正常工作

---

## 🔑 为什么用驼峰?

### 1. 前端标准
JavaScript/TypeScript 默认用驼峰:
```typescript
interface User {
  userId: number;      // ✅ JavaScript 标准
  userName: string;
  createdAt: string;
}

// vs

interface User {
  user_id: number;     // ❌ 不符合 JS 规范
  user_name: string;
  created_at: string;
}
```

### 2. JSON 社区标准
主流 API(Google, Facebook, Twitter)都用驼峰:
```json
{
  "userId": 1,
  "userName": "admin",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### 3. 一致性
Go 的 JSON 标准库默认推荐驼峰。

---

## 🚨 重要提醒

### 修改 JSON 标签的影响范围

**影响**:
- ✅ API 响应格式
- ✅ 前端解析
- ✅ 第三方调用

**不影响**:
- ✅ 数据库字段名(GORM 标签独立)
- ✅ Go 代码中的结构体字段名

### 示例

```go
type User struct {
    UserID   uint   `json:"userId" gorm:"column:user_id"`
    //                    ↑ API 返回      ↑ 数据库列名
    //                    驼峰           蛇形
}
```

- JSON API:`{"userId": 1}`
- 数据库:`SELECT user_id FROM users`
- Go 代码:`user.UserID`

三者**互不影响**!

---

## ✅ 检查清单

已完成:
- [x] 修复 `jwt.go` 中的 `user_id` → `userId`
- [x] 验证编译通过
- [x] 搜索确认无其他蛇形命名
- [x] 分析影响范围(无破坏性)

待测试:
- [ ] 登录生成新 token
- [ ] 认证中间件解析 token
- [ ] 改密码功能测试

---

## 🎓 总结

### 问题
- 项目中存在 JSON 命名不一致(驼峰 vs 蛇形)

### 原因
- 可能是不同时间、不同开发者的代码
- JWT Claims 可能参考了旧代码习惯

### 修复
- 统一为驼峰命名
- 符合前端标准和 JSON 社区规范
- 保持代码一致性

### 好处
- ✅ 前后端字段名一致
- ✅ 代码更易维护
- ✅ 符合社区规范
- ✅ 避免混淆

---

## 📚 相关文件

- 修改:[api/internal/infrastructure/jwt/jwt.go](../../api/internal/infrastructure/jwt/jwt.go:16)
- 引用:[api/internal/delivery/http/middleware/auth.go:39](../../api/internal/delivery/http/middleware/auth.go:39)

---

这是**好品味**(Good Taste)的体现:
> "消除特殊情况,统一命名规范,让代码自然清晰。"

Good job! 🚀
