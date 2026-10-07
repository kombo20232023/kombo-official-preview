"""KOMBO 官網設計稿預覽（獨立的 Streamlit app，和庫存系統無關）。

設計稿是 design/ 底下的靜態 HTML。根目錄的 static 是指向 design 的連結，
開啟 .streamlit/config.toml 的 enableStaticServing 後，Streamlit 以 /app/static/ 網址
原封不動提供這些檔案，所以這裡看到的頁面和本機用 http.server 開的完全相同。

本機執行（在 repo 根目錄）：
    streamlit run streamlit_app.py
"""

from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import streamlit as st

STATIC = Path(__file__).parent / "static"

# 每一版的頁面清單：(名稱, 檔名#錨點, 說明)
PAGES = [
    ("首頁", "home.html", "滿版主輪播、系列海報、商品格、材質入口、通路橫幅、最新消息"),
    ("羽毛球列表", "shuttlecock.html", "電腦版左側材質側欄＋3 欄；手機版橫滑分類＋2 欄"),
    ("羽毛球列表（天然鵝毛）", "shuttlecock.html#goose", "點材質後的樣子"),
    ("配件列表", "accessories.html", "與羽毛球同一個版型"),
    ("商品頁 No.3A", "product.html#no-3a", "圖庫、規格條列、球速、購買通路、分頁、相關商品"),
    ("商品頁 No.D（深色款）", "product.html#no-d", "深色球桶的配色"),
    ("銷售通路", "where-to-buy.html", "通路類型篩選與清單、LINE"),
    ("最新消息", "news.html", "列表（內容為版面示意）"),
    ("聯絡我們", "contact.html", "依問題類別導到 LINE"),
    ("品牌故事", "about.html", "品牌官方文案原文"),
    ("型錄下載", "catalog-download.html", "DM 型錄 PDF"),
    ("找不到頁面", "404.html", "網址錯誤時顯示"),
]
VERSIONS = {
    "v3（審閱中，照李寧結構）": "v3",
    "v2（照 VICTOR 與李寧結構）": "v2",
    "v1（已取代）": "v1",
}
SIZES = {"手機 390": (390, 780), "平板 820": (820, 900), "電腦 1280": (1280, 820)}

# v3 逐項反饋的項目：(分組, 項目, 要看什麼, 對應頁面；None 表示沒有對應頁面的問題)
FEEDBACK_ITEMS = [
    ("頁面", "首頁", "整體是否「簡單明瞭」、區塊順序、圖片與文字的比例", "home.html"),
    ("頁面", "羽毛球列表", "材質分類、排序、商品卡的資訊", "shuttlecock.html"),
    ("頁面", "配件列表", "配件要放哪些商品", "accessories.html"),
    ("頁面", "商品頁", "規格條列、球速、價格、購買按鈕、分頁內容", "product.html#no-3a"),
    ("頁面", "銷售通路", "通路是否齊全、說明是否正確", "where-to-buy.html"),
    ("頁面", "最新消息與文章", "要放哪些消息、由誰提供", "news.html"),
    ("頁面", "聯絡我們", "問題類別是否合適", "contact.html"),
    ("頁面", "品牌故事", "文案、要不要加照片", "about.html"),
    ("頁面", "型錄下載", "要不要做 DM 型錄 PDF", "catalog-download.html"),
    ("頁面", "找不到頁面", "文字與引導", "404.html"),
    ("設計改動", "1 首頁改圖片主導", "拿掉說明段落後，資訊夠不夠", "home.html"),
    ("設計改動", "2 滿版主輪播", "三張主視覺的內容與順序", "home.html"),
    ("設計改動", "3 首頁商品格", "放 8 款＋「看全部」是否合適", "home.html"),
    ("設計改動", "4 頁首（公告條、深藍品牌帶、導覽下拉）", "標誌置中、導覽項目與順序", "home.html"),
    ("設計改動", "5 手機選單", "左上選單鍵、全螢幕選單、羽毛球可展開（預覽選「手機」）", "home.html"),
    ("設計改動", "6 手機底部固定列", "首頁、羽毛球、銷售通路、LINE 四個入口（預覽選「手機」）", "home.html"),
    ("設計改動", "7 白底、置中標題、價格朱紅", "整體色調與質感", "home.html"),
    ("設計改動", "8 列表頁左側材質側欄（電腦版）", "側欄與 3 欄商品（預覽選「電腦」）", "shuttlecock.html"),
    ("設計改動", "9 頁尾三欄", "頁尾內容（捲到最下面）", "home.html"),
    ("待確認", "Q-D 可以像李寧嗎", "需求訪談 1 說「不能讓人聯想到李寧」，這一版結構與風格照李寧，可以嗎", None),
    ("待確認", "主視覺圖片", "電腦橫式與手機直式各一組，由誰提供", None),
    ("待確認", "公告條內容", "最上方的公告要放什麼，沒有就拿掉", None),
    ("待確認", "Q-1 實體據點", "有沒有實體店、經銷商或球館要列", None),
    ("待確認", "Q-2 顯示價格", "官網要不要顯示價格", None),
    ("待確認", "Q-3 商品資料", "No.5+ 售價、每桶顆數、球頭材質、每款一句話介紹", None),
    ("待確認", "Q-4 通路網址", "每一款的蝦皮網址、全家好賣+ 賣場網址", None),
    ("待確認", "Q-8 商品照片", "各款高解析度照片", None),
    ("其他", "其他意見", "上面沒有列到的", None),
]
STATUS = ["未看", "可以", "要修改"]
FB_SIZES = {"手機": (390, 760), "電腦": ("stretch", 760)}


