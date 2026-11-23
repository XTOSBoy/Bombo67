'use strict';

const mobilDuration=58;
const mobilAlarmCycle=7;
const mobilAlarmLevel=.66;
const mobilTypes=[['générale','Générale'],['partielle','Partielle'],['de renfort','De renfort'],['d’évacuation','D’évacuation'],['custom','Personnalisée']];
const mobilTrack='./mobilization/endogenous-opioid.mp3?v=3';
let mobilDraft={type:'générale',custom:'',units:'',place:''}, mobilRun=null, mobilView=null;
let mobilBuffer=null, mobilAlarmBuffer=null, mobilContext=null;
let mobilLock=null, mobilLaunch=null, mobilRequest=null, mobilError='';
let mobilSeen=new Set(), mobilSignalAt=0, mobilSignalRevision=0;
const mobilDates=new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Paris'});
const mobilClean=v=>v.replace(/[\u0000-\u001f<>]/g,' ').replace(/\s+/g,' ').trim();
function mobilCopy(){
  const type=mobilDraft.type==='custom'?mobilClean(mobilDraft.custom).replace(/^mobilisation\s+/i,''):mobilDraft.type;
  const place=mobilClean(mobilDraft.place);
  const units=mobilDraft.units.split(/[\n;,]+/).map(mobilClean).filter(Boolean);
  if(!type||!place||!units.length)return null;
  return {type,place:place.replace(/^a\s+/i,'à '),units};
}
function prepareMobilTrack(){
  if(!mobilBuffer) mobilBuffer=fetch(mobilTrack, {signal:AbortSignal.timeout(15000)}).then(r=>{
    if(!r.ok)throw new Error('Piste indisponible');return r.arrayBuffer();
  }).then(bytes=>new OfflineAudioContext(1,1,44100).decodeAudioData(bytes))
    .catch(error=>{mobilBuffer=null;throw error;});
  return mobilBuffer;
}
function preloadMobilAudio(){
  void prepareMobilTrack().catch(()=>{});
  void prepareMobilAlarm().catch(()=>{});
}
async function unlockMobilAudio(){
  mobilContext??=(sfxContext??=new AudioContext());
  if(mobilContext.state!=='running')await mobilContext.resume();
}
function paintMobilMeter(v,remaining){
  const time=`00:${String(Math.ceil(remaining)).padStart(2,'0')}`;
  if(v.count.textContent!==time)v.count.textContent=time;
  v.progress.value=mobilDuration-remaining;
}
function paintMobilMute(control,canActivate=false){
  const muted=String(Boolean(mobilRun?.muted));
  const text=canActivate&&mobilRun?.running&&(!mobilRun.bus||mobilContext?.state!=='running')?'Activer le son':
    mobilRun?.muted?'Rétablir le son':'Couper le son';
  if(control.dataset.label!==text){control.dataset.label=text;control.textContent=text;}
  if(control.getAttribute('aria-pressed')!==muted)control.setAttribute('aria-pressed',muted);
}
function paintMobilization(){
  const v=mobilView, run=mobilRun;
  const remaining=run?Math.min(mobilDuration,Math.max(0,run.running?(run.deadline-performance.now())/1000:run.left)):mobilDuration;
  if(mobilLock){paintMobilMeter(mobilLock,remaining);paintMobilMute(mobilLock.mute,true);}
  if(!v?.root.isConnected)return;
  const phases={standby:'EN ATTENTE',preparing:'PRÉPARATION DU SIGNAL',scheduled:'PRÉPARATION DU SIGNAL',active:'MOBILISATION EN COURS',
    finished:'SÉQUENCE TERMINÉE',aborted:'SÉQUENCE INTERROMPUE',lifted:'MOBILISATION LEVÉE'};
  const phase=run?.running?run.phase:mobilLaunch?'preparing':run?.phase??'standby';
  if(v.shell.dataset.phase!==phase){
    v.shell.dataset.phase=phase;
    v.console.dataset.phase=phase;
    v.status.textContent=phases[phase];
    v.ribbon.hidden=v.receipt.hidden=!run||phase==='scheduled';
    v.fieldsPanel.hidden=Boolean(run?.running);
    v.form.querySelector('fieldset').disabled=Boolean(run?.running||mobilLaunch);
    v.stop.disabled=v.mute.disabled=!run?.running;
  }
  paintMobilMeter(v,remaining);
  const copy=run?.copy??mobilCopy();
  if(v.copy!==copy){
    v.copy=copy;
    v.report.hidden=!copy;v.detailPrompt.hidden=Boolean(copy);
    paintMobilDetails(v.details,copy);
  }
  paintMobilMute(v.mute,true);
  const audioNote= mobilLaunch&&!run?.running?'Préparation de la piste et de l’alarme…':mobilError;
  if(v.feedback.dataset.note!==audioNote){v.feedback.dataset.note=audioNote;v.feedback.textContent=audioNote;}
}
function mobilNoise(ctx,into,at,length,amount){
  const buf=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate);
  const wave=buf.getChannelData(0);
  for(let i=0;i<wave.length;i++)wave[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/wave.length)**1.6;
  const n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
  n.buffer=buf;f.type='bandpass';f.frequency.value=1680;f.Q.value=.95;g.gain.value=amount;
  n.connect(f).connect(g).connect(into);n.start(at);
}
function mobilAlarm(ctx,into){
  const at=ctx.currentTime;
  const parts=[[68,37,0,1.62,.15,'sine'],[350,178,.03,.69,.085,'sawtooth'],[413,207,.05,.71,.047,'triangle'],
    [522,228,.57,.88,.09,'sawtooth'],[547,239,.61,.89,.044,'triangle'],[92,43,.86,.74,.072,'sine']];
  for(const [from,to,offset,len,level,type] of parts){
    const start=at+offset,osc=ctx.createOscillator(),amp=ctx.createGain(),filter=ctx.createBiquadFilter();
    osc.type=type;osc.frequency.setValueAtTime(from,start);osc.frequency.exponentialRampToValueAtTime(to,start+len);
    filter.type='lowpass';filter.frequency.value=1780;filter.Q.value=1.2;
    amp.gain.setValueAtTime(.0001,start);amp.gain.exponentialRampToValueAtTime(level,start+.075);
    amp.gain.exponentialRampToValueAtTime(.0001,start+len);
    osc.connect(filter).connect(amp).connect(into);osc.start(start);osc.stop(start+len+.012);
  }
  mobilNoise(ctx,into,at,.28,.13);
  mobilNoise(ctx,into,at+1.31,.31,.105);
}
async function prepareMobilAlarm(){
  if(!mobilAlarmBuffer){
    const rate=22050, offline=new OfflineAudioContext(1,mobilAlarmCycle*rate,rate);
    mobilAlarm(offline,offline.destination);
    mobilAlarmBuffer=offline.startRendering().catch(error=>{mobilAlarmBuffer=null;throw error;});
  }
  return mobilAlarmBuffer;
}
function closeMobilization(phase){
  const run=mobilRun;
  if(!run?.running)return;
  const ctx=mobilContext;
  run.running=false; run.phase=phase;run.left=phase==='aborted'?Math.max(0,(run.deadline-performance.now())/1000):0;
  clearTimeout(run.expiry);clearTimeout(run.opening);clearInterval(run.tick);
  if(run.bus&&ctx){
    run.bus.gain.setValueAtTime(0,ctx.currentTime);
    for(const source of [run.music,run.alarm]){
      try{source?.stop();}catch{/* Source already stopped. */}
    }
    run.bus.disconnect();
  }
  paintMobilization();
  dismissMobilLock();
}
function resetMobilization(clearDraft){
  mobilLaunch=null;mobilRequest=null;mobilError='';
  closeMobilization('aborted');
  if(clearDraft){
    mobilSeen=new Set();mobilSignalAt=0;mobilSignalRevision=0;
    mobilDraft={type:'générale',custom:'',units:'',place:''};
    mobilRun=null;mobilView=null;$('mobilization').replaceChildren();
  }
}
function makeMobilSource(ctx,buffer,channel,loop){
  const source=ctx.createBufferSource();
  source.buffer=buffer;source.loop=loop;
  source.playbackRate.value=loop?1:buffer.duration/mobilDuration;
  source.connect(channel);
  return source;
}
function mobilVolumes(){
  const run=mobilRun;
  if(!run?.bus||!run.running)return;
  const t=mobilContext.currentTime;
  run.bus.gain.setTargetAtTime(run.muted?0:1,t,.018);
  run.musicChannel.gain.setTargetAtTime(sfxOn ? .48 : 0,t,.018);
  run.alarmChannel.gain.setTargetAtTime(sfxOn?mobilAlarmLevel:0,t,.018);
}
function toggleMobilMute(){
  if(!mobilRun?.running)return;
  mobilRun.muted=!mobilRun.muted;mobilVolumes();paintMobilization();
}
function mobilSoundButton(){
  if(!mobilRun?.running)return;
  if(mobilRun.bus&&mobilContext?.state==='running')toggleMobilMute();
  else void connectMobilSound(mobilRun,true);
}
async function connectMobilSound(run,activate=false){
  try{
    if(activate)await unlockMobilAudio();
    const [music,alarm]=await Promise.all([prepareMobilTrack(),prepareMobilAlarm()]);
    if(mobilContext?.state!=='running')return;
    if(mobilRun!==run||!run.running||run.bus)return;
    const now=performance.now(), delay=Math.max(0,run.started-now), remaining=(run.deadline-now-delay)/1000;
    if(remaining<=0)return;
    const elapsed=Math.max(0,(now-run.started)/1000), ctx=mobilContext, at=ctx.currentTime+delay/1000;
    const bus=ctx.createGain(),musicChannel=ctx.createGain(),alarmChannel=ctx.createGain();
    bus.gain.value=run.muted?0:1;
    musicChannel.gain.value=sfxOn ? .48 : 0;alarmChannel.gain.value=sfxOn?mobilAlarmLevel:0;
    musicChannel.connect(bus);alarmChannel.connect(bus);bus.connect(ctx.destination);
    Object.assign(run,{bus,musicChannel,alarmChannel,
      music:makeMobilSource(ctx,music,musicChannel,false),alarm:makeMobilSource(ctx,alarm,alarmChannel,true)});
    run.music.start(at,elapsed*run.music.playbackRate.value);
    run.alarm.start(at,elapsed%alarm.duration);
    for(const sound of [run.music,run.alarm])sound.stop(at+remaining);
    if(mobilLock)mobilLock.audioStatus.textContent='';
    paintMobilization();
  }catch{
    if(mobilRun===run&&run.running&&mobilLock)mobilLock.audioStatus.textContent='Son indisponible sur ce terminal.';
  }
}
function receiveMobilizationSignal(data,roundTrip=0){
  if(highRun||current!=='workspace'||!token||!data||!Object.hasOwn(data,'mobilizationSignal')||!Number.isFinite(data.now))return;
  const serverNow=data.now*1000;
  if(serverNow<mobilSignalAt||(serverNow===mobilSignalAt&&(data.revision??0)<mobilSignalRevision))return;
  mobilSignalAt=serverNow;mobilSignalRevision=data.revision??0;
  const signal=data.mobilizationSignal;
  if(!signal){
    if(mobilRun?.running)closeMobilization(serverNow>=mobilRun.endsAt?'finished':'lifted');
    return;
  }
  if(mobilSeen.has(signal.id))return;
  const now=performance.now(), transit=Math.min(400,Math.max(0,roundTrip/2));
  const deadline=now+(signal.endsAt-serverNow)-transit;
  if(deadline<=now||!Number.isFinite(deadline))return;
  if(mobilRun?.running)closeMobilization(serverNow>=mobilRun.endsAt?'finished':'lifted');
  mobilSeen.add(signal.id);
  const started=deadline-(signal.endsAt-signal.startsAt);
  const run={id:signal.id,copy:signal,started,deadline,endsAt:signal.endsAt,running:true,phase:'scheduled'};
  mobilRun=run;
  const activate=()=>{
    if(mobilRun!==run||!run.running)return;
    if(performance.now()>=deadline){closeMobilization('finished');return;}
    run.phase='active';stopSfx();cancelVoice();showMobilLock(run.copy);
  };
  if(started>now)run.opening=setTimeout(activate,started-now);else activate();
  run.expiry=setTimeout(()=>closeMobilization('finished'),deadline-now);
  run.tick=setInterval(()=>{
    if(performance.now()>=run.deadline)closeMobilization('finished');
    else paintMobilization();
  },95);
  paintMobilization();
  void connectMobilSound(run);
}
async function startMobilization(copy){
  if(mobilLaunch||mobilRun?.running||current!=='workspace'||!campaign?.rights.mobilize)return;
  const draft=JSON.stringify(copy);
  if(mobilRequest?.draft!==draft)mobilRequest={draft,id:Array.from(crypto.getRandomValues(new Uint8Array(16)),
    byte=>byte.toString(16).padStart(2,'0')).join('')};
  const pending={session:token,id:mobilRequest.id};
  mobilLaunch=pending;mobilError='';paintMobilization();
  const here=()=>mobilLaunch===pending&&token===pending.session&&current==='workspace';
  let stage='audio';
  try{
    void unlockMobilAudio().catch(()=>{});
    await Promise.all([prepareMobilTrack(),prepareMobilAlarm()]);
    if(!here()||activeTab!=='mobilization')return;
    stage='save';
    const sent=performance.now();
    const data=await api('action',{action:'mobilization_start',id:pending.id,kind:copy.type,place:copy.place,units:copy.units});
    const roundTrip=performance.now()-sent;
    if(!here())return;
    mobilRequest=null;
    if(data.campaign.revision>=campaign.revision)receiveCampaign(data.campaign);
    const saved=campaign.mobilizations?.find(entry=>entry.id===pending.id);
    if(!saved)throw new Error('Mobilisation absente du registre');
    receiveMobilizationSignal(data,roundTrip);
  }catch(error){
    if(here())mobilError=error.message==='mobilization_broadcast_active'?'Une alerte est déjà diffusée sur l’intranet.':
      stage==='audio'?'Son indisponible. Réessaie avant de lancer la mobilisation.':
      'Impossible de confirmer la mobilisation dans le registre. Réessaie.';
  }finally{
    if(mobilLaunch===pending){mobilLaunch=null;paintMobilization();}
  }
}
function mobilIcon(name){
  const ns='http://www.w3.org/2000/svg', svg=document.createElementNS(ns,'svg'), use=document.createElementNS(ns,'use');
  svg.classList.add('icon');svg.setAttribute('aria-hidden','true');use.setAttribute('href',`#${name}`);svg.append(use);
  return svg;
}
function makeMobilRibbon(){
  return make('div','critical mono mobil-ribbon',mobilIcon('alert-icon'),
    label('span','ALERTE DE MOBILISATION · CONSEIL DE SÉCURITÉ'));
}
function makeMobilReceipt(id){
  const logo=make('img','');logo.src='./umbrella.svg';logo.alt='';logo.width=160;logo.height=160;
  const emblem=make('div','emblem locked-emblem',logo,
    make('span','veronica-lock',mobilIcon('wave-icon'),label('b','SIGNAL REÇU','mono')));
  emblem.setAttribute('aria-hidden','true');
  const title=label('h2','Mobilisation réceptionnée');title.tabIndex=-1;title.id=id;
  const receipt=make('section','mobil-veronica',emblem,label('p','PROTOCOLE VERONICA / B01','mono tag'),title,
    label('p','Le Conseil de Sécurité a réceptionné la mobilisation.','veronica-copy'),
    label('p','Quand le Conseil s’éveille, Redcliff retient son souffle.','mobil-quote'));
  receipt.setAttribute('aria-labelledby',id);
  return {receipt,title};
}
function makeMobilMeter(id){
  const count=label('span','00:58','mobil-clock');count.id=id;count.setAttribute('aria-label','Temps restant');
  count.setAttribute('role','timer');count.setAttribute('aria-live','off');
  const progress=make('progress','mobil-progress');progress.max=mobilDuration;progress.setAttribute('aria-label','Progression de la séquence');
  return {count,progress};
}
function makeMobilDetails(){
  const names=['Type de mobilisation','Lieu de mobilisation RP','Noms des unités RP'];
  const details=names.map(()=>make('dd',''));
  details.forEach(node=>node.setAttribute('data-ui-original',''));
  const report=make('dl','veronica-report mobil-report',...names.map((name,i)=>make('div','',label('dt',name),details[i])));
  return {report,details};
}
function paintMobilDetails(details,copy){
  const values=[copy?.type??'',copy?.place??'',copy?.units.join(', ')??''];
  for(let i=0;i<values.length;i++)details[i].textContent=values[i];
}
function showMobilLock(copy){
  const {receipt,title}=makeMobilReceipt('mobil-lock-title');
  const {count,progress}=makeMobilMeter('mobil-lock-clock');
  const {report,details}=makeMobilDetails();paintMobilDetails(details,copy);
  const leave=button('Revenir à l’intranet',()=>dismissMobilLock(),'secondary');
  const mute=button('Couper le son',mobilSoundButton,'secondary');
  const audioStatus=label('p','','minor mobil-feedback');audioStatus.setAttribute('role','status');
  const lockStatus=label('p','NAVIGATION VERROUILLÉE · SESSION ACTIVE','mono mobil-lock-status');
  const dialog=make('dialog','mobil-lockscreen',makeMobilRibbon(),
    make('div','mobil-lock-content',receipt,lockStatus,
      make('div','mobil-lock-meter',count,progress),report,make('div','mobil-actions',leave,mute),audioStatus));
  dialog.setAttribute('aria-labelledby',title.id);
  dialog.addEventListener('cancel',event=>{event.preventDefault();dismissMobilLock();});
  document.body.append(dialog);
  mobilLock={dialog,count,progress,mute,audioStatus};
  dialog.showModal();
  paintMobilization();
  title.focus({preventScroll:true});
}
function dismissMobilLock(){
  if(!mobilLock)return;
  const {dialog}=mobilLock;mobilLock=null;
  dialog.close();dialog.remove();
  if(current==='workspace'&&activeTab==='mobilization')mobilView?.root.querySelector('h1')?.focus({preventScroll:true});
}
function syncMobilHistory(){
  const records=campaign?.mobilizations??[];
  if(mobilRun?.running&&records.find(entry=>entry.id===mobilRun.id)?.liftedAt)closeMobilization('lifted');
  const v=mobilView;
  if(!v?.root.isConnected||activeTab!=='mobilization')return;
  const signature=records.map(row=>`${row.id}:${row.liftedAt??''}`).join('|');
  if(v.historySignature===signature)return;
  v.historySignature=signature;
  v.history.replaceChildren(...(records.length?records.map(entry=>{
    const lifted=entry.liftedAt!==null;
    const {report,details}=makeMobilDetails();paintMobilDetails(details,entry);
    const launched=make('p','minor',label('span','Déclenchée : '),`${entry.launchedBy.name} · ${mobilDates.format(entry.launchedAt)}`);
    const released=lifted?make('p','minor',label('span','Levée : '),`${entry.liftedBy.name} · ${mobilDates.format(entry.liftedAt)}`):null;
    const release=button('Lever la mobilisation',async()=>{
      const session=token;
      release.disabled=true;v.historyFeedback.textContent='';
      try{
        const sent=performance.now();
        const data=await api('action',{action:'mobilization_lift',id:entry.id});
        if(token!==session)return;
        receiveMobilizationSignal(data,performance.now()-sent);
        if(data.campaign.revision>=campaign.revision)receiveCampaign(data.campaign);
        if(mobilView===v)v.historyFeedback.textContent='Mobilisation levée. Elle reste dans l’historique.';
      }catch{
        if(token===session&&mobilView===v)v.historyFeedback.textContent='Impossible de lever la mobilisation. Réessaie.';
      }finally{release.disabled=false;}
    },'secondary');
    const tag=pill(lifted?'LEVÉE':'ACTIVE',lifted);
    const row=make('article','mobil-history-row',
      make('div','mobil-history-row-head',label('h3',entry.type),tag),report,launched,released??release);
    row.dataset.mobilizationId=entry.id;row.dataset.status=lifted?'lifted':'active';return row;
  }):[empty('Aucune mobilisation enregistrée.')]));
}
function renderMobilization(root){
  preloadMobilAudio();
  const type=optionsList(mobilTypes,mobilDraft.type);
  const custom=textInput('Ex. de reconnaissance',48);custom.value=mobilDraft.custom;
  const customField=radioField('mobil-custom','Type personnalisé',custom);
  const units=textArea('Ex. Alpha-01, équipe médicale',160);units.value=mobilDraft.units;units.required=true;
  const place=textInput('Ex. la mairie, au Bastion',90);place.value=mobilDraft.place;place.required=true;
  const start=label('button','Lancer la mobilisation','primary');start.type='submit';
  const stop=button('Interrompre',()=>{closeMobilization('aborted');start.focus();},'secondary');
  const mute=button('Couper le son',mobilSoundButton,'secondary');
  const typeField=radioField('mobil-type','Type de mobilisation',type);
  const unitField=radioField('mobil-units','Noms des unités RP',units);
  const placeField=radioField('mobil-place','Lieu de mobilisation RP',place);
  const fieldset=make('fieldset','mobil-fields',typeField,customField,unitField,placeField,start);
  const form=make('form','mobil-form',fieldset);
  const {count,progress}=makeMobilMeter('mobil-clock');
  const status=label('span','','mobil-status mono');status.setAttribute('role','status');
  const {report,details}=makeMobilDetails();
  const detailPrompt=label('p','Renseigne le type, le lieu et les unités pour préparer le signal.','minor');
  const feedback=label('p','','mobil-feedback minor');feedback.setAttribute('role','status');
  const decoration=make('span','mobil-signal');decoration.setAttribute('aria-hidden','true');
  const console=make('section','mobil-console',
    make('div','mobil-console-head',label('p','N04H / CANAL DE MOBILISATION','mono tag'),decoration),
    make('div','mobil-meter',count,status),progress,
    make('div','mobil-copy',label('p','REGISTRE DE MOBILISATION','mono tag'),detailPrompt,report),
    make('div','mobil-actions',stop,mute),feedback);
  const fieldsPanel=make('section','mobil-entry',label('h2','Configurer l’appel'),form);
  const ribbon=makeMobilRibbon(), {receipt}=makeMobilReceipt('mobil-receipt-title');
  const shell=make('div','mobil-shell',ribbon,make('div','mobil-grid',make('div','mobil-left',receipt,fieldsPanel),console));
  const info=label('p','L’alerte Veronica est diffusée à tous les joueurs connectés. Revenir à l’intranet ne coupe pas le son : il s’arrête à 00:00 ou à la levée de la mobilisation.','minor mobil-note');
  const history=make('div','mobil-history-list'),historyFeedback=label('p','','minor mobil-feedback');
  historyFeedback.setAttribute('role','status');
  const historyPanel=make('section','mobil-history',label('h2','Historique des mobilisations'),
    label('p','Le compte à rebours termine le son, pas la mobilisation. À l’arrivée des unités, lève-la depuis le registre.','minor'),
    historyFeedback,history);
  root.replaceChildren(heading('CONSEIL DE SÉCURITÉ / BUNKER B01','Mobilisation des unités','Prépare une mobilisation RP pour le Conseil de Sécurité.'),
    ...(campaign.rights.direction?[renderHighCouncilCard()]:[]),shell,info,historyPanel);
  mobilView={root,shell,ribbon,receipt,fieldsPanel,console,count,status,progress,detailPrompt,report,details,feedback,form,stop,mute,
    history,historyFeedback};
  function sync(){
    Object.assign(mobilDraft,{type:type.value,custom:custom.value,units:units.value,place:place.value});
    customField.hidden=type.value!=='custom';custom.required=!customField.hidden;
    for(const control of [units,place,custom])control.setCustomValidity('');
    if(mobilRun&&!mobilRun.running)mobilRun=null;
    paintMobilization();
  }
  form.addEventListener('input',sync);type.addEventListener('change',sync);
  form.addEventListener('submit',event=>{
    event.preventDefault();sync();
    const copy=mobilCopy();
    for(const [control,value,reason] of [[units,copy?.units.length||mobilDraft.units.split(/[\s;,]+/).some(x=>mobilClean(x)),'Renseigne au moins une unité RP.'],
      [place,mobilClean(place.value),'Renseigne un lieu pour la scène.'],[custom,type.value!=='custom'||mobilClean(custom.value).replace(/^mobilisation\s*$/i,''),'Renseigne un type de mobilisation.']]){
      if(!value){control.setCustomValidity(reason);control.reportValidity();return;}
    }
    if(copy)void startMobilization(copy);
  });
  customField.hidden=type.value!=='custom';custom.required=!customField.hidden;
  paintMobilization();
  syncMobilHistory();
}
$('sfx-toggle').addEventListener('click',()=>{
  mobilVolumes();
  if(sfxOn&&mobilRun?.running&&!mobilRun.bus)void connectMobilSound(mobilRun,true);
});
window.addEventListener('pagehide',()=>resetMobilization(false));
