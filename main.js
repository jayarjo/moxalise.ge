// Make map and markers global at the top of script section
let map;
let sampleData = [];
let locationMarkers = [];

// Add a global variable to track the user location marker
let userLocationMarker = null;

// Add global variables to track custom dropdowns
let customDropdowns = {};

// Add a global variable to store the current search text
let currentSearchText = '';

// Add a debug flag to help troubleshoot highlighting issues
let DEBUG_HIGHLIGHT = true;

// Add a flag to track when the map is fully initialized
let mapFullyInitialized = false;

// Function to log debug messages for highlighting
function debugHighlight(message) {
    if (DEBUG_HIGHLIGHT) {
        console.log(`[HIGHLIGHT DEBUG] ${message}`);
    }
}

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

    // Add a small delay before hiding the modal to allow for animation
    setTimeout(() => {
        modal.style.display = 'none';

        // Show the mobile sidebar button again if it exists
        if (mobileSidebarButton && window.innerWidth <= 768) {
            mobileSidebarButton.style.display = 'block';
        }
    }, 300);

    // Re-enable scrolling of the background content
    document.body.style.overflow = '';
}

// Functions for modal help offer
function openHelpOfferModal() {
    const modal = document.getElementById('help-offer-modal');
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

function closeHelpOfferModal() {
    const modal = document.getElementById('help-offer-modal');
    const mobileSidebarButton = document.querySelector('.mobile-sidebar-button');

    modal.classList.remove('active');

    // Add a small delay before hiding the modal to allow for animation
    setTimeout(() => {
        modal.style.display = 'none';

        // Show the mobile sidebar button again if it exists
        if (mobileSidebarButton && window.innerWidth <= 768) {
            mobileSidebarButton.style.display = 'block';
        }
    }, 300);

    // Re-enable scrolling of the background content
    document.body.style.overflow = '';
}

// Close modal if user clicks outside the modal content
window.addEventListener('click', function (event) {
    const helpModal = document.getElementById('help-modal');
    if (event.target === helpModal) {
        closeHelpModal();
    }

    const helpOfferModal = document.getElementById('help-offer-modal');
    if (event.target === helpOfferModal) {
        closeHelpOfferModal();
    }

    const notificationModal = document.getElementById('notification-modal');
    if (event.target === notificationModal) {
        closeNotificationModal();
    }
});

// Function to create a custom dropdown with distribution data
function createCustomDropdown(elementId, options, counts, placeholder, onChange, specialMapping) {
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

    // Add search input at the top of the dropdown
    const searchContainer = document.createElement('div');
    searchContainer.className = 'custom-dropdown-search';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'custom-dropdown-search-input';
    searchInput.placeholder = 'ძიება...';
    
    searchContainer.appendChild(searchInput);
    menu.appendChild(searchContainer);

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
        
        // If we have a special mapping, store both the display value and the actual value
        const displayValue = option;
        const actualValue = (specialMapping && specialMapping[option]) || option;
        
        item.setAttribute('data-value', actualValue);
        item.setAttribute('data-display-value', displayValue);

        // Add checkbox for multi-select
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'custom-dropdown-checkbox';
        
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
        item.appendChild(checkbox);
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

    // Store selected values
    const selectedValues = new Set();
    
    // Function to update the header text based on selections
    const updateHeaderText = () => {
        if (selectedValues.size === 0) {
            selectedText.textContent = placeholder;
        } else if (selectedValues.size === 1) {
            selectedText.textContent = Array.from(selectedValues)[0];
        } else {
            selectedText.textContent = `${placeholder} (${selectedValues.size})`;
        }
    };

    // Function to update the original select's value
    const updateOriginalSelect = () => {
        // Convert Set to array and join with comma
        const valuesArray = Array.from(selectedValues);
        
        // Debug log to check what values are being set
        console.log(`Setting ${elementId} value to:`, valuesArray);
        
        // Set the value on the original select element
        originalSelect.value = valuesArray.join(',');
        
        // Also set a custom attribute to ensure the value is accessible
        originalSelect.setAttribute('data-selected-values', valuesArray.join(','));
        
        // Add special debug for updates filter
        if (elementId === 'updatesFilter') {
            console.log('Updates filter values set:', {
                values: valuesArray,
                attribute: originalSelect.getAttribute('data-selected-values'),
                selectValue: originalSelect.value
            });
        }
        
        // Trigger change event on original select
        const event = new Event('change');
        originalSelect.dispatchEvent(event);
        
        // Call onChange callback if provided
        if (onChange) onChange(valuesArray);
    };

    // Add event listeners
    header.addEventListener('click', () => {
        dropdownContainer.classList.toggle('open');

        // Close other dropdowns
        document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
            if (dropdown !== dropdownContainer) {
                dropdown.classList.remove('open');
            }
        });
        
        // Focus search input when dropdown opens
        if (dropdownContainer.classList.contains('open')) {
            searchInput.focus();
        }
    });

    // Handle clicking outside the dropdown
    document.addEventListener('click', (e) => {
        if (!dropdownContainer.contains(e.target)) {
            dropdownContainer.classList.remove('open');
        }
    });

    // Handle search input
    searchInput.addEventListener('input', (e) => {
        const searchValue = e.target.value.toLowerCase().trim();
        
        // Skip the first item (All option)
        const items = menu.querySelectorAll('.custom-dropdown-item:not(:nth-child(2))');
        
        items.forEach(item => {
            const itemText = item.querySelector('.custom-dropdown-item-label').textContent.toLowerCase();
            if (searchValue === '' || itemText.includes(searchValue)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Prevent search input from closing dropdown when clicked
    searchInput.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Handle "All" option selection
    allItem.addEventListener('click', () => {
        // Clear all selections
        selectedValues.clear();
        
        // Uncheck all checkboxes
        menu.querySelectorAll('.custom-dropdown-checkbox').forEach(cb => {
            cb.checked = false;
        });
        
        // Update selected styling
        menu.querySelectorAll('.custom-dropdown-item').forEach(i => {
            i.classList.remove('selected');
        });
        allItem.classList.add('selected');
        
        // Update header and original select
        updateHeaderText();
        updateOriginalSelect();
        
        // Close dropdown
        dropdownContainer.classList.remove('open');
    });

    // Handle item selection
    menu.querySelectorAll('.custom-dropdown-item:not(:nth-child(2))').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't handle clicks on the checkbox itself (it will handle its own state)
            if (e.target.type === 'checkbox') return;
            
            const checkbox = item.querySelector('.custom-dropdown-checkbox');
            const actualValue = item.getAttribute('data-value');
            
            // Toggle checkbox
            checkbox.checked = !checkbox.checked;
            
            // Debug for updates filter
            if (elementId === 'updatesFilter') {
                console.log('Updates filter item clicked:', {
                    displayValue: item.getAttribute('data-display-value'),
                    actualValue: actualValue,
                    checked: checkbox.checked
                });
            }
            
            // Update selected values
            if (checkbox.checked) {
                selectedValues.add(actualValue);
                item.classList.add('selected');
            } else {
                selectedValues.delete(actualValue);
                item.classList.remove('selected');
            }
            
            // If any item is selected, deselect "All" option
            if (selectedValues.size > 0) {
                allItem.classList.remove('selected');
            } else {
                allItem.classList.add('selected');
            }
            
            // Update header text and original select
            updateHeaderText();
            updateOriginalSelect();
        });
        
        // Handle checkbox click
        const checkbox = item.querySelector('.custom-dropdown-checkbox');
        checkbox.addEventListener('change', () => {
            const actualValue = item.getAttribute('data-value');
            
            // Debug for updates filter
            if (elementId === 'updatesFilter') {
                console.log('Updates filter checkbox changed:', {
                    displayValue: item.getAttribute('data-display-value'),
                    actualValue: actualValue,
                    checked: checkbox.checked
                });
            }
            
            // Update selected values
            if (checkbox.checked) {
                selectedValues.add(actualValue);
                item.classList.add('selected');
            } else {
                selectedValues.delete(actualValue);
                item.classList.remove('selected');
            }
            
            // If any item is selected, deselect "All" option
            if (selectedValues.size > 0) {
                allItem.classList.remove('selected');
            } else {
                allItem.classList.add('selected');
            }
            
            // Update header text and original select
            updateHeaderText();
            updateOriginalSelect();
        });
    });

    return {
        container: dropdownContainer,
        setValue: (value) => {
            // Handle comma-separated values for multi-select
            const values = value ? value.split(',') : [];
            
            // Clear existing selections
            selectedValues.clear();
            menu.querySelectorAll('.custom-dropdown-checkbox').forEach(cb => {
                cb.checked = false;
            });
            menu.querySelectorAll('.custom-dropdown-item').forEach(i => {
                i.classList.remove('selected');
            });
            
            if (values.length === 0) {
                // Select "All" option
                allItem.classList.add('selected');
            } else {
                // Select specified values
                values.forEach(val => {
                    const items = menu.querySelectorAll('.custom-dropdown-item');
                    items.forEach(item => {
                        if (item.getAttribute('data-value') === val) {
                            const checkbox = item.querySelector('.custom-dropdown-checkbox');
                            if (checkbox) {
                                checkbox.checked = true;
                                item.classList.add('selected');
                                selectedValues.add(val);
                            }
                        }
                    });
                });
                
                // Deselect "All" option if any values are selected
                if (selectedValues.size > 0) {
                    allItem.classList.remove('selected');
                }
            }
            
            // Update header text
            updateHeaderText();
        },
        getValue: () => {
            return Array.from(selectedValues).join(',');
        }
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
    // First filter the data based on the selected criteria
    const districtElement = document.getElementById('districtFilter');
    const villageElement = document.getElementById('villageFilter');
    const priorityElement = document.getElementById('priorityFilter');
    const statusElement = document.getElementById('statusFilter');
    const updatesElement = document.getElementById('updatesFilter');
    
    // Get values from data attributes if available, otherwise use the value property
    const selectedDistrict = districtElement.getAttribute('data-selected-values') || districtElement.value;
    const selectedVillage = villageElement.getAttribute('data-selected-values') || villageElement.value;
    const selectedPriority = priorityElement.getAttribute('data-selected-values') || priorityElement.value;
    const selectedStatus = statusElement.getAttribute('data-selected-values') || statusElement.value;
    const selectedUpdates = updatesElement.getAttribute('data-selected-values') || updatesElement.value;
    
    const searchText = currentSearchText ? currentSearchText.toLowerCase().trim() : '';

    // Parse comma-separated values for multi-select
    const selectedDistricts = selectedDistrict ? selectedDistrict.split(',') : [];
    const selectedVillages = selectedVillage ? selectedVillage.split(',') : [];
    const selectedPriorities = selectedPriority ? selectedPriority.split(',') : [];
    const selectedStatuses = selectedStatus ? selectedStatus.split(',') : [];
    const selectedUpdateOptions = selectedUpdates ? selectedUpdates.split(',') : [];

    // Debug log
    console.log('updateFeatures - Filtering with:', {
        districts: selectedDistricts,
        villages: selectedVillages,
        priorities: selectedPriorities,
        statuses: selectedStatuses,
        updates: selectedUpdateOptions
    });

    // Count all items with coordinates for debugging
    const itemsWithCoordinates = sampleData.filter(item => 
        item.lat && item.lon && (!item["ზუსტი ადგილმდებარეობა"]?.trim() || !isURL(item["ზუსტი ადგილმდებარეობა"]))
    ).length;
    console.log(`Total items with coordinates: ${itemsWithCoordinates}`);

    // Count items for each priority value for debugging
    if (selectedPriorities.length > 0) {
        console.log('Priority filter analysis:');
        const priorityCounts = {};
        
        // Initialize counts for selected priorities
        selectedPriorities.forEach(p => {
            priorityCounts[p] = 0;
        });
        
        // Count items for each selected priority
        sampleData.forEach(item => {
            if (item.lat && item.lon && (!item["ზუსტი ადგილმდებარეობა"]?.trim() || !isURL(item["ზუსტი ადგილმდებარეობა"]))) {
                const itemPriority = item['პრიორიტეტი']?.trim() || '';
                if (selectedPriorities.includes(itemPriority)) {
                    priorityCounts[itemPriority] = (priorityCounts[itemPriority] || 0) + 1;
                }
            }
        });
        
        console.log('Items per priority:', priorityCounts);
        console.log('Total items matching any selected priority:', Object.values(priorityCounts).reduce((a, b) => a + b, 0));
    }

    // First, filter the data based on criteria
    let filteredItems = [];
    
    if (filtered) {
        // Create a detailed filter function that logs each step
        filteredItems = sampleData.filter(item => {
            // Skip items without coordinates or with exact location that is a URL
            if (!item.lat || !item.lon || (item["ზუსტი ადგილმდებარეობა"]?.trim() && isURL(item["ზუსტი ადგილმდებარეობა"]))) {
                return false;
            }
            
            const itemDistrict = item['რაიონი']?.trim() || '';
            const itemVillage = item['სოფელი']?.trim() || '';
            const itemPriority = item['პრიორიტეტი']?.trim() || '';
            const itemStatus = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"]?.trim() || '';
            const itemUpdates = item["განახლებები"]?.trim() || '';

            // Check if matches any of the selected values or if no values are selected
            const matchesDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(itemDistrict);
            const matchesVillage = selectedVillages.length === 0 || selectedVillages.includes(itemVillage);
            const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(itemPriority);
            
            // Special handling for empty status
            const matchesStatus = selectedStatuses.length === 0 || 
                (selectedStatuses.includes("EMPTY_STATUS") && itemStatus === '') || 
                selectedStatuses.includes(itemStatus);
                
            // Special handling for updates filter - fixed logic
            let matchesUpdates = selectedUpdateOptions.length === 0; // Default if no options selected
            
            if (!matchesUpdates) {
                // Check each selected option
                for (const option of selectedUpdateOptions) {
                    if (option === "HAS_UPDATES" && itemUpdates !== '') {
                        matchesUpdates = true;
                        break;
                    }
                    if (option === "NO_UPDATES" && itemUpdates === '') {
                        matchesUpdates = true;
                        break;
                    }
                    // Also check for direct matches with display values (fallback)
                    if (option === "აქვს განახლება" && itemUpdates !== '') {
                        matchesUpdates = true;
                        break;
                    }
                    if (option === "არ აქვს განახლება" && itemUpdates === '') {
                        matchesUpdates = true;
                        break;
                    }
                }
            }

            // Check if the item matches the search text
            const matchesSearch = !searchText || Object.values(item).some(value => {
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(searchText);
            });

            return matchesDistrict && matchesVillage && matchesPriority && matchesStatus && matchesUpdates && matchesSearch;
        });
    } else {
        // If not filtering, include all items with coordinates
        filteredItems = sampleData.filter(item => 
            item.lat && item.lon && (!item["ზუსტი ადგილმდებარეობა"]?.trim() || !isURL(item["ზუსტი ადგილმდებარეობა"]))
        );
    }

    console.log(`Filtered items count: ${filteredItems.length} out of ${sampleData.length}`);

    // Now group the filtered items by location
    const locationGroups = {};
    
    filteredItems.forEach((item, i) => {
        // Find the original index in sampleData
        const index = sampleData.findIndex(d => d === item);
        
        let color;
        const status = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"];
        const priority = item["პრიორიტეტი"]?.trim();

        // Check if priority is filled and status is not "აღმოუჩინეს დახმარება"
        if (priority && status !== "აღმოუჩინეს დახმარება") {
            color = '#000000'; // Black for priority items not completed
        } else if (status === "მომლოდინე") {
            color = '#e74c3c'; // Red
        } else if (status === "აღმოუჩინეს დახმარება" || status === "აღმოუჩინეს დახმარება") {
            color = '#2ecc71'; // Green
        } else if (status === "მიდის მოხალისე") {
            color = '#3498db'; // Blue
        } else if (status === "მოინახულა მოხალისემ") {
            color = '#9b59b6'; // Purple
        } else {
            color = '#95a5a6'; // Gray for unknown/empty status
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
    });

    // Create polygon features
    const features = Object.values(locationGroups).flatMap(group => {
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

    console.log(`Generated ${features.length} polygon features from ${filteredItems.length} filtered items`);
    return features;
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
                <button class="close-button" onclick="closeTooltip('${instanceId}')">✕</button>
                <div class="info-card-scrollable">`;

    // Add ID at the top of the tooltip using the CSS classes
    html += `<p class="id-field"><span class="id-label">ID:</span> <span class="id-value">${data.id || ''}</span></p>`;

    // Get all keys except internal ones and those containing 'დისკუსია'
    const keys = Object.keys(data).filter(key =>
        !['id', 'fillColor', 'strokeColor', 'lat', 'lon', 'inGroup'].includes(key) &&
        !key.includes('დისკუსია')
    );

    // Process all fields
    for (const key of keys) {
        let value = data[key];

        // Log for debugging
        console.log(`Processing field: "${key}" with value type: ${typeof value}`);

        // Convert URLs to links (not making assumptions, just basic URL detection)
        if (value && typeof value === 'string' && isURL(value)) {
            value = `<a href="${value}" target="_blank">${value}</a>`;
        }
        // Handle null or undefined
        else if (value === null || value === undefined) {
            value = "";
        }
        // Special handling for fields that might contain newlines
        else if (typeof value === 'string' && value.includes('\n')) {
            // Replace newlines with HTML line breaks for any field with newlines
            value = value.replace(/\n/g, '<br>');
            console.log(`Applied newline conversion for field: ${key}`);
        }

        // Skip empty values (null, undefined, empty string, or whitespace-only)
        if (value === "" || (typeof value === 'string' && value.trim() === "")) {
            console.log(`Skipping empty field: ${key}`);
            continue;
        }

        // Limit key length to 20 characters
        const displayKey = key.length > 20 ? key.substring(0, 20) + '...' : key;

        html += `<p><span class="info-label">${displayKey}:</span> <span class="info-value">${value}</span></p>`;
    }

    // Close the scrollable div
    html += `</div>`;

    // Add directions link if lat and lon are available
    if (data.lat && data.lon) {
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lon}`;
        html += `<div class="directions-container">
            <a href="${directionsUrl}" target="_blank" style="position: relative; z-index: 3500;">ნავიგაცია</a>
            ${data.id ? `<button id="notification-btn-${instanceId}" onclick="sendNotification('notification-btn-${instanceId}')" style="position: relative; z-index: 3500;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>განაახლე ინფორმაცია!</button>` : ''}
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

// Function to restore all polygons to their original size
function restorePolygonSizes(map) {
    try {
        debugHighlight("Restoring all polygon sizes");
        // Regenerate features with original sizes
        const features = updateFeatures(true);
        
        // Update the source data
        map.getSource('locations').setData({
            type: 'FeatureCollection',
            features: features
        });
    } catch (error) {
        console.error('Error restoring polygon sizes:', error);
    }
}

// Add a function to check if the map is fully initialized
function isMapReady(map) {
    if (!map) {
        debugHighlight("Map is not defined");
        return false;
    }
    
    // First check the global flag
    if (!mapFullyInitialized) {
        debugHighlight("Map is not fully initialized yet");
        return false;
    }
    
    try {
        // Check if the map has the required layers
        const hasPolygonLayer = map.getLayer('location-polygons');
        const hasOutlineLayer = map.getLayer('location-polygons-outline');
        
        // Check if the source exists and has data
        const hasSource = map.getSource('locations');
        const hasData = hasSource && hasSource._data && hasSource._data.features;
        
        const isReady = hasPolygonLayer && hasOutlineLayer && hasSource && hasData;
        
        if (!isReady) {
            debugHighlight(`Map not ready: layers=${hasPolygonLayer && hasOutlineLayer}, source=${!!hasSource}, data=${!!hasData}`);
        }
        
        return isReady;
    } catch (error) {
        debugHighlight(`Error checking map readiness: ${error.message}`);
        return false;
    }
}

// Modify the highlightPolygon function to use the isMapReady check
function highlightPolygon(map, index, force = false) {
    debugHighlight(`Highlighting polygon with index: ${index}, force: ${force}`);
    
    if (!force && !isMapReady(map)) {
        console.warn('Map is not ready for highlighting. Will retry in 500ms.');
        // Retry after a delay if the map isn't ready
        setTimeout(() => highlightPolygon(map, index), 500);
        return;
    }

    try {
        // Store the current data
        const currentData = map.getSource('locations')?._data;
        
        if (!currentData || !currentData.features) {
            console.error('No data available in map source');
            return;
        }
        
        // If we have a valid index, resize the selected polygon to be 3x bigger
        if (index >= 0 && currentData && currentData.features) {
            // First, restore all polygons to their original size
            restorePolygonSizes(map);
            
            // Find the feature with the matching id
            const selectedFeature = currentData.features.find(f => f.properties.id === index);
            
            if (selectedFeature) {
                debugHighlight(`Found feature with id ${index}, resizing to 3x`);
                // Get the current center of the polygon
                const coordinates = selectedFeature.geometry.coordinates[0];
                const centerLng = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
                const centerLat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
                
                // Create new coordinates for the polygon that are 3x bigger
                const newCoordinates = coordinates.map(coord => {
                    const dx = coord[0] - centerLng;
                    const dy = coord[1] - centerLat;
                    return [centerLng + dx * 3, centerLat + dy * 3];
                });
                
                // Update the coordinates in the feature
                selectedFeature.geometry.coordinates[0] = newCoordinates;
                
                // Update the source data
                map.getSource('locations').setData(currentData);
            } else {
                debugHighlight(`Feature with id ${index} not found in the data`);
            }
        } else if (index === -1) {
            // If index is -1, restore all polygons to their original size
            restorePolygonSizes(map);
        }

        // Reset all polygons
        map.setPaintProperty('location-polygons', 'fill-opacity', [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, [
                'case',
                ['==', ['get', 'id'], index],
                0.9,  // highlighted opacity
                0.01  // default opacity at zoom level 5
            ],
            8, [
                'case',
                ['==', ['get', 'id'], index],
                0.9,  // highlighted opacity
                0.3   // default opacity at zoom level 8
            ],
            11, [
                'case',
                ['==', ['get', 'id'], index],
                0.9,  // highlighted opacity
                0.8   // default opacity at zoom level 11
            ],
            13, [
                'case',
                ['==', ['get', 'id'], index],
                0.9,  // highlighted opacity
                0.3   // default opacity at zoom level 13
            ],
            15, [
                'case',
                ['==', ['get', 'id'], index],
                0.9,  // highlighted opacity
                0.08  // default opacity at zoom level 15
            ]
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
            8,    // highlighted width - increased from 5 to 8
            2     // default width
        ]);
        
        debugHighlight(`Successfully updated polygon styles for index ${index}`);
    } catch (error) {
        console.error('Error in highlightPolygon:', error);
    }

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
                debugHighlight(`Added highlighted class to pin with id ${index}`);
            }
        }
    });

    // Remove highlight from all cards
    document.querySelectorAll('.card').forEach(c => c.classList.remove('highlighted-card'));

    // Add highlight to selected card
    const selectedCard = document.querySelector(`.card[data-index="${index}"]`);
    if (selectedCard) {
        selectedCard.classList.add('highlighted-card');
        debugHighlight(`Added highlighted-card class to card with data-index ${index}`);
        
        // Scroll the card into view if it's visible
        if (selectedCard.style.display !== 'none') {
            selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
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
    const updatesSelect = document.getElementById('updatesFilter');

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
    
    while (updatesSelect.options.length > 1) {
        updatesSelect.remove(1);
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
    
    // Add options for updates filter
    const hasUpdatesOption = document.createElement('option');
    hasUpdatesOption.value = "HAS_UPDATES";
    hasUpdatesOption.textContent = "აქვს განახლება";
    updatesSelect.appendChild(hasUpdatesOption);
    
    const noUpdatesOption = document.createElement('option');
    noUpdatesOption.value = "NO_UPDATES";
    noUpdatesOption.textContent = "არ აქვს განახლება";
    updatesSelect.appendChild(noUpdatesOption);

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
    
    // Count items with and without updates
    const updatesCounts = {
        "აქვს განახლება": 0,
        "არ აქვს განახლება": 0
    };
    
    data.forEach(item => {
        const updates = item["განახლებები"]?.trim() || '';
        if (updates) {
            updatesCounts["აქვს განახლება"]++;
        } else {
            updatesCounts["არ აქვს განახლება"]++;
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
        'ყველა სტატუსი',
        null,
        { 'უცნობი სტატუსი': 'EMPTY_STATUS' } // Add special value mapping
    );
    
    customDropdowns.updates = createCustomDropdown(
        'updatesFilter',
        ['აქვს განახლება', 'არ აქვს განახლება'],
        updatesCounts,
        'ყველა განახლება',
        null,
        { 'აქვს განახლება': 'HAS_UPDATES', 'არ აქვს განახლება': 'NO_UPDATES' }
    );

    // Add filter change handlers to the native selects (already connected via createCustomDropdown)
    districtSelect.addEventListener('change', applyFilters);
    villageSelect.addEventListener('change', applyFilters);
    prioritySelect.addEventListener('change', applyFilters);
    statusSelect.addEventListener('change', applyFilters);
    updatesSelect.addEventListener('change', applyFilters);
    
    // Debug the initial state of the updates filter
    console.log('Updates filter initialized with options:', {
        hasUpdates: 'HAS_UPDATES',
        noUpdates: 'NO_UPDATES',
        counts: updatesCounts
    });
}

// Update applyFilters function with search functionality
function applyFilters() {
    if (!sampleData.length || !map) return;

    // Get values from the original select elements or their data attributes
    const districtElement = document.getElementById('districtFilter');
    const villageElement = document.getElementById('villageFilter');
    const priorityElement = document.getElementById('priorityFilter');
    const statusElement = document.getElementById('statusFilter');
    const updatesElement = document.getElementById('updatesFilter');
    
    // Get values from data attributes if available, otherwise use the value property
    const selectedDistrict = districtElement.getAttribute('data-selected-values') || districtElement.value;
    const selectedVillage = villageElement.getAttribute('data-selected-values') || villageElement.value;
    const selectedPriority = priorityElement.getAttribute('data-selected-values') || priorityElement.value;
    const selectedStatus = statusElement.getAttribute('data-selected-values') || statusElement.value;
    const selectedUpdates = updatesElement.getAttribute('data-selected-values') || updatesElement.value;
    
    // Debug raw values from select elements
    console.log('Raw filter values:', {
        district: selectedDistrict,
        village: selectedVillage,
        priority: selectedPriority,
        status: selectedStatus,
        updates: selectedUpdates
    });
    
    const searchText = currentSearchText.toLowerCase().trim();

    // Parse comma-separated values for multi-select
    const selectedDistricts = selectedDistrict ? selectedDistrict.split(',') : [];
    const selectedVillages = selectedVillage ? selectedVillage.split(',') : [];
    const selectedPriorities = selectedPriority ? selectedPriority.split(',') : [];
    const selectedStatuses = selectedStatus ? selectedStatus.split(',') : [];
    const selectedUpdateOptions = selectedUpdates ? selectedUpdates.split(',') : [];

    console.log('Selected Districts:', selectedDistricts);
    console.log('Selected Villages:', selectedVillages);
    console.log('Selected Priorities:', selectedPriorities);
    console.log('Selected Statuses:', selectedStatuses);
    console.log('Selected Update Options:', selectedUpdateOptions);

    // Filter cards
    let visibleCardCount = 0;
    document.querySelectorAll('.card').forEach(card => {
        const index = card.getAttribute('data-index');
        const item = sampleData[index];

        // Trim values before comparison
        const itemDistrict = item['რაიონი']?.trim() || '';
        const itemVillage = item['სოფელი']?.trim() || '';
        const itemPriority = item['პრიორიტეტი']?.trim() || '';
        const itemStatus = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"]?.trim() || '';
        const itemUpdates = item["განახლებები"]?.trim() || '';

        // Check if matches any of the selected values or if no values are selected
        const matchesDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(itemDistrict);
        const matchesVillage = selectedVillages.length === 0 || selectedVillages.includes(itemVillage);
        const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(itemPriority);
        
        // Special handling for empty status
        const matchesStatus = selectedStatuses.length === 0 || 
            (selectedStatuses.includes("EMPTY_STATUS") && itemStatus === '') || 
            selectedStatuses.includes(itemStatus);
            
        // Special handling for updates filter - fixed logic
        let matchesUpdates = selectedUpdateOptions.length === 0; // Default if no options selected
        
        if (!matchesUpdates) {
            // Check each selected option
            for (const option of selectedUpdateOptions) {
                if (option === "HAS_UPDATES" && itemUpdates !== '') {
                    matchesUpdates = true;
                    break;
                }
                if (option === "NO_UPDATES" && itemUpdates === '') {
                    matchesUpdates = true;
                    break;
                }
                // Also check for direct matches with display values (fallback)
                if (option === "აქვს განახლება" && itemUpdates !== '') {
                    matchesUpdates = true;
                    break;
                }
                if (option === "არ აქვს განახლება" && itemUpdates === '') {
                    matchesUpdates = true;
                    break;
                }
            }
        }
        
        // Debug updates filter for a sample of items
        if (index < 5) {
            console.log(`Item ${index} updates: "${itemUpdates}", matches: ${matchesUpdates}, options: ${selectedUpdateOptions}`);
        }

        // Check if the item matches the search text
        const matchesSearch = !searchText || Object.values(item).some(value => {
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(searchText);
        });

        const isVisible = matchesDistrict && matchesVillage && matchesPriority && matchesStatus && matchesUpdates && matchesSearch;
        card.style.display = isVisible ? 'block' : 'none';
        
        if (isVisible) {
            visibleCardCount++;
        }
    });
    
    console.log('Visible card count:', visibleCardCount);

    // Update markers visibility
    let visibleMarkerCount = 0;
    locationMarkers.forEach(({ marker, properties }) => {
        // Trim values before comparison
        const propertyDistrict = properties['რაიონი']?.trim() || '';
        const propertyVillage = properties['სოფელი']?.trim() || '';
        const propertyPriority = properties['პრიორიტეტი']?.trim() || '';
        const propertyStatus = properties["სტატუსი\n(მომლოდინე/ დასრულებულია)"]?.trim() || '';
        const propertyUpdates = properties["განახლებები"]?.trim() || '';

        // Check if matches any of the selected values or if no values are selected
        const matchesDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(propertyDistrict);
        const matchesVillage = selectedVillages.length === 0 || selectedVillages.includes(propertyVillage);
        const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(propertyPriority);
        
        // Special handling for empty status
        const matchesStatus = selectedStatuses.length === 0 || 
            (selectedStatuses.includes("EMPTY_STATUS") && propertyStatus === '') || 
            selectedStatuses.includes(propertyStatus);
            
        // Special handling for updates filter - fixed logic
        let matchesUpdates = selectedUpdateOptions.length === 0; // Default if no options selected
        
        if (!matchesUpdates) {
            // Check each selected option
            for (const option of selectedUpdateOptions) {
                if (option === "HAS_UPDATES" && propertyUpdates !== '') {
                    matchesUpdates = true;
                    break;
                }
                if (option === "NO_UPDATES" && propertyUpdates === '') {
                    matchesUpdates = true;
                    break;
                }
                // Also check for direct matches with display values (fallback)
                if (option === "აქვს განახლება" && propertyUpdates !== '') {
                    matchesUpdates = true;
                    break;
                }
                if (option === "არ აქვს განახლება" && propertyUpdates === '') {
                    matchesUpdates = true;
                    break;
                }
            }
        }

        // Check if the properties match the search text
        const matchesSearch = !searchText || Object.values(properties).some(value => {
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(searchText);
        });

        const isVisible = matchesDistrict && matchesVillage && matchesPriority && matchesStatus && matchesUpdates && matchesSearch;
        marker.getElement().style.display = isVisible ? 'block' : 'none';
        
        if (isVisible) {
            visibleMarkerCount++;
        }
    });
    
    console.log('Visible marker count:', visibleMarkerCount);

    // Create a filtered dataset for the map
    const filteredData = sampleData.filter(item => {
        // Skip items without coordinates or with exact location that is a URL
        if (!item.lat || !item.lon || (item["ზუსტი ადგილმდებარეობა"]?.trim() && isURL(item["ზუსტი ადგილმდებარეობა"]))) {
            return false;
        }
        
        const itemDistrict = item['რაიონი']?.trim() || '';
        const itemVillage = item['სოფელი']?.trim() || '';
        const itemPriority = item['პრიორიტეტი']?.trim() || '';
        const itemStatus = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"]?.trim() || '';
        const itemUpdates = item["განახლებები"]?.trim() || '';

        // Check if matches any of the selected values or if no values are selected
        const matchesDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(itemDistrict);
        const matchesVillage = selectedVillages.length === 0 || selectedVillages.includes(itemVillage);
        const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(itemPriority);
        
        // Special handling for empty status
        const matchesStatus = selectedStatuses.length === 0 || 
            (selectedStatuses.includes("EMPTY_STATUS") && itemStatus === '') || 
            selectedStatuses.includes(itemStatus);
            
        // Special handling for updates filter - fixed logic
        let matchesUpdates = selectedUpdateOptions.length === 0; // Default if no options selected
        
        if (!matchesUpdates) {
            // Check each selected option
            for (const option of selectedUpdateOptions) {
                if (option === "HAS_UPDATES" && itemUpdates !== '') {
                    matchesUpdates = true;
                    break;
                }
                if (option === "NO_UPDATES" && itemUpdates === '') {
                    matchesUpdates = true;
                    break;
                }
                // Also check for direct matches with display values (fallback)
                if (option === "აქვს განახლება" && itemUpdates !== '') {
                    matchesUpdates = true;
                    break;
                }
                if (option === "არ აქვს განახლება" && itemUpdates === '') {
                    matchesUpdates = true;
                    break;
                }
            }
        }

        // Check if the item matches the search text
        const matchesSearch = !searchText || Object.values(item).some(value => {
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(searchText);
        });

        return matchesDistrict && matchesVillage && matchesPriority && matchesStatus && matchesUpdates && matchesSearch;
    });
    
    console.log(`Filtered data for map: ${filteredData.length} items`);

    // Group points by location
    const locationGroups = {};
    
    filteredData.forEach((item, i) => {
        // Find the original index in sampleData
        const index = sampleData.findIndex(d => d === item);
        
        let color;
        const status = item["სტატუსი\n(მომლოდინე/ დასრულებულია)"];
        const priority = item["პრიორიტეტი"]?.trim();

        // Check if priority is filled and status is not "აღმოუჩინეს დახმარება"
        if (priority && status !== "აღმოუჩინეს დახმარება") {
            color = '#000000'; // Black for priority items not completed
        } else if (status === "მომლოდინე") {
            color = '#e74c3c'; // Red
        } else if (status === "აღმოუჩინეს დახმარება" || status === "აღმოუჩინეს დახმარება") {
            color = '#2ecc71'; // Green
        } else if (status === "მიდის მოხალისე") {
            color = '#3498db'; // Blue
        } else if (status === "მოინახულა მოხალისემ") {
            color = '#9b59b6'; // Purple
        } else {
            color = '#95a5a6'; // Gray for unknown/empty status
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
    });

    // Create polygon features
    const features = Object.values(locationGroups).flatMap(group => {
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

    console.log(`Generated ${features.length} polygon features`);

    // Update the source data if it exists
    if (map.getSource('locations')) {
        try {
            map.getSource('locations').setData({
                type: 'FeatureCollection',
                features: features
            });
        } catch (error) {
            console.error('Error updating map source:', error);
        }
    } else {
        console.warn('Map source "locations" not found');
    }
}

// Initialize map after data is loaded
Promise.all([
    d3.csv("https://docs.google.com/spreadsheets/d/e/2PACX-1vRfK0UcHgAiwmJwTSWe2dxyIwzLFtS2150qbKVVti1uVfgDhwID3Ec6NLRrvX4AlABpxneejy1-lgTF/pub?gid=0&single=true&output=csv"),
    d3.csv('villages.csv')
])
    .then(function ([data, villages]) {

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

        // Filter out records without proper district and village information
        sampleData = sampleData.filter(item => {
            const district = item['რაიონი']?.trim() || '';
            const village = item['სოფელი']?.trim() || '';
            return district && village && district !== '-' && village !== '-';
        });
        
        const villageObj = {};
        villages.forEach(v => {
            villageObj[v.name] = v;
        });

        let localCounter = 0;
        let raioni_village_obj = {};
        sampleData.forEach(v => {
            const key = v['რაიონი'] + '_' + v['სოფელი'];
            if(v.lat && v.lon && !raioni_village_obj[key]) {
                raioni_village_obj[key] = v;
            }
        });
        sampleData.forEach(v => {
            const key = v['რაიონი'] + '_' + v['სოფელი'];
            if(raioni_village_obj[key] && !v.lat && !v.lon) {
                localCounter++;
                console.log(localCounter)
                v.lat = raioni_village_obj[key].lat;
                v.lon = raioni_village_obj[key].lon;
            }
        });

        let counter = 0;

        sampleData.forEach(item => {
            const village = ((villageObj[item['სოფელი']]) || '');
           
            if (village && village.name && !item.lat && !item.lon) {
                if (+village.lat && +village.long) {
                    console.log(counter++)
                    item.lat = +village.lat;
                    item.lon = +village.long;
                }
            }
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
            const priority = item["პრიორიტეტი"]?.trim();

            // Check for priority first
            if (priority && status !== "აღმოუჩინეს დახმარება") {
                statusClass = 'priority';
            } else if (status === "მომლოდინე") {
                statusClass = 'pending';
            } else if (status === "აღმოუჩინეს დახმარება" || status === "აღმოუჩინეს დახმარება") {
                statusClass = 'completed';
            } else if (status === "მიდის მოხალისე") {
                statusClass = 'volunteer-going';
            } else if (status === "მოინახულა მოხალისემ") {
                statusClass = 'volunteer-visited';
            } else if (!status || status.trim() === '') {
                statusClass = 'empty-status';
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
                                ${item.id ? `<button id="card-notification-btn-${index}" onclick="event.stopPropagation(); sendNotification('card-notification-btn-${index}')" class="card-notification-btn" style="position: relative; z-index: 3500;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>განაახლე ინფორმაცია!</button>` : ''}
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
                    console.log(`Card clicked for item ${index} with coordinates [${item.lon}, ${item.lat}]`);
                    debugHighlight(`Card clicked for item ${index} with coordinates [${item.lon}, ${item.lat}]`);
                    
                    // First, use the simple highlight approach that doesn't touch the map
                    // This ensures the card and pin are highlighted immediately
                    simpleHighlightPolygon(map, index);
                    
                    // Then fly to the location
                    map.flyTo({
                        center: [item.lon, item.lat],
                        zoom: 12
                    });
                    
                    // Log the map state
                    console.log("Map state:", {
                        zoom: map.getZoom(),
                        center: map.getCenter(),
                        mapInitialized: mapFullyInitialized,
                        hasPolygonLayer: map.getLayer('location-polygons') ? true : false,
                        hasOutlineLayer: map.getLayer('location-polygons-outline') ? true : false,
                        hasSource: map.getSource('locations') ? true : false
                    });
                    
                    // Add a longer delay to ensure the map has finished moving and all layers are loaded
                    setTimeout(() => {
                        // Check if map is ready, if not we'll retry with increasing delays
                        const mapReady = isMapReady(map);
                        console.log(`Map ready check result: ${mapReady}`);
                        
                        if (mapReady) {
                            console.log(`Highlighting polygon with index ${index} on first attempt`);
                            highlightPolygon(map, index);
                        } else {
                            console.log("Map not ready on first attempt, will retry with increasing delays");
                            debugHighlight("Map not ready on first attempt, will retry with increasing delays");
                            
                            // Try to ensure map has required layers
                            const layersEnsured = ensureMapLayers(map);
                            console.log(`Map layers ensured: ${layersEnsured}`);
                            
                            // If layers were ensured, try the direct highlight approach
                            if (layersEnsured) {
                                directHighlightPolygon(map, index);
                            }
                            
                            // Try again after 500ms
                            setTimeout(() => {
                                const mapReadySecondAttempt = isMapReady(map);
                                console.log(`Map ready check second attempt: ${mapReadySecondAttempt}`);
                                
                                if (mapReadySecondAttempt) {
                                    console.log(`Highlighting polygon with index ${index} on second attempt`);
                                    highlightPolygon(map, index);
                                } else {
                                    console.log("Map not ready on second attempt, trying once more");
                                    debugHighlight("Map not ready on second attempt, trying once more");
                                    
                                    // Final attempt after another 1000ms
                                    setTimeout(() => {
                                        console.log("Final attempt to highlight polygon");
                                        console.log("Map state:", {
                                            zoom: map.getZoom(),
                                            center: map.getCenter(),
                                            mapInitialized: mapFullyInitialized,
                                            hasPolygonLayer: map.getLayer('location-polygons') ? true : false,
                                            hasOutlineLayer: map.getLayer('location-polygons-outline') ? true : false,
                                            hasSource: map.getSource('locations') ? true : false
                                        });
                                        
                                        // Force highlight even if map isn't ready
                                        try {
                                            console.log(`Forcing highlight for index ${index}`);
                                            highlightPolygon(map, index, true); // Force highlight
                                        } catch (error) {
                                            console.error("Error in final highlight attempt:", error);
                                        }
                                    }, 1000);
                                }
                            }, 500);
                        }
                    }, 200);
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
                if (item.lat && item.lon && item["ზუსტი ადგილმდებარეობა"]?.trim() && isURL(item["ზუსტი ადგილმდებარეობა"])) {
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
                    const priority = item["პრიორიტეტი"]?.trim();

                    // Check if priority is filled and status is not "აღმოუჩინეს დახმარება"
                    if (priority && status !== "აღმოუჩინეს დახმარება") {
                        color = '#000000'; // Black for priority items not completed
                    } else if (status === "მომლოდინე") {
                        color = '#e74c3c';  // Red
                    } else if (status === "აღმოუჩინეს დახმარება" || status === "აღმოუჩინეს დახმარება") {
                        color = '#2ecc71';  // Green
                    } else if (status === "მიდის მოხალისე") {
                        color = '#3498db';  // Blue
                    } else if (status === "მოინახულა მოხალისემ") {
                        color = '#9b59b6';  // Purple
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
                                            padding: 10,
                                            altAxis: true
                                        }
                                    },
                                    {
                                        name: 'flip',
                                        options: {
                                            fallbackPlacements: ['bottom', 'right', 'left'],
                                            padding: 10
                                        }
                                    }
                                ]
                            },
                            interactiveBorder: 30,
                            zIndex: 3000,
                            maxWidth: 350,
                            // Add these properties for scrollable tooltips
                            animation: 'shift-away',
                            onMount(instance) {
                                // Check if tooltip content is taller than viewport
                                const box = instance.popper.querySelector('.tippy-box');
                                if (box) {
                                    const viewportHeight = window.innerHeight;
                                    const tooltipHeight = box.offsetHeight;

                                    if (tooltipHeight > viewportHeight * 0.8) {
                                        // If tooltip is too tall, add a class to enable scrolling
                                        box.classList.add('scrollable-tooltip');
                                    }
                                }
                            }
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
                    'fill-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        5, 0.01,   // At zoom level 5, opacity is 1%
                        8, 0.3,    // At zoom level 8, opacity is 30%
                        11, 0.8,   // At zoom level 11, opacity peaks at 80%
                        13, 0.3,   // At zoom level 13, opacity decreases to 30%
                        15, 0.08   // At zoom level 15, opacity is 8%
                    ]
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
            
            // Set the flag indicating the map is fully initialized
            mapFullyInitialized = true;
            debugHighlight("Map is now fully initialized and ready for highlighting");
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
            iframe.onload = function () {
                this.contentWindow.onerror = function () { return true; };
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
                        'fill-opacity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            5, 0.01,   // At zoom level 5, opacity is 1%
                            8, 0.3,    // At zoom level 8, opacity is 30%
                            11, 0.8,   // At zoom level 11, opacity peaks at 80%
                            13, 0.3,   // At zoom level 13, opacity decreases to 30%
                            15, 0.08   // At zoom level 15, opacity is 8%
                        ]
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
            
            debugHighlight(`Polygon clicked with id: ${id}`);
            
            // Use the same approach as the card click handler
            if (!isMapReady(map)) {
                debugHighlight("Map not ready on polygon click, will retry with increasing delays");
                
                // Try again after 200ms
                setTimeout(() => {
                    highlightPolygon(map, id);
                    
                    // Create tooltip after highlighting
                    createTooltipForFeature(feature, id, e.point);
                }, 200);
            } else {
                highlightPolygon(map, id);
                
                // Create tooltip after highlighting
                createTooltipForFeature(feature, id, e.point);
            }
        }
    });

    // Helper function to create tooltip for a feature
    function createTooltipForFeature(feature, id, point) {
        // Get click position - adjust to match similar positioning as the pins
        const clickX = point.x;
        const clickY = point.y - 15; // Position higher to match pin tooltip placement

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

        // Create new instance on the marker element
        setTimeout(() => {
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
                                padding: 10,
                                altAxis: true
                            }
                        },
                        {
                            name: 'flip',
                            options: {
                                fallbackPlacements: ['bottom', 'right', 'left'],
                                padding: 10
                            }
                        }
                    ]
                },
                interactiveBorder: 30,
                zIndex: 3000,
                maxWidth: 350,
                // Add these properties for scrollable tooltips
                animation: 'shift-away',
                onMount(instance) {
                    // Check if tooltip content is taller than viewport
                    const box = instance.popper.querySelector('.tippy-box');
                    if (box) {
                        const viewportHeight = window.innerHeight;
                        const tooltipHeight = box.offsetHeight;

                        if (tooltipHeight > viewportHeight * 0.8) {
                            // If tooltip is too tall, add a class to enable scrolling
                            box.classList.add('scrollable-tooltip');
                        }
                    }
                }
            });

            // Show the tooltip
            if (window.tippyInstances[id] && window.tippyInstances[id].show) {
                window.tippyInstances[id].show();
            }
        }, 0);
    }

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
        // Log current zoom level for debugging
        console.log('Current zoom level:', map.getZoom());
        
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

    // Ensure the modal has the highest z-index
    modal.style.zIndex = "4000";
    
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
                    <input placeholder="თქვენი სახელი" type="text" id="volunteer-name" name="volunteer-name" required>
                </div>
                <div class="form-group">
                    <label for="phone-number">ტელეფონის ნომერი</label>
                    <input placeholder="თქვენი ტელეფონის ნომერი" type="tel" id="phone-number" name="phone-number" required>
                </div>
                <div class="form-group">
                    <label for="notification-message">შეტყობინება</label>
                    <textarea placeholder="რა სახის დახმარება იგეგმება ან გაეწია დაზარალებულს" id="notification-message" name="notification-message" rows="4" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn" onclick="closeNotificationModal()">გაუქმება</button>
                    <button type="submit" class="submit-btn">გაგზავნა</button>
                </div>
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

    // Ensure the modal has the highest z-index
    modal.style.zIndex = "4000";
    
    // Don't close tooltips - we want them to remain visible
    // The notification modal will appear on top due to higher z-index

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
document.addEventListener('DOMContentLoaded', function () {
    const notificationForm = document.getElementById('notification-form');
    if (notificationForm) {
        notificationForm.addEventListener('submit', submitNotification);
    }

    // Initialize search functionality
    initializeSearch();
});

// Function to initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearch');

    if (!searchInput || !clearButton) return;

    // Add event listener for input changes
    searchInput.addEventListener('input', function () {
        const searchText = this.value.trim();
        currentSearchText = searchText;

        // Show/hide clear button based on search text
        clearButton.style.display = searchText ? 'block' : 'none';

        // Apply filters with the new search text
        applyFilters();
    });

    // Add event listener for clear button
    clearButton.addEventListener('click', function () {
        searchInput.value = '';
        currentSearchText = '';
        this.style.display = 'none';

        // Apply filters with empty search text
        applyFilters();

        // Focus the search input after clearing
        searchInput.focus();
    });

    // Add event listener for Enter key
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFilters();
        }
    });
}