def static_url(path: str) -> str:
    """設計稿檔案的完整網址。
    Streamlit Community Cloud 的 app 實際跑在 /~/+/ 底下，根目錄的 /app/static/ 只會回 Cloud 的外殼頁面
    （2026-10-07 實測：iframe 一直轉圈），所以在 *.streamlit.app 上要加 ~/+/；本機不用。"""
    base = st.context.url or ""
    if not base.endswith("/"):
        base += "/"
    host = (st.context.headers.get("host") or "").split(":")[0]
    prefix = "~/+/" if host.endswith(".streamlit.app") else ""
    return urljoin(base, f"{prefix}app/static/{path}")


# ---------- 反饋資料 ----------
# 沒畫在畫面上的元件，Streamlit 會清掉它的狀態；一次只顯示一項，所以填寫內容另存在 fb_data，
# 元件改動時用 on_change 寫回，切到別項再切回來不會遺失。
if "fb_data" not in st.session_state:
    st.session_state.fb_data = {k: {"status": "未看", "text": ""} for k in range(len(FEEDBACK_ITEMS))}
    st.session_state.fb_idx = 0
    st.session_state.fb_jump = 0


def _save(k: int, field: str, wkey: str) -> None:
    v = st.session_state[wkey]
    if field == "status" and v is None:  # 再點一次已選的狀態會取消選取
        v = "未看"
    st.session_state.fb_data[k][field] = v
    # 手機（fb_p*）與電腦（fb_s/fb_t）是不同元件；清掉另一種的同項狀態，切換版面時才會從 fb_data 重新帶入
    others = ("fb_s_", "fb_t_") if wkey.startswith("fb_p") else ("fb_ps_", "fb_pt_")
    for prefix in others:
        st.session_state.pop(f"{prefix}{k}", None)


def _go(n: int) -> None:
    n = max(0, min(len(FEEDBACK_ITEMS) - 1, n))
    st.session_state.fb_idx = n
    st.session_state.fb_jump = n


def _jump() -> None:
    st.session_state.fb_idx = st.session_state.fb_jump


def _next_open() -> None:
    """跳到目前這一項之後、第一個還沒看的項目（到底就從頭找）。"""
    data, n, cur = st.session_state.fb_data, len(FEEDBACK_ITEMS), st.session_state.fb_idx
    for step in range(1, n + 1):
        k = (cur + step) % n
        if data[k]["status"] == "未看":
            _go(k)
            return


def _pick_from_table(rows_shown: list[int]) -> None:
    """總表點一列：切回逐項填寫並跳到那一項。"""
    sel = st.session_state.fb_table.selection.rows
    if sel:
        _go(rows_shown[sel[0]])
        st.session_state.fb_mode = "逐項填寫"


