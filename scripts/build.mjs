import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { validate } from './validate.mjs';
import { pdfFromJpegs } from './pdf-images.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let runtime;
try { runtime=await import('@oai/artifact-tool'); }
catch { if(process.env.ARTIFACT_TOOL_PATH) runtime=await import(pathToFileURL(process.env.ARTIFACT_TOOL_PATH).href); else throw Error('Нужен @oai/artifact-tool из среды Codex. См. SETUP.md.'); }
const {Presentation,PresentationFile}=runtime;
const tokens=JSON.parse(await fs.readFile(path.join(ROOT,'presentation.tokens.json'),'utf8'));
const C=tokens.colors,F=tokens.fonts;
// Register the exact font files for rendering; installed family aliases vary by OS.
const require=createRequire(import.meta.url);
const artifactEntry=process.env.ARTIFACT_TOOL_PATH??require.resolve('@oai/artifact-tool');
const {FontLibrary,Canvas,loadImage}=createRequire(artifactEntry)('skia-canvas');
FontLibrary.use(F.display,[path.join(ROOT,'fonts/YS Display Cond-Black.ttf')]);
FontLibrary.use(F.body,[path.join(ROOT,'fonts/YS Text-Regular.ttf')]);
FontLibrary.use(F.medium,[path.join(ROOT,'fonts/YS Text-Medium.ttf')]);
const input=process.argv[2],out=path.resolve(process.argv[3]??'output/presentation');
if(!input)throw Error('Использование: node scripts/build.mjs brief.json output/name');
const deck=JSON.parse(await fs.readFile(input,'utf8')),errors=validate(deck,ROOT);
if(errors.length)throw Error(errors.join('\n'));
const presentation=Presentation.create({slideSize:{width:1920,height:1080}});
presentation.theme.defaultFont=F.body;
presentation.theme.colorScheme={name:'Еда в Яндекс Go',themeColors:{accent1:C.yellow,accent2:C.gray400,accent3:C.gray700,accent4:C.ink,accent5:C.gray100,accent6:C.white,bg1:C.white,bg2:C.gray100,tx1:C.ink,tx2:C.gray700,dk1:C.ink,dk2:C.gray700,lt1:C.white,lt2:C.gray100,hlink:C.ink,folHlink:C.gray700}};
const NONE={fill:'none',width:0,style:'solid'};
let slide, evidence=[];
function box(name,x,y,w,h,fill=C.gray100,r=24,stroke=null){return slide.shapes.add({name,geometry:r?'roundRect':'rect',position:{left:x,top:y,width:w,height:h},fill,line:stroke?{fill:stroke,width:5,style:'solid'}:NONE,borderRadius:r});}
function text(name,s,x,y,w,h,size=28,display=false,color=C.ink,align='left',lineSpacing=null){
 const v=slide.shapes.add({name,geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:NONE});
 v.text=String(s??'');v.text.style={typeface:display?F.display:F.body,fontSize:size,color,alignment:align,verticalAlignment:'top',wrap:'square',autoFit:'none',insets:0,lineSpacing:lineSpacing??(display?1:1.2)};
 evidence.push({slide:presentation.slides.items.length,name,text:String(s??''),x,y,w,h,size});return v;
}
function heading(s,subtitle=s.subtitle){const h=s.title.includes('\n')?200:120;text('Заголовок',s.title,60,60,1510,h,88,true);if(subtitle)text('Подзаголовок',subtitle,60,60+h+16,1550,90,32);}
async function image(src,x,y,w,h,r=24,alt='Фото'){
 if(!src){box('Заглушка',x,y,w,h,C.gray400,r);text('Место для фото','МЕСТО\nДЛЯ ФОТО',x+24,y+h/2-70,w-48,150,44,true,C.white,'center');return;}
 const buf=await fs.readFile(path.resolve(ROOT,src));const ext=path.extname(src).toLowerCase();
 return slide.images.add({name:alt,blob:buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),contentType:ext==='.svg'?'image/svg+xml':ext==='.png'?'image/png':'image/jpeg',alt,fit:'cover',position:{left:x,top:y,width:w,height:h},geometry:'roundRect',borderRadius:r});
}
async function brand(x=1663,y=60,w=197,h=47,dark=false){await image(`assets/brand/logo-${dark?'yellow':'dark'}.png`,x,y,w,h,0,'Яндекс Go');}
function badge(s,x,y,w=null,fill=C.yellow){w??=Math.max(72,32+String(s).length*15);box('Плашка',x,y,w,56,fill,16);text('Текст плашки',s,x+16,y+10,w-32,38,28,true,fill===C.ink?C.white:C.ink);}
function hero(s,x,y,w,color=C.ink){String(s).split('\n').forEach((line,i)=>text('Крупный заголовок',line,x,y+i*176,w,230,208,true,color));}
function metric(it,x,y,w=570,h=610,fill=C.ink){box('Карточка показателя',x,y,w,h,fill,32);const col=fill===C.ink?C.white:C.ink;text('Показатель',it.value,x+36,y+30,w-72,180,it.valueFontSize??132,true,col);text('Название показателя',it.title,x+36,y+h-190,w-72,94,42,true,col);text('Контекст',it.body,x+36,y+h-82,w-72,64,28,false,col);}
function thesis(it,x,y,w=780){text('Тезис',it.title,x,y,w,90,42,true);text('Описание',it.body,x,y+104,w,150,28);}
function phone(x,y,w,h){box('Рамка скриншота',x,y,w,h,C.ink,48);box('Экран',x+10,y+10,w-20,h-20,C.gray400,38);text('Место для скриншота','МЕСТО ДЛЯ\nСКРИНШОТА',x+24,y+h/2-75,w-48,150,36,true,C.white,'center');}
function chart(s,x,y,w,h,type='bar'){
 const result=slide.charts.add(type,{name:'Редактируемая диаграмма',position:{left:x,top:y,width:w,height:h},categories:s.categories,series:s.series.map((q,i)=>({name:q.name,values:q.values,fill:[C.yellow,C.gray400,C.gray700][i],line:{fill:[C.yellow,C.gray400,C.gray700][i],width:4}})),hasLegend:true,legend:{position:'top',textStyle:{typeface:F.body,fontSize:24}},barOptions:{direction:'column',grouping:'clustered',gapWidth:100},xAxis:{textStyle:{typeface:F.body,fontSize:24}},yAxis:{textStyle:{typeface:F.body,fontSize:22},majorGridlines:{fill:C.gray400,width:1,style:'solid'}},dataLabels:{showValue:true,position:type==='bar'?'outEnd':'top',textStyle:{typeface:F.body,fontSize:22}},chartFill:C.white,plotAreaFill:C.white});
 return result;
}
for(const s of deck.slides){
 slide=presentation.slides.add();slide.background.fill=C.white;const items=s.items??[];
 switch(s.layout){
 case 'cover':
  slide.background.fill=C.yellow;await brand(60,60,720,172);await image('assets/brand/spiral-dark.png',1040,200,1095,1222,0,'Фирменная спираль');hero(s.title,60,550,900);text('Подпись',s.subtitle,60,980,940,40,28);break;
 case 'section':case 'section-yellow':
  slide.background.fill=s.layout==='section'?C.ink:C.yellow;hero(s.title,60,550,1600,s.layout==='section'?C.yellow:C.ink);break;
 case 'final':
  slide.background.fill=C.yellow;await brand(60,60,720,172);text('Финал',s.title,60,814,1600,220,208,true);break;
 case 'agenda':
  heading(s);await brand();items.forEach((it,i)=>{const x=60+(i%2)*870,y=350+Math.floor(i/2)*220;box('Номер',x,y,112,112,i===3?C.yellow:C.ink,56);text('Номер',String(i+1).padStart(2,'0'),x,y+24,112,70,42,true,i===3?C.ink:C.white,'center');text('Пункт',it.title,x+140,y+10,650,120,40);});break;
 case 'metrics3':heading(s);items.forEach((it,i)=>metric(it,60+i*612,350,576,610,i===2?C.yellow:C.ink));break;
 case 'grid6':heading(s);items.forEach((it,i)=>{const x=60+(i%3)*612,y=270+Math.floor(i/3)*370,fill=i===2?C.yellow:C.ink,col=i===2?C.ink:C.white;box('Направление',x,y,576,345,fill);text('Номер',String(i+1).padStart(2,'0'),x+30,y+20,200,110,96,true,col);text('Направление',it.title,x+30,y+145,516,65,42,true,col);text('Описание',it.body,x+30,y+220,516,110,28,false,col,'left',1);});break;
 case 'comparison':
  box('Правая половина',960,0,960,1080,C.yellow,0);heading(s);items.forEach((it,i)=>{const x=60+i*960;text('Заголовок колонки',it.title,x,290,820,100,48,true);(it.steps??[it.body]).forEach((v,j)=>{badge(String(j+1).padStart(2,'0'),x,450+j*125,72,i===0?C.yellow:C.ink);text('Шаг',v,x+105,450+j*125,700,100,28);});});break;
 case 'timeline':
  heading(s);await brand();box('Ось времени',60,570,1800,3,C.gray700,0);items.forEach((it,i)=>{const x=60+i*450;badge(it.value,x,544,200,i===2?C.yellow:C.ink);thesis(it,x,330,400);});if(s.body)text('Вывод',s.body,60,860,1800,110,32);break;
 case 'table':{
  heading(s);await brand();const n=s.headers.length,m=s.rows.length,table=slide.tables.add({rows:m+1,columns:n,left:60,top:320,width:1800,height:Math.min(660,(m+1)*86),values:[s.headers,...s.rows],columnWidths:[600,...Array(n-1).fill(1200/(n-1))]});
  for(let r=0;r<=m;r++)for(let c=0;c<n;c++){const cell=table.getCell(r,c);cell.fill=r===0?C.ink:(r%2?C.white:C.gray100);cell.text.style={typeface:r===0?F.medium:F.body,fontSize:28,color:r===0?C.white:C.ink,insets:16};}break;}
 case 'bar':heading(s);await brand();chart(s,60,310,1800,650);if(s.unit)text('Единицы',s.unit,60,265,400,32,22,false,C.gray700);break;
 case 'line-result':heading(s);chart(s,60,330,1210,620,'line');box('Вывод',1320,260,540,700,C.gray100);badge(s.value??'ИТОГ',1352,292);text('Вывод',s.body,1352,420,476,420,48,true);break;
 case 'text-photo':
  heading(s);await image(s.image,1120,60,740,960);items.forEach((it,i)=>{badge(String(i+1).padStart(2,'0'),60,430+i*175,72);text('Тезис',it.title,170,430+i*175,840,70,42,true);text('Описание',it.body,170,505+i*175,840,80,28);});break;
 case 'photo-kpi':
  slide.background.fill=C.ink;text('Заголовок',s.title,60,60,1000,190,88,true,C.yellow);text('Подзаголовок',s.subtitle,60,285,1000,130,40,false,C.yellow);await image(s.image,1120,60,740,960);items.slice(0,2).forEach((it,i)=>{const x=60+i*530;text('Показатель',it.value,x,510,500,170,132,true,C.yellow);text('Название',it.title,x,685,500,100,42,true,C.yellow);text('Описание',it.body,x,825,500,110,28,false,C.yellow);});break;
 case 'screenshots':
  heading(s);{const w=(1800-(items.length-1)*36)/items.length;items.forEach((it,i)=>{const x=60+i*(w+36);text('Подпись экрана',it.title,x,290,w,100,28);phone(x,420,w,600);});}break;
 case 'gallery':
  heading(s);{const w=(1800-(items.length-1)*24)/items.length;for(const [i,it] of items.entries()){const x=60+i*(w+24);await image(it.image,x,280,w,560);text('Название фото',it.title,x,875,w,65,42,true);text('Подпись фото',it.body,x,950,w,70,28);}}break;
 case 'schedule':
  text('Заголовок',s.title,60,60,940,120,88,true);badge(s.subtitle??'ПРОГРАММА',60,220,390);await image(s.image,1100,60,760,960);items.forEach((it,i)=>{const y=380+i*105;text('Время',it.value,60,y,300,70,42,true);text('Событие',it.title,390,y+5,640,65,28);if(i<items.length-1)box('Разделитель',60,y+83,970,1,C.gray400,0);});break;
 case 'kpi-grid':
  heading(s);items.forEach((it,i)=>{const x=60+(i%2)*500,y=300+Math.floor(i/2)*360;box('Показатель',x,y,476,330);text('Значение',it.value,x+30,y+24,416,155,132,true);text('Название',it.title,x+30,y+210,416,90,32);});box('Главный показатель',1080,300,780,690,C.yellow);text('Ключевой показатель',s.value,1120,500,700,200,208,true);text('Пояснение',s.body,1120,750,700,180,40);break;
 case 'product':
  heading(s);phone(1260,60,600,1300);items.forEach((it,i)=>{const x=60+(i%2)*560,y=390+Math.floor(i/2)*340;box('Акцент',x,y,36,8,C.yellow,4);thesis(it,x,y+40,510);});break;
 case 'theses':
  heading(s);await brand();items.forEach((it,i)=>{const y=330+i*230;text('Тезис',it.title,60,y,620,120,60,true);text('Объяснение',it.body,740,y+10,1120,150,28);if(i<items.length-1)box('Разделитель',60,y+185,1800,1,C.gray400,0);});break;
 }
 slide.speakerNotes.text=`Макет: ${s.layout}. Источник шаблона: Figma ${tokens.provenance.figmaFile}.\n${s.source??'Демонстрационные данные — заменить перед внешним использованием.'}`;
}
await fs.mkdir(path.dirname(out),{recursive:true});await fs.mkdir(`${out}-previews`,{recursive:true});
// Reject broken brand assets before exporting; SVG is retained only as an editable source.
for(const [file,w,h] of [['logo-dark.png',1440,344],['logo-yellow.png',1440,344],['spiral-dark.png',2190,2444]]){const img=await loadImage(await fs.readFile(path.join(ROOT,'assets/brand',file)));if(img.width!==w||img.height!==h)throw Error(`Неверный размер брендового изображения: ${file}`);}
const measure=new Canvas(8,8).getContext('2d');
const fitErrors=[];
for(const e of evidence){
 const layout=deck.slides[e.slide-1].layout;
 if(!((layout==='grid6'&&['Направление','Описание'].includes(e.name))||(layout==='metrics3'&&e.name==='Показатель')))continue;
 measure.font=`${e.size}px \"${e.name==='Описание'?F.body:F.display}\"`;
 let lines=0,maxWidth=0;for(const para of e.text.split('\n')){let line='';for(const word of para.split(/\s+/)){const next=line?line+' '+word:word;if(measure.measureText(next).width>e.w&&line){lines++;line=word;}else line=next;maxWidth=Math.max(maxWidth,measure.measureText(word).width);}lines++;}
 const maxLines=layout==='metrics3'?1:Math.floor(e.h/e.size);
 if(lines>maxLines||maxWidth>e.w)fitErrors.push(`Слайд ${e.slide}, ${e.name}: текст не помещается. Сократите текст или выберите другой макет.`);
}
if(fitErrors.length)throw Error(fitErrors.join('\n'));
const pptx=await PresentationFile.exportPptx(presentation);await pptx.save(`${out}.pptx`);
execFileSync(process.env.PYTHON_BIN??'python3',[path.join(ROOT,'scripts/embed-chart-data.py'),path.resolve(input),`${out}.pptx`],{stdio:'pipe'});
for(const [i,s]of presentation.slides.items.entries()){
 const png=await presentation.export({slide:s,format:'png',scale:0.5});await fs.writeFile(`${out}-previews/${String(i+1).padStart(2,'0')}.png`,new Uint8Array(await png.arrayBuffer()));
}
let pdfEngine='artifact-tool';
try { await fs.writeFile(`${out}.pdf`,new Uint8Array(await (await presentation.export({format:'pdf'})).arrayBuffer())); }
catch(error) {
  pdfEngine='Image-based PDF from the same slide model (1920x1080)';
  console.warn('Vector PDF export unavailable; preserving exact fonts in an image-based PDF.');
  const images=[];for(const s of presentation.slides.items)images.push(Buffer.from(await (await presentation.export({slide:s,format:'jpeg',scale:1})).arrayBuffer()));
  await fs.writeFile(`${out}.pdf`,pdfFromJpegs(images));
}
await fs.writeFile(`${out}.geometry.json`,JSON.stringify(evidence,null,2));
await fs.writeFile(`${out}.receipt.json`,JSON.stringify({createdAt:new Date().toISOString(),input:path.basename(input),slideCount:deck.slides.length,layouts:deck.slides.map(s=>s.layout),fonts:F,source:tokens.provenance,pdfEngine,structuralValidation:'passed',visualReview:'required',outputs:[`${out}.pptx`,`${out}.pdf`]},null,2));
console.log(`Создано ${deck.slides.length} слайдов: ${out}.pptx и ${out}.pdf. Проверьте PNG-превью.`);
