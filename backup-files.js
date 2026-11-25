import {storageKey} from './store.js';
import {createSnapshot,parseSnapshot,limit,snapshotSummary,previewRestore} from './snapshot.js';

export function backupFilePanel(){
  return `<section class="panel guide-panel"><h2>iCloud 云盘与文件备份</h2>
    <p>换设备时可保存 Life OS 完整 JSON 文件，包含所有模块、修订与照片视频附件，单份最多 8 MiB。文件备份可独立使用。</p>
    <div class="guide-actions"><button class="btn primary" data-file-export>导出完整备份</button><label class="btn file-choose">从 iCloud 或文件恢复<input type="file" accept=".json,application/json" data-restore-file></label></div>
    <p data-backup-notice role="status"></p><small>iPhone 可在系统面板选择「存储到文件 → iCloud 云盘」。恢复时从「浏览 → iCloud 云盘」选择备份，核对预览后确认。文件包含私人正文，请存入自己的文件夹。</small></section>`;
}
export function saveFileDialog(c,doc,source){
  const name='Life-OS-'+doc.at.replace(/[:.]/g,'-')+'.json';
  const file=new File([JSON.stringify(doc)],name,{type:'application/json'});
  const share=!!navigator.canShare?.({files:[file]});
  c.modal('保存完整备份',`<p>${c.esc(source)}快照 · ${c.esc(snapshotSummary(doc))}</p><p class="dialog-note">${share?'点「选择保存位置」，再选「存储到文件 → iCloud 云盘」。也可以直接下载。':'点「下载备份文件」，在系统保存窗口选择 iCloud 云盘；如果浏览器自动下载，可在「文件」或访达中将下载项移入 iCloud 云盘。'}</p><p role="status" data-save-notice></p><div class="actions"><button class="btn ${share?'':'primary'}" data-download>下载备份文件</button>${share?'<button class="btn primary" data-share>选择保存位置</button>':''}</div>`,d=>{
    d.querySelector('[data-download]').onclick=()=>{
      const url=URL.createObjectURL(file),a=document.createElement('a');
      a.href=url;a.download=name;d.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      d.querySelector('[data-save-notice]').textContent='已请求下载，请在浏览器下载项或所选文件夹中查看。';
    };
    if(share)d.querySelector('[data-share]').onclick=async()=>{
      try{await navigator.share({files:[file]});c.closeModal();}
      catch(e){if(e.name!=='AbortError')d.querySelector('[data-save-notice]').textContent='当前系统未能分享此文件，请使用「下载备份文件」。';}
    };
  });
}
export function bindBackupFiles(c,root){
  const save=root.querySelector('[data-file-export]'),input=root.querySelector('[data-restore-file]'),msg=root.querySelector('[data-backup-notice]');
  save.onclick=async()=>{
    save.disabled=true;msg.textContent='正在整理工作区和附件…';
    try{
      const raw=localStorage.getItem(storageKey);
      if(!raw)throw Error('未找到本机工作区。');
      const doc=await createSnapshot(JSON.parse(raw));
      if(save.isConnected){msg.textContent='';saveFileDialog(c,doc,'本机');}
    }catch(e){msg.textContent=e.message;}
    finally{save.disabled=false;}
  };
  input.onchange=async()=>{
    const file=input.files[0];if(!file)return;
    input.value='';input.disabled=true;
    try{
      const raw=localStorage.getItem(storageKey);
      if(file.size>limit)throw Error('完整备份超过 8 MiB 上限。');
      const doc=parseSnapshot(await file.text());
      if(input.isConnected){msg.textContent='';await previewRestore(c,doc,raw,'备份文件');}
    }catch(e){msg.textContent=e.message;}
    finally{input.disabled=false;}
  };
}
