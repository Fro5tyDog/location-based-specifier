let intervalHandles = []; // Array to store interval handles for each entity

document.addEventListener('DOMContentLoaded', function () {
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', function () {
        console.log('A-Frame scene fully initialized');
        initializeMyApp();
        populateModelDropdown(); // Populate dropdown with models
        setupConfirmButton(); // Handle model confirmation
        setupCapturePositionButton(); // Handle position capture
        setupSavePositionButton(); // Handle position saving
        setupDistanceButtons();  // Handle min and max distance buttons
        setupSaveMinMaxDistanceButton(); // Handle saving distance
        setupDownloadDataButton(); // Handle data download
        setupTestButton(); // Handle test button logic
    });
});

let selectedModel = null; // Store the confirmed 3D model
let modelPositions = {};  // Store the captured position for each model
let modelDistances = {}; // New: Store distance settings
let places = staticLoadPlaces();  // Store original places (objects)

function initializeMyApp() {
    console.log('Initializing the app...');
    console.log('Places loaded: ', places);
    renderPlaces(places);
}

// Step 1: Populate the dropdown with 3D model names
function populateModelDropdown() {
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

// Step 2: Handle the confirm model button
// Update Position and Distance Display
function setupConfirmButton() {
    const confirmButton = document.getElementById('confirm-model-btn');
    confirmButton.addEventListener('click', function () {
        const dropdown = document.getElementById('model-select');
        selectedModel = dropdown.value;

        console.log(`Model confirmed: ${selectedModel}`);
        let displayText = '';
        let distanceText = '';

        // Display position data
        if (modelPositions[selectedModel]) {
            const { latitude, longitude } = modelPositions[selectedModel];
            displayText += `Position for ${selectedModel}: Latitude: ${latitude}, Longitude: ${longitude}. `;
        } else {
            displayText += `No position saved for ${selectedModel}. `;
        }

        // Display distance data
        let modelObject = places.find(place => place.name === selectedModel);
        if (modelObject) {
            const { min, max } = modelObject.visibilityRange;
            distanceText += `Min Distance: ${min}m, Max Distance: ${max}m.`;
        } else {
            distanceText += `No distance settings available for ${selectedModel}.`;
        }

        document.getElementById('position-display').textContent = displayText;
        document.getElementById('distance-display').textContent = distanceText;
    });
}

// Step 3: Capture the position and associate it with the selected model
function setupCapturePositionButton() {
    const capturePositionButton = document.getElementById('capture-position-btn');
    capturePositionButton.addEventListener('click', function () {
        if (!selectedModel) {
            document.getElementById('position-display').textContent = 'Please select a 3D model first.';
            document.getElementById('distance-display').textContent = '';
            return;
        }

        console.log('Capturing position for model:', selectedModel);
        getPlayerPosition(function (position) {
            if (position) {
                modelPositions[selectedModel] = position; // Save the position linked to the model
                const { latitude, longitude } = position;

                // Display the captured position in the position-display div
                document.getElementById('position-display').textContent = 
                    `Position captured for ${selectedModel}: Latitude: ${latitude}, Longitude: ${longitude}`;

                console.log(`Position captured for ${selectedModel}: Latitude: ${latitude}, Longitude: ${longitude}`);

                // Enable the "Save Position" button
                document.getElementById('save-position-btn').disabled = false;

                // Check if both Magnemite and Dragonite have positional data
                checkTestButtonAvailability();
            } else {
                document.getElementById('position-display').textContent = 'Unable to capture position. Please try again.';
                console.error('Failed to capture position.');
            }
        });
    });
}

// Step 4: Save the position linked to the model and update object data
function setupSavePositionButton() {
    const savePositionButton = document.getElementById('save-position-btn');
    savePositionButton.addEventListener('click', function () {
        if (!selectedModel || !modelPositions[selectedModel]) {
            console.log('No position to save.');
            return;
        }

        const { latitude, longitude } = modelPositions[selectedModel];

        // Update the lat/lng of the corresponding object in "places"
        let modelObject = places.find(place => place.name === selectedModel);
        if (modelObject) {
            modelObject.location.lat = latitude;
            modelObject.location.lng = longitude;
            console.log(`Updated ${selectedModel} with new position: Latitude: ${latitude}, Longitude: ${longitude}`);
        }

        const positionDisplay = document.getElementById('position-display');
        positionDisplay.textContent += ' (Position saved)';

        // Check again if both Magnemite and Dragonite have positional data
        checkTestButtonAvailability();
    });
}

// Step 5: Download the updated data as a JSON file
function setupDownloadDataButton() {
    const downloadButton = document.getElementById('download-data-btn');
    downloadButton.addEventListener('click', function () {
        const jsonData = JSON.stringify(places, null, 2); // Pretty-print JSON
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary anchor to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'model_positions.json';
        a.click();

        console.log('Data downloaded:', places);
    });
}

// Step 6: Enable the Test button if positional data for both models is available
// function checkTestButtonAvailability() {
//     const testButton = document.getElementById('test-button');

//     // Check if both Magnemite and Dragonite have positional data
//     if (modelPositions['Magnemite'] && modelPositions['Dragonite']) {
//         testButton.disabled = false; // Enable the Test button
//         console.log('Test button enabled.');
//     }
// }

// Step 1: Handle Distance Buttons
// Handle Distance Buttons with Default Values
function setupDistanceButtons() {
    const setMinDistanceButton = document.getElementById('set-min-distance-btn');
    const setMaxDistanceButton = document.getElementById('set-max-distance-btn');

    setMinDistanceButton.addEventListener('click', () => {
        const minDistance = parseFloat(document.getElementById('min-distance').value);
        if (selectedModel && !isNaN(minDistance)) {
            let modelObject = places.find(place => place.name === selectedModel);
            if (modelObject) {
                modelObject.visibilityRange.min = minDistance;
                console.log(`Updated ${selectedModel} with min distance: ${minDistance}`);
                document.getElementById('save-min-max-distance-btn').disabled = false;
                // Display the captured position in the position-display div
                document.getElementById('distance-display').textContent = 
                    `Min Distance: ${modelObject.visibilityRange.min}m, Max Distance: ${modelObject.visibilityRange.max}m.`;;
            }
        }
    });

    setMaxDistanceButton.addEventListener('click', () => {
        const MaxDistance = parseFloat(document.getElementById('max-distance').value);
        if (selectedModel && !isNaN(MaxDistance)) {
            let modelObject = places.find(place => place.name === selectedModel);
            if (modelObject) {
                modelObject.visibilityRange.max = maxDistance;
                console.log(`Updated ${selectedModel} with max distance: ${maxDistance}`);
                document.getElementById('save-min-max-distance-btn').disabled = false;
                // Display the captured position in the position-display div
                document.getElementById('distance-display').textContent = 
                    `Min Distance: ${modelObject.visibilityRange.min}m, Max Distance: ${modelObject.visibilityRange.max}m.`;;
            }
        }
    });
}

// Step 2: Handle Saving Min/Max Distance
function setupSaveMinMaxDistanceButton() {
    const saveMinMaxDistanceButton = document.getElementById('save-min-max-distance-btn');
    saveMinMaxDistanceButton.addEventListener('click', function () {
        if (selectedModel) {
            let modelObject = places.find(place => place.name === selectedModel);
            if (modelObject) {
                modelDistances[selectedModel] = {
                    min: modelObject.visibilityRange.min,
                    max: modelObject.visibilityRange.max
                };
                console.log(`Min/Max distance saved for ${selectedModel}.`);

                // Display the captured position in the position-display div
                document.getElementById('distance-display').textContent = 
                    `Min Distance: ${modelObject.visibilityRange.min}m, Max Distance: ${modelObject.visibilityRange.max}m.`;;

                // Disable the save button after saving
                saveMinMaxDistanceButton.disabled = true;

                // Check if the test button should be enabled
                checkTestButtonAvailability();
            }
        }
    });
}

// Step 3: Update Logic to Check if All Data is Saved
function checkTestButtonAvailability() {
    const testButton = document.getElementById('test-button');

    // Check if both Magnemite and Dragonite have positional data
    if (modelPositions.length == places.length) {
        testButton.disabled = false; // Enable the Test button
        console.log('Test button enabled.');
    }
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
        model.setAttribute('animation-mixer', 'clip: *; loop: repeat; timeScale: 1.1; clampWhenFinished: true; crossFadeDuration: 0.3');
        model.setAttribute('look-at', '[gps-camera]');
        model.setAttribute('scale', '0.15 0.15 0.15'); // Initial scale
        model.setAttribute('visible', 'false'); // Initially hidden

        // Wait for the model to fully load before making it visible
        model.addEventListener('model-loaded', () => {
            console.log(`${place.name} model loaded, now visible.`);
            model.setAttribute('visible', 'true');
        });

        // Append the model to the scene
        scene.appendChild(model);

        // Set up an interval to constantly check the player's distance and update visibility
        let intervalId = setInterval(() => {
            console.log('Checking player position...');
            getPlayerPosition((playerPosition) => {
                if (playerPosition) {
                    let distance = calculateDistance(playerPosition.latitude, playerPosition.longitude, latitude, longitude);
                    console.log(`Distance to ${place.name}: ${distance}m`);

                    // Check if the player is within the visibility range
                    if (distance > visibilityRange.min && distance < visibilityRange.max) {
                        console.log(`${place.name} is within range, showing model.`);
                        model.setAttribute('visible', 'true'); // Show the model
                    } else {
                        console.log(`${place.name} is out of range or too close, hiding model.`);
                        model.setAttribute('visible', 'false'); // Hide the model
                    }
                } else {
                    console.error('Player position could not be retrieved.');
                }
            });
        }, 1000); // Check every 1 second

        // Store the interval handle so we can clear it later
        intervalHandles.push(intervalId);
    });
}


