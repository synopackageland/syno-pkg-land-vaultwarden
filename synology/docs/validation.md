# Validation record

The current production candidate (1.37.4-0011) uses released CLI 0.41.9,
templates 0.35.5, SDK/App 0.38.2 and executor/v0.38.2, without source overrides
or Go replace.

## 1.37.4-0011 device acceptance

On a DSM 7.3.2 test NAS with Container Manager, 1.37.4-0011 upgraded in place
from 1.37.4-0009 and reached `running`. `npm run e2e:smoke` passed A
(administrator reaches the master-password form after DSM OIDC), N (a real
non-administrator sees the SDK access-denied page) and X (signed out stays at
the DSM gate). Without DSM cookies, `/identity/connect/token` still returns
Vaultwarden's own `SSO sign-in is required` and `/identity/accounts/prelogin`
returns 200; `/identity/connect/authorize` returns 401 at the DSM gate.
A first install with default ports on a second DSM 7.3.2 NAS ended `broken`
(`install_corruption`) and was removed. DSM's package manager log shows
`failed to acquire postinst worker` / `fail compose up` after preinst and
postinst both returned 0: the pinned image was not cached on that NAS, and
dockerd's pull failed TLS verification against `registry-1.docker.io` because
a TLS-inspecting firewall on that network presents its own certificate. The
in-place upgrade passed only because the image was already cached there.

A fresh install on a DSM 7.4.1 NAS reproduced the same `install_corruption`
when the pull through the configured registry mirror stalled (no bytes for
over ten minutes). DSM waited without a timeout. Once the image was pulled,
a fresh install of the same SPK with the wizard defaults (HTTPS 29443, sign-in
29090) reached `running` in about one minute; both port values were written
and listening, and `npm run e2e:smoke` passed A, N and X. The manifest and
`install.ports` values are not the cause; a fresh install needs a working
image pull (see the registry note below).

## Historical development acceptance

The device observations in this section used explicit SDK/CLI source overrides.
Those historical artifacts must not be published and are not relabelled as
released-dependency evidence.

The merged provider-only implementation separates native App transport from DSM
issuer admission. Additional development PRs provide a fixed SPA menu destination
and private installation settings. See the review links in the main PR.

Verified in a disposable DSM 7.3.2 / Container Manager environment with the
unmodified official Vaultwarden 1.37.4 digest-pinned image:

- Native `/#/sso?identifier=00000000-01DC-01DC-01DC-000000000000` starts S256 PKCE,
  traverses DSM OIDC and reaches master-password setup. The fixed menu launcher
  reaches that same native route; upstream UI is unchanged.
- A master password was created, an encrypted login item saved, then the user
  logged out and reopened from the DSM menu. The vault required the master
  password and showed the saved item after unlock.
- An ordinary DSM account outside the configured administrator boundary received
  403 at `/_sso/dsm-return`, before a grant could complete.
- Package stop/start and upgrade `1.37.4-0001` to `0002` preserved the saved item,
  verified by decrypting/unlocking and viewing it in the Web Vault.
- The authenticated `/notifications/hub` upgraded with HTTP 101. After a second
  tab edited an item, the receiver obtained a binary SignalR `ReceiveMessage`
  with update type 0. Same-device Web Vault tabs did not automatically repaint;
  frame delivery is verified, cross-device UI synchronization is not.
- The native install wizard accepted an HTTPS origin; the corresponding runtime
  setting was read back as package-owned mode 0600 and survived upgrade.
- Uninstall with keep retained the named volume/database, and reinstall showed
  the saved item after unlock. The delete-data choice retains Container Manager
  volumes by framework design. The native UI was exercised with delete-data
  selected, showed COMPOSE_DATA_RETAINED, and the retained database was read back;
  do not report physical vault deletion.

The official Bitwarden CLI 2026.10.0 was configured for the test HTTPS endpoint
and attempted SSO. It failed certificate verification before login. The test
system has no matching trusted public endpoint; no TLS checks were disabled and
no certificate/reverse-proxy settings were changed. Native-client login remains
unverified. Browser acceptance in that environment does not establish trust for
CLI/extensions.

The native installation-settings revision removes all App wizard rewriting and
preinst/postinst setting logic. CLI-generated wizard fields and SDK-owned
validation, private atomic writes and retained-state lookup replace those
patches. The SDK owns incoming payload and DSM physical pkgvar timing. Previous
successful device flows remain historical evidence; the native-settings revision
receives a focused fresh-install/menu/unlock/upgrade/configuration-retention
check, explicitly using source overrides.

