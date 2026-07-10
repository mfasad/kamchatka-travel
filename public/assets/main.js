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
  const resultLink = quiz.querySelector('[data-jeep-quiz-link]');
  if (!result || !resultTitle || !resultText || !resultLink) return;

  const updateQuiz = () => {
    const duration = quiz.querySelector('input[name="jeep-duration"]:checked')?.value || 'one';
    const focus = quiz.querySelector('input[name="jeep-focus"]:checked')?.value || 'volcano';
    const style = quiz.querySelector('input[name="jeep-style"]:checked')?.value || 'active';

    let title = 'Начните с однодневных джип-туров.';
    let text = 'Так проще протестировать формат без смены гостиницы и большой логистики.';
    let href = '#one-day-jeep-tours';
    let cta = 'Показать однодневные туры';

    if (duration === 'week') {
      title = 'Смотрите многодневные джип-туры на 5–8 дней.';
      text = 'Это хороший формат для первой большой поездки: вулканы, океан, источники и несколько переездов без постоянного выбора на месте.';
      href = '#compare-tours';
      cta = 'Сравнить многодневные туры';
    }

    if (duration === 'long') {
      title = 'Ищите расширенную программу с запасом по времени.';
      text = 'Для максимума локаций важны не только точки маршрута, но и резерв на погоду, дороги и отдых между выездами.';
      href = '#compare-tours';
      cta = 'Смотреть большие маршруты';
    }

    if (focus === 'comfort' || style === 'comfort') {
      text = `${text} Обратите внимание на проживание, размер группы и запасной сценарий при плохой погоде.`;
    }

    if (style === 'family') {
      text = `${text} Для семьи или небольшой компании особенно важны понятный темп и короткие плечи переездов.`;
    }

    resultTitle.textContent = title;
    resultText.textContent = text;
    resultLink.setAttribute('href', href);
    resultLink.textContent = cta;
  };

  quiz.addEventListener('change', updateQuiz);
  updateQuiz();
});
