export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="g-process">
      <div className="container">
        <div className="g-sec-header center">
          <span className="g-sec-badge">Прозорий процес</span>
          <h2>Як відбувається наша співпраця</h2>
          <p>Зрозумілий маршрут від вибору години у календарі до самої онлайн-зустрічі.</p>
        </div>

        <div className="g-timeline">
          <div className="g-step-card">
            <span className="g-step-num">01</span>
            <h3>Запис у календарі</h3>
            <p>Обираєте зручні дату й час без довгого листування. Одразу отримуєте код запису.</p>
          </div>
          <div className="g-step-card">
            <span className="g-step-num">02</span>
            <h3>Оплата та кабінет</h3>
            <p>Сплачуєте зручним способом ФОП та відстежуєте статус і посилання на сесію у кабінеті.</p>
          </div>
          <div className="g-step-card">
            <span className="g-step-num">03</span>
            <h3>Перша зустріч</h3>
            <p>У комфортній та конфіденційній обстановці знайомимося, досліджуємо запит і цілі.</p>
          </div>
          <div className="g-step-card">
            <span className="g-step-num">04</span>
            <h3>Системні зміни</h3>
            <p>Рухаємося в індивідуальному темпі для досягнення стійкого відчуття внутрішньої опори.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
