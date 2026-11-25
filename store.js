import {migrateLab} from './lab-model.js';
import { atlasSeed } from './atlas.js';
import { librarySeed } from './library.js';
export const storageKey = 'personal-life-os.workspace.v1';
export function today(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}
export function uid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Safari on a local HTTP origin exposes getRandomValues without randomUUID.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, n => n.toString(16).padStart(2,'0')).join('');
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function freshState() {
  const date = today();
  const rows = [
    ['整理春茶系列的商品图','p-tea','09:30','main',false],
    ['完成原创旋律的第一段草稿','p-music','14:00','main',false],
    ['整理 AI 自动化选题笔记','p-x','16:30','main',true],
    ['收藏一篇关于声音的文章','p-music','','side',false],
    ['准备明天的素材清单','p-red','','side',false]
  ];
  const tasks = rows.map(([title,projectId,time,priority,done],i) => ({
    id:'t-demo-'+(i+1), title,projectId,time,priority,done,date,source:'demo', originalText:title, revisions:[]
  }));
  const habits = [
    ['h-read','阅读几页书','读一页','book','sage'],
    ['h-move','舒展身体','伸展一分钟','activity','peach'],
    ['h-music','练习乐器','弹一个和弦','music','lilac']
  ].map(([id,title,minimum,glyph,tone],i) => ({id,title,minimum,glyph,tone,source:'demo',checks:i===0?{[date]:'normal'}:{}}));
  return {labRecords:[],schemaVersion:1,createdAt:new Date().toISOString(),...atlasSeed(date),...librarySeed(date),tasks,habits};
}
let memory;
let readError = '';
function readStored() {
  const raw = localStorage.getItem(storageKey);
  if (raw === null) return null;
  const obj = JSON.parse(raw);
  if (obj?.schemaVersion !== 1 || !['tasks','habits','projects','visions','entries','notes','trips','reviews'].every(k=>Array.isArray(obj[k]))) throw Error('资料格式无法识别');
  return migrateLab(obj);
}
export function readState() {
  try {
    const data=readStored();
    if (data) memory=data;
    else if (!memory) {
      memory=freshState();
      localStorage.setItem(storageKey,JSON.stringify(memory));
    }
    readError='';
  } catch {readError='本地资料暂时无法读取，已保留原有存储。';}
  memory ??= freshState();
  return memory;
}
export function storageWarning(){return readError;}
export function updateState(mutate) {
  // Read the latest snapshot before applying an intent from this tab.
  const latest = readStored() || memory || freshState();
  const next = structuredClone(latest);
  mutate(next);
  localStorage.setItem(storageKey, JSON.stringify(next));
  memory=next;
  readError='';
  return next;
}
export function rememberRevision(item) {
  const {revisions, ...previous} = item;
  (item.revisions ??= []).push({at:new Date().toISOString(),previous});
}

