const menuButton = document.querySelector('[data-menu-button]');
const menu = document.querySelector('[data-menu]');

if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-reveal]').forEach((node) => observer.observe(node));

document.querySelectorAll('[data-jeep-quiz]').forEach((quiz) => {
  const result = quiz.querySelector('[data-jeep-quiz-result]');
  const resultTitle = result?.querySelector('strong');
  const resultText = result?.querySelector('span');
  const tabs = quiz.querySelectorAll('[data-jeep-tab]');
  const panes = quiz.querySelectorAll('[data-jeep-pane]');
  if (!result || !resultTitle || !resultText || !tabs.length || !panes.length) return;

  const updateQuiz = () => {
    const activeTab = quiz.querySelector('[data-jeep-tab].is-active')?.dataset.jeepTab || 'one-day';
    const oneFocus = quiz.querySelector('input[name="jeep-one-focus"]:checked')?.value || 'volcano';
    const oneStyle = quiz.querySelector('input[name="jeep-one-style"]:checked')?.value || 'active';
    const multiDuration = quiz.querySelector('input[name="jeep-multi-duration"]:checked')?.value || 'week';
    const multiFocus = quiz.querySelector('input[name="jeep-multi-focus"]:checked')?.value || 'volcano';

    let title = 'Смотрите однодневные джип-туры.';
    let text = 'Подойдут, если хочется добавить к поездке один сильный выезд без смены гостиницы: вулкан, перевал, океан, каньон или источники.';

    if (activeTab === 'multi-day') {
      title = multiDuration === 'long' ? 'Смотрите расширенные многодневные маршруты.' : 'Смотрите многодневные джип-туры.';
      text = 'Это формат для большой поездки по Камчатке: несколько дней в маршруте, проживание, переезды, главные локации и запасной план на погоду.';
      if (multiFocus === 'max') text = `${text} Если хочется максимум мест, особенно внимательно сравните темп программы и время на самих локациях.`;
      if (multiFocus === 'family' || multiDuration === 'comfort') text = `${text} Для поездки с ребёнком или спокойного темпа смотрите размер группы, проживание и длительность переездов.`;
    } else {
      if (oneFocus === 'ocean') text = 'Подойдут короткие выезды к океану, бухтам и видовым дорогам — хороший формат без сложной логистики.';
      if (oneFocus === 'springs') text = 'Смотрите спокойные однодневные маршруты к источникам, каньонам и локациям без перегруженного темпа.';
      if (oneStyle === 'comfort') text = `${text} Для поездки с ребёнком особенно важны понятный тайминг, посадка в машине и короткие пешие участки.`;
      if (oneStyle === 'private') text = `${text} Для небольшой компании лучше смотреть варианты с гибким темпом и понятными условиями у организатора.`;
    }

    resultTitle.textContent = title;
    resultText.textContent = text;
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });
      panes.forEach((pane) => {
        const isActive = pane.dataset.jeepPane === tab.dataset.jeepTab;
        pane.classList.toggle('is-active', isActive);
        pane.hidden = !isActive;
      });
      updateQuiz();
    });
  });

  quiz.addEventListener('change', updateQuiz);
  updateQuiz();
});

document.querySelectorAll('[data-trekking-quiz]').forEach((quiz) => {
  const result = quiz.querySelector('[data-trekking-quiz-result]');
  const resultTitle = result?.querySelector('strong');
  const resultText = result?.querySelector('span');
  if (!result || !resultTitle || !resultText) return;

  const updateQuiz = () => {
    const format = quiz.querySelector('input[name="trekking-format"]:checked')?.value || 'light';
    const check = quiz.querySelector('input[name="trekking-check"]:checked')?.value || 'load';

    let title = 'Смотрите походы без тяжёлого рюкзака.';
    let text = 'Начните с программ, где ходовые дни чередуются с базой, а требования к участникам описаны по дням.';

    if (format === 'active') {
      title = 'Смотрите активные треккинговые туры.';
      text = 'Подойдут маршруты с несколькими ходовыми днями, вулканическими районами и понятным запасом на погоду.';
    }

    if (format === 'camp') {
      title = 'Смотрите автономные походные программы.';
      text = 'Особенно внимательно проверьте вес личного и группового снаряжения, ночёвки, связь и точки эвакуации.';
    }

    if (check === 'comfort') text = `${text} Сравните размещение, питание, доступ к багажу и возможность пропустить отдельный выход.`;
    if (check === 'weather') text = `${text} Уточните запасные дни, варианты замены и кто принимает решение о развороте.`;

    resultTitle.textContent = title;
    resultText.textContent = text;
  };

  quiz.addEventListener('change', updateQuiz);
  updateQuiz();
});

