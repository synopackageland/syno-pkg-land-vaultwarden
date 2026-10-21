# 驗證狀態與 framework 缺口

結論：官方映像的基本非 root 執行可行；本次 **DSM 原生 OIDC 整合未完成**。
目前的 manifest 是會明確失敗的整合草案，不能部署或發版。

## 固定版本與來源

- Vaultwarden 1.37.4：`7c188967e7a467b19b2757bc3326f9cf3ccae327`。
- 官方映像 index：`sha256:efb3cde962015fcc036b2ea625242248611943b27212ebf4392841fb30fad055`。
- 實際拉取的 amd64 image revision/version labels 與該 tag 一致。
- 初始 fork main 已包含該 tag 以及後續上游 commits；merge 回報 already up to date。
  未倒退、改寫或修改任何上游檔案；映像執行的是 release tag，並非從 fork HEAD 編譯。
- CLI/templates、SDK/App 0.21.0；Go module checksum 在 `tests/gateway/go.sum`。
  executor 依 CLI 對應 0.20.0，未使用任何 source override。

## 已重現的 SDK 阻擋（高信心）

| 邊界 | 實際結果 | 影響與需要的 framework 工作 |
| --- | --- | --- |
| OIDC provider 與 App admission 無法分開 | CLI 拒絕 `mode: oidc, access: public`；SDK NewFront 回傳 `public access requires mode none`。省略 access 則 CLI 設成 dsm-users。 | 提供受支援的 provider-only 配置：Web Vault/API 的 admission 由 Vaultwarden 負責，OIDC authorize 仍獨立驗證 DSM 身分與 App 權限。不能只刪除 public 的驗證限制，導致 issuer 無權限邊界。 |
| 原生 POST transport | dsm-admins 下 GET `/api/config` 為 401，原生 POST `/identity/connect/token` 為 403，upstream 呼叫次數為零；舊版 runtime 空 access 路徑 GET 可到 upstream，但無 Origin 的 POST 仍 403。 | provider-only 路徑須讓原生用戶端的 upstream 認證請求通過，不要求 DSM cookie 或瀏覽器 Origin；同時保持 OIDC transaction/redirect/PKCE 的安全驗證。 |

對照：同 origin 的 browser POST 能到實際 HTTP fixture；明確 `/api`、`/identity`
passthrough 也能讓 native POST 通過，但 `/` 仍被 DSM 擋住。這些只用來隔離原因，
**沒有放入 App manifest 當 workaround**。未使用 forward-auth 或自製 proxy。

`npm test` 的五項 CLI 邊界與 `npm run test:sdk` 的四項 runtime 診斷通過。
`npm run test:requirements` 額外兩項必要產品行為仍失敗；診斷測試通過不代表整合完成。

## 尚未證明的整合能力

- **主選單自動進入原生 SSO**：上游自己的 Playwright SSO 流程會先輸入 email、點
  Use single sign-on，再建立／解鎖主密碼。SDK browser bridge 需要固定 native SSO
  start URI；尚未證明能在不改 Web Vault、不代填／擷取憑證的情況下自動開始其
  client-generated PKCE 流程。`native_login` 只解決 DSM cold-login resume，不能當作
  已建立 Vaultwarden session 的證據。此項為未知，未斷言是 SDK 缺陷。
- **DOMAIN**：需要實際對外 HTTPS origin 的設定／驗證流程；草案只有示例值。
- **權限**：目前目標先限 DSM admins；一般 DSM 使用者的 Application Privileges、
  issuer admission 以及 disable/delete/UID reuse 撤權均待驗。上游沒有把 DSM admin
  claim 轉成 ADMIN_TOKEN 的契約，故 admin 頁保持關閉。
- **刪除／保留**：未實作 account.on_delete 的上游刪除 adapter；不寫上游 DB，
  不為刪除帳號開啟 ADMIN_TOKEN、不加 root watcher。離線 vault 與已核發 App token
  的撤銷行為也未驗證，不承諾即時失效。
- **通知／相容性**：尚未驗證 `/notifications/hub` 的真實 SignalR WebSocket、
  官方 Bitwarden CLI／擴充、真實 OIDC token lifecycle 或長時間 session。

## 官方映像 Linux fixture

使用相同 immutable index 的官方 amd64 映像與 SDK 0.21.0 storage-init，UID/GID
12345、cap_drop ALL、no-new-privileges、唯讀 rootfs、私有 volume 子目錄。
registry mirror 僅作同 digest 映像傳輸，不重建／修改映像。

| 檢查 | 結果 |
| --- | --- |
| `/alive` | HTTP 200 |
| 原生 Web Vault `/` | HTTP 200，保留上游 HTML |
| `/admin` 未設 ADMIN_TOKEN | HTTP 200 的 admin panel disabled 說明；非可用管理頁 |
| 本地 password grant | HTTP 400：SSO sign-in is required |
| 原生註冊 send-verification-email | HTTP 400：Registration not allowed |
| container restart | SQLite 檔仍在、UID 仍為 12345；未宣稱保險庫項目保留 |
| fixture 清理 | 自建 container／volume 已移除並讀回不存在 |

此 fixture 沒有接真實 DSM issuer，不是 SSO 成功證據，也不是 DSM storage／lifecycle
證據。測試過程更正了兩個假設：admin 停用頁為 200；上游註冊入口是
`/identity/accounts/register/send-verification-email`，不是舊的 accounts/register。

## 必要驗收矩陣

| 項目 | 狀態 |
| --- | --- |
| CLI 版號格式 | `version: 1.37.4` + `build: 1` 對應 `1.37.4-0001`；無 version/build 格式錯誤 |
| 最終 SPK build/inspect | 阻擋，尚無 SPK |
| DSM 安裝、主選單、真實 OIDC、非授權 403 | 未執行；不安裝已知不符合登入邊界的草案 |
| 建主密碼、儲存密碼、登出再登入解鎖 | 瀏覽器 suite 已寫；未執行 |
| 官方 Bitwarden 擴充／bw | 未執行；尚無可驗證的 DSM OIDC server |
| stop/start、0001→0002 資料保留 | 未執行 |
| 卸載 keep/delete-data | 未執行；不宣稱 named volume 已清除 |
| trusted HTTPS、WebSocket 通知 | 未執行 |

修正 framework 的 admission/transport 並發佈相容版本後，先讓兩個 requirements
測試轉綠，再完成 native SSO entry、DOMAIN、刪除契約與真機矩陣。最後重建 SPK、
inspect、完成 notice/source inventory 後才能交付；目前不發佈 Release 或 catalog。
