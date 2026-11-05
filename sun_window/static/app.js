
const R=Math.PI/180,$=i=>document.getElementById(i),STEP=5,N=288;
const MO=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const DIRS=[['เหนือ',0],['ตะวันออกเฉียงเหนือ',45],['ตะวันออก',90],['ตะวันออกเฉียงใต้',135],['ใต้',180],['ตะวันตกเฉียงใต้',225],['ตะวันตก',270],['ตะวันตกเฉียงเหนือ',315]];
const ALIAS={'ตะวันออกเฉียงเหนือ':45,'ตะวันออกเฉียงใต้':135,'ตะวันตกเฉียงใต้':225,'ตะวันตกเฉียงเหนือ':315,'ตะวันออก':90,'ตะวันตก':270,'เหนือ':0,'ใต้':180,'ออก':90,'ตก':270,'northeast':45,'southeast':135,'southwest':225,'northwest':315,'north':0,'south':180,'east':90,'west':270,'ne':45,'se':135,'sw':225,'nw':315,'n':0,'s':180,'e':90,'w':270};
const pad=n=>String(n).padStart(2,'0'),hm=m=>pad(Math.floor(m/60))+':'+pad(Math.round(m%60)),dur=m=>{m=Math.round(m);return m>=60?Math.floor(m/60)+' ชม. '+(m%60?m%60+' นาที':''):m+' นาที'};
const dname=a=>{a=((a%360)+360)%360;let b=DIRS.reduce((p,c)=>Math.min(Math.abs(c[1]-a),360-Math.abs(c[1]-a))<Math.min(Math.abs(p[1]-a),360-Math.abs(p[1]-a))?c:p);return b[0]};


const runs=(a,f)=>{const r=[];let s=-1;a.forEach((v,i)=>{if(f(v)){if(s<0)s=i}else if(s>=0){r.push([s,i-1]);s=-1}});if(s>=0)r.push([s,a.length-1]);return r};
const dstr=d=>S.dm[d][1]+' '+MO[S.dm[d][0]];
const rng=([a,b])=>a===b?dstr(a):dstr(a)+' – '+dstr(b)+' ('+(b-a+1)+' วัน)';
const topM=(a,n,asc)=>a.map((v,i)=>[v,i]).sort((x,y)=>asc?x[0]-y[0]:y[0]-x[0]).slice(0,n).map(x=>x[1]);
let S=null,MK=null,SE=[];
/* ---------- parse ---------- */
function parseDir(t){t=t.trim().toLowerCase().replace(/[°องศา\s]+$/g,m=>/องศา|°/.test(m)?'':m);
 const n=t.match(/^-?\d+(\.\d+)?$/);if(n)return((+t%360)+360)%360;
 const keys=Object.keys(ALIAS).sort((a,b)=>b.length-a.length);const k=keys.find(x=>t===x)||keys.find(x=>t.replace(/^(ทิศ|ไป|หัน)/,'')===x);
 return k===undefined?null:ALIAS[k]}
function parseCo(t){const m=t.match(/-?\d+(?:\.\d+)?/g);if(!m||m.length<2)return null;const a=+m[0],b=+m[1];return Math.abs(a)<=90&&Math.abs(b)<=180?[a,b]:null}


