// ===== 界面 =====
(function () {
  const $ = s => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const TAGS = { pers: "性格", era: "时代", culture: "流行", birth: "出生", family: "家庭", edu: "学业", move: "迁徙", work: "工作", love: "婚恋", life: "生活", health: "健康", loss: "离别", old: "晚年", death: "离世" };
  const NOW_YEAR = new Date().getFullYear();
  const LC_SET = new Set(typeof LC_CHARS === "string" ? LC_CHARS : "");
  const handOK = s => [...s].every(ch => LC_SET.has(ch) || ch.charCodeAt(0) < 128);
  document.addEventListener("input", e => { if (e.target.tagName === "TEXTAREA") e.target.style.fontFamily = handOK(e.target.value) ? "" : "var(--f-body)"; });

  // ---------- 计数器 ----------
  const t0 = performance.now();
  const bps = NAT.births25 * 1e4 / 31536000, dps = NAT.deaths25 * 1e4 / 31536000;
  function tickCounters() {
    const s = (performance.now() - t0) / 1000;
    $("#cBorn").textContent = Math.floor(s * bps).toLocaleString("zh-CN");
    $("#cDead").textContent = Math.floor(s * dps).toLocaleString("zh-CN");
  }
  setInterval(tickCounters, 250); tickCounters();

  // ---------- 省份表 ----------
  const sel = $("#myProv");
  [...PROVS].sort((a, b) => a.name.localeCompare(b.name, "zh-CN")).forEach(p => sel.append(new Option(p.name, p.i)));
  const saved = store.get("l14b.settings", {});
  if (saved.myProv != null) sel.value = saved.myProv;
  const msel = $("#myMbti");
  Object.keys(MBTI_NAME).forEach(t => msel.append(new Option(`${t} ${MBTI_NAME[t]}`, t)));
  if (saved.myMbti) msel.value = saved.myMbti;
  if (saved.pace) { const r = document.querySelector(`input[name=pace][value="${saved.pace}"]`); if (r) r.checked = true; }
  if (saved.skip) $("#skipHeavy").checked = true;
  if (saved.auto) $("#autoPick").checked = true;
  const ysel = $("#yearSel");
  for (let y = NOW_YEAR - 1; y >= 1950; y--) ysel.append(new Option(`${y}年`, y));
  const syncEra = () => { ysel.hidden = !$("#eraPast").checked; };
  if (saved.era === "past") $("#eraPast").checked = true;
  if (saved.year) ysel.value = saved.year;
  document.querySelectorAll("input[name=era]").forEach(r => { r.onchange = syncEra; }); syncEra();
  const BY = Object.entries(BIRTHS_BY_YEAR).map(([y, n]) => [+y, n]);

  function provTable(highlight) {
    if (!$("#provTable")) return;
    const rows = [...PROVS].sort((a, b) => b.births - a.births);
    const max = rows[0].share;
    let h = `<thead><tr><th>省份</th><th>出生占比</th><th class="n">预期寿命</th><th class="n">城镇化率</th><th class="n">城镇人均收入</th><th class="n">农村人均收入</th><th class="n">每10万人大学学历</th></tr></thead><tbody>`;
    for (const p of rows) {
      const me = highlight && highlight.includes(p.i);
      h += `<tr class="${me ? "me" : ""}"><td>${p.name}</td><td class="mono"><span class="sharebar" style="width:${Math.max(2, 70 * p.share / max)}px"></span>${(p.share * 100).toFixed(2)}%</td>
        <td class="n">${p.le.toFixed(1)}</td><td class="n">${(p.urb * 100).toFixed(1)}%</td><td class="n">${p.uInc.toLocaleString()}</td><td class="n">${p.rInc.toLocaleString()}</td><td class="n">${p.col.toLocaleString()}</td></tr>`;
    }
    $("#provTable").innerHTML = h + `</tbody>`;
  }
  provTable();

  // ---------- 状态 ----------
  let S = null;
  if (window.__l14bStop) { try { window.__l14bStop(); } catch (e) {} }
  window.__l14bStop = () => { if (S && S.timer) clearTimeout(S.timer); if (S) S.dead = true; };

  $("#setup").onsubmit = e => { e.preventDefault(); };
  $("#bornBtn").disabled = false; $("#bornBtn").textContent = "出生";
  $("#bornBtn").onclick = () => { try { start(); } catch (err) { console.error(err); window.__l14bErr && window.__l14bErr(String(err && err.message || err)); } };

  function settings() {
    return {
      pace: +document.querySelector("input[name=pace]:checked").value,
      myProv: sel.value === "" ? null : +sel.value,
      skip: $("#skipHeavy").checked, auto: $("#autoPick").checked,
      era: $("#eraPast").checked ? "past" : "now", year: ysel.value, myMbti: msel.value || null,
    };
  }

  function start() {
    const st = settings();
    store.set("l14b.settings", { pace: st.pace, myProv: st.myProv, skip: st.skip, auto: st.auto, era: st.era, year: st.year, myMbti: st.myMbti });
    if (S && S.timer) clearTimeout(S.timer);
    const seed = (Math.random() * 2 ** 32) >>> 0;
    const pickY = () => { let t = BY.reduce((s, [, n]) => s + n, 0), x = Math.random() * t; for (const [y, n] of BY) { x -= n; if (x <= 0) return y; } return 1990; };
    const y0 = st.era === "now" ? NOW_YEAR : (st.year ? +st.year : pickY());
    const life = new Life(seed, { heavy: !st.skip, auto: st.auto, y0 });
    const peers = [1, 2, 3, 4].map(k => new Life((seed + k * 2654435761) >>> 0, { heavy: !st.skip, auto: true, y0 }));
    S = { st, life, peers, paused: false, fast: false, waiting: false, timer: null, notes: {}, seed, y0, randYear: st.era === "past" && !st.year };
    $("#cover").hidden = true;
    $("#endBox").hidden = true; $("#endBox").innerHTML = "";
    $("#fileBox").hidden = true;
    $("#sheet").innerHTML = "";
    $("#bAuto").setAttribute("aria-pressed", st.auto ? "true" : "false");
    $("#bPause").setAttribute("aria-pressed", "false"); $("#bPause").textContent = "暂停";
    $("#bFast").setAttribute("aria-pressed", "false");
    window.scrollTo({ top: 0 });
    draw(life).then(() => openFile());
  }

  // ---------- 抽签动画 ----------
  function draw(life) {
    const box = $("#drawBox"); box.hidden = false;
    $("#dYearRow").hidden = !S.randYear;
    ["dYear", "dProv", "dUrb", "dSex"].forEach(id => { $("#" + id).textContent = "—"; $("#" + id).classList.add("rolling"); $("#" + id + "O").textContent = ""; });
    const P = life.P;
    const rollTo = (id, pool, final, ms) => new Promise(res => {
      if (RM) { $("#" + id).textContent = final; $("#" + id).classList.remove("rolling"); return res(); }
      const node = $("#" + id); const t = performance.now();
      (function f() {
        const k = (performance.now() - t) / ms;
        if (k >= 1) { node.textContent = final; node.classList.remove("rolling"); return res(); }
        node.textContent = pool();
        setTimeout(f, 40 + 220 * k * k);
      })();
    });
    const wprov = () => PROVS[life.wpick.call({ r: Math.random }, PROVS.map(p => [p.i, p.births]))].name;
    const wyear = () => { let t = BY.reduce((s, [, n]) => s + n, 0), x = Math.random() * t; for (const [y, n] of BY) { x -= n; if (x <= 0) return y + "年"; } return "1990年"; };
    const yr = S.randYear ? rollTo("dYear", wyear, life.y0 + "年", 1500).then(() => { $("#dYearO").textContent = `那一年全国出生了约${BIRTHS_BY_YEAR[life.y0]}万人`; }) : Promise.resolve();
    return yr.then(() => rollTo("dProv", wprov, P.name, 1700))
      .then(() => { $("#dProvO").textContent = `概率 ${(P.share * 100).toFixed(2)}%，每${Math.round(1 / P.share)}个新生儿里有1个出生在这里`; })
      .then(() => rollTo("dUrb", () => Math.random() < .5 ? "城镇" : "农村", life.urban ? "城镇" : "农村", 700))
      .then(() => { $("#dUrbO").textContent = life.y0 >= 2023 ? `${P.name}城镇化率 ${(P.urb * 100).toFixed(1)}%` : `${life.y0}年全国城镇化率约 ${Math.round(interp(TS.urb, life.y0) * 100)}%`; })
      .then(() => rollTo("dSex", () => Math.random() < .5 ? "男" : "女", life.sex === "M" ? "男" : "女", 500))
      .then(() => { $("#dSexO").textContent = `出生性别比 ${NAT.srb}（女=100）`; })
      .then(() => new Promise(r => setTimeout(r, RM ? 300 : 900)));
  }

  function openFile() {
    const L = S.life;
    $("#drawBox").hidden = true;
    $("#fileBox").hidden = false;
    $("#fileNo").textContent = `No. ${String(S.seed).padStart(10, "0")}`;
    const fam = L.fam < 0.12 ? "困难" : L.fam < 0.4 ? "偏紧" : L.fam < 0.75 ? "普通" : L.fam < 0.94 ? "宽裕" : "优渥";
    const fields = [["姓名", L.name], ["性别", L.sex === "M" ? "男" : "女"], ["出生", `${L.y0}年`], ["城乡", L.home.urban ? "城镇" : "农村"],
      ["出生地", L.place, "wide"], ["家境", fam], ["出生那年的预期寿命", `${L.targetLE().toFixed(0)}岁`],
      ["性格（MBTI）", "14岁时揭晓", "", "fMbti"], ["状态", "在世", "", "fState"]];
    $("#fields").innerHTML = fields.map(([k, v, c, id]) => `<div class="field ${c || ""}"><span class="lbl">${k}</span><span class="v"${id ? ` id="${id}"` : ""}>${esc(v)}</span></div>`).join("");
    const avg = L.targetLE();
    $("#avgMark").style.left = Math.min(100, avg / 110 * 100) + "%";
    $("#avgMark").title = `当地同类人群的预期寿命：${avg.toFixed(0)}岁`;
    renderPeers();
    // 出生事件已在构造时生成
    L.log.forEach(e => addEntry(e));
    updateBar();
    schedule(1200);
  }

  function schedule(ms) {
    clearTimeout(S.timer);
    if (S.paused || S.waiting || S.life.done) return;
    S.timer = setTimeout(tick, ms);
  }
  function yearMs() { return S.st.pace * 1000 / (S.fast ? 2.5 : 1); }

  function tick() {
    try { tick0(); } catch (err) { console.error(err); if (S && !S.life.done) { S.waiting = false; schedule(yearMs()); } }
  }
  function tick0() {
    if (S.dead) return;
    const L = S.life;
    if (S.waiting || S.paused) return;
    const res = L.step();
    let extra = 0;
    for (const e of res.events) {
      if (e.tag === "pause") { if (!L.opts.auto) { addPause(e); S.waiting = true; } }
      else { addEntry(e); extra += (S.fast ? 260 : 650) * Math.min(2.2, S.st.pace / 1.8); }
    }
    if (res.choice) {
      // 同年的停顿卡先处理
      if (S.waiting) S.pendingChoice = res.choice; else showChoice(res.choice);
    }
    // 同伴同步到同一年龄
    for (const p of S.peers) { let g = 0; while (!p.done && p.age <= L.age && g++ < 3) p.step(); }
    renderPeers();
    updateBar();
    if (L.done) return finish();
    if (!S.waiting) schedule(yearMs() + extra);
  }

  function updateBar() {
    const L = S.life;
    const a = L.alive ? L.age : L.deathAge;
    $("#nowYear").textContent = L.y0 + a;
    $("#nowAge").textContent = `${a}岁 · ${L.alive ? L.status() : "已离世"}`;
    $("#track").style.width = Math.min(100, a / 110 * 100) + "%";
  }

  function renderPeers() {
    const alive = S.peers.filter(p => p.alive).length;
    $("#peerNote").textContent = alive === 4 ? "" : `${4 - alive}人已离世`;
    $("#peers").innerHTML = S.peers.map(p => {
      const where = `${p.P.name}·${p.home.urban ? "城镇" : "农村"}`;
      return `<div class="peer ${p.alive ? "" : "gone"}"><b>${esc(p.name)}</b><span class="where">${where}</span><div class="st">${esc(p.status())}</div></div>`;
    }).join("");
  }

  function addEntry(e) {
    if (e.tag === "pers" && S && S.life) { const f = $("#fMbti"); if (f) f.textContent = S.life.mbti.map(m => m.type).join(" → "); }
    const row = el("div", "entry " + (e.tag || ""));
    const fact = e.fact ? `<div class="fact">${esc(e.fact)}${(e.src || e.factSrc) ? ` <cite>· ${esc(e.factSrc || e.src)}</cite>` : ""}</div>` : (e.src && e.src === SRC.model ? "" : "");
    row.innerHTML = `<div class="when"><b>${e.age}岁</b>${e.year}</div><div><div class="txt"><span class="tag">${TAGS[e.tag] || ""}</span>${e.mbti ? `<span class="chip">${e.prevMbti && e.prevMbti !== e.mbti ? `<s>${e.prevMbti}</s> ` : ""}${e.mbti}</span>` : ""}${esc(e.text)}</div>${fact}${e.help ? helpHtml() : ""}</div>`;
    $("#sheet").append(row);
    follow(row);
  }
  function helpHtml() { return `<div class="help">如果你或身边的人正处在困难中，可以拨打全国心理援助热线 <b>12356</b>，或希望24热线 <b>400-161-9995</b>。</div>`; }
  function follow(node) {
    const r = node.getBoundingClientRect();
    if (r.bottom > innerHeight - 20) window.scrollBy({ top: r.bottom - innerHeight + 80, behavior: RM ? "auto" : "smooth" });
  }

  function showChoice(c) {
    S.waiting = true;
    const L = S.life;
    const card = el("div", "card");
    card.innerHTML = `<span class="lbl">${L.age}岁 · ${L.year} · 抉择</span><h3>${esc(c.title)}</h3><p>${esc(c.prompt)}</p>
      <div class="opts">${c.options.map((o, k) => `<button type="button" class="opt" data-k="${k}"><b>${esc(o.label)}</b>${o.odds ? `<span class="${/\d/.test(o.odds) ? "" : "cn"}">${esc(o.odds)}</span>` : ""}</button>`).join("")}</div>
      <p class="note">${c.note ? esc(c.note) + " " : ""}选择只改变概率。${c.src ? "来源：" + esc(c.src) : ""}</p>`;
    $("#sheet").append(card);
    follow(card);
    const go = k => {
      L.choose(c.id, k);
      card.classList.add("done");
      card.insertAdjacentHTML("beforeend", `<p class="picked">你选了 <b>${esc(c.options[k].label)}</b>　${esc(c.options[k].odds)}</p>`);
      S.waiting = false;
      schedule(400);
    };
    card.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => go(+b.dataset.k)));
    if (L.opts.auto) setTimeout(() => go(L.wpick(c.options.map((o, k) => [k, o.auto]))), S.fast ? 900 : 1800);
    else card.querySelector(".opt").focus({ preventScroll: true });
  }

  function addPause(e) {
    const card = el("div", "card");
    const id = "note" + e.age;
    card.innerHTML = `<span class="lbl">${e.age}岁 · 暂停片刻</span><h3>${esc(e.q)}</h3>
      <label class="lbl" for="${id}">写一行给自己（可以不写）</label><textarea id="${id}" maxlength="120"></textarea>
      <button type="button" class="btn">继续</button>`;
    $("#sheet").append(card);
    follow(card);
    card.querySelector("button").addEventListener("click", () => {
      const v = card.querySelector("textarea").value.trim();
      if (v) S.notes[e.age] = v;
      card.classList.add("done");
      card.querySelector("textarea").readOnly = true;
      card.querySelector("button").remove();
      S.waiting = false;
      if (S.pendingChoice) { const c = S.pendingChoice; S.pendingChoice = null; showChoice(c); }
      else schedule(400);
    });
  }

  // 控制
  $("#bPause").onclick = (() => {
    if (!S) return;
    S.paused = !S.paused;
    $("#bPause").setAttribute("aria-pressed", S.paused); $("#bPause").textContent = S.paused ? "继续" : "暂停";
    if (!S.paused) schedule(200); else clearTimeout(S.timer);
  })
  $("#bFast").onclick = (() => {
    if (!S) return; S.fast = !S.fast; $("#bFast").setAttribute("aria-pressed", S.fast);
    if (!S.waiting && !S.paused) schedule(150);
  })
  $("#bAuto").onclick = (() => {
    if (!S) return; S.life.opts.auto = !S.life.opts.auto; $("#bAuto").setAttribute("aria-pressed", S.life.opts.auto);
    const open = $("#sheet .card:not(.done) .opt");
    if (S.life.opts.auto && open) open.click();
    const pz = $("#sheet .card:not(.done) .btn");
    if (S.life.opts.auto && pz) pz.click();
  })

  // ---------- 结局 ----------
  function finish() {
    const L = S.life, s = L.summary();
    for (const p of S.peers) p.runToEnd();
    renderPeers();
    updateBar();
    const box = $("#endBox"); box.hidden = false;
    const fs = $("#fState"); if (fs) { fs.textContent = "已故"; fs.classList.add("gone"); }
    const avg = L.targetLE();
    const imr = interp(TS.imr, s.birthYear);
    const line = s.age < 1 ? `TA的一生只有不到一年。${s.birthYear}年出生的婴儿里，大约每${Math.round(1 / imr)}个就有1个没能过完第一年。`
      : s.age < 18 ? `TA没能长大成人。` : s.age < avg - 10 ? `TA比出生那年的预期寿命少活了${Math.round(avg - s.age)}年。` : s.age > avg + 5 ? `TA比出生那年的预期寿命多活了${Math.round(s.age - avg)}年。` : "TA活到了和出生那年的预期寿命差不多的年纪。";
    const cities = s.cities.join(" → ");
    const job = s.jobs.length ? s.jobs.join("、") : "—";
    const fam = s.married ? (s.kids ? `结婚，${s.kids}个孩子` : "结婚，没有孩子") : (s.age >= 25 ? "没有结婚" : "—");
    const eduTxt = s.edu === "本科" && s.tier ? `本科（${s.tier === "985" || s.tier === "211" ? s.tier : s.tier + "院校"}）` : s.edu;
    box.innerHTML = `
      <div class="epitaph">
        <span class="lbl">档案封存</span>
        <div class="nm">${esc(s.name)}</div>
        <div class="yrs">${s.birthYear} — ${s.deathYear}　享年${s.age}岁</div>
        <p class="line">${esc(s.place)}出生。${esc(line)}</p>
        <div class="stamp ${RM ? "" : "in"}">已归档</div>
      </div>
      <p class="keep"><b>截个图吧。</b>这一生只有这一次，下一次出生就是另一个人了。把档案和下面的结局截图留着，或者生成分享图发给朋友。</p>
      <div class="facts">
        <div class="fact-c"><span class="lbl">最高学历</span><div class="v">${esc(eduTxt)}</div></div>
        <div class="fact-c"><span class="lbl">死因</span><div class="v">${esc(L.opts.heavy || s.cause !== "自杀" ? s.cause : "未记录")}</div></div>
        <div class="fact-c"><span class="lbl">生活过的地方</span><div class="v">${esc(cities)}</div></div>
        <div class="fact-c"><span class="lbl">做过的工作</span><div class="v">${esc(job)}</div></div>
        <div class="fact-c"><span class="lbl">一生的劳动收入（折合今天的钱）</span><div class="v">${s.earn ? fmtYuan(s.earn) : "—"}</div></div>
        <div class="fact-c"><span class="lbl">留下的财产（折合今天的钱）</span><div class="v">${s.wealth > 1000 ? fmtYuan(s.wealth) : "几乎没有"}${L.house ? `，含${L.house.city}的一套房` : ""}</div></div>
        <div class="fact-c"><span class="lbl">婚育</span><div class="v">${esc(fam)}</div></div>
        <div class="fact-c"><span class="lbl">养老金</span><div class="v">${s.pension ? `每月约${fmtYuan(s.pension)}（当年的钱）` : s.age >= 60 ? "没有" : "—"}</div></div>
      </div>
      ${mbtiBlock(L, s)}
      <div class="rank" id="rank"><span class="lbl">和同年出生的人比</span><p class="fine" id="rankProg">正在模拟另外800个同年出生的人……</p></div>
      ${peerTable()}
      ${compareMine(s)}
      <div class="card" style="margin:0"><span class="lbl">最后</span><h3>你想对${esc(s.name)}说一句什么？</h3>
        <label class="lbl" for="lastWord">这句话会写进分享图里，也可以直接截图保存这一页</label><textarea id="lastWord" maxlength="40"></textarea>
        <button type="button" class="btn" id="mkShare">生成分享图</button></div>
      <div class="share" id="share"></div>
      <div class="actions"><button type="button" class="born-btn" id="again">再出生一次</button><button type="button" class="btn ghost" id="home">回到首页，重新选择</button></div>
      <p class="fine">“再出生一次”沿用这次的设置；回到首页可以换一个出生年份。</p>
      ${pastHtml(s)}
    `;
    $("#home").onclick = goHome;
    $("#again").addEventListener("click", () => { try { start(); } catch (err) { window.__l14bErr && window.__l14bErr(String(err && err.message || err)); } });
    $("#mkShare").addEventListener("click", () => makeShare(s, $("#lastWord").value.trim()));
    saveLife(s);
    provTable([L.home.p, ...(S.st.myProv != null ? [S.st.myProv] : [])]);
    setTimeout(() => box.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" }), 500);
    cohort(s);
  }

  function goHome() {
    if (S) { clearTimeout(S.timer); S.dead = true; }
    $("#endBox").hidden = true; $("#endBox").innerHTML = "";
    $("#fileBox").hidden = true; $("#drawBox").hidden = true; $("#sheet").innerHTML = "";
    $("#cover").hidden = false;
    window.scrollTo({ top: 0 });
  }

  function mbtiBlock(L, s) {
    const m = L.mbti;
    if (!m.length) return `<div class="mbti"><span class="lbl">性格（MBTI）</span><p>TA没来得及长成什么性格。</p></div>`;
    const lab = ["上中学时", "工作几年后", "走到最后"];
    const cols = m.map((x, k) => `<div class="mb-col"><span class="lbl">${lab[x.i]}<br>${x.age}岁</span><b class="mb-code">${x.type}</b><span class="mb-name">${MBTI_NAME[x.type]}</span></div>`).join(`<span class="mb-arrow" aria-hidden="true">→</span>`);
    // 四个维度的位置变化（HTML，手机上也能看清）
    const pos = v => ((clamp(v, -1.2, 1.2) + 1.2) / 2.4 * 100).toFixed(1);
    const L2 = { ei: ["I", "E"], sn: ["S", "N"], tf: ["T", "F"], jp: ["J", "P"] };
    const rows = AX.map(ax => {
      const ps = m.map(x => +pos(x.pers[ax]));
      const lo = Math.min(...ps), hi = Math.max(...ps);
      const dots = ps.map((p, k) => `<i class="d${k === ps.length - 1 ? "z" : k}" style="left:${p}%"></i>`).join("");
      return `<div class="ax-row"><span class="ax-l">${L2[ax][0]} ${AXW[ax][0]}</span><div class="ax-track"><b style="left:${lo}%;width:${(hi - lo).toFixed(1)}%"></b>${dots}</div><span class="ax-r">${AXW[ax][1]} ${L2[ax][1]}</span></div>`;
    }).join("");
    const changes = m.slice(1).map((x, k) => x.type === m[k].type ? null : `${m[k].age}岁到${x.age}岁，` + x.why.map(w => w.by ? `${w.by}让TA更${w.word}` : `TA慢慢变得更${w.word}`).join("，")).filter(Boolean);
    const first = m[0].type, last = m[m.length - 1].type;
    const nDiff = [...first].filter((c, k) => c !== last[k]).length;
    const summ = m.every(x => x.type === first) ? `TA一辈子都是${first}。` : nDiff === 0 ? `TA中途变过，最后又回到了${first}。` : `从${first}到${last}，TA变了${nDiff}个字母。`;
    let mine = "";
    if (S.st.myMbti) { const same = [...S.st.myMbti].filter((c, k) => c === last[k]).length; mine = `<p class="fine">你自己是${S.st.myMbti}，和TA最后的${last}有${same}个字母相同。${same === 4 ? "你们是同一类人。" : ""}</p>`; }
    return `<div class="mbti"><span class="lbl">性格的变化（MBTI）</span>
      <div class="mb-cols">${cols}</div>
      <div class="mb-axes" role="img" aria-label="四个维度的变化">${rows}
      <p class="fine">空心点是上中学时，灰点是工作几年后，红点是最后。</p></div>
      <p class="mb-sum">${esc(summ)}${changes.length ? esc(changes.join("。") + "。") : ""}</p>
      <p class="fine" id="mbtiCohort">正在统计同龄人的性格变化……</p>${mine}</div>`;
  }

  function peerTable() {
    const all = [S.life, ...S.peers];
    const rows = all.map((p, k) => { const s = p.summary(); return `<tr class="${k === 0 ? "me" : ""}"><td>${esc(s.name)}${k === 0 ? "（你）" : ""}</td><td>${s.prov}·${s.urban ? "城镇" : "农村"}</td><td class="n">${s.age}</td><td>${s.edu}</td><td class="mono">${s.mbti.length ? s.mbti.join("→") : "—"}</td><td>${esc(s.jobs[0] || "—")}</td><td class="n">${s.earn ? fmtYuan(s.earn) : "—"}</td><td>${esc(p.opts.heavy || s.cause !== "自杀" ? s.cause : "未记录")}</td></tr>`; }).join("");
    return `<h3 class="sec">同一分钟出生的5个人</h3><div class="tbl-wrap"><table><thead><tr><th>姓名</th><th>出生地</th><th class="n">享年</th><th>学历</th><th>性格</th><th>第一份工作</th><th class="n">一生收入</th><th>死因</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function compareMine(s) {
    if (S.st.myProv == null) return "";
    const a = PROVS[S.life.home.p], b = PROVS[S.st.myProv];
    if (a.i === b.i) return `<p class="fine">TA和你出生在同一个省份：${a.name}。</p>`;
    const r = (k, f, unit = "") => `<tr><td>${k}</td><td class="n">${f(a)}${unit}</td><td class="n">${f(b)}${unit}</td></tr>`;
    return `<h3 class="sec">TA的${a.name}，你的${b.name}</h3><div class="tbl-wrap"><table><thead><tr><th></th><th class="n">${a.name}</th><th class="n">${b.name}</th></tr></thead><tbody>
      ${r("出生占比", p => (p.share * 100).toFixed(2), "%")}${r("预期寿命", p => p.le.toFixed(1), "岁")}${r("城镇化率", p => (p.urb * 100).toFixed(1), "%")}
      ${r("城镇人均可支配收入", p => p.uInc.toLocaleString(), "元")}${r("农村人均可支配收入", p => p.rInc.toLocaleString(), "元")}
      ${r("每10万人大学学历", p => p.col.toLocaleString(), "")}${r("跨省流出人口", p => p.out, "万")}</tbody></table></div>`;
  }

  function cohort(s) {
    const N = 800, ages = [], earns = [], mb = { n: 0, same: 0, ch: 0, fin: {} };
    let i = 0;
    const base = (S.seed ^ 0x9e3779b9) >>> 0;
    const mySeed = S.seed;
    (function chunk() {
      if (!S || S.seed !== mySeed || S.dead || !$("#rank")) return;
      const t = performance.now();
      while (i < N && performance.now() - t < 30) {
        const x = new Life((base + i * 7919) >>> 0, { auto: true, heavy: true, quiet: true, y0: s.birthYear }).runToEnd();
        ages.push(x.deathAge); if (x.deathAge >= 60) earns.push(x.earn); i++;
        if (x.mbti.length === 3) { mb.n++; const [a, b, c] = x.mbti.map(m => m.type); if (a === b && b === c) mb.same++; mb.ch += [...a].filter((ch, k) => ch !== c[k]).length; mb.fin[c] = (mb.fin[c] || 0) + 1; }
      }
      const pg = $("#rankProg"); if (pg) pg.textContent = `正在模拟另外${N}个同年出生的人……${Math.round(i / N * 100)}%`;
      if (i < N) return setTimeout(chunk, 0);
      const mbs = $("#mbtiCohort");
      if (mbs && mb.n) { const top = Object.entries(mb.fin).sort((p, q) => q[1] - p[1])[0]; mbs.textContent = `同年出生、活到老的人里，${Math.round(mb.same / mb.n * 100)}%一辈子都是同一个类型；平均从14岁到最后变了${(mb.ch / mb.n).toFixed(1)}个字母；最后最常见的是${top[0]}（${MBTI_NAME[top[0]]}）。`; }
      ages.sort((a, b) => a - b); earns.sort((a, b) => a - b);
      const below = (arr, v) => { let k = 0; while (k < arr.length && arr[k] < v) k++; return k / arr.length; };
      const pa = below(ages, s.age), pe = s.age >= 60 ? below(earns, s.earn) : null;
      const med = arr => arr[Math.floor(arr.length / 2)];
      $("#rank").innerHTML = `<span class="lbl">和同年出生的人比（另外${N}次模拟）</span>
        <div class="rank-row"><div class="t">TA活得比 <b>${Math.round(pa * 100)}%</b> 的人久。同年出生的人，一半活过了 <b>${med(ages)}</b> 岁。</div>${histo(ages, s.age, 0, 110, "岁")}</div>
        ${pe != null && s.earn > 0 ? `<div class="rank-row"><div class="t">TA一生的劳动收入超过了 <b>${Math.round(pe * 100)}%</b> 活过60岁的人。中位数是 <b>${fmtYuan(med(earns))}</b>。</div>${histo(earns.map(v => v / 1e4), s.earn / 1e4, 0, Math.max(earns[Math.floor(earns.length * .97)] / 1e4, s.earn / 1e4), "万")}</div>` : ""}`;
      S.rank = { pa, pe };
    })();
  }
  function histo(arr, mark, lo, hi, unit) {
    const B = 44, h = new Array(B).fill(0);
    for (const v of arr) { const k = Math.min(B - 1, Math.max(0, Math.floor((v - lo) / (hi - lo) * B))); h[k]++; }
    const m = Math.max(...h);
    const W = 440, H = 36;
    const bw = W / B;
    const mk = Math.min(W, Math.max(0, (mark - lo) / (hi - lo) * W));
    const bars = h.map((c, k) => `<rect x="${(k * bw + 0.5).toFixed(1)}" y="${(H - c / m * H).toFixed(1)}" width="${(bw - 1).toFixed(1)}" height="${(c / m * H).toFixed(1)}" fill="var(--ink-3)" opacity=".55"/>`).join("");
    return `<div class="dist"><svg viewBox="0 0 ${W} ${H + 14}" preserveAspectRatio="none" role="img" aria-label="分布图">${bars}
      <line x1="${mk}" x2="${mk}" y1="0" y2="${H}" stroke="var(--seal)" stroke-width="2"/>
      <text x="0" y="${H + 12}" font-size="10" fill="var(--ink-3)">${lo}${unit}</text><text x="${W}" y="${H + 12}" font-size="10" fill="var(--ink-3)" text-anchor="end">${Math.round(hi)}${unit}</text></svg></div>`;
  }

  function saveLife(s) {
    const past = store.get("l14b.lives", []);
    past.unshift({ n: s.name, p: s.prov, u: s.urban, a: s.age, y: s.birthYear, e: s.edu, c: s.cause });
    store.set("l14b.lives", past.slice(0, 30));
  }
  function pastHtml(s) {
    const past = store.get("l14b.lives", []).slice(1, 8);
    if (!past.length) return "";
    return `<div><span class="lbl">你过往的人生</span><div class="past">${past.map(x => `<div>${esc(x.n)} · ${x.y || ""}年生 · ${x.p}${x.u ? "城镇" : "农村"} · ${x.e} · 享年${x.a}岁</div>`).join("")}</div></div>`;
  }

  // ---------- 分享图 ----------
  async function makeShare(s, word) {
    try { await document.fonts.ready; await Promise.all(["900 60px NS14", "40px LC14", "700 30px NS14"].map(f => document.fonts.load(f, "一生" + s.name + (word || "")))); } catch (e) {}
    const W = 1080, H = 1440, c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const ink = "#1d2740", seal = "#c23a2b", kraft = "#b88a52", paper = "#f5f6f1", pen = "#24356b", grey = "#4f586c";
    g.fillStyle = kraft; g.fillRect(0, 0, W, H);
    g.fillStyle = paper; g.fillRect(60, 220, W - 120, H - 300);
    g.fillStyle = "#3b2a14"; g.font = "900 64px NS14, serif"; g.fillText("人生档案", 70, 150);
    g.font = "26px Consolas, Menlo, monospace"; g.fillText("No. " + String(S.seed).padStart(10, "0"), 70, 195);
    g.textAlign = "right"; g.font = "900 44px NS14, serif"; g.fillText("14亿分之1", W - 70, 150); g.textAlign = "left";
    g.fillStyle = pen; g.font = "120px LC14, cursive"; g.fillText(s.name, 110, 380);
    g.fillStyle = grey; g.font = "34px Consolas, Menlo, monospace"; g.fillText(`${s.birthYear} — ${s.deathYear}   享年${s.age}岁`, 110, 450);
    g.fillStyle = ink; g.font = "36px 'PingFang SC', 'Microsoft YaHei', sans-serif";
    const lines = [
      `出生在${s.place}`,
      `学历：${s.edu}${s.tier && s.edu === "本科" ? `（${s.tier}）` : ""}`,
      `去过：${s.cities.slice(0, 5).join(" → ")}`,
      s.jobs.length ? `做过：${s.jobs.slice(0, 3).join("、")}` : null,
      s.age >= 25 ? (s.married ? `结婚，${s.kids ? s.kids + "个孩子" : "没有孩子"}` : "没有结婚") : null,
      s.mbti.length ? `性格：${s.mbti.join(" → ")}` : null,
      s.wealth > 1000 ? `留下的财产：约${fmtYuan(s.wealth)}（折合今天）` : null,
      `死因：${S.life.opts.heavy || s.cause !== "自杀" ? s.cause : "未记录"}`,
    ].filter(Boolean);
    let y = 560;
    g.strokeStyle = "#c9cec4"; g.lineWidth = 2;
    for (const l of lines) { const ls = wrapText(g, l, 110, y, W - 220); ls.forEach((t, k) => g.fillText(t, 110, y + k * 52)); y += ls.length * 52 + 26; g.beginPath(); g.moveTo(110, y - 40); g.lineTo(W - 110, y - 40); g.stroke(); }
    if (S.rank) { g.fillStyle = grey; g.font = "32px 'PingFang SC', 'Microsoft YaHei', sans-serif"; g.fillText(`在同年出生的人里，TA比${Math.round(S.rank.pa * 100)}%的人活得久。`, 110, y + 10); y += 70; }
    if (word) { g.fillStyle = pen; g.font = handOK(word) ? "64px LC14, cursive" : "52px KaiTi, STKaiti, 'Kaiti SC', serif"; wrapText(g, "“" + word + "”", 110, y + 40, W - 220, 74).forEach((t, k) => g.fillText(t, 110, y + 40 + k * 74)); }
    // 印章
    g.save(); g.translate(W - 230, H - 250); g.rotate(-0.24); g.strokeStyle = seal; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 105, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 92, 0, Math.PI * 2); g.stroke();
    g.fillStyle = seal; g.font = "900 50px NS14, serif"; g.textAlign = "center"; g.fillText("已归档", 0, 18); g.restore();
    g.fillStyle = "#3b2a14"; g.font = "26px 'PingFang SC', 'Microsoft YaHei', sans-serif"; g.fillText("按国家统计局、七普、教育部等真实统计模拟的一生", 70, H - 36);
    const url = c.toDataURL("image/png");
    $("#share").innerHTML = `<img alt="${esc(s.name)}的人生档案分享图" src="${url}"><p class="fine">长按图片（手机）或右键（电脑）保存。</p>`;
  }
  function wrapText(g, text, x, y, maxW) {
    const out = []; let cur = "";
    for (const ch of text) { if (g.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch; } else cur += ch; }
    if (cur) out.push(cur); return out;
  }
})();