def parse_feedback(raw: str) -> tuple[str, dict[int, dict[str, str]], int]:
    """讀回 feedback_text 產生的 v3-feedback.txt，回傳（填寫人, 各項資料, 讀到的項目數）。
    項目以（分組, 項目名稱）對應；檔案裡沒有的項目維持「未看」，認不得的行略過。"""
    index = {(g, item): k for k, (g, item, _, _) in enumerate(FEEDBACK_ITEMS)}
    data = {k: {"status": "未看", "text": ""} for k in range(len(FEEDBACK_ITEMS))}
    reviewer, group, cur, found = "", None, None, 0
    for line in raw.splitlines():
        if line.startswith("填寫人："):
            reviewer = line.removeprefix("填寫人：").strip()
            reviewer = "" if reviewer == "（未填）" else reviewer
        elif line.startswith("【") and line.endswith("】"):
            group, cur = line[1:-1], None
        elif line.startswith("- ") and "：" in line:
            item, _, status = line[2:].rpartition("：")
            cur = index.get((group, item))
            if cur is not None and status in STATUS:
                data[cur]["status"] = status
                found += 1
            else:
                cur = None
        elif line.startswith("    ") and cur is not None:
            t = data[cur]["text"]
            data[cur]["text"] = (t + "\n" if t else "") + line[4:]
    return reviewer, data, found


def _apply_loaded(raw: str) -> None:
    """把讀到的 v3-feedback.txt 內容套回畫面，跳到第一個未看的項目。"""
    reviewer, data, found = parse_feedback(raw)
    if found == 0:
        st.session_state.fb_load_msg = ("error", "內容裡沒有可以對應的項目，請用這個 app 下載或寄出的 v3 反饋內容。")
        return
    st.session_state.fb_data = data
    st.session_state.fb_reviewer = reviewer
    for key in [x for x in st.session_state if str(x).startswith(("fb_s_", "fb_t_", "fb_ps_", "fb_pt_"))]:
        del st.session_state[key]  # 讓目前這一項的元件改用讀回來的內容
    first = next((k for k, v in data.items() if v["status"] == "未看"), 0)
    _go(first)
    st.session_state.fb_load_msg = ("success", f"已讀回 {found} 項，從第 {first + 1} 項（第一個未看的）接著填。")


def _load() -> None:
    """上傳之前下載的 v3-feedback.txt。"""
    f = st.session_state.get("fb_upload")
    if f is None:
        return
    try:
        _apply_loaded(f.getvalue().decode("utf-8"))
    except UnicodeDecodeError:
        st.session_state.fb_load_msg = ("error", "讀不到內容：檔案不是 UTF-8 文字檔，請上傳這個 app 下載的 v3-feedback.txt。")


def _load_paste() -> None:
    """貼上之前寄出的信件內容（手機上找檔案不方便時用）。"""
    raw = st.session_state.get("fb_paste", "")
    if raw.strip():
        _apply_loaded(raw)


# ---------- 寄出備份 ----------
FEEDBACK_TO = "pin0513@gmail.com"  # 每次寄出備份的收件人
SEND_GAP_SEC = 30  # 同一個分頁兩次自動寄信至少間隔，避免連點重複寄出


def smtp_ready() -> bool:
    """Streamlit Cloud 的 Secrets 有設定 [smtp] 才能從伺服器直接寄信；沒有就改用手機郵件 app 寄。"""
    try:
        cfg = st.secrets.get("smtp", {})
    except Exception:  # 本機沒有 secrets.toml
        return False
    return bool(cfg.get("user") and cfg.get("password"))


def send_backup(text: str, reviewer: str) -> str:
    """用 Secrets 的 SMTP 帳號把反饋寄到 FEEDBACK_TO，附上 v3-feedback.txt。回傳結果訊息；失敗會丟出例外。"""
    import smtplib
    from email.message import EmailMessage

    cfg = st.secrets["smtp"]
    now = datetime.now(ZoneInfo("Asia/Taipei")).strftime("%Y-%m-%d %H:%M")
    msg = EmailMessage()
    msg["Subject"] = f"KOMBO 設計稿 v3 反饋：{reviewer.strip() or '未填姓名'}（{now}）"
    msg["From"] = cfg["user"]
    msg["To"] = FEEDBACK_TO
    msg.set_content(text)
    msg.add_attachment(text.encode("utf-8"), maintype="text", subtype="plain", filename="v3-feedback.txt")
    with smtplib.SMTP_SSL(cfg.get("host", "smtp.gmail.com"), int(cfg.get("port", 465)), timeout=20) as server:
        server.login(cfg["user"], cfg["password"])
        server.send_message(msg)
    return f"已寄到 {FEEDBACK_TO}（{now}）"


def mailto_url(text: str, reviewer: str) -> str:
    from urllib.parse import quote

    subject = f"KOMBO 設計稿 v3 反饋：{reviewer.strip() or '未填姓名'}"
    return f"mailto:{FEEDBACK_TO}?subject={quote(subject)}&body={quote(text)}"


