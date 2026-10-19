/* 設計稿 v4 共用：頁首、頁尾、輪播、資料渲染。
   以 v3（照李寧台灣站）為底；依客戶回饋 2（specs/001-需求文件/訪談/2026-10-19-客戶回饋2.md）
   首頁系列區與商品頁圖片改回 v2 的做法，商品分類改為 5 類。正式網站改由 Astro 在建置時產生。 */
(function () {
  const K = window.KOMBO;
  const $ = (s, r = document) => r.querySelector(s);
  const qs = new URLSearchParams(location.search);
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tbd = (t) => (t ? ` <span class="tbd">待確認：${esc(t)}</span>` : '');
  const grp = (id) => K.materials.find((m) => m.id === id);
  const cat = (id) => K.categories.find((c) => c.id === id);
  const speeds = (p) => p.speeds.map((s) => `${s} 速`).join('、') + (p.speedNote ? `（${p.speedNote}）` : '');
  const price = (v) => (v == null ? '—' : `NT$${v.toLocaleString('en-US')}`);
  const bySku = (sku) => K.products.find((p) => p.sku === sku);
  /* 商品名稱：客戶不要被叫「1 號球」，名稱寫成「No.1（K1）」；訓練用球沒有編號 */
  const pname = (p) => (p.code === p.name ? p.name : `${p.name}（${p.code}）`);
  const ext = 'target="_blank" rel="noopener"';
  const LOGO = '<svg viewBox="0 0 70.67 100" aria-hidden="true"><path fill="#1B4C9B" d="M4.43 97.43L2.57 95.77L8.62 89.35L9.91 28.97L2.57 25.49L23.40 16.59L25.51 18.52L24.45 43.26L56.28 75.31L65.30 78.52L52.48 84.85L46.78 84.85L27.27 64.06L23.95 63.57L22.89 87.59Z"/><path fill="#E84E2C" d="M33.66 46.83L32.85 43.66L37.25 39.43L44.41 19.25L44.41 16.68L41.66 15.95L43.38 12.30L68.10 2.57L67.28 8.65L54.72 36.12L40.37 44.93L37.96 44.52Z"/></svg>';

  const hash = () => decodeURIComponent(location.hash.slice(1));
  let cleanPref = false;
  try { cleanPref = localStorage.getItem('kombo-clean') === '1'; } catch (e) { /* 無痕或封鎖儲存時略過 */ }
  if (qs.get('clean') === '1' || cleanPref) document.body.classList.add('clean');
  const page = document.body.dataset.page;

  /* ---------- 頁首：公告條 → 深色品牌帶（標誌置中）→ 白色導覽列（商品系列下拉 5 類） ---------- */
  const LOGO_LIGHT = LOGO.replace('#1B4C9B', '#FFFFFF');
  const ICON = {
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    line: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s6-3.5 8.2-6.1c1.2-1.4 1.8-2.8 1.8-4.7C22 6.6 17.5 3 12 3z"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="12" cy="9.5" r="2.5" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>'
  };
  /* 商品分類（客戶回饋 2）：鵝毛羽毛球、鴨毛羽毛球、羽球拍、服飾配件、羽毛球相關配件 */
  const subsOf = (c) => {
    if (c.id === 'goose' || c.id === 'duck') return K.products.filter((p) => p.group === c.id).map((p) => [`product.html#${p.sku}`, pname(p)]);
    if (c.id === 'rackets') return [['rackets.html', '全部羽球拍']];
    return K.accessories.filter((a) => a.cat === c.id).map((a) => [c.href, a.name]);
  };
  const CATS = K.categories.map((c) => ({ ...c, subs: subsOf(c) }));
  const inCats = CATS.some((c) => c.page === page);
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
    <div class="announce"><p>暫停出貨時在這裡公告${tbd('有暫停出貨等消息時才顯示，文字由業主提供')}</p></div>
    <div class="band"><div class="wide">
      <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="drawer" aria-label="開啟選單">${ICON.menu}</button>
      <a class="brand" href="home.html" aria-label="KOMBO 慷柏體育 首頁">${LOGO_LIGHT}<b>KOMBO</b><small>慷柏體育</small></a>
      <a class="icon-btn band-line" href="${K.line.url}" ${ext} aria-label="LINE 詢問 ${K.line.id}">${ICON.line}<span>LINE 詢問</span></a>
      <span class="logo-tbd">${tbd('LOGO 客戶提供')}</span>
    </div></div>
    <nav class="site-nav" aria-label="主要導覽"><ul>${nav
      .map(([id, href, t, cats]) => `<li${cats ? ' class="has-sub"' : ''}><a href="${href}"${cur(id)}>${t}</a>${cats
        ? `<div class="sub mega">${cats.map((c) => `<div><a class="mega-head" href="${c.href}">${c.name}</a><ul>${c.subs.map(([h, s]) => `<li><a href="${h}">${esc(s)}</a></li>`).join('')}</ul></div>`).join('')}</div>` : ''}</li>`)
      .join('')}</ul></nav>`;
  document.body.prepend(head);

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.id = 'drawer';
  drawer.hidden = true;
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', '主選單');
  const openCat = (c) => c.page === page && (page !== 'shuttlecock' || hash() === c.id);
  drawer.innerHTML = `<div class="drawer-head"><b>主選單</b><button class="icon-btn" type="button" data-close aria-label="關閉選單">${ICON.close}</button></div>
    <ul>${nav.map(([id, href, t, cats]) => (cats
      ? `<li><details id="drawer-cats"${inCats ? ' open' : ''}><summary>${t}</summary><ul>${cats.map((c) => `<li><details${openCat(c) ? ' open' : ''}><summary>${c.name}</summary><ul><li><a href="${c.href}">全部${c.name}</a></li>${c.subs.filter(([h, s]) => s !== `全部${c.name}`).map(([h, s]) => `<li><a href="${h}">${esc(s)}</a></li>`).join('')}</ul></details></li>`).join('')}</ul></details></li>`
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
  /* 底部「商品分類」：打開選單並展開商品系列 */
  const openCats = () => { $('#drawer-cats', drawer).open = true; setDrawer(true); };
  $('[data-close]', drawer).addEventListener('click', () => setDrawer(false));
  drawer.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });
  /* 選單裡點同一頁的分類（只換 # 的連結）時關閉選單 */
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setDrawer(false); });

  /* ---------- 頁尾：三欄；購買與聯絡加電子信箱、社群加 Threads（客戶回饋 2） ---------- */
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
        <div><h3>購買與聯絡</h3><ul><li><a href="where-to-buy.html">銷售通路</a></li><li><a href="contact.html">聯絡我們</a></li><li><a href="${K.line.url}" ${ext}>LINE ${K.line.id}</a></li>
          <li><a href="mailto:${K.email.address}">${K.email.address}</a>${tbd(K.email.tbd)}</li></ul></div>
        <div><h3>社群</h3><ul>${K.social.map((s) => `<li><a href="${s.url}" ${ext}>${s.name}</a>${tbd(s.tbd)}</li>`).join('')}</ul></div>
      </div>
      <div class="foot-base">© 2026 KOMBO 慷柏體育　官網不收單，請到各銷售通路訂購</div>
    </div>`;
  document.body.append(foot);

  /* 手機底部固定分頁列；商品頁改成購買通路＋LINE 操作列，在 renderProduct 產生 */
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
  const tubeImg = (p, cls = '', lazy = true) => (p.img
    ? `<img class="${cls}" src="assets/${p.img}" alt="${esc(pname(p))} 球桶" width="110" height="651"${lazy ? ' loading="lazy"' : ''}>`
    : '<span class="ph">照片待提供</span>');
  /* 商品卡：名稱 → 售價 → 毛片等級（客戶回饋 2：價格下方顯示毛片，不顯示球速） */
  const card = (p) => `<a class="card${p.light ? ' light' : ''}" href="product.html#${p.sku}" style="--c:${p.color}">
      <div class="tile">${tubeImg(p)}</div>
      <div class="meta"><span class="name">${esc(pname(p))}</span><span class="price">${price(p.price)}</span></div>
      <span class="mat-tag">${esc(p.grade)}</span>${tbd(p.gradeTbd)}${tbd(p.tbd)}</a>`;
  const plainCard = (a, note) => `<div class="card" style="--c:#EFE5D3">
      <div class="tile"><span class="ph">照片待提供</span></div>
      <div class="meta"><span class="name">${esc(a.name)}</span><span class="price">${price(a.price)}</span></div>
      <span class="mat-tag">${esc(note)}</span></div>`;

  /* 主視覺輪播（客戶回饋 2）：三張，①活動 ②新商品 ③品牌故事；滿版、字做在圖裡、整張可點。
     圖片由客戶提供，設計稿先用球桶照組成示意圖。 */
  function renderCarousel(el) {
    const slides = [
      { href: 'where-to-buy.html', cls: 's-event', alt: '活動：免運',
        art: ['no-1', 'no-3a', 'no-5a', 'no-3'].map((s) => tubeImg(bySku(s), 'tube-xl', false)).join(''),
        copy: `<b>活動免運</b><span>指定通路滿額免運，下單前記得查看</span>${tbd('示意文案；活動內容與圖片客戶提供。長期放免運活動，雙 11、雙 12 等短期活動時換圖')}` },
      { href: 'product.html#no-5plus', cls: 's-new', alt: '新商品 No.5+（K5+）', c: '#EDE6DA',
        art: tubeImg(bySku('no-5plus'), 'tube-xl', false),
        copy: `<b>新商品 No.5+（K5+）</b><span>三級刺骨鴨</span>${tbd('新商品圖片客戶提供')}` },
      { href: 'about.html', cls: 's-brand', alt: 'KOMBO 品牌故事',
        art: ['no-5', 'no-6', 'no-d'].map((s) => tubeImg(bySku(s), 'tube-xl', false)).join(''),
        copy: `<b>一拍接著一拍</b><span>KOMBO 取自連擊的音義</span>${tbd('品牌故事圖片客戶提供')}` }
    ];
    el.innerHTML = `<div class="wide"><div class="viewport"><div class="slides">${slides
      .map((s) => `<a class="slide ${s.cls}" href="${s.href}" aria-label="${s.alt}"${s.c ? ` style="--c:${s.c}"` : ''}>
          <span class="art">${s.art}</span><span class="copy">${s.copy}</span></a>`).join('')}</div>
        <button class="ctl side prev" type="button" data-prev aria-label="上一張">‹</button>
        <button class="ctl side next" type="button" data-next aria-label="下一張">›</button>
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

  /* 商品分類（客戶回饋 2）：版型照 v2 首頁的「系列」主題橫幅（design/v2/assets/site.js renderBanners），
     內容換成 5 個商品分類；只放分類名稱，不放說明文字 */
  function renderCatBanners(el) {
    const art = {
      goose: { skus: ['no-1', 'no-3a', 'no-5a'], c: '#F6DE4B' },
      duck: { skus: ['no-3', 'no-5plus', 'no-6'], c: '#285FC3' },
      rackets: { c: '#EFE5D3', ph: '羽球拍照片' },
      apparel: { c: '#DCCDF2', ph: '服飾配件照片' },
      gear: { c: '#6EADA8', ph: '配件照片' }
    };
    el.innerHTML = `<div class="banners five">${K.categories
      .map((c) => {
        const a = art[c.id];
        const pic = a.skus ? a.skus.map((s) => tubeImg(bySku(s))).join('') : `<span class="ph">${a.ph}待提供</span>`;
        return `<a class="banner" href="${c.href}" style="--c:${a.c}">
        <div class="art">${pic}</div>
        <div class="txt"><h3>${c.name}</h3><span class="more">看這個分類</span></div></a>`;
      })
      .join('')}</div>${tbd('羽球拍與配件的分類照片待提供')}`;
  }

  function newsCard(n, i) {
    const withImg = K.products.filter((p) => p.img);
    const p = withImg[(i * 3 + 1) % withImg.length];
    return `<a href="news-article.html#${n.slug}"><div class="thumb">${tubeImg(p)}</div>
      <p class="when">${n.date}　${n.tag}</p><h3>${esc(n.title)}</h3><p>${esc(n.excerpt)}</p>${tbd(n.tbd)}</a>`;
  }
  function renderNews(el) {
    el.innerHTML = `<div class="news">${K.news.slice(0, +(el.dataset.limit || 99)).map(newsCard).join('')}</div>`;
  }

  /* 羽毛球列表：分類只有全部／鵝毛球／鴨毛球，分類裡不放文字介紹（客戶回饋 2） */
  function renderShuttleList(el) {
    const tabs = [['all', '全部']].concat(K.materials.map((x) => [x.id, x.name]));
    let sort = 'default';
    const draw = () => {
      const m = tabs.some((t) => t[0] === hash()) ? hash() : (qs.get('m') || 'all');
      let items = m === 'all' ? K.products.slice() : K.products.filter((p) => p.group === m);
      if (sort === 'price-desc') items.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
      if (sort === 'price-asc') items.sort((a, b) => (a.price ?? 1e9) - (b.price ?? 1e9));
      const curName = tabs.find((t) => t[0] === m)?.[1] || '全部';
      document.title = `${m === 'all' ? '羽毛球' : curName} — KOMBO 慷柏體育`;
      el.innerHTML = `<div class="list-layout">
        <nav class="side" aria-label="羽毛球分類"><b>羽毛球</b>${tabs.map(([id, t]) => `<a href="shuttlecock.html${id === 'all' ? '' : '#' + id}"${id === m ? ' aria-current="true"' : ''}>${t}</a>`).join('')}</nav>
        <div class="list-main">
        <div class="toolbar"><span>共 <b class="num">${items.length}</b> 件商品</span>
          <label for="sort">排序　<select id="sort">
            <option value="default"${sort === 'default' ? ' selected' : ''}>預設</option>
            <option value="price-desc"${sort === 'price-desc' ? ' selected' : ''}>價格由高到低</option>
            <option value="price-asc"${sort === 'price-asc' ? ' selected' : ''}>價格由低到高</option></select></label></div>
        <div class="grid three">${items.map(card).join('')}</div>
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

  /* 配件拆成兩頁（客戶回饋 2）：data-cat="apparel" 服飾配件、data-cat="gear" 羽毛球相關配件 */
  function renderAccessoryList(el) {
    const items = K.accessories.filter((a) => a.cat === el.dataset.cat);
    el.innerHTML = `<div class="toolbar"><span>共 <b class="num">${items.length}</b> 件商品</span>${tbd('分類待客戶確認')}${tbd('商品照片待提供')}</div>
      <div class="grid four">${items.map((a) => plainCard(a, a.note)).join('')}</div>`;
  }

  /* 商品頁（客戶回饋 2）：名稱 → 商品編號 → 商品介紹 → 星等 → 羽毛／球頭／規格 → 球速選擇 → 售價
     → 四個通路按鈕 → 售價與庫存說明 → 分享 → 注意事項 → 你可能也喜歡。下方不再有商品介紹與規格說明分頁。
     圖片照 v2：主圖下方一直顯示縮圖列（手機也顯示），讓客人知道還有其他圖可以看。 */
  function renderProduct(el) {
    const p = bySku(hash()) || bySku(qs.get('sku')) || bySku('no-1');
    const g = grp(p.group);
    const c = cat(p.group);
    document.title = `${pname(p)}${pname(p).endsWith('）') ? '' : ' '}${c.name} — KOMBO 慷柏體育`;
    const related = K.products.filter((x) => x.sku !== p.sku).sort((a, b) => (b.group === p.group) - (a.group === p.group)).slice(0, 4);
    const ask = tbd('客戶提供');
    const stars = (n) => `<span class="stars" role="img" aria-label="${n} 顆星，滿分 5 顆">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`;
    const rating = [['flight', '飛行'], ['durability', '耐用度'], ['stability', '穩定性']];
    const shots = [
      { label: '球桶', html: tubeImg(p, '', false) },
      { label: '球頭特寫', html: '<b class="ph">球頭<br>特寫</b>' },
      { label: '羽毛特寫', html: '<b class="ph">羽毛<br>特寫</b>' },
      { label: '整桶開箱', html: '<b class="ph">整桶<br>開箱</b>' }
    ];
    el.innerHTML = `
      <p class="crumbs"><a href="home.html">首頁</a>　/　<a href="shuttlecock.html">羽毛球</a>　/　<a href="shuttlecock.html#${p.group}">${g.name}</a>　/　${esc(pname(p))}</p>
      <div class="product">
        <div class="gallery">
          <div class="stage${p.light ? ' light' : ''}" style="--c:${p.color}"><div class="shot">${shots[0].html}</div>${tbd('Q-8 需要高解析度照片')}</div>
          <div class="thumbs" role="group" aria-label="商品照片，共 ${shots.length} 張">${shots.map((s, k) => `<button type="button" data-shot="${k}" aria-label="看第 ${k + 1} 張：${s.label}" aria-pressed="${k === 0}">${s.html.replace(' loading="lazy"', '')}</button>`).join('')}</div>
        </div>
        <div>
          <h1 class="p-title">${esc(pname(p))}</h1>
          <p class="p-code">商品編號 ${esc(p.code)}</p>
          <p class="p-desc">${p.intro ? esc(p.intro) : `商品介紹${ask}`}</p>
          <dl class="rating">${rating.map(([k, t]) => `<div><dt>${t}</dt><dd>${p.stars ? stars(p.stars[k]) : `—${ask}`}</dd></div>`).join('')}</dl>
          <ul class="checks">
            <li>羽毛：${esc(p.grade)}${tbd(p.gradeTbd)}</li>
            <li>球頭：${p.head ? esc(p.head) : `—${ask}`}</li>
            <li>規格：${p.spec ? esc(p.spec) : `—${ask}`}</li>
          </ul>
          <p style="margin-top:20px;font-weight:700">球速選擇</p>
          <div class="speed-opts">${p.speeds.map((s) => `<span>${s}</span>`).join('')}${p.speedNote ? `<span>偏快 77</span>` : ''}</div>
          <p class="p-price">${price(p.price)}${tbd(p.tbd)}</p>
          <div class="buy" id="buy">${K.channels.map((ch, k) => `<a class="btn${k ? ' ghost' : ''}${ch.id === 'line' ? ' line' : ''}" href="${ch.url}" ${ext}>${ch.buy}<small>${ch.pay}${ch.id === 'line' ? '（LINE 聯絡）' : ''}</small></a>`).join('')}</div>
          <p class="buy-note" style="margin-top:12px">售價與庫存以各通路頁面為準。${tbd('樂天市場與好賣+ 網址待提供')}</p>
          <div class="share"><button class="btn ghost" type="button" id="share">分享這款</button><span class="share-status" role="status" aria-live="polite"></span></div>
        </div>
      </div>
      <section class="notice" aria-labelledby="notice-h"><h2 id="notice-h">注意事項</h2><ul>${K.notices.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></section>
      <section class="section tight"><div class="section-head"><h2>你可能也喜歡</h2></div><div class="grid four">${related.map(card).join('')}</div></section>`;

    const dockEl = document.createElement('div');
    dockEl.className = 'line-dock';
    dockEl.innerHTML = `<button class="btn" type="button" data-to-buy>看購買通路</button><a class="btn line" href="${K.line.url}" ${ext}>LINE 詢問</a>`;
    document.body.append(dockEl);
    /* 不用 #buy 錨點：網址的 # 是商品識別碼，換掉會讓分享與重新整理變成別款 */
    $('[data-to-buy]', dockEl).addEventListener('click', () => {
      $('#buy').scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      $('#buy a').focus({ preventScroll: true });
    });

    /* 縮圖可點：換主圖（目前只有球桶照，其他三張是待提供的佔位） */
    const shotEl = $('.shot', el);
    el.querySelectorAll('[data-shot]').forEach((b) => b.addEventListener('click', () => {
      shotEl.innerHTML = shots[+b.dataset.shot].html;
      el.querySelectorAll('[data-shot]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    }));

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
    if (!el.dataset.bound) {
      el.dataset.bound = '1';
      addEventListener('hashchange', () => {
        if (!bySku(hash())) return; /* 不是商品識別碼的 # 不重畫 */
        $('.line-dock')?.remove(); renderProduct(el); scrollTo(0, 0);
      });
    }
  }

  /* 銷售通路（客戶回饋 2）：不分類，四個通路直接列出；不放 QR Code */
  function renderStores(el) {
    el.innerHTML = `<div class="toolbar"><span>共 <b class="num">${K.channels.length}</b> 個通路</span></div>
      <ul class="store-list">${K.channels.map((c) => `<li><h3>${c.name}</h3><span class="type">${c.type}</span><p>${esc(c.note)}${tbd(c.tbd)}</p>
        <a class="btn ghost${c.id === 'line' ? ' line' : ''}" href="${c.url}" ${ext}>${c.go}</a></li>`).join('')}</ul>`;
  }

  /* 聯絡我們的留言板（示意）：不會真的送出 */
  function renderGuestbook(el) {
    const status = $('.gb-status', el);
    el.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = '設計稿示意：留言不會真的送出。';
    });
  }

  function renderArticle(el) {
    const n = K.news.find((x) => x.slug === hash()) || K.news.find((x) => x.slug === qs.get('slug')) || K.news[0];
    document.title = `${n.title} — KOMBO 慷柏體育`;
    el.innerHTML = `<p class="crumbs"><a href="home.html">首頁</a>　/　<a href="news.html">最新消息</a></p>
      <article class="article"><p class="when">${n.date}　${n.tag}</p><h1>${esc(n.title)}</h1>
        <div class="body"><p>${esc(n.excerpt)}</p><p>${tbd('Q-9 文章內容待品牌方提供')}</p></div></article>`;
  }

  const hooks = {
    carousel: renderCarousel, catbanners: renderCatBanners, news: renderNews,
    shuttles: renderShuttleList, rackets: renderRacketList, accessories: renderAccessoryList, product: renderProduct,
    stores: renderStores, guestbook: renderGuestbook, article: renderArticle
  };
  document.querySelectorAll('[data-render]').forEach((el) => hooks[el.dataset.render](el));
})();
