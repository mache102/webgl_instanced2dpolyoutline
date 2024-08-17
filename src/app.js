import { Shader } from './shader.js';
import { polar_vec2 } from './polar_vec2.js';
import { vec2 } from './vec2.js';
import { Color } from './color.js';
import { Timer } from './timer.js';

import { getCanvasSize, getCanvasCenter, getRandCoord } from './utils.js';

import { polygonShader_vert, polygonShader_frag } from './shaders/polygonShader.js';
import { circleShader_vert, circleShader_frag } from './shaders/circleShader.js';

import { InstancedRender } from './instancedRender.js';

const canvas = document.getElementById('game-canvas');

canvas.width = 1920;
canvas.height = 1080;

const gl = canvas.getContext('webgl2', { antialias: true });
if (gl) {
  console.log('Renderer:', gl.getParameter(gl.RENDERER));
  console.log('Vendor:', gl.getParameter(gl.VENDOR));
  console.log('Max Texture Size:', gl.getParameter(gl.MAX_TEXTURE_SIZE));

  // Check for extensions
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    console.log('Unmasked Vendor ID:', debugInfo.UNMASKED_VENDOR_WEBGL);
    console.log('Unmasked Renderer ID:', debugInfo.UNMASKED_RENDERER_WEBGL);
  }

} else {
  alert('Unable to initialize WebGL2. Your browser may not support it.');
}
/* ******** ******** ******** ******** ******** ******** ******** ********

SETTINGS

******** ******** ******** ******** ******** ******** ******** ******** */
let bgColor = new Color("#dbdbdb");
let outlineColor = new Color("#484848");
let outlineSize = 1.8;
let transitionSmoothness = 1.0;
let blendFactor = 0.6;

let polygonColors = [
  new Color("#3ca4cb"),
  new Color("#8abc3f"),
  new Color("#e03e41"),
  new Color("#cc669c")
];

let polygonCount = 2000;

let minSize = 2;
let maxSize = 20;

function radians(degrees) {
  return degrees * Math.PI / 180;
}

let tick_updates = 1;
let print_every = 200;


/* ******** ******** ******** ******** ******** ******** ******** ********

GLOBALS

******** ******** ******** ******** ******** ******** ******** ******** */
let renderManager = new InstancedRender();

let tick = 0;
// fps calculation
let lastTime = 0;
let frameCount = 0;
let fps = 0;
let updateFpsEvery = 0.5;
let now; // current time

/* ******** ******** ******** ******** ******** ******** ******** ********

MAIN

******** ******** ******** ******** ******** ******** ******** ******** */
function renderLoop(timestamp) {
  now = timestamp;
  calculateFPS(now);

  gl.clearColor(...bgColor.normalize());
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (tick_updates) {
    update();
    // updateWorker.postMessage({ instance_indices, p_rotations });
  }

  // let start = performance.now();
  draw();
  // let elapsed = performance.now() - start;
  // console.log(`Draw time: ${elapsed.toFixed(3)} ms`);

  requestAnimationFrame(renderLoop);
}

function update() {
  // iterate over renderermap
  for (let [name, renderer] of renderManager.rendererMap) {
    for (let i = 0; i < renderer.rotations.length; i++) {
      renderer.rotations[i] += 0.1;
      if (renderer.rotations[i] > 2 * Math.PI) {
        renderer.rotations[i] -= 2 * Math.PI;
      }
    }
    renderer.updateRotationBuffer();
  }
}

function draw() {

  renderManager.drawAll();
}

