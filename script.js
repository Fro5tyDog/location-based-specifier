document.addEventListener('DOMContentLoaded', function () {
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', function () {
        console.log('A-Frame scene fully initialized');
        initializeMyApp();
        populateModelDropdown(); // Call the function to populate dropdown
        setupConfirmButton(); // Set up the confirm button functionality
    });
});

let selectedModel = null; // Global variable to store the confirmed 3D model

function initializeMyApp() {
    console.log('Initializing the app...');
    let places = staticLoadPlaces();
    console.log('Places loaded: ', places);
    renderPlaces(places);
}

// Step 1: Populate the dropdown with 3D model names
function populateModelDropdown() {
    let places = staticLoadPlaces(); // Load the places (3D models)
    let dropdown = document.getElementById('model-select');

    // Clear existing options
    dropdown.innerHTML = '';

    // Add options to the dropdown
    places.forEach((place) => {
        let option = document.createElement('option');
        option.value = place.name;
        option.textContent = place.name;
        dropdown.appendChild(option);
    });

    console.log('Dropdown populated with model names:', places.map(place => place.name));
}

// Step 2: Set up the confirm button functionality
function setupConfirmButton() {
    const confirmButton = document.getElementById('confirm-model-btn');
    confirmButton.addEventListener('click', function () {
        const dropdown = document.getElementById('model-select');
        selectedModel = dropdown.value; // Store the selected model

        console.log(`Model confirmed: ${selectedModel}`);

        // Future logic can be added here to use the confirmed model
    });
}

function staticLoadPlaces() {
    console.log('Loading static places...');
    return [
        {
            name: 'Magnemite',
            filePath: './assets/magnemite/scene.gltf',
            location: { 
                lat: 1.3087085765187283,
                lng: 103.85002403454892,
            },
            visibilityRange: { min: 0, max: 100 }, // Appear when within 10-100m
        },
        {
            name: 'Dragonite',
            filePath: './assets/dragonite/scene.gltf',
            location: { 
                lat: 1.306656407996899,
                lng: 103.85012141436107,
            },
            visibilityRange: { min: 10, max: 150 }, // Custom distance range
        },
    ];
}

function renderPlaces(places) {
    let scene = document.querySelector('a-scene');
    console.log('Rendering places...');
    
    places.forEach((place) => {
        let latitude = place.location.lat;
        let longitude = place.location.lng;
        let filePath = place.filePath;
        let visibilityRange = place.visibilityRange;
        
        console.log(`Creating model for: ${place.name} at (${latitude}, ${longitude}) with visibility range [${visibilityRange.min}m - ${visibilityRange.max}m]`);

        // Create a new entity for each place
        let model = document.createElement('a-entity');
        model.setAttribute('gps-entity-place', `latitude: ${latitude}; longitude: ${longitude};`);
        model.setAttribute('gltf-model', `${filePath}`);
        model.setAttribute('rotation', '0 0 0');
        model.setAttribute('animation-mixer', '');
        model.setAttribute('look-at', '[gps-camera]');
        model.setAttribute('scale', '0.15 0.15 0.15'); // Initial scale
        model.setAttribute('visible', 'false'); // Initially hidden

        // Append the model to the scene
        scene.appendChild(model);

        // Constantly check the player's distance and update visibility
        setInterval(() => {
            console.log('Checking player position...');
            getPlayerPosition((playerPosition) => {
                if (playerPosition) {
                    let distance = calculateDistance(playerPosition.latitude, playerPosition.longitude, latitude, longitude);
                    console.log(`Distance to ${place.name}: ${distance}m`);

                    if (distance > visibilityRange.min && distance < visibilityRange.max) {
                        console.log(`${place.name} is within range, showing model.`);
                        model.setAttribute('visible', 'true'); // Show the model
                    } else {
                        console.log(`${place.name} is out of range, hiding model.`);
                        model.setAttribute('visible', 'false'); // Hide the model
                    }
                } else {
                    console.error('Player position could not be retrieved.');
                }
            });
        }, 1000); // Check every 1 second
    });
}
