
// Make map and markers global at the top of script section
let map;
let sampleData = [];
let locationMarkers = [];

// Add a global variable to track the user location marker
let userLocationMarker = null;

// Function to toggle the map legend visibility
function toggleLegend() {
    const legend = document.querySelector('.map-legend');
    const toggleButton = document.querySelector('.legend-toggle');

    legend.classList.toggle('hidden');

    // Show/hide the toggle button based on legend visibility
    if (legend.classList.contains('hidden')) {
        toggleButton.style.display = 'none';
    }
}

// Function to update features based on current zoom
function updateFeatures(filtered = false) {
    // Group points by location (only for non-exact locations)
    const locationGroups = {};
    const selectedDistrict = document.getElementById('districtFilter').value;
    const selectedVillage = document.getElementById('villageFilter').value;
    const selectedPriority = document.getElementById('priorityFilter').value;

    sampleData.forEach((item, index) => {
        if (item.lat && item.lon && !item["ზუსტი ადგილმდებარეობა"]?.trim()) {
            // Apply filters
            if (filtered) {
                const itemDistrict = item['რაიონი']?.trim() || '';
                const itemVillage = item['სოფელი']?.trim() || '';
                const itemPriority = item['პრიორიტეტი']?.trim() || '';

                const matchesDistrict = !selectedDistrict || itemDistrict === selectedDistrict;
                const matchesVillage = !selectedVillage || itemVillage === selectedVillage;
                const matchesPriority = !selectedPriority || itemPriority === selectedPriority;

                if (!matchesDistrict || !matchesVillage || !matchesPriority) return;
            }

            let color;
            const status = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"];

            if (status === "მომლოდინე") {
                color = '#e74c3c';
            } else if (status === "აღმოუჩინეს დახმარება") {
                color = '#2ecc71';
            } else {
                color = '#95a5a6';
            }

            const key = `${item.lat.toFixed(4)},${item.lon.toFixed(4)}`;
            if (!locationGroups[key]) {
                locationGroups[key] = [];
            }
            locationGroups[key].push({
                item,
                index,
                fillColor: color,
                strokeColor: color
            });
        }
    });

    // Create polygon features
    return Object.values(locationGroups).flatMap(group => {
        // For single items, use normal size; for groups make them smaller
        const isGroup = group.length > 1;
        const sizeMultiplier = isGroup ? 0.7 : 1.0; // 30% smaller when in a group

        return group.map((entry, groupIndex) => {
            const { item, index, fillColor, strokeColor } = entry;
            const baseRadius = calculatePolygonSize(map);

            // Only apply offset if we have more than one item at this location
            let offsetLon = item.lon;
            let offsetLat = item.lat;

            if (isGroup) {
                const offset = calculatePointOffset(groupIndex, baseRadius);
                offsetLon = item.lon + offset.x;
                offsetLat = item.lat + offset.y;
            }

            return {
                type: 'Feature',
                properties: {
                    id: index,
                    ...item,
                    fillColor,
                    strokeColor,
                    inGroup: isGroup
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [createPolygonCoordinates(map, offsetLon, offsetLat, 6, sizeMultiplier)]
                }
            };
        });
    });
}

// Add this function before other scripts
function togglePanel() {
    const panel = document.getElementById('bottom-panel');
    const map = document.getElementById('map');
    const isHidden = panel.style.display === 'none' || !panel.style.display;

    panel.style.display = isHidden ? 'block' : 'none';
    map.classList.toggle('panel-visible');

    // Trigger map resize to ensure proper rendering
    if (window.map) {
        window.map.resize();
    }
}

// Calculate polygon size based on zoom level with adjusted sizes
function calculatePolygonSize(map) {
    // Get the current zoom level
    const zoom = map.getZoom();

    // Base size reduced by half for zoom out view
    const baseSize = 0.25; // Half of previous value (0.5)

    // Steeper reduction rate for zoomed in view
    const zoomFactor = Math.pow(0.5, zoom - 5);

    // Minimum size is 1/10 of previous minimum
    const minSize = 0.005; // 1/10 of previous value (0.05)
    // Maximum size is half of previous maximum
    const maxSize = 0.4;   // Half of previous value (0.8)

    // Calculate size based on zoom level with constraints
    return Math.min(maxSize, Math.max(minSize, baseSize * zoomFactor));
}