const dark=()=>matchMedia('(prefers-color-scheme:dark)').matches&&document.documentElement.dataset.theme!=='light'||document.documentElement.dataset.theme==='dark';
function summary(F,w){
 const sun=F.hrs.filter(h=>h>=.25).length,hi=topM(F.ms,2),lo=topM(F.ms,2,1);
 $('sum').innerHTML=[['ทิศ '+dname(w),Math.round(w)+'°','หน้าต่างหันไปทางนี้'],['ชั่วโมงแดดเข้าเฉลี่ย',F.avgH.toFixed(1)+' <small>ชม./วัน</small>','ตลอดทั้งปี'],['วันที่มีแดดเข้า',sun+' <small>/ '+S.nd+' วัน</small>','ไม่มีแดด '+(S.nd-sun)+' วัน'],['แดดแรงสุด / น้อยสุด',MO[hi[0]]+' / '+MO[lo[0]],'แรง: '+hi.map(i=>MO[i]).join(', ')+' • น้อย: '+lo.map(i=>MO[i]).join(', ')]]
 .map(c=>`<div class="card" style="margin:0"><div class="lab">${c[0]}</div><div class="k">${c[1]}</div><div class="lab">${c[2]}</div></div>`).join('');
}
function daily(D,F,d){
 const I=D.I,E=D.el,A=D.az,seg=f=>runs(Array.from(I,(_,i)=>i),f).map(([x,y])=>[x*STEP,(y+1)*STEP]);
 const mx=Math.max(0,...I),pk=I.indexOf(mx),on=seg(i=>I[i]>0),str=seg(i=>mx>0&&I[i]>=.6*mx),no=seg(i=>E[i]>0&&I[i]===0);
 const L=a=>a.length?'<ul>'+a.map(s=>`<li>${hm(s[0])} – ${hm(s[1])} <span class="lab">(${dur(s[1]-s[0])})</span></li>`).join('')+'</ul>':'<div class="lab">ไม่มี</div>';
 $('dh').textContent='รายละเอียดวันที่ '+dstr(d)+' '+S.year;
 $('day').innerHTML=`<span class="pill p-s">แดดเข้า</span>${L(on)}<div style="margin-top:8px"><span class="pill p-s">แดดแรง (≥60% ของสูงสุด)</span>${L(str)}</div><div style="margin-top:8px"><span class="pill p-n">กลางวันแต่ไม่มีแดดเข้า</span>${L(no)}</div>`+
 (mx>0?`<div class="lab" style="margin-top:8px">แรงสุดเวลา ${hm(pk*STEP)} (มุมสูง ${E[pk].toFixed(0)}°, ทิศ ${A[pk].toFixed(0)}°) รวม ${F.hrs[d].toFixed(1)} ชม.</div>`:'<div class="lab" style="margin-top:8px">วันนี้แดดไม่เข้าหน้าต่างทิศนี้เลย</div>');
}
function polar(w,d){
 const c=130,P=(az,el)=>{const r=110*(90-el)/90;return[c+r*Math.sin(az*R),c-r*Math.cos(az*R)]};
 let path='',dots='';for(let i=0;i<N;i++){const e=S.day.el[i];if(e>0){const[x,y]=P(S.day.az[i],e);path+=(path?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);if(i%12===0)dots+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="var(--acc)"/><text x="${(x+5).toFixed(1)}" y="${(y-5).toFixed(1)}" font-size="10">${i/12}</text>`}}
 let arc='';for(let a=w-90;a<=w+90;a+=5){const p=[c+121*Math.sin(a*R),c-121*Math.cos(a*R)];arc+=(arc?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)}
 const[nx,ny]=[c+121*Math.sin(w*R),c-121*Math.cos(w*R)];
 $('polar').innerHTML=`<svg viewBox="0 0 260 260" width="100%" style="max-width:300px"><g fill="none" stroke="var(--line)"><circle cx="130" cy="130" r="110"/><circle cx="130" cy="130" r="73.3"/><circle cx="130" cy="130" r="36.7"/><path d="M130 20V240M20 130H240"/></g>
 <text x="126" y="14">N</text><text x="248" y="134">E</text><text x="126" y="256">S</text><text x="6" y="134">W</text>
 <path d="${arc}" fill="none" stroke="var(--lo)" stroke-width="5" stroke-linecap="round" opacity=".8"/><circle cx="${nx}" cy="${ny}" r="6" fill="var(--lo)"/>
 <path d="${path}" fill="none" stroke="var(--acc)" stroke-width="2.4"/>${dots}</svg><div class="lab">เส้นส้ม = ทางเดินของดวงอาทิตย์ (ตัวเลข = ชั่วโมง), เส้นฟ้า = ครึ่งฟ้าที่ผนังรับแดดได้, จุดฟ้า = ทิศที่หน้าต่างหัน, วงในคือมุมสูงมากขึ้น</div>`;
}
function heat(){
 const cv=$('hm'),rows=S.rows,nd=S.nd,x=cv.getContext('2d');cv.width=nd;cv.height=rows;
 const img=x.createImageData(nd,rows),D=dark(),lo=D?[120,70,20]:[253,214,160],hi=D?[255,226,140]:[196,52,6],ni=D?[8,20,28]:[190,202,216],sh=D?[30,64,86]:[226,236,246];
 for(let d=0;d<nd;d++)for(let r=0;r<rows;r++){const k=S.codes[d*rows+r];let c;
  if(k>1){const t=Math.min(1,(k-2)/253/.95);c=lo.map((v,i)=>v+(hi[i]-v)*t)}else c=k?sh:ni;
  img.data.set([c[0],c[1],c[2],255],(r*nd+d)*4)}
 x.putImageData(img,0,0);
 $('yl').innerHTML='';for(let h=Math.ceil(S.lo*STEP/60);h*60<=S.hi*STEP;h+=2)$('yl').innerHTML+=`<span class="yl" style="top:calc(${(h*60/STEP-S.lo)/rows*260}px - 9px)">${pad(h)}:00</span>`;
 $('xl').innerHTML=MO.map(m=>`<span>${m}</span>`).join('');
 cv.onpointermove=cv.onpointerdown=e=>{const b=cv.getBoundingClientRect(),d=Math.max(0,Math.min(nd-1,Math.floor((e.clientX-b.left)/b.width*nd))),r=Math.max(0,Math.min(rows-1,Math.floor((e.clientY-b.top)/b.height*rows))),j=d*rows+r,k=S.codes[j];
  $('tip').textContent=`${dstr(d)} ${hm((S.lo+r)*STEP)} • มุมสูง ${(S.el[j]/100).toFixed(1)}° ทิศ ${(S.az[j]/100).toFixed(0)}° • `+(k>1?'แดดเข้า ความแรง '+Math.round((k-2)/253*100)+'%':k?'ไม่มีแดดเข้า':'กลางคืน')}
}
function periods(F){
 const no=runs(F.hrs,h=>h<.25),sun=runs(F.hrs,h=>h>=.25),full=runs(F.hrs,h=>h>=8);
 const L=(a,e)=>a.length?'<ul>'+a.map(r=>`<li>${rng(r)}</li>`).join('')+'</ul>':`<div class="lab">${e}</div>`;
 $('per').innerHTML=`<span class="pill p-s">มีแดดเข้า (≥15 นาที/วัน)</span>${L(sun,'ไม่มี')}<div style="margin-top:10px"><span class="pill p-n">ไม่มีแดดเข้าเลยทั้งวัน</span>${L(no,'มีแดดเข้าทุกวัน')}</div><div style="margin-top:10px"><span class="pill p-s">แดดเข้ามากกว่า 8 ชม./วัน</span>${L(full,'ไม่มีช่วงนี้')}</div>`;
}
function bars(F){const mx=Math.max(12,...F.mh);$('bars').innerHTML=F.mh.map((v,i)=>`<div title="ความแรงเฉลี่ย ${F.ms[i].toFixed(2)}"><b style="font-weight:500">${v.toFixed(1)}</b><i style="height:${v/mx*110}px"></i>${MO[i]}</div>`).join('')}
function compare(w){
 const C=S.cmp.map(F=>({n:F.n,a:F.a,F}));
 const sorted=[...C].sort((x,y)=>y.F.avgS-x.F.avgS),mx=sorted[0].F.avgS,mn=sorted[sorted.length-1];
 const ties=C.filter(o=>o.F.avgS>mx*.98).map(o=>o.n).join(' / ');
 $('cmpH').innerHTML=`<span class="pill p-s">โดนแดดมากสุด: ${ties} (${mx.toFixed(2)})</span> <span class="pill p-n">น้อยสุด: ${mn.n} (${mn.F.avgS.toFixed(2)})</span>`;
 $('cmp').innerHTML='<tr><th>ทิศ</th><th>ความแรงแดด</th><th>ชม./วัน</th><th>เดือนแดดแรง</th><th>เดือนแดดน้อย</th><th>เวลาแดดแรงในวัน</th></tr>'+sorted.map(o=>{
  const F=o.F,pk=Math.max(...F.tod),r=runs(Array.from(F.tod),v=>v>=.6*pk).sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];
  return`<tr class="${Math.abs(o.a-w)<1?'sel':''}"><td><b>${o.n}</b> <span class="lab">${o.a}°</span></td><td><div class="meter"><b style="width:${F.avgS/mx*100}%"></b></div>${F.avgS.toFixed(2)}</td><td>${F.avgH.toFixed(1)}</td><td>${topM(F.ms,3).map(i=>MO[i]).join(', ')}</td><td>${topM(F.ms,3,1).map(i=>MO[i]).join(', ')}</td><td>${pk>0&&r?hm(r[0]*STEP)+' – '+hm((r[1]+1)*STEP):'—'}</td></tr>`}).join('');
}
function seasonCard(w){
 const F=S.sel,T=F.ss[0]+F.ss[1]+F.ss[2],q=F.ss.map(v=>T?v/T:0),pc=v=>Math.round(v*100)+'%',COL=['var(--hi)','color-mix(in srgb,var(--mute) 60%,transparent)','var(--lo)'];
 const C=S.cmp.map(f=>({n:f.n,a:f.a,F:f,w:f.ss[2]/S.nd,b:f.ss[2]/S.nd-f.heat})),rk=1+C.filter(o=>o.F.heat<F.heat-1e-9).length;
 const v=!T?'แดดแทบไม่เข้าทิศนี้เลย จึงไม่เพิ่มความร้อนทั้งปี':q[2]>=.55?`แดดส่วนใหญ่ (${pc(q[2])}) เข้าช่วง${MK.n[2]} จึงอุ่นสบายและไม่เพิ่มความร้อนตอนหน้าร้อน`:q[0]>=.4?`แดด ${pc(q[0])} เข้าช่วง${MK.n[0]} ซึ่งเป็นช่วงที่ร้อนอยู่แล้ว ห้องจะร้อนขึ้นอีก`:`แดดกระจายหลายฤดู (${MK.n[0]} ${pc(q[0])}, ${MK.n[1]} ${pc(q[1])}, ${MK.n[2]} ${pc(q[2])})`;
 $('seaSel').innerHTML=`<div class="lab">ทิศ ${dname(w)} (${Math.round(w)}°) • ภาระความร้อนอันดับที่ ${rk} จาก 8 ทิศ (1 = เย็นที่สุด)</div><table>`+MK.n.map((n,i)=>`<tr><td><b>${n}</b><div class="lab">${MK.r[i]}</div></td><td>${F.sd[i]?(F.sh[i]/F.sd[i]).toFixed(1):'0.0'} ชม./วัน</td><td style="min-width:150px"><div class="meter"><b style="width:${q[i]*100}%;background:${COL[i]}"></b></div>${pc(q[i])} ของแดดทั้งปี</td></tr>`).join('')+`</table><p style="margin:8px 0 0"><b>${v}</b></p>`;
 const byH=[...C].sort((x,y)=>x.F.heat-y.F.heat),by=k=>[...C].sort((x,y)=>y[k]-x[k])[0],mx=Math.max(...C.map(o=>o.F.avgS),.001);
 $('seaH').innerHTML=`<span class="pill p-n">เย็นสุด (ภาระความร้อนต่ำสุด): ${byH[0].n}</span> <span class="pill p-s">ร้อนสุด: ${byH[7].n}</span> <span class="pill p-n">อุ่นหน้าหนาวดีสุด: ${by('w').n}</span> <span class="pill p-s">สมดุลดีสุด: ${by('b').n}</span>`;
 $('seaT').innerHTML='<tr><th>ทิศ</th><th>แดดทั้งปี แยกตามฤดู</th><th>ภาระความร้อน</th><th>แดดหน้าหนาว</th><th>คะแนนสมดุล</th></tr>'+[...C].sort((x,y)=>y.b-x.b).map(o=>{const f=o.F,t=f.ss[0]+f.ss[1]+f.ss[2];return`<tr class="${Math.abs(o.a-w)<1?'sel':''}"><td><b>${o.n}</b> <span class="lab">${o.a}°</span></td><td style="min-width:150px"><div class="meter" style="width:${f.avgS/mx*100}%;display:flex;overflow:hidden;min-width:3px">${f.ss.map((s,i)=>`<b style="width:${t?s/t*100:0}%;border-radius:0;background:${COL[i]}"></b>`).join('')}</div>${f.avgS.toFixed(2)}</td><td>${f.heat.toFixed(2)}</td><td>${o.w.toFixed(2)}</td><td><b>${o.b>0?'+':''}${o.b.toFixed(2)}</b></td></tr>`}).join('');
 const BG=['color-mix(in srgb,var(--hi) 40%,transparent)','color-mix(in srgb,var(--mute) 25%,transparent)','color-mix(in srgb,var(--lo) 40%,transparent)'],g=[];
 SE.forEach((s,i)=>{if(i&&SE[i-1]===s)g[g.length-1][1]++;else g.push([s,1])});
 $('ss').innerHTML=g.map(([s,l])=>`<span style="flex:${l};background:${BG[s]};text-align:center;overflow:hidden;white-space:nowrap;padding:1px 0">${l>45?MK.n[s]:''}</span>`).join('');
}
const b64=(s,T)=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return T===Uint8Array?u:new T(u.buffer)};
let busy=0;
async function run(){
 const co=parseCo($('co').value),w=parseDir($('di').value);
 if(!co){$('err').textContent='พิกัดไม่ถูกต้อง ลองพิมพ์เช่น 13.4533,101.0646';return}
 if(w===null){$('err').textContent='ไม่รู้จักทิศนี้ พิมพ์ เหนือ ใต้ ออก ตก หรือองศา 0–360 (0 = เหนือ, 90 = ตะวันออก)';return}
 $('err').textContent='';if(!$('tz').dataset.t)$('tz').value=Math.round(co[1]/15);
 const dv=$('dt').value||new Date().toISOString().slice(0,10),y=+dv.slice(0,4),di=Math.round((Date.UTC(y,+dv.slice(5,7)-1,+dv.slice(8,10))-Date.UTC(y,0,1))/864e5),id=++busy;
 let j;try{const r=await fetch('/api/analyze?'+new URLSearchParams({lat:co[0],lon:co[1],tz:+$('tz').value||0,year:y,wall:w,season:$('se').value,day:di}));j=await r.json();if(!r.ok)throw new Error(j.error||r.status)}
 catch(e){$('err').textContent='คำนวณไม่สำเร็จ: '+e.message;return}
 if(id!==busy)return;
 j.dm=Array.from({length:j.nd},(_,d)=>{const o=new Date(Date.UTC(y,0,1+d));return[o.getUTCMonth(),o.getUTCDate()]});
 j.codes=b64(j.codes,Uint8Array);j.el=b64(j.el,Int16Array);j.az=b64(j.az,Int16Array);
 S=j;MK=j.season;SE=j.season.se;
 document.querySelectorAll('#chips button').forEach(b=>b.classList.toggle('on',+b.dataset.a===w));
 summary(j.sel,w);daily(j.day,j.sel,di);polar(w,di);heat();periods(j.sel);bars(j.sel);compare(w);seasonCard(w);
}
/* ---------- init ---------- */
$('chips').innerHTML=DIRS.map(([n,a])=>`<button type="button" data-a="${a}">${n} ${a}°</button>`).join('');
$('chips').onclick=e=>{const a=e.target.dataset.a;if(a!==undefined){$('di').value=a;run()}};
$('tz').oninput=()=>{$('tz').dataset.t=1};
let T;['co','tz','di','dt','se'].forEach(i=>$(i).addEventListener('input',()=>{clearTimeout(T);T=setTimeout(run,300)}));
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>S&&run());
$('dt').value=new Date().toISOString().slice(0,10);run();
