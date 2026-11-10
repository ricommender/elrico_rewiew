(() => {
  'use strict';

  // Website preview 1.1: re-playable intro, unchanged original logo.
  const intro = document.getElementById('intro');
  const site = document.getElementById('site');
  const skip = document.getElementById('skip-intro');
  const replay = document.getElementById('replay-intro');
  const count = document.getElementById('intro-count');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let closed = false;
  let returnFocus = false;
  let counterFrame = 0;
  let introTimer = 0;

  function finishIntro() {
    if (closed) return;
    closed = true;
    cancelAnimationFrame(counterFrame);
    clearTimeout(introTimer);
    intro.classList.add('done');
    intro.setAttribute('aria-hidden', 'true');
    intro.setAttribute('inert', '');
    site.removeAttribute('inert');
    site.classList.add('ready');
    document.body.classList.remove('intro-active');
    if (returnFocus) {
      replay.focus({preventScroll:true});
      returnFocus = false;
    } else {
      skip.blur();
    }
  }

  function startIntro(fromReplay = false) {
    if (reduced) return;
    cancelAnimationFrame(counterFrame);
    clearTimeout(introTimer);
    closed = false;
    returnFocus = fromReplay;
    count.textContent = '00';
    intro.removeAttribute('inert');
    intro.setAttribute('aria-hidden', 'false');
    intro.classList.remove('done', 'run');
    // Restart CSS animation without changing the logo artwork.
    void intro.offsetWidth;
    intro.classList.add('run');
    site.classList.remove('ready');
    site.setAttribute('inert', '');
    document.body.classList.add('intro-active');
    if (fromReplay) skip.focus({preventScroll:true});

    const startTime = performance.now();
    function updateCounter(now) {
      if (closed) return;
      const progress = Math.min(100, Math.round((now - startTime) / 29));
      count.textContent = String(progress).padStart(2,'0');
      if (progress < 100) counterFrame = requestAnimationFrame(updateCounter);
    }
    counterFrame = requestAnimationFrame(updateCounter);
    introTimer = setTimeout(finishIntro, 3150);
  }

  skip.addEventListener('click', finishIntro);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !closed) finishIntro();
  });
  replay.addEventListener('click', () => startIntro(true));
  if (reduced) finishIntro();
  else startIntro(false);

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