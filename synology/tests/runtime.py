#!/usr/bin/env python3
"""Bounded official-image probe. Not DSM/OIDC end-to-end acceptance."""
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

image = os.environ['SPL_TEST_IMAGE']
initializer = str(Path(os.environ['SPL_STORAGE_INIT']).resolve())
prefix = os.environ.get('SPL_RESOURCE_PREFIX', 'vaultwarden-proof')
if not prefix or any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in prefix):
    raise SystemExit('Invalid resource prefix')
name, volume = prefix + '-app', prefix + '-data'
def docker(*args):
    return subprocess.check_output(['docker', *args], text=True).strip()
def http(path, data=None):
    try:
        with urllib.request.urlopen(urllib.request.Request(base + path, data=data), timeout=3) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()

config = json.loads(docker('image', 'inspect', image))[0]['Config']
assert config['Labels']['org.opencontainers.image.revision'] == '7c188967e7a467b19b2757bc3326f9cf3ccae327'
results = {'upstream_revision_matches': True, 'dsm_tested': False, 'oidc_login_tested': False}
created_volume = False
created_container = False
try:
    # Never adopt or delete an existing resource with the requested name.
    for kind, target in [('container', name), ('volume', volume)]:
        if subprocess.run(['docker', kind, 'inspect', target], capture_output=True).returncode == 0:
            raise SystemExit('Fixture resource already exists')
    docker('volume', 'create', volume)
    created_volume = True
    env = {
        'ROCKET_ADDRESS': '0.0.0.0', 'ROCKET_PORT': '8080', 'DOMAIN': 'https://vault.example',
        'DATA_FOLDER': '/var/tmp/vaultwarden', 'SIGNUPS_ALLOWED': 'false', 'INVITATIONS_ALLOWED': 'false',
        'SSO_ENABLED': 'true', 'SSO_ONLY': 'true', 'SSO_SIGNUPS_ALLOWED': 'true',
        'SSO_SIGNUPS_MATCH_EMAIL': 'false', 'SSO_ALLOW_UNKNOWN_EMAIL_VERIFICATION': 'false',
        'SSO_AUTHORITY': 'http://127.0.0.1:29090', 'SSO_CLIENT_ID': 'vaultwarden',
        'SSO_CLIENT_SECRET': 'non-production-fixture', 'SSO_DEBUG_TOKENS': 'false',
    }
    args = ['run', '-d', '--name', name, '--user', '12345:12345', '--cap-drop', 'ALL',
            '--security-opt', 'no-new-privileges:true', '--read-only', '--tmpfs', '/tmp',
            '-p', '127.0.0.1::8080', '-v', volume + ':/var/tmp',
            '-v', initializer + ':/sdk-storage-init:ro', '--entrypoint', '/sdk-storage-init']
    for key, value in env.items():
        args += ['-e', key + '=' + value]
    args += [image, '--directories', '[{"base":"/var/tmp","path":"vaultwarden"}]', '--', '/vaultwarden']
    docker(*args)
    created_container = True
    port = docker('port', name, '8080/tcp').rsplit(':', 1)[1]
    base = 'http://127.0.0.1:' + port
    deadline = time.monotonic() + 45
    while True:
        try:
            if http('/alive')[0] == 200: break
        except (OSError, urllib.error.URLError): pass
        if time.monotonic() >= deadline: raise RuntimeError('Upstream readiness failed')
        time.sleep(.25)
    results['nonroot_readonly_health'] = True
    status, body = http('/')
    assert status == 200 and b'<head>' in body
    results['upstream_web_vault_served'] = True
    status, body = http('/admin')
    assert status == 200 and b'The admin panel is disabled' in body
    results['admin_disabled'] = True
    status, body = http('/identity/connect/token', urllib.parse.urlencode({
        'grant_type': 'password', 'username': 'fixture@dsm.invalid', 'password': 'fixture',
        'client_id': 'web', 'deviceIdentifier': 'fixture', 'deviceName': 'fixture', 'deviceType': '10',
    }).encode())
    assert status == 400 and b'SSO sign-in is required' in body, (status, body[:200])
    results['local_password_login_disabled'] = True
    request = urllib.request.Request(base + '/identity/accounts/register/send-verification-email', data=json.dumps({
        'email': 'fixture@dsm.invalid', 'name': 'Fixture',
    }).encode(), headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(request, timeout=3)
        raise AssertionError('Anonymous account creation succeeded')
    except urllib.error.HTTPError as error:
        body = error.read()
        assert error.code == 400 and b'Registration not allowed' in body, (error.code, body[:200])
    results['anonymous_signup_disabled'] = True
    docker('restart', name)
    # Data existence is checked independently of HTTP health and never called vault persistence.
    files = docker('exec', name, '/bin/sh', '-c', 'test -s /var/tmp/vaultwarden/db.sqlite3 && id -u')
    assert files == '12345'
    results['database_survives_container_restart'] = True
    print(json.dumps(results, indent=2))
finally:
    if created_volume:
        if created_container:
            subprocess.run(['docker', 'rm', '-fv', name], capture_output=True)
        subprocess.run(['docker', 'volume', 'rm', volume], capture_output=True)
        for kind, target in ([('container', name)] if created_container else []) + [('volume', volume)]:
            if subprocess.run(['docker', kind, 'inspect', target], capture_output=True).returncode == 0:
                raise RuntimeError('Fixture cleanup incomplete')
