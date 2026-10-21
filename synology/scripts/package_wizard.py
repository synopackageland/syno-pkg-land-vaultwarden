"""App-owned native DSM fields, appended to the CLI's generated consent wizard."""
import json
import re

def extend_steps(steps, chinese=False):
    title = 'HTTPS 網址' if chinese else 'HTTPS origin'
    desc = ('輸入開啟 DSM 時使用的主機名稱，使用 https 及 App 的 29443 連接埠。需要相符且受信任的憑證。主密碼仍用於解鎖保險庫。'
            if chinese else 'Use the hostname used to open DSM, HTTPS and App port 29443. A matching trusted certificate is required. A master password still unlocks the vault.')
    return [*steps, {'step_title': title, 'items': [
        {'desc': desc}, {'type': 'textfield', 'desc': title, 'subitems': [{
            'key': 'pkgwizard_vaultwarden_origin', 'desc': 'https://hostname:29443',
            'defaultValue': '', 'validator': {'allowBlank': False,
                'regex': {'expr': '/^https:\\/\\/[A-Za-z0-9][A-Za-z0-9.-]*:29443$/',
                          'errorText': 'Use https://hostname:29443'}}}]}]}]

def extend_file(name, data):
    chinese = '_cht' in name
    if name.endswith('.sh'):
        pattern = r"(cat <<'SYNOPKGLAND_WIZARD'\n)(.*?)(\nSYNOPKGLAND_WIZARD)"
        def replace(match):
            return match[1] + json.dumps(extend_steps(json.loads(match[2]), chinese), ensure_ascii=False, indent=2) + match[3]
        result, count = re.subn(pattern, replace, data, flags=re.S)
        if count != 2:
            raise ValueError('The generated install wizard changed; review the App extension')
        return result
    return json.dumps(extend_steps(json.loads(data), chinese), ensure_ascii=False, indent=2) + '\n'
