# Moxalise.ge - Guria Region Snow Emergency Response Map

## Overview
Moxalise.ge is an interactive web application that provides critical information and coordination for emergency response during heavy snowfall in the Guria region of Georgia. This platform visualizes the locations of affected residents, their needs, and the status of assistance efforts on an interactive map.

## Purpose
The extreme snowfall in the Guria region has created emergency situations for many residents who need urgent help. This platform serves as a centralized information hub to:
- Map the locations of affected individuals and families
- Track the status of assistance efforts
- Coordinate relief work between volunteers and official agencies
- Provide real-time updates on priorities and needs

## Features
- **Interactive Map**: Displays precise and approximate locations of people needing assistance
- **Status Indicators**: Color-coded pins showing which locations have received help and which are still waiting
- **Filtering System**: Filter data by district, village, and priority level
- **Detailed Information Cards**: Click on map markers to view detailed information about each case
- **Data Integration**: Direct connection to a Google Sheets database for real-time updates
- **Mobile Responsive**: Fully functional on mobile devices for field use
- **Location Services**: "My Location" feature to help volunteers navigate
- **Satellite View**: Toggle between standard and satellite map views
- **Community Links**: Direct access to Facebook and Telegram support groups

## Technology Stack
- HTML5, CSS3, and JavaScript
- MapLibre GL JS for map visualization
- D3.js for data processing
- Tippy.js for tooltips and info cards
- Google Sheets API for data source management
- Responsive design for cross-device compatibility

## Setup and Deployment
1. Clone the repository:
   ```
   git clone https://github.com/bumbeishvili/moxalise.ge.git
   ```
2. Open `index.html` in a web browser to run locally
3. Deploy to any static file hosting service (GitHub Pages, Netlify, etc.)

## Data Source
The application pulls data from a [Google Spreadsheet](https://docs.google.com/spreadsheets/d/1cWGBzYPa93_NZq8ZwtqF94fhwIdovrWkPg6-PRNaVHc/edit#gid=0) that's maintained by volunteers and coordinators. This ensures that information is kept up-to-date as the situation evolves.

## Community Resources
- [Facebook Group](https://www.facebook.com/groups/634781109242732): Community-driven support and coordination
- [Telegram Group](https://t.me/guria_sos): Real-time communication channel for urgent needs

## Contributing
Contributions to improve the platform are welcome:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is open source and available to anyone who wishes to use it for coordinating emergency response.

## Acknowledgments
- All volunteers helping during the Guria snow emergency
- Data collectors and coordinators maintaining the information
- Developers and contributors to the open-source tools used in this project