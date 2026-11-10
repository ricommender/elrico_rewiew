(() => {
  'use strict';
  const intro = document.getElementById('intro');
  const site = document.getElementById('site');
  const skip = document.getElementById('skip-intro');
  const count = document.getElementById('intro-count');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let closed = false;
  function finishIntro() {
    if (closed) return;
    closed = true;
    intro.classList.add('done');
    intro.setAttribute('aria-hidden', 'true');
    site.classList.add('ready');
    document.body.classList.remove('intro-active');
    skip.blur();
  }
  if (!reduced) {
    document.body.classList.add('intro-active');
    const started = performance.now();
    function animateCounter(now) {
      if (closed) return;
      const progress = Math.min(100, Math.floor((now - started) / 25));
      count.textContent = String(progress).padStart(2,'0');
      if (progress < 100) requestAnimationFrame(animateCounter);
      else setTimeout(finishIntro, 300);
    }
    requestAnimationFrame(animateCounter);
    skip.addEventListener('click', finishIntro);
    document.addEventListener('keydown', e => {if(e.key === 'Escape') finishIntro();});
  } else finishIntro();

  const visual = document.getElementById('hero-visual');
  const stage = document.getElementById('logo-stage');
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    visual.addEventListener('pointermove', event => {
      const box = visual.getBoundingClientRect();
      const x = (event.clientX-box.left)/box.width-.5;
      const y = (event.clientY-box.top)/box.height-.5;
      stage.style.transform = 'rotate(-5deg) rotateY('+ (x*10).toFixed(2)+'deg) rotateX('+(-y*9).toFixed(2)+'deg) translateY('+(-y*8).toFixed(1)+'px)';
    });
    visual.addEventListener('pointerleave', () => {stage.style.transform = 'rotate(-5deg)';});
  }

  const reveals = document.querySelectorAll('.reveal');
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