import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportStore } from '../store/reportStore';
import { getOrCreateDeviceId } from '../utils/helpers';

const ReportForm = () => {
  const navigate = useNavigate();
  const { addReport, loading, error } = useReportStore();
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const [manualLocation, setManualLocation] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>('18.5204'); // Default Pune latitude
  const [manualLng, setManualLng] = useState<string>('73.8567'); // Default Pune longitude
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Get user's location
  useEffect(() => {
    if ('geolocation' in navigator) {
      setLocationStatus('loading');
      
      // Set timeout to handle cases where geolocation takes too long or silently fails
      const timeoutId = setTimeout(() => {
        if (locationStatus === 'loading') {
          console.warn('Geolocation timed out after 8 seconds');
          setLocationStatus('error');
        }
      }, 8000);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationStatus('success');
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('Geolocation error:', error.code, error.message || 'Permission denied');
          setLocationStatus('error');
          
          // Show appropriate message based on error code
          let errorMessage = "Location access failed. You can enter coordinates manually below.";
          switch(error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = "Location access denied. Please enable location services or enter coordinates manually.";
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = "Location information is unavailable. You can enter coordinates manually.";
              break;
            case 3: // TIMEOUT
              errorMessage = "Location request timed out. You can enter coordinates manually.";
              break;
          }
          alert(errorMessage);
          setManualLocation(true);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
      
      return () => clearTimeout(timeoutId);
    } else {
      setLocationStatus('error');
      alert("Geolocation is not supported by this browser. Please enter coordinates manually.");
      setManualLocation(true);
    }
  }, []);
  
  // Check if camera is available
  useEffect(() => {
    const checkCamera = async () => {
      try {
        // Just check if we can get camera access
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        
        if (!hasCamera) {
          console.warn('No video input devices found');
          setCameraAvailable(false);
        }
      } catch (err) {
        console.error('Error checking for cameras:', err);
        setCameraAvailable(false);
      }
    };
    
    // Only run this if the browser supports mediaDevices
    if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
      checkCamera();
    } else {
      setCameraAvailable(false);
    }
  }, []);
  
  // Handle camera activation with better error handling
  const activateCamera = async () => {
    try {
      setCameraError(null);
      if (!videoRef.current) {
        throw new Error("Video element not available");
      }
      
      const constraints = {
        video: {
          facingMode: 'environment', // Use the back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      // First check if the browser supports mediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support camera access");
      }
      
      console.log("Requesting camera access...");
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera access granted");
      
      // Set the stream to the video element
      videoRef.current.srcObject = mediaStream;
      // Wait for the video to be ready
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) videoRef.current.play().catch(e => console.error("Error playing video:", e));
      };
      
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      let errorMsg = "Could not access camera";
      
      // Provide more helpful error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = "Camera access denied. Please allow camera access in your browser.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = "No camera found on this device.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = "Camera is in use by another application.";
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = "Camera doesn't support the requested resolution.";
      } else if (err.name === 'SecurityError') {
        errorMsg = "Camera access blocked due to security restrictions.";
      } else if (err.name === 'TypeError') {
        errorMsg = "No camera available or camera misconfigured.";
      }
      
      setCameraError(errorMsg);
      alert(errorMsg);
      setCameraAvailable(false);
    }
  };
  
  // Handle taking a photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a File object from the blob
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            setImageFile(file);
            
            // Create a preview URL
            const url = URL.createObjectURL(blob);
            setImagePreview(url);
            
            // Stop camera stream
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };
  
  // Stop camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };
  
  // Handle file selection via input
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setImageFile(file);
      
      // Create preview
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      alert('Please select or capture an image');
      return;
    }
    
    if (!location) {
      alert('Location information is required. Please enable location access.');
      return;
    }
    
    try {
      // Get device ID for tracking
      const deviceId = getOrCreateDeviceId();
      
      // Submit report
      await addReport({
        lat: location.lat,
        lng: location.lng,
        description,
        submittedBy: 'Anonymous',
        deviceId,
        imageFile,
        status: 'Pending',
      });
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form
      setImageFile(null);
      setImagePreview(null);
      setDescription('');
      
      // Redirect after a delay
      setTimeout(() => {
        navigate('/map');
      }, 3000);
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report. Please try again.');
    }
  };

  // Set manual location when entered by user
  const handleManualLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        alert("Please enter valid coordinates. Latitude must be between -90 and 90, and longitude between -180 and 180.");
        return;
      }
      
      setLocation({ lat, lng });
      setLocationStatus('success');
      setManualLocation(false);
    } catch (error) {
      alert("Invalid coordinates format. Please enter numbers only.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Report Garbage</h1>
          <p className="mt-1 text-sm text-gray-500">
            Take a photo of garbage and provide your location to report it.
          </p>
        </div>
        
        {showSuccess ? (
          <div className="bg-green-50 p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-lg font-medium text-green-800 mt-3">Report Submitted Successfully!</h2>
            <p className="text-green-700 mt-2">Thank you for helping keep our community clean.</p>
            <p className="text-sm text-green-600 mt-2">Redirecting you to the map...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-4 py-5 space-y-6 sm:p-6">
            {/* Image Capture Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Garbage Photo
              </label>
              <div className="mt-1 flex flex-col items-center">
                {/* Preview image */}
                {imagePreview ? (
                  <div className="relative w-full max-w-md">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-64 w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    {cameraActive ? (
                      <div className="relative w-full max-w-md">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="h-64 w-full object-cover rounded-lg"
                          style={{ transform: 'scaleX(-1)' }} // Mirror mode for selfie
                        ></video>
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="mx-2 bg-green-500 text-white p-3 rounded-full"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 019.07 4h5.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="mx-2 bg-red-500 text-white p-3 rounded-full"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full max-w-md">
                        <div className="flex space-x-4">
                          {cameraAvailable ? (
                            <button
                              type="button"
                              onClick={activateCamera}
                              className="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Take Photo
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                              title={cameraError || "Camera not available"}
                            >
                              Camera Not Available
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Upload Image
                          </button>
                        </div>
                        {cameraError && (
                          <p className="mt-2 text-xs text-red-600">{cameraError}</p>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    )}
                  </>
                )}
                
                {/* Hidden canvas for capturing photos */}
                <canvas ref={canvasRef} className="hidden"></canvas>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Take a clear photo of the garbage. This will help authorities identify it.
              </p>
            </div>
            
            {/* Location Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <div className="mt-1">
                {locationStatus === 'loading' && !manualLocation && (
                  <div className="flex items-center text-gray-500">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Getting your location...
                  </div>
                )}
                
                {locationStatus === 'success' && location && !manualLocation && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Location detected</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Latitude: {location.lat.toFixed(6)}</p>
                          <p>Longitude: {location.lng.toFixed(6)}</p>
                          <button 
                            type="button"
                            className="mt-2 text-xs text-green-600 underline"
                            onClick={() => setManualLocation(true)}
                          >
                            Enter location manually instead
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {(locationStatus === 'error' || manualLocation) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">Enter location manually</h3>
                    <form onSubmit={handleManualLocationSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-700">Latitude</label>
                        <input 
                          type="text" 
                          value={manualLat}
                          onChange={(e) => setManualLat(e.target.value)}
                          className="mt-1 px-3 py-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          placeholder="e.g. 18.5204 (Pune)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700">Longitude</label>
                        <input 
                          type="text" 
                          value={manualLng}
                          onChange={(e) => setManualLng(e.target.value)}
                          className="mt-1 px-3 py-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          placeholder="e.g. 73.8567 (Pune)"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Set Location
                        </button>
                        {locationStatus !== 'error' && (
                          <button
                            type="button"
                            onClick={() => setManualLocation(false)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
            
            {/* Description Section */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Provide any additional details about the garbage (e.g., size, type, potential hazards)"
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!imageFile || !location || loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  !imageFile || !location || loading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error submitting report</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportForm; 