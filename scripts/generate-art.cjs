const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const W = 1536;
const H = 1024;
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'images', 'poems');
const TEXTURES = path.join(ROOT, 'public', 'textures');
const C = {
  paper: '#f3eee2',
  paperLight: '#f8f4e9',
  ink: '#294542',
  inkMid: '#526b65',
  inkPale: '#91a29a',
  mist: '#cbd0c3',
  ochre: '#ad8860',
  ochrePale: '#d3bd94',
  cinnabar: '#a45c49',
  night: '#354d4d',
  warm: '#e7c783',
};

const f = (n) => Number(n.toFixed(2));
const P = (d, fill = 'none', stroke = 'none', sw = 1, extra = '') =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${f(sw)}" ${extra}/>`;
const L = (x1, y1, x2, y2, stroke, sw = 1, extra = '') =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${f(sw)}" ${extra}/>`;
const E = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const O = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const G = (body, extra = '') => `<g ${extra}>${body}</g>`;

function random(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOf(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function between(r, min, max) {
  return min + (max - min) * r();
}

function smooth(points, move = true) {
  if (points.length < 2) return '';
  let d = `${move ? 'M' : 'L'}${f(points[0][0])},${f(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const mx = (points[i][0] + points[i + 1][0]) / 2;
    const my = (points[i][1] + points[i + 1][1]) / 2;
    d += ` Q${f(points[i][0])},${f(points[i][1])} ${f(mx)},${f(my)}`;
  }
  const last = points[points.length - 1];
  d += ` T${f(last[0])},${f(last[1])}`;
  return d;
}

function closedSmooth(points) {
  const last = points[points.length - 1];
  const first = points[0];
  let d = `M${f((last[0] + first[0]) / 2)},${f((last[1] + first[1]) / 2)}`;
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const next = points[(i + 1) % points.length];
    d += ` Q${f(p[0])},${f(p[1])} ${f((p[0] + next[0]) / 2)},${f((p[1] + next[1]) / 2)}`;
  }
  return `${d} Z`;
}

function paperPattern() {
  return `<pattern id="paperGrain" width="192" height="192" patternUnits="userSpaceOnUse">
    <rect width="192" height="192" fill="none"/>
    <path d="M18 27l8 -1 M67 42l5 1 M131 21l10 -1 M158 75l6 1 M29 112l7 -1 M85 147l11 1 M142 169l7 -1 M177 125l4 1" stroke="#80745e" stroke-width="0.55" opacity="0.09"/>
    <path d="M41 63l1 7 M112 92l-1 5 M19 172l1 4 M171 33l-1 6 M74 183l1 3" stroke="#ffffff" stroke-width="0.7" opacity="0.22"/>
    <g fill="#756b59" opacity="0.075">
      <circle cx="15" cy="78" r="0.65"/><circle cx="56" cy="17" r="0.5"/><circle cx="97" cy="61" r="0.55"/>
      <circle cx="151" cy="47" r="0.6"/><circle cx="183" cy="97" r="0.5"/><circle cx="122" cy="128" r="0.65"/>
      <circle cx="48" cy="154" r="0.55"/><circle cx="101" cy="178" r="0.45"/><circle cx="164" cy="185" r="0.6"/>
    </g>
  </pattern>`;
}

function background(seed, tone = C.paper) {
  const r = random(seed);
  let out = `<rect width="${W}" height="${H}" fill="${tone}"/><rect width="${W}" height="${H}" fill="url(#paperGrain)"/>`;
  for (let i = 0; i < 170; i += 1) {
    const x = between(r, 12, W - 12);
    const y = between(r, 12, H - 12);
    const len = between(r, 2, 12);
    const vertical = r() > 0.78;
    out += vertical
      ? L(x, y, x + between(r, -1, 1), y + len, '#ffffff', between(r, 0.35, 0.75), 'opacity="0.16"')
      : L(x, y, x + len, y + between(r, -1.2, 1.2), '#7d705a', between(r, 0.3, 0.65), 'opacity="0.055"');
  }
  for (let i = 0; i < 150; i += 1) {
    out += O(between(r, 0, W), between(r, 0, H), between(r, 0.35, 0.85), '#776d5b', `opacity="${between(r, 0.025, 0.065).toFixed(3)}"`);
  }
  return out;
}

function svgDoc(body, seed, tone = C.paper) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${paperPattern()}
      <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="11"/></filter>
      <filter id="haze" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
    </defs>
    <g stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision">${background(seed, tone)}${body}</g>
  </svg>`;
}

function ridge(x, y, w, h, seed, options = {}) {
  const { color = C.inkMid, opacity = 0.14, detail = 10, snow = false } = options;
  const r = random(seed);
  const n = 18;
  const pts = [[x, y - h * 0.08]];
  for (let i = 1; i < n; i += 1) {
    const t = i / n;
    const envelope = Math.sin(Math.PI * t) * 0.55 + 0.2;
    const spike = i % 3 === 1 ? between(r, 0.72, 1.08) : between(r, 0.28, 0.78);
    pts.push([x + w * t, y - h * envelope * spike]);
  }
  pts.push([x + w, y - h * 0.03]);
  const line = `M${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' L')}`;
  const gradientId = `ridge-wash-${seed}`;
  const washColor = snow ? C.paperLight : color;
  let out = `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${washColor}" stop-opacity="${f(opacity * 0.9)}"/><stop offset="0.62" stop-color="${washColor}" stop-opacity="${f(opacity * 0.72)}"/><stop offset="1" stop-color="${washColor}" stop-opacity="0"/></linearGradient></defs>`;
  out += P(`${line} L${f(x + w)},${f(y + h * 0.32)} L${f(x)},${f(y + h * 0.32)} Z`, `url(#${gradientId})`, 'none', 0);
  out += P(line, 'none', color, snow ? 1.1 : 1.25, `opacity="${Math.min(0.65, opacity * 2.5)}"`);
  for (let i = 0; i < detail; i += 1) {
    const index = 1 + Math.floor(r() * (pts.length - 2));
    const p = pts[index];
    const len = between(r, h * 0.05, h * 0.24);
    const dx = between(r, -w * 0.035, w * 0.035);
    out += P(`M${f(p[0])},${f(p[1] + 3)} q${f(dx * 0.2)},${f(len * 0.4)} ${f(dx)},${f(len)}`, 'none', color, between(r, 0.65, 1.5), `opacity="${opacity * between(r, 0.7, 1.5)}"`);
  }
  if (snow) {
    for (let i = 2; i < pts.length - 2; i += 3) {
      const p = pts[i];
      out += P(`M${f(p[0] - w * 0.045)},${f(p[1] + h * 0.11)} Q${f(p[0])},${f(p[1] + h * 0.025)} ${f(p[0] + w * 0.055)},${f(p[1] + h * 0.12)}`, 'none', '#ffffff', h * 0.025, 'opacity="0.55"');
    }
  }
  return out;
}

function rock(x, y, s, seed, options = {}) {
  const { color = C.inkMid, opacity = 0.55, pale = false } = options;
  const r = random(seed);
  const pts = [
    [x - 52 * s, y], [x - 45 * s, y - 28 * s], [x - 19 * s, y - 45 * s],
    [x + 5 * s, y - 40 * s], [x + 30 * s, y - 55 * s], [x + 53 * s, y - 19 * s], [x + 47 * s, y],
  ];
  const d = closedSmooth(pts);
  let out = P(d, pale ? C.paperLight : color, color, 1.2 * s, `opacity="${pale ? opacity * 0.55 : opacity * 0.28}"`);
  out += P(`M${f(x - 45 * s)},${f(y - 27 * s)} l${f(25 * s)},${f(4 * s)} ${f(10 * s)},${f(22 * s)} M${f(x - 17 * s)},${f(y - 43 * s)} l${f(8 * s)},${f(19 * s)} ${f(20 * s)},${f(8 * s)} M${f(x + 29 * s)},${f(y - 52 * s)} l${f(-8 * s)},${f(23 * s)} ${f(18 * s)},${f(14 * s)}`, 'none', color, 1.2 * s, `opacity="${opacity}"`);
  for (let i = 0; i < 5; i += 1) {
    const px = x + between(r, -35, 35) * s;
    const py = y - between(r, 5, 25) * s;
    out += P(`M${f(px)},${f(py)} l${f(between(r, 3, 11) * s)},${f(between(r, -3, 3) * s)}`, 'none', color, 0.65 * s, `opacity="${opacity * 0.55}"`);
  }
  return out;
}

function water(x, y, w, count, seed, options = {}) {
  const { color = C.inkMid, opacity = 0.25, span = 150, gap = 15 } = options;
  const r = random(seed);
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const yy = y + i * gap + between(r, -4, 4);
    const xx = x + between(r, -w * 0.08, w * 0.18);
    const len = between(r, span * 0.25, span);
    out += P(`M${f(xx)},${f(yy)} q${f(len * 0.25)},${f(between(r, -3, 3))} ${f(len * 0.52)},0 t${f(len * 0.48)},0`, 'none', color, between(r, 0.55, 1.35), `opacity="${opacity * between(r, 0.45, 1)}"`);
    if (r() > 0.55) {
      out += P(`M${f(xx + len * 1.15)},${f(yy + between(r, -2, 2))} q${f(len * 0.18)},1 ${f(len * 0.38)},0`, 'none', color, 0.65, `opacity="${opacity * 0.6}"`);
    }
  }
  return out;
}

function rain(x, y, w, h, count, seed, options = {}) {
  const { color = C.inkMid, opacity = 0.24, slant = -14, length = 34 } = options;
  const r = random(seed);
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const xx = x + r() * w;
    const yy = y + r() * h;
    const len = length * between(r, 0.45, 1.25);
    out += L(xx, yy, xx + slant * (len / length), yy + len, color, between(r, 0.45, 1.05), `opacity="${opacity * between(r, 0.35, 1)}"`);
  }
  return out;
}

function bird(x, y, s, seed, color = C.ink, opacity = 0.65) {
  const r = random(seed);
  const tilt = between(r, -0.25, 0.25);
  return G(
    P(`M${f(-15 * s)},${f(2 * s)} Q${f(-7 * s)},${f(-8 * s)} 0,0 Q${f(7 * s)},${f(-9 * s)} ${f(17 * s)},${f(-1 * s)}`, 'none', color, 1.65 * s, `opacity="${opacity}"`) +
      P(`M${f(-2 * s)},0 q${f(3 * s)},${f(2 * s)} ${f(7 * s)},${f(1.5 * s)}`, 'none', color, 0.8 * s, `opacity="${opacity * 0.65}"`),
    `transform="translate(${f(x)} ${f(y)}) rotate(${f(tilt * 35)})"`,
  );
}