function init() {
  writeOverlayContent();

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);

  renderManager = new InstancedRender();
  renderManager.defineShaderUniforms(getCanvasSize(canvas), outlineColor, outlineSize, transitionSmoothness, blendFactor);

  let circleShader = new Shader(gl, circleShader_vert, circleShader_frag);
  renderManager.setCircleRenderer(gl, circleShader);

  let starVertices = [
    new polar_vec2(1,radians(0)),
    new polar_vec2(0.50, radians(45)),
    new polar_vec2(1,radians(90)),
    new polar_vec2(0.50, radians(135)),
    new polar_vec2(1,radians(180)),
    new polar_vec2(0.50, radians(225)),
    new polar_vec2(1,radians(270)),
    new polar_vec2(0.50, radians(315))
  ];
  let polygonShader = new Shader(gl, polygonShader_vert, polygonShader_frag);
  renderManager.addRenderer('star', starVertices, gl, polygonShader);

  let squareVertices = [
    new vec2(-1, -1),
    new vec2(1, -1),
    new vec2(1, 1),
    new vec2(-1, 1)
  ];
  let squareShader = new Shader(gl, polygonShader_vert, polygonShader_frag);
  renderManager.addRenderer('square', squareVertices, gl, squareShader);

  let triangleVertices = [
    new vec2(-1, 0),
    new vec2(1, 0),
    new vec2(0, 4)
  ];
  let triangleShader = new Shader(gl, polygonShader_vert, polygonShader_frag);
  renderManager.addRenderer('triangle', triangleVertices, gl, triangleShader);

  let pentagonVertices = [
    new polar_vec2(1, radians(0)),
    new polar_vec2(1, radians(72)),
    new polar_vec2(1, radians(144)),
    new polar_vec2(1, radians(216)),
    new polar_vec2(1, radians(288))
  ];

  let pentagonShader = new Shader(gl, polygonShader_vert, polygonShader_frag);
  renderManager.addRenderer('pentagon', pentagonVertices, gl, pentagonShader);

  let hexagonVertices = [
    new polar_vec2(1, radians(0)),
    new polar_vec2(1, radians(60)),
    new polar_vec2(1, radians(120)),
    new polar_vec2(1, radians(180)),
    new polar_vec2(1, radians(240)),
    new polar_vec2(1, radians(300))
  ];
  let hexagonShader = new Shader(gl, polygonShader_vert, polygonShader_frag);
  renderManager.addRenderer('hexagon', hexagonVertices, gl, hexagonShader);

  let time = performance.now();
  for (let i = 0; i < polygonCount; i++) {
    renderManager.addInstance({
      name: 'star',
      rotation: i * 2 * Math.PI / 360.0,
      size: Math.random() * (maxSize - minSize) + minSize,
      offset: getRandCoord(canvas),
      color: polygonColors[Math.floor(Math.random() * polygonColors.length)]
    });

    renderManager.addInstance({
      name: 'square',
      rotation: i * 2 * Math.PI / 360.0,
      size: Math.random() * (maxSize - minSize) + minSize,
      offset: getRandCoord(canvas),
      color: polygonColors[Math.floor(Math.random() * polygonColors.length)]
    });

    renderManager.addInstance({
      name: 'triangle',
      rotation: i * 2 * Math.PI / 360.0,
      size: Math.random() * (maxSize - minSize) + minSize,
      offset: getRandCoord(canvas),
      color: polygonColors[Math.floor(Math.random() * polygonColors.length)]
    });

    renderManager.addInstance({
      name: 'pentagon',
      rotation: i * 2 * Math.PI / 360.0,
      size: Math.random() * (maxSize - minSize) + minSize,
      offset: getRandCoord(canvas),
      color: polygonColors[Math.floor(Math.random() * polygonColors.length)]
    });

    renderManager.addInstance({
      name: 'hexagon',
      rotation: i * 2 * Math.PI / 360.0,
      size: Math.random() * (maxSize - minSize) + minSize,
      offset: getRandCoord(canvas),
      color: polygonColors[Math.floor(Math.random() * polygonColors.length)]
    });

    renderManager.addCircleInstance({
      size: Math.random() * (maxSize - minSize) + minSize,
      offset: getRandCoord(canvas),
      color: polygonColors[Math.floor(Math.random() * polygonColors.length)]
    });

  }

  let elapsed = performance.now() - time;
  console.log(`Time to add ${polygonCount} polygons: ${elapsed} ms (avg: ${elapsed / polygonCount} ms)`);

  renderManager.updateAllBuffers();

  resizeCanvasToDisplaySize(canvas);
  const canvasSizeText = document.getElementById('canvas-size-text');
  canvasSizeText.textContent = `Canvas size: ${canvas.width} x ${canvas.height}`;

  renderLoop();
}

