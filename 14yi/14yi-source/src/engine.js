// ===== 人生引擎 v2 =====
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sigm = x => 1 / (1 + Math.exp(-x));
const logit = p => { p = clamp(p, 1e-4, 1 - 1e-4); return Math.log(p / (1 - p)); };
const GM_C = 0.088, GM_A = 0.00028;
const B_CACHE = new Map();
function solveB(target, imr, c14) {
  // 分桶缓存：寿命0.5岁一档，婴儿死亡率按对数约10%一档
  target = Math.round(target * 2) / 2;
  const ib = Math.round(Math.log(imr) * 10), cb = Math.round(Math.log(c14) * 10);
  imr = Math.exp(ib / 10); c14 = Math.exp(cb / 10);
  const key = target + "|" + ib + "|" + cb;
  let b = B_CACHE.get(key); if (b) return b;
  const e0 = B => { let l = 1, e = 0; for (let x = 0; x < 120; x++) { const q = qGM(x, B, imr, c14, 1); const d = l * q; e += l - d * (x === 0 ? 0.9 : 0.5); l -= d; } return e; };
  let lo = Math.log(1e-8), hi = Math.log(5e-1);
  for (let k = 0; k < 44; k++) { const m = (lo + hi) / 2; if (e0(Math.exp(m)) > target) lo = m; else hi = m; }
  b = Math.exp((lo + hi) / 2); B_CACHE.set(key, b); return b;
}
function qGM(x, B, imr, c14, mult) {
  if (x === 0) return imr;
  if (x < 5) return c14 / 4;
  const mu = GM_A + B * Math.exp(GM_C * x) * (x > 85 ? 1 + 0.06 * (x - 85) ** 1.5 : 1);
  return 1 - Math.exp(-mu * mult);
}

// 职业表：m 收入倍数，s 个人波动，formal 有职工养老金，white 白领，soe 国企/单位
const JOBS = {
  公社社员: { m: .5 }, 务农: { m: .55 }, 知青: { m: .4 }, 乡镇企业工人: { m: .8 },
  国营厂工人: { m: .95, formal: 1, soe: 1 }, 单位职工: { m: 1.0, formal: 1, soe: 1 }, 售货员: { m: .8, formal: 1, soe: 1 }, 干部: { m: 1.2, formal: 1 },
  工厂工人: { m: .9 }, 建筑工人: { m: 1.05 }, 服务员: { m: .72 }, 保安: { m: .75 }, 保姆: { m: .85 }, 厨师: { m: .95 }, 理发师: { m: .85, s: .5 },
  司机: { m: 1.0 }, 快递员: { m: 1.0 }, 外卖骑手: { m: 1.0 }, 网约车司机: { m: .95 }, 个体户: { m: 1.1, s: .6 }, 小老板: { m: 1.9, s: .8 },
  网店店主: { m: 1.0, s: .8 }, 主播: { m: 1.0, s: 1.3 }, 文员: { m: .85, white: 1 }, 销售: { m: 1.0, s: .5 }, 技术员: { m: 1.05, formal: 1 }, 技工: { m: 1.0 },
  护士: { m: 1.0, formal: 1 }, 幼师: { m: .72 }, 会计: { m: 1.0, white: 1 }, 设计师: { m: 1.1, white: 1, s: .5 }, 教培老师: { m: 1.2, white: 1 },
  公司职员: { m: 1.2, white: 1 }, 工程师: { m: 1.6, white: 1, formal: 1 }, 程序员: { m: 1.95, white: 1 }, 教师: { m: 1.12, formal: 1 }, 医生: { m: 1.55, formal: 1 },
  金融从业者: { m: 2.1, s: .6, white: 1 }, 律师: { m: 1.8, s: .6, white: 1 }, 记者: { m: 1.0, white: 1 }, "高校/科研人员": { m: 1.35, formal: 1 },
  公务员: { m: 1.3, formal: 1 }, 军人: { m: 1.1, formal: 1 }, 游戏策划: { m: 1.7, white: 1 }, 运动员: { m: 1.2, s: 1 }, 画家: { m: .8, s: 1.2 },
  作家: { m: .8, s: 1.2 }, 演员: { m: 1.0, s: 1.5 },
};
const NAMES_ERA = [
  [1950, ["建国", "建华", "国庆", "志强", "德明", "国华", "卫国", "振华"], ["秀英", "桂英", "秀兰", "玉兰", "淑珍", "凤英", "玉珍", "桂兰"]],
  [1960, ["建军", "卫东", "红兵", "建平", "爱国", "跃进", "国强", "建新"], ["红梅", "丽华", "建红", "秀珍", "卫红", "红霞", "玉梅", "春梅"]],
  [1970, ["伟", "勇", "军", "强", "斌", "刚", "海涛", "建军"], ["丽", "静", "燕", "敏", "艳", "霞", "丹", "红"]],
  [1980, ["磊", "涛", "鹏", "超", "杰", "浩", "帅", "鑫"], ["婷", "娜", "敏", "静", "丹丹", "晶晶", "倩", "慧"]],
  [1990, ["浩", "宇", "俊杰", "子豪", "浩然", "鑫", "宇航", "志鹏"], ["欣", "雪", "婷婷", "佳琪", "雨欣", "思雨", "梦瑶", "欣怡"]],
  [2000, ["浩然", "梓轩", "宇轩", "浩宇", "皓轩", "俊熙", "子豪", "一鸣"], ["欣怡", "梓涵", "雨涵", "诗涵", "可馨", "子涵", "思涵", "梦琪"]],
  [2010, ["子轩", "浩宇", "宇轩", "梓睿", "奕辰", "一诺", "宇泽", "沐阳"], ["梓涵", "一诺", "欣怡", "子涵", "语桐", "依诺", "可馨", "雨桐"]],
  [2020, GIVEN_M, GIVEN_F],
];
const HOBBY_PAIRS = [["篮球", "画画"], ["足球", "音乐"], ["下棋", "跳舞"], ["游戏", "看书"]];
const PET_NAMES = ["煤球", "橘子", "大黄", "馒头", "可乐", "豆豆", "旺财", "咪咪"];

