(function () {
  const metrikaCounterId = 110576640;
  const metrikaSrc = 'https://mc.yandex.ru/metrika/tag.js';

  if (!window.__kamchatkaInjectLoaded) {
    window.__kamchatkaInjectLoaded = true;

    window.ym = window.ym || function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = window.ym.l || Number(new Date());

    if (!document.querySelector(`script[src="${metrikaSrc}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = metrikaSrc;
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    window.ym(metrikaCounterId, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    });
  }

  if (!window.__kamchatkaAffiliateGoalBound) {
    window.__kamchatkaAffiliateGoalBound = true;

    document.addEventListener('click', (event) => {
      const link = event.target.closest?.('a[href*="travelme.g2afse.com/click"]');
      if (!link || typeof window.ym !== 'function') return;

      window.ym(metrikaCounterId, 'reachGoal', 'affiliate_click', {
        url: link.href,
        text: link.textContent.trim(),
        page: window.location.pathname
      });
    });
  }
})();
