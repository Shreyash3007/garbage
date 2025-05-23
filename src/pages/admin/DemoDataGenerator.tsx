import { useState, useRef } from 'react';
import { generateDemoReports, deleteAllDemoData } from '../../utils/generateDemoReports';

const DemoDataGenerator = () => {
  const [count, setCount] = useState<number>(50);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const generationUnsubscribeRef = useRef<(() => void) | null>(null);

  const handleGenerate = async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      setStatus('Initializing...');
      setProgress(0);
      
      // Start generation and store the unsubscribe function
      generationUnsubscribeRef.current = generateDemoReports(count, (currentProgress: number, message: string) => {
        setProgress(currentProgress);
        setStatus(message);
        
        // When complete
        if (currentProgress === 100) {
          setIsGenerating(false);
          generationUnsubscribeRef.current = null;
        }
      });
    } catch (err: any) {
      console.error('Error generating reports:', err);
      setError(err.message || 'Failed to generate reports');
      setIsGenerating(false);
    }
  };

  const handleCancelGeneration = () => {
    if (generationUnsubscribeRef.current) {
      generationUnsubscribeRef.current();
      generationUnsubscribeRef.current = null;
      setStatus('Generation cancelled.');
      setIsGenerating(false);
    }
  };

  const handleDeleteDemoData = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      setStatus('Fetching demo data...');
      setProgress(0);
      
      await deleteAllDemoData((currentProgress: number, message: string) => {
        setProgress(currentProgress);
        setStatus(message);
      });
      
    } catch (err: any) {
      console.error('Error deleting demo data:', err);
      setError(err.message || 'Failed to delete demo data');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Demo Data Generator</h2>
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Number of Reports to Generate</label>
        <div className="flex items-center">
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full mr-4"
            disabled={isGenerating || isDeleting}
          />
          <span className="text-gray-700 font-medium w-12 text-center">{count}</span>
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">
          This will generate {count} random reports with realistic data for Pune region.
          Each report includes random location, description, timestamp, and images from Unsplash.
        </p>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">
            <strong>Warning:</strong> This process may take several minutes and will consume storage quota.
          </p>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={isGenerating ? handleCancelGeneration : handleGenerate}
          disabled={isDeleting}
          className={`flex-1 py-2 px-4 rounded-md font-medium text-white ${
            isDeleting ? 'bg-gray-400' : 
            isGenerating ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isGenerating ? 'Cancel Generation' : 'Generate Demo Data'}
        </button>
        
        <button
          onClick={handleDeleteDemoData}
          disabled={isGenerating || isDeleting}
          className={`flex-1 py-2 px-4 rounded-md font-medium text-white ${
            isGenerating || isDeleting ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isDeleting ? 'Deleting...' : 'Delete All Demo Data'}
        </button>
      </div>
      
      {(isGenerating || isDeleting) && (
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{status}</p>
        </div>
      )}
      
      {error && (
        <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {!isGenerating && !isDeleting && progress === 100 && (
        <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4">
          <p className="text-green-700">{status}</p>
        </div>
      )}
    </div>
  );
};

export default DemoDataGenerator; 