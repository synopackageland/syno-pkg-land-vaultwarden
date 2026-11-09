# Vaultwarden for DSM

## 1.37.4-0020: sign-in page loading

Rebuilt with published SDK/App 0.53.21 and CLI 0.52.13 to improve page loading
reliability when signing in. Concurrent asset requests share session admission
and queue through the identity gateway. Upstream version and image digest are
unchanged. This rebuild runs check, build, inspect comparison and privacy scans;
unit, browser, container-runtime and device acceptance tests were not run.

## 1.37.4-0019: HTTPS guidance link

SDK/App 0.50.10 reads the declared DSM HTTPS port from the DSM web configuration
so the HTTP guidance page can offer a working HTTPS link. CLI remains 0.48.15.
The page stays on HTTP until the link is selected; HTTPS retains the normal
DSM sign-in and master-password unlock flow.

## 1.37.4-0018: HTTP secure-context guidance

Vaultwarden's web vault needs WebCrypto in a secure browser context. The package
uses the SDK's `identity_gateway.secure_context: required` option: an HTTP page
navigation displays the standard HTTPS guidance without redirecting automatically.
The SDK offers an explicit HTTPS link when it can discover the DSM HTTPS port;
otherwise it shows instructions to reopen DSM over HTTPS. HTTP API requests
return `https_required`. HTTPS retains the normal sign-in and vault unlock flow.

Built with released CLI 0.48.15 and SDK/App 0.50.8. The official Vaultwarden image,
administrator admission, saved settings and encrypted vault data are retained.


## 1.37.4-0014: DSM path ingress

Vaultwarden opens at `/synopkgland/SynoPkgVaultwarden/` on the configured DSM
HTTPS origin. Built with released CLI 0.43.0, SDK/App 0.43.1, templates 0.38.0
and executor/v0.39.0, without source overrides. The official Vaultwarden 1.37.4
image digest, administrator-only entry policy and persistent volumes are unchanged.
The old public gateway HTTPS listener is removed; the OIDC issuer remains loopback-only.
The DSM menu preserves the native SSO launch route under the package namespace.

## 1.37.4-0011: SDK 0.38.2 rebuild

Built with SDK/App 0.38.2, CLI 0.41.9, templates 0.35.5 and executor v0.38.2.
The install wizard now offers the gateway HTTPS and sign-in (OIDC issuer) ports; upgrades keep the saved ports.
Vaultwarden reads its sign-in authority from the selected issuer port instead of a fixed 29090.
Fixed DSM menu sign-in: only native-client `/identity` paths (`/identity/connect/token`, `/identity/accounts`, `/identity/sso`) use upstream authentication, so the browser authorization redirect goes through the DSM gate again.
Added the `npm run e2e:smoke` App-open check (administrator, non-administrator access denied, signed out).
Protected executor payloads changed: administrator approval is required again after upgrading.

## 1.37.4-0010: SDK entry-gate migration

Built with SDK/App/templates 0.32.0, CLI 0.34.0 and executor v0.32.0.
Only `/api`, `/identity`, `/notifications`, `/attachments`, `/events`, `/icons` use upstream authentication; all other browser paths retain the DSM entry gate.
Protected executor payloads changed: administrator approval is required again after upgrading.
No NAS installation or device acceptance was performed for this rebuild.

## 1.37.4-0007

Vaultwarden now has one sign-in URL, and opening it from DSM goes to that address. Without an external address, it uses the install-time URL.

Vaultwarden 現在只保留一個登入網址，從 DSM 開啟也會前往該網址；未設定外網網址時沿用安裝時網址

沿用未修改的官方 Vaultwarden 1.37.4 映像與 Web Vault，所有包裝在
`synology/`。使用正式 CLI/templates 0.30.0、SDK/App 0.30.2、executor/v0.27.0；UI release set 固定 0.14.4。

## 登入與加密

DSM 主選單透過固定原生 `/#/sso?identifier=00000000-01DC-01DC-01DC-000000000000`
入口開始 PKCE。issuer 與瀏覽器頁面要求 DSM 管理員與既有 DSM App 權限語意；
只有 `/api`、`/identity/connect/token`、`/identity/accounts`、`/identity/sso`、
`/notifications`、`/attachments`、`/events`、`/icons` 交由 Vaultwarden 自己驗證，
供原生用戶端、API 與 WebSocket 使用。瀏覽器的 `/identity/connect/authorize` 與
`/identity/connect/oidc-signin` 保留 DSM gate，gateway 才會把 issuer 轉址改寫成公開網址。
目前 entry/access 均以管理員為限，一般使用者應收到拒絕存取頁。

**第一次仍須建主密碼，之後仍須主密碼解鎖保險庫。** DSM SSO 不能解密、代填
或繞過主密碼。主密碼遺失無法由 DSM 管理員取回。

`SSO_ONLY=true`、`SIGNUPS_ALLOWED=false`、`SSO_SIGNUPS_ALLOWED=true`：只有經
issuer 授權的新 SSO 身分可建立帳號。`SSO_SIGNUPS_MATCH_EMAIL=false` 避免依
email 自動接管既有帳號；識別使用 issuer/sub。`@dsm.invalid` 只是相容欄位。

