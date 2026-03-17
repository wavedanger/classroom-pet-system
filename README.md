# 🐾 课堂电子宠物系统 classroom-pet-system

> 🥚 把学习变成养宠物！学生完成课堂任务赚积分 → 购买道具 → 养成专属宠物，教师端一键管理任务与积分，附班级排行榜，让每节课都充满成就感。

---

## 📸 项目截图

### 登录页面
<!-- 请将登录页截图放于此处 -->
![登录页面](./screenshots/登录页面.png)

---

### 学生端 · 主页
<!-- 请将学生主页截图放于此处 -->
![学生主页](./screenshots/学生主页.png)

---

### 学生端 · 宠物页
<!-- 请将宠物页截图放于此处 -->
![宠物页面](./screenshots/宠物页面.png)

---

### 学生端 · 任务页
<!-- 请将任务页截图放于此处 -->
![任务页面](./screenshots/任务页面.png)

---

### 学生端 · 排行榜
<!-- 请将排行榜截图放于此处 -->
![排行榜](./screenshots/排行榜.png) 

---

### 教师端
<!-- 请将教师端截图放于此处 -->
![教师端](./screenshots/教师端.png)

---

### 任务管理
<!-- 请将任务管理截图放于此处 -->
![任务管理](./screenshots/任务管理.png)

---

## ✨ 功能特色

| 模块 | 功能说明 |
|------|----------|
| 🥚 宠物孵化 | 新生学生选择宠物种类、起名、完成孵化流程 |
| 🐾 宠物养成 | 宠物拥有生命、饱食、心情、清洁四维状态，会随时间衰减 |
| 🎮 道具系统 | 用积分在商店购买食物、清洁、玩具、医疗等道具并使用 |
| ✨ 成长升级 | 宠物拥有多个成长阶段，经验值积累后自动升级并更换形象 |
| 💀 死亡复活 | 长期未喂食宠物将变回蛋，累计喂食 3 次可重新孵化 |
| 📋 任务系统 | 教师发布学习任务，学生提交后由教师审核，通过即得积分 |
| ⭐ 积分系统 | 完成任务获得积分，支持教师手动发放/扣除，记录详细明细 |
| 🏆 排行榜 | 班级积分排行榜，前三名领奖台特殊展示 |
| 🎒 背包系统 | 查看已有道具数量，支持分类筛选与直接使用 |
| 👩‍🏫 教师端 | 任务发布与管理、提交审核（通过/驳回）、手动积分操作 |
| 🛡️ 管理员端 | 账号管理、班级管理等系统配置 |
| 📱 响应式设计 | 移动端友好，适配课堂平板/手机场景 |

---

## 🏗️ 项目结构

```
classroom-pet-system/
├── index.html                 # 入口文件
├── api/                       # （已停用）历史 PHP 接口目录：当前离线版不会请求它
├── styles/
│   ├── main.css               # 主样式（布局、组件、主题色）
│   └── animations.css         # 动画效果（宠物浮动、升级特效等）
└── js/
    ├── data.js                # 静态数据（宠物类型、道具配置、初始账号）
    ├── store.js               # 全局状态管理（localStorage 持久化、业务逻辑）
    ├── app.js                 # Vue 根应用、路由与 Toast 通知
    └── components/
        ├── login.js           # 登录页组件
        ├── student.js         # 学生端全部页面（主页/宠物/任务/排行/背包）
        ├── teacher.js         # 教师端组件
        └── admin.js           # 管理员端组件
```

---

## 🚀 快速开始

本项目为**纯前端静态页面（离线版）**，无需安装任何依赖，开箱即用。

- **数据存储**：浏览器 `localStorage`（同一台电脑、同一浏览器内持久化）
- **不依赖**：PHP / MySQL / Node / 打包构建工具

### 方式一：直接打开

```bash
# 克隆仓库
git clone https://github.com/你的用户名/classroom-pet-system.git

# 直接用浏览器打开
open pet-system/index.html
```

> ⚠️ 部分浏览器对本地 `file://` 协议有限制，推荐使用方式二。

### 方式二：本地服务器（推荐）

```bash
# 使用 VS Code 的 Live Server 插件打开 index.html
# 或使用 Python 快速启动：
cd classroom-pet-system
python -m http.server 8080
# 浏览器访问 http://localhost:8080
```

---

## 👥 默认账号

> 注意：首次打开会把 `js/data.js` 的初始数据写入 `localStorage`。之后的修改会继续写在 `localStorage` 中，**仅修改 `js/data.js` 不会自动覆盖你浏览器里已有的数据**（见下方“数据维护”）。