Registry diagnostics can report Docker Hub access denial while Container Manager
runs the pinned image from its existing configured mirror/cache. The build used
stored original manifest/config proofs after mirror DNS became unavailable;
SDK digest verification remained enabled. This does not prove fresh image pull
from every network or registry configuration.

Local verification includes SDK fast gate for the affected Go segment, final
runtime-setting tests, CLI build and affected launcher tests, App parser/runtime
requirements, and native SDK setting lifecycle / CLI SPK mutation tests. The published-version tests
remain distinguishable from source-override runs; full release gate and released
SPK acceptance are separate. Private logs/screenshots/session data are excluded
from the public repository.

Account deletion and deployment limits are in [framework-gaps](framework-gaps.md).

Native installation-settings follow-up: the focused source-override build was
fresh-installed through DSM's generated wizard, followed by automatic menu OIDC,
master-password creation, logout and a second menu login/unlock. SDK settings
in both the installed payload and retained App data were package-owned mode
0600 with identical content digests. The initial isolated development fixture
had a mismatched issuer port; it was corrected and rebuilt before the successful
fresh run. This was a test-fixture correction, not an upstream or App workaround.
The same revision upgraded from `1.37.4-0001` to `0002` without new wizard values;
all lifecycle hooks returned zero, the package reached running state, and both
0600 setting files retained their original digest. Owned test resources were
then removed and read back. Named-volume cleanup was an explicit administrative
fixture operation, not a claim that the product's delete-data choice erases
Container Manager volumes. The registry diagnostic still reported access denial
while the cached pinned image ran; fresh pulls remain a separate limitation.

## Released 0.22.0 candidate acceptance

The production `1.37.4-0002` SPK was built from the published dependency bytes:
CLI/templates/SDK/App 0.22.0, UI 0.12.5 and executor/v0.20.0. Check/build/inspect
passed with no findings. Production source and expanded-SPK public scans pass.

A fresh DSM 7.3.2 x86_64 installation used the generated native HTTPS-origin
setting. Native start and the DSM main-menu launcher reached upstream SSO
master-password setup. A master password was created and one encrypted login
item was saved and read back in the native Web Vault. Native stop/start
returned the package to running state. Official-client trusted TLS remains
unverified; the historical TLS limitation above is unchanged.

After native restart, a fresh upstream SSO flow required the master password.
Unlocking with that password displayed the saved encrypted login item.

Delete-data uninstall displayed COMPOSE_DATA_RETAINED. After package and
containers were absent, only the disposable acceptance volumes and upload
were removed separately; DSM package identity was retained.

## Released 0.25.0 security rebuild

Vaultwarden 1.37.4-0003 uses published SDK/App/CLI/templates 0.25.0.
CLI 0.25.0 retains the released executor/v0.24.0 mapping; no executor/v0.25.0
tag is assumed. The UI release set remains 0.14.0.

The Linux candidate passes check/build/inspect with findings=[] and all seven
package-owned Go executable entries report go1.26.10. The former
INSTALL_SETTINGS_INVALID and COMPOSE_ARTIFACT_INVALID findings from CLI 0.24.0
are resolved by the published CLI, with both the native diagnostic prefix and
installation settings hook retained. No generated scripts, published CLI files
or SPK members were edited. npm lockfile integrity is checked against official
registry metadata and downloaded tarballs. The official upstream image digest,
package name and existing display names are unchanged.

This is offline package verification only. No NAS tests, GitHub Release, catalog
update or publication is included. See security-rebuild.json for the exact SPK
SHA-256 and package-owned binary hashes.

## Released 0.28.0 rebuild (1.37.4-0005)

Vaultwarden 1.37.4-0005 uses published SDK/App/CLI/templates 0.28.0 with the
released executor/v0.27.0 mapping, UI 0.14.4 and go1.26.10, without source
overrides or Go replace. It picks up the SDK slow-NAS startup defaults
(generous health/readiness timing, Starting status in the UI, `/_spl/ping`
gateway liveness) and CLI 0.28.0's default 900s Compose startup budget.

Run on macOS (darwin/arm64) from `synology/` with `npm ci --ignore-scripts`:
`npm test` (6 pass), `npm run test:sdk` and `npm run test:requirements`
(gateway Go tests against SDK v0.28.0, all pass), `npx synopkgland check --json`
(ok), `npx synopkgland build --arch x86_64 --json` (ok, produced
SynoPkgVaultwarden-1.37.4-0005-x86_64.spk) and `npx synopkgland inspect`
(ok, findings=[]). The seven package-owned Go executable entries report
go1.26.10. The build was made on macOS rather than a Linux builder; the exact
SPK and binary hashes are in security-rebuild.json.

This is offline package verification only. No NAS tests, e2e suite, GitHub
Release, catalog update or publication is included.
