export type UserRole = "agency_admin" | "university_admin";

// 1. Institutions Table
export interface Institution {
  id: string;
  name: string;
  created_at: string;
}

// 2. Profiles Table
export interface Profile {
  id: string; // references auth.users(id)
  institution_id?: string | null; // references institutions(id)
  email: string;
  full_name?: string | null;
  role: UserRole;
  created_at: string;
  institution?: Institution | null;
}

// 3. Videos Table
export type VideoStatus = "pending" | "processing" | "completed" | "failed";

export interface VideoRecord {
  id: string;
  institution_id: string;
  title: string;
  original_storage_path: string;
  status: VideoStatus;
  created_at: string;
  processing_jobs?: ProcessingJob | ProcessingJob[] | null;
}

// 4. Processing Jobs Table (for Render Python Worker)
export type JobStatus = "queued" | "in_progress" | "completed" | "failed";

export interface ClassroomResults {
  video_type: "classroom";
  average_students: number;
  teaching_duration_seconds: number;
  active_teaching_percentage: number;
  total_frames_processed?: number;
  fps?: number;
  total_duration_seconds?: number;
  snapshot_url?: string;
  annotated_video_url?: string;
  snapshot_storage_path?: string;
  annotated_storage_path?: string;
  worker_id?: string;
  completed_at?: string;
}

export interface VehicleBreakdown {
  cars: number;
  motorcycles: number;
  buses: number;
  trucks: number;
}

export interface VehicleResults {
  video_type: "vehicle";
  total_vehicles_entered: number;
  vehicle_breakdown?: VehicleBreakdown;
  total_frames_processed?: number;
  fps?: number;
  total_duration_seconds?: number;
  snapshot_url?: string;
  annotated_video_url?: string;
  snapshot_storage_path?: string;
  annotated_storage_path?: string;
  worker_id?: string;
  completed_at?: string;
}

export type AIResultsJson = ClassroomResults | VehicleResults | Record<string, any>;

export interface ProcessingJob {
  id: string;
  video_id: string; // UNIQUE REFERENCES videos(id)
  status: JobStatus;
  worker_id?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  results_json?: AIResultsJson | null;
  created_at: string;
}

export interface UniversityMetrics {
  totalProcessedVideos: number;
  classroomAlerts: number;
  vehicleEntries: number;
  activeCameras: number;
}
