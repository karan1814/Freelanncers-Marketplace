import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FaUsers, FaChartLine, FaDollarSign, FaStar, FaEye, FaShoppingCart } from 'react-icons/fa';

const AnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch analytics data
  const { data: overviewData, isLoading: overviewLoading } = useQuery(
    ['analytics-overview', timeframe],
    () => axios.get(`/api/analytics/overview?days=${timeframe}`).then(res => res.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const { data: trendsData, isLoading: trendsLoading } = useQuery(
    ['analytics-trends', timeframe],
    () => axios.get(`/api/analytics/trends?startDate=${getStartDate()}&endDate=${new Date().toISOString()}`).then(res => res.data),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery(
    ['analytics-categories'],
    () => axios.get('/api/analytics/categories').then(res => res.data),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const { data: financialData, isLoading: financialLoading } = useQuery(
    ['analytics-financial', timeframe],
    () => axios.get(`/api/analytics/financial?timeframe=${timeframe}`).then(res => res.data),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  function getStartDate() {
    const date = new Date();
    switch (timeframe) {
      case '7d':
        date.setDate(date.getDate() - 7);
        break;
      case '30d':
        date.setDate(date.getDate() - 30);
        break;
      case '90d':
        date.setDate(date.getDate() - 90);
        break;
      default:
        date.setDate(date.getDate() - 30);
    }
    return date.toISOString();
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const MetricCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (overviewLoading || trendsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  const current = overviewData?.current || {};
  const summary = overviewData?.summary || {};
  const trends = trendsData?.data || [];
  const categories = categoriesData?.categories || [];
  const financial = financialData?.payments || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'trends', 'categories', 'financial'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Users"
              value={current.totalUsers?.toLocaleString() || '0'}
              change={summary.growthRate?.users}
              icon={FaUsers}
              color="blue"
            />
            <MetricCard
              title="Total Revenue"
              value={`$${current.totalRevenue?.toLocaleString() || '0'}`}
              change={summary.growthRate?.orders}
              icon={FaDollarSign}
              color="green"
            />
            <MetricCard
              title="Active Gigs"
              value={current.activeGigs?.toLocaleString() || '0'}
              change={summary.growthRate?.gigs}
              icon={FaChartLine}
              color="purple"
            />
            <MetricCard
              title="Completed Orders"
              value={current.completedOrders?.toLocaleString() || '0'}
              icon={FaShoppingCart}
              color="orange"
            />
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="metrics.totalRevenue" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Trends</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="metrics.totalUsers" 
                  stroke="#3B82F6" 
                  name="Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="metrics.totalGigs" 
                  stroke="#10B981" 
                  name="Gigs"
                />
                <Line 
                  type="monotone" 
                  dataKey="metrics.totalOrders" 
                  stroke="#F59E0B" 
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalGigs"
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalOrders" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Revenue"
              value={`$${financial.totalRevenue?.toLocaleString() || '0'}`}
              icon={FaDollarSign}
              color="green"
            />
            <MetricCard
              title="Platform Fees"
              value={`$${financial.totalFees?.toLocaleString() || '0'}`}
              icon={FaChartLine}
              color="blue"
            />
            <MetricCard
              title="Freelancer Earnings"
              value={`$${financial.totalFreelancerEarnings?.toLocaleString() || '0'}`}
              icon={FaUsers}
              color="purple"
            />
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Platform Fees', value: financial.totalFees || 0 },
                { name: 'Freelancer Earnings', value: financial.totalFreelancerEarnings || 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard; 