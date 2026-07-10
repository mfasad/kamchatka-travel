import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pages, pageByPath, site } from './src/pages.mjs';
import { youtravelTours } from './src/youtravel-tours.generated.mjs';

const dist = join(process.cwd(), 'dist');
if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(process.cwd(), 'public'), dist, { recursive: true });

const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const absolute = (path) => `${site.url}${path}`;
const partnerAttrs = `href="${site.partnerUrl}" target="_blank" rel="nofollow noopener"`;
const partnerAttrsFor = (page) => {
  const url = page?.partnerPath ? `${site.partnerBaseUrl}&path=${encodeURI(page.partnerPath)}` : site.partnerUrl;
  return `href="${url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener"`;
};

function nav(currentPath) {
  const items = pages.filter((page) => page.nav);
  return items.map((item) => {
    const active = currentPath === item.path || (item.path !== '/o-proekte/' && currentPath.startsWith(item.path));
    return `<a href="${item.path}"${active ? ' aria-current="page"' : ''}>${esc(item.nav)}</a>`;
  }).join('');
}

function header(currentPath) {
  return `<a class="skip-link" href="#content">К содержанию</a>
  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="/" aria-label="На главную">
        <span class="brand-mark">▲</span>
        <span>Камчатка — трэвел<small>независимый путеводитель</small></span>
      </a>
      <button class="menu-button" type="button" data-menu-button aria-expanded="false" aria-controls="site-menu">Меню</button>
      <nav class="site-nav" id="site-menu" data-menu aria-label="Основная навигация">${nav(currentPath)}</nav>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="site-footer">
    <div class="shell">
      <div class="footer-grid">
        <div><a class="brand" href="/"><span class="brand-mark">▲</span><span>Камчатка — трэвел</span></a><p class="footer-about">Независимый путеводитель по форматам путешествий. Мы не являемся туроператором и не принимаем оплату за туры.</p></div>
        <div><div class="footer-title">Планировать</div><div class="footer-links"><a href="/tury/">Туры</a><a href="/ekskursii/">Экскурсии</a><a href="/blog/kogda-ehat/">Когда ехать</a><a href="/blog/skolko-stoit-poezdka/">Бюджет</a></div></div>
        <div><div class="footer-title">Исследовать</div><div class="footer-links"><a href="/blog/vulkany-kamchatki/">Вулканы</a><a href="/blog/kity-na-kamchatke/">Киты и косатки</a><a href="/tury/rybalka/">Рыбалка</a><a href="/blog/dostoprimechatelnosti/">Что посмотреть</a></div></div>
        <div><div class="footer-title">Проект</div><div class="footer-links"><a href="/o-proekte/">О проекте</a><a href="/privacy/">Конфиденциальность</a><a ${partnerAttrs}>Предложения партнёра ↗</a></div></div>
      </div>
      <div class="footer-bottom"><span>© «Камчатка — трэвел»</span><span>Цены, даты и доступность проверяйте перед бронированием.</span></div>
    </div>
  </footer>`;
}

function head({ title, description, path, type = 'website', schema = [] }) {
  const fullTitle = path === '/' ? title : `${title} — Камчатка: трэвел`;
  return `<!doctype html><html lang="ru"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title><meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${absolute(path)}"><meta name="robots" content="index,follow,max-image-preview:large">
  <meta property="og:type" content="${type}"><meta property="og:locale" content="ru_RU"><meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${absolute(path)}">
  <meta property="og:image" content="${absolute('/images/hero-kamchatka.jpg')}"><meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#17221f"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/style.css?v=20260710-jeep-v9">
  ${schema.map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join('\n')}
  </head><body>`;
}

function breadcrumbItems(page) {
  const items = [{ name: 'Главная', path: '/' }];
  if (page.parent) {
    const parent = pageByPath.get(page.parent);
    if (parent) items.push({ name: parent.nav || parent.title, path: parent.path });
  }
  items.push({ name: page.title, path: page.path });
  return items;
}

function breadcrumbMarkup(page) {
  return breadcrumbItems(page).map((item, index, array) => index === array.length - 1 ? esc(item.name) : `<a href="${item.path}">${esc(item.name)}</a> <span aria-hidden="true">/</span> `).join('');
}

