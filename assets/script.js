document.addEventListener('DOMContentLoaded', () => {
  const filtersContainer = document.querySelector('.filters-container');
  filtersContainer.addEventListener('wheel', (e) => {
    e.stopPropagation();
  });
});

let atlasOriginali, atlasOriginaliData;
let atlas, atlasData, colorData;
let immagini = [];
let visibleImages = [];
let colorMap = {};
let modalita = 'rgb';
let deviceName = 'dispositivo';
let filtroAttivo = null;
let showAxisGuides = false;
let arrowLength = 150;

const ATLAS_PATH = 'dataset/atlas.jpg';
const ATLAS_JSON = 'dataset/atlas.json';
const COLORS_JSON = 'dataset/data_colors_1.json';

// Aggiungi questo all'inizio del file, dopo le variabili globali
document.addEventListener('DOMContentLoaded', () => {
  const axisGuideButton = document.getElementById('axis-guide-button');
  if (axisGuideButton) {
    axisGuideButton.addEventListener('click', () => {
      showAxisGuides = !showAxisGuides;
      axisGuideButton.innerHTML = showAxisGuides ? '[nascondi guide]' : '[mostra guide]';
    });
  }
});

function preload() {
  atlas = loadImage(ATLAS_PATH);
  atlasData = loadJSON(ATLAS_JSON);
  colorData = loadJSON(COLORS_JSON);
  atlasOriginali = loadImage('dataset/atlas_originali.jpg');
  atlasOriginaliData = loadJSON('dataset/atlas_originali.json');
  yoloData = loadJSON('dataset/data_yolo_semplificato.json');
}

function getUniqueClasses() {
  let classCount = {};
  Object.values(atlasData).forEach(item => {
    if (item.class) {
      classCount[item.class] = (classCount[item.class] || 0) + 1;
    }
  });
  
  const sortedClasses = Object.entries(classCount)
    .sort((a, b) => b[1] - a[1])
    .map(([className, count]) => `<span style="cursor: pointer">${className} [${count}]</span>`)
    .join('\n');
  
  return sortedClasses + '\n';
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textureMode(NORMAL);
  noStroke();

  camera(0, 0, 1050);
  
  const colorArray = Array.isArray(colorData) ? colorData : Object.values(colorData);
  colorArray.forEach(d => {
    if (d.Colors && d.Colors[0]) {
      colorMap[d.FileName.toLowerCase()] = d.Colors[0];
    }
  });

  Object.keys(atlasData).forEach(key => {
    const item = atlasData[key];
    const filename = item.FileName.toLowerCase();
    const colorHex = colorMap[filename];
    if (!colorHex) return;

    const u1 = item.x / atlas.width;
    const v1 = item.y / atlas.height;
    const u2 = (item.x + item.width) / atlas.width;
    const v2 = (item.y + item.height) / atlas.height;

    immagini.push(new Immagine(item.FileName, item.width / 8, item.height / 8, u1, v1, u2, v2, 0, 0, 0));
  });

  visibleImages = immagini;
  aggiornaPosizioniImmagini();
  document.getElementById('loading').style.display = 'none';
}

function aggiornaPosizioniImmagini() {
  const cubeSize = 450;
  const radiusMax = cubeSize / 2 + 45;
  colorMode(RGB);

  let occupiedPositions = [];
  const minDistance = 10;

  visibleImages.forEach(img => {
    const col = color(colorMap[img.nome.toLowerCase()]);
    const r = red(col);
    const g = green(col);
    const b = blue(col);

    let position;
    if (modalita === 'rgb') {
      let x = map(r, 0, 255, -cubeSize/2, cubeSize/2);
      let y = map(b, 0, 255, cubeSize/2, -cubeSize/2);
      let z = map(g, 0, 255, -cubeSize/2, cubeSize/2);

      while (isPositionOccupied(x, y, z, occupiedPositions, minDistance)) {
        x += random(-minDistance, minDistance);
        y += random(-minDistance, minDistance);
        z += random(-minDistance, minDistance);
      }
      position = createVector(x, y, z);
    } else {
      colorMode(HSB, 360, 100, 100);
      const hsb = color(col);
      const h = hue(hsb);
      const s = saturation(hsb);
      const br = brightness(hsb);

      let angle = radians(h);
      let radius = map(s, 0, 100, 0, radiusMax);
      let y = map(br, 0, 100, cubeSize/2, -cubeSize/2);

      while (true) {
        let x = cos(angle) * radius;
        let z = sin(angle) * radius;
        
        if (!isPositionOccupied(x, y, z, occupiedPositions, minDistance)) {
          position = createVector(x, y, z);
          break;
        }
        
        angle += random(-0.1, 0.1);
        radius += random(-minDistance/2, minDistance/2);
        y += random(-minDistance/2, minDistance/2);
      }
      colorMode(RGB);
    }

    occupiedPositions.push(position);
    img.pos.set(position.x, position.y, position.z);
  });
}

function isPositionOccupied(x, y, z, positions, minDistance) {
  return positions.some(pos => {
    const d = dist(x, y, z, pos.x, pos.y, pos.z);
    return d < minDistance;
  });
}

