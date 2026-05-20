/**
 * Full-page animated migration background — no external libraries.
 * Layers: continent outlines → bezier arcs with travelling dots → ambient particles.
 */
(function () {
  const canvas = document.getElementById("migration-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let running = true;
  let rafId = null;
  let lastTime = 0;

  /* Simplified continent outlines (SVG path strings, viewBox 0 0 1000 500) */
  const CONTINENTS = [
    {
      id: "northAmerica",
      d: "M 95,72 L 165,58 L 248,68 L 298,98 L 285,142 L 232,168 L 168,158 L 118,128 L 88,102 Z"
    },
    {
      id: "southAmerica",
      d: "M 268,198 L 302,188 L 318,228 L 312,298 L 288,358 L 262,378 L 248,328 L 252,248 Z"
    },
    {
      id: "europe",
      d: "M 468,78 L 518,68 L 548,88 L 542,118 L 512,132 L 478,122 L 458,98 Z"
    },
    {
      id: "africa",
      d: "M 488,142 L 538,128 L 568,168 L 562,248 L 542,328 L 512,368 L 488,348 L 478,268 L 482,188 Z"
    },
    {
      id: "asia",
      d: "M 548,62 L 648,52 L 748,72 L 812,108 L 848,148 L 832,188 L 768,208 L 688,198 L 612,168 L 558,128 L 532,88 Z"
    },
    {
      id: "antarctica",
      d: "M 120,438 L 880,438 L 860,468 L 140,468 Z"
    },
    {
      id: "australia",
      d: "M 768,318 L 812,298 L 868,308 L 912,338 L 898,378 L 852,398 L 798,392 L 758,362 L 752,332 Z",
      bright: true
    },
    {
      id: "greenland",
      d: "M 318,42 L 358,36 L 372,58 L 348,72 L 312,68 Z"
    },
    {
      id: "japan",
      d: "M 858,128 L 872,118 L 878,142 L 864,152 Z"
    },
    {
      id: "britishIsles",
      d: "M 448,88 L 468,82 L 474,98 L 458,106 L 444,98 Z"
    }
  ];

  const AU_PCT = { x: 0.85, y: 0.72 };

  /* 12 migration arc origins (% of canvas) */
  const ARC_ORIGINS = [
    { name: "China", x: 0.78, y: 0.35 },
    { name: "India", x: 0.68, y: 0.40 },
    { name: "UK", x: 0.48, y: 0.25 },
    { name: "New Zealand", x: 0.90, y: 0.78 },
    { name: "Malaysia", x: 0.74, y: 0.48 },
    { name: "Korea", x: 0.80, y: 0.30 },
    { name: "Indonesia", x: 0.76, y: 0.55 },
    { name: "USA", x: 0.18, y: 0.35 },
    { name: "Philippines", x: 0.80, y: 0.42 },
    { name: "Japan", x: 0.83, y: 0.32 },
    { name: "Singapore", x: 0.75, y: 0.50 },
    { name: "Vietnam", x: 0.77, y: 0.46 }
  ];

  let mapScale = 1;
  let mapOffsetX = 0;
  let mapOffsetY = 0;
  let arcs = [];
  let particles = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const mapW = 1000;
    const mapH = 500;
    mapScale = Math.min(width / mapW, height / mapH) * 0.92;
    mapOffsetX = (width - mapW * mapScale) / 2;
    mapOffsetY = (height - mapH * mapScale) / 2;

    buildArcs();
    if (particles.length === 0) initParticles();
  }

  function pctToPx(px, py) {
    return { x: px * width, y: py * height };
  }

  function buildArcs() {
    const dest = pctToPx(AU_PCT.x, AU_PCT.y);
    arcs = ARC_ORIGINS.map((origin, i) => {
      const start = pctToPx(origin.x, origin.y);
      const midX = (start.x + dest.x) / 2;
      const midY = (start.y + dest.y) / 2;
      const dx = dest.x - start.x;
      const dy = dest.y - start.y;
      const len = Math.hypot(dx, dy) || 1;
      const perpX = (-dy / len) * 80;
      const perpY = (dx / len) * 80;
      const side = i % 2 === 0 ? 1 : -1;

      return {
        p0: start,
        p1: { x: start.x + dx * 0.25 + perpX * side * 0.6, y: start.y + dy * 0.25 + perpY * side * 0.6 },
        p2: { x: start.x + dx * 0.75 + perpX * side * 0.4, y: start.y + dy * 0.75 + perpY * side * 0.4 },
        p3: dest,
        phase: Math.random(),
        duration: 5000 + Math.random() * 3000
      };
    });
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        opacity: 0.04 + Math.random() * 0.03,
        radius: 1
      });
    }
  }

  function cubicPoint(t, p0, p1, p2, p3) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  }

  function drawContinents() {
    ctx.save();
    ctx.translate(mapOffsetX, mapOffsetY);
    ctx.scale(mapScale, mapScale);

    CONTINENTS.forEach((c) => {
      const path = new Path2D(c.d);
      ctx.strokeStyle = c.bright
        ? "rgba(255,255,255,0.10)"
        : "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1.2 / mapScale;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke(path);
    });

    ctx.restore();
  }

  function drawArcs(time) {
    arcs.forEach((arc) => {
      const t = ((time / arc.duration + arc.phase) % 1 + 1) % 1;

      ctx.beginPath();
      ctx.moveTo(arc.p0.x, arc.p0.y);
      ctx.bezierCurveTo(arc.p1.x, arc.p1.y, arc.p2.x, arc.p2.y, arc.p3.x, arc.p3.y);
      ctx.strokeStyle = "rgba(100,200,255,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const pt = cubicPoint(t, arc.p0, arc.p1, arc.p2, arc.p3);

      const glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 8);
      glow.addColorStop(0, "rgba(150,220,255,0.9)");
      glow.addColorStop(0.35, "rgba(100,200,255,0.35)");
      glow.addColorStop(1, "rgba(100,200,255,0)");

      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "rgba(150,220,255,0.9)";
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawParticles() {
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawFrame(time) {
    ctx.fillStyle = "#0d1b2a";
    ctx.fillRect(0, 0, width, height);

    drawContinents();
    drawArcs(time);
    drawParticles();
  }

  function loop(time) {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    drawFrame(time);
    lastTime = time;
  }

  function start() {
    if (!running) {
      running = true;
      rafId = requestAnimationFrame(loop);
    }
  }

  function stop() {
    running = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  window.addEventListener("resize", () => {
    resize();
  });

  resize();
  start();
})();
