'use strict';

if(location.pathname==='/google-sites'){
  document.querySelector('.google-sites-direct').hidden=false;
}
const $ = id => document.getElementById(id);
const form = $('login-form');
const idInput = $('matricule');
const codeInput = $('access-code');
const feedback = $('feedback');
const submit = $('submit');
const toggle = $('toggle-code');
let attempts = 3;
let current = 'login';
let voice = true;
let playing;
let connectedProfile = null;
let sfxOn=true,sfxContext,sfxBus;
let curfewSound=null,curfewBuffer=null,curfewMuted=false,curfewAudioVersion=0;
if(window.UMBRELLA_API===null){
  $('login-caption').textContent='Serveur de campagne non configuré dans cet aperçu.';
}
const sfxPatterns={
  navigate:[[520,0,.06,.052,'triangle',420],[940,.034,.065,.023,'sine',1040]],
  boot:[[42,0,1.15,.095,'sine',72],[105,.02,.72,.046,'triangle',162],[380,.08,.16,.027,'square',220],[260,.16,.62,.047,'triangle',392],[392,.28,.53,.035,'sine',523],[585,.45,.64,.038,'triangle',660],[785,.66,.55,.031,'sine',1047],[1570,.88,.34,.019,'sine',2093]],
  send:[[310,0,.095,.059,'triangle',426],[610,.078,.22,.042,'sine',718],[1220,.137,.23,.022]],
  denied:[[153,0,.18,.09,'triangle',105],[221,.11,.24,.058,'sawtooth',133]],
  alarm:[[132,0,.76,.08,'triangle',88],[310,.03,.39,.065,'sawtooth',520],[504,.46,.42,.062,'triangle',294],[335,.96,.66,.05,'sawtooth',170]],
  logout:[[1320,0,.12,.035,'sine',960],[930,.065,.21,.037,'triangle',540],[580,.17,.40,.055,'triangle',240],[285,.36,.71,.050,'triangle',113],[76,.25,1.32,.095,'sine',30],[142,.96,.30,.023,'sine',58],[51,1.27,.57,.048,'sine',25]],
};
function stopSfx(){
  if(sfxBus){
    const bus=sfxBus,now=sfxContext.currentTime;
    sfxBus=null;
    bus.gain.setValueAtTime(bus.gain.value,now);
    bus.gain.linearRampToValueAtTime(0,now+.009);
    setTimeout(()=>bus.disconnect(),20);
  }
}
function playSfx(kind){
  const overlay=['logout','alarm','denied'].includes(kind);
  if(highRun||!sfxOn||(!overlay&&playing&&!playing.paused&&!playing.ended)||sfxBus?.terminalCue&&kind==='navigate')return;
  try {
    sfxContext??=new AudioContext();
    void sfxContext.resume().catch(()=>{});
    stopSfx();
    const bus=sfxContext.createGain();
    bus.terminalCue=overlay;sfxBus=bus;bus.connect(sfxContext.destination);
    const now=sfxContext.currentTime;
    const pattern=sfxPatterns[kind]??sfxPatterns.navigate;
    for(const [hz,offset,duration,level,type='sine',end=hz] of pattern){
      const osc=sfxContext.createOscillator(),gain=sfxContext.createGain(),at=now+offset;
      osc.type=type;osc.frequency.setValueAtTime(hz,at);osc.frequency.exponentialRampToValueAtTime(end,at+duration);
      gain.gain.setValueAtTime(.001,at);gain.gain.exponentialRampToValueAtTime(level,at+.018);
      gain.gain.exponentialRampToValueAtTime(.001,at+duration);
      osc.connect(gain);gain.connect(bus);osc.start(at);osc.stop(at+duration+.01);
    }
    if(['boot','logout','alarm','denied'].includes(kind)){
      const buffer=sfxContext.createBuffer(1,Math.ceil(sfxContext.sampleRate*.3),sfxContext.sampleRate);
      const samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(1-i/samples.length);
      for(const offset of kind==='logout'?[0,.36,1.27]:kind==='boot'?[0,.18,.69]:[0]){
        const noise=sfxContext.createBufferSource(),filter=sfxContext.createBiquadFilter(),gain=sfxContext.createGain();
        noise.buffer=buffer;filter.type='bandpass';filter.frequency.value=kind==='logout'?760:1300;filter.Q.value=.8;gain.gain.value=.14;
        noise.connect(filter).connect(gain).connect(bus);noise.start(now+offset);
      }
    }
    setTimeout(()=>{if(sfxBus===bus){bus.disconnect();sfxBus=null;}},1000*(.12+Math.max(...pattern.map(([,offset,duration])=>offset+duration))));
  }catch{ /* The terminal remains usable without audio. */ }
}
$('sfx-toggle').addEventListener('click',()=>{
  sfxOn=!sfxOn;
  $('sfx-toggle').setAttribute('aria-pressed',String(sfxOn));
  if(current==='curfew'){
    if(sfxOn){curfewMuted=false;startCurfewAudio(true);}else stopCurfewAudio();
  }else if(sfxOn)playSfx('send');else stopSfx();
});
function paintCurfewAudio(){
  const button=$('curfew-audio');
  const label=curfewSound?'Couper le son d’attente':'Activer le son d’attente';
  if(button.textContent!==label)button.textContent=label;
}
function stopCurfewAudio(){
  curfewAudioVersion++;
  if(curfewSound){
    curfewSound.stop();
    curfewSound.disconnect();
    curfewSound=null;
  }
  paintCurfewAudio();
}
function makeCurfewLoop(context){
  const seconds=8, rate=context.sampleRate, turns=2*Math.PI;
  const buffer=context.createBuffer(2,rate*seconds,rate);
  for(let c=0;c<2;c++){
    const channel=buffer.getChannelData(c), low=(c?139:137);
    for(let i=0;i<channel.length;i++){
      const t=i/rate, phase=t%4;
      const pulse=phase<.46?Math.sin(Math.PI*phase/.46)**2:0;
      const bed=.021*Math.sin(turns*88*t)+.012*Math.sin(turns*low*t)*(1+.45*Math.sin(turns*t/4));
      channel[i]=bed+.028*pulse*Math.sin(turns*(c?441:440)*t);
    }
  }
  return buffer;
}
function startCurfewAudio(manual=false){
  if(current!=='curfew'||!sfxOn||curfewMuted||curfewSound||highRun)return;
  if(!manual&&sfxContext?.state!=='running'&&!navigator.userActivation?.hasBeenActive&&navigator.getAutoplayPolicy?.('audiocontext')!=='allowed')return;
  try{
    sfxContext??=new AudioContext();
    const version=++curfewAudioVersion;
    const play=()=>{
      if(version!==curfewAudioVersion||current!=='curfew'||!sfxOn||curfewMuted||curfewSound)return;
      curfewBuffer??=makeCurfewLoop(sfxContext);
      const source=sfxContext.createBufferSource();
      source.buffer=curfewBuffer;source.loop=true;source.connect(sfxContext.destination);source.start();
      curfewSound=source;paintCurfewAudio();
    };
    if(sfxContext.state==='running')play();
    else void sfxContext.resume().then(play).catch(()=>{});
  }catch{paintCurfewAudio();}
}
$('curfew-audio').addEventListener('click',()=>{
  if(curfewSound){curfewMuted=true;stopCurfewAudio();return;}
  curfewMuted=false;
  sfxOn=true;$('sfx-toggle').setAttribute('aria-pressed','true');
  startCurfewAudio(true);
});
function cancelVoice() { if (playing) { playing.pause(); playing=null; } }
const prepared={
  intrusion:new Audio('./voice-intrusion.mp3?v=4'),logout:new Audio('./voice-logout.mp3?v=4'),
  ...Object.fromEntries([0,1,2].map(n=>[`denied-${n}`,new Audio(`./n04h/denied-${n}.mp3?v=5.3`)])),
};
function playVoice(type,force=false,alert=null) {
  if (highRun || (!voice && !force)) return;
  if(type!=='logout')stopSfx();
  cancelVoice();
  let clip;
  if(type==='network'&&alert){
    if(alert.status==='maintenance'||alert.status==='repairing'){playSfx('send');return;}
    if(!/^DC-0[1-4]$/.test(alert.centerId)){playSfx('alarm');return;}
    clip=`./n04h/${encodeURIComponent(alert.centerId)}-${alert.scene?'scene':alert.online?'online':'isolated'}.mp3`;
  }
  else if(type==='sector'&&alert) clip=`./n04h/SECTOR-${encodeURIComponent(alert.status)}.mp3`;
  else if(connectedProfile&&!connectedProfile.matricule&&connectedProfile.id!=='CEN-000') clip=`./n04h/${encodeURIComponent(connectedProfile.id)}.mp3`;
  else clip='./voice-welcome.mp3';
  playing = prepared[type] ?? new Audio(`${clip}?v=${type==='welcome'?'5.3':'4'}`);
  if(prepared[type]) playing.currentTime=0;
  playing.volume = .85;
  const audio=playing;
  audio.play().catch(()=>{
    if(playing!==audio)return;
    if(type.startsWith('denied-'))playSfx(type==='denied-0'?'alarm':'denied');
    if(type==='welcome'&&clip!=='./voice-welcome.mp3'){
      playing=new Audio('./voice-welcome.mp3');playing.volume=.75;playing.play().catch(()=>{});
    }
  });
}
$('voice-toggle').addEventListener('click',()=>{
  voice=!voice;
  $('voice-toggle').setAttribute('aria-pressed',String(voice));
  if (!voice) cancelVoice();
  else if (current==='veronica') playVoice('intrusion');
  else if (current==='workspace') {
    if(activeTab==='centers' && campaign?.centerAlert) playVoice('network',false,campaign.centerAlert);
    else if((activeTab==='labs'||activeTab==='cryo')&&campaign?.sectorAlert) playVoice('sector',false,campaign.sectorAlert);
    else if(activeTab==='profile') playVoice('welcome');
  }
});
$('replay-intrusion').addEventListener('click',()=>playVoice('intrusion',true));
$('replay-welcome').addEventListener('click',()=>playVoice('welcome',true));

