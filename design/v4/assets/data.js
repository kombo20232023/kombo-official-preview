/* 設計稿 v4 的內容資料。正式網站會改成 src/content/ 的資料檔（INV-1）。
   tbd：待客戶確認的欄位；依據 specs/001-需求文件/訪談/2026-10-19-客戶回饋2.md。 */
window.KOMBO = {
  line: { id: '@kombo2023', url: 'https://lin.ee/syEA7iU' },
  // 客戶原文寫「Kombooo2023@gmial.com」，照抄並標待確認（R-6：gmial 是否為 gmail、Kombooo 是否三個 o）
  email: { address: 'Kombooo2023@gmial.com', tbd: 'R-6 請確認拼字' },
  social: [
    { name: 'Instagram', url: 'https://www.instagram.com/kombo_2023' },
    { name: 'Facebook', url: 'https://www.facebook.com/share/19ZXhbVjJw/' },
    { name: 'Threads', url: '#', tbd: 'Threads 網址待提供' }
  ],
  // 客戶回饋 2：拿掉蝦皮，四個通路；文案照客戶原文，整頁文案客戶再想
  channels: [
    { id: 'myship', name: '7-11 賣貨便', type: '超商取貨', pay: '貨到付款', buy: '在 7-11 賣貨便選購', go: '前往 7-11 賣貨便',
      note: '7-11 貨到付款；不定期有免運券可以領取，下單前記得查看！',
      url: 'https://myship.7-11.com.tw/general/detail/GM2408141414480' },
    { id: 'famistore', name: '全家好賣+', type: '超商取貨', pay: '貨到付款', buy: '在全家好賣+ 選購', go: '前往全家好賣+',
      note: '全家貨到付款；不定期有免運券可以領取，下單前記得查看！',
      url: '#', tbd: '好賣+ 賣場網址待提供' },
    { id: 'rakuten', name: '樂天市場', type: '宅配到府', pay: '信用卡付款', buy: '在樂天市場選購', go: '前往樂天市場',
      note: '信用卡付款；金額會比較高一些！',
      url: '#', tbd: '樂天市場網址待提供' },
    { id: 'line', name: 'LINE 上購買', type: '宅配到府', pay: '先匯款', buy: '宅配到府', go: '加入 LINE 好友',
      note: '先匯款；10 筒即享免運！（大量購買也選我）',
      url: 'https://lin.ee/syEA7iU' }
  ],
  // 商品分類（客戶回饋 2：5 類）。頁首下拉、手機選單、首頁系列區共用
  categories: [
    { id: 'goose', name: '鵝毛羽毛球', href: 'shuttlecock.html#goose', page: 'shuttlecock' },
    { id: 'duck', name: '鴨毛羽毛球', href: 'shuttlecock.html#duck', page: 'shuttlecock' },
    { id: 'rackets', name: '羽球拍', href: 'rackets.html', page: 'rackets' },
    { id: 'apparel', name: '服飾配件', href: 'apparel.html', page: 'apparel' },
    { id: 'gear', name: '羽毛球相關配件', href: 'gear.html', page: 'gear' }
  ],
  // 羽毛球列表的分類只有鵝毛球、鴨毛球兩組；分類裡不放文字介紹
  materials: [
    { id: 'goose', name: '鵝毛球' },
    { id: 'duck', name: '鴨毛球' }
  ],
  // 順序照客戶回饋 2：鵝毛球 K1、K3A、K5A、K8、訓練用球；鴨毛球 K3、K5+、K5、K6、KD。
  // grade：毛片等級（列表價格下方顯示）。球速、售價取自 7-11 賣貨便（2026-09-18）。
  // intro、stars、head、spec：只有 K1 有客戶提供的文字，其他款待客戶提供。
  products: [
    { sku: 'no-1', code: 'K1', name: 'No.1', group: 'goose', grade: '一級天然鵝毛', speeds: [77], price: 900, color: '#C1565A', img: 'no-1.png',
      intro: '特選一級天然鵝毛，比照國際比賽用球標準精選鵝翅膀上全圓翎毛第4-6根，搭配高彈性膠水與全天然軟木球頭，享受國際選手比賽的暢快。',
      stars: { flight: 5, durability: 5, stability: 5 }, head: '全軟木球頭', spec: '12 顆球/筒' },
    { sku: 'no-3a', code: 'K3A', name: 'No.3A', group: 'goose', grade: '三四級天然鵝毛', speeds: [76, 77], price: 720, color: '#F6DE4B', img: 'no-3a.png' },
    { sku: 'no-5a', code: 'K5A', name: 'No.5A', group: 'goose', grade: '四五級天然鵝毛', speeds: [77], price: 630, color: '#DCCDF2', img: 'no-5a.png' },
    { sku: 'no-8', code: 'K8', name: 'No.8', group: 'goose', grade: '二三級鵝拉直', speeds: [77], price: 470, color: '#F0E4DD', img: 'no-8.png', light: true },
    { sku: 'training', code: '訓練用球', name: '訓練用球', group: 'goose', grade: '四級鵝拉直', speeds: [77], price: 370, color: '#EFE5D3', img: null, tbd: '照片待提供' },
    { sku: 'no-3', code: 'K3', name: 'No.3', group: 'duck', grade: '一二級刺骨鴨', speeds: [77, 78], price: 690, color: '#285FC3', img: 'no-3.png' },
    { sku: 'no-5plus', code: 'K5+', name: 'No.5+', group: 'duck', grade: '三級刺骨鴨', speeds: [77], speedNote: '另有偏快 77 速', price: null, color: '#EDE6DA', img: 'no-5plus.png', light: true, tbd: 'Q-3 售價待核對' },
    { sku: 'no-5', code: 'K5', name: 'No.5', group: 'duck', grade: '三四級刺骨鴨', speeds: [76, 77, 78], price: 600, color: '#F5EFE6', img: 'no-5.png', light: true },
    { sku: 'no-6', code: 'K6', name: 'No.6', group: 'duck', grade: '三級水鴨', gradeTbd: '毛片等級客戶標註待確認', speeds: [77, 78], price: 570, color: '#6EADA8', img: 'no-6.png' },
    { sku: 'no-d', code: 'KD', name: 'No.D', group: 'duck', grade: '三級水鴨', speeds: [76, 77], price: 540, color: '#1C1C1E', img: 'no-d.png' }
  ],
  // 商品頁注意事項：照客戶原文（「顧無法挑選」改為「故無法挑選」）
  notices: [
    '羽毛球分為左翅膀毛及右翅膀毛，兩種毛片飛行、穩定度、耐打度等皆為相同，採購時需一同購入故無法挑選，隨機出貨。',
    '開封後不可退貨。'
  ],
  // 配件拆成兩頁：apparel 服飾配件、gear 羽毛球相關配件（歸類待客戶確認）
  accessories: [
    { sku: 'socks', cat: 'apparel', name: '機能襪', note: '多款式與尺寸', price: 130 },
    { sku: 'tote', cat: 'apparel', name: '提袋', note: '羽球人款、羽毛球款', price: 20 },
    { sku: 'shuttle-care', cat: 'gear', name: '增耐藥水', note: '30ml、60ml、100ml', price: 80 },
    { sku: 'grip', cat: 'gear', name: '握把布', note: '五色', price: 25 },
    { sku: 'racket-pouch', cat: 'gear', name: '羽球拍絨布袋', note: '馬年限定款、羽毛球款', price: 80 }
  ],
  // 最新消息為版面示意，內容待品牌方提供（Q-9）
  news: [
    { slug: 'site-launch', date: '2026-10', tag: '品牌消息', title: 'KOMBO 官方網站上線', excerpt: '全系列羽毛球的毛片等級與購買通路，一次看清楚。', tbd: 'Q-9 範例內容' },
    { slug: 'no-5plus', date: '2026-09', tag: '新品', title: 'No.5+（K5+）偏快 77 速', excerpt: '三級刺骨鴨毛片，給偏好快速球路的球友。', tbd: 'Q-9 範例內容' },
    { slug: 'storage', date: '2026-09', tag: '用球知識', title: '羽毛球怎麼保存比較耐打', excerpt: '濕度與溫度會影響羽毛的韌性與球速。', tbd: 'Q-9 範例內容' }
  ]
};
