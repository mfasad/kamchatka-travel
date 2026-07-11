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

const closeTourInsights = (except = null) => {
  document.querySelectorAll('[data-tour-insight]').forEach((insight) => {
    if (insight === except) return;
    const button = insight.querySelector('[data-tour-insight-toggle]');
    const panel = insight.querySelector('[data-tour-insight-panel]');
    if (!button || !panel) return;
    button.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
  });
};

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-tour-insight-toggle]');
  if (button) {
    const insight = button.closest('[data-tour-insight]');
    const panel = insight?.querySelector('[data-tour-insight-panel]');
    if (!insight || !panel) return;
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    closeTourInsights(insight);
    button.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
    return;
  }

  if (!event.target.closest('[data-tour-insight]')) closeTourInsights();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeTourInsights();
});

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

document.querySelectorAll('[data-oneday-quiz]').forEach((quiz) => {
  const result = quiz.querySelector('[data-oneday-quiz-result]');
  const resultTitle = result?.querySelector('strong');
  const resultText = result?.querySelector('span');
  if (!result || !resultTitle || !resultText) return;

  const updateQuiz = () => {
    const focus = quiz.querySelector('input[name="oneday-focus"]:checked')?.value || 'volcano';
    const check = quiz.querySelector('input[name="oneday-check"]:checked')?.value || 'timing';

    let title = 'Смотрите наземные однодневные экскурсии.';
    let text = 'Начните с программ, где понятны дорога, пешая часть, время возвращения и условия замены при непогоде.';

    if (focus === 'ocean') {
      title = 'Смотрите экскурсии к океану и смотровым.';
      text = 'Для такого дня важны точка старта, состояние дороги к побережью, ветер и время на самой локации, а не только количество остановок.';
    }

    if (focus === 'springs') {
      title = 'Смотрите спокойные однодневные маршруты.';
      text = 'Подойдут программы к источникам, каньонам и природным локациям без слишком длинной пешей части и позднего возвращения.';
    }

    if (check === 'load') text = `${text} Уточните километры пешком, набор высоты, обувь, питание и возможность остаться у транспорта.`;
    if (check === 'weather') text = `${text} Спросите, чем заменяют маршрут при тумане, ветре, закрытой дороге или плохой видимости.`;

    resultTitle.textContent = title;
    resultText.textContent = text;
  };

  quiz.addEventListener('change', updateQuiz);
  updateQuiz();
});

document.querySelectorAll('[data-fishing-quiz]').forEach((quiz) => {
  const result = quiz.querySelector('[data-fishing-quiz-result]');
  const resultTitle = result?.querySelector('strong');
  const resultText = result?.querySelector('span');
  if (!result || !resultTitle || !resultText) return;

  const updateQuiz = () => {
    const format = quiz.querySelector('input[name="fishing-format"]:checked')?.value || 'river';
    const style = quiz.querySelector('input[name="fishing-style"]:checked')?.value || 'easy';

    let title = 'Смотрите речные рыболовные программы.';
    let text = 'Начните с туров, где прямо описаны место ловли, снасти, лицензии и работа инструктора.';

    if (format === 'sea') {
      title = 'Смотрите морские выходы и программы у бухт.';
      text = 'Для такого дня особенно важны судно, точка старта, ветер, волна, питание на борту и правила переноса при шторме.';
    }

    if (format === 'combo') {
      title = 'Смотрите комбинированные туры с рыбалкой.';
      text = 'Этот формат удобен для первой поездки: рыбалка не остаётся единственным смыслом маршрута, если погода меняет планы.';
    }

    if (style === 'active') text = `${text} Вам ближе программы с ранним стартом, большим временем на воде и готовностью менять маршрут по условиям.`;
    if (style === 'comfort') text = `${text} Вам ближе туры, где важны база, питание, понятные трансферы и меньше самостоятельной подготовки.`;

    resultTitle.textContent = title;
    resultText.textContent = text;
  };

  quiz.addEventListener('change', updateQuiz);
  updateQuiz();
});

document.querySelectorAll('[data-family-quiz]').forEach((quiz) => {
  const result = quiz.querySelector('[data-family-quiz-result]');
  const resultTitle = result?.querySelector('strong');
  const resultText = result?.querySelector('span');
  if (!result || !resultTitle || !resultText) return;

  const updateQuiz = () => {
    const age = quiz.querySelector('input[name="family-age"]:checked')?.value || 'small';
    const style = quiz.querySelector('input[name="family-style"]:checked')?.value || 'base';

    let title = 'Смотрите мягкие семейные маршруты.';
    let text = 'Начните с программ, где понятны база, самый длинный переезд, питание, детское кресло и запасной день.';

    if (age === 'teen') {
      title = 'Смотрите активные семейные туры без перегруза.';
      text = 'Подросткам часто подходят вулканы, океан и треккинговые дни, но важно заранее сверить километры, подъёмы и время возвращения.';
    }

    if (age === 'mixed') {
      title = 'Смотрите гибкие маршруты для разного возраста.';
      text = 'Лучше выбирать программы, где часть семьи может пропустить сложный выезд, остаться на базе или заменить день на более спокойный.';
    }

    if (style === 'active') text = `${text} Сравните нагрузку самого длинного дня, внедорожные участки и возможность развернуться без конфликта с группой.`;
    if (style === 'comfort') text = `${text} Проверьте размещение, питание, сушку одежды, бассейн или источники и какие услуги действительно входят в цену.`;

    resultTitle.textContent = title;
    resultText.textContent = text;
  };

  quiz.addEventListener('change', updateQuiz);
  updateQuiz();
});