// Function to create polygon coordinates around a center point
function createPolygonCoordinates(map, centerLng, centerLat, sides = 6, sizeMultiplier = 1) {
    // Get a much larger radius based on zoom level
    const radius = calculatePolygonSize(map) * sizeMultiplier;

    // Use fixed rotation based on coordinates instead of random
    const fixedRotation = Math.atan2(centerLat, centerLng);

    const coordinates = [];
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides + fixedRotation;
        const lng = centerLng + radius * Math.cos(angle);
        const lat = centerLat + radius * Math.sin(angle);
        coordinates.push([lng, lat]);
    }
    // Close the polygon by repeating the first point
    coordinates.push(coordinates[0]);
    return coordinates;
}

// Function to detect if a string is a URL
function isURL(str) {
    if (str.includes('https://')) return true;

    if (!str || typeof str !== 'string') return false;
    str = str.trim();
    // Simple regex to match common URL patterns
    const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
    return urlPattern.test(str);
}

// Function to format values, converting URLs to links
function formatValue(value) {
    if (!value) return '-';
    return isURL(value) ? `<a href="${value}" target="_blank">${value}</a>` : value;
}

// Create HTML content for the tooltip without making assumptions about data
function createTooltipHTML(feature, instanceId) {
    const data = feature.properties;

    // Create wrapper with a close button
    let html = `<div class="info-card">
                <button class="close-button" onclick="closeTooltip(${instanceId})">✕</button>`;

    // Get all keys except internal ones
    const keys = Object.keys(data).filter(key =>
        !['id', 'fillColor', 'strokeColor'].includes(key)
    );

    // Process all fields
    for (const key of keys) {
        let value = data[key];

        // Only special handling for coordinates (as allowed)
        if (key === "lat" || key === "lon") {
            value = typeof value === 'number' ? value.toFixed(4) : value;
        }

        // Convert URLs to links (not making assumptions, just basic URL detection)
        if (value && typeof value === 'string' && isURL(value)) {
            value = `<a href="${value}" target="_blank">${value}</a>`;
        }
        // Handle null or undefined
        else if (value === null || value === undefined) {
            value = "";
        }

        html += `<p><span class="info-label">${key}:</span> <span class="info-value">${value}</span></p>`;
    }

    html += `</div>`;
    return html;
}

// Function to close a tooltip
function closeTooltip(id) {
    if (window.tippyInstances && window.tippyInstances[id]) {
        window.tippyInstances[id].hide();
    }
}

// Add highlightPolygon function before map initialization
function highlightPolygon(map, index) {
    // Reset all polygons
    map.setPaintProperty('location-polygons', 'fill-opacity', [
        'case',
        ['==', ['get', 'id'], index],
        0.9, // highlighted opacity
        0.6  // default opacity
    ]);

    // Update stroke color and width for highlighted polygon
    map.setPaintProperty('location-polygons-outline', 'line-color', [
        'case',
        ['==', ['get', 'id'], index],
        '#000000', // black stroke for highlighted
        ['get', 'strokeColor'] // default stroke color
    ]);

    map.setPaintProperty('location-polygons-outline', 'line-width', [
        'case',
        ['==', ['get', 'id'], index],
        5,    // highlighted width
        2     // default width
    ]);

    // Remove highlight from all pins
    document.querySelectorAll('.map-pin').forEach(pin => {
        pin.classList.remove('highlighted');
    });

    // Add highlight to the selected pin if it exists
    locationMarkers.forEach(marker => {
        if (marker.id === index) {
            const pinElement = marker.marker.getElement().querySelector('.map-pin');
            if (pinElement) {
                pinElement.classList.add('highlighted');
            }
        }
    });

    // Remove highlight from all cards
    document.querySelectorAll('.card').forEach(c => c.classList.remove('highlighted-card'));

    // Add highlight to selected card
    document.querySelector(`.card[data-index="${index}"]`)?.classList.add('highlighted-card');
}

