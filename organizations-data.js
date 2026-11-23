'use strict';

// Public game lore and clearly labeled Redcliff fiction. No live campaign records.
const organizationSources={
  timeline:['Chronologie officielle · Capcom','https://game.capcom.com/residentevil/en/re-history.html'],
  group:['Umbrella Corporation · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Umbrella_Corporation'],
  pharma:['Umbrella Pharmaceuticals · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Umbrella_Pharmaceuticals'],
  usa:['Umbrella U.S.A. · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Umbrella_U.S.A.'],
  europe:['Dossier Nemesis · Capcom','https://game.capcom.com/residentevil/en/exfile-1-40.html'],
  japan:['Umbrella Japan · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Umbrella_Japan_Co.,_Ltd.'],
  asia:['Histoire et divisions du groupe · The Resident Evil Podcast','https://residentevilpodcast.com/umbrella-corporation/'],
  russia:['Umbrella Russia · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Umbrella_Russia'],
  pole:['Archives de la base antarctique · Capcom USA','https://news.capcomusa.com/lets/browse/new-umbrella-corps-map-explores-antarctic-base-from-resident-evil-code-veronica'],
  antarctic:['Base antarctique · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Antarctic_Base'],
  industries:['Umbrella Industries · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Umbrella_Industries'],
  medical:['Umbrella Medical Equipment · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Umbrella_Medical_Equipment'],
  paraguas:['Paraguas Line Company · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Paraguas_Line_Company'],
  parasol:['Parasol · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Parasol'],
  neo:['Neo Umbrella · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Neo_Umbrella'],
  lanshiang:['Lanshiang · Capcom','https://game.capcom.com/residentevil/uk/exfile-2-34.html'],
  blue:['Umbrella Co. · Resident Evil Wiki','https://residentevil.fandom.com/wiki/Umbrella_Co._(Blue_Umbrella)'],
  goals:['Lettre sur les objectifs d’Umbrella · fichier de Not a Hero','https://www.evilresource.com/resident-evil-7/not-a-hero/files/letter-regarding-umbrellas-goals']
};

const organizationGroups={
  core:'Groupe historique',
  branch:'Branches et divisions',
  affiliate:'Filiales et sociétés liées',
  later:'Organisations postérieures'
};

