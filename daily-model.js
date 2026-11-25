import {today,uid,rememberRevision} from './store.js';
import {revise} from './atlas.js';

export const personal = item => !item.archivedAt && (item.source !== 'demo' || item.editedBy === 'user');
export function mainCount(s,date,except=''){
  return s.tasks.filter(t=>personal(t)&&t.id!==except&&t.date===date&&t.priority==='main').length;
}
function checkDate(date){
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||today(new Date(date+'T12:00:00'))!==date)throw Error('请选择有效日期。');
}
function checkPlan(s,date,priority,id){
  checkDate(date);
  if(!['main','side'].includes(priority))throw Error('请选择任务优先级。');
  if(priority==='main'&&mainCount(s,date,id)>=3)throw Error('这一天已有三项主线。可以选为其他行动，或换一天。');
}
export function addStage(s,visionId,title,targetDate){
  const v=s.visions.find(v=>v.id===visionId&&personal(v));
  title=String(title||'').trim();
  if(!v||!title||title.length>160)throw Error('请填写一个可确认完成的阶段成果。');
  if(targetDate)checkDate(targetDate);
  const stage={id:uid(),title,targetDate:targetDate||''};
  Object.assign(v,revise(v,{stages:[...(v.stages||[]),stage]}));
  return stage;
}
export function finishStage(s,visionId,stageId,done){
  const v=s.visions.find(x=>x.id===visionId&&personal(x));
  if(!v?.stages?.some(st=>st.id===stageId))throw Error('阶段成果已变化，请重新打开。');
  Object.assign(v,revise(v,{stages:v.stages.map(st=>st.id===stageId?{...st,done}:st)}));
}
export function addAction(s,{title,date,priority='side',visionId='',stageId='',projectId='',lifeArea=''}){
  title=String(title||'').trim();
  if(!title||title.length>160)throw Error('请填写一个具体行动（最多 160 字）。');
  const v=s.visions.find(x=>x.id===visionId&&personal(x));
  if((visionId&&!v)||(stageId&&!v?.stages?.some(st=>st.id===stageId))||(projectId&&!s.projects.some(p=>p.id===projectId&&personal(p))))throw Error('关联方向已变化，请重新选择。');
  checkPlan(s,date,priority);
  const task={id:uid(),title,date,priority,visionId,stageId,projectId,lifeArea,time:'',source:'user',done:false,originalText:title,revisions:[]};
  s.tasks.push(task);
  return task;
}
export function setSchedule(s,id,date,priority){
  const t=s.tasks.find(x=>x.id===id&&personal(x));
  if(!t)throw Error('任务已被移除。');
  if(t.date===date&&t.priority===priority)return;
  checkPlan(s,date,priority,id);
  rememberRevision(t);
  Object.assign(t,{date,priority});
}
export function dayGroups(s,date=today()){
  const list=s.tasks.filter(personal);
  const byDate=(a,b)=>a.date.localeCompare(b.date)||(a.time||'24:00').localeCompare(b.time||'24:00');
  const due=list.filter(t=>t.date===date).sort(byDate);
  return {
    main:due.filter(t=>!t.done&&t.priority==='main'),side:due.filter(t=>!t.done&&t.priority!=='main'),
    done:due.filter(t=>t.done),later:list.filter(t=>!t.done&&t.date>date).sort(byDate),
    overdue:list.filter(t=>!t.done&&t.date<date).sort(byDate)
  };
}
export function contextFor(s,t){
  const project=s.projects.find(p=>p.id===t.projectId);
  const vision=s.visions.find(v=>v.id===t.visionId);
  const stage=vision?.stages?.find(x=>x.id===t.stageId);
  return [t.lifeArea,vision?.title,stage?.title,project?.title,project?.stage].filter(Boolean).join(' › ');
}
