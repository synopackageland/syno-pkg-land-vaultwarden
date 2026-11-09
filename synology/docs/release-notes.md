## 1.37.4-0019

## 1.37.4-0020: sign-in page loading

Rebuilt with published SDK/App 0.53.21 and CLI 0.52.13 to improve page loading
reliability when signing in. Concurrent asset requests share session admission
and queue through the identity gateway. Upstream version and image digest are
unchanged. This rebuild runs check, build, inspect comparison and privacy scans;
unit, browser, container-runtime and device acceptance tests were not run.

Offline comparison with 1.37.4-0019: permissions are unchanged,
approval retention is `not-required`, root programs and policy changes are empty,
and the task template is unchanged. `conf/privilege` still runs as the package
account. The generated Compose resource changes `force_recreate` from true to
false and the SDK ingress-check binary is rebuilt; neither adds root authority.

Fix the HTTPS link on the HTTP guidance page with SDK/App 0.50.10. The SDK
discovers the actual DSM HTTPS port from the DSM web configuration. The page
does not redirect automatically; select the link to sign in and unlock the vault
over HTTPS. CLI remains 0.48.15.

The upstream Vaultwarden 1.37.4 image, administrator admission, saved settings
and encrypted vault data are retained. Offline approval retention is unknown
because the package has no comparable executor inventory.

## 1.37.4-0018

Opening the web vault over HTTP now shows the SDK's standard HTTPS guidance,
without an automatic redirect. When DSM HTTPS port discovery is available the
SDK offers an explicit HTTPS link; otherwise it shows instructions. HTTP API requests
return `https_required`. HTTPS sign-in and vault unlocking keep their normal flow.

Built with CLI 0.48.15 and SDK/App 0.50.8 using the gateway's declarative
`secure_context: required` option. The upstream Vaultwarden version and image,
administrator admission, saved settings and encrypted vault data are retained.

Offline approval retention could not be determined from the previous package's
executor inventory; no approval retention is claimed.

## 1.37.4-0015

Install wizard: port conflicts only warn; shared folder selection fixed

Rebuilt with CLI 0.47.4; SDK/UI pins retained. No tests, NAS installs or live checks were run
Approval retention is unknown because the current inspector rejects the previous release’s legacy wizard baseline

## 1.37.4-0014

The browser entry moves to `/synopkgland/SynoPkgVaultwarden/` on the configured
DSM HTTPS origin. During migration, supply the DSM origin as
`pkgwizard_setting_public_origin`; the old gateway port is no longer public.
The native OIDC issuer remains loopback-only. The official image, encrypted
vault data and administrator-only entry policy are retained.

# Release notes


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

## 1.37.4-0009 — Redesigned DSM menu launch page

- The page shown when an App can't be opened from the DSM menu is redesigned and now explains when the App's port isn't reachable from outside
- 重新設計從 DSM 選單無法開啟 App 時顯示的頁面，並說明 App 的連接埠無法從外部連線的情況
