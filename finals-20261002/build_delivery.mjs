import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(root, 'slides.json'), 'utf8');
const data = JSON.parse(raw);
if (data.slides.length !== 11) throw new Error('Expected 11 slides.');
if (data.slides.reduce((sum,s)=>sum+s.duration,0) !== data.targetSeconds) throw new Error('Timing mismatch.');
const paragraphs = ['# 본선 발표 대본', '', '표지 포함 11장. 대본·시연 동작 약 9분 배분, 전환·호흡 여유 약 1분. 실제 발화 시간은 리허설로 확인합니다.', ''];
for(const s of data.slides){
  paragraphs.push(`## ${s.number === '00' ? '표지' : s.number + ' ' + s.kicker} · ${s.duration}초`, '', s.script, '', `진행 메모: ${s.cue}`, '');
}
paragraphs.push('## 출처', '', ...Object.values(data.sources).map(s=>s.url ? `- [${s.title}](${s.url}): ${s.detail}` : `- ${s.title}: ${s.detail}`));
writeFileSync(join(root, '발표대본.md'), paragraphs.join('\n'), 'utf8');
let html = readFileSync(join(root, 'index.template.html'), 'utf8');
html = html.replace('__SLIDES_JSON__', raw.replaceAll('</', '<\\/'));
writeFileSync(join(root, 'index.html'), html, 'utf8');
html = html.replace(/<link\b[^>]*href=["'](?:\.\/)?presentation\.css["'][^>]*>/g, ()=>`<style>${readFileSync(join(root,'presentation.css'),'utf8')}</style>`);
html = html.replace(/<script\b[^>]*src=["'](?:\.\/)?presentation\.js["'][^>]*>\s*<\/script>/g, ()=>`<script>${readFileSync(join(root,'presentation.js'),'utf8')}</script>`);
writeFileSync(join(root, '발표_오프라인.html'), html, 'utf8');
console.log(JSON.stringify({slides:data.slides.length,seconds:data.targetSeconds,scriptCharacters:data.slides.reduce((sum,s)=>sum+s.script.length,0),offlineBytes:Buffer.byteLength(html)}));
