class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById('mini-cart-popup');
    this.onBodyClick = this.handleBodyClick.bind(this);

    this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
  }

  open() {
    $(document).find('[data-popup-type="mini-cart-popup"]').removeClass('hide-popup');
    $(document).find('.theme-popup-overlay').removeClass('hidden-overlay');
    $(document).find('.quick-add-modal').addClass('hide-popup');
    $(document).find('body').attr('active-popup','cart');

    this.notification.addEventListener('transitionend', () => {
      this.notification.focus();
      trapFocus(this.notification);
    }, { once: true });

    document.body.addEventListener('click', this.onBodyClick);
  }

  renderContents(parsedState) {
      this.cartItemKey = parsedState.key;
      this.getSectionsToRender().forEach((section => {
        document.getElementById(section.id).innerHTML =
          this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
          if(section.id == 'cart-icon-bubble'){
            document.querySelector('#mobile-cart-icon-bubble').innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
          }
      }));

      this.open();
  }

  getSectionsToRender() {
    return [
      {
        id: 'mini-cart-popup-product',
        selector: `[id="mini-cart-popup-product-${this.cartItemKey}"]`,
      },
      {
        id: 'mini-cart-popup-button'
      },
      {
        id: 'cart-icon-bubble'
      }
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest('mini-cart-popup')) {
      const disclosure = target.closest('details-disclosure, header-menu');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('mini-cart-popup', CartNotification);
