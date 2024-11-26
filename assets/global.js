function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', summary.parentNode.hasAttribute('open'));

  if(summary.nextElementSibling.getAttribute('id')) {
    summary.setAttribute('aria-controls', summary.nextElementSibling.id);
  }

  summary.addEventListener('click', (event) => {
    $(document).find('.disclosure__list-wrapper').attr('hidden', true);
    if(summary.hasAttribute('data-header-nav')){
      $(document).find('.section-header').toggleClass('header__overlay');
      if($('header-menu').find('details[open]').length == 0) {
        $(document).find('.section-header').addClass('header__overlay');
      }
    }
    if(window.matchMedia("(min-width: 990px)").matches){
      if($(summary).hasClass('mobile-facets__summary') && $(summary).hasClass('filter__availability')){
        return false;
      }
      if($(summary).hasClass('mobile-facets__summary')){
        $(document).find('.mobile-facets__details:not(.fixed-area__details)').removeAttr('open');
      }
    }
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });

  if (summary.closest('header-drawer')) return;
  summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});

document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    setTimeout(function(){
      if(document.querySelector('.theme-loader__progress')){
        document.querySelector('body').classList.remove('loader__overflow');
        document.querySelector('.theme-loader__progress').style.display = 'none';
      }
    },1000);
  } 
};

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (elementToFocus.tagName === 'INPUT' &&
    ['search', 'text', 'email', 'url'].includes(elementToFocus.type) &&
    elementToFocus.value) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch(e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN']
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if(navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener('focus', () => {
    if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

    if (mouseClick) return;

    currentFocusedElement = document.activeElement;
    currentFocusedElement.classList.add('focused');

  }, true);
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });

    this.input.addEventListener('change', this.onInputChange.bind(this));
    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle('disabled', value <= min);
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle('disabled', value >= max);
    } 
  }
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}
setInterval(function(){
  if($(document).find('button.shopify-payment-button__button--unbranded').length){
    if(!$(document).find('button.shopify-payment-button__button--unbranded').find('.arrow--right').length){
      $(document).find('button.shopify-payment-button__button--unbranded').append('<svg class="arrow--right" width="12" height="13" viewBox="0 0 12 13" fill="none"><g><path d="M1 11.3958L11 1.39575" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 1.39575H11V11.3958" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g><defs><clipPath id="clip0_403_3045"><rect width="12" height="13" fill="white"/></clipPath></defs></svg>');
    }
  }
},100);

