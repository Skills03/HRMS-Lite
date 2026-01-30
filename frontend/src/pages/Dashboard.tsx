import { useEffect, useState } from 'react';
import { Users, Building2, UserCheck, UserX, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import type { DashboardStats } from '../types';
import ErrorState from '../components/ErrorState';
import ProgressRing from '../components/ProgressRing';
import AnimatedStatCard from '../components/AnimatedStatCard';
import Button from '../components/Button';
import MiniChart from '../components/MiniChart';
import { SkeletonDashboard } from '../components/Skeleton';

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
    } catch {
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!stats) return null;

  const chartData = stats.recent_trend.map((d) => d.rate);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your team.
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedStatCard
            title="Total Employees"
            value={stats.total_employees}
            icon={Users}
            color="indigo"
          />
          <AnimatedStatCard
            title="Departments"
            value={stats.total_departments}
            icon={Building2}
            color="blue"
          />
          <AnimatedStatCard
            title="Today Marked"
            value={stats.todays_present + stats.todays_absent}
            icon={UserCheck}
            color="green"
          />
        </div>

        {/* Attendance Ring */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
          <ProgressRing value={stats.attendance_rate} />
          <p className="mt-2 text-xs text-gray-500">Overall Rate</p>
        </div>
      </div>

      {/* Attendance Trend Chart */}
      {stats.recent_trend.length > 0 && stats.total_employees > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Attendance Trend</h2>
              <p className="text-sm text-gray-500">Last 7 days attendance rate</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span className="font-medium text-gray-900">{stats.attendance_rate}%</span>
              <span className="text-gray-500">avg</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <MiniChart data={chartData} height={80} />
            <div className="flex gap-4 text-xs text-gray-500 ml-4">
              {stats.recent_trend.slice(-3).map((day) => (
                <div key={day.date} className="text-center">
                  <div className="font-medium text-gray-900">{day.rate}%</div>
                  <div>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Today's Attendance */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Today's Attendance</h2>
          <Link to="/attendance">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedStatCard
            title="Present"
            value={stats.todays_present}
            icon={UserCheck}
            color="green"
          />
          <AnimatedStatCard
            title="Absent"
            value={stats.todays_absent}
            icon={UserX}
            color="red"
          />
          <AnimatedStatCard
            title="Not Marked"
            value={stats.todays_unmarked}
            icon={Clock}
            color="yellow"
          />
        </div>
      </div>

      {/* Getting Started */}
      {stats.total_employees === 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-8 text-white">
          <h3 className="text-xl font-semibold">Get Started</h3>
          <p className="mt-2 text-indigo-100 max-w-lg">
            Welcome to HRMS Lite! Start by adding your first employee to begin tracking attendance.
          </p>
          <Link to="/employees">
            <Button
              variant="secondary"
              className="mt-4 bg-white text-indigo-600 hover:bg-indigo-50"
            >
              Add Your First Employee
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      {stats.total_employees > 0 && stats.todays_unmarked > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-amber-800">Attendance Reminder</h3>
              <p className="text-sm text-amber-600 mt-1">
                {stats.todays_unmarked} employee{stats.todays_unmarked > 1 ? 's' : ''} haven't been marked for today.
              </p>
            </div>
            <Link to="/attendance">
              <Button size="sm">Mark Now</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
