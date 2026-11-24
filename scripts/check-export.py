"""Check embedded image decoding and PDF page count; visual review remains mandatory."""
import io, sys, json, zipfile
from pathlib import Path
from PIL import Image
from pypdf import PdfReader
from importlib.util import spec_from_file_location, module_from_spec
spec=spec_from_file_location('inspect_pptx',Path(__file__).with_name('inspect-pptx.py'))
mod=module_from_spec(spec);spec.loader.exec_module(mod)
result=mod.inspect(sys.argv[1]); images=[]
with zipfile.ZipFile(sys.argv[1]) as z:
    for name in z.namelist():
        if name.endswith(('.png','.jpg','.jpeg')):
            with Image.open(io.BytesIO(z.read(name))) as image:
                image.load();images.append({'name':name,'size':list(image.size)})
    if any(n.endswith('.svg') for n in z.namelist()):
        raise ValueError('SVG dependency in exported PPTX: use compatible raster assets')
assert images, 'No embedded images'
result['decodedImages']=images
result['pdfPages']=len(PdfReader(sys.argv[2]).pages)
assert result['slideCount']==result['pdfPages'], 'PDF/PPTX page count differs'
assert 'YS Display Cond Black' in result['fontNames'], 'Missing display font'
result['imageIntegrity']='passed';result['visualReview']='required separately'
print(json.dumps(result,ensure_ascii=False,indent=2))