// Functions for instructions modal
function openInstructionsModal() {
    const modal = document.getElementById('instructions-modal');
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

function closeInstructionsModal() {
    const modal = document.getElementById('instructions-modal');
    const mobileSidebarButton = document.querySelector('.mobile-sidebar-button');

    modal.classList.remove('active');

    // Add a small delay before hiding the modal to allow for animation
    setTimeout(() => {
        modal.style.display = 'none';

        // Show the mobile sidebar button again if it exists
        if (mobileSidebarButton && window.innerWidth <= 768) {
            mobileSidebarButton.style.display = 'block';
        }
    }, 300);

    // Re-enable scrolling of the background content
    document.body.style.overflow = '';
}

// Function to initialize instruction tabs
function initInstructionTabs() {
    const tabs = document.querySelectorAll('.instructions-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all content sections
            document.querySelectorAll('.instructions-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show the corresponding content section
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });
}

// Add event listener for DOM content loaded to initialize tabs
document.addEventListener('DOMContentLoaded', function() {
    initInstructionTabs();
});

// Add a direct approach to highlight the polygon without relying on the map source
function directHighlightPolygon(map, index) {
    console.log(`Direct highlighting polygon with index: ${index}`);
    
    try {
        // Ensure map has required layers
        const layersEnsured = ensureMapLayers(map);
        if (!layersEnsured) {
            console.error("Could not ensure map layers, aborting direct highlight");
            return;
        }
        
        // Set the paint properties directly without modifying the source data
        map.setPaintProperty('location-polygons', 'fill-opacity', [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, [
                'case',
                ['==', ['get', 'id'], index],
                0.9,  // highlighted opacity
                0.01  // default opacity at zoom level 5
            ],
            8, [
                'case',
                ['==', ['get', 'id'], index],
                0.9,  // highlighted opacity
                0.3   // default opacity at zoom level 8
            ],
            11, [
                'case',
                ['==', ['get', 'id'], index],
                0.9,  // highlighted opacity
                0.8   // default opacity at zoom level 11
            ],
            13, [
                'case',
                ['==', ['get', 'id'], index],
                0.9,  // highlighted opacity
                0.3   // default opacity at zoom level 13
            ],
            15, [
                'case',
                ['==', ['get', 'id'], index],
                0.9,  // highlighted opacity
                0.08  // default opacity at zoom level 15
            ]
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
            8,    // highlighted width - increased from 5 to 8
            2     // default width
        ]);
        
        console.log(`Successfully updated polygon styles for index ${index}`);
        
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
                    console.log(`Added highlighted class to pin with id ${index}`);
                }
            }
        });

        // Remove highlight from all cards
        document.querySelectorAll('.card').forEach(c => c.classList.remove('highlighted-card'));

        // Add highlight to selected card
        const selectedCard = document.querySelector(`.card[data-index="${index}"]`);
        if (selectedCard) {
            selectedCard.classList.add('highlighted-card');
            console.log(`Added highlighted-card class to card with data-index ${index}`);
            
            // Scroll the card into view if it's visible
            if (selectedCard.style.display !== 'none') {
                selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    } catch (error) {
        console.error('Error in directHighlightPolygon:', error);
    }
}

