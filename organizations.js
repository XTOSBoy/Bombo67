'use strict';

const featuredOrganizations=new Set(['org-usa','europe','org-neo','org-blue','org-black-umbrella']);
const organizationByTab=new Map(umbrellaOrganizations.map(org=>[org.id,org]));
const directoryState={query:'',group:'all'};
const blackwaterDirectory={id:'blackwater',code:'BW–00',name:'Blackwater',group:'campaign',region:'Redcliff',
  relation:'Organisation privée RP',description:'Bureau de liaison de Redcliff. Accès réservé aux membres autorisés.',
  keywords:'cercle liaison conseil privé redcliff',files:[]};

function mountOrganizationTabs(){
  const primary=$('organization-featured');
  const other=$('organization-other');
  const views=$('organization-views');
  const ordered=[...featuredOrganizations,...umbrellaOrganizations.filter(org=>!featuredOrganizations.has(org.id)).map(org=>org.id)];
  for(const id of ordered){
    const org=organizationByTab.get(id);
    const nav=label('button',org.nav??org.name);
    nav.type='button';nav.dataset.tab=id;
    (featuredOrganizations.has(id)?primary:other).append(nav);
    if(id==='europe')continue;
    const view=make('section','desk-view organization-view');
    view.id=id;view.hidden=true;view.setAttribute('aria-label',org.name);
    views.append(view);
  }
}

function revealOrganizationTab(id){
  if(organizationByTab.has(id)&&!featuredOrganizations.has(id))$('organization-more').open=true;
}

function resetOrganizationViews(){
  Object.assign(directoryState,{query:'',group:'all'});
  $('organization-more').open=false;
  $('organizations').replaceChildren();
  for(const view of $('organization-views').children)view.replaceChildren();
}

function organizationReference(key){
  const [name,url]=organizationSources[key];
  const link=label('a',name,'archive-reference');
  link.href=url;link.target='_blank';link.rel='noopener noreferrer';
  return link;
}

function organizationBack(){
  return button('‹ Annuaire du groupe',()=>go('organizations'),'text-button org-back');
}

function organizationTone(org){
  return org.id==='org-blue'?'blue':org.id==='org-neo'?'amber':org.campaignOnly?'black':org.group;
}

function organizationArrow(){
  const arrow=label('span','→','org-arrow');
  arrow.setAttribute('aria-hidden','true');
  return arrow;
}

function organizationDirectory(root){
  const directory=[...umbrellaOrganizations,...(campaign?.rights.blackwater?[blackwaterDirectory]:[])];
  const title=heading('UMBRELLA / ORGANIGRAMME','Annuaire du groupe',
    'Parcours les branches historiques, les sociétés liées et les organisations qui ont repris le nom Umbrella. Chacune a son onglet de projets et d’archives.');
  const intro=make('div','org-directory-header',title,make('div','org-database-count',
    label('strong',String(directory.length),'mono'),label('span','ORGANISATIONS','mono tag')));
  const search=make('input','');
  search.id='organization-search';search.type='search';search.autocomplete='off';search.value=directoryState.query;
  search.placeholder='Nom, région ou projet : HAOS, Nemesis…';
  const searchLabel=label('label','Rechercher dans l’annuaire');searchLabel.htmlFor=search.id;
  const filters=make('div','archive-filters org-filters');
  filters.setAttribute('role','group');filters.setAttribute('aria-label','Type d’organisation');
  const reset=button('Réinitialiser les filtres',()=>{
    Object.assign(directoryState,{query:'',group:'all'});
    search.value='';paint();search.focus();
  },'text-button org-reset');
  const status=label('p','','archive-count mono');status.setAttribute('role','status');
  const grid=make('div','org-grid');
  const noResults=label('p','Aucun résultat. Essaie un autre nom, un lieu ou un projet.','archive-empty org-empty');
  const items=directory.map(org=>{
    const title=label('h2',org.name);
    const action=button('Ouvrir l’onglet',()=>go(org.id),'secondary org-open');
    action.append(organizationArrow());
    action.setAttribute('aria-label',`Ouvrir l’onglet ${org.name}`);
    action.dataset.orgOpen=org.id;
    const panel=make('article',`org-card org-tone-${organizationTone(org)}`,
      make('div','org-card-meta',label('span',org.code,'mono org-code'),label('span',org.region,'minor')),
      title,label('p',org.relation,'org-relationship'),label('p',org.description,'minor'),action);
    const text=[org.code,org.name,org.nav,org.region,org.relation,organizationGroups[org.group],org.description,org.keywords,
      ...(organizationBiographies[org.id]??[]),...(org.files??[]).flatMap(file=>file.slice(0,4))].filter(Boolean).join(' ');
    grid.append(panel);
    return {org,panel,text:normalized(text)};
  });
  function paint(){
    const words=normalized(directoryState.query).split(' ').filter(Boolean);
    let count=0;
    for(const {org,panel,text} of items){
      panel.hidden=(directoryState.group!=='all'&&directoryState.group!==org.group)||!words.every(word=>text.includes(word));
      if(!panel.hidden)count++;
    }
    for(const control of filters.children)control.setAttribute('aria-pressed',String(control.dataset.orgGroup===directoryState.group));
    status.textContent=`${count} organisation${count===1?'':'s'}`;
    reset.hidden=!directoryState.query&&directoryState.group==='all';
    noResults.hidden=count!==0;
    grid.hidden=count===0;
  }
  for(const [key,caption] of [['all','Toutes'],...Object.entries(organizationGroups),...(campaign?.rights.blackwater?[['campaign','Campagne RP']]:[])]){
    const filter=button(caption,()=>{directoryState.group=key;paint();},'');
    filter.dataset.orgGroup=key;filters.append(filter);
  }
  search.addEventListener('input',()=>{directoryState.query=search.value;paint();});
  root.replaceChildren(intro,
    make('div','archive-controls org-controls',make('div','field',searchLabel,search),filters),
    make('div','org-results-heading',status,reset),grid,noResults,
    label('p','Les références d’onglet sont propres à Redcliff. Les dossiers des jeux et les projets inventés pour la campagne sont signalés séparément.','archive-note'));
  paint();
}