function egret(x, y, s, seed, angle = 0) {
  const r = random(seed);
  const wing = between(r, 0.8, 1.2);
  const body = E(0, 0, 10 * s, 4.2 * s, C.paperLight, `stroke="${C.inkMid}" stroke-width="${f(0.85 * s)}"`) +
    P(`M${f(6 * s)},${f(-1 * s)} q${f(9 * s)},${f(-12 * s)} ${f(15 * s)},${f(-8 * s)} q${f(4 * s)},${f(2 * s)} ${f(7 * s)},0`, 'none', C.inkMid, 1.15 * s) +
    P(`M${f(-2 * s)},0 Q${f(-13 * s)},${f(-22 * s * wing)} ${f(-29 * s)},${f(-17 * s * wing)} Q${f(-16 * s)},${f(-2 * s)} ${f(-2 * s)},${f(3 * s)} Z`, C.paperLight, C.inkMid, 0.75 * s) +
    P(`M0,${f(1 * s)} Q${f(10 * s)},${f(17 * s * wing)} ${f(25 * s)},${f(14 * s * wing)} Q${f(15 * s)},${f(2 * s)} ${f(4 * s)},${f(-2 * s)} Z`, C.paperLight, C.inkMid, 0.75 * s) +
    L(-8 * s, 2 * s, -20 * s, 7 * s, C.inkMid, 0.7 * s);
  return G(body, `transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})"`);
}

function moon(cx, cy, r, seed, options = {}) {
  const { opacity = 0.9, halo = true, pale = false } = options;
  const rr = random(seed);
  let out = '';
  if (halo) {
    out += O(cx, cy, r * 1.28, C.warm, 'opacity="0.055" filter="url(#soft)"');
    out += O(cx, cy, r * 1.08, C.paperLight, 'opacity="0.24"');
  }
  out += O(cx, cy, r, pale ? C.paperLight : '#f1e5c6', `opacity="${opacity}"`);
  let marks = '';
  for (let i = 0; i < 9; i += 1) {
    const a = rr() * Math.PI * 2;
    const d = rr() * r * 0.65;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    marks += E(x, y, between(rr, r * 0.05, r * 0.18), between(rr, r * 0.025, r * 0.08), C.ochre, `opacity="${between(rr, 0.025, 0.07).toFixed(3)}" transform="rotate(${f(between(rr, -40, 40))} ${f(x)} ${f(y)})"`);
  }
  return out + marks;
}

function pinePad(cx, cy, rx, ry, seed, opacity = 0.7) {
  const r = random(seed);
  const pts = [];
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2;
    const k = between(r, 0.8, 1.16);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const d = closedSmooth(pts);
  let out = P(d, C.ink, 'none', 0, `opacity="${opacity * 0.2}"`);
  for (let i = 0; i < 48; i += 1) {
    const a = between(r, 0, Math.PI * 2);
    const rad = Math.sqrt(r());
    const x = cx + Math.cos(a) * rx * rad;
    const y = cy + Math.sin(a) * ry * rad;
    const dir = between(r, -2.75, -0.35);
    const len = between(r, 7, 18) * Math.max(0.55, rx / 60);
    out += P(`M${f(x)},${f(y)} q${f(Math.cos(dir) * len * 0.45)},${f(Math.sin(dir) * len * 0.25)} ${f(Math.cos(dir) * len)},${f(Math.sin(dir) * len)}`, 'none', i % 5 === 0 ? C.inkPale : C.ink, between(r, 0.6, 1.25), `opacity="${opacity * between(r, 0.36, 0.88)}"`);
  }
  return out;
}

function pine(x, y, s, seed, lean = 0, opacity = 0.85) {
  const r = random(seed);
  const h = 335 * s;
  const topX = x + lean * s;
  let out = P(`M${f(x - 9 * s)},${f(y)} C${f(x - 28 * s)},${f(y - h * 0.28)} ${f(x + 48 * s + lean * s * 0.25)},${f(y - h * 0.63)} ${f(topX)},${f(y - h)}`, 'none', C.ink, 13 * s, `opacity="${opacity * 0.18}"`);
  out += P(`M${f(x)},${f(y)} C${f(x - 18 * s)},${f(y - h * 0.3)} ${f(x + 42 * s + lean * s * 0.25)},${f(y - h * 0.66)} ${f(topX)},${f(y - h)}`, 'none', C.ink, 5.8 * s, `opacity="${opacity * 0.72}"`);
  out += P(`M${f(x + 2 * s)},${f(y - 4 * s)} C${f(x - 14 * s)},${f(y - h * 0.31)} ${f(x + 45 * s + lean * s * 0.25)},${f(y - h * 0.65)} ${f(topX + 2 * s)},${f(y - h + 4 * s)}`, 'none', C.ochrePale, 1.1 * s, `opacity="${opacity * 0.38}"`);
  for (let i = 0; i < 7; i += 1) {
    const t = 0.23 + i * 0.105;
    const side = i % 2 === 0 ? -1 : 1;
    const bx = x + lean * s * t + Math.sin(t * Math.PI * 2.15) * 21 * s;
    const by = y - h * t;
    const len = (105 - i * 8) * s * between(r, 0.82, 1.15);
    const ex = bx + side * len;
    const ey = by - between(r, 16, 42) * s;
    out += P(`M${f(bx)},${f(by)} Q${f(bx + side * len * 0.45)},${f(by + 8 * s)} ${f(ex)},${f(ey)}`, 'none', C.ink, Math.max(1.1, (4.6 - i * 0.4) * s), `opacity="${opacity * 0.7}"`);
    out += pinePad(ex, ey, Math.max(25, (67 - i * 3) * s), Math.max(11, (26 - i) * s), seed + 91 * (i + 1), opacity);
    out += pinePad(ex - side * 18 * s, ey + 7 * s, Math.max(19, (43 - i * 2) * s), Math.max(9, (18 - i * 0.6) * s), seed + 173 * (i + 1), opacity * 0.68);
    if (i < 4) {
      out += pinePad(bx + side * len * 0.48, by - 3 * s, 36 * s, 15 * s, seed + 307 * (i + 1), opacity * 0.72);
    }
  }
  out += pinePad(topX, y - h, 37 * s, 20 * s, seed + 991, opacity * 0.9);
  return G(out, `opacity="${opacity}"`);
}

function reeds(x, y, w, count, minH, maxH, seed, options = {}) {
  const { color = C.inkMid, opacity = 0.7, dew = false, heads = true, lean = 0 } = options;
  const r = random(seed);
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const bx = x + r() * w;
    const h = between(r, minH, maxH);
    const bend = between(r, -35, 35) + lean;
    const tx = bx + bend;
    const ty = y - h;
    const sw = between(r, 0.8, 2.1);
    out += P(`M${f(bx)},${f(y)} Q${f(bx - bend * 0.2)},${f(y - h * 0.55)} ${f(tx)},${f(ty)}`, 'none', color, sw, `opacity="${opacity * between(r, 0.48, 0.95)}"`);
    const leaves = 2 + Math.floor(r() * 3);
    for (let j = 0; j < leaves; j += 1) {
      const t = between(r, 0.18, 0.7);
      const sx = bx + bend * t * 0.6;
      const sy = y - h * t;
      const side = (j + i) % 2 === 0 ? -1 : 1;
      const ll = between(r, 32, 88);
      const ex = sx + side * ll + bend * 0.2;
      const ey = sy - between(r, 18, 60);
      out += P(`M${f(sx)},${f(sy)} Q${f(sx + side * ll * 0.38)},${f(sy - 9)} ${f(ex)},${f(ey)} Q${f(sx + side * ll * 0.4)},${f(sy + 8)} ${f(sx)},${f(sy)} Z`, color, 'none', 0, `opacity="${opacity * between(r, 0.35, 0.68)}"`);
      if (dew && r() > 0.72) {
        out += O(sx + side * ll * 0.42, sy - 9, between(r, 1.2, 2.4), C.paperLight, 'opacity="0.88"');
      }
    }
    if (heads && r() > 0.55) {
      out += P(`M${f(tx)},${f(ty + 4)} q${f(bend * 0.12)},${f(-18)} ${f(bend * 0.09)},${f(-42)}`, 'none', C.ochre, sw * 3.1, `opacity="${opacity * 0.5}"`);
      out += P(`M${f(tx + 2)},${f(ty)} q${f(bend * 0.1)},${f(-18)} ${f(bend * 0.08)},${f(-37)}`, 'none', C.ochrePale, sw * 1.1, `opacity="${opacity * 0.72}"`);
      out += P(`M${f(tx - 2)},${f(ty - 3)} l${f(-5)},-28 M${f(tx + 3)},${f(ty - 7)} l${f(6)},-25`, 'none', C.ochre, 0.75, `opacity="${opacity * 0.45}"`);
    }
  }
  return out;
}

function bamboo(x, y, s, h, seed, options = {}) {
  const { lean = 25, opacity = 0.65, color = C.ink } = options;
  const r = random(seed);
  const topX = x + lean * s;
  const topY = y - h * s;
  let out = P(`M${f(x)},${f(y)} Q${f(x + lean * s * 0.18)},${f(y - h * s * 0.5)} ${f(topX)},${f(topY)}`, 'none', color, 5 * s, `opacity="${opacity * 0.55}"`);
  out += P(`M${f(x + 2 * s)},${f(y)} Q${f(x + lean * s * 0.18 + 2 * s)},${f(y - h * s * 0.5)} ${f(topX + 2 * s)},${f(topY)}`, 'none', C.inkPale, 1 * s, `opacity="${opacity * 0.5}"`);
  for (let i = 1; i < 7; i += 1) {
    const t = i / 7;
    const nx = x + lean * s * t * 0.82;
    const ny = y - h * s * t;
    out += L(nx - 4 * s, ny, nx + 5 * s, ny - 1 * s, color, 1.25 * s, `opacity="${opacity * 0.7}"`);
    if (i < 2 || r() > 0.35) {
      const side = i % 2 ? -1 : 1;
      const ex = nx + side * between(r, 35, 70) * s;
      const ey = ny - between(r, 12, 35) * s;
      out += P(`M${f(nx)},${f(ny)} Q${f(nx + side * 24 * s)},${f(ny + 2 * s)} ${f(ex)},${f(ey)}`, 'none', color, 1.4 * s, `opacity="${opacity * 0.65}"`);
      for (let j = 0; j < 5; j += 1) {
        const tt = 0.25 + j * 0.15;
        const lx = nx + (ex - nx) * tt;
        const ly = ny + (ey - ny) * tt;
        const leafSide = j % 2 ? -1 : 1;
        const ll = between(r, 25, 44) * s;
        out += P(`M${f(lx)},${f(ly)} q${f(leafSide * ll * 0.5)},${f(-ll * 0.38)} ${f(leafSide * ll)},${f(-ll * 0.72)} q${f(-leafSide * ll * 0.25)},${f(ll * 0.42)} ${f(-leafSide * ll)},${f(ll * 0.72)} Z`, color, 'none', 0, `opacity="${opacity * between(r, 0.52, 0.88)}"`);
      }
    }
  }
  return out;
}

