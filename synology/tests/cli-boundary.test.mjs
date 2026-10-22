import assert from 'node:assert/strict';
import {test} from 'node:test';
const {readIdentityGateway}=await import(process.env.SYNOPKGLAND_CLI_MODULE || '@synopackageland/cli/dist/standalone/identity-gateway.js');

const daemon = {targets: {}};
function parse(overrides = {}) {
  const diagnostics = [];
  const value = readIdentityGateway({
    sdk: '0.24.0', mode: 'oidc', upstream: 8080,
    listen: {https: 29443},
    oidc: {issuer_port: 29090, native_login: true,
      clients: [{id: 'vaultwarden', redirect_paths: ['/identity/connect/oidc-signin'], pkce: true}]},
    ...overrides,
  }, daemon, d => diagnostics.push(d), false, true);
  return {value, diagnostics};
}

test('positive control: ordinary OIDC is accepted with a DSM gate', () => {
  const {value, diagnostics} = parse({access: 'dsm-admins'});
  assert.deepEqual(diagnostics, []);
  assert.equal(value.access, 'dsm-admins');
});

test('omitting access still imposes DSM admission on native App requests', () => {
  const {value, diagnostics} = parse();
  assert.deepEqual(diagnostics, []);
  assert.equal(value.access, 'dsm-users');
});

test('blocker: native App admission plus the embedded OIDC provider is rejected', () => {
  const {value, diagnostics} = parse({access: 'public'});
  assert.equal(value, undefined);
  assert.equal(diagnostics[0].code, 'STANDALONE_IDENTITY_GATEWAY_INVALID');
  assert.match(diagnostics[0].message, /public \(none mode only\)/);
});

test('positive control: public native App admission is accepted only without OIDC', () => {
  const {value, diagnostics} = parse({mode: 'none', access: 'public', oidc: undefined});
  assert.deepEqual(diagnostics, []);
  assert.equal(value.access, 'public');
});

test('a root passthrough is not a supported provider-only configuration', () => {
  const {value, diagnostics} = parse({passthrough: ['/']});
  assert.equal(value, undefined);
  assert.match(diagnostics[0].message, /passthrough/);
});

test('provider-only OIDC keeps issuer admission while opening App transport', () => {
  const {value,diagnostics}=parse({access:'dsm-admins',upstream_access:'public',launch_path:'/#/sso?identifier=fixed'});
  assert.deepEqual(diagnostics,[]);
  assert.equal(value.access,'dsm-admins');
  assert.equal(value.upstream_access,'public');
});
