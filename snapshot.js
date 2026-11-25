import {validateLab} from './lab-model.js';
import {storageKey} from './store.js';
import {readMedia,writeMedia} from './library.js';
export const limit=8*1024*1024;
const collections=['tasks','projects','visions','goals','atlasNotes','habits','entries','trips','notes','reviews'];
function encoded(bytes){
  let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return btoa(s);
}
const decoded=s=>Uint8Array.from(atob(s), c=>c.charCodeAt(0));
function mediaRefs(state){
  const refs=new Map();
  for(const entry of state.entries){
    for(const item of [entry,...(entry.revisions||[])]){
      for(const ref of item.media||[]){
        if(typeof ref.id!=='string'||!/^((image|video)\/)/.test(ref.type))throw Error('附件引用无效。');
        refs.set(ref.id,ref);
      }
    }
  }
  return refs;
}
export async function createSnapshot(state,read=readMedia){
  const media=[];let size=new Blob([JSON.stringify(state)]).size;
  for(const ref of mediaRefs(state).values()){
    const blob=await read(ref.id);if(!blob)throw Error('本机缺少附件「'+ref.name+'」，请在保存原件的设备备份。');
    size+=4*Math.ceil(blob.size/3);
    if(size>limit)throw Error('完整备份上限为 8 MiB（含附件编码）。');
    media.push({id:ref.id,data:encoded(new Uint8Array(await blob.arrayBuffer()))});
  }
  const doc={format:'personal-life-os/backup-1',at:new Date().toISOString(),state,media};
  const bytes=new TextEncoder().encode(JSON.stringify(doc));if(bytes.length>limit)throw Error('备份超出 8 MiB 上限。');
  return doc;
}
export async function pack(state,read=readMedia){
  const doc=await createSnapshot(state,read);
  return {doc,content:encoded(new TextEncoder().encode(JSON.stringify(doc)))};
}
export function unpack(content){
  if(typeof content!=='string'||content.replace(/\s/g,'').length>Math.ceil(limit/3)*4)throw Error('备份过大或格式异常。');
  return parseSnapshot(new TextDecoder('utf-8',{fatal:true}).decode(decoded(content)));
}
export function parseSnapshot(text){
  if(new Blob([text]).size>limit)throw Error('完整备份超过 8 MiB 上限。');
  let doc;
  try{doc=JSON.parse(text);}catch{throw Error('文件不是有效的 JSON。');}
  if(doc?.format!=='personal-life-os/backup-1')throw Error('请选择 Life OS 完整备份文件。文本档案和四记备份使用不同格式。');
  if(typeof doc.at!=='string'||doc.state?.schemaVersion!==1||!Array.isArray(doc.media)||!Number.isFinite(Date.parse(doc.at)))throw Error('备份版本无法识别。');
  for(const k of collections){
    const rows=doc.state[k];
    if(!Array.isArray(rows)||rows.some(i=>!i||typeof i.id!=='string'||typeof i.title!=='string')||new Set(rows.map(i=>i.id)).size!==rows.length)throw Error('备份集合异常：'+k);
    for(const item of rows){
      for(const field of ['revisions','tags','goalIds','links','media','references','ideas','reviews','milestones']){
        if(item[field]!=null&&!Array.isArray(item[field]))throw Error('记录字段格式异常：'+field);
      }
    }
  }
  for(const v of doc.state.visions){
    if(v.stages!=null&&(!Array.isArray(v.stages)||v.stages.some(st=>!st||typeof st.id!=='string'||typeof st.title!=='string'||(st.targetDate!=null&&typeof st.targetDate!=='string'))))throw Error('愿景的阶段成果格式异常。');
  }
  if(Object.hasOwn(doc.state,'__proto__'))throw Error('工作区格式异常。');
  if(doc.state.projects.some(p=>!['active','paused','future','done'].includes(p.status)))throw Error('事业项目状态无效。');
  const siji=doc.state.sijiSnapshot;
  if(siji&&(!Number.isSafeInteger(siji.count)||!siji.byDay||Object.entries(siji.byDay).some(([day,row])=>!/^\d{4}-\d{2}-\d{2}$/.test(day)||!row||['out','income','food','desire','kind'].some(k=>!Number.isFinite(row[k])))))throw Error('四记日汇总格式异常。');
  validateLab(doc.state);
  const refs=mediaRefs(doc.state),ids=new Set();
  for(const f of doc.media){
    if(!refs.has(f.id)||ids.has(f.id)||typeof f.data!=='string')throw Error('备份附件索引异常。');
    decoded(f.data);ids.add(f.id);
  }
  if(ids.size!==refs.size)throw Error('备份附件不完整。');
  return doc;
}
async function installMedia(doc){
  const refs=mediaRefs(doc.state), files=[], ids=[];
  for(const m of doc.media){
    const ref=refs.get(m.id), old=await readMedia(m.id);
    if(old){
      if(encoded(new Uint8Array(await old.arrayBuffer()))!==m.data)throw Error('同名附件 ID 的内容冲突，已停止恢复。');
    }else{
      files.push(new File([decoded(m.data)],ref.name,{type:ref.type}));ids.push(m.id);
    }
  }
  // Insert missing immutable blobs atomically before installing references.
  await writeMedia(files,()=>ids.shift());
}

export function snapshotSummary(doc){
  const s=doc.state;
  return new Date(doc.at).toLocaleString('zh-CN')+' · '+s.projects.length+' 个项目 · '+s.entries.length+' 条人生记录 · '+s.tasks.length+' 项任务（含已移除） · '+doc.media.length+' 个附件';
}

export function confirmSnapshot(c,{title,detail,note,button,apply}){
  return new Promise(resolve=>c.modal(title,`<p>${c.esc(detail)}</p><p class="dialog-note">${c.esc(note)}</p><p role="alert" data-cloud-error></p><div class="actions"><button class="btn" data-cancel>取消</button><button class="btn primary" data-commit>${c.esc(button)}</button></div>`,d=>{
    d.addEventListener('close',resolve,{once:true});
    d.querySelector('[data-cancel]').onclick=c.closeModal;
    const commit=d.querySelector('[data-commit]');
    commit.onclick=async()=>{
      commit.disabled=true;
      try{const notice=await apply();c.closeModal();c.toast(notice);}
      catch(e){d.querySelector('[data-cloud-error]').textContent=e.message;commit.disabled=false;}
    };
  }));
}

export function unchanged(raw){
  if(localStorage.getItem(storageKey)!==raw)throw Error('本机内容已变化，请重新预览。');
}
export function previewRestore(c,doc,raw,source){
  return confirmSnapshot(c,{
    title:'从'+source+'恢复工作区？',detail:snapshotSummary(doc),
    note:'确认后，当前浏览器的整个工作区将被替换。如果本机还有单独编辑的内容，可以先取消并导出一份完整备份。',
    button:'确认替换并恢复',
    apply:async()=>{
      unchanged(raw);
      await installMedia(doc);
      unchanged(raw);
      if(!c.save(state=>{for(const k of Object.keys(state))delete state[k];Object.assign(state,doc.state);}))throw Error('本机存储失败，未替换工作区。');
      return '工作区已从'+source+'恢复。';
    }
  });
}