def feedback_text(reviewer: str) -> str:
    """把目前填的反饋整理成純文字（v3-feedback.txt 的內容）。"""
    now = datetime.now(ZoneInfo("Asia/Taipei")).strftime("%Y-%m-%d %H:%M")
    data = st.session_state.fb_data
    rows = [(g, item, data[k]["status"], data[k]["text"].strip()) for k, (g, item, _, _) in enumerate(FEEDBACK_ITEMS)]
    count = {s: sum(r[2] == s for r in rows) for s in STATUS}
    out = [
        "KOMBO 官網設計稿 v3 反饋",
        f"填寫人：{reviewer.strip() or '（未填）'}",
        f"匯出時間：{now}（台北）",
        f"統計：可以 {count['可以']} 項、要修改 {count['要修改']} 項、未看 {count['未看']} 項，共 {len(rows)} 項",
    ]
    group = None
    for g, item, status, text in rows:
        if g != group:
            out += ["", f"【{g}】"]
            group = g
        out.append(f"- {item}：{status}")
        if text:
            out += [f"    {line}" for line in text.splitlines()]
    return "\n".join(out) + "\n"


st.set_page_config(page_title="KOMBO 官網設計稿", page_icon="🏸", layout="wide")
_ua = st.context.headers.get("user-agent") or ""
if any(x in _ua for x in ("iPhone", "Android", "Mobile")):
    st.markdown("### KOMBO 官網設計稿")
else:
    st.title("KOMBO 官網設計稿")
    st.caption("頁面是設計稿原檔，連結、輪播、選單都可以實際操作。官網不收單，按鈕連到的通路與 LINE 是實際連結。")

tab_fb, tab_view = st.tabs(["v3 逐項反饋", "各版預覽"])

# ---------- v3 逐項反饋 ----------
# 手機：一頁捲到底的清單（phone_page）；電腦：左邊看頁面、右邊一項一項填。
ua = st.context.headers.get("user-agent") or ""
is_phone_ua = any(x in ua for x in ("iPhone", "Android", "Mobile"))


def item_form(k: int) -> None:
    """一項的填寫區：狀態、意見、上一項／下一項。"""
    data = st.session_state.fb_data
    group, item, hint, _ = FEEDBACK_ITEMS[k]
    st.caption(f"{k + 1} / {len(FEEDBACK_ITEMS)}　{group}")
    st.subheader(item)
    st.write(hint)
    # 元件的值由 session_state 決定：第一次顯示這一項時從 fb_data 帶入
    st.session_state.setdefault(f"fb_s_{k}", data[k]["status"])
    st.session_state.setdefault(f"fb_t_{k}", data[k]["text"])
    st.segmented_control(
        "狀態", STATUS, key=f"fb_s_{k}", width="stretch",
        on_change=_save, args=(k, "status", f"fb_s_{k}"),
    )
    st.text_area(
        "意見", key=f"fb_t_{k}", height=200,
        on_change=_save, args=(k, "text", f"fb_t_{k}"), placeholder="哪裡要改、想改成什麼樣子",
    )
    b1, b2 = st.columns(2)
    b1.button("上一項", key="fb_prev", on_click=_go, args=(k - 1,), disabled=k == 0, width="stretch")
    b2.button("下一項", key="fb_next", on_click=_go, args=(k + 1,), disabled=k == len(FEEDBACK_ITEMS) - 1,
              type="primary", width="stretch")


def page_preview(k: int) -> None:
    page_href = FEEDBACK_ITEMS[k][3]
    if not page_href:
        st.info("這一項是問題，沒有對應的頁面，直接寫答案即可。")
        return
    fb_size = st.segmented_control("預覽尺寸", list(FB_SIZES), default="手機", key="fb_size")
    w, h = FB_SIZES[fb_size or "手機"]
    st.iframe(static_url(f"v3/{page_href}"), width=w, height=h)


@st.dialog("頁面預覽", width="large")
def preview_dialog(k: int) -> None:
    st.caption(FEEDBACK_ITEMS[k][1])
    st.iframe(static_url(f"v3/{FEEDBACK_ITEMS[k][3]}"), width="stretch", height=600)


