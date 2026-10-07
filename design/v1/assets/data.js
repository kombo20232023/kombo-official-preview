/* 設計稿 v1 的內容資料。正式網站會改成 src/content/ 的資料檔（INV-1）。
   tbd：待客戶確認的欄位，對應 specs/001-需求文件/008-v1-dm-scope.md 的待確認問題。 */
window.KOMBO = {
  line: { id: '@kombo2023', url: 'https://lin.ee/syEA7iU' },
  social: [
    { name: 'Instagram', url: 'https://www.instagram.com/kombo_2023' },
    { name: 'Facebook', url: 'https://www.facebook.com/share/19ZXhbVjJw/' }
  ],
  channels: [
    { id: 'shopee', name: '蝦皮購物', note: '線上刷卡、宅配或超商取貨，可直接連到每一款商品', url: '#', tbd: 'Q-4 蝦皮賣場與各商品網址待提供' },
    { id: 'myship', name: '7-11 賣貨便', note: '7-11 取貨付款；連到賣場後再挑選型號', url: 'https://myship.7-11.com.tw/general/detail/GM2408141414480' },
    { id: 'famistore', name: '全家好賣+', note: '全家取貨付款；連到賣場後再挑選型號', url: '#', tbd: '賣場網址待提供' }
  ],
  materials: [
    { id: 'goose', name: '天然鵝毛', note: '羽毛最完整，飛行最穩，比賽用球的首選' },
    { id: 'goose-straight', name: '鵝毛拉直', note: '鵝毛經整形加工，價格更親近，適合大量團練' },
    { id: 'duck-spine', name: '刺骨鴨', note: '挑選鴨毛中段較硬挺的羽毛，耐打度與價格之間取得平衡' },
    { id: 'duck', name: '鴨毛', note: '入門與日常練習' }
  ],
  // 依包裝陣容順序；材質、球速、售價取自 7-11 賣貨便（2026-09-18），見 000 產品簡報
  products: [
    { sku: 'no-6', name: 'No.6', mark: '6', material: 'duck', speeds: [77, 78], price: 570, color: '#6EADA8', img: 'no-6.png' },
    { sku: 'no-5', name: 'No.5', mark: '5', material: 'duck-spine', speeds: [76, 77, 78], price: 600, color: '#F5EFE6', img: 'no-5.png', light: true },
    { sku: 'no-5plus', name: 'No.5+', mark: '5+', material: 'duck-spine', speeds: [77], speedNote: '另有偏快 77 速', price: null, color: '#EDE6DA', img: 'no-5plus.png', light: true, tbd: 'Q-3 售價待核對' },
    { sku: 'no-3', name: 'No.3', mark: '3', material: 'duck-spine', speeds: [77, 78], price: 690, color: '#285FC3', img: 'no-3.png' },
    { sku: 'no-1', name: 'No.1', mark: '1', material: 'goose', speeds: [77], price: 900, color: '#C1565A', img: 'no-1.png' },
    { sku: 'no-3a', name: 'No.3A', mark: '3A', material: 'goose', speeds: [76, 77], price: 720, color: '#F6DE4B', img: 'no-3a.png' },
    { sku: 'no-5a', name: 'No.5A', mark: '5A', material: 'goose', speeds: [77], price: 630, color: '#DCCDF2', img: 'no-5a.png' },
    { sku: 'no-d', name: 'No.D', mark: 'D', material: 'duck', speeds: [76, 77], price: 540, color: '#1C1C1E', img: 'no-d.png' },
    { sku: 'no-8', name: 'No.8', mark: '8', material: 'goose-straight', speeds: [77], price: 470, color: '#F0E4DD', img: 'no-8.png', light: true }
  ],
  training: { name: '訓練用球', speeds: [77], price: 370, tbd: '材質與照片待提供' },
  accessories: [
    { name: '機能襪', note: '多款式與尺寸', price: 130 },
    { name: '增耐藥水', note: '30ml、60ml、100ml', price: 80 },
    { name: '羽球拍絨布袋', note: '馬年限定款、羽毛球款', price: 80 },
    { name: '握把布', note: '五色', price: 25 },
    { name: '提袋', note: '羽球人款、羽毛球款', price: 20 }
  ]
};