`SSO_AUTH_ONLY_NOT_SESSION=true` 使用上游原生的「SSO 只管登入」模式。SDK 不提供
refresh token；若綁定到短效 issuer token，Web Vault 會很快被登出。這項設定
讓 App session 依 Vaultwarden 管理，**DSM 停權／登出不會即時撤銷既有 App
sessions、API keys 或離線保險庫**。新登入仍須 DSM 授權。自動帳號刪除的限制見
[framework-gaps](docs/framework-gaps.md)。

`ADMIN_TOKEN` 不設定，`/admin` 保持上游停用說明；DSM admin claim 不等於
Vaultwarden 的管理 token。

## 安裝與 DSM HTTPS origin

1. 先讓管理員透過預定名稱開啟 DSM，並準備相符、用戶端受信任的 TLS 憑證
2. 在套件中心原地升級或手動安裝 SPK，保留既有資料
3. 「App ports」只設定 loopback OIDC issuer 連接埠（預設 29090），沒有公開 gateway port
4. 「DSM HTTPS origin」輸入目前 DSM 的 HTTPS origin，例如 `https://<DSM 主機名稱>:5001`，
   不含路徑、query、fragment 或尾斜線
5. 從 DSM 主選單開啟 Vaultwarden，依上游流程建立主密碼或解鎖

從舊 dedicated-port 版本升級時，請在升級參數 `pkgwizard_setting_public_origin`
提供 DSM HTTPS origin，取代舊 gateway origin。SDK 保留設定與 issuer port；App 原生
`ENV_FILE` 將 origin 組合為 `DOMAIN=<DSM origin>/synopkgland/SynoPkgVaultwarden`，
API、SSO callback、Web Vault 與 WebSocket 因而使用相同路徑。健康探針也使用該路徑下的 `/alive`。

上游 SSO、CORS、WebAuthn 與郵件連結由單一 `DOMAIN` 衍生。請透過設定的同一個
DSM origin 開啟 App；使用其他 alias 或 IP 需要重新驗證 callback 與瀏覽器 origin。
目前只驗證 DSM 路徑入口，不宣稱 Connect、QuickConnect 或其他外部 provider 已通過。

瀏覽器接受自簽憑證不表示官方 Bitwarden CLI／擴充會信任它。缺少受信任、名稱
相符的 HTTPS endpoint 時，只能記錄原生用戶端限制；不關閉 TLS 驗證、不修改
DSM 憑證／反向代理設定來取得通過。

## 執行期與資料

官方映像以 package UID/GID 執行 `/vaultwarden`，loopback 上游 29800、唯讀 rootfs、
cap_drop ALL、no-new-privileges。SDK storage-init 在持久 named volume 的
`/var/tmp/vaultwarden` 建私有目錄；不修改上游 UI、映像或資料庫。

升級保留資料與 origin；主密碼仍由使用者保管。**Container Manager 管理的 named
volumes 目前會保留，即使在卸載精靈勾選 delete-data。** 精靈會明示保留項目；
不要將選取 delete-data 說成已刪除 vault。管理員需另行確認、備份並依 Container
Manager 的程序處理殘留 volume，套件不取得 root 或 Docker socket 代刪。

## 開發驗證

在 Linux builder 使用正式 CLI 0.48.15、templates 0.40.1、SDK/App 0.50.10。正式產物不使用 source override 或 Go replace。

```sh
cd synology
npm ci --ignore-scripts
npm test
npm run test:requirements
npm run check
npm run build
```

CLI 原生 build 會產生安裝欄位與 SDK 設定控制器。App 只宣告
`install.settings.public_origin` 與 `VAULTWARDEN_ORIGIN: {external_origin: true, setting: public_origin}`，
再由既有 `sso.env` 組合完整 `DOMAIN` 與 loopback issuer，沒有安裝 shell hooks 或 SPK 重寫。
Gateway 的 launch、callback 與原生用戶端例外維持相對路徑，由 SDK 加一次 namespace。

### App-open smoke

`npm run e2e:smoke` 用 CLI 的 `appOpenSmoke` 檢查管理員（A）、一般使用者（N）與
未登入（X）。ready marker 是上游 Web Vault 登入後的主密碼欄位
（第一次設定或之後解鎖）。本 App 是 `entry: admin-only`，N 應看到 SDK 的拒絕
存取頁。需設定 `DSM_E2E_URL`（NAS 的 DSM HTTPS URL，CLI 接受自簽憑證）、
mode 600 的 `DSM_E2E_ACCOUNT_ADMIN`／`DSM_E2E_ACCOUNT_NORMAL`（`{username,password}`）、
repo 外的 `DSM_E2E_PROFILE_DIR` 與已忽略的 `DSM_E2E_OUTPUT_DIR`。smoke 不安裝套件、
不改帳號或權限；N 被略過不算驗收完成。

e2e suite 使用 mode 600 的 DSM profiles／主密碼檔（repo 外或已忽略的私有目錄）；缺少 fixture
不算通過。測試自簽 DSM 憑證時可明確設定 `VW_E2E_ALLOW_SELF_SIGNED=1`，正式用戶端信任不因此成立。公開提交前以 `scripts/public-scan.py --denylist <private-file>` 掃描。
驗收範圍及尚未證明的部分見 [validation](docs/validation.md)。

## Official package icon

The DSM package uses the official project artwork, preserved unchanged and only resized/rasterized to the required icon sizes. See [assets/icon-source.json](assets/icon-source.json) for the source revision and original SHA-256, and [NOTICE](NOTICE) for attribution and the applicable image license. The package ID remains `SynoPkgVaultwarden` for upgrade continuity.
