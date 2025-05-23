# 🚮 Garbage Watch

A civic tech Progressive Web App (PWA) that empowers citizens to report and track garbage cleanup in their communities.

## Project Overview

Garbage Watch is a mobile-first app designed to help local communities identify and track unmanaged waste areas. Users can submit real-time photos of garbage along with GPS coordinates, creating a public-facing map of "hotspots" that need attention.

- **Geo-tagged submissions**
- **Public-facing gallery** of cleanliness reports
- **Status tracker** to follow cleanup progress
- **Mobile-first** and offline-capable PWA

## Features

- **Report Form**: Take photos using your mobile device's camera, automatically capturing GPS coordinates
- **Map View**: Interactive map showing all reported garbage spots with color-coded status indicators
- **Gallery**: Browse through submitted reports with thumbnails and status
- **Status Tracker**: Monitor the progress of your own submissions
- **Admin Dashboard**: For authorities to manage and update the status of reports

## Technologies Used

- **Frontend**: React with TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Maps**: Leaflet.js + OpenStreetMap
- **Backend/Database**: Firebase (Firestore)
- **Storage**: Firebase Storage
- **Authentication**: Firebase Authentication
- **PWA Support**: Workbox via Vite PWA plugin

## Getting Started

### Prerequisites

- Node.js (v14+)
- NPM or Yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/garbage-watch.git
cd garbage-watch
```

2. Install dependencies:
```
npm install
```

3. Set up your Firebase project and update the configuration in `src/firebase/config.ts`.

4. Start the development server:
```
npm run dev
```

### Building for Production

```
npm run build
```

## Development Roadmap

- **Phase 1: MVP** 
  - Report form with image + location + Firestore
  - Map view with pins
  - Gallery of all reports
  - Simple status tags (no real update yet)

- **Phase 2: Admin Dashboard**
  - Firebase Auth login
  - Table/grid with reports
  - Update status
  - Map filter by status

- **Phase 3: PWA Deployment**
  - Offline support
  - "Add to Home Screen" enabled
  - Push to Firebase Hosting or Vercel

## License

This project is licensed under the MIT License.
