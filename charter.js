'use strict';
// Rules of play for a fictional campaign, not real laboratory guidance.
const charterChapters=[
  ['I','Portée et habilitations',[
    ['L-101','Règlement de campagne','La charte s’applique aux scènes jouées sur le terminal Redcliff, y compris les annexes, les convois et les canaux privés. Les documents n’engagent ni entreprise réelle ni institution. En cas de contradiction entre un onglet et un message RP, le Conseil peut publier un rectificatif daté.'],
    ['L-110','Identité et matricules','Chaque joueur utilise uniquement le matricule et le code qui lui sont attribués. Un nom censuré peut désigner plusieurs dossiers distincts sans rendre leurs sessions interchangeables. Une habilitation ne doit jamais être prêtée pour contourner un espace privé.'],
    ['L-120','Séparation des conseils','Le Conseil de Sécurité traite la conformité, les alertes et les sanctions. Le Conseil Blackwater possède son mandat et son canal propres. Une invitation Blackwater ne modifie pas l’accès au Bastion.'],
    ['L-130','Continuité du récit','Le statut publié d’un personnage reste la référence pour les autres joueurs. Les hypothèses, témoignages et informations hors jeu ne remplacent pas un avis officiel. Une scène de révélation doit être prévue avant toute modification de statut.']]],
  ['II','Accès aux laboratoires',[
    ['L-201','Périmètre autorisé','Chaque laboratoire dispose de secteurs identifiés par des lettres. Le plan sert à sélectionner un secteur et à lire son statut. Une carte en lecture seule ne vaut pas autorisation d’entrer ni d’actionner une console.'],
    ['L-210','Repères cartographiques','La carte distingue les emplacements validés des hypothèses de terrain. Un repère provisoire ne permet pas de conclure à la présence d’un laboratoire ni à l’existence d’une liaison. Seule une confirmation de campagne peut valider le repère.'],
    ['L-220','Site condamné','Protest-X reste fermé. Les rapports de veille sont consultables selon l’habilitation, mais aucun ordre de recherche, livraison ou réouverture ne peut y être envoyé. Ce dossier est distinct de l’incident des égouts.'],
    ['L-240','Salles scellées','Les secteurs classés apparaissent uniquement aux comptes habilités. Un joueur ne copie pas leur contenu dans un canal général et ne déplace pas leurs entrées vers un registre public. Un résumé non classé peut être demandé au Conseil.']]],
  ['III','Recherche et incidents',[
    ['L-310','Dossiers de recherche','Un dossier porte un nom unique, un site et une famille. Un symbole, une signature ou un lot désigne une carte de jeu, jamais une substance ou une méthode réelle. Le secteur doit être opérationnel pour déposer une nouvelle création.'],
    ['L-321','Sortie de périmètre interdite','Aucun agent fictif ou dossier simulé soumis au confinement ne doit sortir du laboratoire ou du périmètre autorisé hors scène validée. Le Conseil cite cette règle dans le dossier des égouts de Redcliff, lié aux agents T et G. Les statuts publics de Hans Riemann et d’Alistaire Vances demeurent « portés disparus ».'],
    ['L-330','Déclaration de BIOHAZARD','Le rapporteur indique le laboratoire, le secteur, la nature de la scène et son niveau, de I à X. Le niveau signale l’importance narrative et non une estimation physique. Une seule alerte active est admise dans un secteur.'],
    ['L-340','Levée de confinement','James Marcus et Oswell peuvent clore une alerte active après la résolution de la scène. La levée conserve le dossier dans le journal. Une alerte de jeu ne remplace jamais les consignes ou numéros de sécurité dans la vie réelle.'],
    ['L-350','Registre froid','Les valeurs affichées sont des pourcentages de simulation. Un circuit en défaut doit être réparé avant le changement de consigne. Le poste indique la dernière mise à jour enregistrée, et non la valeur souhaitée avant soumission.']]],
  ['IV','Armureries et opérations logistiques',[
    ['L-410','Références d’armurerie','Les noms empruntés aux jeux sont des étiquettes de catalogue. Les quantités et les dossiers de répliques sont propres à la campagne. Les fiches ne détaillent ni construction, ni utilisation, ni achat réel.'],
    ['L-420','Commande et convoi','La commande enregistre une quantité, une destination et un débit fictif. Elle devient un convoi RP jusqu’à sa réception. Une arrivée n’est comptée qu’une fois et alimente le stock de la destination après validation.'],
    ['L-430','Dossiers de sujets fictifs','Un dossier Tyrant ou Nemesis est un objet d’intrigue. Le site distingue son registre de confinement de l’armurerie des répliques. Un dossier n’autorise pas un joueur à imposer une scène à un autre.'],
    ['L-440','Dotation du Bastion','Le stock B01 reste sous contrôle séparé. L’habilitation au Conseil et la validation du code d’armurerie sont nécessaires pour consulter l’inventaire. Une ouverture ne se transfère pas à une autre session.']]],
  ['V','Budget, ventes et contreparties',[
    ['L-510','Trésorerie partagée','Toute création ou commande débitée inscrit une ligne au journal. Les recettes de vente sont créditées au même budget partagé. Une opération refusée ne doit pas produire de mouvement comptable.'],
    ['L-520','Vente et clôture','La vente clôt un dossier disponible. Elle empêche sa réutilisation comme commande ou comme seconde vente. Si le joueur hésite entre vente et livraison, il peut conserver le dossier en attente.'],
    ['L-530','The Connections','Les commandes du Black Market ne sont que des demandes d’archives ou de liaison scénarisées. Le contact répond dans la boîte RP. Ne fournis pas de coordonnées personnelles ni d’informations de paiement.'],
    ['L-540','Devise de campagne','Les dollars RP ($) sont fictifs et n’ont aucune valeur en argent réel. Ils ne peuvent pas être transférés vers Roblox, convertis en Robux, ni encaissés par un joueur. Une preuve d’achat externe n’est jamais demandée.']]],
  ['VI','Réseau et maintenance',[
    ['L-610','Intervention des relais','La Direction de niveau 5 peut sonner une maintenance générale ou mettre un seul salon en maintenance pour une durée de 1 à 120 minutes (10 par défaut). En maintenance générale, les activités sont suspendues ; le compte à rebours et la fermeture de session restent accessibles. Aucune donnée n’est purgée.'],
    ['L-620','Autodestruction RP','L’autodestruction est une action différente de la maintenance. Elle ferme et purge uniquement le canal du centre choisi. Une réparation lancée par la Direction rouvre ce canal après dix minutes. Les autres salons, les messages privés et les conseils ne doivent pas être touchés.'],
    ['L-630','Maintenance générale et couvre-feu','Le niveau 5 enregistre une plage en heure de Paris, puis active le dispositif depuis le Registre Direction. Pendant cette plage, tout le personnel est suspendu, y compris la Direction. L’écran d’attente permet uniquement une levée d’urgence avec les identifiants de niveau 5. Aucune donnée n’est effacée.'],
    ['L-630','Reprise','À l’expiration du délai de réparation, le relais visé redevient disponible. La reprise ne restaure pas les anciens messages supprimés par une scène d’autodestruction. Les journaux gardent la trace des deux événements.']]],
  ['VII','Correspondance et vie du groupe',[
    ['L-710','Boîtes personnelles','Chaque compte possède une boîte RP. Une notification disciplinaire est adressée au matricule concerné, plutôt qu’au salon général. Une suspension des ateliers ne retire pas le droit de lire son courrier.'],
    ['L-720','Canaux classés','Les messages des conseils restent dans leurs canaux respectifs. Le répertoire Umbrella visible à tous présente des fiches d’organisations, pas leurs conversations ou leurs identifiants privés.'],
    ['L-730','Données et pièces jointes','Utilise uniquement des noms de personnages et des images destinées au jeu. N’envoie ni adresse, ni document personnel, ni identifiant réel. Le caractère privé d’un canal ne vaut pas consentement au partage de données.']]],
  ['VIII','Décisions et contestations',[
    ['L-810','Autorité disciplinaire','James Marcus et Oswell sont les seules autorités pouvant émettre un avertissement ou une suspension de recherche. La décision indique un article et un motif, puis envoie un avis à la boîte RP du personnage.'],
    ['L-820','Contestations','Le destinataire peut demander une correction par mail RP à l’autorité signataire. Il indique la référence reçue et le point à revoir. Le contenu de sa demande ne doit pas être rendu public sans accord.'],
    ['L-830','Levée d’une suspension','La levée rétablit les droits liés au niveau lorsque aucune autre restriction ne s’applique. Elle est notifiée par courrier. Le dossier de décision reste visible uniquement à l’autorité habilitée.']]],
  ['IX','Conservation et conduite du jeu',[
    ['L-910','Intégrité des registres','Une entrée datée appartient à la chronologie de campagne. Les corrections s’ajoutent au journal au lieu de masquer la décision initiale. Les tests techniques sont effectués sur un environnement séparé.'],
    ['L-920','Mise hors jeu','Un joueur peut demander une pause ou déplacer une scène hors du terminal. Une alerte, un convoi ou une sanction RP ne constitue pas une obligation de jouer, ni un jugement sur une personne réelle.'],
    ['L-930','Révisions de la charte','Toute révision doit indiquer la règle modifiée et les rôles concernés. Les scènes déjà closes restent reliées à leur version de campagne. Le corps de la charte reste accessible à tous les niveaux.']]],
];
const sanctionArticles=new Set(['L-101','L-110','L-201','L-240','L-310','L-321','L-340','L-410','L-420','L-510','L-610','L-710','L-810','L-910']);

