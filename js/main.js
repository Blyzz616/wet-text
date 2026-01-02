const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* ---------- TEXT MASK ---------- */
const mask = document.createElement('canvas');
mask.width = canvas.width;
mask.height = canvas.height;
const mctx = mask.getContext('2d');

mctx.fillStyle = '#fff';
mctx.font = 'bold 200px Arial';
mctx.textAlign = 'center';
mctx.textBaseline = 'middle';
mctx.fillText('Blyzz', canvas.width / 2, canvas.height / 2);

const maskData = mctx.getImageData(0, 0, mask.width, mask.height).data;

function alphaAt(x, y) {
  const i = ((y * mask.width) + x) * 4 + 3;
  return maskData[i];
}

// bottom-edge detection
function isBottomEdge(x, y) {
  if (y + 2 >= mask.height) return false;
  return alphaAt(x, y) > 0 && alphaAt(x, y + 2) === 0;
}

/* ---------- DROPLETS ---------- */
const drops = [];

class Drop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.mass = 2;
    this.r = Math.sqrt(this.mass);
    this.vy = 0;
    this.attached = true;
    this.alpha = 1;
  }

  update() {
    if (this.attached) {
      this.mass += 0.02;
      this.r = Math.sqrt(this.mass);

      if (this.mass > 10) {
        this.attached = false;
      }
    } else {
      this.vy += 0.35;
      this.y += this.vy;

      // fade before bottom
      const fadeStart = canvas.height * 0.75;
      if (this.y > fadeStart) {
        this.alpha = Math.max(
          0,
          1 - (this.y - fadeStart) / (canvas.height * 0.25)
        );
      }
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,220,255,${this.alpha})`;
    ctx.fill();
  }
}

/* ---------- SPAWN (BOTTOM ONLY) ---------- */
function spawn() {
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(Math.random() * canvas.width);
    const y = Math.floor(Math.random() * canvas.height);

    if (isBottomEdge(x, y)) {
      drops.push(new Drop(x, y));
      break;
    }
  }
}

/* ---------- MERGE (ALL SIZES) ---------- */
function mergeDrops() {
  for (let i = 0; i < drops.length; i++) {
    for (let j = i + 1; j < drops.length; j++) {
      const a = drops[i];
      const b = drops[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);

      if (dist < a.r + b.r) {
        const totalMass = a.mass + b.mass;

        a.x = (a.x * a.mass + b.x * b.mass) / totalMass;
        a.y = (a.y * a.mass + b.y * b.mass) / totalMass;
        a.mass = totalMass;
        a.r = Math.sqrt(totalMass);

        drops.splice(j, 1);
        return;
      }
    }
  }
}

/* ---------- LOOP ---------- */
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // faint text
  ctx.fillStyle = 'rgba(230,248,255,0.15)';
  ctx.font = 'bold 200px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Blyzz', canvas.width / 2, canvas.height / 2);

  if (Math.random() < 0.5) spawn();
  mergeDrops();

  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.update();
    d.draw();

    if (d.alpha <= 0) {
      drops.splice(i, 1);
    }
  }

  requestAnimationFrame(loop);
}

loop();