function figure(x, y, s, pose = 'gaze', options = {}) {
  const { color = C.ink, opacity = 0.8, flip = false } = options;
  let out = '';
  if (pose === 'fisher') {
    out += P('M-20,-25 Q0,-42 22,-24 L30,0 L-27,0 Z', color, color, 0.8, `opacity="${opacity * 0.72}"`);
    out += P('M-26,-38 Q0,-58 29,-37 Q3,-30 -26,-38 Z', C.ochrePale, color, 1, `opacity="${opacity}"`);
    out += O(1, -32, 5.5, C.ochrePale, `opacity="${opacity * 0.8}"`);
    out += P('M-15,-18 l9,17 M-4,-25 l6,24 M8,-24 l9,21 M18,-16 l6,12', 'none', C.paperLight, 1, `opacity="${opacity * 0.38}"`);
    out += P('M13,-20 Q30,-15 36,-4', 'none', color, 4, `opacity="${opacity * 0.7}"`);
    out += L(26, -18, 55, 30, C.inkMid, 1, `opacity="${opacity * 0.55}"`);
  } else if (pose === 'walk') {
    out += O(1, -67, 6.8, C.ochrePale, `stroke="${color}" stroke-width="1" opacity="${opacity}"`);
    out += P('M-4,-60 Q-20,-39 -16,-9 L-22,0 L-4,-3 L8,0 L19,-5 Q12,-35 8,-58 Z', color, color, 0.8, `opacity="${opacity * 0.74}"`);
    out += P('M-2,-55 Q-15,-34 -8,-14 M4,-50 Q11,-27 8,-8', 'none', C.paperLight, 1.1, `opacity="${opacity * 0.35}"`);
    out += P('M3,-53 Q20,-48 27,-31', 'none', color, 6, `opacity="${opacity * 0.75}"`);
    out += P('M26,-48 Q31,-20 39,8', 'none', C.ochre, 2.4, `opacity="${opacity}"`);
    out += P('M-7,-2 l-12,9 M9,-3 l13,5', 'none', color, 3, `opacity="${opacity * 0.8}"`);
    out += P('M-8,-73 Q2,-80 11,-71', 'none', color, 2.5, `opacity="${opacity * 0.75}"`);
  } else {
    out += O(0, -68, 6.5, C.ochrePale, `stroke="${color}" stroke-width="0.9" opacity="${opacity}"`);
    out += O(-1, -76, 2.8, color, `opacity="${opacity * 0.85}"`);
    out += P('M-6,-60 Q-20,-42 -17,-10 L-23,0 Q-4,5 20,0 L14,-13 Q17,-42 7,-60 Z', color, color, 0.8, `opacity="${opacity * 0.75}"`);
    out += P('M-2,-57 Q-7,-33 -3,-7 M5,-54 Q11,-31 8,-8', 'none', C.paperLight, 1, `opacity="${opacity * 0.32}"`);
    if (pose === 'wine') {
      out += P('M4,-54 Q17,-62 29,-69', 'none', color, 5.5, `opacity="${opacity * 0.78}"`);
      out += P('M27,-73 l10,0 l-2,5 l-6,0 Z', C.ochrePale, color, 0.8, `opacity="${opacity}"`);
      out += P('M-5,-51 Q-17,-42 -20,-28', 'none', color, 5, `opacity="${opacity * 0.65}"`);
    } else {
      out += P('M-4,-53 Q-18,-42 -23,-31 M5,-53 Q16,-43 20,-31', 'none', color, 5, `opacity="${opacity * 0.68}"`);
    }
  }
  return G(out, `transform="translate(${f(x)} ${f(y)}) scale(${flip ? -s : s} ${s})"`);
}

function boat(x, y, s, seed, options = {}) {
  const { cabin = false, lantern = false, fisher = false, opacity = 0.8, color = C.ink } = options;
  const r = random(seed);
  let out = P('M-93,-4 Q-55,11 30,8 Q70,5 96,-10 Q56,20 -17,20 Q-67,17 -93,-4 Z', color, color, 1, `opacity="${opacity * 0.65}"`);
  out += P('M-96,-7 Q-42,4 23,1 Q65,-1 96,-12', 'none', C.paperLight, 1.5, `opacity="${opacity * 0.48}"`);
  out += P('M-78,23 q54,8 117,0 M-53,29 q35,5 79,0', 'none', C.inkPale, 1, `opacity="${opacity * 0.35}"`);
  if (cabin) {
    out += P('M-37,1 Q-30,-42 9,-43 Q45,-39 51,0 Z', C.inkMid, color, 1.2, `opacity="${opacity * 0.42}"`);
    out += P('M-43,-1 Q-32,-49 10,-49 Q49,-44 56,-2', 'none', color, 2.2, `opacity="${opacity * 0.75}"`);
    out += P('M-19,-38 L-19,0 M7,-45 L7,0 M32,-37 L32,0', 'none', C.paperLight, 1.1, `opacity="${opacity * 0.38}"`);
  }
  if (fisher) out += figure(43, -1, 0.56, 'fisher', { opacity });
  if (lantern) {
    out += L(-48, -2, -48, -42, color, 1.4, `opacity="${opacity}"`);
    out += O(-48, -35, 18, C.warm, 'opacity="0.12" filter="url(#soft)"');
    out += E(-48, -34, 5.5, 8, C.warm, `stroke="${C.ochre}" stroke-width="0.8" opacity="0.96"`);
  }
  for (let i = 0; i < 4; i += 1) {
    out += P(`M${f(between(r, -65, 55))},${f(between(r, 5, 12))} l${f(between(r, 8, 19))},-1`, 'none', C.paperLight, 0.7, `opacity="${opacity * 0.3}"`);
  }
  return G(out, `transform="translate(${f(x)} ${f(y)}) scale(${s})"`);
}

function chrysanthemum(x, y, s, seed, options = {}) {
  const { color = C.ochrePale, opacity = 0.9 } = options;
  const r = random(seed);
  let out = '';
  for (let ring = 0; ring < 2; ring += 1) {
    const petals = ring === 0 ? 13 : 9;
    for (let i = 0; i < petals; i += 1) {
      const a = (i / petals) * 360 + ring * 17 + between(r, -5, 5);
      const len = (ring === 0 ? 17 : 11) * s * between(r, 0.85, 1.12);
      out += P(`M0,0 Q${f(-3.8 * s)},${f(-len * 0.55)} 0,${f(-len)} Q${f(4.2 * s)},${f(-len * 0.48)} 0,0 Z`, color, C.ochre, 0.45 * s, `opacity="${opacity * (ring ? 0.75 : 0.58)}" transform="rotate(${f(a)})"`);
    }
  }
  out += O(0, 0, 3.5 * s, C.ochre, `opacity="${opacity * 0.8}"`);
  return G(out, `transform="translate(${f(x)} ${f(y)})"`);
}

function blossom(x, y, s, seed, color = '#d8b1a1', opacity = 0.8) {
  const r = random(seed);
  let out = '';
  for (let i = 0; i < 5; i += 1) {
    out += E(0, -5.5 * s, 3.8 * s, 6.5 * s, color, `opacity="${opacity * between(r, 0.55, 0.9)}" transform="rotate(${i * 72})"`);
  }
  out += O(0, 0, 1.8 * s, C.ochre, `opacity="${opacity}"`);
  return G(out, `transform="translate(${f(x)} ${f(y)}) rotate(${f(between(r, -30, 30))})"`);
}

function lotusLeaf(x, y, rx, ry, seed, options = {}) {
  const { opacity = 0.45, rotation = 0, color = C.inkMid } = options;
  const r = random(seed);
  const pts = [];
  for (let i = 0; i <= 24; i += 1) {
    const a = (i / 24) * Math.PI * 2;
    const k = i === 0 ? 0.25 : between(r, 0.92, 1.08);
    pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]);
  }
  let out = P(closedSmooth(pts), color, color, 0.8, `opacity="${opacity * 0.38}"`);
  out += P(`M0,0 L${f(rx * 0.92)},0 M0,0 L${f(-rx * 0.62)},${f(-ry * 0.56)} M0,0 L${f(rx * 0.28)},${f(ry * 0.82)} M0,0 L${f(-rx * 0.45)},${f(ry * 0.65)}`, 'none', color, 0.65, `opacity="${opacity * 0.6}"`);
  return G(out, `transform="translate(${f(x)} ${f(y)}) rotate(${f(rotation)})"`);
}

function lotus(x, y, s, seed, options = {}) {
  const { opacity = 0.85, color = '#cf9d91' } = options;
  let out = P(`M0,${f(13 * s)} C${f(-23 * s)},${f(2 * s)} ${f(-22 * s)},${f(-20 * s)} ${f(-13 * s)},${f(-25 * s)} C${f(-8 * s)},${f(-9 * s)} ${f(-4 * s)},${f(3 * s)} 0,${f(13 * s)} Z`, C.paperLight, color, 0.75 * s, `opacity="${opacity * 0.85}"`);
  out += P(`M0,${f(13 * s)} C${f(23 * s)},${f(2 * s)} ${f(22 * s)},${f(-20 * s)} ${f(13 * s)},${f(-25 * s)} C${f(8 * s)},${f(-9 * s)} ${f(4 * s)},${f(3 * s)} 0,${f(13 * s)} Z`, C.paperLight, color, 0.75 * s, `opacity="${opacity * 0.85}"`);
  out += P(`M${f(-9 * s)},${f(7 * s)} Q${f(-13 * s)},${f(-26 * s)} 0,${f(-36 * s)} Q${f(13 * s)},${f(-25 * s)} ${f(9 * s)},${f(7 * s)} Z`, color, color, 0.55 * s, `opacity="${opacity * 0.55}"`);
  out += P(`M${f(-5 * s)},0 Q0,${f(-20 * s)} ${f(5 * s)},0`, 'none', C.paperLight, 1 * s, `opacity="${opacity * 0.7}"`);
  return G(out, `transform="translate(${f(x)} ${f(y)}) rotate(${f((seed % 17) - 8)})"`);
}

function cloudRibbon(points, width, opacity = 0.18, color = C.mist) {
  const d = smooth(points);
  return P(d, 'none', color, width, `opacity="${opacity * 0.35}" filter="url(#soft)"`) +
    P(d, 'none', color, Math.max(1, width * 0.12), `opacity="${opacity}"`);
}

function paulowniaLeaf(x, y, s, rotation, color = C.inkMid, opacity = 0.5) {
  const d = `M0,${f(15 * s)} C${f(-7 * s)},${f(9 * s)} ${f(-20 * s)},${f(7 * s)} ${f(-20 * s)},${f(-5 * s)} C${f(-19 * s)},${f(-17 * s)} ${f(-7 * s)},${f(-20 * s)} 0,${f(-12 * s)} C${f(8 * s)},${f(-22 * s)} ${f(21 * s)},${f(-15 * s)} ${f(20 * s)},${f(-4 * s)} C${f(20 * s)},${f(8 * s)} ${f(6 * s)},${f(10 * s)} 0,${f(15 * s)} Z`;
  return G(P(d, color, color, 0.7, `opacity="${opacity * 0.55}"`) + P(`M0,${f(13 * s)} L0,${f(-11 * s)} M0,2 L${f(-12 * s)},${f(-5 * s)} M0,1 L${f(12 * s)},${f(-6 * s)}`, 'none', C.paperLight, 0.65, `opacity="${opacity * 0.5}"`), `transform="translate(${f(x)} ${f(y)}) rotate(${f(rotation)})"`);
}

