import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { FaPlus, FaEye, FaEdit, FaTrash, FaStar, FaClock, FaDollarSign } from 'react-icons/fa';

const Dashboard = () => {
  const { user, isFreelancer, isClient } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user's gigs (for freelancers)
  const { data: gigsData, isLoading: gigsLoading } = useQuery(
    ['my-gigs'],
    () => axios.get('/api/gigs/my-gigs').then(res => res.data),
    {
      enabled: isFreelancer,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch user's orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery(
    ['my-orders'],
    () => axios.get('/api/orders/my-orders').then(res => res.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const gigs = gigsData?.gigs || [];
  const orders = ordersData?.orders || [];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'badge-warning', text: 'Pending' },
      'in-progress': { class: 'badge-info', text: 'In Progress' },
      completed: { class: 'badge-success', text: 'Completed' },
      cancelled: { class: 'badge-error', text: 'Cancelled' },
      disputed: { class: 'badge-error', text: 'Disputed' }
    };
    
    const config = statusConfig[status] || { class: 'badge-info', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const renderOverview = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="card p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-primary-100 text-primary-600">
            <FaDollarSign className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Earnings</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${isFreelancer ? '0' : '0'}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <FaClock className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Active Orders</p>
            <p className="text-2xl font-semibold text-gray-900">
              {orders.filter(order => ['pending', 'in-progress'].includes(order.status)).length}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <FaStar className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Average Rating</p>
            <p className="text-2xl font-semibold text-gray-900">
              {user?.rating?.average || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <FaEye className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              {isFreelancer ? 'Total Views' : 'Orders Placed'}
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {isFreelancer 
                ? gigs.reduce((sum, gig) => sum + gig.views, 0)
                : orders.length
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGigs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">My Gigs</h3>
        <Link
          to="/gigs/create"
          className="btn btn-primary flex items-center"
        >
          <FaPlus className="w-4 h-4 mr-2" />
          Create New Gig
        </Link>
      </div>

      {gigsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : gigs.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't created any gigs yet.</p>
          <Link to="/gigs/create" className="btn btn-primary">
            Create Your First Gig
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig) => (
            <div key={gig._id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-semibold text-gray-900 line-clamp-2">{gig.title}</h4>
                <span className={`badge ${gig.isActive ? 'badge-success' : 'badge-error'}`}>
                  {gig.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{gig.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-primary-600">${gig.price}</span>
                <div className="flex items-center text-sm text-gray-500">
                  <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                  {gig.rating.average || 0} ({gig.rating.count || 0})
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{gig.orders} orders</span>
                <span>{gig.views} views</span>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/gigs/${gig._id}`}
                  className="btn btn-outline flex-1 text-center"
                >
                  <FaEye className="w-4 h-4 mr-1" />
                  View
                </Link>
                <Link
                  to={`/gigs/${gig._id}/edit`}
                  className="btn btn-outline flex-1 text-center"
                >
                  <FaEdit className="w-4 h-4 mr-1" />
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        {isClient ? 'My Orders' : 'Orders Received'}
      </h3>

      {ordersLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-600">
            {isClient ? "You haven't placed any orders yet." : "You haven't received any orders yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{order.gig.title}</h4>
                  <p className="text-sm text-gray-600">
                    {isClient ? `Freelancer: ${order.freelancer.username}` : `Client: ${order.client.username}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-primary-600">${order.amount}</p>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{order.requirements}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                <span>Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</span>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/orders/${order._id}`}
                  className="btn btn-primary flex-1 text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.username}! Here's what's happening with your account.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'gigs', 'orders'].map((tab) => (
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

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'gigs' && isFreelancer && renderGigs()}
      {activeTab === 'orders' && renderOrders()}
    </div>
  );
};

export default Dashboard; 