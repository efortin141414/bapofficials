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


// Regional chapter directory accordions, search, and expand/collapse controls
const regionCards = [...document.querySelectorAll('.region-directory-card')];
const regionSearch = document.getElementById('regionSearch');
const expandRegions = document.getElementById('expandRegions');
const noRegionResults = document.getElementById('regionNoResults');

function setRegionOpen(card, open) {
  const button = card.querySelector('.region-directory-head');
  const body = card.querySelector('.region-directory-body');
  if (!button || !body) return;
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  body.hidden = !open;
}

regionCards.forEach(card => {
  const button = card.querySelector('.region-directory-head');
  if (button) button.addEventListener('click', () => {
    setRegionOpen(card, button.getAttribute('aria-expanded') !== 'true');
  });
});

if (regionSearch) {
  regionSearch.addEventListener('input', () => {
    const q = regionSearch.value.trim().toLowerCase();
    let visible = 0;
    regionCards.forEach(card => {
      const match = !q || (card.dataset.region || '').includes(q);
      card.hidden = !match;
      if (match) {
        visible++;
        if (q) setRegionOpen(card, true);
      }
    });
    if (noRegionResults) noRegionResults.hidden = visible !== 0;
  });
}

if (expandRegions) {
  expandRegions.addEventListener('click', () => {
    const visibleCards = regionCards.filter(card => !card.hidden);
    const allOpen = visibleCards.length > 0 && visibleCards.every(card => card.querySelector('.region-directory-head')?.getAttribute('aria-expanded') === 'true');
    visibleCards.forEach(card => setRegionOpen(card, !allOpen));
    expandRegions.textContent = allOpen ? 'Expand All' : 'Collapse All';
  });
}
