import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pages, pageByPath, site } from './src/pages.mjs';
import { youtravelTours } from './src/youtravel-tours.generated.mjs';

const dist = join(process.cwd(), 'dist');
if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(process.cwd(), 'public'), dist, { recursive: true });

const esc = (value = '') => String(value).replaceAll('&quot;', '"').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const absolute = (path) => `${site.url}${path}`;
const assetVersion = '20260711-whales-v1';
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
    publisher: { '@type': 'Organization', name: site.name }, dateModified: '2026-07-11'
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
    summary: 'Комфортный недельный маршрут с размещением до уровня 4* и семейной логикой без грубой экспедиционности.',
    goodFor: 'Подойдет тем, кто хочет больше комфорта, понятный график и умеренную активность, но все равно хочет увидеть вулканические и обзорные локации.',
    check: 'Сравните категории номеров, состав питания, длительность переездов и то, какие активности заменяются при плохой погоде без доплат.'
  },
  43446: {
    summary: 'Комфортная программа с внедорожными и экскурсионными днями, где невысокая активность важнее гонки за максимумом точек.',
    goodFor: 'Подойдёт семье, которой нужен большой обзор Камчатки без ощущения спортивной экспедиции каждый день.',
    check: 'Уточните самые длинные переезды, состав размещения, питание для ребёнка и какие выезды можно заменить при усталости или погоде.'
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
  43020: {
    summary: 'Однодневная экскурсия на Авачинский перевал с экструзией Верблюд — классический короткий сценарий для знакомства с вулканическим рельефом рядом с городом.',
    goodFor: 'Подойдет тем, кто хочет выразительный вулканический день без ночевки вне базы и без сложной многодневной логистики.',
    check: 'Уточните состояние дороги, длительность пешей части, требования к обуви, посадку в транспорте и замену маршрута при тумане или сильном ветре.'
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
    goodFor: 'Подойдёт семье, которая хочет заранее понятные трансферы, питание и базовую организацию, но готова проверить нагрузку каждого дня.',
    check: 'Проверьте, какие расходы действительно входят, предоставляются ли снасти и одежда, какие дни зависят от погоды и есть ли ограничения по возрасту.'
  },
  70220: {
    summary: 'Бережный по названию и фактам маршрут с умеренной активностью, экскурсионной логикой и внедорожными выездами без чрезмерной спортивной подачи.',
    goodFor: 'Подойдёт для первого семейного знакомства, если нужен мягкий темп, паузы и понятное возвращение на базу.',
    check: 'Спросите про длительность каждого переезда, возможность пропустить выезд, питание, детское кресло и запасной сценарий при непогоде.'
  },
  11430: {
    summary: 'Десятидневная активная программа, где рыбалка сочетается с походом, сплавом, восхождениями и внедорожной логистикой. Это скорее приключенческий маршрут, чем спокойная рыболовная база.',
    goodFor: 'Подойдёт опытным путешественникам, которым важна разная активность каждый день и которые готовы к насыщенному графику.',
    check: 'Сравните нагрузку, ночёвки, снаряжение, длительность забросок и то, какая часть маршрута посвящена именно рыбалке.'
  },
  68582: {
    summary: 'Семидневный рыболовный тур с небольшим размером группы и автомобильной логистикой. По набору фактов он ближе к тематической поездке, где рыбалка стоит в центре.',
    goodFor: 'Подойдёт семье с подростком или ребёнком, которому интересна рыбалка, если организатор подтверждает возраст, безопасность на воде и темп.',
    check: 'Уточните реки или акватории, лицензии, снасти, условия проживания, хранение улова и запасной план на случай воды или ветра.'
  },
  67102: {
    summary: 'Насыщенный экскурсионный маршрут с семейным типом и внедорожными участками. Он может быть интересным, но требует особенно внимательно сверить нагрузку.',
    goodFor: 'Подойдёт семьям с активными подростками или взрослым составом, которым важен полный набор впечатлений и умеренная бытовая предсказуемость.',
    check: 'Уточните, какие дни самые длинные, можно ли сократить пешую часть, как устроены ночёвки и что меняется при плохой погоде.'
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
  },
  68407: {
    summary: 'Зимний недельный формат с городом и Паратункой: акцент не на спортивной экстремальности, а на снежной Камчатке, термальной базе и понятной логистике.',
    goodFor: 'Подойдёт для первой зимней поездки, если хочется увидеть регион в снегу, но не строить путешествие вокруг фрирайда или сложной экспедиции.',
    check: 'Проверьте зимние трансферы, список одежды, время на источниках, запасной сценарий при пурге и то, какие выезды зависят от состояния дороги.'
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
      <h3>${esc(tour.title.trim())}</h3>
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

function familyTours() {
  const tours = youtravelTours.tours || [];
  const scored = tours.map((tour) => {
    const haystack = `${tour.title || ''} ${(tour.types || []).join(' ')} ${(tour.accommodation || []).join(' ')}`.toLowerCase();
    let score = 0;
    if (haystack.includes('семей')) score += 8;
    if (haystack.includes('дет')) score += 5;
    if ((tour.types || []).some((type) => type.toLowerCase().includes('экскурсион'))) score += 2;
    if (tour.activity && tour.activity <= 2) score += 4;
    if (tour.activity === 3) score += 1;
    if (tour.comfort && tour.comfort >= 4) score += 3;
    if (tour.groupSize && tour.groupSize <= 10) score += 2;
    if (tour.durationDays && tour.durationDays >= 5 && tour.durationDays <= 9) score += 1;
    return { tour, score };
  });
  return scored
    .filter(({ score }) => score >= 5)
    .sort((a, b) => b.score - a.score || (b.tour.rating || 0) - (a.tour.rating || 0) || (a.tour.price || 0) - (b.tour.price || 0))
    .map(({ tour }) => tour)
    .slice(0, 8);
}

function familyQuizBlock(page) {
  if (page.path !== '/tury/s-detmi/') return '';
  return `<section class="section section-tight jeep-quiz-section family-quiz-section" id="family-quiz"><div class="shell">
    <div class="jeep-quiz family-quiz" data-family-quiz>
      <div class="jeep-quiz-copy family-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какой семейный ритм вам ближе?</h2>
        <p>Ответьте на два вопроса перед сравнением программ: возраст и темп поездки часто важнее количества локаций в маршруте.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset>
          <legend>Кто едет на Камчатку?</legend>
          <label><input type="radio" name="family-age" value="small" checked> Младший ребёнок: важны короткие дни и тёплая база</label>
          <label><input type="radio" name="family-age" value="teen"> Подросток: можно больше активности, но без перегруза</label>
          <label><input type="radio" name="family-age" value="mixed"> Разный возраст: нужен гибкий сценарий для всей семьи</label>
        </fieldset>
        <fieldset>
          <legend>Какой темп поездки вам комфортен?</legend>
          <label><input type="radio" name="family-style" value="base" checked> Одна база, меньше переездов и понятные возвращения</label>
          <label><input type="radio" name="family-style" value="active"> Больше вулканов, океана и активных дней</label>
          <label><input type="radio" name="family-style" value="comfort"> Больше комфорта, питания и заранее ясных включений</label>
        </fieldset>
        <div class="jeep-quiz-result" data-family-quiz-result>
          <strong>Смотрите мягкие семейные маршруты.</strong>
          <span>Начните с программ, где понятны база, самый длинный переезд, питание, детское кресло и запасной день.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" ${partnerAttrsFor(page)}>Подобрать семейные туры по датам ↗</a>
        </div>
      </div>
    </div>
  </div></section>`;
}

function familyTourTable(page) {
  if (page.path !== '/tury/s-detmi/') return '';
  const tours = familyTours();
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare family-compare" id="compare-family-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Семейные варианты</p><h2>Туры на Камчатку с детьми и мягким темпом</h2></div><p>В таблице собраны реальные программы, где есть семейный признак, умеренная активность, комфортное размещение или небольшой состав группы. Финальные даты, возрастные условия, места и состав услуг проверяйте у организатора.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Почему может подойти</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${tour.activity && tour.activity <= 2 ? 'мягкая активность' : tour.comfort && tour.comfort >= 4 ? 'комфортный формат' : esc((tour.types || []).slice(0, 2).join(', ') || 'семейный тур')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>Возрастные условия лучше проверять до оплаты.</strong><span>У организаторов могут быть новые даты, другие семейные форматы, детские кресла, ограничения по возрасту и погодные замены, которых нет в короткой таблице.</span></div>
      <a class="button button-primary" ${partnerAttrsFor(page)}>Смотреть свежие семейные туры ↗</a>
    </div>
  </div></section>`;
}

function familyStickyCta(page) {
  if (page.path !== '/tury/s-detmi/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}


function allInclusiveTours() {
  const tours = youtravelTours.tours || [];
  const scored = tours.map((tour) => {
    const haystack = `${tour.title || ''} ${(tour.types || []).join(' ')} ${(tour.accommodation || []).join(' ')}`.toLowerCase();
    let score = 0;
    if (haystack.includes('всё включено') || haystack.includes('все включено')) score += 12;
    if (haystack.includes('комфорт')) score += 3;
    if (haystack.includes('семей')) score += 2;
    if (haystack.includes('рыбал')) score += 1;
    if (tour.comfort && tour.comfort >= 4) score += 2;
    if (tour.durationDays && tour.durationDays >= 6 && tour.durationDays <= 10) score += 2;
    if (tour.totalDates && tour.totalDates > 1) score += 1;
    return { tour, score };
  });
  return scored
    .filter(({ score }) => score >= 7)
    .sort((a, b) => b.score - a.score || (b.tour.reviews || 0) - (a.tour.reviews || 0) || (a.tour.price || 0) - (b.tour.price || 0))
    .map(({ tour }) => tour)
    .slice(0, 8);
}

function allInclusiveFormat(tour) {
  if (tour.isPrivate) return 'приватный / гибкий пакет';
  if ((tour.types || []).some((type) => type.toLowerCase().includes('рыбал'))) return 'пакет с рыбалкой';
  if (tour.comfort && tour.comfort >= 4) return 'комфортный пакет';
  return (tour.types || []).slice(0, 2).join(', ') || 'пакетный тур';
}

function allInclusiveQuizBlock(page) {
  if (page.path !== '/tury/vse-vklyucheno/') return '';
  return `<section class="section section-tight jeep-quiz-section inclusive-quiz-section" id="inclusive-quiz"><div class="shell">
    <div class="jeep-quiz inclusive-quiz" data-inclusive-quiz>
      <div class="jeep-quiz-copy inclusive-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какой пакет «всё включено» вам ближе?</h2>
        <p>Ответьте на два вопроса перед сравнением программ: важнее бытовой комфорт, насыщенный маршрут или минимальная самостоятельная сборка логистики.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset>
          <legend>1. Какой стиль поездки вам ближе?</legend>
          <label><input type="radio" name="inclusive-style" value="comfort" checked> Комфортная база, понятное питание и меньше бытовых решений</label>
          <label><input type="radio" name="inclusive-style" value="active"> Максимум локаций: вулканы, океан, источники и внедорожные дни</label>
          <label><input type="radio" name="inclusive-style" value="family"> Семейный или спокойный темп без перегруза</label>
        </fieldset>
        <fieldset>
          <legend>2. Где хочется снять больше всего неопределённости?</legend>
          <label><input type="radio" name="inclusive-risk" value="budget" checked> Итоговый бюджет: что входит и где доплаты</label>
          <label><input type="radio" name="inclusive-risk" value="weather"> Замены при погоде и закрытых дорогах</label>
          <label><input type="radio" name="inclusive-risk" value="logistics"> Трансферы, багаж, размещение и питание по дням</label>
        </fieldset>
        <div class="jeep-quiz-result" data-inclusive-quiz-result>
          <strong>Смотрите комфортные пакетные туры.</strong>
          <span>Начните с программ, где подробно расписаны проживание, питание, трансферы и условия замены выездов.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" ${partnerAttrsFor(page)}>Сравнить туры всё включено по датам ↗</a>
        </div>
      </div>
    </div>
  </div></section>`;
}

function allInclusiveTourTable(page) {
  if (page.path !== '/tury/vse-vklyucheno/') return '';
  const tours = allInclusiveTours();
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare inclusive-compare" id="compare-inclusive-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Пакетные программы</p><h2>Туры на Камчатку всё включено: что сравнить в первую очередь</h2></div><p>В таблице собраны реальные программы, где пакетность заявлена в названии или хорошо считывается по формату. Смотрите не только цену: важны состав включённых услуг, тип размещения, питание, группа и правила замены погодозависимых выездов.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Пакетный акцент</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${esc(allInclusiveFormat(tour))}${tour.accommodation?.length ? `<small>${esc(tour.accommodation.slice(0, 2).join(', '))}</small>` : ''}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>Состав «всё включено» всегда проверяется в карточке тура.</strong><span>У организаторов могут быть новые даты, другие варианты размещения, семейные условия и доплаты, которых нет в короткой таблице.</span></div>
      <a class="button button-primary" ${partnerAttrsFor(page)}>Посмотреть свежие предложения ↗</a>
    </div>
  </div></section>`;
}

function allInclusiveStickyCta(page) {
  if (page.path !== '/tury/vse-vklyucheno/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}

function allInclusiveConversionBlocks(page) {
  if (page.path !== '/tury/vse-vklyucheno/') return '';
  return `<section class="section section-tight jeep-lead inclusive-lead"><div class="shell">
    <p>Пакетный тур хорош, когда он снимает с вас сборку маршрута, но не прячет важные условия. Сначала выберите стиль поездки, затем сравните реальные программы и проверьте, какие услуги входят в стоимость именно по дням.</p>
  </div></section>
  ${allInclusiveQuizBlock(page)}
  ${allInclusiveTourTable(page)}
  <section class="section section-tight jeep-proof inclusive-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Сильный пакет не обещает невозможного, а честно показывает границы</h2><p>На Камчатке погода, дороги и море могут менять планы. Хороший формат «всё включено» заранее объясняет, какие услуги входят, что заменяется и где возможны доплаты.</p><a class="button button-light" href="#compare-inclusive-tours">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/lodge-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Бытовая собранность</h3><p>Проверьте размещение, питание, трансферы и свободные дни: именно здесь пакетный формат должен экономить время и помогать не собирать маршрут вручную.</p></article>
    <article class="proof-card"><img src="/images/hero-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Запасной сценарий</h3><p>Всё включено не гарантирует погоду. Зато может заранее дать понятный план замены для моря, вертолёта, вулкана или закрытой дороги.</p></article>
  </div></section>`;
}

function gastroTours(page) {
  const direct = youtravelTours.byPage?.[page.path] || [];
  if (direct.length) return direct.slice(0, 8);
  const tours = youtravelTours.tours || [];
  const scored = tours.map((tour) => {
    const haystack = `${tour.title || ''} ${(tour.types || []).join(' ')} ${(tour.accommodation || []).join(' ')}`.toLowerCase();
    let score = 0;
    if (haystack.includes('гастр')) score += 12;
    if (haystack.includes('рыбал')) score += 3;
    if (haystack.includes('всё включено') || haystack.includes('все включено')) score += 2;
    if (haystack.includes('мор')) score += 1;
    if (tour.totalDates && tour.totalDates > 1) score += 1;
    if (tour.durationDays && tour.durationDays >= 6 && tour.durationDays <= 12) score += 1;
    return { tour, score };
  });
  return scored
    .filter(({ score }) => score >= 5)
    .sort((a, b) => b.score - a.score || (b.tour.reviews || 0) - (a.tour.reviews || 0) || (a.tour.price || 0) - (b.tour.price || 0))
    .map(({ tour }) => tour)
    .slice(0, 8);
}

function gastroTourFocus(tour) {
  const haystack = `${tour.title || ''} ${(tour.types || []).join(' ')}`.toLowerCase();
  if (haystack.includes('гастр') && haystack.includes('рыбал')) return 'гастро и рыбалка';
  if (haystack.includes('гастр')) return 'гастрономический акцент';
  if (haystack.includes('всё включено') || haystack.includes('все включено')) return 'питание в пакете';
  if (haystack.includes('рыбал')) return 'рыбалка и локальная кухня';
  return (tour.types || []).slice(0, 2).join(', ') || 'гастроформат';
}

function gastroQuizBlock(page) {
  if (page.path !== '/tury/gastro/') return '';
  return `<section class="section section-tight jeep-quiz-section gastro-quiz-section" id="gastro-quiz"><div class="shell">
    <div class="jeep-quiz gastro-quiz" data-gastro-quiz>
      <div class="jeep-quiz-copy gastro-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какой вкус Камчатки вам ближе?</h2>
        <p>Ответьте для себя на два вопроса перед сравнением программ: гастротур может быть про рыбалку, спокойные ужины, этноформат или большой маршрут с яркими локальными блюдами.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset>
          <legend>Что вы хотите видеть в центре?</legend>
          <label><input type="radio" name="gastro-focus" value="sea" checked> Морепродукты, рыбу, икру и понятные гастроужины</label>
          <label><input type="radio" name="gastro-focus" value="fishing"> Рыбалку, приготовление улова и водный день</label>
          <label><input type="radio" name="gastro-focus" value="local"> Локальные продукты, дикоросы, чай и этноформат</label>
        </fieldset>
        <fieldset>
          <legend>Какой ритм поездки вам ближе?</legend>
          <label><input type="radio" name="gastro-style" value="comfort" checked> Комфортная база, питание по дням и меньше бытовой сборки</label>
          <label><input type="radio" name="gastro-style" value="active"> Активный маршрут: вулканы, океан, рыбалка и дегустации между выездами</label>
          <label><input type="radio" name="gastro-style" value="short"> Один-два ярких гастроакцента внутри большой поездки</label>
        </fieldset>
        <div class="jeep-quiz-result" data-gastro-quiz-result>
          <strong>Смотрите гастротуры с понятным питанием по дням.</strong>
          <span>Начните с программ, где указаны гастроакценты, включённые приёмы пищи, рыбалка или замены при погоде.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" ${partnerAttrsFor(page)}>Подобрать гастротуры по датам ↗</a>
        </div>
      </div>
    </div>
  </div></section>`;
}

function gastroTourTable(page) {
  if (page.path !== '/tury/gastro/') return '';
  const tours = gastroTours(page);
  if (!tours.length) return `<section class="section section-tight tour-compare gastro-compare" id="compare-gastro-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Свежие предложения</p><h2>Гастротуры лучше проверять по актуальным датам</h2></div><p>Гастрономические программы зависят от сезона, меню, рыбалки, морских выходов и свободных мест. Если короткая подборка сейчас пустая, откройте свежие предложения и сравните условия организаторов.</p></div>
    <div class="table-partner-cta"><div><strong>Не фиксируем меню и места вручную.</strong><span>Смотрите актуальные даты, питание, гастроакценты и условия замены у организатора перед оплатой.</span></div><a class="button button-primary" ${partnerAttrsFor(page)}>Смотреть гастротуры ↗</a></div>
  </div></section>`;
  return `<section class="section section-tight tour-compare gastro-compare" id="compare-gastro-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Реальные предложения</p><h2>Гастрономические туры по Камчатке: что сравнить</h2></div><p>В таблице собраны программы, где гастрономия, рыбалка, питание или локальная кухня читаются как важный акцент. Финальные даты, меню, свободные места и состав услуг проверяйте на странице организатора.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Гастроакцент</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${esc(gastroTourFocus(tour))}${tour.accommodation?.length ? `<small>${esc(tour.accommodation.slice(0, 2).join(', '))}</small>` : ''}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>Меню и продукты нужно подтверждать ближе к поездке.</strong><span>У организаторов могут быть новые даты, другие гастроужины, рыбалка, этноформаты и условия по питанию, которых нет в короткой таблице.</span></div>
      <a class="button button-primary" ${partnerAttrsFor(page)}>Смотреть свежие гастротуры ↗</a>
    </div>
  </div></section>`;
}

function gastroStickyCta(page) {
  if (page.path !== '/tury/gastro/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}

function gastroConversionBlocks(page) {
  if (page.path !== '/tury/gastro/') return '';
  return `<section class="section section-tight jeep-lead gastro-lead"><div class="shell">
    <p>Гастротур на Камчатку лучше выбирать как маршрут, где вкус связан с природой и логистикой: рыбалка, морепродукты, локальные ужины, источники, океан и понятное питание по дням. Сначала определите главный гастроакцент, затем сравните реальные программы и проверьте условия у организатора.</p>
  </div></section>
  ${gastroQuizBlock(page)}
  ${gastroTourTable(page)}
  <section class="section section-tight jeep-proof gastro-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Сильный гастротур не обещает деликатесы без привязки к сезону</h2><p>Проверяйте питание по дням, роль рыбалки, замену морского выхода, ограничения по меню и то, какие продукты входят в базовую стоимость.</p><a class="button button-light" href="#compare-gastro-tours">Сравнить гастротуры</a></article>
    <article class="proof-card"><img src="/images/gastro-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Еда должна быть частью маршрута</h3><p>Лучше, когда дегустация связана с рыбалкой, океаном, локальной кухней или принимающей стороной, а не добавлена одной строкой в описании.</p></article>
    <article class="proof-card"><img src="/images/fishing-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Рыбалка меняет правила</h3><p>Если гастроакцент строится вокруг улова, заранее уточните снасти, безопасность, разрешения, питание на воде и замену при ветре или высокой воде.</p></article>
  </div></section>`;
}

function winterQuizBlock(page) {
  if (page.path !== '/tury/zima/') return '';
  return `<section class="section section-tight jeep-quiz-section winter-quiz-section" id="winter-quiz"><div class="shell">
    <div class="jeep-quiz winter-quiz" data-winter-quiz>
      <div class="jeep-quiz-copy winter-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какой зимний формат вам ближе?</h2>
        <p>Ответьте для себя на два вопроса перед сравнением программ: хотите спокойную базу с источниками, снежную активность или спортивный маршрут с отдельными требованиями к безопасности.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset>
          <legend>Что вы хотите видеть в центре поездки?</legend>
          <label><input type="radio" name="winter-format" value="relax" checked> Город, Паратунку, источники и спокойные зимние выезды</label>
          <label><input type="radio" name="winter-format" value="snow"> Снегоходы, перевалы, вулканические районы и больше движения</label>
          <label><input type="radio" name="winter-format" value="sport"> Фрирайд, ски-тур или другой спортивный снежный сценарий</label>
        </fieldset>
        <fieldset>
          <legend>Какой уровень комфорта нужен?</legend>
          <label><input type="radio" name="winter-comfort" value="base" checked> Тёплая база и возврат к проживанию после выездов</label>
          <label><input type="radio" name="winter-comfort" value="active"> Готовность к ранним стартам, ветру и длинным переездам</label>
          <label><input type="radio" name="winter-comfort" value="safety"> Главное — инструктор, снаряжение, связь и лавинная оценка</label>
        </fieldset>
        <div class="jeep-quiz-result" data-winter-quiz-result>
          <strong>Смотрите зимние туры с Паратункой и источниками.</strong>
          <span>Начните с программ, где понятны проживание, трансферы, список одежды и запасной сценарий при пурге.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" ${partnerAttrsFor(page)}>Подобрать зимние туры по датам ↗</a>
        </div>
      </div>
    </div>
  </div></section>`;
}

function winterTourFocus(tour) {
  const haystack = `${tour.title || ''} ${(tour.types || []).join(' ')}`.toLowerCase();
  if (/фрирайд|ски-тур|ски тур|ski|горнолыж|лавин/.test(haystack)) return 'спорт и снег';
  if (/снего|перевал|вулкан/.test(haystack)) return 'снежная активность';
  if (/паратунк|источник|релакс|город|морозн/.test(haystack)) return 'релакс и источники';
  return (tour.types || []).slice(0, 2).join(', ') || 'зимний маршрут';
}

function winterTourTable(page) {
  if (page.path !== '/tury/zima/') return '';
  const tours = youtravelTours.byPage?.[page.path] || [];
  if (!tours.length) return `<section class="section section-tight tour-compare winter-compare" id="compare-winter-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Зимние предложения</p><h2>Зимние туры лучше проверять по свежим датам</h2></div><p>Зимняя выдача меняется по снегу, датам, транспорту и составу групп. Если в короткой подборке сейчас мало подходящих программ, откройте свежие предложения и сравните условия организаторов.</p></div>
    <div class="table-partner-cta"><div><strong>Не фиксируем зимние места и цены вручную.</strong><span>Смотрите актуальные даты, свободные места, список одежды, транспорт и запасной сценарий на странице организатора.</span></div><a class="button button-primary" ${partnerAttrsFor(page)}>Смотреть зимние предложения ↗</a></div>
  </div></section>`;
  return `<section class="section section-tight tour-compare winter-compare" id="compare-winter-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Реальные зимние программы</p><h2>Зимние туры на Камчатку: что сравнить перед бронированием</h2></div><p>В таблице собраны зимние предложения, которые сейчас есть в подборке. Сравнивайте не только цену: важны даты, транспорт, тёплая база, список одежды, погодные замены и условия организатора.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Зимний акцент</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title.trim())}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${esc(winterTourFocus(tour))}${tour.accommodation?.length ? `<small>${esc(tour.accommodation.slice(0, 2).join(', '))}</small>` : ''}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>Зимняя таблица — только короткий старт для выбора.</strong><span>У партнёра могут быть новые даты, другие снежные форматы, места в группах и условия по одежде, которые лучше проверить перед оплатой.</span></div>
      <a class="button button-primary" ${partnerAttrsFor(page)}>Смотреть свежие зимние туры ↗</a>
    </div>
  </div></section>`;
}

function winterStickyCta(page) {
  if (page.path !== '/tury/zima/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}

function winterConversionBlocks(page) {
  if (page.path !== '/tury/zima/') return '';
  return `<section class="section section-tight jeep-lead winter-lead"><div class="shell">
    <p>Камчатка зимой — это не один формат, а несколько разных сценариев: спокойная база с источниками, снежные выезды к природным локациям или спортивные программы с отдельными требованиями к опыту. Сначала выберите ритм, затем сравните реальные предложения и проверьте условия у организатора.</p>
  </div></section>
  ${winterQuizBlock(page)}
  ${winterTourTable(page)}
  <section class="section section-tight jeep-proof winter-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Хороший зимний тур честно говорит, что будет при пурге</h2><p>Смотрите, где можно согреться, какой транспорт используется, какие выезды зависят от дороги и чем заменяют маршрут при плохой видимости или лавинной опасности.</p><a class="button button-light" href="#compare-winter-tours">Сравнить зимние туры</a></article>
    <article class="proof-card"><img src="/images/winter-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Тёплая база важна</h3><p>После снежного выезда нужны сушка вещей, горячая вода, нормальное питание и понятный трансфер. Зимой бытовые детали влияют на впечатление сильнее, чем кажется.</p></article>
    <article class="proof-card"><img src="/images/seasons-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Погода сильнее плана</h3><p>Дорога, ветер, снег и видимость могут менять день. Хорошая программа заранее объясняет перенос, замену и решение организатора по безопасности.</p></article>
  </div></section>`;
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

function volcanoBlogStickyCta(page) {
  if (page.path !== '/blog/vulkany-kamchatki/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}

function attractionsStickyCta(page) {
  if (page.path !== '/blog/dostoprimechatelnosti/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
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

function volcanoBlogTourTable({ id, eyebrow, title, intro, tours, ctaTitle, ctaText, ctaAttrs }) {
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare volcano-blog-compare" id="${id}"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div><p>${intro}</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Что проверить</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${tour.activity ? `нагрузка ${esc(tour.activity)} из 5` : esc((tour.types || []).slice(0, 2).join(', ') || 'вулканический маршрут')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>${ctaTitle}</strong><span>${ctaText}</span></div>
      <a class="button button-primary" ${ctaAttrs}>Подобрать по датам ↗</a>
    </div>
  </div></section>`;
}

function volcanoBlogConversionBlocks(page) {
  if (page.path !== '/blog/vulkany-kamchatki/') return '';
  const volcanoPattern = /вулкан|авачин|горел|мутнов|толбач|вилючин|перевал|лавов|кратер/i;
  const oneDayTours = (youtravelTours.byPage?.['/tury/dzhip-tury/one-day'] || [])
    .filter((tour) => volcanoPattern.test([tour.title, ...(tour.types || [])].join(' ')))
    .slice(0, 7);
  const multiDayTours = (youtravelTours.byPage?.['/ekskursii/vulkany/'] || []).slice(0, 6);
  const oneDayTable = volcanoBlogTourTable({
    id: 'volcano-one-day-routes',
    eyebrow: 'Сначала дешевле',
    title: 'Однодневные экскурсии к вулканам и перевалам',
    intro: 'Хороший старт, если хочется увидеть вулканический район без недельного бюджета: сравните цель выезда, нагрузку, цену, группу и условия замены при погоде.',
    tours: oneDayTours,
    ctaTitle: 'Однодневные выезды обычно проще вписать в поездку.',
    ctaText: 'Проверьте свежие даты, точку старта, трансфер и свободные места у организаторов перед оплатой.',
    ctaAttrs: partnerAttrsFor(page)
  });
  const multiDayTable = volcanoBlogTourTable({
    id: 'volcano-multi-day-routes',
    eyebrow: 'Больше районов',
    title: 'Многодневные туры с вулканами Камчатки',
    intro: 'Формат для тех, кто хочет связать вулканы, океан, источники и резервные дни в одну поездку. Здесь цены выше, зато больше локаций и меньше самостоятельной сборки логистики.',
    tours: multiDayTours,
    ctaTitle: 'В таблице только часть многодневных вулканических маршрутов.',
    ctaText: 'У организаторов могут быть новые даты, соседние форматы и места в группах, которые не попали в короткую подборку.',
    ctaAttrs: topToursPartnerAttrs
  });
  return `<section class="section section-tight jeep-lead volcano-lead"><div class="shell">
    <p>Эта страница помогает разобраться в вулканах Камчатки как в карте решений: какие районы ближе к городу, где нужна многодневная логистика, почему самый высокий вулкан не всегда лучший выбор и какие вопросы задать организатору перед оплатой.</p>
  </div></section>
  <section class="section section-tight jeep-quiz-section volcano-quiz-section"><div class="shell">
    <div class="jeep-quiz volcano-quiz">
      <div class="jeep-quiz-copy volcano-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какой вулканический сценарий вам ближе?</h2>
        <p>Выберите не название горы, а ритм поездки. Так проще перейти от чтения к программам, где понятны дорога, нагрузка и запасной план.</p>
      </div>
      <div class="jeep-quiz-panel">
        <div class="volcano-choice-list">
        <div class="checklist-panel volcano-choice-card">
          <h3>Хочу один сильный день</h3>
          <p>Смотрите обзорные экскурсии к Горелому, Авачинскому району, перевалам и вулканическим плато с понятным временем возвращения.</p>
          <a class="button button-primary" href="/ekskursii/vulkany/">Открыть экскурсии на вулканы</a>
        </div>
        <div class="checklist-panel volcano-choice-card">
          <h3>Хочу идти пешком и видеть больше рельефа</h3>
          <p>Сравните треккинговые туры: там важны километры, набор высоты, ночёвки, покрытие тропы и требования к участникам.</p>
          <a class="button button-light" href="/tury/trekking/">Сравнить походы</a>
        </div>
        <div class="checklist-panel volcano-choice-card">
          <h3>Хочу несколько районов за поездку</h3>
          <p>Берите многодневный формат с резервом на погоду, чтобы не ставить главный вулкан в единственное погодное окно.</p>
          <a class="button button-light" ${topToursPartnerAttrs}>Посмотреть топовые туры ↗</a>
        </div>
        </div>
      </div>
    </div>
  </div></section>
  ${oneDayTable}
  ${multiDayTable}
  <section class="section section-tight jeep-proof volcano-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как читать карту</p><h2>Вулканы Камчатки выбирают по логистике, а не по одной высоте</h2><p>Проверьте район, дорогу, пешую часть, запасной маршрут и сезонные ограничения. Это честнее, чем выбирать по фотографии кратера.</p><a class="button button-light" href="#volcano-one-day-routes">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/volcano-excursion-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Ближе не всегда проще</h3><p>Даже район рядом с городом может стать сложным из-за снега, ветра, закрытой дороги или состояния тропы.</p></article>
    <article class="proof-card"><img src="/images/trekking-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Резервный день спасает поездку</h3><p>Для вулканов лучше иметь запасной сценарий: другой район, перенос выезда или программа без подъёма к вершине.</p></article>
  </div></section>`;
}

function whaleTours() {
  const whalePattern = /кит|косат|касат|океан|яхт|морск|бухт|авачин/i;
  const candidates = [
    ...(youtravelTours.tours || []).filter((tour) => whalePattern.test([tour.title, ...(tour.types || [])].join(' '))),
    ...(youtravelTours.byPage?.['/tury/'] || []).filter((tour) => whalePattern.test([tour.title, ...(tour.types || [])].join(' '))),
    ...(youtravelTours.byPage?.['/ekskursii/'] || []).filter((tour) => whalePattern.test([tour.title, ...(tour.types || [])].join(' '))),
    ...(youtravelTours.byPage?.['/ekskursii/vulkany/'] || []).filter((tour) => whalePattern.test([tour.title, ...(tour.types || [])].join(' ')))
  ];
  const seen = new Set();
  return candidates.filter((tour) => {
    if (!tour?.id || seen.has(tour.id)) return false;
    seen.add(tour.id);
    return true;
  }).slice(0, 8);
}

function whaleTourFocus(tour) {
  const text = [tour.title, ...(tour.types || [])].join(' ').toLowerCase();
  if (/яхт|морск|океан|кит|косат|касат/.test(text)) return 'океанский день, погода и вероятность наблюдений';
  if (/вулкан|восхожд|джип|внедорож/.test(text)) return 'вулканы, океан и запасной сценарий';
  if (/экскурс/.test(text)) return 'обзорный формат и длительность выездов';
  return 'маршрут, сезон и условия у организатора';
}

function whaleTourDetails(tour) {
  const types = (tour.types || []).slice(0, 3).join(', ');
  const stay = (tour.accommodation || []).slice(0, 2).join(', ');
  const summary = [
    durationLabel(tour),
    types || 'комбинированная программа',
    stay ? `размещение: ${stay}` : '',
    tour.activity ? `нагрузка ${tour.activity} из 5` : ''
  ].filter(Boolean).join(' · ');
  return `<div class="tour-insight" data-tour-insight><button class="tour-insight-toggle" type="button" data-tour-insight-toggle aria-expanded="false">Подробнее о программе</button><div class="tour-insight-panel" data-tour-insight-panel hidden>
    <div class="tour-insight-panel-head"><strong>Коротко о программе</strong><span>Что уточнить перед оплатой</span></div>
    <div class="tour-insight-body">
      <p>${esc(summary)}</p>
      <ul><li><strong>Кому подойдёт:</strong> тем, кто хочет связать морской день с другими впечатлениями Камчатки и не строить поездку вокруг одной гарантии.</li><li><strong>Что проверить:</strong> как проходит океанский день, что заменяют при шторме, сколько свободных мест и какие условия переноса действуют у организатора.</li></ul>
    </div>
  </div></div>`;
}

function whaleTourTable(page) {
  const tours = whaleTours();
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare whale-compare" id="compare-whale-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Морские сценарии</p><h2>Туры, где можно совместить китов, косаток и Камчатку</h2></div><p>В таблице собраны программы, где океан, киты, косатки или морской формат видны уже в названии и фактах тура. Финальную программу, даты, свободные места и вероятность выхода в море проверяйте у организатора.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Что в центре</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${whaleTourDetails(tour)}</td>
      <td class="tour-format">${esc(whaleTourFocus(tour))}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>Морские условия меняются быстрее обычного расписания.</strong><span>Откройте свежие предложения, чтобы проверить даты, судно, запасной сценарий и условия у организатора перед оплатой.</span></div>
      <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
    </div>
  </div></section>`;
}

function whalesStickyCta(page) {
  if (page.path !== '/blog/kity-na-kamchatke/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}

function whalesConversionBlocks(page) {
  if (page.path !== '/blog/kity-na-kamchatke/') return '';
  return `<section class="section section-tight jeep-lead whale-lead"><div class="shell">
    <p>Эта страница помогает выбрать не «гарантию китов», а разумный морской сценарий: сезон, формат выхода, запас на погоду, этику наблюдения и туры, где океан встроен в общую поездку по Камчатке.</p>
  </div></section>
  <section class="section section-tight jeep-quiz-section whale-quiz-section"><div class="shell">
    <div class="jeep-quiz whale-quiz">
      <div class="jeep-quiz-copy whale-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какой морской сценарий вам ближе?</h2>
        <p>Выберите, насколько киты и косатки должны быть в центре поездки. Так проще понять, нужен ли отдельный выход в море, многодневный тур или запасной маршрут на случай ветра.</p>
      </div>
      <div class="jeep-quiz-panel">
        <div class="volcano-choice-list">
          <div class="checklist-panel volcano-choice-card">
            <h3>Хочу один океанский день</h3>
            <p>Смотрите морские прогулки и однодневные выезды, но заранее уточняйте судно, длительность, точку старта и порядок переноса при шторме.</p>
            <a class="button button-primary" href="/ekskursii/">Сравнить экскурсии</a>
          </div>
          <div class="checklist-panel volcano-choice-card">
            <h3>Хочу китов как часть большого тура</h3>
            <p>Выбирайте программы, где океан соединён с вулканами, источниками и резервными днями: так меньше риска, что вся поездка зависит от одного выхода.</p>
            <a class="button button-light" href="/tury/">Сравнить туры</a>
          </div>
          <div class="checklist-panel volcano-choice-card">
            <h3>Хочу максимум шансов без обещаний</h3>
            <p>Закладывайте несколько дней, проверяйте сезон и спрашивайте организатора о фактической статистике наблюдений на близких датах.</p>
            <a class="button button-light" ${topToursPartnerAttrs}>Посмотреть свежие предложения ↗</a>
          </div>
        </div>
      </div>
    </div>
  </div></section>
  ${whaleTourTable(page)}
  <section class="section section-tight jeep-proof whale-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Сильная программа не обещает китов, а объясняет море</h2><p>Проверяйте сезон, судно, длительность выхода, запасной день, правила переноса и этику наблюдения. На Камчатке честный морской тур говорит о вероятности, а не продаёт стопроцентную встречу.</p><a class="button button-light" href="#compare-whale-tours">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/orca-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Океан важнее расписания</h3><p>Даже в хороший сезон ветер и волна могут изменить день. Лучше иметь запасной сценарий, чем требовать выход любой ценой.</p></article>
    <article class="proof-card"><img src="/images/black-beach-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Камчатка сильнее в связке</h3><p>Киты и косатки хорошо сочетаются с вулканами, бухтами, источниками и спокойными днями между активными выездами.</p></article>
  </div></section>`;
}

function seasonalTours() {
  const candidates = [
    ...(youtravelTours.byPage?.['/tury/'] || []),
    ...(youtravelTours.byPage?.['/tury/trekking/'] || []),
    ...(youtravelTours.byPage?.['/tury/zima/'] || []),
    ...(youtravelTours.byPage?.['/tury/dzhip-tury/'] || []),
    ...(youtravelTours.byPage?.['/ekskursii/vulkany/'] || []),
    ...(youtravelTours.tours || []).filter((tour) => /лет|зим|июл|август|сентябр|вулкан|океан|рыбал|трек|поход|снег|источник/i.test([tour.title, ...(tour.types || [])].join(' ')))
  ];
  const seen = new Set();
  return candidates.filter((tour) => {
    if (!tour?.id || seen.has(tour.id)) return false;
    seen.add(tour.id);
    return true;
  }).slice(0, 8);
}

function seasonalTourTable(page) {
  const tours = seasonalTours();
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare seasonal-compare" id="compare-seasonal-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Туры по сезонам</p><h2>Программы, где важно сравнить даты и формат</h2></div><p>В таблице собраны реальные камчатские программы разных сезонов: обзорные туры, вулканы, треккинг, рыбалка и зимние форматы. Финальную стоимость, свободные места и условия переноса проверяйте на странице организатора.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Когда смотреть</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${tour.dateFrom ? esc(formatDate(tour.dateFrom)) : 'даты у организатора'}${tour.activity ? `<small>нагрузка ${esc(tour.activity)} из 5</small>` : ''}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить даты ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>Сезонные места быстро меняются.</strong><span>Откройте свежие предложения, чтобы проверить новые заезды, свободные места, актуальную стоимость и условия организатора на ваши даты.</span></div>
      <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
    </div>
  </div></section>`;
}

function seasonalConversionBlocks(page) {
  if (page.path !== '/blog/kogda-ehat/') return '';
  return `<section class="section section-tight jeep-lead seasonal-lead"><div class="shell">
    <p>Эта страница помогает выбрать сезон без ложной точности: сначала цель поездки, потом месяц, затем реальные программы с датами, нагрузкой, транспортом и понятным запасным сценарием.</p>
  </div></section>
  <section class="section section-tight jeep-quiz-section seasonal-quiz-section"><div class="shell">
    <div class="jeep-quiz seasonal-quiz">
      <div class="jeep-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какой ритм поездки вам ближе?</h2>
        <p>Выберите главный сценарий, а не абстрактный лучший месяц. Так проще понять, какие даты и туры стоит сравнивать в первую очередь.</p>
      </div>
      <div class="jeep-quiz-panel">
        <div class="volcano-choice-list">
          <div class="checklist-panel volcano-choice-card">
            <h3>Хочу первую большую поездку</h3>
            <p>Смотрите июль, август и начало сентября, многодневные туры с вулканами, океаном, источниками и резервом на погоду.</p>
            <a class="button button-primary" href="/tury/">Сравнить туры</a>
          </div>
          <div class="checklist-panel volcano-choice-card">
            <h3>Хочу активный маршрут</h3>
            <p>Сравните треккинг, джип-туры и вулканические программы по нагрузке, дорогам, снаряжению и условиям разворота.</p>
            <a class="button button-light" href="/tury/trekking/">Открыть треккинг</a>
          </div>
          <div class="checklist-panel volcano-choice-card">
            <h3>Хочу снег и термальные источники</h3>
            <p>Выбирайте зимние программы с тёплой базой, понятным транспортом и запасным планом при пурге или закрытой дороге.</p>
            <a class="button button-light" href="/tury/zima/">Смотреть зимние туры</a>
          </div>
        </div>
      </div>
    </div>
  </div></section>
  ${seasonalTourTable(page)}
  <section class="section section-tight jeep-proof seasonal-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Лучший сезон на Камчатке зависит от маршрута, а не от календарной легенды</h2><p>Проверяйте дорогу, снег, море, длительность переездов, запасной день и правила переноса. Один и тот же месяц может быть удачным для океана и сложным для дальнего треккинга.</p><a class="button button-light" href="#compare-seasonal-tours">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/seasons-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Лето не отменяет запас</h3><p>В тёплый сезон больше маршрутов, но туман, дождь, ветер и закрытая грунтовка всё равно могут переставить программу.</p></article>
    <article class="proof-card"><img src="/images/winter-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Зима требует другого плана</h3><p>Снежная Камчатка сильна термальными источниками, базой и короткими выездами, если организатор честно описывает транспорт и ограничения.</p></article>
  </div></section>`;
}

function seasonalStickyCta(page) {
  if (page.path !== '/blog/kogda-ehat/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке"><a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a></div>`;
}

function attractionsTours() {
  const candidates = [
    ...(youtravelTours.byPage?.['/tury/dzhip-tury/one-day'] || []),
    ...(youtravelTours.byPage?.['/ekskursii/vulkany/'] || []),
    ...(youtravelTours.byPage?.['/tury/'] || []),
    ...(youtravelTours.tours || []).filter((tour) => /локац|вулкан|океан|камчатк|источник|бухт|пляж|гейзер/i.test([tour.title, ...(tour.types || [])].join(' ')))
  ];
  const seen = new Set();
  return candidates.filter((tour) => {
    if (!tour?.id || seen.has(tour.id)) return false;
    seen.add(tour.id);
    return true;
  }).slice(0, 8);
}

function attractionsTourTable(page) {
  const tours = attractionsTours();
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare attractions-compare" id="compare-attraction-routes"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Маршруты к местам</p><h2>Программы, где удобно смотреть достопримечательности Камчатки</h2></div><p>В таблице собраны варианты для первого знакомства: однодневные выезды, вулканические маршруты и многодневные туры. Сравнивайте длительность, нагрузку, цену, группу и условия замены у организатора.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Что в центре</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${tour.activity ? `нагрузка ${esc(tour.activity)} из 5` : esc((tour.types || []).slice(0, 3).join(', ') || 'обзорный маршрут')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>У организаторов могут быть свежие даты и другие маршруты.</strong><span>Откройте подборку, чтобы проверить актуальные места, сезонные ограничения, транспорт и запасной сценарий перед оплатой.</span></div>
      <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
    </div>
  </div></section>`;
}

function attractionsConversionBlocks(page) {
  if (page.path !== '/blog/dostoprimechatelnosti/') return '';
  return `<section class="section section-tight jeep-lead attractions-lead"><div class="shell">
    <p>Эта страница помогает не просто перечислить красивые места Камчатки, а выбрать маршрут под время, сезон и уровень самостоятельности. Сначала определите главный сценарий, затем сравните реальные программы и проверьте условия у организатора.</p>
  </div></section>
  <section class="section section-tight jeep-quiz-section attractions-quiz-section"><div class="shell">
    <div class="jeep-quiz attractions-quiz">
      <div class="jeep-quiz-copy attractions-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Что вы хотите увидеть в центре поездки?</h2>
        <p>Выберите главный мотив, а не самый длинный список точек. Так проще понять, нужен ли вам один выезд, экскурсия на вулкан или полноценный тур.</p>
      </div>
      <div class="jeep-quiz-panel">
        <div class="volcano-choice-list">
          <div class="checklist-panel volcano-choice-card">
            <h3>Город, океан и первый день</h3>
            <p>Начните с Петропавловска-Камчатского, Авачинской бухты, Халактырского пляжа и коротких выездов без сложной логистики.</p>
            <a class="button button-primary" href="/ekskursii/odnodnevnye/">Смотреть однодневные экскурсии</a>
          </div>
          <div class="checklist-panel volcano-choice-card">
            <h3>Вулканы, перевалы и лавовый рельеф</h3>
            <p>Сравните маршруты по дороге, пешей части, нагрузке и запасному плану при тумане, ветре или закрытой грунтовке.</p>
            <a class="button button-light" href="/ekskursii/vulkany/">Открыть экскурсии на вулканы</a>
          </div>
          <div class="checklist-panel volcano-choice-card">
            <h3>Много мест за одну поездку</h3>
            <p>Берите многодневный формат, если хотите соединить вулканы, океан, источники и резервные дни без ручной сборки трансферов.</p>
            <a class="button button-light" href="/tury/">Сравнить туры</a>
          </div>
        </div>
      </div>
    </div>
  </div></section>
  ${attractionsTourTable(page)}
  <section class="section section-tight jeep-proof attractions-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Главные достопримечательности Камчатки требуют запаса, а не гонки</h2><p>Проверяйте дорогу, погоду, длительность переездов, пешую часть и замену маршрута. На Камчатке сильнее работает гибкий план, чем плотный чек-лист.</p><a class="button button-light" href="#compare-attraction-routes">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/cape-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Первый день лучше держать мягким</h3><p>После перелёта удобнее смотреть город, бухту и океан рядом с базой, а дальние выезды ставить после адаптации.</p></article>
    <article class="proof-card"><img src="/images/volcano-crater-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Вулканы зависят от дороги</h3><p>Название локации не говорит о сложности. Важны состояние грунтовки, погода, набор высоты и решение организатора по безопасности.</p></article>
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

function familyConversionBlocks(page) {
  if (page.path !== '/tury/s-detmi/') return '';
  return `<section class="section section-tight jeep-lead family-lead"><div class="shell">
    <p>Туры на Камчатку с детьми стоит выбирать по самому сложному дню маршрута: сколько часов в машине, где можно согреться, что будет при усталости ребёнка и как организатор заменяет погодозависимые активности. Сначала выберите семейный ритм, затем сравните реальные программы и условия.</p>
  </div></section>
  ${familyQuizBlock(page)}
  ${familyTourTable(page)}
  <section class="section section-tight jeep-proof family-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Хороший семейный тур честно оставляет место для паузы</h2><p>Сильная программа объясняет минимальный возраст, самый длинный переезд, питание, детское кресло, связь, аптечку и запасной сценарий при плохой погоде.</p><a class="button button-light" href="#compare-family-tours">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/family-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Темп важнее списка мест</h3><p>С ребёнком лучше увидеть меньше, но спокойно: вернуться засветло, высушить одежду, нормально поесть и оставить силы на следующий день.</p></article>
    <article class="proof-card"><img src="/images/lodge-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>База влияет на всю поездку</h3><p>Тёплое размещение, питание, бассейн, сушилка и короткий трансфер иногда важнее, чем ещё одна точка в программе.</p></article>
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

function excursionsHubQuizBlock(page) {
  if (page.path !== '/ekskursii/') return '';
  return `<section class="section section-tight jeep-quiz-section excursions-hub-quiz-section" id="excursions-quiz"><div class="shell">
    <div class="jeep-quiz excursions-hub-quiz" data-excursions-quiz>
      <div class="jeep-quiz-copy excursions-hub-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какая экскурсия по Камчатке вам ближе?</h2>
        <p>Ответьте на два вопроса перед сравнением программ: что хочется увидеть в центре дня и какой темп будет комфортен вашей группе.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset>
          <legend>1. Что вы хотите видеть в центре?</legend>
          <label><input type="radio" name="excursions-focus" value="volcano" checked> Вулканический район, перевал, лавовые поля или горячие источники</label>
          <label><input type="radio" name="excursions-focus" value="ocean"> Океан, бухты, морская прогулка или чёрный пляж</label>
          <label><input type="radio" name="excursions-focus" value="air"> Вертолётный маршрут или удалённая природная локация</label>
        </fieldset>
        <fieldset>
          <legend>2. Какой ритм дня вам ближе?</legend>
          <label><input type="radio" name="excursions-style" value="easy" checked> Спокойный день с понятным возвращением вечером</label>
          <label><input type="radio" name="excursions-style" value="active"> Активный маршрут с пешей частью и ранним стартом</label>
          <label><input type="radio" name="excursions-style" value="private"> Индивидуальный темп для семьи или небольшой компании</label>
        </fieldset>
        <div class="jeep-quiz-result" data-excursions-quiz-result>
          <strong>Смотрите наземные экскурсии к вулканам и источникам.</strong>
          <span>Начните с программ, где понятны дорога, пешая часть, запасной маршрут и время возвращения.</span>
        </div>
        <div class="jeep-quiz-actions">
          <a class="button button-primary" ${partnerAttrsFor(page)}>Подобрать экскурсии по датам ↗</a>
        </div>
      </div>
    </div>
  </div></section>`;
}

function excursionsHubTable(page) {
  if (page.path !== '/ekskursii/') return '';
  const tours = youtravelTours.byPage?.[page.path] || [];
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare excursions-hub-compare" id="compare-kamchatka-excursions"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Реальные предложения</p><h2>Экскурсии и короткие программы по Камчатке</h2></div><p>В таблице собраны реальные предложения партнёра, которые подходят для короткого выезда или экскурсионного формата. Сравнивайте длительность, транспорт, нагрузку, группу и погодные условия, а даты и места проверяйте на странице организатора.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Формат</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${esc((tour.types || []).slice(0, 3).join(', ') || 'экскурсия')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>Короткая таблица не заменяет свежую выдачу организаторов.</strong><span>У партнёра могут быть новые даты, индивидуальные экскурсии, морские выходы, вертолётные программы и места в группах, которые не попали в подборку.</span></div>
      <a class="button button-primary" ${partnerAttrsFor(page)}>Смотреть свежие предложения ↗</a>
    </div>
  </div></section>`;
}

function excursionsHubConversionBlocks(page) {
  if (page.path !== '/ekskursii/') return '';
  return `<section class="section section-tight jeep-lead excursions-hub-lead"><div class="shell">
    <p>Экскурсии по Камчатке лучше выбирать как набор сценариев, а не как список красивых названий: один день на вулканический район, один день у океана, один резерв под погоду или спокойную замену. Сначала определите главный фокус, затем проверьте реальную длительность, транспорт и условия у организатора.</p>
  </div></section>
  ${excursionsHubQuizBlock(page)}
  ${excursionsHubTable(page)}
  <section class="section section-tight jeep-proof excursions-hub-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Хорошая экскурсия честно считает дорогу, нагрузку и запасной план</h2><p>Ищите программу, где названы точка старта, тип транспорта, пешая часть, время возвращения и решение на случай тумана, ветра или закрытой дороги.</p><a class="button button-light" href="#compare-kamchatka-excursions">Сравнить программы</a></article>
    <article class="proof-card"><img src="/images/excursions-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Один день должен иметь фокус</h3><p>Лучше выбрать главную цель и оставить время на дорогу, чем собрать десять остановок и увидеть каждую слишком быстро.</p></article>
    <article class="proof-card"><img src="/images/helicopter-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Погода сильнее расписания</h3><p>Вертолёт, море и вулканические дороги требуют резерва. Спросите о переносе, замене и возврате до оплаты.</p></article>
  </div></section>`;
}

function excursionsHubStickyCta(page) {
  if (page.path !== '/ekskursii/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке">
    <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
  </div>`;
}


function helicopterToursFixed() {
  const terms = ['вертолет', 'вертолёт', 'долина гейзеров', 'гейзер'];
  return (youtravelTours.tours || [])
    .filter((tour) => {
      const haystack = `${tour.title || ''} ${(tour.types || []).join(' ')}`.toLowerCase();
      return terms.some((term) => haystack.includes(term));
    })
    .slice(0, 8);
}

function helicopterQuizBlockFixed(page) {
  if (page.path !== '/ekskursii/vertoletnye/') return '';
  return `<section class="section section-tight jeep-quiz-section helicopter-quiz-section" id="helicopter-quiz"><div class="shell">
    <div class="jeep-quiz helicopter-quiz" data-helicopter-quiz-fixed>
      <div class="jeep-quiz-copy helicopter-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какой вертолётный сценарий вам ближе?</h2>
        <p>Отметьте главную цель и запас по времени. Это поможет сравнить не только цену, но и риск переноса, длительность на месте и наземную альтернативу.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset><legend>Что вы хотите видеть в центре?</legend><label><input type="radio" name="helicopter-focus-fixed" value="geysers" checked> Долину гейзеров или термальные поля</label><label><input type="radio" name="helicopter-focus-fixed" value="lake"> Курильское озеро или удалённую природную локацию</label><label><input type="radio" name="helicopter-focus-fixed" value="volcano"> Вулканы с воздуха и посадки в вулканических районах</label></fieldset>
        <fieldset><legend>Какой запас по датам у вас есть?</legend><label><input type="radio" name="helicopter-reserve-fixed" value="reserve" checked> Есть резервный день под перенос</label><label><input type="radio" name="helicopter-reserve-fixed" value="tight"> График плотный, нужен понятный план замены</label><label><input type="radio" name="helicopter-reserve-fixed" value="combo"> Хочу встроить вылет в большой тур</label></fieldset>
        <div class="jeep-quiz-result" data-helicopter-quiz-result-fixed><strong>Смотрите программы в Долину гейзеров с резервом по погоде.</strong><span>Начните с условий переноса, веса, регистрации и времени на самой локации. Даты и места проверяйте у организатора перед оплатой.</span></div>
        <div class="jeep-quiz-actions"><a class="button button-primary" ${partnerAttrsFor(page)}>Проверить свежие предложения и места ↗</a></div>
      </div>
    </div>
  </div></section>`;
}

function helicopterTourTableFixed(page) {
  if (page.path !== '/ekskursii/vertoletnye/') return '';
  const tours = helicopterToursFixed();
  if (!tours.length) return `<section class="section section-tight tour-compare helicopter-compare" id="compare-helicopter-tours"><div class="shell"><div class="section-head"><div><p class="eyebrow">Свежие предложения</p><h2>Вертолётные программы нужно проверять у организатора</h2></div><p>Для вертолётных экскурсий важно смотреть актуальные даты, свободные места, условия переноса и возврата прямо у организатора. Если подходящих программ сейчас мало, откройте свежие предложения и сравните детали перед оплатой.</p></div><div class="table-partner-cta"><div><strong>Не обещаем вылеты и цены заранее.</strong><span>Для вертолётных маршрутов особенно важны актуальные условия: авиационное окно, регистрация, вес, возврат и наземная замена.</span></div><a class="button button-primary" ${partnerAttrsFor(page)}>Смотреть свежие предложения ↗</a></div></div></section>`;
  return `<section class="section section-tight tour-compare helicopter-compare" id="compare-helicopter-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Реальные предложения</p><h2>Вертолётные программы и маршруты к гейзерам</h2></div><p>В таблице собраны предложения, которые помогают сравнить вертолётный и гейзерный формат поездки. Финальную стоимость, вылет, свободные места и условия переноса проверяйте на странице организатора.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Формат</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr><td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td><td class="tour-format">${esc((tour.types || []).slice(0, 3).join(', ') || 'вертолётный/гейзерный маршрут')}</td><td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td><td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td><td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить места ↗</a></td></tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta"><div><strong>Вертолётные условия меняются быстрее обычных экскурсий.</strong><span>У организаторов могут быть новые даты, другие борта, лист ожидания, наземные замены и правила возврата, которых нет в короткой таблице.</span></div><a class="button button-primary" ${partnerAttrsFor(page)}>Смотреть свежие предложения ↗</a></div>
  </div></section>`;
}

function helicopterConversionBlocksFixed(page) {
  if (page.path !== '/ekskursii/vertoletnye/') return '';
  return `<section class="section section-tight jeep-lead helicopter-lead"><div class="shell"><p>Вертолётные экскурсии на Камчатке лучше выбирать от обратного: сначала понять, какую удалённую локацию вы хотите увидеть, затем проверить резерв по датам, правила отмены и реальное время на месте. Для Долины гейзеров, Курильского озера и вулканических облётов важны не обещания, а прозрачный порядок действий при тумане, ветре и закрытии площадки.</p></div></section>${helicopterQuizBlockFixed(page)}${helicopterTourTableFixed(page)}<section class="section section-tight jeep-proof helicopter-proof"><div class="shell proof-grid"><article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Сильная вертолётная программа заранее объясняет, что будет при отмене</h2><p>Проверяйте не только маршрут, но и регистрацию, ограничения по весу, резервный день, правила возврата, наземную замену и то, кто принимает финальное решение о вылете.</p><a class="button button-light" href="#compare-helicopter-tours">Сравнить условия</a></article><article class="proof-card"><img src="/images/helicopter-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Погода важнее расписания</h3><p>Ясное утро в городе не гарантирует видимость на маршруте. Держите запас по датам и не ставьте вылет перед обратным рейсом домой.</p></article><article class="proof-card"><img src="/images/volcano-crater-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Наземная замена должна быть заранее</h3><p>Если авиационное окно не открылось, полезно иметь понятный план: вулканический район, Дачные источники, побережье или термальные локации.</p></article></div></section>`;
}

function helicopterStickyCtaFixed(page) {
  if (page.path !== '/ekskursii/vertoletnye/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке"><a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a></div>`;
}


function budgetTours() {
  const candidates = [
    ...(youtravelTours.byPage?.['/tury/'] || []),
    ...(youtravelTours.byPage?.['/tury/vse-vklyucheno/'] || []),
    ...(youtravelTours.byPage?.['/ekskursii/odnodnevnye/'] || []),
    ...(youtravelTours.byPage?.['/tury/dzhip-tury/'] || []),
    ...(youtravelTours.byPage?.['/tury/vip/'] || []),
    ...(youtravelTours.byPage?.['/tury/gastro/'] || [])
  ];
  const seen = new Set();
  return candidates.filter((tour) => {
    if (!tour?.id || seen.has(tour.id)) return false;
    seen.add(tour.id);
    return true;
  }).sort((a, b) => (a.price || 999999999) - (b.price || 999999999) || (a.durationDays || 99) - (b.durationDays || 99)).slice(0, 8);
}

function budgetTourTable(page) {
  const tours = budgetTours();
  if (!tours.length) return '';
  return `<section class="section section-tight tour-compare budget-compare" id="compare-budget-tours"><div class="shell">
    <div class="section-head"><div><p class="eyebrow">Проверить стоимость</p><h2>Программы, по которым удобно считать бюджет поездки</h2></div><p>В таблице собраны разные форматы: обзорные туры, активные маршруты и короткие выезды. Сравнивайте цену с длительностью, включёнными услугами, размером группы и условиями переноса, а финальную стоимость проверяйте у организатора.</p></div>
    <div class="compare-table-wrap"><table class="tour-compare-table"><thead><tr><th>Программа</th><th>Формат</th><th>Ориентир цены</th><th>Группа</th><th></th></tr></thead><tbody>${tours.map((tour) => `<tr>
      <td class="tour-name"><strong>${esc(tour.title)}</strong><small>${esc(durationLabel(tour))}${tour.expert ? ` · организатор: ${esc(tour.expert)}` : ''}</small>${tourInsightDetails(tour)}</td>
      <td class="tour-format">${esc((tour.types || []).slice(0, 3).join(', ') || 'тур по Камчатке')}</td>
      <td class="tour-price">${tour.price ? `от ${formatRub(tour.price)}` : 'уточнить'}</td>
      <td class="tour-group">${tour.groupSize ? `до ${esc(tour.groupSize)} чел.` : 'уточнить'}</td>
      <td class="tour-action"><a class="button button-compact" href="${tour.url.replaceAll('&', '&amp;')}" target="_blank" rel="nofollow noopener">Проверить стоимость ↗</a></td>
    </tr>`).join('')}</tbody></table></div>
    <div class="table-partner-cta">
      <div><strong>Цены и места быстро меняются под даты.</strong><span>Откройте свежие предложения, чтобы проверить актуальную стоимость, включённые услуги, правила переноса и доплаты перед бронированием.</span></div>
      <a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a>
    </div>
  </div></section>`;
}

function budgetConversionBlocks(page) {
  if (page.path !== '/blog/skolko-stoit-poezdka/') return '';
  return `<section class="section section-tight jeep-lead budget-lead"><div class="shell"><p>Страница помогает быстро разложить бюджет поездки на Камчатку по сценариям: самостоятельная база, однодневные экскурсии, многодневный тур, всё включено, серф-лагерь или волонтёрский формат. Главная задача — не угадать единственную цену, а понять, какие расходы обязательно проверить до оплаты.</p></div></section>
  <section class="section section-tight jeep-quiz-section budget-quiz-section"><div class="shell">
    <div class="jeep-quiz budget-quiz" data-budget-quiz>
      <div class="jeep-quiz-copy budget-quiz-copy">
        <p class="eyebrow">Быстрый выбор</p>
        <h2>Какой бюджетный сценарий вам ближе?</h2>
        <p>Ответьте по темпу и степени самостоятельности. Подсказка не бронирует поездку, но помогает понять, какие программы и доплаты смотреть первыми.</p>
      </div>
      <div class="jeep-quiz-panel">
        <fieldset><legend>Какой формат поездки вам ближе?</legend><label><input type="radio" name="budget-format" value="independent" checked> Собрать базу самостоятельно и взять 1-2 выезда</label><label><input type="radio" name="budget-format" value="tour"> Взять многодневный тур с готовой логистикой</label><label><input type="radio" name="budget-format" value="camp"> Рассмотреть серф-лагерь, волонтёрство или длительную базу</label></fieldset>
        <fieldset><legend>Где вы готовы экономить?</legend><label><input type="radio" name="budget-save" value="comfort" checked> На комфорте проживания, но не на безопасности маршрута</label><label><input type="radio" name="budget-save" value="count"> На количестве дальних выездов</label><label><input type="radio" name="budget-save" value="dates"> На датах и гибкости расписания</label></fieldset>
        <div class="jeep-quiz-result" data-budget-quiz-result><strong>Сравните самостоятельную базу с однодневными выездами.</strong><span>Проверьте трансферы, питание, снаряжение и запасной день: именно они часто меняют итоговую стоимость.</span></div>
        <div class="jeep-quiz-actions"><a class="button button-primary" ${topToursPartnerAttrs}>Проверить свежую стоимость ↗</a><a class="button button-light" href="#compare-budget-tours">Сравнить программы</a></div>
      </div>
    </div>
  </div></section>
  ${budgetTourTable(page)}
  <section class="section section-tight jeep-proof budget-proof"><div class="shell proof-grid">
    <article class="proof-card proof-card-dark"><p class="eyebrow">Как выбрать</p><h2>Дешёвый план на Камчатке должен выдерживать погоду, дорогу и переносы</h2><p>Считайте не только цену тура, но и ночи до старта, трансферы, питание, одежду, запасной день и правила возврата. Экономия работает, когда у маршрута есть понятный резерв.</p><a class="button button-light" href="#compare-budget-tours">Проверить программы</a></article>
    <article class="proof-card"><img src="/images/budget-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Перелёт не весь бюджет</h3><p>После билетов остаются трансферы, жильё до старта, питание, экипировка и выезды. Сравнивайте итог поездки, а не одну строку расходов.</p></article>
    <article class="proof-card"><img src="/images/seasons-kamchatka.jpg" alt="" loading="lazy" width="768" height="512"><h3>Сезон меняет доступность</h3><p>Низкая цена бесполезна, если нужные дороги, вулканы или океанские выходы не подходят под даты. Сначала сценарий, потом календарь.</p></article>
  </div></section>`;
}

function budgetStickyCta(page) {
  if (page.path !== '/blog/skolko-stoit-poezdka/') return '';
  return `<div class="mobile-sticky-cta mobile-sticky-cta-single" aria-label="Топовые туры по Камчатке"><a class="button button-primary" ${topToursPartnerAttrs}>Смотреть топовые туры ↗</a></div>`;
}


function conversionBlocks(page) {
  return `${budgetConversionBlocks(page)}${toursHubConversionBlocks(page)}${excursionsHubConversionBlocks(page)}${helicopterConversionBlocksFixed(page)}${jeepConversionBlocks(page)}${trekkingConversionBlocks(page)}${volcanoConversionBlocks(page)}${volcanoBlogConversionBlocks(page)}${whalesConversionBlocks(page)}${seasonalConversionBlocks(page)}${attractionsConversionBlocks(page)}${oneDayExcursionConversionBlocks(page)}${vipConversionBlocks(page)}${fishingConversionBlocks(page)}${familyConversionBlocks(page)}${allInclusiveConversionBlocks(page)}${gastroConversionBlocks(page)}${winterConversionBlocks(page)}`;
}

function stickyCta(page) {
  return `${budgetStickyCta(page)}${toursHubStickyCta(page)}${excursionsHubStickyCta(page)}${helicopterStickyCtaFixed(page)}${jeepStickyCta(page)}${trekkingStickyCta(page)}${volcanoStickyCta(page)}${volcanoBlogStickyCta(page)}${whalesStickyCta(page)}${seasonalStickyCta(page)}${attractionsStickyCta(page)}${oneDayExcursionStickyCta(page)}${vipStickyCta(page)}${fishingStickyCta(page)}${familyStickyCta(page)}${allInclusiveStickyCta(page)}${gastroStickyCta(page)}${winterStickyCta(page)}`;
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
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${absolute(path)}</loc><lastmod>2026-07-11</lastmod></url>`).join('')}</urlset>`, 'utf8');
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`, 'utf8');
writeFileSync(join(dist, '404.html'), `${head({ title: 'Страница не найдена', description: 'Страница не найдена.', path: '/404/' })}${header('/404/')}<main id="content"><section class="page-hero" style="--page-hero-image: url('/images/field-guide-kamchatka.jpg')"><div class="shell"><p class="eyebrow">Ошибка 404</p><h1>Маршрут потерялся в тумане</h1><p class="page-lead">Вернитесь на главную или продолжите подготовку к поездке.</p><p><a class="button button-primary" href="/">На главную</a></p></div></section></main>${footer()}${assetScripts()}</body></html>`, 'utf8');
console.log(`Built ${urls.length} pages in ${dist}`);