function customJavascript() {
  $(window).on("load", function () {
    let checkAgeVerified = true;
    let checkAgePopupCockie = getCookie("age-verification");
    if (
      $(document).find('[data-popup-type="age-verification"]').length &&
      checkAgePopupCockie == ""
    ) {
      checkAgeVerified = false;
      if (
        $(document)
          .find('[data-popup-type="age-verification"]')
          .hasClass("hide-popup")
      ) {
        $(document)
          .find('[data-popup-type="age-verification"]')
          .removeClass("hide-popup");
        $(document).find("body").attr("active-popup", 'age-verification');
        $(document).find(".theme-popup-overlay").removeClass("hidden-overlay");
      }
    }

    if (checkAgeVerified == true) {
      let checkWelcomePopupCockie = getCookie("welcome-popup");
      let popupDelayTime = $(document)
        .find('[data-popup-type="welcome"]')
        .data("popup-delay");
      if (checkWelcomePopupCockie == "") {
        setTimeout(function () {
          if (
            $(document)
              .find('[data-popup-type="welcome"]')
              .hasClass("hide-popup")
          ) {
            $(document)
              .find('[data-popup-type="welcome"]')
              .removeClass("hide-popup");
            $(document).find("body").attr("active-popup", 'welcome');
            $(document).find(".theme-popup-overlay").removeClass("hidden-overlay");
          }
        }, popupDelayTime);
      }
    }
  });

  $(document).ready(function () {
    $('body').on('click', function(event) {
      const targetElement = event.target;
      const targetClasses = targetElement.classList;
      if (targetClasses.contains('disclosure__button') || targetClasses.contains('country-flag') || targetClasses.contains('arrow--down')) {}else{
        $(document).find('.disclosure__button[aria-expanded="true"]').attr('aria-expanded',false);
        $(document).find('.disclosure__list-wrapper').attr('hidden', true);
      }
    });
    $(document).on("click", ".btn-back-to-top", function () {
      $("html, body").animate({ scrollTop: 0 });
    });
    $(window).on("scroll", function () {
      if ($(this).scrollTop() > 350) {
        $(document).find(".fixed-scroll-top-btn").removeClass("hide");
      } else {
        $(document).find(".fixed-scroll-top-btn").addClass("hide");
      }
    });
    $(document).on("click", ".popup--button", function (event) {
      event.preventDefault();
      let modalType = $(this).data("modal-type");
      if(!$(document).find('.rt-theme-popup[data-popup-type="' + modalType + '"]').hasClass('hide-popup')){
        $(document).find('.rt-theme-popup[data-popup-type="' + modalType + '"]').addClass("hide-popup");
        $(document).find(".theme-popup-overlay").addClass("hidden-overlay");
        $(document).find("body").removeAttr("active-popup");
        return false;
      }
      $(document).find('.rt-theme-popup').addClass("hide-popup");
      $(document).find(".theme-popup-overlay").removeClass("hidden-overlay");
      setTimeout(function () {
        $(document).find('.rt-theme-popup[data-popup-type="' + modalType + '"]').find('.field>input').first().focus();
      }, 100);
      $(document).find('.rt-theme-popup[data-popup-type="' + modalType + '"]').removeClass("hide-popup");
      $(document).find("body").attr("active-popup", modalType);
    });
    $(document).on("click", ".header-additional__toggle-link", function (event) {
      let modalType = $(this).data("modal-type");
      $(document).find(".section-header").addClass("header__overlay");
      $(document).find('.overlay-navigation-panel__popup[data-popup-type="' + modalType + '"]').removeClass("hide-popup");
      $(document).find("body").attr("active-popup", modalType);
    });
    $(document).on("click", ".btn--page-reload", function (event) {
      event.preventDefault();
      window.location.href = "https://google.com/";
    });
    $(document).on("click", ".btn--age-verified", function (event) {
      event.preventDefault();
      let redirectLink = $(document)
        .find('[data-popup-type="age-verification"]')
        .data("redirect");
      let showAgainAgePopup = $(document)
        .find('[data-popup-type="age-verification"]')
        .data("show-popup-again");
      setCookie("age-verification", true, showAgainAgePopup);
      $(document).find("body").removeAttr("active-popup");
      if (redirectLink == false) {
        $(document).find(".theme-popup-overlay").addClass("hidden-overlay");
        $(document).find(".rt-theme-popup").addClass("hide-popup");
      } else {
        window.location.href = redirectLink;
      }
    });
    $(document).on(
      "click",
      ".theme-popup-overlay,.theme-popup-close,.theme-menu-popup-overlay,.popup-close__btn",
      function (event) {
        if ($(document).find('[data-popup-type="age-verification"]').length) {
          if (
            $(document)
              .find('[data-popup-type="age-verification"]')
              .hasClass("hide-popup")
          ) {
            event.preventDefault();
            if (
              $(document).find('[data-popup-type="welcome"]').length &&
              !$(document)
                .find('[data-popup-type="welcome"]')
                .hasClass("hide-popup")
            ) {
              let showAgainPopup = $(document)
                .find('[data-popup-type="welcome"]')
                .data("show-popup-again");
              setCookie("welcome-popup", true, showAgainPopup);
            }
            $(document).find(".theme-popup-overlay").addClass("hidden-overlay");
            $(document)
              .find(".cart--popup-recommandation")
              .removeClass("recommandation-active");
            $(document).find(".section-header").removeClass("header__overlay");
            $(document).find(".rt-theme-popup,.overlay-navigation-panel__popup").addClass("hide-popup");
            $(document).find(".cart--popup-quick-add").removeClass("active");
          }
        } else {
          event.preventDefault();
          if (
            $(document).find('[data-popup-type="welcome"]').length &&
            !$(document)
              .find('[data-popup-type="welcome"]')
              .hasClass("hide-popup")
          ) {
            let showAgainPopup = $(document)
              .find('[data-popup-type="welcome"]')
              .data("show-popup-again");
            setCookie("welcome-popup", true, showAgainPopup);
          }
          $(document)
            .find(".cart--popup-recommandation")
            .removeClass("recommandation-active");
          $(document).find(".theme-popup-overlay").addClass("hidden-overlay");
          $(document).find(".section-header").removeClass("header__overlay");
         $(document).find(".rt-theme-popup,.overlay-navigation-panel__popup").addClass("hide-popup");
          $(document).find(".cart--popup-quick-add").removeClass("active");
          setTimeout(function(){
             $(document).find(".quick-add-modal__content-info").empty();
          },1000);
        }
        setTimeout(function(){
          $(document).find("menu-drawer").find('.menu-opening').removeClass('menu-opening').removeAttr("open");
        },500);
        $(document).find("body").removeAttr("active-popup");
      }
    );
    if ($(document).find(".card__content").length) {
      $(".card__content").hover(function (e) {
        if (window.matchMedia('(min-width: 990px)').matches) {
          e.stopPropagation();
          if(!$(this).hasClass('empty--image')){
            $(this).find(".article--excert").slideToggle(300);
            $(this).find(".collection-view__button").slideToggle(300);
          }
        }
      });
    }
    $(document).on("change", ".radio-card-swatch", function () {
      var closeElement = $(this).parents(".product-grid-item");
      var variantId = $(this).data("variant-id");
      var productJson = JSON.parse(closeElement.find("noscript").html());
      var secondaryImage = closeElement.data("secondary-image");
      var mediaArray = [];
      closeElement.find("a").attr("href", closeElement.data("url") + variantId);
      if(productJson["images"] != ''){
        mediaArray["featured-media"] = productJson["media"][0];
      }
      productJson["variants"].forEach(function (item) {
        if (item.id == variantId) {
          if (item.featured_media) {
            var mediaId = item.featured_media.id;
            productJson["media"].forEach(function (media) {
              if (mediaArray["secondary-media"]) {
                return false;
              } else if (media.id == mediaId) {
                mediaArray["primary-media"] = media;
              } else if (mediaArray["primary-media"]) {
                mediaArray["secondary-media"] = media;
              }
            });
          }
        }
      });
      var primaryMedia = mediaArray["primary-media"];
      var secondaryMedia = mediaArray["secondary-media"];
      if (!mediaArray["primary-media"]) {
        primaryMedia = mediaArray["featured-media"];
      } else if (!mediaArray["secondary-media"]) {
        secondaryMedia = mediaArray["featured-media"];
      }
      if (mediaArray["primary-media"] || mediaArray["secondary-media"]) {
        var imageSize = closeElement
          .find(".media")
          .find("img:first")
          .attr("sizes");
        var imagePrimary = createImageElement(
          primaryMedia,
          "motion-reduce",
          imageSize
        );
        var imageSecondary = createImageElement(
          secondaryMedia,
          "motion-reduce",
          imageSize
        );
        if (secondaryImage) {
          closeElement.find(".media").html(imagePrimary).append(imageSecondary);
        } else {
          closeElement.find(".media").html(imagePrimary);
        }
      }
    });
    $(document).on("click", ".accordion__toggle-btn", function (event) {
      event.preventDefault();
      $(this).parent('*').addClass('current__panel');
      $(document).find('.collapsible-panel__grid-right').find('.accordion.active:not(.current__panel)').removeClass('active').find('.accordion__content-rte').slideUp(450);
      $(this).next("*").slideToggle(450).parent("*").toggleClass("active");
      $(this).parent('*').removeClass('current__panel');
    });
    $(document).on("click", ".shop-the__look-dots", function () {
      var thisId = $(this).data("id");
      var parentDiv = $(this).parents(".shop-the__look-inner");
      parentDiv.find(".shop-the__look-dots").removeClass("selected");
      $(this).addClass("selected");
      parentDiv
        .find("slider-component")
        .find('.slider-counter__link--dots[data-id="' + thisId + '"]')
        .trigger("click");
      parentDiv
        .find("slider-component")
        .find(".slider__slide")
        .addClass("mobile_tablet--hide");
      parentDiv
        .find("slider-component")
        .find('.slider__slide[data-id="' + thisId + '"]')
        .removeClass("mobile_tablet--hide");
    });
    $(document).on('click','.btn-newsletter__submit',function(event){
      event.preventDefault();
      var _form = $(this).closest('form');
      var email = _form.find('input[type="email"]').val();
      var warning = _form.find('.theme--error-message').find('svg').prop('outerHTML');
      var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      if(email == ''){
         _form.find('.theme--error-message').removeClass('hide').html(warning+"Email can't be blank");
      }else if (emailRegex.test(email)) {
        _form.find('.theme--error-message').addClass('hide');
        _form.submit();
      } else {
        if(_form.find('.theme--error-message').length){
          _form.find('.theme--error-message').removeClass('hide').html(warning+"Please enter a valid email address");
        }
      }
    });
  });
}

