import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp, writeBatch, getFirestore, doc, query, where, limit, getDocs } from 'firebase/firestore';

// Pune area boundaries (approximately)
const PUNE_BOUNDS = {
  north: 18.6207,
  south: 18.4404,
  east: 73.9352,
  west: 73.7468
};

// Unsplash search terms for garbage/waste-related images
const GARBAGE_SEARCH_TERMS = [
  'garbage', 'trash', 'waste', 'litter', 'pollution',
  'plastic waste', 'dump', 'rubbish', 'junk'
];

// Common areas in Pune for more realistic location naming
const PUNE_AREAS = [
  'Shivaji Nagar', 'Kothrud', 'Hadapsar', 'Baner', 'Aundh',
  'Viman Nagar', 'Kharadi', 'Hinjewadi', 'Pimple Saudagar',
  'Deccan Gymkhana', 'Camp', 'Kondhwa', 'Pashan', 'Magarpatta',
  'Wakad', 'Kalyani Nagar', 'Koregaon Park', 'Pimpri-Chinchwad',
  'Yerwada', 'Swargate', 'Katraj', 'Warje', 'Bibwewadi', 'Mundhwa'
];

// Generate random coordinates within Pune boundaries
const getRandomPuneCoordinates = () => {
  const lat = PUNE_BOUNDS.south + Math.random() * (PUNE_BOUNDS.north - PUNE_BOUNDS.south);
  const lng = PUNE_BOUNDS.west + Math.random() * (PUNE_BOUNDS.east - PUNE_BOUNDS.west);
  return { lat, lng };
};

// Generate random date within last 3 months
const getRandomRecentDate = () => {
  const now = new Date();
  // Random date within last 90 days
  const daysAgo = Math.floor(Math.random() * 90);
  now.setDate(now.getDate() - daysAgo);
  return Timestamp.fromDate(now);
};

// Get a random area in Pune
const getRandomPuneArea = () => {
  return PUNE_AREAS[Math.floor(Math.random() * PUNE_AREAS.length)];
};

// Generate random report description
const generateRandomDescription = () => {
  const garbageTypes = ['plastic waste', 'household trash', 'construction debris', 'electronic waste', 'garden waste', 'food waste', 'medical waste', 'paper waste', 'glass waste', 'mixed garbage'];
  const severity = ['small amount of', 'moderate amount of', 'large pile of', 'scattered', 'overflowing bin with'];
  const locations = ['beside the road', 'on the sidewalk', 'in a vacant lot', 'near a bus stop', 'behind the building', 'under the bridge', 'by the park', 'at the street corner', 'near the market', 'outside the mall'];
  const impacts = [
    'It\'s attracting stray animals',
    'It\'s blocking the path',
    'It\'s causing bad odor',
    'It\'s affecting local businesses',
    'It\'s been there for a week',
    'It\'s flowing into the drain',
    'It needs immediate attention',
    'Residents are complaining',
    'It\'s near a school zone',
    'It\'s a health hazard'
  ];

  const type = garbageTypes[Math.floor(Math.random() * garbageTypes.length)];
  const amount = severity[Math.floor(Math.random() * severity.length)];
  const place = locations[Math.floor(Math.random() * locations.length)];
  const impact = impacts[Math.floor(Math.random() * impacts.length)];

  return `${amount} ${type} found ${place} in ${getRandomPuneArea()}. ${impact}.`;
};

// Generate a status based on the date (older reports more likely to be resolved)
const getStatusBasedOnDate = (date: Timestamp) => {
  const now = new Date();
  const reportDate = date.toDate();
  const daysDiff = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // For more recent reports (less than 10 days), mostly pending
  if (daysDiff < 10) {
    return Math.random() < 0.7 ? 'Pending' : 'In Progress';
  }
  // For reports between 10-30 days, mix of all statuses
  if (daysDiff < 30) {
    const rand = Math.random();
    if (rand < 0.3) return 'Pending';
    if (rand < 0.7) return 'In Progress';
    return 'Resolved';
  }
  // For older reports (more than 30 days), mostly resolved
  return Math.random() < 0.7 ? 'Resolved' : 'In Progress';
};

// Fetch an image from Unsplash for garbage
const fetchGarbageImage = async (): Promise<ArrayBuffer> => {
  try {
    // Select a random search term
    const searchTerm = GARBAGE_SEARCH_TERMS[Math.floor(Math.random() * GARBAGE_SEARCH_TERMS.length)];
    // Use a random size for variety
    const width = 800 + Math.floor(Math.random() * 400);
    const height = 600 + Math.floor(Math.random() * 300);
    // Unsplash Source API for random images (no API key needed)
    const url = `https://source.unsplash.com/random/${width}x${height}/?${searchTerm}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error fetching image:', error);
    // Provide a fallback image URL (simple color)
    const fallbackResponse = await fetch(`https://via.placeholder.com/800x600/16a34a/FFFFFF?text=Garbage+Watch`);
    return await fallbackResponse.arrayBuffer();
  }
};

