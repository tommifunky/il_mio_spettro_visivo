SUPSI 2025  
Corso d’Interaction Design, CV428.01  
Docenti: A. Gysin, G. Profeta  

Elaborato 1: Il mio spettro visivo

# Il mio spettro visivo  
Autore: Tommaso Stanga  
[Il mio spettro visivo](https://tommifunky.github.io/il_mio_spettro_visivo/)  
[Il mio spettro visivo - DEBUG [html standalone]](https://tommifunky.github.io/elaborato1_html_esteso/)


## Introduzione e tema  
*Il mio spettro visivo* è un’interfaccia web interattiva che esplora la mia memoria fotografica personale attraverso lo spettro dei colori. L’archivio è composto da **1001 immagini** scattate con iPhone tra il 2011 e il 2025. Ogni immagine è stata analizzata tramite tecniche di computer vision per estrarre il **colore medio** e i **contenuti visivi rilevati automaticamente**.

Le immagini sono poi distribuite in uno spazio tridimensionale secondo due modalità:  
- **CUBO RGB** – basato su coordinate cartesiane e logica additiva del colore  
- **CILINDRO HSB** – basato su logica percettiva: tonalità, saturazione e luminosità

Con un sistema AI (YOLO), le immagini sono state scomposte in **2777 entità visive**, corrispondenti a oggetti rilevati come *persona*, *gatto*, *automobile*, *cane* ecc. Il sito permette di esplorare questo spazio filtrando e navigando in modo visivo il mio archivio personale.

## Riferimenti progettuali  
Il progetto si ispira a:

1. **L’archiviazione algoritmica dei ricordi** – la macchina interpreta e riordina i miei ricordi in base a regole matematiche

2. **La visualizzazione di dati personali** – come mezzo per leggere e raccontare la propria identità

3. **Estetiche da terminale e prompt** – per rendere l’ingresso al sito narrativo, tecnico e retro-futuristico

4. **Modelli di spazio colore (RGB e HSB)** – non solo come teoria visiva, ma come strutture per disporre le immagini in 3D

5. **Progetti di data art e archivi generativi**, dove il codice diventa strumento per creare mappe visive emotive

Non ho seguito un sistema grafico convenzionale. Ho costruito l’esperienza visiva a partire dai **dati stessi**, lasciando che le informazioni (colore, oggetto, tempo) determinassero la forma.

## Design dell’interfaccia e modalità di interazione  
L’esperienza inizia con una **landing page in stile terminale**: l’utente digita `cubo` o `cilindro` per entrare nella rispettiva visualizzazione.

Una volta all’interno:
- Si esplora lo spazio 3D (WebGL) con mouse e touch
- Si può **passare da RGB a HSB** cliccando sul pulsante o digitando di nuovo
- Si possono **filtrare le immagini** per classe di oggetto rilevato (es. "dog", "person", "car")
- È possibile **tornare alla homepage** e cambiare vista
- I comandi digitati attivano animazioni testuali e transizioni progressive

Ogni immagine viene renderizzata in tempo reale da una **texture atlas** e posizionata in base ai suoi dati cromatici.

## Tecnologia usata  
Il progetto utilizza:

**HTML** – struttura del sito, interfaccia testuale e navigazione

**CSS** – estetica da terminale, griglie, pulsanti interattivi e animazioni

**JavaScript** – per:
- gestire l’interfaccia testuale e le animazioni
- filtrare immagini in base alla classe
- costruire i comandi personalizzati da terminale
- switchare dinamicamente tra le due visualizzazioni

**p5.js (WebGL)** – per:
- visualizzare le immagini in uno spazio 3D
- costruire dinamicamente cubo e cilindro
- mappare le immagini usando le coordinate ottenute

**YOLO + dataset JSON** – per:
- classificare 2777 oggetti da 1001 immagini
- generare il dataset `data_yolo_semplificato.json` e `data_colors_1.json`

**Atlas Canvas Rendering** – per:
- mappare tutte le immagini da un’unica texture in modo ottimizzato

```javascript
// Caricamento dati da JSON e texture atlas
function preload() {
  atlas = loadImage(ATLAS_PATH);
  atlasData = loadJSON(ATLAS_JSON);
  colorData = loadJSON(COLORS_JSON);
  yoloData = loadJSON('dataset/data_yolo_semplificato.json');
}

// Creazione oggetti immagine dal dataset
Object.keys(atlasData).forEach(key => {
  const item = atlasData[key];
  const colorHex = colorMap[item.FileName.toLowerCase()];
  if (!colorHex) return;

  const u1 = item.x / atlas.width;
  const v1 = item.y / atlas.height;
  const u2 = (item.x + item.width) / atlas.width;
  const v2 = (item.y + item.height) / atlas.height;

  immagini.push(new Immagine(
    item.FileName, item.width / 8, item.height / 8, 
    u1, v1, u2, v2, 0, 0, 0
  ));
});

// Rendering immagini 3D nello spazio WebGL
function draw() {
  background(0);
  orbitControl();
  ambientLight(255);

  // Rendering immagini come QUAD texture-mappati
  noStroke();
  beginShape(QUADS);
  texture(atlas);
  visibleImages.forEach(img => img.emettiVertici());
  endShape();
}

// Classe oggetto Immagine con gestione vertici e UV
class Immagine {
  constructor(nome, w, h, u1, v1, u2, v2, x, y, z) {
    this.nome = nome;
    this.w = w;
    this.h = h;
    this.u1 = u1;
    this.v1 = v1;
    this.u2 = u2;
    this.v2 = v2;
    this.pos = createVector(x, y, z);
  }

  emettiVertici() {
    const mv = this.getModelViewMatrix();
    const right = createVector(mv[0][0], mv[1][0], mv[2][0]);
    const up = createVector(mv[0][1], mv[1][1], mv[2][1]);
    const w2 = this.w / 2;
    const h2 = this.h / 2;
    
    const v1 = p5.Vector.add(this.pos, p5.Vector.add(p5.Vector.mult(right, -w2), p5.Vector.mult(up, -h2)));
    const v2 = p5.Vector.add(this.pos, p5.Vector.add(p5.Vector.mult(right,  w2), p5.Vector.mult(up, -h2)));
    const v3 = p5.Vector.add(this.pos, p5.Vector.add(p5.Vector.mult(right,  w2), p5.Vector.mult(up,  h2)));
    const v4 = p5.Vector.add(this.pos, p5.Vector.add(p5.Vector.mult(right, -w2), p5.Vector.mult(up,  h2)));
    
    vertex(v1.x, v1.y, v1.z, this.u1, this.v1);
    vertex(v2.x, v2.y, v2.z, this.u2, this.v1);
    vertex(v3.x, v3.y, v3.z, this.u2, this.v2);
    vertex(v4.x, v4.y, v4.z, this.u1, this.v2);
  }

  getModelViewMatrix() {
    const mv = _renderer.uMVMatrix.mat4;
    return [
      [mv[0], mv[1], mv[2], mv[3]],
      [mv[4], mv[5], mv[6], mv[7]],
      [mv[8], mv[9], mv[10], mv[11]],
      [mv[12], mv[13], mv[14], mv[15]]
    ];
  }
}

// Posizionamento immagine nello spazio RGB
let x = map(r, 0, 255, -cubeSize/2, cubeSize/2);
let y = map(b, 0, 255, cubeSize/2, -cubeSize/2);
let z = map(g, 0, 255, -cubeSize/2, cubeSize/2);
img.pos.set(x, y, z);

// Posizionamento immagine nello spazio HSB
let angle = radians(h);
let radius = map(s, 0, 100, 0, radiusMax);
let y = map(br, 0, 100, cubeSize/2, -cubeSize/2);
let x = cos(angle) * radius;
let z = sin(angle) * radius;
img.pos.set(x, y, z);
```

## Target e contesto d’uso  
Il sito è pensato per chi è interessato a:
- esplorare l’archivio personale da una nuova prospettiva
- sperimentare con visualizzazioni generate da dati reali
- interrogarsi su cosa “vede” un algoritmo nelle nostre foto

Può essere usato in contesti accademici, di **data visualization artistica**, mostre, oppure come riflessione personale sul tema memoria + AI.

## Media di progetto  
<img src="img/landing_page.png" width="800" alt="Pagina di avvio" />

<img src="img/cube_page.png" width="800" alt="Pagina cubo RGB" />

<img src="img/cylinder_page.png" width="800" alt="Pagina cilindro HSB" />

<img src="img/filter_and_image_box.png" width="800" alt="Filtro e immagine attivi" />