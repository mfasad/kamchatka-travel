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
const assetVersion = '20260711-tours-hub-v1';
const partnerAttrs = `href="${site.partnerUrl}" target="_blank" rel="nofollow noopener"`;
const topToursPartnerUrl = `${site.partnerBaseUrl}&path=/tours/region/%D0%BA%D0%B0%D0%BC%D1%87%D0%B0%D1%82%D0%BA%D0%B0/type-dzhipping`;
const topToursPartnerAttrs = `href="${topToursPartnerUrl.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener"`;
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

function assetScripts() {
  return `<script src="/assets/main.js?v=${assetVersion}" defer></script><script src="/assets/inject.js?v=${assetVersion}" defer></script>`;
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
  <link rel="stylesheet" href="/assets/style.css?v=${assetVersion}">
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

const tourInsights = {
  19592: {
    summary: 'Насыщенный маршрут для первой большой поездки, где вулканы соединены с океаном, источниками и внедорожной логистикой.',
    goodFor: 'Подойдёт тем, кто хочет увидеть несколько главных районов без самостоятельной сборки трансферов и отдельных экскурсий.',
    check: 'До бронирования стоит уточнить самые длинные переезды, запасной план на случай закрытой дороги и состав включённых услуг.'
  },
  30002: {
    summary: 'Комбинированная программа с вулканами, океаном и морской темой, где впечатления зависят от погоды и состояния моря.',
    goodFor: 'Хороший вариант для путешественников, которым важна не только пешая часть, но и контраст вулканов, берега и водных выездов.',
    check: 'Проверьте, какие активности являются основными, какие заменяются при непогоде и как организован день с выходом к океану.'
  },
  62340: {
    summary: 'Активный вулканический тур без автономного рюкзака: акцент на ходовых днях, рельефе и физической готовности.',
    goodFor: 'Подойдёт тем, кто хочет идти по вулканическим районам, но не планирует нести лагерь и снаряжение на себе.',
    check: 'Сравните километры, набор высоты, покрытие тропы, требования к обуви и условия разворота при тумане или сильном ветре.'
  },
  54147: {
    summary: 'Более лёгкий формат знакомства с вулканами и океаном, где важны комфорт, темп и понятная логистика между локациями.',
    goodFor: 'Подойдёт тем, кто хочет вулканические виды без ощущения спортивного похода каждый день.',
    check: 'Уточните длительность пеших участков, тип транспорта и то, какие элементы программы зависят от погоды сильнее всего.'
  },
  71441: {
    summary: 'Расширенная программа с Камчаткой и Сахалином, где вулканическая часть связана с более сложной межрегиональной логистикой.',
    goodFor: 'Подойдёт опытным путешественникам, которым интересен не один выезд, а большой маршрут с несколькими природными сценариями.',
    check: 'Особенно внимательно проверьте перелёты или переезды между регионами, погодные переносы и правила замены авиационных активностей.'
  },
  58250: {
    summary: 'Вулканический маршрут с океаном, рафтингом и активными днями: программа шире обычной экскурсии к одному вулкану.',
    goodFor: 'Хороший вариант для тех, кто хочет совместить разные форматы и готов к умеренной нагрузке в течение недели.',
    check: 'Уточните, какие дни самые активные, что входит в снаряжение, как меняется маршрут при плохой погоде и какой запас по времени заложен.'
  },
  30994: {
    summary: 'Многодневная программа с активным набором форматов: горы, рыбалка, гастрономия, сплав и восхождения. Это скорее насыщенное путешествие с премиальными ожиданиями к организации, чем спокойный отельный отдых.',
    goodFor: 'Подойдет тем, кто хочет за одну поездку собрать разные сценарии Камчатки и готов к активности, смене локаций и простому размещению на части маршрута.',
    check: 'Проверьте, какие дни проходят в палатках или гостевых домиках, где возможны замены по погоде и какие услуги действительно индивидуальны, а какие идут в составе группы.'
  },
  20106: {
    summary: 'Более камерный авторский формат на 8 дней с приватным признаком в данных тура. Сильная сторона такой программы - управляемый темп и понятная логистика без чрезмерной длительности.',
    goodFor: 'Подойдет путешественникам, которым важны небольшая группа, сопровождение организатора и первое знакомство с Камчаткой без длинной экспедиционной нагрузки.',
    check: 'Уточните, полностью ли тур приватный, какие экскурсии могут проходить в сборном формате, какие гостиницы подтверждаются и как решаются переносы при закрытой дороге.'
  },
  55359: {
    summary: 'Комфортный недельный маршрут с размещением до уровня 4* и семейным типом в данных тура. Его удобно рассматривать как VIP-альтернативу для первой поездки без грубой экспедиционности.',
    goodFor: 'Подойдет тем, кто хочет больше комфорта, понятный график и умеренную активность, но все равно хочет увидеть вулканические и обзорные локации.',
    check: 'Сравните категории номеров, состав питания, длительность переездов и то, какие активности заменяются при плохой погоде без доплат.'
  },
  65874: {
    summary: 'Восьмидневная летняя программа с широким набором размещения, включая отели высокого уровня, лоджи и коттеджи. В данных тура отмечены приватность и невысокая активность.',
    goodFor: 'Хороший вариант для тех, кто хочет Камчатку с комфортной базой, короткими активными отрезками и гибкостью под состав компании.',
    check: 'Попросите организатора расшифровать, какое размещение стоит в базовой цене, где возможен апгрейд и какие выезды зависят от состояния дорог.'
  },
  30002: {
    summary: 'Семидневная программа с океанской темой и эксклюзивным признаком: киты, вулканы, баня на берегу и яркий эмоциональный сценарий. Важно отделить факты маршрута от вау-обещаний.',
    goodFor: 'Подойдет тем, кто хочет морской акцент и насыщенную неделю без длинной экспедиции, но готов проверять погодные замены особенно внимательно.',
    check: 'Уточните условия морского выхода, запасной день или замену при ветре, размер группы и что именно входит в стоимость береговой программы.'
  },
  68479: {
    summary: 'Калейдоскоп-тур на 8 дней с внедорожным типом и комфортом выше среднего. По смыслу это быстрый обзор Камчатки для тех, кому важны разные локации без чрезмерной физической нагрузки.',
    goodFor: 'Подойдет для первой поездки, когда хочется сравнить вулканы, дороги и обзорные места, но сохранить компактную длительность и небольшой состав группы.',
    check: 'Проверьте, что означает бонус от автора, какие локации являются обязательными, а какие зависят от погоды, и сколько времени остается на самих точках.'
  },
  37224: {
    summary: 'Однодневный выезд к Авачинскому району с акцентом на вулканический рельеф и гору Верблюд. Это хороший формат, когда хочется увидеть вулканическую Камчатку без многодневного маршрута.',
    goodFor: 'Подойдет тем, кто готов к умеренной активности и хочет один выразительный день с вулканическими видами недалеко от города.',
    check: 'Уточните состояние дороги, длительность пешей части, требования к обуви и что меняется при тумане или сильном ветре.'
  },
  70697: {
    summary: 'Маршрут к массиву Вачкажец строится вокруг троп, водопадов и горного цирка. Это однодневный выезд, но по ощущениям он ближе к активной природной прогулке, чем к обзорной остановке.',
    goodFor: 'Подойдет путешественникам, которым важны пешие участки, зелёные долины и водопады, а не только автомобильные смотровые.',
    check: 'Сравните километры пешком, темп группы, питание на маршруте и возможность переноса при плохой видимости или дождях.'
  },
  61766: {
    summary: 'День с внедорожной логистикой к озеру Толмачёва, маару и источникам. Сильная сторона такого сценария — сочетание дороги, вулканической формы рельефа и расслабляющей финальной точки.',
    goodFor: 'Подойдет тем, кто хочет не только смотреть локации, но и добавить термальную часть без ночёвки вне базы.',
    check: 'Уточните, какие источники входят в программу, нужны ли купальные вещи, сколько времени занимает дорога и какие участки зависят от состояния грунтовки.'
  },
  42072: {
    summary: 'Каньон и Дачные источники — более спокойный по активности вариант среди однодневных выездов, где впечатление держится на природной локации и термальной паузе.',
    goodFor: 'Подойдет для дня без длинного восхождения, если хочется природного маршрута с понятным темпом и меньшей физической нагрузкой.',
    check: 'Проверьте, что именно входит в цену, сколько времени будет на источниках, какие вещи взять с собой и как меняется маршрут при закрытой дороге.'
  },
  39011: {
    summary: 'Авачинский перевал и экструзия Верблюд — активный однодневный сценарий с вулканическим ландшафтом. Он требует внимательнее смотреть не только цену, но и нагрузку.',
    goodFor: 'Подойдет тем, кто хочет больше движения и готов к ветру, неровному покрытию и переменчивой видимости в вулканическом районе.',
    check: 'Уточните набор высоты, длительность ходовой части, экипировку, решение гида при ухудшении погоды и время возвращения.'
  },
  39436: {
    summary: 'Вачкажец с Зеленовскими озерками соединяет активную природную часть и более мягкий финал. Это удобный формат, когда хочется увидеть горный район, но не заканчивать день только дорогой.',
    goodFor: 'Подойдет для первой поездки, если нужен баланс пешей прогулки, природных видов и понятной логистики из города.',
    check: 'Спросите про длительность тропы, погодную замену, время на Зеленовских озерках и входят ли дополнительные расходы в базовую стоимость.'
  },
  39437: {
    summary: 'Однодневный выезд с восхождением на Горелый заметно активнее обычной обзорной экскурсии. Название “один день” здесь не отменяет требований к физической форме и погодному запасу.',
    goodFor: 'Подойдет тем, кто хочет именно ходовой вулканический день и готов к подъёму, ветру и переменам маршрута по решению гида.',
    check: 'Проверьте километры, набор высоты, обувь, наличие палок, питание и условия разворота при тумане или ухудшении самочувствия.'
  },
  69211: {
    summary: 'Индивидуальный формат первого знакомства с Камчаткой для небольшой компании. Цена в такой программе может относиться ко всей компании, поэтому её важно сравнивать не с местом в сборной группе, а с приватным сценарием дня.',
    goodFor: 'Подойдет семье или небольшой компании, которой важны свой темп, гибкость и меньше пересечений с другими участниками.',
    check: 'Уточните фактический размер группы, часы работы гида и транспорта, маршрут по точкам, доплаты и правила изменения программы по погоде.'
  }
  ,
  42882: {
    summary: 'Комбинированный тур с рыбалкой, сплавом, внедорожными выездами и экскурсионной частью. Рыбалка здесь выглядит как один из акцентов большой поездки, а не единственная цель маршрута.',
    goodFor: 'Подойдёт для первой Камчатки, если хочется совместить рыбалку с вулканами, дорогой, источниками и другими локациями без самостоятельной сборки логистики.',
    check: 'Уточните, сколько времени реально отведено на ловлю, какие снасти входят, где проходит рыбалка и чем заменяют водный день при непогоде.'
  },
  32371: {
    summary: 'Формат “всё включено” с рыбалкой, семейной логикой, гастрономией, походными и автомобильными элементами. Сильная сторона такого тура — бытовая собранность, но состав включённых услуг нужно читать особенно внимательно.',
    goodFor: 'Подойдёт тем, кто хочет рыбалку без сложной подготовки и предпочитает заранее понятные трансферы, питание и базовую организацию.',
    check: 'Проверьте, какие расходы действительно входят, предоставляются ли снасти и одежда, какие дни зависят от погоды и есть ли ограничения по возрасту.'
  },
  11430: {
    summary: 'Десятидневная активная программа, где рыбалка сочетается с походом, сплавом, восхождениями и внедорожной логистикой. Это скорее приключенческий маршрут, чем спокойная рыболовная база.',
    goodFor: 'Подойдёт опытным путешественникам, которым важна разная активность каждый день и которые готовы к насыщенному графику.',
    check: 'Сравните нагрузку, ночёвки, снаряжение, длительность забросок и то, какая часть маршрута посвящена именно рыбалке.'
  },
  68582: {
    summary: 'Семидневный рыболовный тур с небольшим размером группы и автомобильной логистикой. По набору фактов он ближе к тематической поездке, где рыбалка стоит в центре.',
    goodFor: 'Подойдёт тем, кто едет на Камчатку прежде всего ради ловли и хочет понятный недельный формат без слишком высокой физической нагрузки.',
    check: 'Уточните реки или акватории, лицензии, снасти, условия проживания, хранение улова и запасной план на случай воды или ветра.'
  },
  37567: {
    summary: 'Однодневный морской выход к бухте Русская с рыбалкой и морским форматом. Такой день удобно добавить к основной поездке, но он особенно зависит от ветра и состояния моря.',
    goodFor: 'Подойдёт тем, кто уже живёт в районе Петропавловска-Камчатского или хочет отдельный морской день без многодневного тура.',
    check: 'Проверьте точку старта, продолжительность на воде, питание, одежду, число людей на судне и правила переноса при штормовом прогнозе.'
  },
  74168: {
    summary: 'Однодневная рыбалка на реках Камчатки с берега в мини-группе. Это самый прямой формат для тех, кто хочет именно ловлю, а не обзорный тур с короткой рыболовной вставкой.',
    goodFor: 'Подойдёт новичкам и опытным рыбакам, которым важен короткий речной выезд, индивидуальное внимание и понятная логистика из города или базы.',
    check: 'Уточните место ловли, правила и разрешения, снасти, вейдерсы, питание, трансфер и что происходит при подъёме воды.'
  }
};

function tourInsightDetails(tour) {
  const insight = tourInsights[tour.id];
  if (!insight) return '';
  return `<div class="tour-insight" data-tour-insight><button class="tour-insight-toggle" type="button" data-tour-insight-toggle aria-expanded="false">Подробнее о программе</button><div class="tour-insight-panel" data-tour-insight-panel hidden>
    <div class="tour-insight-panel-head"><strong>Коротко о программе</strong><span>На что смотреть перед бронированием</span></div>
    <div class="tour-insight-body">
    <p>${esc(insight.summary)}</p>
    <ul><li><strong>Кому подойдёт:</strong> ${esc(insight.goodFor)}</li><li><strong>Что проверить:</strong> ${esc(insight.check)}</li></ul>
  </div></div></div>`;
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
    <div class="table-partner-cta">
      <div><strong>В таблице не все джип-туры по Камчатке.</strong><span>У организаторов могут быть новые заезды, другие маршруты и места в группах, которые не попали в короткую подборку.</span></div>
      <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
    </div>
  </div></section>`;
}

function trekkingTourTable(page) {
  if (page.path !== '/tury/trekking/') return '';
  const tours = youtravelTours.byPage?.[page.path] || [];
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare trekking-compare" id="compare-trekking-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Походы и треккинг</p><h2>Актуальные треккинговые туры по Камчатке</h2></div><p>Сравните длительность, нагрузку, формат размещения и размер группы. Финальную стоимость, даты, свободные места и требования к участникам проверяйте на странице организатора.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Тур</th><th>Нагрузка</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${tour.title}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${tour.activity ? `активность ${esc(tour.activity)} из 5` : esc((tour.types || []).slice(0, 2).join(', ') || 'треккинг')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить даты ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>В таблице только часть подходящих программ.</strong><span>У организаторов могут быть другие даты, новые места и форматы без тяжёлого рюкзака.</span></div>
      <a class="button button-primary" ${partnerAttrsFor(page)}>Проверить свежие предложения и места ↗</a>
    </div>
  </div></section>`;
}

function volcanoTourTable(page) {
  if (page.path !== '/ekskursii/vulkany/') return '';
  const tours = youtravelTours.byPage?.[page.path] || [];
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare volcano-compare" id="compare-volcano-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Вулканические программы</p><h2>Актуальные туры и экскурсии на вулканы Камчатки</h2></div><p>Сравните длительность, нагрузку, группу и цену. Финальные даты, свободные места, погодные переносы и состав услуг проверяйте на странице организатора перед бронированием.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Нагрузка</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${tour.title}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${tour.activity ? `активность ${esc(tour.activity)} из 5` : esc((tour.types || []).slice(0, 2).join(', ') || 'вулканический маршрут')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>В таблице только часть вулканических маршрутов.</strong><span>У организаторов могут быть новые даты, альтернативные вулканы и места в группах, которые не попали в короткую подборку.</span></div>
      <a class="button button-primary" ${partnerAttrsFor(page)}>Сравнить программы у организатора ↗</a>
    </div>
  </div></section>`;
}

function partnerTourBlock(page) {
  if (page.path === '/tury/') return '';
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
      <a class="button button-primary" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">${page.path === '/tury/dzhip-tury/' || page.path === '/tury/trekking/' ? 'Посмотреть даты и места ↗' : 'Смотреть тур ↗'}</a>
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

function oneDayExcursionTable(page) {
  if (page.path !== '/ekskursii/odnodnevnye/') return '';
  const tours = youtravelTours.byPage?.['/tury/dzhip-tury/one-day'] || [];
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare oneday-compare" id="compare-oneday-excursions"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Экскурсии на один день</p><h2>Актуальные однодневные экскурсии по Камчатке</h2></div><p>Сравните цель поездки, нагрузку, цену и размер группы. Даты, свободные места, точку старта, трансфер и погодные замены проверяйте на странице организатора перед бронированием.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table one-day-table"><thead><tr><th>Программа</th><th>Формат</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.slice(0, 8).map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${tour.activity ? `активность ${esc(tour.activity)} из 5` : esc((tour.types || []).slice(0, 2).join(', ') || 'экскурсия')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>В таблице только часть однодневных вариантов.</strong><span>У организаторов могут быть свежие даты, другие маршруты к океану, вулканам и источникам, а также места в небольших группах.</span></div>
      <a class="button button-primary" ${partnerAttrsFor(page)}>Смотреть свежие предложения ↗</a>
    </div>
  </div></section>`;
}

function oneDayExcursionQuizBlock(page) {
  if (page.path !== '/ekskursii/odnodnevnye/') return '';
  return `<section class="section section-tight jeep-quiz-section oneday-quiz-section" id="oneday-quiz"><div class="shell">
    <div class="jeep-quiz oneday-quiz" data-oneday-quiz>
      <div class="jeep-quiz-copy oneday-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какую экскурсию выбрать на один день?</h2>
        <p>Отметьте главный сценарий и ограничение по темпу. Это не бронирование, а быстрый фильтр перед сравнением реальных программ и условий у организатора.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset>
          <legend>Что вы хотите видеть в центре?</legend>
          <label><input type="radio" name="oneday-focus" value="volcano" checked> Вулканический район, перевал или лавовые поля</label>
          <label><input type="radio" name="oneday-focus" value="ocean"> Океан, чёрный пляж, бухты и смотровые</label>
          <label><input type="radio" name="oneday-focus" value="springs"> Источники, каньон или спокойная природная локация</label>
        </fieldset>
        <fieldset>
          <legend>Какой темп дня вам ближе?</legend>
          <label><input type="radio" name="oneday-check" value="timing" checked> Спокойный день с понятным стартом и возвращением</label>
          <label><input type="radio" name="oneday-check" value="load"> Активная прогулка ради видов и маршрута</label>
          <label><input type="radio" name="oneday-check" value="weather"> Гибкий сценарий, если погода меняет планы</label>
        </fieldset>
        <div class="jeep-quiz-result" data-oneday-quiz-result>
          <strong>Смотрите наземные однодневные экскурсии.</strong>
          <span>Начните с программ, где понятны дорога, пешая часть, время возвращения и условия замены при непогоде.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" ${partnerAttrsFor(page)}>Подобрать по датам и местам ↗</a>
        </div>
      </div>
    </div>
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
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые джип-туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}

function vipQuizBlock(page) {
  if (page.path !== '/tury/vip/') return '';
  return `<section class="section section-tight jeep-quiz-section vip-quiz-section" id="vip-quiz"><div class="shell">
    <div class="jeep-quiz vip-quiz" data-vip-quiz>
      <div class="jeep-quiz-copy vip-quiz-copy">
        <p class="eyebrow">Мини-квиз</p>
        <h2>Какой VIP-тур по Камчатке вам ближе?</h2>
        <p>Три быстрых выбора помогают понять не «что проверить», а какой сценарий открыть: приватный маршрут, комфортную базу или насыщенную программу с максимумом впечатлений.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset>
          <legend>1. Кто едет?</legend>
          <label><input type="radio" name="vip-company" value="couple" checked> Пара или небольшая компания взрослых</label>
          <label><input type="radio" name="vip-company" value="family"> Семья с детьми или разным темпом участников</label>
          <label><input type="radio" name="vip-company" value="team"> Друзья / команда, хочется больше движения</label>
        </fieldset>
        <fieldset>
          <legend>2. Какой стиль поездки вам ближе?</legend>
          <label><input type="radio" name="vip-style" value="private" checked> Свой темп, приватный транспорт, меньше пересечений с группами</label>
          <label><input type="radio" name="vip-style" value="comfort"> Комфортное размещение, умеренная активность, понятные переезды</label>
          <label><input type="radio" name="vip-style" value="max"> Больше локаций, яркие выезды, готовность к плотному графику</label>
        </fieldset>
        <fieldset>
          <legend>3. Что вы хотите видеть в центре?</legend>
          <label><input type="radio" name="vip-focus" value="volcano" checked> Вулканы, источники и наземные маршруты</label>
          <label><input type="radio" name="vip-focus" value="ocean"> Океан, морские выезды и береговые впечатления</label>
          <label><input type="radio" name="vip-focus" value="all"> Смешанная программа: всего понемногу</label>
        </fieldset>
        <div class="jeep-quiz-result" data-vip-quiz-result>
          <strong>Вам ближе приватный VIP-маршрут.</strong>
          <span>Откройте программы с небольшим составом, своим транспортом и гибкой логикой дней.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" ${partnerAttrsFor(page)}>Показать подходящие VIP-туры →</a>
        </div>
      </div>
    </div>
  </div></section>`;
}

function vipTourTable(page) {
  if (page.path !== '/tury/vip/') return '';
  const tours = youtravelTours.byPage?.[page.path] || [];
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare vip-compare" id="compare-vip-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">VIP и индивидуальные форматы</p><h2>Актуальные VIP-туры на Камчатку</h2></div><p>Сравнивайте не только цену: для премиального формата важны размер группы, приватность, уровень размещения, активность и то, как организатор заменяет погодозависимые выезды. Финальные даты, места и состав услуг проверяйте на странице тура.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Формат</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${tour.title}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${tour.isPrivate ? 'приватный / малогрупповой' : tour.isExclusive ? 'эксклюзивный набор' : esc((tour.types || []).slice(0, 2).join(', ') || 'VIP-тур')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места →</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>В таблице только часть подходящих программ.</strong><span>У организаторов могут быть другие даты, индивидуальные условия, свободные места и апгрейды размещения, которые не попали в короткую подборку.</span></div>
      <a class="button button-primary" ${partnerAttrsFor(page)}>Подобрать по датам и уровню комфорта →</a>
    </div>
  </div></section>`;
}

function vipStickyCta(page) {
  if (page.path !== '/tury/vip/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}

function fishingQuizBlock(page) {
  if (page.path !== '/tury/rybalka/') return '';
  return `<section class="section section-tight jeep-quiz-section fishing-quiz-section" id="fishing-quiz"><div class="shell">
    <div class="jeep-quiz fishing-quiz" data-fishing-quiz>
      <div class="jeep-quiz-copy fishing-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какая рыбалка на Камчатке вам ближе?</h2>
        <p>Ответьте на два вопроса перед сравнением программ: нужен ли отдельный рыболовный выезд, морской день или большой тур, где рыбалка встроена в маршрут.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset>
          <legend>1. Какой формат поездки вам ближе?</legend>
          <label><input type="radio" name="fishing-format" value="river" checked> Речная рыбалка с акцентом на ловлю</label>
          <label><input type="radio" name="fishing-format" value="sea"> Морская рыбалка или выход к бухтам</label>
          <label><input type="radio" name="fishing-format" value="combo"> Большой тур: рыбалка плюс вулканы, сплав или гастрономия</label>
        </fieldset>
        <fieldset>
          <legend>2. Какой темп дня на воде вам ближе?</legend>
          <label><input type="radio" name="fishing-style" value="easy" checked> Спокойный выезд с инструктором и снаряжением на месте</label>
          <label><input type="radio" name="fishing-style" value="active"> Активный день с ранним стартом и готовностью к перемене погоды</label>
          <label><input type="radio" name="fishing-style" value="comfort"> Больше бытового комфорта: питание, база и меньше суеты</label>
        </fieldset>
        <div class="jeep-quiz-result" data-fishing-quiz-result>
          <strong>Смотрите речные рыболовные программы.</strong>
          <span>Начните с туров, где прямо описаны место ловли, снасти, лицензии и работа инструктора.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" ${partnerAttrsFor(page)}>Подобрать рыболовные туры по датам ↗</a>
        </div>
      </div>
    </div>
  </div></section>`;
}

function fishingTourTable(page) {
  if (page.path !== '/tury/rybalka/') return '';
  const tours = youtravelTours.byPage?.[page.path] || [];
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare fishing-compare" id="compare-fishing-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Реальные предложения</p><h2>Рыболовные туры и программы с рыбалкой</h2></div><p>В таблице собраны реальные предложения партнёра, где рыбалка указана в типах или названии. Сравнивайте не только цену, но и роль рыбалки в маршруте: главный смысл поездки, морской день или один из блоков большого тура.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Формат</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${tour.title}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${esc((tour.types || []).slice(0, 3).join(', ') || 'рыболовный тур')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>Рыбалка быстро зависит от сезона и условий на воде.</strong><span>У организаторов могут быть новые даты, свободные места, другие реки, морские выходы или запасные сценарии, которых нет в короткой таблице.</span></div>
      <a class="button button-primary" ${partnerAttrsFor(page)}>Смотреть свежие предложения ↗</a>
    </div>
  </div></section>`;
}

function fishingStickyCta(page) {
  if (page.path !== '/tury/rybalka/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}

function trekkingQuizBlock(page) {
  if (page.path !== '/tury/trekking/') return '';
  return `<section class="section section-tight jeep-quiz-section trekking-quiz-section" id="trekking-quiz"><div class="shell">
    <div class="jeep-quiz trekking-quiz" data-trekking-quiz>
      <div class="jeep-quiz-copy trekking-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Понять свой формат похода за 30 секунд</h2>
        <p>Отметьте, какой уровень автономности и нагрузки вам ближе. Это поможет открыть подборку с правильными вопросами к организатору.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset>
          <legend>Какой формат нужен?</legend>
          <label><input type="radio" name="trekking-format" value="light" checked> Радиальные выходы без тяжёлого рюкзака</label>
          <label><input type="radio" name="trekking-format" value="active"> Несколько активных дней с восхождениями</label>
          <label><input type="radio" name="trekking-format" value="camp"> Палатки, автономность и смена лагерей</label>
        </fieldset>
        <fieldset>
          <legend>Что важнее всего проверить?</legend>
          <label><input type="radio" name="trekking-check" value="load" checked> Километры, набор высоты и вес рюкзака</label>
          <label><input type="radio" name="trekking-check" value="comfort"> Ночёвки, питание и доступ к багажу</label>
          <label><input type="radio" name="trekking-check" value="weather"> Запасные дни и замены при непогоде</label>
        </fieldset>
        <div class="jeep-quiz-result" data-trekking-quiz-result>
          <strong>Смотрите походы без тяжёлого рюкзака.</strong>
          <span>Начните с программ, где ходовые дни чередуются с базой, а требования к участникам описаны по дням.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" ${partnerAttrsFor(page)}>Показать треккинговые туры ↗</a>
        </div>
      </div>
    </div>
  </div></section>`;
}

function volcanoQuizBlock(page) {
  if (page.path !== '/ekskursii/vulkany/') return '';
  return `<section class="section section-tight jeep-quiz-section volcano-quiz-section" id="volcano-quiz"><div class="shell">
    <div class="jeep-quiz volcano-quiz" data-volcano-quiz>
      <div class="jeep-quiz-copy volcano-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Понять свой маршрут на вулкан за 30 секунд</h2>
        <p>Отметьте желаемую нагрузку и главный риск. Это не бронирование, а быстрый фильтр перед сравнением реальных программ.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset>
          <legend>Какой формат вам ближе?</legend>
          <label><input type="radio" name="volcano-format" value="overview" checked> Обзорная экскурсия с автомобильной заброской</label>
          <label><input type="radio" name="volcano-format" value="ascent"> Восхождение или длинная пешая часть</label>
          <label><input type="radio" name="volcano-format" value="multi"> Несколько вулканических районов за поездку</label>
        </fieldset>
        <fieldset>
          <legend>Что вам важнее?</legend>
          <label><input type="radio" name="volcano-check" value="weather" checked> Запасной маршрут при тумане, ветре или закрытой дороге</label>
          <label><input type="radio" name="volcano-check" value="load"> Километры, набор высоты и покрытие тропы</label>
          <label><input type="radio" name="volcano-check" value="gear"> Обувь, палки, питание, трансфер и страховку</label>
        </fieldset>
        <div class="jeep-quiz-result" data-volcano-quiz-result>
          <strong>Смотрите обзорные вулканические экскурсии.</strong>
          <span>Начните с программ, где понятны дорога, пешая часть и замена маршрута при плохой видимости.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" ${partnerAttrsFor(page)}>Подобрать по датам и местам ↗</a>
        </div>
      </div>
    </div>
  </div></section>`;
}

function trekkingStickyCta(page) {
  if (page.path !== '/tury/trekking/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Треккинговые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}

function volcanoStickyCta(page) {
  if (page.path !== '/ekskursii/vulkany/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Туры на вулканы Камчатки">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}

function oneDayExcursionStickyCta(page) {
  if (page.path !== '/ekskursii/odnodnevnye/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}

function trekkingConversionBlocks(page) {
  if (page.path !== '/tury/trekking/') return '';
  return `<section class="section section-tight jeep-lead trekking-lead"><div class="shell">
    <p>Походы по Камчатке сильно различаются по автономности: от радиальных выходов с ночёвкой на базе до маршрутов с палатками и снаряжением. Сначала выберите уровень нагрузки, затем сравните реальные программы и проверьте условия у организатора.</p>
  </div></section>
  ${trekkingQuizBlock(page)}
  ${trekkingTourTable(page)}
  <section class="section section-tight jeep-proof trekking-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Хороший поход описывает нагрузку, а не только красивые виды</h2><p>Сильная программа показывает километры, набор высоты, вес рюкзака, ночёвки и решение на случай закрытого перевала или плохой видимости.</p><a class="button button-light" href="#compare-trekking-tours">Сравнить туры</a></article>
    <article class="proof-card"><img src="/images/trekking-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Рюкзак меняет всё</h3><p>Радиальный выход и автономный маршрут могут идти по похожему району, но ощущаться как разные путешествия из-за веса и ночёвок.</p></article>
    <article class="proof-card"><img src="/images/volcano-excursion-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Погода решает темп</h3><p>На шлаке, снегу и мокрых камнях важны не обещания, а запасные дни, связь и готовность развернуться по решению гида.</p></article>
  </div></section>`;
}

function volcanoConversionBlocks(page) {
  if (page.path !== '/ekskursii/vulkany/') return '';
  return `<section class="section section-tight jeep-lead volcano-lead"><div class="shell">
    <p>Экскурсии на вулканы Камчатки отличаются не названием горы, а логистикой: где заканчивается дорога, сколько идти пешком, какой набор высоты и что происходит при тумане. Сначала выберите уровень нагрузки, затем сравните реальные программы и условия у организатора.</p>
  </div></section>
  ${volcanoQuizBlock(page)}
  ${volcanoTourTable(page)}
  <section class="section section-tight jeep-proof volcano-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Сильная экскурсия на вулкан честно описывает запасной план</h2><p>Ищите программу, где названы пешая часть, транспорт, ограничения по погоде и решение на случай закрытой дороги или плохой видимости.</p><a class="button button-light" href="#compare-volcano-tours">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/volcano-excursion-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Вершина не обязательна</h3><p>Для первого знакомства часто достаточно плато, перевала или подножия: меньше риска перегрузить день и больше шансов спокойно увидеть район.</p></article>
    <article class="proof-card"><img src="/images/trekking-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Покрытие меняет сложность</h3><p>Шлак, снег, камни и ветер могут сделать короткую дистанцию тяжелее, чем кажется по километрам. Уточняйте требования до оплаты.</p></article>
  </div></section>`;
}

function oneDayExcursionConversionBlocks(page) {
  if (page.path !== '/ekskursii/odnodnevnye/') return '';
  return `<section class="section section-tight jeep-lead oneday-lead"><div class="shell">
    <p>Однодневные экскурсии по Камчатке удобны, когда уже есть база в Петропавловске-Камчатском или Елизово и нужно выбрать один сильный выезд без смены гостиницы. Главный фильтр здесь не “самая красивая точка”, а баланс дороги, пешей части, времени возвращения и запасного плана.</p>
  </div></section>
  ${oneDayExcursionQuizBlock(page)}
  ${oneDayExcursionTable(page)}
  <section class="section section-tight jeep-proof oneday-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Хорошая однодневная экскурсия честно считает часы</h2><p>Смотрите, сколько времени уйдёт на дорогу, где начинается пешая часть, что входит в цену и чем организатор заменяет маршрут при тумане, ветре или закрытой дороге.</p><a class="button button-light" href="#compare-oneday-excursions">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/black-beach-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Один день не резиновый</h3><p>Лучше выбрать одну главную цель и оставить запас на дорогу, чем собрать слишком много точек и провести день в переездах.</p></article>
    <article class="proof-card"><img src="/images/volcano-excursion-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Погода меняет сценарий</h3><p>Для вулканов, океана и грунтовых дорог важен план Б: наземная замена, перенос или понятный порядок возврата.</p></article>
  </div></section>`;
}

function vipConversionBlocks(page) {
  if (page.path !== '/tury/vip/') return '';
  return `<section class="section section-tight jeep-lead vip-lead"><div class="shell">
    <p>VIP-туры на Камчатку стоит сравнивать не по одному слову в названии, а по тому, что реально делает поездку управляемой: приватность, размещение, транспорт, размер группы, запасные сценарии и понятная смета. Сначала выберите приоритет, затем проверьте реальные программы и условия у организатора.</p>
  </div></section>
  ${vipQuizBlock(page)}
  ${vipTourTable(page)}
  <section class="section section-tight jeep-proof vip-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Сильный VIP-тур честно объясняет, за что вы платите</h2><p>Ищите не громкое слово VIP, а расшифровку: кто едет с вами, какой транспорт используется, где ночевки, что входит в цену и какой план действует при погодных переносах.</p><a class="button button-light" href="#compare-vip-tours">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/vip-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Приватность бывает частичной</h3><p>Даже дорогая программа может совмещать отдельные экскурсии с другими участниками. Уточняйте, какие дни действительно индивидуальные, а какие проходят в сборном формате.</p></article>
    <article class="proof-card"><img src="/images/lodge-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Комфорт держится на деталях</h3><p>Категория номера, питание, трансферы, багаж, связь и замены при непогоде важнее красивого названия. Попросите смету и программу по дням до оплаты.</p></article>
  </div></section>`;
}

function fishingConversionBlocks(page) {
  if (page.path !== '/tury/rybalka/') return '';
  return `<section class="section section-tight jeep-lead fishing-lead"><div class="shell">
    <p>Рыболовные туры на Камчатку стоит сравнивать по роли рыбалки в маршруте: отдельный речной выезд, морской день, недельная тематическая программа или большой тур, где ловля встроена между вулканами, сплавом и океаном. Сначала выберите формат, затем проверьте снасти, лицензии, безопасность и запасной план у организатора.</p>
  </div></section>
  ${fishingQuizBlock(page)}
  ${fishingTourTable(page)}
  <section class="section section-tight jeep-proof fishing-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Хорошая рыбалка честно говорит не только про улов</h2><p>Сильная программа описывает место ловли, правила, снасти, роль инструктора, безопасность на воде и замену при шторме, подъёме воды или закрытом участке.</p><a class="button button-light" href="#compare-fishing-tours">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/fishing-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Формат важнее красивого слова</h3><p>“Рыбалка” может означать день на реке, морской выход, сплав с ловлей или короткую активность в обзорном туре. Смотрите, сколько времени действительно отдано воде.</p></article>
    <article class="proof-card"><img src="/images/black-beach-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Погода меняет воду</h3><p>Ветер, волна, уровень воды и правила промысла могут менять маршрут. До оплаты попросите понятный план замены и условия переноса.</p></article>
  </div></section>`;
}



function toursHubQuizBlock(page) {
  if (page.path !== '/tury/') return '';
  return `<section class="section section-tight jeep-quiz-section tours-hub-quiz-section" id="tours-quiz"><div class="shell">
    <div class="jeep-quiz tours-hub-quiz">
      <div class="jeep-quiz-copy tours-hub-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какой стиль поездки на Камчатку вам ближе?</h2>
        <p>Ответьте для себя на три вопроса перед сравнением туров: сколько дней есть, какая нагрузка комфортна и что должно быть в центре маршрута. Это помогает открыть подборку уже с правильными вопросами к организатору.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset>
          <legend>1. Сколько дней вы готовы провести в маршруте?</legend>
          <label><input type="radio" name="tours-duration" checked> 5-8 дней: первая большая поездка без лишней спешки</label>
          <label><input type="radio" name="tours-duration"> 9+ дней: больше районов, меньше риска не успеть из-за погоды</label>
          <label><input type="radio" name="tours-duration"> 1-3 дня: база уже выбрана, нужны отдельные экскурсии</label>
        </fieldset>
        <fieldset>
          <legend>2. Какой уровень нагрузки вам ок?</legend>
          <label><input type="radio" name="tours-load" checked> Умеренный: вулканы, океан, источники и переезды без автономного похода</label>
          <label><input type="radio" name="tours-load"> Активный: восхождения, треккинг, сплав или несколько ходовых дней</label>
          <label><input type="radio" name="tours-load"> Мягкий: комфортная база, меньше переездов, можно с детьми</label>
        </fieldset>
        <fieldset>
          <legend>3. Что вы хотите видеть в центре?</legend>
          <label><input type="radio" name="tours-focus" checked> Вулканы, океан и главные места в одном туре</label>
          <label><input type="radio" name="tours-focus"> Рыбалка, гастрономия, этноформат или тематический маршрут</label>
          <label><input type="radio" name="tours-focus"> Индивидуальный темп, приватность или повышенный комфорт</label>
        </fieldset>
        <div class="jeep-quiz-result">
          <strong>Сначала сравните реальные программы, затем проверьте даты и места.</strong>
          <span>В таблице ниже собраны актуальные туры на Камчатку из партнерской выдачи. Финальную стоимость, свободные места и условия замены маршрута уточняйте у организатора.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" ${partnerAttrsFor(page)}>Подобрать туры по датам →</a>
        </div>
      </div>
    </div>
  </div></section>`;
}

function toursHubTable(page) {
  if (page.path !== '/tury/') return '';
  const tours = youtravelTours.byPage?.[page.path] || [];
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare tours-hub-compare" id="compare-kamchatka-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Реальные предложения</p><h2>Актуальные туры на Камчатку</h2></div><p>Сравнивайте не только цену: важны длительность, размер группы, тип маршрута, проживание, нагрузка и запасной план на случай тумана, дождя или закрытой дороги. Даты, места и финальная стоимость открываются на странице организатора.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Тур</th><th>Формат</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.slice(0, 8).map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${esc((tour.types || []).slice(0, 3).join(', ') || 'тур по Камчатке')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места →</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>В таблице только часть доступных туров на Камчатку.</strong><span>У организаторов могут быть свежие заезды, другие форматы, новые места в группах и условия, которые не попали в короткую подборку.</span></div>
      <a class="button button-primary" ${partnerAttrsFor(page)}>Смотреть свежие предложения →</a>
    </div>
  </div></section>`;
}

function toursHubConversionBlocks(page) {
  if (page.path !== '/tury/') return '';
  return `<section class="section section-tight jeep-lead tours-hub-lead"><div class="shell">
    <p>Туры на Камчатку лучше выбирать не по самому громкому названию, а по сценарию поездки: сколько дней вы готовы быть в дороге, какие локации обязательны, насколько комфортны переезды и какая нагрузка подходит группе. Хорошая программа честно показывает, что входит в стоимость, где возможны погодные замены и какие вопросы нужно задать организатору до оплаты.</p>
  </div></section>
  ${toursHubQuizBlock(page)}
  ${toursHubTable(page)}
  <section class="section section-tight jeep-proof tours-hub-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Лучшие туры на Камчатку не пытаются показать всё любой ценой</h2><p>Сильный маршрут оставляет время на погоду, не прячет долгие переезды и заранее объясняет, какие выезды зависят от дороги, моря или видимости.</p><a class="button button-light" href="#compare-kamchatka-tours">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/volcano-excursion-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Формат важнее списка мест</h3><p>Один тур может быть обзорным и комфортным, другой - активным с восхождениями и ранними стартами. Сравнивайте темп, а не только названия локаций.</p></article>
    <article class="proof-card"><img src="/images/black-beach-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Погода требует запаса</h3><p>Для вулканов, океана и удаленных районов важны резервные дни, понятная замена маршрута и условия возврата или переноса у организатора.</p></article>
  </div></section>`;
}

function toursHubStickyCta(page) {
  if (page.path !== '/tury/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры →</a>
  </div>`;
}

function conversionBlocks(page) {
  return `${toursHubConversionBlocks(page)}${jeepConversionBlocks(page)}${trekkingConversionBlocks(page)}${volcanoConversionBlocks(page)}${oneDayExcursionConversionBlocks(page)}${vipConversionBlocks(page)}${fishingConversionBlocks(page)}`;
}

function stickyCta(page) {
  return `${toursHubStickyCta(page)}${jeepStickyCta(page)}${trekkingStickyCta(page)}${volcanoStickyCta(page)}${oneDayExcursionStickyCta(page)}${vipStickyCta(page)}${fishingStickyCta(page)}`;
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
    ${conversionBlocks(page)}
    <section class="section"><div class="shell content-layout">
      <article class="content">${page.sections.map(([title, body]) => `<section><h2>${esc(title)}</h2>${body}</section>`).join('')}${faqBlock(page.faqs)}</article>
      <aside class="sidebar"><h2>${isLegal ? 'Навигация по проекту' : 'Сравнить программы'}</h2><p>${isLegal ? 'Перейдите к путеводителю или подборке форматов путешествия.' : 'Актуальные цены, даты и условия бронирования находятся на стороне организатора.'}</p><a class="button button-primary" ${isLegal ? 'href="/tury/"' : pagePartnerAttrs}>${isLegal ? 'Перейти к турам' : 'Посмотреть предложения ↗'}</a><ul class="mini-list"><li><a href="/blog/kogda-ehat/">Когда лучше ехать</a></li><li><a href="/blog/skolko-stoit-poezdka/">Из чего складывается бюджет</a></li><li><a href="/o-proekte/">Как работает проект</a></li></ul></aside>
    </div></section>
    ${!isLegal ? partnerTourBlock(page) : ''}
    ${page.cards?.length ? `<section class="section section-tight related"><div class="shell"><div class="section-head"><div><p class="eyebrow">Продолжить подготовку</p><h2>Полезно по теме</h2></div><p>Связанные маршруты и практические инструкции.</p></div><div class="grid grid-3">${cards(page.cards)}</div></div></section>` : ''}
    ${!isLegal ? `<section class="section section-tight"><div class="shell"><div class="cta"><div><h2>Сначала разобраться.<br>Потом бронировать.</h2><p>Сравните программу, задайте вопросы организатору и проверьте актуальные условия.</p></div><a class="button" ${pagePartnerAttrs}>Открыть подходящие туры ↗</a></div></div></section>` : ''}
  </main>${stickyCta(page)}${footer()}${assetScripts()}</body></html>`;
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
  </main>${footer()}${assetScripts()}</body></html>`;
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
writeFileSync(join(dist, '404.html'), `${head({ title: 'Страница не найдена', description: 'Страница не найдена.', path: '/404/' })}${header('/404/')}<main id="content"><section class="page-hero" style="--page-hero-image: url('/images/field-guide-kamchatka.jpg')"><div class="shell"><p class="eyebrow">Ошибка 404</p><h1>Маршрут потерялся в тумане</h1><p class="page-lead">Вернитесь на главную или продолжите подготовку к поездке.</p><p><a class="button button-primary" href="/">На главную</a></p></div></section></main>${footer()}${assetScripts()}</body></html>`, 'utf8');
console.log(`Built ${urls.length} pages in ${dist}`);
