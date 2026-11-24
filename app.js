import {readState,updateState,storageKey,storageWarning,today,uid,esc} from './store.js';
import {icon} from './icons.js';
import {renderToday,renderTasks,bindToday} from './today.js';
import {renderAtlas,bindAtlas} from './atlas.js';
import {renderLibrary,bindLibrary,openEntry} from './library.js';

import {renderGuide,bindGuide} from './guide.js';
const pages={
 guide:['使用与数据','shield'],
 today:['今日中心','sun'],vision:['人生总纲','compass'],projects:['事业项目','layers'],
 knowledge:['知识中心','book'],explore:['生活探索','map'],journal:['人生记录','journal'],
 review:['成长复盘','chart'],ai:['AI 人生助手','sparkles'],tasks:['任务与习惯','list-checks'],more:['更多','grid']
};
const editor=document.querySelector('#editor');
let ctx,noticeTimer,currentDay=today();
function toast(message){
 const node=document.querySelector('#notices');node.textContent=message;node.classList.add('visible');
 clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>node.classList.remove('visible'),3200);
}
function closeModal(){if(editor.open)editor.close();}
function modal(title,html,bind){
 editor.innerHTML='<div class="modal-head"><h2 id="dialog-title">'+esc(title)+'</h2><button class="icon-btn" aria-label="关闭" data-close>'+icon('x')+'</button></div><div class="modal-body">'+html+'</div>';
 editor.setAttribute('aria-labelledby','dialog-title');if(!editor.open)editor.showModal();
 editor.querySelector('[data-close]').onclick=closeModal;bind?.(editor);
}
editor.addEventListener('click',e=>{if(e.target===editor){const r=editor.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
function go(route,params={}){const query=new URLSearchParams(params).toString();location.hash=route+(query?'?'+query:'');}
function save(mutate){
 try{updateState(mutate);render();return true;}
 catch(e){const msg=e.name==='QuotaExceededError'?'浏览器空间不足，此次更改未保存。':e.message||'本次更改未保存';toast(msg);const err=editor.querySelector('[data-err]');if(err)err.textContent=msg;return false;}
}
function nav(key,short=''){
 const [label,glyph]=pages[key];const active=ctx.route===key||(key==='today'&&ctx.route==='tasks');
 return '<a href="#'+key+'" '+(active?'aria-current="page"':'')+'>'+icon(glyph,20)+'<span>'+(short||label)+'</span></a>';
}
function morePage(){
 return '<div class="page-head"><h1>更多</h1></div><div class="panel more-links">'+Object.keys(pages).filter(k=>k!=='more').map(k=>nav(k)).join('')+'</div>';
}
function render(){
 const [key,query]=location.hash.slice(1).split('?');const route=Object.hasOwn(pages,key)?key:'today';
 const stored=readState();
 const state={...stored,tasks:stored.tasks.filter(task=>!task.archivedAt)};
 ctx={state,route,params:new URLSearchParams(query),go,save,icon,esc,modal,closeModal,toast,today,uid};
 const body=route==='today'?renderToday(ctx):route==='tasks'?renderTasks(ctx):['vision','projects'].includes(route)?renderAtlas(ctx):route==='guide'?renderGuide(ctx):route==='more'?morePage():renderLibrary(ctx);
 document.title=pages[route][0]+' · Life OS';
 document.querySelector('#app').innerHTML=`<aside class="rail"><a class="brand" href="#today"><img src="assets/mark.svg" alt=""><span><b>Life OS</b><small>个人数字人生系统</small></span></a>
 <nav aria-label="工作区导航"><p>工作台</p>${['today','vision','projects'].map(k=>nav(k)).join('')}<p>积累与探索</p>${['knowledge','explore','journal','review'].map(k=>nav(k)).join('')}<div class="rail-divider"></div>${nav('ai')}${nav('guide')}</nav>
 <div class="rail-foot">${icon('shield',20)}<span>本地工作区<small>仅保存在此浏览器</small></span></div></aside>
 <div class="workspace"><header class="topbar"><div class="crumb"><img src="assets/mark.svg" alt=""><span>个人空间</span>${icon('chevron-right',14)}<b>${pages[route][0]}</b></div><div class="tools"><a href="#guide" class="guide-shortcut" aria-label="打开使用与数据">${icon('book',17)}<span>使用指南</span></a><span class="demo-label">含演示数据</span><button class="btn primary quick">${icon('pen',16)} 快速记录</button></div></header>
 <main id="main" tabindex="-1">${storageWarning()?'<p role="alert">'+esc(storageWarning())+'</p>':''}${body}</main></div>
 <nav class="bottom-nav" aria-label="手机导航">${[['today','今日'],['vision','总纲'],['projects','项目'],['journal','记录'],['more','更多']].map(([k,l])=>nav(k,l)).join('')}</nav>`;
 document.querySelector('.quick').onclick=()=>openEntry(ctx);
 document.querySelectorAll('#main [data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
 if(['today','tasks'].includes(route))bindToday(ctx);else if(['vision','projects'].includes(route))bindAtlas(ctx);else if(route==='guide')bindGuide(ctx);else if(route!=='more')bindLibrary(ctx);
}
document.querySelector('.skip').onclick=e=>{e.preventDefault();document.querySelector('#main').focus();};
window.addEventListener('hashchange',()=>{closeModal();render();window.scrollTo(0,0);});
window.addEventListener('storage',e=>{if(e.key===storageKey)render();});
setInterval(()=>{if(currentDay!==today()){currentDay=today();render();}},30000);
render();