// Add this function before createPolygonCoordinates
function calculatePointOffset(index, baseRadius) {
    // Create a honeycomb pattern for hexagons
    // In a honeycomb, each hexagon can have up to 6 neighbors

    // Make hexagons 30% smaller when they're part of a group
    const scaledRadius = baseRadius * 0.7; // 30% smaller

    if (index === 0) {
        // First item is centered
        return { x: 0, y: 0 };
    }

    // Determine ring and position in ring using hexagonal grid coordinates
    // First ring starts at index 1 and has 6 positions
    // Second ring starts at index 7 and has 12 positions, etc.
    let ring = 1;
    let remainingIndex = index - 1;

    // Find which ring this index belongs to
    while (remainingIndex >= 6 * ring) {
        remainingIndex -= 6 * ring;
        ring++;
    }

    // Position within the current ring
    const positionInRing = remainingIndex;

    // Angle within the ring (60 degree segments)
    const angle = (positionInRing * Math.PI / 3) + Math.PI / 6; // 60 degrees per segment, offset 30 degrees

    // Distance from center increases with ring number
    // Use 1.5 * scaledRadius for optimal hexagon packing (this is the key for perfect tiling)
    const distance = ring * 1.5 * scaledRadius;

    return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
    };
}

// Add these functions before map initialization
function initializeFilters(data) {
    // Trim whitespace and filter out empty values
    const districts = [...new Set(data.map(item => item['რაიონი']?.trim()).filter(Boolean))];
    const villages = [...new Set(data.map(item => item['სოფელი']?.trim()).filter(Boolean))];
    const priorities = [...new Set(data.map(item => item['პრიორიტეტი']?.trim()).filter(Boolean))];

    const districtSelect = document.getElementById('districtFilter');
    const villageSelect = document.getElementById('villageFilter');
    const prioritySelect = document.getElementById('priorityFilter');

    // Clear existing options (except the first one)
    while (districtSelect.options.length > 1) {
        districtSelect.remove(1);
    }

    while (villageSelect.options.length > 1) {
        villageSelect.remove(1);
    }

    while (prioritySelect.options.length > 1) {
        prioritySelect.remove(1);
    }

    districts.sort().forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
    });

    villages.sort().forEach(village => {
        const option = document.createElement('option');
        option.value = village;
        option.textContent = village;
        villageSelect.appendChild(option);
    });

    priorities.sort().forEach(priority => {
        const option = document.createElement('option');
        option.value = priority;
        option.textContent = priority;
        prioritySelect.appendChild(option);
    });

    // Add filter change handlers
    districtSelect.addEventListener('change', applyFilters);
    villageSelect.addEventListener('change', applyFilters);
    prioritySelect.addEventListener('change', applyFilters);
}

// Update applyFilters function with fixed filtering logic
function applyFilters() {
    if (!sampleData.length || !map) return;

    const selectedDistrict = document.getElementById('districtFilter').value;
    const selectedVillage = document.getElementById('villageFilter').value;
    const selectedPriority = document.getElementById('priorityFilter').value;

    // Filter cards
    document.querySelectorAll('.card').forEach(card => {
        const index = card.getAttribute('data-index');
        const item = sampleData[index];

        // Trim values before comparison
        const itemDistrict = item['რაიონი']?.trim() || '';
        const itemVillage = item['სოფელი']?.trim() || '';
        const itemPriority = item['პრიორიტეტი']?.trim() || '';

        const matchesDistrict = !selectedDistrict || itemDistrict === selectedDistrict;
        const matchesVillage = !selectedVillage || itemVillage === selectedVillage;
        const matchesPriority = !selectedPriority || itemPriority === selectedPriority;

        card.style.display = (matchesDistrict && matchesVillage && matchesPriority) ? 'block' : 'none';
    });

    // Update markers visibility
    locationMarkers.forEach(({ marker, properties }) => {
        // Trim values before comparison
        const propertyDistrict = properties['რაიონი']?.trim() || '';
        const propertyVillage = properties['სოფელი']?.trim() || '';
        const propertyPriority = properties['პრიორიტეტი']?.trim() || '';

        const matchesDistrict = !selectedDistrict || propertyDistrict === selectedDistrict;
        const matchesVillage = !selectedVillage || propertyVillage === selectedVillage;
        const matchesPriority = !selectedPriority || propertyPriority === selectedPriority;

        marker.getElement().style.display = (matchesDistrict && matchesVillage && matchesPriority) ? 'block' : 'none';
    });

    // Update polygon features
    const features = [];
    sampleData.forEach((item, index) => {
        if (item.lat && item.lon && !item["ზუსტი ადგილმდებარეობა"]?.trim()) {
            // Trim values before comparison
            const itemDistrict = item['რაიონი']?.trim() || '';
            const itemVillage = item['სოფელი']?.trim() || '';
            const itemPriority = item['პრიორიტეტი']?.trim() || '';

            const matchesDistrict = !selectedDistrict || itemDistrict === selectedDistrict;
            const matchesVillage = !selectedVillage || itemVillage === selectedVillage;
            const matchesPriority = !selectedPriority || itemPriority === selectedPriority;

            if (matchesDistrict && matchesVillage && matchesPriority) {
                let color;
                const status = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"];

                if (status === "მომლოდინე") {
                    color = '#e74c3c';
                } else if (status === "აღმოუჩინეს დახმარება") {
                    color = '#2ecc71';
                } else {
                    color = '#95a5a6';
                }

                features.push({
                    type: 'Feature',
                    properties: {
                        id: index,
                        ...item,
                        fillColor: color,
                        strokeColor: color
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [createPolygonCoordinates(map, item.lon, item.lat)]
                    }
                });
            }
        }
    });

    // Update the source data
    map.getSource('locations').setData({
        type: 'FeatureCollection',
        features: features
    });
}

