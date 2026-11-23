'use strict';

const highTrack='./mobilization/haut-conseil-contact.mp3?v=1';
const highLock=$('high-council-lock'),highConfirm=$('high-council-confirm');
const highSound=$('high-council-sound'),highTimer=$('high-council-timer'),highStatus=$('high-council-status');
const highMeter=$('high-council-meter'),highAudioStatus=$('high-council-audio-status');
const highDates=new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Paris'});
let highRun=null,highBuffer=null,highSignalAt=0,highLaunching=false,highChecking=false,highLastCheck=0;
const highSet=(node,value)=>{if(node.dataset.highCopy!==value){node.dataset.highCopy=value;node.textContent=value;}};

function prepareHighCouncilAudio(){
  if(!highBuffer)highBuffer=fetch(highTrack,{signal:AbortSignal.timeout(25000)}).then(response=>{
    if(!response.ok)throw new Error('audio');
    return response.arrayBuffer();
  }).then(bytes=>new OfflineAudioContext(2,1,44100).decodeAudioData(bytes)).catch(error=>{
    highBuffer=null;
    throw error;
  });
  return highBuffer;
}
function stopHighCouncilAudio(run){
  if(!run?.source)return;
  try{run.source.stop();}catch{/* The track already ended. */}
  run.source.disconnect();run.gain.disconnect();
  run.source=null;run.gain=null;
}
function paintHighCouncil(){
  const run=highRun;if(!run)return;
  const now=performance.now(),before=now<run.start,remaining=Math.max(0,Math.min(run.end-now,run.length));
  const seconds=remaining>0?Math.max(1,Math.round(remaining/1000)):0;
  highSet(highTimer,`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`);
  highSet(highStatus,before?'SYNCHRONISATION DE LA DIFFUSION':seconds?'INTRANET SOUS SCELLÉS':'VÉRIFICATION DE LA RÉOUVERTURE');
  highMeter.value=1-remaining/run.length;
  highSound.disabled=!seconds;
  const attached=run.source&&sfxContext?.state==='running';
  highSet(highSound,!attached?'Activer le son':run.muted?'Rétablir le son':'Couper le son');
  highSound.setAttribute('aria-pressed',String(Boolean(attached&&!run.muted)));
  if(!seconds){stopHighCouncilAudio(run);void verifyHighCouncil();}
}
async function connectHighCouncilAudio(run,manual=false){
  if(!run||run.source||(!manual&&run.pending))return;
  let activation;
  if(manual)activation=unlockMobilAudio();
  if(activation)void activation.catch(()=>{});
  if(run.pending){void activation?.then(()=>connectHighCouncilAudio(run)).catch(()=>{});return;}
  run.pending=true;
  try{
    const buffer=await prepareHighCouncilAudio();
    if(activation)await activation;
    const ctx=sfxContext;
    if(highRun!==run||run.source||performance.now()>=run.end||ctx?.state!=='running')return;
    const now=performance.now(),delay=Math.max(0,run.start-now),speed=buffer.duration/(run.length/1000);
    const source=ctx.createBufferSource(),gain=ctx.createGain(),at=ctx.currentTime+delay/1000;
    source.buffer=buffer;source.playbackRate.value=speed;
    gain.gain.value=run.muted?0:.65;
    source.connect(gain).connect(ctx.destination);
    source.start(at,Math.max(0,now-run.start)/1000*speed);
    source.stop(at+(run.end-now-delay)/1000);
    Object.assign(run,{source,gain});
    highSet(highAudioStatus,'');
  }catch{
    if(highRun===run)highSet(highAudioStatus,'Son indisponible. Tu peux réessayer sans quitter cet écran.');
  }finally{
    run.pending=false;
    if(highRun===run)paintHighCouncil();
  }
}
function releaseHighCouncil(){
  const run=highRun;if(!run)return;
  highRun=null;
  stopHighCouncilAudio(run);
  clearInterval(run.tick);
  if(highLock.open)highLock.close();
  if(current==='curfew')startCurfewAudio();
  if(current==='workspace'){paintBioPopup();showCouncilNotice();}
}
function receiveHighCouncil(data,roundTrip=0){
  if(!data||!Object.hasOwn(data,'highCouncil')||!Number.isFinite(data.now))return Boolean(highRun);
  const serverNow=data.now*1000;
  if(serverNow<highSignalAt)return Boolean(highRun);
  highSignalAt=serverNow;
  const signal=data.highCouncil;
  if(!signal||signal.endsAt<=serverNow){releaseHighCouncil();return false;}
  if(highRun?.id===signal.id){
    if(!highRun.attemptedAfterGesture&&sfxContext?.state==='running'&&!highRun.source&&!highRun.pending){
      highRun.attemptedAfterGesture=true;
      void connectHighCouncilAudio(highRun);
    }
    return true;
  }
  releaseHighCouncil();
  const now=performance.now(),transit=Math.min(300,Math.max(0,roundTrip/2));
  const run=highRun={id:signal.id,start:now+signal.startsAt-serverNow-transit,end:now+signal.endsAt-serverNow-transit,
    length:signal.endsAt-signal.startsAt,muted:!sfxOn,source:null,pending:false};
  interruptWorkspaceRequests();
  closeMobilization('aborted');
  stopCurfewAudio();stopSfx();cancelVoice();
  if(highConfirm.open)highConfirm.close();
  highSet(highAudioStatus,'');
  if(!highLock.open)highLock.showModal();
  $('high-council-title').focus({preventScroll:true});
  paintHighCouncil();
  run.tick=setInterval(paintHighCouncil,125);
  void connectHighCouncilAudio(run);
  return true;
}
async function verifyHighCouncil(){
  if(!highRun||highChecking||performance.now()-highLastCheck<750)return;
  highChecking=true;const started=performance.now();highLastCheck=started;
  try{
    const response=await fetch(endpoint('health'),{cache:'no-store',signal:AbortSignal.timeout(6500)});
    if(response.ok)receiveHighCouncil(await response.json(),performance.now()-started);
  }catch{/* The normal access stream and polls continue to retry. */}
  finally{highChecking=false;}
}