| 角色 | 账号 | 密码 | 说明 |
|------|------|------|------|
| 管理员 | `admin` | `admin123` | 系统管理、账号配置 |
| 教师 | `teacher01` | `123456` | 任务管理、积分操作 |
| 学生 | `student01` | `123456` | 养宠物、做任务 |

> 💡 具体初始账号/学生列表/任务列表可在 `js/data.js` 中查看和修改。

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vue 3](https://vuejs.org/) | 3.x CDN | 前端框架（无构建工具） |
| CSS3 | - | 自定义样式与动画 |
| localStorage | - | 本地数据持久化 |

> 本项目刻意保持**零构建工具**依赖，适合课堂演示与学习场景，一个 HTML 文件即可运行。

---

## 📦 数据维护（非常重要）

本项目是**离线版**：所有“学生/教师/任务/邀请码/管理员账号”都会持久化在浏览器 `localStorage`。

### 1) 初始数据从哪里来？

- **初始数据来源**：`js/data.js`
  - `INITIAL_STUDENTS`：初始学生列表
  - `INITIAL_TASKS`：初始任务列表
  - `TEACHER_ACCOUNTS`：初始教师账号
  - `ADMIN_ACCOUNT`：管理员账号
  - `INITIAL_INVITE_CODES`：邀请码池

### 2) 我改了 `js/data.js`，为什么页面里没变化？

因为：**页面只会在首次打开（localStorage 为空）时，把 `js/data.js` 写入 localStorage**。之后你看到的一切都来自 localStorage。

要让改动生效，你有两种方式：

- **方式 A（推荐）**：在页面里使用“重置演示数据”（如果你开启了管理员入口）
- **方式 B（通用）**：清空 localStorage（开发者工具）
  - 打开浏览器开发者工具（F12）
  - 找到 Application / 应用 → Storage → Local Storage → 当前站点
  - 删除对应键，或清空整个站点存储
  - 刷新页面，系统会重新从 `js/data.js` 导入初始数据

### 3) localStorage 存了哪些键？（方便排查/备份）

在 `js/store.js` 中定义：

- `pet_system_students_v1`
- `pet_system_tasks_v1`
- `pet_system_teachers_v1`
- `pet_system_invite_codes_v1`
- `pet_system_admin_account_v1`

### 4) 如何备份/迁移数据到另一台电脑？

- **备份**：在开发者工具控制台执行：

```js
const dump = {
  students: localStorage.getItem('pet_system_students_v1'),
  tasks: localStorage.getItem('pet_system_tasks_v1'),
  teachers: localStorage.getItem('pet_system_teachers_v1'),
  inviteCodes: localStorage.getItem('pet_system_invite_codes_v1'),
  admin: localStorage.getItem('pet_system_admin_account_v1'),
};
console.log(dump);
```

把输出保存为文本即可（这些值本质是 JSON 字符串）。

- **恢复**：在目标浏览器控制台执行（把字符串替换成你的备份内容）：

```js
localStorage.setItem('pet_system_students_v1',   '...');
localStorage.setItem('pet_system_tasks_v1',      '...');
localStorage.setItem('pet_system_teachers_v1',   '...');
localStorage.setItem('pet_system_invite_codes_v1','...');
localStorage.setItem('pet_system_admin_account_v1','...');
location.reload();
```

> 提示：恢复后如果页面异常，优先尝试清空 localStorage 再重新导入。

## 🎮 玩法说明

### 学生端流程

```
登录 → 选择宠物 & 起名 → 孵化完成
  ↓
完成老师布置的任务 → 提交 → 等待审核
  ↓
审核通过 → 获得积分 → 商店购买道具
  ↓
使用道具照料宠物 → 经验值提升 → 宠物升级 🎉
```

### 教师端流程

```
登录 → 发布任务（设置标题/描述/积分/截止日期）
  ↓
查看学生提交 → 审核通过 / 驳回
  ↓
手动发放或扣除积分（可备注原因）
```

---

## 📦 数据说明

所有数据通过 `localStorage` 在本地浏览器中持久化保存，**无需后端服务器**。

- 清除浏览器缓存 = 数据重置为初始状态
- 不同浏览器/设备之间数据不共享
- 如需多设备同步，可考虑接入后端或云存储（本项目暂不包含）

---

## 🤝 贡献 & 反馈

欢迎提交 Issue 或 Pull Request！

- 🐛 发现 Bug？请提 [Issue](../../issues)
- 💡 有新功能建议？也欢迎讨论

---

## 📄 License

[MIT](./LICENSE) © 2026
