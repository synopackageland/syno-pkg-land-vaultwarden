# Changelog


## 1.37.4-0012: CLI 0.42.2 / SDK 0.42.0 rebuild

Rebuilt with released CLI 0.42.2, SDK/App 0.42.0, templates 0.37.0 and the
SDK-declared executor/v0.39.0. The upstream Vaultwarden 1.37.4 image and digest,
administrator-only entry policy, storage and saved settings are unchanged.
This package has no direct SDK/App/UI npm dependency; it uses the Compose and
identity gateway SDK pins. Its DSM menu entry remains the generated
`/webman/3rdparty/SynoPkgVaultwarden/sso/open.cgi`; the fixed
`/synopkgland/<package>/` rule applies to `daemon.ingress`, which this package
does not declare.

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

- Vaultwarden now has one sign-in URL, and opening it from DSM goes to that address
- Vaultwarden 現在只保留一個登入網址，從 DSM 開啟也會前往該網址