/*
 * Image Comparison
 *
 */
const imageDiversion = class extends HTMLElement {
  connectedCallback() {
    this.b = this.closest(".shopify-section");
    this.c = this.d = false;
    this.e = this.f = 0;
    
    this.g = (event) => this.h(event);
    this.i = (event) => this.j(event);
    this.k = () => this.l();
    this.m = () => this.n();
    
    this.b.addEventListener("pointerdown", this.g);
    this.b.addEventListener("pointermove", this.i);
    this.b.addEventListener("pointerup", this.k);
    window.addEventListener("resize", this.m);
  }
  get o() {
    return -this.offsetLeft;
  }
  get p() {
    const offsetParent = this.offsetParent;
    return offsetParent ? offsetParent.clientWidth + this.o : 0;
  }

  h(event) {
    if (event.target === this || this.contains(event.target)) {
      this.q = event.clientX - this.e;
      this.c = true;
    }
  }
  j(event) {
    if (!this.c) {
      return;
    }
    this.f = Math.min(Math.max(event.clientX - this.q, this.o), this.p);
    this.e = this.f;
    this.b.style.setProperty("--image-diversion-offset", `${this.f.toFixed(1)}px`);
  }
  l() {
    this.c = false;
  }
  n() {
    this.b.style.setProperty("--image-diversion-offset", `${Math.min(Math.max(this.o, this.f.toFixed(1)), this.p)}px`);
  }
};