function renderCharter(root){
  const search=textInput('L-321, convoi, sanctions…',70,'search');
  const count=label('p','','mono minor');count.setAttribute('role','status');
  const chapters=make('div','charter-list');
  const index=make('nav','charter-index');index.setAttribute('aria-label','Sommaire de la charte');
  const byChapter=charterChapters.map(([number,title,articles])=>{
    const section=make('section','charter-chapter',label('p',`TITRE ${number}`,'tag mono'),label('h2',title));
    section.id=`charter-${number}`;
    const entries=articles.map(([id,name,body])=>{
      const detail=make('details','archive-entry',
        make('summary','',make('span','',label('span',id,'archive-kicker mono'),label('strong',name))),
        make('div','archive-biography',label('p',body)));
      section.append(detail);return {detail,query:normalized(`${number} ${title} ${id} ${name} ${body}`)};
    });
    const link=button(`${number} · ${title}`,()=>section.scrollIntoView({behavior:'auto',block:'start'}),'text-button');
    chapters.append(section);index.append(link);return {section,entries,link};
  });
  function paint(){
    let shown=0;
    const words=normalized(search.value).trim().split(/\s+/).filter(Boolean);
    for(const {section,entries,link} of byChapter){
      let matches=0;
      for(const {detail,query} of entries){
        detail.hidden=!words.every(word=>query.includes(word));
        if(!detail.hidden){matches++;if(words.length)detail.open=true;}
      }
      link.hidden=section.hidden=matches===0;shown+=matches;
    }
    count.textContent=shown?`${shown} article${shown===1?'':'s'}`:'Aucun article ne correspond à cette recherche.';
  }
  search.addEventListener('input',paint);
  root.replaceChildren(heading('UMB.NET / RÈGLEMENT DE CAMPAGNE','Charte Umbrella','Règlement du personnel RP, de l’accès aux sites à la conservation des archives. La charte distingue les règles du jeu des événements de l’intrigue.'),
    make('div','ops-console',radioField('charter-search','Rechercher un article',search),count,index),chapters);
  paint();
}
