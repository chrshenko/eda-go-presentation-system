// Image-based PDF fallback. Uses the same rendered slide model; does not change PPTX.
export function pdfFromJpegs(images,width=1920,height=1080){
 const objects=[null,null],pageIds=[];
 for(const image of images){const page=objects.length+1,content=page+1,picture=page+2;pageIds.push(page);
  const w=width*.75,h=height*.75;
  objects.push(Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${picture} 0 R >> >> /Contents ${content} 0 R >>`));
  const c=Buffer.from(`q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`);objects.push(Buffer.concat([Buffer.from(`<< /Length ${c.length} >>\nstream\n`),c,Buffer.from('\nendstream')]));
  objects.push(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),image,Buffer.from('\nendstream')]));
 }
 objects[0]=Buffer.from('<< /Type /Catalog /Pages 2 0 R >>');objects[1]=Buffer.from(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(i=>i+' 0 R').join(' ')}] >>`);
 const chunks=[Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n','binary')],offsets=[0];let length=chunks[0].length;
 objects.forEach((o,i)=>{offsets.push(length);const b=Buffer.concat([Buffer.from(`${i+1} 0 obj\n`),o,Buffer.from('\nendobj\n')]);chunks.push(b);length+=b.length;});
 chunks.push(Buffer.from(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF`));return Buffer.concat(chunks);
}
