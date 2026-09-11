(function () {
  const loading = document.getElementById('announcement-loading');
  const errorBox = document.getElementById('announcement-error');
  const detail = document.getElementById('announcement-detail');
  const imageWrap = document.getElementById('announcement-image-wrap');
  const image = document.getElementById('announcement-image');
  const title = document.getElementById('announcement-title');
  const category = document.getElementById('announcement-category');
  const date = document.getElementById('announcement-date');
  const body = document.getElementById('announcement-body');
  const share = document.getElementById('announcement-share');

  const safeUrl = (v='') => /^https:\/\//i.test(String(v)) ? String(v) : '';
  const fmtDate = (v) => {
    if (!v) return '';
    const raw = String(v);
    const d = new Date(raw + (raw.length === 10 ? 'T00:00:00' : ''));
    return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
  };
  function fail(message) {
    loading.hidden = true;
    detail.hidden = true;
    errorBox.hidden = false;
    errorBox.textContent = message;
  }

  async function init() {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) return fail('Announcement not found. The link is missing an announcement ID.');
    try {
      const db = window.getBaptoSupabase();
      const { data, error } = await db.from('announcements').select('id,title,category,body,event_date,image_url,published,published_at,created_at').eq('id', id).eq('published', true).maybeSingle();
      if (error) throw error;
      if (!data) return fail('This announcement is unavailable or is no longer published.');

      document.title = `${data.title} | BAP Technical Officials Inc.`;
      title.textContent = data.title || 'Announcement';
      category.textContent = data.category || 'Announcement';
      date.textContent = fmtDate(data.event_date || data.published_at || data.created_at);
      body.textContent = data.body || '';

      const src = safeUrl(data.image_url);
      if (src) {
        image.src = src;
        image.alt = `${data.title || 'Announcement'} poster`;
        imageWrap.hidden = false;
        image.addEventListener('error', () => { imageWrap.hidden = true; }, {once:true});
      }

      loading.hidden = true;
      detail.hidden = false;
    } catch (err) {
      fail(`Could not load this announcement. ${err?.message || ''}`.trim());
    }
  }

  share?.addEventListener('click', async () => {
    const shareData = { title: document.title.replace(' | BAP Technical Officials Inc.',''), url: location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(location.href);
        const original = share.textContent;
        share.textContent = 'Link copied ✓';
        share.disabled = true;
        setTimeout(() => { share.textContent = original; share.disabled = false; }, 1800);
      }
    } catch (_) {}
  });

  init();
})();
