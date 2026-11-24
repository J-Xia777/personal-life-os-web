// Read-only boundary. A future authorized adapter can provide the same daily summary.
export const sijiURL = 'https://37k7rjf6iw2zwfv2zt0.traesite.cn/';
export function exampleDailySummary() {
  return {
    source: 'demo',
    measures: [
      {title:'花销', value:'36',unit:'元',symbol:'wallet',tone:'sand'},
      {title:'饮食', value:'2',unit:'次',symbol:'apple',tone:'sage'},
      {title:'欲望', value:'1',unit:'次',symbol:'flame',tone:'lilac'},
      {title:'行善', value:'1',unit:'件',symbol:'hand',tone:'blue'}
    ]
  };
}

// Accept the public v1 backup, then discard all record-level information.
export function summarizeBackup(data) {
  if(data?.app!=='四记'||data.version!==1||!Array.isArray(data.entries)||data.count!==data.entries.length||!Number.isSafeInteger(data.exportedAt)||!Number.isFinite(new Date(data.exportedAt).getTime()))
    throw Error('请选择四记「明细 → 导出备份」生成的 v1 JSON 文件。');
  const byDay={}, ids=new Set();
  for(const [n,e] of data.entries.entries()) {
    const date=new Date(e?.ts);
    if(!e||!['money','food','desire','kind'].includes(e.type)||!Number.isSafeInteger(e.ts)||!Number.isFinite(date.getTime())||!e.id||ids.has(e.id))
      throw Error('第 '+(n+1)+' 条记录格式异常或 ID 重复，请重新导出备份。');
    ids.add(e.id);
    const day=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
    const bucket=byDay[day]??={out:0,income:0,food:0,desire:0,kind:0};
    if(e.type==='money'){
      if(!Number.isFinite(e.amount)||e.amount<0||!Number.isSafeInteger(Math.round(e.amount*100))||(e.income!=null&&typeof e.income!=='boolean'))throw Error('备份中存在无效的金额或收支类型。');
      bucket[e.income?'income':'out']+=Math.round(e.amount*100);
    }else bucket[e.type]++;
  }
  return {byDay,count:data.count,exportedAt:data.exportedAt,importedAt:Date.now()};
}
export function dailySummary(snapshot,day){
  if(!snapshot)return exampleDailySummary();
  const b=snapshot.byDay[day]||{out:0,income:0,food:0,desire:0,kind:0};
  const net=(b.income-b.out)/100;
  const measures=exampleDailySummary().measures;
  const values=[(net<0?'−':net>0?'+':'')+'$'+Math.abs(net).toLocaleString('en-US',{maximumFractionDigits:2}),b.food,b.desire,b.kind];
  return {source:'import',measures:measures.map((m,i)=>({...m,value:values[i],title:i?m.title:'净收支',unit:i?m.unit:''}))};
}
