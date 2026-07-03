/**
 * services/index.ts
 * ─────────────────────────────────────────────────────────────────
 * Complete Admin API service layer for KSW Pathshala Admin Portal.
 *
 * Every admin endpoint from the Postman collection + every internal
 * Next.js API route used by the admin pages is mapped here via Axios.
 *
 * Base URL  → https://g4zmqv1pti.execute-api.ap-south-1.amazonaws.com
 * Fallback  → relative /api/* (local Next.js routes)
 * ─────────────────────────────────────────────────────────────────
 */

import apiClient from './apiClient';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

export interface TransparencyMetrics {
  booksDistributed: number;
  bagsDistributed: number;
  uniformsDistributed: number;
  mealsSupported: number;
}

export interface PresignUploadPayload {
  folder: string;
  files: { filename: string; fileType?: string }[];
}

export interface SliderPayload {
  imageUrl: string;
  title: string;
  description?: string;
  linkUrl?: string;
  orderIndex: number;
  isActive: boolean;
}

export interface IntroVideoPayload {
  title: string;
  videoUrl: string;
  posterUrl?: string;
  orderIndex: number;
  isActive: boolean;
}

export interface FounderUpdatePayload {
  quote?: string;
  message?: string;
  photoUrl?: string;
}

export interface MemberPayload {
  name: string;
  role: string;
  photoUrl?: string;
  isVerified: boolean;
  orderIndex: number;
}

export interface CredentialPayload {
  id: string;
  title: string;
  description: string;
  icon: string;
  verifiedStatus: string;
}

export interface ReviewPayload {
  name: string;
  role: string;
  text: string;
  avatar?: string;
  rating: number;
  isApproved: boolean;
  orderIndex: number;
}

export interface PartnerPayload {
  name: string;
  subtitle?: string;
  color?: string;
  bgAccent?: string;
  isActive: boolean;
  orderIndex: number;
}

export interface FAQPayload {
  question: string;
  answer: string;
  category?: string;
  orderIndex: number;
}

export interface VolunteerTaskPayload {
  volunteerId: string;
  title: string;
  description: string;
  points: number;
}

