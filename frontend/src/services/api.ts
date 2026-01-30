import axios from 'axios';
import type {
  EmployeeListResponse,
  Employee,
  AttendanceListResponse,
  AttendanceRecord,
  DashboardStats,
  CreateEmployeeData,
  CreateAttendanceData,
} from '../types';

// Use proxy in production, direct URL in development
const API_BASE_URL = import.meta.env.PROD
  ? '/api/proxy'
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Employee APIs
export const getEmployees = async (): Promise<EmployeeListResponse> => {
  const response = await api.get('/api/employees');
  return response.data;
};

export const getEmployee = async (id: string): Promise<Employee> => {
  const response = await api.get(`/api/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data: CreateEmployeeData): Promise<Employee> => {
  const response = await api.post('/api/employees', data);
  return response.data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await api.delete(`/api/employees/${id}`);
};

// Attendance APIs
export const getAttendance = async (params?: {
  employee_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<AttendanceListResponse> => {
  const response = await api.get('/api/attendance', { params });
  return response.data;
};

export const markAttendance = async (data: CreateAttendanceData): Promise<AttendanceRecord> => {
  const response = await api.post('/api/attendance', data);
  return response.data;
};

export const updateAttendance = async (
  id: string,
  data: CreateAttendanceData
): Promise<AttendanceRecord> => {
  const response = await api.put(`/api/attendance/${id}`, data);
  return response.data;
};

// Dashboard API
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/api/dashboard');
  return response.data;
};

export default api;
