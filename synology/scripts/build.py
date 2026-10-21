#!/usr/bin/env python3
"""Build with the CLI, then add App-owned DSM install fields without changing SDK hooks."""
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
from package_wizard import extend_file

ROOT=Path(__file__).resolve().parents[1]
cli=os.environ.get('SYNOPKGLAND_CLI_BIN',str(ROOT/'node_modules/@synopackageland/cli/dist/bin.js'))
proofs=os.environ.get('SPL_COMPOSE_IMAGE_PROOFS')
if proofs:
    code="""
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const [root,cli,proofs]=process.argv.slice(1);
const {buildStandalone}=await import(pathToFileURL(join(dirname(cli),'standalone/build.js')));
const data=await buildStandalone({root,arches:['x86_64'],composeImageProofs:JSON.parse(readFileSync(proofs,'utf8'))});
console.log(JSON.stringify({ok:true,command:'build',data}));
"""
    result=json.loads(subprocess.check_output(['node','--input-type=module','-e',code,str(ROOT),cli,proofs],text=True))
else:
    result=json.loads(subprocess.check_output(['node',cli,'--project',str(ROOT),'build','--arch','x86_64','--json',*sys.argv[1:]],text=True))
for value in result['data']['outputs']:
    path=Path(value);tmp=path.with_suffix('.wizard.tmp')
    count=0
    with tarfile.open(path) as source,tarfile.open(tmp,'w',format=tarfile.PAX_FORMAT) as output:
        for member in source:
            data=source.extractfile(member).read() if member.isfile() else None
            if member.name.startswith('WIZARD_UIFILES/install_uifile') and data is not None:
                data=extend_file(Path(member.name).name,data.decode()).encode();member.size=len(data);count+=1
            output.addfile(member,io.BytesIO(data) if data is not None else None)
    if count==0:
        tmp.unlink();raise RuntimeError('No native install wizard found')
    tmp.replace(path)
    report=json.loads(subprocess.check_output(['node',cli,'inspect',str(path),'--json'],text=True))
    if not report['ok'] or report['data']['findings']:
        raise RuntimeError('The extended App SPK failed CLI inspection')
result['data']['appWizard']='vaultwarden-https-origin'
print(json.dumps(result))
