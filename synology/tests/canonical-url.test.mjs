import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {parse} from 'yaml';

const manifest = parse(readFileSync(new URL('../dsm-package.yaml', import.meta.url), 'utf8'));
const prefix = '/synopkgland/SynoPkgVaultwarden';
const runtime = manifest.compose.services.vaultwarden.storage_init.runtime;

test('native DOMAIN combines the retained DSM origin and package path in ENV_FILE', () => {
  assert.deepEqual(runtime.environment.VAULTWARDEN_ORIGIN, {external_origin: true, setting: 'public_origin'});
  assert.equal(runtime.environment.DOMAIN, undefined);
  assert.equal(manifest.install.settings.public_origin.type, 'https-origin');
  assert.match(runtime.files[0].content, /^DOMAIN=\$\{VAULTWARDEN_ORIGIN\}\/synopkgland\/SynoPkgVaultwarden$/m);
  assert.match(runtime.files[0].content, /^SSO_AUTHORITY=http:\/\/127\.0\.0\.1:\$\{SSO_ISSUER_PORT\}$/m);
});

test('DSM ingress removes the public listener and keeps only the native loopback issuer', () => {
  assert.deepEqual(manifest.identity_gateway.ingress, {path: prefix + '/'});
  assert.equal(manifest.identity_gateway.listen, undefined);
  assert.equal(manifest.identity_gateway.external_access, undefined);
  assert.equal(manifest.install.ports, true);
  assert.deepEqual(runtime.environment.SSO_ISSUER_PORT, {port: 'oidc_issuer'});
  assert.equal(manifest.compose.web.health.path, prefix + '/alive');
});

test('OIDC and native-client admission retain relative paths and administrator policy', () => {
  const gateway = manifest.identity_gateway;
  assert.equal(manifest.entry, 'admin-only');
  assert.equal(gateway.mode, 'oidc');
  assert.equal(gateway.access, 'dsm-admins');
  assert.equal(gateway.launch_path, '/#/sso?identifier=00000000-01DC-01DC-01DC-000000000000');
  assert.deepEqual(gateway.oidc.clients[0].redirect_paths, ['/identity/connect/oidc-signin']);
  assert.deepEqual(gateway.upstream_auth_paths, ['/api', '/identity/connect/token', '/identity/accounts', '/identity/sso', '/notifications', '/attachments', '/events', '/icons']);
});

test('Compose and gateway pin the same SDK release', () => {
  assert.equal(manifest.compose.sdk, manifest.identity_gateway.sdk);
  assert.equal(manifest.compose.sdk, '0.50.7');
});