const umbrellaOrganizations=[
  {
    id:'org-corporation',code:'UC–HQ',name:'Umbrella Corporation',group:'core',relation:'Conglomérat historique',region:'International',
    description:'La structure qui rassemble les activités pharmaceutiques, industrielles et régionales de l’Umbrella d’origine.',
    source:'group',related:['org-pharmaceuticals','org-usa','europe','org-blue','org-black-umbrella'],
    files:[
      ['UC–01','Du laboratoire au conglomérat','Jeux : chronologie Umbrella','Le groupe se développe autour de son activité pharmaceutique. Après la catastrophe de Raccoon City, la suspension de ses activités accélère sa chute.','timeline'],
      ['UC–02','Dossier de l’Afrique de l’Ouest','Jeux : Resident Evil 5','Le laboratoire africain appartient à l’histoire du groupe. C’est un site de recherche, pas une société distincte.','group'],
      ['UC–RP','Projet Atlas','Campagne RP','Une cartographe de Redcliff a retrouvé trois organigrammes incompatibles. Les comparer aux cachets des dossiers de liaison permettrait de savoir lequel est le plus ancien.']
    ]
  },
  {
    id:'org-black-umbrella',code:'BK–01',name:'Black Umbrella',group:'branch',
    relation:'Branche armée d’élite d’Umbrella',region:'Redcliff City',campaignOnly:true,
    description:'La branche armée d’élite d’Umbrella. À Redcliff, elle relève du Conseil de Sécurité pour la protection des sites et les interventions de la campagne.',
    keywords:'securite conseil elite black umbrella branche armee',related:['org-corporation','org-usa','europe'],
    files:[
      ['BK–01','Mandat du Conseil','Campagne RP','Le Conseil de Sécurité inscrit Black Umbrella dans l’organigramme de Redcliff. La fiche distingue son mandat de celui de Blackwater, qui conserve son propre bureau et son propre registre.'],
      ['BK–02','Relève de la garnison','Campagne RP','Après une mobilisation, le Conseil attend le compte rendu d’arrivée de l’unité avant de lever l’alerte. Le compte rendu et la décision de levée constituent deux pièces distinctes.'],
      ['BK–RP','Projet Obsidienne','Campagne RP','Deux copies du premier mandat portent des dates différentes. Les joueurs sont chargés de retrouver celle que le Conseil a réellement approuvée et d’expliquer l’écart dans le registre.']
    ]
  },
  {
    id:'org-usa',code:'US–01',name:'Umbrella U.S.A.',nav:'Umbrella USA',group:'branch',relation:'Branche américaine',region:'Chicago / Raccoon City',
    description:'La branche américaine supervise notamment les installations de Raccoon City. NEST et Arklay figurent ici comme sites, pas comme entreprises.',
    source:'usa',related:['org-corporation','europe','org-blue'],
    files:[
      ['US–02','Projet G / laboratoire NEST','Jeux : Resident Evil 2','Archives sur le projet fictif de William Birkin au NEST et sur les événements qui conduisent Leon et Claire jusqu’au laboratoire.','usa'],
      ['US–03','Incident du manoir Spencer','Jeux : Resident Evil','Retour sur le laboratoire d’Arklay, le manoir qui le dissimule et l’enquête de l’équipe Alpha des S.T.A.R.S.','timeline'],
      ['US–RP','Projet Sentinel','Campagne RP','Redcliff reçoit deux versions d’un bordereau américain. Le bureau d’archives demande de vérifier les dates de réception et le dossier auquel chaque copie appartient.']
    ]
  },
  {
    id:'europe',code:'UE–06',name:'Umbrella Europe',group:'branch',relation:'Branche européenne',region:'Europe / Paris',
    description:'Le sixième laboratoire, le projet Nemesis, le dossier NE-α et les projets de liaison avec Redcliff.',
    source:'europe',keywords:'Nemesis NE alpha Janus Boréal Ariane Palimpseste'
  },
  {
    id:'org-japan',code:'JP–01',name:'Umbrella Japan',group:'branch',relation:'Branche japonaise',region:'Tokyo / Japon',
    description:'Umbrella Japan Co., Ltd. dispose de sa propre direction et développe des activités en biotechnologie et en équipements.',
    source:'japan',related:['org-asia','org-usa','org-industries'],
    files:[
      ['JP–02','Institut de recherche japonais','Archives : Umbrella Japan','Les archives situent le lancement de l’institut à la fin des années 1980. Il marque le passage des importations à une activité de recherche sur place.','japan'],
      ['JP–03','Dossier de liquidation','Archives : Umbrella Japan','Après la chute de la maison historique, la branche japonaise cherche sans succès un repreneur et finit par être liquidée.','japan'],
      ['JP–RP','Projet Kintsugi','Campagne RP','Des manuels de bancs de mesure japonais sont arrivés sans leur index. À Redcliff, la maintenance cherche la page qui correspond à chaque modèle représenté.']
    ]
  },
  {
    id:'org-russia',code:'RU–03',name:'Umbrella Russia',group:'branch',relation:'Branche clandestine',region:'Caucase',
    description:'Le dossier russe suit le complexe caché du Caucase, l’un des derniers sites du groupe historique.',
    source:'russia',related:['org-corporation','org-asia'],
    files:[
      ['RU–02','Complexe du Caucase','Jeux : The Umbrella Chronicles','Le site de l’ancienne usine chimique dissimule un centre Umbrella. L’incident du Caucase appartient aux derniers chapitres de la chute du groupe.','timeline'],
      ['RU–RP','Projet Oural','Campagne RP','Une caisse de documents est arrivée avec deux cachets de provenance différents. Redcliff doit comparer le registre d’arrivée et les photographies de la caisse avant de classer le dossier.']
    ]
  },
  {
    id:'org-asia',code:'AS–01',name:'Umbrella Asia',group:'branch',relation:'Division régionale documentée',region:'Asie continentale',
    description:'Les archives secondaires distinguent les activités d’Asie continentale de celles d’Umbrella Japan. Les projets propres à cette division sont moins documentés.',
    source:'asia',related:['org-japan','org-russia'],
    files:[
      ['AS–02','Périmètre de la division','Archives : organisation du groupe','Les sources distinguent la division continentale d’Umbrella Japan. Le dossier ne l’assimile ni à Umbrella Russia ni à Neo-Umbrella.','asia'],
      ['AS–RP','Projet Jade','Campagne RP','Deux archives portent la même référence dans des inventaires différents. Redcliff ouvre un dossier de rapprochement pour éviter de fusionner les mauvaises pièces.']
    ]
  },
  {
    id:'org-south-pole',code:'SP–98',name:'Umbrella South Pole',group:'branch',relation:'Division antarctique',region:'Antarctique',
    description:'La division du pôle Sud correspond à la base antarctique liée à la famille Ashford, et non à une société autonome.',
    source:'antarctic',related:['org-corporation','org-pharmaceuticals'],
    files:[
      ['SP–01','Code: Veronica / archives Ashford','Jeux : Resident Evil Code: Veronica','Le dossier suit la famille Ashford, Rockfort et la base de recherche et de transit d’Antarctique.','antarctic'],
      ['SP–02','Incident de la base antarctique','Jeux : Resident Evil Code: Veronica','En 1998, la base est mise hors service à la suite de l’incident dans lequel Claire et Chris Redfield sont impliqués.','pole'],
      ['SP–RP','Projet Nadir','Campagne RP','Un plan très ancien de la base comporte une annotation illisible signée « A. Ashford ». Les archivistes de Redcliff peuvent la comparer aux copies conservées dans le dossier familial.']
    ]
  },
  {
    id:'org-pharmaceuticals',code:'UP–68',name:'Umbrella Pharmaceuticals',group:'core',relation:'Société pharmaceutique d’origine',region:'Europe / international',
    description:'L’activité pharmaceutique à l’origine du conglomérat. Certains récits utilisent simplement « Umbrella » pour parler des deux.',
    source:'pharma',related:['org-corporation','org-medical','org-usa'],
    files:[
      ['UP–01','Catalogue pharmaceutique','Archives : produits grand public','Aqua Cure et Safsprin figurent parmi les marques fictives de la société. Le catalogue documente sa façade commerciale.','pharma'],
      ['UP–02','Dossier des fondateurs','Archives : origines du groupe','Oswell E. Spencer, Edward Ashford et James Marcus sont associés à la fondation de la société pharmaceutique en 1968.','pharma'],
      ['UP–RP','Projet Vitrine','Campagne RP','Un jeu d’affiches commerciales récupéré à Redcliff présente une marque absente du catalogue connu. Reste à déterminer s’il s’agit d’une maquette ou d’une publicité réellement diffusée dans le scénario.']
    ]
  },
  {
    id:'org-industries',code:'UI–04',name:'Umbrella Industries',group:'affiliate',relation:'Filiale industrielle',region:'Équipements industriels',
    description:'La filiale industrielle d’Umbrella apparaît dans les archives d’équipements du conglomérat.',
    source:'industries',related:['org-medical','org-japan','org-parasol'],
    files:[
      ['UI–01','Inventaire des équipements','Archives : matériel Umbrella','Les références du groupe attribuent à Umbrella Industries du matériel destiné aux installations. La fiche ne contient ni plan ni guide d’utilisation.','industries'],
      ['UI–RP','Projet Forge','Campagne RP','Le dépôt de Redcliff a reçu des pièces de rechange sans fiche d’inventaire. L’équipe doit retrouver le bon de livraison avant de les attribuer à un secteur.']
    ]
  },
  {
    id:'org-medical',code:'ME–02',name:'Umbrella Medical Equipment',group:'affiliate',relation:'Filiale d’équipement et de recherche médicale',region:'International / Amérique du Nord',
    description:'Cette entreprise de recherche médicale est distincte d’Umbrella Pharmaceuticals et possède une division nord-américaine.',
    source:'medical',keywords:'equipements medicaux',related:['org-pharmaceuticals','org-industries','org-usa'],
    files:[
      ['ME–01','Dossier Douglas Lauper','Archives : Resident Evil 3: Nemesis','Les archives citent Douglas Lauper comme chercheur de la filiale et le rattachent à l’incident de Raccoon City.','medical'],
      ['ME–RP','Projet Iris','Campagne RP','La salle d’observation de Redcliff veut retrouver l’origine de plusieurs moniteurs. Le dossier regroupe leurs étiquettes d’entretien et les dates d’installation consignées.']
    ]
  },
  {
    id:'org-paraguas',code:'PL–03',name:'Paraguas Line Company',group:'affiliate',relation:'Filiale maritime',region:'Méditerranée / Atlantique',
    description:'Compagnie de croisières liée à Umbrella. Ses navires figurent dans les archives de Resident Evil Revelations.',
    source:'paraguas',related:['org-corporation','europe'],
    files:[
      ['PL–01','Queen Zenobia et navires jumeaux','Jeux : Resident Evil Revelations','Le Queen Zenobia, le Queen Dido et le Queen Semiramis ont appartenu à la même compagnie. Le dossier distingue cette période de l’incident ultérieur du Zenobia.','paraguas'],
      ['PL–02','Incident du Queen Zenobia','Jeux : Resident Evil Revelations','La chronologie officielle situe l’enquête de la BSAA sur le paquebot après la chute d’Umbrella.','timeline'],
      ['PL–RP','Projet Cartago','Campagne RP','Redcliff reçoit le fac-similé d’un carnet de bord antérieur à l’incident du Zenobia. Plusieurs pages ont été rangées dans le mauvais ordre.']
    ]
  },
  {
    id:'org-parasol',code:'PA–MO',name:'Parasol',group:'affiliate',relation:'Société associée',region:'Électronique / archivage',
    description:'Parasol fournit des supports électroniques à Umbrella. Les sources ne tranchent pas clairement entre filiale et société associée.',
    source:'parasol',related:['org-industries','org-corporation'],
    files:[
      ['PA–01','Dossier des disques MO','Archives : accessoires Umbrella','Les disques magnéto-optiques de la marque apparaissent comme supports de données dans les installations Umbrella.','parasol'],
      ['PA–RP','Projet Mosaïque','Campagne RP','Les archives de Redcliff découvrent des étiquettes de disques dont les titres ont été intervertis. L’index papier servira à reconstituer leur ordre de classement.']
    ]
  },
  {
    id:'org-neo',code:'NU–13',name:'Neo-Umbrella',group:'later',relation:'Organisation indépendante',region:'Lanshiang / Asie de l’Est',
    description:'Le groupe de Carla Radames reprend le nom Umbrella dans Resident Evil 6. Il ne dépend ni du conglomérat historique ni de Blue Umbrella.',
    source:'neo',related:['org-blue','org-corporation'],
    files:[
      ['NU–01','Projet HAOS','Jeux : Resident Evil 6','Dossier sur la créature fictive découverte dans le complexe sous-marin et sur sa place dans l’intrigue de Chris et Piers.','neo'],
      ['NU–02','Archives de Lanshiang','Jeux : Resident Evil 6','Les événements du jeu relient l’organisation à la ville côtière de Lanshiang, notamment au quartier de Tatchi.','lanshiang'],
      ['NU–RP','Projet Écho-13','Campagne RP','Une coupure de presse portant le nom Neo-Umbrella a été classée dans les archives du groupe historique. À Redcliff, ce dossier sert à corriger l’attribution et à reconstituer sa provenance.']
    ]
  },
  {
    id:'org-blue',code:'BU–07',name:'Blue Umbrella',group:'later',relation:'Organisation issue de l’ancienne branche américaine',region:'États-Unis / Louisiane',
    description:'Umbrella Co. reprend le nom sous un logo bleu et affirme vouloir réparer les dégâts de l’ancienne Umbrella. Elle est distincte de Neo-Umbrella.',
    source:'blue',related:['org-usa','org-neo','org-corporation'],
    files:[
      ['BU–01','Objectifs déclarés d’Umbrella Co.','Jeux : Not a Hero','Une lettre de briefing explique pourquoi l’organisation a gardé le nom Umbrella et présente sa mission officielle.','goals'],
      ['BU–02','Dossier Baker / Louisiane','Jeux : Resident Evil 7','La nouvelle organisation intervient en Louisiane avec Chris Redfield à la suite des événements de la propriété Baker.','blue'],
      ['BU–RP','Projet Vigie','Campagne RP','Redcliff reçoit une demande de consultation d’archives au nom d’Umbrella Co. Le bureau de liaison doit vérifier l’identité de l’expéditeur avant de répondre.']
    ]
  }
];
