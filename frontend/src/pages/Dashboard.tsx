import { useEffect, useState } from 'react';
import { Users, Building2, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';
import { getDashboardStats } from '../services/api';
import type { DashboardStats } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!stats) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your HR management system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.total_employees}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Departments"
          value={stats.total_departments}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendance_rate}%`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Present"
            value={stats.todays_present}
            icon={UserCheck}
            color="green"
          />
          <StatCard
            title="Absent"
            value={stats.todays_absent}
            icon={UserX}
            color="red"
          />
          <StatCard
            title="Not Marked"
            value={stats.todays_unmarked}
            icon={Clock}
            color="yellow"
          />
        </div>
      </div>

      {stats.total_employees === 0 && (
        <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-indigo-800">Getting Started</h3>
          <p className="mt-1 text-sm text-indigo-600">
            Start by adding employees to your system. Navigate to the Employees page to add your first employee.
          </p>
        </div>
      )}
    </div>
  );
}
