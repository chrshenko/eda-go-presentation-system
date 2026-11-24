"""Structural audit only; this does not prove visual quality or PowerPoint compatibility."""
import sys, json, zipfile, re
from xml.etree import ElementTree as ET
from pathlib import Path

def inspect(file):
    ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
    with zipfile.ZipFile(file) as z:
        names=z.namelist(); slides=sorted([n for n in names if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)],key=lambda n:int(re.search(r'(\d+)\.xml',n)[1]))
        rows=[]
        for name in slides:
            root=ET.fromstring(z.read(name))
            rows.append({'slide':int(re.search(r'(\d+)\.xml',name)[1]),'textObjects':len(root.findall('.//p:sp[p:txBody]',ns)),'texts':len(root.findall('.//a:t',ns)),'nativeTables':len(root.findall('.//a:tbl',ns)),'graphicFrames':len(root.findall('.//p:graphicFrame',ns)),'pictures':len(root.findall('.//p:pic',ns))})
        return {'file':Path(file).name,'slideCount':len(slides),'nativeChartParts':len([n for n in names if re.fullmatch(r'ppt/(?:slides/)?charts/chart\d+\.xml',n)]),'embeddedWorkbooks':len([n for n in names if n.startswith('ppt/embeddings/') and n.endswith('.xlsx')]),'fontNames':sorted(set(re.findall(r'typeface="([^"]+)"',''.join(z.read(n).decode('utf8') for n in slides)))),'slides':rows,'visualReview':'not assessed by this script'}

if __name__=='__main__':
    print(json.dumps(inspect(sys.argv[1]),ensure_ascii=False,indent=2))
