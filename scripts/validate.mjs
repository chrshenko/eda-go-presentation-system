import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const layouts = ['cover','section','agenda','metrics3','grid6','comparison','timeline','table','bar','text-photo','photo-kpi','screenshots','gallery','final','section-yellow','schedule','kpi-grid','product','theses','line-result'];
const limits = {agenda:[1,6],metrics3:[3,3],grid6:[6,6],comparison:[2,2],timeline:[2,4],screenshots:[1,5],gallery:[1,3],schedule:[1,6],'kpi-grid':[4,4],theses:[1,3]};
export function validate(deck, root=process.cwd()) {
  const errors=[];
  if (!deck || !Array.isArray(deck.slides) || !deck.slides.length) return ['Нужен непустой массив slides'];
  if(deck.slides.length>100) errors.push('Не более 100 слайдов за одну сборку');
  deck.slides.forEach((s,i)=>{
    const at=`Слайд ${i+1} (${s.layout})`;
    if(!layouts.includes(s.layout)) errors.push(`${at}: неизвестный макет`);
    if(typeof s.title!=='string'||!s.title.trim()) errors.push(`${at}: нужен title`);
    const max=['cover','section','section-yellow','final'].includes(s.layout)?40:65;
    if(s.title?.length>max) errors.push(`${at}: заголовок длиннее ${max} символов — сократите или разделите слайд`);
    if((s.subtitle?.length??0)>150) errors.push(`${at}: слишком длинный подзаголовок`);
    if(limits[s.layout]){const [a,b]=limits[s.layout],n=s.items?.length??0;if(n<a||n>b)errors.push(`${at}: items должен содержать ${a}–${b} элементов`);}
    if(['text-photo','photo-kpi','product'].includes(s.layout) && (s.items?.length??0)>4) errors.push(`${at}: максимум 4 тезиса`);
    for(const [j,it]of (s.items??[]).entries()){
      if(typeof it!=='object'||!it) {errors.push(`${at}: items[${j}] должен быть объектом`);continue;}
      if((it.title?.length??0)>65) errors.push(`${at}, блок ${j+1}: слишком длинный заголовок`);
      if(s.layout==='grid6'&&(it.body?.length??0)>100)errors.push(`${at}, блок ${j+1}: описание grid6 длиннее 100 символов`);
      if(it.valueFontSize!==undefined&&![104,132].includes(it.valueFontSize))errors.push(`${at}, блок ${j+1}: valueFontSize допускает 104 или 132`);
      if((it.body?.length??0)>210) errors.push(`${at}, блок ${j+1}: текст длиннее 210 символов`);
      if((it.value?.toString().length??0)>12)errors.push(`${at}, блок ${j+1}: слишком длинное значение`);
      if(it.image&&!fs.existsSync(path.resolve(root,it.image))) errors.push(`${at}: нет файла ${it.image}`);
    }
    if(s.image&&!fs.existsSync(path.resolve(root,s.image))) errors.push(`${at}: нет файла ${s.image}`);
    if(s.layout==='table'){
      if(!Array.isArray(s.headers)||s.headers.length<2||s.headers.length>5)errors.push(`${at}: нужно 2–5 заголовков таблицы`);
      if(!Array.isArray(s.rows)||s.rows.length<1||s.rows.length>7)errors.push(`${at}: нужно 1–7 строк`);
      for(const row of s.rows??[])if(row.length!==s.headers?.length)errors.push(`${at}: число ячеек не совпадает с заголовками`);
    }
    if(['bar','line-result'].includes(s.layout)){
      const n=s.categories?.length??0;
      if(n<2||n>6) errors.push(`${at}: нужно 2–6 категорий графика`);
      if(!s.series?.length||s.series.length>3) errors.push(`${at}: нужно 1–3 серии`);
      for(const ser of s.series??[]){if(!ser.name||ser.values?.length!==n||ser.values.some(v=>typeof v!=='number'||!Number.isFinite(v)))errors.push(`${at}: некорректные данные серии`);}
    }
    if(s.growth){const {from,to,percent}=s.growth;if(!Number.isFinite(from)||!Number.isFinite(to)||from===0||Math.abs((to/from-1)*100-percent)>0.6)errors.push(`${at}: процент роста не соответствует исходным значениям`);}
  });
  return errors;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const file=process.argv[2]; if(!file){console.error('Использование: node scripts/validate.mjs brief.json');process.exit(2);}
  const errors=validate(JSON.parse(fs.readFileSync(file,'utf8')));
  if(errors.length){console.error(errors.join('\n'));process.exit(1);}console.log('Бриф прошёл структурную проверку. Визуальная проверка обязательна после сборки.');
}
