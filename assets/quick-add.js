if (!customElements.get('quick-add-modal')) {
  customElements.define('quick-add-modal', class QuickAddModal extends ModalDialog {
    constructor() {
      super();
      this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');
    }

    show(opener) {
      opener.setAttribute('aria-disabled', true);
      opener.classList.add('btn--loading');
      var productUrl = opener.getAttribute('data-product-url');
      if (productUrl.indexOf("?") > -1) {
        var productUrlSplit = productUrl.split('?');
        productUrl = productUrlSplit[0];
      }
      fetch(`${productUrl}?section_id=product-quick-buy`)
        .then((response) => response.text())
        .then((responseText) => {
          const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
          this.productElement = responseHTML.querySelector('div[id^="product-quick-buy"]');
          
          this.setInnerHTML(this.modalContent, this.productElement.innerHTML);

          if (window.Shopify && Shopify.PaymentButton) {
            Shopify.PaymentButton.init();
          }
          if (window.ProductModel) window.ProductModel.loadShopifyXR();
          this.classList.remove('hide-popup');
          $(document).find("body").attr("active-popup", 'quick-add-modal');
          $(document).find('.theme-popup-overlay').removeClass('hidden-overlay');
        })
        .finally(() => {
          opener.removeAttribute('aria-disabled');
          opener.classList.remove('btn--loading');
        });
    }

    setInnerHTML(element, html) {
      element.innerHTML = html;
      // Reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
      element.querySelectorAll('script').forEach(oldScriptTag => {
        const newScriptTag = document.createElement('script');
        Array.from(oldScriptTag.attributes).forEach(attribute => {
          newScriptTag.setAttribute(attribute.name, attribute.value)
        });
        newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
        oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
      });
    }
  });
  var currencyFormat = window.cartStrings.currencyCodeEnabled ? window.cartStrings.moneyWithCurrencyFormat : window.cartStrings.moneyFormat;
  function formatMoney(cents, format = "") {
    if (typeof cents === "string") {
      cents = cents.replace(".", "");
    }
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/, formatString = format || window.cartStrings.moneyFormat;
    function defaultTo(value2, defaultValue) {
      return value2 == null || value2 !== value2 ? defaultValue : value2;
    }
    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultTo(precision, 2);
      thousands = defaultTo(thousands, ",");
      decimal = defaultTo(decimal, ".");
      if (isNaN(number) || number == null) {
        return 0;
      }
      number = (number / 100).toFixed(precision);
      let parts = number.split("."), dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands), centsAmount = parts[1] ? decimal + parts[1] : "";
      return dollarsAmount + centsAmount;
    }
    let value = "";
    switch (formatString.match(placeholderRegex)[1]) {
      case "amount":
        value = formatWithDelimiters(cents, 2);
        break;
      case "amount_no_decimals":
        value = formatWithDelimiters(cents, 0);
        break;
      case "amount_with_space_separator":
        value = formatWithDelimiters(cents, 2, " ", ".");
        break;
      case "amount_with_comma_separator":
        value = formatWithDelimiters(cents, 2, ".", ",");
        break;
      case "amount_with_apostrophe_separator":
        value = formatWithDelimiters(cents, 2, "'", ".");
        break;
      case "amount_no_decimals_with_comma_separator":
        value = formatWithDelimiters(cents, 0, ".", ",");
        break;
      case "amount_no_decimals_with_space_separator":
        value = formatWithDelimiters(cents, 0, " ");
        break;
      case "amount_no_decimals_with_apostrophe_separator":
        value = formatWithDelimiters(cents, 0, "'");
        break;
    }
    if (formatString.indexOf("with_comma_separator") !== -1) {
      return formatString.replace(placeholderRegex, value);
    } else {
      return formatString.replace(placeholderRegex, value);
    }
  }
  $(document).on('change','.js-option-select',function(){
    var closeForm = $(this).closest('product-form');
    var closeModel = $(this).closest('quick-add-modal');
    var productData = JSON.parse(closeForm.find('#product-data-json').html());
    var variantOption = '';
    closeForm.find('.js-option-select').each(function(index){
      var thisValue = $(this).find('option:selected').val();
      if(index == 0){
        variantOption += thisValue;
      }else{
        variantOption += ' / '+thisValue;
      }
    });
    if(productData['variants']){
      productData['variants'].forEach(function(item){
        if(item.title == variantOption){
          var variantId = item.id;
          var variantPrice = formatMoney(item.price, currencyFormat);
          var variantComparePrice = item.compare_at_price;
          var variantAvailablity = item.available;
          closeForm.find('[name="id"]').val(variantId);
          if(variantComparePrice){
            closeModel.find('.price').find('span[price--sale]').html(variantPrice);
            closeModel.find('.price').find('span[price--regular]').addClass('cut--price').html(formatMoney(variantComparePrice, currencyFormat));
          }else{
            closeModel.find('.price').find('span[price--sale]').html('');
            closeModel.find('.price').find('span[price--regular]').removeClass('cut--price').html(variantPrice);
          }
          if(item.featured_image){
            closeModel.find('.quickBuy--product-image').attr("src",item.featured_image.src+'?&width=300');
          }
          if(variantAvailablity){
            closeForm.find('.quick-add__submit[name="add"]').prop('disabled',false).removeAttr('aria-disabled').find('.spn--add').removeClass('hidden');
            closeForm.find('.quick-add__submit[name="add"]').find('.sold-out-message').addClass('hidden')
          }else{
            closeForm.find('.quick-add__submit[name="add"]').find('.spn--add').addClass('hidden')
            closeForm.find('.quick-add__submit[name="add"]').prop('disabled',true).find('.sold-out-message').removeClass('hidden');
          }
        }
      });
    }
  });
}