// Initialize map after data is loaded
d3.csv("https://docs.google.com/spreadsheets/d/e/2PACX-1vRfK0UcHgAiwmJwTSWe2dxyIwzLFtS2150qbKVVti1uVfgDhwID3Ec6NLRrvX4AlABpxneejy1-lgTF/pub?gid=0&single=true&output=csv")
    .then(function (data) {
        // Store data globally with trimmed string values
        sampleData = data.map(d => {
            // Create a new object with all string values trimmed
            const trimmedObj = {};

            // Process each field: trim strings, convert numbers
            Object.keys(d).forEach(key => {
                if (typeof d[key] === 'string') {
                    trimmedObj[key] = d[key].trim();
                } else {
                    trimmedObj[key] = d[key];
                }
            });

            // Add lat/lon as numbers
            return {
                ...trimmedObj,
                lat: trimmedObj.lat ? +trimmedObj.lat : null,  // Convert to number if exists
                lon: trimmedObj.lon ? +trimmedObj.lon : null   // Convert to number if exists
            };
        });

        // Calculate bounds of all points
        const bounds = sampleData.reduce((bounds, item) => {
            if (item.lat && item.lon) {
                bounds.north = Math.max(bounds.north, item.lat);
                bounds.south = Math.min(bounds.south, item.lat);
                bounds.east = Math.max(bounds.east, item.lon);
                bounds.west = Math.min(bounds.west, item.lon);
            }
            return bounds;
        }, { north: -90, south: 90, east: -180, west: 180 });

        // Define standard map style
        const standardStyle = {
            version: 8,
            sources: {
                'osm': {
                    type: 'raster',
                    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }
            },
            layers: [{
                id: 'osm-tiles',
                type: 'raster',
                source: 'osm',
                minzoom: 0,
                maxzoom: 19
            }]
        };

        // Populate sidebar cards
        const cardsContainer = document.getElementById('cards-container');
        sampleData.forEach((item, index) => {
            const card = document.createElement('div');
            card.setAttribute('data-index', index);

            // Determine status class
            let statusClass = 'empty-status';
            const status = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"];
            if (status === "მომლოდინე") {
                statusClass = 'pending';
            } else if (status === "აღმოუჩინეს დახმარება") {
                statusClass = 'completed';
            }

            card.className = `card ${statusClass}`;

            const needsTitle = item[`საჭიროება(ები)
(საკვები, მედიკამენტები, ევაკუაცია, ექიმი, საწვავი, დათოლვა, სხვა)    `];

            // Get first item's keys to determine structure
            const keys = Object.keys(item).filter(key =>
                !['id', 'fillColor', 'strokeColor', 'lat', 'lon'].includes(key)
            );

            let cardContent = `
                        <div class="card-header">
                            <h3 class="card-title">${needsTitle || [keys[0]] || ''}</h3>
                            <span class="expand-icon">▼</span>
                        </div>
                        <div class="card-content">
                            ${keys.slice(1).map(key => `
                                <p><strong>${key}:</strong> ${formatValue(item[key])}</p>
                            `).join('')}
                        </div>`;

            card.innerHTML = cardContent;

            // Add click handlers
            card.addEventListener('click', (e) => {
                // Toggle expansion
                card.classList.toggle('expanded');

                // If has coordinates and isn't clicking to expand
                if (item.lat && item.lon && !e.target.closest('.card-content')) {
                    map.flyTo({
                        center: [item.lon, item.lat],
                        zoom: 12
                    });
                    highlightPolygon(map, index);
                }
            });

            cardsContainer.appendChild(card);
        });

        // Initialize filters
        initializeFilters(sampleData);

        // Initialize the map
        map = new maplibregl.Map({
            container: 'map',
            style: standardStyle,
            bounds: [
                [bounds.west - 0.1, bounds.south - 0.1], // Add padding to bounds
                [bounds.east + 0.1, bounds.north + 0.1]
            ],
            fitBoundsOptions: {
                padding: 50
            }
        });

        // Wait for the map to load
        map.on('load', function () {
            // Create markers first and only once
            const markers = [];
            sampleData.forEach((item, index) => {
                if (item.lat && item.lon && item["ზუსტი ადგილმდებარეობა"]?.trim()) {
                    let color;
                    const status = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"];

                    if (status === "მომლოდინე") {
                        color = '#e74c3c';  // Red
                    } else if (status === "აღმოუჩინეს დახმარება") {
                        color = '#2ecc71';  // Green
                    } else {
                        color = '#95a5a6';  // Gray
                    }

                    // Create container element first
                    const container = document.createElement('div');
                    container.className = 'map-pin-container';

                    // Create pin element
                    const el = document.createElement('div');
                    el.className = 'map-pin';
                    el.style.setProperty('--pin-color', color); // Use CSS variable for color
                    el.style.pointerEvents = 'auto'; // Make sure pin receives events

                    container.appendChild(el);

                    // Add shadow element to the pin
                    const shadowEl = document.createElement('div');
                    shadowEl.className = 'map-pin-shadow';
                    el.appendChild(shadowEl);

                    const marker = new maplibregl.Marker({
                        element: container,
                        anchor: 'bottom',
                        offset: [0, 0] // No offset needed with our new design
                    }).setLngLat([item.lon, item.lat])
                        .addTo(map);

                    // Add direct click handler to the pin (not the container)
                    el.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        highlightPolygon(map, index);

                        // Get the container's position first
                        const containerRect = this.parentNode.getBoundingClientRect();
                        const pinRect = this.getBoundingClientRect();

                        // Position tooltip above the rotated pin
                        const clickX = containerRect.left + (containerRect.width / 2);
                        const clickY = containerRect.top - 20; // Adjust for the 45-degree rotated pin

                        // Create feature-like structure for tooltip
                        const feature = {
                            properties: item
                        };

                        const tooltipContent = document.createElement('div');
                        tooltipContent.innerHTML = createTooltipHTML(feature, index);

                        // Create or update marker element to attach tooltip to
                        let markerEl = document.getElementById(`marker-${index}`);
                        if (!markerEl) {
                            markerEl = document.createElement('div');
                            markerEl.id = `marker-${index}`;
                            markerEl.style.position = 'absolute';
                            markerEl.style.top = `${clickY}px`;
                            markerEl.style.left = `${clickX}px`;
                            markerEl.style.width = '1px';
                            markerEl.style.height = '1px';
                            document.body.appendChild(markerEl);
                        } else {
                            markerEl.style.top = `${clickY}px`;
                            markerEl.style.left = `${clickX}px`;
                        }

                        // Hide any existing tooltips
                        Object.values(window.tippyInstances || {}).forEach(instance => {
                            if (instance && instance.hide) {
                                instance.hide();
                                if (instance.destroy) {
                                    instance.destroy();
                                }
                            }
                        });

                        // Create new tooltip instance
                        window.tippyInstances = window.tippyInstances || {};
                        window.tippyInstances[index] = tippy(markerEl, {
                            content: tooltipContent,
                            allowHTML: true,
                            interactive: true,
                            theme: 'light',
                            placement: 'top',
                            trigger: 'manual',
                            appendTo: document.body,
                            showOnCreate: true,
                            hideOnClick: false,
                            offset: [0, 15],
                            distance: 15,
                            arrow: true,
                            popperOptions: {
                                strategy: 'fixed',
                                modifiers: [
                                    {
                                        name: 'preventOverflow',
                                        options: {
                                            boundary: 'viewport',
                                        }
                                    }
                                ]
                            },
                            interactiveBorder: 30,
                            zIndex: 9999
                        });

                        window.tippyInstances[index].show();
                    };

                    // Store marker with its metadata for filtering
                    markers.push({
                        marker,
                        id: index,
                        properties: item
                    });
                }
            });

            // Store markers globally for later access
            locationMarkers = markers;

            // Initial features
            const features = updateFeatures();

            // Add source with features
            map.addSource('locations', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: features
                }
            });

            // Add a layer for the polygons
            map.addLayer({
                id: 'location-polygons',
                type: 'fill',
                source: 'locations',
                paint: {
                    'fill-color': ['get', 'fillColor'],
                    'fill-opacity': 0.6
                }
            });

            // Add an outline layer for the polygons
            map.addLayer({
                id: 'location-polygons-outline',
                type: 'line',
                source: 'locations',
                paint: {
                    'line-color': ['get', 'strokeColor'],
                    'line-width': 2
                }
            });

            // Make tippyInstances available globally so the close button can access it
            window.tippyInstances = {};

            // Add map event handlers
            addMapEventHandlers();

            // Define the legend element variable
            const legendElement = document.querySelector('.map-legend');

            // Add responsiveness for the legend
            function updateLegendPosition() {
                if (window.innerWidth <= 768) {
                    // On mobile, move the legend to fixed bottom position
                    legendElement.style.bottom = '70px';
                    legendElement.style.left = '32%';
                    legendElement.style.transform = 'translateX(-50%)';
                } else {
                    // On desktop, restore the original position
                    legendElement.style.bottom = '80px';
                    legendElement.style.left = '10px';
                    legendElement.style.transform = 'none';
                }
            }

            // Call it initially
            updateLegendPosition();

            // Update on resize
            window.addEventListener('resize', updateLegendPosition);
        });
    })
    .catch(function (error) {
        console.error("Error loading the data:", error);
    });

