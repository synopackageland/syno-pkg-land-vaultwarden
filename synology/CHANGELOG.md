# Changelog

## 1.37.4-0022

- en: Improve installation reliability in Package Center
- zh-TW: 提升在套件中心安裝的穩定性
- zh-CN: 提升在套件中心安装的稳定性
- ja: パッケージセンターでのインストールの安定性を向上
- ko: 패키지 센터에서의 설치 안정성 향상
- de: Zuverlässigkeit der Installation im Paket-Zentrum verbessern
- fr: Améliorer la fiabilité de l’installation dans le Centre de paquets
- es: Mejorar la fiabilidad de la instalación en el Centro de paquetes
- it: Migliorare l’affidabilità dell’installazione nel Centro pacchetti

Rebuilt with CLI 0.53.16. The ingress, gateway and Portal nginx reload is now
declared only for package start and stop: INFO keeps
`startstop_restart_services="nginx.service"` and no longer sets
`instuninst_restart_services`. The install-time reload could collide with DSM
`API.Info` and make Package Center show a `t.indexOf` error after installing.
SDK, App runtime, upstream version and image are unchanged.

## 1.37.4-0021

- en: Keep temporary files on disk instead of memory
- zh-TW: 暫存檔改存於磁碟而非記憶體
- zh-CN: 临时文件改存于磁盘而非内存
- ja: 一時ファイルをメモリーではなくディスクに保存
- ko: 임시 파일을 메모리 대신 디스크에 저장
- de: Temporäre Dateien auf dem Datenträger statt im Arbeitsspeicher ablegen
- fr: Conserver les fichiers temporaires sur le disque plutôt qu’en mémoire

Rebuilt with SDK/App 0.53.25, CLI 0.52.16 and executor v0.53.6. `/tmp` is SDK
disk scratch instead of a memory tmpfs. The Compose healthcheck probes the
loopback `/alive` route.

## 1.37.4-0020

- en: Improve page loading reliability when signing in
- zh-TW: 改善登入時頁面載入的穩定性
- zh-CN: 改善登录时页面加载的稳定性
- ja: サインイン時のページ読み込みの安定性を改善
- ko: 로그인 시 페이지 로딩 안정성 개선
- de: Zuverlässigkeit beim Laden von Seiten während der Anmeldung verbessern
- fr: Améliorer la fiabilité du chargement des pages lors de la connexion
- es: Mejorar la fiabilidad de la carga de páginas al iniciar sesión
- it: Migliorare l’affidabilità del caricamento delle pagine durante l’accesso

Rebuilt with SDK/App 0.53.21 and CLI 0.52.13. Upstream version and image
digest are unchanged. Tests and device acceptance were not run for this rebuild.

## 1.37.4-0019

- en: Fix the HTTPS link on the HTTP guidance page
- zh-TW: 修正 HTTP 引導頁的 HTTPS 連結
- zh-CN: 修复 HTTP 引导页的 HTTPS 链接
- ja: HTTP 案内ページの HTTPS リンクを修正
- ko: HTTP 안내 페이지의 HTTPS 링크 수정
- de: HTTPS-Link auf der HTTP-Hinweisseite korrigiert
- fr: Corriger le lien HTTPS sur la page d’instructions HTTP

## 1.37.4-0018

- en: Show HTTPS guidance when opening the web vault over HTTP
- zh-TW: 以 HTTP 開啟網頁保險庫時顯示 HTTPS 引導
- zh-CN: 通过 HTTP 打开网页密码库时显示 HTTPS 引导
- ja: HTTP で Web 保管庫を開く際に HTTPS の案内を表示
- ko: HTTP로 웹 보관함을 열 때 HTTPS 안내 표시
- de: HTTPS-Hinweis beim Öffnen des Web-Tresors über HTTP anzeigen
- fr: Afficher les instructions HTTPS à l’ouverture du coffre web en HTTP

## 1.37.4-0017

- en: Fix DSM sign-in when opening over HTTP
- zh-TW: 修正以 HTTP 開啟時的 DSM 登入
- zh-CN: 修复通过 HTTP 打开时的 DSM 登录
- ja: HTTP で開いた場合の DSM ログインを修正
- ko: HTTP로 열 때 DSM 로그인 수정
- de: DSM-Anmeldung beim Öffnen über HTTP korrigiert
- fr: Corriger la connexion DSM lors de l’ouverture via HTTP

## 1.37.4-0015

- en: Install wizard: port conflicts only warn; shared folder selection fixed
- zh-TW: 安裝精靈：連接埠衝突僅顯示警告，並修正共用資料夾選擇
- zh-CN: 安装向导：端口冲突仅显示警告，并修复共享文件夹选择
- de: Installationsassistent: Portkonflikte werden nur als Warnung angezeigt; Auswahl freigegebener Ordner korrigiert
- fr: Assistant d’installation : les conflits de ports affichent seulement un avertissement ; sélection des dossiers partagés corrigée
- ja: インストールウィザード：ポート競合は警告のみ表示し、共有フォルダーの選択を修正
- ko: 설치 마법사: 포트 충돌은 경고만 표시하며 공유 폴더 선택 수정

## 1.37.4-0014

- Move the browser entry to `/synopkgland/SynoPkgVaultwarden/` on DSM HTTPS
- Remove the dedicated public gateway port and keep the loopback OIDC issuer
- Compose the native DOMAIN with the package path in Vaultwarden ENV_FILE
- Use CLI 0.43.0, SDK/App 0.43.1 and templates 0.38.0
- Preserve administrator-only admission, native-client API exceptions and persistent data

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
