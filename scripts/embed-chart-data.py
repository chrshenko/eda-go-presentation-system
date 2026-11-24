"""Embed literal brief data as editable XLSX snapshots. No external packages."""
import sys,json,zipfile,io,posixpath
from xml.etree import ElementTree as E
from xml.sax.saxutils import escape
from pathlib import Path
C='http://schemas.openxmlformats.org/drawingml/2006/chart'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
PR='http://schemas.openxmlformats.org/package/2006/relationships'
CT='http://schemas.openxmlformats.org/package/2006/content-types'
E.register_namespace('c',C);E.register_namespace('r',R)
def tag(t):return '{'+C+'}'+t
def xlsx(s):
    rows=[['Категория']+[x['name'] for x in s['series']]]+[[cat]+[x['values'][i] for x in s['series']] for i,cat in enumerate(s['categories'])]
    sheet=[]
    for i,row in enumerate(rows,1):
        cells=[]
        for j,v in enumerate(row):
            ref=chr(65+j)+str(i)
            cells.append(f'<c r="{ref}"><v>{v}</v></c>' if isinstance(v,(int,float)) else f'<c r="{ref}" t="inlineStr"><is><t>{escape(str(v))}</t></is></c>')
        sheet.append(f'<row r="{i}">'+''.join(cells)+'</row>')
    buf=io.BytesIO()
    with zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<Types xmlns="'+CT+'"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
        z.writestr('_rels/.rels','<Relationships xmlns="'+PR+'"><Relationship Id="rId1" Type="'+R+'/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        z.writestr('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="'+R+'"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels','<Relationships xmlns="'+PR+'"><Relationship Id="rId1" Type="'+R+'/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
        z.writestr('xl/worksheets/sheet1.xml','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+''.join(sheet)+'</sheetData></worksheet>')
    return buf.getvalue()
def ref(parent,kind,formula,values):
    parent.clear();r=E.SubElement(parent,tag(kind+'Ref'));E.SubElement(r,tag('f')).text=formula
    cache=E.SubElement(r,tag(kind+'Cache'))
    if kind=='num':E.SubElement(cache,tag('formatCode')).text='General'
    E.SubElement(cache,tag('ptCount'),val=str(len(values)))
    for i,v in enumerate(values):E.SubElement(E.SubElement(cache,tag('pt'),idx=str(i)),tag('v')).text=str(v)
def main(brief,pptx):
    specs=[s for s in json.loads(Path(brief).read_text())['slides'] if s['layout'] in ('bar','line-result')]
    with zipfile.ZipFile(pptx) as z:files={n:z.read(n) for n in z.namelist()}
    files={n:(b.replace(b"encoding='utf8'",b"encoding='utf-8'") if n.endswith(('.xml','.rels')) else b) for n,b in files.items()}
    parts=sorted([n for n in files if '/charts/chart' in n and n.endswith('.xml') and '/_rels/' not in n],key=lambda n:int(''.join(filter(str.isdigit,posixpath.basename(n)))))
    if len(parts)!=len(specs):raise ValueError('Chart count and brief do not match')
    types=E.fromstring(files['[Content_Types].xml'])
    if not any(x.get('Extension')=='xlsx' for x in types):E.SubElement(types,'{'+CT+'}Default',Extension='xlsx',ContentType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    for i,(part,s) in enumerate(zip(parts,specs),1):
        root=E.fromstring(files[part]);series=root.findall('.//'+tag('ser'))
        if len(series)!=len(s['series']):raise ValueError('Series count mismatch')
        count=len(s['categories'])
        for j,(ser,data) in enumerate(zip(series,s['series'])):
            col=chr(66+j)
            for key,kind,formula,values in [('tx','str',f'Data!${col}$1',[data['name']]),('cat','str',f'Data!$A$2:$A${count+1}',s['categories']),('val','num',f'Data!${col}$2:${col}${count+1}',data['values'])]:
                el=ser.find(tag(key))
                if el is None:el=E.SubElement(ser,tag(key))
                ref(el,kind,formula,values)
        book=f'ppt/embeddings/chart-data-{i:03}.xlsx';files[book]=xlsx(s)
        rel=posixpath.join(posixpath.dirname(part),'_rels',posixpath.basename(part)+'.rels')
        rels=E.fromstring(files[rel]) if rel in files else E.Element('{'+PR+'}Relationships')
        rid='rIdEditableData'
        for old in list(rels):
            if old.get('Id')==rid:rels.remove(old)
        E.SubElement(rels,'{'+PR+'}Relationship',Id=rid,Type=R+'/package',Target=posixpath.relpath(book,posixpath.dirname(part)))
        for old in root.findall(tag('externalData')):root.remove(old)
        ext=E.SubElement(root,tag('externalData'),{'{'+R+'}id':rid});E.SubElement(ext,tag('autoUpdate'),val='0')
        files[part]=E.tostring(root,encoding='utf-8',xml_declaration=True);files[rel]=E.tostring(rels,encoding='utf-8',xml_declaration=True)
    E.register_namespace('',CT)
    files['[Content_Types].xml']=E.tostring(types,encoding='utf-8',xml_declaration=True)
    temp=Path(str(pptx)+'.tmp')
    with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED) as z:
        for n,b in files.items():z.writestr(n,b)
    temp.replace(pptx)
    print(f'Embedded {len(parts)} editable chart workbooks')
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
