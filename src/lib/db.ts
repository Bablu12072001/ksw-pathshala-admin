import fs from 'fs/promises';
import path from 'path';

// Define DB file path
const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

// Types for data models
export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'Admin' | 'Coordinator' | 'Sponsor';
  phone: string;
}

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

export interface Donation {
  id: string;
  donorName: string;
  email: string;
  phone: string;
  amount: number;
  date: string;
  type: 'Sponsorship' | 'General Donation';
  studentId: string | null;
  status: 'Verified' | 'Pending Verification';
  paymentMethod: string;
}

export interface Sponsor {
  id: string;
  name: string;
  email: string;
  activeSponsorships: number;
  totalDonated: number;
}

export interface Attendance {
  id: string;
  date: string;
  entityType: 'Student' | 'Teacher';
  entityId: string;
  status: 'Present' | 'Absent';
}

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

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  type: 'System' | 'GPS Alert' | 'Donation';
  message: string;
  timestamp: string;
  status: 'Read' | 'Unread';
}

export interface DBStructure {
  users: User[];
  students: Student[];
  teachers: Teacher[];
  donations: Donation[];
  sponsors: Sponsor[];
  attendance: Attendance[];
  gps_logs: GPSLog[];
  activities: Activity[];
  audit_logs: AuditLog[];
  notifications: SystemNotification[];
}

// Thread-safe lock mechanism for writing to db.json
let writePromise: Promise<void> = Promise.resolve();

// Utility helper to read database
export async function readDB(): Promise<DBStructure> {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data) as DBStructure;
  } catch (error) {
    console.error('Failed reading db.json, returning empty structure.', error);
    return {
      users: [],
      students: [],
      teachers: [],
      donations: [],
      sponsors: [],
      attendance: [],
      gps_logs: [],
      activities: [],
      audit_logs: [],
      notifications: [],
    };
  }
}

// Utility helper to write database (queued to avoid race conditions)
export async function writeDB(data: DBStructure): Promise<void> {
  const performWrite = async () => {
    try {
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed writing db.json', error);
      throw error;
    }
  };

  // Queue write promises
  writePromise = writePromise.then(performWrite).catch(performWrite);
  return writePromise;
}

// Helper to log audit actions automatically
export async function addAuditLog(userId: string, userName: string, action: string, details: string, ipAddress: string = '127.0.0.1') {
  const db = await readDB();
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    userId,
    userName,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString(),
  };
  db.audit_logs.unshift(newLog);
  // Keep logs at a reasonable size
  if (db.audit_logs.length > 500) {
    db.audit_logs = db.audit_logs.slice(0, 500);
  }
  await writeDB(db);
  return newLog;
}

// Helper to add system notifications
export async function addNotification(type: SystemNotification['type'], message: string) {
  const db = await readDB();
  const newNotification: SystemNotification = {
    id: `n-${Date.now()}`,
    type,
    message,
    timestamp: new Date().toISOString(),
    status: 'Unread',
  };
  db.notifications.unshift(newNotification);
  await writeDB(db);
  return newNotification;
}
