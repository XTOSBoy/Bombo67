'use strict';

// Static publication mode: no backend or login required.
// This repository hosts the visual intranet and public lore only.
const campaignPort = '__PORT_STATIC_DEMO__';
window.REDCLIFF_PORT = campaignPort;
window.UMBRELLA_API = null;

window.UMBRELLA_DEMO_PROFILE = {
  name: 'Personnel de démonstration',
  group: 'Umbrella · Redcliff',
  matricule: 'RP-DEMO',
  level: null,
  roleCode: 'APERÇU',
  division: 'Terminal de démonstration',
  id: 'RP-DEMO'
};

const demoLabs = [
  {id:'R01',name:'Complexe urbain',room:'A',description:'Centre administratif et dossier transversal de Redcliff.',sector:'Urbain',x:49,y:43,destroyed:false},
  {id:'N04',name:'Observatoire Northgate',room:'N',description:'Observatoire RP près de la zone nord.',sector:'Nord',x:18,y:16,destroyed:false},
  {id:'H02',name:'Annexe Hélios',room:'H',description:'Annexe analytique de Redcliff.',sector:'Est',x:50,y:27,destroyed:false},
  {id:'Q17',name:'Relais portuaire',room:'Q',description:'Relais de liaison situé au port.',sector:'Port',x:61,y:48,destroyed:false},
  {id:'PX9',name:'Volcan Protest-X',room:'PX',description:'Site condamné conservé dans les archives RP.',sector:'Sud-Ouest',x:31,y:66,destroyed:true}
];

const demoSectors = {
  R01:[{id:'A',name:'Administration',detail:'Niveau administratif RP.',status:'normal'},{id:'B',name:'Archives',detail:'Salle des archives RP.',status:'normal'},{id:'C',name:'Cryogénisation',detail:'Salle fictive de stockage.',status:'normal'}],
  N04:[{id:'A',name:'Observation',detail:'Salle d’observation RP.',status:'normal'},{id:'B',name:'Recherche',detail:'Secteur scientifique fictif.',status:'normal'},{id:'C',name:'Cryogénisation',detail:'Salle fictive de stockage.',status:'normal'}],
  H02:[{id:'A',name:'Analyse',detail:'Bureau d’analyse RP.',status:'normal'},{id:'B',name:'Archives',detail:'Archives Hélios RP.',status:'normal'},{id:'C',name:'Cryogénisation',detail:'Salle fictive de stockage.',status:'normal'}],
  Q17:[{id:'A',name:'Réception',detail:'Salle de réception du port.',status:'normal'},{id:'B',name:'Convois',detail:'Zone logistique RP.',status:'normal'},{id:'C',name:'Cryogénisation',detail:'Salle fictive de stockage.',status:'normal'}],
  PX9:[{id:'A',name:'Périmètre',detail:'Secteur condamné dans le scénario.',status:'scene'},{id:'B',name:'Crèche',detail:'Zone inactive RP.',status:'scene'},{id:'C',name:'Cryogénisation',detail:'Accès suspendu.',status:'scene'}]
};

window.UMBRELLA_DEMO_CAMPAIGN = {
  revision:0,
  rights:{
    archives:true, centers:false, labs:false, security:false, mobilize:true, pda:false,
    council:false, councilManage:false, direction:false, incident:false, cryo:false,
    workshopVirus:false, workshopArms:false, stockUse:false, market:false, briefings:true,
    research:false, reports:true
  },
  balance:0,
  labs:demoLabs,
  siteSectors:demoSectors,
  lots:[
    {id:'demo-capsule-1',lab:'R01',kind:'capsule',unit:'CAP–01',name:'Échantillon fictif Alpha',type:'Archivage narratif',status:'frozen',percent:75},
    {id:'demo-capsule-2',lab:'N04',kind:'capsule',unit:'CAP–02',name:'Échantillon fictif Veronica',type:'Archivage narratif',status:'frozen',percent:82}
  ],
  cryoPipes:[
    {id:'R01-pipe-a',lab:'R01',name:'Circuit A',pressure:72,fault:false,updated:null},
    {id:'N04-pipe-a',lab:'N04',name:'Circuit A',pressure:68,fault:false,updated:null}
  ],
  centers:[],
  centerAlert:null,
  sectorAlert:null,
  councilOpen:false,
  curfew:null,
  notice:null,
  mobilizations:[],
  highCouncilAlerts:[],
  projects:[],
  europe:[],
  articles:[
    {id:'RC-001',scope:'city',tag:'RAPPORT RP',title:'Situation à Redcliff City',date:'23 novembre 2026',status:'ARCHIVE PUBLIQUE',text:'Ce rapport est une entrée statique de démonstration. Les données dynamiques de l’ancien serveur ne sont plus utilisées.',note:'Version publique du portail.'}
  ],
  contracts:[],
  ledger:[],
  treasury:null,
  events:[
    {title:'Portail publié en mode démonstration',time:'2026-11-23T00:00:00.000Z',by:'Umbrella · Redcliff'}
  ],
  virusCards:['Écho','Prisme','Brume','Sillage','Reflet','Nacre','Voile','Zénith'],
  agencyArchive:[],
  operations:{
    alerts:[], incidents:{alerts:[],revision:0}, orders:[], stock:[], market:[],
    subjects:[], sanctions:[], industrialCatalog:[], blackwaterBiography:'Conseil fictif non connecté au système dynamique.',blackwaterProjects:[['Aperçu public','Module visible sans données serveur.']]
  }
};

// Load the static interaction shim after the main defer scripts.
const staticMode = document.createElement('script');
staticMode.src = './static-mode.js?v=2';
staticMode.defer = true;
document.head.appendChild(staticMode);