// Function to clear all intervals when removing entities
function clearAllIntervals() {
    intervalHandles.forEach(intervalId => clearInterval(intervalId));
    intervalHandles = []; // Clear the stored handles
}

// Step 7: Set up the Test button to recreate entities based on saved positional data
function setupTestButton() {
    const testButton = document.getElementById('test-button');
    testButton.addEventListener('click', function () {
        console.log('Running test...');

        // Clear all intervals
        clearAllIntervals();

        // Remove only model-related <a-entity> elements (avoid light entities)
        const entities = document.querySelectorAll('a-entity');
        entities.forEach(entity => {
            // Only remove entities that have the 'gps-entity-place' or 'gltf-model' attributes
            if (entity.hasAttribute('gps-entity-place') || entity.hasAttribute('gltf-model')) {
                entity.parentNode.removeChild(entity);
            }
        });
        console.log('Model-related entities removed.');

        // Recreate <a-entity> elements using the updated positional data
        renderPlaces(places);
        console.log('Entities recreated with updated positional data.');
    });
}

// Simulate fetching the player's GPS position (real GPS is handled in getPlayerPosition)
function getPlayerPosition(callback) {
    if ("geolocation" in navigator) {
        console.log('Fetching player position using GPS...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log(`Player's current position: Latitude: ${latitude}, Longitude: ${longitude}`);
                callback({ latitude, longitude });
            },
            (error) => {
                console.error('Error retrieving player position', error);
                callback(null); // Handle error (e.g., no permission or GPS unavailable)
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000, // Cache position for 10 seconds
                timeout: 5000 // Wait up to 5 seconds for a response
            }
        );  
    } else {
        console.error('Geolocation not available in this browser.');
        callback(null); // Handle case when Geolocation is not supported
    }
}

// Function to calculate distance between two GPS coordinates (in meters)
function calculateDistance(lat1, lng1, lat2, lng2) {
    console.log(`Calculating distance between (${lat1}, ${lng1}) and (${lat2}, ${lng2})`);
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    console.log(`Calculated distance: ${distance} meters`);
    return distance;
}