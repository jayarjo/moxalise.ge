// Make map and markers global at the top of script section
let map;
let sampleData = [];
let locationMarkers = [];

// Add a global variable to track the user location marker
let userLocationMarker = null;

// Add global variables to track custom dropdowns
let customDropdowns = {};

// Functions for modal help request
function openHelpModal() {
    const modal = document.getElementById('help-modal');
    const mobileSidebarButton = document.querySelector('.mobile-sidebar-button');

    // Hide the mobile sidebar button
    if (mobileSidebarButton) {
        mobileSidebarButton.style.display = 'none';
    }

    modal.style.display = 'block';

    // Add a small delay before adding the active class for animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);

    // Prevent scrolling of the background content
    document.body.style.overflow = 'hidden';
}

function closeHelpModal() {
    const modal = document.getElementById('help-modal');
    const mobileSidebarButton = document.querySelector('.mobile-sidebar-button');

    modal.classList.remove('active');

    // Add a small delay before hiding the modal completely for animation
    setTimeout(() => {
        modal.style.display = 'none';

        // Re-enable scrolling
        document.body.style.overflow = '';

        // Show the mobile sidebar button again
        if (mobileSidebarButton) {
            mobileSidebarButton.style.display = '';
        }
    }, 300);
}

// Close modal if user clicks outside the modal content
window.addEventListener('click', function (event) {
    const helpModal = document.getElementById('help-modal');
    if (event.target === helpModal) {
        closeHelpModal();
    }

    const notificationModal = document.getElementById('notification-modal');
    if (event.target === notificationModal) {
        closeNotificationModal();
    }
});

// Function to create a custom dropdown with distribution data
function createCustomDropdown(elementId, options, counts, placeholder, onChange) {
    // Get the original select element
    const originalSelect = document.getElementById(elementId);
    if (!originalSelect) return null;

    // Get parent container
    const parentContainer = originalSelect.parentNode;

    // Hide the original select element
    originalSelect.style.display = 'none';

    // Create custom dropdown container
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'custom-dropdown';
    dropdownContainer.setAttribute('data-for', elementId);

    // Create header
    const header = document.createElement('div');
    header.className = 'custom-dropdown-header';

    const selectedText = document.createElement('span');
    selectedText.className = 'custom-dropdown-selected';
    selectedText.textContent = placeholder;

    const icon = document.createElement('span');
    icon.className = 'custom-dropdown-icon';
    icon.textContent = '▼';

    header.appendChild(selectedText);
    header.appendChild(icon);

    // Create dropdown menu
    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu';

    // Calculate the maximum count for scaling the distribution bars
    const maxCount = Math.max(...Object.values(counts));

    // Add "All" option at the top
    const allItem = document.createElement('div');
    allItem.className = 'custom-dropdown-item selected';
    allItem.setAttribute('data-value', '');

    const allLabel = document.createElement('span');
    allLabel.className = 'custom-dropdown-item-label';
    allLabel.textContent = placeholder;

    const allCount = document.createElement('span');
    allCount.className = 'custom-dropdown-item-count';
    allCount.textContent = `${Object.values(counts).reduce((a, b) => a + b, 0)}`;

    const allDistribution = document.createElement('div');
    allDistribution.className = 'custom-dropdown-distribution';

    const allBar = document.createElement('div');
    allBar.className = 'custom-dropdown-distribution-bar';
    allBar.style.width = '100%';

    allDistribution.appendChild(allBar);
    allItem.appendChild(allLabel);
    allItem.appendChild(allCount);
    allItem.appendChild(allDistribution);
    menu.appendChild(allItem);

    // Add other options
    options.forEach(option => {
        const count = counts[option] || 0;
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

        const item = document.createElement('div');
        item.className = 'custom-dropdown-item';
        item.setAttribute('data-value', option);

        const label = document.createElement('span');
        label.className = 'custom-dropdown-item-label';
        label.textContent = option;

        const countSpan = document.createElement('span');
        countSpan.className = 'custom-dropdown-item-count';
        countSpan.textContent = count;

        const distribution = document.createElement('div');
        distribution.className = 'custom-dropdown-distribution';

        const bar = document.createElement('div');
        bar.className = 'custom-dropdown-distribution-bar';
        bar.style.width = `${percentage}%`;

        distribution.appendChild(bar);
        item.appendChild(label);
        item.appendChild(countSpan);
        item.appendChild(distribution);
        menu.appendChild(item);
    });

    // Add components to container
    dropdownContainer.appendChild(header);
    dropdownContainer.appendChild(menu);

    // Insert the custom dropdown after the original select
    parentContainer.insertBefore(dropdownContainer, originalSelect.nextSibling);

    // Add event listeners
    header.addEventListener('click', () => {
        dropdownContainer.classList.toggle('open');

        // Close other dropdowns
        document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
            if (dropdown !== dropdownContainer) {
                dropdown.classList.remove('open');
            }
        });
    });

    // Handle clicking outside the dropdown
    document.addEventListener('click', (e) => {
        if (!dropdownContainer.contains(e.target)) {
            dropdownContainer.classList.remove('open');
        }
    });

    // Handle item selection
    menu.querySelectorAll('.custom-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const value = item.getAttribute('data-value');
            selectedText.textContent = value || placeholder;

            // Update original select value
            originalSelect.value = value;

            // Update selected item styling
            menu.querySelectorAll('.custom-dropdown-item').forEach(i => {
                i.classList.remove('selected');
            });
            item.classList.add('selected');

            // Close dropdown
            dropdownContainer.classList.remove('open');

            // Trigger change event on original select
            const event = new Event('change');
            originalSelect.dispatchEvent(event);

            // Call onChange callback
            if (onChange) onChange(value);
        });
    });

    return {
        container: dropdownContainer,
        setValue: (value) => {
            const items = menu.querySelectorAll('.custom-dropdown-item');
            items.forEach(item => {
                if (item.getAttribute('data-value') === value) {
                    item.click();
                }
            });
        },
        getValue: () => originalSelect.value
    };
}

