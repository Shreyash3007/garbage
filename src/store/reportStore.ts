import { create } from 'zustand';
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { generateUniqueId } from '../utils/helpers';

export type ReportStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface Report {
  id: string;
  imageURL: string;
  lat: number;
  lng: number;
  address?: string;
  description?: string;
  submittedAt: Date;
  status: ReportStatus;
  submittedBy: string;
  deviceId: string;
  isDemo?: boolean;
}

interface ReportState {
  reports: Report[];
  loading: boolean;
  error: string | null;
  fetchReports: () => Promise<void>;
  addReport: (report: Omit<Report, 'id' | 'imageURL' | 'submittedAt'> & { imageFile: File }) => Promise<string>;
  updateReportStatus: (id: string, status: ReportStatus) => Promise<void>;
  getReportsByDeviceId: (deviceId: string) => Report[];
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  loading: false,
  error: null,

  fetchReports: async () => {
    try {
      set({ loading: true, error: null });
      const reportsQuery = query(collection(db, 'reports'), orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(reportsQuery);
      const reportsList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        submittedAt: doc.data().submittedAt.toDate() 
      } as Report));
      
      set({ reports: reportsList, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addReport: async (reportData) => {
    try {
      set({ loading: true, error: null });
      
      // Upload image to Firebase Storage
      const imageRef = ref(storage, `reports/${generateUniqueId()}`);
      await uploadBytes(imageRef, reportData.imageFile);
      const imageURL = await getDownloadURL(imageRef);
      
      // Save report data to Firestore
      const reportToSave = {
        ...reportData,
        imageURL,
        submittedAt: new Date(),
        status: 'Pending' as ReportStatus,
      };
      
      delete (reportToSave as any).imageFile;
      
      const docRef = await addDoc(collection(db, 'reports'), reportToSave);
      
      // Add to local state
      const newReport = { 
        id: docRef.id, 
        ...reportToSave 
      };
      
      set(state => ({ 
        reports: [newReport, ...state.reports],
        loading: false 
      }));
      
      return docRef.id;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateReportStatus: async (id, status) => {
    try {
      set({ loading: true, error: null });
      
      const reportRef = doc(db, 'reports', id);
      await updateDoc(reportRef, { status });
      
      set(state => ({
        reports: state.reports.map(report => 
          report.id === id ? { ...report, status } : report
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  getReportsByDeviceId: (deviceId) => {
    return get().reports.filter(report => report.deviceId === deviceId);
  }
})); 