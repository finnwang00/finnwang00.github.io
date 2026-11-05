// ===== 抉择（全部二选一）与随机事件 =====
const HOBBY_LABEL = { 篮球: "去打篮球", 画画: "在家画画", 足球: "去踢足球", 音乐: "学一门乐器", 下棋: "找人下棋", 跳舞: "去学跳舞", 游戏: "打游戏", 看书: "看课外书" };
const isCol = L => ["专科", "本科", "硕士", "博士"].includes(L.edu);
const OUT = (L, k) => Math.round(L.nominal(k) / 100) * 100;
const yuanM = (L, real) => fmtYuan(L.nominal(real) / 12);

const CHOICES = [

  { id: "zhiqing", when: L => L.flags.zqPending,
    title: "上山下乡", prompt: L => `${L.year}年，街道上动员你上山下乡。有两个去处可以报名。`,
    opts: [
      { label: "去边疆兵团", odds: () => "每月有几十块工资，但离家几千里", auto: () => .35, fx: L => L._sendDown(true) },
      { label: "去本省农村插队", odds: () => "离家近，挣工分", auto: () => .65, fx: L => L._sendDown(false) },
    ], src: "1968—1978年约1700万城镇知识青年下乡" },

  { id: "hongweibing", when: L => L.year === 1966 && L.age >= 14 && L.age <= 20 && L.home.urban && ["初中", "高中", "中专"].includes(L.edu),
    title: "红袖章", prompt: () => "学校里成立了红卫兵组织，同学们都戴上了红袖章。",
    opts: [
      { label: "加入", odds: () => "跟着大家一起", auto: () => .6, fx: L => { L.flags.hwb = true; L.pe("hongweibing"); L.ev("你戴上了红袖章，跟着大家去抄写大字报、开批斗会。很多年后，你很少提起这段日子。", "era"); } },
      { label: "当逍遥派", odds: () => "躲在家里看闲书", auto: () => .4, fx: L => { L.pe("xiaoyao"); L.ev("你当了“逍遥派”，躲在家里翻那些没被烧掉的书。", "era"); if (!L.hobby) L.hobby = "看书"; } },
    ] },

  { id: "doctor", when: L => L.year >= 1968 && L.year <= 1980 && L.age >= 17 && L.age <= 30 && !L.loc.urban && ["初中", "高中"].includes(L.edu) && ["公社社员", "知青"].includes(L.job), p: () => .1,
    title: "赤脚医生", prompt: () => "大队要选一个人去公社卫生院学医，回来当赤脚医生。",
    opts: [
      { label: "去学医", odds: () => "背着药箱走村串户，工分不比种地多", auto: () => .5, fx: L => { L._setJob("医生", null); L.flags.barefoot = true; L.ev("你学了三个月医，回村当了赤脚医生，打针、接生、治头疼脑热都找你。", "work"); } },
      { label: "让给别人", odds: () => "接着下地干活", auto: () => .5, fx: L => {} },
    ] },

  { id: "zhaogong", when: L => L.year >= 1958 && L.year <= 1959 && L.age >= 16 && L.age <= 28 && !L.loc.urban && ["公社社员", "务农"].includes(L.job), p: () => .3,
    title: "进城当工人", prompt: () => "大跃进，城里的工厂到村里招工。",
    opts: [
      { label: "进城", odds: () => "能吃上商品粮，但听说政策常变", auto: () => .5, fx: L => { const c = L.P.cities[0]; L._setJob("国营厂工人", { p: L.home.p, city: c, urban: true }); L.flags.jingjian = true; L.ev(`你进了${c}的工厂当工人，第一次领到了工资。`, "work"); } },
      { label: "留在村里", odds: () => "守着地", auto: () => .5, fx: L => {} },
    ] },

  { id: "jieban", when: L => L.year >= 1979 && L.year <= 1986 && L.age >= 16 && L.age <= 24 && L.home.urban && !L.inSchool && (!L.job || L.job === "知青" || L.job === "个体户") && L.fam < .8, p: () => .5,
    title: "接班", prompt: L => `${L.fatherAge + L.age >= 55 ? "父亲" : "母亲"}提前退休，按政策，可以让一个孩子“顶替”进厂接班。`,
    opts: [
      { label: "接班进厂", odds: () => "国营厂的铁饭碗", auto: () => .7, fx: L => { L._goHome(); L._setJob("国营厂工人", null); L.ev(`你顶替${L.fatherAge + L.age >= 55 ? "父亲" : "母亲"}进了厂，穿上了蓝色的工装。`, "work"); } },
      { label: "让给兄弟姐妹", odds: () => "自己去闯", auto: () => .3, fx: L => { L.ev("你把接班的名额让给了家里的兄弟姐妹。", "family"); } },
    ] },

  { id: "chengbao", when: L => L.year >= 1982 && L.year <= 1992 && L.age >= 20 && L.age <= 50 && L.job === "务农", p: () => .15,
    title: "承包", prompt: L => `村里有一片${L.pick(["鱼塘", "果园", "荒山"])}要对外承包，承包费不低。`,
    opts: [
      { label: "承包下来", odds: () => "赌一把，可能成为“万元户”", auto: L => .25 + L.risk * .4, fx: L => { if (L.chance(.45 + L.luck * .05)) { L.wealth += 1.5e5; L.ev("你承包了下来，干了几年，成了村里第一批“万元户”，家门口挂上了大红花。", "work"); } else { L.wealth -= 4e4; L.ev("你承包了下来。头一年赶上天灾，赔了钱，欠的债还了好几年。", "work"); } } },
      { label: "继续种粮", odds: () => "稳妥，饿不着", auto: L => .75 - L.risk * .4, fx: L => {} },
    ] },

  { id: "xiagang2", when: L => L.flags.xgChoice,
    title: "下岗之后", prompt: L => "下岗了。拿着买断工龄的钱，接下来怎么办？",
    opts: [
      { label: "自己摆摊", odds: () => "起早贪黑，饿不着", auto: () => .55, fx: L => { L.flags.xgChoice = false; L._setJob(L.pick(["个体户", "个体户", "司机"]), null); L.ev(L.job === "司机" ? "你借钱买了一辆二手夏利，开起了出租车。" : "你在菜市场租了个摊位，每天凌晨四点起来进货。", "work"); } },
      { label: "南下打工", odds: L => `去南方，月收入大约 ${yuanM(L, L._jobIncome("工厂工人", { p: PI.广东, city: "深圳", urban: true }, L.age))}`, auto: () => .45, fx: L => { L.flags.xgChoice = false; L.flags.migrant = true; L.flags.migAge = L.age; L.pe("migrant"); L._setJob(L.pick(["工厂工人", "保安", "销售"]), { p: PI.广东, city: L.pick(["深圳", "东莞", "广州"]), urban: true }); L.ev(`你一个人去了${L.loc.city}，在那里当${L.job}。`, "move"); } },
    ] },
  { id: "hobby", when: L => L.age === 7 && !L.abroad,
    title: "放学以后", prompt: L => { const ok = HOBBY_PAIRS.filter(p => !(p.includes("游戏") && L.year < 1990) && !(p.includes("音乐") && L.fam < .45 && !L.home.urban)); L.flags.hp = L.flags.hp || L.pick(ok); return "放学以后，你更喜欢做什么？"; },
    opts: [0, 1].map(k => ({ label: L => HOBBY_LABEL[L.flags.hp[k]], odds: L => "爱好可能陪你很多年", auto: () => .5, fx: L => { L.hobby = L.flags.hp[k]; } })) },

  { id: "study", when: L => L.inSchool && L.age === L.startAge() + 5 && L.edu === "小学" && L.year >= 1970,
    title: "要不要拼一把", prompt: L => L.year >= 2000 ? "你快上初中了。班上一半同学周末在补课、刷题，另一半在玩。" : "你快上初中了。老师说，再加把劲，以后能考出去。",
    opts: [
      { label: "拼一把", odds: L => `上高中的概率 ${pct(L.pHigh(1) * interp(TS.junior, L.y0))}`, auto: () => .55, fx: L => { L.effort = 1; L.pe("effortHi"); } },
      { label: "顺其自然", odds: L => `上高中的概率 ${pct(L.pHigh(-1) * interp(TS.junior, L.y0))}`, auto: () => .45, fx: L => { L.effort = -1; L.pe("effortLo"); } },
    ], src: SRC.model },

  { id: "crush", when: L => L.inSchool && L.age >= 13 && L.age <= 16 && L.year >= 1978 && !L.abroad, p: () => .25,
    title: "一张纸条", prompt: L => `${L.sex === "M" ? "后桌的女生" : "隔壁班的男生"}托人给你递了一张纸条，上面写着放学后在车棚等你。`,
    opts: [
      { label: "去车棚", odds: () => "学习可能会分心", auto: () => .45, fx: L => { L.flags.crush = true; L.pe("crush"); if (L.chance(.1)) L.flags.crushMarry = true; L.ev("你去了。后来你们偷偷好了一阵，毕业前分开了。", "love"); } },
      { label: "假装没看见", odds: () => "第二天见面有点尴尬", auto: () => .55, fx: L => { L.ev("你把纸条夹进了课本，一直没有回。", "love"); } },
    ] },

  { id: "zz", when: L => L.inSchool && L.edu === "初中" && L.age === 14 + (L.flags.delay || 0) && L.year >= 1978 && L.year <= 1998 && !L.home.urban && L.apt > -.2,
    title: "中专还是高中", prompt: () => "你的成绩在乡里排得上号。老师建议你考中专：读完包分配，户口能转成城镇户口。",
    opts: [
      { label: "考中专", odds: () => "三年后有“铁饭碗”，但基本上不了大学", auto: () => .55, fx: L => { L.flags.zz = "zz"; } },
      { label: "考高中", odds: L => `将来考上大学的概率 ${pct(L.pHigh(L.effort) * L.pCollege(L.effort))}`, auto: () => .45, fx: L => { L.flags.zz = "hs"; } },
    ], note: () => "1980—90年代，农村尖子生考中专是“跳出农门”最稳的路。" },

  { id: "retakeHS", when: L => L.flags.failHS && L.age === 15 + (L.flags.delay || 0),
    title: "中考没考好", prompt: () => "中考分数没过高中线。",
    opts: [
      { label: "复读一年", odds: L => `明年考上高中的概率 ${pct(sigm(logit(L.pHigh(L.effort)) + .4))}`, auto: L => .35 + L.fam * .3, fx: L => { L.flags.failHS = false; L.flags.retakeHS = true; L.flags.delay = (L.flags.delay || 0) + 1; L.effort += .5; L.ev("你复读了一年初三。", "edu"); } },
      { label: L => L.year >= 1985 ? "去读职校" : "不读了", odds: L => L.year >= 1985 ? "早点学门手艺" : "回家干活", auto: L => .65 - L.fam * .3, fx: L => { L.flags.failHS = false; if (L.year >= 1985) { L.edu = "中职"; L.ev("你去读了一所职业学校。", "edu"); } else { L.inSchool = false; L.flags.stopAt = L.age; L.ev("你不再读书了。", "edu"); } } },
    ] },

  { id: "smoke", when: L => L.age === 17 && !L.abroad, p: L => L.sex === "M" ? .9 : .15,
    title: "一根烟", prompt: L => L.sex === "M" ? "放学后，一个朋友递给你一根烟。" : "聚会上，有人递给你一根烟。",
    opts: [
      { label: "接过来", odds: L => `活到75岁的概率 ${pct(L.survProb(17, 75, x => L.mult * (x >= 35 ? (L.sex === "M" ? 1.35 : 1.8) / ((L.sex === "M" ? interp(TS.smokeM, L.y0) : .03) * 1.35 + (1 - (L.sex === "M" ? interp(TS.smokeM, L.y0) : .03)) * .75) : 1)))}`, auto: L => L.sex === "M" ? interp(TS.smokeM, L.y0) : .1, fx: L => { L.smoker = true; } },
      { label: "摆摆手", odds: L => `活到75岁的概率 ${pct(L.survProb(17, 75, x => L.mult * (x >= 35 ? .75 / ((L.sex === "M" ? interp(TS.smokeM, L.y0) : .03) * 1.35 + (1 - (L.sex === "M" ? interp(TS.smokeM, L.y0) : .03)) * .75) : 1)))}`, auto: L => L.sex === "M" ? 1 - interp(TS.smokeM, L.y0) : .9, fx: L => { L.smoker = false; } },
    ], src: SRC.smoke, note: () => `中国成年男性吸烟率${NAT.smokeM}%，女性${NAT.smokeF}%。` },

  { id: "retakeGK", when: L => L.flags.failGK && !L.flags.gkDone && L.age === 18 + (L.flags.delay || 0),
    title: "高考落榜", prompt: L => `${L.year}年高考，你的分数没过线。`,
    opts: [
      { label: "复读一年", odds: L => `明年考上的概率 ${pct(sigm(logit(L.pCollege(L.effort)) + .25))}`, auto: L => .3 + L.fam * .3, fx: L => { L.flags.failGK = false; L.flags.retake = true; L.flags.delay = (L.flags.delay || 0) + 1; L.ev("你回到学校复读，又过了一年高三。", "edu"); } },
      { label: "不读了", odds: () => "早点出去挣钱", auto: L => .7 - L.fam * .3, fx: L => { L.flags.failGK = false; L.flags.gkDone = true; L.inSchool = false; L.flags.stopAt = L.age; L.ev("你没有复读。", "edu"); } },
    ] },

  { id: "uniWhere", when: L => L.flags.pendUni && L.age === L.flags.admitAge,
    title: "填志愿", prompt: L => `高考成绩出来了，分数够上${L.flags.uniName}。志愿怎么填？`,
    opts: [
      { label: "去外省", odds: () => "毕业后多半留在外地", auto: L => L.edu === "本科" || L.flags.colEdu === "本科" ? .3 : .15, fx: L => { L._goUni(true); } },
      { label: "留在本省", odds: () => "离家近，以后多半在本省工作", auto: L => .75, fx: L => { L._goUni(false); } },
    ] },

  { id: "major", when: L => L.flags.pendMajor && !L.flags.pendUni && L.age === L.flags.admitAge,
    title: "选专业", prompt: L => L.year < 1995 ? "专业怎么选？" : `专业怎么选？${L.hobby ? `你从小喜欢${L.hobby}。` : ""}`,
    opts: [
      { label: "选热门专业", odds: L => L.year < 1995 ? "理工科，毕业分配到好单位" : "计算机、金融、医学，起薪高", auto: () => .55, fx: L => { L.flags.pendMajor = false; L.flags.major = "hot"; } },
      { label: "选喜欢的专业", odds: () => "跟着兴趣走", auto: () => .45, fx: L => { L.flags.pendMajor = false; L.flags.major = "like"; } },
    ] },

  { id: "workOut", when: L => L.flags.needWorkChoice && !L.job,
    title: "出去还是留下", prompt: L => { L.flags.dest = L.flags.dest != null ? L.flags.dest : L._destProv(); return L.year < 1992 ? `书读完了。听说${PROVS[L.flags.dest].name}那边能挣钱，村里有几个人已经去了。` : `书读完了。和你同龄的人，不少去了${PROVS[L.flags.dest].name}。`; },
    opts: [
      { label: L => `去${PROVS[L.flags.dest].name}打工`, odds: L => { const loc = { p: L.flags.dest, city: L._cityIn(L.flags.dest, false), urban: true }; return `月收入大约 ${yuanM(L, L._jobIncome("工厂工人", loc, 20))}`; },
        auto: L => clamp(0.08 + 1.7 * L.P.outRate, .06, .5) * (L.home.urban ? .5 : 1) * interp(TS.mig, L.year) * 1.2,
        fx: L => {
          const f = L.flags, p = f.dest, city = L._cityIn(p, false);
          f.needWorkChoice = false; f.enterDone = true; f.migrant = true; f.migAge = L.age; L.pe("migrant");
          const job = L.wpick(L.tilt(L.jobPool(L.edu, { p, city, urban: true }, L.year)));
          L._setJob(job, { p, city, urban: true });
          L.ev(`你${L.year < 2000 ? "背着蛇皮袋挤上绿皮火车" : "坐上大巴"}，去${city}当了${job}。`, "move", L.year >= 2020 ? SRC.mig23 : null, L.year >= 2020 ? { fact: `2023年全国农民工${(NAT.migrants / 10000).toFixed(2)}亿人，平均年龄${NAT.migAge}岁。` } : null);
        } },
      { label: "留在家乡", odds: L => `月收入大约 ${yuanM(L, L._jobIncome(L.home.urban ? "工厂工人" : "务农", L.home, 20))}`, auto: L => 1 - clamp(0.08 + 1.7 * L.P.outRate, .06, .5) * (L.home.urban ? .5 : 1) * interp(TS.mig, L.year) * 1.2,
        fx: L => { const f = L.flags; f.needWorkChoice = false; f.enterDone = true; const job = L.pickJob(L.home); L._setJob(job, null); L.ev(job === "务农" ? "你留在家里种地，农闲时打打零工。" : `你在${L.home.city}当了${job}。`, "work"); } },
    ] },

  { id: "army", when: L => L.age >= 18 && L.age <= 20 && !L.inSchool && !isCol(L) && !L.abroad && !L.flags.army && L.year >= 1955 && !L.flags.zhiqing, p: L => L.sex === "M" ? .12 : .01,
    title: "征兵", prompt: L => L.year < 1990 ? "武装部来征兵了。当兵光荣，家里也能少一张吃饭的嘴。" : "征兵宣传车开进了镇上。",
    opts: [
      { label: "去当兵", odds: L => L.year < 1998 ? "退伍后可能被安置工作" : "两年义务兵，有退役补贴", auto: () => .4, fx: L => { const f = L.flags; f.army = true; L.pe("army"); f.armyEnd = L.age + 2 + Math.floor(L.u() * 4); const p = PI[L.pick(["新疆", "西藏", "福建", "北京", "广西", "黑龙江", "四川"])]; L._setJob("军人", { p, city: PROVS[p].cities[0], urban: true }); f.needWorkChoice = false; L.ev(`你参军了，部队驻扎在${PROVS[p].name}。`, "work"); } },
      { label: "不去", odds: () => "留在家里", auto: () => .6, fx: L => {} },
    ] },

  { id: "gk77", when: L => L.year === 1977 && L.age >= 17 && L.age <= 31 && ["初中", "高中", "中专"].includes(L.edu) && !L.inSchool && !L.abroad,
    title: "恢复高考", prompt: L => `广播里说，停了十年的高考恢复了。${L.job === "知青" ? "知青点里的人都在找旧课本。" : "你已经好几年没摸过课本了。"}`,
    opts: [
      { label: "报名", odds: L => `考上的概率 ${pct(sigm(-3.0 + .9 * L.apt + (L.edu === "高中" ? .6 : 0) + (L.home.urban ? .3 : 0)))}`, auto: () => .5,
        fx: L => { if (L.chance(sigm(-3.0 + .9 * L.apt + (L.edu === "高中" ? .6 : 0) + (L.home.urban ? .3 : 0)))) { const old = L.job; L.job = null; L._admit("本科", "77"); } else L.ev("你考了，没考上。那一年570万人报考，只录取了27万人。", "edu"); } },
      { label: "不报了", odds: () => "日子已经定下来了", auto: () => .5, fx: L => { L.ev("你没有报名。后来有时候会想，如果当时考了会怎样。", "edu"); } },
    ], note: () => "1977年冬天，约570万人参加高考，录取约27.3万人。" },

  { id: "xiahai", when: L => L.year >= 1984 && L.year <= 1996 && L.age >= 22 && L.age <= 45 && L.loc.urban && L.job && ((JOBS[L.job] || {}).soe || ["干部", "教师", "技术员", "工程师"].includes(L.job)) && !L.abroad, p: () => .18,
    title: "下海", prompt: L => L.year >= 1992 ? "南方谈话之后，好几个同事辞职下了海。有人拉你一起去南方做生意。" : "有朋友倒腾服装和电器发了财，问你要不要一起干。",
    opts: [
      { label: "下海", odds: () => "大约四个人里，一个发了财", auto: L => .15 + L.risk * .4,
        fx: L => {
          const x = L.u() - L.luck * .05 - L.risk * .05;
          if (x < .25) { const gain = 2e6 * Math.exp(L.norm(0, .9)); L.wealth += gain; L._setJob("小老板", null); L.boost = 1.6; L.pe("xiahai"); L.ev(`你辞职下了海，${L.pick(["倒腾电器", "做服装批发", "开饭店", "搞建材生意"])}，几年下来赚了${fmtYuan(L.nominal(gain))}。`, "work"); }
          else if (x < .7) { L._setJob("个体户", null); L.ev(`你辞职下了海，生意不好不坏，比在单位挣得多一些，也累得多。`, "work"); }
          else { const loss = Math.max(5e4, L.wealth * .6); L.wealth -= loss; L._setJob("个体户", null); L.ev(`你辞职下了海，结果生意赔了，欠了${fmtYuan(L.nominal(loss))}的债。`, "work"); }
        } },
      { label: "留在单位", odds: () => "铁饭碗，稳当", auto: L => .85 - L.risk * .4, fx: L => {} },
    ] },

  { id: "grad", when: L => L.flags.needGrad && !L.flags.firstJobDone,
    title: "毕业之后", prompt: L => L.year >= 2005 ? "你要大学毕业了。宿舍里有人在准备考研，有人在投简历。" : "你要大学毕业了。系里有几个读研究生的名额。",
    opts: [
      { label: "考研", odds: L => `上岸的概率 ${pct(L.flags.pk = (L.year < 1995 ? .12 : ({ 985: .62, 211: .48, 一本: .34, 二本: .22 }[L.uniTier] || .2)))}`, auto: () => .3,
        fx: L => { const f = L.flags; f.needGrad = false; if (L.chance(f.pk)) { f.gradEdu = "硕士"; f.gradEnd = L.age + 3; L.inSchool = true; L.ev("你考研上岸了。", "edu", L.year >= 2020 ? SRC.edu24 : null, L.year >= 2020 ? { fact: `2024年研究生招生${NAT.grad}万人，考研报名${NAT.gradExam}万人。` } : null); } else { L.ev("考研没上，你开始找工作。", "edu"); if (L.year >= 1995) f.needTizhi = true; else L._firstJob(); } } },
      { label: "去工作", odds: () => "早点开始挣钱", auto: () => .7, fx: L => { L.flags.needGrad = false; if (L.year >= 1995) L.flags.needTizhi = true; else L._firstJob(); } },
    ] },

  { id: "tizhi", when: L => L.flags.needTizhi && !L.flags.firstJobDone,
    title: "体制内还是体制外", prompt: L => L.year >= 2015 ? "找工作的时候，家里人反复说：考个编制，稳定。" : "工作不再包分配了。考公务员，还是去企业？",
    opts: [
      { label: "考公考编", odds: L => `两年内上岸的概率 ${pct(L.flags.pg = nz({ 985: .38, 211: .32, 一本: .26, 二本: .2, 专科: .12 }[L.uniTier], .2) * (["硕士", "博士"].includes(L.edu) ? 1.3 : 1) * (L.year < 2008 ? 1.5 : 1))}`, auto: L => L.year >= 2015 ? .35 : .2, fx: L => { L.flags.needTizhi = false; L.flags.tizhi = "in"; L._firstJob(); } },
      { label: "去企业", odds: L => L.year >= 2005 ? "工资高，也更累" : "去外企、民企闯一闯", auto: L => L.year >= 2015 ? .65 : .8, fx: L => { L.flags.needTizhi = false; L.flags.tizhi = "out"; L._firstJob(); } },
    ], note: L => L.year >= 2020 ? `2025年度国考平均约${NAT.civilExam}人竞争一个岗位。` : null, src: SRC.exam },

  { id: "bigtech", when: L => L.year >= 2008 && L.age >= 25 && L.age <= 36 && ["程序员", "工程师", "公司职员", "设计师", "游戏策划", "金融从业者"].includes(L.job) && !L.flags.bigTech && !L.abroad, p: () => .12,
    title: "大厂的offer", prompt: L => "一家大互联网公司给你发了offer，工资翻了一倍，听说加班很凶。",
    opts: [
      { label: "跳过去", odds: L => `月薪大约 ${yuanM(L, L._jobIncome(L.job, L.loc, L.age) * 1.7)}`, auto: L => .4 + L.risk * .3, fx: L => { L.flags.bigTech = true; L.boost = 1.7; L.pe("bigtech"); const c = L.pick(["北京", "上海", "深圳", "杭州"]); const p = { 北京: PI.北京, 上海: PI.上海, 深圳: PI.广东, 杭州: PI.浙江 }[c]; L._moveTo({ p, city: c, urban: true }); L.ev(`你跳槽去了${c}的一家大厂，开始过上了${L.year >= 2016 ? "“996”" : "加班到深夜"}的日子。`, "work"); } },
      { label: "留在原单位", odds: L => `月薪大约 ${yuanM(L, L._jobIncome(L.job, L.loc, L.age))}`, auto: L => .6 - L.risk * .3, fx: L => {} },
    ] },

  { id: "startup", when: L => L.year >= 1985 && L.age >= 26 && L.age <= 48 && L.job && !L.retired && !L.abroad && !["小老板"].includes(L.job), p: () => .03,
    title: "创业", prompt: L => L.year >= 2010 ? `你有一个${L.pick(["做APP", "开咖啡馆", "做电商", "开工作室", "做餐饮连锁"])}的想法，越想越觉得能成。` : `你看准了一个${L.pick(["开饭店", "做批发", "开厂", "搞运输"])}的生意。`,
    opts: [
      { label: "辞职创业", odds: () => "十个人里，一两个能做成", auto: L => .1 + L.risk * .35,
        fx: L => {
          const x = L.u() - L.luck * .04 - L.risk * .04 - L.apt * .03;
          if (x < .12) { const gain = 3e6 * Math.exp(L.norm(0, 1.1)); L.wealth += gain; L._setJob("小老板", null); L.boost = 2; L.pe("startupWin"); L.ev(`你辞职创业，几年后做成了，公司账上有了${fmtYuan(L.nominal(gain))}。`, "work"); }
          else if (x < .45) { L._setJob(L.year >= 2010 ? "小老板" : "个体户", null); L.ev("你辞职创业，生意勉强维持，收入时好时坏。", "work"); }
          else { const loss = Math.max(1e5, L.wealth * .5); L.wealth -= loss; L.flags.unemp = 1; L.pe("startupFail"); L.ev(`你辞职创业，两年后关门了，赔了${fmtYuan(L.nominal(loss))}。你又回去找了份工作。`, "work"); }
        } },
      { label: "继续上班", odds: () => "想法就留在想法里", auto: L => .9 - L.risk * .35, fx: L => {} },
    ] },

  { id: "abroad", when: L => ["本科", "硕士", "博士"].includes(L.edu) && L.age >= 22 && L.age <= 30 && L.year >= 1985 && !L.abroad && !L.flags.wasAbroad, p: L => .05 + (["985", "211"].includes(L.uniTier) ? .1 : 0) + L.fam * .08,
    title: "出国", prompt: L => { L.flags.ctry = L.flags.ctry || L.wpick(ABROAD); return `你拿到了去${L.flags.ctry}${L.year < 2000 ? "公派留学" : "读书工作"}的机会。`; },
    opts: [
      { label: "出国", odds: () => "大约一半的人后来回来了", auto: L => .35 + L.risk * .2, fx: L => { const c = L.flags.ctry; const city = { 美国: L.pick(["纽约", "洛杉矶", "旧金山", "西雅图", "波士顿"]), 加拿大: L.pick(["多伦多", "温哥华"]), 澳大利亚: L.pick(["悉尼", "墨尔本"]), 英国: "伦敦", 日本: L.pick(["东京", "大阪"]), 德国: L.pick(["柏林", "慕尼黑"]), 新加坡: "新加坡" }[c]; L.flags.wasAbroad = c; L.pe("abroad"); L._moveTo({ abroad: c, city }); if (L.job) L._setJob(L.pick(["工程师", "程序员", "公司职员", "高校/科研人员", "金融从业者"]), null); L.ev(`你去了${c}，在${city}落了脚。`, "move"); } },
      { label: "留在国内", odds: () => "离家近一些", auto: L => .65 - L.risk * .2, fx: L => {} },
    ] },

  { id: "house", repeat: 3, when: L => !L.house && L.loc.urban && !L.abroad && L.year >= 1998 && L.age >= 25 && L.age <= 50 && L.job && (L.married || L.age >= 28), p: () => .5,
    title: "买房", prompt: L => { const pr = L.housePrice(L.loc.city, L.year); const inc = L._jobIncome(L.job, L.loc, L.age); L.flags.hc = pr / inc > 22 && L.loc.city !== L.home.city ? L.home.city : L.loc.city; L.flags.hp2 = L.housePrice(L.flags.hc, L.year); return L.flags.hc === L.loc.city ? `${L.loc.city}的房价${L.year < 2010 ? "开始涨了" : "高得吓人"}。一套90平米的房子，总价大约${fmtYuan(L.nominal(L.flags.hp2))}。` : `${L.loc.city}的房子你买不起。老家${L.flags.hc}一套90平米的房子，总价大约${fmtYuan(L.nominal(L.flags.hp2))}。`; },
    opts: [
      { label: L => L.flags.hc === L.loc.city ? "咬牙买下" : `在${L.flags.hc}买`, odds: L => `首付大约 ${fmtYuan(L.nominal(L.flags.hp2 * .3))}`, auto: L => .55 + (L.married ? .15 : 0), fx: L => { L.pe("house"); L.house = { tier: cityTier(L.flags.hc), y: L.year, price: L.flags.hp2, city: L.flags.hc }; L.wealth -= L.flags.hp2 * .3; L.ev(`你在${L.flags.hc}买了房，${L.wealth < 0 ? "掏空了父母的积蓄，" : ""}贷款${L.pick([20, 25, 30])}年。`, "life"); } },
      { label: "再等等", odds: () => "房价可能涨，也可能跌", auto: L => .45 - (L.married ? .15 : 0), fx: L => {} },
    ] },

  { id: "stock", when: L => (L.year === 2007 || L.year === 2015) && L.age >= 22 && L.age <= 65 && L.job && !L.abroad, p: () => .5,
    title: "炒股", prompt: L => L.year === 2007 ? "股市天天涨，菜市场的大妈都在聊股票，大盘冲到了6000点。" : "牛市来了，大盘一路涨到5000点，同事们午饭都在看K线。",
    opts: [
      { label: "跟着入市", odds: () => "这一年进场的人，多数在之后亏了钱", auto: L => .3 + L.risk * .3, fx: L => { const amt = Math.max(2e4, L.wealth * .4); if (L.chance(.7)) { L.wealth -= amt * .5; L.ev(`你把${fmtYuan(L.nominal(amt))}投进了股市。没过多久大盘暴跌，你亏了一半。`, "life"); } else { L.wealth += amt * .3; L.ev("你进场炒了一阵，运气不错，在跌之前跑了出来，赚了一点。", "life"); } } },
      { label: "不碰", odds: () => "钱放在银行里", auto: L => .7 - L.risk * .3, fx: L => {} },
    ] },

  { id: "blind", when: L => !L.married && !L.flags.everM && L.age >= 28 && L.age <= 38 && L.flags.marryAge !== undefined && (L.flags.marryAge === null || L.flags.marryAge > L.age + 1) && L.year >= 1985, p: () => .35,
    title: "相亲", prompt: L => `${L.age}岁了，家里每次打电话都在催婚。${L.sex === "M" ? "母亲" : "姑姑"}给你安排了一场相亲。`,
    opts: [
      { label: "去相亲", odds: () => "合适就早点定下来", auto: () => .6, fx: L => { if (L.flags.marryAge === null ? L.chance(.5) : true) { L.flags.marryAge = L.age + 1; L.ev("相亲那天，你们聊得还行，之后又见了几次。", "love"); } else L.ev("相亲那天，你们都没什么话说。", "love"); } },
      { label: "不将就", odds: () => "宁缺毋滥", auto: () => .4, fx: L => { if (L.flags.marryAge !== null && L.chance(.3)) L.flags.marryAge = null; L.ev("你推掉了相亲，家里人很不高兴。", "love"); } },
    ] },

  { id: "second", when: L => L.married && L.kids.length === 1 && L.flags.secondOK && L.age - L.kids[0].born >= 1 && L.age - L.kids[0].born <= 6,
    title: "要不要二胎", prompt: L => {
      const y = L.year;
      if (y < 2016 && L.loc.urban && (JOBS[L.job] || {}).formal) return "你想再要一个孩子。可是按政策，城镇职工超生要罚款，还可能丢掉工作。";
      if (y < 2016) return L.kids[0].sex === "F" ? "第一胎是女儿，按当地政策可以再生一个。家里老人一直念叨着要个男孩。" : "你想再要一个孩子，但超生要罚一大笔钱。";
      return y >= 2021 ? "政策放开了，可以生二胎、三胎。可是养一个孩子已经很累了。" : "全面二孩放开了。身边有人在生二胎，也有人说养不起。"; },
    opts: [
      { label: "再要一个", odds: L => L.year < 2016 && L.loc.urban && (JOBS[L.job] || {}).formal ? "可能丢掉工作" : L.year < 2016 && !(L.kids[0].sex === "F" && !L.loc.urban) ? "要交一笔罚款" : "家里要再多一份开销", auto: L => L.year < 2016 ? (L.loc.urban ? .08 : .45) : .3,
        fx: L => { const y = L.year; L.flags.kidPlan = [...(L.flags.kidPlan || []), L.age + 1];
          if (y < 2016 && L.loc.urban && (JOBS[L.job] || {}).formal) { if (L.chance(.6)) { L.ev("因为超生，你被单位开除了。", "work"); L._setJob("个体户", null); } else L.ev("超生被罚了一大笔钱，评先进也没了你的份。", "life"); L.wealth -= 3e4; }
          else if (y < 2016 && !(L.kids[0].sex === "F" && !L.loc.urban)) { L.wealth -= 2e4; L.ev("家里交了一笔超生罚款。", "life"); } } },
      { label: "就一个", odds: () => "把精力放在一个孩子身上", auto: L => L.year < 2016 ? (L.loc.urban ? .92 : .55) : .7, fx: L => {} },
    ] },

  { id: "divorce", when: L => L.married && L.age >= 30 && L.age <= 60 && L.flags.mq < .35 && !L.flags.divorceAt, p: () => .06,
    title: "这段婚姻", prompt: () => "你们已经很久不说话了，吵架都懒得吵。",
    opts: [
      { label: "离婚", odds: () => "财产要分一半", auto: L => .3 + (L.year > 2000 ? .2 : 0), fx: L => { L._divorce(); } },
      { label: "凑合过", odds: () => "为了孩子，为了面子", auto: L => .7 - (L.year > 2000 ? .2 : 0), fx: L => { L.ev("你们没离。分房睡了很多年，日子也就这么过下来了。", "love"); L.flags.mq = .5; } },
    ] },

  { id: "care", when: L => L.flags.parentIll === L.age && L.loc.p !== L.home.p && !L.abroad && L.job,
    title: "回去照顾", prompt: L => `${!L.flags.fd ? "父亲" : "母亲"}需要人照顾。你在${L.loc.city}，老家离这里很远。`,
    opts: [
      { label: "辞职回去", odds: L => `回老家月收入大约 ${yuanM(L, L._jobIncome(L.job, { ...L.home, urban: true }, L.age))}`, auto: () => .35, fx: L => { L._goHome(); L._setJob(L.pickJob(), null); L.pe("care"); L.ev(`你辞了职，回到${L.home.city}，在${!L.flags.fd ? "父亲" : "母亲"}身边照顾了几年。`, "family"); } },
      { label: "请护工", odds: () => "每月寄钱回去，节假日回家", auto: () => .65, fx: L => { L.wealth -= L.income * .5; L.ev("你请了护工，每个月往家里寄钱，一有假就往回赶。", "family"); } },
    ] },

  { id: "grandkid", when: L => L.flags.grandkid && L.age >= 50 && L.age <= 72 && !L.abroad && L.age - L.flags.grandkid <= 2,
    title: "带孙辈", prompt: () => "孩子问你，能不能过去帮着带孙辈。",
    opts: [
      { label: "过去帮忙", odds: () => "离开老伙伴，去孩子的城市", auto: () => .65, fx: L => { L.pe("grandkid"); L.ev(`你收拾行李去了孩子那边，每天接送孙辈上下学${L.sex === "F" ? "，晚上在小区里跳广场舞" : ""}。`, "family"); } },
      { label: "过自己的日子", odds: () => "孩子可能有点失望", auto: () => .35, fx: L => { L.ev(`你没过去。${L.pick(["你报了老年大学的书法班。", "你和老伴开始到处旅游。", "你每天去公园和老朋友下棋。"])}`, "old"); } },
    ] },

  { id: "lend", when: L => L.age >= 25 && L.age <= 60 && L.job && L.wealth > 5e4, p: () => .02,
    title: "借钱", prompt: L => `一个多年的${L.pick(["老同学", "朋友", "亲戚"])}找你借${fmtYuan(L.nominal(Math.min(2e5, L.wealth * .3)))}，说是急用，年底就还。`,
    opts: [
      { label: "借给他", odds: () => "钱可能回不来", auto: () => .5, fx: L => { if (L.chance(.55)) { L.wealth -= Math.min(2e5, L.wealth * .3); L.ev("钱借出去了，再也没有还回来。后来你们也不联系了。", "life"); } else L.ev("钱借出去了，第二年他如数还了回来。", "life"); } },
      { label: "不借", odds: () => "关系可能就淡了", auto: () => .5, fx: L => { L.ev("你没借。之后他的朋友圈你再也看不到了。", "life"); } },
    ] },

  { id: "checkup", when: L => L.age >= 48 && L.age <= 52 && !L.abroad, p: () => .5,
    title: "体检", prompt: () => "单位或社区通知可以去做体检。你一直觉得身体还行。",
    opts: [
      { label: "每年都去", odds: L => `活到80岁的概率 ${pct(L.survProb(L.age, 80, x => L.ageMult(x) * .9))}`, auto: L => L.loc.urban ? .6 : .35, fx: L => { L.mult *= .9; L.flags.checkup = true; } },
      { label: "能不去就不去", odds: L => `活到80岁的概率 ${pct(L.survProb(L.age, 80, x => L.ageMult(x) * 1.05))}`, auto: L => L.loc.urban ? .4 : .65, fx: L => { L.mult *= 1.05; } },
    ], src: SRC.cancer, note: () => `我国癌症患者5年生存率约${NAT.cancer5y}%，越早发现，这个数字越高。` },

  { id: "stay", when: L => L.age >= 30 && L.age <= 38 && L.loc.p !== L.home.p && !L.abroad && L.job && !["公务员", "军人"].includes(L.job), p: () => .3,
    title: "留下还是回去", prompt: L => `你在${L.loc.city}待了好几年。父母打电话时，问你什么时候回来。`,
    opts: [
      { label: L => `留在${L.loc.city}`, odds: L => `月收入大约 ${yuanM(L, L._jobIncome(L.job, L.loc, L.age))}`, auto: () => .6, fx: L => {} },
      { label: "回老家", odds: L => `月收入大约 ${yuanM(L, L._jobIncome(L.job, { ...L.home, urban: true }, L.age))}，离父母近`, auto: () => .4, fx: L => { L._goHome(); L.ev(`你回到了${L.home.city}。`, "move"); } },
    ] },

  { id: "nursing", when: L => L.flags.frail && L.kids.length > 0 && !L.abroad,
    title: "谁来照顾你", prompt: () => "你需要人照顾了。",
    opts: [
      { label: "住养老院", odds: () => "不拖累孩子", auto: L => L.loc.urban ? .45 : .2, fx: L => { L.ev("你住进了养老院，孩子每周来看你一次。", "old"); } },
      { label: "跟孩子住", odds: () => "孩子要多操心", auto: L => L.loc.urban ? .55 : .8, fx: L => { L.ev("你搬去和孩子一起住，每天在窗边坐很久。", "old"); } },
    ] },

  { id: "scam", when: L => L.age >= 65 && L.age <= 85 && L.year >= 2005 && !L.abroad, p: () => .04,
    title: "免费讲座", prompt: () => "小区门口有人发鸡蛋，请你去听“健康讲座”。台上说，这款保健品能治高血压、软化血管。",
    opts: [
      { label: "买几盒试试", odds: () => "一盒一千多", auto: () => .35, fx: L => { L.wealth -= 3e4; L.ev("你前前后后买了好几万的保健品，被孩子发现后吵了一架。", "old"); } },
      { label: "拿了鸡蛋就走", odds: () => "", auto: () => .65, fx: L => { L.ev("你拿了鸡蛋就走了。", "old"); } },
    ] },

  { id: "dropout", when: L => L.inSchool && L.edu === "初中" && L.age >= 14 && L.age <= 15 && !L.home.urban && L.fam < .3 && L.year >= 1990 && L.year <= 2012, p: () => .3,
    title: "辍学", prompt: () => "家里供不起了。表哥说厂里在招人，包吃包住。",
    opts: [
      { label: "辍学去打工", odds: () => "每月能往家里寄钱", auto: () => .4, fx: L => { L.inSchool = false; L.flags.stopAt = L.age; L.ev("你没读完初中，就跟着表哥出去打工了。", "edu"); } },
      { label: "接着读", odds: L => `上高中的概率 ${pct(L.pHigh(L.effort))}`, auto: () => .6, fx: L => { L.ev("你咬牙接着读，周末去镇上帮人干活挣学费。", "edu"); } },
    ] },
];

