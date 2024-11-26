function hideProductModal() {
  const productModal = document.querySelectorAll('product-modal[open]');
  productModal && productModal.forEach(modal => modal.hide());
}
function initJavascript(){
  if(document.querySelectorAll('.allow-header--transparent').length){
    document.body.classList.add('slideshow-transparent__header');
  }else{
    document.body.classList.remove('slideshow-transparent__header');
  }
  var sectionHeader = document.querySelector('.section-header');
  if (sectionHeader) {
    var rect = sectionHeader.getBoundingClientRect();
    var headerHeight = rect.height.toFixed(1);
    if(document.body.classList.contains("slideshow-transparent__header")){
      if(window.matchMedia("(min-width: 990px)").matches){
        headerHeight = headerHeight - 20;
      }else {
        headerHeight = headerHeight - 10;
      }
    }
    document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
    if (element.querySelector('.header-navigation-bottom__fixed')) {
      element.querySelector('.header-navigation-bottom__fixed').classList.add('active');
      setTimeout(function(){
        var getFixedNavHeight = element.querySelector('.header-navigation-bottom__fixed').offsetHeight;
        document.documentElement.style.setProperty('--bottom-fixed-navigation', getFixedNavHeight + 'px');
      },100);
    }else{
      document.documentElement.style.setProperty('--bottom-fixed-navigation', 0 + 'px');
    }
  }
}

document.addEventListener('shopify:block:select', function(event) {
  hideProductModal();
  const blockSelectedIsSlide = event.target.classList.contains('slideshow__slide');
  if (!blockSelectedIsSlide) return;

  const parentSlideshowComponent = event.target.closest('slideshow-component');
  parentSlideshowComponent.pause();

  setTimeout(function() {
    parentSlideshowComponent.slider.scrollTo({
      left: event.target.offsetLeft
    });
  }, 200);
});

document.addEventListener('shopify:block:deselect', function(event) {
  initJavascript();
  const blockDeselectedIsSlide = event.target.classList.contains('slideshow__slide');
  if (!blockDeselectedIsSlide) return;
  const parentSlideshowComponent = event.target.closest('slideshow-component');
  if (parentSlideshowComponent.autoplayButtonIsSetToPlay) parentSlideshowComponent.play();
});

document.addEventListener('shopify:section:load', () => {
  hideProductModal();
  initJavascript();
  const zoomOnHoverScript = document.querySelector('[id^=EnableZoomOnHover]');
  if (!zoomOnHoverScript) return;
  if (zoomOnHoverScript) {
    const newScriptTag = document.createElement('script');
    newScriptTag.src = zoomOnHoverScript.src;
    zoomOnHoverScript.parentNode.replaceChild(newScriptTag, zoomOnHoverScript);
  }
});

document.addEventListener('shopify:section:reorder', () => hideProductModal());

document.addEventListener('shopify:inspector:activate', () => hideProductModal());

document.addEventListener('shopify:inspector:deactivate', () => hideProductModal());