function showCode(visible) {
  codeInput.type = visible ? 'text' : 'password';
  toggle.setAttribute('aria-pressed', String(visible));
  toggle.setAttribute('aria-label', visible ? 'Masquer le code' : 'Afficher le code');
}
toggle.addEventListener('click', () => showCode(codeInput.type === 'password'));

function updateAttempts() {
  $('attempt-count').textContent = `ESSAIS RESTANTS : ${attempts}/3`;
  Array.from($('segments').children).forEach((segment, i) => segment.classList.toggle('used', i >= attempts));
}
function message(text, invalid = false) {
  feedback.textContent = text;
  feedback.hidden = !text;
  for (const input of [idInput, codeInput]) {
    if (invalid) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
}
idInput.addEventListener('input', () => message(''));
codeInput.addEventListener('input', () => message(''));
function screen(mode) {
  if(mode!=='workspace')resetMobilization(false);
  current = mode;
  if(mode!=='curfew'){
    stopCurfewAudio();
    $('curfew-emergency').open=false;
    $('curfew-emergency-form').reset();
    $('curfew-emergency-feedback').textContent='';
  }
  if(mode!=='workspace'){
    for(const id of ['stock-use-dialog','site-emergency-dialog'])if($(id).open)$(id).close();
    if($('high-council-confirm').open)$('high-council-confirm').close();
    if($('briefing-dialog')?.open)$('briefing-dialog').close();
  }
  for (const key of ['login', 'veronica', 'initialize', 'workspace', 'signoff', 'maintenance', 'curfew', 'pda-lock']) $(key).hidden = mode !== key;
  document.body.dataset.mode = mode === 'veronica' ? 'locked' : mode;
  $('critical').hidden = mode !== 'veronica';
  $('veronica-footer').hidden=mode!=='veronica';
  if(mode==='veronica'){
    const stamp=new Date(),time=$('veronica-time');
    time.dateTime=stamp.toISOString();
    time.textContent=new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(stamp);
  }
  $('system-status').textContent = ({ login: 'TERMINAL PRÊT', veronica: 'TERMINAL ISOLÉ', initialize:'INITIALISATION',workspace:'SESSION ACTIVE',signoff:'SESSION FERMÉE',maintenance:'MAINTENANCE GÉNÉRALE',curfew:'COUVRE-FEU','pda-lock':'PDA ISOLÉ' })[mode];
  if (mode!=='workspace') $(({ login: 'login-title', veronica: 'lock-title', initialize:'initialize-title',signoff:'signoff-title',maintenance:'maintenance-title',curfew:'curfew-title','pda-lock':'pda-lock-title' })[mode]).focus();
}
function reset() {
  cancelVoice();
  clearPrivateViews();
  connectedProfile=null;
  form.reset();
  showCode(false);
  message('');
  attempts = 3;
  updateAttempts();
  screen('login');
}
$('reset').addEventListener('click',()=>{reset();if(curfewLock?.active)showSiteCurfew(curfewLock);});

const archiveSearch = $('archive-search');
const filters = Array.from(document.querySelectorAll('[data-media]'));
const agentNames = {virus:'Agent viral',parasite:'Parasite',fungus:'Agent fongique',other:'Dossier lié'};
let media = 'all';
const normalized = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').trim();
function agentClass(kind){
  if (/parasite/i.test(kind)) return 'parasite';
  if (/champignon/i.test(kind)) return 'fungus';
  if (/^(virus|famille virale|souche|variante)/i.test(kind)) return 'virus';
  return 'other';
}
const archiveIndex = archiveEntries.map((entry,index) => {
  const type=agentClass(entry.kind);
  const profile=archiveProfiles.get(entry.name)??[];
  const titleWords=normalized(entry.name).split(' ');
  const words=normalized([entry.name,entry.kind,entry.work,entry.text,agentNames[type],...profile,archiveReadingNotes[entry.name]??''].join(' ')).split(' ');
  return {entry,type,profile,titleWords,words,index};
});
function el(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}
function renderArchives() {
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.media === media)));
  const query = normalized(archiveSearch.value).split(' ').filter(Boolean);
  const contains=(words)=>query.every(token=>words.some(word=>word.startsWith(token)));
  const campaignAgents=(campaign?.rights.archives?campaign.agencyArchive??[]:[]).map(p=>({
    entry:{name:p.name,work:'Dossier original de la campagne Redcliff',text:`Effet narratif : ${p.motif}. Domaine : ${p.strand}.`},
    type:'virus',profile:[],index:0,isCampaign:true,titleWords:normalized(p.name).split(' '),
    words:normalized([p.name,p.motif,p.strand,'virus RP Redcliff'].join(' ')).split(' '),
  }));
  const matches = [...campaignAgents,...archiveIndex].filter(({type,words})=>(media==='all'||media===type)&&contains(words));
  if(query.length)matches.sort((a,b)=>Number(contains(b.titleWords))-Number(contains(a.titleWords)));
  $('archive-count').textContent = `${matches.length} fiche${matches.length !== 1 ? 's' : ''}`;
  $('archive-empty').hidden = matches.length !== 0;
  const fragment = document.createDocumentFragment();
  for (const {entry,type,profile,index,isCampaign} of matches) {
    const dossier = el('details', '', 'archive-entry');
    const summary = el('summary', '');
    const heading = el('span', '');
    heading.append(el('span', isCampaign?'VIRUS FICTIF · CAMPAGNE RP':agentNames[type], 'archive-kicker mono'), el('strong', entry.name));
    summary.append(heading);
    const bio=el('div','','archive-biography archive-dossier-body');
    const panels=el('div','','dossier-sections');
    const titles=['Origine et enjeu','Cas documentés','Comportement et cognition · RP','À ne pas confondre'];
    profile.forEach((copy,i)=>{
      const section=el('section','',i===2?'dossier-section neuro':'dossier-section');
      section.append(el('h3',titles[i]),el('p',copy));
      if(i===2) section.append(dossierPlate(['brain','brain-2','brain-3'][index%3],'Coupe cérébrale simulée','Imagerie RP. Les zones en couleur sont fictives ; elles ne représentent ni un examen médical ni des lésions confirmées dans le jeu.'));
      panels.append(section);
    });
    const note=archiveReadingNotes[entry.name];
    if(note){
      const reading=el('section','','dossier-section');
      reading.append(el('h3','Note de lecture Redcliff · RP'),el('p',note));panels.append(reading);
    }
    const references=el('div','','dossier-references');
    for(const ref of [entry.source,archiveCrossReferences[entry.name]].filter(Boolean)){
      const link=el('a',`Référence : ${ref[0]}`,'archive-reference');
      link.href=ref[1];link.target='_blank';link.rel='noopener noreferrer';references.append(link);
    }
    const plateKey=type==='other'||type==='virus'?['virus','virus-2','virus-3'][index%3]:type;
    bio.append(el('p',entry.work,'archive-context'),el('p',entry.text,'archive-lede'));
    if(!isCampaign)bio.append(
      dossierPlate(plateKey,`Planche d’archive · ${agentNames[type]}`,'Reconstitution générée pour le RP. Image d’ambiance, pas un document scientifique propre à cet agent.'),panels,references);
    dossier.append(summary, bio);
    fragment.append(dossier);
  }
  $('archive-list').replaceChildren(fragment);
}
function dossierPlate(key,title,description){
  const plate=el('figure','','dossier-plate plate-'+(key.startsWith('brain')?'brain':key));
  const view=el('img','');view.src=`./decor/${key}.webp`;view.alt=title;view.loading='lazy';
  const caption=el('figcaption','');caption.append(el('strong',title),el('span',description));
  plate.append(view,caption);return plate;
}
filters.forEach(button => button.addEventListener('click', () => {
  media = button.dataset.media;
  renderArchives();
}));
archiveSearch.addEventListener('input', renderArchives);
function openArchive(filter='all') {
  media = filter;
  archiveSearch.value = '';
  renderArchives();
}