// Add a function to ensure the map has the required layers
function ensureMapLayers(map) {
    if (!map) return false;
    
    try {
        // Check if the map has the required layers
        const hasPolygonLayer = map.getLayer('location-polygons');
        const hasOutlineLayer = map.getLayer('location-polygons-outline');
        
        // If layers don't exist, try to add them
        if (!hasPolygonLayer || !hasOutlineLayer) {
            console.log("Required layers not found, attempting to add them");
            
            // Check if the source exists
            const hasSource = map.getSource('locations');
            
            if (!hasSource) {
                console.log("Source 'locations' not found, attempting to add it");
                
                // Create features
                const features = updateFeatures(true);
                
                // Add source
                map.addSource('locations', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: features
                    }
                });
            }
            
            // Add polygon layer if it doesn't exist
            if (!hasPolygonLayer) {
                console.log("Adding 'location-polygons' layer");
                map.addLayer({
                    id: 'location-polygons',
                    type: 'fill',
                    source: 'locations',
                    paint: {
                        'fill-color': ['get', 'fillColor'],
                        'fill-opacity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            5, 0.01,   // At zoom level 5, opacity is 1%
                            8, 0.3,    // At zoom level 8, opacity is 30%
                            11, 0.8,   // At zoom level 11, opacity peaks at 80%
                            13, 0.3,   // At zoom level 13, opacity decreases to 30%
                            15, 0.08   // At zoom level 15, opacity is 8%
                        ]
                    }
                });
            }
            
            // Add outline layer if it doesn't exist
            if (!hasOutlineLayer) {
                console.log("Adding 'location-polygons-outline' layer");
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
            
            return true;
        }
        
        return true;
    } catch (error) {
        console.error("Error ensuring map layers:", error);
        return false;
    }
}

// Add a simpler direct highlight function that doesn't rely on the map source
function simpleHighlightPolygon(map, index) {
    console.log(`Simple highlighting polygon with index: ${index}`);
    
    try {
        // Just highlight the card and pin without touching the map
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
                    console.log(`Added highlighted class to pin with id ${index}`);
                }
            }
        });

        // Remove highlight from all cards
        document.querySelectorAll('.card').forEach(c => c.classList.remove('highlighted-card'));

        // Add highlight to selected card
        const selectedCard = document.querySelector(`.card[data-index="${index}"]`);
        if (selectedCard) {
            selectedCard.classList.add('highlighted-card');
            console.log(`Added highlighted-card class to card with data-index ${index}`);
            
            // Scroll the card into view if it's visible
            if (selectedCard.style.display !== 'none') {
                selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    } catch (error) {
        console.error('Error in simpleHighlightPolygon:', error);
    }
}