document.querySelectorAll('[data-volcano-quiz]').forEach((quiz) => {
  const result = quiz.querySelector('[data-volcano-quiz-result]');
  const resultTitle = result?.querySelector('strong');
  const resultText = result?.querySelector('span');
  if (!result || !resultTitle || !resultText) return;

  const updateQuiz = () => {
    const format = quiz.querySelector('input[name="volcano-format"]:checked')?.value || 'overview';
    const check = quiz.querySelector('input[name="volcano-check"]:checked')?.value || 'weather';

    let title = 'Смотрите обзорные вулканические экскурсии.';
    let text = 'Начните с программ, где понятны дорога, пешая часть и замена маршрута при плохой видимости.';

    if (format === 'ascent') {
      title = 'Смотрите программы с восхождением.';
      text = 'Проверьте набор высоты, покрытие тропы, темп группы и условия разворота, если погода или самочувствие меняются.';
    }

    if (format === 'multi') {
      title = 'Смотрите многодневные туры на вулканы.';
      text = 'Подойдут программы с несколькими районами и резервом по дням, чтобы не ставить главный вулкан в единственное погодное окно.';
    }

    if (check === 'load') text = `${text} Сравните километры, набор высоты, длительность пешей части и возможность остаться у транспорта.`;
    if (check === 'gear') text = `${text} Уточните обувь, палки, питание, страховку, трансфер и платные опции до бронирования.`;

    resultTitle.textContent = title;
    resultText.textContent = text;
  };

  quiz.addEventListener('change', updateQuiz);
  updateQuiz();
});

document.querySelectorAll('[data-vip-quiz]').forEach((quiz) => {
  const result = quiz.querySelector('[data-vip-quiz-result]');
  const resultTitle = result?.querySelector('strong');
  const resultText = result?.querySelector('span');
  if (!result || !resultTitle || !resultText) return;

  const updateQuiz = () => {
    const company = quiz.querySelector('input[name="vip-company"]:checked')?.value || 'couple';
    const style = quiz.querySelector('input[name="vip-style"]:checked')?.value || 'private';
    const focus = quiz.querySelector('input[name="vip-focus"]:checked')?.value || 'volcano';

    let title = 'Вам ближе приватный VIP-маршрут.';
    let text = 'Откройте программы с небольшим составом, своим транспортом и гибкой логикой дней.';

    if (style === 'comfort' || company === 'family') {
      title = 'Вам ближе комфортный VIP-тур с мягким темпом.';
      text = 'Ищите программы с хорошей базой размещения, умеренной активностью и понятными переездами между выездами.';
    }

    if (style === 'max' || company === 'team') {
      title = 'Вам ближе насыщенный VIP-маршрут.';
      text = 'Смотрите программы, где за неделю собираются вулканы, океан, источники и несколько активных выездов без лишней паузы.';
    }

    if (focus === 'ocean') text = `${text} В подборке особенно смотрите морские и береговые сценарии, а также запасной план на случай ветра.`;
    if (focus === 'all') text = `${text} Лучший старт - обзорные программы, где не один главный выезд, а сбалансированный набор впечатлений.`;

    resultTitle.textContent = title;
    resultText.textContent = text;
  };

  quiz.addEventListener('change', updateQuiz);
  updateQuiz();
});