document.querySelectorAll('[data-excursions-quiz]').forEach((quiz) => {
  const result = quiz.querySelector('[data-excursions-quiz-result]');
  const resultTitle = result?.querySelector('strong');
  const resultText = result?.querySelector('span');
  if (!result || !resultTitle || !resultText) return;

  const updateQuiz = () => {
    const focus = quiz.querySelector('input[name="excursions-focus"]:checked')?.value || 'volcano';
    const style = quiz.querySelector('input[name="excursions-style"]:checked')?.value || 'easy';

    let title = 'Смотрите наземные экскурсии к вулканам и источникам.';
    let text = 'Начните с программ, где понятны дорога, пешая часть, запасной маршрут и время возвращения.';

    if (focus === 'ocean') {
      title = 'Смотрите экскурсии к океану и морские выходы.';
      text = 'Для такого дня особенно важны ветер, состояние моря, тип судна или дороги к берегу и условия переноса.';
    }

    if (focus === 'air') {
      title = 'Смотрите вертолётные и удалённые маршруты с резервом.';
      text = 'Планируйте запасной день и заранее проверьте правила переноса, возврата, регистрации и ограничений по весу.';
    }

    if (style === 'active') text = `${text} Вам ближе маршруты с ранним стартом и пешей частью, поэтому уточните километры, набор высоты и обувь.`;
    if (style === 'private') text = `${text} Для семьи или небольшой компании смотрите индивидуальные условия, посадку в машине и доплаты за изменение маршрута.`;

    resultTitle.textContent = title;
    resultText.textContent = text;
  };

  quiz.addEventListener('change', updateQuiz);
  updateQuiz();
});

document.querySelectorAll('[data-helicopter-quiz]').forEach((quiz) => {
  const result = quiz.querySelector('[data-helicopter-quiz-result]');
  const resultTitle = result?.querySelector('strong');
  const resultText = result?.querySelector('span');
  if (!result || !resultTitle || !resultText) return;

  const updateQuiz = () => {
    const focus = quiz.querySelector('input[name="helicopter-focus"]:checked')?.value || 'geysers';
    const reserve = quiz.querySelector('input[name="helicopter-reserve"]:checked')?.value || 'reserve';
    let title = '???????? ????????? ? ?????? ???????? ? ???????? ?? ??????.';
    let text = '??????? ? ??????? ????????, ????, ??????????? ? ??????? ?? ????? ???????. ???? ? ????? ?????????? ? ???????????? ????? ???????.';
    if (focus === 'lake') { title = '???????? ????????? ????????? ???????? ? ????????? ????????? ???????.'; text = '??? ????? ???????? ???????? ????? ?????, ??????????, ????????????, ??????? ? ??????? ???????? ??? ???????? ??????.'; }
    if (focus === 'volcano') { title = '???????? ????????????? ???????? ? ?????????? ??????????? ??????????.'; text = '???????? ??????? ??????, ??????????? ???????, ??????????? ?????????, ??????????? ?? ?????? ? ???????? ??????.'; }
    if (reserve === 'tight') text = `${text} ??? ??????? ??????? ????????? ???????????, ??? ??????? ?????? ??????? ??? ???????? ???????? ????????.`;
    if (reserve === 'combo') text = `${text} ? ??????? ???????? ???? ?????????, ??????? ?? ????? ? ???? ? ??? ??????????????? ????????? ??? ??????.`;
    resultTitle.textContent = title;
    resultText.textContent = text;
  };
  quiz.addEventListener('change', updateQuiz);
  updateQuiz();
});

document.querySelectorAll('[data-helicopter-quiz-fixed]').forEach((quiz) => {
  const result = quiz.querySelector('[data-helicopter-quiz-result-fixed]');
  const resultTitle = result?.querySelector('strong');
  const resultText = result?.querySelector('span');
  if (!result || !resultTitle || !resultText) return;

  const updateQuiz = () => {
    const focus = quiz.querySelector('input[name="helicopter-focus-fixed"]:checked')?.value || 'geysers';
    const reserve = quiz.querySelector('input[name="helicopter-reserve-fixed"]:checked')?.value || 'reserve';
    let title = 'Смотрите программы в Долину гейзеров с резервом по погоде.';
    let text = 'Начните с условий переноса, веса, регистрации и времени на самой локации. Даты и места проверяйте у организатора перед оплатой.';

    if (focus === 'lake') {
      title = 'Смотрите удалённые природные маршруты с понятными правилами допуска.';
      text = 'Для таких программ особенно важны сезон, разрешения, безопасность, питание и порядок действий при закрытии района.';
    }

    if (focus === 'volcano') {
      title = 'Смотрите вулканические маршруты с прозрачной авиационной логистикой.';
      text = 'Уточните маршрут полёта, возможность посадки, минимальную видимость, ограничения по багажу и наземную замену.';
    }

    if (reserve === 'tight') text = `${text} При плотном графике выбирайте предложения, где заранее описан возврат или наземный запасной сценарий.`;
    if (reserve === 'combo') text = `${text} В составе большого тура проверьте, включён ли вылет в цену и как пересчитывается программа при отмене.`;

    resultTitle.textContent = title;
    resultText.textContent = text;
  };

  quiz.addEventListener('change', updateQuiz);
  updateQuiz();
});

