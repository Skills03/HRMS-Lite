import { useEffect, useState } from 'react';
import { Plus, Trash2, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees, createEmployee, deleteEmployee } from '../services/api';
import type { Employee, CreateEmployeeData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateEmployeeData>({
    employee_id: '',
    full_name: '',
    email: '',
    department: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployees();
      setEmployees(data.employees);
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.employee_id.trim()) {
      errors.employee_id = 'Employee ID is required';
    }
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.department.trim()) {
      errors.department = 'Department is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await createEmployee(formData);
      toast.success('Employee added successfully');
      setIsAddModalOpen(false);
      setFormData({ employee_id: '', full_name: '', email: '', department: '' });
      fetchEmployees();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const message = error.response?.data?.detail || 'Failed to add employee';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setIsSubmitting(true);
      await deleteEmployee(selectedEmployee.employee_id);
      toast.success('Employee deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const message = error.response?.data?.detail || 'Failed to delete employee';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading employees..." />;
  if (error) return <ErrorState message={error} onRetry={fetchEmployees} />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your employee records
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </button>
      </div>

      {employees.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees"
          description="Get started by adding your first employee."
          action={{ label: 'Add Employee', onClick: () => setIsAddModalOpen(true) }}
        />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try adjusting your search terms."
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
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.employee_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.full_name}
                        </div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                        <div className="text-xs text-gray-400">ID: {employee.employee_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {employee.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-green-600">
                          {employee.total_present} Present
                        </span>
                        <span className="text-red-600">
                          {employee.total_absent} Absent
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormData({ employee_id: '', full_name: '', email: '', department: '' });
          setFormErrors({});
        }}
        title="Add New Employee"
      >
        <form onSubmit={handleAddEmployee}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  formErrors.employee_id
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder="EMP001"
              />
              {formErrors.employee_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.employee_id}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  formErrors.full_name
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder="John Doe"
              />
              {formErrors.full_name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.full_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  formErrors.email
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder="john.doe@example.com"
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  formErrors.department
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder="Engineering"
              />
              {formErrors.department && (
                <p className="mt-1 text-sm text-red-600">{formErrors.department}</p>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setFormData({ employee_id: '', full_name: '', email: '', department: '' });
                setFormErrors({});
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
              {isSubmitting ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedEmployee(null);
        }}
        onConfirm={handleDeleteEmployee}
        title="Delete Employee"
        message={`Are you sure you want to delete ${selectedEmployee?.full_name}? This will also delete all their attendance records. This action cannot be undone.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
