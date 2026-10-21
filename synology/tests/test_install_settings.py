import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('wizard',ROOT/'scripts/package_wizard.py')
wizard=importlib.util.module_from_spec(spec);spec.loader.exec_module(wizard)

class InstallSettings(unittest.TestCase):
    def test_wizard_preserves_consent_and_adds_origin(self):
        first={'step_title':'Consent','items':[{'desc':'Existing consent'}]}
        steps=json.loads(wizard.extend_file('install_uifile',json.dumps([first])))
        self.assertEqual(steps[0],first)
        field=steps[-1]['items'][1]['subitems'][0]
        self.assertEqual(field['key'],'pkgwizard_vaultwarden_origin')
        self.assertFalse(field['validator']['allowBlank'])

    def test_install_validates_and_upgrade_reuses_the_origin(self):
        with tempfile.TemporaryDirectory() as d:
            dest=Path(d)/'target';state=Path(d)/'state'
            (dest/'compose/settings').mkdir(parents=True);state.mkdir()
            env={**os.environ,'SYNOPKG_PKGINST_TEMP_DIR':str(dest),'SYNOPKG_PKGVAR':str(state)}
            for origin in ['http://vault.example:29443','https://vault.example:443','https://vault.example:29443/evil','https://a;touch bad:29443']:
                result=subprocess.run([ROOT/'dsm-scripts/preinst'],env={**env,'pkgwizard_vaultwarden_origin':origin},capture_output=True)
                self.assertNotEqual(result.returncode,0,origin)
            env['pkgwizard_vaultwarden_origin']='https://vault.example:29443'
            subprocess.run([ROOT/'dsm-scripts/preinst'],env=env,check=True)
            subprocess.run([ROOT/'dsm-scripts/postinst'],env={**env,'SYNOPKG_PKGDEST':str(dest)},check=True)
            del env['pkgwizard_vaultwarden_origin']
            subprocess.run([ROOT/'dsm-scripts/preinst'],env=env,check=True)
            file=dest/'compose/settings/public-origin.value'
            self.assertEqual(file.read_text(),'https://vault.example:29443')
            self.assertEqual(file.stat().st_mode&0o777,0o600)
            volume=Path(d)/'volume';retained=volume/'@appdata/SynoPkgVaultwarden'
            retained.mkdir(parents=True);(retained/'vaultwarden-origin').write_text('https://vault.example:29443')
            env['SYNOPKG_PKGVAR']=str(Path(d)/'missing-var-symlink')
            env['SYNOPKG_PKGDEST_VOL']=str(volume)
            subprocess.run([ROOT/'dsm-scripts/preinst'],env=env,check=True)