export interface ActivityPayload {
  title: string;
  description: string;
  class: string;
  author: string;
  isSuccessStory: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Auth Service
// ─────────────────────────────────────────────────────────────────────────────
/** POST /api/auth/login – Admin / Sponsor web portal login */
export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>('/api/auth/login', payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dashboard & System Metrics
// ─────────────────────────────────────────────────────────────────────────────
export const dashboardService = {
  /** GET /api/admin/dashboard – KPIs, approval queue, charts */
  getStats: () => apiClient.get('/api/admin/dashboard'),

  /** GET /api/admin/notifications */
  getNotifications: () => apiClient.get('/api/admin/notifications'),

  /** GET /api/admin/ai – AI insights */
  /** GET /api/admin/ai - Get AI Insights */
  getAiInsights: () => apiClient.get('/api/admin/ai'),

  /** GET /api/admin/audit – security audit logs */
  getAuditLogs: () => apiClient.get('/api/admin/audit'),

  /** POST /api/admin/backup – trigger a database safety snapshot */
  triggerBackup: () => apiClient.post('/api/admin/backup'),

  /** PATCH /api/admin/notifications?id=:id – mark a notification as read */
  markNotificationRead: (id: string) => apiClient.patch(`/api/admin/notifications?id=${id}`),

  /** PATCH /api/admin/notifications – mark all notifications as read */
  markAllNotificationsRead: () => apiClient.patch('/api/admin/notifications'),
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Transparency Metrics
// ─────────────────────────────────────────────────────────────────────────────
export const transparencyService = {
  /** GET /api/admin/transparency-metrics */
  get: () => apiClient.get('/api/admin/transparency-metrics'),

  /** PUT /api/admin/transparency-metrics */
  update: (payload: Partial<TransparencyMetrics>) =>
    apiClient.put('/api/admin/transparency-metrics', payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Media Presigned Upload
// ─────────────────────────────────────────────────────────────────────────────
export const mediaService = {
  /** POST /api/admin/media/presign-upload */
  generatePresignedUrls: (payload: PresignUploadPayload) =>
    apiClient.post('/api/admin/media/presign-upload', payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Sliders Manager
// ─────────────────────────────────────────────────────────────────────────────
export const slidersService = {
  getAll: () => apiClient.get('/api/admin/sliders'),
  create: (payload: SliderPayload) => apiClient.post('/api/admin/sliders', payload),
  update: (sliderId: string, payload: Partial<SliderPayload>) =>
    apiClient.put(`/api/admin/sliders/${sliderId}`, payload),
  delete: (sliderId: string) => apiClient.delete(`/api/admin/sliders/${sliderId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Intro Videos Manager
// ─────────────────────────────────────────────────────────────────────────────
export const introVideosService = {
  getAll: () => apiClient.get('/api/admin/intro-videos'),
  create: (payload: any) =>
    apiClient.post('/api/admin/intro-videos', payload),
  update: (videoId: string, payload: any) =>
    apiClient.put(`/api/admin/intro-videos/${videoId}`, payload),
  delete: (videoId: string) =>
    apiClient.delete(`/api/admin/intro-videos/${videoId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Founder Message
// ─────────────────────────────────────────────────────────────────────────────
export const founderService = {
  get: () => apiClient.get('/api/admin/founder'),
  update: (payload: FounderUpdatePayload) =>
    apiClient.put('/api/admin/founder', payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. Board Members Manager
// ─────────────────────────────────────────────────────────────────────────────
export const membersService = {
  getAll: () => apiClient.get('/api/admin/members'),
  create: (payload: any) => apiClient.post('/api/admin/members', payload),
  update: (memberId: string, payload: any) =>
    apiClient.put(`/api/admin/members/${memberId}`, payload),
  delete: (memberId: string) => apiClient.delete(`/api/admin/members/${memberId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. Trust Credentials Manager
// ─────────────────────────────────────────────────────────────────────────────
export const credentialsService = {
  getAll: () => apiClient.get('/api/admin/credentials'),
  create: (payload: CredentialPayload) =>
    apiClient.post('/api/admin/credentials', payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. Sponsor Reviews Manager
// ─────────────────────────────────────────────────────────────────────────────
export const reviewsService = {
  getAll: () => apiClient.get('/api/admin/reviews'),
  create: (payload: ReviewPayload) => apiClient.post('/api/admin/reviews', payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. Sponsors & Partners Manager
// ─────────────────────────────────────────────────────────────────────────────
export const partnersService = {
  getAll: () => apiClient.get('/api/admin/partners'),
  create: (payload: PartnerPayload) =>
    apiClient.post('/api/admin/partners', payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 12. FAQs Manager
// ─────────────────────────────────────────────────────────────────────────────
export const faqsService = {
  getAll: () => apiClient.get('/api/admin/faqs'),
  create: (payload: FAQPayload) => apiClient.post('/api/admin/faqs', payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 13. Email Subscribers Registry
// ─────────────────────────────────────────────────────────────────────────────
export const subscribersService = {
  getAll: () => apiClient.get('/api/admin/subscribers'),
};

// ─────────────────────────────────────────────────────────────────────────────
// 14. Volunteer Hours Logs Manager
// ─────────────────────────────────────────────────────────────────────────────
export const volunteerLogsService = {
  getAll: () => apiClient.get('/api/admin/volunteer-logs'),
  updateStatus: (logId: string, payload: { status: string }) =>
    apiClient.put(`/api/admin/volunteer-logs/${logId}`, payload),
  delete: (logId: string) => apiClient.delete(`/api/admin/volunteer-logs/${logId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 15. Students Registry  (GET list + CRUD via admin routes)
// ─────────────────────────────────────────────────────────────────────────────
export const studentsService = {
  /** GET /api/admin/students (Postman admin endpoint) */
  getAll: (params?: { search?: string; grade?: string; status?: string }) =>
    apiClient.get('/api/admin/students', { params }),

  /** POST /api/admin/students – create student */
  create: (payload: Record<string, unknown>) =>
    apiClient.post('/api/admin/students', payload),

  /** PUT /api/admin/students/:id – update student */
  update: (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/api/admin/students/${id}`, payload),

  /** DELETE /api/admin/students/:id – remove student */
  delete: (id: string) => apiClient.delete(`/api/admin/students/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 16. Teachers Registry
// ─────────────────────────────────────────────────────────────────────────────
export const teachersService = {
  /** GET /api/admin/teachers */
  getAll: (params?: { search?: string; status?: string }) =>
    apiClient.get('/api/admin/teachers', { params }),

  /** POST /api/admin/teachers – create teacher */
  create: (payload: Record<string, unknown>) =>
    apiClient.post('/api/admin/teachers', payload),

  /** PATCH /api/admin/teachers/:id – update teacher */
  update: (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/api/admin/teachers/${id}`, payload),

  /** DELETE /api/admin/teachers/:id – remove teacher */
  delete: (id: string) => apiClient.delete(`/api/admin/teachers/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 17. Campaigns Registry
// ─────────────────────────────────────────────────────────────────────────────
export const campaignsService = {
  getAll: () => apiClient.get('/api/admin/campaigns'),
};

// ─────────────────────────────────────────────────────────────────────────────
// 18. Volunteers Application Queue
// ─────────────────────────────────────────────────────────────────────────────
export const volunteersService = {
  /** GET /api/admin/volunteers */
  getAll: (params?: { search?: string; status?: string }) =>
    apiClient.get('/api/admin/volunteers', { params }),

  /** POST /api/admin/volunteers – create volunteer */
  create: (payload: Record<string, unknown>) =>
    apiClient.post('/api/admin/volunteers', payload),

  /** PUT /api/admin/volunteers/:id – update/approve volunteer */
  update: (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/api/admin/volunteers/${id}`, payload),

  /** DELETE /api/admin/volunteers/:id – remove volunteer */
  delete: (id: string) => apiClient.delete(`/api/admin/volunteers/${id}`),
};


// ─────────────────────────────────────────────────────────────────────────────
// 20. Donations Transactions
// ─────────────────────────────────────────────────────────────────────────────
export const donationsService = {
  /** GET /api/admin/donations */
  getAll: (params?: { search?: string; status?: string }) =>
    apiClient.get('/api/admin/donations', { params }),

  /** POST /api/admin/donations – log a contribution */
  create: (payload: Record<string, unknown>) =>
    apiClient.post('/api/admin/donations', payload),

  /** PATCH /api/admin/donations/:id – verify payment */
  update: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/api/admin/donations/${id}`, payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 21. Attendance Registers
// ─────────────────────────────────────────────────────────────────────────────
export const attendanceService = {
  /** GET /api/admin/attendance?date=YYYY-MM-DD */
  getByDate: (date: string, entityType?: string) =>
    apiClient.get('/api/admin/attendance', { params: { date, entityType } }),

  /** POST /api/admin/attendance – submit attendance sheet */
  submit: (payload: any) =>
    apiClient.post('/api/admin/attendance', payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 22. GPS Logs
// ─────────────────────────────────────────────────────────────────────────────
export const gpsService = {
  /** GET /api/admin/gps */
  getAll: () => apiClient.get('/api/admin/gps'),

  /** POST /api/admin/gps – log a GPS clock-in */
  clockIn: (payload: { teacherId: string; latitude: number; longitude: number }) =>
    apiClient.post('/api/admin/gps', payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 23. Volunteer Tasks Manager
// ─────────────────────────────────────────────────────────────────────────────
export const volunteerTasksService = {
  getAll: () => apiClient.get('/api/admin/volunteers/tasks'),
  create: (payload: VolunteerTaskPayload) =>
    apiClient.post('/api/admin/volunteers/tasks', payload),
  update: (taskId: string, payload: any) =>
    apiClient.put(`/api/admin/volunteers/tasks/${taskId}`, payload),
  approve: (taskId: string) =>
    apiClient.post(`/api/admin/volunteers/tasks/${taskId}/approve`),
  delete: (taskId: string) =>
    apiClient.delete(`/api/admin/volunteers/tasks/${taskId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 24. Volunteer Donation Claims Manager
// ─────────────────────────────────────────────────────────────────────────────
export const volunteerDonationClaimsService = {
  getAll: (status: string = 'pending') => 
    apiClient.get(`/api/admin/volunteers/donation-claims?status=${status}`),
  update: (claimId: string, payload: any) =>
    apiClient.put(`/api/admin/volunteers/donation-claims/${claimId}`, payload),
  delete: (claimId: string) =>
    apiClient.delete(`/api/admin/volunteers/donation-claims/${claimId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 25. Classroom Activities Manager
// ─────────────────────────────────────────────────────────────────────────────
export const activitiesService = {
  /** GET /api/admin/activities */
  getAll: () => apiClient.get('/api/admin/activities'),

  /** POST /api/admin/activities – create classroom activity */
  create: (payload: ActivityPayload) =>
    apiClient.post('/api/admin/activities', payload),

  /** PUT /api/admin/activities/:activityId */
  update: (activityId: string, payload: Partial<ActivityPayload>) =>
    apiClient.put(`/api/admin/activities/${activityId}`, payload),

  /** DELETE /api/admin/activities/:activityId */
  delete: (activityId: string) =>
    apiClient.delete(`/api/admin/activities/${activityId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 25. Contact Inquiries Manager
// ─────────────────────────────────────────────────────────────────────────────
export const inquiriesService = {
  getAll: () => apiClient.get('/api/admin/inquiries'),
  delete: (inquiryId: string) =>
    apiClient.delete(`/api/admin/inquiries/${inquiryId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// 26. Notifications
// ─────────────────────────────────────────────────────────────────────────────
export const notificationsService = {
  /** GET /api/admin/notifications */
  getAll: () => apiClient.get('/api/admin/notifications'),
};

// ─────────────────────────────────────────────────────────────────────────────
// 27. Calendar Events Manager
// ─────────────────────────────────────────────────────────────────────────────
export const eventsService = {
  getAll: () => apiClient.get('/api/admin/events'),
  create: (payload: any) => apiClient.post('/api/admin/events', payload),
  update: (eventId: string, payload: any) => apiClient.put(`/api/admin/events/${eventId}`, payload),
  delete: (eventId: string) => apiClient.delete(`/api/admin/events/${eventId}`),
};
