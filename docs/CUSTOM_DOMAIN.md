# Custom domain: worthbook.online（Spaceship 詳細步驟）

App Store Connect 用呢個 domain，訪客就唔會睇到你個 GitHub 用戶名。

| Field | URL |
|--------|-----|
| Support URL | `https://worthbook.online/worthtracker/privacy/` |
| Privacy Policy URL | `https://worthbook.online/worthtracker/privacy/` |
| Marketing URL (optional) | `https://worthbook.online/worthtracker/` |

---

## A. 喺 Spaceship 改 DNS

### 1. 登入

1. 開 https://www.spaceship.com/ 登入  
2. 入 **Launchpad**（主控台）

### 2. 開 Advanced DNS

任選一種：

- 喺 Launchpad 搜尋 **Advanced DNS** → 撳入去 → 揀 `worthbook.online`  
**或者**
- 入 **Domain Portfolio** / Domains → 搵 `worthbook.online` → **Manage** → **Advanced DNS** / **DNS**

### 3. 確認 nameserver 係 Spaceship

喺 DNS 頁搵 **Nameservers**：

- 應該係 Spaceship 預設（例如 `launch1.spaceshipdns.com` / `launch2.spaceshipdns.com` 之類）  
- 如果之前改過去 Cloudflare / 其他，要改返 Spaceship，或者喺嗰邊加下面嘅 records（二揀一，唔好兩邊亂加）

### 4. 清走會衝突嘅舊 records

喺 **DNS records → Custom records**，刪除／停用呢啲（如果有）：

- 指向其他網站嘅 **A**（`@`）  
- 指向 parking / “coming soon” 嘅 **A / CNAME**  
- `@` 或 `www` 嘅舊 **CNAME**（會同下面設定衝突）

**唔好刪** Spaceship 自動加嘅電郵相關 TXT（除非你知道唔使）。

### 5. 加 4 條 A record（apex：`worthbook.online`）

逐條 **Add record** → 選 **A**：

| Type | Host / Name | Value / Points to | TTL |
|------|-------------|-------------------|-----|
| A | `@` | `185.199.108.153` | Auto / 3600 |
| A | `@` | `185.199.109.153` | Auto / 3600 |
| A | `@` | `185.199.110.153` | Auto / 3600 |
| A | `@` | `185.199.111.153` | Auto / 3600 |

> Spaceship 有時 Host 空欄就代表 `@`（根域名）。  
> 一定要 **加齊 4 條**。

（可選）再加 **AAAA**：

| Type | Host | Value |
|------|------|--------|
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

### 6. 加 www CNAME

**Add record** → 選 **CNAME**：

| Type | Host / Name | Value / Points to | TTL |
|------|-------------|-------------------|-----|
| CNAME | `www` | `wyc3809.github.io` | Auto / 3600 |

> Value 只填 `wyc3809.github.io`（**唔好**加 `https://`，**唔好**加尾斜線）。  
> 有啲界面會自動加句點，跟系統提示就得。

### 7. 儲存

每條 record 撳 **Add** / **Save**。整頁再確認一次 list 入面有：

- 4× A `@` → GitHub IPs  
- 1× CNAME `www` → `wyc3809.github.io`

---

## B. 喺 GitHub 綁定 domain

1. 開：https://github.com/wyc3809/App/settings/pages  
2. **Custom domain** 填：`worthbook.online` → **Save**  
3. 等 DNS check 變綠色／通過（可能幾分鐘到幾小時）  
4. 剔上 **Enforce HTTPS**（check 通過之後先出現／先剔得）

> 如果 GitHub 話 DNS 未好，等一陣再 **Save** 一次。  
> Repo 合併 PR #57 之後，deploy 會自動寫 `CNAME` 檔，避免之後 deploy 沖走設定。

---

## C. 檢查係咪成功

瀏覽器開：

1. https://worthbook.online/worthtracker/  
2. https://worthbook.online/worthtracker/privacy/  

兩個都應該出 WorthBook 頁面（URL **唔會**顯示 `github.io`）。

手機／電腦都可以用呢個查 DNS：https://dnschecker.org/#A/worthbook.online  

---

## D. App Store Connect 填呢啲

DNS + HTTPS 通咗先填：

| Field | Value |
|--------|--------|
| Support URL | `https://worthbook.online/worthtracker/privacy/` |
| Privacy Policy URL | `https://worthbook.online/worthtracker/privacy/` |
| Marketing URL | `https://worthbook.online/worthtracker/`（或不填） |
| Copyright | `2026 WorthBook` |

---

## E. （可選）電郵轉發

Privacy 頁聯絡係 `support@worthbook.online`。

喺 Spaceship 搵 **Email forwarding** / **Email**（如果有）：

- 建立：`support@worthbook.online` → 轉去你平常用嘅 Gmail／電郵  

如果 Spaceship 冇電郵服務，可以用 ImprovMX / Cloudflare Email Routing 之後再設。

---

## 常見問題

**Q：改完仍然開唔到？**  
等 DNS（通常 5–60 分鐘，最長約 48 小時）。清瀏覽器 cache 或用無痕視窗試。

**Q：GitHub 顯示 “Domain does not resolve…”？**  
再核對 4 條 A record IP 有冇打錯；確認 nameserver 仍然係 Spaceship。

**Q：https 出現證書錯誤？**  
等 GitHub 簽發憑證（綁定 domain + DNS 通過後）；確保已開 Enforce HTTPS。

**Q：根域名開到但 `/worthtracker/` 404？**  
要合併並 deploy PR（`worthbook.online` + `/worthtracker` basePath）之後先會通。
