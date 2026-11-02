import {expect, test, type Browser, type Page} from '@playwright/test';
import {readFileSync, realpathSync, statSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {isAbsolute, resolve} from 'node:path';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}; this suite requires an installed disposable package`);
  return value;
}
function privateFile(name: string): string {
  const file = required(name);
  const root = resolve(import.meta.dirname, '../../..');
  if (!isAbsolute(file) || (statSync(file).mode & 0o077) !== 0) {
    throw new Error(`${name} must be an absolute private file (mode 600)`);
  }
  if (realpathSync(file).startsWith(root + '/') && spawnSync('git', ['check-ignore', '--quiet', '--', file], {cwd: root}).status !== 0) {
    throw new Error(`${name} must be outside the repository or in an ignored private directory`);
  }
  return file;
}
async function session(browser: Browser, profile: string) {
  return browser.newContext({storageState: privateFile(profile), ignoreHTTPSErrors: process.env.VW_E2E_ALLOW_SELF_SIGNED === '1'});
}
function vaultURL(path: string): string {
  const base = required('VW_E2E_URL').replace(/\/$/, '') + '/';
  return new URL(path.replace(/^\//, ''), base).href;
}
async function fromMenu(page: Page): Promise<Page> {
  // Exercise the generated menu CGI without changing unrelated DSM first-login settings.
  const vault = await page.context().newPage();
  await vault.goto(new URL('/webman/3rdparty/SynoPkgVaultwarden/sso/open.cgi', required('DSM_E2E_URL')).href);
  await vault.waitForLoadState('domcontentloaded');
  expect(new URL(vault.url()).origin).toBe(new URL(required('VW_E2E_URL')).origin);
  return vault;
}

// Required behavior, not an assertion that the current proposal implements it.
// Use a fresh DSM account fixture that has no Vaultwarden account yet.
test('DSM menu -> native OIDC -> master password -> saved item -> logout/reopen/unlock', async ({browser}) => {
  const context = await session(browser, 'DSM_E2E_ADMIN_PROFILE');
  const master = readFileSync(privateFile('VW_E2E_MASTER_PASSWORD_FILE'), 'utf8').trim();
  if (master.length < 16) throw new Error('Use a generated disposable master password of at least 16 characters');
  try {
    const desktop = await context.newPage();
    const vault = await fromMenu(desktop);
    let hubPath = '';
    let hubFrames = 0;
    vault.on('websocket', socket => {
      const path = new URL(socket.url()).pathname;
      if (path !== new URL(vaultURL('/notifications/hub')).pathname) return;
      hubPath = path;
      socket.on('framereceived', () => { hubFrames++; });
    });
    // An upstream email/SSO form here means automatic menu entry is incomplete.
    const password = vault.locator('input[type=password]').nth(0);
    await expect(password).toBeVisible({timeout: 60_000});
    await password.fill(master);
    if (await vault.locator('input[type=password]').count() > 1) {
      await vault.locator('input[type=password]').nth(1).fill(master);
      await vault.getByRole('button', {name: 'Create account', exact: true}).click();
    } else {
      await expect(vault.getByRole('heading', {name: 'Your vault is locked', exact: true})).toBeVisible();
      await vault.getByRole('button', {name: 'Unlock', exact: true}).click();
    }
    const extension = vault.getByRole('button', {name:'Add it later',exact:true});
    await Promise.race([extension.waitFor({state:'visible'}),vault.getByRole('heading',{name:'All vaults',level:1,exact:true}).waitFor({state:'visible'})]);
    if(await extension.isVisible()) {
      await extension.click();
      await vault.getByRole('link',{name:'Skip to web app',exact:true}).click();
    }
    const skip=vault.getByRole('button',{name:'Skip',exact:true});
    if(await skip.isVisible()) await skip.click();
    await expect(vault.getByRole('heading',{name:'All vaults',level:1,exact:true})).toBeVisible();
    await expect.poll(() => hubPath).toBe(new URL(vaultURL('/notifications/hub')).pathname);
    await expect.poll(() => hubFrames).toBeGreaterThan(0);
    const label = 'DSM fixture ' + Date.now();
    const emptyVaultAction = vault.getByText('New item', {exact: true});
    if (await emptyVaultAction.isVisible()) {
      await emptyVaultAction.click();
    } else {
      await vault.getByRole('button', {name: 'New', exact: true}).click();
      await vault.getByRole('menuitem', {name: 'Login', exact: true}).click();
    }
    await vault.getByRole('textbox', {name: /Item name/}).fill(label);
    await vault.getByRole('textbox', {name: 'Username', exact: true}).fill('fixture-user');
    await vault.getByRole('textbox', {name: 'Password', exact: true}).fill('disposable-item-value');
    await vault.getByRole('button', {name: 'Save', exact: true}).click();
    await expect(vault.getByText('Item added', {exact: true})).toBeVisible();
    await vault.getByRole('dialog',{name:'View Login'}).getByRole('button',{name:'Close',exact:true}).click();
    await vault.locator('button').filter({has:vault.locator('svg text')}).click();
    await vault.getByRole('menuitem', {name: /Log out/}).click();
    const confirm=vault.getByRole('button',{name:'Yes',exact:true});
    if(await confirm.isVisible()) await confirm.click();
    await vault.close();
    const reopened = await fromMenu(desktop);
    await expect(reopened.getByRole('heading', {name: 'Your vault is locked'})).toBeVisible({timeout: 60_000});
    await reopened.locator('input[type=password]').fill(master);
    await reopened.getByRole('button', {name: 'Unlock', exact: true}).click();
    await expect(reopened.getByRole('row').filter({hasText: label})).toBeVisible();
    if (process.env.VW_E2E_PRIVATE_STATE) {
      await context.storageState({path: privateFile('VW_E2E_PRIVATE_STATE'), indexedDB: true});
      writeFileSync(privateFile('VW_E2E_PRIVATE_EVIDENCE'), JSON.stringify({savedItem: label, hubPath, hubFrames}, null, 2), {mode: 0o600});
      await reopened.screenshot({path: privateFile('VW_E2E_PRIVATE_SCREENSHOT'), fullPage: true});
    }
  } finally {await context.close();}
});

test('a DSM account without admission receives 403 at OIDC authorization', async ({browser}) => {
  const context = await session(browser, 'DSM_E2E_DENIED_PROFILE');
  try {
    const page = await context.newPage();
    const denied = page.waitForResponse(r => new URL(r.url()).pathname === new URL(vaultURL('/_sso/dsm-return')).pathname && r.status() === 403);
    await page.goto(vaultURL('/#/sso?identifier=00000000-01DC-01DC-01DC-000000000000'));
    expect((await denied).status()).toBe(403);
    await expect(page.getByTitle('All vaults', {exact: true})).toHaveCount(0);
  } finally {await context.close();}
});

test('native token API reaches Vaultwarden without DSM cookies or browser Origin', async ({request}) => {
  const response = await request.post(vaultURL('/identity/connect/token'), {
    form: {grant_type: 'password', username: 'fixture@dsm.invalid', password: 'fixture', client_id: 'web'},
  });
  expect(response.status()).toBe(400);
  expect(await response.text()).toContain('SSO sign-in is required');
});