function draw() {
  background(0);
  orbitControl();
  ambientLight(255);

  if (modalita === 'rgb') {
    push();
    stroke(255);
    strokeWeight(0.1);
    noFill();
    const s = 500;
    const h = s / 2;
    
    beginShape(LINES);
    vertex(-h, -h, -h); vertex(h, -h, -h);
    vertex(h, -h, -h); vertex(h, h, -h);
    vertex(h, h, -h); vertex(-h, h, -h);
    vertex(-h, h, -h); vertex(-h, -h, -h);
    vertex(-h, -h, -h); vertex(-h, -h, h);
    vertex(h, -h, -h); vertex(h, -h, h);
    vertex(h, h, -h); vertex(h, h, h);
    vertex(-h, h, -h); vertex(-h, h, h);
    vertex(-h, -h, h); vertex(h, -h, h);
    vertex(h, -h, h); vertex(h, h, h);
    vertex(h, h, h); vertex(-h, h, h);
    vertex(-h, h, h); vertex(-h, -h, h);
    endShape();

    stroke(255, 60);
    strokeWeight(0.5);
    const divisions = 8;
    const step = s / divisions;

    for (let i = -h; i <= h; i += step) {
      line(-h, i, -h, h, i, -h);
      line(i, -h, -h, i, h, -h);
      line(-h, i, h, h, i, h);
      line(i, -h, h, i, h, h);
      line(-h, -h, i, -h, h, i);
      line(-h, i, -h, -h, i, h);
      line(h, -h, i, h, h, i);
      line(h, i, -h, h, i, h);
      line(-h, -h, i, h, -h, i);
      line(i, -h, -h, i, -h, h);
      line(-h, h, i, h, h, i);
      line(i, h, -h, i, h, h);
    }
    pop();
  } else {
    push();
    const s = 500;
    const h = s / 2;
    
    const verticalDivisions = 8;
    const stepY = (2 * h) / verticalDivisions;
    const arcLength = stepY;
    const stepAngle = arcLength / h;
    const horizontalDivisions = Math.floor(TWO_PI / stepAngle);
    const detail = horizontalDivisions;

    stroke(255);
    strokeWeight(0.2);
    noFill();

    for (let y = -h; y <= h; y += h * 2) {
      beginShape();
      for (let i = 0; i <= detail; i++) {
        const angle = stepAngle * i;
        const x = cos(angle) * h;
        const z = sin(angle) * h;
        vertex(x, y, z);
      }
      endShape(CLOSE);
    }

    for (let i = 0; i < detail; i++) {
      const angle = stepAngle * i;
      const x = cos(angle) * h;
      const z = sin(angle) * h;
      line(x, -h, z, x, h, z);
    }

    stroke(255, 60);
    strokeWeight(0.5);

    for (let y = -h + stepY; y < h; y += stepY) {
      beginShape();
      for (let i = 0; i <= detail; i++) {
        const angle = stepAngle * i;
        const x = cos(angle) * h;
        const z = sin(angle) * h;
        vertex(x, y, z);
      }
      endShape(CLOSE);
    }

    for (let angle = 0; angle < TWO_PI; angle += stepAngle) {
      const x1 = cos(angle) * h;
      const z1 = sin(angle) * h;
      line(x1, -h, z1, x1, h, z1);
    }

    pop();
  }

  noStroke();
  beginShape(QUADS);
  texture(atlas);
  visibleImages.forEach(img => img.emettiVertici());
  endShape();
  drawAxisGuides();
}

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
    
    const v1 = p5.Vector.add(
      this.pos,
      p5.Vector.add(
        p5.Vector.mult(right, -w2),
        p5.Vector.mult(up, -h2)
      )
    );
    
    const v2 = p5.Vector.add(
      this.pos,
      p5.Vector.add(
        p5.Vector.mult(right, w2),
        p5.Vector.mult(up, -h2)
      )
    );
    
    const v3 = p5.Vector.add(
      this.pos,
      p5.Vector.add(
        p5.Vector.mult(right, w2),
        p5.Vector.mult(up, h2)
      )
    );
    
    const v4 = p5.Vector.add(
      this.pos,
      p5.Vector.add(
        p5.Vector.mult(right, -w2),
        p5.Vector.mult(up, h2)
      )
    );
    
    vertex(v1.x, v1.y, v1.z, this.u1, this.v1);
    vertex(v2.x, v2.y, v2.z, this.u2, this.v1);
    vertex(v3.x, v3.y, v3.z, this.u2, this.v2);
    vertex(v4.x, v4.y, v4.z, this.u1, this.v2);
  }
  
  getModelViewMatrix() {
    const glRenderer = _renderer;
    const mv = glRenderer.uMVMatrix.mat4;
    const matrix = [
      [mv[0], mv[1], mv[2], mv[3]],
      [mv[4], mv[5], mv[6], mv[7]],
      [mv[8], mv[9], mv[10], mv[11]],
      [mv[12], mv[13], mv[14], mv[15]]
    ];
    return matrix;
  }
}

function isPointInImage(x, y, img) {
  let mouseVector = createVector(
    (mouseX - width/2) / (width/2) * 900,
    (mouseY - height/2) / (height/2) * 900,
    0
  );

  const mv = img.getModelViewMatrix();
  const right = createVector(mv[0][0], mv[1][0], mv[2][0]);
  const up = createVector(mv[0][1], mv[1][1], mv[2][1]);
  const w2 = img.w / 2;
  const h2 = img.h / 2;
  
  const corners = [
    p5.Vector.add(img.pos, p5.Vector.add(p5.Vector.mult(right, -w2), p5.Vector.mult(up, -h2))),
    p5.Vector.add(img.pos, p5.Vector.add(p5.Vector.mult(right, w2), p5.Vector.mult(up, -h2))),
    p5.Vector.add(img.pos, p5.Vector.add(p5.Vector.mult(right, w2), p5.Vector.mult(up, h2))),
    p5.Vector.add(img.pos, p5.Vector.add(p5.Vector.mult(right, -w2), p5.Vector.mult(up, h2)))
  ];

  return isPointInQuad(mouseVector.x, mouseVector.y, 
    corners[0].x, corners[0].y,
    corners[1].x, corners[1].y,
    corners[2].x, corners[2].y,
    corners[3].x, corners[3].y);
}

function isPointInQuad(px, py, x1, y1, x2, y2, x3, y3, x4, y4) {
  function sign(x1, y1, x2, y2, x3, y3) {
    return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  }
  
  let d1 = sign(px, py, x1, y1, x2, y2);
  let d2 = sign(px, py, x2, y2, x3, y3);
  let d3 = sign(px, py, x3, y3, x4, y4);
  let d4 = sign(px, py, x4, y4, x1, y1);

  let hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0) || (d4 < 0);
  let hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0) || (d4 > 0);

  return !(hasNeg && hasPos);
}

function mousePressed() {
  const landingPage = document.getElementById('landing-page');
  if (landingPage.classList.contains('hidden')) {
    const ray = getRayFromMouse();
    let closestT = Infinity;
    let selectedImg = null;

    for (let img of visibleImages) {
      const t = rayIntersectsImage(ray.origin, ray.direction, img);
      if (t !== null && t < closestT) {
        closestT = t;
        selectedImg = img;
      }
    }

    if (selectedImg) {
      showModal(selectedImg.nome);
    }
  }
}

