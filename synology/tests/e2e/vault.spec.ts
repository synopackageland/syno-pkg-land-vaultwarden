import {expect, test, type Browser, type Page} from '@playwright/test';
import {readFileSync, realpathSync} from 'node:fs';
import {isAbsolute, resolve} from 'node:path';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}; this suite requires an installed disposable package`);
  return value;
}
function privateFile(name: string): string {
  const file = required(name);
  const root = resolve(import.meta.dirname, '../../..');
  if (!isAbsolute(file) || realpathSync(file).startsWith(root + '/')) {
    throw new Error(`${name} must be an absolute path outside the package repository`);
  }
  return file;
}
async function session(browser: Browser, profile: string) {
  return browser.newContext({storageState: privateFile(profile)});
}
async function fromMenu(page: Page): Promise<Page> {
  await page.goto(required('DSM_E2E_URL'));
  await page.locator('#sds-desktop').waitFor({state: 'visible'});
  await page.locator('#sds-taskbar button.start-button-img').click();
  const opened = page.context().waitForEvent('page');
  await page.getByRole('menuitem', {name: 'Vaultwarden', exact: true}).click();
  const vault = await opened;
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
    // An upstream email/SSO form here means automatic menu entry is incomplete.
    const password = vault.getByRole('textbox', {name: 'Master password * (required)', exact: true});
    await expect(password).toBeVisible();
    await password.fill(master);
    await vault.getByRole('textbox', {name: 'Confirm master password * ('}).fill(master);
    await vault.getByRole('button', {name: 'Create account', exact: true}).click();
    await expect(vault.getByTitle('All vaults', {exact: true})).toBeVisible();
    const label = 'DSM fixture ' + Date.now();
    await vault.getByRole('button', {name: 'New item', exact: true}).click();
    await vault.getByRole('textbox', {name: 'Item name * (required)', exact: true}).fill(label);
    await vault.getByRole('textbox', {name: 'Username', exact: true}).fill('fixture-user');
    await vault.getByRole('textbox', {name: 'Password', exact: true}).fill('disposable-item-value');
    await vault.getByRole('button', {name: 'Save', exact: true}).click();
    await expect(vault.getByText('Item added', {exact: true})).toBeVisible();
    await vault.getByRole('button', {name: 'Close', exact: true}).click();
    await vault.getByRole('button', {name: /Account options/}).click();
    await vault.getByRole('menuitem', {name: /Log out/}).click();
    await vault.getByRole('button', {name: 'Yes', exact: true}).click();
    await vault.close();
    const reopened = await fromMenu(desktop);
    await expect(reopened.getByRole('heading', {name: 'Your vault is locked'})).toBeVisible();
    await reopened.getByLabel('Master password', {exact: true}).fill(master);
    await reopened.getByRole('button', {name: 'Unlock', exact: true}).click();
    await expect(reopened.getByRole('row').filter({hasText: label})).toBeVisible();
  } finally {await context.close();}
});

test('a DSM account without admission receives 403 at OIDC authorization', async ({browser}) => {
  const context = await session(browser, 'DSM_E2E_DENIED_PROFILE');
  try {
    const page = await context.newPage();
    await page.goto(required('VW_E2E_URL'));
    await page.locator('input[type=email].vw-email-sso').fill('denied@dsm.invalid');
    const denied = page.waitForResponse(r => new URL(r.url()).pathname === '/_sso/authorize' && r.status() === 403);
    await page.getByRole('button', {name: /Use single sign-on/}).click();
    expect((await denied).status()).toBe(403);
    await expect(page.getByTitle('All vaults', {exact: true})).toHaveCount(0);
  } finally {await context.close();}
});

test('native token API reaches Vaultwarden without DSM cookies or browser Origin', async ({request}) => {
  const response = await request.post(new URL('/identity/connect/token', required('VW_E2E_URL')).href, {
    form: {grant_type: 'password', username: 'fixture@dsm.invalid', password: 'fixture', client_id: 'web'},
  });
  expect(response.status()).toBe(400);
  expect(await response.text()).toContain('SSO sign-in is required');
});
