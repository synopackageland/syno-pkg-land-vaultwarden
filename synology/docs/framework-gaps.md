# Framework and upstream boundaries

- Published 0.21.x does not provide provider-only OIDC, a fixed fragment launcher
  and installation settings together. Development acceptance uses explicit
  SDK/CLI sources. Retest the released combination before changing pins.
- Account deletion: upstream exposes `POST /admin/users/<id>/delete`, but it is
  registered only with an ADMIN_TOKEN. Enabling that token also enables `/admin`,
  conflicting with this package's disabled-admin boundary. The disabled mode has
  no supported service credential scoped to an SSO issuer/sub deletion. The
  self-service account deletion endpoint requires the user's master-password
  proof, which DSM authentication does not supply. No adapter is installed;
  do not match users by email, write the upstream database, retain master
  passwords, or add a privileged watcher as a substitute. A future contract
  needs upstream-supported restricted deletion authorization and stable-sub
  lookup. Existing App sessions/offline encrypted data are independently scoped.
- Container Manager data volumes remain after uninstall, including delete-data.
  The package account cannot delete those volumes; the native wizard must state
  retention. Administrative cleanup is separate from product uninstall behavior.
- Native SDK installation settings replace App wizard/lifecycle patches. The
  SDK owns validation, 0600 atomic files, upgrade/reinstall retention and
  fail-closed admission; no App-side retained-path fallback remains.
- The HTTPS origin wizard currently accepts a DNS hostname or IPv4 with the
  declared gateway port. IPv6 literals, a separate reverse-proxy hostname and
  subpaths need additional acceptance. Certificate trust is deployment-owned.
