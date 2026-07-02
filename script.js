const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

let W = 0, H = 0, dpr = 1;
let tulips = [];
let grasses = [];
let stars = [];

const palette = [
  ['#f25a70', '#b91d3c'],
  ['#ff9ab0', '#cf4865'],
  ['#f0473d', '#a91922'],
  ['#fff3ef', '#dfaaa4'],
  ['#c47bff', '#6e35a8'],
  ['#ffcc6d', '#c56a2e']
];

function rand(a, b) { return a + Math.random() * (b - a); }
function ease(t) { return t * t * (3 - 2 * t); }

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.width = Math.floor(innerWidth * dpr);
  H = canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  W = innerWidth;
  H = innerHeight;
  buildScene();
}

function groundY(depth) {
  const horizon = H * 0.38;
  const base = horizon + Math.pow(depth, 1.65) * H * 0.62;
  return base + Math.sin(depth * 10) * 18 * depth;
}

function buildScene() {
  tulips = [];
  grasses = [];
  stars = [];

  for (let i = 0; i < 80; i++) {
    stars.push({
      x: rand(0, W),
      y: rand(0, H * .45),
      r: rand(.35, 1.7),
      a: rand(.08, .45),
      s: rand(.4, 1.8)
    });
  }

  for (let i = 0; i < 260; i++) {
    const depth = Math.pow(Math.random(), .55);
    grasses.push({
      x: rand(-40, W + 40),
      y: groundY(depth) + rand(-18, 24) * depth,
      h: rand(10, 70) * (.28 + depth),
      lean: rand(-12, 12),
      depth
    });
  }

  const count = Math.round(Math.min(900, Math.max(360, W * H / 1900)));

  for (let i = 0; i < count; i++) {
    const depth = Math.pow(Math.random(), .48);
    const rowSpread = 1 + depth * .7;
    const x = W / 2 + (Math.random() - .5) * W * rowSpread;
    const y = groundY(depth) + rand(-26, 38) * depth;
    const color = palette[Math.floor(Math.random() * palette.length)];

    tulips.push({
      x,
      y,
      depth,
      color,
      size: rand(12, 34) * (.22 + depth * .98),
      phase: rand(0, Math.PI * 2),

      // CAMBIADO
      bloomDelay: rand(0.15, 1.15),
      openSpeed: rand(1.7, 2.4),

      tilt: rand(-.35, .35)
    });
  }

  tulips.sort((a, b) => a.y - b.y);
}

