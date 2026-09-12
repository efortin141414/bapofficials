const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.textContent = open ? '✕' : '☰';
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰';
    });
  });
}
document.getElementById('year').textContent = new Date().getFullYear();


// Regional chapter directory accordions, search, and expand/collapse controls.
// Uses event delegation so chapters added from Supabase work immediately.
const regionDirectory = document.getElementById('regionDirectory');
const regionSearch = document.getElementById('regionSearch');
const expandRegions = document.getElementById('expandRegions');
const noRegionResults = document.getElementById('regionNoResults');

function currentRegionCards() { return [...document.querySelectorAll('.region-directory-card')]; }
function setRegionOpen(card, open) {
  const button = card.querySelector('.region-directory-head');
  const body = card.querySelector('.region-directory-body');
  const icon = card.querySelector('.region-toggle');
  if (!button || !body) return;
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  body.hidden = !open;
  if (icon) icon.textContent = open ? '−' : '＋';
}

regionDirectory?.addEventListener('click', e => {
  const button = e.target.closest('.region-directory-head');
  if (!button) return;
  const card = button.closest('.region-directory-card');
  if (card) setRegionOpen(card, button.getAttribute('aria-expanded') !== 'true');
});

function filterRegions() {
  const q = (regionSearch?.value || '').trim().toLowerCase();
  let visible = 0;
  currentRegionCards().forEach(card => {
    const match = !q || (card.dataset.region || '').includes(q);
    card.hidden = !match;
    if (match) { visible++; if (q) setRegionOpen(card,true); }
  });
  if (noRegionResults) noRegionResults.hidden = visible !== 0;
}
regionSearch?.addEventListener('input', filterRegions);

expandRegions?.addEventListener('click', () => {
  const visibleCards = currentRegionCards().filter(card => !card.hidden);
  const allOpen = visibleCards.length > 0 && visibleCards.every(card => card.querySelector('.region-directory-head')?.getAttribute('aria-expanded') === 'true');
  visibleCards.forEach(card => setRegionOpen(card,!allOpen));
  expandRegions.textContent = allOpen ? 'Expand All' : 'Collapse All';
});
