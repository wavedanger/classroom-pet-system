// ===== 全局状态管理 Store（纯前端 localStorage 版）=====
// 数据存储于浏览器 localStorage，无需任何后端 / PHP / MySQL

const LS_KEYS = {
  students:    'pet_system_students_v1',
  tasks:       'pet_system_tasks_v1',
  teachers:    'pet_system_teachers_v1',
  inviteCodes: 'pet_system_invite_codes_v1',
  admin:       'pet_system_admin_account_v1',
};

function _nowStr() {
  return new Date().toLocaleString('zh-CN');
}

function _safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function _deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function _loadOrInit(key, initValue) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    const v = _deepClone(initValue);
    localStorage.setItem(key, JSON.stringify(v));
    return v;
  }
  const parsed = _safeJsonParse(raw, null);
  if (parsed == null) {
    const v = _deepClone(initValue);
    localStorage.setItem(key, JSON.stringify(v));
    return v;
  }
  return parsed;
}

function _save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function _normalizeStudent(s) {
  // 兼容历史字段缺失
  const st = {
    pointsLog: [],
    petStatus: { health: 100, hungry: 100, happy: 100, clean: 100 },
    backpack: {},
    petExp: 0,
    petStage: 0,
    petDead: false,
    petHatchProgress: 0,
    lastFedAt: null,
    buyDeduct: 0,
    dailyExpDate: null,
    dailyExpEarned: 0,
  };
  const out = { ...st, ...s };
  if (!out.backpack) out.backpack = {};
  if (!out.petStatus) out.petStatus = { health: 100, hungry: 100, happy: 100, clean: 100 };
  if (!out.pointsLog) out.pointsLog = [];
  return out;
}

function _getPetLevel(exp) {
  // 与后端版本保持一致（用于 stage 计算）
  // 经验阈值：与 js/data.js 的 GROWTH_STAGES 保持一致（按“一学年满级”节奏）
  const stages = [0,60,180,360,600,900,1260,1680,2160,2700,3300,3960,4680,5460,6300,7200,8160,9180,10020,10620,10800];
  for (let i = stages.length - 1; i >= 0; i--) {
    if (exp >= stages[i]) return i;
  }
  return 0;
}

