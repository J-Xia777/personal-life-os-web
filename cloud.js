import {validateLab} from './lab-model.js';
import {storageKey} from './store.js';
import {readMedia,writeMedia} from './library.js';
const repo='J-Xia777/personal-life-os-backup';
const base='https://api.github.com/repos/'+repo;
const file='/contents/backups/life-os-v1.json';
const limit=8*1024*1024;
const collections=['tasks','projects','visions','goals','atlasNotes','habits','entries','trips','notes','reviews'];
const local=()=>location.protocol==='http:'&&['127.0.0.1','localhost'].includes(location.hostname);
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
export async function pack(state,read=readMedia){
  const media=[];let size=new Blob([JSON.stringify(state)]).size;
  for(const ref of mediaRefs(state).values()){
    const blob=await read(ref.id);if(!blob)throw Error('本机缺少附件「'+ref.name+'」，请在保存原件的设备上传。');
    size+=4*Math.ceil(blob.size/3);
    if(size>limit)throw Error('单次云快照上限为 8 MiB（含附件编码），未上传。');
    media.push({id:ref.id,data:encoded(new Uint8Array(await blob.arrayBuffer()))});
  }
  const doc={format:'personal-life-os/backup-1',at:new Date().toISOString(),state,media};
  const bytes=new TextEncoder().encode(JSON.stringify(doc));if(bytes.length>limit)throw Error('备份超出 8 MiB 上限。');
  return {doc,content:encoded(bytes)};
}
export function unpack(content){
  if(typeof content!=='string'||content.replace(/\s/g,'').length>Math.ceil(limit/3)*4)throw Error('备份过大或格式异常。');
  const doc=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decoded(content)));
  if(doc.format!=='personal-life-os/backup-1'||doc.state?.schemaVersion!==1||!Array.isArray(doc.media)||!Number.isFinite(Date.parse(doc.at)))throw Error('备份版本无法识别。');
  for(const k of collections){
    if(!Array.isArray(doc.state[k])||doc.state[k].some(i=>!i||typeof i.id!=='string'))throw Error('备份集合异常：'+k);
  }
  validateLab(doc.state);
  const refs=mediaRefs(doc.state),ids=new Set();
  for(const f of doc.media){
    if(!refs.has(f.id)||ids.has(f.id)||typeof f.data!=='string')throw Error('备份附件索引异常。');
    decoded(f.data);ids.add(f.id);
  }
  if(ids.size!==refs.size)throw Error('云端附件不完整。');
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
async function request(action,{token,sha=null,content}={}){
  if(local()){
    const r=await fetch('/api/cloud',{method:'POST',headers:{'Content-Type':'application/json','X-Life-OS':'backup-v1'},body:JSON.stringify({action,sha,content}),cache:'no-store'});
    const body=await r.json();if(!r.ok)throw Error(body.error||'本机云备份服务未启动。');return body;
  }
  if(location.protocol!=='https:'||!token)throw Error('请通过 HTTPS 页面输入该仓库专用 Token，或使用 Mac 本机入口。');
  const api=async(path,opts={})=>{
    const r=await fetch(base+path,{...opts,cache:'no-store',redirect:'error',credentials:'omit',headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json'}});
    if(!r.ok)throw Object.assign(Error('GitHub 请求失败（'+r.status+'）。请核对仓库权限，发生版本冲突时重新预览。'),{status:r.status});
    return r.json();
  };
  const info=await api('');
  if(!info.private||info.full_name.toLowerCase()!==repo.toLowerCase())throw Error('目标仓库不是指定的私有仓库。');
  if(action==='status'){try{const f=await api(file);return {sha:f.sha,size:f.size};}catch(e){if(e.status===404)return {sha:null};throw e;}}
  if(action==='read')return api('/git/blobs/'+sha);
  const data=await api(file,{method:'PUT',body:JSON.stringify({message:'Back up Personal Life OS',content,...(sha?{sha}:{})})});
  return {sha:data.content.sha};
}
export function cloudPanel(){
 const available=local()||location.protocol==='https:';
 return `<section class="panel guide-panel"><h2>GitHub 私有云备份</h2><p>目标仓库 <strong>${repo}</strong>。手动保存整个工作区，包括日记、修订、四记汇总以及记录引用的照片和视频，单份快照最多 8 MiB。</p>
 ${!available?'<p>当前手机入口使用局域网 HTTP。请在 Mac 回环地址管理 Mac 的备份；手机自身的备份功能需要通过 HTTPS 打开本应用。</p>':
 (local()?'<small>通过这台 Mac 已登录的 GitHub CLI 连接。</small>':'<label class="field">此仓库专用的 GitHub Token<input type="password" data-cloud-token autocomplete="off" spellcheck="false"></label><small>使用仅授权该私有仓库、Contents 读写权限的 fine-grained Token。只在当前操作中使用。</small>')+
 '<div class="guide-actions"><button class="btn primary" data-cloud="write">上传到 GitHub</button><button class="btn" data-cloud="read">从 GitHub 恢复</button></div><p data-cloud-status role="status"></p>'}
 <small>上传会创建 Git 提交，旧版保留在仓库历史中。恢复会替换当前设备的工作区，无法自动合并两台设备的编辑。</small></section>`;
}
export function bindCloud(c,root){
  const buttons=[...root.querySelectorAll('[data-cloud]')],msg=root.querySelector('[data-cloud-status]');
  for(const b of buttons)b.onclick=async()=>{
    const raw=localStorage.getItem(storageKey),writing=b.dataset.cloud==='write';
    const input=root.querySelector('[data-cloud-token]');
    let token=input?.value.trim()||'';if(input)input.value='';
    if(!raw){msg.textContent='未找到本机数据。';return;}
    buttons.forEach(x=>x.disabled=true);msg.textContent='正在核对私有仓库和云端版本…';
    try{
      const {sha,size}=await request('status',{token});
      if(!writing&&!sha)throw Error('仓库中还没有快照，请先从有数据的设备上传。');
      if(size>limit)throw Error('云端文件超过当前恢复上限。');
      const backup=writing?await pack(JSON.parse(raw)):null;
      const doc=writing?backup.doc:unpack((await request('read',{sha,token})).content);
      if(!root.contains(b))return;
      const s=doc.state;
      const detail=c.esc(new Date(doc.at).toLocaleString('zh-CN'))+' · '+s.projects.length+' 个项目 · '+s.entries.length+' 条人生记录 · '+s.tasks.length+' 项任务（含已移除） · '+doc.media.length+' 个附件';
      msg.textContent='已连接。请核对预览。';
      await new Promise(resolve=>{
        c.modal(writing?'上传本机快照？':'恢复云端工作区？',`<p>${detail}</p><p class="dialog-note">${writing?'将上述数据和其他工作区内容写入 '+repo+'。'+(sha?'云端已有快照，此次上传将成为最新版本。':'这是第一份云端快照。'):'将用这份快照替换本机工作区。请先保存本机独有的记录。'}</p><p role="alert" data-cloud-error></p><div class="actions"><button class="btn" data-cancel>取消</button><button class="btn primary" data-commit>${writing?'确认上传':'确认替换并恢复'}</button></div>`,d=>{
          d.addEventListener('close',resolve,{once:true});
          d.querySelector('[data-cancel]').onclick=c.closeModal;
          const commit=d.querySelector('[data-commit]');
          commit.onclick=async()=>{
            commit.disabled=true;
            try{
              if(localStorage.getItem(storageKey)!==raw)throw Error('本机内容已变化，请关闭后重新预览。');
              if(writing){
                const result=await request('write',{sha,token,content:backup.content});
                if(!/^[a-f0-9]{40}$/.test(result.sha))throw Error('上传状态未确认，请读取云端快照核对。');
              }else{
                await installMedia(doc);
                if(localStorage.getItem(storageKey)!==raw)throw Error('本机内容已变化，已停止恢复。');
                if(!c.save(state=>{for(const k of Object.keys(state))delete state[k];Object.assign(state,doc.state);}))throw Error('本机存储失败，未替换工作区。');
              }
              const notice=writing?'快照已上传到 GitHub。':'工作区已从 GitHub 恢复。';
              msg.textContent=notice;c.closeModal();c.toast(notice);
            }catch(e){d.querySelector('[data-cloud-error]').textContent=e.message;commit.disabled=false;}
          };
        });
      });
    }catch(e){msg.textContent=e.message;}
    finally{token='';buttons.forEach(x=>x.disabled=false);}
  };
}