if (!window.customElements.get("image-diversion")) {
  window.customElements.define("image-diversion", imageDiversion);
}


/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};

Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};

Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
    this.querySelectorAll('button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
  }

  onKeyUp(event) {
    if(event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if(!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest('.has-submenu');
    const isOpen = detailsElement.hasAttribute('open');
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if(window.matchMedia("(min-width: 990px)").matches){
      if($(summaryElement).hasClass('mobile-facets__summary') && $(summaryElement).hasClass('filter__availability')){
        return false;
      }
      if($(summaryElement).hasClass('mobile-facets__summary')){
        $(document).find('.mobile-facets__details:not(.fixed-area__details)').removeAttr('open');
      }
    }
    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
      summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if(isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);

      if (window.matchMedia('(max-width: 990px)')) {
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
      }
    } else {
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        summaryElement.setAttribute('aria-expanded', true);
        parentMenuElement && parentMenuElement.classList.add('submenu-open');
        !reducedMotion || reducedMotion.matches ? addTrapFocus() : summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    if($(this).hasClass('mobile-facets__wrapper')){
      if(window.matchMedia("(min-width: 990px)").matches){
        $(document).find('.fixed-area__details').attr('open', true);
        $(document).find('.mobile-facets__details:not(.fixed-area__details):first').attr('open', true);
      }
      setTimeout(function(){
         $(document).find('[data-popup-type="filter-popup"]').removeClass('hide-popup');
         $(document).find("body").attr("active-popup", 'filter-popup');
         $(document).find(".theme-popup-overlay").removeClass("hidden-overlay");
      },100);
    }
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle.querySelectorAll('details').forEach(details => {
      details.removeAttribute('open');
      details.classList.remove('menu-opening');
    });
    this.mainDetailsToggle.querySelectorAll('.submenu-open').forEach(submenu => {
      submenu.classList.remove('submenu-open');
    });
    document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);
    if($(this).hasClass('mobile-facets__wrapper')){
      setTimeout(function(){
         $(document).find('[data-popup-type="filter-popup"]').addClass('hide-popup');
         $(document).find(".theme-popup-overlay").addClass("hidden-overlay");
      },100);
    }
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest('.submenu-open');
    parentMenuElement && parentMenuElement.classList.remove('submenu-open');
    detailsElement.classList.remove('menu-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus(detailsElement.querySelector('summary'));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        if(!$(detailsElement).hasClass('menu-drawer-container')){
          detailsElement.removeAttribute('open');
        }
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

$(document).on('click','.dropdown-menu--toggle',function(){
  $(this).toggleClass('menu-expanded');
});

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      'click',
      this.hide.bind(this, false)
    );
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    if($(this).hasClass('rt-theme-popup')){
      $(this).removeClass('hide-popup');
      $(document).find('.theme-popup-overlay').removeClass('hidden-overlay');
      $(document).find("body").attr("active-popup", 'product-model');
    }else{
      document.body.classList.add('overflow-hidden');
      this.setAttribute('open', '');
    }
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pageTotalElement = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');
    
    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver(entries => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener('scroll', this.update.bind(this));
    this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
    this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
    	
    this.sliderControlWrapper = this.querySelector('.slider-buttons');	
    if (!this.sliderControlWrapper) return;	
    this.sliderFirstItemNode = this.slider.querySelector('.slider__slide');	
    	
    this.sliderControlLinksArray = Array.from(this.sliderControlWrapper.querySelectorAll('.slider-counter__link'));	
    this.sliderControlLinksArray.forEach(link => link.addEventListener('click', this.linkToSlide.bind(this)));
    
    if (this.slider.getAttribute('data-autoplay') === 'true'){
      this.setAutoPlay();
    }else if (this.slider.getAttribute('data-autoplay') === 'desktop') {
      if(window.matchMedia("(min-width: 750px)").matches){
        this.setAutoPlay();
      }
    }else if (this.slider.getAttribute('data-autoplay') === 'mobile') {
      if(window.matchMedia("(max-width: 749px)").matches){
        this.setAutoPlay();
      } 
    }
  }
  
  setAutoPlay() {
    if(window.matchMedia("(min-width: 750px)").matches){
      this.autoplaySpeed = this.slider.getAttribute('data-speed-desktop') * 1000;
    }else{
      this.autoplaySpeed = this.slider.getAttribute('data-speed-mobile') * 1000;
    }
    this.play();
  }

  play() {
    this.slider.setAttribute('aria-live', 'off');
    clearInterval(this.autoplay);
    this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed);
  }

  autoRotateSlides() {
    var productCount = 0;
    if(window.matchMedia("(min-width: 992px)").matches){
      productCount = parseInt(this.slider.getAttribute('data-desktop-items'));
    } else if (window.matchMedia("(max-width: 750px)").matches) {
      productCount = parseInt(this.slider.getAttribute('data-mobile-items'));
    } else {
      productCount = 2;
    }
    if(productCount != 0){
      productCount = productCount - 1;
    }
    const slideScrollPosition = this.currentPage + productCount === this.sliderItems.length ? 0 : this.slider.scrollLeft + this.slider.querySelector('.slider__slide').clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(element => element.clientWidth > 0);
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset = this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor((this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) / this.sliderItemOffset);
    
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    // Temporarily prevents unneeded updates resulting from variant changes
    // This should be refactored as part of https://github.com/Shopify/dawn/issues/2057
    if (!this.slider || !this.nextButton) return;

    const previousPage = this.currentPage;
    this.currentPage = Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;
    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(new CustomEvent('slideChanged', { detail: {
        currentPage: this.currentPage,
        currentElement: this.sliderItemsToShow[this.currentPage - 1]
      }}));
    }

    if (this.enableSliderLooping) return;

    if (this.isSlideVisible(this.sliderItemsToShow[0]) && this.slider.scrollLeft === 0) {
      this.prevButton.setAttribute('disabled', 'disabled');
    } else {
      this.prevButton.removeAttribute('disabled');
    }
    
    if (this.isSlideVisible(this.sliderItemsToShow[this.sliderItemsToShow.length - 1])) {
      this.nextButton.setAttribute('disabled', 'disabled');
    } else {
      this.nextButton.removeAttribute('disabled');
    }
    this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');	
    if (!this.sliderControlButtons.length) return;	
    this.sliderControlButtons.forEach(link => {	
      link.classList.remove('slider-counter__link--active');	
      link.removeAttribute('aria-current');	
    });	
    if(this.sliderControlButtons[this.currentPage - 1]){
      this.sliderControlButtons[this.currentPage - 1].classList.add('slider-counter__link--active');	
      this.sliderControlButtons[this.currentPage - 1].setAttribute('aria-current', true);
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide = this.slider.clientWidth + this.slider.scrollLeft - offset;
    return (element.offsetLeft + element.clientWidth) <= lastVisibleSlide && element.offsetLeft >= this.slider.scrollLeft;
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition = event.currentTarget.name === 'next' ? this.slider.scrollLeft + (step * this.sliderItemOffset) : this.slider.scrollLeft - (step * this.sliderItemOffset);
    this.slider.scrollTo({
      left: this.slideScrollPosition
    });
  }
  linkToSlide(event) {
    event.preventDefault();
    var productCount = parseInt(this.slider.getAttribute('data-mobile-items'));
    var slideScrollPosition = this.slider.scrollLeft + this.slider.clientWidth * (this.sliderControlLinksArray.indexOf(event.currentTarget) + 1 - this.currentPage);
    if(productCount == 2){
      slideScrollPosition = this.slider.scrollLeft + this.slider.clientWidth / productCount * (this.sliderControlLinksArray.indexOf(event.currentTarget) + 1 - this.currentPage);
    }
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }
}

