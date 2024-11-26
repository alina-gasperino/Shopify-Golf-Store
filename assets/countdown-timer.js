if (!customElements.get('countdown-timer')) {
  class CountdownTimer extends HTMLElement {
    constructor() {
      super();
      this.section = this.closest('section');
      this.display = this.querySelector('.countdown__timer');
      this.block = this.closest('.countdown__block-type-timer');
      this.year = this.dataset.year;
      this.month = this.dataset.month;
      this.day = this.dataset.day;
      this.hour = this.dataset.hour;
      this.minute = this.dataset.minute;
      this.daysPlaceholder = this.querySelector('.timer__days');
      this.hoursPlaceholder = this.querySelector('.timer__hours');
      this.minutesPlaceholder = this.querySelector('.timer__minutes');
      this.secondsPlaceholder = this.querySelector('.timer__seconds');
      this.messagePlaceholder = this.querySelector('.timer__message');
      this.hideTimerOnComplete = this.dataset.hideTimer;
      this.completeMessage = this.dataset.completeMessage;
      this.timerComplete = false;
      this.init();
    }

    init() {
      setInterval(() => {
        if (!this.timerComplete) {
          this._timeCalculate();
        }
      }, 1000);
    }

    _timeCalculate() {
      const targetDate = new Date(`${this.month}/${this.day}/${this.year} ${this.hour}:${this.minute}:00`);
      const timeDifference = targetDate.getTime() - Date.now();
      if (timeDifference > 0) {
        const intervals = {
          days: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((timeDifference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((timeDifference / 1000 / 60) % 60),
          seconds: Math.floor((timeDifference / 1000) % 60),
        };
        this.daysPlaceholder.innerHTML = intervals.days;
        this.hoursPlaceholder.innerHTML = intervals.hours;
        this.minutesPlaceholder.innerHTML = intervals.minutes;
        this.secondsPlaceholder.innerHTML = intervals.seconds;
      } else {
        if (this.completeMessage && this.messagePlaceholder) {
          this.messagePlaceholder.classList.remove('hide');
          this.display.classList.remove('countdown__timer--visible');
          this.display.classList.add('countdown__timer--hidden');
        }
        if (this.hideTimerOnComplete === 'true') {
          this.section.remove();
        }
        if (!this.completeMessage && this.hideTimerOnComplete === 'true') {
          this.block.classList.add('countdown__block--hidden');
        }
        this.timerComplete = true;
      }
    }
  }
  customElements.define('countdown-timer', CountdownTimer);
}