// Function to count occurrences of each value in a specific field
function countFieldValues(data, fieldName) {
    const counts = {};
    data.forEach(item => {
        const value = item[fieldName]?.trim() || '';
        if (value) {
            counts[value] = (counts[value] || 0) + 1;
        }
    });
    return counts;
}

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
    const selectedStatus = document.getElementById('statusFilter').value;

    sampleData.forEach((item, index) => {
        if (item.lat && item.lon && !item["ზუსტი ადგილმდებარეობა"]?.trim()) {
            // Apply filters
            if (filtered) {
                const itemDistrict = item['რაიონი']?.trim() || '';
                const itemVillage = item['სოფელი']?.trim() || '';
                const itemPriority = item['პრიორიტეტი']?.trim() || '';
                const itemStatus = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"]?.trim() || '';

                // Special handling for empty status
                const matchesStatus = !selectedStatus ||
                    (selectedStatus === "EMPTY_STATUS" && itemStatus === '') ||
                    itemStatus === selectedStatus;

                const matchesDistrict = !selectedDistrict || itemDistrict === selectedDistrict;
                const matchesVillage = !selectedVillage || itemVillage === selectedVillage;
                const matchesPriority = !selectedPriority || itemPriority === selectedPriority;

                if (!matchesDistrict || !matchesVillage || !matchesPriority || !matchesStatus) return;
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

    // Create wrapper with a close button - ensure instanceId is properly treated as a string
    let html = `<div class="info-card">
                <button class="close-button" onclick="closeTooltip('${instanceId}')">✕</button>`;

    // Add ID at the top of the tooltip using the CSS classes
    html += `<p class="id-field">
                <span class="id-label">ID:</span> 
                <span class="id-value">${data.id || ''}</span>
            </p>`;

    // Get all keys except internal ones
    const keys = Object.keys(data).filter(key =>
        !['id', 'fillColor', 'strokeColor', 'lat', 'lon'].includes(key)
    );

    // Process all fields
    for (const key of keys) {
        let value = data[key];

        // Convert URLs to links (not making assumptions, just basic URL detection)
        if (value && typeof value === 'string' && isURL(value)) {
            value = `<a href="${value}" target="_blank">${value}</a>`;
        }
        // Handle null or undefined
        else if (value === null || value === undefined) {
            value = "";
        }

        // Skip empty values (null, undefined, empty string, or whitespace-only)
        if (value === "" || (typeof value === 'string' && value.trim() === "")) {
            continue;
        }

        // Limit key length to 20 characters
        const displayKey = key.length > 20 ? key.substring(0, 20) + '...' : key;

        html += `<p><span class="info-label">${displayKey}:</span> <span class="info-value">${value}</span></p>`;
    }

    // Add directions link if lat and lon are available
    if (data.lat && data.lon) {
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lon}`;
        html += `<div class="directions-container">
            <a href="${directionsUrl}" target="_blank">ნავიგაცია</a>
            ${data.id ? `<button id="notification-btn-${instanceId}" onclick="sendNotification('notification-btn-${instanceId}')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>დაზარალებულის დახმარება</button>` : ''}
        </div>`;
    }

    html += `</div>`;
    return html;
}

// Function to close a tooltip
function closeTooltip(id) {
    // Ensure id is treated consistently, whether it's passed as a string or number
    const instanceId = String(id);
    if (window.tippyInstances && window.tippyInstances[instanceId]) {
        window.tippyInstances[instanceId].hide();
        // Add proper cleanup by destroying the tooltip instance
        if (window.tippyInstances[instanceId].destroy) {
            window.tippyInstances[instanceId].destroy();
        }
        // Remove the instance from our tracking object
        delete window.tippyInstances[instanceId];
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
    const statuses = [...new Set(data.map(item => item["სტატუსი\n(მომლოდინე/ დასრულებულია)"]?.trim()).filter(Boolean))];

    const districtSelect = document.getElementById('districtFilter');
    const villageSelect = document.getElementById('villageFilter');
    const prioritySelect = document.getElementById('priorityFilter');
    const statusSelect = document.getElementById('statusFilter');

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

    while (statusSelect.options.length > 1) {
        statusSelect.remove(1);
    }

    // Populate native select elements first (they'll be hidden but still used for values)
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

    // Add special option for empty statuses
    const emptyStatusOption = document.createElement('option');
    emptyStatusOption.value = "EMPTY_STATUS";
    emptyStatusOption.textContent = "უცნობი სტატუსი";
    statusSelect.appendChild(emptyStatusOption);

    // Add non-empty statuses
    statuses.sort().forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        statusSelect.appendChild(option);
    });

    // Calculate counts for each option
    const districtCounts = countFieldValues(data, 'რაიონი');
    const villageCounts = countFieldValues(data, 'სოფელი');
    const priorityCounts = countFieldValues(data, 'პრიორიტეტი');

    // Special handling for status counts including empty status
    const statusCounts = {};
    data.forEach(item => {
        const status = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"]?.trim() || '';
        if (status) {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        } else {
            // Count empty status
            statusCounts["EMPTY_STATUS"] = (statusCounts["EMPTY_STATUS"] || 0) + 1;
        }
    });

    // Create custom dropdowns
    customDropdowns.district = createCustomDropdown(
        'districtFilter',
        districts,
        districtCounts,
        'ყველა რაიონი'
    );

    customDropdowns.village = createCustomDropdown(
        'villageFilter',
        villages,
        villageCounts,
        'ყველა სოფელი'
    );

    customDropdowns.priority = createCustomDropdown(
        'priorityFilter',
        priorities,
        priorityCounts,
        'ყველა პრიორიტეტი'
    );

    customDropdowns.status = createCustomDropdown(
        'statusFilter',
        [...statuses, 'უცნობი სტატუსი'],
        { ...statusCounts, 'უცნობი სტატუსი': statusCounts['EMPTY_STATUS'] || 0 },
        'ყველა სტატუსი'
    );

    // Add filter change handlers to the native selects (already connected via createCustomDropdown)
    districtSelect.addEventListener('change', applyFilters);
    villageSelect.addEventListener('change', applyFilters);
    prioritySelect.addEventListener('change', applyFilters);
    statusSelect.addEventListener('change', applyFilters);
}

// Update applyFilters function with fixed filtering logic
function applyFilters() {
    if (!sampleData.length || !map) return;

    const selectedDistrict = document.getElementById('districtFilter').value;
    const selectedVillage = document.getElementById('villageFilter').value;
    const selectedPriority = document.getElementById('priorityFilter').value;
    const selectedStatus = document.getElementById('statusFilter').value;

    // Filter cards
    document.querySelectorAll('.card').forEach(card => {
        const index = card.getAttribute('data-index');
        const item = sampleData[index];

        // Trim values before comparison
        const itemDistrict = item['რაიონი']?.trim() || '';
        const itemVillage = item['სოფელი']?.trim() || '';
        const itemPriority = item['პრიორიტეტი']?.trim() || '';
        const itemStatus = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"]?.trim() || '';

        // Special handling for empty status
        const matchesStatus = !selectedStatus ||
            (selectedStatus === "EMPTY_STATUS" && itemStatus === '') ||
            itemStatus === selectedStatus;

        const matchesDistrict = !selectedDistrict || itemDistrict === selectedDistrict;
        const matchesVillage = !selectedVillage || itemVillage === selectedVillage;
        const matchesPriority = !selectedPriority || itemPriority === selectedPriority;

        card.style.display = (matchesDistrict && matchesVillage && matchesPriority && matchesStatus) ? 'block' : 'none';
    });

    // Update markers visibility
    locationMarkers.forEach(({ marker, properties }) => {
        // Trim values before comparison
        const propertyDistrict = properties['რაიონი']?.trim() || '';
        const propertyVillage = properties['სოფელი']?.trim() || '';
        const propertyPriority = properties['პრიორიტეტი']?.trim() || '';
        const propertyStatus = properties["სტატუსი\n(მომლოდინე/ დასრულებულია)"]?.trim() || '';

        // Special handling for empty status
        const matchesStatus = !selectedStatus ||
            (selectedStatus === "EMPTY_STATUS" && propertyStatus === '') ||
            propertyStatus === selectedStatus;

        const matchesDistrict = !selectedDistrict || propertyDistrict === selectedDistrict;
        const matchesVillage = !selectedVillage || propertyVillage === selectedVillage;
        const matchesPriority = !selectedPriority || propertyPriority === selectedPriority;

        marker.getElement().style.display = (matchesDistrict && matchesVillage && matchesPriority && matchesStatus) ? 'block' : 'none';
    });

    // Update polygon features
    const features = [];
    sampleData.forEach((item, index) => {
        if (item.lat && item.lon && !item["ზუსტი ადგილმდებარეობა"]?.trim()) {
            // Trim values before comparison
            const itemDistrict = item['რაიონი']?.trim() || '';
            const itemVillage = item['სოფელი']?.trim() || '';
            const itemPriority = item['პრიორიტეტი']?.trim() || '';
            const itemStatus = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"]?.trim() || '';

            // Special handling for empty status
            const matchesStatus = !selectedStatus ||
                (selectedStatus === "EMPTY_STATUS" && itemStatus === '') ||
                itemStatus === selectedStatus;

            const matchesDistrict = !selectedDistrict || itemDistrict === selectedDistrict;
            const matchesVillage = !selectedVillage || itemVillage === selectedVillage;
            const matchesPriority = !selectedPriority || itemPriority === selectedPriority;

            if (matchesDistrict && matchesVillage && matchesPriority && matchesStatus) {
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
                            <p class="id-field">
                                <span class="id-label">ID:</span> <span class="id-value">${item.id || ''}</span>
                            </p>
                            ${keys.slice(1).map(key => `
                                <p><strong>${key}:</strong> ${formatValue(item[key])}</p>
                            `).join('')}
                            ${item.lat && item.lon ? `
                            <div class="card-actions">
                                ${item.id ? `<button id="card-notification-btn-${index}" onclick="event.stopPropagation(); sendNotification('card-notification-btn-${index}')" class="card-notification-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>დაზარალებულის დახმარება</button>` : ''}
                            </div>
                            ` : ''}
                        </div>`;

            card.innerHTML = cardContent;

            // Add click handlers
            card.addEventListener('click', (e) => {
                // Check if clicking inside card-content or on a button/link
                if (e.target.closest('.card-content') &&
                    !e.target.matches('.card-content')) {
                    // Clicked inside card content but not on the container itself
                    return;
                }

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
            // Group markers by location to detect overlapping pins
            const locationGroups = {};

            // First group pins by location
            sampleData.forEach((item, index) => {
                if (item.lat && item.lon && item["ზუსტი ადგილმდებარეობა"]?.trim()) {
                    const key = `${item.lat.toFixed(4)},${item.lon.toFixed(4)}`;
                    if (!locationGroups[key]) {
                        locationGroups[key] = [];
                    }
                    locationGroups[key].push({ item, index });
                }
            });

            // Create markers with offsets if needed
            const markers = [];

            // Process each location group
            Object.values(locationGroups).forEach(group => {
                const isGroup = group.length > 1;

                // Process each pin in the group
                group.forEach((entry, groupIndex) => {
                    const { item, index } = entry;
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

                    // Only apply offset if we have more than one item at this location
                    let offsetLon = item.lon;
                    let offsetLat = item.lat;

                    if (isGroup) {
                        // Base the offset calculation on the pin marker size
                        const baseRadius = 0.0006; // Adjust this based on your pin size
                        const offset = calculatePointOffset(groupIndex, baseRadius);
                        offsetLon = parseFloat(item.lon) + offset.x;
                        offsetLat = parseFloat(item.lat) + offset.y;
                    }

                    const marker = new maplibregl.Marker({
                        element: container,
                        anchor: 'bottom',
                        offset: [0, 0] // No offset needed with our new design
                    }).setLngLat([offsetLon, offsetLat])
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
                });
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

    // Create and load iframe only when showing the panel
    if (isHidden) {
        const placeholder = document.getElementById('iframe-placeholder');
        
        // Check if iframe already exists
        if (!placeholder.querySelector('iframe')) {
            // Create iframe
            const iframe = document.createElement('iframe');
            iframe.src = "https://docs.google.com/spreadsheets/d/1cWGBzYPa93_NZq8ZwtqF94fhwIdovrWkPg6-PRNaVHc/edit?usp=sharing";
            iframe.allow = "autoplay";
            iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms";
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.border = "none";
            
            // Add load event to handle errors
            iframe.onload = function() {
                this.contentWindow.onerror = function(){ return true; };
            };
            
            // Add iframe to placeholder
            placeholder.appendChild(iframe);
        }
    }

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

    // Close any open tooltips before changing the map style
    if (window.tippyInstances) {
        Object.values(window.tippyInstances).forEach(instance => {
            if (instance && instance.hide) {
                instance.hide();
            }
        });
    }

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

// Functions for notification modal
function openNotificationModal(btnId) {
    const modal = document.getElementById('notification-modal');
    if (!modal) {
        console.error('Notification modal not found in openNotificationModal');
        return;
    }
    
    const mobileSidebarButton = document.querySelector('.mobile-sidebar-button');

    // Store the button ID in a data attribute for later use
    modal.setAttribute('data-button-id', btnId);

    // Check if the form exists or has been replaced with success message
    const form = document.getElementById('notification-form');
    if (!form || form.querySelector('.success-message')) {
        // Recreate the form if it doesn't exist or contains success message
        const modalBody = modal.querySelector('.modal-body') || modal;
        modalBody.innerHTML = `
            <form id="notification-form">
                <div class="form-group">
                    <label for="volunteer-name">მოხალისის სახელი</label>
                    <input type="text" id="volunteer-name" name="volunteer-name" required>
                </div>
                <div class="form-group">
                    <label for="phone-number">ტელეფონის ნომერი</label>
                    <input type="tel" id="phone-number" name="phone-number" required>
                </div>
                <div class="form-group">
                    <label for="notification-message">შეტყობინება</label>
                    <textarea id="notification-message" name="notification-message" rows="4" required></textarea>
                </div>
                <button type="submit" class="submit-btn">გაგზავნა</button>
            </form>
        `;
        
        // Re-attach the submit event listener to the new form
        const newForm = document.getElementById('notification-form');
        if (newForm) {
            newForm.addEventListener('submit', submitNotification);
        }
    } else {
        // Reset form fields with null checks
        const volunteerNameField = document.getElementById('volunteer-name');
        const phoneNumberField = document.getElementById('phone-number');
        const messageField = document.getElementById('notification-message');
        
        if (volunteerNameField) volunteerNameField.value = '';
        if (phoneNumberField) phoneNumberField.value = '';
        if (messageField) messageField.value = '';
    }

    // Hide the mobile sidebar button
    if (mobileSidebarButton) {
        mobileSidebarButton.style.display = 'none';
    }

    modal.style.display = 'block';

    // Add a small delay before adding the active class for animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);

    // Prevent scrolling of the background content
    document.body.style.overflow = 'hidden';
}

function closeNotificationModal() {
    const modal = document.getElementById('notification-modal');
    if (!modal) {
        console.error('Notification modal not found in closeNotificationModal');
        return;
    }
    
    const mobileSidebarButton = document.querySelector('.mobile-sidebar-button');

    modal.classList.remove('active');

    // Add a small delay before hiding the modal completely for animation
    setTimeout(() => {
        modal.style.display = 'none';

        // Re-enable scrolling
        document.body.style.overflow = '';

        // Show the mobile sidebar button again
        if (mobileSidebarButton) {
            mobileSidebarButton.style.display = '';
        }
    }, 300);
}

// Function to send notification to specified API
function sendNotification(btnId) {
    // Check if notification modal exists
    const modal = document.getElementById('notification-modal');
    if (!modal) {
        console.error('Notification modal not found');
        alert('შეტყობინების გაგზავნა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.');
        return;
    }
    
    // Open the notification modal instead of directly sending the notification
    openNotificationModal(btnId);
}

// Function to submit the notification form
function submitNotification(event) {
    event.preventDefault();

    // Get form fields with null checks
    const volunteerNameField = document.getElementById('volunteer-name');
    const phoneNumberField = document.getElementById('phone-number');
    const messageField = document.getElementById('notification-message');
    
    // If any field is missing, show an error and return
    if (!volunteerNameField || !phoneNumberField || !messageField) {
        alert('ფორმის ელემენტები ვერ მოიძებნა. გთხოვთ სცადოთ თავიდან.');
        return;
    }
    
    // Get form values
    const volunteerName = volunteerNameField.value.trim();
    const phoneNumber = phoneNumberField.value.trim();
    const message = messageField.value.trim();

    // Validate inputs
    if (!volunteerName || !phoneNumber || !message) {
        alert('გთხოვთ შეავსოთ ყველა ველი');
        return;
    }

    // Get the button ID from the modal's data attribute
    const modal = document.getElementById('notification-modal');
    if (!modal) {
        alert('მოდალი ვერ მოიძებნა. გთხოვთ სცადოთ თავიდან.');
        return;
    }
    
    const btnId = modal.getAttribute('data-button-id');
    if (!btnId) {
        alert('ღილაკის ID ვერ მოიძებნა. გთხოვთ სცადოთ თავიდან.');
        return;
    }

    // Extract the instance ID from the button ID
    let instanceId;
    
    // Handle both types of button IDs
    if (btnId.startsWith('card-notification-btn-')) {
        instanceId = btnId.replace('card-notification-btn-', '');
    } else if (btnId.startsWith('notification-btn-')) {
        instanceId = btnId.replace('notification-btn-', '');
    } else {
        instanceId = btnId; // Fallback
    }

    // Find the data for this instance
    let itemData = null;
    try {
        if (Array.isArray(sampleData)) {
            // Find the item in the array that matches the instanceId
            itemData = sampleData.find(item => item.id === instanceId);
            
            // If not found by id, try using the index (for backward compatibility)
            if (!itemData && !isNaN(instanceId)) {
                const index = parseInt(instanceId);
                if (index >= 0 && index < sampleData.length) {
                    itemData = sampleData[index];
                }
            }
        }
    } catch (error) {
        console.warn('Error accessing sampleData:', error);
    }

    debugger;
    // Use the actual ID from the data if available
    const data = {
        "id": itemData && itemData.id ? itemData.id : "a15522", // Fallback to sample ID if not found
        "category": "ვაპირებ",
        "message": volunteerName + ": " + message,
        "phone": phoneNumber
    };

    // API endpoint
    const apiUrl = 'https://sift.app.n8n.cloud/webhook/9fe92c0c-3ebe-4c4f-9fc4-3bec9e39aa4f';

    // Show loading state on the submit button
    const submitButton = document.querySelector('.submit-btn');
    let originalText = 'გაგზავნა'; // Default text
    if (!submitButton) {
        // If we can't find the button, just proceed with the request
        console.warn('Submit button not found');
    } else {
        originalText = submitButton.textContent;
        submitButton.textContent = 'იგზავნება...';
        submitButton.disabled = true;
    }

    // Disable all form inputs during submission
    const formInputs = document.querySelectorAll('#notification-form input, #notification-form textarea');
    if (formInputs && formInputs.length > 0) {
        formInputs.forEach(input => {
            input.disabled = true;
        });
    }

    // Send the POST request
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Response status:', response.status);

        // Simplified success check - directly check the status code
        if (response.status === 200 || response.status === 201) {
            // Show success message in the modal
            const form = document.getElementById('notification-form');
            if (form) {
                form.innerHTML = `
                    <div class="success-message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <h3>შეტყობინება წარმატებით გაიგზავნა!</h3>
                        <p>გმადლობთ, თქვენი შეტყობინება მიღებულია.</p>
                        <button type="button" class="submit-btn" onclick="closeNotificationModal()">დახურვა</button>
                    </div>
                `;
            }
            
            // Update the original button
            const button = document.getElementById(btnId);
            if (button) {
                button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> გაიგზავნა`;
                button.style.backgroundColor = '#2ecc71';
            }
            
            console.log('Notification sent successfully with status:', response.status);

            // Try to parse JSON if available, but don't make success dependent on it
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json().then(data => {
                    console.log('Response data:', data);
                }).catch(err => {
                    console.log('Could not parse JSON but request was successful');
                });
            }
        } else {
            // Non-success status code
            throw new Error(`Request failed with status code ${response.status}`);
        }
    })
    .catch(error => {
        // Reset form inputs
        if (formInputs && formInputs.length > 0) {
            formInputs.forEach(input => {
                input.disabled = false;
            });
        }
        
        // Reset button and show error
        if (submitButton) {
            submitButton.textContent = originalText || 'გაგზავნა';
            submitButton.disabled = false;
        }
        
        // Show error message
        alert('შეცდომა შეტყობინების გაგზავნისას. გთხოვთ სცადოთ თავიდან.');
        
        console.error('Error sending notification:', error);
    });
}

// Add event listener for form submission when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const notificationForm = document.getElementById('notification-form');
    if (notificationForm) {
        notificationForm.addEventListener('submit', submitNotification);
    }
});
