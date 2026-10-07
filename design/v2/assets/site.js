/* 設計稿 v2 共用：頁首、頁尾、輪播、資料渲染。結構照 VICTOR／李寧（specs 008「網站結構」）。
   正式網站改由 Astro 在建置時產生。 */
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

  /* ---------- 頁首：主導覽照 VICTOR 依分類排列 ---------- */
  const nav = [
    ['news', 'news.html', '最新消息'],
    ['shuttlecock', 'shuttlecock.html', '羽毛球'],
    ['accessories', 'accessories.html', '配件'],
    ['about', 'about.html', '品牌故事'],
    ['where', 'where-to-buy.html', '銷售通路'],
    ['contact', 'contact.html', '聯絡我們']
  ];
  const head = document.createElement('header');
  head.className = 'site-head';
  head.innerHTML = `<a class="skip" href="#main">跳到主要內容</a>
    <div class="wrap">
      <a class="brand" href="home.html" aria-label="KOMBO 慷柏體育 首頁">${LOGO}<b>KOMBO</b><small>慷柏體育</small></a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">選單</button>
      <nav class="site-nav" id="site-nav" aria-label="主要導覽">${nav
        .map(([id, href, t]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ''}>${t}</a>`)
        .join('')}</nav>
      <a class="btn line head-line" href="${K.line.url}" ${ext}>加入 LINE</a>
    </div>`;
  document.body.prepend(head);
  const menuBtn = $('.menu-btn', head);
  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? '關閉' : '選單';
    $('#site-nav').classList.toggle('open', open);
  });

  /* ---------- 頁尾：照 VICTOR 分欄 ---------- */
  const foot = document.createElement('footer');
  foot.className = 'site-foot';
  foot.innerHTML = `
    <svg class="skirt" viewBox="0 0 200 220" aria-hidden="true">${Array.from({ length: 13 }, (_, i) => {
      const x = 10 + i * 15;
      return `<line x1="${x}" y1="0" x2="${100 + (x - 100) * 0.22}" y2="220" stroke="#fff" stroke-width="1.4"/>`;
    }).join('')}</svg>
    <div class="wrap">
      <div class="foot-grid">
        <div><h3>KOMBO 專區</h3><ul><li><a href="about.html">品牌故事</a></li><li><a href="catalog-download.html">型錄下載</a></li><li><a href="news.html">最新消息</a></li></ul></div>
        <div><h3>商品</h3><ul><li><a href="shuttlecock.html">羽毛球</a></li><li><a href="accessories.html">配件</a></li></ul></div>
        <div><h3>顧客服務</h3><ul><li><a href="where-to-buy.html">銷售通路</a></li><li><a href="contact.html">聯絡我們</a></li></ul></div>
        <div><h3>社群</h3><ul><li><a href="${K.line.url}" ${ext}>LINE ${K.line.id}</a></li>
          ${K.social.map((s) => `<li><a href="${s.url}" ${ext}>${s.name}</a></li>`).join('')}</ul></div>
      </div>
      <div class="foot-base">© 2026 KOMBO 慷柏體育　官網不收單，請到各銷售通路訂購</div>
    </div>`;
  document.body.append(foot);

  if (page !== 'product') {
    const dock = document.createElement('div');
    dock.className = 'line-dock';
    dock.innerHTML = `<a class="btn line" href="${K.line.url}" ${ext}>LINE 詢問</a>`;
    document.body.append(dock);
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

  /* 主視覺輪播：照 VICTOR／李寧首頁，3 張、可暫停、尊重減少動態設定 */
  function renderCarousel(el) {
    const slides = [
      `<div class="slide"><div class="wrap">
        <div><h2><em>KOMBO</em><br>九款羽毛球</h2>
          <p>天然鵝毛、鵝毛拉直、刺骨鴨、鴨毛四種材質，76 至 78 速。每一款一個顏色。</p>
          <div class="hero-actions"><a class="btn" href="shuttlecock.html">看全部羽毛球</a><a class="btn ghost" href="where-to-buy.html">銷售通路</a></div></div>
        <div class="slide-art"><img class="lineup" src="assets/lineup-full.webp" alt="KOMBO 九款羽毛球球桶並排" width="1206" height="762"></div>
      </div></div>`,
      `<div class="slide" style="background:color-mix(in srgb, #F6DE4B 26%, var(--paper))"><div class="wrap">
        <div><h2>天然鵝毛系列</h2>
          <p>No.1、No.3A、No.5A。羽毛完整、飛行穩定，比賽與高強度團練。${tbd('系列文案為草稿')}</p>
          <div class="hero-actions"><a class="btn" href="shuttlecock.html#goose">看天然鵝毛</a></div></div>
        <div class="slide-art">${['no-1', 'no-3a', 'no-5a'].map((s) => tubeImg(bySku(s), 'tube-xl', false)).join('')}</div>
      </div></div>`,
      `<div class="slide s-brand"><div class="wrap">
        <div><h2>KOMBO<br>取自連擊的音義</h2></div>
        <div><blockquote>KOMBO 取自於連擊的音義，更是羽球雙打中最重要的連貫，希望我們能在服務與生產銷售的路上，給大家滿滿的驚喜！讓我們一拍接著一拍，在世界各地飛行，綻放光彩！</blockquote>
          <div class="hero-actions"><a class="btn ghost" href="about.html">讀品牌故事</a></div></div>
      </div></div>`
    ];
    el.innerHTML = `<div class="slides">${slides.join('')}</div>
      <div class="carousel-ui">
        <button class="ctl" type="button" data-prev aria-label="上一張">‹</button>
        ${slides.map((_, i) => `<button type="button" data-go="${i}" aria-label="第 ${i + 1} 張"><span class="dot"></span></button>`).join('')}
        <button class="ctl" type="button" data-next aria-label="下一張">›</button>
        <button class="ctl" type="button" data-pause aria-label="暫停輪播">Ⅱ</button>
      </div>`;
    el.setAttribute('aria-roledescription', 'carousel');
    const track = $('.slides', el);
    const all = [...el.querySelectorAll('.slide')];
    let i = 0;
    let timer = null;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = (n) => {
      i = (n + all.length) % all.length;
      track.style.transform = `translateX(${-100 * i}%)`;
      all.forEach((s, k) => s.setAttribute('aria-hidden', String(k !== i)));
      el.querySelectorAll('[data-go]').forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
      el.classList.toggle('s-brand-on', all[i].classList.contains('s-brand'));
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

  /* 系列主題橫幅：VICTOR 首頁的三則主題橫幅 */
  function renderBanners(el) {
    const b = [
      { m: 'goose', title: '天然鵝毛', sub: '比賽與高強度團練', skus: ['no-1', 'no-3a', 'no-5a'], c: '#F6DE4B' },
      { m: 'duck-spine', title: '刺骨鴨', sub: '耐打度與價格的平衡', skus: ['no-3', 'no-5', 'no-5plus'], c: '#285FC3' },
      { m: 'duck', title: '鴨毛與鵝毛拉直', sub: '日常練習與大量團練', skus: ['no-6', 'no-d', 'no-8'], c: '#6EADA8' }
    ];
    el.innerHTML = `<div class="banners">${b
      .map((x) => `<a class="banner" href="shuttlecock.html#${x.m}" style="--c:${x.c}">
        <div class="art">${x.skus.map((s) => tubeImg(bySku(s))).join('')}</div>
        <div class="txt"><h3>${x.title}</h3><p>${x.sub}</p><span class="more">看這個系列</span></div></a>`)
      .join('')}</div>`;
  }

  /* 商品分類入口：VICTOR 首頁的 PRODUCT 分類列 */
  function renderCats(el) {
    const icon = (skus) => `<span class="ico">${skus.map((s) => tubeImg(bySku(s))).join('')}</span>`;
    const items = [
      ['shuttlecock.html', '全部羽毛球', icon(['no-3', 'no-1', 'no-3a'])],
      ['shuttlecock.html#goose', '天然鵝毛', icon(['no-1'])],
      ['shuttlecock.html#goose-straight', '鵝毛拉直', icon(['no-8'])],
      ['shuttlecock.html#duck-spine', '刺骨鴨', icon(['no-3'])],
      ['shuttlecock.html#duck', '鴨毛', icon(['no-6'])],
      ['shuttlecock.html#training', '訓練用球', '<span class="ico"><span class="ph">照片待提供</span></span>'],
      ['accessories.html', '配件', '<span class="ico"><span class="ph">照片待提供</span></span>']
    ];
    el.innerHTML = `<ul class="cats">${items.map(([h, t, i]) => `<li><a href="${h}">${i}${t}</a></li>`).join('')}</ul>`;
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
      el.innerHTML = `
        <nav class="subnav" aria-label="羽毛球分類">${tabs.map(([id, t]) => `<a href="shuttlecock.html${id === 'all' ? '' : '#' + id}"${id === m ? ' aria-current="true"' : ''}>${t}</a>`).join('')}</nav>
        <div class="toolbar"><span>共 <b class="num">${count}</b> 件商品</span>
          <label for="sort">排序　<select id="sort">
            <option value="default"${sort === 'default' ? ' selected' : ''}>預設</option>
            <option value="price-desc"${sort === 'price-desc' ? ' selected' : ''}>價格由高到低</option>
            <option value="price-asc"${sort === 'price-asc' ? ' selected' : ''}>價格由低到高</option></select></label></div>
        ${m !== 'all' && m !== 'training' ? `<p class="dim" style="margin:-8px 0 20px">${mat(m).note}${tbd('材質說明為草稿')}</p>` : ''}
        <div class="grid four">${items.map(card).join('')}${showTraining ? plainCard(K.training, `${speeds(K.training)}`) : ''}</div>`;
      $('#sort').addEventListener('change', (e) => { sort = e.target.value; draw(); $('#sort').focus(); });
    };
    draw();
    addEventListener('hashchange', draw);
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
          <div class="stage${p.light ? ' light' : ''}" style="--c:${p.color}">${tubeImg(p, '', false)}${tbd('Q-8 需要高解析度照片')}</div>
          <div class="thumbs"><span class="on">${tubeImg(p)}</span><span><b class="ph">球頭<br>特寫</b></span><span><b class="ph">羽毛<br>特寫</b></span><span><b class="ph">整桶<br>開箱</b></span></div>
        </div>
        <div>
          <h1 class="p-mark">${esc(p.name)}</h1>
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
    carousel: renderCarousel, banners: renderBanners, cats: renderCats, news: renderNews,
    shuttles: renderShuttleList, accessories: renderAccessoryList, product: renderProduct,
    stores: renderStores, qr: renderQR, article: renderArticle
  };
  document.querySelectorAll('[data-render]').forEach((el) => hooks[el.dataset.render](el));
})();
