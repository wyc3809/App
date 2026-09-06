# Custom domain: worthbook.online

App Store Connect should use this domain so visitors never see your GitHub username.

| Field | URL |
|--------|-----|
| Support URL | `https://worthbook.online/worthtracker/privacy/` |
| Privacy Policy URL | `https://worthbook.online/worthtracker/privacy/` |
| Marketing URL (optional) | `https://worthbook.online/worthtracker/` |

## 1. DNS at your registrar

Point **worthbook.online** at GitHub Pages (repo `wyc3809/App`).

### Apex (`worthbook.online`)

Add these **A** records (host `@` or blank):

| Type | Name | Value |
|------|------|--------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

Optional IPv6 **AAAA**:

| Type | Name | Value |
|------|------|--------|
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

### `www` (recommended)

| Type | Name | Value |
|------|------|--------|
| CNAME | `www` | `wyc3809.github.io` |

> Some registrars offer **ALIAS / ANAME** for apex → `wyc3809.github.io` instead of A records. That is fine too.

## 2. GitHub Pages custom domain

1. Open https://github.com/wyc3809/App/settings/pages  
2. Under **Custom domain**, enter `worthbook.online` → Save  
3. Wait for DNS check to pass  
4. Enable **Enforce HTTPS**

The deploy workflow writes a `CNAME` file on `gh-pages` so GitHub keeps the domain after each deploy.

## 3. Email (optional but useful)

Create a forwarder at your DNS / email host:

`support@worthbook.online` → your real inbox  

(The in-app Privacy page links to this address.)

## 4. After DNS is live

Confirm:

- https://worthbook.online/worthtracker/  
- https://worthbook.online/worthtracker/privacy/  

Then paste the Support / Marketing URLs into App Store Connect.

DNS can take a few minutes to 48 hours. Until then, keep using the temporary GitHub Pages URL only for testing — do not put it in the public listing.