function pavilion(x, y, s, opacity = 0.6) {
  let out = P('M-92,-70 Q-48,-77 -20,-101 Q-9,-111 0,-122 Q11,-108 25,-99 Q57,-76 99,-72 Q61,-58 25,-66 L-29,-66 Q-63,-57 -92,-70 Z', C.ink, C.ink, 1, `opacity="${opacity * 0.48}"`);
  out += P('M-103,-72 Q-55,-83 -22,-106 Q-8,-117 0,-126 Q15,-109 29,-102 Q63,-80 108,-74', 'none', C.ink, 2.2, `opacity="${opacity * 0.85}"`);
  out += P('M-67,-63 L-67,12 M62,-63 L62,12 M-24,-64 L-24,8 M23,-64 L23,8', 'none', C.inkMid, 4, `opacity="${opacity * 0.62}"`);
  out += P('M-77,13 L73,13 M-84,21 L82,21 M-66,-2 L61,-2 M-48,-2 L-48,13 M-12,-2 L-12,13 M25,-2 L25,13 M51,-2 L51,13', 'none', C.inkMid, 2, `opacity="${opacity * 0.56}"`);
  out += P('M-94,25 L92,25 L76,36 L-76,36 Z', C.inkMid, C.inkMid, 1, `opacity="${opacity * 0.24}"`);
  return G(out, `transform="translate(${f(x)} ${f(y)}) scale(${s})"`);
}

function temple(x, y, s, opacity = 0.16) {
  let out = '';
  for (let i = 0; i < 2; i += 1) {
    const yy = -i * 52;
    const ww = 74 - i * 14;
    out += P(`M${-ww},${yy - 29} Q${-ww * 0.45},${yy - 35} 0,${yy - 58} Q${ww * 0.45},${yy - 35} ${ww},${yy - 29} Q${ww * 0.4},${yy - 20} 0,${yy - 25} Q${-ww * 0.4},${yy - 20} ${-ww},${yy - 29} Z`, C.inkMid, 'none', 0, `opacity="${opacity}"`);
    out += P(`M${-ww * 0.55},${yy - 24} L${-ww * 0.55},${yy + 7} M${ww * 0.55},${yy - 24} L${ww * 0.55},${yy + 7} M0,${yy - 26} L0,${yy + 7}`, 'none', C.inkMid, 3, `opacity="${opacity}"`);
  }
  out += P('M-63,9 L65,9', 'none', C.inkMid, 2, `opacity="${opacity}"`);
  return G(out, `transform="translate(${f(x)} ${f(y)}) scale(${s})"`);
}

function lantern(x, y, s, seed, options = {}) {
  const { dim = false, color = C.warm, opacity = 0.95 } = options;
  const r = random(seed);
  const o = dim ? opacity * 0.45 : opacity;
  let out = O(0, 0, 28 * s, color, `opacity="${dim ? 0.035 : 0.09}" filter="url(#soft)"`);
  out += P(`M${f(-8 * s)},${f(-12 * s)} Q0,${f(-18 * s)} ${f(8 * s)},${f(-12 * s)} L${f(10 * s)},${f(9 * s)} Q0,${f(16 * s)} ${f(-10 * s)},${f(9 * s)} Z`, color, C.ochre, 0.75 * s, `opacity="${o}"`);
  out += L(-8 * s, -13 * s, 8 * s, -13 * s, C.inkMid, 1 * s, `opacity="${o * 0.6}"`);
  out += L(-9 * s, 10 * s, 9 * s, 10 * s, C.inkMid, 1 * s, `opacity="${o * 0.6}"`);
  out += P(`M0,${f(12 * s)} q${f(between(r, -2, 2) * s)},${f(7 * s)} 0,${f(15 * s)}`, 'none', C.cinnabar, 0.9 * s, `opacity="${o * 0.55}"`);
  out += P(`M${f(-4 * s)},${f(-9 * s)} Q${f(-6 * s)},0 ${f(-4 * s)},${f(8 * s)} M${f(4 * s)},${f(-9 * s)} Q${f(6 * s)},0 ${f(4 * s)},${f(8 * s)}`, 'none', C.paperLight, 0.65 * s, `opacity="${o * 0.55}"`);
  return G(out, `transform="translate(${f(x)} ${f(y)})"`);
}

function sceneJianjia(seed) {
  const r = random(seed);
  let body = ridge(560, 565, 880, 150, seed + 1, { opacity: 0.055, detail: 5 });
  body += P('M420,577 Q620,548 787,566 T1130,551 Q1320,544 1536,572 L1536,624 Q1290,597 1100,610 T690,604 Q520,615 420,597 Z', C.inkPale, 'none', 0, 'opacity="0.12"');
  body += P('M845,565 Q990,548 1165,556 Q1270,558 1380,573', 'none', C.inkMid, 1.1, 'opacity="0.18"');
  body += figure(1138, 559, 0.42, 'gaze', { opacity: 0.48, flip: true });
  body += P('M-80,520 C310,485 570,553 903,523 C1130,502 1350,505 1610,534 L1610,603 C1270,572 1040,591 790,576 C480,557 260,597 -80,566 Z', C.paperLight, 'none', 0, 'opacity="0.58" filter="url(#haze)"');
  body += water(460, 625, 900, 18, seed + 2, { opacity: 0.17, span: 190, gap: 17 });
  body += P('M0,854 Q355,809 713,854 T1536,839 L1536,1024 L0,1024 Z', C.inkPale, 'none', 0, 'opacity="0.035"');
  body += reeds(1310, 1045, 250, 24, 180, 430, seed + 3, { opacity: 0.48, dew: true, lean: -18 });
  body += reeds(-35, 1055, 515, 54, 260, 615, seed + 4, { opacity: 0.77, dew: true, lean: 24, color: C.inkMid });
  body += reeds(95, 1028, 380, 22, 120, 280, seed + 5, { opacity: 0.5, dew: true, heads: false, lean: -8 });
  for (let i = 0; i < 14; i += 1) {
    const x = between(r, 40, 430);
    const y = between(r, 900, 1015);
    body += P(`M${f(x)},${f(y)} q${f(between(r, 8, 26))},-3 ${f(between(r, 34, 65))},0`, 'none', C.inkPale, 0.75, 'opacity="0.28"');
  }
  return svgDoc(body, seed);
}

function sceneYinJiu(seed) {
  const r = random(seed);
  let body = ridge(615, 510, 850, 270, seed + 11, { opacity: 0.075, detail: 9, color: C.inkPale });
  body += ridge(770, 565, 680, 155, seed + 12, { opacity: 0.09, detail: 6 });
  body += P('M0,702 Q360,650 689,701 Q953,726 1220,661 Q1390,637 1536,664 L1536,1024 L0,1024 Z', C.ochrePale, 'none', 0, 'opacity="0.075"');
  for (let i = 0; i < 6; i += 1) {
    body += bird(970 + i * 52 + between(r, -12, 12), 255 + Math.sin(i * 0.9) * 35, between(r, 0.55, 0.85), seed + 30 + i, C.inkMid, 0.48);
  }
  body += P('M685,771 Q835,721 1000,743 Q1130,761 1268,736', 'none', C.inkPale, 2, 'opacity="0.18"');
  body += figure(884, 755, 1.05, 'gaze', { opacity: 0.77 });
  body += P('M864,757 q19,5 42,0', 'none', C.inkMid, 1, 'opacity="0.35"');
  const fence = [];
  for (let i = 0; i < 8; i += 1) {
    const x = 98 + i * 88;
    const y = 800 - i * 8;
    fence.push([x, y]);
    body += P(`M${x},${y + 77} L${x + between(r, -5, 5)},${y - 50}`, 'none', C.ochre, between(r, 4, 6), 'opacity="0.48"');
    body += P(`M${x - 5},${y - 22} l12,-1 M${x - 5},${y + 24} l12,-1`, 'none', C.inkMid, 1, 'opacity="0.35"');
  }
  body += P(smooth(fence.map((p) => [p[0], p[1] - 20])), 'none', C.ochre, 4.2, 'opacity="0.5"');
  body += P(smooth(fence.map((p) => [p[0], p[1] + 35])), 'none', C.ochre, 3.5, 'opacity="0.42"');
  body += rock(180, 962, 1.25, seed + 40, { color: C.ochre, opacity: 0.5 });
  body += rock(530, 975, 0.82, seed + 41, { color: C.inkMid, opacity: 0.35 });
  const flowers = [
    [174, 848, 1.1], [244, 813, 1.25], [314, 872, 0.9], [385, 805, 1.05],
    [453, 866, 1.22], [531, 822, 0.82], [582, 900, 1.08], [338, 934, 0.8], [106, 910, 0.78],
  ];
  flowers.forEach(([x, y, s], i) => {
    const baseY = 968 + (i % 3) * 7;
    body += P(`M${x + 5},${baseY} Q${x - 14},${(baseY + y) / 2} ${x},${y + 9}`, 'none', C.inkMid, 1.6, 'opacity="0.65"');
    body += P(`M${x},${y + 65} q-28,-18 -37,-3 q18,17 37,3 M${x + 2},${y + 91} q25,-20 39,-5 q-16,18 -39,5`, C.inkMid, C.inkMid, 0.5, 'opacity="0.22"');
    body += chrysanthemum(x, y, s, seed + 100 + i, { opacity: 0.94, color: i % 3 === 0 ? '#ded0a8' : C.ochrePale });
  });
  for (let i = 0; i < 22; i += 1) {
    const x = between(r, 30, 730);
    const y = between(r, 935, 1015);
    body += P(`M${x},${y} q${between(r, -8, 8)},-18 ${between(r, -14, 14)},-29`, 'none', C.inkMid, 0.8, 'opacity="0.3"');
  }
  return svgDoc(body, seed);
}

