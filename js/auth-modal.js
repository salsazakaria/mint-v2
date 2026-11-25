/* =====================================================================
   Auth modal — "Welcome to mint"
   Ported from github.com/salsazakaria/mint-auth (motion, dot-grid lens,
   pixel confetti, click ticks), scoped under .am-* classes.

   Opens from any element with [data-auth-open] (Get Started / Sign In).
   Those are still real links (href), so without JS they keep working.

   - Continue with Google → GOOGLE_REDIRECT (onboarding page).
     TODO(auth): replace with the real Google OAuth start URL.
   - Email → validates, then shows "Check your inbox ✓" (demo only).
     TODO(auth): send the magic link / OTP here.
   - Close: ×, Escape, or a click on the dimmed backdrop.
   ===================================================================== */
(() => {
  const GOOGLE_REDIRECT = 'get-started.html';
  const triggers = document.querySelectorAll('[data-auth-open]');
  if (!triggers.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const A = 'assets/img/auth/';

  /* ---------- markup ---------- */
  const overlay = document.createElement('div');
  overlay.className = 'am-overlay';
  overlay.dataset.open = 'false';
  overlay.innerHTML = `
    <section class="am-card" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="am-title" aria-describedby="am-sub">
      <canvas class="am-field-canvas" aria-hidden="true"></canvas>
      <div class="am-rim" aria-hidden="true"></div>
      <div class="am-content">
        <header class="am-heading">
          <div class="am-top">
            <div class="am-brand" aria-label="mint">
              <img src="${A}logo.svg" width="26.5743" height="21.2594" alt="" />
            </div>
            <button class="am-close" type="button" aria-label="Close">
              <img src="${A}close.svg" width="19" height="19" alt="" />
            </button>
          </div>
          <div class="am-copy">
            <h2 class="am-title" id="am-title">
              <span class="am-title-line">Welcome</span>
              <span class="am-title-line">to <span class="am-title-mint">mint</span></span>
            </h2>
            <p class="am-sub" id="am-sub">Login or register with your email</p>
          </div>
        </header>
        <div class="am-cta">
          <button class="am-btn am-google am-magnetic" type="button">
            <img class="am-g" src="${A}google.svg" width="14" height="13.999" alt="" />
            <span class="am-google-label">Continue with google</span>
          </button>
          <div class="am-divider" aria-hidden="true"><img src="${A}divider.svg" width="1" height="305" alt="" /></div>
          <form class="am-email" novalidate>
            <label class="sr-only" for="am-email">Email address</label>
            <input class="am-input" id="am-email" name="email" type="email" autocomplete="email" placeholder="Enter your email address" />
            <button class="am-btn am-primary am-magnetic" type="submit">
              <span class="am-stack">
                <span class="am-text">Continue</span>
                <span class="am-text am-text-done">Check your inbox ✓</span>
              </span>
              <span class="am-sheen" aria-hidden="true"></span>
            </button>
          </form>
        </div>
      </div>
    </section>`;
  document.body.appendChild(overlay);

  const card = overlay.querySelector('.am-card');
  const brand = overlay.querySelector('.am-brand');
  const closeBtn = overlay.querySelector('.am-close');
  const google = overlay.querySelector('.am-google');
  const form = overlay.querySelector('.am-email');
  const field = overlay.querySelector('.am-input');
  const cta = overlay.querySelector('.am-primary');

  /* ---------- open / close ---------- */
  let lastFocus = null;
  const isOpen = () => overlay.dataset.open === 'true';
  const open = () => {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    overlay.dataset.open = 'true';
    document.documentElement.classList.add('am-lock');
    card.classList.remove('am-enter'); void card.offsetWidth; card.classList.add('am-enter');
    cta.classList.remove('is-done');
    requestAnimationFrame(() => card.focus({ preventScroll: true }));
  };
  const close = () => {
    if (!isOpen()) return;
    overlay.dataset.open = 'false';
    document.documentElement.classList.remove('am-lock');
    card.classList.remove('is-hot');
    card.style.transform = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };

  triggers.forEach((t) => t.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let "open in new tab" work
    e.preventDefault();
    open();
  }));
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = [...card.querySelectorAll('button, input')];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- spring-driven 3D tilt ---------- */
  const MAX_TILT = 9;
  const spring = (k = 0.12, d = 0.78) => ({ c: 0, v: 0, t: 0, k, d,
    step() { this.v += (this.t - this.c) * this.k; this.v *= this.d; this.c += this.v; } });
  const rx = spring(), ry = spring(), lift = spring(0.1, 0.75);
  let running = false;
  const loop = () => {
    rx.step(); ry.step(); lift.step();
    card.style.transform = `rotateX(${rx.c.toFixed(3)}deg) rotateY(${ry.c.toFixed(3)}deg) scale(${(1 + lift.c / 1000).toFixed(4)})`;
    const settled = [rx, ry, lift].every((s) => Math.abs(s.t - s.c) < 0.01 && Math.abs(s.v) < 0.01);
    if (settled) { running = false; return; }
    requestAnimationFrame(loop);
  };
  const kick = () => { if (!running && !reduce) { running = true; requestAnimationFrame(loop); } };

  card.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
    card.style.setProperty('--px', ((px - 0.5) * 2).toFixed(3));
    card.style.setProperty('--py', ((py - 0.5) * 2).toFixed(3));
    ry.t = (px - 0.5) * 2 * MAX_TILT;
    rx.t = -(py - 0.5) * 2 * MAX_TILT;
    kick();
  });
  let lastBurst = 0;
  card.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    card.classList.add('is-hot');
    card.style.setProperty('--glow', 1);
    lift.t = 24; kick();
    const now = performance.now();
    if (now - lastBurst > 1400) {
      lastBurst = now;
      brand.classList.remove('pop'); void brand.offsetWidth; brand.classList.add('pop');
      burst(brand, 14);
    }
  });
  card.addEventListener('pointerleave', () => {
    card.classList.remove('is-hot');
    card.style.setProperty('--glow', 0);
    rx.t = ry.t = lift.t = 0; kick();
  });

  /* ---------- dot-grid lens that follows the cursor ---------- */
  const canvas = overlay.querySelector('.am-field-canvas');
  const ctx = canvas.getContext('2d');
  const GAP = 14, RADIUS = 130, PUSH = 12, WAVE_LIFE = 750, WAVE_REACH = 380;
  let W = 0, H = 0, dpr = 1, waves = [];
  const lens = { x: 0, y: 0, tx: 0, ty: 0, fade: 0, target: 0, raf: 0 };
  const cardPoint = (e) => {
    const r = card.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * card.offsetWidth, (e.clientY - r.top) / r.height * card.offsetHeight];
  };
  const shockwave = (e, power = 1) => {
    if (reduce) return;
    const [x, y] = cardPoint(e);
    waves.push({ x, y, t0: performance.now(), power });
    if (!lens.raf) lens.raf = requestAnimationFrame(drawLens);
  };
  const sizeCanvas = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = card.offsetWidth; H = card.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  sizeCanvas();
  new ResizeObserver(sizeCanvas).observe(card);

  function drawLens(t) {
    lens.x += (lens.tx - lens.x) * 0.16;
    lens.y += (lens.ty - lens.y) * 0.16;
    lens.fade += (lens.target - lens.fade) * 0.09;
    ctx.clearRect(0, 0, W, H);
    const R = RADIUS * (1 + 0.06 * Math.sin(t / 420));
    const off = GAP / 2;
    waves = waves.filter((w) => t - w.t0 < WAVE_LIFE);
    for (let gy = off; gy < H; gy += GAP) {
      for (let gx = off; gx < W; gx += GAP) {
        const dx = gx - lens.x, dy = gy - lens.y;
        const dist = Math.hypot(dx, dy);
        const k = dist < R ? 1 - dist / R : 0;
        const e = k * k * (3 - 2 * k);
        const push = dist > 0.001 ? (Math.sin(k * Math.PI) * PUSH) / dist : 0;
        let x = gx + dx * push, y = gy + dy * push, hit = 0;
        for (const w of waves) {
          const age = (t - w.t0) / WAVE_LIFE;
          const wx = gx - w.x, wy = gy - w.y, wd = Math.hypot(wx, wy);
          const band = 1 - Math.min(1, Math.abs(wd - age * WAVE_REACH * w.power) / 26);
          if (band <= 0 || wd < 0.001) continue;
          const s = band * band * (1 - age) * w.power;
          x += (wx / wd) * s * 9; y += (wy / wd) * s * 9;
          hit = Math.max(hit, s);
        }
        const glow = Math.min(1, Math.max(e, hit));
        const r = 0.6 + e * 1.7 + hit * 1.6;
        const a = Math.min(0.85, (0.05 + e * 0.4) * lens.fade + hit * 0.7);
        if (a < 0.01) continue;
        const m = glow * glow;
        ctx.fillStyle = `rgba(${255 - 13 * m | 0},${255 - 190 * m | 0},${255 - 209 * m | 0},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (lens.target === 0 && lens.fade < 0.01 && !waves.length) { ctx.clearRect(0, 0, W, H); lens.raf = 0; return; }
    lens.raf = requestAnimationFrame(drawLens);
  }
  if (!reduce) {
    card.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      const [x, y] = cardPoint(e);
      lens.x = lens.tx = x; lens.y = lens.ty = y; lens.target = 1;
      if (!lens.raf) lens.raf = requestAnimationFrame(drawLens);
    });
    card.addEventListener('pointermove', (e) => { [lens.tx, lens.ty] = cardPoint(e); });
    card.addEventListener('pointerleave', () => { lens.target = 0; });
  }

  /* ---------- click feedback: soft ticks, haptics, ripple, squish ---------- */
  const SOUND = true; // set false to mute the UI ticks
  let actx;
  const tone = (from, to, dur = 0.05, vol = 0.035, delay = 0) => {
    if (!SOUND) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = actx.currentTime + delay;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(from, t0);
      o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.04);
      o.connect(g).connect(actx.destination);
      o.start(t0); o.stop(t0 + dur + 0.06);
    } catch (_) {}
  };
  const tick = () => tone(1400, 520, 0.045);
  const chime = () => { tone(880, 900, 0.09, 0.03); tone(1320, 1340, 0.14, 0.03, 0.08); };
  const buzz = () => tone(220, 160, 0.12, 0.03);
  const haptic = (ms) => navigator.vibrate && navigator.vibrate(ms);

  const ripple = (el, e) => {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const dot = document.createElement('span');
    dot.className = 'am-ripple';
    dot.style.width = dot.style.height = `${size}px`;
    dot.style.left = `${(e.clientX - r.left) / r.width * el.offsetWidth - size / 2}px`;
    dot.style.top = `${(e.clientY - r.top) / r.height * el.offsetHeight - size / 2}px`;
    el.appendChild(dot);
    dot.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }],
      { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => dot.remove();
  };

  card.querySelectorAll('.am-btn, .am-close, .am-brand').forEach((el) => {
    const isBtn = el.classList.contains('am-btn');
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      el.getAnimations().forEach((a) => a.id === 'press' && a.cancel());
      const a = el.animate([{ scale: 1 }, { scale: isBtn ? 0.94 : 0.85 }], { duration: 110, easing: 'cubic-bezier(.3,0,.5,1)', fill: 'forwards' });
      a.id = 'press';
      if (isBtn) ripple(el, e);
      tick(); haptic(8);
    });
    const release = () => {
      const held = el.getAnimations().find((a) => a.id === 'press');
      if (!held) return;
      held.cancel();
      el.animate([{ scale: isBtn ? 0.94 : 0.85 }, { scale: 1.05 }, { scale: 0.99 }, { scale: 1 }], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointerleave', release);
  });

  card.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const onControl = e.target.closest('button, input, .am-brand');
    shockwave(e, onControl ? 1 : 0.6);
    if (onControl && !reduce) {
      card.animate([{ scale: 1 }, { scale: 0.992 }, { scale: 1.004 }, { scale: 1 }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)', composite: 'add' });
    }
  });

  brand.addEventListener('click', () => burst(brand, 18));

  /* ---------- pixel confetti (echoes the blocky logo) ---------- */
  const COLORS = ['#f2412e', '#f2412e', '#f3f3f2', '#ff8a78', '#8c8c8c'];
  function burst(el, n) {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'am-px';
      const s = 4 + Math.random() * 4;
      p.style.width = p.style.height = `${s}px`;
      p.style.background = COLORS[i % COLORS.length];
      document.body.appendChild(p);
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const dist = 50 + Math.random() * 60;
      const dx = Math.cos(a) * dist, dy = Math.sin(a) * dist - 20;
      const rot = (Math.random() - 0.5) * 540;
      p.animate([
        { transform: `translate(${cx}px, ${cy}px) scale(0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${cx + dx * 0.8}px, ${cy + dy * 0.8}px) scale(1.2) rotate(${rot * 0.6}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${cx + dx}px, ${cy + dy + 40}px) scale(0.2) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: 750 + Math.random() * 350, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => p.remove();
    }
  }

  /* ---------- magnetic buttons ---------- */
  card.querySelectorAll('.am-magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      if (reduce || e.pointerType !== 'mouse') return;
      const r = btn.getBoundingClientRect();
      btn.classList.add('is-tracking');
      btn.style.setProperty('--tx', `${(e.clientX - (r.left + r.width / 2)) * 0.06}px`);
      btn.style.setProperty('--ty', `${(e.clientY - (r.top + r.height / 2)) * 0.22}px`);
    });
    btn.addEventListener('pointerleave', () => {
      btn.classList.remove('is-tracking');
      btn.style.setProperty('--tx', '0px');
      btn.style.setProperty('--ty', '0px');
    });
  });

  /* ---------- Continue with Google → onboarding ---------- */
  google.addEventListener('click', () => {
    const g = google.querySelector('.am-g');
    const go = () => { window.location.href = GOOGLE_REDIRECT; };
    if (reduce) return go();
    g.animate([
      { transform: 'translateY(0) rotate(360deg) scale(1.15)' },
      { transform: 'translateY(-6px) rotate(540deg) scale(1.35)', offset: 0.4 },
      { transform: 'translateY(0) rotate(720deg) scale(1.15)' }
    ], { duration: 600, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    setTimeout(go, 420); // let the hop play before leaving
  });

  /* ---------- email submit (demo) ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
      field.classList.remove('shake'); void field.offsetWidth; field.classList.add('shake');
      field.focus();
      buzz(); haptic([12, 40, 12]);
      return;
    }
    cta.classList.add('is-done');
    burst(cta, 22);
    chime(); haptic([10, 30, 20]);
    const r = cta.getBoundingClientRect();
    shockwave({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }, 1.6);
    setTimeout(() => cta.classList.remove('is-done'), 2600);
  });
  field.addEventListener('animationend', () => field.classList.remove('shake'));
})();
