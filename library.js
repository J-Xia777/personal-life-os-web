import { sijiURL } from './siji.js';
const KNOWLEDGE = ['音乐艺术与声学', 'AI 科技与虚拟世界', '商业经济与投资', '学术研究与论文', '英语与语言学习', '旅行、历史、人文地理', '健康运动与生活百科', '哲学、心理学与人生修养', '感情、社交与家庭关系'];
const EVIDENCE = ['个人观点', '待验证信息', '可靠资料', '实践经验'];
const ENTRY_TYPES = ['每日日记', '感恩日记', '情绪与感受', '创作灵感', '学习收获', '作品成果', '旅行经历', '重要事件'];
const TRIP_TYPES = ['旅行', '地点收藏', '行业活动', '兴趣与社交'];
const TRIP_STATES = ['心愿', '规划中', '已成行', '已取消'];
const ENTRY_ICONS = {'每日日记':'book-open','感恩日记':'heart','情绪与感受':'sun','创作灵感':'lightbulb','学习收获':'book','作品成果':'music','旅行经历':'compass','重要事件':'flag'};
const COLLECTIONS = {note:'notes',trip:'trips',entry:'entries',review:'reviews'};
const asDate = (value) => new Date(value + 'T12:00:00');
function dateString(date) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}
function offset(date, days) {
  const next = asDate(date);
  next.setDate(next.getDate() + days);
  return dateString(next);
}
function readableDate(date) {
  const d = asDate(date);
  return Number.isNaN(d.getTime()) ? '日期待补' : (d.getMonth()+1)+' 月 '+d.getDate()+' 日';
}
function periodRange(day, span) {
  if (span === '每周') {
    const weekday = (asDate(day).getDay()+6)%7;
    return [offset(day, -weekday), offset(day, 6-weekday)];
  }
  if (span === '每月') {
    const end = asDate(day);
    end.setMonth(end.getMonth()+1, 0);
    return [day.slice(0,7)+'-01', dateString(end)];
  }
  return [day,day];
}
function example(obj) {
  return {...obj, source:'demo', originalText:obj.body || '', revisions:[]};
}
export function librarySeed(day) {
  return {
    notes:[
      example({id:'demo-note-field',title:'把一段城市声音写进旋律',body:'先听环境声中的节拍，再用两个音回应它。练习时，可以从十秒钟的街道录音开始，记录听见了什么。',category:KNOWLEDGE[0],evidence:'个人观点',tags:['声音采集','旋律'],starred:true,date:day,url:''}),
      example({id:'demo-note-research',title:'一个能被再次找到的研究问题',body:'读论文前，先写下自己的问题和检索词。在摘要旁记下作者的结论、证据，以及还想追问的地方。',category:KNOWLEDGE[3],evidence:'实践经验',tags:['阅读方法','研究笔记'],starred:false,date:offset(day,-1),url:''}),
      example({id:'demo-note-agent',title:'把自动化流程画成三个步骤',body:'在纸上分开画出输入、处理和输出，逐个记录每一步可以由谁核验。这是一条留待下一次实践的想法。',category:KNOWLEDGE[1],evidence:'待验证信息',tags:['自动化','工作流'],starred:false,date:offset(day,-3),url:''})
    ],
    trips:[
      example({id:'demo-trip-pottery',title:'景德镇的陶瓷与街巷',destination:'景德镇',type:'旅行',status:'规划中',body:'留一个下午看陶瓷工作室，在街区散步时记录手作的材质与声音。',start:offset(day,12),end:offset(day,13),people:'一人',route:'陶溪川 → 老街散步 → 工作室参观',transport:'去程交通待确认',hotel:'待选择',budget:'待估算',prep:'核对工作室预约时间',safety:'参观窑区时遵守现场指引',date:day}),
      example({id:'demo-trip-live',title:'去听一次小型室内乐',destination:'本地音乐空间',type:'行业活动',status:'心愿',body:'收藏一场近距离聆听弦乐的机会，关注演出和开放排练。',date:offset(day,-3)})
    ],
    entries:[
      example({id:'demo-entry-sound',title:'留下第一段八小节',category:'作品成果',body:'把散步时哼出的片段整理为八小节钢琴草稿，留下可以接着修改的第一版。',date:day,links:[],media:[]}),
      example({id:'demo-entry-thanks',title:'感谢一场耐心的交流',category:'感恩日记',body:'今天的一次交流让我慢了下来。把对方说过的一句话记下来，也提醒自己认真倾听。',date:offset(day,-1),links:[],media:[]})
    ],
    reviews:[]
  };
}
function badge(item) {
  return '<span class="lib-origin '+(item.source==='demo'?'demo':'')+'">'+(item.source==='demo'?'示例':item.basedOnDemo?'本机 · 改自示例':'本机')+'</span>';
}
function titleBlock(title, subtitle, action='') {
  return '<div class="page-head lib-page-head"><div><h1>'+title+'</h1><p>'+subtitle+'</p></div>'+action+'</div>';
}
function action(ctx, text, operation, icon='plus', primary=true, id='') {
  return '<button type="button" class="btn '+(primary?'primary':'')+'" data-lib="'+operation+'" data-id="'+ctx.esc(id)+'">'+ctx.icon(icon,17)+'<span>'+text+'</span></button>';
}
function subnav(ctx,param,values,active) {
  return '<nav class="lib-segments" aria-label="筛选">'+values.map(k=>'<button type="button" data-lib="segment" data-param="'+param+'" data-value="'+ctx.esc(k)+'" aria-pressed="'+(active===k)+'">'+ctx.esc(k)+'</button>').join('')+'</nav>';
}
function empty(ctx,msg) {
  return '<div class="lib-empty">'+ctx.icon('inbox',24)+'<p>'+ctx.esc(msg)+'</p></div>';
}
function optionList(esc, options, current) {
  return options.map(value=>'<option value="'+esc(value)+'"'+(value===current?' selected':'')+'>'+esc(value)+'</option>').join('');
}
function field(label, control) {
  return '<label class="lib-field"><span>'+label+'</span>'+control+'</label>';
}
function textIn(esc,name,value='',type='text',required=false) {
  return '<input name="'+name+'" type="'+type+'" value="'+esc(value||'')+'"'+(required?' required':'')+'>';
}
function area(esc,name,value='',required=false,rows=4) {
  return '<textarea name="'+name+'" rows="'+rows+'"'+(required?' required':'')+'>'+esc(value||'')+'</textarea>';
}
function selectIn(esc,name,values,current) {
  return '<select name="'+name+'">'+optionList(esc,values,current)+'</select>';
}
function formWrap(contents) {
  return '<form class="lib-form">'+contents+'<div class="lib-form-actions"><button type="button" class="btn" data-form-cancel>取消</button><button class="btn primary" type="submit">保存到本机</button></div><div class="lib-form-feedback" role="status"></div></form>';
}
function urlSafe(url) {
  if (!url) return '';
  try {
    const parsed=new URL(url);
    return ['https:','http:'].includes(parsed.protocol)?parsed.href:'';
  } catch { return ''; }
}
const timelineSort = (a,b) => String(b.date).localeCompare(String(a.date)) || String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||''));
function attrs(ctx,kind,id) { return ' data-lib="detail" data-kind="'+kind+'" data-id="'+ctx.esc(id)+'"'; }
function knowledgeResults(ctx, q='', category='全部分类', onlyStar=false) {
  const query=q.trim().toLocaleLowerCase();
  const items=ctx.state.notes.filter(n=>(!onlyStar||n.starred)&&(category==='全部分类'||n.category===category)&&
    [n.title,n.body,n.evidence,...(n.tags||[])].join(' ').toLocaleLowerCase().includes(query)).sort(timelineSort);
  if (!items.length) return empty(ctx,'没有匹配的知识条目。可以调整筛选，或新增笔记。');
  return '<div class="lib-notes-grid">'+items.map(note=>{
    const theme=KNOWLEDGE.indexOf(note.category);
    return '<article class="panel lib-note"><div class="lib-note-top"><span class="lib-topic theme-'+(Math.max(0,theme)%4)+'">'+ctx.icon(['music','cpu','briefcase','book-open','book','compass','heart','sun','users'][theme]||'book',18)+'</span>'+badge(note)+'<button class="lib-star" data-lib="star" aria-pressed="'+!!note.starred+'" data-id="'+ctx.esc(note.id)+'" aria-label="'+(note.starred?'取消收藏':'收藏')+' '+ctx.esc(note.title)+'">'+ctx.icon('star',18)+'</button></div><button class="lib-card-target"'+attrs(ctx,'note',note.id)+'><small>'+ctx.esc(note.category)+'</small><h2>'+ctx.esc(note.title)+'</h2><p>'+ctx.esc(note.body)+'</p></button><div class="lib-card-foot"><span>'+ctx.esc(note.evidence)+'</span><span>'+ctx.esc((note.tags||[]).map(t=>'#'+t).join(' '))+'</span></div></article>';
  }).join('')+'</div>';
}
function knowledge(ctx) {
  const onlyStar=ctx.params.get('filter')==='已收藏';
  return titleBlock('知识中心','让资料、想法与实践各有出处。',action(ctx,'新增知识','new-note'))+
    '<div class="lib-toolbar">'+subnav(ctx,'filter',['全部笔记','已收藏'],onlyStar?'已收藏':'全部笔记')+'<div class="lib-find"><label class="lib-search">'+ctx.icon('search',17)+'<input data-lib-search type="search" placeholder="搜索知识、标签…" aria-label="搜索知识和标签"></label><select data-lib-category aria-label="按知识分类">'+optionList(ctx.esc,['全部分类',...KNOWLEDGE],'全部分类')+'</select></div></div><div data-lib-results>'+knowledgeResults(ctx,'','全部分类',onlyStar)+'</div>';
}
function explore(ctx) {
  const filter=ctx.params.get('filter')||'全部';
  const list=ctx.state.trips.filter(t=>filter==='全部'||t.status===filter).sort(timelineSort);
  return titleBlock('生活探索','收藏想去的地方，留下真正走过的路。',action(ctx,'新增探索','new-trip'))+
    subnav(ctx,'filter',['全部',...TRIP_STATES],filter)+
    (list.length?'<div class="lib-trips">'+list.map(t=>'<button class="panel lib-trip-card"'+attrs(ctx,'trip',t.id)+'><span class="lib-topic theme-'+(t.type==='旅行'?0:2)+'">'+ctx.icon(t.type==='旅行'?'compass':t.type==='行业活动'?'music':'map-pin',23)+'</span><div><div class="lib-kicker">'+ctx.esc(t.type)+' · '+ctx.esc(t.destination||'地点待定')+'</div><h2>'+ctx.esc(t.title)+'</h2><p>'+ctx.esc(t.body||'打开查看计划')+'</p><div class="lib-card-foot"><span>'+ctx.esc(t.status)+'</span>'+badge(t)+'</div></div></button>').join('')+'</div>':empty(ctx,'这里还没有符合条件的探索。'));
}
function journal(ctx) {
  const filter=ctx.params.get('filter')||'全部';
  const entries=ctx.state.entries.filter(e=>filter==='全部'||e.category===filter).sort(timelineSort);
  return titleBlock('人生记录','在时间线上，留下想记住的片刻。',action(ctx,'写一条记录','new-entry','pen'))+
    '<a class="panel lib-siji" href="'+sijiURL+'" target="_blank" rel="noopener noreferrer"><span class="lib-siji-mark">四</span><div><strong>四记</strong><p>花销 · 饮食 · 欲望 · 行善</p></div><span class="lib-siji-action">打开独立 App '+ctx.icon('external-link',15)+'</span></a>'+
    '<div class="lib-toolbar"><h2 class="lib-section-heading">人生时间线</h2><label class="lib-filter-label">记录类型 <select data-entry-filter>'+optionList(ctx.esc,['全部',...ENTRY_TYPES],filter)+'</select></label></div>'+
    (entries.length?'<div class="lib-timeline">'+entries.map(entry=>'<article><div class="lib-date"><span>'+ctx.esc(readableDate(entry.date))+'</span><small>'+ctx.esc(String(entry.date).slice(0,4))+'</small></div><button class="panel lib-entry"'+attrs(ctx,'entry',entry.id)+'><div class="lib-kicker">'+ctx.icon(ENTRY_ICONS[entry.category]||'book-open',15)+' '+ctx.esc(entry.category)+' '+badge(entry)+'</div><h2>'+ctx.esc(entry.title)+'</h2><p>'+ctx.esc(entry.body||'')+'</p>'+(entry.media?.length?'<small>'+ctx.icon('image',14)+' '+entry.media.length+' 个附件</small>':'')+'</button></article>').join('')+'</div>':empty(ctx,'本分类还没有记录。'));
}
function review(ctx) {
  const span=['每日','每周','每月'].includes(ctx.params.get('period'))?ctx.params.get('period'):'每日';
  const selected=ctx.params.get('date')||ctx.today();
  const day=/^\d{4}-\d\d-\d\d$/.test(selected)&&Number.isFinite(asDate(selected).getTime())?selected:ctx.today();
  const [begin,end]=periodRange(day,span);
  const inRange=item=>item.date>=begin&&item.date<=end;
  const evidence=ctx.state.entries.filter(e=>inRange(e)&&['学习收获','重要事件','作品成果','旅行经历'].includes(e.category)).sort(timelineSort);
  const reviews=ctx.state.reviews.filter(r=>r.period===span&&r.begin===begin).sort(timelineSort);
  const finished=(ctx.state.tasks||[]).filter(t=>t.done&&inRange(t));
  const datedHabits=(ctx.state.habits||[]).flatMap(h=>Object.keys(h.checks||{}).filter(d=>d>=begin&&d<=end));
  const includesDemo=[...evidence,...finished].some(x=>x.source==='demo') || (ctx.state.habits||[]).some(h=>h.source==='demo'&&Object.keys(h.checks||{}).some(d=>d>=begin&&d<=end));
  const header=span==='每日'?readableDate(day):readableDate(begin)+' — '+readableDate(end);
  return titleBlock('成长复盘','从具体作品、能力变化与重要经历回看成长。',action(ctx,'写复盘','new-review','pen'))+
    '<div class="lib-toolbar">'+subnav(ctx,'period',['每日','每周','每月'],span)+'<label class="lib-filter-label">查看日期 <input data-review-date type="date" value="'+ctx.esc(day)+'"></label></div>'+
    '<div class="panel lib-review-intro"><div><span class="lib-kicker">'+ctx.esc(span)+'回顾'+(includesDemo?' · 含示例':'')+'</span><h2>'+ctx.esc(header)+'</h2></div><div class="lib-counts"><div><strong>'+evidence.length+'</strong><small>成果与经历</small></div><div><strong>'+finished.length+'</strong><small>已完成任务</small></div>'+(datedHabits.length?'<div><strong>'+new Set(datedHabits).size+'</strong><small>有打卡的天数</small></div>':'')+'</div></div>'+
    '<div class="lib-review-grid"><section class="panel lib-section"><h2>'+ctx.icon('flag',18)+' 成果与经历</h2>'+(evidence.length?evidence.map(e=>'<button class="lib-compact"'+attrs(ctx,'entry',e.id)+'><span>'+ctx.esc(e.title)+'</span><small>'+ctx.esc(e.category)+' · '+ctx.esc(readableDate(e.date))+'</small>'+badge(e)+'</button>').join(''):empty(ctx,'本周期还没有作品、学习收获或重要经历。'))+'</section><section class="panel lib-section"><h2>'+ctx.icon('book-open',18)+' 我的复盘</h2>'+(reviews.length?reviews.map(r=>'<button class="lib-compact"'+attrs(ctx,'review',r.id)+'><span>'+ctx.esc(r.title)+'</span><small>'+ctx.esc(readableDate(r.date))+'</small>'+badge(r)+'</button>').join(''):empty(ctx,'写下这个周期真正做成的事，以及下一步想调整的地方。'))+'</section></div>'+reviewSupplement(ctx,begin,end);
}
function reviewSupplement(ctx,begin,end) {
  const habits=ctx.state.habits||[];
  const days=[];
  for(let day=begin;day<=end;day=offset(day,1)) days.push(day);
  const projects=ctx.state.projects||[];
  return '<div class="lib-review-grid lib-supplement"><details class="panel lib-section"><summary>本周期的习惯节奏</summary><div class="lib-trends">'+habits.map(h=>{
    const count=days.filter(d=>h.checks?.[d]).length;
    return '<div><div class="lib-trend-name">'+ctx.esc(h.title)+' '+badge(h)+'<small>'+count+' / '+days.length+' 天</small></div><div class="lib-dots" aria-hidden="true">'+days.map(d=>'<i class="'+(h.checks?.[d]?'is-checked':'')+'" title="'+ctx.esc(d)+'"></i>').join('')+'</div></div>';
  }).join('')+'</div></details><details class="panel lib-section"><summary>当前项目的里程碑</summary><div class="lib-trends">'+projects.map(p=>{
    const ms=p.milestones||[];
    return '<div><div class="lib-trend-name">'+ctx.esc(p.title)+' '+badge(p)+'<small>'+ms.filter(m=>m.done).length+' / '+ms.length+' 项</small></div></div>';
  }).join('')+'</div></details></div>';
}
function assistant(ctx) {
  const scopes=[['book-open','知识整理','整理零散笔记，在获准的资料里查找出处。'],['compass','规划与取舍','围绕长期目标比较行动方案和项目优先级。'],['sparkles','经历与复盘','梳理已经发生的经历，提出可供选择的改进建议。']];
  return titleBlock('AI 人生助手','为未来的个人思考与规划预留空间。')+
    '<section class="panel lib-ai-hero"><span class="lib-topic">'+ctx.icon('neural',26)+'</span><div><span class="lib-kicker">能力预览 · 尚未连接</span><h2>你决定哪些内容可以被读取</h2><p>当前版本只在本机保存内容。未来可按资料范围授权，每条建议由你决定是否采纳。</p></div></section><div class="lib-ai-grid">'+scopes.map(([icon,title,body])=>'<article class="panel lib-section"><span class="lib-topic">'+ctx.icon(icon,19)+'</span><h2>'+title+'</h2><p>'+body+'</p></article>').join('')+'</div><section class="panel lib-section"><h2>'+ctx.icon('lock',18)+' 数据权限</h2><p>私人日记和四记记录默认关闭外部访问。原始笔记、人生原则与重大决定始终保留由你管理。</p></section>';
}
export function renderLibrary(ctx) {
  const renderer={knowledge,explore,journal,review,ai:assistant}[ctx.route];
  return renderer?'<div class="lib-root">'+renderer(ctx)+'</div>':'';
}
const ROUTE_FIELDS = [
  ['people','同行人员'],['route','路线与停靠点'],['transport','交通'],['hotel','住宿'],
  ['budget','预算'],['prep','准备事项'],['safety','安全提醒']
];
const LINK_TYPES=[['projects','项目'],['tasks','任务'],['trips','旅行与探索'],['goals','长期目标'],['visions','愿景']];
function linkInputs(ctx,current) {
  return '<details class="lib-more"><summary>关联项目、任务、旅行与长期目标</summary><div class="lib-link-options">'+LINK_TYPES.map(([key,name])=>{
    const options=ctx.state[key]||[];
    if (!options.length) return '';
    return '<fieldset><legend>'+name+'</legend>'+options.map(i=>{
      const value=key+':'+i.id;
      return '<label><input type="checkbox" name="links" value="'+ctx.esc(value)+'"'+(current.includes(value)?' checked':'')+'><span>'+ctx.esc(i.title)+'</span></label>';
    }).join('')+'</fieldset>';
  }).join('')+'</div></details>';
}
function noteForm(ctx,item={}) {
  const e=ctx.esc;
  return field('标题',textIn(e,'title',item.title,'text',true))+
    '<div class="lib-form-grid">'+field('知识分类',selectIn(e,'category',KNOWLEDGE,item.category))+field('内容性质',selectIn(e,'evidence',EVIDENCE,item.evidence))+'</div>'+
    field('原文 / 笔记',area(e,'body',item.body,true,5))+
    field('标签（用逗号分隔）',textIn(e,'tags',(item.tags||[]).join('，')))+field('资料来源链接',textIn(e,'url',item.url,'url'));
}
function tripForm(ctx,item={}) {
  const e=ctx.esc;
  return field('名称',textIn(e,'title',item.title,'text',true))+
    '<div class="lib-form-grid">'+field('探索类型',selectIn(e,'type',TRIP_TYPES,item.type))+field('当前状态',selectIn(e,'status',TRIP_STATES,item.status))+'</div>'+
    field('目的地 / 地点',textIn(e,'destination',item.destination))+
    '<div class="lib-form-grid">'+field('起始日期',textIn(e,'start',item.start,'date'))+field('结束日期',textIn(e,'end',item.end,'date'))+'</div>'+
    field('想法、文化资料或实际体验',area(e,'body',item.body))+
    '<details class="lib-more"><summary>行程与准备</summary><div class="lib-extra-fields">'+ROUTE_FIELDS.map(([key,label])=>field(label,key==='route'||key==='prep'?area(e,key,item[key],false,2):textIn(e,key,item[key]))).join('')+'</div></details>';
}
function entryForm(ctx,item={},category) {
  const e=ctx.esc;
  return field('标题',textIn(e,'title',item.title,'text',true))+
    '<div class="lib-form-grid">'+field('记录类型',selectIn(e,'category',ENTRY_TYPES,item.category||category||'每日日记'))+field('记录日期',textIn(e,'date',item.date||ctx.today(),'date',true))+'</div>'+
    field('记录内容',area(e,'body',item.body,true,5))+linkInputs(ctx,item.links||[])+
    '<details class="lib-more"><summary>添加照片或视频</summary>'+field('本机附件', '<input type="file" accept="image/*,video/*" name="media" multiple>')+'<p class="lib-hint">附件留在当前浏览器中。'+(item.media?.length?'已保存 '+item.media.length+' 个附件。':'')+'</p></details>';
}
function reviewForm(ctx,item={}) {
  const e=ctx.esc, given=ctx.params.get('period'),span=item.period||(['每日','每周','每月'].includes(given)?given:'每日');
  const rawDay=ctx.params.get('date');
  const day=item.date||(/^\d{4}-\d\d-\d\d$/.test(rawDay||'')?rawDay:ctx.today());
  return '<div class="lib-form-grid">'+field('周期',selectIn(e,'period',['每日','每周','每月'],span))+field('周期内日期',textIn(e,'date',day,'date',true))+'</div>'+
    field('复盘标题',textIn(e,'title',item.title||'','text',true))+
    field('实际做成的事 / 留下的作品',area(e,'body',item.body,true))+
    field('能力变化与证据',area(e,'learning',item.learning,false,2))+field('下一步调整',area(e,'next',item.next,false,2));
}
let mediaDb;
function db() {
  if (!mediaDb) {
    mediaDb=new Promise((resolve,reject)=>{
      const req=indexedDB.open('personal-life-os-media-v1',1);
      req.onupgradeneeded=()=>req.result.createObjectStore('media');
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    }).catch(error=>{mediaDb=undefined;throw error;});
  }
  return mediaDb;
}
export async function writeMedia(files,uid) {
  if (!files.length) return [];
  const database=await db(), refs=files.map(f=>({id:uid(),name:f.name,type:f.type}));
  await new Promise((resolve,reject)=>{
    const txn=database.transaction('media','readwrite'),store=txn.objectStore('media');
    files.forEach((f,i)=>store.add(f,refs[i].id));
    txn.oncomplete=resolve;
    txn.onerror=()=>reject(txn.error);
    txn.onabort=()=>reject(txn.error);
  });
  return refs;
}
export async function readMedia(id) {
  const database=await db();
  return new Promise((resolve,reject)=>{
    const req=database.transaction('media').objectStore('media').get(id);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
export function reviseLibraryItem(old,fields) {
  const {revisions,...snapshot}=old||{};
  const time=new Date().toISOString();
  return {
    ...old,...fields,source:'user',basedOnDemo:old?.source==='demo'||!!old?.basedOnDemo,
    originalText:old?.originalText??old?.body??fields.body,createdAt:old?.createdAt||time,updatedAt:time,
    revisions:old?[...(revisions||[]),{...snapshot,supersededAt:time}] : []
  };
}
function inputData(form,kind,ctx,previous) {
  const values=new FormData(form);
  const text=key=>String(values.get(key)||'');
  const title=text('title').trim(), body=text('body');
  if (!title||(kind!=='trip'&&!body.trim())) throw Error('请补充标题与正文。');
  const item={id:previous?.id||ctx.uid(),title,body,date:text('date')||ctx.today()};
  if (kind==='entry') return {...item,category:text('category'),links:values.getAll('links'),media:previous?.media||[]};
  if (kind==='note') {
    const url=text('url').trim();
    if (url&&!urlSafe(url)) throw Error('来源请使用有效的 http 或 https 链接。');
    return {...item,date:previous?.date||item.date,category:text('category'),evidence:text('evidence'),tags:[...new Set(text('tags').split(/[,，、]/).map(t=>t.trim()).filter(Boolean))],url,starred:previous?.starred||false};
  }
  if (kind==='trip') {
    if (text('start')&&text('end')&&text('end')<text('start')) throw Error('结束日期需晚于或等于起始日期。');
    return {...item,...Object.fromEntries(['type','status','destination','start','end',...ROUTE_FIELDS.map(([k])=>k)].map(k=>[k,text(k)]))};
  }
  const period=text('period'), [begin,end]=periodRange(item.date,period);
  return {...item,period,begin,end,learning:text('learning'),next:text('next')};
}
function editor(ctx,kind,previous,category) {
  const labels={note:'知识',trip:'探索',entry:'人生记录',review:'复盘'};
  const build={note:noteForm,trip:tripForm,entry:entryForm,review:reviewForm}[kind];
  ctx.modal((previous?'编辑':'新增')+labels[kind],formWrap(build(ctx,previous,category)),dialog=>{
    const form=dialog.querySelector('.lib-form');
    form.querySelector('[data-form-cancel]').onclick=()=>ctx.closeModal();
    form.onsubmit=async event=>{
      event.preventDefault();
      const feedback=form.querySelector('.lib-form-feedback'), submit=form.querySelector('[type=submit]');
      if (submit.disabled) return;
      submit.disabled=true;
      try {
        const data=inputData(form,kind,ctx,previous);
        if (kind==='entry') {
          const files=[...form.elements.media.files];
          if (files.some(f=>!f.type.startsWith('image/')&&!f.type.startsWith('video/'))) throw Error('请选择照片或视频文件。');
          data.media=[...data.media,...await writeMedia(files,ctx.uid)];
        }
        const collection=COLLECTIONS[kind];
        const saved=ctx.save(s=>{
          const index=s[collection].findIndex(r=>r.id===data.id);
          const latest=s[collection][index];
          if(previous&&(!latest||latest.updatedAt!==previous.updatedAt))throw Error('此条记录已在其他窗口更新，请重新打开后编辑。');
          if(kind==='note'&&latest)data.starred=latest.starred;
          const next=reviseLibraryItem(latest,data);
          if(index===-1)s[collection].unshift(next);
          else s[collection][index]=next;
        });
        if(saved===false)throw Error('本机保存失败，请检查可用存储空间后重试。');
        ctx.closeModal();
        if(kind==='review')ctx.go('review',{period:data.period,date:data.date});
        ctx.toast('已保存到本机');
      } catch(error) { feedback.textContent=error.message||'保存失败，请重试。'; }
      finally {submit.disabled=false;}
    };
  });
}
export function openNote(ctx) { editor(ctx,"note"); }
export function openLibraryRecord(ctx,kind,id) { detail(ctx,kind,id); }
export function openEntry(ctx, category='创作灵感') { editor(ctx,'entry',undefined,category); }
function detailRows(ctx,items) {
  return '<dl class="lib-detail-rows">'+items.filter(([,val])=>val!==undefined&&val!==null&&val!=='').map(([label,val])=>'<div><dt>'+label+'</dt><dd>'+ctx.esc(String(val))+'</dd></div>').join('')+'</dl>';
}
function history(ctx,item) {
  if(!item.revisions?.length) return '';
  return '<details class="lib-more"><summary>原始内容与修订记录（'+item.revisions.length+'）</summary><div class="lib-history"><strong>首次保存的原文</strong><p>'+ctx.esc(item.originalText||'（无正文）')+'</p>'+[...item.revisions].reverse().map(v=>'<div><small>'+ctx.esc(new Date(v.supersededAt).toLocaleString('zh-CN'))+' 之前</small><strong>'+ctx.esc(v.title)+'</strong><p>'+ctx.esc(v.body||'（无正文）')+'</p>'+detailRows(ctx,[['分类',v.category||v.type],['性质',v.evidence||v.status],['来源',v.url],['日期',v.date],['能力变化',v.learning],['下一步',v.next]])+'</div>').join('')+'</div></details>';
}
function detail(ctx,kind,id) {
  const item=ctx.state[COLLECTIONS[kind]]?.find(i=>i.id===id);
  if(!item)return;
  let extra='';
  if(kind==='note'){
    extra=detailRows(ctx,[['知识分类',item.category],['内容性质',item.evidence],['标签',(item.tags||[]).join(' · ')]]);
    const safeUrl=urlSafe(item.url);
    if(safeUrl)extra+='<a class="lib-source" href="'+ctx.esc(safeUrl)+'" rel="noopener noreferrer" target="_blank">'+ctx.icon('external-link',16)+' 打开资料来源</a>';
  }
  if(kind==='trip')extra=detailRows(ctx,[['状态',item.status],['类型',item.type],['目的地',item.destination],['计划日期',[item.start,item.end].filter(Boolean).join(' 至 ')],...ROUTE_FIELDS.map(([k,label])=>[label,item[k]])])+'<p class="lib-hint">地图和 AI 行程规划为预留能力。</p>';
  if(kind==='review')extra=detailRows(ctx,[['复盘周期',item.period+' · '+item.begin+' 至 '+item.end],['能力变化与证据',item.learning],['下一步调整',item.next]]);
  if(kind==='entry'){
    const links=(item.links||[]).map(code=>{
      const idx=code.indexOf(':');
      const key=code.slice(0,idx), identity=code.slice(idx+1);
      return (ctx.state[key]||[]).find(r=>r.id===identity)?.title;
    }).filter(Boolean);
    extra=detailRows(ctx,[['类型',item.category],['关联',links.join(' · ')]]);
    if(item.media?.length)extra+='<div class="lib-media">'+item.media.map(m=>'<figure data-media-id="'+ctx.esc(m.id)+'"><figcaption>'+ctx.esc(m.name)+'</figcaption></figure>').join('')+'</div>';
  }
  ctx.modal(item.title,'<div class="lib-detail"><div class="lib-kicker">'+badge(item)+' '+ctx.esc(item.date||'')+'</div><p class="lib-body">'+ctx.esc(item.body||'')+'</p>'+extra+history(ctx,item)+'<div class="lib-form-actions"><button class="btn primary" data-lib-edit>'+ctx.icon('pen',16)+' 编辑</button></div></div>',dialog=>{
    dialog.querySelector('[data-lib-edit]').onclick=()=>{ctx.closeModal();editor(ctx,kind,item);};
    if(item.media?.length)displayMedia(dialog,item.media);
  });
}
async function displayMedia(dialog,media) {
  const targets=Array.from(dialog.querySelectorAll('[data-media-id]'));
  for(const target of targets){
    const ref=media.find(m=>m.id===target.dataset.mediaId);
    let blob;
    try {blob=await readMedia(ref.id);} catch { /* Keep the filename visible when local storage is unavailable. */ }
    if(!target.isConnected)continue;
    if(!blob){target.append(document.createTextNode('本机未找到附件'));continue;}
    const url=URL.createObjectURL(blob);
    const mediaElement=document.createElement(ref.type.startsWith('video/')?'video':'img');
    if(mediaElement.tagName==='VIDEO'){mediaElement.controls=true;mediaElement.preload='metadata';}else{mediaElement.alt=ref.name;}
    mediaElement.src=url;target.prepend(mediaElement);
    const watch=new MutationObserver(()=>{
      if(!target.isConnected||dialog.open===false){
        URL.revokeObjectURL(url);watch.disconnect();
      }
    });
    watch.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
  }
}
export function bindLibrary(ctx) {
  const root=document.querySelector('.lib-root');
  if(!root)return;
  const changeParam=(key,value)=>ctx.go(ctx.route,{...Object.fromEntries(ctx.params.entries()),[key]:value});
  const search=root.querySelector('[data-lib-search]'),category=root.querySelector('[data-lib-category]');
  const refreshNotes=()=>{root.querySelector('[data-lib-results]').innerHTML=knowledgeResults(ctx,search.value,category.value,ctx.params.get('filter')==='已收藏');};
  if(search){search.oninput=refreshNotes;category.onchange=refreshNotes;}
  const journalSelect=root.querySelector('[data-entry-filter]');
  if(journalSelect)journalSelect.onchange=()=>changeParam('filter',journalSelect.value);
  const reviewDate=root.querySelector('[data-review-date]');
  if(reviewDate)reviewDate.onchange=()=>{if(reviewDate.value)changeParam('date',reviewDate.value);};
  root.onclick=event=>{
    const button=event.target.closest('[data-lib]');
    if(!button||!root.contains(button))return;
    const {lib:operation,id,kind,param,value}=button.dataset;
    if(operation==='segment')changeParam(param,value);
    if(operation==='detail')detail(ctx,kind,id);
    if(operation.startsWith('new-'))editor(ctx,operation.slice(4));
    if(operation==='star'){
      const query=search.value,selected=category.value;
      ctx.save(s=>{const n=s.notes.find(i=>i.id===id);if(n)n.starred=!n.starred;});
      const nextSearch=document.querySelector('[data-lib-search]'),nextCategory=document.querySelector('[data-lib-category]');
      if(nextSearch&&nextCategory){
        nextSearch.value=query;nextCategory.value=selected;nextSearch.dispatchEvent(new Event('input'));
      }
    }
  };
}