// ---------- 随机事件 ----------
const RAND = [
  { id: "jingjian", a: [16, 40], p: .7, c: L => L.flags.jingjian && (L.year === 1961 || L.year === 1962), t: L => { L._goHome(); L.loc.urban = false; L._setJob("公社社员", null); return "城里精简职工，你被动员回了农村，又开始挣工分。"; }, tag: "work" },
  { id: "barefoot", a: [25, 60], p: .5, c: L => L.flags.barefoot && L.year === 1985, t: "“赤脚医生”改叫了“乡村医生”，你考了证，在村卫生室接着看病。", tag: "work" },
  { id: "drown", a: [4, 12], p: .006, c: L => !L.home.urban, t: "你在河边玩，掉进了水里，被路过的大人捞了上来。", tag: "health" },
  { id: "arm", a: [5, 14], p: .01, t: L => L.home.urban ? "你从单杠上摔下来，胳膊骨折，打了两个月石膏。" : "你爬树掏鸟窝摔了下来，胳膊骨折，打了两个月石膏。", tag: "health" },
  { id: "lost", a: [3, 7], p: .004, t: "你在集市上走丢了，大半天后才被找到。母亲抱着你哭了很久。", tag: "family" },
  { id: "dog", a: [4, 14], p: .006, c: L => L.year >= 1985, t: "你被狗咬了一口，打了五针狂犬疫苗。", tag: "health" },
  { id: "monitor", a: [8, 14], p: .04, c: L => L.inSchool && L.apt > .3, t: "你当上了班长。", tag: "edu" },
  { id: "first", a: [9, 17], p: .05, c: L => L.inSchool && L.apt > 1, t: "你考了全年级第一，奖状贴满了一面墙。", tag: "edu" },
  { id: "fight", a: [10, 17], p: .02, c: L => L.inSchool && L.sex === "M", t: "你在学校和人打了一架，家长被叫到了学校。", tag: "edu" },
  { id: "pdiv", a: [3, 17], p: .004, c: L => L.year >= 1985, t: L => `父母离婚了。你跟着${L.chance(.6) ? "母亲" : "父亲"}生活。`, tag: "family" },
  { id: "bike", a: [7, 13], p: .05, c: L => L.year < 2012, t: "你学会了骑自行车，膝盖摔破了好几次。", tag: "life" },
  { id: "talent", a: [9, 16], p: .012, c: L => !!L.hobby, t: L => ({ 篮球: "你进了学校篮球队，打进了全市比赛的决赛。", 画画: "你的画在全市少儿美术比赛里拿了一等奖。", 足球: "你进了校足球队，周末都在球场上。", 音乐: "你考过了乐器十级。", 下棋: "你在全市少年围棋赛里拿了冠军。", 跳舞: "你在学校文艺汇演上领舞。", 游戏: "你一款游戏打进了全服前一百。", 看书: "你的作文在全国比赛里拿了奖，被语文老师在班上念了一遍。" })[L.hobby], tag: "edu", fx: L => { L.flags.talent = true; } },
  { id: "sport", a: [12, 16], p: .004, c: L => ["篮球", "足球", "跳舞"].includes(L.hobby) && L.flags.talent, t: "体校的教练看中了你。你去了体校，每天训练六个小时。", tag: "edu", fx: L => { L.flags.athlete = true; } },
  { id: "crash", a: [18, 70], p: .004, c: L => L.year >= 1990, t: "你出了一场车祸，在医院躺了一个月。", tag: "health", fx: L => { L.mult *= 1.03; } },
  { id: "lottery", a: [20, 80], p: .0008, c: L => L.year >= 1990, t: L => { const g = L.chance(.95) ? 5e4 * Math.exp(L.norm(0, .8)) : 5e6; L.wealth += g; return `你买的彩票中了${fmtYuan(L.nominal(g))}。`; }, tag: "life" },
  { id: "fraud", a: [25, 85], p: .006, c: L => L.year >= 2012 && !L.abroad, t: L => { const g = Math.min(Math.max(2e4, L.wealth * .2), 5e5); L.wealth -= g; return `你接到一个自称“公检法”的电话，被骗走了${fmtYuan(L.nominal(g))}。`; }, tag: "life" },
  { id: "p2p", a: [25, 70], p: .1, c: L => L.year === 2018 && L.wealth > 1e5 && !L.abroad, t: L => { const g = L.wealth * .2; L.wealth -= g; return `你放在P2P平台上的${fmtYuan(L.nominal(g))}，随着平台暴雷没了。`; }, tag: "life" },
  { id: "pet", a: [20, 70], p: .02, c: L => L.year >= 2000 && L.loc.urban, t: L => { L.flags.pet = L.pick(PET_NAMES); L.flags.petAge = L.age; return `你养了一只${L.pick(["猫", "狗"])}，取名叫${L.flags.pet}。`; }, tag: "life" },
  { id: "petdie", a: [30, 90], p: .25, c: L => L.flags.pet && L.age - L.flags.petAge >= 12, t: L => `${L.flags.pet}老死了。你把它埋在了一棵树下。`, tag: "loss" },
  { id: "car", a: [24, 55], p: L => L.year >= 2003 ? .05 : L.year >= 1995 ? .01 : 0, c: L => L.job && !L.abroad, t: L => `你买了人生第一辆车，${L.pick(["是辆二手的", "开回家那天绕着小区转了三圈", "贷款买的"])}。`, tag: "life" },
  { id: "fly", a: [16, 85], p: L => L.year < 1995 ? .003 : L.year < 2010 ? .03 : .1, t: "你第一次坐飞机，起飞的时候紧紧攥着扶手。", tag: "life" },
  { id: "travel", a: [20, 75], p: L => L.year >= 2005 ? .02 + L.fam * .02 : 0, c: L => !L.abroad, t: L => `你第一次出国旅游，去了${L.pick(["泰国", "日本", "韩国", "新加坡", "法国", "越南"])}。`, tag: "life" },
  { id: "marathon", a: [25, 55], p: .006, c: L => L.year >= 2015, t: "你跑完了人生第一个全程马拉松。", tag: "health", fx: L => { L.mult *= .97; } },
  { id: "quit", a: [30, 65], p: .04, c: L => L.smoker, t: L => L.flags.htn ? "查出高血压之后，你把烟戒了。" : "你戒烟了，戒了三次才成功。", tag: "health", fx: L => { L.smoker = false; } },
  { id: "promo", a: [28, 50], p: .05, c: L => L.job && (JOBS[L.job] || {}).white, t: L => `你升了职，手下管着${3 + Math.floor(L.u() * 20)}个人。`, tag: "work", fx: L => { L.indiv *= 1.2; } },
  { id: "depress", a: [15, 55], p: .003, t: "你得了抑郁症，看了一年多的医生，慢慢好了起来。", tag: "health", help: true },
  { id: "surgery", a: [40, 75], p: .01, t: L => `你做了一次手术，切掉了${L.pick(["胆囊", "阑尾", "一个甲状腺结节"])}。`, tag: "health" },
  { id: "reunion", a: [35, 50], p: .02, t: L => L.flags.crush ? "同学聚会上，你见到了当年在车棚等你的那个人。大家都老了。" : "同学聚会上，你见到了很多年没见的老同学。有人发了财，有人已经不在了。", tag: "life" },
  { id: "hero", a: [18, 60], p: .0008, t: "你跳进河里，救起了一个落水的孩子，上了本地新闻。", tag: "life" },
  { id: "chaiqian", a: [25, 80], p: .012, c: L => L.year >= 2000 && L.year <= 2019 && !L.abroad && (cityTier(L.home.city) <= 2 || !L.home.urban), t: L => { const g = (L.home.urban ? 1.5e6 : 6e5) * Math.exp(L.norm(0, .6)); L.wealth += g; return `你家的老房子拆迁了，赔了${fmtYuan(L.nominal(g))}。${L.older + L.younger > 0 ? "兄弟姐妹为了怎么分，吵了好几个月。" : ""}`; }, tag: "life" },
  { id: "sibling", a: [20, 60], p: .01, c: L => L.older + L.younger > 0, t: L => { const s = L.older > 0 ? L.pick(["哥哥", "姐姐"]) : L.pick(["弟弟", "妹妹"]); return L.pick([`你${s}去了深圳闯荡，后来在那边安了家，一年回来一次。`, "兄弟姐妹几个凑钱，给父母翻修了老房子。", `你${s}结婚，你出了一大笔钱。`, `你${s}生意失败，找你借了一笔钱。`]); }, tag: "family" },
  { id: "dance", a: [55, 80], p: .05, c: L => L.sex === "F" && !L.abroad && L.year >= 2005, t: "你加入了小区的广场舞队，每天晚上七点准时到。", tag: "old" },
  { id: "fish", a: [50, 80], p: .03, c: L => L.sex === "M", t: "你迷上了钓鱼，周末都在水库边坐着。", tag: "old" },
  { id: "stroke", a: [60, 88], p: .012, c: L => !L.flags.stroke, t: "你中风了一次。抢救了回来，说话从此有点不利索。", tag: "health", fx: L => { L.flags.stroke = true; } },
  { id: "fall", a: [75, 100], p: .02, c: L => !L.flags.fall, t: "你在家里摔了一跤，髋骨骨折，在床上躺了三个月。", tag: "health", fx: L => { L.flags.fall = true; L.mult *= 1.15; } },
  { id: "frail", a: [78, 105], p: .035, c: L => !L.flags.frail, t: L => L.kids.length ? null : "你一个人生活不方便了，住进了养老院。", tag: "old", fx: L => { L.flags.frail = true; } },
  { id: "dementia", a: [75, 105], p: .006, c: L => !L.flags.dem, t: "你开始记不清事情，常常认不出熟人。医生说是阿尔茨海默病。", tag: "health", fx: L => { L.flags.dem = true; } },
  { id: "back", a: [28, 55], p: .05, c: L => L.abroad, t: L => { L._goHome(); if (L.job) L._setJob(L.pick(["工程师", "公司职员", "高校/科研人员", "金融从业者"]), { p: PI[L.pick(["北京", "上海", "广东"])], urban: true }); return `你在${L.flags.wasAbroad}待了些年，决定回国，去了${L.loc.city}。`; }, tag: "move" },
  { id: "abroadNY", a: [22, 60], p: .2, c: L => L.abroad, t: L => `第一年在${L.loc.abroad}过春节，你和几个中国同学包了顿饺子，打视频给家里拜年。`, tag: "life" },
  { id: "athleteJob", a: [17, 19], p: .5, c: L => L.flags.athlete && !L.job, t: L => { L._setJob("运动员", null); L.inSchool = false; L.flags.stopAt = L.age; L.flags.enterDone = true; return "你成了一名职业运动员，拿过两次省运会的奖牌。"; }, tag: "work" },
  { id: "writer", a: [25, 45], p: .004, c: L => L.hobby === "看书" && L.job, t: L => { L.flags.book = true; return "你出版了自己的第一本书，卖了三千册。"; }, tag: "work" },
  { id: "gamedev", a: [24, 40], p: .02, c: L => L.hobby === "游戏" && L.year >= 2008 && isCol(L) && L.job && L.job !== "游戏策划", t: L => { L._setJob("游戏策划", null); return "你转行进了游戏公司，当上了数值策划，每天和表格、公式打交道。"; }, tag: "work" },
  { id: "promoT", a: [40, 58], p: .01, c: L => L.job === "公务员", t: "你提拔成了科长。", tag: "work", fx: L => { L.indiv *= 1.15; } },
];
