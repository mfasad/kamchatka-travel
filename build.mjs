import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pages, pageByPath, site } from './src/pages.mjs';

const dist = join(process.cwd(), 'dist');
if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(process.cwd(), 'public'), dist, { recursive: true });

const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const absolute = (path) => `${site.url}${path}`;
const partnerAttrs = `href="${site.partnerUrl}" target="_blank" rel="nofollow noopener"`;

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
  <link rel="stylesheet" href="/assets/style.css">
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

function faqBlock(items = []) {
  if (!items.length) return '';
  return `<section class="faq"><h2>Частые вопросы</h2>${items.map((item) => `<details><summary>${esc(item.question)}</summary><p>${esc(item.answer)}</p></details>`).join('')}</section>`;
}

function pageTemplate(page) {
  const isLegal = page.type === 'legal';
  return `${head({ title: page.title, description: page.description, path: page.path, type: page.type === 'article' ? 'article' : 'website', schema: schemas(page) })}
  ${header(page.path)}
  <main id="content">
    <section class="page-hero" style="--page-hero-image: url('${imageFor(page)}')"><div class="shell"><div class="breadcrumbs">${breadcrumbMarkup(page)}</div><p class="eyebrow">${esc(page.eyebrow)}</p><h1>${esc(page.title)}</h1><p class="page-lead">${esc(page.lead)}</p></div></section>
    <section class="section"><div class="shell content-layout">
      <article class="content">${page.sections.map(([title, body]) => `<section><h2>${esc(title)}</h2>${body}</section>`).join('')}${faqBlock(page.faqs)}</article>
      <aside class="sidebar"><h2>${isLegal ? 'Навигация по проекту' : 'Сравнить программы'}</h2><p>${isLegal ? 'Перейдите к путеводителю или подборке форматов путешествия.' : 'Актуальные цены, даты и условия бронирования находятся на стороне организатора.'}</p><a class="button button-primary" ${isLegal ? 'href="/tury/"' : partnerAttrs}>${isLegal ? 'Перейти к турам' : 'Посмотреть предложения ↗'}</a><ul class="mini-list"><li><a href="/blog/kogda-ehat/">Когда лучше ехать</a></li><li><a href="/blog/skolko-stoit-poezdka/">Из чего складывается бюджет</a></li><li><a href="/o-proekte/">Как работает проект</a></li></ul></aside>
    </div></section>
    ${page.cards?.length ? `<section class="section section-tight related"><div class="shell"><div class="section-head"><div><p class="eyebrow">Продолжить подготовку</p><h2>Полезно по теме</h2></div><p>Связанные маршруты и практические инструкции.</p></div><div class="grid grid-3">${cards(page.cards)}</div></div></section>` : ''}
    ${!isLegal ? `<section class="section section-tight"><div class="shell"><div class="cta"><div><h2>Сначала разобраться.<br>Потом бронировать.</h2><p>Сравните программу, задайте вопросы организатору и проверьте актуальные условия.</p></div><a class="button" ${partnerAttrs}>Открыть каталог туров ↗</a></div></div></section>` : ''}
  </main>${footer()}<script src="/assets/main.js" defer></script></body></html>`;
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
