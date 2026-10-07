(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const counterElement = document.getElementById('view-count');
  const SESSION_KEY = 'site_view_registered';

  async function loadViews() {
    const alreadyCounted = sessionStorage.getItem(SESSION_KEY);
    let count = null;

    // 1. Fetch from native Vercel /api/views endpoint
    try {
      const endpoint = alreadyCounted ? '/api/views' : '/api/views?inc=1';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.views === 'number') {
          count = data.views;
          if (!alreadyCounted) {
            sessionStorage.setItem(SESSION_KEY, 'true');
          }
        }
      }
    } catch (err) {
      console.warn('API endpoint unavailable, falling back:', err);
    }

    // 2. Direct public counter fallback
    if (count === null) {
      try {
        const action = alreadyCounted ? 'get' : 'hit';
        const res = await fetch(`https://abacus.jasoncameron.dev/${action}/nighty.sex/views`, {
          headers: { Accept: 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.value === 'number') {
            count = data.value;
            if (!alreadyCounted) {
              sessionStorage.setItem(SESSION_KEY, 'true');
            }
          }
        }
      } catch (err) {
        console.warn('Public counter fallback failed:', err);
      }
    }

    // 3. Local storage fallback
    if (count === null) {
      const local = Number(localStorage.getItem('nighty_views') || 0) + (alreadyCounted ? 0 : 1);
      localStorage.setItem('nighty_views', local);
      sessionStorage.setItem(SESSION_KEY, 'true');
      count = local;
    }

    if (counterElement && count !== null) {
      counterElement.textContent = new Intl.NumberFormat().format(count);
    }
  }

  document.addEventListener('DOMContentLoaded', loadViews);
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    loadViews();
  }
})();
