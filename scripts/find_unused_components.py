import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'src'

code_files = [p for p in ROOT.rglob('*') if p.suffix in ('.ts', '.tsx', '.js', '.jsx')]
component_files = [p for p in code_files if '/components/' in str(p).replace('\\\\','/')]

imports = set()
import_re = re.compile(r"from\s+['\"]([^'\"]+)['\"]")
require_re = re.compile(r"require\(['\"]([^'\"]+)['\"]\)")

for f in code_files:
    try:
        text = f.read_text(encoding='utf-8')
    except Exception:
        continue
    for m in import_re.findall(text):
        imports.add(m)
    for m in require_re.findall(text):
        imports.add(m)


def rel_key(p: Path):
    rel = str(p.relative_to(ROOT)).replace('\\\\','/')
    return re.sub(r'\.(ts|tsx|js|jsx)$', '', rel)

unused = []
for comp in component_files:
    key = rel_key(comp)
    base = os.path.basename(key)
    used = False
    for imp in imports:
        imp_norm = imp.replace('\\\\','/')
        if imp_norm.endswith('/' + key) or imp_norm.endswith(key) or ('/' + key) in imp_norm or ('@/' + key) in imp_norm or imp_norm.endswith('/' + base) or ('/' + base) in imp_norm:
            used = True
            break
    if not used:
        unused.append(str(comp.relative_to(ROOT)))

print('Found', len(component_files), 'component files.')
print('Possible unused components:')
for u in unused:
    print(u)
print('\nTotal unused:', len(unused))
