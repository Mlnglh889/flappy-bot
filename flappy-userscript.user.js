// ==UserScript==
// @name         Feather Flappy Bot v5
// @namespace    local.flappy
// @version      5.0
// @description  Bot tap untuk game Flappy di quest.feather.games (input pointerdown asli)
// @match        https://quest.feather.games/*
// @run-at       document-idle
// @grant        none
// @all-frames   true
// ==/UserScript==

(function () {
  'use strict';

  /* ---------- badge status (biar kelihatan bot aktif di HP) ---------- */
  function makeBadge(stage) {
    let el = document.getElementById('flap-badge');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'flap-badge';
    el.style.cssText = 'position:absolute;left:6px;top:6px;z-index:99999;background:rgba(0,0,0,.62);' +
      'color:#7CFC9B;font:600 11px/1.3 monospace;padding:3px 6px;border-radius:5px;pointer-events:none';
    el.textContent = 'BOT on';
    if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';
    stage.appendChild(el);
    return el;
  }

  /* ---------- tunggu stage game muncul (SPA, panel GAMES) ---------- */
  let current = null;
  let installedFor = null;

  function makeBot(stage) {
    const bot = {
      raf: null, running: false, debug: false,
      cap: 995, taps: 0, best: 0, runs: 0, deaths: 0,
      lastScore: 0, score: 0, fps: 0, scaleY: 1,
      frames: 0, fpsT: 0, lastTap: 0, restartAt: 0, done: false,
      MIN_TAP_GAP: 55,
      _lastFrameT: 0, _gapMax: 0,

      geom() {
        const svg = stage.querySelector('svg');
        const bird = stage.querySelector('img.flappy-bird-sprite');
        if (!svg || !bird) return null;

        const vb = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : null;
        const cssH = stage.clientHeight || 360;
        const cssW = stage.clientWidth || 640;
        const H = (vb && vb.height) || cssH;
        const W = (vb && vb.width) || cssW;

        this.scaleY = cssH ? H / cssH : 1;
        const topPx = parseFloat(bird.style.top);
        const y = Number.isFinite(topPx) ? topPx * this.scaleY : null;

        const pipes = [];
        for (const g of svg.querySelectorAll('g')) {
          const r = g.querySelectorAll('rect');
          if (r.length < 4) continue;
          const x = Number(r[0].getAttribute('x'));
          const gY = Number(r[0].getAttribute('height'));
          if (!Number.isFinite(x) || !Number.isFinite(gY)) continue;
          pipes.push({ x, gY });
        }
        pipes.sort((a, b) => a.x - b.x);

        const bX = 0.3 * W;
        const next = pipes.find(p => p.x + 0.1 * W >= bX - 0.028 * Math.min(W, H)) || null;
        const sc = svg.querySelector('.flappy-svg-score');
        const txt = stage.innerText || '';

        return {
          H, W, gapH: 0.24 * H, y, next,
          score: sc ? (Number(sc.textContent) || 0) : 0,
          dead: /game over/i.test(txt) || /tap \/ space to start/i.test(txt)
        };
      },

      tap() {
        const now = performance.now();
        if (now - this.lastTap < this.MIN_TAP_GAP && !this._forceTap) return;
        this.lastTap = now;
        try {
          stage.dispatchEvent(new PointerEvent('pointerdown', {
            bubbles: true, cancelable: true, pointerType: 'touch',
            isPrimary: true, buttons: 1, button: 0, pointerId: 1
          }));
        } catch (e) {
          stage.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, buttons: 1 }));
        }
        this.taps++;
      },

      tick() {
        const now = performance.now();
        if (this._lastFrameT) {
          const g = now - this._lastFrameT;
          if (g > this._gapMax) this._gapMax = g;
        }
        this._lastFrameT = now;

        if (++this.frames >= 30) {
          this.fps = Math.round(this.frames * 1000 / Math.max(1, now - this.fpsT));
          this.frames = 0;
          this.fpsT = now;
          const b = document.getElementById('flap-badge');
          if (b) b.textContent = 'BOT ' + this.score + ' | best ' + this.best + ' | ' + this.fps + 'fps';
          if (this.debug) console.log('[flap]', this.status());
        }
        if (!this.fpsT) this.fpsT = now;

        const s = this.geom();
        if (!s) return;
        this.score = s.score;

        if (s.dead) {
          if (this.lastScore > 0) {
            this.deaths++;
            this.runs++;
            this.best = Math.max(this.best, this.lastScore);
            console.log('[flap] mati di skor ' + this.lastScore + ' | best ' + this.best + ' | run ' + this.runs);
            this.lastScore = 0;
          }
          if (this.done) return;
          if (!this.restartAt) this.restartAt = now + 1200;
          if (now >= this.restartAt) {
            this.restartAt = 0;
            this._forceTap = true;
            this.tap();
            this._forceTap = false;
          }
          return;
        }

        this.restartAt = 0;
        if (s.score > this.lastScore) this.lastScore = s.score;

        if (s.score >= this.cap) {
          this.done = true;
          console.log('[flap] cap ' + s.score + ' -> stop, biarkan burung jatuh & skor tersimpan.');
          this.stop();
          return;
        }

        if (s.y == null) return;

        const thr = s.next ? s.next.gY + 0.68 * s.gapH : s.H * 0.63;
        if (s.y > thr) this.tap();
      },

      start() {
        if (this.running) return 'sudah jalan';
        this.running = true;
        this.done = false;
        this.frames = 0;
        this.fpsT = performance.now();
        this._lastFrameT = 0;
        this._gapMax = 0;
        const step = () => {
          if (!this.running) return;
          this.tick();
          this.raf = requestAnimationFrame(step);
        };
        this.raf = requestAnimationFrame(step);
        console.log('[flap] jalan. cap=' + this.cap + ' | stop: featherFlapBot.stop()');
        return 'on';
      },

      stop() {
        this.running = false;
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = null;
        const st = this.status();
        console.log('[flap] stop', st);
        return st;
      },

      status() {
        return {
          score: this.score, lastScore: this.lastScore, taps: this.taps,
          best: this.best, runs: this.runs, deaths: this.deaths,
          fps: this.fps, scaleY: +this.scaleY.toFixed(3),
          maxFrameGapMs: Math.round(this._gapMax), running: this.running
        };
      }
    };
    return bot;
  }

  function scan() {
    const stage = document.querySelector('.flappy-stage[role="application"]');
    if (!stage) return;

    /* stage baru (remount) -> pasang bot baru */
    if (stage !== installedFor) {
      if (current && current.running) current.stop();
      installedFor = stage;
      current = makeBot(stage);
      window.featherFlapBot = current;
      makeBadge(stage);
      window.featherFlapBot.start();
    }
  }

  setInterval(scan, 500);
  scan();
  console.log('[flap] userscript aktif — buka rak -> GAMES -> Play');
})();