function toggleTabs() {
    const panel = document.getElementById('tabs-panel');
    const map = document.getElementById('map');
    const isHidden = panel.style.display === 'none' || !panel.style.display;

    panel.style.display = isHidden ? 'block' : 'none';
    map.classList.toggle('panel-visible');

    if (window.map) {
        window.map.resize();
    }
}

// Replace the old tab switching code with this one
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;

        // Remove active class from all buttons and contents
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const content = document.getElementById(targetTab);
        if (content) {
            content.classList.add('active');
        }
    });
});

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-visible');
}

// Function to handle showing user's current location
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
                    anchor: 'center'
                })
                    .setLngLat([userLng, userLat])
                    .addTo(map);

                // Fly to the user's location
                map.flyTo({
                    center: [userLng, userLat],
                    zoom: 13,
                    duration: 1500
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
                maximumAge: 0
            }
        );
    } else {
        // Geolocation not supported by the browser
        alert('თქვენი ბრაუზერი არ უჭერს მხარს გეოლოკაციას');
    }
}

function toggleSatellite() {
    const button = document.querySelector('.satellite-toggle');
    button.classList.toggle('active');

    // Define the map styles
    const standardStyle = {
        version: 8,
        sources: {
            'osm': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
        },
        layers: [{
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
        }]
    };

    const satelliteStyle = {
        version: 8,
        sources: {
            'satellite': {
                type: 'raster',
                tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            }
        },
        layers: [{
            id: 'satellite-tiles',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 19
        }]
    };

    // Save the current center and zoom
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    // Toggle between map styles
    if (button.classList.contains('active')) {
        map.setStyle(satelliteStyle);
    } else {
        map.setStyle(standardStyle);
    }

    // After the style is loaded, restore center and zoom and reapply any custom layers
    map.once('styledata', function () {
        map.setCenter(currentCenter);
        map.setZoom(currentZoom);

        // Re-add data sources and layers if needed
        if (sampleData.length > 0) {
            // Recreate polygon source and layers
            const features = updateFeatures(true);

            if (!map.getSource('locations')) {
                map.addSource('locations', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: features
                    }
                });
            } else {
                map.getSource('locations').setData({
                    type: 'FeatureCollection',
                    features: features
                });
            }

            // Re-add layers if they don't exist
            if (!map.getLayer('location-polygons')) {
                map.addLayer({
                    id: 'location-polygons',
                    type: 'fill',
                    source: 'locations',
                    paint: {
                        'fill-color': ['get', 'fillColor'],
                        'fill-opacity': 0.6
                    }
                });
            }

            if (!map.getLayer('location-polygons-outline')) {
                map.addLayer({
                    id: 'location-polygons-outline',
                    type: 'line',
                    source: 'locations',
                    paint: {
                        'line-color': ['get', 'strokeColor'],
                        'line-width': 2
                    }
                });
            }

            // Reapply any map event handlers
            addMapEventHandlers();
        }
    });
}

