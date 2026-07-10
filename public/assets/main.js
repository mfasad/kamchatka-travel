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