customElements.define('slider-component', SliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector('.slider-buttons');
    this.enableSliderLooping = true;
    if(this.slider.querySelectorAll('.slideshow__video').length){
      this.videoAutoplay();
    }

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector('.slideshow__slide');
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.sliderControlLinksArray = Array.from(this.sliderControlWrapper.querySelectorAll('.slider-counter__link'));
    this.sliderControlLinksArray.forEach(link => link.addEventListener('click', this.linkToSlide.bind(this)));
    this.slider.addEventListener('scroll', this.setSlideVisibility.bind(this));
    this.setSlideVisibility();

    if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
  }

  setAutoPlay() {
    this.autoplaySpeed = this.slider.dataset.speed * 1000;

    this.play();
    this.autoplayButtonIsSetToPlay = true;
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) return;

    if (isFirstSlide && event.currentTarget.name === 'previous') {
      this.slideScrollPosition = this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === 'next') {
      this.slideScrollPosition = 0;
    }
    this.slider.scrollTo({
      left: this.slideScrollPosition
    });
  }

  update() {
    super.update();
    this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');
    this.prevButton.removeAttribute('disabled');

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach(link => {
      link.classList.remove('slider-counter__link--active');
      link.removeAttribute('aria-current');
    });
    if(this.sliderControlButtons[this.currentPage - 1]){
      this.sliderControlButtons[this.currentPage - 1].classList.add('slider-counter__link--active');
      this.sliderControlButtons[this.currentPage - 1].setAttribute('aria-current', true);
    }
  }

  play() {
    this.slider.setAttribute('aria-live', 'off');
    clearInterval(this.autoplay);
    this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed);
  }

  pause() {
    this.slider.setAttribute('aria-live', 'polite');
    clearInterval(this.autoplay);
  }

  autoRotateSlides() {
    const slideScrollPosition = this.currentPage === this.sliderItems.length ? 0 : this.slider.scrollLeft + this.slider.querySelector('.slideshow__slide').clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }

  setSlideVisibility() {
    this.sliderItemsToShow.forEach((item, index) => {
      const linkElements = item.querySelectorAll('a');
      if (index === this.currentPage - 1) {
        if (linkElements.length) linkElements.forEach(button => {
          button.removeAttribute('tabindex');
        });
        item.setAttribute('aria-hidden', 'false');
        item.removeAttribute('tabindex');
      } else {
        if (linkElements.length) linkElements.forEach(button => {
          button.setAttribute('tabindex', '-1');
        });
        item.setAttribute('aria-hidden', 'true');
        item.setAttribute('tabindex', '-1');
      }
    });
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition = this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * (this.sliderControlLinksArray.indexOf(event.currentTarget) + 1 - this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }
  videoAutoplay() {
    const sliderAutoPlay = this.slider.querySelectorAll('.slideshow__video');
    sliderAutoPlay.autoplay = true;
  }
}

