import { appOpenSmoke } from '@synopackageland/cli/e2e';
import {readFileSync} from 'node:fs';
import {parse} from 'yaml';

const manifest = parse(readFileSync('dsm-package.yaml', 'utf8'));
const gateway = manifest.identity_gateway;

// Upstream web vault after DSM OIDC sign-in: the master-password form
// (first sign-in sets it, later sign-ins unlock). The SSO start page has none.
appOpenSmoke({
  entry: gateway.ingress.path.replace(/\/$/, '') + gateway.launch_path,
  ready: 'app-root input[type=password]',
});
