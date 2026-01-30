import { useEffect, useState } from 'react';
import { CalendarCheck, Filter, UserCheck, UserX, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees, getAttendance, markAttendance } from '../services/api';
import type { Employee, AttendanceRecord, CreateAttendanceData } from '../types';
import { SkeletonTable } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';

export default function Attendance() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Stats
  const [totalPresent, setTotalPresent] = useState(0);
  const [totalAbsent, setTotalAbsent] = useState(0);

  // Form state
  const [formData, setFormData] = useState<CreateAttendanceData>({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empData, attData] = await Promise.all([
        getEmployees(),
        getAttendance({
          employee_id: filterEmployeeId || undefined,
          start_date: filterStartDate || undefined,
          end_date: filterEndDate || undefined,
        }),
      ]);
      setEmployees(empData.employees);
      setAttendance(attData.records);
      setTotalPresent(attData.total_present);
      setTotalAbsent(attData.total_absent);
    } catch {
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    fetchData();
  };

  const handleClearFilters = () => {
    setFilterEmployeeId('');
    setFilterStartDate('');
    setFilterEndDate('');
    setTimeout(fetchData, 0);
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id) {
      toast.error('Please select an employee');
      return;
    }

    try {
      setIsSubmitting(true);
      await markAttendance(formData);
      toast.success('Attendance marked successfully');
      setIsMarkModalOpen(false);
      setFormData({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
      });
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const message = error.response?.data?.detail || 'Failed to mark attendance';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <SkeletonTable />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const hasFilters = filterEmployeeId || filterStartDate || filterEndDate;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage employee attendance
          </p>
        </div>
        <Button
          onClick={() => setIsMarkModalOpen(true)}
          disabled={employees.length === 0}
          leftIcon={<CalendarCheck className="w-4 h-4" />}
        >
          Mark Attendance
        </Button>
      </div>

      {/* Stats Summary */}
      {attendance.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">Total Records</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{attendance.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">Present</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{totalPresent}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">Absent</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{totalAbsent}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">
              {attendance.length > 0
                ? `${((totalPresent / attendance.length) * 100).toFixed(1)}%`
                : '0%'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Filter Records</h3>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Employee</label>
            <select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Start Date</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">End Date</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleFilter} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {employees.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No employees yet"
          description="Add employees first before marking attendance."
        />
      ) : attendance.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={hasFilters ? 'No records found' : 'No attendance records'}
          description={
            hasFilters
              ? 'Try adjusting your filters.'
              : 'Start marking attendance for your employees.'
          }
          action={
            hasFilters
              ? { label: 'Clear Filters', onClick: handleClearFilters }
              : { label: 'Mark Attendance', onClick: () => setIsMarkModalOpen(true) }
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar name={record.employee_name || record.employee_id} size="sm" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.employee_name || record.employee_id}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {record.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.status === 'Present' ? (
                        <Badge variant="green">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Present
                        </Badge>
                      ) : (
                        <Badge variant="red">
                          <UserX className="w-3 h-3 mr-1" />
                          Absent
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={isMarkModalOpen}
        onClose={() => {
          setIsMarkModalOpen(false);
          setFormData({
            employee_id: '',
            date: new Date().toISOString().split('T')[0],
            status: 'Present',
          });
        }}
        title="Mark Attendance"
      >
        <form onSubmit={handleMarkAttendance} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Select an employee</option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label
                className={`flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.status === 'Present'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value="Present"
                  checked={formData.status === 'Present'}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'Present' | 'Absent' })
                  }
                  className="sr-only"
                />
                <UserCheck className="w-5 h-5" />
                <span className="font-medium">Present</span>
              </label>
              <label
                className={`flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.status === 'Absent'
                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value="Absent"
                  checked={formData.status === 'Absent'}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'Present' | 'Absent' })
                  }
                  className="sr-only"
                />
                <UserX className="w-5 h-5" />
                <span className="font-medium">Absent</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsMarkModalOpen(false);
                setFormData({
                  employee_id: '',
                  date: new Date().toISOString().split('T')[0],
                  status: 'Present',
                });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Mark Attendance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
