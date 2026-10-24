# Vaultwarden for DSM

## 1.37.4-0007

Vaultwarden now has one sign-in URL, and opening it from DSM goes to that address. Without an external address, it uses the install-time URL.

Vaultwarden 現在只保留一個登入網址，從 DSM 開啟也會前往該網址；未設定外網網址時沿用安裝時網址

沿用未修改的官方 Vaultwarden 1.37.4 映像與 Web Vault，所有包裝在
`synology/`。使用正式 CLI/templates 0.30.0、SDK/App 0.30.2、executor/v0.27.0；UI release set 固定 0.14.4。

## 登入與加密

DSM 主選單透過固定原生 `/#/sso?identifier=00000000-01DC-01DC-01DC-000000000000`
入口開始 PKCE。issuer 要求 DSM 管理員與既有 DSM App 權限語意；上游 API、
原生用戶端、WebSocket 由 Vaultwarden 自己驗證，不在前面加 DSM gate。
目前 entry/access 均以管理員為限，不宣稱一般使用者驗收完成。

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

## 安裝與 HTTPS origin

1. 先讓管理員透過預定主機名稱開啟 DSM，並準備相符、用戶端受信任的 TLS 憑證。
2. 在套件中心手動安裝 SPK，保留原有 SDK consent／資料沿用提示。
3. 在 SDK 原生「Public HTTPS origin」欄位輸入 `https://<開啟 DSM 的主機名稱>:29443`。
   必須是根 origin，不能含帳密、路徑、query 或 fragment；目前此精靈接受 DNS
   名稱／IPv4，未加入 IPv6 literal。驗收 fixture 可另用專屬 gateway port。
4. SDK hooks 以非 root package account 驗證並原子寫入 0600 私有設定，唯讀掛載後作為
   Vaultwarden `DOMAIN`。值會保留供升級使用；不是 SPK 內的固定示例網址。
5. 從 DSM 主選單開啟 Vaultwarden，依上游流程建主密碼或解鎖。

App URL 與 DOMAIN 必須一致，包括 port。未設定外網網址時，請透過相同主機名稱
開啟 DSM menu；從另一個 NAS alias/IP 開啟可能使 OIDC callback origin 不一致。
不要自動猜測對外域名。

### 外網網址（唯一登入網址）

上游 SSO callback、CORS、WebAuthn 與郵件連結都由單一 `DOMAIN` 衍生，SSO 也綁定
只屬於該主機的 cookie，因此只能在 `DOMAIN` 主機登入。從內網開啟 DSM 後，到
`/webman/3rdparty/SynoPkgVaultwarden/sso/settings.cgi` 設定外網網址（或由
Connect 提供）。重新啟動 App 後 `DOMAIN` 改為該網址，它成為唯一登入網址：

- 從 DSM 主選單開啟會直接前往該網址。
- 瀏覽器開啟內網 `:29443` 位址時會轉到該網址；原生用戶端 API 不轉址。
- 變更網址需勾選確認：之後只能用此網址登入；Tailscale 網址另提示只有 tailnet
  中的裝置能連線。內網裝置也必須能連到這個網址。
- 清除外網網址並重新啟動後，`DOMAIN` 回到安裝時網址。不同 hostname 的專用反向代理、子路徑與隨意 port 重寫未驗收。
需要反向代理時，管理員須保留 Host、HTTPS 訊號、原生 API、OIDC callback 及
`/notifications/hub` WebSocket upgrade，並重新驗證完整登入。

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

在 Linux builder 使用正式 CLI/templates 0.30.0、SDK/App 0.30.2。正式產物不使用 source override 或 Go replace。

```sh
cd synology
npm ci --ignore-scripts
npm test
npm run test:requirements
npm run check
npm run build
```

CLI 原生 build 會產生安裝欄位及 SDK 設定控制器，check／build／inspect 會列出
宣告但不列出私有值。App 只宣告 `install.settings.public_origin`、
`DOMAIN: {external_origin: true, setting: public_origin}` 與
`identity_gateway.external_access.single_origin: true`，不提供安裝設定 shell hooks 或重寫 SPK。
安裝時空白沿用已保留設定；首次安裝缺值會拒絕，升級／重裝由 SDK 保留。

e2e suite 使用 repo 外的 DSM profiles／主密碼檔、私有 output 目錄；缺少 fixture
不算通過。公開提交前以 `scripts/public-scan.py --denylist <private-file>` 掃描。
驗收範圍及尚未證明的部分見 [validation](docs/validation.md)。

## Official package icon

The DSM package uses the official project artwork, preserved unchanged and only resized/rasterized to the required icon sizes. See [assets/icon-source.json](assets/icon-source.json) for the source revision and original SHA-256, and [NOTICE](NOTICE) for attribution and the applicable image license. The package ID remains `SynoPkgVaultwarden` for upgrade continuity.
