class RecentlyViewedProducts extends HTMLElement {
  constructor() {
    super();
    this.productLimit = this.getAttribute('data-product-limit');
    this.sliderElement = this.querySelector('.component__recently-viewed');
    this.id = this.sliderElement.getAttribute('id');
    this.itemGridClass = this.querySelector('.recently__viewed-grid').className.replace("hide",'');
    this.init(this);
  }
  init(element) { 
    var localData = localStorage.getItem("recentlyViewedProduct");
    if (localData != null) {
      var productData = JSON.parse(localStorage.getItem("recentlyViewedProduct"));
      var recentlyViewed = '';
      var counter = 0;
      function moveAlong() {
        if(parseInt(counter) === parseInt(element.productLimit)){
          element.sliderElement.innerHTML = recentlyViewed;
        }else{
          if (productData.length) {
            const item = productData.shift();
            let productUrl = '/products/'+item.productHandle;
            fetch(`${productUrl}/?section_id=recently-viewed-products`)
            .then((response) => response.text())
            .then((responseText) => {
              const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
              var itemGrid = responseHTML.querySelector('.recently__viewed-grid');
              counter++;
              recentlyViewed += '<li id="'+element.id+'-'+counter+'" class="'+element.itemGridClass+'">'+itemGrid.innerHTML+'</li>';
              moveAlong();
            });
          }else{
            element.sliderElement.innerHTML = recentlyViewed;
          }
        }
      }
      moveAlong();
    }
  }
}

customElements.define('recently-viewed-products', RecentlyViewedProducts);