function organizationSheet(root,org){
  const rpOrigin='Campagne RP';
  const archives=make('div','europe-grid org-file-grid');
  const projects=make('div','europe-grid org-file-grid');
  for(const [id,title,origin,text,source] of org.files){
    const rp=origin===rpOrigin;
    const body=make('div','europe-project-body',label('p',origin,'org-relationship'),label('p',text));
    if(source)body.append(organizationReference(source));
    const entry=make('details','archive-entry europe-project org-file',
      make('summary','',make('span','',label('span',`${id} / ${rp?'CAMPAGNE RP':'ARCHIVE DES JEUX'}`,'archive-kicker mono'),label('strong',title))),
      body);
    (rp?projects:archives).append(entry);
  }
  const related=make('div','org-related');
  for(const id of org.related){
    const action=button(organizationByTab.get(id).name,()=>go(id));
    action.append(organizationArrow());related.append(action);
  }
  const region=make('dl','org-meta',
    make('div','',label('dt','Lien avec Umbrella','mono'),label('dd',org.relation)),
    make('div','',label('dt','Implantation / activité','mono'),label('dd',org.region)),
    make('div','',label('dt','Référence','mono'),org.campaignOnly?
      label('dd','Campagne Redcliff (hors canon)'):make('dd','',organizationReference(org.source))));
  root.replaceChildren(organizationBack(),heading(`GROUPE UMBRELLA / ${org.code}`,org.name,org.description),
    make('div',`org-ledger org-tone-${organizationTone(org)}`,region),
    organizationBiography(org.id),
    ...(org.id==='org-industries'&&campaign.rights.workshopArms?[button('Ouvrir Industrie de l’armement',()=>go('industry'),'primary')]:[]),
    ...(archives.childElementCount?[make('section','org-block',label('h2','Projets et archives des jeux'),archives)]:[]),
    make('section','org-block',label('h2',org.campaignOnly?'Projets et archives de la campagne':'Projets de la campagne'),
      label('p',org.campaignOnly?'Dossiers de Black Umbrella, propres à la campagne Redcliff.':'Scénarios de liaison inventés pour Redcliff, hors canon.','minor'),projects),
    make('section','org-block',label('h2','Onglets liés'),related));
}
function organizationBiography(id,custom){
  const titles=['Qui sont-ils ?','Où sont-ils ?','Quel est leur domaine ?','Leur rôle dans la campagne Redcliff'];
  return make('section','org-block lore-reader',label('h2','Biographie et domaine'),
    ...(custom??organizationBiographies[id]??[]).map((copy,index)=>make('article','',
      label('h3',titles[index]),label('p',copy))));
}
