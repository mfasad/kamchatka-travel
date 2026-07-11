import { Buffer } from 'node:buffer';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API_URL = 'https://youtravel.me/api/v2/serp/tours';
const PARTNER_API_URL = 'https://youtravel.me/api/v2/partners/tours';
const PARTNER_BASE_URL = 'https://travelme.g2afse.com/click?pid=1177&offer_id=1';
const OUT_FILE = join(process.cwd(), 'src', 'youtravel-tours.generated.mjs');

const authLogin = process.env.YTME_API_LOGIN;
const authPassword = process.env.YTME_API_PASSWORD;
const authHeader = authLogin && authPassword
  ? `Basic ${Buffer.from(`${authLogin}:${authPassword}`).toString('base64')}`
  : null;

const html = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[char]);

const params = new URLSearchParams({
  take: '1000',
  lang: 'ru',
  currency: 'rub',
  sort_by: 'rank',
  sort_dir: 'desc'
});

const oneDayJeepParams = new URLSearchParams({
  take: '300',
  lang: 'ru',
  currency: 'rub',
  sort_by: 'rank',
  sort_dir: 'desc',
  is_period_strict: '1',
  'duration[to]': '1',
  'types[0]': '450',
  'languages[0]': '1151'
});

function toDate(timestamp) {
  if (!timestamp) return null;
  return new Date(Number(timestamp) * 1000).toISOString().slice(0, 10);
}

function durationDays(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return null;
  const start = new Date(`${dateFrom}T00:00:00Z`);
  const end = new Date(`${dateTo}T00:00:00Z`);
  const diff = Math.round((end - start) / 86400000) + 1;
  return Number.isFinite(diff) && diff > 0 ? diff : null;
}

async function getJson(url, { auth = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (auth && authHeader) headers.Authorization = authHeader;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`YouTravel API responded ${response.status}: ${await response.text()}`);
  return response.json();
}

function normalizeTour(tour) {
  const date = tour.dates?.group_min_price || tour.dates?.group || null;
  const dateFrom = toDate(date?.date_from);
  const dateTo = toDate(date?.date_to);
  const partnerUrl = tour.link ? `${PARTNER_BASE_URL}&path=${encodeURI(tour.link)}` : PARTNER_BASE_URL;
  return {
    id: Number(tour.id),
    title: html(tour.title),
    url: partnerUrl,
    regions: tour.regions || [],
    types: (tour.types || []).map((item) => item.title).filter(Boolean),
    accommodation: (tour.types_allocation || []).map((item) => item.title).filter(Boolean),
    expert: tour.expert?.name || '',
    rating: tour.expert?.rating ? Number(tour.expert.rating) : null,
    reviews: tour.expert?.count_reviews ? Number(tour.expert.count_reviews) : null,
    price: date?.actual_price || date?.price || null,
    dateFrom,
    dateTo,
    durationDays: durationDays(dateFrom, dateTo),
    freeSpaces: date?.free_spaces ?? null,
    groupSize: date?.group_size ?? null,
    totalDates: tour.dates?.total || 0,
    activity: tour.activity || null,
    comfort: tour.comfort || null,
    isPrivate: Boolean(tour.is_private),
    isExclusive: Boolean(tour.is_exclusive),
    details: null
  };
}

function isKamchatka(tour) {
  const haystack = [
    tour.title,
    ...(tour.regions || []),
    ...(tour.locations || [])
  ].join(' ');
  return /камчат|kamchat/i.test(haystack);
}