function showModal(filename) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  const switchBtn = document.getElementById('modalSwitch');
  const closeBtn = document.getElementById('modalClose');
  
  const imgData = Object.values(atlasData).find(item => item.FileName === filename);
  if (!imgData) return;

  let tempCanvas = document.createElement('canvas');
  tempCanvas.width = imgData.width;
  tempCanvas.height = imgData.height;
  let ctx = tempCanvas.getContext('2d');
  
  ctx.drawImage(atlas.canvas, 
    imgData.x, imgData.y, 
    imgData.width, imgData.height,
    0, 0, 
    imgData.width, imgData.height
  );
  
  modalImg.dataset.currentFilename = filename;
  modalImg.dataset.isOriginal = 'false';
  modalImg.src = tempCanvas.toDataURL();
  modal.style.display = 'block';

  switchBtn.onclick = function(e) {
    e.stopPropagation();
    
    if (modalImg.dataset.isOriginal === 'false') {
      const currentFilename = modalImg.dataset.currentFilename;
      const imgData = Object.values(atlasData).find(item => item.FileName === currentFilename);
      
      if (!imgData || !imgData.SourceFile) {
        console.error("SourceFile non trovato in atlasData");
        return;
      }

      const originalImgData = Object.values(atlasOriginaliData).find(item => 
        item.FileName === imgData.SourceFile
      );
      
      if (!originalImgData) {
        console.error("Immagine originale non trovata in atlasOriginaliData");
        return;
      }

      let originalCanvas = document.createElement('canvas');
      originalCanvas.width = originalImgData.width;
      originalCanvas.height = originalImgData.height;
      let ctx = originalCanvas.getContext('2d');
      
      ctx.drawImage(atlasOriginali.canvas, 
        originalImgData.x, originalImgData.y,
        originalImgData.width, originalImgData.height,
        0, 0,
        originalImgData.width, originalImgData.height
      );
      
      modalImg.src = originalCanvas.toDataURL();
      modalImg.dataset.isOriginal = 'true';
      switchBtn.textContent = '[ritaglio]';
    } else {
      const currentFilename = modalImg.dataset.currentFilename;
      const imgData = Object.values(atlasData).find(item => item.FileName === currentFilename);
      
      let tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgData.width;
      tempCanvas.height = imgData.height;
      let ctx = tempCanvas.getContext('2d');
      
      ctx.drawImage(atlas.canvas, 
        imgData.x, imgData.y, 
        imgData.width, imgData.height,
        0, 0, 
        imgData.width, imgData.height
      );
      
      modalImg.src = tempCanvas.toDataURL();
      modalImg.dataset.isOriginal = 'false';
      switchBtn.textContent = '[originale]';
    }
  };

  closeBtn.onclick = function(e) {
    e.stopPropagation();
    modal.style.display = 'none';
  };

  modal.onclick = function(e) {
    e.stopPropagation();
  };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

document.getElementById('toggleMode').addEventListener('click', () => {
  modalita = modalita === 'rgb' ? 'hsb' : 'rgb';
  aggiornaPosizioniImmagini();
});

document.getElementById('rgbButton').addEventListener('click', () => {
  const terminalText = document.querySelector('.terminal-text');
  const currentText = terminalText.innerHTML;
  terminalText.innerHTML = currentText + 'cubo\ncreazione spazio colore\n';
  
  let progress = 0;
  const loadingInterval = setInterval(() => {
    progress += 2;
    const barLength = 30;
    const filled = Math.floor((progress * barLength) / 100);
    const empty = barLength - filled;
    const progressBar = '<span class="loading-bar">[' + '█'.repeat(filled) + ' '.repeat(empty) + ']</span>';
    
    terminalText.innerHTML = currentText + 'cubo\ncreazione spazio colore\n' + progressBar + ` ${progress}%`;
    
    if (progress >= 100) {
      clearInterval(loadingInterval);
      terminalText.innerHTML = currentText + 'cubo\ncreazione spazio colore\n' + 
        '<span class="loading-bar">[████████████████████████████████] 100%</span>\n' +
        'transizione completata.\npassaggio alla visualizzazione rgb\n';
      
      setTimeout(() => {
        modalita = 'rgb';
        animateAndTransition();
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('toggleMode').style.display = 'block';
        aggiornaPosizioniImmagini();
      }, 500);
    }
  }, 30);
});

document.getElementById('hsbButton').addEventListener('click', () => {
  const terminalText = document.querySelector('.terminal-text');
  const currentText = terminalText.innerHTML;
  terminalText.innerHTML = currentText + 'cilindro\ncreazione spazio colore\n';
  
  let progress = 0;
  const loadingInterval = setInterval(() => {
    progress += 2;
    const barLength = 30;
    const filled = Math.floor((progress * barLength) / 100);
    const empty = barLength - filled;
    const progressBar = '<span class="loading-bar">[' + '█'.repeat(filled) + ' '.repeat(empty) + ']</span>';
    
    terminalText.innerHTML = currentText + 'cilindro\ncreazione spazio colore\n' + progressBar + ` ${progress}%`;
    
    if (progress >= 100) {
      clearInterval(loadingInterval);
      terminalText.innerHTML = currentText + 'cilindro\ncreazione spazio colore\n' + 
        '<span class="loading-bar">[████████████████████████████████] 100%</span>\n' +
        'transizione completata.\npassaggio alla visualizzazione hsb\n';
      
      setTimeout(() => {
        modalita = 'hsb';
        animateAndTransition();
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('toggleMode').style.display = 'block';
        aggiornaPosizioniImmagini();
      }, 500);
    }
  }, 30);
});

