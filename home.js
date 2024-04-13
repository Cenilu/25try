document.addEventListener('DOMContentLoaded', function () {
    var key = 'pk.87f2d9fcb4fdd8da1d647b46a997c727';
    var customIcon = L.icon({
        iconUrl: 'https://i.ibb.co/kH2yGn7/MB-Logo.png',
        iconSize: [100, 100], // size of the icon
        iconAnchor: [50, 50], // point of the icon which will correspond to marker's location
        popupAnchor: [0, -10] // point from which the popup should open relative to the iconAnchor
    });

    // Function to ask for location permission
    function askForUserLocationPermission() {
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then(function (permissionStatus) {
                if (permissionStatus.state === 'granted') {
                    locateUser(); // If permission is already granted, proceed with locating the user
                } else if (permissionStatus.state === 'prompt') {
                    // Integrate Google's location service activation
                    var confirmation = confirm('To continue, turn on device location using Google\'s location service. Click "Okay" to turn on location or "Cancel" to proceed without turning on location.');
                    if (confirmation) {
                        // Prompt for location permission only if the user agrees in the confirmation dialog
                        navigator.geolocation.getCurrentPosition(locateUser, function (error) {
                            console.error('Error getting user location:', error.message);
                            alert('Error getting your location. Please make sure you allow location access.');
                        });
                    }
                } else {
                    // Permission denied or not supported
                    alert('Location access is denied or not supported. Please enable it in your device settings.');
                }
            });
        } else {
            // For browsers not supporting navigator.permissions
            alert('Your browser does not support the Permissions API. Please make sure to allow location access.');
        }
    }
    

    // Call the function to ask for location permission when the document is loaded
    askForUserLocationPermission();

    function locateUser() {
        // Geolocation API
        if (navigator.geolocation) {
            var options = {
                enableHighAccuracy: true,
                timeout: 5000, // 5 seconds
                maximumAge: 0 // Don't use cached position
            };
            navigator.geolocation.getCurrentPosition(function (position) {
                var userLat = position.coords.latitude;
                var userLng = position.coords.longitude;
                var userLocation = L.latLng(userLat, userLng);
                if (myLocationMarker) {
                    myLocationMarker.setLatLng(userLocation, { icon: customIcon }); // Update marker position
                } else {
                    myLocationMarker = L.marker(userLocation, { icon: customIcon, draggable: false }).addTo(map);
                }
                myLocationMarker.bindPopup("<b>My Location</b>").openPopup();
                map.setView(userLocation, 14);
            }, function (error) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        console.error('User denied the request for Geolocation.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.error('Location information is unavailable.');
                        break;
                    case error.TIMEOUT:
                        console.error('The request to get user location timed out.');
                        break;
                    case error.UNKNOWN_ERROR:
                        console.error('An unknown error occurred.');
                        break;
                }
            }, options);
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
    }

    // Map Initialization
    var map = L.map('map', {
        zoomControl: false // Disable zoom control
    }).setView([14.3990, 120.9777], 14);

    // Tile Layer
    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    osm.addTo(map);

    // Variables Initialization
    var myLocationMarker;
    var myDestinationMarker;
    var fixedMarker;
    var routingControl;

    // Search Control
     var geocoder = L.control.geocoder(key, {
        fullWidth: 650,
        expanded: true,
        markers: true,
        url: 'https://api.locationiq.com/v1',
        defaultMarkGeocode: false,
        collapsed: false,
        placeholder: 'Search...',
    }).on('markgeocode', function (e) {
        // Handle the result
        var latlng = e.geocode.center;
        if (myDestinationMarker) {
            map.removeLayer(myDestinationMarker);
        }
        var latlng = e.geocode.center;
        map.setView(latlng, 14);
        myDestinationMarker = L.marker(latlng, { icon: customIcon, draggable: true }).addTo(map);
        myDestinationMarker.bindPopup("<b>My Destination</b>").openPopup();
        myDestinationMarker.on('dragend', function (e) {
            var newLatLng = e.target.getLatLng();
            myDestinationMarker.setLatLng(newLatLng);
            checkbtnStart();
        });
        checkbtnStart();
    }).addTo(map);

      // Re-sort control order so that geocoder is on top
      var geocoderEl = geocoder._container;
      geocoderEl.parentNode.insertBefore(geocoderEl, geocoderEl.parentNode.childNodes[0]);

      // Focus to geocoder input
      geocoder.focus();

    function zoomToMyLocationMarker() {
        if (myLocationMarker) {
            map.setView(myLocationMarker.getLatLng(), 14);
        } else {
            alert('Your location has not been determined yet.');
        }
    }

    function watchUserPosition() {
        console.log("Watching user's position...");
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(function (position) {
                var userLat = position.coords.latitude;
                var userLng = position.coords.longitude;
                var userLocation = L.latLng(userLat, userLng);

                // Remove existing marker
                if (myLocationMarker) {
                    map.removeLayer(myLocationMarker);
                    myLocationMarker = null;
                }

                // Create a new marker at the user's location
                myLocationMarker = L.marker(userLocation, { icon: customIcon }).addTo(map);

                // Create a circle overlay around the user's location
                if (circleMyLocation) {
                    map.removeLayer(circleMyLocation); // Remove the old circle
                }
                var circleOptions = {
                    color: '#020035', // Border color
                    fillColor: '#020035', // Fill color
                    fillOpacity: 0.3
                };
                circleMyLocation = L.circle(userLocation, { radius: 500, ...circleOptions }).addTo(map);

                // Zoom to user location marker
                map.setView(userLocation, 14);

                // Popup for user location marker
                myLocationMarker.bindPopup("<b>My Location</b>").openPopup();
            }, function (error) {
                console.error('Error getting user location:', error.message);
                alert('Error getting your location. Please make sure you allow location access.');
            }, { enableHighAccuracy: true, maximumAge: 0, timeout: 0 });

        } else {
            alert('Geolocation is not supported by your browser');
        }
    }

    // Function to start watching the user's position when the button is clicked
    function startWatchingUserPosition() {
        document.getElementById('btnStart').addEventListener('click', togglewatchUserPosition);
    }

    function clearRouting() {
        // Clear Routing Control
        if (routingControl) {
            map.removeControl(routingControl);
        }
    }

    // Event Listeners
    document.getElementById("btnLocate").addEventListener("click", zoomToMyLocationMarker);

    document.getElementById("btnStart").addEventListener("click", function () {
        if (routingControl) {
            // Stop Button Functionality
            map.removeControl(routingControl);
            if (circle) {
                map.removeLayer(circle); // Remove the circle
                circle = null; // Reset circle variable
            }
            myDestinationMarker.dragging.enable();
            if (fixedMarker) {
                map.removeLayer(fixedMarker);
                fixedMarker = null;
            }
            document.getElementById("btnStart").innerHTML = '<i class="fas fa-play"></i>';
            routingControl = null;
        } else {
            // Start Button Functionality
            if (myLocationMarker && myDestinationMarker) {
                clearRouting();

                routingControl = L.Routing.control({
                    waypoints: [
                        myLocationMarker.getLatLng(),
                        myDestinationMarker.getLatLng()
                    ],
                    routeWhileDragging: false, // Disable dragging while routing
                    createMarker: function () { return null; }, // Disable creation of new markers
                    show: false, // Hide the route line initially
                    addWaypoints: false, // Prevent adding additional waypoints
                }).addTo(map);

                // Zoom to user location marker
                map.setView(myLocationMarker.getLatLng(), 14);

                // Draggable markers for route start and end points
                fixedMarker = L.layerGroup([L.marker(myLocationMarker.getLatLng(), { icon: customIcon, draggable: false }), L.marker(myDestinationMarker.getLatLng(), { icon: customIcon, draggable: false })]).addTo(map);
                fixedMarker.eachLayer(function (layer) {
                    layer.on('dragend', function (e) {
                        var newLatLng = e.target.getLatLng();
                        myDestinationMarker.setLatLng(newLatLng);
                    });
                });

                document.getElementById("btnStart").innerHTML = '<i class="fas fa-stop"></i>';

                // Add circle with radius extending from myDestinationMarker to myLocationMarker
                var circleOptions = {
                    color: '#d4af37',
                    fillColor: '#d4af37',
                    fillOpacity: 0.3
                };
                var circleRadius = myLocationMarker.getLatLng().distanceTo(myDestinationMarker.getLatLng());
                circle = L.circle(myDestinationMarker.getLatLng(), { radius: circleRadius, ...circleOptions }).addTo(map);

                // Change the color of the circle representing myLocationMarker
                circleOptions.color = '#020035'; // New border color
                circleOptions.fillColor = '#020035'; // New fill color

                startWatchingUserPosition();
            }
        }
    });
});