// Helper function to add event handlers to the map
function addMapEventHandlers() {
    // Add click event for polygons
    map.on('click', 'location-polygons', function (e) {
        e.preventDefault(); // Prevent map click from triggering
        if (e.features.length > 0) {
            const feature = e.features[0];
            const id = feature.properties.id;
            highlightPolygon(map, id);

            // Get click position - adjust to match similar positioning as the pins
            const clickX = e.point.x;
            const clickY = e.point.y - 15; // Position higher to match pin tooltip placement

            // Create tooltip content with the ID for close button reference
            const tooltipContent = document.createElement('div');
            tooltipContent.innerHTML = createTooltipHTML(feature, id);

            // Create marker element to attach tooltip to
            let marker = document.getElementById(`marker-${id}`);
            if (!marker) {
                marker = document.createElement('div');
                marker.id = `marker-${id}`;
                marker.style.position = 'absolute';
                marker.style.top = `${clickY}px`;
                marker.style.left = `${clickX}px`;
                marker.style.width = '1px';
                marker.style.height = '1px';
                document.body.appendChild(marker);
            } else {
                marker.style.top = `${clickY}px`;
                marker.style.left = `${clickX}px`;
            }

            // Hide any existing tooltips first to ensure only one is shown at a time
            Object.values(window.tippyInstances || {}).forEach(instance => {
                if (instance && instance.hide) {
                    instance.hide();
                }
            });

            // Create tippy instance
            setTimeout(() => {
                // Create new instance on the marker element
                window.tippyInstances = window.tippyInstances || {};
                window.tippyInstances[id] = tippy(marker, {
                    content: tooltipContent,
                    allowHTML: true,
                    interactive: true,
                    theme: 'light',
                    placement: 'top',
                    trigger: 'manual',
                    appendTo: document.body,
                    showOnCreate: true,
                    hideOnClick: false,
                    offset: [0, 15],
                    distance: 15,
                    arrow: true,
                    popperOptions: {
                        strategy: 'fixed',
                        modifiers: [
                            {
                                name: 'preventOverflow',
                                options: {
                                    boundary: 'viewport',
                                }
                            }
                        ]
                    },
                    interactiveBorder: 30,
                    zIndex: 9999
                });

                // Show the tooltip
                if (window.tippyInstances[id] && window.tippyInstances[id].show) {
                    window.tippyInstances[id].show();
                }
            }, 0);
        }
    });

    // Change cursor on polygon hover
    map.on('mouseenter', 'location-polygons', function (e) {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'location-polygons', function (e) {
        map.getCanvas().style.cursor = '';
    });

    // Update tooltip positions when map moves
    map.on('move', function () {
        // Hide click tooltips
        Object.values(window.tippyInstances || {}).forEach(instance => {
            if (instance && instance.state && instance.state.isVisible) {
                instance.hide();
            }
        });
    });

    // Update polygon sizes when zoom changes
    map.on('zoom', function () {
        // Update features with new polygon sizes, passing current filter state
        const updatedFeatures = updateFeatures(true);

        // Update the source data
        map.getSource('locations').setData({
            type: 'FeatureCollection',
            features: updatedFeatures
        });
    });

    // Add click handler for map to reset highlights and close tooltips when clicking elsewhere
    map.on('click', (e) => {
        if (!e.defaultPrevented) { // Only if not clicking on a polygon
            // Reset all pin highlights
            document.querySelectorAll('.map-pin').forEach(pin => {
                pin.classList.remove('highlighted');
            });

            highlightPolygon(map, -1); // Pass invalid index to reset all

            // Close any open tooltips
            Object.values(window.tippyInstances || {}).forEach(instance => {
                if (instance && instance.hide) {
                    instance.hide();
                }
            });
        }
    });
}