function animateAndTransition() {
  document.getElementById('landing-page').classList.add('hidden');
  document.getElementById('toggleMode').style.display = 'block';
  
  const explanationContainer = document.getElementById('explanation-container');
  const filtersContainer = document.getElementById('filters-container');
  const homepageButton = document.getElementById('homepage-button');
  const viewSwitchButton = document.getElementById('view-switch-button');
  
  explanationContainer.innerHTML = '';
  filtersContainer.innerHTML = '';
  homepageButton.innerHTML = '';
  viewSwitchButton.innerHTML = '';
  
  explanationContainer.classList.remove('visible');
  filtersContainer.classList.remove('visible');
  homepageButton.classList.remove('visible');
  viewSwitchButton.classList.remove('visible');

  let i = 0;
  let j = 0;
  let h = 0;
  let v = 0;
  let a = 0;
  let isSkipping = false;

  const deviceName = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'iphone' : 
                    /Android/i.test(navigator.userAgent) ? 'android' :
                    /Mac/i.test(navigator.userAgent) ? 'macbook' :
                    /Windows/i.test(navigator.userAgent) ? 'windows' : 'dispositivo';
  
  const uniqueClasses = getUniqueClasses();

  let explanation = modalita === 'rgb' ? 
    `archivio visivo composto da 2777 entità,
disposte nello spazio colore rgb.

- asse x = rosso (r)
- asse y = verde (g)
- asse z = blu (b)

ogni entità è posizionata in base
al suo colore medio (rgb).
` :
    `archivio visivo composto da 2777 entità,
disposte nello spazio colore hsb.

- angolo = tonalità (h)
- raggio = saturazione (s)
- altezza = luminosità (b)

ogni entità è posizionata in base
al suo colore medio (hsb).`;

  let filters = `[entità trovate]\n\n<span style="color: #666666">${uniqueClasses}</span>`;

  const homepageText = '[homepage]';
  const viewSwitchText = '[cambia visualizzazione]';
  const axisGuideText = '[mostra guide]';
  
  const homepageChars = homepageText.split('');
  const viewSwitchChars = viewSwitchText.split('');
  const axisGuideChars = axisGuideText.split('');
  const explanationChars = explanation.split('');
  const filtersChars = filters.split('');

  homepageButton.addEventListener('click', () => {
    location.reload();
  });

  viewSwitchButton.addEventListener('click', (e) => {
    e.stopPropagation();
    filtroAttivo = null;
    visibleImages = [...immagini];
    
    const oldExplanationContainer = explanationContainer.cloneNode(false);
    const oldFiltersContainer = filtersContainer.cloneNode(false);
    const oldHomepageButton = homepageButton.cloneNode(false);
    const oldViewSwitchButton = viewSwitchButton.cloneNode(false);
    const oldAxisGuideButton = document.getElementById('axis-guide-button').cloneNode(false);
    
    explanationContainer.parentNode.replaceChild(oldExplanationContainer, explanationContainer);
    filtersContainer.parentNode.replaceChild(oldFiltersContainer, filtersContainer);
    homepageButton.parentNode.replaceChild(oldHomepageButton, homepageButton);
    viewSwitchButton.parentNode.replaceChild(oldViewSwitchButton, viewSwitchButton);
    document.getElementById('axis-guide-button').parentNode.replaceChild(oldAxisGuideButton, document.getElementById('axis-guide-button'));
    
    oldExplanationContainer.innerHTML = '';
    oldFiltersContainer.innerHTML = '';
    oldHomepageButton.innerHTML = '';
    oldViewSwitchButton.innerHTML = '';
    oldAxisGuideButton.innerHTML = '';
    
    oldExplanationContainer.classList.remove('visible');
    oldFiltersContainer.classList.remove('visible');
    oldHomepageButton.classList.remove('visible');
    oldViewSwitchButton.classList.remove('visible');
    oldAxisGuideButton.classList.remove('visible');
    
    showAxisGuides = false;
    
    i = 0;
    j = 0;
    h = 0;
    v = 0;
    a = 0;
    isSkipping = false;
    
    modalita = modalita === 'rgb' ? 'hsb' : 'rgb';
    
    setTimeout(() => {
      animateAndTransition();
      aggiornaPosizioniImmagini();
    }, 100);
  });

  const skipAnimation = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.type === 'click') {
      e.preventDefault();
      isSkipping = true;
      
      homepageButton.innerHTML = homepageText;
      homepageButton.classList.add('visible');
      viewSwitchButton.innerHTML = viewSwitchText;
      viewSwitchButton.classList.add('visible');
      const axisGuideButton = document.getElementById('axis-guide-button');
      axisGuideButton.innerHTML = axisGuideText;
      axisGuideButton.classList.add('visible');
      explanationContainer.innerHTML = explanation;
      filtersContainer.innerHTML = filters;
      
      explanationContainer.classList.add('visible');
      filtersContainer.classList.add('visible');
    }
  };

  document.addEventListener('keydown', skipAnimation);
  document.addEventListener('click', skipAnimation);

  function typeHomepage() {
    if (isSkipping) return;
    
    if (h < homepageChars.length) {
      homepageButton.style.opacity = '1';
      homepageButton.innerHTML = homepageButton.innerHTML.replace('█', '');
      
      if (homepageChars[h] === ' ') {
        homepageButton.innerHTML += '&nbsp;';
      } else {
        homepageButton.innerHTML += homepageChars[h];
      }
      
      if (h < homepageChars.length - 1) {
        homepageButton.innerHTML += '█';
      }
      h++;
      setTimeout(typeHomepage, 10);
    } else {
      homepageButton.innerHTML = homepageButton.innerHTML.replace('█', '');
      homepageButton.classList.add('visible');
    }
  }

  function typeViewSwitch() {
    if (isSkipping) return;
    
    if (v < viewSwitchChars.length) {
      viewSwitchButton.style.opacity = '1';
      viewSwitchButton.innerHTML = viewSwitchButton.innerHTML.replace('█', '');
      
      if (viewSwitchChars[v] === ' ') {
        viewSwitchButton.innerHTML += '&nbsp;';
      } else {
        viewSwitchButton.innerHTML += viewSwitchChars[v];
      }
      
      if (v < viewSwitchChars.length - 1) {
        viewSwitchButton.innerHTML += '█';
      }
      v++;
      setTimeout(typeViewSwitch, 10);
    } else {
      viewSwitchButton.innerHTML = viewSwitchButton.innerHTML.replace('█', '');
      viewSwitchButton.classList.add('visible');
    }
  }

  function typeAxisGuide() {
    if (isSkipping) return;
    
    if (a < axisGuideChars.length) {
      const axisGuideButton = document.getElementById('axis-guide-button');
      axisGuideButton.style.opacity = '1';
      axisGuideButton.innerHTML = axisGuideButton.innerHTML.replace('█', '');
      
      if (axisGuideChars[a] === ' ') {
        axisGuideButton.innerHTML += '&nbsp;';
      } else {
        axisGuideButton.innerHTML += axisGuideChars[a];
      }
      
      if (a < axisGuideChars.length - 1) {
        axisGuideButton.innerHTML += '█';
      }
      a++;
      setTimeout(typeAxisGuide, 10);
    } else {
      const axisGuideButton = document.getElementById('axis-guide-button');
      axisGuideButton.innerHTML = axisGuideButton.innerHTML.replace('█', '');
      axisGuideButton.classList.add('visible');

      axisGuideButton.addEventListener('click', () => {
        showAxisGuides = !showAxisGuides;
        axisGuideButton.innerHTML = showAxisGuides ? '[nascondi guide]' : '[mostra guide]';
      });
    }
}

  function typeExplanation() {
    if (isSkipping) return;
    if (i < explanationChars.length) {
      explanationContainer.innerHTML = explanationContainer.innerHTML.replace('█', '');
      
      if (explanationChars[i] === '\n') {
        explanationContainer.innerHTML += '<br>';
      } else {
        explanationContainer.innerHTML += explanationChars[i];
      }
      if (i < explanationChars.length - 1) {
        explanationContainer.innerHTML += '█';
      }
      i++;
      setTimeout(typeExplanation, 10);
    } else {
      explanationContainer.innerHTML = explanationContainer.innerHTML.replace('█', '');
      explanationContainer.classList.add('visible');
    }
  }

  function typeFilters() {
    if (isSkipping) return;
    if (j < filtersChars.length) {
      filtersContainer.innerHTML = filtersContainer.innerHTML.replace('█', '');
      
      if (filtersChars[j] === '<') {
        let tagContent = '<';
        let k = j + 1;
        while (k < filtersChars.length && filtersChars[k] !== '>') {
          tagContent += filtersChars[k];
          k++;
        }
        tagContent += '>';
        
        if (tagContent.includes('span')) {
          filtersContainer.innerHTML += tagContent;
        } else {
          filtersContainer.innerHTML += filtersChars[j];
        }
        j = k + 1;
      } else if (filtersChars[j] === '\n') {
        filtersContainer.innerHTML += '<br>';
        j++;
      } else {
        const lastSpan = filtersContainer.querySelector('span:last-child');
        if (lastSpan) {
          lastSpan.textContent += filtersChars[j];
        } else {
          filtersContainer.innerHTML += filtersChars[j];
        }
        j++;
      }
      
      if (j < filtersChars.length - 1) {
        filtersContainer.innerHTML += '█';
      }
      setTimeout(typeFilters, 10);
    } else {
      filtersContainer.innerHTML = filtersContainer.innerHTML.replace('█', '');
      filtersContainer.classList.add('visible');
    }
  }

  setTimeout(() => {
    typeHomepage();
    setTimeout(() => {
      typeViewSwitch();
      setTimeout(() => {
        typeAxisGuide();
        setTimeout(() => {
          explanationContainer.style.opacity = '1';
          filtersContainer.style.opacity = '1';
          typeExplanation();
          typeFilters();
        }, axisGuideChars.length * 10 + 200);
      }, viewSwitchChars.length * 10 + 200);
    }, homepageChars.length * 10 + 200);
  }, 500);

  setupFilterClickHandlers();
  aggiornaPosizioniImmagini();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('toggleMode').style.display = 'none';
  
  const terminalText = document.querySelector('.terminal-text');
  const terminal = document.querySelector('.content');
  
  let originalText = '';
  let isTypingComplete = false;
  let currentInput = '';

  function typeWriter() {
    const text = terminalText.innerHTML;
    terminalText.innerHTML = '';
    terminalText.style.opacity = '1';
    document.querySelector('.visualization-buttons').classList.add('visible');
    
    let i = 0;
    const characters = text.split('');
    const totalChars = characters.length;
    let vertexProgress = 0;
    let isSkipping = false;

    const skipAnimation = (e) => {
      if ((e.key === 'Enter' || e.key === ' ' || e.type === 'click') && !isTypingComplete) {
        e.preventDefault();
        isSkipping = true;
        i = totalChars - 1;
        terminalText.innerHTML = text;
      }
    };

    document.addEventListener('keydown', skipAnimation);
    document.addEventListener('click', skipAnimation);
  
    cubePreviewSketch = new p5((p) => {
      p.setup = function() {
        let size = Math.min(p.windowWidth * 0.45, 650);
        let canvas = p.createCanvas(size, size, p.WEBGL);
        canvas.parent('cubePreview');
      }

      p.windowResized = function() {
        let size = Math.min(p.windowWidth * 0.45, 650);
        p.resizeCanvas(size, size);
      }
      
      p.draw = function() {
        p.background(0);
        p.rotateX(p.frameCount * 0.01);
        p.rotateY(p.frameCount * 0.01);
        const size = 250;
        const h = size/2;
        p.push();
        p.stroke(255);
        p.strokeWeight(0.8);
        p.noFill();
        
        const totalLines = 24;
        const currentLines = isSkipping ? totalLines : Math.floor(map(i, 0, totalChars, 0, totalLines));
        
        if (currentLines > 0) { p.line(-h, -h, -h, h, -h, -h); }
        if (currentLines > 1) { p.line(h, -h, -h, h, h, -h); }
        if (currentLines > 2) { p.line(h, h, -h, -h, h, -h); }
        if (currentLines > 3) { p.line(-h, h, -h, -h, -h, -h); }
        if (currentLines > 4) { p.line(-h, -h, h, h, -h, h); }
        if (currentLines > 5) { p.line(h, -h, h, h, h, h); }
        if (currentLines > 6) { p.line(h, h, h, -h, h, h); }
        if (currentLines > 7) { p.line(-h, h, h, -h, -h, h); }
        if (currentLines > 8) { p.line(-h, -h, -h, -h, -h, h); }
        if (currentLines > 9) { p.line(h, -h, -h, h, -h, h); }
        if (currentLines > 10) { p.line(h, h, -h, h, h, h); }
        if (currentLines > 11) { p.line(-h, h, -h, -h, h, h); }

        if (currentLines > 11) {
          p.stroke(255, 80);
          p.strokeWeight(0.8);
          const divisions = 4;
          const step = size/divisions;
          const gridStart = 12;
          const gridLines = currentLines - gridStart;
          
          let lineCount = 0;
          for(let axis = -h + step; axis < h; axis += step) {
            if(lineCount < gridLines) {
              p.line(-h, -h, axis, -h, h, axis);
              p.line(h, -h, axis, h, h, axis);
              p.line(-h, axis, -h, -h, axis, h);
              p.line(h, axis, -h, h, axis, h);
            }
            lineCount++;
            
            if(lineCount < gridLines) {
              p.line(axis, -h, -h, axis, -h, h);
              p.line(axis, h, -h, axis, h, h);
              p.line(-h, -h, axis, h, -h, axis);
              p.line(-h, h, axis, h, h, axis);
            }
            lineCount++;
            
            if(lineCount < gridLines) {
              p.line(-h, axis, -h, h, axis, -h);
              p.line(-h, axis, h, h, axis, h);
              p.line(axis, -h, -h, axis, h, -h);
              p.line(axis, -h, h, axis, h, h);
            }
            lineCount++;
          }
        }
        p.pop();
      }
    }, 'cubePreview');

    cylinderPreviewSketch = new p5((p) => {
      p.setup = function() {
        let size = Math.min(p.windowWidth * 0.45, 650);
        let canvas = p.createCanvas(size, size, p.WEBGL);
        canvas.parent('cylinderPreview');
      }

      p.windowResized = function() {
        let size = Math.min(p.windowWidth * 0.45, 650);
        p.resizeCanvas(size, size);
      }
      
      p.draw = function() {
        p.background(0);
        p.rotateX(p.frameCount * 0.01);
        p.rotateY(p.frameCount * 0.01);
        const radius = 250/2.5;
        const height = 250;
        const detail = 24;
        
        const currentDetail = isSkipping ? detail * 2 : 
          Math.floor(map(i, 0, totalChars, 0, detail * 2));
        
        p.push();
        p.stroke(255);
        p.noFill();
        
        if (currentDetail > 0) {
          p.strokeWeight(1);
          
          p.beginShape();
          for(let j = 0; j <= Math.min(currentDetail, detail); j++) {
            const angle = p.TWO_PI * j / detail;
            const x = p.cos(angle) * radius;
            const z = p.sin(angle) * radius;
            p.vertex(x, -height/2, z);
          }
          p.endShape();
          
          p.beginShape();
          for(let j = 0; j <= Math.min(currentDetail, detail); j++) {
            const angle = p.TWO_PI * j / detail;
            const x = p.cos(angle) * radius;
            const z = p.sin(angle) * radius;
            p.vertex(x, height/2, z);
          }
          p.endShape();
        }
        
        if (currentDetail > detail) {
          p.strokeWeight(0.2);
          const verticalLines = currentDetail - detail;
          
          const numVerticalDivisions = 12;
          const numHorizontalDivisions = 4;
          
          const totalGridLines = numVerticalDivisions + numHorizontalDivisions;
          const currentGridLines = Math.min(verticalLines, totalGridLines);
          
          for(let i = 0; i < currentGridLines; i++) {
            if (i < numVerticalDivisions) {
              const angle = p.TWO_PI * i / numVerticalDivisions;
              const x = p.cos(angle) * radius;
              const z = p.sin(angle) * radius;
              p.line(x, -height/2, z, x, height/2, z);
            }
            
            if (i >= numVerticalDivisions && i - numVerticalDivisions < numHorizontalDivisions) {
              const h = -height/2 + height * (i - numVerticalDivisions + 1) / (numHorizontalDivisions + 1);
              p.beginShape();
              for(let j = 0; j <= numVerticalDivisions; j++) {
                const angle = p.TWO_PI * j / numVerticalDivisions;
                const x = p.cos(angle) * radius;
                const z = p.sin(angle) * radius;
                p.vertex(x, h, z);
              }
              p.endShape();
            }
          }
        }
        
        p.pop();
      }
    }, 'cylinderPreview');

    function type() {
      if (i < characters.length) {
        if (isSkipping) {
          terminalText.innerHTML = text;
          i = characters.length;
          isTypingComplete = true;
          originalText = terminalText.innerHTML;
          setupTerminalInput();
          document.removeEventListener('keydown', skipAnimation);
        } else {
          let currentText = '';
          let inTag = false;
          let currentTag = '';
          
          for (let j = 0; j <= i; j++) {
            if (characters[j] === '<') {
              inTag = true;
              currentTag = '<';
            } else if (inTag && characters[j] === '>') {
              inTag = false;
              currentTag += '>';
              currentText += currentTag;
            } else if (inTag) {
              currentTag += characters[j];
            } else {
              currentText += characters[j];
            }
          }
          
          terminalText.innerHTML = currentText;
          i++;
          setTimeout(type, 1);
        }
      } else {
        isTypingComplete = true;
        originalText = terminalText.innerHTML;
        setupTerminalInput();
        document.removeEventListener('keydown', skipAnimation);
      }
    }
  
    type();
  }

  function setupTerminalInput() {
    const input = document.createElement('input');
    input.className = 'terminal-input';
    terminal.appendChild(input);
    
    document.addEventListener('keydown', (e) => {
      if (!isTypingComplete) return;

      if (e.key === 'Enter') {
        const command = currentInput.trim();
        originalText += `${currentInput}\n`;
        currentInput = '';
        processCommand(command);
      } else if (e.key === 'Backspace') {
        currentInput = currentInput.slice(0, -1);
      } else if (e.key.length === 1) {
        currentInput += e.key;
      }
      
      updateDisplay();
    });

    function updateDisplay() {
      terminalText.innerHTML = originalText + currentInput;
    }

    function processCommand(command) {
      if (command === '') {
        originalText += `utente@${deviceName} ~ % `;
        updateDisplay();
        return;
      }

      switch(command.toLowerCase()) {
        case 'cubo':
        case 'cilindro':
          const mode = command.toLowerCase();
          originalText += `creazione spazio colore\n`;
          let currentText = originalText;
          
          let progress = 0;
          const loadingInterval = setInterval(() => {
            progress += 2;
            const barLength = 30;
            const filled = Math.floor((progress * barLength) / 100);
            const empty = barLength - filled;
            const progressBar = '<span class="loading-bar">[' + '█'.repeat(filled) + ' '.repeat(empty) + ']</span>';
            
            terminalText.innerHTML = currentText + progressBar + ` ${progress}%`;
            
            if (progress >= 100) {
              clearInterval(loadingInterval);
              originalText = currentText + 
                `<span class="loading-bar">[████████████████████████████████] 100%</span>\n` +
                `transizione completata.\npassaggio alla visualizzazione hsb`;
              
              terminalText.innerHTML = originalText;
              
              setTimeout(() => {
                modalita = mode === 'cubo' ? 'rgb' : 'hsb';
                animateAndTransition();
                document.getElementById('landing-page').classList.add('hidden');
                document.getElementById('toggleMode').style.display = 'block';
                aggiornaPosizioniImmagini();
              }, 500);
            }
          }, 30);
          break;
          
        default:
          originalText += `zsh: comando non trovato: ${command}\nutente@${deviceName} ~ % `;
          updateDisplay();
      }
    }

    terminal.addEventListener('click', () => input.focus());
    input.focus();
  }

  typeWriter();
});

