/* KOMBO 後台設計稿 admin-v1。
   示意 specs/003-技術規格/009 的架構：五層設定（全站佈局、首頁版面、商品、連結、媒體）、
   草稿與正式版分開、上架前看差異、可還原。設計稿的「草稿」與「正式版」都只存在這個瀏覽器（localStorage），
   正式後台會存進資料庫的 drafts 與正式資料表（平台待決定：Supabase 或 Cloudflare D1）。商品基礎資料沿用 ../v3/assets/data.js。 */
(function () {
  const K = window.KOMBO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const page = document.body.dataset.page;
  const V3 = '../v3/';
  const MAT = Object.fromEntries(K.materials.map((m) => [m.id, m.name]));
  const STATUS = { active: '上架中', coming_soon: '即將上市', discontinued: '停售' };

  /* ---------- 初始資料：等同目前正式站（v3 設計稿）的內容 ---------- */
  function initialSite() {
    return {
      site: {
        announce: { enabled: true, text: '新品 No.5+ 偏快 77 速，看商品', link: 'product:no-5plus' },
        nav: [
          { id: 'home', label: '首頁', show: true },
          { id: 'shuttlecock', label: '羽毛球', show: true, sub: '依材質下拉' },
          { id: 'accessories', label: '配件', show: true },
          { id: 'news', label: '最新消息', show: true },
          { id: 'about', label: '品牌故事', show: true },
          { id: 'where', label: '銷售通路', show: true },
          { id: 'contact', label: '聯絡我們', show: true }
        ],
        footerNote: '官網不收單，請到各銷售通路訂購',
        seo: {
          siteName: 'KOMBO 慷柏體育', defaultDesc: 'KOMBO 九款羽毛球，天然鵝毛、鵝毛拉直、刺骨鴨、鴨毛四種材質，76 至 78 速。',
          ogImage: 'og-lineup',
          bots: { Googlebot: true, Bingbot: true, GPTBot: true, 'OAI-SearchBot': true, ClaudeBot: true, PerplexityBot: true, 'Google-Extended': true }
        }
      },
      home: {
        blocks: [
          { id: 'hero', type: '主視覺輪播', show: true, slides: ['hero-lineup', 'hero-goose', 'hero-brand'] },
          { id: 'posters', type: '系列海報', show: true },
          { id: 'tagline', type: '標語', show: true, text: '一拍接著一拍' },
          { id: 'lineup', type: '商品格', show: true, title: '全系列羽毛球', count: 8 },
          { id: 'mats', type: '材質入口', show: true, title: '依材質選球' },
          { id: 'where', type: '通路橫幅', show: true, title: '到哪裡買', link: 'page:where-to-buy' },
          { id: 'news', type: '最新消息', show: true, title: '最新消息', count: 3 }
        ]
      },
      products: K.products.map((p, i) => ({
        sku: p.sku, name: p.name, code: p.code, material: p.material, speeds: p.speeds.slice(),
        speedNote: p.speedNote || '', pieces: null, price: p.price, priceList: null, priceCheckedAt: '2026-09-18',
        color: p.color, status: 'active', order: i + 1,
        images: [{ media: `${p.sku}-tube`, alt: `${p.name} 球桶` }],
        links: ['shopee', 'myship', 'famistore'],
        seoTitle: '', seoDesc: '',
        faq: []
      })),
      links: [
        { id: 'shopee', name: '蝦皮購物', type: '網路商店', url: '' },
        { id: 'myship', name: '7-11 賣貨便', type: '超商取貨', url: K.channels.find((c) => c.id === 'myship').url },
        { id: 'famistore', name: '全家好賣+', type: '超商取貨', url: '' },
        { id: 'line', name: 'LINE 官方帳號', type: '聯絡', url: K.line.url },
        ...K.social.map((s) => ({ id: s.name.toLowerCase(), name: s.name, type: '社群', url: s.url }))
      ],
      media: [
        ...K.products.map((p) => ({ id: `${p.sku}-tube`, file: p.img, src: `${V3}assets/${p.img}`, alt: `${p.name} 球桶`, kind: '商品' })),
        { id: 'hero-lineup', file: 'lineup-full.webp', src: `${V3}assets/lineup-full.webp`, alt: 'KOMBO 九款羽毛球球桶並排', kind: '主視覺' },
        { id: 'og-lineup', file: 'og-lineup.jpg', src: `${V3}assets/og-lineup.jpg`, alt: 'KOMBO 九款羽毛球', kind: '分享圖' },
        { id: 'hero-goose', file: '（待提供）', src: '', alt: '天然鵝毛系列主視覺', kind: '主視覺', pending: true },
        { id: 'hero-brand', file: '（待提供）', src: '', alt: 'KOMBO 品牌主視覺', kind: '主視覺', pending: true }
      ]
    };
  }

  /* ---------- 儲存：正式版（published）、草稿（draft）、上架紀錄（history） ---------- */
  const KEY = { pub: 'kombo-admin-pub-v1', draft: 'kombo-admin-draft-v1', hist: 'kombo-admin-hist-v1' };
  const load = (k, fallback) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 無痕或封鎖儲存時只在本頁有效 */ } };
  let pub = load(KEY.pub, null) || initialSite();
  let draft = load(KEY.draft, null) || clone(pub);
  let hist = load(KEY.hist, null) || [
    { at: '2026-10-07 13:05', by: 'Paul', note: '設計稿 v3 版面', n: 12, snap: null },
    { at: '2026-10-02 10:50', by: 'Paul', note: '設計稿 v2', n: 30, snap: null }
  ];
  const saveDraft = () => { store(KEY.draft, draft); refreshShell(); };
  [pub, draft].forEach((x) => { // 舊版草稿沒有的欄位補上預設值
    const base = initialSite();
    x.site.seo = x.site.seo || base.site.seo;
    x.products.forEach((p) => { p.seoTitle = p.seoTitle || ''; p.seoDesc = p.seoDesc || ''; p.faq = p.faq || []; });
  });

  /* ---------- 差異：把兩份資料攤平成「位置 → 值」再比對 ---------- */
  const SECTION = { site: '全站佈局', home: '首頁版面', products: '商品', links: '連結', media: '媒體' };
  function flat(o, path = [], out = {}) {
    if (Array.isArray(o) && o.length && typeof o[0] === 'object' && o[0] !== null && ('id' in o[0] || 'sku' in o[0] || 'media' in o[0])) {
      o.forEach((x, i) => flat(x, path.concat(`${x.id || x.sku || x.media}`), out));
      out[path.concat('（順序）').join(' › ')] = o.map((x) => x.id || x.sku || x.media).join('、');
    } else if (o && typeof o === 'object' && !Array.isArray(o)) {
      Object.entries(o).forEach(([k, v]) => flat(v, path.concat(k), out));
    } else {
      out[path.join(' › ')] = Array.isArray(o) ? o.join('、') : o;
    }
    return out;
  }
  const FIELD = { seoTitle: 'SEO 標題', seoDesc: 'SEO 描述', faq: '常見問題', seo: 'SEO', siteName: '網站名稱', defaultDesc: '預設描述', ogImage: '分享圖', bots: '爬蟲', show: '顯示', text: '文字', title: '標題', count: '數量', enabled: '開啟', link: '連結', label: '名稱', name: '名稱', code: '包裝標示', material: '材質', speeds: '球速', speedNote: '球速補充', pieces: '每桶顆數', price: '售價', priceList: '原價', priceCheckedAt: '價格查核日', color: '主色', status: '狀態', alt: '替代文字', url: '網址', file: '檔案', footerNote: '頁尾說明', announce: '公告條', nav: '主導覽', blocks: '區塊', slides: '輪播圖片', images: '圖片', links: '購買通路' };
  function diff(a, b) {
    const fa = flat(a), fb = flat(b);
    return [...new Set([...Object.keys(fa), ...Object.keys(fb)])]
      .filter((k) => String(fa[k] ?? '') !== String(fb[k] ?? ''))
      .map((k) => {
        const parts = k.split(' › ');
        return { key: k, section: SECTION[parts[0]] || parts[0], where: parts.slice(1).map((p) => FIELD[p] || p).join(' › '), before: fa[k], after: fb[k] };
      });
  }
  const changes = () => diff(pub, draft);

  /* ---------- 檢查：對應建置期的 schema 與引用檢查（ADM-2） ---------- */
  const urlOk = (u) => /^https?:\/\/[^\s]+\.[^\s]+/.test(u || '');
  function refTarget(ref) {
    const [kind, id] = String(ref || '').split(':');
    if (kind === 'product') return draft.products.some((p) => p.sku === id);
    if (kind === 'link') return draft.links.some((l) => l.id === id);
    if (kind === 'page') return ['where-to-buy', 'shuttlecock', 'about', 'news', 'contact'].includes(id);
    return false;
  }
  function productErrors(p) {
    const e = [];
    if (!p.name) e.push('名稱必填');
    if (!p.code) e.push('包裝標示必填');
    if (!p.speeds.length) e.push('至少選一個球速');
    if (p.price != null && !(p.price > 0)) e.push('售價要大於 0');
    if (!p.priceCheckedAt) e.push('價格查核日必填');
    if (!/^#[0-9A-Fa-f]{6}$/.test(p.color)) e.push('主色要是 #RRGGBB');
    p.images.forEach((im, i) => { if (!im.alt) e.push(`第 ${i + 1} 張圖的替代文字必填`); });
    return e;
  }
  /* SEO 未填時的自動值：標題「名稱 材質羽毛球｜網站名」、描述由材質與球速組成 */
  function seoOf(p) {
    const site = draft.site.seo.siteName;
    const title = p.seoTitle || `${p.name} ${MAT[p.material]}羽毛球｜${site}`;
    const desc = p.seoDesc || `${p.name} 是 KOMBO ${MAT[p.material]}羽毛球，${p.speeds.map((x) => `${x} 速`).join('、')}${p.price ? `，售價 NT$${p.price}` : ''}。可在蝦皮、7-11 賣貨便、全家好賣+ 購買。`;
    return { title, desc, auto: { title: !p.seoTitle, desc: !p.seoDesc } };
  }
  function usage(mediaId) {
    const u = [];
    draft.products.forEach((p) => p.images.forEach((im) => im.media === mediaId && u.push(`商品 ${p.name}`)));
    draft.home.blocks.forEach((b) => (b.slides || []).includes(mediaId) && u.push(`首頁 ${b.type}`));
    if (mediaId === 'og-lineup') u.push('全站分享圖');
    return u;
  }
  function linkUsage(id) {
    let n = draft.products.filter((p) => p.links.includes(id)).length;
    if (['line', 'instagram', 'facebook'].includes(id)) n += 1; // 頁首與頁尾
    return n;
  }
  function checks() {
    const out = [];
    draft.products.forEach((p) => productErrors(p).forEach((m) => out.push({ lv: 'bad', msg: `${p.name}：${m}`, href: `product.html#${p.sku}` })));
    draft.products.forEach((p) => {
      if (p.price == null) out.push({ lv: 'warn', msg: `${p.name}：售價未填，頁面會顯示「—」`, href: `product.html#${p.sku}` });
      if (p.pieces == null) out.push({ lv: 'warn', msg: `${p.name}：每桶顆數未填`, href: `product.html#${p.sku}` });
    });
    draft.links.forEach((l) => { if (!urlOk(l.url)) out.push({ lv: linkUsage(l.id) ? 'bad' : 'warn', msg: `連結「${l.name}」${l.url ? '網址格式不對' : '尚未設定網址'}，被 ${linkUsage(l.id)} 處引用`, href: 'links.html' }); });
    if (draft.site.announce.enabled && !refTarget(draft.site.announce.link)) out.push({ lv: 'bad', msg: '公告條連到的對象不存在', href: 'site.html' });
    draft.media.forEach((m) => { if (!m.alt) out.push({ lv: 'bad', msg: `圖片 ${m.id} 缺替代文字`, href: 'media.html' }); });
    draft.media.filter((m) => m.pending && usage(m.id).length).forEach((m) => out.push({ lv: 'warn', msg: `圖片 ${m.id} 尚未上傳，首頁暫用替代圖`, href: 'media.html' }));
    draft.products.forEach((p) => {
      const d = seoOf(p);
      if (d.desc.length > 160) out.push({ lv: 'warn', msg: `${p.name}：SEO 描述超過 160 字，搜尋結果會被截斷`, href: `product.html#${p.sku}` });
    });
    if (!draft.home.blocks.some((b) => b.show && ['lineup', 'mats'].includes(b.id))) out.push({ lv: 'bad', msg: '首頁至少要顯示「商品格」或「材質入口」其中一個', href: 'layout.html' });
    return out.sort((x, y) => (x.lv === 'bad' ? 0 : 1) - (y.lv === 'bad' ? 0 : 1)); // 必須修正的排前面
  }

  /* ---------- 外框 ---------- */
  const NAV = [
    ['總覽', [['dashboard', 'dashboard.html', '儀表板']]],
    ['網站', [['site', 'site.html', '全站佈局'], ['layout', 'layout.html', '首頁版面'], ['seo', 'seo.html', 'SEO 與 AI 搜尋']]],
    ['資料', [['products', 'products.html', '商品'], ['links', 'links.html', '連結'], ['media', 'media.html', '媒體庫']]],
    ['上架', [['publish', 'publish.html', '發布']]]
  ];
  const TITLE = { seo: 'SEO 與 AI 搜尋', data: '資料架構', dashboard: '儀表板', site: '全站佈局', layout: '首頁版面', products: '商品', product: '編輯商品', links: '連結', media: '媒體庫', publish: '發布' };
  function shell() {
    const cur = page === 'product' ? 'products' : page;
    document.body.innerHTML = `<div class="shell">
      <aside class="side" id="side">
        <a class="brand" href="dashboard.html">KOMBO 後台<small>設計稿 admin-v1</small></a>
        <nav aria-label="後台導覽">${NAV.map(([g, items]) => `<div class="group">${g}</div>${items.map(([id, href, t]) =>
          `<a href="${href}"${id === cur ? ' aria-current="page"' : ''}>${t}${id === 'publish' ? '<span class="count" id="nav-count"></span>' : ''}</a>`).join('')}`).join('')}
          <div class="group">說明</div><a href="data.html"${cur === 'data' ? ' aria-current="page"' : ''}>資料架構</a><a href="index.html">設計稿封面</a><a href="${V3}home.html" target="_blank" rel="noopener">看正式站（v3）</a>
        </nav>
      </aside>
      <div class="main">
        <div class="topbar">
          <button class="btn ghost menu-btn" id="menu" aria-label="開啟導覽" aria-expanded="false">☰</button>
          <h1>${TITLE[page]}</h1>
          <span class="draft-pill" id="pill"><i></i><span></span></span>
          <a class="btn publish hide-sm" href="publish.html" id="go-publish">檢查並上架</a>
        </div>
        <div class="content" id="app"></div>
      </div>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
    $('#menu').addEventListener('click', () => {
      const open = !$('#side').classList.contains('open');
      $('#side').classList.toggle('open', open);
      $('#menu').setAttribute('aria-expanded', String(open));
    });
    refreshShell();
  }
  function refreshShell() {
    const n = changes().length;
    const pill = $('#pill');
    if (!pill) return;
    pill.classList.toggle('has', n > 0);
    $('span', pill).textContent = n ? `草稿有 ${n} 項未上架` : '草稿與正式站一致';
    $('#nav-count').textContent = n || '';
    $('#nav-count').hidden = !n;
  }
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('on'), 2200);
  }
  /* 頁內確認框（不用 confirm()） */
  function ask(title, body, okText, okClass = 'primary') {
    return new Promise((resolve) => {
      const d = document.createElement('dialog');
      d.innerHTML = `<h2>${esc(title)}</h2><p style="margin-top:8px">${body}</p>
        <div class="acts"><button class="btn" value="no">取消</button><button class="btn ${okClass}" value="yes">${esc(okText)}</button></div>`;
      document.body.append(d);
      d.addEventListener('click', (e) => { const v = e.target.closest('button')?.value; if (v) { d.close(); resolve(v === 'yes'); d.remove(); } });
      d.addEventListener('cancel', () => { resolve(false); d.remove(); });
      d.showModal();
    });
  }
  const designNote = '<p class="note">設計稿：這裡的修改只存在你的瀏覽器，不會改到任何網站。正式後台會存進資料庫的草稿（見 specs 009）。</p>';
  const refOptions = (sel) => {
    const opts = [
      ...draft.products.map((p) => [`product:${p.sku}`, `商品：${p.name}`]),
      ['page:where-to-buy', '頁面：銷售通路'], ['page:shuttlecock', '頁面：羽毛球'], ['page:news', '頁面：最新消息'], ['page:about', '頁面：品牌故事'], ['page:contact', '頁面：聯絡我們'],
      ...draft.links.map((l) => [`link:${l.id}`, `連結：${l.name}`])
    ];
    return opts.map(([v, t]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${esc(t)}</option>`).join('');
  };

  /* ---------- 真實頁面預覽：把草稿套到 v3 頁面上（所見即所得） ---------- */
  const BLOCK_EL = {
    hero: (d) => $('section.carousel', d),
    posters: (d) => $('[data-render=posters]', d)?.closest('section'),
    tagline: (d) => $('p.tagline', d),
    lineup: (d) => $('[data-render=lineup]', d)?.closest('section'),
    mats: (d) => $('[data-render=mats]', d)?.closest('section'),
    where: (d) => $('[data-render=wherebanner]', d)?.closest('section'),
    news: (d) => $('[data-render=news]', d)?.closest('section')
  };
  const NAV_HREF = { home: 'home.html', shuttlecock: 'shuttlecock.html', accessories: 'accessories.html', news: 'news.html', about: 'about.html', where: 'where-to-buy.html', contact: 'contact.html' };
  function applySite(d) {
    const a = draft.site.announce;
    const bar = $('.announce', d);
    if (bar) {
      bar.style.display = a.enabled ? '' : 'none';
      const link = $('a', bar);
      if (link) link.textContent = a.text || '（公告文字未填）';
    }
    const ul = $('.site-nav > ul', d);
    if (ul) draft.site.nav.forEach((n) => {
      const li = $$(':scope > li', ul).find((x) => $('a', x)?.getAttribute('href') === NAV_HREF[n.id]);
      if (li) { ul.append(li); li.style.display = n.show ? '' : 'none'; const a2 = $(':scope > a', li); if (a2) a2.firstChild.textContent = n.label; }
    });
  }
  function applyHome(d, selected, onPick) {
    const main = $('main', d);
    if (!main) return;
    draft.home.blocks.forEach((b) => {
      const el = BLOCK_EL[b.id](d);
      if (!el) return;
      main.append(el);
      el.style.display = b.show ? '' : 'none';
      el.dataset.adm = b.id;
      el.style.outline = b.id === selected ? '3px solid #E84E2C' : '';
      el.style.outlineOffset = '-3px';
      const st = $('.st span', el);
      if (st && b.title != null) st.textContent = b.title;
      if (b.id === 'tagline') el.textContent = b.text;
      if (b.id === 'lineup') { $$('.grid .card', el).forEach((c, i) => { c.style.display = i < b.count ? '' : 'none'; }); const more = $('.more-row .btn', el); if (more) more.textContent = `看全部 ${draft.products.length} 款`; }
      if (b.id === 'news') $$('.news > a', el).forEach((c, i) => { c.style.display = i < b.count ? '' : 'none'; });
      if (b.id === 'where') { const t = $('.wbanner .copy b', el); if (t) t.textContent = b.title; }
    });
    if (!d.__admBound) {
      d.__admBound = true;
      const st = d.createElement('style');
      st.textContent = '[data-adm]{cursor:pointer}[data-adm]:hover{box-shadow:inset 0 0 0 2px #1B4C9B}';
      d.head.append(st);
      d.addEventListener('click', (e) => {
        const el = e.target.closest('[data-adm]');
        if (!el) return;
        e.preventDefault();
        e.stopPropagation();
        onPick(el.dataset.adm);
      }, true);
    }
  }
  function applyProduct(d, p) {
    const h = $('.p-title', d);
    if (!h) return;
    h.textContent = `${p.name || '（未命名）'} ${MAT[p.material] || ''}羽毛球`;
    const code = $('.p-code', d); if (code) code.textContent = `商品編號 ${p.code}`;
    const price = $('.p-price', d); if (price) price.firstChild.textContent = p.price ? `NT$${Number(p.price).toLocaleString('en-US')}` : '—';
    const stage = $('.stage', d); if (stage) stage.style.setProperty('--c', p.color);
    const opts = $('.speed-opts', d); if (opts) opts.innerHTML = p.speeds.map((s) => `<span>${s}</span>`).join('');
    const checks = $$('.checks li', d);
    if (checks[0]) checks[0].firstChild.textContent = `毛片：${MAT[p.material] || ''}`;
    if (checks[2]) checks[2].textContent = `球速：${p.speeds.map((s) => `${s} 速`).join('、')}${p.speedNote ? `（${p.speedNote}）` : ''}`;
    if (checks[3]) checks[3].firstChild.textContent = `數量：${p.pieces ? `${p.pieces} 顆／桶` : '—'}`;
  }
  /* iframe 每次載入（含 v3 頁內 hash 重繪）後重新套用 */
  function bindPreview(frame, apply) {
    const run = () => { try { const d = frame.contentDocument; if (d && d.readyState !== 'loading') apply(d); } catch (e) { /* 同源才可操作 */ } };
    frame.addEventListener('load', () => { run(); try { frame.contentWindow.addEventListener('hashchange', () => setTimeout(run, 30)); } catch (e) { /* 略 */ } });
    return run;
  }
  const deviceSeg = (id, cur) => `<div class="seg" role="group" aria-label="預覽尺寸" id="${id}">
    <button type="button" data-v="phone" aria-pressed="${cur === 'phone'}">手機</button><button type="button" data-v="desk" aria-pressed="${cur === 'desk'}">電腦</button></div>`;
  function bindSeg(id, frame) {
    $(`#${id}`).addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      $$(`#${id} button`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      frame.classList.toggle('phone', b.dataset.v === 'phone');
    });
  }

  /* ================= 各頁 ================= */
  const R = {};

  R.dashboard = (app) => {
    const ch = changes(), ck = checks();
    const bad = ck.filter((x) => x.lv === 'bad').length;
    app.innerHTML = `${designNote}
      <div class="stats">
        <div class="stat"><span class="dim small">草稿未上架</span><b>${ch.length}</b><a class="small" href="publish.html">看差異</a></div>
        <div class="stat"><span class="dim small">上架中的商品</span><b>${draft.products.filter((p) => p.status === 'active').length}</b><span class="small dim">共 ${draft.products.length} 款</span></div>
        <div class="stat"><span class="dim small">上架前要修正</span><b style="color:${bad ? 'var(--bad)' : 'var(--ok)'}">${bad}</b><span class="small dim">提醒 ${ck.length - bad} 項</span></div>
        <div class="stat"><span class="dim small">最近一次上架</span><b style="font-size:1.0625rem;margin-top:8px">${esc(hist[0]?.at || '—')}</b><span class="small dim">${esc(hist[0]?.note || '')}</span></div>
      </div>
      <div class="grid2">
        <section class="panel"><header><h2>常用</h2></header>
          <div class="grid2">
            <a class="btn" href="site.html">改公告條</a><a class="btn" href="products.html">改價與上下架</a>
            <a class="btn" href="layout.html">調整首頁區塊</a><a class="btn" href="media.html">上傳圖片</a>
          </div>
          <p class="note" style="margin-top:14px">儲存只會進草稿，正式站不變；按「檢查並上架」後約一至兩分鐘生效。</p>
        </section>
        <section class="panel"><header><h2>需要處理</h2><a class="small" href="publish.html">全部 ${ck.length} 項</a></header>
          <ul class="issues">${ck.slice(0, 6).map((x) => `<li class="${x.lv}">${esc(x.msg)}<a href="${x.href}">處理</a></li>`).join('') || '<li class="ok">沒有待處理的項目</li>'}</ul>
        </section>
      </div>
      <section class="panel"><header><h2>草稿裡的修改</h2></header>
        ${ch.length ? `<ul class="diff">${ch.slice(0, 8).map(diffRow).join('')}</ul>${ch.length > 8 ? `<p class="small dim" style="margin-top:8px">還有 ${ch.length - 8} 項，見發布頁</p>` : ''}` : '<p class="dim">目前沒有未上架的修改。</p>'}
      </section>`;
  };
  const show = (v) => (v === '' || v == null ? '（空）' : esc(v));
  const diffRow = (c) => `<li><span><b>${esc(c.section)}</b><br><span class="small dim">${esc(c.where)}</span></span>
    <span><span class="before">${show(c.before)}</span><br><span class="after">${show(c.after)}</span></span></li>`;

  R.site = (app) => {
    const s = draft.site;
    app.innerHTML = `${designNote}
      <div class="edit-layout">
        <div style="display:grid;gap:16px">
          <section class="panel"><header><h2>公告條</h2><label class="switch"><input type="checkbox" id="an-on"${s.announce.enabled ? ' checked' : ''}>顯示</label></header>
            <div class="grid2">
              <label class="field"><span>文字 <b>必填</b></span><input type="text" id="an-text" maxlength="40" value="${esc(s.announce.text)}"></label>
              <label class="field"><span>點了連到</span><select id="an-link">${refOptions(s.announce.link)}</select></label>
            </div>
            <p class="small dim" style="margin-top:6px">最多 40 字；手機上超過一行會換行。</p>
          </section>
          <section class="panel"><header><h2>主導覽</h2><span class="small dim">上下調整順序，關掉就不顯示</span></header>
            <ul class="blocks" id="nav-list"></ul>
          </section>
          <section class="panel"><header><h2>頁尾</h2></header>
            <label class="field"><span>頁尾說明</span><input type="text" id="foot" value="${esc(s.footerNote)}"></label>
            <p class="small dim" style="margin-top:6px">頁尾的通路與社群連結來自「連結」頁，這裡不重複設定。</p>
          </section>
        </div>
        <section class="stage-wrap"><div class="stage-bar"><b>即時預覽（首頁）</b>${deviceSeg('seg', 'phone')}</div>
          <iframe class="stage phone" id="frame" title="首頁預覽" src="${V3}home.html?clean=1"></iframe></section>
      </div>`;
    const frame = $('#frame');
    const run = bindPreview(frame, (d) => applySite(d));
    bindSeg('seg', frame);
    const drawNav = () => {
      $('#nav-list').innerHTML = s.nav.map((n, i) => `<li class="${n.show ? '' : 'hidden-block'}"><span><span class="bname">${esc(n.label)}</span>${n.sub ? `<span class="btype">${esc(n.sub)}</span>` : ''}</span>
        <span class="ops"><button data-op="up" data-i="${i}" aria-label="往上">▲</button><button data-op="down" data-i="${i}" aria-label="往下">▼</button>
        <button data-op="eye" data-i="${i}" aria-label="${n.show ? '隱藏' : '顯示'}">${n.show ? '◉' : '○'}</button></span></li>`).join('');
    };
    drawNav();
    $('#nav-list').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const i = +b.dataset.i;
      if (b.dataset.op === 'up' && i > 0) [s.nav[i - 1], s.nav[i]] = [s.nav[i], s.nav[i - 1]];
      if (b.dataset.op === 'down' && i < s.nav.length - 1) [s.nav[i + 1], s.nav[i]] = [s.nav[i], s.nav[i + 1]];
      if (b.dataset.op === 'eye') s.nav[i].show = !s.nav[i].show;
      drawNav(); saveDraft(); run();
    });
    const bind = (id, fn) => $(id).addEventListener('input', (e) => { fn(e.target); saveDraft(); run(); });
    bind('#an-on', (t) => { s.announce.enabled = t.checked; });
    bind('#an-text', (t) => { s.announce.text = t.value; t.closest('.field').classList.toggle('invalid', !t.value.trim()); });
    bind('#an-link', (t) => { s.announce.link = t.value; });
    bind('#foot', (t) => { s.footerNote = t.value; });
  };

  R.layout = (app) => {
    let sel = draft.home.blocks[0].id;
    app.innerHTML = `${designNote}
      <div class="editor">
        <section class="panel"><header><h2>區塊</h2></header><ul class="blocks" id="blist"></ul>
          <p class="small dim" style="margin-top:10px">點左邊或直接點右邊頁面上的區塊都能選取。區塊種類固定，不提供自由排版（見 specs 009）。</p></section>
        <section class="stage-wrap"><div class="stage-bar"><b>首頁（草稿）</b>${deviceSeg('seg', 'desk')}</div>
          <iframe class="stage" id="frame" title="首頁預覽" src="${V3}home.html?clean=1"></iframe></section>
        <section class="panel props" id="props"></section>
      </div>`;
    const frame = $('#frame');
    const pick = (id) => { sel = id; drawList(); drawProps(); run(); };
    const run = bindPreview(frame, (d) => { applySite(d); applyHome(d, sel, pick); });
    bindSeg('seg', frame);
    const drawList = () => {
      $('#blist').innerHTML = draft.home.blocks.map((b, i) => `<li data-id="${b.id}" class="${b.id === sel ? 'sel' : ''} ${b.show ? '' : 'hidden-block'}">
        <span><span class="bname">${esc(b.title || b.text || b.type)}</span><span class="btype">${esc(b.type)}</span></span>
        <span class="ops"><button data-op="up" data-i="${i}" aria-label="往上">▲</button><button data-op="down" data-i="${i}" aria-label="往下">▼</button>
        <button data-op="eye" data-i="${i}" aria-label="${b.show ? '隱藏' : '顯示'}">${b.show ? '◉' : '○'}</button></span></li>`).join('');
    };
    const drawProps = () => {
      const b = draft.home.blocks.find((x) => x.id === sel);
      const f = [];
      f.push(`<header><h2>${esc(b.type)}</h2><label class="switch"><input type="checkbox" data-k="show"${b.show ? ' checked' : ''}>顯示</label></header>`);
      if ('title' in b) f.push(`<label class="field"><span>標題</span><input type="text" data-k="title" value="${esc(b.title)}"></label>`);
      if ('text' in b) f.push(`<label class="field"><span>文字</span><input type="text" data-k="text" value="${esc(b.text)}"></label>`);
      if ('count' in b) f.push(`<label class="field"><span>顯示幾則</span><input type="number" min="1" max="${b.id === 'lineup' ? draft.products.length : 6}" data-k="count" value="${b.count}"></label>`);
      if ('link' in b) f.push(`<label class="field"><span>點了連到</span><select data-k="link">${refOptions(b.link)}</select></label>`);
      if (b.slides) f.push(`<div class="field"><span>輪播圖片（依序）</span>${b.slides.map((m) => { const md = draft.media.find((x) => x.id === m); return `<div class="img-row">${md?.src ? `<img class="thumb" src="${md.src}" alt="">` : '<span class="thumb"></span>'}<span class="small">${esc(md?.alt || m)}${md?.pending ? ' <span class="tag warn">待上傳</span>' : ''}</span><span></span></div>`; }).join('')}<a class="small" href="media.html">到媒體庫上傳或更換</a></div>`);
      if (b.id === 'posters' || b.id === 'mats') f.push('<p class="small dim">內容依商品材質自動產生，到「商品」改材質即會反映。</p>');
      $('#props').innerHTML = f.join('');
    };
    drawList(); drawProps();
    $('#blist').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      const li = e.target.closest('li');
      if (!btn) { if (li) pick(li.dataset.id); return; }
      const i = +btn.dataset.i, arr = draft.home.blocks;
      if (btn.dataset.op === 'up' && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      if (btn.dataset.op === 'down' && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
      if (btn.dataset.op === 'eye') arr[i].show = !arr[i].show;
      sel = arr[i]?.id || sel;
      drawList(); drawProps(); saveDraft(); run();
    });
    $('#props').addEventListener('input', (e) => {
      const k = e.target.dataset.k; if (!k) return;
      const b = draft.home.blocks.find((x) => x.id === sel);
      b[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? Math.max(1, +e.target.value || 1) : e.target.value;
      if (k === 'show') drawProps();
      drawList(); saveDraft(); run();
    });
  };

  R.products = (app) => {
    let filter = 'all';
    app.innerHTML = `${designNote}
      <section class="panel"><header><h2>羽毛球 ${draft.products.length} 款</h2>
        <div class="seg" id="filter"><button data-v="all" aria-pressed="true">全部</button><button data-v="active" aria-pressed="false">上架中</button><button data-v="coming_soon" aria-pressed="false">即將上市</button><button data-v="discontinued" aria-pressed="false">停售</button></div></header>
        <div class="table-wrap"><table class="list"><thead><tr><th></th><th>商品</th><th class="hide-sm">材質</th><th>售價</th><th>狀態</th><th class="hide-sm">檢查</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
        <p class="small dim" style="margin-top:10px">配件、訓練用球、最新消息的編輯畫面與這裡相同，設計稿先以羽毛球示範。</p>
      </section>`;
    const draw = () => {
      const changed = new Set(changes().filter((c) => c.section === '商品').map((c) => c.key.split(' › ')[1]));
      $('#rows').innerHTML = draft.products.filter((p) => filter === 'all' || p.status === filter).map((p) => {
        const err = productErrors(p);
        const md = draft.media.find((m) => m.id === p.images[0]?.media);
        return `<tr><td><img class="thumb" src="${md?.src || ''}" alt=""></td>
          <td><b>${esc(p.name)}</b> <span class="mono dim">${esc(p.code)}</span>${changed.has(p.sku) ? ' <span class="tag draft">草稿已改</span>' : ''}</td>
          <td class="hide-sm">${esc(MAT[p.material])}</td><td class="num">${p.price ? `NT$${p.price}` : '<span class="tag warn">未填</span>'}</td>
          <td><select data-sku="${p.sku}" aria-label="${esc(p.name)} 狀態">${Object.entries(STATUS).map(([v, t]) => `<option value="${v}"${v === p.status ? ' selected' : ''}>${t}</option>`).join('')}</select></td>
          <td class="hide-sm">${err.length ? `<span class="tag bad">${err.length} 項錯誤</span>` : '<span class="tag ok">完整</span>'}</td>
          <td><a class="btn" href="product.html#${p.sku}">編輯</a></td></tr>`;
      }).join('');
    };
    draw();
    $('#filter').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; filter = b.dataset.v; $$('#filter button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); });
    $('#rows').addEventListener('change', (e) => { const s = e.target.closest('select'); if (!s) return; draft.products.find((p) => p.sku === s.dataset.sku).status = s.value; saveDraft(); draw(); toast('已存入草稿'); });
  };

  R.product = (app) => {
    const sku = decodeURIComponent(location.hash.slice(1)) || draft.products[0].sku;
    const orig = draft.products.find((p) => p.sku === sku) || draft.products[0];
    const p = clone(orig);
    app.innerHTML = `${designNote}
      <div class="edit-layout">
        <form id="f" style="display:grid;gap:16px" novalidate>
          <section class="panel"><header><h2>基本</h2><a class="small" href="products.html">回商品列表</a></header>
            <div class="grid2">
              <label class="field"><span>名稱 <b>必填</b></span><input type="text" name="name" value="${esc(p.name)}"></label>
              <label class="field"><span>包裝標示 <b>必填</b></span><input type="text" name="code" value="${esc(p.code)}"></label>
              <label class="field"><span>材質</span><select name="material">${K.materials.map((m) => `<option value="${m.id}"${m.id === p.material ? ' selected' : ''}>${m.name}</option>`).join('')}</select></label>
              <label class="field"><span>狀態</span><select name="status">${Object.entries(STATUS).map(([v, t]) => `<option value="${v}"${v === p.status ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
            </div>
            <p class="small dim" style="margin-top:6px">網址代號 <span class="mono">${esc(p.sku)}</span> 上線後不改（INV-3）。</p>
          </section>
          <section class="panel"><header><h2>價格</h2></header>
            <div class="grid3">
              <label class="field"><span>售價（元）</span><input type="number" name="price" min="1" value="${p.price ?? ''}" placeholder="未填顯示「—」"></label>
              <label class="field"><span>原價（有折扣才填）</span><input type="number" name="priceList" min="1" value="${p.priceList ?? ''}"></label>
              <label class="field"><span>價格查核日 <b>必填</b></span><input type="date" name="priceCheckedAt" value="${esc(p.priceCheckedAt)}"></label>
            </div>
          </section>
          <section class="panel"><header><h2>規格</h2></header>
            <div class="field"><span>球速 <b>至少一個</b></span><div class="chips" id="speeds">${[74, 75, 76, 77, 78, 79].map((s) => `<label><input type="checkbox" value="${s}"${p.speeds.includes(s) ? ' checked' : ''}><span>${s} 速</span></label>`).join('')}</div></div>
            <div class="grid2" style="margin-top:12px">
              <label class="field"><span>球速補充</span><input type="text" name="speedNote" value="${esc(p.speedNote)}" placeholder="例如：另有偏快 77 速"></label>
              <label class="field"><span>每桶顆數</span><input type="number" name="pieces" min="1" value="${p.pieces ?? ''}" placeholder="例如 12"></label>
            </div>
          </section>
          <section class="panel"><header><h2>外觀與圖片</h2></header>
            <label class="field" style="max-width:280px"><span>主色（球桶顏色）</span><span style="display:flex;gap:8px"><input type="color" id="colorpick" value="${esc(p.color)}" style="width:48px;height:38px;padding:2px"><input type="text" name="color" value="${esc(p.color)}"></span></label>
            <div id="imgs" style="margin-top:12px"></div>
            <a class="small" href="media.html">到媒體庫上傳新圖片</a>
          </section>
          <section class="panel"><header><h2>購買通路</h2><a class="small" href="links.html">管理連結</a></header>
            <div class="chips">${draft.links.filter((l) => ['網路商店', '超商取貨'].includes(l.type)).map((l) => `<label><input type="checkbox" name="link" value="${l.id}"${p.links.includes(l.id) ? ' checked' : ''}><span>${esc(l.name)}</span></label>${urlOk(l.url) ? '' : '<span class="tag warn">網址未設定</span>'}`).join('')}</div>
          </section>
          <section class="panel"><header><h2>SEO 與 AI 搜尋</h2><a class="small" href="seo.html">全站設定</a></header>
            <div class="grid2">
              <label class="field"><span>搜尋結果標題（空白＝自動）<span class="num" id="c-t"></span></span><input type="text" name="seoTitle" maxlength="60" value="${esc(p.seoTitle)}"></label>
              <label class="field"><span>搜尋結果描述（空白＝自動）<span class="num" id="c-d"></span></span><textarea name="seoDesc" maxlength="200">${esc(p.seoDesc)}</textarea></label>
            </div>
            <div class="panel" style="margin-top:12px;background:#FAFBFD" aria-label="搜尋結果預覽"><p class="small dim">kombo.tw › products › ${esc(p.sku)}</p><p id="snip-t" style="color:#1A0DAB;font-size:1.0625rem"></p><p id="snip-d" class="small"></p></div>
            <div class="field" style="margin-top:12px"><span>常見問題（會輸出成 FAQ 結構化資料，AI 搜尋常直接引用）</span><div id="faq"></div><button type="button" class="btn" id="faq-add" style="justify-self:start">新增一題</button></div>
          </section>
          <div class="savebar"><span class="why err" id="why"></span><a class="btn" href="products.html">取消</a><button class="btn primary" type="submit" id="save">存入草稿</button></div>
        </form>
        <section class="stage-wrap"><div class="stage-bar"><b>商品頁預覽</b>${deviceSeg('seg', 'phone')}</div>
          <iframe class="stage phone" id="frame" title="商品頁預覽" src="${V3}product.html?clean=1#${esc(p.sku)}"></iframe></section>
      </div>`;
    const frame = $('#frame');
    const run = bindPreview(frame, (d) => applyProduct(d, p));
    bindSeg('seg', frame);
    const drawImgs = () => {
      $('#imgs').innerHTML = p.images.map((im, i) => {
        const md = draft.media.find((m) => m.id === im.media);
        return `<div class="img-row ${im.alt ? '' : 'invalid'}"><img class="thumb" src="${md?.src || ''}" alt="">
          <label class="field"><span>替代文字 <b>必填</b>（看不到圖的人會聽到這段）</span><input type="text" data-i="${i}" value="${esc(im.alt)}"></label>
          <select data-media="${i}" aria-label="換圖">${draft.media.filter((m) => m.kind === '商品').map((m) => `<option value="${m.id}"${m.id === im.media ? ' selected' : ''}>${esc(m.file)}</option>`).join('')}</select></div>`;
      }).join('');
    };
    drawImgs();
    const drawSeo = () => {
      const d = seoOf(p);
      $('#snip-t').textContent = d.title; $('#snip-d').textContent = d.desc.length > 160 ? d.desc.slice(0, 157) + '…' : d.desc;
      $('#c-t').textContent = `　${d.title.length}／60${d.auto.title ? '（自動）' : ''}`;
      $('#c-d').textContent = `　${d.desc.length}／160${d.auto.desc ? '（自動）' : ''}`;
    };
    const drawFaq = () => {
      $('#faq').innerHTML = p.faq.map((f, i) => `<div class="grid2" style="margin-top:6px"><input type="text" data-fq="${i}" placeholder="問題，例如：適合什麼程度？" value="${esc(f.q)}"><span style="display:flex;gap:6px"><input type="text" data-fa="${i}" placeholder="回答" value="${esc(f.a)}"><button type="button" class="btn ghost" data-fdel="${i}" aria-label="刪除這題">✕</button></span></div>`).join('') || '<p class="small dim">尚未新增。</p>';
    };
    drawSeo(); drawFaq();
    $('#faq-add').addEventListener('click', () => { p.faq.push({ q: '', a: '' }); drawFaq(); });
    $('#faq').addEventListener('click', (e) => { const i = e.target.closest('[data-fdel]')?.dataset.fdel; if (i != null) { p.faq.splice(+i, 1); drawFaq(); } });
    const validate = () => {
      const e = productErrors(p);
      $('#why').textContent = e.length ? `無法儲存：${e.join('、')}` : '';
      $('#save').disabled = e.length > 0;
      $$('#f [name]').forEach((el) => { const lab = el.closest('.field'); if (lab) lab.classList.toggle('invalid', (el.name === 'name' && !p.name) || (el.name === 'code' && !p.code) || (el.name === 'priceCheckedAt' && !p.priceCheckedAt)); });
    };
    $('#f').addEventListener('input', (e) => {
      const t = e.target;
      if (t.id === 'colorpick') { p.color = t.value.toUpperCase(); $('#f [name=color]').value = p.color; }
      else if (t.closest('#speeds')) p.speeds = $$('#speeds input:checked').map((x) => +x.value);
      else if (t.dataset.i != null) { p.images[+t.dataset.i].alt = t.value; t.closest('.img-row').classList.toggle('invalid', !t.value); }
      else if (t.dataset.media != null) { p.images[+t.dataset.media].media = t.value; drawImgs(); }
      else if (t.dataset.fq != null) p.faq[+t.dataset.fq].q = t.value;
      else if (t.dataset.fa != null) p.faq[+t.dataset.fa].a = t.value;
      else if (t.name === 'link') p.links = $$('#f [name=link]:checked').map((x) => x.value);
      else if (['price', 'priceList', 'pieces'].includes(t.name)) p[t.name] = t.value === '' ? null : +t.value;
      else if (t.name) p[t.name] = t.value;
      if (t.name === 'color' && /^#[0-9A-Fa-f]{6}$/.test(t.value)) $('#colorpick').value = t.value;
      validate(); drawSeo(); run();
    });
    $('#f').addEventListener('submit', (e) => {
      e.preventDefault();
      if (productErrors(p).length) return;
      Object.assign(orig, p);
      saveDraft();
      toast(`${p.name} 已存入草稿，按「檢查並上架」後生效`);
    });
    validate();
  };

  R.links = (app) => {
    app.innerHTML = `${designNote}
      <section class="panel"><header><h2>連結</h2><button class="btn" id="add">新增連結</button></header>
        <p class="small dim" style="margin-bottom:12px">每個網址只在這裡設定一次；商品、首頁橫幅、公告條用代號引用（例如 <span class="mono">link:shopee</span>）。改這裡，全站跟著改。</p>
        <div class="table-wrap"><table class="list"><thead><tr><th>名稱</th><th class="hide-sm">代號</th><th class="hide-sm">類型</th><th style="min-width:240px">網址</th><th>狀態</th><th class="hide-sm">被引用</th></tr></thead><tbody id="rows"></tbody></table></div>
      </section>`;
    const draw = () => {
      $('#rows').innerHTML = draft.links.map((l, i) => {
        const ok = urlOk(l.url);
        return `<tr><td><input type="text" data-i="${i}" data-k="name" value="${esc(l.name)}" aria-label="名稱"></td>
          <td class="hide-sm mono">${esc(l.id)}</td><td class="hide-sm">${esc(l.type)}</td>
          <td><input type="url" data-i="${i}" data-k="url" value="${esc(l.url)}" placeholder="https://" aria-label="${esc(l.name)} 網址"></td>
          <td>${ok ? '<span class="tag ok">已設定</span>' : l.url ? '<span class="tag bad">格式不對</span>' : '<span class="tag warn">未設定</span>'}</td>
          <td class="hide-sm num">${linkUsage(l.id)} 處</td></tr>`;
      }).join('');
    };
    draw();
    $('#rows').addEventListener('change', (e) => { const t = e.target; if (t.dataset.k == null) return; draft.links[+t.dataset.i][t.dataset.k] = t.value.trim(); saveDraft(); draw(); toast('已存入草稿'); });
    $('#add').addEventListener('click', () => {
      const n = draft.links.filter((l) => l.id.startsWith('custom')).length + 1;
      draft.links.push({ id: `custom-${n}`, name: '新連結', type: '其他', url: '' });
      saveDraft(); draw();
    });
  };

  R.media = (app) => {
    app.innerHTML = `${designNote}
      <section class="panel"><header><h2>上傳</h2></header>
        <label class="drop" id="drop"><input type="file" id="file" accept="image/jpeg,image/png,image/webp" hidden>
          把圖片拖到這裡，或<u>選擇檔案</u><br><span class="small">JPG、PNG、WebP，單檔 5 MB 以內；上線時自動轉 WebP 並產生多種寬度</span></label>
        <div id="pending"></div>
      </section>
      <section class="panel"><header><h2>媒體庫 <span class="dim small" id="cnt"></span></h2>
        <div class="seg" id="kind"><button data-v="all" aria-pressed="true">全部</button><button data-v="unused" aria-pressed="false">未使用</button><button data-v="pending" aria-pressed="false">待上傳</button></div></header>
        <div class="media-grid" id="grid"></div>
      </section>`;
    let kind = 'all';
    const draw = () => {
      const list = draft.media.filter((m) => kind === 'all' || (kind === 'unused' ? !usage(m.id).length : m.pending));
      $('#cnt').textContent = `共 ${draft.media.length} 張，未使用 ${draft.media.filter((m) => !usage(m.id).length).length} 張`;
      $('#grid').innerHTML = list.map((m) => {
        const u = usage(m.id);
        return `<div class="media-card"><div class="pic">${m.src ? `<img src="${m.src}" alt="${esc(m.alt)}">` : '<span class="small dim">待上傳</span>'}</div>
          <div class="meta"><span class="mono">${esc(m.id)}</span>
            <label class="field ${m.alt ? '' : 'invalid'}"><span>替代文字 <b>必填</b></span><input type="text" data-id="${m.id}" value="${esc(m.alt)}"></label>
            <span class="small ${u.length ? '' : 'dim'}">${u.length ? `用在：${esc(u.slice(0, 2).join('、'))}${u.length > 2 ? ` 等 ${u.length} 處` : ''}` : '<span class="tag off">未使用</span>'}</span>
            <button class="btn danger" data-del="${m.id}"${u.length ? ` disabled title="被 ${u.length} 處引用，不能刪除"` : ''}>${u.length ? '使用中' : '刪除'}</button></div></div>`;
      }).join('');
    };
    draw();
    $('#kind').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; kind = b.dataset.v; $$('#kind button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); });
    $('#grid').addEventListener('change', (e) => { const t = e.target; if (!t.dataset.id) return; draft.media.find((m) => m.id === t.dataset.id).alt = t.value.trim(); saveDraft(); draw(); });
    $('#grid').addEventListener('click', async (e) => {
      const id = e.target.closest('[data-del]')?.dataset.del; if (!id || e.target.disabled) return;
      if (await ask('刪除圖片', `確定刪除 <span class="mono">${esc(id)}</span>？上架後檔案會從網站移除，可從上架紀錄還原。`, '刪除', 'danger')) {
        draft.media = draft.media.filter((m) => m.id !== id); saveDraft(); draw(); toast('已從草稿刪除');
      }
    });
    const take = (file) => {
      if (!file) return;
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast('只接受 JPG、PNG、WebP'); return; }
      if (file.size > 5 * 1024 * 1024) { toast('檔案超過 5 MB'); return; }
      const r = new FileReader();
      r.onload = () => {
        const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image';
        $('#pending').innerHTML = `<div class="img-row" style="margin-top:12px"><img class="thumb" src="${r.result}" alt="">
          <div class="grid2"><label class="field"><span>代號（自動，可改）</span><input type="text" id="p-id" value="${esc(base)}"></label>
          <label class="field invalid"><span>替代文字 <b>必填</b></span><input type="text" id="p-alt" placeholder="描述圖片內容"></label></div>
          <button class="btn primary" id="p-save" disabled>加入媒體庫</button></div>`;
        $('#p-alt').addEventListener('input', (e) => { $('#p-save').disabled = !e.target.value.trim(); e.target.closest('.field').classList.toggle('invalid', !e.target.value.trim()); });
        $('#p-save').addEventListener('click', () => {
          const id = $('#p-id').value.trim().replace(/[^a-z0-9-]/g, '-') || base;
          if (draft.media.some((m) => m.id === id)) { toast('代號重複，請換一個'); return; }
          draft.media.unshift({ id, file: `${id}.webp`, src: r.result.length < 400000 ? r.result : '', alt: $('#p-alt').value.trim(), kind: '商品' });
          saveDraft(); $('#pending').innerHTML = ''; draw(); toast('已加入草稿的媒體庫');
        });
      };
      r.readAsDataURL(file);
    };
    $('#file').addEventListener('change', (e) => take(e.target.files[0]));
    const drop = $('#drop');
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => take(e.dataTransfer.files[0]));
  };

  R.publish = (app) => {
    const draw = () => {
      const ch = changes(), ck = checks();
      const bad = ck.filter((x) => x.lv === 'bad');
      app.innerHTML = `${designNote}
        <section class="panel"><header><h2>上架前檢查</h2><span class="small dim">對應建置期的 schema 與引用檢查</span></header>
          <ul class="issues">${bad.map((x) => `<li class="bad">必須修正：${esc(x.msg)}<a href="${x.href}">處理</a></li>`).join('')}
            ${ck.filter((x) => x.lv === 'warn').map((x) => `<li>提醒：${esc(x.msg)}<a href="${x.href}">處理</a></li>`).join('')}
            ${ck.length ? '' : '<li class="ok">全部通過</li>'}</ul>
        </section>
        <section class="panel"><header><h2>草稿與正式站的差異（${ch.length} 項）</h2>
          <span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="discard"${ch.length ? '' : ' disabled'}>捨棄草稿</button><button class="btn" id="preview"${ch.length ? '' : ' disabled'}>建立預覽網址</button>
          <button class="btn publish" id="go"${ch.length && !bad.length ? '' : ' disabled'}>上架</button></span></header>
          <p class="small err">${bad.length ? `有 ${bad.length} 項必須修正，修正後才能上架。` : ''}</p>
          <p class="small" id="pv"></p>
          ${ch.length ? `<ul class="diff">${ch.map(diffRow).join('')}</ul>` : '<p class="dim">草稿與正式站一致，沒有要上架的內容。</p>'}
        </section>
        <section class="panel"><header><h2>上架紀錄</h2><span class="small dim">每次上架是一筆 commit，可還原</span></header>
          <ul class="history">${hist.map((h, i) => `<li><span class="mono">${esc(h.at)}</span><span>${esc(h.note)}<span class="small dim">　${esc(h.by)}，${h.n} 項</span></span>
            ${i === 0 ? '<span class="tag ok">目前版本</span>' : `<button class="btn" data-restore="${i}"${h.snap ? '' : ' disabled title="設計稿只能還原在這個瀏覽器上架的版本"'}>還原到這版</button>`}</li>`).join('')}</ul>
        </section>`;
      $('#discard')?.addEventListener('click', async () => {
        if (await ask('捨棄草稿', `草稿裡的 ${ch.length} 項修改會全部丟掉，回到正式站目前的內容。`, '捨棄', 'danger')) { draft = clone(pub); saveDraft(); draw(); toast('草稿已捨棄'); }
      });
      $('#preview')?.addEventListener('click', () => {
        $('#pv').innerHTML = '預覽網址（示意）：<span class="mono">https://content-draft.kombo-official.pages.dev</span>　建置約一至兩分鐘，只有知道網址的人看得到，搜尋引擎不收錄。';
      });
      $('#go')?.addEventListener('click', async () => {
        if (!await ask('上架', `把草稿的 ${ch.length} 項修改上架到正式站？約一至兩分鐘後生效，之後可從上架紀錄還原。`, '上架', 'publish')) return;
        const now = new Date();
        const at = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        hist.unshift({ at, by: '你', note: ch.slice(0, 2).map((c) => `${c.section} ${c.where}`).join('、') + (ch.length > 2 ? ' 等' : ''), n: ch.length, snap: clone(pub) });
        pub = clone(draft);
        store(KEY.pub, pub); store(KEY.hist, hist); saveDraft(); draw(); toast('已上架（設計稿示意）');
      });
      $$('[data-restore]').forEach((b) => b.addEventListener('click', async () => {
        const h = hist[+b.dataset.restore];
        if (!h.snap || !await ask('還原', `把正式站還原到 ${h.at} 上架前的內容？這會產生一筆新的上架紀錄，目前的內容也可再還原回來。`, '還原', 'publish')) return;
        hist.unshift({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), by: '你', note: `還原到 ${h.at} 之前`, n: diff(pub, h.snap).length, snap: clone(pub) });
        pub = clone(h.snap); draft = clone(pub);
        store(KEY.pub, pub); store(KEY.hist, hist); saveDraft(); draw(); toast('已還原（設計稿示意）');
      }));
    };
    draw();
  };

  /* ---------- SEO 與 AI 搜尋 ---------- */
  const SITE_URL = 'https://<正式網域>';
  const BOT_NOTE = {
    Googlebot: 'Google 搜尋', Bingbot: 'Bing 搜尋（也供 ChatGPT 搜尋參考）', GPTBot: 'OpenAI 模型訓練', 'OAI-SearchBot': 'ChatGPT 搜尋結果',
    ClaudeBot: 'Anthropic Claude', PerplexityBot: 'Perplexity 搜尋', 'Google-Extended': 'Gemini 訓練（不影響 Google 搜尋排名）'
  };
  const productUrl = (p) => `${SITE_URL}/products/${p.sku}`;
  function robotsTxt() {
    const off = Object.entries(draft.site.seo.bots).filter(([, v]) => !v).map(([k]) => k);
    return ['User-agent: *', 'Allow: /', 'Disallow: /admin', '', ...off.flatMap((b) => [`User-agent: ${b}`, 'Disallow: /', '']), `Sitemap: ${SITE_URL}/sitemap.xml`].join('\n');
  }
  function sitemapXml() {
    const urls = ['', '/shuttlecock', '/accessories', '/where-to-buy', '/news', '/about', '/contact', ...draft.products.filter((p) => p.status !== 'discontinued').map((p) => `/products/${p.sku}`)];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}\n</urlset>`;
  }
  function llmsTxt() {
    const ch = draft.links.filter((l) => ['網路商店', '超商取貨'].includes(l.type));
    return [`# ${draft.site.seo.siteName}`, '', `> ${draft.site.seo.defaultDesc}`, '',
      '## 羽毛球', ...draft.products.filter((p) => p.status !== 'discontinued').map((p) => `- [${p.name} ${MAT[p.material]}羽毛球](${productUrl(p)})：${p.speeds.join('、')} 速${p.price ? `，NT$${p.price}` : ''}${p.status === 'coming_soon' ? '（即將上市）' : ''}`),
      '', '## 購買通路', ...ch.map((l) => `- ${l.name}${urlOk(l.url) ? `：${l.url}` : '（網址待設定）'}`),
      '', '## 材質說明', ...K.materials.map((m) => `- ${m.name}：${m.note}`),
      '', '## 聯絡', `- LINE：${K.line.id}`].join('\n');
  }
  function productJsonLd(p) {
    const md = draft.media.find((m) => m.id === p.images[0]?.media);
    const ld = [{
      '@context': 'https://schema.org', '@type': 'Product', name: `${p.name} ${MAT[p.material]}羽毛球`, sku: p.code,
      brand: { '@type': 'Brand', name: 'KOMBO' }, description: seoOf(p).desc, image: md ? `${SITE_URL}/media/${md.file}` : undefined, url: productUrl(p),
      additionalProperty: [{ '@type': 'PropertyValue', name: '毛片', value: MAT[p.material] }, { '@type': 'PropertyValue', name: '球速', value: p.speeds.join('、') }],
      offers: p.price ? { '@type': 'Offer', price: p.price, priceCurrency: 'TWD', availability: p.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', url: productUrl(p) } : undefined
    }];
    const faq = p.faq.filter((f) => f.q && f.a);
    if (faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
    return JSON.stringify(ld.length > 1 ? ld : ld[0], null, 2);
  }

  R.seo = (app) => {
    const seo = draft.site.seo;
    app.innerHTML = `${designNote}
      <div class="grid2">
        <section class="panel"><header><h2>全站</h2></header>
          <div style="display:grid;gap:12px">
            <label class="field"><span>網站名稱 <b>必填</b></span><input type="text" data-k="siteName" value="${esc(seo.siteName)}"></label>
            <label class="field"><span>預設描述（首頁與沒填描述的頁面）<span class="num" id="c-dd"></span></span><textarea data-k="defaultDesc" maxlength="200">${esc(seo.defaultDesc)}</textarea></label>
            <label class="field"><span>分享到 LINE、Facebook 時的預設圖</span><select data-k="ogImage">${draft.media.filter((m) => m.src).map((m) => `<option value="${m.id}"${m.id === seo.ogImage ? ' selected' : ''}>${esc(m.alt)}</option>`).join('')}</select></label>
          </div>
        </section>
        <section class="panel"><header><h2>允許哪些搜尋與 AI 讀取網站</h2></header>
          <div style="display:grid;gap:8px">${Object.entries(seo.bots).map(([b, v]) => `<label class="switch"><input type="checkbox" data-bot="${b}"${v ? ' checked' : ''}><span><span class="mono">${b}</span>　<span class="small dim">${BOT_NOTE[b] || ''}</span></span></label>`).join('')}</div>
          <p class="note" style="margin-top:12px">品牌官網希望被 AI 搜尋引用，建議全部開啟。關掉的會在 robots.txt 寫成不允許讀取。</p>
        </section>
      </div>
      <section class="panel"><header><h2>上架時自動產生</h2>
        <div class="seg" id="gen"><button data-v="robots" aria-pressed="true">robots.txt</button><button data-v="sitemap" aria-pressed="false">sitemap.xml</button><button data-v="llms" aria-pressed="false">llms.txt</button><button data-v="ld" aria-pressed="false">商品結構化資料</button></div></header>
        <div id="ld-pick" hidden style="margin-bottom:8px"><select id="ld-sku" aria-label="選擇商品">${draft.products.map((p) => `<option value="${p.sku}">${esc(p.name)}</option>`).join('')}</select></div>
        <pre class="mono panel" id="out" style="white-space:pre-wrap;overflow-x:auto;max-height:420px;margin:0;background:#FAFBFD"></pre>
        <p class="small dim" style="margin-top:8px">這些檔案由資料產生，不用手寫；網域待正式上線時確定。</p>
      </section>
      <section class="panel"><header><h2>每頁檢查</h2></header>
        <div class="table-wrap"><table class="list"><thead><tr><th>頁面</th><th>標題</th><th>描述</th><th class="hide-sm">結構化資料</th><th class="hide-sm">常見問題</th></tr></thead><tbody id="rows"></tbody></table></div>
      </section>`;
    let gen = 'robots';
    const drawOut = () => {
      $('#ld-pick').hidden = gen !== 'ld';
      $('#out').textContent = gen === 'robots' ? robotsTxt() : gen === 'sitemap' ? sitemapXml() : gen === 'llms' ? llmsTxt() : productJsonLd(draft.products.find((p) => p.sku === $('#ld-sku').value));
      $('#c-dd').textContent = `　${seo.defaultDesc.length}／160`;
    };
    const drawRows = () => {
      $('#rows').innerHTML = draft.products.map((p) => {
        const d = seoOf(p);
        const len = (n, max) => (n > max ? `<span class="tag warn">${n} 字，過長</span>` : `<span class="tag ok">${n} 字</span>`);
        return `<tr><td><a href="product.html#${p.sku}">${esc(p.name)}</a></td><td>${len(d.title.length, 60)}${d.auto.title ? ' <span class="small dim">自動</span>' : ''}</td>
          <td>${len(d.desc.length, 160)}${d.auto.desc ? ' <span class="small dim">自動</span>' : ''}</td><td class="hide-sm">Product${p.faq.some((f) => f.q && f.a) ? '、FAQPage' : ''}</td>
          <td class="hide-sm">${p.faq.filter((f) => f.q && f.a).length ? `${p.faq.filter((f) => f.q && f.a).length} 題` : '<span class="tag off">未填</span>'}</td></tr>`;
      }).join('');
    };
    drawOut(); drawRows();
    $('#gen').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; gen = b.dataset.v; $$('#gen button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); drawOut(); });
    $('#ld-sku').addEventListener('change', drawOut);
    app.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.k) seo[t.dataset.k] = t.value;
      else if (t.dataset.bot) seo.bots[t.dataset.bot] = t.checked;
      else return;
      saveDraft(); drawOut(); drawRows();
    });
  };

  /* ---------- 資料架構（給開發與審閱者看，對應 specs 009） ---------- */
  const SCHEMA = [
    ['site_settings', '全站佈局與 SEO（單一筆）', 'id, announce_enabled, announce_text, announce_ref, nav_json, footer_note, seo_site_name, seo_default_desc, seo_og_media_id, bots_json, updated_at, updated_by'],
    ['pages', '頁面（目前只有首頁可編排）', 'id, slug, title, seo_title, seo_desc, updated_at'],
    ['page_blocks', '頁面區塊：種類、順序、顯示、設定', 'id, page_id, type, sort, visible, props_json（依區塊種類的 schema 驗證）'],
    ['products', '羽毛球與配件', 'id, sku（唯一，網址用）, kind, name, code, material, speeds_json, speed_note, pieces, price, price_list, price_checked_at, color, status, sort, seo_title, seo_desc, updated_at'],
    ['product_media', '商品圖片（多對多，含順序）', 'product_id, media_id, sort, role（主圖、細節、情境）'],
    ['product_links', '商品的購買通路與商品專屬網址', 'product_id, link_id, url_override（例如蝦皮單品網址）'],
    ['faqs', '常見問題（輸出 FAQPage 結構化資料）', 'id, product_id（可空，空＝全站）, question, answer, sort'],
    ['posts', '最新消息與文章', 'id, slug, title, summary, body_md, cover_media_id, published_at, status'],
    ['links', '連結登錄（通路、LINE、社群）', 'id, code（如 shopee）, name, type, url, last_checked_at, last_status'],
    ['media', '圖片中繼資料（檔案在 Storage／R2）', 'id, r2_key, original_name, mime, bytes, width, height, alt（必填）, sha256（去重）, created_at, created_by'],
    ['media_variants', '自動產生的尺寸', 'media_id, width, format（webp、avif）, r2_key, bytes'],
    ['revisions', '每次上架的快照（可還原）', 'id, published_at, published_by, note, snapshot_json（整份已發布內容）, diff_json'],
    ['drafts', '草稿：尚未上架的修改', 'entity, entity_id, data_json, updated_at, updated_by（每筆實體一份草稿）'],
    ['admin_users', '後台使用者與角色（登入交給 Supabase Auth 或 Cloudflare Access）', 'email, role（editor、publisher）, last_login_at'],
    ['audit_log', '操作紀錄', 'id, at, actor, action, entity, entity_id, summary']
  ];
  R.data = (app) => {
    app.innerHTML = `<p class="note">這一頁說明後台背後的資料設計，詳細見 specs/003-技術規格/009。</p>
      <section class="panel"><header><h2>整體架構</h2></header>
        <ol style="margin:0;padding-left:20px;display:grid;gap:6px">
          <li><b>平台待決定</b>：Supabase（另開專案，不與庫存系統共用）或 Cloudflare D1＋R2，比較見 specs 009 §3。以下流程兩者相同。</li>
          <li><b>後台</b>：登入用 Supabase Auth 或 Cloudflare Access，不自建密碼；權限在伺服器端檢查。</li>
          <li><b>資料庫</b>：後台改的東西先寫進 <span class="mono">drafts</span>，不影響正式站。</li>
          <li><b>圖片</b>：存 Supabase Storage 或 R2。瀏覽器拿短效上傳網址直接上傳，資料庫只存中繼資料。</li>
          <li><b>上架</b>：同一交易把草稿寫入正式表、存一份快照到 <span class="mono">revisions</span>，再觸發網站重新建置。</li>
          <li><b>網站</b>：建置時匯出已發布內容，依 schema 驗證後產生靜態頁。訪客不會即時讀資料庫，資料庫暫停或故障時網站照常。</li>
        </ol>
      </section>
      <section class="panel"><header><h2>資料庫平台（待決定）</h2><span class="tag warn">待 Paul 決定</span></header>
        <div class="table-wrap"><table class="list"><thead><tr><th></th><th>A. Supabase（另開專案）</th><th>B. Cloudflare D1＋R2</th></tr></thead><tbody>
          <tr><td>資料庫</td><td>PostgreSQL</td><td>SQLite</td></tr>
          <tr><td>圖片</td><td>Storage；自動縮圖需 Pro 方案</td><td>R2，流量不收費；縮圖上傳後產生</td></tr>
          <tr><td>登入</td><td>內建 Auth（email 連結）</td><td>Cloudflare Access</td></tr>
          <tr><td>業主熟悉度</td><td><b>庫存系統已在用</b></td><td>新平台</td></tr>
          <tr><td>免費方案限制</td><td><span class="tag warn">閒置 7 天自動暫停</span>，暫停時後台與上架不能用</td><td>不暫停</td></tr>
          <tr><td>月費</td><td>免費，或 Pro 約 25 美元／月</td><td>預期在免費額度內</td></tr>
          <tr><td>與網站主機</td><td>兩個平台</td><td>同一平台（Cloudflare Pages）</td></tr>
        </tbody></table></div>
        <p class="note" style="margin-top:10px">建議：接受 Pro 月費選 A（與庫存系統同廠商）；要零月費選 B。不論哪個，都不與庫存系統共用專案。價格與限制實作前再核對。</p>
      </section>
      <section class="panel"><header><h2>資料表（${SCHEMA.length} 張）</h2></header>
        <div class="table-wrap"><table class="list"><thead><tr><th>資料表</th><th>用途</th><th>欄位</th></tr></thead>
        <tbody>${SCHEMA.map(([t, u, c]) => `<tr><td class="mono">${t}</td><td>${esc(u)}</td><td class="small">${esc(c)}</td></tr>`).join('')}</tbody></table></div>
      </section>
      <div class="grid2">
        <section class="panel"><header><h2>圖片上傳流程</h2></header>
          <ol style="margin:0;padding-left:20px;display:grid;gap:6px" class="small">
            <li>選檔：前端先檢查格式（JPG、PNG、WebP）與大小（5 MB 以內），並計算 SHA-256；同一張圖已存在就直接引用，不重複上傳。</li>
            <li>向後台 API 取得 5 分鐘有效的上傳網址。</li>
            <li>瀏覽器直接上傳到 Storage／R2，不經過後台伺服器。</li>
            <li>呼叫 <span class="mono">POST /api/admin/media</span> 寫入中繼資料；替代文字必填，沒填不建立。</li>
            <li>產生 WebP 版本（寬 480、960、1600），寫入 <span class="mono">media_variants</span>；網站依螢幕寬度載入適合的尺寸。</li>
            <li>刪除：被引用中的圖片不能刪；未被引用的圖片保留 30 天後由排程清除，期間可救回。</li>
          </ol>
        </section>
        <section class="panel"><header><h2>上架與還原</h2></header>
          <ol style="margin:0;padding-left:20px;display:grid;gap:6px" class="small">
            <li>上架前檢查：必填欄位、引用存在（連結、圖片、商品）、首頁至少一個商品區塊顯示。</li>
            <li>在一個資料庫交易內：草稿寫入正式資料、清空草稿、寫入 <span class="mono">revisions</span> 快照與差異。</li>
            <li>觸發 Cloudflare Pages 重新建置，約一至兩分鐘生效；建置失敗會通知發布者，網站維持前一版。</li>
            <li>還原：以某一筆快照覆蓋正式資料，同樣產生一筆新的 <span class="mono">revisions</span>，再建置。</li>
          </ol>
        </section>
      </div>`;
  };

  shell();
  R[page]($('#app'));
  if (page === 'product') addEventListener('hashchange', () => location.reload());
})();
