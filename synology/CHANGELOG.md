# Changelog

## 1.37.4-0006

- Keep one sign-in URL. `DOMAIN` follows the App's external address (manual or Connect) and falls back to the install-time URL when none is set. With an external address, opening the App from DSM goes there, browser visits to the local address are redirected there, and changing it requires confirming that only that address can sign in afterwards (with a tailnet note for Tailscale addresses). Requires SDK/App/CLI/templates 0.29.2 with `single_origin`. Official images and application sources are unchanged. Not tested on a NAS.
- 只保留一個登入網址。`DOMAIN` 依 App 的外網網址（手動或 Connect）設定，未設定時沿用安裝時網址。設定外網網址後，從 DSM 開啟會前往該網址，瀏覽器開啟內網位址會轉到該網址，變更網址時須確認之後只能用此網址登入（Tailscale 網址另提示 tailnet）。需要含 `single_origin` 的 SDK/App/CLI/templates 0.29.2；官方映像與上游程式維持原樣。尚未在 NAS 上測試。

## 1.37.4-0005

- Rebuild 1.37.4-0005 with published SDK/App/CLI/templates 0.28.0 (executor/v0.27.0), UI 0.14.4 and Go 1.26.10, with the SDK's slow-NAS startup defaults. Official images and application sources are unchanged. Not tested on a NAS.
- 1.37.4-0005 使用已發佈 SDK/App/CLI/templates 0.28.0（executor/v0.27.0）、UI 0.14.4 與 Go 1.26.10 重建，採用 SDK 的慢速 NAS 啟動預設值；官方映像與上游程式維持原樣。尚未在 NAS 上測試。

## 1.37.4-0004

- Rebuild 1.37.4-0004 with published SDK/App/CLI/templates 0.26.0, UI 0.14.4 and Go 1.26.10. Maintainer: Syno Package Land. Official images and application sources are unchanged.
- 1.37.4-0004 使用已發佈 SDK/App/CLI/templates 0.26.0、UI 0.14.4 與 Go 1.26.10 重建；維護者顯示為 Syno Package Land。 官方映像與上游程式維持原樣。
