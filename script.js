(() => {
  'use strict';

  // Cinematic preview v1.3: honest, non-blocking video readiness.
  // The original final logo and the Magnific film are never regenerated.
  const intro = document.getElementById('intro');
  const site = document.getElementById('site');
  const skip = document.getElementById('skip-intro');
  const replay = document.getElementById('replay-intro');
  const video = document.getElementById('intro-video');
  const status = document.getElementById('intro-status');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let closed = true;
  let returningFocus = false;
  let phase = 'idle';
  let sequence = 0;
  let pendingPlay = false;
  let readyTimeout = 0;
  let fallbackTimeout = 0;
  let filmTimeout = 0;
  let bufferingTimeout = 0;

  function clearIntroTimers() {
    clearTimeout(readyTimeout);
    clearTimeout(fallbackTimeout);
    clearTimeout(filmTimeout);
    clearTimeout(bufferingTimeout);
  }

  function setIntroStatus(message) {
    if (status && status.textContent !== message) status.textContent = message;
  }

  function finishIntro() {
    if (closed) return;
    closed = true;
    sequence += 1;
    clearIntroTimers();
    if (video) video.pause();
    intro.classList.add('done');
    intro.classList.remove('has-film', 'buffering');
    intro.setAttribute('aria-hidden', 'true');
    intro.setAttribute('inert', '');
    site.removeAttribute('inert');
    site.classList.add('ready');
    document.body.classList.remove('intro-active');
    if (returningFocus) {
      replay.focus({preventScroll: true});
      returningFocus = false;
    } else if (document.activeElement === skip) {
      skip.blur();
    }
  }

  function playFallback() {
    if (closed || phase !== 'loading') return;
    phase = 'fallback';
    pendingPlay = false;
    clearTimeout(readyTimeout);
    intro.classList.remove('has-film', 'buffering');
    intro.classList.add('fallback');
    setIntroStatus('ORB-ANIMATION');
    // A slow or blocked video must never block access to the actual page.
    fallbackTimeout = setTimeout(finishIntro, 1550);
  }

  function tryStartFilm() {
    if (!video || closed || phase !== 'loading' || pendingPlay || video.readyState < 3) return;
    pendingPlay = true;
    const token = sequence;
    try {
      const promise = video.play();
      Promise.resolve(promise).then(() => {
        if (closed || sequence !== token || phase !== 'loading') {
          video.pause();
          return;
        }
        pendingPlay = false;
        phase = 'film';
        clearTimeout(readyTimeout);
        intro.classList.remove('fallback', 'buffering');
        intro.classList.add('has-film');
        setIntroStatus('FILMSEQUENZ AKTIV');
        // Includes a little margin over the real 5.04 second movie.
        filmTimeout = setTimeout(finishIntro, 6000);
      }).catch(() => {
        if (!closed && sequence === token) playFallback();
      });
    } catch (_) {
      playFallback();
    }
  }

  function startIntro(fromReplay = false) {
    if (reduced) return;
    sequence += 1;
    clearIntroTimers();
    if (video) {
      video.pause();
      try { video.currentTime = 0; } catch (_) {}
    }
    closed = false;
    returningFocus = fromReplay;
    pendingPlay = false;
    phase = 'loading';

    intro.removeAttribute('inert');
    intro.setAttribute('aria-hidden', 'false');
    intro.classList.remove('done', 'run', 'fallback', 'buffering', 'has-film');
    // Restarts the CSS orb/metal fallback without changing either image.
    void intro.offsetWidth;
    intro.classList.add('run');
    site.classList.remove('ready');
    site.setAttribute('inert', '');
    document.body.classList.add('intro-active');
    setIntroStatus('FILM WIRD GELADEN');
    if (fromReplay) skip.focus({preventScroll: true});

    // Never force the visitor to wait for a large media download.
    readyTimeout = setTimeout(playFallback, 1850);
    if (video) {
      if (video.readyState >= 3) tryStartFilm();
      else video.load();
    } else {
      playFallback();
    }
  }

  if (video) {
    video.addEventListener('canplay', tryStartFilm);
    video.addEventListener('loadeddata', tryStartFilm);
    video.addEventListener('ended', () => {
      if (!closed && phase === 'film') finishIntro();
    });
    video.addEventListener('error', () => {
      if (!closed && phase === 'loading') playFallback();
      else if (!closed && phase === 'film') finishIntro();
    });
    video.addEventListener('waiting', () => {
      if (closed || phase !== 'film') return;
      intro.classList.add('buffering');
      setIntroStatus('ORB BLEIBT AKTIV');
      clearTimeout(bufferingTimeout);
      bufferingTimeout = setTimeout(finishIntro, 1500);
    });
    video.addEventListener('playing', () => {
      if (closed || phase !== 'film') return;
      clearTimeout(bufferingTimeout);
      intro.classList.remove('buffering');
      setIntroStatus('FILMSEQUENZ AKTIV');
    });
  }

  skip.addEventListener('click', finishIntro);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !closed) finishIntro();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !closed) finishIntro();
  });
  replay.addEventListener('click', () => startIntro(true));
  if (reduced) {
    closed = false;
    if (video) {
      video.preload = 'none';
      video.removeAttribute('src');
    }
    finishIntro();
  } else {
    startIntro(false);
  }

  // Thin reading-progress line and nav contrast as the page scrolls.
  const progressFill = document.getElementById('page-progress-fill');
  const nav = document.getElementById('nav');
  let scrollFrame = 0;
  function updateScrollState() {
    scrollFrame = 0;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / max));
    progressFill.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    nav.classList.toggle('scrolled', window.scrollY > 22);
  }
  function requestScrollState() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollState);
  }
  window.addEventListener('scroll', requestScrollState, {passive:true});
  window.addEventListener('resize', requestScrollState);
  updateScrollState();

  const visual = document.getElementById('hero-visual');
  const stage = document.getElementById('logo-stage');
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    visual.addEventListener('pointermove', event => {
      const box = visual.getBoundingClientRect();
      const x = (event.clientX-box.left)/box.width-.5;
      const y = (event.clientY-box.top)/box.height-.5;
      visual.closest('.hero').style.setProperty('--grid-x', (x * 8).toFixed(1) + 'px');
      visual.closest('.hero').style.setProperty('--grid-y', (y * 8).toFixed(1) + 'px');
      stage.style.transform = 'rotate(-5deg) rotateY('+ (x*10).toFixed(2)+'deg) rotateX('+(-y*9).toFixed(2)+'deg) translateY('+(-y*8).toFixed(1)+'px)';
    });
    visual.addEventListener('pointerleave', () => {stage.style.transform = 'rotate(-5deg)';visual.closest('.hero').style.removeProperty('--grid-x');visual.closest('.hero').style.removeProperty('--grid-y');});
  }

  const reveals = document.querySelectorAll('.reveal');
  const revealGroups = document.querySelectorAll('.focus-item.reveal');
  revealGroups.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', (index * 95) + 'ms');
  });
  if ('IntersectionObserver' in window && !reduced) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:.12,rootMargin:'0px 0px -30px 0px'});
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('visible'));

  const modes = {
    build: {direction:'"AI Application"',output:'Aus einer Idee wird eine Anwendung.'},
    automate: {direction:'"Smart Automation"',output:'Routine wird zum automatisierten Workflow.'},
    create: {direction:'"Creative Experiment"',output:'Neue Fragen. Neue Möglichkeiten.'}
  };
  const direction = document.getElementById('terminal-direction');
  const output = document.getElementById('terminal-output');
  document.querySelectorAll('.lab-choice').forEach(button => {
    button.addEventListener('click', () => {
      const mode = modes[button.dataset.mode];
      if (!mode) return;
      document.querySelectorAll('.lab-choice').forEach(item => {
        const selected = item === button;
        item.classList.toggle('active',selected);
        item.setAttribute('aria-pressed',String(selected));
      });
      direction.textContent = mode.direction;
      output.textContent = mode.output;
    });
  });

  const form = document.getElementById('brief-form');
  const feedback = document.getElementById('form-feedback');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const idea = document.getElementById('brief-idea').value.trim();
    if (!idea) {
      feedback.textContent = 'Bitte zuerst deine Idee eingeben.';
      return;
    }
    const type = document.getElementById('brief-type').value;
    const brief = ['ELRICO.DE – IDEENBRIEFING','','Bereich: '+type,'','Idee:',idea,'','Nächster Schritt: Konzept und mögliche Umsetzung klären.'].join('\n');
    try {
      await navigator.clipboard.writeText(brief);
      feedback.textContent='Briefing kopiert. Du kannst es jetzt in eine Nachricht einfügen.';
      feedback.classList.add('success');
    } catch {
      const field=document.createElement('textarea');
      field.value=brief;field.style.position='fixed';field.style.opacity='0';
      document.body.appendChild(field);
      field.select();
      const copied=document.execCommand('copy');
      field.remove();
      feedback.textContent=copied?'Briefing kopiert.':'Kopieren nicht möglich. Bitte Text aus dem Eingabefeld kopieren.';
      feedback.classList.toggle('success',copied);
    }
  });
})();