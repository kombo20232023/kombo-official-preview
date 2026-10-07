# 設計稿 v3

入口：[`index.html`](index.html)（審閱封面頁，可切換手機、平板、電腦尺寸預覽）。

## 內容

| 檔案 | 頁面 | 對應兩家的哪一頁 |
|---|---|---|
| `home.html` | 首頁 | 首頁 |
| `shuttlecock.html#…` | 羽毛球列表；# 後接材質（goose、goose-straight、duck-spine、duck、training），排序在頁內切換 | 分類列表 |
| `accessories.html` | 配件列表 | 分類列表 |
| `product.html#…`（# 後接 sku） | 商品頁 | 商品頁 |
| `where-to-buy.html#…`（online、cvs、store） | 銷售通路 | 經銷據點 |
| `news.html`、`news-article.html#…` | 最新消息、文章 | 最新消息 |
| `contact.html` | 聯絡我們 | 聯絡我們 |
| `about.html` | 品牌故事 | 關於品牌 |
| `catalog-download.html` | 型錄下載 | VICTOR 型錄下載 |
| `404.html` | 找不到頁面 | — |

## 這一版改了什麼

依 [李寧結構核對表](../../specs/001-需求文件/研究/2026-10-07-lining-checklist.md) 的融合清單 9 項，入站動線、版面骨架、樣式照李寧台灣站，品牌是 KOMBO 的。v2 的規則留在 `assets/site.css` 前段，v3 的覆寫集中在檔尾「v3」區塊，方便對照。

也可以用 Streamlit 預覽 app 看與逐項反饋：在 repo 根目錄執行 `streamlit run streamlit_app.py`，見 [設計稿預覽 app](../../docs/設計稿預覽app.md)。

## 資料與素材

- 內容集中在 [`assets/data.js`](assets/data.js)；最新消息為版面示意（Q-9）。
- 球桶 PNG 與 v1 相同（由 `src/assets/products/` 單品圖去背）；陣容圖取自 `src/assets/products/lineup-full.webp`。
- 字體由 Google Fonts 載入，QR code 由 cdnjs 的 qrcodejs 產生。

## 怎麼看

**不要直接雙擊開 HTML 檔**，請在這個資料夾啟動靜態伺服器：

```bash
python3 -m http.server 8080
```

再開 `http://localhost:8080/`。封面頁勾選「隱藏待確認標記」後，所有頁面都會隱藏（存在瀏覽器裡）；本機也可以在網址加上 `?clean=1`。

## 狀態

審閱中。給客戶看過後即凍結，修改開 `design/v4/`。
