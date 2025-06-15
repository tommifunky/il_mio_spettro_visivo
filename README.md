SUPSI 2025  
Corso d’interaction design, CV428.01  
Docenti: A. Gysin, G. Profeta  

Elaborato 1: Il mio spettro visivo

# TrueType
Autore: Tommaso Stanga
[TTF](https://tommifunky.github.io/TTF/)


## Introduzione e tema
La mia interfaccia web è progettata per spiegare in modo interattivo e visivo il formato di font TrueType (.ttf).
L’obiettivo è quello di raccontare in modo chiaro e coinvolgente come funziona questo formato, illustrandone la struttura interna, il funzionamento delle curve Bézier, il rendering, l'hinting e molto altro.

Il progetto mescola contenuti tecnici e grafica sperimentale per rendere l’argomento accessibile anche a chi non ha mai approfondito il tema, ma è curioso di sapere cosa c’è “dietro” ogni carattere tipografico.


## Riferimenti progettuali
Dal punto di vista visivo, il progetto prende ispirazione da:

	1. Glyphs, FontForge e vecchie interfacce da font editor

	2. L’estetica tecnica di QuarkXPress e software di impaginazione anni '90

	3. La tipografia monospace delle macchine da scrivere, il linguaggio del codice e dei prompt testuali

	4. I pixel e i righelli come simboli del rapporto tra analogico e digitale

Il sito prende ispirazione dai software per disegnare font, dove ogni lettera può essere osservata, scomposta e ricostruita.
Non ho seguito un sistema grafico preciso, ma ho costruito tutto intorno a un'idea visiva coerente: una griglia infinita che dà libertà di movimento e un’estetica tecnica che richiama le regole geometriche dietro ogni carattere.


## Design dell’interfaccia e modalità di interazione
Il sito si apre con una landing che si ritrae dopo il click, lasciando spazio alla navigazione.
La pagina è molto ampia e si può esplorare liberamente usando tre modalità: normale, con righelli, oppure drag.
Le sezioni sono distribuite su un canva esteso e raggiungibili anche dal menu in alto a destra.
Alcuni elementi sono interattivi, come la curva di Bézier che segue il mouse e i box cliccabili che aprono descrizioni.


## Tecnologia usata
Il progetto fa uso delle seguenti tecnologie:

HTML – per la struttura e l’organizzazione delle sezioni nella pagina.

CSS – per lo stile visivo, le animazioni, i righelli, i moduli e il layout su griglia.

JavaScript – per gestire le interazioni:
- animazione della landing page
- cambio modalità del cursore
- creazione dinamica dei righelli
- navigazione tra sezioni usando la Scroll API
- tracciamento del mouse e aggiornamento coordinate tramite DOM API
- disegno e animazione di una curva tramite Canvas API


```JavaScript
// Al click su "entra", la landing si ritrae e attiva l'interfaccia principale
entraBtn.addEventListener("click", () => {
  landingPage.classList.add('shrink-landing');
  setTimeout(() => {
    righelloCorner.style.display = 'block';
  }, 1000);
});


// Crea righelli orizzontali e verticali con tacche e numeri
function generaRighelli() {
  const righelloTop = document.getElementById("righello-top");
  const righelloLeft = document.getElementById("righello-left");
  righelloTop.innerHTML = '';
  righelloLeft.innerHTML = '';

  const pageWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
  const taccheOrizz = Math.ceil((pageWidth + 30) / 10);

  for (let i = 0; i <= taccheOrizz * 10; i += 10) {
    const div = document.createElement("div");
    div.className = "tacca";
    if (i === 0 || i % 100 === 0) {
      div.classList.add("grande");
      div.setAttribute("data-num", i);
    } else if (i % 50 === 0) {
      div.classList.add("media");
    }
    righelloTop.appendChild(div);
  }

  // Verticale simile (con etichette ruotate)
}


// Cambia il comportamento del cursore
function setCursorDrag() {
  removeSelected();
  dragBtn.classList.add("selected");
  document.body.style.cursor = "move";
  crosshairH.style.display = "none";
  crosshairV.style.display = "none";
  addDragEvents();    // attiva il trascinamento
  disableScroll();    // disattiva lo scroll
}


// Quando si clicca su una feature, si apre un box con spiegazione
window.handleFeatureClick = function(element) {
  const featureId = element.dataset.feature;

  if (element.classList.contains('active')) {
    element.classList.remove('active');
    if (currentBox) currentBox.remove();
    currentBox = null;
    return;
  }

  document.querySelectorAll('.feature-box').forEach(box => box.classList.remove('active'));
  if (currentBox) currentBox.remove();

  element.classList.add('active');

  if (featureContent[featureId]) {
    createFeatureBox(featureContent[featureId].title, featureContent[featureId].content);
  }
}
```


## Target e contesto d’uso
Il sito è pensato per studenti, appassionati di tipografia e persone curiose di capire meglio come funziona un font .ttf, anche senza una formazione tecnica. Può essere usato in contesti didattici, workshop o come progetto divulgativo per spiegare in modo visivo e interattivo il funzionamento dei font TrueType.


## Media di progetto
<img src="img/landing.png" width="500" alt="Schermata iniziale" />

<img src="img/stuttura.png" width="500" alt="Struttura modulare con righelli e sezioni" />


## Interazione live nel canvas
<img src="img/curva_bezier.png" width="500" alt="Interazione con la curva di Bézier" />