function _todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const Store = {
  // ---- 状态（用 Vue.reactive 包裹，让 Vue 能追踪所有属性变化）----
  state: Vue.reactive({
    currentUser: null,
    students: [],
    tasks: [],
    toasts: [],
    toastTimer: null,
    inviteCodes: [],
    _initialized: false,
    taskRev: 0,      // 每次 tasks 刷新后递增，驱动老师端 computed 重新计算
    studentRev: 0,   // 每次 students 刷新后递增
  }),

  // ---- 初始化：从服务器拉取数据 ----
  async init() {
    // 纯前端：从 localStorage 读取；没有则用 data.js 中的初始值写入
    const students = _loadOrInit(LS_KEYS.students, INITIAL_STUDENTS).map(_normalizeStudent);
    const tasks = _loadOrInit(LS_KEYS.tasks, INITIAL_TASKS);
    const teachers = _loadOrInit(LS_KEYS.teachers, TEACHER_ACCOUNTS);
    const admin = _loadOrInit(LS_KEYS.admin, ADMIN_ACCOUNT);
    const inviteCodes = _loadOrInit(LS_KEYS.inviteCodes, INITIAL_INVITE_CODES);

    // 写回一次，保证字段补齐后的形态能持久化
    _save(LS_KEYS.students, students);
    _save(LS_KEYS.tasks, tasks);
    _save(LS_KEYS.teachers, teachers);
    _save(LS_KEYS.admin, admin);
    _save(LS_KEYS.inviteCodes, inviteCodes);

    this.state.students = students;
    this.state.tasks = tasks;
    this.state.inviteCodes = inviteCodes;
    this.state._initialized = true;
  },

  // ---- 刷新任务列表（学生端轮询用） ----
  async refreshTasks() {
    const tasks = _loadOrInit(LS_KEYS.tasks, INITIAL_TASKS);
    this.state.tasks = tasks;
    this.state.taskRev++;
  },

  // ---- 刷新学生列表 ----
  async refreshStudents() {
    const students = _loadOrInit(LS_KEYS.students, INITIAL_STUDENTS).map(_normalizeStudent);
    this.state.students = students;
    this.state.studentRev++;
  },

  // ---- 刷新单个学生 ----
  async refreshStudent(studentId) {
    const students = _loadOrInit(LS_KEYS.students, INITIAL_STUDENTS).map(_normalizeStudent);
    const s = students.find(x => x.id === studentId);
    if (!s) return;
    const idx = this.state.students.findIndex(x => x.id === studentId);
    if (idx >= 0) {
      this.state.students[idx] = s;
      this.state.students = [...this.state.students];
    }
  },

  // ---- 已废弃的 save()，保留空实现避免报错 ----
  save() {
    _save(LS_KEYS.students, this.state.students);
    _save(LS_KEYS.tasks, this.state.tasks);
    _save(LS_KEYS.inviteCodes, this.state.inviteCodes);
  },

  // ---- 登录 ----
  async login(username, password) {
    const u = String(username || '').trim();
    const p = String(password || '').trim();
    if (!u || !p) return { success: false, msg: '请输入账号和密码' };

    const admin = _loadOrInit(LS_KEYS.admin, ADMIN_ACCOUNT);
    if (u === admin.username && p === admin.password) {
      const user = { ...admin };
      this.state.currentUser = { ...user };
      return { success: true, role: 'admin', user };
    }

    const teachers = _loadOrInit(LS_KEYS.teachers, TEACHER_ACCOUNTS);
    const t = teachers.find(x => x.username === u && x.password === p);
    if (t) {
      const user = { ...t };
      this.state.currentUser = { ...user };
      return { success: true, role: 'teacher', user };
    }

    const students = _loadOrInit(LS_KEYS.students, INITIAL_STUDENTS).map(_normalizeStudent);
    const s = students.find(x => x.username === u && x.password === p);
    if (s) {
      this.state.currentUser = { id: s.id, role: 'student' };
      return { success: true, role: 'student', user: { ...s } };
    }

    return { success: false, msg: '账号或密码错误' };
  },

  // ---- 注册 ----
  async register(name, username, password, className, role, inviteCode) {
    const nm = String(name || '').trim();
    const un = String(username || '').trim();
    const pw = String(password || '').trim();
    const cls = String(className || '未分班').trim() || '未分班';
    const r = role || 'student';

    if (!nm || !un || !pw) return { success: false, msg: '姓名/账号/密码不能为空' };

    // teacher 注册需要邀请码（与 UI 的“邀请码”字段匹配）
    if (r === 'teacher') {
      const ok = await this.validateInviteCode(inviteCode || '');
      if (!ok) return { success: false, msg: '邀请码无效' };
    }

    if (r === 'student') {
      const students = _loadOrInit(LS_KEYS.students, INITIAL_STUDENTS).map(_normalizeStudent);
      if (students.some(x => x.username === un)) return { success: false, msg: '账号已存在' };
      const id = Date.now();
      const user = _normalizeStudent({
        id,
        name: nm,
        username: un,
        password: pw,
        role: 'student',
        class: cls,
        points: 0,
        petType: null,
        petName: null,
        petExp: 0,
        petStage: 0,
        petStatus: { health: 100, hungry: 100, happy: 100, clean: 100 },
        backpack: { apple: 3, soap: 2, ball: 1 },
        joinDate: _todayYmd(),
        pointsLog: [],
      });
      students.push(user);
      _save(LS_KEYS.students, students);
      this.state.students = students;
      this.state.currentUser = { id: user.id, role: 'student' };
      return { success: true, role: 'student', user };
    }

    if (r === 'teacher') {
      const teachers = _loadOrInit(LS_KEYS.teachers, TEACHER_ACCOUNTS);
      if (teachers.some(x => x.username === un)) return { success: false, msg: '账号已存在' };
      const user = {
        id: Date.now(),
        name: nm,
        username: un,
        password: pw,
        role: 'teacher',
        class: cls,
        avatar: '👩‍🏫',
        joinDate: _todayYmd(),
      };
      teachers.push(user);
      _save(LS_KEYS.teachers, teachers);
      this.state.currentUser = { ...user };
      return { success: true, role: 'teacher', user };
    }

    return { success: false, msg: '不支持的角色类型' };
  },

  // ---- 退出 ----
  logout() {
    this.state.currentUser = null;
  },

  // ---- 获取当前学生 ----
  getCurrentStudent() {
    if (!this.state.currentUser || this.state.currentUser.role !== 'student') return null;
    return this.state.students.find(s => s.id === this.state.currentUser.id);
  },

  // ---- 更新学生数据（通用） ----
  async updateStudent(id, updates) {
    const idx = this.state.students.findIndex(s => s.id === id);
    if (idx < 0) return;
    Object.assign(this.state.students[idx], updates);
    this.state.students[idx] = _normalizeStudent(this.state.students[idx]);
    this.state.students = [...this.state.students];
    _save(LS_KEYS.students, this.state.students);
  },

  // ---- 领取宠物 ----
  async adoptPet(studentId, petTypeId, petName) {
    const petType = PET_TYPES.find(p => p.id === petTypeId);
    if (!petType) return false;
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return false;
    student.petType = petTypeId;
    student.petName = (petName || petType.name || '').trim();
    student.petDead = false;
    student.petHatchProgress = 0;
    student.petExp = 0;
    student.petStage = 0;
    student.petStatus = { health: 100, hungry: 80, happy: 80, clean: 100 };
    student.lastFedAt = Date.now();
    this.state.students = [...this.state.students];
    _save(LS_KEYS.students, this.state.students);
    return true;
  },

  // ---- 内部：写积分日志（本地） ----
  _logPoints(student, delta, reason, icon) {
    if (!student.pointsLog) student.pointsLog = [];
    student.pointsLog.push({
      icon: icon || (delta > 0 ? '⭐' : '📉'),
      label: reason || (delta > 0 ? '获得积分' : '扣除积分'),
      delta,
      time: new Date().toLocaleString('zh-CN'),
      total: student.points,
    });
  },

  // ---- 添加积分（积分与宠物经验完全解耦，积分不再转化为宠物经验）----
  addPoints(studentId, pts, reason, icon) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return { levelUp: false };
    student.points = (student.points || 0) + pts;
    this._logPoints(student, pts, reason, icon);
    // 积分不再给宠物加经验，经验只通过喂食/洗澡/玩耍等护理行为获得
    return { levelUp: false };
  },

  // ---- 消耗积分（本地更新） ----
  spendPoints(studentId, pts) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student || student.points < pts) return false;
    student.points -= pts;
    return true;
  },

  // ---- 使用道具 ----
  async useItem(studentId, itemId) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return { success: false, msg: '学生不存在' };
    if (!student.backpack[itemId] || student.backpack[itemId] <= 0)
      return { success: false, msg: '背包中没有该道具！' };
    const item = ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, msg: '道具不存在' };

    // ===== 新增：状态满值检查（达到100时禁止使用对应道具）=====
    if (!student.petDead) {
      const status = student.petStatus || {};
      if (item.type === 'food' && (status.hungry || 0) >= 100) {
        return { success: false, msg: '宠物已经吃饱了！饱食度满值时不能再喂食 🍗' };
      }
      if (item.type === 'clean' && (status.clean || 0) >= 100) {
        return { success: false, msg: '宠物已经很干净了！清洁度满值时不需要洗澡 🛁' };
      }
      if (item.type === 'toy' && (status.happy || 0) >= 100) {
        return { success: false, msg: '宠物心情满溢了！心情值满值时不需要再玩耍 😊' };
      }
      if (item.type === 'heal' && (status.health || 0) >= 100) {
        return { success: false, msg: '宠物身体很健康！生命值满值时不需要治疗 ❤️' };
      }
    }
    // ===== 结束状态满值检查 =====

    // 本地扣道具
    student.backpack[itemId] = (student.backpack[itemId] || 0) - 1;
    if (student.backpack[itemId] <= 0) delete student.backpack[itemId];

    let levelUp = false;
    let newStage = student.petStage;
    let hatched = false;
    let hatchProgress = student.petHatchProgress || 0;
    let dailyExpFull = false;

    // 食物：死亡时做“复活孵化”；存活时正常增益并给经验
    if (item.type === 'food') {
      student.lastFedAt = Date.now();
      if (student.petDead) {
        hatchProgress += 1;
        student.petHatchProgress = hatchProgress;
        if (hatchProgress >= 3) {
          hatched = true;
          student.petDead = false;
          student.petHatchProgress = 0;
          student.petExp = 0;
          student.petStage = 0;
          student.petStatus = { health: 100, hungry: 80, happy: 80, clean: 100 };
        }
      }
    }

    // 存活状态下才应用属性增减
    if (!student.petDead) {
      const status = student.petStatus || { health: 100, hungry: 100, happy: 100, clean: 100 };
      const eff = item.effect || {};

      // 应用状态变化
      for (const k of ['health', 'hungry', 'happy', 'clean']) {
        if (eff[k] == null) continue;
        status[k] = Math.max(0, Math.min(100, (status[k] || 0) + eff[k]));
      }
      student.petStatus = status;

      // 经验：仅在“护理行为”（food/clean/toy/heal）时给；每日上限 DAILY_EXP_LIMIT
      const today = _todayYmd();
      if (student.dailyExpDate !== today) {
        student.dailyExpDate = today;
        student.dailyExpEarned = 0;
      }
      const expGain = 10; // 每次护理固定 +10（简单直观）
      if ((student.dailyExpEarned || 0) >= DAILY_EXP_LIMIT) {
        dailyExpFull = true;
      } else {
        const canGain = Math.min(expGain, DAILY_EXP_LIMIT - (student.dailyExpEarned || 0));
        student.dailyExpEarned = (student.dailyExpEarned || 0) + canGain;
        const beforeLevel = _getPetLevel(student.petExp || 0);
        student.petExp = (student.petExp || 0) + canGain;
        const afterLevel = _getPetLevel(student.petExp || 0);
        if (afterLevel > beforeLevel) {
          levelUp = true;
          newStage = afterLevel;
          student.petStage = afterLevel;
        }
      }
    }

    this.state.students = [...this.state.students];
    _save(LS_KEYS.students, this.state.students);
    const expMsg = dailyExpFull ? '（今日经验已达上限，明天再来照料吧！）' : '';
    return { success: true, levelUp, newStage, hatched, hatchProgress: student.petHatchProgress || hatchProgress, item, expMsg };
  },

  // ---- 购买道具 ----
  async buyItem(studentId, itemId) {
    const item = ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, msg: '道具不存在' };
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return { success: false, msg: '学生不存在' };
    if (student.points < item.cost) return { success: false, msg: `积分不足，需要${item.cost}积分` };

    // 扣积分 + 加道具
    student.points -= item.cost;
    student.backpack[itemId] = (student.backpack[itemId] || 0) + 1;
    student.buyDeduct = (student.buyDeduct || 0) + item.cost;
    this._logPoints(student, -item.cost, `购买道具「${item.name}」`, '🛒');
    this.state.students = [...this.state.students];
    _save(LS_KEYS.students, this.state.students);
    return { success: true, item };
  },

  // ---- 提交任务 ----
  async submitTask(taskId, studentId, content) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return { success: false, msg: '任务不存在' };
    if (task.status && task.status !== 'active') return { success: false, msg: '任务已关闭' };

    if (!task.submissions) task.submissions = [];
    const existing = task.submissions.find(s => s.studentId === studentId);
    if (existing && existing.status !== 'rejected') return { success: false, msg: '已提交过该任务' };

    if (existing) {
      existing.status = 'submitted';
      existing.content = content;
      existing.submittedAt = _nowStr();
      existing.resubmitted = true;
      delete existing.reviewedAt;
    } else {
      task.submissions.push({ studentId, status: 'submitted', submittedAt: _nowStr(), content });
    }
    this.state.tasks = [...this.state.tasks];
    _save(LS_KEYS.tasks, this.state.tasks);
    return { success: true };
  },

  // ---- 重新提交任务 ----
  async resubmitTask(taskId, studentId, content) {
    return this.submitTask(taskId, studentId, content);
  },

  // ---- 教师审核任务 ----
  async reviewTask(taskId, studentId, approved) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return false;
    if (!task.submissions) task.submissions = [];
    const sub = task.submissions.find(s => s.studentId === studentId);
    if (!sub) return false;

    sub.status = approved ? 'completed' : 'rejected';
    sub.reviewedAt = _nowStr();
    this.state.tasks = [...this.state.tasks];
    _save(LS_KEYS.tasks, this.state.tasks);

    if (approved) {
      const pts = Number(task.points || 0);
      const student = this.state.students.find(s => s.id === studentId);
      if (student) {
        student.points = (student.points || 0) + pts;
        student._lastGrantReason = `完成任务「${task.title}」获得奖励`;
        this._logPoints(student, pts, `完成任务「${task.title}」`, task.icon || '📝');
        this.state.students = [...this.state.students];
        _save(LS_KEYS.students, this.state.students);
      }
      return { levelUp: false };
    }
    return true;
  },

  // ---- 发布任务 ----
  async createTask(taskData) {
    const id = Date.now();
    const createdAt = _nowStr();
    const task = {
      id,
      title: taskData.title,
      desc: taskData.desc || '',
      points: Number(taskData.points || 0),
      icon: taskData.icon || '📝',
      subject: taskData.subject || '',
      deadline: taskData.deadline || '',
      status: 'active',
      createdBy: Number(taskData.createdBy || 0),
      createdAt,
      submissions: [],
    };
    this.state.tasks.push(task);
    this.state.tasks = [...this.state.tasks];
    _save(LS_KEYS.tasks, this.state.tasks);
    return task;
  },

  // ---- 删除任务 ----
  async deleteTask(taskId) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== taskId);
    _save(LS_KEYS.tasks, this.state.tasks);
  },

  // ---- 添加学生（教师端） ----
  async addStudent(studentData) {
    const name = String(studentData?.name || '').trim();
    const username = String(studentData?.username || '').trim();
    const password = String(studentData?.password || '').trim();
    const cls = String(studentData?.class || '未分班').trim() || '未分班';
    if (!name || !username || !password) return { success: false, msg: '姓名/账号/密码不能为空' };
    if (this.state.students.some(s => s.username === username)) return { success: false, msg: '账号已存在' };

    const id = Date.now();
    const student = _normalizeStudent({
      id, name, username, password, role: 'student', class: cls,
      points: 0,
      petType: null, petName: null, petExp: 0, petStage: 0,
      petStatus: { health: 100, hungry: 100, happy: 100, clean: 100 },
      backpack: { apple: 3, soap: 2, ball: 1 },
      joinDate: _todayYmd(),
      pointsLog: [],
    });
    this.state.students.push(student);
    this.state.students = [...this.state.students];
    _save(LS_KEYS.students, this.state.students);
    return { success: true, student };
  },

  // ---- 删除学生 ----
  async deleteStudent(studentId) {
    this.state.students = this.state.students.filter(s => s.id !== studentId);
    // 同步删除任务提交记录
    for (const t of this.state.tasks) {
      if (Array.isArray(t.submissions)) {
        t.submissions = t.submissions.filter(x => x.studentId !== studentId);
      }
    }
    this.state.tasks = [...this.state.tasks];
    _save(LS_KEYS.students, this.state.students);
    _save(LS_KEYS.tasks, this.state.tasks);
  },

  // ---- 手动发放积分 ----
  async grantPoints(studentId, pts, reason) {
    const reasonStr = reason || `老师奖励了 ${pts} 积分`;
    const student = this.state.students.find(s => s.id === studentId);
    if (student) student._lastGrantReason = reasonStr;
    if (student) {
      student.points = (student.points || 0) + Number(pts || 0);
      this._logPoints(student, Number(pts || 0), reasonStr, '🎁');
      this.state.students = [...this.state.students];
      _save(LS_KEYS.students, this.state.students);
    }
    return { levelUp: false };
  },

  // ---- 扣除积分 ----
  async deductPoints(studentId, pts, reason) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return { success: false, msg: '学生不存在' };
    const p = Math.max(0, Number(pts || 0));
    const deducted = Math.min(p, Number(student.points || 0));
    student.points = Math.max(0, Number(student.points || 0) - p);
    this._logPoints(student, -deducted, reason || `老师扣除了 ${deducted} 积分`, '📉');
    this.state.students = [...this.state.students];
    _save(LS_KEYS.students, this.state.students);
    return { success: true, deducted };
  },

  // ---- 重置演示数据 ----
  async resetDemo() {
    localStorage.removeItem(LS_KEYS.students);
    localStorage.removeItem(LS_KEYS.tasks);
    localStorage.removeItem(LS_KEYS.teachers);
    localStorage.removeItem(LS_KEYS.inviteCodes);
    localStorage.removeItem(LS_KEYS.admin);
    await this.init();
  },

  // ========= 管理员专用方法 =========

  async getTeachers() {
    return _loadOrInit(LS_KEYS.teachers, TEACHER_ACCOUNTS);
  },

  async deleteTeacher(teacherId) {
    const teachers = _loadOrInit(LS_KEYS.teachers, TEACHER_ACCOUNTS);
    const next = teachers.filter(t => t.id !== teacherId);
    _save(LS_KEYS.teachers, next);
    return { success: true };
  },

  async resetTeacherPassword(teacherId, newPassword) {
    const teachers = _loadOrInit(LS_KEYS.teachers, TEACHER_ACCOUNTS);
    const t = teachers.find(x => x.id === teacherId);
    if (!t) return { success: false, msg: '教师不存在' };
    t.password = String(newPassword || '').trim();
    _save(LS_KEYS.teachers, teachers);
    return { success: true };
  },

  async getInviteCodes() {
    const codes = _loadOrInit(LS_KEYS.inviteCodes, INITIAL_INVITE_CODES);
    this.state.inviteCodes = codes;
    return codes;
  },

  async addInviteCode(code, note) {
    const c = String(code || '').trim().toUpperCase();
    if (!c) return { success: false, msg: '邀请码不能为空' };
    const codes = _loadOrInit(LS_KEYS.inviteCodes, INITIAL_INVITE_CODES);
    if (codes.some(x => x.code === c)) return { success: false, msg: '邀请码已存在' };
    codes.push({ code: c, note: String(note || ''), used: false, createdAt: _todayYmd() });
    _save(LS_KEYS.inviteCodes, codes);
    await this.getInviteCodes();
    return { success: true };
  },

  async removeInviteCode(code) {
    const c = String(code || '').trim().toUpperCase();
    const codes = _loadOrInit(LS_KEYS.inviteCodes, INITIAL_INVITE_CODES);
    const next = codes.filter(x => x.code !== c);
    _save(LS_KEYS.inviteCodes, next);
    this.state.inviteCodes = next;
    return { success: true };
  },

  async validateInviteCode(code) {
    const codes = await this.getInviteCodes();
    return codes.some(c => c.code === String(code || '').trim().toUpperCase());
  },

  async resetStudentPassword(studentId, newPassword) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return { success: false, msg: '学生不存在' };
    student.password = String(newPassword || '').trim();
    this.state.students = [...this.state.students];
    _save(LS_KEYS.students, this.state.students);
    return { success: true };
  },

  async nukeAll() {
    await this.resetDemo();
  },

  async updateAdminAccount(username, password) {
    const admin = _loadOrInit(LS_KEYS.admin, ADMIN_ACCOUNT);
    admin.username = String(username || '').trim() || admin.username;
    admin.password = String(password || '').trim() || admin.password;
    _save(LS_KEYS.admin, admin);
    return { success: true };
  },

  // ---- Toast通知 ----
  toast(msg, type = 'info') {
    const id = Date.now();
    this.state.toasts.push({ id, msg, type });
    setTimeout(() => {
      this.state.toasts = this.state.toasts.filter(t => t.id !== id);
    }, 3000);
  },

  // ---- 宠物状态自然衰减（由前端随机间隔调用，45~90分钟一次）----
  // tick 规则（每次随机）：hungry -2~5/次, happy -1~3/次, clean -1~3/次
  // hungry<30 或 clean<30 时 health -2~4/次（最低1）
  async tickPetStatus(studentId) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student || student.petDead) return null;

    const st = student.petStatus || { health: 100, hungry: 100, happy: 100, clean: 100 };
    const dec = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    st.hungry = Math.max(0, (st.hungry || 0) - dec(2, 5));
    st.happy  = Math.max(0, (st.happy  || 0) - dec(1, 3));
    st.clean  = Math.max(0, (st.clean  || 0) - dec(1, 3));

    if (st.hungry < 30 || st.clean < 30) {
      st.health = Math.max(1, (st.health || 0) - dec(2, 4));
    }
    student.petStatus = st;
    this.state.students = [...this.state.students];
    _save(LS_KEYS.students, this.state.students);

    const sick = (st.health < 30) || (st.hungry < 20) || (st.clean < 20);
    return { sick };
  },

  // ---- 离线惩罚检测（登录时触发）----
  // 阶梯积分扣减：24h→-10, 48h→-30, 72h→-60, 96h→-100, 120h→-150, 144h→-200, 168h(7天)→死亡+清零
  async checkDailyPenalty(studentId) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return null;

    const lastFed = student.lastFedAt;
    if (!lastFed) return null;
    const hours = Math.floor((Date.now() - Number(lastFed)) / (1000 * 60 * 60));
    if (hours < 24) return null;

    // 阶梯惩罚
    const steps = [
      { h: 24,  p: 10 },
      { h: 48,  p: 30 },
      { h: 72,  p: 60 },
      { h: 96,  p: 100 },
      { h: 120, p: 150 },
      { h: 144, p: 200 },
    ];
    const daysMissed = Math.floor(hours / 24);

    // 7天：死亡 + 积分清零
    if (hours >= 168) {
      const pointLost = Number(student.points || 0);
      student.points = 0;
      student.petDead = true;
      student.petHatchProgress = 0;
      this._logPoints(student, -pointLost, '长时间未喂食，宠物回到蛋状态，积分清零', '💀');
      this.state.students = [...this.state.students];
      _save(LS_KEYS.students, this.state.students);
      return { died: true, hoursMissed: hours, pointLost };
    }

    // 取当前应扣罚的最大档位
    let pointPenalty = 0;
    for (const s of steps) {
      if (hours >= s.h) pointPenalty = s.p;
    }
    const before = Number(student.points || 0);
    const newPoints = Math.max(0, before - pointPenalty);
    student.points = newPoints;
    this._logPoints(student, -(Math.min(pointPenalty, before)), `长时间未喂食惩罚 -${pointPenalty} 积分`, '⏳');
    this.state.students = [...this.state.students];
    _save(LS_KEYS.students, this.state.students);
    return { died: false, hoursMissed: hours, daysMissed, pointPenalty, newPoints };
  },

  // ---- 喂食（已由 useItem 处理，保留兼容） ----
  async feedPet(studentId) {
    return { ok: true };
  },
};

// ===== 初始化（异步，会被 app.js 中的 mounted 等待） =====
Store.init();
