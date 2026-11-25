import {storageKey} from './store.js';
import {limit,pack,unpack,snapshotSummary,confirmSnapshot,unchanged,previewRestore} from './snapshot.js';
import {saveFileDialog} from './backup-files.js';
export {pack,unpack} from './snapshot.js';

const repo='J-Xia777/personal-life-os-backup';
const base='https://api.github.com/repos/'+repo;
const file='/contents/backups/life-os-v1.json';
const local=()=>location.protocol==='http:'&&['127.0.0.1','localhost'].includes(location.hostname);

let connectedToken='';
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
const tokenLink='https://github.com/settings/personal-access-tokens/new?name=Life+OS+Backup&target_name=J-Xia777&contents=write';
export function cloudPanel(){
  const secure=location.protocol==='https:',available=local()||secure;
  return `<section class="panel guide-panel"><h2>GitHub 私有云备份</h2><p>仓库 <strong>${repo}</strong>。整份快照包含本机工作区与附件，最多 8 MiB。</p>
    ${local()?'<small>通过这台 Mac 已登录的 GitHub CLI 连接。</small>':secure?`<div data-token-form><label class="field">仓库专用 GitHub Token<input type="password" data-cloud-token autocomplete="off" autocapitalize="none" spellcheck="false"></label><small>在 GitHub 选择 Only select repositories，仅勾选 personal-life-os-backup，Contents 设为 Read and write。令牌仅在当前页面会话中使用，刷新后需重新连接。</small><div class="guide-actions"><button class="btn" data-cloud="connect">连接 GitHub</button><a class="text-btn" href="${tokenLink.replaceAll('&','&amp;')}" target="_blank" rel="noopener noreferrer">在 GitHub 创建专用 Token ↗</a></div></div><div data-connected hidden><p>已连接专用私有仓库 <button class="text-btn" data-disconnect>断开连接</button></p></div>`:'<p>请用线上 HTTPS 网址连接 GitHub，或使用下方的文件备份。</p>'}
    ${available?'<div class="guide-actions" data-cloud-actions><button class="btn primary" data-cloud="write">上传到 GitHub</button><button class="btn" data-cloud="read">从 GitHub 恢复</button><button class="btn" data-cloud="copy">将 GitHub 快照另存为文件</button></div><p data-cloud-status role="status"></p>':''}
    <small>每次上传都会创建 Git 提交。恢复前可预览时间、记录数与附件数。</small></section>`;
}
export function bindCloud(c,root){
  const buttons=[...root.querySelectorAll('[data-cloud]')];
  if(!buttons.length)return;
  const msg=root.querySelector('[data-cloud-status]'),input=root.querySelector('[data-cloud-token]');
  function syncControls(){
    if(input){
      root.querySelector('[data-token-form]').hidden=!!connectedToken;
      root.querySelector('[data-connected]').hidden=!connectedToken;
    }
    for(const b of buttons)b.disabled=!!input&&!connectedToken&&b.dataset.cloud!=='connect';
  }
  syncControls();
  if(input)root.querySelector('[data-disconnect]').onclick=()=>{
    connectedToken='';input.value='';msg.textContent='已断开 GitHub 连接。';syncControls();
  };
  for(const b of buttons)b.onclick=async()=>{
    const op=b.dataset.cloud;
    const token=op==='connect'?input.value.trim():connectedToken;
    if(input&&!token){msg.textContent='请先输入专用 Token 并连接。';return;}
    if(input)input.value='';
    buttons.forEach(x=>x.disabled=true);
    const disconnect=root.querySelector('[data-disconnect]');if(disconnect)disconnect.disabled=true;
    msg.textContent='正在核对私有仓库…';
    try{
      const {sha,size}=await request('status',{token});
      if(!b.isConnected)return;
      if(op==='connect'){
        connectedToken=token;msg.textContent=sha?'连接成功，仓库已有完整快照。':'连接成功，可以上传第一份快照。';return;
      }
      const raw=localStorage.getItem(storageKey);
      if(op==='write'){
        if(!raw)throw Error('未找到本机工作区。');
        const backup=await pack(JSON.parse(raw));
        if(!b.isConnected)return;
        msg.textContent='请核对上传预览。';
        await confirmSnapshot(c,{title:'上传本机快照？',detail:snapshotSummary(backup.doc),
          note:'将完整工作区写入 '+repo+'。'+(sha?'本次提交将成为最新快照。':'这是第一份云端快照。'),button:'确认上传',
          apply:async()=>{unchanged(raw);const result=await request('write',{sha,token,content:backup.content});if(!/^[a-f0-9]{40}$/.test(result.sha))throw Error('请重新读取云端快照，核对上传结果。');return '快照已上传到 GitHub。';}
        });
      }else{
        if(!sha)throw Error('仓库中还没有快照，请先从有数据的设备上传。');
        if(size>limit)throw Error('云端文件超过 8 MiB 上限。');
        const doc=unpack((await request('read',{sha,token})).content);
        if(!b.isConnected)return;
        if(op==='copy')saveFileDialog(c,doc,'GitHub');
        else await previewRestore(c,doc,raw,'GitHub');
      }
      msg.textContent='';
    }catch(e){if(e.status===401)connectedToken='';msg.textContent=e.message;}
    finally{syncControls();if(disconnect)disconnect.disabled=false;}
  };
}