// Upload image to Firebase Storage
const uploadImage = async (imageBuffer: ArrayBuffer, filename: string): Promise<string> => {
  const storage = getStorage();
  const storageRef = ref(storage, `reports/${filename}`);
  
  // Create file blob from array buffer
  const fileBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
  
  // Upload file
  const uploadTask = await uploadBytesResumable(storageRef, fileBlob);
  
  // Get download URL
  return await getDownloadURL(uploadTask.ref);
};

// Generate a simple UUID-like string without external dependencies
function generateRandomId() {
  const timestamp = new Date().getTime().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
}

// Generate device IDs (to simulate multiple users)
const generateDeviceIds = (count: number = 25) => {
  const ids = [];
  for (let i = 0; i < count; i++) {
    ids.push(generateRandomId());
  }
  return ids;
};

// Main function to generate and upload demo reports
export const generateDemoReports = (
  count: number = 500,
  progressCallback?: (progress: number, message: string) => void
) => {
  let isCancelled = false;
  const batchSize = 10; // Process 10 reports at a time for better performance
  const db = getFirestore();
  const deviceIds = generateDeviceIds(25); // 25 simulated users
  
  console.log(`Starting to generate ${count} demo reports...`);
  progressCallback?.(0, `Starting to generate ${count} demo reports...`);
  
  const processBatch = async (startIndex: number) => {
    if (isCancelled) return;
    
    const endIndex = Math.min(startIndex + batchSize, count);
    const batchPromises = [];
    
    for (let i = startIndex; i < endIndex; i++) {
      batchPromises.push(processReport(i));
    }
    
    await Promise.all(batchPromises);
    
    const progress = Math.round((endIndex / count) * 100);
    progressCallback?.(progress, `Generated ${endIndex} of ${count} reports...`);
    
    if (endIndex < count && !isCancelled) {
      // Process next batch
      await processBatch(endIndex);
    } else {
      // All done or cancelled
      if (!isCancelled) {
        console.log(`Successfully generated ${count} demo reports.`);
        progressCallback?.(100, `Successfully generated ${count} demo reports.`);
      }
    }
  };
  
  const processReport = async (index: number) => {
    try {
      // Generate random report data
      const location = getRandomPuneCoordinates();
      const submittedAt = getRandomRecentDate();
      const status = getStatusBasedOnDate(submittedAt);
      const description = generateRandomDescription();
      const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
      const filename = `demo-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Fetch and upload image
      const imageBuffer = await fetchGarbageImage();
      const imageURL = await uploadImage(imageBuffer, filename);
      
      // Create report object
      const reportData = {
        lat: location.lat,
        lng: location.lng,
        submittedAt,
        status,
        description,
        deviceId,
        imageURL,
        address: `Near ${getRandomPuneArea()}, Pune`,
        submittedBy: 'Demo Generator',
        isDemo: true // Flag to identify demo data for later deletion
      };
      
      // Add to Firestore
      await addDoc(collection(db, "reports"), reportData);
    } catch (error) {
      console.error(`Error generating report ${index + 1}:`, error);
    }
  };
  
  // Start processing
  processBatch(0);
  
  // Return unsubscribe function
  return () => {
    isCancelled = true;
    console.log("Demo data generation cancelled");
  };
};

// Function to delete all demo data
export const deleteAllDemoData = async (
  progressCallback?: (progress: number, message: string) => void
) => {
  const db = getFirestore();
  const batchSize = 500; // Firestore allows max 500 operations per batch
  let deleted = 0;
  let hasMore = true;
  
  progressCallback?.(0, "Fetching demo reports...");
  
  try {
    while (hasMore) {
      // Query for demo data with limit
      const demoQuery = query(
        collection(db, "reports"),
        where("isDemo", "==", true),
        limit(batchSize)
      );
      
      const querySnapshot = await getDocs(demoQuery);
      
      if (querySnapshot.empty) {
        hasMore = false;
        break;
      }
      
      // Create batch for deletions
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach((document) => {
        batch.delete(doc(db, "reports", document.id));
      });
      
      // Commit batch
      await batch.commit();
      
      deleted += querySnapshot.size;
      progressCallback?.(Math.min(99, Math.floor((deleted / (deleted + 1)) * 100)), 
        `Deleted ${deleted} demo reports...`);
    }
    
    progressCallback?.(100, `Successfully deleted ${deleted} demo reports.`);
    return deleted;
  } catch (error: unknown) {
    console.error("Error deleting demo data:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    progressCallback?.(100, `Error: Could not delete all demo data. ${errorMessage}`);
    throw error;
  }
};

export default generateDemoReports; 