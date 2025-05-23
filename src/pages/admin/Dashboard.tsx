import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, query, where, updateDoc, doc, orderBy } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import type { Report, ReportStatus } from '../../store/reportStore';
import DemoDataGenerator from './DemoDataGenerator';

const Dashboard = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'generate'>('reports');
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Verify if user is admin (this is a simplified version, proper role-based access should be implemented)
        setIsAdmin(true);
      } else {
        // User is not logged in, redirect to login
        navigate('/admin/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchReports = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    
    try {
      const db = getFirestore();
      let reportsQuery;
      
      // Apply status filter if not "all"
      if (filterStatus !== 'all') {
        reportsQuery = query(
          collection(db, "reports"), 
          where("status", "==", filterStatus),
          orderBy("submittedAt", "desc")
        );
      } else {
        reportsQuery = query(
          collection(db, "reports"),
          orderBy("submittedAt", "desc")
        );
      }
      
      const querySnapshot = await getDocs(reportsQuery);
      
      const reportsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt.toDate()
      })) as Report[];
      
      setReports(reportsList);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch reports when filter changes or when the active tab changes to 'reports'
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [isAdmin, filterStatus, activeTab]);
  
  const handleStatusUpdate = async (reportId: string, newStatus: ReportStatus) => {
    try {
      const db = getFirestore();
      const reportRef = doc(db, "reports", reportId);
      await updateDoc(reportRef, { status: newStatus });
      
      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId ? { ...report, status: newStatus } : report
        )
      );
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };
  
  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
      navigate('/admin/login');
    });
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'Pending': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !reports.length) {
    return (
      <div className="flex justify-center items-center h-96">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={handleSignOut}
          className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
      
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`${
              activeTab === 'reports'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
          <button
            className={`${
              activeTab === 'generate'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('generate')}
          >
            Generate Demo Data
          </button>
        </nav>
      </div>

      {activeTab === 'reports' && (
        <>
          <div className="mb-6 flex flex-wrap space-x-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setFilterStatus('Pending')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'Pending' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('In Progress')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
              In Progress
            </button>
            <button
              onClick={() => setFilterStatus('Resolved')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
              Resolved
            </button>
            <button
              onClick={fetchReports}
              className="ml-auto px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600"
            >
              <span className="inline-block mr-1.5">↻</span>
              Refresh
            </button>
          </div>

          {loading && (
            <div className="flex justify-center my-8">
              <div className="animate-spin h-8 w-8 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {reports.length === 0 && !loading ? (
                <li className="px-4 py-5 sm:px-6">
                  <p className="text-gray-500">No {filterStatus === 'all' ? '' : filterStatus.toLowerCase()} reports found.</p>
                </li>
              ) : (
                reports.map((report) => (
                  <li key={report.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden">
                          <img 
                            src={report.imageURL} 
                            alt="Report" 
                            className="h-12 w-12 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Error';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {report.address || `${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}`}
                            {report.isDemo && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Demo</span>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-500">
                              {new Date(report.submittedAt).toLocaleDateString()}
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(report.status)}`}>
                              {report.status}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {report.status !== 'In Progress' && (
                          <button
                            onClick={() => handleStatusUpdate(report.id, 'In Progress')}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                          >
                            In Progress
                          </button>
                        )}
                        {report.status !== 'Resolved' && (
                          <button
                            onClick={() => handleStatusUpdate(report.id, 'Resolved')}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            Resolved
                          </button>
                        )}
                        {report.status !== 'Pending' && (
                          <button
                            onClick={() => handleStatusUpdate(report.id, 'Pending')}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                          >
                            Pending
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}

      {activeTab === 'generate' && (
        <DemoDataGenerator />
      )}
    </div>
  );
};

export default Dashboard; 