def phone_page(data: dict) -> str:
    """手機版：28 項一頁捲到底，依分組列出；每項兩個按鈕，選「要修改」才出現意見欄。回傳填寫人。"""
    count = {x: sum(v["status"] == x for v in data.values()) for x in STATUS}
    done = len(FEEDBACK_ITEMS) - count["未看"]
    st.progress(done / len(FEEDBACK_ITEMS),
                text=f"已看 {done} / {len(FEEDBACK_ITEMS)}　要修改 {count['要修改']}")
    reviewer = st.text_input("填寫人", placeholder="例如：柏任", key="fb_reviewer")
    group = None
    for k, (g, item, hint, page_href) in enumerate(FEEDBACK_ITEMS):
        if g != group:
            n_done = sum(data[j]["status"] != "未看" for j, x in enumerate(FEEDBACK_ITEMS) if x[0] == g)
            n_all = sum(1 for x in FEEDBACK_ITEMS if x[0] == g)
            st.markdown(f"#### {g}　<small>{n_done}/{n_all}</small>", unsafe_allow_html=True)
            group = g
        with st.container(border=True, gap="small"):
            # 標題與「看這頁」同一列（horizontal 容器在手機上不會被拆成上下兩排）
            row = st.container(horizontal=True, vertical_alignment="center", horizontal_alignment="distribute", wrap=False)
            row.markdown(f"**{item}**")
            if page_href and row.button("看這頁", key=f"fb_look_{k}", type="tertiary", icon=":material/visibility:"):
                preview_dialog(k)
            st.caption(hint)
            st.session_state.setdefault(f"fb_ps_{k}", None if data[k]["status"] == "未看" else data[k]["status"])
            st.segmented_control("狀態", ["可以", "要修改"], key=f"fb_ps_{k}", width="stretch",
                                 label_visibility="collapsed", on_change=_save, args=(k, "status", f"fb_ps_{k}"))
            # 問題類一定要寫；其他項選了「要修改」或已有意見才顯示意見欄
            if g in ("待確認", "其他") or data[k]["status"] == "要修改" or data[k]["text"]:
                st.session_state.setdefault(f"fb_pt_{k}", data[k]["text"])
                st.text_area("意見", key=f"fb_pt_{k}", height=90, label_visibility="collapsed",
                             placeholder="答案或要改的地方" if g in ("待確認", "其他") else "哪裡要改、想改成什麼樣子",
                             on_change=_save, args=(k, "text", f"fb_pt_{k}"))
    return reviewer


