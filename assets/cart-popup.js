class CartPopup extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    const cartLinkSticky = document.querySelector('#cart-icon-sticky-bubble');
    const cartLinkMobile = document.querySelector('#fixed-cart-icon-bubble');
    if(cartLink){
      cartLink.setAttribute('role', 'button');
      cartLink.setAttribute('aria-haspopup', 'dialog');
      cartLink.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(cartLink)
      });
      cartLink.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'SPACE') {
          event.preventDefault();
          this.open(cartLink);
        }
      });
    }
    if(cartLinkSticky){
      cartLinkSticky.setAttribute('role', 'button');
      cartLinkSticky.setAttribute('aria-haspopup', 'dialog');
      cartLinkSticky.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(cartLinkSticky)
      });
      cartLinkSticky.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'SPACE') {
          event.preventDefault();
          this.open(cartLinkSticky);
        }
      });
    }
    if(cartLinkMobile){
      cartLinkMobile.setAttribute('role', 'button');
      cartLinkMobile.setAttribute('aria-haspopup', 'dialog');
      cartLinkMobile.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(cartLinkMobile)
      });
      cartLinkMobile.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'SPACE') {
          event.preventDefault();
          this.open(cartLinkMobile);
        }
      });
    }
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartPopupNote = this.querySelector('[id^="Details-"] summary');
    if (cartPopupNote && !cartPopupNote.hasAttribute('role')) this.setSummaryAccessibility(cartPopupNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      if($(document).find('[data-popup-type="cart-popup"]').hasClass('hide-popup')){
        $(document).find('[data-popup-type]').addClass('hide-popup');
        $(document).find('[data-popup-type="cart-popup"]').removeClass('hide-popup');
        $(document).find('.theme-popup-overlay,theme-menu-popup-overlay').removeClass('hidden-overlay');
        $(document).find('body').attr('active-popup','cart');
      }else{
        $(document).find('[data-popup-type="cart-popup"]').addClass('hide-popup');
        $(document).find('.theme-popup-overlay,.theme-menu-popup-overlay').addClass('hidden-overlay');
        $(document).find('body').removeAttr('active-popup');
      }
      if($(document).find('[data-popup-type="cart-popup"]').length){
        setTimeout(function(){
          $(document).find('.cart--popup-recommandation').addClass('recommandation-active');
        },450);
      }
    });

    this.addEventListener('transitionend', () => {
      const containerToTrapFocusOn = this.classList.contains('is-empty') ? this.querySelector('.popup__inner-empty') : document.getElementById('CartPopup');
      const focusElement = this.querySelector('.popup__inner') || this.querySelector('.popup__close');
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
  }

  setSummaryAccessibility(cartPopupNote) {
    cartPopupNote.setAttribute('role', 'button');
    cartPopupNote.setAttribute('aria-expanded', 'false');

    if(cartPopupNote.nextElementSibling.getAttribute('id')) {
      cartPopupNote.setAttribute('aria-controls', cartPopupNote.nextElementSibling.id);
    }

    cartPopupNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartPopupNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.popup__inner').classList.contains('is-empty') && this.querySelector('.popup__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section => {
      const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
      if(section.id == 'cart-icon-bubble'){
        document.querySelector('#mobile-cart-icon-bubble').innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
        if(document.querySelector('#cart-icon-sticky-bubble')){
          document.querySelector('#cart-icon-sticky-bubble').innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
        }
      }
    }));
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-popup',
        selector: '#CartPopup'
      },
      {
        id: 'cart-icon-bubble'
      }
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-popup', CartPopup);

class CartPopupItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartPopup',
        section: 'cart-popup',
        selector: '.popup__inner'
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      }
    ];
  }
}

customElements.define('cart-popup-items', CartPopupItems);


