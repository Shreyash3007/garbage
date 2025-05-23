import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useReportStore } from '../store/reportStore';
import { getOrCreateDeviceId, formatDate, getStatusColor } from '../utils/helpers';

const StatusTracker = () => {
  const { reports, fetchReports, loading } = useReportStore();
  const [deviceId, setDeviceId] = useState<string>('');
  
  useEffect(() => {
    // Get the device ID from local storage
    const id = getOrCreateDeviceId();
    setDeviceId(id);
    
    // Fetch all reports
    fetchReports();
  }, [fetchReports]);
  
  // Filter reports by the current device ID
  const userReports = reports.filter(report => report.deviceId === deviceId);
  
  // Sort by newest first
  const sortedReports = [...userReports].sort((a, b) => 
    b.submittedAt.getTime() - a.submittedAt.getTime()
  );
  
  // Group reports by status
  const pendingReports = sortedReports.filter(report => report.status === 'Pending');
  const inProgressReports = sortedReports.filter(report => report.status === 'In Progress');
  const resolvedReports = sortedReports.filter(report => report.status === 'Resolved');
  
  // Generate status statistics
  const totalReports = sortedReports.length;
  const pendingPercentage = totalReports ? Math.round((pendingReports.length / totalReports) * 100) : 0;
  const inProgressPercentage = totalReports ? Math.round((inProgressReports.length / totalReports) * 100) : 0;
  const resolvedPercentage = totalReports ? Math.round((resolvedReports.length / totalReports) * 100) : 0;
  
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Your Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track the status of garbage reports you've submitted from this device.
        </p>
      </div>
      
      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : sortedReports.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No reports found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't submitted any garbage reports from this device yet.
          </p>
          <Link
            to="/report"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Submit a report
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Report Statistics</h3>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800">Pending</p>
                  <p className="mt-2 flex items-baseline">
                    <span className="text-2xl font-semibold text-red-600">{pendingReports.length}</span>
                    <span className="ml-2 text-sm text-red-500">reports</span>
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-800">In Progress</p>
                  <p className="mt-2 flex items-baseline">
                    <span className="text-2xl font-semibold text-yellow-600">{inProgressReports.length}</span>
                    <span className="ml-2 text-sm text-yellow-500">reports</span>
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800">Resolved</p>
                  <p className="mt-2 flex items-baseline">
                    <span className="text-2xl font-semibold text-green-600">{resolvedReports.length}</span>
                    <span className="ml-2 text-sm text-green-500">reports</span>
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <div className="bg-gray-200 rounded-full h-2.5">
                  <div className="flex h-2.5 rounded-full overflow-hidden">
                    {pendingPercentage > 0 && (
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${pendingPercentage}%` }}
                      ></div>
                    )}
                    {inProgressPercentage > 0 && (
                      <div 
                        className="bg-yellow-500" 
                        style={{ width: `${inProgressPercentage}%` }}
                      ></div>
                    )}
                    {resolvedPercentage > 0 && (
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${resolvedPercentage}%` }}
                      ></div>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-600">
                  <div>0%</div>
                  <div>100%</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* All Reports */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Your Submissions</h3>
              <p className="mt-1 text-sm text-gray-500">List of all reports submitted from this device</p>
            </div>
            <div className="border-t border-gray-200">
              <ul role="list" className="divide-y divide-gray-200">
                {sortedReports.map(report => (
                  <li key={report.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16 rounded overflow-hidden">
                        <img 
                          src={report.imageURL} 
                          alt="Garbage" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Unavailable';
                          }}
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Submitted on {formatDate(report.submittedAt)}
                            </p>
                          </div>
                          <Link
                            to={`/map?report=${report.id}`}
                            className="inline-flex items-center text-xs font-medium text-green-600 hover:text-green-500"
                          >
                            View on map
                            <svg className="ml-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </Link>
                        </div>
                        {report.description && (
                          <p className="mt-1 text-sm text-gray-700 line-clamp-1">
                            {report.description}
                          </p>
                        )}
                        <div className="mt-1 text-xs text-gray-500">
                          ID: {report.id.substring(0, 8)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusTracker; 