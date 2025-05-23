import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useReportStore } from '../store/reportStore';
import type { ReportStatus } from '../store/reportStore';
import { formatDate } from '../utils/helpers';

const GalleryView = () => {
  const { reports, fetchReports, loading } = useReportStore();
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'All'>('All');
  const [searchText, setSearchText] = useState('');
  
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);
  
  // Filter reports based on status and search text
  const filteredReports = reports.filter(report => {
    const statusMatch = selectedStatus === 'All' || report.status === selectedStatus;
    const searchMatch = !searchText || 
      (report.description?.toLowerCase().includes(searchText.toLowerCase()) || 
       report.address?.toLowerCase().includes(searchText.toLowerCase()));
    
    return statusMatch && searchMatch;
  });
  
  // Sort reports by submission date (most recent first)
  const sortedReports = [...filteredReports].sort((a, b) => 
    b.submittedAt.getTime() - a.submittedAt.getTime()
  );
  
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Garbage Reports Gallery</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse all submitted reports. Filter by status or search by description.
        </p>
      </div>
      
      {/* Search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Search reports..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedStatus('All')}
            className="px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white"
          >
            All
          </button>
          <button
            onClick={() => setSelectedStatus('Pending')}
            className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
          >
            Pending
          </button>
          <button
            onClick={() => setSelectedStatus('In Progress')}
            className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
          >
            In Progress
          </button>
          <button
            onClick={() => setSelectedStatus('Resolved')}
            className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
          >
            Resolved
          </button>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <p>Loading...</p>
        </div>
      )}
      
      {/* Reports grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedReports.map(report => (
            <div key={report.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="relative h-48">
                <img
                  src={report.imageURL}
                  alt="Garbage"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {report.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-1">
                  Submitted on {formatDate(report.submittedAt)}
                </p>
                {report.description && (
                  <p className="text-sm text-gray-700">
                    {report.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    ID: {report.id.substring(0, 8)}
                  </div>
                  <Link
                    to={`/map?report=${report.id}`}
                    className="text-xs font-medium text-green-600 hover:text-green-500"
                  >
                    View on map
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryView; 