"""Refresh manifests and archive the distributable package (without runtime or private work)."""
from pathlib import Path
import hashlib, json, zipfile, sys
root=Path(__file__).resolve().parent.parent
excluded={'node_modules','output','.git','__pycache__','.DS_Store'}
def files():
    return sorted(p for p in root.rglob('*') if p.is_file() and not any(x in excluded for x in p.relative_to(root).parts))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
assets=[{'path':str(p.relative_to(root)),'sha256':sha(p)} for p in files() if 'assets'==p.relative_to(root).parts[0] and p.name!='manifest.json']
(root/'assets/manifest.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n')
(root/'SHA256SUMS.json').write_text(json.dumps({str(p.relative_to(root)):sha(p) for p in files() if p.name!='SHA256SUMS.json'},ensure_ascii=False,indent=2)+'\n')
if len(sys.argv)>1:
    out=Path(sys.argv[1]).resolve();out.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
        for p in files(): z.write(p,root.name+'/'+str(p.relative_to(root)))
    with zipfile.ZipFile(out) as z: assert z.testzip() is None
    print(json.dumps({'archive':str(out),'files':len(files()),'bytes':out.stat().st_size,'sha256':sha(out)},indent=2))
