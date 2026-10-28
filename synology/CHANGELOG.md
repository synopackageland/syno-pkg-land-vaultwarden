# Changelog


## 1.37.4-0010: SDK entry-gate migration

Built with SDK/App/templates 0.32.0, CLI 0.34.0 and executor v0.32.0.
Only `/api`, `/identity`, `/notifications`, `/attachments`, `/events`, `/icons` use upstream authentication; all other browser paths retain the DSM entry gate.
Protected executor payloads changed: administrator approval is required again after upgrading.
No NAS installation or device acceptance was performed for this rebuild.

## 1.37.4-0007

- Vaultwarden now has one sign-in URL, and opening it from DSM goes to that address
- Vaultwarden 現在只保留一個登入網址，從 DSM 開啟也會前往該網址