function sceneShanJu(seed) {
  let body = moon(1090, 238, 84, seed + 1, { opacity: 0.9 });
  body += ridge(450, 520, 1000, 250, seed + 2, { opacity: 0.06, detail: 9, color: C.inkPale });
  body += ridge(300, 625, 1070, 245, seed + 3, { opacity: 0.105, detail: 14 });
  body += P('M-60,545 C300,514 582,568 853,538 C1120,510 1330,531 1590,511 L1590,583 C1260,603 1080,566 833,591 C500,620 260,567 -60,612 Z', C.paperLight, 'none', 0, 'opacity="0.46" filter="url(#haze)"');
  body += pine(1015, 663, 0.96, seed + 4, -18, 0.29);
  body += pine(1270, 675, 0.69, seed + 5, 15, 0.24);
  body += P('M1042,601 C967,671 1094,715 999,770 C915,819 917,895 737,1024 L1092,1024 C1163,916 1191,851 1141,785 C1087,714 1170,664 1164,601 Z', '#afc1ba', 'none', 0, 'opacity="0.22" filter="url(#soft)"');
  body += P('M1082,606 C1020,680 1121,715 1040,783 C970,841 984,907 846,1024', 'none', C.paperLight, 24, 'opacity="0.32"');
  body += water(1060, 641, 300, 7, seed + 6, { opacity: 0.19, span: 125, gap: 18 });
  body += boat(1232, 676, 0.43, seed + 7, { fisher: true, opacity: 0.57 });
  for (let i = 0; i < 7; i += 1) {
    body += bamboo(1320 + i * 25, 665 + (i % 2) * 12, 0.36, 180 + (i % 3) * 25, seed + 20 + i, { lean: i % 2 ? -25 : 20, opacity: 0.24, color: C.inkMid });
  }
  body += rock(1002, 841, 1.15, seed + 31, { color: '#65827e', opacity: 0.58 });
  body += rock(1138, 913, 1.45, seed + 32, { color: '#65827e', opacity: 0.62 });
  body += rock(795, 962, 1.38, seed + 33, { color: '#65827e', opacity: 0.62 });
  body += rock(649, 1015, 1.8, seed + 34, { color: C.inkMid, opacity: 0.58 });
  body += rock(1248, 1018, 1.25, seed + 35, { color: C.inkMid, opacity: 0.46 });
  body += water(820, 875, 320, 8, seed + 36, { opacity: 0.23, span: 115, gap: 18, color: '#65827e' });
  body += pine(502, 799, 0.73, seed + 40, 18, 0.46);
  body += pine(355, 904, 1.19, seed + 41, -25, 0.76);
  body += pine(120, 970, 1.57, seed + 42, 38, 0.9);
  body += pine(-25, 838, 0.98, seed + 43, 15, 0.64);
  body += P('M0,962 Q179,910 346,945 Q453,967 567,938 L664,1024 L0,1024 Z', C.ink, 'none', 0, 'opacity="0.11"');
  body += P('M42,991 Q202,946 371,979 M178,1011 Q326,980 479,1001', 'none', C.inkMid, 1.3, 'opacity="0.32"');
  for (let i = 0; i < 11; i += 1) {
    const x = 740 + i * 34;
    const y = 944 + Math.sin(i) * 26;
    body += P(`M${x},${y} q12,-3 25,0`, 'none', C.paperLight, 1.3, 'opacity="0.55"');
  }
  return svgDoc(body, seed, '#f2ede0');
}

function sceneJingYe(seed) {
  let body = P('M0,747 Q530,738 1010,749 T1536,741', 'none', C.inkPale, 1.1, 'opacity="0.13"');
  body += P('M1030,554 L1378,554 L1120,1024 L455,1024 Z', C.paperLight, 'none', 0, 'opacity="0.52" filter="url(#soft)"');
  body += P('M1000,565 L1330,565 L1050,1005 L560,1005 Z', '#e5ddc7', 'none', 0, 'opacity="0.15"');
  body += P('M954,132 L1372,132 L1372,582 L954,582 Z', C.inkPale, 'none', 0, 'opacity="0.075"');
  body += moon(1228, 274, 69, seed + 2, { opacity: 0.88, pale: true });
  body += P('M1390,182 Q1288,248 1245,370 Q1208,464 1100,533 M1325,264 Q1255,262 1201,221 M1242,374 Q1310,351 1362,376', 'none', C.inkMid, 6, 'opacity="0.13" filter="url(#soft)"');
  const shadowLeaves = [[1290, 252, 1.4, -22], [1205, 219, 1.1, 30], [1265, 376, 1.45, 12], [1355, 379, 1.2, -35], [1165, 468, 1.35, 42]];
  shadowLeaves.forEach(([x, y, s, a]) => { body += paulowniaLeaf(x, y, s, a, C.inkMid, 0.17); });
  body += P('M944,122 L1383,122 L1383,593 L944,593 Z M959,138 L959,577 L1367,577 L1367,138 Z', C.ink, C.ink, 1.2, 'opacity="0.5" fill-rule="evenodd"');
  body += P('M1149,136 L1149,579 M957,360 L1369,360', 'none', C.ink, 7, 'opacity="0.42"');
  body += P('M1155,139 L1155,576 M961,366 L1365,366', 'none', C.ochrePale, 1.2, 'opacity="0.34"');
  body += P('M973,151 L973,343 M973,379 L973,558 M1338,152 L1338,337 M1338,383 L1338,556', 'none', C.ochrePale, 0.8, 'opacity="0.24"');
  body += P('M420,180 Q514,323 636,397 Q736,454 794,631 M554,352 Q477,362 400,324 M659,412 Q704,339 748,307', 'none', C.inkMid, 12, 'opacity="0.055" filter="url(#soft)"');
  const wallLeaves = [[399, 322, 1.8, 18], [480, 363, 1.45, -25], [739, 310, 1.7, 36], [684, 430, 1.6, -12], [790, 617, 1.9, 28]];
  wallLeaves.forEach(([x, y, s, a]) => { body += paulowniaLeaf(x, y, s, a, C.inkMid, 0.1); });
  body += P('M164,733 L587,733 L624,788 L193,788 Z', C.inkMid, C.inkMid, 1.2, 'opacity="0.24"');
  body += P('M182,710 Q340,686 559,709 L588,753 Q375,773 187,749 Z', C.paperLight, C.inkPale, 1.2, 'opacity="0.88"');
  body += P('M188,749 Q375,771 588,753 L580,805 Q390,832 196,797 Z', '#d8d6c9', C.inkPale, 0.8, 'opacity="0.38"');
  body += P('M211,758 Q298,779 384,771 M414,774 Q489,774 561,762 M290,715 Q315,734 309,763', 'none', C.inkPale, 1, 'opacity="0.3"');
  body += P('M184,787 L184,859 M593,785 L593,850 M221,800 L218,842 M557,803 L554,841', 'none', C.ink, 6, 'opacity="0.48"');
  body += P('M156,730 L156,642 Q165,629 176,643 L176,731 M147,653 L187,653', 'none', C.ink, 5, 'opacity="0.4"');
  body += P('M128,867 Q370,848 633,868 M203,892 Q397,879 563,890', 'none', C.inkPale, 1, 'opacity="0.17"');
  body += paulowniaLeaf(745, 899, 0.72, 62, C.ochre, 0.25);
  return svgDoc(body, seed, '#f3eee4');
}

function mapleLeaf(x, y, s, rotation, color = C.ochre, opacity = 0.65) {
  const d = `M0,${f(15 * s)} L${f(-3 * s)},${f(4 * s)} L${f(-12 * s)},${f(8 * s)} L${f(-10 * s)},${f(-1 * s)} L${f(-19 * s)},${f(-5 * s)} L${f(-10 * s)},${f(-10 * s)} L${f(-12 * s)},${f(-19 * s)} L${f(-4 * s)},${f(-14 * s)} L0,${f(-25 * s)} L${f(4 * s)},${f(-14 * s)} L${f(12 * s)},${f(-19 * s)} L${f(10 * s)},${f(-9 * s)} L${f(19 * s)},${f(-5 * s)} L${f(10 * s)},${f(-1 * s)} L${f(12 * s)},${f(8 * s)} L${f(3 * s)},${f(4 * s)} Z`;
  return G(P(d, color, color, 0.6, `opacity="${opacity * 0.72}"`) + L(0, 11 * s, 0, -14 * s, C.paperLight, 0.65, `opacity="${opacity * 0.45}"`), `transform="translate(${f(x)} ${f(y)}) rotate(${f(rotation)})"`);
}

function sceneChunYe(seed) {
  const r = random(seed);
  let body = P('M-90,104 Q95,28 266,93 Q390,28 567,96 Q759,38 916,122 Q1100,87 1240,154 Q1400,106 1620,174 L1620,368 Q1390,330 1190,365 Q1000,398 801,334 Q612,385 430,327 Q199,376 -90,302 Z', C.night, 'none', 0, 'opacity="0.16" filter="url(#soft)"');
  body += P('M-70,216 Q145,150 342,218 Q531,166 721,241 Q939,176 1112,248 Q1330,203 1600,283 L1600,413 Q1320,361 1102,405 Q870,434 685,376 Q440,425 240,362 Q87,390 -70,352 Z', C.ink, 'none', 0, 'opacity="0.1" filter="url(#haze)"');
  body += ridge(-90, 628, 890, 180, seed + 1, { opacity: 0.11, detail: 8, color: C.night });
  body += P('M0,659 Q271,599 502,620 Q657,633 783,594 Q650,687 487,709 Q278,725 0,827 Z', C.ink, 'none', 0, 'opacity="0.13"');
  body += P('M0,768 Q250,678 472,665 Q585,657 684,620 Q559,703 401,733 Q220,768 0,881 Z', C.ochrePale, 'none', 0, 'opacity="0.13"');
  body += P('M675,605 Q978,567 1221,604 Q1402,629 1536,600 L1536,1024 L528,1024 Q694,876 675,605 Z', '#55706d', 'none', 0, 'opacity="0.14"');
  body += water(736, 654, 770, 18, seed + 2, { opacity: 0.19, span: 210, gap: 20, color: C.inkMid });
  body += boat(1122, 708, 0.78, seed + 3, { cabin: true, lantern: true, opacity: 0.88 });
  body += P('M1082,752 q38,7 84,0 M1094,769 q25,5 56,0', 'none', C.warm, 2.2, 'opacity="0.32"');
  body += P('M1084,787 q30,4 65,0 M1101,803 q17,3 35,0', 'none', C.ochre, 1.1, 'opacity="0.22"');
  body += rain(30, 200, 1490, 650, 190, seed + 4, { opacity: 0.23, slant: -13, length: 35, color: C.inkMid });
  body += P('M-35,1005 Q98,881 189,797 Q284,714 444,664 M76,906 Q103,796 78,717 M177,810 Q263,799 340,738 M273,745 Q309,681 309,624 M358,702 Q420,715 486,689', 'none', C.ink, 8, 'opacity="0.52"');
  body += P('M-28,1004 Q105,884 192,801 Q291,718 444,668 M80,904 Q107,797 82,720 M180,814 Q265,802 340,742 M276,744 Q311,684 311,629', 'none', C.ochrePale, 1.2, 'opacity="0.4"');
  body += P('M76,719 q-33,-32 -57,-11 M309,627 q25,-37 53,-31 M441,666 q33,-28 61,-16', 'none', C.inkMid, 2.3, 'opacity="0.48"');
  const blooms = [[78, 714, 1.2], [113, 770, 0.9], [181, 798, 1.15], [239, 779, 0.85], [305, 632, 1.12], [337, 738, 1.25], [399, 690, 0.85], [444, 664, 1.18], [481, 689, 0.78], [359, 600, 0.82], [25, 884, 0.92]];
  blooms.forEach(([x, y, s], i) => {
    body += blossom(x, y, s, seed + 50 + i, i % 3 === 0 ? '#d6aaa0' : '#dfc2b3', 0.88);
    if (i % 2 === 0) body += O(x + 7, y - 7, 1.5, C.paperLight, 'opacity="0.85"');
  });
  for (let i = 0; i < 9; i += 1) {
    const x = between(r, 190, 570);
    const y = between(r, 830, 990);
    body += E(x, y, between(r, 2, 4), between(r, 4, 7), '#d6aaa0', `opacity="${between(r, 0.25, 0.55).toFixed(3)}" transform="rotate(${f(between(r, -60, 60))} ${f(x)} ${f(y)})"`);
  }
  return svgDoc(body, seed, '#f1ede2');
}