function endpoint(route) {
  const base = window.UMBRELLA_API;
  // Local and permanent hosts forward /api/login on their own origin.
  return base && !base.startsWith('__PORT_') ? `${base.replace(/\/$/, '')}/api/${route}` : `/api/${route}`;
}
let anonymousHealthBusy=false, siteLock=null, maintenancePrevious='login', maintenanceDeadline=0;
let curfewLock=null,curfewPrevious='login',parisClockAnchor=null,curfewRelease=null;
let liveAccessRevision=0,liveAccessTime=0;
function oldAccessState(state,revision){
  return state.now<liveAccessTime||(revision!==liveAccessRevision&&state.now===liveAccessTime);
}
const parisTime=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
function syncParisClock(serverNow){
  if(Number.isFinite(serverNow))parisClockAnchor={server:serverNow*1000,local:performance.now()};
  tickCurfewClock();
}
function tickCurfewClock(){
  const now=parisClockAnchor?parisClockAnchor.server+(performance.now()-parisClockAnchor.local):Date.now();
  const clock=parisTime.format(now);
  const update=id=>{
    const time=$(id);
    if(time.textContent!==clock){time.textContent=clock;time.dateTime=new Date(now).toISOString();}
  };
  update('site-clock');
  if(current!=='curfew'||!curfewLock)return;
  update('curfew-clock');
  const seconds=Math.max(0,Math.ceil((curfewLock.until-now)/1000));
  const remaining=Number.isFinite(seconds)?seconds===0?'Réouverture…':
    [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':'):'Calcul en cours…';
  if($('curfew-remaining').textContent!==remaining)$('curfew-remaining').textContent=remaining;
}
setInterval(tickCurfewClock,250);
function paintLogin(active=true){
  $('system-status').textContent=active?'CAMPAGNE EN LIGNE':'TERMINAL PRÊT';
  $('login-caption').textContent='La campagne Redcliff est active. Saisis ton matricule et ton code RP.';
}
function paintSiteCurfew(){
  const value=`${curfewLock.start} - ${curfewLock.end}${curfewLock.start>curfewLock.end?' (+1 j)':''}`;
  if($('curfew-hours').textContent!==value)$('curfew-hours').textContent=value;
  $('curfew-logout').hidden=!token;
  tickCurfewClock();
}
function showSiteCurfew(lock,{serverNow}={}){
  if(current==='pda-lock')return;
  curfewLock=lock;
  syncParisClock(serverNow);
  if(current!=='curfew'){
    if(current!=='maintenance')curfewPrevious=current;
    else if(current==='maintenance'&&maintenancePrevious!=='curfew')curfewPrevious=maintenancePrevious;
    siteLock=null;
    interruptWorkspaceRequests();
    codeInput.value='';showCode(false);message('');
    cancelVoice();stopSfx();
    for(const id of ['council-notice','bio-popup'])if($(id).open)$(id).close();
    $('maintenance-actions').replaceChildren();
    screen('curfew');
    startCurfewAudio();
  }
  paintSiteCurfew();
}
$('curfew-emergency-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget,send=form.querySelector('button'),feedback=$('curfew-emergency-feedback');
  if(current!=='curfew'||send.disabled)return;
  send.disabled=true;feedback.textContent='';
  try{
    const response=await fetch(endpoint('curfew-emergency'),{method:'POST',
      headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),
      body:JSON.stringify({id:$('curfew-director').value,code:$('curfew-code').value,confirmed:true})});
    const result=await response.json();
    if(!response.ok){
      feedback.textContent=result.error==='wait'?'Trop de tentatives. Réessaie dans une minute.':
        result.error==='unchanged'?'Le couvre-feu a déjà pris fin.':
        ['denied','forbidden'].includes(result.error)?'Des identifiants de niveau 5 sont requis.':'Levée d’urgence indisponible.';
      if(result.error==='unchanged'){if(token)void syncOps();else void syncPortalHealth();}
      return;
    }
    form.reset();
    if(token)void syncOps();else void syncPortalHealth();
  }catch{feedback.textContent='Le serveur ne répond pas. Réessaie dans quelques instants.';}
  finally{$('curfew-code').value='';send.disabled=false;}
});
$('curfew-logout').addEventListener('click',()=>{
  if(token)void api('logout').catch(()=>{});
  token=null;campaign=null;connectedProfile=null;
  clearPrivateViews();
  curfewPrevious='login';
  paintSiteCurfew();
  $('curfew-title').focus({preventScroll:true});
});
function restoreWorkplace(fresh,description){
  siteLock=null;curfewLock=null;
  screen('workspace');
  receiveCampaign(fresh);
  go(hasAccess(activeTab)?activeTab:'profile');
  paintBioPopup();
  showCouncilNotice();
  notice(description);
}
async function leaveSiteCurfew(){
  if(current!=='curfew')return;
  if(token){
    if(curfewRelease)return curfewRelease;
    const session=token,lock=curfewLock;
    curfewRelease=(async()=>{
      try{
        const {campaign:fresh}=await api('state');
        if(token===session&&current==='curfew'&&curfewLock===lock)restoreWorkplace(fresh,'Couvre-feu terminé. La campagne est de nouveau accessible.');
      }catch{/* A newer lock or an unavailable server is rechecked by the next poll. */}
      finally{curfewRelease=null;}
    })();
    return curfewRelease;
  }else{
    curfewLock=null;
    if(current==='curfew')screen(curfewPrevious==='veronica'?'veronica':'login');
    if(current==='login')paintLogin();
  }
}
function tickSiteMaintenance(){
  if(current!=='maintenance')return;
  const seconds=Math.max(0,Math.ceil((maintenanceDeadline-performance.now())/1000));
  const parts=siteLock?.kind==='emergency_shutdown'
    ?[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60]:[Math.floor(seconds/60),seconds%60];
  const next=seconds?parts.map(value=>String(value).padStart(2,'0')).join(':'):'Réouverture en cours…';
  if($('maintenance-clock').textContent!==next)$('maintenance-clock').textContent=next;
}
setInterval(tickSiteMaintenance,250);
function showSiteMaintenance(lock,now){
  if(!lock||current==='pda-lock')return;
  syncParisClock(now);
  const emergency=lock.kind==='emergency_shutdown';
  const changed=current!=='maintenance'||siteLock?.id!==lock.id||siteLock?.canResume!==lock.canResume||siteLock?.session!==token;
  siteLock={...lock,session:token};maintenanceDeadline=performance.now()+Math.max(0,lock.until-now*1000);
  if(changed){
    $('maintenance').classList.toggle('emergency-lock',emergency);
    $('maintenance-title').textContent=emergency?'Intranet arrêté d’urgence':'Maintenance générale';
    $('maintenance-caption').textContent=emergency
      ?'Toutes les activités sont bloquées pendant 24 heures, niveau 5 compris. Les données sont conservées. L’arrêt prendra fin automatiquement.'
      :'Les connexions, les communications et les opérations RP sont suspendues. Les données sont conservées et l’intranet rouvrira automatiquement.';
    $('emergency-reopening').hidden=!emergency;
    if(emergency){
      const reopening=$('emergency-reopening-at');reopening.dateTime=new Date(lock.until).toISOString();
      reopening.textContent=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',day:'2-digit',month:'2-digit',year:'numeric',
        hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(lock.until);
      interruptWorkspaceRequests();
    }
  }
  if(current!=='maintenance'){
    maintenancePrevious=current;
    codeInput.value='';showCode(false);message('');
    cancelVoice();
    for(const id of ['council-notice','bio-popup'])if($(id).open)$(id).close();
    screen('maintenance');
  }
  if(emergency&&$('system-status').textContent!=='ARRÊT D’URGENCE'&&$('system-status').textContent!=='EMERGENCY SHUTDOWN')
    $('system-status').textContent='ARRÊT D’URGENCE';
  tickSiteMaintenance();
  if(!changed)return;
  $('maintenance-feedback').textContent='';
  const controls=$('maintenance-actions');controls.replaceChildren();
  if(!emergency&&lock.canResume&&token){
    const unlock=button('Rouvrir l’intranet',async()=>{
      unlock.disabled=true;
      try{
        const result=await api('action',{action:'site_resume',maintenanceId:lock.id,confirmed:true});
        await leaveSiteMaintenance(result.campaign,result.curfew,result.now);
      }catch(error){$('maintenance-feedback').textContent=toastText[error.message]??toastText.unavailable;}
      finally{unlock.disabled=false;}
    },'primary');
    controls.append(unlock);
  }
  if(token)controls.append(button('Fermer la session',()=>{
    void api('logout').catch(()=>{});
    token=null;campaign=null;connectedProfile=null;clearPrivateViews();
    maintenancePrevious='login';showSiteMaintenance({...lock,canResume:false},(lock.until-Math.max(0,maintenanceDeadline-performance.now()))/1000);
    $('maintenance-title').focus();
  },'secondary'));
}
async function leaveSiteMaintenance(next,curfew,serverNow){
  if(current!=='maintenance')return;
  if(curfew?.active){showSiteCurfew(curfew,{serverNow});return;}
  if(token){
    const session=token,revision=liveAccessRevision;
    const message=siteLock?.kind==='emergency_shutdown'?'Arrêt d’urgence terminé. La campagne est de nouveau accessible.':
      'Maintenance terminée. La campagne est de nouveau accessible.';
    const fresh=next??(await api('state')).campaign;
    if(token!==session||current!=='maintenance'||revision!==liveAccessRevision)return;
    restoreWorkplace(fresh,message);
  }else{
    siteLock=null;curfewLock=null;
    screen(maintenancePrevious==='veronica'?'veronica':'login');
  }
  $('maintenance-actions').replaceChildren();
}
async function syncPortalHealth(){
  if(anonymousHealthBusy||token||['workspace','initialize','pda-lock'].includes(current))return;
  anonymousHealthBusy=true;
  const revision=liveAccessRevision;
  try{
    const response=await fetch(endpoint('health'),{cache:'no-store',signal:AbortSignal.timeout(8000)});
    const state=await response.json();
    if(!response.ok||!state.online)throw new Error('offline');
    if(token||['initialize','workspace','pda-lock'].includes(current)||oldAccessState(state,revision))return;
    syncParisClock(state.now);
    if(receiveHighCouncil(state))return;
    if(state.curfew?.active){showSiteCurfew(state.curfew,{serverNow:state.now});return;}
    if(state.maintenance&&current!=='signoff'){showSiteMaintenance(state.maintenance,state.now);return;}
    if(current==='maintenance')await leaveSiteMaintenance(undefined,state.curfew,state.now);
    if(current==='curfew')await leaveSiteCurfew();
    if(current==='login')paintLogin(state.active);
    if(current!=='workspace')receivePulse(state);
  }catch{
    if(current==='login')$('login-caption').textContent='Serveur de campagne momentanément indisponible. Réessaie dans quelques instants.';
  }finally{anonymousHealthBusy=false;document.body.removeAttribute('data-access-pending');}
}
function connectLiveAccess(){
  if(typeof EventSource!=='function'||window.UMBRELLA_API===null)return;
  try{
    const stream=new EventSource(endpoint('access'));
    stream.addEventListener('access',event=>{
      let state;
      try{state=JSON.parse(event.data);}catch{return;}
      if(!state?.online||!Number.isFinite(state.now)||state.now<liveAccessTime)return;
      liveAccessTime=state.now;liveAccessRevision++;
      syncParisClock(state.now);
      if(receiveHighCouncil(state))return;
      if(current==='pda-lock')return;
      if(state.maintenance?.kind==='emergency_shutdown'){
        showSiteMaintenance(state.maintenance,state.now);
        document.body.removeAttribute('data-access-pending');
        return;
      }
      if(state.curfew?.active){
        showSiteCurfew(state.curfew,{serverNow:state.now});
        document.body.removeAttribute('data-access-pending');
        return;
      }
      if(token)void syncOps();
      else if(!state.maintenance&&current==='curfew')void leaveSiteCurfew();
      else void syncPortalHealth();
    });
  }catch{/* The periodic checks remain available if streaming is not supported. */}
}
const emergencyDialog=$('site-emergency-dialog'),emergencyConfirm=$('site-emergency-confirm'),emergencyCancel=$('site-emergency-cancel');
$('site-emergency').addEventListener('click',()=>{
  if(current!=='workspace'||!campaign?.rights.direction||emergencyDialog.open)return;
  $('site-emergency-feedback').hidden=true;
  emergencyDialog.showModal();emergencyCancel.focus();
});
emergencyCancel.addEventListener('click',()=>emergencyDialog.close());
emergencyDialog.addEventListener('cancel',event=>{if(emergencyConfirm.disabled)event.preventDefault();});
emergencyConfirm.addEventListener('click',async()=>{
  if(!token||!campaign?.rights.direction||emergencyConfirm.disabled)return;
  emergencyConfirm.disabled=emergencyCancel.disabled=true;
  const feedback=$('site-emergency-feedback');feedback.hidden=true;
  try{
    const state=await api('action',{action:'emergency_shutdown',confirmed:true});
    if(state.maintenance)showSiteMaintenance(state.maintenance,state.now);
  }catch(error){
    if(emergencyDialog.open){feedback.textContent=toastText[error.message]??toastText.unavailable;feedback.hidden=false;}
  }finally{emergencyConfirm.disabled=emergencyCancel.disabled=false;}
});
document.addEventListener('DOMContentLoaded',()=>{connectLiveAccess();void syncPortalHealth();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void syncPortalHealth();});
setInterval(syncPortalHealth,2000);
async function initialize(seconds=5){
  screen('initialize');
  playSfx('boot');
  const boot=$('boot-progress'), clock=$('boot-clock'), step=$('boot-step');
  const start=performance.now();
  const messages=['Ouverture du canal interne…','Lecture de l’habilitation…','Synchronisation du poste…','Connexion de la Reine Rouge…','Accès au réseau Redcliff…'];
  boot.max=seconds;
  return new Promise(resolve=>{
    const pulse=()=>{
      if(current!=='initialize'){resolve();return;}
      const elapsed=Math.min((performance.now()-start)/1000,seconds);
      boot.value=elapsed;
      clock.textContent=`0${Math.ceil(seconds-elapsed)} S`;
      step.textContent=messages[Math.min(messages.length-1,Math.floor(elapsed/seconds*messages.length))];
      if(elapsed<seconds) setTimeout(pulse,80);
      else resolve();
    };
    pulse();
  });
}
async function startSession(result) {
  const profile=result.profile;
  const alreadyLocked=current==='maintenance'||current==='curfew';
  if(!alreadyLocked)curfewLock=null;
  connectedProfile=profile;
  $('profile-title').textContent=profile.name;
  $('profile-group').textContent=profile.group;
  $('profile-id').textContent=`${profile.matricule??profile.id}${profile.dossier?` / Dossier ${profile.dossier}`:''}`;
  $('profile-level').textContent=profile.level===null?(profile.roleCode?`${profile.roleCode} · Agent habilité`:'Agent habilité'):
    `Niveau ${profile.level}${profile.level===5?' · Accès total':''}`;
  $('profile-division').textContent=profile.division;
  form.reset();
  showCode(false);
  if(!alreadyLocked)await initialize();
  token=result.token;
  let gate;
  try{
    let revision;
    do{
      revision=liveAccessRevision;
      gate=await api('pulse');
    }while(token===result.token&&oldAccessState(gate,revision));
  }
  catch(error){
    if(token===result.token){token=null;reset();}
    void syncPortalHealth();
    throw error;
  }
  if(token!==result.token)return;
  openWorkspace(result,gate);
  await syncOps();
  if(current==='workspace'&&!mobilRun?.running)playVoice('welcome');
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled || current !== 'login' || highRun) return;
  const id = idInput.value.trim().toUpperCase();
  const code = codeInput.value.trim();
  if (!id || !code) {
    message('Renseigne ton matricule et ton code RP.', true);
    (!id ? idInput : codeInput).focus();
    return;
  }
  message('');
  if(window.UMBRELLA_API===null){
    message('Aucun serveur de campagne n’est configuré dans cet aperçu. Aucun essai décompté.');
    codeInput.value='';
    showCode(false);
    return;
  }
  void unlockMobilAudio().catch(()=>{});
  submit.disabled = idInput.readOnly = codeInput.readOnly = toggle.disabled = true;
  submit.firstElementChild.textContent = 'Vérification…';
  const revision=liveAccessRevision;
  try {
    const response = await fetch(endpoint('login'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, code }), signal: AbortSignal.timeout(12000),
    });
    const result = await response.json();
    if(result.error==='high_council_active'){receiveHighCouncil(result);return;}
    if(result.error==='pda_locked'&&result.monitorToken){
      showPdaLock(result.pda,result.now,result.monitorToken);return;
    }
    if(['site_maintenance','curfew_active'].includes(result.error)&&oldAccessState(result,revision)){
      if(current==='login')message('Le statut d’accès vient de changer. Réessaie de te connecter.');
      void syncPortalHealth();return;
    }
    if(result.error==='curfew_active'&&result.curfew){
      showSiteCurfew(result.curfew,{serverNow:result.now});
      return;
    }
    if(result.error==='site_maintenance'&&result.maintenance){showSiteMaintenance(result.maintenance,result.now);return;}
    if(response.status===429&&result.error==='wait'){
      message('Trop de tentatives récentes. Attends une minute avant de réessayer. Aucun essai décompté.');
      codeInput.value='';showCode(false);return;
    }
    if (response.status === 401 && result.error === 'denied') {
      attempts--;
      updateAttempts();
      codeInput.value = '';
      showCode(false);
      if (attempts === 0) {
        screen('veronica');
        if(voice)playVoice('denied-0');
        playSfx('alarm');
      } else {
        message(`Matricule ou code incorrect. Il reste ${attempts} essai${attempts===1?'':'s'}.`, true);
        if(voice)playVoice(`denied-${attempts}`);
        playSfx('denied');
        codeInput.focus();
      }
      return;
    }
    if (!response.ok || !result.profile || !result.token || !result.campaign) throw new Error('Unavailable');
    await startSession(result);
  } catch {
    message('Le serveur ne répond pas. Réessaie : aucun essai n’a été décompté.');
  } finally {
    submit.disabled = idInput.readOnly = codeInput.readOnly = toggle.disabled = false;
    submit.firstElementChild.textContent = 'Initialiser la connexion';
  }
});
