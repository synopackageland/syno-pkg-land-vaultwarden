#!/usr/bin/env python3
"""Scan wrapper files, text/history inputs and decoded SPK members before publishing."""
import argparse
import re
from pathlib import Path
import subprocess
import tarfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--denylist', required=True, type=Path)
parser.add_argument('--text', action='append', default=[], type=Path)
parser.add_argument('--history-base')
args = parser.parse_args()
parts = ['t-' + r'0[0-9]{3}', 'vt-' + 'nas', 'vt-' + '62', 'nas' + '96',
         'fran' + 'cis', 'sa' + '3400', 'sa' + '3200', 'new' + 'admin',
         'nor' + r'mal[1-3]', r'10' + r'\.17\.', 'vin' + 'centt', 'her' + 'dr',
         'ku' + 'ma', r'synology' + r'\.com', 'for' + 'ti']
pattern = re.compile('|'.join(parts), re.I)
deny = [line for line in args.denylist.read_bytes().splitlines() if line]
failed = []
count = 0
def scan(label, data):
    global count
    count += 1
    if pattern.search(data.decode('utf-8', errors='replace')) or any(item in data for item in deny):
        # Report only the file, never the matched private value.
        failed.append(label)
skip = {'node_modules', '.artifacts', '.e2e', '__pycache__', 'evidence'}
for path in root.rglob('*'):
    if any(part in skip for part in path.relative_to(root).parts):
        continue
    if path.is_symlink():
        failed.append(str(path.relative_to(root)) + ': symlink')
        continue
    if not path.is_file():
        continue
    label = str(path.relative_to(root))
    if path.suffix == '.spk':
        with tarfile.open(path) as archive:
            for member in archive:
                if member.isfile():
                    data = archive.extractfile(member).read()
                    scan(label + ':' + member.name, data)
                    if member.name == 'package.tgz':
                        import io
                        with tarfile.open(fileobj=io.BytesIO(data)) as payload:
                            for item in payload:
                                if item.isfile():
                                    scan(label + ':payload:' + item.name, payload.extractfile(item).read())
    else:
        scan(label, path.read_bytes())
for path in args.text:
    scan(path.name, path.read_bytes())
if args.history_base:
    def git(*argv):
        return subprocess.check_output(['git', *argv], cwd=root.parent)
    for commit in git('rev-list', args.history_base + '..HEAD').decode().splitlines():
        identity = git('show', '-s', '--format=%an <%ae>%n%cn <%ce>', commit).decode().splitlines()
        if any(value != 'synopackageland <synopackageland@gmail.com>' for value in identity):
            failed.append(commit[:12] + ': identity')
        scan(commit[:12] + ': message', git('show', '-s', '--format=%B', commit))
        for entry in git('ls-tree', '-rz', '--full-tree', commit, '--', 'synology/').split(b'\0'):
            if not entry: continue
            meta, name = entry.split(b'\t', 1)
            if meta.split()[1] == b'blob':
                scan(commit[:12] + ':' + name.decode(), git('cat-file', 'blob', meta.split()[2].decode()))
if failed:
    raise SystemExit('Public scan failed: ' + ', '.join(sorted(set(failed))))
print('Public scan passed: ' + str(count) + ' file/blob inputs.')
