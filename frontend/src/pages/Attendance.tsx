import { useEffect, useState } from 'react';
import { CalendarCheck, Filter, UserCheck, UserX, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees, getAttendance, markAttendance } from '../services/api';
import type { Employee, AttendanceRecord, CreateAttendanceData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

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
    } catch (err) {
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

  if (loading) return <LoadingSpinner message="Loading attendance records..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const hasFilters = filterEmployeeId || filterStartDate || filterEndDate;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage employee attendance
          </p>
        </div>
        <button
          onClick={() => setIsMarkModalOpen(true)}
          disabled={employees.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CalendarCheck className="w-4 h-4 mr-2" />
          Mark Attendance
        </button>
      </div>

      {/* Stats Summary */}
      {attendance.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-xl font-semibold text-gray-900">{attendance.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Present</p>
            <p className="text-xl font-semibold text-green-600">{totalPresent}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Absent</p>
            <p className="text-xl font-semibold text-red-600">{totalAbsent}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Attendance Rate</p>
            <p className="text-xl font-semibold text-indigo-600">
              {attendance.length > 0
                ? `${((totalPresent / attendance.length) * 100).toFixed(1)}%`
                : '0%'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Filter Records</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Employee</label>
            <select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleFilter}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Apply
            </button>
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

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
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.employee_name || record.employee_id}
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {record.employee_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <UserX className="w-3 h-3 mr-1" />
                          Absent
                        </span>
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
        <form onSubmit={handleMarkAttendance}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              <label className="block text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="Present"
                    checked={formData.status === 'Present'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'Present' | 'Absent' })
                    }
                    className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Present</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="Absent"
                    checked={formData.status === 'Absent'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'Present' | 'Absent' })
                    }
                    className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Absent</span>
                </label>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsMarkModalOpen(false);
                setFormData({
                  employee_id: '',
                  date: new Date().toISOString().split('T')[0],
                  status: 'Present',
                });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
