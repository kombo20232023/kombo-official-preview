/* 設計稿 v1 共用：頁首、頁尾、資料渲染。正式網站改由 Astro 在建置時產生。 */
(function () {
  const K = window.KOMBO;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tbd = (t) => (t ? ` <span class="tbd">待確認：${esc(t)}</span>` : '');
  const mat = (id) => K.materials.find((m) => m.id === id);
  const speeds = (p) => p.speeds.map((s) => `${s} 速`).join('、') + (p.speedNote ? `（${p.speedNote}）` : '');
  const price = (v) => (v == null ? '—' : `NT$${v.toLocaleString('en-US')}`);
  const LOGO = '<svg viewBox="0 0 70.67 100" aria-hidden="true"><path fill="#1B4C9B" d="M4.43 97.43L2.57 95.77L8.62 89.35L9.91 28.97L2.57 25.49L23.40 16.59L25.51 18.52L24.45 43.26L56.28 75.31L65.30 78.52L52.48 84.85L46.78 84.85L27.27 64.06L23.95 63.57L22.89 87.59Z"/><path fill="#E84E2C" d="M33.66 46.83L32.85 43.66L37.25 39.43L44.41 19.25L44.41 16.68L41.66 15.95L43.38 12.30L68.10 2.57L67.28 8.65L54.72 36.12L40.37 44.93L37.96 44.52Z"/></svg>';

  // 設計稿參數：?clean=1 隱藏所有「待確認」標記，看接近上線的樣子
  if (new URLSearchParams(location.search).get('clean') === '1') document.body.classList.add('clean');

  const page = document.body.dataset.page;
  const nav = [
    ['catalog', 'catalog.html', '型錄'],
    ['where', 'where-to-buy.html', '哪裡買'],
    ['about', 'about.html', '品牌故事']
  ];

  const head = document.createElement('header');
  head.className = 'site-head';
  head.innerHTML = `<a class="skip" href="#main">跳到主要內容</a>
    <div class="wrap">
      <a class="brand" href="home.html" aria-label="KOMBO 慷柏體育 首頁">${LOGO}<b>KOMBO</b><small>慷柏體育</small></a>
      <nav class="site-nav" aria-label="主要導覽">${nav
        .map(([id, href, t]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ''}>${t}</a>`)
        .join('')}</nav>
      <a class="btn line head-line" href="${K.line.url}" target="_blank" rel="noopener">加入 LINE</a>
    </div>`;
  document.body.prepend(head);

  const foot = document.createElement('footer');
  foot.className = 'site-foot';
  foot.innerHTML = `
    <svg class="skirt" viewBox="0 0 200 220" aria-hidden="true">${Array.from({ length: 13 }, (_, i) => {
      const x = 10 + i * 15;
      return `<line x1="${x}" y1="0" x2="${100 + (x - 100) * 0.22}" y2="220" stroke="#fff" stroke-width="1.4"/>`;
    }).join('')}</svg>
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand"><a class="brand" href="home.html" style="color:#fff">${LOGO}<b>KOMBO</b></a>
          <p>慷柏體育，2023 年成立的羽毛球品牌。官網不收單，請到各通路訂購。</p></div>
        <div><h3>買球</h3><ul>${K.channels.map((c) => `<li><a href="${c.url}" target="_blank" rel="noopener">${c.name}</a></li>`).join('')}</ul></div>
        <div><h3>聯絡</h3><ul><li><a href="${K.line.url}" target="_blank" rel="noopener">LINE ${K.line.id}</a></li>
          ${K.social.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a></li>`).join('')}</ul></div>
        <div><h3>網站</h3><ul>${nav.map(([, h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>
      </div>
      <div class="foot-base">© 2026 KOMBO 慷柏體育</div>
    </div>`;
  document.body.append(foot);

  const dock = document.createElement('div');
  dock.className = 'line-dock';
  dock.innerHTML = page === 'product'
    ? '' // 產品頁自己放購買列
    : `<a class="btn line" href="${K.line.url}" target="_blank" rel="noopener">LINE 詢問</a>`;
  if (dock.innerHTML) document.body.append(dock);

  /* ---------- 元件 ---------- */
  function tubeLink(p, extra = '', lazy = true) {
    return `<a class="tube" href="product.html?sku=${p.sku}">
      <img src="assets/${p.img}" alt="${esc(p.name)} 球桶" width="110" height="651"${lazy ? ' loading="lazy"' : ''}>
      <span class="label">${esc(p.name)}</span>${extra}</a>`;
  }

  function renderShelf(el) {
    el.innerHTML = `<ol>${K.products
      .map((p) => `<li>${tubeLink(p, `<span class="mat">${mat(p.material).name}</span>`, false)}</li>`)
      .join('')}</ol>`;
  }

  function renderMaterials(el) {
    el.innerHTML = `<table class="materials"><tbody>${K.materials
      .map((m) => `<tr><th scope="row">${m.name}</th><td class="models">${K.products
        .filter((p) => p.material === m.id)
        .map((p) => `<a class="chip" href="product.html?sku=${p.sku}"><i style="background:${p.color}"></i>${p.name}</a>`)
        .join('')}</td><td>${m.note}</td></tr>`)
      .join('')}</tbody></table>`;
  }

  function renderChannels(el) {
    el.innerHTML = `<ul class="channels">${K.channels
      .map((c) => `<li><h3>${c.name}</h3><p>${c.note}${tbd(c.tbd)}</p>
        <a class="btn ghost" href="${c.url}" target="_blank" rel="noopener">前往${/^[0-9A-Za-z]/.test(c.name) ? " " : ""}${c.name}</a></li>`)
      .join('')}</ul>`;
  }

  function renderQR(el) {
    if (window.QRCode) new QRCode(el, { text: K.line.url, width: 264, height: 264, colorDark: '#14315F', colorLight: '#ffffff' });
  }

  function renderCatalog(el) {
    const card = (p) => `<a class="card${p.light ? ' light' : ''}" href="product.html?sku=${p.sku}" style="--c:${p.color}">
      <div class="tile"><img src="assets/${p.img}" alt="${esc(p.name)} 球桶" width="110" height="651" loading="lazy"></div>
      <div class="meta"><span class="name">${esc(p.name)}</span><span class="price">${price(p.price)}</span></div>
      <p class="speeds">${speeds(p)}${tbd(p.tbd)}</p></a>`;
    el.innerHTML =
      K.materials
        .map((m) => `<section class="group" id="${m.id}"><div class="group-head"><h2>${m.name}</h2><p class="dim">${m.note}</p></div>
          <div class="grid">${K.products.filter((p) => p.material === m.id).map(card).join('')}</div></section>`)
        .join('') +
      `<section class="group" id="training"><div class="group-head"><h2>${K.training.name}</h2>${tbd(K.training.tbd)}</div>
        <ul class="plain-list"><li><span>${K.training.name}，${speeds(K.training)}</span><span class="num">${price(K.training.price)}</span></li></ul></section>
      <section class="group" id="accessories"><div class="group-head"><h2>配件</h2>${tbd('商品照片待提供')}</div>
        <ul class="plain-list">${K.accessories.map((a) => `<li><span><b>${a.name}</b>　<span class="dim">${a.note}</span></span><span class="num">${price(a.price)}</span></li>`).join('')}</ul></section>`;
  }

  function renderProduct(el) {
    const sku = new URLSearchParams(location.search).get('sku') || 'no-3a';
    const p = K.products.find((x) => x.sku === sku) || K.products[5];
    const m = mat(p.material);
    document.title = `${p.name} ${m.name}羽毛球 — KOMBO 慷柏體育`;
    const ch = (id) => K.channels.find((c) => c.id === id);
    el.innerHTML = `
      <p class="crumbs"><a href="catalog.html">型錄</a>　/　${m.name}　/　${esc(p.name)}</p>
      <div class="product">
        <div class="stage${p.light ? ' light' : ''}" style="--c:${p.color}">
          <img src="assets/${p.img}" alt="${esc(p.name)} 球桶正面" width="110" height="651">
          ${tbd('Q-8 需要高解析度照片')}
        </div>
        <div>
          <h1 class="p-mark">${esc(p.name)}</h1>
          <span class="p-mat">${m.name}羽毛球</span>
          <p class="p-desc">${m.note}。${tbd('Q-3 產品一句話說明待品牌方提供')}</p>
          <dl class="specs">
            <dt>毛片</dt><dd>${m.name}</dd>
            <dt>球頭</dt><dd>—${tbd('待提供')}</dd>
            <dt>球速</dt><dd>${speeds(p)}</dd>
            <dt>數量</dt><dd>—${tbd('每桶顆數待提供')}</dd>
            <dt>售價</dt><dd class="num">${price(p.price)}${tbd(p.tbd || 'Q-2 是否顯示價格')}</dd>
          </dl>
          <div class="buy">
            <a class="btn" href="${ch('shopee').url}" target="_blank" rel="noopener">到蝦皮購買 ${esc(p.name)}<small>直接到這一款</small></a>
            <a class="btn ghost" href="${ch('myship').url}" target="_blank" rel="noopener">在 7-11 賣貨便選購<small>到賣場後挑選</small></a>
            <a class="btn ghost" href="${ch('famistore').url}" target="_blank" rel="noopener">在全家好賣+ 選購<small>到賣場後挑選</small></a>
            <a class="btn line" href="${K.line.url}" target="_blank" rel="noopener">LINE 詢問<small>${K.line.id}</small></a>
          </div>
          <p class="buy-note" style="margin-top:12px">售價與庫存以各通路頁面為準。${tbd('Q-4 蝦皮商品網址待提供')}</p>
          <div class="share"><button class="btn ghost" type="button" id="share">分享這款</button><span class="share-status" role="status" aria-live="polite"></span></div>
        </div>
      </div>
      <section class="section tight">
        <h2 style="font-size:1.25rem;margin-bottom:12px">其他型號</h2>
        <div class="siblings">${K.products.filter((x) => x.sku !== p.sku).map((x) => tubeLink(x)).join('')}</div>
      </section>`;
    const dockEl = document.createElement('div');
    dockEl.className = 'line-dock';
    dockEl.innerHTML = `<a class="btn" href="${ch('shopee').url}" target="_blank" rel="noopener">到蝦皮購買</a>
      <a class="btn line" href="${K.line.url}" target="_blank" rel="noopener">LINE 詢問</a>`;
    document.body.append(dockEl);
    $('#share').addEventListener('click', async () => {
      const status = $('.share-status');
      const data = { title: document.title, url: location.href };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(location.href);
        status.textContent = '已複製連結，可以貼到 LINE 或社群';
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        status.textContent = '無法自動複製，請長按網址列複製連結';
      }
    });
  }

  const hooks = { shelf: renderShelf, materials: renderMaterials, channels: renderChannels, qr: renderQR, catalog: renderCatalog, product: renderProduct };
  document.querySelectorAll('[data-render]').forEach((el) => hooks[el.dataset.render](el));
})();
