if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cart = document.querySelector('mini-cart-popup') || document.querySelector('cart-popup');
      this.submitButton = this.querySelector('[type="submit"]');
      if (document.querySelector('cart-popup')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

      this.handleErrorMessage();

      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.classList.add('btn--loading');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const formData = new FormData(this.form);
      if (this.cart) {
        formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
        formData.append('sections_url', window.location.pathname);
        this.cart.setActiveElement(document.activeElement);
      }
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {

          if (response.status) {
            publish(PUB_SUB_EVENTS.cartError, {source: 'product-form', productVariantId: formData.get('id'), errors: response.description, message: response.message});
            this.handleErrorMessage(response.description);
            const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
            $(this).find('.quick-add__submit.single').prop('disabled',true);
            if (!soldOutMessage) return;
            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButton.querySelector('span').classList.add('hidden');
            soldOutMessage.classList.remove('hidden');
            this.error = true;
            return;
          } else if (!this.cart) {
            window.location = window.routes.cart_url;
            return;
          }

          if (!this.error) publish(PUB_SUB_EVENTS.cartUpdate, {source: 'product-form', productVariantId: formData.get('id')});
          this.error = false;
          const quickAddModal = this.closest('quick-add-modal');
          if (quickAddModal) {
            document.body.addEventListener('modalClosed', () => {
              setTimeout(() => { 
                this.cart.renderContents(response) 
                if($(document).find('[data-popup-type="cart-popup"]').length){
                  $(document).find('quick-add-modal').addClass('hide-popup');
                  $(document).find('[data-popup-type="cart-popup"]').removeClass('hide-popup');
                  $(document).find('body').attr('active-popup','cart');
                  $(document).find('.theme-popup-overlay').removeClass('hidden-overlay');
                  setTimeout(function(){
                    $(document).find('.cart--popup-recommandation').addClass('recommandation-active');
                  },450);
                }
              });
            }, { once: true });
            quickAddModal.hide(true);
          } else {
            this.cart.renderContents(response);
            if($(document).find('[data-popup-type="cart-popup"]').length){
              $(document).find('[data-popup-type="cart-popup"]').removeClass('hide-popup');
              $(document).find('body').attr('active-popup','cart');
              $(document).find('.theme-popup-overlay').removeClass('hidden-overlay');
              setTimeout(function(){
                $(document).find('.cart--popup-recommandation').addClass('recommandation-active');
              },450);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.submitButton.classList.remove('btn--loading');
          if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          if (!this.error) this.submitButton.removeAttribute('aria-disabled');
        });
    }

    handleErrorMessage(errorMessage = false) {
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      if (!this.errorMessageWrapper) return;
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      if(errorMessage['email'] == undefined){
        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);
      }

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}
if(window.matchMedia("(min-width: 990px)").matches && $(document).find('.visible-on__sticky').length){
  $(window).on('scroll',function(){
    if($(document).find('.variant-picker__end').length){
      var stickyDivOffset = $(document).find('.product-info__right-sticky').offset().top;
      var scrollTop = $(window).scrollTop();
      var divOffset = $(document).find('.variant-picker__end').offset().top;
      var checkStickyBottom = isStickyElementAtBottom();
      if (scrollTop >= divOffset) {
        if(checkStickyBottom == 'bottom-false'){
          $(document).find('.visible-on__sticky').slideDown('slow');
        }
      } else {
        $(document).find('.visible-on__sticky').slideUp('slow');
      }
    }
  });
  function isStickyElementAtBottom() {
    const $mainDiv = $('.main-product__layout');
    const $childDiv = $('.product-info__right-sticky');
    const childOffsetTop = $childDiv.offset().top;
    const mainScrollTop = $mainDiv.scrollTop();
    const mainOffsetTop = $mainDiv.offset().top;
    const childHeight = $childDiv.height();
    const mainHeight = $mainDiv.height();
    const isAtBottom = (childOffsetTop + childHeight + 45) >= (mainScrollTop + mainOffsetTop + mainHeight);
    if (isAtBottom) {
      return 'bottom-true';
    } else {
      return 'bottom-false';
    }
  }
}
if(window.matchMedia("(max-width: 989px)").matches){
  if($(document).find('.product-info__right-sticky').length){
    var destinationMobile = document.querySelector(".product__info-wrapper");
    var leftInfoDesktop = document.querySelector(".product-media__left-info");
    var stickyDiv = document.querySelector(".product-info__right-sticky");
    destinationMobile.appendChild(stickyDiv);
    stickyDiv.classList.add('mobile-appended');
  }
}
window.addEventListener("resize", function() {
  if($(document).find('.product-info__right-sticky').length){
    var destinationMobile = document.querySelector(".product__info-wrapper");
    var leftInfoDesktop = document.querySelector(".product-media__left-info");
    var stickyDiv = document.querySelector(".product-info__right-sticky");
    if(window.matchMedia("(max-width: 989px)").matches){
      if (!stickyDiv.classList.contains('mobile-appended')) {
        destinationMobile.appendChild(stickyDiv);
        stickyDiv.classList.remove('desktop-appended');
        stickyDiv.classList.add('mobile-appended');
      }
    }else{
      if (!stickyDiv.classList.contains('desktop-appended')) {
        leftInfoDesktop.parentNode.insertBefore(stickyDiv, leftInfoDesktop.nextSibling);
        stickyDiv.classList.remove('mobile-appended');
        stickyDiv.classList.add('desktop-appended');
      }
    }
  } 
});