function schemas(page) {
  const crumbs = breadcrumbItems(page);
  const output = [{
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: absolute(item.path) }))
  }];
  if (page.type === 'article') output.push({
    '@context': 'https://schema.org', '@type': 'Article', headline: page.title,
    description: page.description, inLanguage: 'ru', mainEntityOfPage: absolute(page.path),
    image: absolute(page.image || '/images/hero-kamchatka.jpg'), author: { '@type': 'Organization', name: site.name },
    publisher: { '@type': 'Organization', name: site.name }, dateModified: '2026-06-28'
  });
  if (page.faqs?.length) output.push({
    '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: page.faqs.map((item) => ({
      '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer }
    }))
  });
  return output;
}

const imageFor = (page) => page.image || (page.path.includes('rybalka') ? '/images/fishing-kamchatka.jpg' : page.path.includes('kity') ? '/images/orca-kamchatka.jpg' : '/images/hero-kamchatka.jpg');

function cards(paths = []) {
  return paths.map((path) => pageByPath.get(path)).filter(Boolean).map((page) => `<article class="card card-link" data-reveal>
    <a href="${page.path}" class="card-link"><img class="card-image" src="${imageFor(page)}" alt="" loading="lazy" width="768" height="512">
    <div class="card-body"><span class="card-kicker">${esc(page.eyebrow)}</span><h3>${esc(page.title)}</h3><p>${esc(page.lead)}</p><span class="card-arrow">Читать →</span></div></a>
  </article>`).join('');
}