function sceneFengQiao(seed) {
  const r = random(seed);
  let body = P('M160,331 Q307,300 460,337 Q619,366 763,329 L796,383 Q608,407 438,376 Q291,352 139,390 Z', C.mist, 'none', 0, 'opacity="0.26" filter="url(#soft)"');
  body += moon(306, 341, 61, seed + 1, { opacity: 0.74, pale: true, halo: true });
  body += P('M194,358 Q303,339 424,363', 'none', C.mist, 13, 'opacity="0.2" filter="url(#soft)"');
  body += ridge(500, 574, 980, 205, seed + 2, { opacity: 0.07, detail: 8, color: C.inkPale });
  body += temple(1210, 501, 0.85, 0.13);
  body += P('M1080,518 Q1210,485 1368,535', 'none', C.inkMid, 1.2, 'opacity="0.13"');
  for (let i = 0; i < 5; i += 1) {
    body += bird(414 + i * 57, 261 + Math.sin(i * 1.4) * 42, between(r, 0.62, 0.94), seed + 10 + i, C.ink, 0.67);
  }
  body += P('M0,712 Q330,678 590,705 Q875,735 1102,688 Q1320,656 1536,701 L1536,1024 L0,1024 Z', C.inkPale, 'none', 0, 'opacity="0.075"');
  body += water(280, 754, 1130, 13, seed + 3, { opacity: 0.18, span: 205, gap: 19 });
  body += P('M420,700 Q710,494 1000,700', 'none', C.inkMid, 19, 'opacity="0.32"');
  body += P('M445,707 Q710,542 975,707', 'none', C.inkMid, 6.5, 'opacity="0.36"');
  body += P('M420,655 Q710,449 1000,655', 'none', C.inkMid, 3.2, 'opacity="0.45"');
  for (let i = 0; i <= 10; i += 1) {
    const t = i / 10;
    const x = 420 + 580 * t;
    const y = 700 * (1 - t) * (1 - t) + 2 * 494 * t * (1 - t) + 700 * t * t;
    body += L(x, y - 4, x, y - 47, C.inkMid, 2.1, 'opacity="0.42"');
  }
  body += P('M419,699 L413,776 M1001,699 L1007,771 M449,727 Q710,835 974,727', 'none', C.inkMid, 2.2, 'opacity="0.22"');
  body += boat(1165, 832, 0.86, seed + 4, { cabin: true, lantern: true, opacity: 0.76 });
  body += P('M1050,886 Q1160,901 1290,884 M1090,908 Q1170,917 1240,906', 'none', C.inkPale, 1.2, 'opacity="0.25"');
  body += P('M76,1024 Q107,810 113,635 Q121,469 192,331 M112,657 Q222,562 343,538 M139,504 Q71,435 20,420 M172,401 Q255,353 302,278 M215,567 Q277,613 367,620', 'none', C.ink, 12, 'opacity="0.5"');
  body += P('M83,1024 Q114,812 120,637 Q128,474 195,337 M117,657 Q225,568 341,542 M175,405 Q253,359 300,283', 'none', C.ochrePale, 1.4, 'opacity="0.3"');
  body += P('M191,334 Q212,276 197,221 M302,280 Q356,263 390,220 M341,540 Q404,501 449,506 M22,422 Q-4,368 -24,352', 'none', C.inkMid, 3, 'opacity="0.47"');
  const leaves = [[194, 224, 0.8, -8], [231, 301, 0.72, 34], [302, 276, 0.95, -20], [386, 221, 0.78, 27], [338, 532, 0.92, 16], [442, 506, 0.72, -32], [362, 619, 0.8, 44], [72, 438, 0.9, -18], [20, 418, 0.7, 32], [124, 511, 0.78, -40], [270, 586, 0.67, 12]];
  leaves.forEach(([x, y, s, a], i) => { body += mapleLeaf(x, y, s, a, i % 4 === 0 ? C.cinnabar : C.ochre, i % 4 === 0 ? 0.48 : 0.58); });
  for (let i = 0; i < 22; i += 1) {
    const x = between(r, 460, 1460);
    const y = between(r, 100, 540);
    body += O(x, y, between(r, 0.6, 1.35), C.paperLight, `opacity="${between(r, 0.35, 0.72).toFixed(3)}"`);
  }
  return svgDoc(body, seed, '#f2efe7');
}

function sceneJiangXue(seed) {
  const r = random(seed);
  let body = ridge(-120, 518, 980, 370, seed + 1, { opacity: 0.17, detail: 24, snow: true, color: '#718c88' });
  body += ridge(570, 535, 1080, 325, seed + 2, { opacity: 0.145, detail: 22, snow: true, color: '#718c88' });
  body += P('M0,510 L114,442 L178,462 L280,353 L350,409 L431,392 L553,514 Z', '#a9bcb7', 'none', 0, 'opacity="0.2"');
  body += P('M713,527 L835,424 L908,451 L1048,335 L1117,404 L1202,382 L1378,528 Z', '#a9bcb7', 'none', 0, 'opacity="0.17"');
  body += P('M119,458 Q180,439 221,399 Q197,456 251,487 M827,436 Q901,423 950,382 Q923,442 984,477 M1061,355 Q1091,389 1134,405', 'none', '#607d79', 1.25, 'opacity="0.3"');
  body += P('M235,408 Q274,430 292,480 T361,521 M1027,390 Q1004,441 1061,470 T1138,526', 'none', '#607d79', 1.1, 'opacity="0.24"');
  body += P('M-80,515 C280,490 540,550 810,522 C1090,494 1320,526 1610,502 L1610,597 C1270,579 1060,603 779,581 C500,558 260,600 -80,572 Z', C.paperLight, 'none', 0, 'opacity="0.75" filter="url(#haze)"');
  body += P('M0,592 Q330,576 610,595 T1190,584 Q1370,575 1536,589', 'none', '#829995', 1.2, 'opacity="0.22"');
  body += P('M515,682 Q810,646 1102,678 Q1300,700 1536,664 L1536,835 Q1270,806 1030,828 Q770,849 515,807 Z', '#b7c8c3', 'none', 0, 'opacity="0.085" filter="url(#soft)"');
  body += water(690, 704, 650, 7, seed + 3, { opacity: 0.24, span: 155, gap: 24, color: '#607d79' });
  body += boat(1015, 786, 0.78, seed + 4, { fisher: true, opacity: 0.9, color: '#31514e' });
  body += P('M934,831 Q1012,841 1101,830 M968,849 Q1024,854 1070,848', 'none', '#718c88', 1.15, 'opacity="0.3"');
  body += P('M0,941 Q137,918 266,944 Q340,960 411,951 L441,1024 L0,1024 Z', '#b7c5c0', 'none', 0, 'opacity="0.09"');
  body += reeds(28, 1005, 190, 8, 65, 148, seed + 5, { opacity: 0.22, heads: false, lean: 9, color: '#718c88' });
  for (let i = 0; i < 24; i += 1) {
    body += O(between(r, 40, 1490), between(r, 80, 680), between(r, 0.8, 1.8), C.paperLight, `opacity="${between(r, 0.5, 0.95)}"`);
  }
  return svgDoc(body, seed, '#f2f0e9');
}

function sceneShuiDiao(seed) {
  let body = moon(1100, 252, 122, seed + 1, { opacity: 0.93 });
  body += temple(688, 443, 1.05, 0.055);
  body += cloudRibbon([[440, 477], [650, 450], [835, 475], [1030, 449], [1300, 472], [1570, 431]], 40, 0.14, C.mist);
  body += cloudRibbon([[514, 603], [730, 568], [934, 601], [1150, 567], [1400, 590], [1580, 560]], 58, 0.18, C.inkPale);
  body += P('M500,688 Q738,622 963,676 Q1180,724 1536,625 L1536,1024 L420,1024 Q649,873 500,688 Z', C.inkPale, 'none', 0, 'opacity="0.055"');
  body += cloudRibbon([[476, 763], [694, 725], [904, 774], [1124, 735], [1340, 779], [1570, 730]], 44, 0.17, C.inkMid);
  body += water(694, 845, 760, 8, seed + 2, { opacity: 0.12, span: 220, gap: 23, color: C.inkPale });
  body += P('M0,693 Q113,662 228,685 L489,684 L454,735 L393,748 L351,850 L276,887 L218,1024 L0,1024 Z', C.inkMid, C.inkMid, 1, 'opacity="0.14"');
  body += P('M0,742 Q116,703 218,730 L336,718 L283,805 L237,833 L196,1024 L0,1024 Z', C.ink, 'none', 0, 'opacity="0.09"');
  body += P('M87,733 Q167,710 246,730 M198,784 L282,761 M142,858 L237,822 M90,934 L180,889 M330,749 L298,807 M365,726 L348,760', 'none', C.inkMid, 1.6, 'opacity="0.35"');
  body += P('M142,679 L492,679 L473,700 L151,700 Z', C.ochrePale, C.inkMid, 1.1, 'opacity="0.34"');
  body += P('M174,677 L174,622 M251,679 L251,622 M333,679 L333,622 M413,679 L413,622 M485,679 L485,622 M163,625 L494,625', 'none', C.inkMid, 2.4, 'opacity="0.48"');
  body += P('M170,645 L487,645', 'none', C.inkPale, 1, 'opacity="0.35"');
  body += figure(365, 675, 1.08, 'wine', { opacity: 0.82 });
  body += P('M336,679 q32,7 66,0', 'none', C.inkMid, 1, 'opacity="0.35"');
  body += cloudRibbon([[24, 581], [190, 557], [334, 579], [454, 554]], 25, 0.12, C.mist);
  return svgDoc(body, seed, '#f3eee2');
}