with tab_fb:
    data = st.session_state.fb_data
    st.session_state.setdefault("fb_phone", is_phone_ua)
    phone = st.session_state.fb_phone
    if phone:
        if msg := st.session_state.pop("fb_load_msg", None):
            getattr(st, msg[0])(msg[1])
        reviewer = phone_page(data)
    else:
        st.toggle("手機版面", key="fb_phone", help="手機開啟時預設打開：一頁列出全部項目，按鈕比較好按。")

        with st.expander("接著上次填（上傳檔案，或貼上寄出的信件內容）"):
            st.file_uploader("上傳 v3-feedback.txt", type=["txt"], key="fb_upload", on_change=_load)
            st.text_area("或貼上信件內容", key="fb_paste", height=120, placeholder="把寄出的反饋信全文貼在這裡")
            st.button("讀回貼上的內容", on_click=_load_paste)
            st.caption("只在這次瀏覽時讀取，不會存到伺服器。")
        if msg := st.session_state.pop("fb_load_msg", None):
            getattr(st, msg[0])(msg[1])

        count = {x: sum(v["status"] == x for v in data.values()) for x in STATUS}
        done = len(FEEDBACK_ITEMS) - count["未看"]
        st.progress(done / len(FEEDBACK_ITEMS),
                    text=f"已看 {done} / {len(FEEDBACK_ITEMS)} 項　可以 {count['可以']}　要修改 {count['要修改']}　未看 {count['未看']}")

        def tools() -> None:
            """跳項與檢視切換。"""
            st.selectbox(
                "跳到項目",
                range(len(FEEDBACK_ITEMS)),
                key="fb_jump",
                on_change=_jump,
                format_func=lambda k: f"{k + 1}. 〔{FEEDBACK_ITEMS[k][0]}〕{FEEDBACK_ITEMS[k][1]}（{data[k]['status']}）",
            )
            st.button("跳到下一個未看", on_click=_next_open, disabled=count["未看"] == 0,
                      icon=":material/skip_next:", width="stretch")

        st.session_state.setdefault("fb_mode", "逐項填寫")
        top1, top2 = st.columns([1, 2])
        reviewer = top1.text_input("填寫人", placeholder="例如：柏任", key="fb_reviewer")
        with top2:
            tools()
        mode = st.segmented_control("檢視", ["逐項填寫", "總表"], key="fb_mode", width="stretch")

        if mode == "總表":
            # 設計清單查核總表：點一列就切回逐項填寫並跳到該項
            only_open = st.toggle("只看未完成（未看）", key="fb_only_open")
            shown = [k for k in range(len(FEEDBACK_ITEMS)) if not only_open or data[k]["status"] == "未看"]
            mark = {"未看": "⬜ 未看", "可以": "✅ 可以", "要修改": "✏️ 要修改"}
            st.dataframe(
                [{"#": k + 1, "項目": FEEDBACK_ITEMS[k][1], "狀態": mark[data[k]["status"]],
                  "意見": data[k]["text"].replace("\n", " ／ "), "分組": FEEDBACK_ITEMS[k][0]} for k in shown],
                key="fb_table", on_select=lambda: _pick_from_table(shown), selection_mode="single-row",
                hide_index=True, width="stretch", height=min(38 + 35 * len(shown), 1020),
            )
            st.caption("點任一列，就會切到那一項填寫。")
        else:
            k = st.session_state.fb_idx
            view, form = st.columns([3, 2], gap="large")
            with view:
                page_preview(k)
            with form:
                item_form(k)

    # ---------- 備份：寄出、下載 ----------
    st.divider()
    st.subheader("備份")
    st.caption("填寫內容只存在這個頁面，重新整理就會清空。每填幾項就寄出一次；寄出的信件內容可以貼回「接著上次填」繼續。")
    text = feedback_text(reviewer)
    if smtp_ready():
        last = st.session_state.get("fb_sent_at", 0.0)
        wait = SEND_GAP_SEC - (datetime.now().timestamp() - last)
        if st.button(f"寄出備份到 {FEEDBACK_TO}", type="primary", icon=":material/send:", width="stretch",
                     disabled=wait > 0, help=f"兩次寄出至少間隔 {SEND_GAP_SEC} 秒"):
            try:
                st.success(send_backup(text, reviewer))
                st.session_state.fb_sent_at = datetime.now().timestamp()
            except Exception as e:  # 寄信失敗要明講，並提供郵件 app 的替代方式
                st.error(f"寄出失敗（{type(e).__name__}），請改用下面的「用郵件 app 寄出」或下載檔案。")
                st.link_button("用郵件 app 寄出", mailto_url(text, reviewer), icon=":material/mail:", width="stretch")
    else:
        st.link_button(f"用郵件 app 寄出到 {FEEDBACK_TO}", mailto_url(text, reviewer), type="primary",
                       icon=":material/mail:", width="stretch")
        st.caption("會打開手機或電腦的郵件 app，收件人與內容已帶好，按傳送即可。")
    st.download_button("下載 v3-feedback.txt", text.encode("utf-8"), file_name="v3-feedback.txt",
                       mime="text/plain", icon=":material/download:", width="stretch")
    if phone:
        # 手機：不常用的放最下面，不占填寫區的版面
        with st.expander("接著上次填（貼上寄出的信件內容）"):
            st.text_area("信件內容", key="fb_paste", height=120, label_visibility="collapsed",
                         placeholder="把寄出的反饋信全文貼在這裡")
            st.button("讀回", on_click=_load_paste)
            st.file_uploader("或上傳 v3-feedback.txt", type=["txt"], key="fb_upload", on_change=_load)
        st.toggle("手機版面", key="fb_phone", help="關掉改用電腦版面：左邊看頁面、右邊一項一項填。")
    else:
        with st.expander("預覽內容"):
            st.code(text, language=None)

# ---------- 各版預覽 ----------
with tab_view:
    c1, c2, c3 = st.columns([2, 2, 1])
    version = VERSIONS[c1.selectbox("版本", list(VERSIONS))]
    size = c2.segmented_control("預覽尺寸", list(SIZES), default="手機 390")
    clean = c3.toggle("隱藏待確認標記", value=False)

    # 只列這一版實際有的頁面（v1 只有 6 頁）
    pages = [p for p in PAGES if (STATIC / version / p[1].split("#")[0]).is_file()]
    name = st.radio("頁面", [p[0] for p in pages], horizontal=True)
    _, href, note = next(p for p in pages if p[0] == name)

    file, _, anchor = href.partition("#")
    query = "?clean=1" if clean else ""
    url = static_url(f"{version}/{file}{query}{'#' + anchor if anchor else ''}")

    st.write(note)
    w, h = SIZES[size or "手機 390"]
    st.iframe(url, width=w, height=h)
    st.caption("「待確認」黃色標記是設計稿專用，正式網站不會出現。")
