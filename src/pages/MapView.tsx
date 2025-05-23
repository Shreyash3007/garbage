import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useReportStore } from '../store/reportStore';
import type { Report, ReportStatus } from '../store/reportStore';
import { getPinColor, formatDate } from '../utils/helpers';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2hyZXlhc2gwNDUiLCJhIjoiY21hNGI5YXhzMDNwcTJqczYyMnR3OWdkcSJ9.aVpyfgys6f-h27ftG_63Zw';
const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };

mapboxgl.accessToken = MAPBOX_TOKEN;

const MapView = () => {
  const { reports, fetchReports, loading } = useReportStore();
  const [activeFilters, setActiveFilters] = useState<ReportStatus[]>(['Pending', 'In Progress', 'Resolved']);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter reports based on active filters
  const filteredReports = reports.filter(report => activeFilters.includes(report.status));

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainerRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [PUNE_CENTER.lng, PUNE_CENTER.lat],
      zoom: 12,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add markers
  useEffect(() => {
    if (!mapRef.current) return;
    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    filteredReports.forEach(report => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.background = getPinColor(report.status);
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.2)';
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => setSelectedReport(report));
      const marker = new mapboxgl.Marker(el)
        .setLngLat([report.lng, report.lat])
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
    // Center map if there are reports
    if (filteredReports.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredReports.forEach(r => bounds.extend([r.lng, r.lat]));
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }
  }, [filteredReports]);

  // Popup for selected report
  useEffect(() => {
    if (!mapRef.current) return;
    let popup: mapboxgl.Popup | null = null;
    if (selectedReport) {
      popup = new mapboxgl.Popup({ closeOnClick: true, maxWidth: '320px' })
        .setLngLat([selectedReport.lng, selectedReport.lat])
        .setHTML(`
          <div class='p-1'>
            <div class='w-full h-32 bg-gray-200 rounded overflow-hidden mb-2'>
              <img src='${selectedReport.imageURL}' alt='Garbage' style='width:100%;height:100%;object-fit:cover;' onerror="this.src='https://via.placeholder.com/300x200?text=Image+Unavailable'" />
            </div>
            <div class='inline-block px-2 py-1 rounded-full text-xs font-medium ${selectedReport.status === 'Pending' ? 'bg-red-100 text-red-800' : selectedReport.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}'>
              ${selectedReport.status}
            </div>
            <p class='text-xs text-gray-500 mt-1'>Submitted: ${formatDate(selectedReport.submittedAt)}</p>
            ${selectedReport.description ? `<p class='text-sm mt-2 text-gray-700 line-clamp-2'>${selectedReport.description}</p>` : ''}
          </div>
        `)
        .addTo(mapRef.current);
      popup.on('close', () => setSelectedReport(null));
    }
    return () => {
      if (popup) popup.remove();
    };
  }, [selectedReport]);

  // Toggle filter
  const toggleFilter = (status: ReportStatus) => {
    if (activeFilters.includes(status)) {
      setActiveFilters(prev => prev.filter(s => s !== status));
    } else {
      setActiveFilters(prev => [...prev, status]);
    }
  };

  return (
    <div className="max-w-full mx-auto h-screen flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Garbage Map</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all reported garbage locations. Filter by status to see what's being addressed.
          </p>
          {/* Filters */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => toggleFilter('Pending')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${activeFilters.includes('Pending') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
              Pending
            </button>
            <button
              onClick={() => toggleFilter('In Progress')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${activeFilters.includes('In Progress') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
              In Progress
            </button>
            <button
              onClick={() => toggleFilter('Resolved')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${activeFilters.includes('Resolved') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
              Resolved
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-gray-100 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500">Loading map data...</p>
            </div>
          </div>
        )}
        <div ref={mapContainerRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

export default MapView; 