function formatRub(value) {
  if (!value) return 'цену уточняйте';
  return new Intl.NumberFormat('ru-RU').format(Number(value)) + ' ₽';
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00Z`));
}

function tourMeta(tour) {
  const dates = tour.dateFrom && tour.dateTo ? `${formatDate(tour.dateFrom)} — ${formatDate(tour.dateTo)}` : 'актуальные даты у организатора';
  const spaces = tour.freeSpaces ? `${tour.freeSpaces} мест` : 'места уточняйте';
  const group = tour.groupSize ? `группа до ${tour.groupSize}` : '';
  return [dates, spaces, group].filter(Boolean).join(' · ');
}

function stableTourMeta(tour) {
  const group = tour.groupSize ? `группа до ${tour.groupSize}` : '';
  const types = (tour.types || []).slice(0, 2).join(', ');
  return [types, group, 'даты и места у организатора'].filter(Boolean).join(' · ');
}

function durationLabel(tour) {
  if (!tour.durationDays) return 'срок у организатора';
  if (tour.durationDays === 1) return '1 день';
  if (tour.durationDays >= 2 && tour.durationDays <= 4) return `${tour.durationDays} дня`;
  return `${tour.durationDays} дней`;
}

function partnerTourTable(page) {
  const tours = youtravelTours.byPage?.[page.path] || [];
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare" id="compare-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Многодневные программы</p><h2>Многодневные джип-туры по Камчатке</h2></div><p>Формат для большой первой поездки: вулканы, океан, источники, грунтовки и несколько дней в маршруте. Сравнивайте не только цену, но и темп программы, размер группы, транспорт и запасной сценарий на случай тумана, дождя или закрытой дороги.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Тур</th><th>Формат</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.slice(0, 8).map((tour) => `<tr>
      <td class="tour-name"><strong>${tour.title}</strong><small>Многодневный джип-тур${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small></td>
      <td class="tour-format">${esc((tour.types || []).slice(0, 2).join(', ') || 'джип-тур')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Посмотреть даты и места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
  </div></section>`;
}

function partnerTourBlock(page) {
  const tours = youtravelTours.byPage?.[page.path] || [];
  if (!tours.length) return '';
  return `<section class="section section-tight partner-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Подборка туров</p><h2>${page.path === '/tury/dzhip-tury/' ? 'Джип-туры и внедорожные маршруты' : 'Актуальные предложения партнёра'}</h2></div><p>Откройте понравившуюся программу, чтобы посмотреть актуальные даты, свободные места, финальную стоимость и условия бронирования у организатора.</p></div>
    <div class="tour-grid">${tours.map((tour) => `<article class="tour-card" data-reveal>
      <div class="tour-card-top"><span class="tour-badge">${esc((tour.types || [])[0] || 'Тур')}</span><strong class="tour-price-badge">${tour.price ? `от ${formatRub(tour.price)}` : 'цена у организатора'}</strong></div>
      <h3>${tour.title}</h3>
      <p>${page.path === '/tury/dzhip-tury/' ? esc(stableTourMeta(tour)) : esc(tourMeta(tour))}</p>
      <ul>
        ${tour.expert ? `<li>Организатор: ${esc(tour.expert)}${tour.rating ? ` · рейтинг ${esc(tour.rating)}` : ''}</li>` : ''}
        ${page.path === '/tury/dzhip-tury/' ? '<li>Актуальные заезды и места — на странице тура</li>' : tour.totalDates ? `<li>Доступных дат: ${esc(tour.totalDates)}</li>` : ''}
        ${tour.accommodation?.length ? `<li>${esc(tour.accommodation.slice(0, 2).join(', '))}</li>` : ''}
      </ul>
      <a class="button button-primary" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">${page.path === '/tury/dzhip-tury/' ? 'Посмотреть даты и места ↗' : 'Смотреть тур ↗'}</a>
    </article>`).join('')}</div>
    <p class="partner-tours-note">Мы не являемся туроператором и не принимаем оплату за туры. Подборка помогает быстро сравнить варианты, а актуальные условия бронирования открываются на странице организатора.</p>
  </div></section>`;
}

function oneDayJeepBlock(page) {
  if (page.path !== '/tury/dzhip-tury/') return '';
  const tours = youtravelTours.byPage?.['/tury/dzhip-tury/one-day'] || [];
  if (!tours.length) return '';
  return `<section class="section section-tight one-day-jeep" id="one-day-jeep-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">На один день</p><h2>Однодневные джип-туры по Камчатке</h2></div><p>Короткий формат для тех, кто хочет увидеть вулканы, перевалы, каньоны или термальные источники без смены гостиницы. Такие джип-туры удобно добавить к основной поездке или выбрать как первый внедорожный выезд по Камчатке.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table one-day-table"><thead><tr><th>Тур</th><th>Срок</th><th>Формат</th><th>Организатор</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${tour.title}</strong><small>Однодневный джип-тур</small></td>
      <td class="tour-format">${esc(durationLabel(tour))}</td>
      <td class="tour-price">${esc((tour.types || []).slice(0, 2).join(', ') || 'джип-тур')}</td>
      <td class="tour-group">${tour.expert ? esc(tour.expert) : 'Организатор тура'}${tour.rating ? `<small>рейтинг ${esc(tour.rating)}</small>` : ''}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Посмотреть стоимость ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
  </div></section>`;
}

function jeepQuizBlock(page) {
  if (page.path !== '/tury/dzhip-tury/') return '';
  return `<section class="section section-tight jeep-quiz-section" id="jeep-quiz"><div class="shell">
    <div class="jeep-quiz" data-jeep-quiz>
      <div class="jeep-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Подобрать джип-тур по Камчатке за 30 секунд</h2>
        <p>Выберите формат поездки и отметьте, что для вас важнее. Это не бронирование, а быстрый фильтр мышления перед переходом к реальным программам.</p>
      </div>
      <div class="jeep-quiz-panel">
        <div class="jeep-quiz-tabs" role="tablist" aria-label="Формат джип-тура">
          <button type="button" class="is-active" data-jeep-tab="one-day" role="tab" aria-selected="true">Однодневный</button>
          <button type="button" data-jeep-tab="multi-day" role="tab" aria-selected="false">Многодневный</button>
        </div>
        <div class="jeep-quiz-pane is-active" data-jeep-pane="one-day">
          <fieldset>
            <legend>Какой выезд нужен на один день?</legend>
            <label><input type="radio" name="jeep-one-focus" value="volcano" checked> Вулкан, перевал или лавовые поля</label>
            <label><input type="radio" name="jeep-one-focus" value="ocean"> Океан, пляж, бухты и видовые дороги</label>
            <label><input type="radio" name="jeep-one-focus" value="springs"> Термальные источники, каньон или спокойный маршрут</label>
          </fieldset>
          <fieldset>
            <legend>Какой темп комфортен?</legend>
            <label><input type="radio" name="jeep-one-style" value="active" checked> Активно, но без спортивного экстрима</label>
            <label><input type="radio" name="jeep-one-style" value="comfort"> Побольше комфорта, понятной логистики и можно с ребёнком</label>
            <label><input type="radio" name="jeep-one-style" value="private"> Небольшая компания или индивидуальный формат</label>
          </fieldset>
        </div>
        <div class="jeep-quiz-pane" data-jeep-pane="multi-day" hidden>
          <fieldset>
            <legend>Какой многодневный маршрут ближе?</legend>
            <label><input type="radio" name="jeep-multi-duration" value="week" checked> 5–8 дней: первая большая поездка по Камчатке</label>
            <label><input type="radio" name="jeep-multi-duration" value="long"> 9+ дней: максимум локаций и меньше спешки</label>
            <label><input type="radio" name="jeep-multi-duration" value="comfort"> Спокойнее, с проживанием и понятными переездами</label>
          </fieldset>
          <fieldset>
            <legend>Что важнее в программе?</legend>
            <label><input type="radio" name="jeep-multi-focus" value="volcano" checked> Вулканы, океан и главные места в одной поездке</label>
            <label><input type="radio" name="jeep-multi-focus" value="max"> Больше локаций и насыщенный маршрут</label>
            <label><input type="radio" name="jeep-multi-focus" value="family"> Побольше комфорта, понятной логистики и можно с ребёнком</label>
          </fieldset>
        </div>
        <div class="jeep-quiz-result" data-jeep-quiz-result>
          <strong>Откроем подборку джип-туров по Камчатке.</strong>
          <span>На странице партнёра вы сможете сравнить даты, стоимость, места и детали маршрута у организаторов.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" data-jeep-quiz-link ${partnerAttrsFor(page)}>Показать подходящие туры ↗</a>
        </div>
      </div>
    </div>
  </div></section>`;
}

function jeepStickyCta(page) {
  if (page.path !== '/tury/dzhip-tury/') return '';
  return `<div class="mobile-sticky-cta" aria-label="Быстрый выбор джип-тура">
    <a class="button button-primary" href="#jeep-quiz">Подобрать джип-тур</a>
    <a class="button" ${partnerAttrsFor(page)}>Даты и места ↗</a>
  </div>`;
}

function jeepConversionBlocks(page) {
  if (page.path !== '/tury/dzhip-tury/') return '';
  return `<section class="section section-tight jeep-lead"><div class="shell">
    <p>Джип-туры по Камчатке бывают двух типов: многодневные внедорожные маршруты и короткие выезды на один день. Сначала сравните большие программы с проживанием и плотной логистикой, затем посмотрите однодневные варианты из Петропавловска-Камчатского и окрестностей.</p>
  </div></section>
  ${jeepQuizBlock(page)}
  ${partnerTourTable(page)}
  ${oneDayJeepBlock(page)}
  <section class="section section-tight jeep-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Лучшие джип-туры по Камчатке — не те, где больше точек</h2><p>Сильная программа оставляет время на локации, честно показывает длительность переездов и заранее объясняет, что будет при закрытой дороге или тумане.</p><a class="button button-light" href="#best-jeep-tours">Чек-лист выбора</a></article>
    <article class="proof-card"><img src="/images/jeep-kamchatka-road-ai.jpg" alt="" loading="lazy" width="768" height="512"><h3>Дорога важнее обещаний</h3><p>На Камчатке маршрут зависит от грунтовки, бродов, дождя и решения гида. Поэтому мы смотрим не только цену, но и запасной сценарий.</p></article>
    <article class="proof-card"><img src="/images/jeep-kamchatka-ocean-ai.jpg" alt="" loading="lazy" width="768" height="512"><h3>Оффроуд без лишнего героизма</h3><p>Хороший оффроуд-тур — это безопасная заброска к вулканам, океану и источникам, а не экстремальная поездка ради тряски.</p></article>
  </div></section>`;
}

function faqBlock(items = []) {
  if (!items.length) return '';
  return `<section class="faq"><h2>Частые вопросы</h2>${items.map((item) => `<details><summary>${esc(item.question)}</summary><p>${esc(item.answer)}</p></details>`).join('')}</section>`;
}

function pageTemplate(page) {
  const isLegal = page.type === 'legal';
  const pagePartnerAttrs = partnerAttrsFor(page);
  return `${head({ title: page.title, description: page.description, path: page.path, type: page.type === 'article' ? 'article' : 'website', schema: schemas(page) })}
  ${header(page.path)}
  <main id="content">
    <section class="page-hero" style="--page-hero-image: url('${imageFor(page)}')"><div class="shell"><div class="breadcrumbs">${breadcrumbMarkup(page)}</div><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.title)}</h1><p class="page-lead">${esc(page.lead)}</p></div></section>
    ${jeepConversionBlocks(page)}
    <section class="section"><div class="shell content-layout">
      <article class="content">${page.sections.map(([title, body]) => `<section><h2>${esc(title)}</h2>${body}</section>`).join('')}${faqBlock(page.faqs)}</article>
      <aside class="sidebar"><h2>${isLegal ? 'Навигация по проекту' : 'Сравнить программы'}</h2><p>${isLegal ? 'Перейдите к путеводителю или подборке форматов путешествия.' : 'Актуальные цены, даты и условия бронирования находятся на стороне организатора.'}</p><a class="button button-primary" ${isLegal ? 'href="/tury/"' : pagePartnerAttrs}>${isLegal ? 'Перейти к турам' : 'Посмотреть предложения ↗'}</a><ul class="mini-list"><li><a href="/blog/kogda-ehat/">Когда лучше ехать</a></li><li><a href="/blog/skolko-stoit-poezdka/">Из чего складывается бюджет</a></li><li><a href="/o-proekte/">Как работает проект</a></li></ul></aside>
    </div></section>
    ${!isLegal ? partnerTourBlock(page) : ''}
    ${page.cards?.length ? `<section class="section section-tight related"><div class="shell"><div class="section-head"><div><p class="eyebrow">Продолжить подготовку</p><h2>Полезно по теме</h2></div><p>Связанные маршруты и практические инструкции.</p></div><div class="grid grid-3">${cards(page.cards)}</div></div></section>` : ''}
    ${!isLegal ? `<section class="section section-tight"><div class="shell"><div class="cta"><div><h2>Сначала разобраться.<br>Потом бронировать.</h2><p>Сравните программу, задайте вопросы организатору и проверьте актуальные условия.</p></div><a class="button" ${pagePartnerAttrs}>Открыть подходящие туры ↗</a></div></div></section>` : ''}
  </main>${jeepStickyCta(page)}${footer()}<script src="/assets/main.js?v=20260710-jeep-quiz-v2" defer></script></body></html>`;
}

function homeTemplate() {
  const schema = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.url, description: site.description, inLanguage: 'ru' }];
  return `${head({ title: 'Туры и путешествия по Камчатке', description: 'Независимый путеводитель по турам на Камчатку: сезоны, маршруты, рыбалка, вулканы, киты и подготовка к поездке.', path: '/', schema })}${header('/')}
  <main id="content">
    <section class="hero"><div class="shell hero-inner"><p class="eyebrow">Край, который не помещается в чек-лист</p><h1>Найти свой маршрут<br>на <em>Камчатке</em></h1><p class="hero-copy">Независимый путеводитель по турам, экскурсиям и сезонам. Помогаем понять программу до того, как вы нажмёте «забронировать».</p><div class="hero-actions"><a class="button button-primary" href="/tury/">Выбрать формат поездки</a><a class="button button-light" href="/blog/kogda-ehat/">Когда лучше ехать</a></div><div class="hero-facts"><div class="hero-fact"><strong>7–10 дней</strong><span>разумно для первой поездки</span></div><div class="hero-fact"><strong>1 день</strong><span>оставьте в резерве на погоду</span></div><div class="hero-fact"><strong>0 обещаний</strong><span>встреч с дикими животными</span></div></div></div></section>
    <section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Не туры вообще, а ваш формат</p><h2>С чего начнётся поездка</h2></div><p>Сначала определите главное впечатление. Остальное выстроится вокруг него — сезон, длительность и бюджет.</p></div><div class="grid grid-3">${cards(['/tury/rybalka/', '/blog/vulkany-kamchatki/', '/blog/kity-na-kamchatke/'])}</div></div></section>
    <section class="section section-dark"><div class="shell"><div class="section-head"><div><p class="eyebrow">Четыре способа увидеть регион</p><h2>Не пытайтесь успеть всё</h2></div><p>Камчатка вознаграждает за фокус. Выберите ритм, который подходит именно вам.</p></div><div class="grid grid-2"><a class="route-card" href="/tury/"><span>01</span><div><h3>Большое путешествие</h3><p>Обзорные программы на 7–10 дней.</p></div></a><a class="route-card" href="/ekskursii/odnodnevnye/"><span>02</span><div><h3>Один свободный день</h3><p>Экскурсии из Петропавловска-Камчатского.</p></div></a><a class="route-card" href="/tury/s-detmi/"><span>03</span><div><h3>С детьми</h3><p>Меньше переездов, больше гибкости.</p></div></a><a class="route-card" href="/tury/zima/"><span>04</span><div><h3>Зимняя Камчатка</h3><p>Снег, термальные источники и особая логистика.</p></div></a></div></div></section>
    <section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Перед покупкой</p><h2>Проверяем то, что влияет на поездку</h2></div><p>Никаких выдуманных цен и гарантированного хорошего неба.</p></div><div class="trust-strip"><div class="trust-item"><strong>Состав программы</strong><span>Отделяем дорогу от времени на локации.</span></div><div class="trust-item"><strong>Погодный резерв</strong><span>Смотрим, чем заменят отменённый выезд.</span></div><div class="trust-item"><strong>Физическая нагрузка</strong><span>Переводим «легко» в километры и набор высоты.</span></div><div class="trust-item"><strong>Полная стоимость</strong><span>Учитываем услуги вне базовой цены.</span></div></div></div></section>
    <section class="section section-ocean"><div class="shell"><div class="section-head"><div><p class="eyebrow" style="color:var(--acid)">Полевые заметки</p><h2>Подготовьтесь к живому региону</h2></div><p>Погода, океан и вулканы не обязаны подстраиваться под расписание. Хороший маршрут это учитывает.</p></div><div class="grid grid-3">${cards(['/blog/kogda-ehat/', '/blog/skolko-stoit-poezdka/', '/blog/dostoprimechatelnosti/'])}</div></div></section>
    <section class="section section-tight"><div class="shell"><div class="cta"><div><h2>Выберите направление.<br>Мы дадим чек-лист.</h2><p>Актуальные даты и стоимость проверяются на странице организатора.</p></div><a class="button" href="/tury/">Начать выбор →</a></div></div></section>
  </main>${footer()}<script src="/assets/main.js" defer></script></body></html>`;
}

function writePage(path, html) {
  const target = path === '/' ? join(dist, 'index.html') : join(dist, path.replace(/^\//, ''), 'index.html');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html, 'utf8');
}

writePage('/', homeTemplate());
pages.forEach((page) => writePage(page.path, pageTemplate(page)));

const urls = ['/', ...pages.map((page) => page.path)];
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${absolute(path)}</loc><lastmod>2026-06-28</lastmod></url>`).join('')}</urlset>`, 'utf8');
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`, 'utf8');
writeFileSync(join(dist, '404.html'), `${head({ title: 'Страница не найдена', description: 'Страница не найдена.', path: '/404/' })}${header('/404/')}<main id="content"><section class="page-hero" style="--page-hero-image: url('/images/field-guide-kamchatka.jpg')"><div class="shell"><p class="eyebrow">Ошибка 404</p><h1>Маршрут потерялся в тумане</h1><p class="page-lead">Вернитесь на главную или продолжите подготовку к поездке.</p><p><a class="button button-primary" href="/">На главную</a></p></div></section></main>${footer()}</body></html>`, 'utf8');
console.log(`Built ${urls.length} pages in ${dist}`);