class Life {
  constructor(seed, opts = {}) {
    this.seed = seed >>> 0;
    this.r = mulberry32(this.seed);
    this.opts = Object.assign({ heavy: true, auto: false, y0: new Date().getFullYear() }, opts);
    this.y0 = this.opts.y0;
    this.age = 0; this.alive = true; this.done = false;
    this.log = []; this.pending = null; this.resolved = {}; this.memo = {};
    this.cities = []; this.earn = 0; this.wealth = 0; this.jobs = [];
    this.kids = []; this.flags = {}; this.fired = {};
    this.mult = 1; this.effort = 0; this.inSchool = false; this.edu = null;
    this._new = []; this._carry = null;
    this._birth();
  }
  // ---------- 随机工具 ----------
  u() { return this.r(); }
  chance(p) { return this.r() < p; }
  norm(m = 0, s = 1) { const u = 1 - this.r(), v = this.r(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  pois(l) { let k = 0, p = Math.exp(-l), s = p; const x = this.r(); while (x > s && k < 12) { k++; p *= l / k; s += p; } return k; }
  pick(arr) { return arr[Math.floor(this.r() * arr.length)]; }
  wpick(pairs) {
    let t = 0; for (const [, w] of pairs) t += Math.max(0, w);
    let x = this.r() * t;
    for (const [it, w] of pairs) { x -= Math.max(0, w); if (x <= 0) return it; }
    return pairs[pairs.length - 1][0];
  }
  get year() { return this.y0 + this.age; }
  get P() { return PROVS[this.prov]; }
  get L() { return PROVS[this.loc.p]; }
  get abroad() { return !!this.loc.abroad; }
  ev(text, tag, src, extra) {
    const e = Object.assign({ age: this.age, year: this.year, text, tag, src }, extra || {});
    this.log.push(e); this._new.push(e); return e;
  }
  nominal(real, y = this.year) { return real * interp(TS.price, y); }

  // ---------- 出生 ----------
  _birth() {
    const y = this.y0;
    this.prov = this.wpick(PROVS.map(p => [p.i, p.births]));
    const P = this.P;
    this.urban = this.chance(sigm(logit(interp(TS.urb, y)) + logit(P.urb) - logit(.679)));
    this.sex = this.chance(NAT.srb / (100 + NAT.srb)) ? "M" : "F";
    const era = [...NAMES_ERA].reverse().find(e => y >= e[0]) || NAMES_ERA[0];
    this.surname = this.wpick(SURNAMES);
    this.name = this.surname + this.pick(this.sex === "M" ? era[1] : era[2]);
    const z = this.norm(0, 1); this.fam = sigm(z * 1.7);
    this.apt = this.norm(0, 1); this.risk = this.u(); this.hlth = this.norm(0, 1); this.luck = this.norm(0, 1);
    // 先天气质：一部分来自冒险倾向和天资，一部分随机；稳定性决定一生变不变
    this.pers = { ei: this.norm(0, .38) + (this.risk - .5) * .4, sn: this.norm(-.18, .38) + this.apt * .1, tf: this.norm(this.sex === "F" ? .14 : -.14, .38), jp: this.norm(-.06, .38) + (this.risk - .5) * .3 };
    this.core = { ...this.pers };
    this.stab = Math.pow(this.u(), .75);
    this.pLog = []; this.mbti = [];
    const city = this.urban ? this.wpick(P.cities.map((c, k) => [c, k === 0 ? 3 : 1.5])) : this.pick(P.cities);
    this.home = { p: P.i, city, urban: this.urban };
    this.loc = { ...this.home };
    this.cities.push(city);
    // 兄弟姐妹（按年代）
    const u = this.urban;
    if (y < 1972) { this.older = Math.min(5, this.pois(u ? 1.3 : 1.9)); this.younger = Math.min(5, this.pois(u ? 1.0 : 1.6)); }
    else if (y < 1980) { this.older = Math.min(3, this.pois(u ? .6 : 1.2)); this.younger = Math.min(3, this.pois(u ? .3 : .8)); }
    else if (y < 2016) { this.older = u ? (this.chance(.1) ? 1 : 0) : this.wpick([[0, 48], [1, 42], [2, 10]]); this.younger = this.chance(u ? .05 : .3) ? 1 : 0; }
    else { this.older = this.wpick(u ? [[0, 52], [1, 38], [2, 10]] : [[0, 38], [1, 42], [2, 20]]); this.younger = this.older === 0 ? (this.chance(u ? .25 : .35) ? 1 : 0) : (this.chance(.06) ? 1 : 0); }
    // 家庭收入（实际值，按当年折算）
    const base = this.urban ? P.uInc : P.rInc;
    this.famRealInc = base * interp(TS.inc, y) * Math.exp(0.6 * z - 0.18);
    // 留守
    const migEra = interp(TS.mig, y + 4);
    this.leftBehind = !this.urban && migEra > .3 && this.chance(clamp(0.06 + 1.5 * P.outRate, 0.05, 0.42) * (migEra / 1.2) * (this.fam < 0.7 ? 1.15 : 0.6));
    // 父母
    this.fatherAge = Math.round(clamp(this.norm(y < 1980 ? 28 : y < 2000 ? 26.5 : 30, 4), 19, 50));
    this.motherAge = Math.round(clamp(this.fatherAge - 2 + this.norm(0, 2), 18, 45));
    this.fatherDie = this._parentDeath("M", this.fatherAge) - this.fatherAge;
    this.motherDie = this._parentDeath("F", this.motherAge) - this.motherAge;
    this.smoker = false;
    this.leOff = (P.le - NAT.le20) + (this.sex === "F" ? 2.75 : -2.75) + (this.fam - 0.5) * 3 + this.hlth * 1.2 + 0.2;
    this.pf = Math.exp(0.12 * (NAT.le20 - P.le));
    { const ub = interp(TS.urb, y), den = ub * .75 + (1 - ub) * 1.4; this.uf = (this.urban ? .75 : 1.4) / den; }

    const place = this.urban
      ? (P.cities.length === 1 ? `${P.name}市区` : `${P.name}${city}市`)
      : (P.ruralArea ? `${P.name}${P.ruralArea}的一个村子` : `${P.name}${city}下面的一个村子`);
    this.place = place;
    const nb = BIRTHS_BY_YEAR[y] || NAT.births25;
    this.ev(`${y}年，你出生在${place}。是个${this.sex === "M" ? "男孩" : "女孩"}，家里给你取名叫${this.name}。`, "birth", SRC.births23,
      { fact: `这一年全国大约出生了${nb}万人。每${Math.round(1 / P.share)}个新生儿里，有1个出生在${P.name}。` });
    const sibs = [];
    if (this.older) sibs.push(`上面有${cn(this.older)}个哥哥姐姐`);
    if (!this.older) sibs.push("你是家里的第一个孩子");
    let famT;
    if (this.fam < 0.12) famT = "家里欠着债，日子过得很紧";
    else if (this.fam < 0.4) famT = this.urban ? "父母收入不高" : (y < 1980 ? "家里靠挣工分过日子" : "父母靠种地和打零工维持家里开销");
    else if (this.fam < 0.75) famT = "家里条件普通，不愁吃穿";
    else if (this.fam < 0.94) famT = "家里条件不错";
    else famT = "家境相当优渥";
    const avgNom = this.nominal((this.urban ? NAT.uInc : NAT.rInc) * interp(TS.inc, y), y);
    this.ev(`${sibs.join("，")}。${famT}，家里人均年收入大约${fmtYuan(this.nominal(this.famRealInc, y))}。`, "family", y >= 2023 ? SRC.inc23 : "按国家统计局历年数据折算",
      { fact: `那一年全国${this.urban ? "城镇" : "农村"}居民人均收入大约${fmtYuan(avgNom)}。` });
  }
  _parentDeath(sex, curAge) {
    const by = this.y0 - curAge; const P = this.P;
    const off = (P.le - NAT.le20) + (sex === "F" ? 2.75 : -2.75) + (this.urban ? 0.6 : -1.2);
    let x = curAge;
    while (x < 112) {
      const yy = by + x; const imr = interp(TS.imr, yy);
      const B = solveB(interp(TS.le, yy) + off, imr, imr * .4);
      let q = qGM(x, B, imr, imr * .4, 1) + this._extraQ(x, yy, P.name, this.urban);
      if (this.chance(q)) return x;
      x++;
    }
    return x;
  }
  // 饥荒、大地震、疫情等额外死亡风险
  _extraQ(x, y, prov, urban) {
    let e = 0;
    if (y >= 1959 && y <= 1961) {
      const pf = nz({ 四川: 2.6, 安徽: 2.6, 贵州: 2.2, 甘肃: 2.0, 河南: 1.8, 湖南: 1.5, 青海: 1.5, 山东: 1.3, 广西: 1.3, 云南: 1.0, 湖北: 1.0, 北京: .2, 天津: .2, 上海: .2 }[prov], .6);
      e += 0.009 * pf * (urban ? .25 : 1) * (x < 5 || x >= 60 ? 2.5 : 1) * (y === 1960 ? 1.4 : .8);
    }
    if (y === 1976 && prov === "河北") e += .004;
    if (y === 2008 && prov === "四川") e += .0008;
    if (y === 2023) e += x >= 75 ? .01 : x >= 60 ? .002 : 0;
    return e;
  }
  _q(x, y, mult) {
    const imr = clamp(interp(TS.imr, y) * this.pf * this.uf * (this.fam < .2 ? 1.25 : 1), .0008, .3);
    const c14 = imr * (y < 1975 ? .45 : .35);
    const urbOff = this.loc.urban || this.abroad ? .9 : -1.7;
    const B = solveB(interp(TS.le, y) + this.leOff + urbOff + (this.abroad ? 1.5 : 0), imr, c14);
    return Math.min(1, qGM(x, B, imr, c14, mult) + (this.abroad ? 0 : this._extraQ(x, y, this.L.name, this.loc.urban)));
  }
  _extraCause(x, y) {
    const pn = this.L.name;
    if (!this.abroad && y >= 1959 && y <= 1961 && !this.loc.urban) return "饥荒";
    if (!this.abroad && y === 1976 && pn === "河北") return "唐山大地震";
    if (!this.abroad && y === 2008 && pn === "四川" && this.chance(.4)) return "汶川地震";
    if (y === 2023 && x >= 60 && this.chance(.5)) return "新冠肺炎";
    return null;
  }
  // ---------- 性格 ----------
  plast(a = this.age) { return a < 10 ? .03 : a <= 18 ? .13 : a <= 21 ? .1 : a <= 30 ? .13 : a <= 50 ? .014 : .008; }
  _p(axis, d, why) { this.pers[axis] = clamp(this.pers[axis] + d, -1.3, 1.3); this.pLog.push({ age: this.age, axis, d, why }); }
  pe(key, scale = 1) { const fx = PFX[key]; if (!fx) return; const k = scale * (this.age < 30 ? 1 : .7) * (.5 + (1 - this.stab)); for (const [ax, d] of fx[0]) this._p(ax, d * k, fx[1]); }
  _persYear() {
    const a = this.age, y = this.year, f = this.flags;
    const k = .4 + 1.3 * (1 - this.stab);
    for (const ax of AX) {
      const n = this.norm(0, this.plast() * k);
      this.pers[ax] = clamp(this.pers[ax] + n + (this.core[ax] - this.pers[ax]) * (a > 30 ? .06 : .03) * this.stab, -1.3, 1.3);
    }
    if (a >= 3 && a <= 15) {
      const c = .55 * k;
      if (!this.home.urban) this._p("sn", -.018 * c, "在村里长大"); else this._p("sn", .01 * c, "在城里长大");
      if (this.fam < .3) { this._p("sn", -.014 * c, "家里穷"); this._p("tf", -.008 * c, "家里穷"); }
      if (this.fam > .85) this._p("sn", .012 * c, "家境优渥");
      if (this.older + this.younger >= 2) this._p("ei", .014 * c, "兄弟姐妹多");
      else if (this.older + this.younger === 0 && this.home.urban) this._p("ei", -.008 * c, "独生子女");
      if (y < 1977) this._p("jp", -.012 * c, "那个年代的集体生活");
      const hb = { 篮球: ["ei", .025], 足球: ["ei", .025], 跳舞: ["ei", .022], 画画: ["sn", .025], 音乐: ["tf", .022], 下棋: ["tf", -.025], 看书: ["sn", .025], 游戏: ["jp", .02] }[this.hobby];
      if (hb) this._p(hb[0], hb[1] * c, `喜欢${this.hobby}`);
      if (this.hobby === "看书" || this.hobby === "下棋") this._p("ei", -.012 * c, `喜欢${this.hobby}`);
      if (this.leftBehind && a >= 2) { this._p("ei", -.02 * c, "留守的童年"); this._p("tf", -.008 * c, "留守的童年"); }
    }
    if (this.job && !this.retired && JOB_P[this.job]) {
      const c = (a <= 32 ? 1.2 : .3) * k;
      for (const [ax, d] of Object.entries(JOB_P[this.job])) this._p(ax, d * c, `做${this.job}的这些年`);
    }
    if (a === 30) this.core = { ...this.pers }; // 三十岁以后，性格以这时的自己为锚点
    if (a > 30) this._p("jp", -.004, "年纪渐长");
    if (a > 50) this._p("tf", .0025, "年纪渐长");
    if (a > 55) this._p("ei", -.004, "年纪渐长");
    // 三个快照：中学、工作几年后、离世前
    const s2 = clamp(f.firstJobAge != null ? f.firstJobAge + 3 : 27, 25, 30);
    if (a === 14) this._snap(0);
    if (a === s2 && this.mbti.length === 1) this._snap(1);
  }
  _snap(i) {
    const type = mbtiOf(this.pers);
    const prev = this.mbti[this.mbti.length - 1];
    const from = prev ? prev.age : 0;
    const seg = this.pLog.filter(l => l.age >= from && l.age <= this.age);
    const why = [];
    const axes = prev ? AX.filter((ax, j) => type[j] !== prev.type[j]) : [...AX].sort((p, q) => Math.abs(this.pers[q]) - Math.abs(this.pers[p])).slice(0, 2);
    for (const ax of axes) {
      const dir = Math.sign(this.pers[ax]) || 1;
      const agg = {};
      for (const l of seg) if (l.axis === ax && Math.sign(l.d) === dir) agg[l.why] = (agg[l.why] || 0) + Math.abs(l.d);
      const top = Object.entries(agg).sort((p, q) => q[1] - p[1])[0];
      why.push({ ax, word: AXW[ax][dir > 0 ? 1 : 0], by: top && top[1] > .025 ? top[0] : null });
    }
    const snap = { age: this.age, year: this.year, type, why, pers: { ...this.pers }, i };
    this.mbti.push(snap);
    if (this.opts.auto && this.opts.quiet) return;
    const label = ["上中学时", "工作几年后", "走到最后"][i];
    let t;
    if (!prev) t = `${label}，如果用MBTI描述，你是${type}（${MBTI_NAME[type]}）。` + (why.length ? `你身上最明显的是${why.map(w => w.word + (w.by ? `（${w.by}）` : "")).join("、")}。` : "");
    else if (prev.type === type) t = `${label}，你还是${type}（${MBTI_NAME[type]}），${i === 2 ? "这辈子都没怎么变" : `和${prev.age}岁时一样`}。`;
    else t = `${label}，你从${prev.type}变成了${type}（${MBTI_NAME[type]}）。` + why.map(w => w.by ? `${w.by}让你更${w.word}` : `你慢慢变得更${w.word}`).join("，") + "。";
    this.ev(t, "pers", null, { mbti: type, prevMbti: prev ? prev.type : null });
  }
  targetLE() { return interp(TS.le, this.y0) + this.leOff + (this.home.urban ? .9 : -1.7); }
  ageMult(x) {
    let m = this.mult;
    if (x >= 35) {
      const sp = this.sex === "M" ? interp(TS.smokeM, this.y0) : .03;
      m *= this.smoker ? (this.sex === "M" ? 1.35 : 1.8) / (sp * 1.35 + (1 - sp) * .75) : .75 / (sp * 1.35 + (1 - sp) * .75);
    }
    if (this.flags.htn) m *= 1.08;
    if (this.flags.dm) m *= 1.15;
    if (this.flags.stroke) m *= 1.3;
    return m;
  }
  survProb(from, to, multFn) {
    let l = 1;
    for (let x = from; x < to; x++) l *= 1 - this._q(x, this.y0 + x, multFn(x));
    return l;
  }

  // ---------- 主循环 ----------
  step() {
    this._new = this._carry || []; this._carry = null;
    if (this.done) return { events: [], done: true };
    if (this.pending) return { events: this._new, choice: this.pending };
    if (!this._yearDone) { this._year(); this._yearDone = true; }
    if (this.alive && (this._cy !== this.age || this._cn < 2)) {
      const c = this._choiceAt();
      if (c) {
        if (this._cy !== this.age) { this._cy = this.age; this._cn = 0; }
        this._cn++;
        if (this.opts.auto) this.choose(c.id, this.wpick(c.options.map((o, k) => [k, o.auto])), true);
        else { this.pending = c; return { events: this._new, choice: c }; }
      }
    }
    if (this.alive) {
      const q = this._q(this.age, this.year, this.ageMult(this.age));
      if (this.chance(q)) this._die();
    }
    this._yearDone = false;
    if (this.alive) this.age++;
    else this.done = true;
    return { events: this._new, done: this.done };
  }
  choose(id, k, inline) {
    const c = this.pending && this.pending.id === id ? this.pending : null;
    if (!c && !inline) return;
    const ch = c || this._lastChoice;
    if (!inline) this._new = [];
    this.resolved[id] = (this.resolved[id] || 0) + 1;
    this.flags["last_" + id] = this.age;
    this.pending = null;
    ch.options[k].apply();
    if (!inline) this._carry = this._new;
  }
  runToEnd() { let g = 0; while (!this.done && g++ < 400) this.step(); return this; }

  // ---------- 抉择 ----------
  _choiceAt() {
    for (const c of CHOICES) {
      const n = this.resolved[c.id] || 0;
      if (n && !c.repeat) continue;
      if (n && c.repeat && (this.age - nz(this.flags["last_" + c.id], -99) < c.repeat)) continue;
      if (!c.when(this)) continue;
      const mk = c.id + "@" + this.age;
      if (this.memo[mk] === undefined) this.memo[mk] = this.chance(c.p ? c.p(this) : 1);
      if (!this.memo[mk]) continue;
      const built = {
        id: c.id, age: this.age, title: typeof c.title === "function" ? c.title(this) : c.title, prompt: c.prompt(this),
        note: c.note ? c.note(this) : null, src: c.src || null,
        options: c.opts.map((o, k) => ({ label: typeof o.label === "function" ? o.label(this) : o.label, odds: o.odds ? o.odds(this) : "", auto: (o.auto ? o.auto(this) : .5) * (k === 0 && RISKY.has(c.id) ? Math.exp(.6 * (this.pers.ei + this.pers.jp)) : 1), apply: () => o.fx(this) })),
      };
      this._lastChoice = built;
      return built;
    }
    return null;
  }

  // ---------- 学业 ----------
  eduOff(effort = this.effort) {
    const y0 = this.y0;
    const sexOff = this.sex === "F" ? (y0 < 1970 ? -.6 : y0 < 1985 ? -.3 : y0 < 1995 ? 0 : .15) : 0;
    return .8 * this.apt + .7 * Math.log(this.P.colIdx) + (this.home.urban ? .5 : -.3) * (y0 < 1990 ? 1.5 : 1) + 1.4 * (this.fam - .5)
      + sexOff + .35 * effort - (this.leftBehind ? .3 : 0) - (this.flags.crush ? .15 : 0) - .1;
  }
  pHigh(effort) { return sigm(logit(interp(TS.hsCont, this.y0)) + this.eduOff(effort)); }
  pCollege(effort) {
    const y0 = this.y0;
    const pathT = interp(TS.junior, y0) * interp(TS.hsCont, y0) * interp(TS.gen, y0);
    return sigm(logit(clamp(interp(TS.college, y0) / pathT, .02, .95)) + this.eduOff(effort) * 1.1 + (this.flags.retake ? .25 : 0));
  }
  startAge() { return this.y0 < 1985 ? 7 : 6; }

  // ---------- 工作与收入 ----------
  jobPool(edu, loc, y) {
    edu = edu || "小学";
    const rural = !loc.urban, M = this.sex === "M", low = ["未上学", "小学", "初中"].includes(edu), mid = ["高中", "中专", "中职"].includes(edu);
    const col = ["专科", "本科", "硕士", "博士"].includes(edu);
    const h = this.hobby, maj = this.flags.major;
    let p;
    if (y < 1978) {
      if (rural) p = [["公社社员", 90], ["单位职工", mid ? 10 : 2]];
      else p = col ? [["干部", 30], ["工程师", 25], ["教师", 25], ["医生", 15], ["高校/科研人员", 5]] : [["国营厂工人", 55], ["单位职工", 20], ["售货员", 10], ["干部", mid ? 10 : 2], ["教师", mid ? 8 : 0]];
    } else if (y < 1992) {
      if (rural && low) p = [["务农", 62], ["乡镇企业工人", 20], ["个体户", 8], ["建筑工人", M ? 10 : 1]];
      else if (low || (mid && rural)) p = [["国营厂工人", 40], ["单位职工", 12], ["售货员", 10], ["个体户", 14], ["司机", M ? 8 : 1], ["厨师", 5], ["乡镇企业工人", rural ? 15 : 3]];
      else if (mid) p = [["技术员", 25], ["干部", 18], ["教师", 18], ["护士", M ? 0 : 14], ["会计", 10], ["国营厂工人", 15]];
      else p = [["干部", 28], ["工程师", 25], ["教师", 20], ["医生", maj === "hot" ? 14 : 8], ["高校/科研人员", 8], ["记者", h === "看书" ? 6 : 2]];
    } else {
      if (rural && low && !this.flags.migrant) p = [["务农", y < 2005 ? 50 : 30], ["建筑工人", M ? 18 : 2], ["工厂工人", 18], ["服务员", 12], ["个体户", 8]];
      else if (low) p = [["工厂工人", 35], ["建筑工人", M ? 20 : 2], ["服务员", 15], ["保安", M ? 6 : 0], ["保姆", M ? 0 : 6], ["个体户", 9], ["厨师", 5], ["快递员", y >= 2008 ? 6 : 0], ["外卖骑手", y >= 2015 ? (M ? 12 : 2) : 0], ["网约车司机", y >= 2015 && M ? 5 : 0], ["国营厂工人", y < 2000 ? 15 : 0]];
      else if (mid) p = [["工厂工人", 22], ["文员", 14], ["技工", M ? 12 : 3], ["销售", 13], ["个体户", 10], ["服务员", 10], ["会计", 6], ["理发师", 3], ["网店店主", y >= 2006 ? 4 : 0], ["外卖骑手", y >= 2015 ? (M ? 6 : 1) : 0], ["快递员", y >= 2008 ? 4 : 0], ["主播", y >= 2016 ? 1 : 0], ["护士", M ? 0 : 5]];
      else if (edu === "专科") p = [["文员", 20], ["销售", 18], ["技术员", 15], ["会计", 10], [M ? "技工" : "护士", 10], ["幼师", M ? 1 : 6], ["设计师", h === "画画" ? 10 : 3], ["教培老师", y >= 2010 && y <= 2021 ? 5 : 0], ["网店店主", y >= 2006 ? 3 : 0], ["主播", y >= 2016 ? 2 : 0]];
      else {
        const hot = maj === "hot";
        p = [["公司职员", 26], ["工程师", hot ? 16 : 10], ["程序员", y >= 1998 ? (hot ? 16 : 6) * (h === "游戏" ? 1.5 : 1) : 0], ["教师", hot ? 6 : 14], ["销售", 8], ["医生", hot ? 7 : 3],
          ["金融从业者", y >= 1995 ? (hot ? 8 : 3) : 0], ["律师", 3], ["记者", h === "看书" ? 6 : 2], ["设计师", h === "画画" ? 8 : 2], ["教培老师", y >= 2010 && y <= 2021 ? 5 : 0],
          ["游戏策划", y >= 2008 && h === "游戏" ? 6 : y >= 2008 ? .6 : 0], ["高校/科研人员", ["硕士", "博士"].includes(edu) ? 14 : 1]];
        if (edu === "博士") p.push(["高校/科研人员", 30]);
      }
    }
    return p;
  }
  pickJob(loc) { return this.wpick(this.tilt(this.jobPool(this.edu, loc || this.loc, this.year))); }
  tilt(pool) {
    return pool.map(([j, w]) => { let m = 1; for (const [ax, s, js] of JOB_TILT) if (js.includes(j)) m *= Math.exp(.6 * s * this.pers[ax]); return [j, w * m]; });
  }
  _jobIncome(job, loc, age, y = this.year) {
    const J = JOBS[job] || { m: 1 };
    let base;
    if (loc.abroad) base = 150000;
    else { const L = PROVS[loc.p]; base = (["务农", "公社社员", "知青"].includes(job) ? L.rInc * 1.5 : L.uInc * 1.6) * (TIER1.has(loc.city) ? 1.2 : 1); }
    const curve = age < 22 ? 0.65 : age < 35 ? 0.65 + (age - 22) * 0.027 : age < 48 ? 1.0 + (age - 35) * 0.005 : Math.max(0.6, 1.06 - (age - 48) * 0.022);
    const edu = { 硕士: 1.12, 博士: 1.25 }[this.edu] || 1;
    return base * J.m * curve * edu * (this.indiv || 1) * (this.boost || 1) * interp(TS.inc, y);
  }
  _setJob(job, loc, quiet) {
    const prev = this.job;
    if (this.flags.firstJobAge == null && !["知青", "公社社员", "军人"].includes(job)) this.flags.firstJobAge = this.age;
    this.job = job; if (!this.jobs.includes(job)) this.jobs.push(job);
    if (loc) this._moveTo(loc);
    const s = (JOBS[job] && JOBS[job].s) || .33;
    this.indiv = Math.exp(this.norm(0, s) + (this.fam - 0.5) * 0.3 + .1 * this.apt);
    return prev;
  }
  _destProv() {
    const P = this.P;
    const od = OUTFLOW_DEST[P.name];
    const pairs = []; let used = 0;
    if (od) for (const [k, v] of Object.entries(od)) { pairs.push([PI[k], v]); used += v; }
    const rest = Math.max(P.out - used, P.out * 0.15);
    const others = Object.entries(INFLOW).filter(([k]) => k !== P.name && !(od && od[k]));
    const inSum = others.reduce((s, [, v]) => s + v, 0);
    for (const [k, v] of others) pairs.push([PI[k], rest * v / inSum]);
    return this.wpick(pairs);
  }
  _bigDest() {
    const w = [["北京", 22], ["上海", 22], ["广东", 26], ["浙江", 12], ["江苏", 10], ["四川", 4], ["湖北", 3], ["陕西", 2]].filter(([k]) => PI[k] !== this.home.p);
    return PI[this.wpick(w)];
  }
  _cityIn(p, big) {
    const L = PROVS[p];
    if (DEST_CITY[L.name]) return this.wpick(DEST_CITY[L.name]);
    return big ? L.cities[0] : this.wpick(L.cities.map((c, k) => [c, k === 0 ? 3 : 1]));
  }
  _moveTo(loc) {
    if (loc.abroad) this.loc = { p: this.home.p, abroad: loc.abroad, city: loc.city, urban: true };
    else this.loc = { p: loc.p, city: loc.city || this._cityIn(loc.p, true), urban: loc.urban !== false };
    if (!this.cities.includes(this.loc.city)) this.cities.push(this.loc.city);
  }
  _goHome() { this._moveTo({ p: this.home.p, city: this.home.city, urban: true }); this.flags.returned = true; }
  houseValue(y = this.year) {
    const h = this.house; if (!h) return 0;
    if (h.flat) return h.price;
    const k = { 1: 1, 2: .75, 3: .55 }[h.tier];
    return h.price * Math.pow(interp(TS.hpi, y) / interp(TS.hpi, h.y), k);
  }
  housePrice(city, y) { // 当年的实际总价（90平米）
    const t = cityTier(city); const per = { 1: 60000, 2: 18000, 3: 8000 }[t];
    return per * 90 * Math.pow(interp(TS.hpi, y), { 1: 1, 2: .75, 3: .55 }[t]);
  }

  // ---------- 每年 ----------
  _year() {
    const a = this.age, y = this.year, f = this.flags, P = this.P;
    const sa = this.startAge(), d = f.delay || 0;

    // 留守
    if (a === 2 && this.leftBehind) {
      const dP = this.chance(clamp(P.outRate * 4, .15, .85)) ? PROVS[this._destProv()] : P;
      this.ev(`父母去${dP.i !== P.i ? dP.name : P.cities[0]}打工了。你留在村里跟着爷爷奶奶长大，一年见他们一两次，大多是在春节。`, "family", P.outRate > .1 ? SRC.c7 : SRC.model,
        { fact: P.outRate > .1 ? `${P.name}有${P.out}万人在外省工作，是外出务工人数最多的省份之一。` : "父母外出务工、自己留在老家的孩子，被称为留守儿童。" });
    }
    if (this.leftBehind && a === 2) this.pe("leftBehind");
    if (this.leftBehind && a === 11 && this.chance(.35)) this.ev("父母回到了老家，不再出去了。", "family");
    // 小学
    if (a === sa) {
      const p = sigm(logit(interp(TS.prim, this.y0)) - (this.sex === "F" && !this.home.urban && this.y0 < 1975 ? .9 : 0) + (this.fam - .5) * 1.2);
      if (this.chance(p)) {
        this.inSchool = true; this.edu = "小学";
        let t;
        if (this.home.urban && this.fam > .85 && y >= 2000) t = "家里买了学区房，你进了区里最好的小学。";
        else if (this.home.urban) t = "你上了家附近的小学。";
        else if (y < 1980) t = "你上了大队的小学，教室是土坯房，课桌是一块木板。";
        else if (y < 2001) t = "你上了村小，一个老师教好几个年级。";
        else t = this.chance(.5) ? "你上了镇上的小学，每天走二十分钟的路。" : "你上了村里的小学。几年后村小撤并，你转到了镇上读书。";
        this.ev(t, "edu");
      } else {
        this.edu = "未上学"; f.stopAt = a;
        this.ev(this.sex === "F" && !this.home.urban && this.y0 < 1985 ? "家里说女孩子读书没用，你没有上学，在家带弟弟妹妹、干农活。" : this.y0 < 1985 ? "家里穷，你没能上学。" : "家里出了变故，你没能按时上学，后来也就没再进学校。", "edu", "按历年小学入学率估算");
      }
    }
    // 初中
    if (a === sa + 6 && this.edu === "小学") {
      const p = interp(TS.junior, this.y0) / interp(TS.prim, this.y0);
      if (this.chance(sigm(logit(clamp(p, .05, .995)) + (this.fam - .5) * 1.2 + .3 * this.apt))) { this.edu = "初中"; this.ev(this.home.urban ? "你上了初中。" : y < 1985 ? "你考上了公社的初中。" : "你去镇上读初中，开始住校。", "edu"); }
      else { this.inSchool = false; this.ev("小学毕业后，你就不再读书了。", "edu"); f.stopAt = a; }
    }
    // 高中阶段
    if (a === 15 + d && this.edu === "初中" && this.inSchool) {
      if (f.zz === "zz") {
        if (this.chance(.75 * sigm(this.eduOff() + 1))) { this.edu = "中专"; f.zzOK = true; this.ev("你考上了中专。全家都很高兴，三年后你就能端上“铁饭碗”，户口也能转成城镇户口。", "edu"); }
        else { this.edu = "初中"; this.inSchool = false; f.stopAt = a; this.ev("中专没考上，你没有再读书。", "edu"); }
      } else if (this.chance(this.pHigh(this.effort))) {
        if (this.chance(interp(TS.gen, this.y0) / .9)) { this.edu = "高中"; this.ev(this.home.urban ? "你考上了普通高中。" : "你考上了县城的高中，开始住校。", "edu", y >= 2020 ? SRC.edu24 : null, y >= 2020 ? { fact: `2024年普通高中招生${NAT.hs}万人，中职招生${NAT.vs}万人。` } : null); }
        else { this.edu = "中职"; this.ev(`你去了一所${y < 2000 ? "职业高中" : "中等职业学校"}，学${this.pick(["数控", "电子商务", "汽修", "护理", "会计", "计算机", "烹饪", "电工"])}。`, "edu"); }
      } else if (y >= 1978 && !f.retakeHS) {
        f.failHS = true; // 交给“复读”抉择
      } else { this.inSchool = false; f.stopAt = a; this.ev(f.retakeHS ? "复读了一年，还是没考上高中。你不再读书了。" : "你没考上高中，初中毕业就不再读书了。", "edu"); }
    }
    // 中专/中职毕业
    if (a === 18 + d && ["中专", "中职"].includes(this.edu) && this.inSchool) {
      this.inSchool = false;
      if (this.edu === "中专" && y < 2000) {
        const job = this.wpick([["技术员", 30], ["教师", 25], ["干部", 20], [this.sex === "F" ? "护士" : "会计", 15], ["会计", 10]]);
        const p = this.home.p, city = PROVS[p].cities[0] === this.home.city ? this.home.city : this.pick([this.home.city, PROVS[p].cities[0]]);
        this._setJob(job, { p, city, urban: true });
        this.ev(`中专毕业，你被分配到${city}当${job}，户口转成了城镇户口。`, "work");
        this.home = { ...this.home }; f.hukouOut = true;
      } else f.stopAt = a;
    }
    // 高考
    const gkAge = 18 + d;
    if (a === gkAge && this.edu === "高中" && this.inSchool && !f.gkDone) {
      if (y >= 1966 && y <= 1976) {
        this.inSchool = false; f.gkDone = true;
        if (y >= 1972 && this.chance(.04 * sigm(this.apt))) { this._admit("本科", "工农兵大学"); }
        else { f.stopAt = a; this.ev("高中毕业了，可是那几年没有高考。", "edu"); }
      } else if (this.chance(this.pCollege(this.effort))) {
        f.gkDone = true;
        const bach = this.chance(sigm(logit(.5) + .6 * this.apt + .3 * this.effort));
        this._admit(bach ? "本科" : "专科");
      } else if (!f.retake && y >= 1977) { f.failGK = true; }
      else { f.gkDone = true; this.inSchool = false; f.stopAt = a; this.ev(f.retake ? "复读了一年，还是没考上。你不再读书了。" : "高考落榜了。你没有再读书。", "edu"); }
    }
    // 大学毕业
    if (f.colEnd === a) {
      this.inSchool = false;
      this.edu = f.colEdu;
      if (this.edu === "本科" && !["工农兵"].includes(this.uniTier)) f.needGrad = true;
      else if (y >= 1995) f.needTizhi = true;
      else this._firstJob();
    }
    // 兜底：未处理的待决状态
    if (f.pendUni && a > f.admitAge) { this._goUni(false); f.pendMajor = false; }
    if (f.failHS && a > 15 + d) { f.failHS = false; this.inSchool = false; f.stopAt = a; }
    if (f.failGK && a > gkAge) { f.failGK = false; f.gkDone = true; this.inSchool = false; f.stopAt = a; }
    // 退伍
    if (f.armyEnd === a) {
      f.army = false;
      if (y < 1998 && this.chance(.7)) { const j = this.pick(["单位职工", "国营厂工人", "公务员", "司机"]); this._setJob(j, { p: this.home.p, city: this.home.urban ? this.home.city : this.P.cities[0], urban: true }); this.ev(`你退伍了，被安置到${this.loc.city}当${j}。`, "work"); }
      else { this.job = null; this._goHome(); if (!this.home.urban) this.loc.urban = false; this.ev("你退伍回了老家。", "work"); f.stopAt = a; f.enterDone = false; }
    }
    if (f.army && y === 1979 && !f.war79 && this.chance(.25)) {
      f.war79 = true; this.ev("你所在的部队开赴了南疆前线。", "era");
      if (this.chance(.04)) { this._die("战争"); return; }
    }
    if (f.gradEnd === a) {
      this.inSchool = false; this.edu = f.gradEdu;
      if (f.gradEdu === "硕士" && ["985", "211"].includes(this.uniTier) && this.chance(.12)) { f.gradEdu = "博士"; f.gradEnd = a + 4; this.inSchool = true; this.ev("硕士毕业后，你继续读博。", "edu"); }
      else { this.ev(f.gradEdu === "博士" ? "你博士毕业了。" : "你硕士毕业了。", "edu"); this._firstJob(); }
    }

    // 上山下乡
    if (y >= 1968 && y <= 1976 && a >= 16 && a <= 21 && this.home.urban && !this.inSchool && !this.job && !f.zhiqing && !this.abroad && !f.colEnd) {
      if (this.chance(.75)) { f.zhiqing = a; f.enterDone = true; f.zqPending = true; }
    }
    if (f.zqPending && a > f.zhiqing) this._sendDown(false);
    if (f.zhiqing && this.job === "知青" && y >= 1978 && y <= 1980 && this.chance(.6)) {
      this._goHome();
      const job = this.wpick([["国营厂工人", 50], ["单位职工", 20], ["个体户", 15], ["售货员", 15]]);
      this._setJob(job, null);
      this.ev(job === "个体户" ? "你回了城，在家“待业”了一阵，后来摆了个小摊。" : `你回了城，被安排进了${job === "国营厂工人" ? "工厂" : "单位"}。`, "move");
    }
    // 读书结束 → 进入社会（非大学）
    if (f.stopAt !== undefined && !this.job && !f.enterDone && !f.army && !f.needWorkChoice && a >= Math.max(f.stopAt, 15)) {
      if (y < 1978 && !this.home.urban) { f.enterDone = true; this._setJob("公社社员", null); this.ev("你开始跟着大人下地挣工分。", "work"); }
      else if (y < 1978 && this.home.urban && !(y >= 1966 && y <= 1977)) { f.enterDone = true; const j = this.pickJob(); this._setJob(j, null); this.ev(`你被安排进了${j === "国营厂工人" ? "国营工厂" : "单位"}，当${j}。`, "work"); }
      else if (y >= 1978 && interp(TS.mig, y) < .15) { f.enterDone = true; const j = this.pickJob(); this._setJob(j, null); this.ev(j === "务农" ? "你回家种地，农闲时打打零工。" : `你在家附近当了${j}。`, "work"); }
      else if (y >= 1978) { f.needWorkChoice = true; f.wcAge = a; } // 交给“出去还是留下”
    }

    if (f.needWorkChoice && a > f.wcAge + 1) { f.needWorkChoice = false; f.enterDone = true; const j = this.pickJob(); this._setJob(j, null); }
    if (f.needTizhi && a > (f.colEnd || 0) + 1 && !f.firstJobDone) { f.needTizhi = false; this._firstJob(); }
    if (f.needGrad && a > (f.colEnd || 0) + 1 && !f.firstJobDone) { f.needGrad = false; this._firstJob(); }
    if (f.xgChoice && a > (f.xgAge = nz(f.xgAge, a)) + 1) { f.xgChoice = false; this._setJob(this.pickJob(), null); }
    if (this.job === "公社社员" && y >= 1983) { this.job = "务农"; this.jobs.push("务农"); }
    if (this.job === "知青" && y >= 1981) { this._setJob("务农", null); this.ev("你没有回城，在当地成了家，留了下来。", "move"); }
    // 职业动态
    if (this.job && !this.retired && this.alive && a < 62) this._career();
    // 收入与积蓄
    if (this.job && !this.retired) {
      let inc = this._jobIncome(this.job, this.loc, a);
      if (f.unemp > 0) { inc *= 0.3; f.unemp--; }
      this.income = inc; this.earn += inc;
      this.wealth += inc * clamp(.22 + (this.fam - .5) * .1 + (y < 1990 ? -.1 : 0), .05, .4);
    } else if (this.retired && this.pension) this.wealth += this.pension * 12 / interp(TS.price, y) * .15;

    // 婚恋
    if (a === 18 && f.marryAge === undefined) this._planMarriage();
    if (f.marryAge === a && !this.married) this._marry();
    if (f.marryAge === null && a === 40 && !this.married && !f.everM) this.ev(this.y0 >= 1980 ? "你一直没有结婚。在你这代人里，这样的人越来越多。" : "你一直没有结婚。村里人背后说了很多闲话，你也就习惯了。", "love");
    for (const k of (f.kidPlan || [])) if (k === a && this.married) this._kid();
    if (this.married && f.divorceAt === a) this._divorce();
    if (f.remarry === a && !this.married) { this.married = true; f.mStart = a; this.ev("你再婚了。", "love"); this.spouseDie = a + 20 + Math.floor(this.u() * 30); }
    if (this.married && this.spouseDie === a && a > 25) {
      this.married = false; f.widowed = true; this.pe("widowed");
      this.ev(`${this.sex === "M" ? "妻子" : "丈夫"}去世了。你们一起生活了${a - nz(f.mStart, a)}年。`, "loss");
    }
    // 住房
    this._housing();
    // 父母
    if (a === this.fatherDie && !f.fd) { f.fd = true; this.pe("parentDeath"); this.ev(`父亲去世了，享年${this.fatherAge + a}岁。那年你${a}岁。`, "loss"); }
    if (a === this.motherDie && !f.md) { f.md = true; this.pe("parentDeath"); this.ev(`母亲去世了，享年${this.motherAge + a}岁。那年你${a}岁。`, "loss"); }
    if (!f.parentIll && a >= 32 && a <= 62 && ((!f.fd && this.fatherAge + a >= 72) || (!f.md && this.motherAge + a >= 72)) && this.chance(.06)) {
      f.parentIll = a;
      this.ev(`${!f.fd ? "父亲" : "母亲"}中风住院了。`, "family");
    }
    // 慢病
    if (!f.htn && a >= 40 && a <= 75 && this.chance(.02 * (this.sex === "M" ? 1.2 : .85))) { f.htn = true; this.ev("体检查出了高血压，从此每天要吃药。", "health", SRC.ncd, { fact: `我国18岁以上居民高血压患病率${NAT.htn}%。` }); }
    if (!f.dm && a >= 45 && a <= 75 && this.chance(.008 * (y > 2000 ? 1.3 : .6))) { f.dm = true; this.ev("你被诊断出糖尿病。", "health", SRC.ncd, { fact: `我国18岁以上居民糖尿病患病率${NAT.dm}%。` }); }
    if (!f.cancerSurv && a >= 40 && a <= 80 && this.chance(.003 * (f.checkup ? 1.4 : 1) * (y > 2000 ? 1 : .5))) {
      f.cancerSurv = true; this.pe("illness");
      const c = this.pick(["甲状腺癌", this.sex === "F" ? "乳腺癌" : "前列腺癌", "结直肠癌", "胃癌", "肺癌"]);
      this.ev(`你被查出${c}，${f.checkup ? "发现得早，" : ""}做了手术，后来康复了。`, "health", SRC.cancer, y >= 2010 ? { fact: `我国癌症患者5年生存率约${NAT.cancer5y}%。` } : null);
    }
    // 退休
    this._retire();
    // 孩子的里程碑
    for (const k of this.kids) {
      const ka = a - k.born;
      if (ka === 18 && !k.gk) { k.gk = true; this.ev(`你的${k.sex === "M" ? "儿子" : "女儿"}${this.year >= 1977 ? "参加了高考" : "成年了"}。`, "family"); }
      if (ka === 28 + Math.floor(k.born % 5) && !k.gc && this.chance(.6)) { k.gc = true; f.grandkid = a; this.ev(`你当上了${this.sex === "M" ? "爷爷" : "奶奶"}。`, "family"); }
    }
    if (!this.opts.auto && a === 18) this.ev("你18岁了。", "pause", null, { q: `${y}年，你18岁。你自己的18岁，在做什么？` });
    if (!this.opts.auto && a === 40) this.ev("你40岁了。", "pause", null, { q: "如果你也到了40岁，或者快到了，你和TA的处境比起来怎么样？" });
    if (!this.opts.auto && a === 65) this.ev("你65岁了。", "pause", null, { q: "如果可以给这个人的前半生留一句话，你会写什么？" });

    // 时代事件（每年最多2条）与随机事件（每年最多1条）
    this._eraEvents();
    this._randomEvents();
    this._persYear();
  }

  _sendDown(far) {
    const f = this.flags; f.zqPending = false;
    const dp = far ? PI[this.pick(["黑龙江", "云南", "内蒙古", "新疆"])] : this.home.p;
    const place = far ? { 黑龙江: "北大荒的生产建设兵团", 云南: "西双版纳的农场", 内蒙古: "内蒙古草原上的牧区", 新疆: "新疆的生产建设兵团" }[PROVS[dp].name] : `${this.home.city}郊区的一个生产队`;
    this._setJob("知青", null); this.pe("zhiqing");
    this.loc = { p: dp, city: far ? PROVS[dp].cities[0] : this.home.city, urban: false };
    if (!this.cities.includes(this.loc.city)) this.cities.push(this.loc.city);
    this.ev(`你上山下乡，去了${place}。临走那天，火车站里哭声一片。`, "move", "1968—1978年约1700万城镇知识青年下乡");
  }
  _admit(edu, special) {
    const f = this.flags, y = this.year, P = this.P;
    f.colEdu = edu;
    let tier, name;
    if (special === "工农兵大学") { tier = "工农兵"; name = "一所大学（工农兵学员）"; }
    else if (special === "77") { tier = "77"; name = "一所大学"; }
    else if (edu === "专科") { tier = "专科"; name = y < 1999 ? "一所大专" : "一所高职院校"; }
    else {
      const pm = { 北京: 3.5, 上海: 3.0, 天津: 3.0, 西藏: 1.6, 青海: 1.6, 宁夏: 1.6, 新疆: 1.5, 海南: 1.5, 吉林: 1.3, 辽宁: 1.3, 黑龙江: 1.3, 陕西: 1.3, 湖北: 1.3, 重庆: 1.2,
        河南: .7, 广东: .7, 山东: .75, 河北: .7, 安徽: .75, 江西: .7, 广西: .7, 贵州: .75, 云南: .8, 山西: .8 }[P.name] || 1;
      const k = Math.exp(1.2 * (this.fam - .5) + .2 * this.effort + .6 * this.apt);
      const x = this.u(), p985 = .04 * pm * k, p211 = .07 * Math.sqrt(pm) * k, p1 = .2 * k;
      tier = x < p985 ? "985" : x < p985 + p211 ? "211" : x < p985 + p211 + p1 ? "一本" : "二本";
      if (y < 1995) name = tier === "985" || tier === "211" ? "一所重点大学" : "一所普通本科";
      else name = { 985: "一所985大学", 211: "一所211大学", 一本: "一所省属重点大学", 二本: "一所普通本科院校" }[tier];
    }
    this.uniTier = tier; f.uniName = name; f.admitAge = this.age;
    f.colEnd = this.age + (special === "77" ? 1 : 0) + (edu === "专科" ? 3 : 4);
    this.inSchool = true;
    if (special) this._goUni(false);
    else { f.pendUni = true; f.pendMajor = true; } // 交给“志愿/专业”抉择
  }
  _goUni(out) {
    const f = this.flags;
    f.pendUni = false;
    let p;
    if (out) p = this.uniTier === "985" || this.uniTier === "211" ? this._bigDest() : this._destProv();
    else p = this.home.p;
    const city = out ? this._cityIn(p, true) : PROVS[p].cities[0];
    f.uniLoc = { p, city, urban: true }; if (out) this.pe("uniOut");
    this._moveTo(f.uniLoc);
    const first = this.cities.length === 2 && out;
    const yr = this.year;
    let t = `你考上了${f.uniName}，去${city}读书。`;
    if (this.uniTier === "工农兵") t = `你被推荐成了工农兵学员，去${city}上大学。`;
    if (this.uniTier === "77") t = `${yr}年春天，你走进了${city}的大学校园。同班同学有的已经结婚生子，有的才十几岁。`;
    if (!this.home.urban && yr < 2000) t += "户口从农村迁了出来，你成了“吃商品粮”的人。";
    else if (first) t += "这是你第一次离开家乡。";
    const fact = yr >= 2020 ? (this.uniTier === "985" ? "985高校每年本科招生约20万人。" : `2024年全国普通本科招生${NAT.bach}万人，高职专科招生568万人。`) : null;
    this.ev(t, "edu", fact ? SRC.edu24 : null, fact ? { fact } : null);
  }
  _firstJob() {
    const f = this.flags, y = this.year;
    if (f.firstJobDone) return; f.firstJobDone = true;
    // 1998年前：毕业分配
    if (y < 1998) {
      const p = f.uniLoc && this.chance(.4) ? f.uniLoc.p : this.home.p;
      const loc = { p, city: PROVS[p].cities[0], urban: true };
      const job = this.wpick(this.tilt(this.jobPool(this.edu, loc, y)));
      this._setJob(job, loc);
      this.ev(`你毕业了，被分配到${loc.city}当${job}。`, "work");
      return;
    }
    let loc;
    const tierP = nz({ 985: .55, 211: .42, 一本: .26, 二本: .17, 专科: .13 }[this.uniTier], .13);
    if (f.uniLoc && f.uniLoc.p !== this.home.p && this.chance(.45)) loc = f.uniLoc;
    else if (this.chance(tierP + (["硕士", "博士"].includes(this.edu) ? .15 : 0))) { const p = ["985", "211"].includes(this.uniTier) ? this._bigDest() : this._destProv(); loc = { p, city: this._cityIn(p, true), urban: true }; }
    else loc = { p: this.home.p, city: this.chance(.55) ? this.P.cities[0] : this.home.city, urban: true };
    if (f.tizhi === "in") {
      if (this.chance(nz(f.pg, .2))) { this._setJob(this.chance(.6) ? "公务员" : this.pick(["教师", "医生", "单位职工"]), { p: this.home.p, city: this.chance(.5) ? this.P.cities[0] : this.home.city, urban: true }); this.ev(`考了${this.chance(.5) ? "一" : "两"}年，你“上岸”了，在${this.loc.city}当${this.job === "单位职工" ? "事业单位职员" : this.job}。`, "work", SRC.exam, { fact: `2025年度国考平均约${NAT.civilExam}人竞争一个岗位。` }); return; }
      this.ev("你考了两年公务员和事业编，每次都差几分，后来不考了。", "work", SRC.exam);
    }
    const job = this.wpick(this.tilt(this.jobPool(this.edu, loc, y)));
    this._setJob(job, loc);
    let t = `你在${this.loc.city}找到了第一份工作，当${job}。`;
    if (y >= 2018 && this.chance(.2)) t = `毕业后你找了大半年工作，最后在${this.loc.city}当了${job}。`;
    this.ev(t, "work", null, { fact: `起薪大约每月${fmtYuan(this.nominal(this._jobIncome(job, this.loc, this.age) / 12))}。`, factSrc: SRC.model });
  }
  _career() {
    const a = this.age, y = this.year, f = this.flags, J = JOBS[this.job] || {};
    if (f.unemp > 0) return;
    // 下岗潮
    if (J.soe && y >= 1995 && y <= 2003 && a >= 28 && a <= 55 && !f.xiagang && this.chance(["东北"].includes(this.L.region) ? .1 : .055)) {
      f.xiagang = true; f.unemp = 1; this.pe("xiagang");
      this.ev(`工厂改制，你下岗了。买断工龄拿了${fmtYuan(this.nominal(this._jobIncome(this.job, this.loc, a) * .8))}。`, "work", "1990年代后期国企改革，数千万职工下岗");
      this.job = null; f.xgChoice = true; return;
    }
    if (this.job === "工厂工人" && (y === 2008 || y === 2009) && ["广东", "浙江", "江苏"].includes(this.L.name) && this.chance(.18)) {
      f.unemp = 1; this.ev("金融危机，厂里没了订单，老板跑路了。你提前回了老家。", "work"); if (f.migrant) this._goHome(); return;
    }
    if (["个体户", "小老板", "服务员", "厨师", "理发师"].includes(this.job) && y >= 2020 && y <= 2022 && !f.covidHit && this.chance(.22)) {
      f.covidHit = true; const loss = this.wealth * .25; this.wealth -= loss;
      this.ev(this.job === "小老板" || this.job === "个体户" ? `疫情那几年，店里没什么生意，你赔进去${fmtYuan(this.nominal(loss))}。` : "疫情期间店关了好几次，你歇了大半年。", "work"); return;
    }
    if (this.job === "教培老师" && y === 2021) { f.unemp = 1; const nj = this.pickJob(); this.ev(`“双减”之后，你所在的培训机构关了。你后来去当了${nj}。`, "work"); this._setJob(nj, null); return; }
    if (f.bigTech && (y === 2022 || y === 2023) && !f.btLaid && this.chance(.2)) { f.btLaid = true; f.unemp = 1; this.pe("layoff"); this.boost = 1; this.ev("互联网行业裁员，你拿着补偿金离开了公司，休息了大半年。", "work"); return; }
    if (J.white && y >= 2015 && a >= 35 && a <= 45 && !f.c35 && this.chance(.015)) { f.c35 = true; f.unemp = 1; this.pe("layoff"); this.ev(`${a}岁这年，公司裁员，你在家待了大半年才找到下一份工作。`, "work"); return; }
    // 正常换工作
    if (a < 55 && !["公务员", "医生", "教师", "高校/科研人员", "军人", "干部"].includes(this.job) && !(y < 1985 && J.soe) && this.chance(a < 35 ? .05 : .025)) {
      const nj = this.pickJob();
      if (nj !== this.job) {
        const old = this.job; this._setJob(nj, null);
        if (!["公社社员"].includes(old)) this.ev(this.pick([`你辞了${old}的工作，改行当了${nj}。`, `你从${old}转行，当了${nj}。`]), "work");
      }
    }
    // 外出务工者返乡
    if (f.migrant && !f.returned && a >= 35 && a <= 55 && this.loc.p !== this.home.p && this.chance(.04)) {
      this._goHome();
      this.ev(`你在外面漂了${a - (f.migAge || 20)}年，回到了老家${this.home.city}，${this.chance(.5) ? "在县城找了份活" : "在家门口开了个小店"}。`, "move");
      if (this.chance(.5)) this._setJob("个体户", null);
    }
  }
  _planMarriage() {
    const f = this.flags, y0 = this.y0;
    let pm = interp(TS.everMarry, y0) + (this.sex === "F" ? .02 : -.02);
    if (this.sex === "M" && !this.home.urban && this.fam < .4 && ["未上学", "小学", "初中"].includes(this.edu || "") && y0 >= 1975) pm -= .12;
    if (this.sex === "F" && ["本科", "硕士", "博士"].includes(this.edu || f.colEdu || "") && y0 >= 1985) pm -= .04;
    if (this.chance(pm)) {
      const m = interp(TS.marryAge, y0) + (this.home.urban ? .4 : -1.8) + (["硕士", "博士"].includes(f.gradEdu) ? 1.5 : 0) + (this.sex === "F" ? -1 : .6) + (f.zhiqing ? 2 : 0);
      f.marryAge = Math.round(clamp(this.norm(m, 3), 19, 46));
    } else f.marryAge = null;
  }
  _marry() {
    const a = this.age, y = this.year, f = this.flags;
    this.married = true; f.everM = true; f.mStart = a; this.pe("marry");
    const how = this.pick(y < 1980 ? ["媒人介绍的", "同村的", "同一个厂的", "组织上介绍的"] : y < 2005 ? ["经人介绍认识的", "同事", "老同学", "同乡", "相亲认识的", "在舞厅认识的"] : ["经人介绍认识的", "同事", "大学同学", "在网上认识的", "相亲认识的", "朋友聚会上认识的"]);
    const mq = this.u(); f.mq = mq; // 婚姻质量
    let t = `你结婚了，对方是${how}。`;
    if (f.crushMarry) t = "你和当年给你递纸条的那个人结婚了。";
    if (y < 1980 && !this.home.urban) t += "婚礼在院子里摆了几桌，彩礼是一辆自行车和几床被子。";
    else if (y < 1995) t += this.pick(["你们的“三大件”是自行车、缝纫机和手表。", "婚礼在单位食堂办的，摆了十桌。", ""]);
    this.ev(t, "love", SRC.marry, !f.marryFact && y >= 2010 ? { fact: "全国平均初婚年龄28.67岁；2024年结婚登记610.6万对。" } : null);
    f.marryFact = true;
    this.spouseDie = this._spouseDeath();
    // 生育计划（按年代政策）
    const plan = [];
    const k1 = a + 1 + Math.floor(this.u() * 2);
    if (y < 1971) { const n = this.home.urban ? 1 + this.pois(1.4) : 2 + this.pois(1.8); for (let i = 0; i < Math.min(n, 6); i++) plan.push(k1 + i * (2 + Math.floor(this.u() * 2))); }
    else if (y < 1980) { const n = this.home.urban ? 1 + (this.chance(.6) ? 1 : 0) : 2 + (this.chance(.5) ? 1 : 0); for (let i = 0; i < n; i++) plan.push(k1 + i * 3); }
    else if (this.chance(y < 2016 ? .93 : .86)) plan.push(k1 + (y >= 2010 ? Math.floor(this.u() * 2) : 0));
    f.kidPlan = plan;
    if (y >= 1980) f.secondOK = true; // 二孩交给抉择
    if (this.chance(clamp(.12 + (y > 2000 ? .1 : y > 1985 ? .03 : -.08) + (1 - mq) * .15, .01, .4))) f.divorceAt = a + 3 + Math.floor(this.u() * 15);
    if (!f.houseDone && !this.home.urban && !this.loc.urban && y >= 1985 && this.chance(.6)) {
      f.houseDone = true; this.house = { flat: true, price: 300000 * interp(TS.inc, y) / .6, y };
      this.ev(y < 2000 ? "为了结婚，家里盖了三间砖瓦房。" : "为了结婚，家里在村里盖了一栋两层小楼。", "life");
    }
  }
  _spouseDeath() {
    const a = this.age, sx = this.sex === "M" ? "F" : "M";
    const off = (this.P.le - NAT.le20) + (sx === "F" ? 2.75 : -2.75);
    let x = a + (this.sex === "M" ? -2 : 2);
    while (x < 110) { const yy = this.y0 + a + (x - a); const imr = interp(TS.imr, yy); const B = solveB(interp(TS.le, Math.max(yy, 1950)) + off, imr, imr * .4); if (this.chance(qGM(x, B, imr, imr * .4, 1))) break; x++; }
    return a + (x - (a + (this.sex === "M" ? -2 : 2)));
  }
  _kid() {
    const sex = this.chance(this.year >= 1985 && this.year <= 2015 ? .54 : .515) ? "M" : "F";
    this.kids.push({ born: this.age, sex });
    if (this.kids.length === 1) this.pe("kid");
    const n = this.kids.length;
    const fact = n === 1 && this.year >= 2025 ? { fact: "2025年全国出生人口792万，是1949年以来最少的一年。" } : null;
    this.ev(n === 1 ? `你有了第一个孩子，是个${sex === "M" ? "男孩" : "女孩"}。` : `你有了第${"一二三四五六七"[n - 1]}个孩子，是个${sex === "M" ? "男孩" : "女孩"}。`, "family", fact ? SRC.nbs25 : null, fact);
  }
  _divorce() {
    const a = this.age, f = this.flags;
    this.married = false; f.divorced = true; this.pe("divorce");
    this.ev(`结婚${a - f.mStart}年后，你们离婚了。${this.kids.length ? "孩子跟着" + (this.chance(.6) ? (this.sex === "F" ? "你" : "对方") : (this.sex === "F" ? "对方" : "你")) + "。" : ""}`, "love");
    this.wealth *= .6;
    if (this.chance(.45) && a < 55) f.remarry = a + 2 + Math.floor(this.u() * 6);
  }
  _housing() {
    const a = this.age, y = this.year, f = this.flags;
    if (this.house || this.abroad) return;
    if (y < 1998 && this.loc.urban && this.job && (JOBS[this.job] || {}).formal && (this.married || a >= 30) && !f.fenfang && this.chance(.25)) {
      f.fenfang = true; f.houseDone = true;
      this.house = { tier: cityTier(this.loc.city), y: 1998, price: this.housePrice(this.loc.city, 1998) * .25, city: this.loc.city, fen: true };
      this.ev(`单位分了你一套${this.pick([28, 36, 42, 50])}平米的房子，${this.chance(.5) ? "厨房和厕所是几家共用的" : "你们终于有了自己的家"}。`, "life");
    }
  }
  _retire() {
    const a = this.age, y = this.year, f = this.flags;
    if (this.retired || !this.job) return;
    const J = JOBS[this.job] || {};
    const formal = J.formal || (y < 1993 && this.loc.urban && !["个体户", "务农", "公社社员"].includes(this.job)) || (f.ff !== undefined ? f.ff : f.ff = this.chance(["工厂工人", "销售", "公司职员", "程序员", "文员", "会计", "设计师", "金融从业者", "律师", "记者", "游戏策划", "技工", "快递员"].includes(this.job) ? .8 : .3));
    const newRule = y >= 2025;
    const white = J.white || ["干部", "教师", "医生", "公务员", "高校/科研人员"].includes(this.job);
    const rAge = this.sex === "M" ? (newRule ? 63 : 60) : (white ? (newRule ? 58 : 55) : (newRule ? 55 : 50));
    if (this.abroad && a === 65) { this.retired = true; this.pension = 9000; this.ev("你在国外退休了，靠养老金和积蓄生活。", "old"); return; }
    if (formal && a === rAge) {
      this.retired = true; this.pe("retire");
      const repl = y < 2000 ? .75 : (["公务员", "教师", "干部", "医生"].includes(this.job) ? .62 : .42);
      this.pension = Math.max(this.nominal(18000 * interp(TS.inc, y)) / 12, Math.round(this.nominal(this.income * repl) / 12 / 10) * 10);
      this.ev(`你退休了。每个月领到大约${fmtYuan(this.pension)}的${y < 2000 ? "退休金" : "养老金"}。`, "old", y >= 2020 ? SRC.pen24 : null,
        y >= 2020 ? { fact: `2024年，全国城镇职工月人均养老金约${NAT.penUrban}元，城乡居民约${NAT.penRural}元。` } : null);
    } else if (!formal && a === 60) {
      this.retired = true;
      const pr = interp(TS.penRural, y);
      const fac = Math.pow(this.L.rInc / NAT.rInc, 1.6) * (["北京", "上海"].includes(this.L.name) ? 2.5 : 1);
      this.pension = Math.round(pr * fac / 10) * 10;
      if (this.pension > 0) this.ev(`你没有“退休”这回事。60岁这年，你开始每月领大约${fmtYuan(this.pension)}的城乡居民养老金，${this.job === "务农" ? "地还接着种" : "还在打些零工"}。`, "old", SRC.pen24, { fact: `2024年，全国城乡居民养老保险月人均待遇约${NAT.penRural}元，城镇职工约${NAT.penUrban}元。` });
      else { f.noPension = true; this.ev("你没有养老金，也没有“退休”这回事。干不动活之后，就靠儿女和一点积蓄过日子。", "old"); }
    }
    if (f.noPension && y === 2009 && a >= 60) { this.pension = 55; this.ev("新农保开始了，你每个月能领到55元。", "old"); }
  }

  _eraEvents() {
    let n = 0; const y = this.year, a = this.age;
    const pool = CULT.filter(c => !this.fired[c.id] && y >= c.y[0] && y <= c.y[1] && a >= c.a[0] && a <= c.a[1]);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(this.u() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    for (const c of pool) {
      if (n >= 2) break;
      if (c.c && !c.c(this)) continue;
      if (!this.chance(c.p)) continue;
      this.fired[c.id] = true; n++; if (c.id === "hunger") this.pe("hungry");
      this.ev(typeof c.t === "function" ? c.t(this) : c.t, c.tag || "era", c.src || null);
      if (c.fx) c.fx(this);
    }
  }
  _randomEvents() {
    const a = this.age;
    const pool = RAND.filter(e => !this.fired[e.id] && a >= e.a[0] && a <= e.a[1]);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(this.u() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    for (const e of pool) {
      if (e.c && !e.c(this)) continue;
      if (!this.chance(typeof e.p === "function" ? e.p(this) : e.p)) continue;
      this.fired[e.id] = !e.repeat; if (PFX[e.id]) this.pe(e.id); if (e.id === "stroke") this.pe("illness");
      const t = typeof e.t === "function" ? e.t(this) : e.t;
      if (t) { const ev = this.ev(t, e.tag || "life", e.src || null); if (e.help) ev.help = true; }
      if (e.fx) e.fx(this);
      break;
    }
  }

  // ---------- 死亡 ----------
  _cause() {
    const a = this.age, y = this.year, P = this.P;
    const ex = this._extraCause(a, y); if (ex) return ex;
    const smoke = this.smoker ? 1.8 : 1, north = ["华北", "东北"].includes(P.region) ? 1.3 : 1, npc = ["广东", "广西"].includes(P.name);
    const old = y < 1985 ? 1 : 0;
    let w;
    if (a === 0) w = [["早产和低出生体重", 30], ["出生窒息", 15], ["出生缺陷", 25], ["肺炎", 15 + old * 25], ["腹泻", old * 15], ["意外窒息", 10]];
    else if (a < 5) w = [["溺水", 20], ["意外窒息", 10], ["跌落", 10], ["出生缺陷", 15], ["肺炎", 12 + old * 25], ["麻疹", old * 15], ["腹泻", old * 10], ["白血病", 8], ["其他疾病", 13]];
    else if (a < 15) w = [["溺水", 25], ["交通事故", y > 1995 ? 20 : 6], ["白血病", 12], ["脑瘤", 6], ["意外伤害", 15], ["先天性疾病", 10], ["肺结核", old * 8], ["其他疾病", 12]];
    else if (a < 30) w = [["交通事故", y > 1995 ? 30 : 12], ["自杀", 15], ["溺水", 8], ["意外伤害", 10], ["癌症", 12], ["心脏病", 8], ["肺结核", old * 10], ["其他疾病", 15]];
    else if (a < 50) w = [["肝癌", 9], ["肺癌", 8 * smoke], ["其他癌症", 13], ["心脏病", 18], ["脑卒中", 12 * north], ["交通事故", y > 1995 ? 14 : 6], ["自杀", 8], ["意外伤害", 6], ["肺结核", old * 8], ["其他疾病", 12]];
    else if (a < 70) w = [["肺癌", 14 * smoke], ["肝癌", 7], ["胃癌", 6 + old * 4], [npc ? "鼻咽癌" : "食管癌", 4 + old * 3], ["其他癌症", 8], ["脑卒中", 20 * north], ["心脏病", 18], ["慢阻肺", 6 * smoke], ["糖尿病并发症", 3 + (this.flags.dm ? 6 : 0)], ["交通事故", 3], ["其他疾病", 11]];
    else w = [["脑卒中", 24 * north * (this.flags.stroke ? 2 : 1)], ["心脏病", 25], ["慢阻肺", 12 * smoke], ["肺癌", 7 * smoke], ["其他癌症", 13], ["阿尔茨海默病", 6 + (this.flags.dem ? 20 : 0)], ["肺炎", 4], ["跌倒", 3 + (this.flags.fall ? 6 : 0)], ["其他疾病", 6]];
    const c = this.wpick(w);
    if (c === "其他疾病") return this.pick(a < 30 ? ["重症感染", "心肌炎", "红斑狼疮", "肾病"] : ["肾衰竭", "肝硬化", "重症感染", "多器官衰竭"]);
    return c;
  }
  _die(force) {
    this.alive = false; this.deathAge = this.age; this.inSchool = false;
    const c = force || this._cause(); this.cause = c;
    if (this.mbti.length && this.age - this.mbti[this.mbti.length - 1].age >= 3) this._snap(2);
    const a = this.age, heavy = this.opts.heavy;
    let t;
    if (a === 0) t = `你没能度过第一年。死因是${c}。`;
    else if (c === "自杀") t = heavy ? `${a}岁这年，你自杀了。` : `${a}岁这年，你离开了这个世界。`;
    else if (c === "饥荒") t = heavy ? `${this.year}年，你没能熬过饥荒，死的时候${a}岁。` : `${this.year}年，你在饥荒中离世，${a}岁。`;
    else if (c === "战争") t = `${this.year}年，你牺牲在了前线，${a}岁。`;
    else if (/地震/.test(c)) t = `${this.year}年，你在${c}中遇难，${a}岁。`;
    else if (/癌/.test(c) && a >= 30) t = `你被确诊为${c}，治疗了${1 + Math.floor(this.u() * 3)}年，最终在${a}岁时离世。`;
    else if (["交通事故", "溺水", "跌落", "意外窒息", "意外伤害", "跌倒"].includes(c)) t = `${a}岁这年，你因为${c}去世了。`;
    else t = `${a}岁这年，你因${c}去世。`;
    const e = this.ev(t, "death", a < 5 && this.year >= 2020 ? SRC.hw24 : SRC.gbd, a < 5 && this.year >= 2020 ? { fact: `2024年全国婴儿死亡率${(NAT.imr * 1000).toFixed(1)}‰，5岁以下儿童死亡率${(NAT.u5mr * 1000).toFixed(1)}‰。` } : null);
    if (c === "自杀") e.help = true;
  }

  summary() {
    const endY = this.y0 + nz(this.deathAge, this.age);
    return {
      name: this.name, sex: this.sex, prov: this.P.name, place: this.place, urban: this.home.urban,
      age: nz(this.deathAge, this.age), cause: this.cause, edu: this.edu || "无",
      tier: this.uniTier, jobs: this.jobs.filter(j => j !== "知青" || true), cities: this.cities, earn: this.earn,
      wealth: Math.max(0, this.wealth) + this.houseValue(Math.min(endY, 2300)), pension: this.pension, married: !!this.flags.everM, kids: this.kids.length,
      leftBehind: this.leftBehind, birthYear: this.y0, deathYear: endY, abroad: this.loc.abroad || this.flags.wasAbroad || null,
      hobby: this.hobby, mbti: this.mbti.map(m => m.type),
    };
  }
  status() {
    if (!this.alive) return `${this.deathAge}岁离世`;
    const a = this.age;
    if (a < 3) return "在家";
    if (this.inSchool) return a < this.startAge() + 6 ? "上小学" : a < 15 + (this.flags.delay || 0) ? "上初中" : ["高中", "中专", "中职"].includes(this.edu) ? `上${this.edu === "中职" ? "职校" : this.edu}` : `在${this.loc.city}读书`;
    if (a < this.startAge()) return "上幼儿园";
    if (this.retired) return this.abroad ? `在${this.loc.abroad}养老` : "已退休";
    if (this.job === "知青") return "上山下乡";
    if (this.job) return `在${this.loc.city}当${this.job}`;
    return "在家";
  }
}

function cn(n) { return ["零", "一", "两", "三", "四", "五", "六", "七", "八", "九", "十"][n] || String(n); }
function pct(p) { const v = p * 100; return (v >= 99.5 || v < 1 ? v.toFixed(1) : Math.round(v)) + "%"; }
function fmtYuan(x) {
  x = Math.round(x);
  if (x >= 1e8) return (x / 1e8).toFixed(2) + "亿元";
  if (x >= 1e4) return (x / 1e4).toFixed(x >= 1e6 ? 0 : 1) + "万元";
  return x.toLocaleString("zh-CN") + "元";
}
