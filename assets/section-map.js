// Define the callback function to initialize the map
function initMap() {
  // Geocode the address
  var mapElement = document.getElementById('mapinit');
  if(mapElement){
    var address = mapElement.dataset.mapAddress;
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': address }, function (results, status) {
      if (status == 'OK') {
        // Get the location coordinates
        var location = results[0].geometry.location;
        // Create the map centered on the location 
        var mapOptions = {
          zoom: 14,
          center: location,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
          },
          navigationControl: true,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(mapElement, mapOptions);
        // Add a marker at the location
        var marker = new google.maps.Marker({
          position: location,
          map: map,
          title: address
        });
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
  }
}

// Load the Google Maps API asynchronously
function loadMapsAPI() {
  var mapElement = document.getElementById('mapinit');
  var mapKey = mapElement.dataset.mapKey;
  var script = document.createElement('script');
  script.src = 'https://maps.googleapis.com/maps/api/js?key='+mapKey+'&libraries=places&callback=initMap';
  document.body.appendChild(script);
}
// Call the function to load the API
loadMapsAPI();