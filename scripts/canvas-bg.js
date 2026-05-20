/* canvas-bg.js — animated world map with migration arcs flowing into Australia */
(async () => {
  const canvas = document.getElementById('migration-canvas');
  if (!canvas) return;

  function resize() {
    canvas.width  = window.innerWidth  * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resize();

  const ctx = canvas.getContext('2d');

  /* ── Load dependencies from CDN (full d3 bundle avoids module conflicts) ── */
  const loadScript = src => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

  await loadScript('https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js');

  const world    = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
  const countries = topojson.feature(world, world.objects.countries);
  const borders   = topojson.mesh(world,   world.objects.countries, (a, b) => a !== b);

  let W, H, projection, path, AUS_X, AUS_Y;

  function buildProjection() {
    W = window.innerWidth;
    H = window.innerHeight;
    projection = d3.geoNaturalEarth1()
      .scale(W / 6.5)
      .translate([W / 2, H / 2]);
    path = d3.geoPath(projection, ctx);
    const ap = projection([133.7751, -25.2744]);
    AUS_X = ap[0];
    AUS_Y = ap[1];
  }
  buildProjection();

  window.addEventListener('resize', () => {
    resize();
    ctx.scale(devicePixelRatio, devicePixelRatio);
    buildProjection();
  });

  ctx.scale(devicePixelRatio, devicePixelRatio);

  /* ── Origin cities (top departure countries from ABS data) ── */
  const ORIGINS = [
    { lon: 116.4,  lat: 39.9  },  /* Beijing       */
    { lon: 72.9,   lat: 19.1  },  /* Mumbai        */
    { lon: -0.1,   lat: 51.5  },  /* London        */
    { lon: -87.6,  lat: 41.8  },  /* Chicago       */
    { lon: 121.5,  lat: 25.0  },  /* Taipei        */
    { lon: 126.9,  lat: 37.5  },  /* Seoul         */
    { lon: 174.8,  lat: -41.3 },  /* Wellington    */
    { lon: 139.7,  lat: 35.7  },  /* Tokyo         */
    { lon: 101.7,  lat: 3.1   },  /* Kuala Lumpur  */
    { lon: 106.8,  lat: -6.2  },  /* Jakarta       */
    { lon: 18.4,   lat: -33.9 },  /* Cape Town     */
    { lon: 13.4,   lat: 52.5  },  /* Berlin        */
    { lon: 103.8,  lat: 1.35  },  /* Singapore     */
    { lon: 120.9,  lat: 14.6  },  /* Manila        */
    { lon: 77.6,   lat: 12.9  },  /* Bengaluru     */
    { lon: -43.2,  lat: -22.9 },  /* Rio           */
    { lon: 37.6,   lat: 55.8  },  /* Moscow        */
  ];

  const ARC_COLORS = [
    '#4fc3f7','#81d4fa','#29b6f6','#0288d1',
    '#80deea','#4dd0e1','#b3e5fc','#a5d6a7',
    '#ce93d8','#90caf9',
  ];

  /* ── Arc class ── */
  class Arc {
    constructor() { this.reset(true); }

    reset(instant = false) {
      const o  = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
      const pp = projection([o.lon, o.lat]);
      this.sx = pp[0]; this.sy = pp[1];
      this.ex = AUS_X + (Math.random() - 0.5) * 80;
      this.ey = AUS_Y + (Math.random() - 0.5) * 50;

      const mx = (this.sx + this.ex) / 2;
      const my = (this.sy + this.ey) / 2;
      const dx = this.ex - this.sx, dy = this.ey - this.sy;
      const perp = [-dy, dx];
      const plen = Math.sqrt(perp[0] ** 2 + perp[1] ** 2);
      const lift  = (0.15 + Math.random() * 0.25) * (Math.random() < 0.5 ? 1 : -1);
      const chord = Math.hypot(dx, dy);
      this.cx = mx + (perp[0] / plen) * chord * lift;
      this.cy = my + (perp[1] / plen) * chord * lift;

      this.color    = ARC_COLORS[Math.floor(Math.random() * ARC_COLORS.length)];
      this.speed    = 0.0008 + Math.random() * 0.0018;
      this.t        = instant ? Math.random() : 0;
      this.trailLen = 0.10 + Math.random() * 0.12;
      this.width    = 0.7 + Math.random() * 1.3;
      this.opacity  = 0.5 + Math.random() * 0.5;
    }

    bez(t) {
      const mt = 1 - t;
      return [
        mt * mt * this.sx + 2 * mt * t * this.cx + t * t * this.ex,
        mt * mt * this.sy + 2 * mt * t * this.cy + t * t * this.ey,
      ];
    }

    update() {
      this.t += this.speed;
      if (this.t > 1 + this.trailLen) this.reset();
    }

    draw(ctx) {
      const head = Math.min(this.t, 1);
      const tail = Math.max(0, this.t - this.trailLen);
      if (head <= tail) return;

      const steps = 50;
      const [tx0, ty0] = this.bez(tail);
      const [tx1, ty1] = this.bez(head);
      const grad = ctx.createLinearGradient(tx0, ty0, tx1, ty1);
      grad.addColorStop(0,   'rgba(0,0,0,0)');
      grad.addColorStop(0.5, this.color + '88');
      grad.addColorStop(1,   this.color + 'ee');

      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const tt = tail + (head - tail) * (i / steps);
        const [px, py] = this.bez(tt);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth   = this.width;
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = 8;
      ctx.globalAlpha = this.opacity;
      ctx.stroke();

      /* glowing dot at head */
      if (this.t <= 1) {
        const [hx, hy] = this.bez(head);
        ctx.beginPath();
        ctx.arc(hx, hy, 1.8, 0, Math.PI * 2);
        ctx.fillStyle   = '#ffffff';
        ctx.shadowColor = this.color;
        ctx.shadowBlur  = 14;
        ctx.fill();
      }

      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
    }
  }

  const arcs = Array.from({ length: 28 }, () => new Arc());
  let tick = 0;

  function drawOriginDots() {
    ORIGINS.forEach(o => {
      const pp = projection([o.lon, o.lat]);
      if (!pp) return;
      ctx.beginPath();
      ctx.arc(pp[0], pp[1], 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(144,202,249,0.35)';
      ctx.fill();
    });
  }

  function drawAustraliaPulse() {
    const pulse = 0.55 + 0.45 * Math.sin(tick * 0.04);

    const g1 = ctx.createRadialGradient(AUS_X, AUS_Y, 0, AUS_X, AUS_Y, 55);
    g1.addColorStop(0, `rgba(41,182,246,${0.22 * pulse})`);
    g1.addColorStop(1,  'rgba(41,182,246,0)');
    ctx.beginPath();
    ctx.arc(AUS_X, AUS_Y, 55, 0, Math.PI * 2);
    ctx.fillStyle = g1;
    ctx.fill();

    const g2 = ctx.createRadialGradient(AUS_X, AUS_Y, 0, AUS_X, AUS_Y, 110);
    g2.addColorStop(0, `rgba(41,182,246,${0.08 * pulse})`);
    g2.addColorStop(1,  'rgba(41,182,246,0)');
    ctx.beginPath();
    ctx.arc(AUS_X, AUS_Y, 110, 0, Math.PI * 2);
    ctx.fillStyle = g2;
    ctx.fill();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);

    /* country fills */
    ctx.beginPath();
    path(countries);
    ctx.fillStyle = 'rgba(255,255,255,0.032)';
    ctx.fill();

    /* glowing country outlines */
    ctx.beginPath();
    path(countries);
    ctx.strokeStyle = 'rgba(100,180,230,0.22)';
    ctx.lineWidth   = 0.6;
    ctx.shadowColor = 'rgba(100,180,255,0.5)';
    ctx.shadowBlur  = 3;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    /* internal borders — dimmer */
    ctx.beginPath();
    path(borders);
    ctx.strokeStyle = 'rgba(100,160,220,0.07)';
    ctx.lineWidth   = 0.3;
    ctx.stroke();

    drawAustraliaPulse();
    drawOriginDots();
    arcs.forEach(a => { a.update(); a.draw(ctx); });

    tick++;
    requestAnimationFrame(frame);
  }

  frame();
})();