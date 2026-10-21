# Vaultwarden for DSM：原生 OIDC 整合草案

**目前受 SDK 0.21.0 阻擋，尚無可驗收／安裝的 SPK。** `dsm-package.yaml`
刻意保留不受支援的 `mode: oidc` + `access: public`，讓 check/build 明確失敗。
不能將其改成前置 DSM gate、列舉 API passthrough 或關閉 Vaultwarden 登入來交付。

沿用官方 Vaultwarden 1.37.4 映像與 Web Vault，所有整合檔案只放在 `synology/`。
預定 SPK 版號為 **1.37.4-0001**；同一上游版本遞增 build，上游升版重設 0001。
CLI/templates、SDK/App 均固定 0.21.0；executor 對應 0.20.0；templates 的 UI
release-set 為 0.12.5，本 App 直接使用上游 Web Vault，沒有另建 Vue UI。

## 登入與主密碼

DSM OIDC 只驗證帳號。**第一次仍須建立主密碼，之後仍須用主密碼解鎖保險庫。**
DSM 密碼不能替代端對端加密的主密碼，也不儲存、代填或繞過主密碼。
安裝說明／DSM App description 及上游的 Master password 畫面須保持此語義。

草案設定 `SSO_ONLY=true`、`SIGNUPS_ALLOWED=false`、`SSO_SIGNUPS_ALLOWED=true`。
一般註冊與本地帳密登入關閉，預期僅通過 DSM OIDC 的使用者可自動建立帳號。
`SSO_SIGNUPS_MATCH_EMAIL=false` 避免把既有帳號依 email 自動配對；上游登入
識別為簽章 claim 的 `issuer/sub`。SDK 產生的 `@dsm.invalid` email 是相容欄位，
不是可收信的地址，不能用來識別／接管既有帳號。

`ADMIN_TOKEN` 不設定。上游 `/admin` 回傳停用說明（HTTP 200），管理功能不啟用；
DSM admin claim 不會自動成為 Vaultwarden 的 ADMIN_TOKEN。一般 DSM 使用者的
App 權限、停權／刪除／UID 重用及既有 App session 撤銷仍須 framework 與實機驗證。
目前不宣稱支援一般使用者，也未實作 App 自有帳號刪除／root watcher workaround。

## HTTPS 與原生用戶端

Bitwarden 原生用戶端／瀏覽器擴充須使用可信 HTTPS 的完整專用 origin，不能只靠
瀏覽器接受自簽憑證。`DOMAIN` 必須與實際對外 origin 完全一致（含非標準 port）；
草案的 `https://vault.example:29443` 僅為範例，尚未有可交付的設定／驗證流程。

完成整合後可由 DSM 原生 HTTPS ingress 或管理員設定的 DSM 反向代理提供可信
憑證，反向代理須保留 Host、HTTPS 訊號、原生 API、OIDC callback 及
`/notifications/hub` WebSocket upgrade。使用根路徑專用 origin；不承諾子路徑。
這是部署方式說明，**未修改 DSM 反向代理或憑證設定，也未驗收其可用性**。

資料規劃為 SDK 管理的持久 named volume，掛載 `/var/tmp` 並由非 root
`storage_init` 建立私有 `/var/tmp/vaultwarden`，非 root 埠為 29800。
直接執行未修改的 `/vaultwarden`，跳過映像預設 shell setup；唯讀 rootfs、
cap_drop ALL、no-new-privileges。OIDC consumer 依 SDK 契約使用 host network，
上游 listener 限制在 loopback；這不是網路／主機隔離承諾。
named volume 由 Container Manager 管理，**不是 pkgvar bind**；SDK 明確拒絕後者的
安裝時序。keep/delete-data 均未做 DSM 實機驗收。

## 開發驗證

```sh
cd synology
npm ci --ignore-scripts
npm test                       # 已知 CLI 邊界與對照
npm run test:sdk               # 已知 runtime 邊界與對照
npm run test:requirements      # 目前兩項必要行為為紅燈
npm run check                 # 目前拒絕 public + oidc
```

測試須在受支援的 Linux builder 執行，Go 使用完整的已發佈 module 與 go.sum，
不使用 source override。公開 npm 不代表 Go SDK 可匿名下載；使用既有合法
credential helper 或保留原始 checksum 的 module cache，勿將憑證放進專案。

`tests/runtime.py` 探測真實、digest 固定的官方映像，須提供 `SPL_TEST_IMAGE`、
`SPL_STORAGE_INIT`（由 SDK 0.21.0 編譯的 helper），可用 `SPL_RESOURCE_PREFIX`
隔離自己的 Docker fixture。完成後移除並讀回自己的 container／volume。
此測試不代表 DSM 安裝、真實 DSM OIDC 或完整保險庫資料驗收。

瀏覽器套件：`npm run test:e2e`。需預先準備隔離的 fresh-account fixture、
可信 HTTPS、DSM 登入 profile，設定 `DSM_E2E_URL`、`VW_E2E_URL`、
`DSM_E2E_ADMIN_PROFILE`、`DSM_E2E_DENIED_PROFILE`、`VW_E2E_MASTER_PASSWORD_FILE`。
profile／密碼檔必須位於 repo 外；`VW_E2E_OUTPUT_DIR` 指向私有證據資料夾。
suite 不自動略過缺少的 fixture，不自動接受 TLS 錯誤，不修改帳號／DSM 設定。
**目前僅完成 suite 收集，尚未執行真機瀏覽器驗收。**

公開提交前以 `python3 scripts/public-scan.py --denylist <private-file>` 掃描；
`--text <file>` 可一併掃 commit／PR 文字，`--history-base origin/main` 掃新增歷史。
不要把私有驗收環境、profile、log 或截圖提交到公開 repo。

詳見 [SDK 阻擋與驗收狀態](docs/validation.md)。
