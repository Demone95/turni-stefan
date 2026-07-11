const reference=new Date(2026,6,6); // lunedì 6 luglio 2026 = turno 2
const cycle=[2,1,3];
const picker=document.getElementById('datePicker'), cal=document.getElementById('calendar');
let view=new Date(); view.setDate(1);
const pad=n=>String(n).padStart(2,'0');
const localISO=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
function mondayOf(d){let x=new Date(d.getFullYear(),d.getMonth(),d.getDate()),day=x.getDay();x.setDate(x.getDate()-(day===0?6:day-1));return x}
function shiftFor(d){if(d.getDay()===0)return 0;const weeks=Math.round((mondayOf(d)-reference)/604800000);return cycle[((weeks%3)+3)%3]}
function show(d){picker.value=localISO(d);const s=shiftFor(d),b=document.getElementById('shiftBadge');b.className='badge '+(s?'shift'+s:'sunday');b.textContent=s?s+'°':'☕';document.getElementById('shiftTitle').textContent=s?`${s}° turno`:'Riposo';document.getElementById('shiftInfo').textContent=d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});render()}
function render(){cal.innerHTML='';document.getElementById('monthTitle').textContent=view.toLocaleDateString('it-IT',{month:'long',year:'numeric'});let first=(view.getDay()+6)%7,days=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();for(let i=0;i<first;i++){let e=document.createElement('span');e.className='day empty';cal.append(e)}for(let n=1;n<=days;n++){let d=new Date(view.getFullYear(),view.getMonth(),n),s=shiftFor(d),btn=document.createElement('button');btn.className='day '+(s?'shift'+s:'sunday');if(localISO(d)===picker.value)btn.classList.add('selected');if(localISO(d)===localISO(new Date()))btn.classList.add('today');btn.innerHTML=`${n}<small>${s?s+'°':'R'}</small>`;btn.onclick=()=>show(d);cal.append(btn)}}
document.getElementById('prev').onclick=()=>{view.setMonth(view.getMonth()-1);render()};document.getElementById('next').onclick=()=>{view.setMonth(view.getMonth()+1);render()};picker.onchange=()=>{let [y,m,d]=picker.value.split('-').map(Number),x=new Date(y,m-1,d);view=new Date(y,m-1,1);show(x)};
let now=new Date();document.getElementById('today').textContent=now.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});show(now);
if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js');