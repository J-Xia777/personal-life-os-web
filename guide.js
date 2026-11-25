import {backupFilePanel,bindBackupFiles} from './backup-files.js';
import {cloudPanel,bindCloud} from './cloud.js';
import {sijiURL,summarizeBackup,dailySummary} from './siji.js';
import {storageKey} from './store.js';
const stamp=t=>new Date(t).toLocaleString('zh-CN',{hour12:false});
function figures(snapshot,date){
  return dailySummary(snapshot,date).measures.map(m=>'<div><small>'+m.title+'</small><b>'+m.value+' '+m.unit+'</b></div>').join('');
}
export function renderGuide(c){
  const s=c.state.sijiSnapshot, dates=s?Object.keys(s.byDay).sort().reverse():[];
  const requested=c.params.get('day');
  const first=dates.includes(requested)?requested:(dates.includes(c.today())?c.today():dates[0])||c.today();
  return `<div class="page-head"><div><h1>使用与数据</h1><p>工作区指南、本机存储与四记连接。</p></div></div>
  <section class="panel guide-panel"><h2>${c.icon('compass')} 开始使用</h2><ol class="guide-steps">
  <li><b>设定方向</b><p>进入「人生总纲 → 新增愿景」，写下想实现的画面，再添加长期目标。</p></li>
  <li><b>安排今天</b><p>在「事业项目」新增项目并关联目标。在项目详情添加任务，或从今日中心选择最多三项主线任务。</p></li>
  <li><b>留下成果</b><p>用「快速记录」写下灵感或日记。晚上进入「成长复盘」，记录完成的作品和下一步。</p></li></ol></section>
  <section class="panel guide-panel"><h2>${c.icon('lab')} 使用创业实验室</h2><p>先在「机会库」记下问题和目标用户。决定投入后，把机会设为「正式立项」，打开详情并确认「转化为项目」。已有事业项目可以直接加入项目空间。</p><p>在项目里设计一次低成本实验，写下成功标准和时间上限。用「添加任务」排进今日中心，再把访谈原话、付款凭据说明和实验结果带回项目做决定。</p><p>工作台按月汇总进行中项目的经营月报，示例项目从首次填报起计入。实际为零请填 0，空白会显示为待核实。创业记录随文本导出和私有备份一起保存。</p><a class="btn" href="#startup">打开创业实验室</a></section>
  ${cloudPanel()}
  ${backupFilePanel()}
  <section class="panel guide-panel"><h2>${c.icon('layers')} 四记数据连接</h2><p>在存有记录的设备和浏览器中打开四记，进入「明细 → 数据安全 → 导出备份」。将 JSON 文件保存在「文件」或传到这台 Mac，然后在下方选择文件。</p>
  <div class="data-flow"><span>四记原始记录</span><i>›</i><span>JSON 备份</span><i>›</i><span>本机每日汇总</span></div>
  <div class="guide-actions"><label class="btn primary file-choose">选择四记备份<input type="file" accept=".json,application/json" data-import></label><a href="${sijiURL}" class="btn" target="_blank" rel="noopener noreferrer">打开四记 ${c.icon('external-link',15)}</a></div>
  <p role="status" data-file-status></p>
  ${s?`<div class="snapshot"><strong>已导入 · ${s.count} 条记录</strong><p>备份生成于 ${stamp(s.exportedAt)}，导入于 ${stamp(s.importedAt)}。</p><label>查看汇总日期 <input data-summary-date type="date" value="${first}"></label><div class="summary-figures" data-figures>${figures(s,first)}</div></div>`:'<small>尚未导入。今日中心正在显示演示统计。</small>'}
  <details><summary>以后如何更新、上传或换设备？</summary><p>四记有新记录后重新导出、导入即可。每次用完整备份替换上次汇总，重复选择同一份文件不会累加。今日中心按本机日期展示净收支与三类次数。导入页可查看其他日期。</p><p>需要四记自身的云备份时，在四记「明细 → 云同步」按其说明连接自己的 GitHub secret Gist（知道链接即可读取），再使用「立即上传」或「从云端恢复」。该操作在四记中进行。Life OS 的文件导入全程在浏览器内处理，只保存每日合计，不回写四记，也不接收 Token。自动双向同步尚未接入。</p></details></section>
  <section class="panel guide-panel"><h2>${c.icon('shield')} Life OS 的数据保存在哪里？</h2><p>点击保存或打卡后，任务、愿景、项目、日记和四记汇总写入当前浏览器的 localStorage。照片、视频保存在同一站点的 IndexedDB。刷新和关闭页面后可继续使用。</p><p>请使用相同浏览器和网址（含端口）。无痕窗口、清除网站数据或更换设备会影响访问。可下载一份文本档案用于留存；档案含私人正文和关联信息，照片与视频请另存原件。</p><button class="btn" data-export>下载文本档案（JSON）</button><small>文本档案用于查阅；迁移时请使用上方的完整备份文件或 GitHub 快照。</small></section>`;
}
export function bindGuide(c){
  const root=document.querySelector('#main');
  bindCloud(c,root);
  bindBackupFiles(c,root);
  const input=root.querySelector('[data-import]'),msg=root.querySelector('[data-file-status]');
  input.onchange=async()=>{
    const file=input.files[0];if(!file)return;
    try{
      if(file.size>32*1024*1024)throw Error('此版支持 32 MB 以内的备份。');
      const s=summarizeBackup(JSON.parse(await file.text()));
      if(!root.contains(input))return;
      const days=Object.keys(s.byDay).sort();
      c.modal('预览四记汇总',`<p>共 ${s.count} 条记录，覆盖 ${days.length} 天。${days.length?days[0]+' 至 '+days.at(-1):'这份备份为空。'}</p><p>备份时间：${stamp(s.exportedAt)}</p><div class="summary-figures">${figures(s,c.today())}</div><small>以上为今天的汇总。确认后将替换本机已导入的全部四记汇总。</small><div class="actions"><button class="btn" data-cancel>取消</button><button class="btn primary" data-ok>确认导入</button></div>`,d=>{
        d.querySelector('[data-cancel]').onclick=c.closeModal;
        d.querySelector('[data-ok]').onclick=()=>{if(c.save(state=>{state.sijiSnapshot=s;})){c.closeModal();c.toast('四记汇总已保存到本机');}};
      });
    }catch(e){msg.textContent=e instanceof SyntaxError?'文件不是有效的 JSON，原有汇总已保留。':e.message;}
    finally{input.value='';}
  };
  const date=root.querySelector('[data-summary-date]');
  if(date)date.onchange=()=>{root.querySelector('[data-figures]').innerHTML=figures(c.state.sijiSnapshot,date.value);};
  root.querySelector('[data-export]').onclick=()=>{
    const raw=localStorage.getItem(storageKey);if(!raw){c.toast('没有可下载的本机数据');return;}
    const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='Life-OS-文本档案-'+c.today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
  };
}
