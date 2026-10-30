import { appOpenSmoke } from '@synopackageland/cli/e2e';

// Upstream web vault after DSM OIDC sign-in: the master-password form
// (first sign-in sets it, later sign-ins unlock). The SSO start page has none.
appOpenSmoke({ ready: 'app-root input[type=password]' });