$(document).on('click','.quick--add.popup--close',function(event){
  $(document).find('.cart--popup-recommandation').find('.cart-popup-items').removeClass('overlay');
  $(document).find('.cart--popup-quick-add').removeClass('active');
});
$(document).on('click','button[data-quick-add]',function(event){
  event.preventDefault();
  let thisElement = $(this),
      productHandle = thisElement.data('product-handle'),
      dataVariants = thisElement.data('quick-add'),
      variantId = thisElement.data('variant-id');
  $(document).find('legend.theme--error-message').addClass('hide');
  $(document).find('.cart--popup-recommandation').find('.cart-popup-items').addClass('overlay');
  if(dataVariants == true){
    $(document).find('.cart--popup-quick-add[data-product-handle="'+productHandle+'"]').addClass('active');
  }else{
    thisElement.addClass('btn--loading');
    $.ajax({
      type: 'POST',
      url: `${routes.cart_add_url}`,
      data: {quantity: 1, id: variantId},
      dataType: 'json', 
      success: function (data) { 
        const cartBubbleData = `${routes.root_url}?section_id=cart-icon-bubble`;
        fetch(cartBubbleData).then(response => response.text()).then(text => {
          const sectionInnerHTML = new DOMParser().parseFromString(text, 'text/html').querySelector('.shopify-section');
           document.querySelector('#cart-icon-bubble').innerHTML = $(sectionInnerHTML).html();
           document.querySelector('#mobile-cart-icon-bubble').innerHTML = $(sectionInnerHTML).html();
          if(document.querySelector('#cart-icon-sticky-bubble')){
            document.querySelector('#cart-icon-sticky-bubble').innerHTML = $(sectionInnerHTML).html();
          }
        });
        const cartPopupData = `${routes.root_url}?section_id=cart-popup`;
        fetch(cartPopupData).then(response => response.text()).then(text => {
          const sectionInnerHTML = new DOMParser().parseFromString(text, 'text/html').querySelector('.shopify-section');
          const popupData = $(sectionInnerHTML).find('cart-popup.popup').html();
          $(document).find('cart-popup.popup').removeClass('is-empty');
          document.querySelector('cart-popup.popup').innerHTML = popupData;
          $(document).find('.cart--popup-recommandation').find('.cart-popup-items').removeClass('overlay');
          thisElement.removeClass('btn--loading').addClass('btn--success');
          setTimeout(function(){
            thisElement.removeClass('btn--success');
          },1000);
        });
      },
      error: function(jqXHR, textStatus, errorThrown) {
        var errorDescription = $.parseJSON(jqXHR.responseText).description;
        thisElement.removeClass('btn--loading');
        $(document).find('.cart--popup-recommandation').find('.cart-popup-items').removeClass('overlay');
        thisElement.parents('.cart-item').find('legend.theme--error-message').removeClass('hide').html(window.cartStrings.warning_svg+errorDescription);
      }
    });
  }
});
if($(document).find('[data-popup-type="cart-popup"]').length){
  $(document).on('click','.quick--add-to-cart',function(event){
    event.preventDefault();
    var thisElement = $(this);
    thisElement.addClass('btn--loading');
    let closeForm = $(this).closest('form'),
      variantId = closeForm.find('select[name="id"]').find('option:selected').val();
    $.ajax({
      type: 'POST',
      url: `${routes.cart_add_url}`,
      data: {quantity: 1, id: variantId},
      dataType: 'json', 
      success: function (data) { 
        thisElement.removeClass('btn--loading').addClass('btn--success');
        const cartBubbleData = `${routes.root_url}?section_id=cart-icon-bubble`;
        fetch(cartBubbleData).then(response => response.text()).then(text => {
          const sectionInnerHTML = new DOMParser().parseFromString(text, 'text/html').querySelector('.shopify-section');
          document.querySelector('#cart-icon-bubble').innerHTML = $(sectionInnerHTML).html();
          document.querySelector('#mobile-cart-icon-bubble').innerHTML = $(sectionInnerHTML).html();
          if(document.querySelector('#cart-icon-sticky-bubble')){
            document.querySelector('#cart-icon-sticky-bubble').innerHTML = $(sectionInnerHTML).html();
          }
        });
        const cartPopupData = `${routes.root_url}?section_id=cart-popup`;
        fetch(cartPopupData).then(response => response.text()).then(text => {
          const sectionInnerHTML = new DOMParser().parseFromString(text, 'text/html').querySelector('.shopify-section');
          const popupData = $(sectionInnerHTML).find('cart-popup.popup').html();
          $(document).find('cart-popup.popup').removeClass('is-empty');
          document.querySelector('cart-popup.popup').innerHTML = popupData;
          setTimeout(function(){
            thisElement.removeClass('btn--success');
            $(document).find('.cart--popup-quick-add').removeClass('active');
            $(document).find('.cart--popup-recommandation').find('.cart-popup-items').removeClass('overlay');
          },1000);
        });
      },error: function(jqXHR, textStatus, errorThrown) {
        var errorDescription = $.parseJSON(jqXHR.responseText).description;
        $(document).find('.cart--popup-recommandation').find('.cart-popup-items').removeClass('overlay');
        thisElement.removeClass('btn--loading').closest('form').find('legend.theme--error-message').removeClass('hide').html(window.cartStrings.warning_svg+errorDescription);
      }
    });
  });
  $(document).on('change','.option--select',function(){
    let parentDiv = $(this).parents('.cart--popup-quick-add');
        variantCombination = '';
    parentDiv.find('.option--select').each(function(index){
      if(index == 0){
        variantCombination += $(this).val(); 
      }else{
        variantCombination += ' / '+$(this).val();        
      }
    });
    $(document).find('legend.theme--error-message').addClass('hide');
    parentDiv.find('select[name="id"]').find('option[data-title="'+variantCombination+'"]').prop("selected",true).trigger('change');
    let variantSelect = parentDiv.find('select[name="id"]').find('option:selected'),
        variantMainPrice = variantSelect.data('price'),
        variantComparePrice = variantSelect.data('compare-price'),
        variantImage = variantSelect.data('image'),
        variantAvailable = variantSelect.data('available'),
        addToCartText = window.variantStrings.addToCart,
        soldOutText = window.variantStrings.soldOut;
    if(variantComparePrice == false){
      parentDiv.find('span[price--sale]').html('');
      parentDiv.find('span[price--regular]').removeClass('cut--price').html(variantMainPrice);
    }else{
      parentDiv.find('span[price--sale]').html(variantMainPrice);
      parentDiv.find('span[price--regular]').addClass('cut--price').html(variantComparePrice);
    }
    if(variantImage != undefined){
      parentDiv.find('.cart--product-image').attr("src",variantImage);
    }
    if(variantAvailable == false){
      parentDiv.find('.quick--add-to-cart[name="add"]').prop('disabled',true).find('span').text(soldOutText);
    }else{
      parentDiv.find('.quick--add-to-cart[name="add"]').prop('disabled',false).find('span').text(addToCartText);
    }
  });
}
