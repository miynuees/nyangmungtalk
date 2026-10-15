// 냥멍이 도트 그림 — 38×30칸. 원래 SVG(150×118)와 같은 부품 id(꼬리·머리·귀·앞발·눈·입)를 그대로 만들어서
// index.html의 움직임(CSS 애니메이션)을 하나도 안 고치고 그대로 씀.
// 부품마다 칸을 따로 갖고 있어서(가려진 칸 포함) 머리가 움직여도 몸에 구멍이 안 생김.
(function () {
  const GW = 38, GH = 30, CX = 19;          // 가운데 세로줄 = 18·19번 칸 사이
  const SCALE = 150 / GW;                    // 칸 → 원래 SVG 좌표
  const N = GW * GH;
  const Z = { tail: 0, body: 1, earC: 2, head: 3, earD: 4, paw: 5 };

  function mix(a, b, t) {
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    return '#' + [16, 8, 0].map(s => Math.round(((A >> s) & 255) + ((((B >> s) & 255) - ((A >> s) & 255)) * t)).toString(16).padStart(2, '0')).join('');
  }
  function lum(h) { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
  const inEll = (x, y, cx, cy, rx, ry) => { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; return dx * dx + dy * dy <= 1; };
  function inTri(x, y, a, b, c) {
    const px = x + .5, py = y + .5;
    const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
    const d1 = s([px, py], a, b), d2 = s([px, py], b, c), d3 = s([px, py], c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }
  const ok = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH;

  // 부품 = 칸마다 색(없으면 null)
  function part(z) { return { z, col: new Array(N).fill(null) }; }
  function ell(P, cx, cy, rx, ry, c) { for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (inEll(x, y, cx, cy, rx, ry)) P.col[y * GW + x] = c; }
  function ellPaint(P, cx, cy, rx, ry, c) { for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (inEll(x, y, cx, cy, rx, ry) && P.col[y * GW + x]) P.col[y * GW + x] = c; }
  function tri(P, a, b, c, col) { for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (inTri(x, y, a, b, c)) P.col[y * GW + x] = col; }
  function triPaint(P, a, b, c, col) { for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (inTri(x, y, a, b, c) && P.col[y * GW + x]) P.col[y * GW + x] = col; }
  // 글자 그림 찍기 ('.'은 건너뜀). mirror면 좌우 대칭 자리에도
  function stamp(arr, x0, y0, rows, map, mirror, onlyFilled) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.' || !map[ch]) return;
      for (const x of mirror ? [x0 + i, GW - 1 - (x0 + i)] : [x0 + i]) {
        const y = y0 + j; if (!ok(x, y)) continue;
        if (onlyFilled && !arr[y * GW + x]) continue;
        arr[y * GW + x] = map[ch];
      }
    }));
  }
  // 혼자 있는 그림(소품·흔드는 손)에 테두리
  function selfOutline(col, oc) {
    const out = col.slice();
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const i = y * GW + x; if (!col[i]) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (!ok(X, Y) || !col[Y * GW + X]) { out[i] = typeof oc === 'function' ? oc(col[i]) : oc; break; }
      }
    }
    return out;
  }

  // 칸 배열 → SVG 사각형 (가로로 같은 색이 이어지면 한 덩어리로)
  function rects(col) {
    let s = '';
    for (let y = 0; y < GH; y++) {
      let x = 0;
      while (x < GW) {
        const c = col[y * GW + x];
        if (!c) { x++; continue; }
        let w = 1; while (x + w < GW && col[y * GW + x + w] === c) w++;
        s += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${c}"/>`;
        x += w;
      }
    }
    return s ? `<g class="px" transform="translate(0,-0.4) scale(${SCALE})">${s}</g>` : '';
  }
  const layer = arr => rects(arr);
  const blankArr = () => new Array(N).fill(null);

  function build(species, p) {
    const dog = species === 'dog';
    const fur = p.fur, dark = p.dark, belly = p.belly, line = p.line;
    const HY = 13.6;
    const outline = lum(fur) < 0.45 ? mix(fur, '#241d2a', 0.45) : lum(fur) > 0.93 ? mix(dark, '#6b4c58', 0.36) : mix(dark, '#6b4c58', 0.3);

    // ── 부품 모양 ──
    const tail = part(Z.tail), body = part(Z.body), head = part(Z.head);
    const earL = part(dog ? Z.earD : Z.earC), earR = part(dog ? Z.earD : Z.earC);
    const pawL = part(Z.paw), pawR = part(Z.paw);

    const tailRows = dog
      ? [[31, 20, '##'], [30, 21, '####'], [30, 22, '####'], [29, 23, '####'], [27, 24, '#####'], [26, 25, '#####'], [26, 26, '####']]
      : [[32, 18, '###'], [31, 19, '####'], [31, 20, '####'], [31, 21, '####'], [30, 22, '####'], [29, 23, '####'], [27, 24, '#####'], [26, 25, '#####'], [26, 26, '####']];
    tailRows.forEach(([x0, y, row]) => [...row].forEach((ch, i) => { if (ch === '#') tail.col[y * GW + x0 + i] = fur; }));

    ell(body, CX, 25.4, 9.8, 4.6, fur);
    if (Math.abs(lum(belly) - lum(fur)) > 0.25) ell(body, CX, 26.6, 4.2, 2.6, belly);
    if (p.patch2 && !dog) ellPaint(body, 24.6, 23.2, 2.4, 1.8, p.patch2);

    if (!dog) {
      tri(earL, [7.2, 10.6], [7.6, -0.6], [15.8, 5], fur);
      tri(earR, [38 - 7.2, 10.6], [38 - 7.6, -0.6], [38 - 15.8, 5], fur);
      // 귀 끝에 혼자 튀어나온 한 칸 지우기
      for (const E of [earL, earR]) for (let y = 0; y < 6; y++) {
        const xs = []; for (let x = 0; x < GW; x++) if (E.col[y * GW + x]) xs.push(x);
        if (!xs.length) continue;
        if (xs.length === 1) E.col[y * GW + xs[0]] = null;
        break;
      }
      triPaint(earL, [9.4, 8], [9.4, 2.4], [14, 5], p.ear);
      triPaint(earR, [38 - 9.4, 8], [38 - 9.4, 2.4], [38 - 14, 5], p.ear);
    } else {
      ell(earL, 7.8, 13.6, 2.7, 5.6, p.ear);
      ell(earR, 38 - 7.8, 13.6, 2.7, 5.6, p.ear);
    }

    ell(head, CX, HY, 12.6, 9.6, fur);
    if (!dog) {
      if (p.stripes) {
        stamp(head.col, 18, 5, ['SS', 'SS', 'SS'], { S: dark }, false, true);
        stamp(head.col, 15, 5, ['S', 'S'], { S: dark }, true, true);
        stamp(head.col, 8, 13, ['SS', '..', 'SS'], { S: dark }, true, true);
      }
      if (p.patch1) ellPaint(head, 13.4, 6.6, 3.6, 2.8, p.patch1);
      if (p.patch2) ellPaint(head, 26.2, 5.8, 2.4, 1.9, p.patch2);
    } else {
      if (p.patch1) ellPaint(head, 23.6, 13.4, 3.5, 3.4, p.patch1);
      ellPaint(head, CX, 17.8, 4.4, 2.8, belly);
      if (p.stripes) stamp(head.col, 13, 10, ['BB'], { B: belly }, true, true);
    }

    ell(pawL, 15, 28.4, 2.6, 1.7, fur);
    ell(pawR, 23, 28.4, 2.6, 1.7, fur);

    const parts = [tail, body, earL, earR, head, pawL, pawR];

    // ── 맨 위에 보이는 부품 높이 지도 → 테두리 ──
    const top = new Int8Array(N).fill(-1);
    parts.forEach(P => P.col.forEach((c, i) => { if (c && P.z > top[i]) top[i] = P.z; }));
    const T = (x, y) => ok(x, y) ? top[y * GW + x] : -1;
    const isOl = (P, x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => T(x + dx, y + dy) < P.z);
    // 계단 모서리 깎기 (바깥 테두리가 ㄱ자로 겹친 칸 → 빈칸)
    const topOl = new Array(N).fill(false);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const z = top[y * GW + x]; if (z < 0) continue;
      topOl[y * GW + x] = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => T(x + dx, y + dy) < z);
    }
    const O = (x, y) => ok(x, y) && topOl[y * GW + x];
    const cut = new Set();
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      if (!topOl[y * GW + x]) continue;
      for (const hx of [-1, 1]) for (const vy of [-1, 1])
        if (O(x + hx, y) && O(x, y + vy) && T(x + hx, y + vy) >= 0 && T(x - hx, y) < 0 && T(x, y - vy) < 0) cut.add(y * GW + x);
    }
    const final = parts.map(P => {
      const out = P.col.slice();
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        const i = y * GW + x; if (!P.col[i]) continue;
        if (cut.has(i)) { out[i] = null; continue; }
        if (isOl(P, x, y)) out[i] = outline;
      }
      return out;
    });
    const [fTail, fBody, fEarL, fEarR, fHead, fPawL, fPawR] = final;
    fPawL[29 * GW + 15] = fPawL[29 * GW + 15] && outline;   // 발가락 금
    fPawR[29 * GW + 23] = fPawR[29 * GW + 23] && outline;

    // 강아지 목걸이: 턱선 바로 아래 몸통에
    if (dog) {
      const C = p.collar || '#f5a0b0';
      let mid = 0;
      for (let x = 12; x <= 25; x++) {
        let y = 0; while (y < GH && top[y * GW + x] !== Z.body) y++;
        if (y >= GH - 3 || y < 20) continue;
        if (x === 18) mid = y;
        if (fBody[y * GW + x] && fBody[y * GW + x] !== outline) fBody[y * GW + x] = C;
      }
      if (mid) { stamp(fBody, 18, mid, ['TT', 'TT'], { T: '#f6d36b' }); fBody[mid * GW + 18] = '#fff3c4'; }
    }

    // ── 얼굴 (머리 위에 얹는 칸들) ──
    stamp(fHead, 9, 16, ['CCC', '.C.'], { C: p.cheek }, true, true);
    if (!dog) stamp(fHead, 18, 16, ['NN'], { N: '#f5a0b0' });
    else {
      const NC = p.nose || '#4a4046';
      stamp(fHead, 17, 15, ['NNNN', '.NN.'], { N: NC });
      fHead[15 * GW + 17] = mix(NC, '#ffffff', 0.45);
    }
    const E = p.eye, EL = p.eyeline, W = '#ffffff';
    const eyeOpen = blankArr(), eyeClosed = blankArr(), eyeHappy = blankArr();
    stamp(eyeOpen, 12, 12, ['.EE.', 'EEWE', 'EEEE', '.EE.'], { E, W });
    stamp(eyeOpen, 22, 12, ['.EE.', 'EEWE', 'EEEE', '.EE.'], { E, W });
    stamp(eyeClosed, 12, 14, ['L..L', '.LL.'], { L: EL }, true);
    stamp(eyeHappy, 12, 13, ['.LL.', 'L..L'], { L: EL }, true);
    const mouth = blankArr(), mouthOpen = blankArr(), tongue = blankArr();
    if (!dog) stamp(mouth, 16, 17, ['.M..M.'], { M: mix(line, fur, 0.5) });   // 사용자가 고른 F: 연한 점 두 개
    else { stamp(mouth, 17, 17, ['M..M'], { M: line }); stamp(tongue, 17, 18, ['.TT.'], { T: '#ff9fb3' }); }
    stamp(mouthOpen, 17, 17, ['.OO.', 'OPPO', '.OO.'], { O: '#c96b7d', P: '#ff9fb3' });

    // ── 손 흔들기 ──
    const up = blankArr();
    [[29.4, 23.4], [29.9, 21.8], [30.5, 20.2], [31.1, 18.6], [31.7, 17]].forEach(([x, y]) => {
      for (let yy = 0; yy < GH; yy++) for (let xx = 0; xx < GW; xx++) if (inEll(xx, yy, x, y, 1.7, 1.7)) up[yy * GW + xx] = fur;
    });
    for (let yy = 0; yy < GH; yy++) for (let xx = 0; xx < GW; xx++) if (inEll(xx, yy, 32.2, 14.4, 2.7, 2.5)) up[yy * GW + xx] = fur;
    const upF = selfOutline(up, outline);
    stamp(upF, 31, 13, ['B.B', '.B.'], { B: p.ear });

    // ── 소품 (도트) ──
    const acc = {};
    const darker = c => mix(c, '#4a3a50', 0.4);
    const ribbon = blankArr();
    stamp(ribbon, 9, 2, ['DD...DD', 'DRR.RRD', 'DRRDRRD', 'DRR.RRD', 'DD...DD'], { D: '#e07a8c', R: '#f5a0b0' });
    acc.ribbon = ribbon;
    const beret = blankArr();
    stamp(beret, 13, 1, ['.....LL.....', '....BBBB....', '..BBBBBBBB..', '.BBBBBBBBBB.', 'DDDDDDDDDDDD', '.DDDDDDDDDD.'], { L: '#b3a3c9', B: '#9c8ab5', D: '#8a7aa8' });
    acc.beret = selfOutline(beret, darker);
    const flower = blankArr();
    stamp(flower, 24, 3, ['.P.P.', 'PPPPP', '.PYP.', 'PPPPP', '.P.P.'], { P: '#ffd6e2', Y: '#f6d36b' });
    acc.flower = selfOutline(flower, c => mix(c, '#e07a8c', 0.5));
    const glasses = blankArr();
    const G = '#6a5e64';
    for (const x0 of [11, 21]) stamp(glasses, x0, 11, ['GGGGGG', 'G....G', 'G....G', 'G....G', 'G....G', 'GGGGGG'], { G });
    stamp(glasses, 17, 12, ['GGGG'], { G }); stamp(glasses, 9, 12, ['GG'], { G }, true);
    acc.glasses = glasses;
    const crown = blankArr();
    stamp(crown, 14, 0, ['....PP....', 'Y...YY...Y', 'YY.YYYY.YY', 'YYYYYYYYYY', 'YYYYYYYYYY'], { P: '#f5a0b0', Y: '#f6d36b' });
    acc.crown = selfOutline(crown, c => c === '#f6d36b' ? '#d9a93e' : mix(c, '#4a3a50', 0.3));

    const g = (id, inner, cls) => `<g${id ? ` id="${id}"` : ''}${cls ? ` class="${cls}"` : ''}>${inner}</g>`;
    const earsSvg = g('ear-l', layer(fEarL)) + g('ear-r', layer(fEarR));
    const headSvg = g('head',
      (dog ? '' : earsSvg) + layer(fHead) + (dog ? earsSvg : '') +
      g('', g('', layer(eyeOpen), 'pupils'), 'eye-open') + g('', layer(eyeClosed), 'eye-closed') + g('', layer(eyeHappy), 'eye-happy') +
      g('mouth', layer(mouth)) + g('mouth-open', layer(mouthOpen)) + (dog ? g('tongue', layer(tongue)) : '') +
      g('acc', ['beret', 'ribbon', 'flower', 'glasses', 'crown'].map(k => g('ac-' + k, layer(acc[k]))).join('')));
    return {
      tail: g('tail', layer(fTail)),
      bodyGroup: g('body-group', layer(fBody) + headSvg + g('paw-left', layer(fPawL)) + g('paw-right', layer(fPawR)) + g('paw-up', layer(upF))),
    };
  }

  // 원래 SVG에서 냥멍이 몸 말고 나머지(그림자·상자·간식·글자)는 그대로 가져와 끼움
  const decorCache = {};
  function decor(src) {
    if (decorCache[src]) return decorCache[src];
    const doc = new DOMParser().parseFromString(src.trim(), 'image/svg+xml');
    const svg = doc.documentElement;
    const kids = [...svg.children];
    const bi = kids.findIndex(k => k.id === 'body-group');
    const ser = el => new XMLSerializer().serializeToString(el).replace(/ xmlns="[^"]*"/g, '');
    const d = {
      shadow: kids.filter(k => k.id === 'shadow').map(ser).join(''),
      boxBack: kids.filter(k => k.id === 'box-back').map(ser).join(''),
      after: kids.slice(bi + 1).map(ser).join(''),
    };
    return (decorCache[src] = d);
  }

  window.PixelPet = {
    svg(species, p, srcSvg) {
      const d = decor(srcSvg), b = build(species, p);
      return `<svg viewBox="0 0 150 118" xmlns="http://www.w3.org/2000/svg">${d.shadow}${b.tail}${d.boxBack}${b.bodyGroup}${d.after}</svg>`;
    },
  };
})();
