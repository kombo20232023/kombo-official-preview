/* 設計稿 v3 共用：頁首、頁尾、輪播、資料渲染。
   入站動線、版面骨架、樣式照李寧台灣站（specs/001-需求文件/研究/2026-10-07-lining-checklist.md），
   品牌（標誌、色值、照片、文案）是 KOMBO 的。正式網站改由 Astro 在建置時產生。 */
(function () {
  const K = window.KOMBO;
  const $ = (s, r = document) => r.querySelector(s);
  const qs = new URLSearchParams(location.search);
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tbd = (t) => (t ? ` <span class="tbd">待確認：${esc(t)}</span>` : '');
  const mat = (id) => K.materials.find((m) => m.id === id);
  const speeds = (p) => p.speeds.map((s) => `${s} 速`).join('、') + (p.speedNote ? `（${p.speedNote}）` : '');
  const price = (v) => (v == null ? '—' : `NT$${v.toLocaleString('en-US')}`);
  const bySku = (sku) => K.products.find((p) => p.sku === sku);
  const ext = 'target="_blank" rel="noopener"';
  const LOGO = '<svg viewBox="0 0 70.67 100" aria-hidden="true"><path fill="#1B4C9B" d="M4.43 97.43L2.57 95.77L8.62 89.35L9.91 28.97L2.57 25.49L23.40 16.59L25.51 18.52L24.45 43.26L56.28 75.31L65.30 78.52L52.48 84.85L46.78 84.85L27.27 64.06L23.95 63.57L22.89 87.59Z"/><path fill="#E84E2C" d="M33.66 46.83L32.85 43.66L37.25 39.43L44.41 19.25L44.41 16.68L41.66 15.95L43.38 12.30L68.10 2.57L67.28 8.65L54.72 36.12L40.37 44.93L37.96 44.52Z"/></svg>';
  const sp = (name) => (/^[0-9A-Za-z]/.test(name) ? ' ' : '');

  const hash = () => decodeURIComponent(location.hash.slice(1));
  let cleanPref = false;
  try { cleanPref = localStorage.getItem('kombo-clean') === '1'; } catch (e) { /* 無痕或封鎖儲存時略過 */ }
  if (qs.get('clean') === '1' || cleanPref) document.body.classList.add('clean');
  const page = document.body.dataset.page;

  /* ---------- 頁首：照李寧（核對表 A1～A4）
     公告條 → 深色品牌帶（標誌置中）→ 白色導覽列（羽毛球下拉材質）；
     手機：選單鍵在左、標誌置中、LINE 在右，選單是全螢幕抽屜 ---------- */
  const LOGO_LIGHT = LOGO.replace('#1B4C9B', '#FFFFFF');
  const ICON = {
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    line: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s6-3.5 8.2-6.1c1.2-1.4 1.8-2.8 1.8-4.7C22 6.6 17.5 3 12 3z"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    tube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="2.5" width="8" height="19" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M8 7h8M8 17h8" stroke="currentColor" stroke-width="1.8"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="12" cy="9.5" r="2.5" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>'
  };
  /* 商品分類照李寧：主導覽一個「商品系列」，下拉列出各類與子分類（羽毛球、球拍、配件） */
  const CATS = [
    { id: 'shuttlecock', name: '羽毛球', href: 'shuttlecock.html',
      subs: K.materials.map((x) => [`shuttlecock.html#${x.id}`, x.name]).concat([['shuttlecock.html#training', '訓練用球']]) },
    { id: 'rackets', name: '球拍', href: 'rackets.html', subs: [['rackets.html', '全部球拍']] },
    { id: 'accessories', name: '配件', href: 'accessories.html', subs: K.accessories.map((a) => ['accessories.html', a.name]) }
  ];
  const inCats = CATS.some((c) => c.id === page);
  const nav = [
    ['home', 'home.html', '首頁'],
    ['products', 'shuttlecock.html', '商品系列', CATS],
    ['news', 'news.html', '最新消息'],
    ['about', 'about.html', '品牌故事'],
    ['where', 'where-to-buy.html', '銷售通路'],
    ['contact', 'contact.html', '聯絡我們']
  ];
  const cur = (id) => (id === page || (id === 'products' && inCats) ? ' aria-current="page"' : '');
  const head = document.createElement('header');
  head.className = 'site-head';
  head.innerHTML = `<a class="skip" href="#main">跳到主要內容</a>
    <div class="announce"><p><a href="product.html#no-5plus">新品 No.5+ 偏快 77 速，看商品</a>${tbd('公告內容由業主決定；沒有內容就不放這一條')}</p></div>
    <div class="band"><div class="wide">
      <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="drawer" aria-label="開啟選單">${ICON.menu}</button>
      <a class="brand" href="home.html" aria-label="KOMBO 慷柏體育 首頁">${LOGO_LIGHT}<b>KOMBO</b><small>慷柏體育</small></a>
      <a class="icon-btn band-line" href="${K.line.url}" ${ext} aria-label="LINE 詢問 ${K.line.id}">${ICON.line}<span>LINE 詢問</span></a>
    </div></div>
    <nav class="site-nav" aria-label="主要導覽"><ul>${nav
      .map(([id, href, t, cats]) => `<li${cats ? ' class="has-sub"' : ''}><a href="${href}"${cur(id)}>${t}</a>${cats
        ? `<div class="sub mega">${cats.map((c) => `<div><a class="mega-head" href="${c.href}">${c.name}</a><ul>${c.subs.map(([h, s]) => `<li><a href="${h}">${s}</a></li>`).join('')}</ul></div>`).join('')}</div>` : ''}</li>`)
      .join('')}</ul></nav>`;
  document.body.prepend(head);

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.id = 'drawer';
  drawer.hidden = true;
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', '主選單');
  drawer.innerHTML = `<div class="drawer-head"><b>主選單</b><button class="icon-btn" type="button" data-close aria-label="關閉選單">${ICON.close}</button></div>
    <ul>${nav.map(([id, href, t, cats]) => (cats
      ? `<li><details id="drawer-cats"${inCats ? ' open' : ''}><summary>${t}</summary><ul>${cats.map((c) => `<li><details${c.id === page ? ' open' : ''}><summary>${c.name}</summary><ul><li><a href="${c.href}">全部${c.name}</a></li>${c.subs.filter(([h, s]) => s !== `全部${c.name}`).map(([h, s]) => `<li><a href="${h}">${s}</a></li>`).join('')}</ul></details></li>`).join('')}</ul></details></li>`
      : `<li><a href="${href}"${cur(id)}>${t}</a></li>`)).join('')}</ul>`;
  document.body.append(drawer);
  const menuBtn = $('.menu-btn', head);
  const setDrawer = (open) => {
    drawer.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('lock', open);
    (open ? $('[data-close]', drawer) : menuBtn).focus();
  };
  menuBtn.addEventListener('click', () => setDrawer(true));
  /* 底部「商品分類」：打開選單並展開商品系列（李寧的分類在選單裡） */
  const openCats = () => { $('#drawer-cats', drawer).open = true; setDrawer(true); };
  $('[data-close]', drawer).addEventListener('click', () => setDrawer(false));
  drawer.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });

  /* ---------- 頁尾：照李寧三欄（核對表 B7） ---------- */
  const foot = document.createElement('footer');
  foot.className = 'site-foot';
  foot.innerHTML = `
    <svg class="skirt" viewBox="0 0 200 220" aria-hidden="true">${Array.from({ length: 13 }, (_, i) => {
      const x = 10 + i * 15;
      return `<line x1="${x}" y1="0" x2="${100 + (x - 100) * 0.22}" y2="220" stroke="#fff" stroke-width="1.4"/>`;
    }).join('')}</svg>
    <div class="wrap">
      <div class="foot-grid">
        <div><h3>關於 KOMBO</h3><ul><li><a href="about.html">品牌故事</a></li><li><a href="news.html">最新消息</a></li><li><a href="catalog-download.html">型錄下載</a></li></ul></div>
        <div><h3>購買與聯絡</h3><ul><li><a href="where-to-buy.html">銷售通路</a></li><li><a href="contact.html">聯絡我們</a></li><li><a href="${K.line.url}" ${ext}>LINE ${K.line.id}</a></li></ul></div>
        <div><h3>社群</h3><ul>${K.social.map((s) => `<li><a href="${s.url}" ${ext}>${s.name}</a></li>`).join('')}</ul></div>
      </div>
      <div class="foot-base">© 2026 KOMBO 慷柏體育　官網不收單，請到各銷售通路訂購</div>
    </div>`;
  document.body.append(foot);

  /* 手機底部固定分頁列（核對表 A5）：李寧的收藏、購物車、帳戶換成 KOMBO 用得到的入口；
     商品頁改成通路＋LINE 操作列（B6），在 renderProduct 產生 */
  if (page !== 'product') {
    const tabbar = document.createElement('nav');
    tabbar.className = 'tabbar';
    tabbar.setAttribute('aria-label', '快速入口');
    tabbar.innerHTML = `<a href="home.html"${cur('home')}>${ICON.home}<span>首頁</span></a>`
      + `<button type="button" data-cats${inCats ? ' aria-current="page"' : ''}>${ICON.grid}<span>商品分類</span></button>`
      + `<a href="where-to-buy.html"${cur('where')}>${ICON.pin}<span>銷售通路</span></a>`
      + `<a class="t-line" href="${K.line.url}" ${ext}>${ICON.line}<span>LINE 詢問</span></a>`;
    document.body.append(tabbar);
    $('[data-cats]', tabbar).addEventListener('click', openCats);
  }

  /* ---------- 元件 ---------- */
  const tubeImg = (p, cls = '', lazy = true) =>
    `<img class="${cls}" src="assets/${p.img}" alt="${esc(p.name)} 球桶" width="110" height="651"${lazy ? ' loading="lazy"' : ''}>`;
  const card = (p) => `<a class="card${p.light ? ' light' : ''}" href="product.html#${p.sku}" style="--c:${p.color}">
      <div class="tile">${tubeImg(p)}</div>
      <div class="meta"><span class="name">${esc(p.name)}</span><span class="price">${price(p.price)}</span></div>
      <span class="mat-tag">${mat(p.material).name}　${speeds(p)}</span>${tbd(p.tbd)}</a>`;
  const plainCard = (a, note) => `<div class="card" style="--c:#EFE5D3">
      <div class="tile"><span class="ph">照片待提供</span></div>
      <div class="meta"><span class="name" style="font-family:var(--font-sans);font-style:normal;font-size:1.125rem">${esc(a.name)}</span><span class="price">${price(a.price)}</span></div>
      <span class="mat-tag">${esc(note)}</span></div>`;

  /* 主視覺輪播（核對表 B1）：照李寧，每張是一整張圖、文字做在圖裡、整張可點，不放說明段落與按鈕。
     設計稿先用球桶照組成「圖」；正式圖片要另外製作電腦橫式與手機直式兩組（核對表 D3）。 */
  function renderCarousel(el) {
    const slides = [
      { href: 'shuttlecock.html', cls: 's-lineup', alt: 'KOMBO 九款羽毛球',
        art: `<img class="lineup" src="assets/lineup-full.webp" alt="" width="1206" height="762">`,
        copy: '<em>KOMBO</em><b>九款羽毛球</b>' },
      { href: 'shuttlecock.html#goose', cls: 's-goose', alt: '天然鵝毛系列', c: '#F6DE4B',
        art: ['no-1', 'no-3a', 'no-5a'].map((s) => tubeImg(bySku(s), 'tube-xl', false)).join(''),
        copy: '<b>天然鵝毛系列</b><span>No.1　No.3A　No.5A</span>' },
      { href: 'about.html', cls: 's-brand', alt: 'KOMBO 品牌故事',
        art: ['no-3', 'no-5', 'no-6', 'no-d'].map((s) => tubeImg(bySku(s), 'tube-xl', false)).join(''),
        copy: '<b>一拍接著一拍</b><span>KOMBO 取自連擊的音義</span>' }
    ];
    el.innerHTML = `<div class="wide"><div class="viewport"><div class="slides">${slides
      .map((s) => `<a class="slide ${s.cls}" href="${s.href}" aria-label="${s.alt}"${s.c ? ` style="--c:${s.c}"` : ''}>
          <span class="art">${s.art}</span><span class="copy">${s.copy}</span></a>`).join('')}</div>
        <button class="ctl side prev" type="button" data-prev aria-label="上一張">‹</button>
        <button class="ctl side next" type="button" data-next aria-label="下一張">›</button>
        ${tbd('主視覺圖片待提供：電腦橫式 1380×600、手機直式 4:5 各一組')}
      </div>
      <div class="carousel-ui">
        ${slides.map((_, i) => `<button type="button" data-go="${i}" aria-label="第 ${i + 1} 張"><span class="dot"></span></button>`).join('')}
        <button class="ctl" type="button" data-pause aria-label="暫停輪播">Ⅱ</button>
      </div></div>`;
    el.setAttribute('aria-roledescription', 'carousel');
    const track = $('.slides', el);
    const all = [...el.querySelectorAll('.slide')];
    let i = 0;
    let timer = null;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = (n) => {
      i = (n + all.length) % all.length;
      track.style.transform = `translateX(${-100 * i}%)`;
      all.forEach((s, k) => { s.setAttribute('aria-hidden', String(k !== i)); s.tabIndex = k === i ? 0 : -1; });
      el.querySelectorAll('[data-go]').forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    };
    const pauseBtn = $('[data-pause]', el);
    const stop = () => { clearInterval(timer); timer = null; pauseBtn.textContent = '▶'; pauseBtn.setAttribute('aria-label', '播放輪播'); };
    const start = () => { if (reduce) return stop(); clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); pauseBtn.textContent = 'Ⅱ'; pauseBtn.setAttribute('aria-label', '暫停輪播'); };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.go) go(+b.dataset.go);
      if ('prev' in b.dataset) go(i - 1);
      if ('next' in b.dataset) go(i + 1);
      if ('pause' in b.dataset) (timer ? stop() : start());
    });
    el.addEventListener('focusin', () => timer && clearInterval(timer));
    go(0);
    start();
  }

  /* 系列海報（李寧首頁第二、三段的海報輪播）：電腦三張並排，手機橫向滑動；字做在圖裡 */
  function renderPosters(el) {
    const b = [
      { m: 'goose', title: '天然鵝毛', skus: ['no-1', 'no-3a', 'no-5a'], c: '#F6DE4B' },
      { m: 'duck-spine', title: '刺骨鴨', skus: ['no-3', 'no-5', 'no-5plus'], c: '#285FC3', dark: true },
      { m: 'duck', title: '鴨毛與鵝毛拉直', skus: ['no-6', 'no-d', 'no-8'], c: '#6EADA8' }
    ];
    el.innerHTML = `<div class="posters">${b
      .map((x) => `<a class="poster${x.dark ? ' dark' : ''}" href="shuttlecock.html#${x.m}" style="--c:${x.c}">
        <span class="art">${x.skus.map((s) => tubeImg(bySku(s))).join('')}</span><span class="cap">${x.title}</span></a>`)
      .join('')}</div>`;
  }

  /* 商品格（核對表 A7）：首頁一次點擊進商品頁；李寧是 4 欄 × 2 列 */
  function renderLineup(el) {
    el.innerHTML = `<div class="grid four">${K.products.slice(0, 8).map(card).join('')}</div>
      <p class="more-row"><a class="btn ghost" href="shuttlecock.html">看全部 ${K.products.length} 款</a></p>`;
  }

  /* 分類入口（李寧的四格分類）：依材質，只有圖與名稱 */
  function renderMats(el) {
    const pick = { goose: 'no-3a', 'goose-straight': 'no-8', 'duck-spine': 'no-3', duck: 'no-6' };
    el.innerHTML = `<ul class="mats">${K.materials.map((m) => {
      const p = bySku(pick[m.id]);
      return `<li><a href="shuttlecock.html#${m.id}" style="--c:${p.color}"><span class="art">${tubeImg(p)}</span><span class="cap">${m.name}</span></a></li>`;
    }).join('')}</ul>`;
  }

  /* 單張橫幅（李寧首頁中段的單張大圖）：導到銷售通路 */
  function renderWhereBanner(el) {
    el.innerHTML = `<a class="wbanner" href="where-to-buy.html">
      <span class="copy"><b>到哪裡買</b><span>蝦皮購物　7-11 賣貨便　全家好賣+</span></span>
      <span class="art">${['no-1', 'no-3a', 'no-5a', 'no-3', 'no-5'].map((s) => tubeImg(bySku(s))).join('')}</span></a>`;
  }

  function newsCard(n, i) {
    const p = K.products[(i * 3 + 1) % K.products.length];
    return `<a href="news-article.html#${n.slug}"><div class="thumb">${tubeImg(p)}</div>
      <p class="when">${n.date}　${n.tag}</p><h3>${esc(n.title)}</h3><p>${esc(n.excerpt)}</p>${tbd(n.tbd)}</a>`;
  }
  function renderNews(el) {
    el.innerHTML = `<div class="news">${K.news.slice(0, +(el.dataset.limit || 99)).map(newsCard).join('')}</div>`;
  }

  /* 羽毛球列表：子分類＋件數＋排序（VICTOR／李寧） */
  function renderShuttleList(el) {
    const tabs = [['all', '全部']].concat(K.materials.map((x) => [x.id, x.name]), [['training', '訓練用球']]);
    let sort = 'default';
    const draw = () => {
      const m = tabs.some((t) => t[0] === hash()) ? hash() : (qs.get('m') || 'all');
      let items = m === 'all' ? K.products.slice() : K.products.filter((p) => p.material === m);
      if (sort === 'price-desc') items.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
      if (sort === 'price-asc') items.sort((a, b) => (a.price ?? 1e9) - (b.price ?? 1e9));
      const showTraining = m === 'all' || m === 'training';
      const count = items.length + (showTraining ? 1 : 0);
      const curName = tabs.find((t) => t[0] === m)?.[1] || '全部';
      document.title = `${m === 'all' ? '羽毛球' : curName + '羽毛球'} — KOMBO 慷柏體育`;
      /* 核對表 B3／B4：電腦版左側分類側欄＋3 欄；手機版側欄變成一行可橫滑的分類列＋2 欄 */
      el.innerHTML = `<div class="list-layout">
        <nav class="side" aria-label="羽毛球分類"><b>羽毛球</b>${tabs.map(([id, t]) => `<a href="shuttlecock.html${id === 'all' ? '' : '#' + id}"${id === m ? ' aria-current="true"' : ''}>${t}</a>`).join('')}</nav>
        <div class="list-main">
        <div class="toolbar"><span>共 <b class="num">${count}</b> 件商品</span>
          <label for="sort">排序　<select id="sort">
            <option value="default"${sort === 'default' ? ' selected' : ''}>預設</option>
            <option value="price-desc"${sort === 'price-desc' ? ' selected' : ''}>價格由高到低</option>
            <option value="price-asc"${sort === 'price-asc' ? ' selected' : ''}>價格由低到高</option></select></label></div>
        ${m !== 'all' && m !== 'training' ? `<p class="dim" style="margin:-8px 0 20px">${mat(m).note}${tbd('材質說明為草稿')}</p>` : ''}
        <div class="grid three">${items.map(card).join('')}${showTraining ? plainCard(K.training, `${speeds(K.training)}`) : ''}</div>
        </div></div>`;
      $('#sort').addEventListener('change', (e) => { sort = e.target.value; draw(); $('#sort').focus(); });
    };
    draw();
    addEventListener('hashchange', draw);
  }

  /* 球拍：商品資料待提供，先放版型（與配件同一個列表版型） */
  function renderRacketList(el) {
    const ph = ['球拍 A', '球拍 B', '球拍 C', '球拍 D'];
    el.innerHTML = `<div class="toolbar"><span>共 <b class="num">${ph.length}</b> 件商品</span>${tbd('球拍型號、規格、照片、售價待品牌方提供')}</div>
      <div class="grid four">${ph.map((n) => plainCard({ name: n, price: null }, '拍重、平衡點、中管硬度')).join('')}</div>`;
  }

  function renderAccessoryList(el) {
    el.innerHTML = `<div class="toolbar"><span>共 <b class="num">${K.accessories.length}</b> 件商品</span>${tbd('商品照片待提供')}</div>
      <div class="grid four">${K.accessories.map((a) => plainCard(a, a.note)).join('')}</div>`;
  }

  /* 商品頁：VICTOR 的欄位與分頁，規格條列照李寧 */
  function renderProduct(el) {
    const p = bySku(hash()) || bySku(qs.get('sku')) || bySku('no-3a');
    const m = mat(p.material);
    const ch = (id) => K.channels.find((c) => c.id === id);
    document.title = `${p.name} ${m.name}羽毛球 — KOMBO 慷柏體育`;
    const related = K.products.filter((x) => x.sku !== p.sku).sort((a, b) => (b.material === p.material) - (a.material === p.material)).slice(0, 4);
    el.innerHTML = `
      <p class="crumbs"><a href="home.html">首頁</a>　/　<a href="shuttlecock.html">羽毛球</a>　/　<a href="shuttlecock.html#${p.material}">${m.name}</a>　/　${esc(p.name)}</p>
      <div class="product">
        <div class="gallery">
          <div class="stage${p.light ? ' light' : ''}" style="--c:${p.color}">${tubeImg(p, '', false)}<span class="count">1 / 4</span>${tbd('Q-8 需要高解析度照片')}</div>
          <div class="thumbs"><span class="on">${tubeImg(p)}</span><span><b class="ph">球頭<br>特寫</b></span><span><b class="ph">羽毛<br>特寫</b></span><span><b class="ph">整桶<br>開箱</b></span></div>
        </div>
        <div>
          <h1 class="p-title">${esc(p.name)} ${m.name}羽毛球</h1>
          <p class="p-code">商品編號 ${p.code}</p>
          <p class="p-desc">${m.note}。${tbd('Q-3 商品標語待品牌方提供')}</p>
          <ul class="checks">
            <li>毛片：${m.name}</li>
            <li>球頭：—${tbd('待提供')}</li>
            <li>球速：${speeds(p)}</li>
            <li>數量：—${tbd('每桶顆數待提供')}</li>
          </ul>
          <p style="margin-top:20px;font-weight:700">球速選項</p>
          <div class="speed-opts">${p.speeds.map((s) => `<span>${s}</span>`).join('')}${p.speedNote ? `<span>偏快 77</span>` : ''}</div>
          <p class="p-price">${price(p.price)}${tbd(p.tbd || 'Q-2 是否顯示價格')}</p>
          <div class="buy">
            <a class="btn" href="${ch('shopee').url}" ${ext}>到蝦皮購買 ${esc(p.name)}<small>直接到這一款</small></a>
            <a class="btn ghost" href="${ch('myship').url}" ${ext}>在 7-11 賣貨便選購<small>到賣場後挑選</small></a>
            <a class="btn ghost" href="${ch('famistore').url}" ${ext}>在全家好賣+ 選購<small>到賣場後挑選</small></a>
            <a class="btn line" href="${K.line.url}" ${ext}>LINE 詢問<small>${K.line.id}</small></a>
          </div>
          <p class="buy-note" style="margin-top:12px">售價與庫存以各通路頁面為準。${tbd('Q-4 蝦皮商品網址待提供')}</p>
          <div class="share"><button class="btn ghost" type="button" id="share">分享這款</button><span class="share-status" role="status" aria-live="polite"></span></div>
        </div>
      </div>
      <div class="tabs">
        <div class="tablist" role="tablist" aria-label="商品資訊">
          <button role="tab" id="t-intro" aria-controls="p-intro" aria-selected="true">商品介紹</button>
          <button role="tab" id="t-spec" aria-controls="p-spec" aria-selected="false" tabindex="-1">規格說明</button>
        </div>
        <div class="tabpanel" role="tabpanel" id="p-intro" aria-labelledby="t-intro">
          <p>${esc(p.name)} 是 KOMBO ${m.name}系列的羽毛球。${m.note}。</p>
          <p style="margin-top:12px">${tbd('Q-3 完整商品介紹待品牌方提供')}</p>
        </div>
        <div class="tabpanel" role="tabpanel" id="p-spec" aria-labelledby="t-spec" hidden>
          <table><tbody>
            <tr><th scope="row">商品編號</th><td>${p.code}</td></tr>
            <tr><th scope="row">毛片</th><td>${m.name}</td></tr>
            <tr><th scope="row">球頭</th><td>—${tbd('待提供')}</td></tr>
            <tr><th scope="row">球速</th><td>${speeds(p)}</td></tr>
            <tr><th scope="row">數量</th><td>—${tbd('每桶顆數待提供')}</td></tr>
          </tbody></table>
        </div>
      </div>
      <section class="section tight"><div class="section-head"><h2>你可能也喜歡</h2></div><div class="grid four">${related.map(card).join('')}</div></section>`;

    const dockEl = document.createElement('div');
    dockEl.className = 'line-dock';
    dockEl.innerHTML = `<a class="btn" href="${ch('shopee').url}" ${ext}>到蝦皮購買</a><a class="btn line" href="${K.line.url}" ${ext}>LINE 詢問</a>`;
    document.body.append(dockEl);

    const tabs = [...el.querySelectorAll('[role="tab"]')];
    const select = (t) => tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      $('#' + x.getAttribute('aria-controls')).hidden = !on;
    });
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const n = tabs[(k + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
          select(n); n.focus();
        }
      });
    });

    $('#share').addEventListener('click', async () => {
      const status = $('.share-status');
      if (navigator.share) {
        try { await navigator.share({ title: document.title, url: location.href }); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      try {
        await navigator.clipboard.writeText(location.href);
        status.textContent = '已複製連結，可以貼到 LINE 或社群';
      } catch (e) {
        status.textContent = `請手動複製這個網址：${location.href}`;
      }
    });
    if (!el.dataset.bound) { el.dataset.bound = '1'; addEventListener('hashchange', () => { $('.line-dock')?.remove(); renderProduct(el); scrollTo(0, 0); }); }
  }

  /* 銷售通路：VICTOR 經銷據點頁的清單＋篩選 */
  function renderStores(el) {
    const types = [['all', '全部', null], ['online', '網路商店', '網路商店'], ['cvs', '超商取貨', '超商取貨'], ['store', '實體據點', '實體據點']];
    const draw = () => {
      const t = types.find((x) => x[0] === hash()) || types[0];
      const list = K.channels.filter((c) => !t[2] || K.channelTypes[c.id] === t[2]);
      el.innerHTML = `<nav class="subnav" aria-label="通路類型">${types
        .map(([id, name]) => `<a href="where-to-buy.html${id === 'all' ? '' : '#' + id}"${id === t[0] ? ' aria-current="true"' : ''}>${name}</a>`)
        .join('')}</nav>
        <div class="toolbar"><span>共 <b class="num">${list.length}</b> 個通路</span></div>
        ${list.length
          ? `<ul class="store-list">${list.map((c) => `<li><h3>${c.name}</h3><span class="type">${K.channelTypes[c.id]}</span><p>${c.note}${tbd(c.tbd)}</p>
              <a class="btn ghost" href="${c.url}" ${ext}>前往${sp(c.name)}${c.name}</a></li>`).join('')}</ul>`
          : `<p class="empty">目前沒有實體據點，請到網路商店或超商取貨通路訂購，或用 LINE 詢問。${tbd('Q-1 是否有實體店、經銷商或球館據點')}</p>`}`;
    };
    draw();
    addEventListener('hashchange', draw);
  }

  function renderQR(el) {
    if (window.QRCode) new QRCode(el, { text: K.line.url, width: 264, height: 264, colorDark: '#14315F', colorLight: '#ffffff' });
  }

  function renderArticle(el) {
    const n = K.news.find((x) => x.slug === hash()) || K.news.find((x) => x.slug === qs.get('slug')) || K.news[0];
    document.title = `${n.title} — KOMBO 慷柏體育`;
    el.innerHTML = `<p class="crumbs"><a href="home.html">首頁</a>　/　<a href="news.html">最新消息</a></p>
      <article class="article"><p class="when">${n.date}　${n.tag}</p><h1>${esc(n.title)}</h1>
        <div class="body"><p>${esc(n.excerpt)}</p><p>${tbd('Q-9 文章內容待品牌方提供')}</p></div></article>`;
  }

  const hooks = {
    carousel: renderCarousel, posters: renderPosters, lineup: renderLineup, mats: renderMats, wherebanner: renderWhereBanner, news: renderNews,
    shuttles: renderShuttleList, rackets: renderRacketList, accessories: renderAccessoryList, product: renderProduct,
    stores: renderStores, qr: renderQR, article: renderArticle
  };
  document.querySelectorAll('[data-render]').forEach((el) => hooks[el.dataset.render](el));
})();