customElements.define('slideshow-component', SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange() {
      this.updateOptions();
      this.updateMasterId();
      this.toggleAddButton(true, '', false);
      this.updatePickupAvailability();
      this.removeErrorMessage();
      this.updateVariantStatuses();
     if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
    }
    if (this.currentVariant) {
      const option1 = this.currentVariant['option1'],
            option2 = this.currentVariant['option2'],
            option3 = this.currentVariant['option3'];
      if(option1){
        $(document).find('input[type="radio"][data-product-variant-option][value="'+option1+'"]').prop('checked',true);
        $(document).find('select[data-product-variant-option]').find('option[value="'+option1+'"]').prop('selected',true);
        $(document).find('.product').find('.selected__value[data-option-index="1"]').text('('+option1+')');
      }
      if(option2){
        $(document).find('input[type="radio"][data-product-variant-option][value="'+option2+'"]').prop('checked',true);
        $(document).find('select[data-product-variant-option]').find('option[value="'+option2+'"]').prop('selected',true);
        $(document).find('.product').find('.selected__value[data-option-index="2"]').text('('+option2+')');
      }
      if(option3){
        $(document).find('input[type="radio"][data-product-variant-option][value="'+option3+'"]').prop('checked',true);
        $(document).find('select[data-product-variant-option]').find('option[value="'+option3+'"]').prop('selected',true);
        $(document).find('.product').find('.selected__value[data-option-index="3"]').text('('+option3+')');
      }
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGalleries = document.querySelectorAll(`[id^="MediaGallery-${this.dataset.section}"]`);
    mediaGalleries.forEach(mediaGallery => mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`, true));

    const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product-media-modal__content`);
    if (!modalContent) return;
    const newMediaModal = modalContent.querySelector( `[data-media-id="${this.currentVariant.featured_media.id}"]`);
    modalContent.prepend(newMediaModal);
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateShareUrl() {
    const shareButton = document.getElementById(`Share-${this.dataset.section}`);
    if (!shareButton || !shareButton.updateUrl) return;
    shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(variant => this.querySelector(':checked').value === variant.option1);
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')]
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants.filter(variant => variant.available && variant[`option${ index }`] === previousOptionSelected).map(variantOption => variantOption[`option${ index + 1 }`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue)
    });
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach(input => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.innerText = input.getAttribute('value');
      } else {
        input.innerText = window.variantStrings.unavailable_with_option.replace('[value]', input.getAttribute('value'));
      }
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    const productForm = section.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;

    fetch(`${this.dataset.url}?variant=${requestedVariantId}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        // prevent unnecessary ui changes from abandoned selections
        if (this.currentVariant.id !== requestedVariantId) return;

        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const destination = document.getElementById(`price-${this.dataset.section}`);
        const destinationSticky = document.getElementById(`price-${this.dataset.section}-sticky`);
        const source = html.getElementById(`price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const skuSource = html.getElementById(`Sku-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const skuDestination = document.getElementById(`Sku-${this.dataset.section}`);
        const inventorySource = html.getElementById(`Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const inventoryDestination = document.getElementById(`Inventory-${this.dataset.section}`);
        if (source && destination) destination.innerHTML = source.innerHTML;
        if (source && destinationSticky) destinationSticky.innerHTML = source.innerHTML;
        
        if (inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;
        if (skuSource && skuDestination) {
          skuDestination.innerHTML = skuSource.innerHTML;
          skuDestination.classList.toggle('visibility-hidden', skuSource.classList.contains('visibility-hidden'));
        }

        const price = document.getElementById(`price-${this.dataset.section}`);

        if (price) price.classList.remove('visibility-hidden');

        if (inventoryDestination) inventoryDestination.classList.toggle('visibility-hidden', inventorySource.innerText === '');

        const addButtonUpdated = html.getElementById(`ProductSubmitButton-${sectionId}`);
        this.toggleAddButton(addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true, window.variantStrings.soldOut);

        publish(PUB_SUB_EVENTS.variantChange, {data: {
          sectionId,
          html,
          variant: this.currentVariant
        }});
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    const inventory = document.getElementById(`Inventory-${this.dataset.section}`);
    const sku = document.getElementById(`Sku-${this.dataset.section}`);

    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('visibility-hidden');
    if (inventory) inventory.classList.add('visibility-hidden');
    if (sku) sku.classList.add('visibility-hidden');
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach(input => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.classList.remove('disabled');
      } else {
        input.classList.add('disabled');
      }
    });
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }
}

customElements.define('variant-radios', VariantRadios);

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);
      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector('product-recommendations');

          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          if (!this.querySelector('slideshow-component') && this.classList.contains('complementary-products')) {
            this.remove();
          }

          if (html.querySelector('.grid__item')) {
            this.classList.add('product-recommendations--loaded');
          }
        })
        .catch(e => {
          console.error(e);
        });
    }
    new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
  }
}

customElements.define('product-recommendations', ProductRecommendations);

function createImageElement(media, classes, sizes) {
    const previewImage = media["preview_image"], image = new Image(previewImage["width"], previewImage["height"]);
    image.className = classes;
    image.alt = media["alt"];
    image.sizes = sizes;
    image.src = previewImage["src"];
    image.srcset = generateSrcset(previewImage, [165, 360, 533, 720, 940, 1066]);
    return image;
}
function isHttpsUrl(url) {
  return url.startsWith("https://");
}
function generateSrcset(imageObject, widths = []) {
  var imageUrl = '';
  if (!isHttpsUrl(imageObject["src"])) {
     imageUrl = new URL("https://" + imageObject["src"]);
  }else{
     imageUrl = new URL(imageObject["src"]);
  }
  return widths.filter((width) => width <= imageObject["width"]).map((width) => {
    imageUrl.searchParams.set("width", width.toString());
    return `${imageUrl.href} ${width}w`;
  }).join(", ");
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
customJavascript();