import {today} from './store.js';
import {reviseLibraryItem} from './library.js';

export function writeNote(state,body,id,day){
  if(!body.trim())throw Error('先写一点内容。');
  const title=noteTitle(body);
  state.entries.unshift(reviseLibraryItem(null,{id,body,title,quickCapture:true,date:day,category:'每日日记',links:[],media:[]}));
}
export function questionFor(body){
  if(/旋律|音乐|和弦|编曲|歌词|节奏/.test(body))return '如果现在只能留下十秒，你最想保留哪个声音？';
  if(/用户|顾客|客户|茶样|销量|买家/.test(body))return '哪一句用户原话，最能帮你判断这个想法值不值得试？';
  if(/累|焦虑|紧张|烦|担心/.test(body))return '今天有没有一个瞬间，让这种感觉轻了一点？';
  if(/旅行|旅途|风景|散步/.test(body))return '闭上眼睛，你最想记住当时的哪个细节？';
  if(/想做|想试|开发|产品|实验/.test(body))return '如果只给自己十分钟，你会先试哪一步？';
  return '以后读到这句话时，你希望自己还记得哪个细节？';
}
export function datedAction(entry){
  const text=entry.body||'';
  const chunks=text.split(/[。！；\n]/).map(x=>x.trim());
  const pattern=/^(?:我(?:想|打算|准备|要)?)?(今天|明天|后天)(?:我)?(?:打算|准备|记得|要|想)?[，、：:\s]*(.{1,160})$/u;
  for(const chunk of chunks){
    const match=chunk.match(pattern);
    if(!match||/[?？]/.test(chunk)||/^(?:不|可能|也许)/.test(match[2]))continue;
    const date=new Date(entry.date+'T12:00:00');
    if(!Number.isFinite(date.valueOf()))continue;
    date.setDate(date.getDate()+['今天','明天','后天'].indexOf(match[1]));
    return {date:today(date),title:match[2].trim()};
  }
  return null;
}
export function arrangeNote(state,id,taskId){
  const entry=state.entries.find(n=>n.id===id);
  if(!entry)throw Error('这条记录已移除。');
  if(state.tasks.some(t=>t.captureId===id&&!t.archivedAt))return;
  const suggestion=datedAction(entry);
  if(!suggestion)throw Error('这条记录没有明确日期。');
  state.tasks.push({...suggestion,id:taskId,captureId:id,priority:'side',source:'user',projectId:'',time:'',done:false,originalText:suggestion.title,revisions:[]});
  Object.assign(entry,reviseLibraryItem(entry,{links:[...(entry.links||[]),'tasks:'+taskId]}));
}
export function replyToNote(state,id,question,reply){
  const entry=state.entries.find(n=>n.id===id);
  if(!entry||!reply.trim())throw Error('请填写想补充的内容。');
  Object.assign(entry,reviseLibraryItem(entry,{body:entry.body+'\n\n'+question+'\n'+reply}));
}

function noteTitle(body){
  return Array.from(body.trim().split(/\r?\n/)[0]).slice(0,48).join('');
}
export function changeBody(state,id,previous,body){
  if(!body.trim())throw Error('请保留至少一个字。');
  const note=state.entries.find(n=>n.id===id);
  if(!note||note.body!==previous)throw Error('这条记录已变化，请重新打开。');
  Object.assign(note,reviseLibraryItem(note,{body,title:note.quickCapture?noteTitle(body):note.title}));
}

const skipWords=new Set('今天 明天 昨天 后天 刚才 这个 那个 一个 一些 一点 感觉 时候 觉得 自己 想要 打算 准备 可以 还是 因为 所以 最近 真的 如果 有点 可能 现在 什么 怎么 这样 一下 已经 需要 想法 事情 一直 开始 以后 然后 比较'.split(' '));
const segment=typeof Intl.Segmenter==='function'?new Intl.Segmenter('zh',{granularity:'word'}):null;
function words(text){
  const parts=segment?Array.from(segment.segment(text),p=>p.isWordLike?p.segment:''):text.match(/[A-Za-z0-9]{3,}/g)||[];
  return new Set(parts.map(p=>p.toLowerCase()).filter(p=>p.length>1&&!skipWords.has(p)));
}
export function relatedNote(note,items){
  const keys=words(note.body);
  let best=null,bestScore=0;
  for(const other of items){
    if(note.id===other.id||other.source==='demo')continue;
    const overlap=[...words(other.body||'')].filter(key=>keys.has(key));
    if(overlap.length<2)continue;
    const score=overlap.reduce((sum,key)=>sum+key.length,0);
    if(score>bestScore){best={entry:other,words:overlap.slice(0,2)};bestScore=score;}
  }
  return best;
}