function sceneDingFeng(seed) {
  let body = O(1215, 231, 91, C.warm, 'opacity="0.09" filter="url(#soft)"');
  body += O(1215, 231, 67, '#ead8ad', 'opacity="0.57"');
  body += P('M1134,284 L828,747 L1018,747 L1260,282 Z', C.warm, 'none', 0, 'opacity="0.065" filter="url(#soft)"');
  body += P('M1265,278 L1110,698 L1260,698 L1305,276 Z', C.warm, 'none', 0, 'opacity="0.045" filter="url(#soft)"');
  body += ridge(440, 570, 1040, 245, seed + 1, { opacity: 0.075, detail: 10, color: C.inkPale });
  body += ridge(-100, 646, 920, 190, seed + 2, { opacity: 0.085, detail: 9 });
  body += cloudRibbon([[730, 290], [895, 267], [1040, 290], [1135, 274]], 37, 0.21, C.inkMid);
  body += cloudRibbon([[1280, 272], [1390, 250], [1548, 278]], 31, 0.18, C.inkMid);
  body += P('M0,817 Q300,745 567,792 Q815,837 1050,738 Q1280,667 1536,727 L1536,1024 L0,1024 Z', C.ochrePale, 'none', 0, 'opacity="0.095"');
  body += P('M395,1024 Q571,875 812,825 Q1030,782 1220,715 Q1080,828 923,870 Q753,918 692,1024 Z', C.paperLight, 'none', 0, 'opacity="0.43"');
  body += rain(10, 130, 940, 690, 118, seed + 3, { opacity: 0.21, slant: -15, length: 33 });
  body += rain(1030, 370, 450, 390, 32, seed + 4, { opacity: 0.12, slant: -15, length: 29 });
  for (let i = 0; i < 9; i += 1) {
    body += bamboo(15 + i * 55, 1008 - (i % 3) * 28, 0.82 + (i % 3) * 0.12, 370 + (i % 4) * 47, seed + 20 + i, { lean: 35 + (i % 2) * 28, opacity: 0.57 + (i % 3) * 0.08 });
  }
  for (let i = 0; i < 4; i += 1) {
    body += bamboo(1435 + i * 36, 980, 0.62, 290 + i * 37, seed + 40 + i, { lean: -45, opacity: 0.3, color: C.inkMid });
  }
  body += P('M806,828 Q901,803 1008,816 M763,870 Q882,843 970,858 M569,949 Q675,916 750,925', 'none', C.inkPale, 1.2, 'opacity="0.26"');
  body += figure(928, 817, 1.22, 'walk', { opacity: 0.83 });
  body += P('M888,822 q41,9 86,0', 'none', C.inkMid, 1, 'opacity="0.3"');
  body += P('M1030,899 q42,5 82,-2 M1071,919 q25,3 49,-1 M656,968 q37,4 71,-2', 'none', '#7f9991', 1.2, 'opacity="0.22"');
  body += P('M1176,764 Q1190,755 1205,762 M1210,747 Q1222,739 1234,745', 'none', C.ochre, 1.1, 'opacity="0.28"');
  return svgDoc(body, seed, '#f3eee1');
}

function sceneRuMeng(seed) {
  const r = random(seed);
  let body = P('M0,0 L1536,0 L1536,420 Q1240,386 1010,423 Q690,459 430,402 Q213,369 0,410 Z', '#b9a7a2', 'none', 0, 'opacity="0.065"');
  body += ridge(480, 526, 1010, 168, seed + 1, { opacity: 0.06, detail: 7, color: '#8e9992' });
  body += P('M0,599 Q215,545 418,576 Q620,607 775,561 Q1030,519 1260,563 Q1400,586 1536,554 L1536,654 Q1300,637 1100,650 Q840,665 640,632 Q300,610 0,679 Z', C.inkPale, 'none', 0, 'opacity="0.11"');
  body += pavilion(323, 568, 1.06, 0.55);
  body += P('M0,635 Q180,598 348,624 Q472,643 591,619 L534,681 Q283,666 0,720 Z', C.ochrePale, 'none', 0, 'opacity="0.11"');
  body += P('M0,719 Q335,644 605,711 Q830,765 1040,668 Q1270,590 1536,669 L1536,1024 L0,1024 Z', '#aebfba', 'none', 0, 'opacity="0.1"');
  body += water(542, 684, 930, 15, seed + 2, { opacity: 0.18, span: 170, gap: 20 });
  body += reeds(1160, 687, 370, 25, 80, 190, seed + 3, { opacity: 0.3, heads: false, lean: 12 });
  body += boat(890, 749, 0.67, seed + 4, { opacity: 0.73 });
  body += figure(927, 737, 0.56, 'gaze', { opacity: 0.66, flip: true });
  const leaves = [[98, 830, 91, 35, -8], [236, 773, 82, 30, 14], [373, 858, 104, 38, -16], [522, 783, 75, 29, 22], [643, 899, 96, 35, 4], [135, 968, 111, 38, 12], [421, 987, 88, 31, -20], [746, 814, 62, 24, 17], [58, 728, 62, 23, -12], [292, 928, 73, 28, 30]];
  leaves.forEach(([x, y, rx, ry, a], i) => { body += lotusLeaf(x, y, rx, ry, seed + 30 + i, { opacity: 0.54, rotation: a }); });
  const lotuses = [[197, 754, 0.85], [390, 808, 1.0], [542, 734, 0.78], [662, 853, 0.93], [83, 904, 0.82], [300, 895, 0.72], [762, 773, 0.63]];
  lotuses.forEach(([x, y, s], i) => {
    body += P(`M${x},${y + 85} Q${x - 7},${y + 42} ${x},${y + 8}`, 'none', C.inkMid, 1.4, 'opacity="0.48"');
    body += lotus(x, y, s, seed + 70 + i, { opacity: 0.9, color: i % 2 ? '#c8948c' : '#d3a49a' });
  });
  const birds = [[1130, 661, 0.9, -20], [1212, 606, 1.02, 14], [1305, 559, 0.82, -12], [1163, 523, 0.74, 25], [1370, 466, 1.0, -17], [1250, 411, 0.78, 18], [1420, 366, 0.88, -8], [1095, 436, 0.66, 32], [1322, 668, 0.72, -28]];
  birds.forEach(([x, y, s, a], i) => { body += egret(x, y, s, seed + 90 + i, a); });
  body += P('M1048,708 q38,-9 75,-2 M1100,730 q52,-8 94,0 M1190,691 q28,-6 58,-1', 'none', C.inkPale, 1.1, 'opacity="0.32"');
  for (let i = 0; i < 8; i += 1) {
    body += O(between(r, 1120, 1370), between(r, 600, 730), between(r, 1, 2.2), C.paperLight, 'opacity="0.75"');
  }
  return svgDoc(body, seed, '#f3ede2');
}

function sceneShengSheng(seed) {
  const r = random(seed);
  let body = P('M0,804 Q350,764 706,806 Q1070,845 1536,780 L1536,1024 L0,1024 Z', C.inkPale, 'none', 0, 'opacity="0.065"');
  for (let i = 0; i < 6; i += 1) {
    body += bird(154 + i * 52, 205 + Math.sin(i * 0.8) * 27, 0.46 + i * 0.035, seed + 1 + i, C.inkMid, 0.36);
  }
  body += P('M1074,269 L1388,269 L1388,678 L1074,678 Z', '#d4d7cc', 'none', 0, 'opacity="0.24"');
  body += P('M1092,290 L1367,290 L1367,654 L1092,654 Z', C.paperLight, 'none', 0, 'opacity="0.38"');
  body += rain(1098, 296, 260, 350, 43, seed + 10, { opacity: 0.2, slant: -7, length: 30 });
  body += P('M1062,257 L1400,257 L1400,690 L1062,690 Z M1078,275 L1078,672 L1384,672 L1384,275 Z', C.ink, C.ink, 1, 'opacity="0.45" fill-rule="evenodd"');
  body += P('M1229,274 L1229,673 M1077,405 L1385,405 M1077,539 L1385,539', 'none', C.inkMid, 5, 'opacity="0.36"');
  body += P('M1050,692 L1414,692 L1388,716 L1070,716 Z', C.inkMid, 'none', 0, 'opacity="0.24"');
  body += P('M1030,738 L1435,738 M1000,770 L1460,770', 'none', C.inkPale, 1.3, 'opacity="0.25"');
  body += P('M182,1024 Q236,827 246,654 Q258,469 337,260 M244,690 Q152,580 74,553 M264,543 Q385,464 487,443 M300,392 Q232,302 172,275 M328,294 Q405,248 449,174', 'none', C.ink, 15, 'opacity="0.37"');
  body += P('M191,1024 Q244,829 253,654 Q265,474 341,267 M249,690 Q158,584 79,558 M269,545 Q386,470 487,448 M304,392 Q238,306 176,280', 'none', C.ochrePale, 1.5, 'opacity="0.28"');
  body += P('M75,554 Q39,492 3,473 M486,444 Q544,399 604,409 M172,277 Q126,234 76,238 M449,176 Q488,139 510,93', 'none', C.inkMid, 3.4, 'opacity="0.36"');
  const leaves = [[76, 548, 1.45, -28], [147, 596, 1.25, 20], [480, 442, 1.55, -12], [588, 410, 1.15, 34], [172, 274, 1.4, 8], [82, 238, 1.1, -35], [337, 282, 1.4, 30], [449, 174, 1.28, -15], [510, 96, 0.95, 20], [265, 491, 1.15, -42], [226, 736, 1.35, 40]];
  leaves.forEach(([x, y, s, a], i) => { body += paulowniaLeaf(x, y, s, a, i % 4 === 0 ? C.ochre : C.inkMid, i % 4 === 0 ? 0.3 : 0.46); });
  body += rain(20, 140, 990, 690, 126, seed + 20, { opacity: 0.17, slant: -8, length: 34 });
  const fallen = [[130, 921, 0.55], [253, 875, 0.48], [374, 949, 0.62], [521, 891, 0.43], [657, 970, 0.58], [801, 902, 0.45], [934, 977, 0.52], [1102, 861, 0.4], [1290, 934, 0.44]];
  fallen.forEach(([x, y, s], i) => { body += chrysanthemum(x, y, s, seed + 40 + i, { color: '#cbb477', opacity: 0.55 }); });
  for (let i = 0; i < 36; i += 1) {
    const x = between(r, 50, 1390);
    const y = between(r, 840, 1010);
    body += E(x, y, between(r, 2, 4.5), between(r, 4, 8), i % 5 === 0 ? C.ochre : '#cbb477', `opacity="${between(r, 0.2, 0.48).toFixed(3)}" transform="rotate(${f(between(r, -75, 75))} ${f(x)} ${f(y)})"`);
  }
  body += P('M56,986 Q261,956 455,986 M764,1005 Q959,975 1180,997', 'none', C.inkPale, 0.9, 'opacity="0.18"');
  return svgDoc(body, seed, '#f2eee5');
}

function festivalCart(x, y, s, opacity = 0.5) {
  let out = E(-55, -26, 34, 18, C.inkMid, `opacity="${opacity * 0.58}"`);
  out += P('M-79,-32 Q-91,-57 -78,-73 L-62,-68 L-53,-38 M-82,-72 l-10,-9 M-72,-72 l4,-13', 'none', C.inkMid, 7, `opacity="${opacity * 0.7}"`);
  out += P('M-82,-15 L-88,16 M-54,-10 L-49,17 M-31,-16 L-25,13', 'none', C.inkMid, 3, `opacity="${opacity * 0.72}"`);
  out += P('M-21,-29 L18,-25 M-26,-21 L17,-17', 'none', C.ochre, 1.7, `opacity="${opacity * 0.6}"`);
  out += P('M15,-55 L96,-55 L108,2 L8,2 Z', C.inkMid, C.inkMid, 1, `opacity="${opacity * 0.3}"`);
  out += P('M4,-56 Q50,-103 101,-57 L91,-49 L15,-49 Z', C.ink, C.inkMid, 1, `opacity="${opacity * 0.45}"`);
  out += P('M25,-48 L25,-4 M82,-48 L82,-4', 'none', C.paperLight, 1.2, `opacity="${opacity * 0.4}"`);
  out += O(29, 8, 18, 'none', `stroke="${C.inkMid}" stroke-width="3" opacity="${opacity * 0.72}"`);
  out += O(88, 8, 18, 'none', `stroke="${C.inkMid}" stroke-width="3" opacity="${opacity * 0.72}"`);
  out += O(29, 8, 3, C.inkMid, `opacity="${opacity * 0.6}"`);
  out += O(88, 8, 3, C.inkMid, `opacity="${opacity * 0.6}"`);
  return G(out, `transform="translate(${f(x)} ${f(y)}) scale(${s})"`);
}

