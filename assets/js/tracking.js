// Location tracking functionality

// Reference to user location marker
let userLocationMarker = null;

/**
 * Shows the user's current location on the map
 * Handles geolocation API requests and displays the user's position
 */
function showMyLocation() {
  if ('geolocation' in navigator) {
    // Show loading indication
    const button = document.querySelector('.location-button');
    const originalText = button.textContent;
    button.textContent = 'იძებნება...';
    button.disabled = true;

    navigator.geolocation.getCurrentPosition(
      function (position) {
        // Success callback - got the position
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // If we already have a marker, remove it
        if (userLocationMarker) {
          userLocationMarker.remove();
        }

        // Create marker element
        const el = document.createElement('div');
        el.className = 'user-location-marker';

        // Add the marker to the map
        userLocationMarker = new maplibregl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([userLng, userLat])
          .addTo(map);

        // Fly to the user's location
        map.flyTo({
          center: [userLng, userLat],
          zoom: Math.min(13, MAX_ZOOM_LEVEL), // Limit zoom to max 17.3
          duration: 1500,
        });

        // Reset button state
        button.textContent = originalText;
        button.disabled = false;
      },
      function (error) {
        // Error callback
        console.error('Error getting location:', error);
        let errorMessage = 'ლოკაციის მოძიება ვერ მოხერხდა';

        // More specific error messages
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'გთხოვთ დართოთ ლოკაციაზე წვდომის უფლება';
        }

        alert(errorMessage);

        // Reset button state
        button.textContent = originalText;
        button.disabled = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  } else {
    // Geolocation not supported by the browser
    alert('თქვენი ბრაუზერი არ უჭერს მხარს გეოლოკაციას');
  }
}
