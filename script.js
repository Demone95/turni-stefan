import { db } from "./firebase-config.js";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️ Sostituisci questo valore con il TUO uid Firebase (Authentication → Users → colonna "User UID").
// Solo l'account con questo uid vedrà il pulsante "Richieste" e potrà approvare/rifiutare nuovi utenti.
const ADMIN_UID = "TykPl2nG7ma7qrC4HRgpzEUIFXG3";

let absenceData={},selectedAbsenceDate='';
const cycle=[3,2,1];let baseShift=0;let REF=null;
let currentUid=null,dataReady=false;

function userDocRef(){return doc(db,'users',currentUid)}
async function saveUserData(){
 if(!currentUid)return;
 try{
   await setDoc(userDocRef(),{baseShift,referenceMonday:REF?iso(REF):null,shiftAllowance:Number(allowance.value)||0,absences:absenceData},{merge:true});
 }catch(err){console.error('Errore salvataggio dati',err)}
}

const picker=document.getElementById('datePicker'),cal=document.getElementById('calendar'),setup=document.getElementById('setup');let view=new Date();view.setDate(1);
const pad=n=>String(n).padStart(2,'0'),iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
function monday(d){let x=new Date(d.getFullYear(),d.getMonth(),d.getDate()),q=x.getDay();x.setDate(x.getDate()-(q===0?6:q-1));return x}
function shift(d){if(d.getDay()===0||d.getDay()===6)return 0;let w=Math.round((monday(d)-REF)/604800000),idx=cycle.indexOf(baseShift);return cycle[((idx+w)%3+3)%3]}
function updateDatePickerText(d){
 const el=document.getElementById('datePickerText');
 if(el&&d instanceof Date&&!Number.isNaN(d.getTime()))el.textContent=d.toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'}).replace('.','');
}
function show(d){updateDatePickerText(d);picker.value=iso(d);let s=shift(d),b=document.getElementById('shiftBadge');b.className='badge '+(s?'shift'+s:'sunday');b.textContent=s?s+'°':'☕';document.getElementById('shiftTitle').textContent=s?`${s}° turno`:'Riposo';document.getElementById('shiftInfo').textContent=d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});render()}
function render(){cal.innerHTML='';document.getElementById('monthTitle').textContent=view.toLocaleDateString('it-IT',{month:'long',year:'numeric'});let f=(view.getDay()+6)%7,n=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();for(let i=0;i<f;i++){let e=document.createElement('span');e.className='day empty';cal.append(e)}for(let i=1;i<=n;i++){let d=new Date(view.getFullYear(),view.getMonth(),i),s=shift(d),b=document.createElement('button');let absence=absenceData[iso(d)],absenceClass=typeof absence==='string'?absence:(absence&&absence.type);b.className='day '+(absenceClass|| (s?'shift'+s:'sunday'));if(iso(d)===picker.value)b.classList.add('selected');if(iso(d)===iso(new Date()))b.classList.add('today');let permitHours=absence&&typeof absence==='object'&&absence.type==='permesso'?(Number(absence.hours)||0):0;b.innerHTML=`${i}<small>${s?s+'°':'R'}${permitHours?' · '+permitHours+'h':''}</small>`;b.onclick=()=>openAbsenceDay(d,s);cal.append(b)}}
document.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>{baseShift=Number(b.dataset.shift);REF=monday(new Date());saveUserData();setup.classList.add('hidden');view=new Date();view.setDate(1);show(new Date())});
document.getElementById('settings').onclick=()=>setup.classList.remove('hidden');
document.getElementById('prev').onclick=()=>{view.setMonth(view.getMonth()-1);render()};document.getElementById('next').onclick=()=>{view.setMonth(view.getMonth()+1);render()};
picker.onchange=()=>{let [y,m,d]=picker.value.split('-').map(Number),x=new Date(y,m-1,d);view=new Date(y,m-1,1);show(x)};