function dancer(x, y, s, seed, opacity = 0.42) {
  const r = random(seed);
  const flip = r() > 0.5 ? -1 : 1;
  let out = O(0, -49, 4.7, C.inkMid, `opacity="${opacity}"`);
  out += P('M-4,-43 Q-13,-26 -12,-4 L-19,3 Q0,8 18,2 L10,-7 Q12,-29 5,-43 Z', C.inkMid, 'none', 0, `opacity="${opacity * 0.72}"`);
  out += P('M-3,-39 Q-20,-58 -35,-67 Q-32,-47 -11,-29 Z M4,-38 Q20,-55 33,-63 Q31,-44 11,-28 Z', C.inkMid, 'none', 0, `opacity="${opacity * 0.52}"`);
  out += P('M-3,-39 Q-23,-51 -33,-65 M4,-38 Q22,-48 31,-61', 'none', C.inkMid, 2.4, `opacity="${opacity * 0.75}"`);
  out += P('M-33,-65 Q-51,-82 -61,-57 Q-49,-66 -41,-53 M31,-61 Q49,-76 59,-52 Q48,-62 40,-49', 'none', C.ochre, 1.4, `opacity="${opacity * 0.62}"`);
  return G(out, `transform="translate(${f(x)} ${f(y)}) scale(${f(s * flip)} ${f(s)})"`);
}

function sceneQingYu(seed) {
  const r = random(seed);
  let body = P('M0,0 L1536,0 L1536,568 Q1230,527 982,567 Q674,607 442,548 Q212,508 0,552 Z', C.night, 'none', 0, 'opacity="0.075"');
  body += P('M0,643 Q284,586 553,622 Q822,656 1040,610 Q1280,572 1536,624 L1536,817 Q1260,768 1040,803 Q731,845 483,779 Q241,735 0,797 Z', C.inkPale, 'none', 0, 'opacity="0.08"');
  body += P('M617,582 L617,506 L676,506 L676,574 M604,509 Q644,482 689,507 M735,589 L735,529 L793,529 L793,587 M723,531 Q759,505 807,531 M1000,587 L1000,523 L1052,523 L1052,581 M987,525 Q1025,498 1066,525', 'none', C.inkMid, 2, 'opacity="0.12"');
  body += P('M530,690 Q812,656 1135,690', 'none', C.inkMid, 2.2, 'opacity="0.2"');
  body += festivalCart(750, 689, 0.82, 0.53);
  body += dancer(978, 675, 0.85, seed + 1, 0.43);
  body += dancer(1040, 681, 0.74, seed + 2, 0.4);
  body += dancer(1100, 668, 0.9, seed + 3, 0.38);
  body += dancer(1160, 687, 0.67, seed + 4, 0.34);
  for (let i = 0; i < 12; i += 1) {
    const x = 550 + i * 51 + between(r, -9, 9);
    const y = 696 + between(r, -10, 14);
    body += O(x, y - 27, 3.4, C.inkMid, 'opacity="0.25"');
    body += P(`M${f(x - 4)},${f(y - 22)} L${f(x - 7)},${f(y)} L${f(x + 7)},${f(y)} L${f(x + 4)},${f(y - 22)} Z`, C.inkMid, 'none', 0, 'opacity="0.2"');
  }
  body += E(617, 765, 410, 52, C.warm, 'opacity="0.045" filter="url(#soft)"');
  body += P('M104,1024 Q149,830 172,671 Q194,501 278,320 Q314,244 310,136 M173,680 Q302,574 457,548 M213,492 Q118,414 28,394 M265,349 Q404,302 530,320 M303,237 Q227,177 145,177 M333,289 Q426,210 478,121 M450,550 Q548,494 635,510', 'none', C.ink, 13, 'opacity="0.47"');
  body += P('M113,1024 Q158,831 181,672 Q202,505 285,323 Q320,244 316,139 M179,680 Q306,580 459,554 M219,493 Q123,419 32,399 M270,353 Q405,308 530,325 M309,239 Q231,183 148,182', 'none', C.ochrePale, 1.4, 'opacity="0.32"');
  body += P('M310,137 Q343,83 332,33 M530,321 Q600,281 668,300 M478,122 Q514,78 509,31 M145,177 Q88,147 39,161 M28,395 Q-13,352 -35,304 M635,510 Q685,481 728,492', 'none', C.inkMid, 3.2, 'opacity="0.42"');
  const twigs = [[310, 140], [530, 321], [478, 122], [457, 548], [278, 320], [145, 177], [635, 510], [213, 492]];
  twigs.forEach(([x, y]) => {
    for (let j = 0; j < 4; j += 1) {
      const side = j % 2 ? -1 : 1;
      const ex = x + side * between(r, 24, 68);
      const ey = y - between(r, 24, 72);
      body += P(`M${x},${y} Q${f((x + ex) / 2 + side * 8)},${f((y + ey) / 2 + 7)} ${f(ex)},${f(ey)}`, 'none', C.inkMid, 1.15, 'opacity="0.36"');
      body += O(ex, ey, between(r, 1.8, 3.3), C.warm, 'opacity="0.72"');
      if (j < 2) body += O((x + ex) / 2 + side * 6, (y + ey) / 2, 1.7, C.warm, 'opacity="0.55"');
    }
  });
  const lamps = [[309, 118, 0.78], [333, 57, 0.58], [150, 189, 0.85], [65, 168, 0.62], [278, 301, 0.75], [402, 287, 0.95], [527, 333, 0.7], [614, 302, 0.56], [477, 142, 0.84], [510, 55, 0.55], [195, 434, 0.72], [77, 411, 0.9], [26, 357, 0.58], [330, 575, 0.78], [450, 564, 0.98], [552, 518, 0.67], [635, 523, 0.82], [704, 496, 0.54], [169, 676, 0.72], [246, 633, 0.6], [110, 803, 0.68], [380, 412, 0.6], [460, 376, 0.55], [232, 246, 0.58]];
  lamps.forEach(([x, y, s], i) => {
    body += L(x, y - 22 * s, x, y - 11 * s, C.inkMid, 0.8, 'opacity="0.45"');
    body += lantern(x, y, s, seed + 30 + i, { color: i % 9 === 0 ? '#cf8b6c' : C.warm, opacity: i % 9 === 0 ? 0.72 : 0.93 });
  });
  for (let i = 0; i < 32; i += 1) {
    const x = between(r, 50, 670);
    const y = between(r, 95, 630);
    body += O(x, y, between(r, 1.2, 2.7), C.warm, `opacity="${between(r, 0.28, 0.7).toFixed(3)}"`);
  }
  body += P('M1500,1024 Q1465,904 1458,792 Q1450,707 1401,641 M1457,804 Q1377,754 1326,761 M1430,686 Q1482,634 1538,622', 'none', C.inkMid, 4.2, 'opacity="0.28"');
  body += L(1370, 723, 1370, 778, C.inkMid, 1.1, 'opacity="0.45"');
  body += lantern(1370, 795, 0.92, seed + 90, { dim: true, color: '#dfc58f', opacity: 0.85 });
  body += E(1328, 917, 142, 28, C.warm, 'opacity="0.035" filter="url(#soft)"');
  body += figure(1285, 893, 1.24, 'gaze', { opacity: 0.74, flip: true });
  body += P('M1253,897 q34,8 70,0', 'none', C.inkMid, 1.1, 'opacity="0.28"');
  body += P('M1190,939 Q1302,920 1420,940', 'none', C.inkPale, 1, 'opacity="0.19"');
  return svgDoc(body, seed, '#f2ecdf');
}

function paperSvg() {
  const r = random(9202417);
  let body = '<rect width="256" height="256" fill="#f5f1e8"/>';
  for (let i = 0; i < 92; i += 1) {
    const x = between(r, 10, 232);
    const y = between(r, 10, 246);
    const len = between(r, 2, 10);
    if (r() > 0.78) {
      body += L(x, y, x + between(r, -0.6, 0.6), Math.min(250, y + len), '#877c67', between(r, 0.3, 0.55), `opacity="${between(r, 0.025, 0.055).toFixed(3)}"`);
    } else {
      body += L(x, y, Math.min(250, x + len), y + between(r, -0.8, 0.8), '#877c67', between(r, 0.3, 0.55), `opacity="${between(r, 0.025, 0.055).toFixed(3)}"`);
    }
  }
  for (let i = 0; i < 128; i += 1) {
    body += O(between(r, 4, 252), between(r, 4, 252), between(r, 0.3, 0.7), '#756b58', `opacity="${between(r, 0.025, 0.06).toFixed(3)}"`);
  }
  for (let i = 0; i < 24; i += 1) {
    const x = between(r, 10, 235);
    const y = between(r, 10, 246);
    body += L(x, y, Math.min(250, x + between(r, 3, 9)), y, '#ffffff', 0.65, 'opacity="0.22"');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">${body}</svg>\n`;
}

const scenes = [
  ['jianjia.webp', sceneJianjia],
  ['yin-jiu-qi-wu.webp', sceneYinJiu],
  ['shan-ju-qiu-ming.webp', sceneShanJu],
  ['jing-ye-si.webp', sceneJingYe],
  ['chun-ye-xi-yu.webp', sceneChunYe],
  ['feng-qiao-ye-bo.webp', sceneFengQiao],
  ['jiang-xue.webp', sceneJiangXue],
  ['shui-diao-ge-tou.webp', sceneShuiDiao],
  ['ding-feng-bo.webp', sceneDingFeng],
  ['ru-meng-ling.webp', sceneRuMeng],
  ['sheng-sheng-man.webp', sceneShengSheng],
  ['qing-yu-an-yuan-xi.webp', sceneQingYu],
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(TEXTURES, { recursive: true });
  fs.writeFileSync(path.join(TEXTURES, 'paper.svg'), paperSvg());
  for (const [name, paint] of scenes) {
    const svg = paint(seedOf(`poem-ink:${name}`));
    const target = path.join(OUT, name);
    await sharp(Buffer.from(svg)).webp({ quality: 87, effort: 6 }).toFile(target);
    const meta = await sharp(target).metadata();
    if (meta.width !== W || meta.height !== H || meta.format !== 'webp') {
      throw new Error(`Invalid output: ${name}`);
    }
    const bytes = fs.statSync(target).size;
    console.log(`${name}\t${meta.width}x${meta.height}\t${meta.format}\t${bytes} bytes`);
  }
  console.log('paper.svg\t256x256\tsvg');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