function drawSky(t) {
  const g = ctx.createRadialGradient(W * .5, H * .1, 0, W * .5, H * .12, H * .75);
  g.addColorStop(0, '#151515');
  g.addColorStop(.55, '#050505');
  g.addColorStop(1, '#000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (const s of stars) {
    ctx.globalAlpha = s.a + Math.sin(t * s.s + s.x) * .06;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawGround(t) {
  const horizon = H * .37;
  const g = ctx.createLinearGradient(0, horizon, 0, H);
  g.addColorStop(0, '#041006');
  g.addColorStop(.45, '#08200c');
  g.addColorStop(1, '#020602');

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, horizon + 24);

  for (let x = 0; x <= W; x += 28) {
    const y = horizon +
      Math.sin(x * .01 + t * .22) * 11 +
      Math.sin(x * .025) * 7;

    ctx.lineTo(x, y);
  }

  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = .38;
  ctx.strokeStyle = '#133f1a';
  ctx.lineWidth = 1;

  for (let i = 0; i < 16; i++) {
    const y = horizon + i * H * .04 + Math.sin(i + t * .15) * 8;

    ctx.beginPath();

    for (let x = -20; x <= W + 20; x += 36) {
      ctx.lineTo(x, y + Math.sin(x * .011 + i) * 9);
    }

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawGrass(t) {
  ctx.lineCap = 'round';

  for (const g of grasses) {
    const sway = Math.sin(t * 1.1 + g.x * .02) * 8 * g.depth;

    ctx.globalAlpha = .25 + g.depth * .35;
    ctx.strokeStyle = g.depth > .65 ? '#245b24' : '#173818';
    ctx.lineWidth = Math.max(.5, g.depth * 1.8);

    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.quadraticCurveTo(
      g.x + g.lean + sway,
      g.y - g.h * .55,
      g.x + g.lean * 1.6 + sway,
      g.y - g.h
    );

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawTulip(f, t) {

  const sway = Math.sin(t * 1.25 + f.phase) * (3 + f.depth * 7);

  const x = f.x + sway;
  const y = f.y;
  const s = f.size;

  // CAMBIADO
  const bloom = ease(
    Math.min(
      1,
      Math.max(
        0,
        (t - f.bloomDelay) * f.openSpeed / 2.1
      )
    )
  );

  if (bloom <= 0) return;

  ctx.save();

  ctx.translate(x, y);
  ctx.rotate(f.tilt * .18 + sway * .002);
  ctx.globalAlpha = .25 + f.depth * .75;

  const stemH = s * (2.25 + .55 * bloom);

  ctx.strokeStyle = '#28762d';
  ctx.lineWidth = Math.max(1, s * .09);
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-s * .1, -stemH * .45, 0, -stemH);
  ctx.stroke();

  ctx.fillStyle = '#1f6b28';

  drawLeaf(-s * .05, -stemH * .36, -s * .72, -s * .45, s * .62);

  if (f.depth > .45) {
    drawLeaf(s * .03, -stemH * .52, s * .62, -s * .36, s * .48);
  }

  ctx.translate(0, -stemH);

  const open = .35 + bloom * .95;

  const [c1, c2] = f.color;

  const pg = ctx.createLinearGradient(0, -s * 1.2, 0, s * .4);

  pg.addColorStop(0, c1);
  pg.addColorStop(1, c2);

  ctx.fillStyle = pg;
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  ctx.lineWidth = Math.max(.4, s * .025);

  petal(0, 0, s * .48, s * .9, 0);
  petal(-s * .34 * open, s * .05, s * .42, s * .78, -.55 * open);
  petal(s * .34 * open, s * .05, s * .42, s * .78, .55 * open);

  if (bloom > .55) {
    ctx.globalAlpha *= .72;
    petal(0, s * .1, s * .55 * open, s * .58, Math.PI);
  }

  ctx.restore();
}

function drawLeaf(x, y, dx, dy, len) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + dx * .45, y + dy * .25, x + dx, y + dy);
  ctx.quadraticCurveTo(x + dx * .15, y + dy * .75, x, y);
  ctx.fill();
}

function petal(x, y, w, h, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(r);

  ctx.beginPath();
  ctx.moveTo(0, h * .28);
  ctx.bezierCurveTo(-w, h * .05, -w * .75, -h * .78, 0, -h);
  ctx.bezierCurveTo(w * .75, -h * .78, w, h * .05, 0, h * .28);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawMist(t) {
  for (let i = 0; i < 5; i++) {
    const y = H * (.42 + i * .075);
    const x = (t * 18 * (i + 1) + i * 160) % (W + 420) - 210;

    const g = ctx.createRadialGradient(x, y, 10, x, y, W * .42);

    g.addColorStop(0, 'rgba(255,255,255,.055)');
    g.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, y - 80, W, 170);
  }
}

function animate(ms) {
  const t = ms / 1000;

  drawSky(t);
  drawGround(t);
  drawMist(t);
  drawGrass(t);

  for (const f of tulips) {
    drawTulip(f, t);
  }

  ctx.globalAlpha = .16;

  const v = ctx.createRadialGradient(
    W / 2,
    H / 2,
    H * .15,
    W / 2,
    H / 2,
    H * .75
  );

  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, '#000');

  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 1;

  requestAnimationFrame(animate);
}

addEventListener('resize', resize);
resize();
requestAnimationFrame(animate);