function byPage(tours) {
  const has = (tour, pattern) => pattern.test([tour.title, ...tour.types].join(' '));
  const jeepTours = tours.filter((tour) => has(tour, /джип|авто|внедорож|offroad|off-road/i));
  const shortKamchatkaJeepTours = tours.filter((tour) => (tour.durationDays || 99) <= 3 && has(tour, /джип|авто|внедорож|offroad|off-road/i));
  const excursionTours = tours
    .filter((tour) => (tour.durationDays || 99) <= 3 || has(tour, /экскурс|вулкан|гейзер|морская прогулка|бухт|источник|каньон|вертолет|вертолёт/i))
    .sort((a, b) => Number((a.durationDays || 99) > 3) - Number((b.durationDays || 99) > 3));
  const fishingTours = tours
    .filter((tour) => has(tour, /рыбал|лосос|нахлыст|морская прогулка|на море/i))
    .sort((a, b) => Number(!has(a, /рыбал|лосос|нахлыст/i)) - Number(!has(b, /рыбал|лосос|нахлыст/i)));
  const winterTours = tours
    .filter((tour) => has(tour, /зим|снего|фрирайд|горнолыж|лавин|морозн|декабр|январ|феврал|март|апрел|snow|winter|freeride/i))
    .slice(0, 8);
  return {
    '/tury/': tours.slice(0, 6),
    '/tury/vip/': tours.filter((tour) => tour.isPrivate || tour.isExclusive || has(tour, /vip|вип|индивидуаль|премиум/i)).slice(0, 6),
    '/tury/trekking/': tours.filter((tour) => has(tour, /трек|поход|восхожд|актив|пеш/i)).slice(0, 6),
    '/tury/dzhip-tury/': jeepTours.filter((tour) => (tour.durationDays || 99) > 3).slice(0, 12),
    '/tury/dzhip-tury/one-day': shortKamchatkaJeepTours.slice(0, 8),
    '/tury/rybalka/': fishingTours.slice(0, 9),
    '/tury/zima/': winterTours,
    '/ekskursii/': excursionTours.slice(0, 8),
    '/ekskursii/vulkany/': tours.filter((tour) => has(tour, /вулкан|мутнов|горел|толбач|авачин/i)).slice(0, 6)
  };
}

async function enrichWithPartnerDetails(tours) {
  if (!authHeader) return tours;
  const targetIds = new Set(Object.values(byPage(tours)).flat().map((tour) => tour.id));
  const output = [];
  for (const tour of tours) {
    if (!targetIds.has(tour.id)) {
      output.push(tour);
      continue;
    }
    try {
      const detail = await getJson(`${PARTNER_API_URL}/${tour.id}?currency=RUB&lang=ru`, { auth: true });
      const source = detail?.data?.tour || {};
      output.push({
        ...tour,
        details: {
          days: Array.isArray(source.days) ? source.days.length : null,
          includedCount: Array.isArray(source.included) ? source.included.length : null,
          notIncludedCount: Array.isArray(source.not_included) ? source.not_included.length : null,
          ageFrom: source.age_from ?? null,
          flightIncluded: source.flight_included ?? null,
          activityTitle: source.activity_data?.title || '',
          comfortTitle: source.comfort_data?.title || ''
        }
      });
    } catch (error) {
      console.warn(`Skipped partner details for tour ${tour.id}: ${error.message}`);
      output.push(tour);
    }
  }
  return output;
}

const payload = await getJson(`${API_URL}?${params}`);
const oneDayPayload = await getJson(`${API_URL}?${oneDayJeepParams}`);
const sourceItems = payload?.data?.items || [];
const oneDaySourceItems = oneDayPayload?.data?.items || [];
const combinedSourceItems = Array.from(
  new Map([...sourceItems, ...oneDaySourceItems].map((tour) => [Number(tour.id), tour])).values()
);
const tours = await enrichWithPartnerDetails(sourceItems
  .concat(oneDaySourceItems)
  .filter(isKamchatka)
  .map(normalizeTour)
  .filter((tour, index, array) => array.findIndex((item) => item.id === tour.id) === index)
  .filter((tour) => tour.id && tour.title && tour.url));

const generated = {
  fetchedAt: new Date().toISOString(),
  sourceTotal: payload?.data?.total || null,
  oneDaySourceTotal: oneDayPayload?.data?.total || null,
  sourceFetched: combinedSourceItems.length,
  baseSourceFetched: sourceItems.length,
  oneDaySourceFetched: oneDaySourceItems.length,
  kamchatkaCount: tours.length,
  usedPartnerAuth: Boolean(authHeader),
  tours,
  byPage: byPage(tours)
};

writeFileSync(OUT_FILE, `// Generated by tools/fetch-youtravel-tours.mjs. Do not edit manually.\nexport const youtravelTours = ${JSON.stringify(generated, null, 2)};\n`, 'utf8');

console.log(`Saved ${tours.length} Kamchatka tours to ${OUT_FILE}${authHeader ? ' with partner details' : ''}`);
