/* ============================================================================
   globe-view  -  the <globe-view> custom element from the client's own
   globe-brief.html (Lanin Studio / Claude Design prototype), lifted verbatim
   so the demo pages render exactly the designs Pierre is choosing between.

   Needs THREE on the page first (three r128 / 0.128.0).
   Usage: <globe-view variant="wire" layout="spread" grid="black"></globe-view>
          inside a positioned container - it fills 100% of its width/height.

   DEMO ONLY. Delete together with /demo once the client has chosen.
   ========================================================================== */
/* ---- globe-view custom element (from the Claude Design prototype) ---- */
(function () {
  if (window.__globeViewLoaded) return;
  window.__globeViewLoaded = true;

  const REGIONS = [
    ["Gulf & Middle East", [["Dubai", 25.20, 55.27], ["Abu Dhabi", 24.45, 54.38], ["Qatar", 25.29, 51.53], ["Jeddah", 21.49, 39.19], ["Amman", 31.95, 35.93]]],
    ["France", [["Paris", 48.86, 2.35], ["Courchevel", 45.41, 6.63], ["Cannes", 43.55, 7.02], ["Monaco", 43.73, 7.42], ["Saint Tropez", 43.27, 6.64], ["Corsica", 41.93, 8.74], ["Bordeaux", 44.84, -0.58], ["Biarritz", 43.48, -1.56]]],
    ["Switzerland", [["Geneva", 46.20, 6.14], ["Gstaad", 46.47, 7.29], ["Zurich", 47.38, 8.54], ["Vitznau", 47.01, 8.48], ["St Moritz", 46.50, 9.84], ["Bale", 47.56, 7.59]]],
    ["Italy", [["Milano", 45.46, 9.19], ["Como", 45.81, 9.08], ["Venezia", 45.44, 12.32], ["Portofino", 44.30, 9.21], ["Forte dei Marmi", 43.96, 10.17], ["Florence", 43.77, 11.26], ["Rome", 41.90, 12.50], ["Capri", 40.55, 14.24], ["Olbia", 40.92, 9.50], ["Palerme", 38.12, 13.36], ["Noto", 36.89, 15.07]]],
    ["Iberia", [["Madrid", 40.42, -3.70], ["Barcelona", 41.39, 2.17], ["Ibiza", 38.91, 1.43], ["Mallorca", 39.57, 2.65], ["Marbella", 36.51, -4.89], ["Lisbon", 38.72, -9.14], ["Porto", 41.15, -8.61]]],
    ["Germany & Austria", [["Munich", 48.14, 11.58], ["Vienna", 48.21, 16.37]]],
    ["Central Europe", [["Prague", 50.08, 14.44], ["Budapest", 47.50, 19.04], ["Warsaw", 52.23, 21.01], ["Ljubljana", 46.06, 14.51]]],
    ["Balkans & Caucasus", [["Šibenik", 43.74, 15.90], ["Sofia", 42.70, 23.32], ["Bucarest", 44.43, 26.10], ["Tbilissi", 41.72, 44.78]]],
    ["Scandinavia", [["Oslo", 59.91, 10.75], ["Hemsedal", 60.86, 8.31], ["Sandefjord", 59.13, 10.22], ["Goteborg", 57.71, 11.97], ["Stockholm", 59.33, 18.07], ["Copenhagen", 55.68, 12.57]]],
    ["Benelux", [["Amsterdam", 52.37, 4.90], ["Bruxelles", 50.85, 4.35], ["Luxembourg", 49.61, 6.13]]],
    ["British Isles", [["London", 51.51, -0.13], ["Dublin", 53.35, -6.26], ["Inverness", 57.48, -4.22]]],
    ["Greece & Islands", [["Athens", 37.98, 23.73], ["Mykonos", 37.45, 25.33], ["Paros", 37.08, 25.15], ["Sifnos", 36.98, 24.71], ["Cyprus", 35.13, 33.43], ["Malta", 35.90, 14.51]]],
    ["Turkey", [["Istanbul", 41.01, 28.98], ["Izmir", 38.42, 27.14], ["Bodrum", 37.03, 27.43], ["Antalya", 36.90, 30.71]]],
    ["North Africa", [["Marrakech", 31.63, -8.01]]],
    ["Indian Ocean", [["Seychelles", -4.62, 55.45]]],
    ["Americas", [["Miami", 25.76, -80.19]]]
  ];

  const D = [];
  const RG = REGIONS.map(function (r, ri) {
    const cities = r[1].map(function (c) {
      const d = { name: c[0], lat: c[1], lon: c[2], region: r[0], ri: ri, i: D.length };
      D.push(d);
      return d;
    });
    const lat = cities.reduce(function (s, c) { return s + c.lat; }, 0) / cities.length;
    const lon = cities.reduce(function (s, c) { return s + c.lon; }, 0) / cities.length;
    return { name: r[0], cities: cities, lat: lat, lon: lon, ri: ri, count: cities.length };
  });

  const HUB = { name: "Nice", lat: 43.70, lon: 7.27 };
  const ARC_TO = ["Dubai", "Seychelles", "Miami", "Istanbul", "Marrakech", "Oslo", "Athens", "Jeddah"];

  function spreadLayout() {
    const LATS = [56, 40, 24, 8, -9, -26, -44];
    const w = LATS.map(function (l) { return Math.cos(l * DEG); });
    const sum = w.reduce(function (p, c) { return p + c; }, 0);
    const counts = w.map(function (x) { return Math.max(2, Math.round(D.length * x / sum)); });
    let diff = D.length - counts.reduce(function (p, c) { return p + c; }, 0);
    for (let k = 0; diff !== 0; k = (k + 1) % counts.length) {
      const step = diff > 0 ? 1 : -1;
      if (counts[k] + step >= 2) { counts[k] += step; diff -= step; }
    }
    const out = new Array(D.length);
    let i = 0;
    LATS.forEach(function (lat, band) {
      const n = counts[band];
      for (let j = 0; j < n && i < D.length; j++, i++) {
        const lon = -180 + (j + (band % 2 ? 0.5 : 0)) * (360 / n);
        out[i] = { lat: lat, lon: lon };
      }
    });
    return out;
  }

  const R = 100, DEG = Math.PI / 180;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const INSTANCES = [];
  let SHARED = null, RAF = 0, LAST_TICK = 0;

  function shared(w, h) {
    if (!SHARED) {
      const c = document.createElement("canvas");
      const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.setPixelRatio(DPR);
      SHARED = { renderer: r, canvas: c, w: 0, h: 0 };
    }
    if (w > SHARED.w || h > SHARED.h) {
      SHARED.w = Math.max(w, SHARED.w); SHARED.h = Math.max(h, SHARED.h);
      SHARED.renderer.setSize(SHARED.w, SHARED.h, false);
    }
    return SHARED;
  }

  function frames(now) {
    for (const inst of INSTANCES) {
      if (!inst.isConnected) continue;
      try { inst._frame(now); } catch (e) {}
    }
    LAST_TICK = now;
  }

  function loop(now) {
    RAF = requestAnimationFrame(loop);
    frames(now);
  }

  setInterval(function () {
    const now = performance.now();
    if (now - LAST_TICK > 200) frames(now);
  }, 250);

  function pos(lat, lon, r) {
    r = r || R;
    return new THREE.Vector3(
      r * Math.cos(lat * DEG) * Math.cos(lon * DEG),
      r * Math.sin(lat * DEG),
      -r * Math.cos(lat * DEG) * Math.sin(lon * DEG));
  }
  function wrap(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }

  class GlobeView extends HTMLElement {
    connectedCallback() {
      if (this._built) {
        if (INSTANCES.indexOf(this) < 0) INSTANCES.push(this);
        this._last = performance.now();
        if (!RAF) RAF = requestAnimationFrame(loop);
        return;
      }
      this._built = true;
      const variant = this.getAttribute("variant") || "day";
      const dark = variant === "darkwire";
      const night = variant === "night" || dark;
      const wire = variant === "wire";
      this.night = night; this.wire = wire; this.dark = dark;
      const labelSize = parseFloat(this.getAttribute("label-size")) || 12.5;
      this.spread = this.getAttribute("layout") === "spread";
      this.P = this.spread ? spreadLayout() : D.map(function (d) { return { lat: d.lat, lon: d.lon }; });
      const root = this.attachShadow({ mode: "open" });
      const ink = night ? "#f6e7c8" : "#14161a";
      root.innerHTML =
        '<style>' +
        ':host{display:block;position:relative;width:100%;height:100%;cursor:grab;touch-action:none}' +
        ':host(.dragging){cursor:grabbing}' +
        '#c{display:block;width:100%;height:100%}' +
        '#ov{position:absolute;inset:0;pointer-events:none;overflow:hidden}' +
        '.pin{position:absolute;transform:translate(-50%,-100%);will-change:transform,opacity;' +
        'display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer}' +
        (wire ? '.pin{flex-direction:row;align-items:center}.pin .lab{margin-bottom:0}' +
          '.pin .dot{position:absolute;left:0;top:50%;margin:-2px 0 0 -2px}' +
          '.pin[data-labelled="1"] .dot{display:none}' +
          '.pin .lab svg{width:12px;height:15px;margin-right:3px}' +
          '.pin[data-flip="1"] .lab svg{order:2;margin-right:0;margin-left:4px}' +
          (this.getAttribute("grid") === "beige"
            ? '.pin .lab svg{width:15px;height:18px;margin-right:6px}' +
              '.pin[data-flip="1"] .lab svg{margin-right:0;margin-left:6px}' : '') : '') +
        '.dot{width:4px;height:4px;border-radius:50%;background:' + (night ? "#f0cd8b" : wire ? "#b58d43" : "#ffffff") +
        ';box-shadow:0 0 6px 1px ' + (night ? "rgba(240,205,139,.6)" : wire ? "rgba(181,141,67,.25)" : "rgba(255,255,255,.5)") + '}' +
        '.pin[data-kind="region"] .dot{width:6px;height:6px}' +
        '.pin[data-active="1"] .dot{width:9px;height:9px;box-shadow:0 0 16px 5px ' +
        (night ? "rgba(240,205,139,.95)" : "rgba(255,255,255,.85)") + '}' +
        '.lab{white-space:nowrap;font:500 ' + labelSize + 'px/1 "Jost","Helvetica Neue",Helvetica,Arial,sans-serif;' +
        'letter-spacing:.01em;padding:5px 10px 5px 7px;border-radius:14px;display:flex;align-items:center;gap:5px;' +
        'margin-bottom:7px;' + (night
          ? 'color:#f6e7c8;background:rgba(14,11,6,.82);border:1px solid rgba(232,194,122,.45)'
          : 'color:#17181a;background:rgba(255,255,255,.96);border:1px solid #e7ded0;box-shadow:0 2px 10px rgba(60,48,26,.10)') + '}' +
        '.pin[data-active="1"] .lab{font-weight:600;' + (night
          ? 'border-color:rgba(232,194,122,.9);background:rgba(20,15,7,.92)'
          : 'border-color:#d9cbb1;box-shadow:0 4px 14px rgba(60,48,26,.16)') + '}' +
        '.pin[data-kind="region"] .lab{letter-spacing:.06em;text-transform:uppercase;font-size:11px;' +
        (night ? 'color:#e8c27a;' : 'color:#7a6434;') + '}' +
        '.n{opacity:.55;font-variant-numeric:tabular-nums}' +
        '.lab svg{width:9px;height:11px;flex:none}' +
        '</style><canvas id="c"></canvas><div id="ov"></div>';

      this.canvas = root.getElementById("c");
      this.ctx = this.canvas.getContext("2d");
      this.ov = root.getElementById("ov");
      this.ink = ink;

      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(32, 1, 1, 2000);
      cam.position.set(0, 0, 400);
      this.scene = scene; this.cam = cam;
      const g = new THREE.Group();
      const stand = this.getAttribute("stand") === "on";
      this.stand = stand;
      const tiltAttr = this.getAttribute("tilt");
      if (tiltAttr === "on" || stand) {
        const t = new THREE.Group();
        if (stand) { t.rotation.z = -0.32; }
        else { t.rotation.z = -0.36; t.rotation.x = 0.26; }
        scene.add(t); t.add(g);
        this.mount = t;
      } else {
        scene.add(g);
      }
      this.g = g;
      if (stand) this._buildStand();

      if (wire || dark) {
        if (dark) {
          g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 64, 48),
            new THREE.MeshBasicMaterial({ color: 0x0c0b09 })));
        }
        this._buildWireframe();
      }

      if (night) {
        if (!dark) {
          g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.002, 48, 32),
            new THREE.MeshBasicMaterial({ color: 0x050403, transparent: true, opacity: 0.28, depthWrite: false })));
        }
        this._buildArcs();
      } else if (!wire) {
        scene.add(new THREE.AmbientLight(0xffffff, 0.95));
        const dl = new THREE.DirectionalLight(0xffffff, 0.75);
        dl.position.set(-1, 0.6, 1.4); scene.add(dl);
      }

      this._buildPins();
      this.index = D.findIndex(function (d) { return d.name === "Geneva"; });
      this.openRegion = D[this.index].ri;
      this.target = this._rotFor(D[this.index]);
      this.g.rotation.x = this.target.x; this.g.rotation.y = this.target.y;
      this._bindDrag();

      new ResizeObserver(this._resize.bind(this)).observe(this);
      this._resize();
      this._last = performance.now();
      INSTANCES.push(this);
      if (!RAF) RAF = requestAnimationFrame(loop);
      this._emit();
    }

    _buildStand() {
      const col = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.getAttribute("standcolor") || this.standColor || "#1b1c1e") });
      const AR = R * 1.09;

      const tilted = new THREE.Group();
      const arc = new THREE.Mesh(new THREE.TorusGeometry(AR, 2.4, 10, 160, Math.PI), col);
      arc.rotation.z = -Math.PI / 2;
      tilted.add(arc);
      const axleLen = AR - R + 6;
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, axleLen, 14), col);
      axle.position.y = R + axleLen / 2 - 5;
      tilted.add(axle);
      const axle2 = axle.clone(); axle2.position.y = -axle.position.y; tilted.add(axle2);
      this.mount.add(tilted);

      const base = new THREE.Group();
      const stemTop = -AR + 2, stemBottom = -R * 1.3;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(3, 4.6, stemTop - stemBottom, 16), col);
      stem.position.y = (stemTop + stemBottom) / 2;
      base.add(stem);
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(R * 0.27, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), col);
      bowl.position.y = -R * 1.42; bowl.scale.y = 0.62; base.add(bowl);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.1, R * 0.13, R * 0.04, 40), col);
      collar.position.y = -R * 1.27; base.add(collar);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.3, R * 0.3, R * 0.045, 56), col);
      foot.position.y = -R * 1.44; base.add(foot);
      this.scene.add(base);
    }

    _buildWireframe() {
      const self = this;
      const tube = function (pts, opacity, closed) {
        const curve = new THREE.CatmullRomCurve3(pts, !!closed);
        const geo = new THREE.TubeGeometry(curve, pts.length, 0.5, 5, !!closed);
        self.g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
          color: new THREE.Color(self.getAttribute("grid") === "beige" ? "#cdbda3" : self.getAttribute("grid") === "black" ? "#1b1c1e" : self.dark ? "#a8813c" : "#c0a063"), transparent: true, opacity: opacity, depthWrite: false
        })));
      };
      for (let lon = -180; lon < 180; lon += 30) {
        const pts = [];
        for (let lat = -90; lat <= 90; lat += 6) pts.push(pos(lat, lon));
        tube(pts, 0.85, false);
      }
      for (let lat = -60; lat <= 60; lat += 20) {
        const pts = [];
        for (let lon = -180; lon < 180; lon += 6) pts.push(pos(lat, lon));
        tube(pts, lat === 0 ? 0.95 : 0.8, true);
      }
    }

    _buildArcs() {
      const P = this.P, N = D.length;
      let pairs;
      if (this.spread) {
        pairs = [];
        const used = {};
        for (let i = 0; i < N && pairs.length < 9; i += 7) {
          const a = new THREE.Vector3(pos(P[i].lat, P[i].lon).x, pos(P[i].lat, P[i].lon).y, pos(P[i].lat, P[i].lon).z).normalize();
          let bestJ = -1, bestD = 9;
          for (let j = 0; j < N; j++) {
            if (j === i || used[j]) continue;
            const b = pos(P[j].lat, P[j].lon).normalize();
            const ang = a.angleTo(b);
            const d = Math.abs(ang - 1.05);
            if (ang > 0.7 && ang < 1.4 && d < bestD) { bestD = d; bestJ = j; }
          }
          if (bestJ >= 0) { pairs.push([i, bestJ]); used[i] = used[bestJ] = 1; }
        }
      } else {
        const hub = D.findIndex(function (d) { return d.name === "Cannes"; });
        pairs = ARC_TO.map(function (n) {
          return [hub, D.findIndex(function (d) { return d.name === n; })];
        }).filter(function (p) { return p[1] >= 0; });
      }
      this.arcs = [];
      pairs.forEach(function (pr, k) {
        const p1 = pos(P[pr[0]].lat, P[pr[0]].lon), p2 = pos(P[pr[1]].lat, P[pr[1]].lon);
        const lift = 0.05 + 0.07 * (p1.angleTo(p2) / Math.PI);
        const pts = [];
        const n1 = p1.clone().normalize(), n2 = p2.clone().normalize();
        for (let s = 0; s <= 120; s++) {
          const t = s / 120;
          const q = n1.clone().lerp(n2, t);
          if (q.lengthSq() < 1e-6) q.copy(n1);
          q.normalize().multiplyScalar(R * (1.01 + lift * Math.sin(Math.PI * t)));
          pts.push(q);
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        this.g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
          color: new THREE.Color("#d9ae63"), transparent: true, opacity: 0.55,
          blending: THREE.AdditiveBlending, depthWrite: false
        })));
        const comet = new THREE.Line(geo.clone(), new THREE.LineBasicMaterial({
          color: new THREE.Color("#fff0cf"), transparent: true, opacity: 0.95,
          blending: THREE.AdditiveBlending, depthWrite: false
        }));
        comet.geometry.setDrawRange(0, 40);
        this.g.add(comet);
        this.arcs.push({ comet: comet, total: pts.length, t: k / pairs.length, speed: 0.11 + (k % 3) * 0.02 });
      }, this);
    }

    _mk(kind, label, count, latlon, onClick) {
      const el = document.createElement("div");
      el.className = "pin";
      el.dataset.kind = kind;
      el.innerHTML = '<div class="lab"><svg viewBox="0 0 10 12" fill="none">' +
        (this.wire
          ? '<path d="M5 11.2C5 11.2 9 7.4 9 4.6A4 4 0 1 0 1 4.6C1 7.4 5 11.2 5 11.2Z" fill="#b58d43"/>' +
            '<circle cx="5" cy="4.5" r="1.3" fill="#fdfbf6"/>'
          : '<path d="M5 11.2C5 11.2 9 7.4 9 4.6A4 4 0 1 0 1 4.6C1 7.4 5 11.2 5 11.2Z" stroke="currentColor" stroke-width="1.1"/>' +
            '<circle cx="5" cy="4.5" r="1.3" fill="currentColor"/>') +
        '<span></span>' +
        (count ? '<em class="n" style="font-style:normal"></em>' : '') + '</div><div class="dot"></div>';
      el.querySelector("span").textContent = label;
      if (count) el.querySelector(".n").textContent = count;
      el.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
      el.addEventListener("click", function (e) { e.stopPropagation(); onClick(); });
      this.ov.appendChild(el);
      return { el: el, lab: el.querySelector(".lab"), v: pos(latlon.lat, latlon.lon) };
    }

    _buildPins() {
      const self = this;
      this.cityPins = D.map(function (d) {
        const p = self._mk("city", d.name, 0, self.P[d.i], function () { self.goTo(d.i); });
        p.d = d; return p;
      });
      this.regionPins = this.spread ? [] : RG.map(function (r) {
        const p = self._mk("region", r.name, r.count, r, function () { self.goTo(r.cities[0].i); });
        p.r = r; return p;
      });
    }

    _rotFor(d) {
      const q = d.i != null ? this.P[d.i] : d;
      return { x: q.lat * DEG * 0.85, y: -(q.lon + 90) * DEG };
    }

    _resize() {
      const w = this.clientWidth || 300, h = this.clientHeight || 300;
      this.w = w; this.h = h;
      this.canvas.width = Math.round(w * DPR);
      this.canvas.height = Math.round(h * DPR);
      shared(w, h);
      this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
      this.cam.position.z = (R * (this.stand ? 1.42 : 1.32)) / (Math.tan((this.cam.fov / 2) * DEG) * Math.min(1, w / h));
      if (this.stand) {
        this.cam.position.y = R * 0.42;
        this.cam.lookAt(0, -R * 0.26, 0);
      }
    }

    _bindDrag() {
      let down = false, lx = 0, ly = 0, moved = 0;
      const self = this;
      this.addEventListener("pointerdown", function (e) {
        down = true; moved = 0; lx = e.clientX; ly = e.clientY;
        self.classList.add("dragging"); self.target = null; self.spin = false;
        self.setPointerCapture && self.setPointerCapture(e.pointerId);
      });
      this.addEventListener("pointermove", function (e) {
        if (!down) return;
        const dx = e.clientX - lx, dy = e.clientY - ly;
        lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        self.g.rotation.y += dx * 0.005;
        self.g.rotation.x = Math.max(-1.5, Math.min(1.5, self.g.rotation.x + dy * 0.004));
        self.vy = dx * 0.005;
      });
      const up = function () {
        if (!down) return;
        down = false; self.classList.remove("dragging");
        if (moved < 4) self._nearestToFront();
      };
      this.addEventListener("pointerup", up);
      this.addEventListener("pointercancel", up);
      this.addEventListener("pointerleave", up);
      this.addEventListener("wheel", function (e) {
        e.preventDefault(); self.target = null;
        self.g.rotation.y += (e.deltaY + e.deltaX) * 0.0022;
      }, { passive: false });
    }

    _nearestToFront() {
      let best = -1, bd = 1e9;
      const front = new THREE.Vector3(0, 0, 1);
      this.g.updateMatrixWorld(true);
      for (const p of this.cityPins) {
        const w = p.v.clone().applyMatrix4(this.g.matrixWorld).normalize();
        const d = w.distanceTo(front);
        if (d < bd) { bd = d; best = p.d.i; }
      }
      if (best >= 0) this.goTo(best);
    }

    goTo(i) {
      this.index = (i + D.length) % D.length;
      const d = D[this.index];
      this.openRegion = d.ri;
      this.target = this._rotFor(d);
      this.vy = 0;
      this._emit();
    }
    next() { this.goTo(this.index + 1); }
    prev() { this.goTo(this.index - 1); }
    get destinations() { return D; }

    _emit() {
      const d = D[this.index];
      this.dispatchEvent(new CustomEvent("destinationchange", {
        bubbles: true, composed: true,
        detail: { index: this.index, name: d.name, region: d.region, total: D.length }
      }));
    }

    _frame(now) {
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now;
      const g = this.g;
      if (this.target) {
        g.rotation.x += (this.target.x - g.rotation.x) * 0.07;
        g.rotation.y += wrap(this.target.y - g.rotation.y) * 0.07;
      } else if (this.vy) {
        g.rotation.y += this.vy; this.vy *= 0.94;
        if (Math.abs(this.vy) < 0.0002) this.vy = 0;
      }
      if (this.arcs) {
        for (const a of this.arcs) {
          a.t += dt * a.speed;
          if (a.t > 1.25) a.t -= 1.25;
          const head = Math.floor(a.t * a.total);
          const start = Math.max(0, head - 40);
          a.comet.geometry.setDrawRange(start, Math.max(0, Math.min(40, a.total - start, head - start)));
          a.comet.material.opacity = a.t > 1 ? Math.max(0, (1.25 - a.t) / 0.25) * 0.95 : 0.95;
        }
      }
      const S = shared(this.w, this.h), r = S.renderer;
      const vw = Math.round(this.w), vh = Math.round(this.h);
      r.setViewport(0, S.h - vh, vw, vh);
      r.setScissor(0, S.h - vh, vw, vh);
      r.setScissorTest(true);
      r.clear();
      r.render(this.scene, this.cam);
      const sw = Math.round(vw * DPR), sh = Math.round(vh * DPR);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(S.canvas, 0, 0, sw, sh, 0, 0, sw, sh);
      this._updatePins();
    }

    _updatePins() {
      const cam = this.cam, w = this.w, h = this.h, v = new THREE.Vector3();
      cam.updateMatrixWorld();
      this.g.updateMatrixWorld(true);
      const M = this.g.matrixWorld;
      const open = this.spread ? -1 : this.openRegion;
      const list = [];
      for (const p of this.cityPins) {
        if (this.spread || p.d.ri === open) list.push({ p: p, active: p.d.i === this.index, prio: p.d.i === this.index ? 2 : 1 });
        else p.el.style.display = "none";
      }
      for (const p of this.regionPins) {
        if (p.r.ri === open) p.el.style.display = "none";
        else list.push({ p: p, active: false, prio: 0 });
      }
      const boxes = [];
      const items = list.map(function (it) {
        v.copy(it.p.v).applyMatrix4(M);
        const facing = v.z / R;
        const s = v.clone(); s.project(cam);
        it.facing = facing;
        it.x = (s.x * 0.5 + 0.5) * w;
        it.y = (-s.y * 0.5 + 0.5) * h;
        return it;
      }, this);
      items.sort(function (a, b) { return (b.prio - a.prio) || (b.facing - a.facing); });

      for (const it of items) {
        const p = it.p;
        if (it.facing < 0.06) { p.el.style.display = "none"; continue; }
        p.el.style.display = "flex";
        p.el.dataset.active = it.active ? "1" : "0";
        p.el.style.opacity = it.active ? 1 : Math.max(0.58, Math.min(1, (it.facing - 0.06) * 2));
        p.el.style.zIndex = it.active ? 5 : Math.round(it.facing * 4) + 1;
        if (!p.lw) p.lw = p.lab.offsetWidth || 90;
        let flip = 0, shift = 0;
        if (this.wire) {
          flip = it.x + p.lw + 18 > w ? 1 : 0;
        } else {
          const left = it.x - p.lw / 2;
          shift = Math.max(10 - left, Math.min(0, w - 10 - (left + p.lw)));
        }
        p.el.dataset.flip = flip;
        p.el.style.transform = (this.wire
          ? (flip ? "translate(calc(-100% + 7px),-50%) " : "translate(-7px,-50%) ")
          : "translate(-50%,-100%) ") +
          "translate(" + it.x.toFixed(1) + "px," + it.y.toFixed(1) + "px)";
        p.lab.style.transform = shift ? "translateX(" + shift.toFixed(1) + "px)" : "";
        const padX = this.wire ? 26 : 6, padY = this.wire ? 30 : 34;
        const cx = it.x + (this.wire ? (flip ? -p.lw / 2 : p.lw / 2) : shift);
        const bx = { x1: cx - p.lw / 2 - padX, x2: cx + p.lw / 2 + padX, y1: it.y - padY, y2: it.y + (this.wire ? 8 : -2) };
        const free = !boxes.some(function (b) { return bx.x1 < b.x2 && bx.x2 > b.x1 && bx.y1 < b.y2 && bx.y2 > b.y1; });
        const show = it.active || (free && it.facing > (this.spread ? 0.32 : 0.25));
        if (show) boxes.push(bx);
        p.lab.style.display = show ? "flex" : "none";
        p.el.dataset.labelled = show ? "1" : "0";
        p.el.style.color = this.ink;
      }
    }

    disconnectedCallback() {}
  }
  customElements.define("globe-view", GlobeView);
})();
