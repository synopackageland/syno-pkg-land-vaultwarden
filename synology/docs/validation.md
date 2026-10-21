# Development validation

Status: development review; all device artifacts use explicit SDK/CLI source
overrides and must not be published. Published dependency pins stay at 0.21.0
until a compatible framework release is approved and retested.

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

Installation experiments exposed two App-hook lifecycle assumptions: preinst
uses the incoming payload directory, and the retained pkgvar symlink can be
absent during upgrade. The hooks now use the documented incoming directory and
the selected volume's exact retained App-data path. A failed upgrade also left
an owned stopped Container Manager project entry, which required explicit
administrative recovery before retry. No shared project was changed. Successful
final upgrade is distinct from that recovery evidence.

Registry diagnostics can report Docker Hub access denial while Container Manager
runs the pinned image from its existing configured mirror/cache. The build used
stored original manifest/config proofs after mirror DNS became unavailable;
SDK digest verification remained enabled. This does not prove fresh image pull
from every network or registry configuration.

Local verification includes SDK fast gate for the affected Go segment, final
runtime-setting tests, CLI build and affected launcher tests, App parser/runtime
requirements, and native installer input tests. The published-version tests
remain distinguishable from source-override runs; full release gate and released
SPK acceptance are separate. Private logs/screenshots/session data are excluded
from the public repository.

Account deletion and deployment limits are in [framework-gaps](framework-gaps.md).
