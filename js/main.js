/* js/main.js — Brendan Lou S. Millares Portfolio
   Bootstrap 5 via CDN | No build step required
*/
'use strict';

// ── SMOOTH SCROLL ────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close mobile menu if open
      const navCollapse = document.getElementById('navbarMain');
      if (navCollapse && navCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    }
  });
});

// ── NAV ACTIVE LINK on scroll ────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-link[href^="#"]');

function updateActiveNav() {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 90) current = s.id;
  });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });

// ── FADE-UP — watch EVERY .fade-up element ───────────────────────
// Previous bug: only a narrow selector list was observed,
// so most elements with fade-up stayed at opacity:0 forever.
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);   // fire once only
      }
    });
  }, { threshold: 0.08 });           // low threshold so elements near the edge still fire

  // Select ALL elements that have fade-up class — no hardcoded list
  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
}

// ── PROJECT FILTER ───────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const filter = this.getAttribute('data-filter');
    document.querySelectorAll('.project-item').forEach(item => {
      item.style.display =
        (filter === 'all' || item.getAttribute('data-cat') === filter) ? '' : 'none';
    });
  });
});

// ── SKILL BAR ANIMATION on scroll ────────────────────────────────
if ('IntersectionObserver' in window) {
  const skillObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target.querySelector('.progress-bar');
        if (bar && !bar.dataset.animated) {
          const target = bar.style.width;
          bar.style.width = '0%';
          bar.dataset.animated = '1';
          requestAnimationFrame(() => {
            setTimeout(() => { bar.style.width = target; }, 80);
          });
        }
        skillObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.progress').forEach(p => skillObs.observe(p));
}

// ── HERO PORTRAIT — show placeholder if image fails to load ──────
const heroImg = document.getElementById('heroPortraitImg');
const heroPlaceholder = document.getElementById('heroPlaceholder');
if (heroImg && heroPlaceholder) {
  heroImg.addEventListener('load', () => {
    heroPlaceholder.style.display = 'none';
  });
  heroImg.addEventListener('error', () => {
    heroImg.style.display = 'none';
    heroPlaceholder.style.display = 'flex';
  });
  // Already loaded (cached)
  if (heroImg.complete && heroImg.naturalHeight > 0) {
    heroPlaceholder.style.display = 'none';
  }
}

// ── CONTACT FORM VALIDATION ──────────────────────────────────────
const contactForm = document.getElementById('contactForm');
const submitBtn   = document.getElementById('submitBtn');
if (contactForm && submitBtn) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();
    contactForm.classList.add('was-validated');
    if (!contactForm.checkValidity()) return;

    const orig = submitBtn.textContent;
    submitBtn.textContent = 'Sent \u2713';
    submitBtn.disabled = true;
    submitBtn.style.cssText = 'background:#22c55e;border-color:#22c55e;color:#fff';
    setTimeout(() => {
      submitBtn.textContent = orig;
      submitBtn.disabled = false;
      submitBtn.style.cssText = '';
      contactForm.reset();
      contactForm.classList.remove('was-validated');
    }, 3000);
  });
}