function openAbsenceDay(d,turno){
 selectedAbsenceDate=iso(d);
 document.getElementById('absenceDate').textContent=d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 let savedAbsence=absenceData[selectedAbsenceDate];
 let plannedText='Turno previsto: '+(turno?turno+'° turno':'Riposo');
 if(savedAbsence&&typeof savedAbsence==='object'&&savedAbsence.type==='permesso') plannedText+='\nPermesso registrato: '+savedAbsence.hours+(Number(savedAbsence.hours)===1?' ora':' ore');
 document.getElementById('absencePlanned').textContent=plannedText;
 document.getElementById('absenceModal').classList.remove('hidden');
}
document.querySelectorAll('[data-absence]').forEach(btn=>btn.addEventListener('click',()=>{
 let value=btn.dataset.absence;
 if(value==='permesso'){
   document.getElementById('absenceModal').classList.add('hidden');
   document.getElementById('permitHoursModal').classList.remove('hidden');
   return;
 }
 if(value) absenceData[selectedAbsenceDate]=value; else delete absenceData[selectedAbsenceDate];
 saveUserData();
 document.getElementById('absenceModal').classList.add('hidden');
 render(); updateAbsenceStats();
}));
document.getElementById('closeAbsence').addEventListener('click',()=>document.getElementById('absenceModal').classList.add('hidden'));

document.querySelectorAll('[data-hours]').forEach(btn=>btn.addEventListener('click',()=>{
 absenceData[selectedAbsenceDate]={type:'permesso',hours:Number(btn.dataset.hours)};
 saveUserData();
 document.getElementById('permitHoursModal').classList.add('hidden');
 render(); updateAbsenceStats();
}));
document.getElementById('closePermitHours').addEventListener('click',()=>{
 document.getElementById('permitHoursModal').classList.add('hidden');
});

const statsYear=document.getElementById('statsYear'), allowance=document.getElementById('allowance');
const currentYear=new Date().getFullYear();
for(let y=currentYear-2;y<=currentYear;y++){let o=document.createElement('option');o.value=y;o.textContent=y;if(y===currentYear)o.selected=true;statsYear.append(o)}
function updateAbsenceStats(){
 let counts={ferie:0,malattia:0,permesso:0},year=Number(statsYear.value);
 Object.entries(absenceData).forEach(([date,value])=>{
   if(Number(date.slice(0,4))!==year)return;
   if(value==='ferie')counts.ferie++;
   else if(value==='malattia')counts.malattia++;
   else if(value==='permesso')counts.permesso+=1;
   else if(value&&value.type==='permesso')counts.permesso+=Number(value.hours)||0;
 });
 document.getElementById('vacCount').textContent=counts.ferie;
 document.getElementById('sickCount').textContent=counts.malattia;
 document.getElementById('permCount').textContent=counts.permesso;
 document.getElementById('remaining').textContent='Ferie rimanenti: '+Math.max(0,(Number(allowance.value)||0)-counts.ferie);
}
statsYear.addEventListener('change',updateAbsenceStats);
allowance.addEventListener('input',()=>{saveUserData();updateAbsenceStats()});
updateAbsenceStats();

picker.addEventListener('change',()=>{
 if(!picker.value){
   const today=new Date();
   picker.value=iso(today);
   show(today);
 }
},true);

function syncTopControls(){
 const controls=document.getElementById('topControls');
 const setup=document.getElementById('setup');
 if(!controls||!setup)return;
 const setupVisible=!setup.classList.contains('hidden');
 controls.classList.toggle('hidden-during-setup',setupVisible);
 const legend=controls.querySelector('.top-legend');
 if(setupVisible&&legend)legend.removeAttribute('open');
}

let now=new Date();document.getElementById('today').textContent=now.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});
if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js');

const pendingScreen=document.getElementById('pendingScreen'),rejectedScreen=document.getElementById('rejectedScreen'),mainEl=document.querySelector('main');
const adminBtn=document.getElementById('adminBtn'),adminModal=document.getElementById('adminModal'),pendingList=document.getElementById('pendingList'),closeAdmin=document.getElementById('closeAdmin');

