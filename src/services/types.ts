/**
 * services/types.ts
 * ─────────────────────────────────────────────────────────────────
 * Shared TypeScript types / interfaces for the KSW Pathshala
 * Admin Portal API service layer.
 *
 * Re-exported from services/index.ts for convenient imports:
 *   import type { DashboardStats, Student, Teacher } from '@/services/types';
 * ─────────────────────────────────────────────────────────────────
 */

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: {
    id: string;
    name: string;
    role: string;
    username: string;
    phone?: string;
  };
  message?: string;
  error?: string;
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardKPIs {
  students: { total: number; approved: number; pending: number };
  teachers: { total: number; approved: number; pending: number };
  sponsors: number;
  donations: number;
  attendanceRate: number;
}

export interface DashboardStats {
  kpis: DashboardKPIs;
  approvalRequests: {
    students: Student[];
    teachers: Teacher[];
  };
  recentRegistrations: Student[];
  charts: {
    donations: { month: string; amount: number }[];
    attendance: { week: string; rate: number }[];
  };
  recentActivities: Activity[];
}

// ── Student ──────────────────────────────────────────────────────────────────
export interface Student {
  id: string;
  name: string;
  age: number;
  gender: string;
  grade: string;
  guardianName: string;
  phone: string;
  address: string;
  status: 'Approved' | 'Pending Approval' | 'Inactive';
  sponsorId: string | null;
  attendancePercentage: number;
  photo: string;
  joiningDate: string;
}

// ── Teacher ──────────────────────────────────────────────────────────────────
export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  assignedClass: string;
  location: {
    latitude: number;
    longitude: number;
    classroomName: string;
  };
  status: 'Approved' | 'Pending Approval';
  joiningDate: string;
}

// ── Donation ─────────────────────────────────────────────────────────────────
export interface Donation {
  id: string;
  donorName: string;
  email: string;
  phone: string;
  amount: number;
  date: string;
  type: 'Sponsorship' | 'General Donation';
  studentId: string | null;
  studentName?: string | null;
  status: 'Verified' | 'Pending Verification';
  paymentMethod: string;
}

// ── Activity ─────────────────────────────────────────────────────────────────
export interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'Photo' | 'Video';
  mediaUrl: string;
  class: string;
  teacherName: string;
  date: string;
}

// ── GPS Log ──────────────────────────────────────────────────────────────────
export interface GPSLog {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  clockInTime: string;
  coords: {
    latitude: number;
    longitude: number;
  };
  distanceMeters: number;
  verified: boolean;
  remarks: string;
}

// ── Attendance ───────────────────────────────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  date: string;
  entityType: 'Student' | 'Teacher';
  entityId: string;
  status: 'Present' | 'Absent';
}

// ── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

// ── System Notification ──────────────────────────────────────────────────────
export interface SystemNotification {
  id: string;
  type: 'System' | 'GPS Alert' | 'Donation';
  message: string;
  timestamp: string;
  status: 'Read' | 'Unread';
}

// ── Transparency ─────────────────────────────────────────────────────────────
export interface TransparencyMetrics {
  booksDistributed: number;
  bagsDistributed: number;
  uniformsDistributed: number;
  mealsSupported: number;
}

// ── Slider ───────────────────────────────────────────────────────────────────
export interface Slider {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  linkUrl?: string;
  orderIndex: number;
  isActive: boolean;
}

// ── Intro Video ──────────────────────────────────────────────────────────────
export interface IntroVideo {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl?: string;
  orderIndex: number;
  isActive: boolean;
}

// ── Founder ──────────────────────────────────────────────────────────────────
export interface FounderData {
  id?: string;
  name?: string;
  role?: string;
  organization?: string;
  quote: string;
  message: string;
  photoUrl?: string;
  verifiedStatus?: string;
  created_at?: string;
  updated_at?: string;
}

// ── Board Member ─────────────────────────────────────────────────────────────
export interface BoardMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  isVerified: boolean;
  orderIndex: number;
}

// ── Trust Credential ─────────────────────────────────────────────────────────
export interface TrustCredential {
  id: string;
  title: string;
  description: string;
  icon: string;
  verifiedStatus: string;
}

// ── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  name: string;
  role: string;
  text: string;
  avatar?: string;
  rating: number;
  isApproved: boolean;
  orderIndex: number;
}

// ── Partner ──────────────────────────────────────────────────────────────────
export interface Partner {
  id: string;
  name: string;
  subtitle?: string;
  color?: string;
  bgAccent?: string;
  logoUrl?: string;
  isActive: boolean;
  orderIndex: number;
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  orderIndex: number;
}

// ── Subscriber ───────────────────────────────────────────────────────────────
export interface Subscriber {
  id: string;
  email: string;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── Volunteer Log ────────────────────────────────────────────────────────────
export interface VolunteerLog {
  id: string;
  volunteerId: string;
  volunteerName?: string;
  hours: number;
  taskDetails: string;
  date: string;
}

// ── Volunteer Task ───────────────────────────────────────────────────────────
export interface VolunteerTask {
  id: string;
  volunteerId: string;
  title: string;
  description: string;
  points: number;
  status: 'Pending' | 'Completed' | 'Approved';
  createdAt: string;
}

// ── Campaign ─────────────────────────────────────────────────────────────────
export interface Campaign {
  id: string;
  title: string;
  description: string;
  category?: string;
  targetAmount: number;
  raisedAmount: number;
  supportersCount?: number;
  status?: string;
  isActive?: boolean;
  image?: string | null;
  video?: string | null;
  endDate?: string;
  created_at?: string;
  updated_at?: string;
}

// ── Event ────────────────────────────────────────────────────────────────────
export interface EventRegistration {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
}

export interface Event {
  id: string;
  eventId: string;
  title: string;
  description: string;
  date: string;
  registrations?: EventRegistration[];
  created_at?: string;
  updated_at?: string;
}

// ── Contact Inquiry ──────────────────────────────────────────────────────────
export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// ── Media Entry ──────────────────────────────────────────────────────────────
export interface MediaEntry {
  id: string;
  title: string;
  category: string;
  url: string;
  created_at?: string;
  updated_at?: string;
}

// ── Class Plan ───────────────────────────────────────────────────────────────
export interface ClassPlan {
  id: string;
  classKey: string;
  monthlyAmount: number;
  annualAmount: number;
  created_at?: string;
  updated_at?: string;
}

// ── AI Insight ───────────────────────────────────────────────────────────────
export interface AiInsight {
  id: string;
  category: string;
  insight: string;
  priority: 'High' | 'Medium' | 'Low';
  generatedAt: string;
}

// ── Presign Upload ───────────────────────────────────────────────────────────
export interface PresignUploadPayload {
  folder: string;
  files: { filename: string; fileType?: string }[];
}

export interface PresignUploadResponse {
  success: boolean;
  files: { filename: string; uploadUrl: string; imageUrl: string; key: string }[];
}
