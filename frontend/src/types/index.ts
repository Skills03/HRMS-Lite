export interface Employee {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  total_present: number;
  total_absent: number;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  status: 'Present' | 'Absent';
  employee_name?: string;
}

export interface AttendanceListResponse {
  records: AttendanceRecord[];
  total: number;
  total_present: number;
  total_absent: number;
}

export interface DailyAttendance {
  date: string;
  present: number;
  absent: number;
  rate: number;
}

export interface DashboardStats {
  total_employees: number;
  total_departments: number;
  todays_present: number;
  todays_absent: number;
  todays_unmarked: number;
  attendance_rate: number;
  recent_trend: DailyAttendance[];
}

export interface CreateEmployeeData {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
}

export interface CreateAttendanceData {
  employee_id: string;
  date: string;
  status: 'Present' | 'Absent';
}
