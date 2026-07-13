let absenceData=JSON.parse(localStorage.getItem('shiftAbsences')||'{}'),selectedAbsenceDate='';
const cycle=[3,2,1];let baseShift=Number(localStorage.getItem('baseShift'))||0;let savedRef=localStorage.getItem('referenceMonday');let REF=savedRef?new Date(savedRef+'T12:00:00'):null;
const picker=document.getElementById('datePicker'),cal=document.getElementById('calendar'),setup=document.getElementById('setup');let view=new Date();view.setDate(1);
const pad=n=>String(n).padStart(2,'0'),iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
function monday(d){let x=new Date(d.getFullYear(),d.getMonth(),d.getDate()),q=x.getDay();x.setDate(x.getDate()-(q===0?6:q-1));return x}
function shift(d){if(d.getDay()===0)return 0;let w=Math.round((monday(d)-REF)/604800000),idx=cycle.indexOf(baseShift);return cycle[((idx+w)%3+3)%3]}
function show(d){picker.value=iso(d);let s=shift(d),b=document.getElementById('shiftBadge');b.className='badge '+(s?'shift'+s:'sunday');b.textContent=s?s+'°':'☕';document.getElementById('shiftTitle').textContent=s?`${s}° turno`:'Riposo';document.getElementById('shiftInfo').textContent=d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});render()}
function render(){cal.innerHTML='';document.getElementById('monthTitle').textContent=view.toLocaleDateString('it-IT',{month:'long',year:'numeric'});let f=(view.getDay()+6)%7,n=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();for(let i=0;i<f;i++){let e=document.createElement('span');e.className='day empty';cal.append(e)}for(let i=1;i<=n;i++){let d=new Date(view.getFullYear(),view.getMonth(),i),s=shift(d),b=document.createElement('button');let absence=absenceData[iso(d)];b.className='day '+(absence|| (s?'shift'+s:'sunday'));if(iso(d)===picker.value)b.classList.add('selected');if(iso(d)===iso(new Date()))b.classList.add('today');b.innerHTML=`${i}<small>${s?s+'°':'R'}</small>`;b.onclick=()=>openAbsenceDay(d,s);cal.append(b)}}
document.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>{baseShift=Number(b.dataset.shift);REF=monday(new Date());localStorage.setItem('baseShift',baseShift);localStorage.setItem('referenceMonday',iso(REF));setup.classList.add('hidden');view=new Date();view.setDate(1);show(new Date())});
document.getElementById('settings').onclick=()=>setup.classList.remove('hidden');
document.getElementById('prev').onclick=()=>{view.setMonth(view.getMonth()-1);render()};document.getElementById('next').onclick=()=>{view.setMonth(view.getMonth()+1);render()};
picker.onchange=()=>{let [y,m,d]=picker.value.split('-').map(Number),x=new Date(y,m-1,d);view=new Date(y,m-1,1);show(x)};

function openAbsenceDay(d,turno){
 selectedAbsenceDate=iso(d);
 document.getElementById('absenceDate').textContent=d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 document.getElementById('absencePlanned').textContent='Turno previsto: '+(turno?turno+'° turno':'Riposo');
 document.getElementById('absenceModal').classList.remove('hidden');
}
document.querySelectorAll('[data-absence]').forEach(btn=>btn.addEventListener('click',()=>{
 let value=btn.dataset.absence;
 if(value) absenceData[selectedAbsenceDate]=value; else delete absenceData[selectedAbsenceDate];
 localStorage.setItem('shiftAbsences',JSON.stringify(absenceData));
 document.getElementById('absenceModal').classList.add('hidden');
 render(); updateAbsenceStats();
}));
document.getElementById('closeAbsence').addEventListener('click',()=>document.getElementById('absenceModal').classList.add('hidden'));
const statsYear=document.getElementById('statsYear'), allowance=document.getElementById('allowance');
const currentYear=new Date().getFullYear();
for(let y=currentYear-3;y<=currentYear+3;y++){let o=document.createElement('option');o.value=y;o.textContent=y;if(y===currentYear)o.selected=true;statsYear.append(o)}
allowance.value=localStorage.getItem('shiftAllowance')||0;
function updateAbsenceStats(){
 let counts={ferie:0,malattia:0,permesso:0},year=Number(statsYear.value);
 Object.entries(absenceData).forEach(([date,type])=>{if(Number(date.slice(0,4))===year&&counts[type]!==undefined)counts[type]++});
 document.getElementById('vacCount').textContent=counts.ferie;
 document.getElementById('sickCount').textContent=counts.malattia;
 document.getElementById('permCount').textContent=counts.permesso;
 document.getElementById('remaining').textContent='Ferie rimanenti: '+Math.max(0,(Number(allowance.value)||0)-counts.ferie);
}
statsYear.addEventListener('change',updateAbsenceStats);
allowance.addEventListener('input',()=>{localStorage.setItem('shiftAllowance',allowance.value);updateAbsenceStats()});
updateAbsenceStats();

let now=new Date();document.getElementById('today').textContent=now.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});if(!baseShift||!REF)setup.classList.remove('hidden');else show(now);
if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js');
let layoutTimer;
function refreshLayout(){clearTimeout(layoutTimer);layoutTimer=setTimeout(()=>{document.documentElement.style.width='100%';document.body.style.width='100%';render()},300)}
window.addEventListener('orientationchange',refreshLayout);
window.addEventListener('resize',refreshLayout);