function setGate(kind){
 pendingScreen.classList.toggle('hidden',kind!=='pending');
 rejectedScreen.classList.toggle('hidden',kind!=='rejected');
 mainEl.classList.toggle('hidden',kind!=='approved');
}

function adminCheck(){
 adminBtn.classList.toggle('hidden',currentUid!==ADMIN_UID);
}

adminBtn.onclick=()=>openAdminPanel();
closeAdmin.addEventListener('click',()=>adminModal.classList.add('hidden'));

async function openAdminPanel(){
 adminModal.classList.remove('hidden');
 pendingList.innerHTML='<p>Caricamento…</p>';
 try{
   const q=query(collection(db,'users'),where('status','==','pending'));
   const snap=await getDocs(q);
   if(snap.empty){pendingList.innerHTML='<p class="empty-pending">Nessuna richiesta in sospeso.</p>';return}
   pendingList.innerHTML='';
   snap.forEach(docSnap=>{
     const u=docSnap.data();
     const row=document.createElement('div');row.className='pending-row';
     const name=document.createElement('span');name.textContent=u.username||docSnap.id;
     const approveBtn=document.createElement('button');approveBtn.textContent='✅ Approva';approveBtn.className='approve-btn';
     const rejectBtn=document.createElement('button');rejectBtn.textContent='❌ Rifiuta';rejectBtn.className='reject-btn';
     approveBtn.onclick=async()=>{await updateDoc(doc(db,'users',docSnap.id),{status:'approved'});openAdminPanel()};
     rejectBtn.onclick=async()=>{await updateDoc(doc(db,'users',docSnap.id),{status:'rejected'});openAdminPanel()};
     row.append(name,approveBtn,rejectBtn);
     pendingList.append(row);
   });
 }catch(err){console.error('Errore caricamento richieste',err);pendingList.innerHTML='<p class="empty-pending">Errore nel caricamento.</p>'}
}

async function loadUserData(){
 dataReady=false;
 let data={};
 try{
   const snap=await getDoc(userDocRef());
   if(snap.exists())data=snap.data();
 }catch(err){console.error('Errore caricamento dati',err)}

 adminCheck();
 const status=data.status||'pending';
 if(currentUid!==ADMIN_UID&&status==='pending'){setGate('pending');return}
 if(currentUid!==ADMIN_UID&&status==='rejected'){setGate('rejected');return}
 setGate('approved');

 baseShift=Number(data.baseShift)||0;
 REF=data.referenceMonday?new Date(data.referenceMonday+'T12:00:00'):null;
 absenceData=data.absences||{};
 allowance.value=data.shiftAllowance||0;
 dataReady=true;
 statsYear.value=currentYear;
 updateAbsenceStats();
 view=new Date();view.setDate(1);
 if(!baseShift||!REF)setup.classList.remove('hidden');else{setup.classList.add('hidden');show(new Date())}
}

function resetLocalState(){
 currentUid=null;dataReady=false;
 baseShift=0;REF=null;absenceData={};
 allowance.value=0;
 setup.classList.add('hidden');
 pendingScreen.classList.add('hidden');
 rejectedScreen.classList.add('hidden');
 adminBtn.classList.add('hidden');
}

window.onUserReady=async(user)=>{currentUid=user.uid;await loadUserData()};
window.onUserSignedOut=()=>{resetLocalState()};
let layoutTimer;
function refreshLayout(){clearTimeout(layoutTimer);layoutTimer=setTimeout(()=>{document.documentElement.style.width='100%';document.body.style.width='100%';render()},300)}
window.addEventListener('orientationchange',refreshLayout);
window.addEventListener('resize',refreshLayout);

const setupVisibilityTarget=document.getElementById('setup');
if(setupVisibilityTarget){
 new MutationObserver(syncTopControls).observe(setupVisibilityTarget,{attributes:true,attributeFilter:['class']});
}
document.addEventListener('click',()=>setTimeout(syncTopControls,0));
syncTopControls();
