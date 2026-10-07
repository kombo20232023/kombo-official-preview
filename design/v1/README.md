# 設計稿 v1

入口：[`index.html`](index.html)（審閱封面頁，可切換手機、平板、電腦尺寸預覽）。

## 內容

| 檔案 | 頁面 |
|---|---|
| `home.html` | 首頁 |
| `catalog.html` | 型錄 |
| `product.html?sku=…` | 產品頁，sku 為 `no-1`、`no-3`、`no-3a`、`no-5`、`no-5a`、`no-5plus`、`no-6`、`no-8`、`no-d` |
| `where-to-buy.html` | 哪裡買 |
| `about.html` | 品牌故事 |
| `404.html` | 找不到頁面 |

## 資料與素材

- 產品、通路、LINE 等內容集中在 [`assets/data.js`](assets/data.js)，頁面只負責呈現（對應 INV-1）。正式網站會改成 `src/content/` 的資料檔。
- 球桶 PNG 由 `src/assets/products/no-*.webp` 去背而來，寬 110px；高解析度照片見 008 的 Q-8。
- 字體由 Google Fonts 載入，QR code 由 cdnjs 的 qrcodejs 產生，離線開啟時這兩項不會顯示。

## 怎麼看

**不要直接雙擊開 HTML 檔**：有些瀏覽器與預覽工具會擋掉本機檔案的圖片、樣式與預覽框，畫面會是白的。請在這個資料夾啟動任一靜態伺服器，例如：

```bash
python3 -m http.server 8080
```

再開 `http://localhost:8080/`。網址加上 `?clean=1` 會隱藏所有「待確認」標記。

## 狀態

已取代（未給客戶看）。結構改照 VICTOR 與李寧後，由 [v2](../v2/) 取代。