function resizeCanvasToDisplaySize(canvas) {
  if (!canvas || !gl) return;
  const displayWidth  = window.innerWidth;
  const displayHeight = window.innerHeight;

  // Check if the canvas is not the same size.
  if (canvas.width  !== displayWidth ||
      canvas.height !== displayHeight) {

    canvas.width  = displayWidth;
    canvas.height = displayHeight;

    gl.viewport(0, 0, canvas.width, canvas.height);
    renderManager.setWinres(getCanvasSize(canvas));

    // canvas-size-text
    const canvasSizeText = document.getElementById('canvas-size-text');
    canvasSizeText.textContent = `Canvas size: ${canvas.width} x ${canvas.height}`;

    return true;
  }
  return false;
}

function calculateFPS(now) {
  now *= 0.001;
  const deltaTime = now - lastTime;

  frameCount++;

  if (deltaTime >= updateFpsEvery) { 
    fps = frameCount / deltaTime;
    frameCount = 0;
    lastTime = now;
    // fps-text
    const fpsText = document.getElementById('fps-text');
    fpsText.textContent = `FPS: ${fps.toFixed(2)}`;
  }
}

function writecc(overlayContent) {
  /*
  bgColor: color selector
  outlineColor: color selector
  outlineSize: number input
  transitionSmoothness: number input
  blendFactor: slider (0~1)

  ----- separator -----

  tick_updates: checkbox
  render_as_circles: checkbox
  */
  const cc = document.createElement('div');
  cc.setAttribute('id', 'config-content');
  cc.classList.add('config-content');

  const c1 = document.createElement('div');
  c1.classList.add('config-item');
  const l1 = document.createElement('label');
  l1.setAttribute('for', 'bg-color-input');
  l1.textContent = 'Background Color: ';
  c1.appendChild(l1);
  const i1 = document.createElement('input');
  i1.setAttribute('type', 'color');
  i1.setAttribute('id', 'bg-color-input');
  i1.setAttribute('value', bgColor.toHex());
  i1.addEventListener('input', (e) => {
    bgColor = new Color(e.target.value);
  });
  c1.appendChild(i1);
  cc.appendChild(c1);

  const c2 = document.createElement('div');
  c2.classList.add('config-item');
  const l2 = document.createElement('label');  
  l2.setAttribute('for', 'outline-color-input');
  l2.textContent = 'Outline Color: ';
  c2.appendChild(l2);
  const i2 = document.createElement('input');
  i2.setAttribute('type', 'color');
  i2.setAttribute('id', 'outline-color-input');
  i2.setAttribute('value', outlineColor.toHex());
  i2.addEventListener('input', (e) => {
    outlineColor = new Color(e.target.value);
    renderManager.setOutlineColor(outlineColor);
  });
  c2.appendChild(i2);
  cc.appendChild(c2);

  const c3 = document.createElement('div');
  c3.classList.add('config-item');
  const l3 = document.createElement('label');
  l3.setAttribute('for', 'outline-size-input');
  l3.textContent = 'Outline Size: ';
  c3.appendChild(l3);
  const i3 = document.createElement('input');
  i3.setAttribute('type', 'number');
  i3.setAttribute('id', 'outline-size-input');
  i3.setAttribute('value', outlineSize);
  i3.addEventListener('input', (e) => {
    outlineSize = parseFloat(e.target.value);
    renderManager.setOutlineSize(outlineSize);
  });
  c3.appendChild(i3);
  cc.appendChild(c3);

  const c4 = document.createElement('div');
  c4.classList.add('config-item');
  const l4 = document.createElement('label');
  l4.setAttribute('for', 'transition-smoothness-input');
  l4.textContent = 'Transition Smoothness: ';
  c4.appendChild(l4);
  const i4 = document.createElement('input');
  i4.setAttribute('type', 'range');
  i4.setAttribute('id', 'transition-smoothness-input');
  i4.setAttribute('min', '0');
  i4.setAttribute('max', '3');
  i4.setAttribute('step', '0.01');
  i4.setAttribute('value', transitionSmoothness);
  i4.addEventListener('input', (e) => {
    transitionSmoothness = parseFloat(e.target.value);
    renderManager.setTransitionSmoothness(transitionSmoothness);

    document.getElementById('v4-span').textContent = transitionSmoothness;
  });
  c4.appendChild(i4);
  const v4 = document.createElement('span');
  v4.setAttribute('id', 'v4-span');
  v4.textContent = transitionSmoothness;
  c4.appendChild(v4);
  cc.appendChild(c4);

  const c5 = document.createElement('div');
  c5.classList.add('config-item');
  const l5 = document.createElement('label');
  l5.setAttribute('for', 'blend-factor-input');
  l5.textContent = 'Blend Factor: ';
  c5.appendChild(l5); 
  const i5 = document.createElement('input');
  i5.setAttribute('type', 'range');
  i5.setAttribute('id', 'blend-factor-input');
  i5.setAttribute('min', '0'); 
  i5.setAttribute('max', '1');
  i5.setAttribute('step', '0.01'); 
  i5.setAttribute('value', blendFactor);
  i5.addEventListener('input', (e) => {
    blendFactor = parseFloat(e.target.value);
    renderManager.setBlendFactor(blendFactor);

    document.getElementById('v5-span').textContent = blendFactor;
  });
  c5.appendChild(i5);
  const v5 = document.createElement('span');
  v5.setAttribute('id', 'v5-span');
  v5.textContent = blendFactor;
  c5.appendChild(v5);
  cc.appendChild(c5);
  
  const c6 = document.createElement('div');
  c6.classList.add('config-item');

  const l6 = document.createElement('label');
  l6.setAttribute('for', 'tick-updates-input');
  l6.textContent = 'Tick Updates: ';
  c6.appendChild(l6);
  const i6 = document.createElement('input');
  i6.setAttribute('type', 'checkbox');
  i6.setAttribute('id', 'tick-updates-input');
  i6.setAttribute('value', tick_updates);
  i6.addEventListener('change', (e) => {
    tick_updates = e.target.checked;
  });
  c6.appendChild(i6);
  cc.appendChild(c6);

  overlayContent.appendChild(cc);
}

function writeOverlayContent() {
  const mainContent = document.getElementById('main-content');

  const overlayContent = document.createElement('div');
  overlayContent.setAttribute('id', 'game-overlay-content');
  overlayContent.classList.add('overlay-content');

  // two <p> in Ubuntu: 1) canvas size X x Y, 2) FPS: Z
  const canvasSizeText = document.createElement('p');
  canvasSizeText.setAttribute('id', 'canvas-size-text');
  canvasSizeText.classList.add('text-outline', 'font-bold', 'text-lg');
  canvasSizeText.textContent = `Canvas size: ${canvas.width} x ${canvas.height}`;
  overlayContent.appendChild(canvasSizeText);

  const fpsText = document.createElement('p');
  fpsText.setAttribute('id', 'fps-text');
  fpsText.classList.add('text-outline', 'font-bold', 'text-lg');
  fpsText.textContent = `FPS: ${fps.toFixed(2)}`;
  overlayContent.appendChild(fpsText);

  writecc(overlayContent);
  
  mainContent.appendChild(overlayContent);
}

// wait for dom load then call init()
window.addEventListener('load', init);
window.addEventListener('resize', () => {
  resizeCanvasToDisplaySize(canvas);
});


