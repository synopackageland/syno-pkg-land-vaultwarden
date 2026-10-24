import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const manifest = readFileSync(new URL('../dsm-package.yaml', import.meta.url), 'utf8');

test('DOMAIN follows the external origin and keeps the install-time URL without one', () => {
  assert.match(manifest, /^ {12}DOMAIN: \{external_origin: true, setting: public_origin\}$/m);
  assert.match(manifest, /^ {4}public_origin: \{type: https-origin,.*required: true\}$/m);
});

test('Vaultwarden keeps one sign-in URL and confirms origin changes', () => {
  assert.match(manifest, /^ {2}external_access: \{connect: optional, origin_change: confirm, single_origin: true\}$/m);
});

test('Compose and gateway pin the same SDK release', () => {
  const pins = [...manifest.matchAll(/^ {2}sdk: (\S+)$/gm)].map(m => m[1]);
  assert.equal(pins.length, 2);
  assert.equal(pins[0], pins[1]);
});