function filterImagesByClass(className) {
  visibleImages = immagini.filter(img => {
    const imgData = Object.values(atlasData).find(item => item.FileName === img.nome);
    return imgData && imgData.class === className;
  });
  
  aggiornaPosizioniImmagini();
}

function resetFilter() {
  visibleImages = [...immagini];
  aggiornaPosizioniImmagini();
}

function setupFilterClickHandlers() {
  const filtersContainer = document.querySelector('.filters-container');
  
  function updateFilterVisuals() {
    const filters = filtersContainer.querySelectorAll('span');
    filters.forEach(filter => {
      const filterName = filter.textContent.split('[')[0].trim();
      if (filterName === filtroAttivo) {
        filter.classList.add('active-filter');
      } else {
        filter.classList.remove('active-filter');
      }
    });
  }

  filtersContainer.addEventListener('click', (e) => {
    if (!e.target.matches('span')) return;

    const text = e.target.textContent;
    const className = text.split('[')[0].trim();

    if (filtroAttivo === className) {
      filtroAttivo = null;
      resetFilter();
    } else {
      filtroAttivo = className;
      filterImagesByClass(className);
    }

    updateFilterVisuals();
    aggiornaPosizioniImmagini();
  });

  const observer = new MutationObserver(() => {
    updateFilterVisuals();
  });

  observer.observe(filtersContainer, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function invertMatrix4(m) {
  let inv = [];
  let det;
  let i;

  inv[0] = m[5]  * m[10] * m[15] - 
           m[5]  * m[11] * m[14] - 
           m[9]  * m[6]  * m[15] + 
           m[9]  * m[7]  * m[14] +
           m[13] * m[6]  * m[11] - 
           m[13] * m[7]  * m[10];

  inv[4] = -m[4]  * m[10] * m[15] + 
            m[4]  * m[11] * m[14] + 
            m[8]  * m[6]  * m[15] - 
            m[8]  * m[7]  * m[14] - 
            m[12] * m[6]  * m[11] + 
            m[12] * m[7]  * m[10];

  inv[8] = m[4]  * m[9] * m[15] - 
           m[4]  * m[11] * m[13] - 
           m[8]  * m[5] * m[15] + 
           m[8]  * m[7] * m[13] + 
           m[12] * m[5] * m[11] - 
           m[12] * m[7] * m[9];

  inv[12] = -m[4]  * m[9] * m[14] + 
             m[4]  * m[10] * m[13] +
             m[8]  * m[5] * m[14] - 
             m[8]  * m[6] * m[13] - 
             m[12] * m[5] * m[10] + 
             m[12] * m[6] * m[9];

  inv[1] = -m[1]  * m[10] * m[15] + 
            m[1]  * m[11] * m[14] + 
            m[9]  * m[2] * m[15] - 
            m[9]  * m[3] * m[14] - 
            m[13] * m[2] * m[11] + 
            m[13] * m[3] * m[10];

  inv[5] = m[0]  * m[10] * m[15] - 
           m[0]  * m[11] * m[14] - 
           m[8]  * m[2] * m[15] + 
           m[8]  * m[3] * m[14] + 
           m[12] * m[2] * m[11] - 
           m[12] * m[3] * m[10];

  inv[9] = -m[0]  * m[9] * m[15] + 
            m[0]  * m[11] * m[13] + 
            m[8]  * m[1] * m[15] - 
            m[8]  * m[3] * m[13] - 
            m[12] * m[1] * m[11] + 
            m[12] * m[3] * m[9];

  inv[13] = m[0]  * m[9] * m[14] - 
            m[0]  * m[10] * m[13] - 
            m[8]  * m[1] * m[14] + 
            m[8]  * m[2] * m[13] + 
            m[12] * m[1] * m[10] - 
            m[12] * m[2] * m[9];

  inv[2] = m[1]  * m[6] * m[15] - 
           m[1]  * m[7] * m[14] - 
           m[5]  * m[2] * m[15] + 
           m[5]  * m[3] * m[14] + 
           m[13] * m[2] * m[7] - 
           m[13] * m[3] * m[6];

  inv[6] = -m[0]  * m[6] * m[15] + 
            m[0]  * m[7] * m[14] + 
            m[4]  * m[2] * m[15] - 
            m[4]  * m[3] * m[14] - 
            m[12] * m[2] * m[7] + 
            m[12] * m[3] * m[6];

  inv[10] = m[0]  * m[5] * m[15] - 
            m[0]  * m[7] * m[13] - 
            m[4]  * m[1] * m[15] + 
            m[4]  * m[3] * m[13] + 
            m[12] * m[1] * m[7] - 
            m[12] * m[3] * m[5];

  inv[14] = -m[0]  * m[5] * m[14] + 
             m[0]  * m[6] * m[13] + 
             m[4]  * m[1] * m[14] - 
             m[4]  * m[2] * m[13] - 
             m[12] * m[1] * m[6] + 
             m[12] * m[2] * m[5];

  inv[3] = -m[1] * m[6] * m[11] + 
            m[1] * m[7] * m[10] + 
            m[5] * m[2] * m[11] - 
            m[5] * m[3] * m[10] - 
            m[9] * m[2] * m[7] + 
            m[9] * m[3] * m[6];

  inv[7] = m[0] * m[6] * m[11] - 
           m[0] * m[7] * m[10] - 
           m[4] * m[2] * m[11] + 
           m[4] * m[3] * m[10] + 
           m[8] * m[2] * m[7] - 
           m[8] * m[3] * m[6];

  inv[11] = -m[0] * m[5] * m[11] + 
             m[0] * m[7] * m[9] + 
             m[4] * m[1] * m[11] - 
             m[4] * m[3] * m[9] - 
             m[8] * m[1] * m[7] + 
             m[8] * m[3] * m[5];

  inv[15] = m[0] * m[5] * m[10] - 
            m[0] * m[6] * m[9] - 
            m[4] * m[1] * m[10] + 
            m[4] * m[2] * m[9] + 
            m[8] * m[1] * m[6] - 
            m[8] * m[2] * m[5];

  det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
  if (det === 0) return null;

  det = 1.0 / det;
  for (i = 0; i < 16; i++) inv[i] = inv[i] * det;

  return inv;
}

function getRayFromMouse() {
  const x = (mouseX / width) * 2 - 1;
  const y = -((mouseY / height) * 2 - 1);

  const projectionMatrix = _renderer.uPMatrix.mat4;
  const modelViewMatrix = _renderer.uMVMatrix.mat4;

  const invProjection = invertMatrix4(projectionMatrix);
  const invView = invertMatrix4(modelViewMatrix);

  if (!invProjection || !invView) {
    console.error("Impossibile invertire le matrici");
    return null;
  }

  const nearPoint = multMatrixVec(invProjection, [x, y, -1, 1]);
  const farPoint = multMatrixVec(invProjection, [x, y, 1, 1]);

  for (let i = 0; i < 4; i++) {
    nearPoint[i] /= nearPoint[3];
    farPoint[i] /= farPoint[3];
  }

  const nearWorld = multMatrixVec(invView, nearPoint);
  const farWorld = multMatrixVec(invView, farPoint);

  for (let i = 0; i < 4; i++) {
    nearWorld[i] /= nearWorld[3];
    farWorld[i] /= farWorld[3];
  }

  const origin = createVector(nearWorld[0], nearWorld[1], nearWorld[2]);
  const direction = p5.Vector.sub(createVector(farWorld[0], farWorld[1], farWorld[2]), origin).normalize();

  return { origin, direction };
}

function multMatrixVec(mat, vec) {
  let result = [];
  for (let i = 0; i < 4; i++) {
    result[i] = mat[i] * vec[0] + mat[i + 4] * vec[1] + mat[i + 8] * vec[2] + mat[i + 12] * vec[3];
  }
  return result;
}

function rayIntersectsImage(rayOrigin, rayDir, img) {
  const mv = img.getModelViewMatrix();
  const right = createVector(mv[0][0], mv[1][0], mv[2][0]);
  const up = createVector(mv[0][1], mv[1][1], mv[2][1]);
  const w2 = img.w / 2;
  const h2 = img.h / 2;

  const p1 = p5.Vector.add(img.pos, p5.Vector.add(p5.Vector.mult(right, -w2), p5.Vector.mult(up, -h2)));
  const p2 = p5.Vector.add(img.pos, p5.Vector.add(p5.Vector.mult(right, w2), p5.Vector.mult(up, -h2)));
  const p3 = p5.Vector.add(img.pos, p5.Vector.add(p5.Vector.mult(right, w2), p5.Vector.mult(up, h2)));
  const p4 = p5.Vector.add(img.pos, p5.Vector.add(p5.Vector.mult(right, -w2), p5.Vector.mult(up, h2)));

  const t1 = rayIntersectsTriangle(rayOrigin, rayDir, p1, p2, p3);
  const t2 = rayIntersectsTriangle(rayOrigin, rayDir, p1, p3, p4);

  if (t1 !== null && t2 !== null) return Math.min(t1, t2);
  if (t1 !== null) return t1;
  if (t2 !== null) return t2;
  return null;
}

function rayIntersectsTriangle(orig, dir, v0, v1, v2) {
  const EPSILON = 0.000001;
  const edge1 = p5.Vector.sub(v1, v0);
  const edge2 = p5.Vector.sub(v2, v0);
  const h = p5.Vector.cross(dir, edge2);
  const a = p5.Vector.dot(edge1, h);
  if (a > -EPSILON && a < EPSILON) return null;

  const f = 1.0 / a;
  const s = p5.Vector.sub(orig, v0);
  const u = f * p5.Vector.dot(s, h);
  if (u < 0.0 || u > 1.0) return null;

  const q = p5.Vector.cross(s, edge1);
  const v = f * p5.Vector.dot(dir, q);
  if (v < 0.0 || u + v > 1.0) return null;

  const t = f * p5.Vector.dot(edge2, q);
  if (t > EPSILON) return t;

  return null;
}

function hideModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
}

function drawAxisGuides() {
  if (!showAxisGuides) return;
  
  push();
  textSize(12);
  textAlign(CENTER, CENTER);
  
  const cubeSize = 500;
  const h = cubeSize/2;
  const origin = createVector(-h, h, -h);
  const guideLength = cubeSize - 5;
  
  if (modalita === 'rgb') {
    beginShape(LINES);
    for(let i = 0; i <= 100; i++) {
      const t = i/100;
      stroke(255 * t, 0, 0);
      strokeWeight(2);
      const x = map(t, 0, 1, origin.x, origin.x + guideLength);
      vertex(x, origin.y, origin.z);
      
      const nextT = (i+1)/100;
      const nextX = map(nextT, 0, 1, origin.x, origin.x + guideLength);
      vertex(nextX, origin.y, origin.z);
    }
    endShape();
    fill(255);
    noStroke();
    text("R", origin.x + guideLength + 20, origin.y, origin.z);
    
    beginShape(LINES);
    for(let i = 0; i <= 100; i++) {
      const t = i/100;
      stroke(0, 0, 255 * t);
      strokeWeight(2);
      const y = map(t, 0, 1, origin.y, origin.y - guideLength);
      vertex(origin.x, y, origin.z);
      
      const nextT = (i+1)/100;
      const nextY = map(nextT, 0, 1, origin.y, origin.y - guideLength);
      vertex(origin.x, nextY, origin.z);
    }
    endShape();
    fill(255);
    noStroke();
    text("B", origin.x, origin.y - guideLength - 20, origin.z);
    
    beginShape(LINES);
    for(let i = 0; i <= 100; i++) {
      const t = i/100;
      stroke(0, 255 * t, 0);
      strokeWeight(2);
      const z = map(t, 0, 1, origin.z, origin.z + guideLength);
      vertex(origin.x, origin.y, z);
      
      const nextT = (i+1)/100;
      const nextZ = map(nextT, 0, 1, origin.z, origin.z + guideLength);
      vertex(origin.x, origin.y, nextZ);
    }
    endShape();
    fill(255);
    noStroke();
    text("G", origin.x, origin.y, origin.z + guideLength + 20);

    noStroke();
    
    fill(255, 0, 255);
    push();
    translate(h, -h, -h);
    sphere(2);
    pop();
    
    fill(0, 255, 255);
    push();
    translate(-h, -h, h);
    sphere(2);
    pop();
    
    fill(255, 255, 0);
    push();
    translate(h, h, h);
    sphere(2);
    pop();
    
    fill(255);
    push();
    translate(h, -h, h);
    sphere(2);
    pop();
  } else {
    const cylinderRadius = 250;
    const cylinderHeight = 500;
    
    push();
    noFill();
    const steps = 60;
    colorMode(HSB, 360, 100, 100);
    
    for(let i = 0; i < steps; i++) {
      const hue = (i * 360) / steps;
      stroke(hue, 100, 100);
      strokeWeight(2);
      
      const angle = (i * TWO_PI) / steps;
      const nextAngle = ((i + 1) * TWO_PI) / steps;
      
      beginShape(LINES);
      vertex(cos(angle) * cylinderRadius, cylinderHeight/2, sin(angle) * cylinderRadius);
      vertex(cos(nextAngle) * cylinderRadius, cylinderHeight/2, sin(nextAngle) * cylinderRadius);
      endShape();
    }
    
    beginShape(LINES);
    for(let i = 0; i <= 100; i++) {
      const t = i/100;
      const brightness = 255 * (1 - t);
      colorMode(RGB);
      stroke(brightness);
      strokeWeight(2);
      const y = map(t, 0, 1, -cylinderHeight/2, cylinderHeight/2);
      vertex(cylinderRadius, y, 0);
      
      const nextT = (i+1)/100;
      const nextY = map(nextT, 0, 1, -cylinderHeight/2, cylinderHeight/2);
      vertex(cylinderRadius, nextY, 0);
    }
    endShape();
    
    const angle = 0;
    colorMode(HSB, 360, 100, 100);
    beginShape(LINES);
    for(let i = 0; i <= 100; i++) {
      const t = i/100;
      const radius = t * cylinderRadius;
      stroke(0, t * 100, 100);
      strokeWeight(2);
      
      const x = cos(angle) * radius;
      const z = sin(angle) * radius;
      vertex(x, cylinderHeight/2, z);
      
      const nextRadius = ((i + 1)/100) * cylinderRadius;
      const nextX = cos(angle) * nextRadius;
      const nextZ = sin(angle) * nextRadius;
      vertex(nextX, cylinderHeight/2, nextZ);
    }
    endShape();
    
    colorMode(RGB);
    
    noStroke();
    
    fill(255);
    push();
    translate(0, -cylinderHeight/2, 0);
    sphere(4);
    pop();
    
    fill(0);
    push();
    translate(0, cylinderHeight/2, 0);
    sphere(4);
    pop();
    
    const mainColors = [
      [255, 0, 0],
      [255, 255, 0],
      [0, 255, 0],
      [0, 255, 255],
      [0, 0, 255],
      [255, 0, 255]
    ];
    
    for(let i = 0; i < mainColors.length; i++) {
      const angle = (i * TWO_PI) / mainColors.length;
      const color = mainColors[i];
      fill(color[0], color[1], color[2]);
      push();
      translate(
        cos(angle) * cylinderRadius,
        cylinderHeight/2,
        sin(angle) * cylinderRadius
      );
      sphere(4);
      pop();
    }

    fill(255);
    noStroke();
    textSize(16);
    text("B", -cylinderRadius - 20, 0, 0);
    text("H", 0, cylinderHeight/2 + 20, 0);
    text("S", cylinderRadius/2, cylinderHeight/2 + 20, 0);
  }
  pop();
}