highLock.addEventListener('cancel',event=>event.preventDefault());
highSound.addEventListener('click',()=>{
  const run=highRun;if(!run||performance.now()>=run.end)return;
  if(run.source&&sfxContext?.state==='running'){
    run.muted=!run.muted;
    run.gain.gain.setTargetAtTime(run.muted?0:.65,sfxContext.currentTime,.02);
  }else{
    stopHighCouncilAudio(run);
    run.muted=false;void connectHighCouncilAudio(run,true);
  }
  paintHighCouncil();
});
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&highRun){
    stopHighCouncilAudio(highRun);
    void connectHighCouncilAudio(highRun);
    paintHighCouncil();void verifyHighCouncil();
  }
});
window.addEventListener('pagehide',()=>stopHighCouncilAudio(highRun));
window.addEventListener('pageshow',()=>{if(highRun){void verifyHighCouncil();void connectHighCouncilAudio(highRun);}});

function paintHighCouncilLog(){
  const records=campaign?.highCouncilAlerts??[];
  for(const log of document.querySelectorAll('.high-council-log')){
    const key=records[0]?.id??'empty';
    if(log.dataset.record===key)continue;
    log.dataset.record=key;
    log.replaceChildren(...(records.length?records.map(row=>label('li',`${highDates.format(row.launchedAt)} · ${row.launchedBy.name}`)):
      [label('li','Aucune mobilisation du Haut-Conseil enregistrée.')]));
  }
}
function openHighCouncilConfirm(){
  if(current!=='workspace'||!campaign?.rights.direction||highRun||highConfirm.open)return;
  highSet($('high-council-feedback'),'');
  highConfirm.showModal();
  $('high-council-cancel').focus();
  void prepareHighCouncilAudio().catch(()=>{});
}
function renderHighCouncilCard(){
  const log=make('ul','high-council-log minor');
  const details=make('details','high-council-logbook',label('summary','Historique du Haut-Conseil'),log);
  const panel=card('Mobilisation du Haut-Conseil',
    label('p','PROTOCOLE CONTACT / HABILITATION 05','tag mono'),
    label('p','La Garde élitaire verrouille tout l’intranet le temps de la piste. Toutes les sessions reçoivent la diffusion et reprennent automatiquement à la fin.','minor'),
    button('Mobiliser la Garde élitaire',openHighCouncilConfirm,'primary'),details);
  panel.classList.add('high-council-card');
  queueMicrotask(paintHighCouncilLog);
  return panel;
}
const highLaunchButton=$('high-council-launch'),highCancel=$('high-council-cancel');
highCancel.addEventListener('click',()=>{if(!highLaunching)highConfirm.close();});
highConfirm.addEventListener('cancel',event=>{if(highLaunching)event.preventDefault();});
highLaunchButton.addEventListener('click',async()=>{
  if(highLaunching||!highConfirm.open||current!=='workspace'||!token||!campaign?.rights.direction||highRun)return;
  const owner=token,feedback=$('high-council-feedback');
  highLaunching=highLaunchButton.disabled=highCancel.disabled=true;
  highSet(feedback,'Préparation de la diffusion…');
  let stage='audio';
  try{
    void unlockMobilAudio().catch(()=>{});
    await prepareHighCouncilAudio();
    if(owner!==token||current!=='workspace'||highRun||!highConfirm.open)return;
    stage='start';
    const sent=performance.now();
    const data=await api('action',{action:'high_council_start',confirmed:true});
    if(owner===token&&!receiveHighCouncil(data,performance.now()-sent))throw new Error('signal');
  }catch{
    if(highConfirm.open&&!highRun)highSet(feedback,stage==='audio'?'Piste indisponible : aucun verrouillage lancé.':'Impossible de confirmer le lancement. Vérifie le statut avant de réessayer.');
  }finally{highLaunching=highLaunchButton.disabled=highCancel.disabled=false;}
});
