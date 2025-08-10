import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { FaStar, FaClock, FaUser, FaMessage, FaCheck, FaTimes } from 'react-icons/fa';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isClient } = useAuth();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  // Fetch order details
  const { data: orderData, isLoading, error } = useQuery(
    ['order', id],
    () => axios.get(`/api/orders/${id}`).then(res => res.data),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // Update order status mutation
  const updateStatusMutation = useMutation(
    (status) => axios.put(`/api/orders/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        queryClient.invalidateQueries(['my-orders']);
      }
    }
  );

  // Add message mutation
  const addMessageMutation = useMutation(
    (message) => axios.post(`/api/orders/${id}/messages`, { message }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        reset();
      }
    }
  );

  // Rate order mutation
  const rateOrderMutation = useMutation(
    (ratingData) => axios.post(`/api/orders/${id}/rating`, ratingData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        setShowRatingModal(false);
      }
    }
  );

  const order = orderData?.order;

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

  const onSubmitMessage = async (data) => {
    addMessageMutation.mutate(data.message);
  };

  const onSubmitRating = async (data) => {
    rateOrderMutation.mutate({
      score: parseInt(data.score),
      review: data.review
    });
  };

  const canUpdateStatus = () => {
    if (!order) return false;
    
    const isClientUser = isClient && order.client._id === user._id;
    const isFreelancerUser = !isClient && order.freelancer._id === user._id;
    
    if (order.status === 'pending') {
      return isFreelancerUser; // Only freelancer can start work
    } else if (order.status === 'in-progress') {
      return isFreelancerUser; // Only freelancer can complete
    }
    
    return false;
  };

  const canRate = () => {
    return isClient && 
           order?.status === 'completed' && 
           order?.client._id === user._id && 
           !order?.rating?.score;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-8"></div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="h-64 bg-gray-200 rounded mb-6"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-red-600">Error loading order. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{order.gig.title}</h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <span>Order #{order._id.slice(-8)}</span>
              {getStatusBadge(order.status)}
              <span>${order.amount}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Details */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Requirements</label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{order.requirements}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Date</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(order.deliveryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {order.completedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completed Date</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(order.completedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
            
            <div className="space-y-4 mb-6">
              {order.messages && order.messages.length > 0 ? (
                order.messages.map((message, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaUser className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {message.sender.username}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{message.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No messages yet.</p>
              )}
            </div>

            {/* Add Message */}
            <form onSubmit={handleSubmit(onSubmitMessage)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send Message
                </label>
                <textarea
                  {...register('message', {
                    required: 'Message is required',
                    minLength: { value: 1, message: 'Message cannot be empty' }
                  })}
                  rows={3}
                  className={`input ${errors.message ? 'border-red-500' : ''}`}
                  placeholder="Type your message..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={addMessageMutation.isLoading}
                className="btn btn-primary"
              >
                {addMessageMutation.isLoading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Rating */}
          {order.rating && order.rating.score && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rating</h2>
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < order.rating.score ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-900">{order.rating.score}/5</span>
              </div>
              {order.rating.review && (
                <p className="text-gray-700">{order.rating.review}</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Status</span>
                {getStatusBadge(order.status)}
              </div>

              {canUpdateStatus() && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Update Status
                  </label>
                  <div className="flex space-x-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateStatusMutation.mutate('in-progress')}
                        disabled={updateStatusMutation.isLoading}
                        className="btn btn-primary flex-1"
                      >
                        Start Work
                      </button>
                    )}
                    {order.status === 'in-progress' && (
                      <button
                        onClick={() => updateStatusMutation.mutate('completed')}
                        disabled={updateStatusMutation.isLoading}
                        className="btn btn-success flex-1"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              )}

              {canRate() && (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="btn btn-primary w-full"
                >
                  Rate Order
                </button>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isClient ? 'Freelancer' : 'Client'}
            </h3>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <FaUser className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {isClient ? order.freelancer.username : order.client.username}
                </p>
                <p className="text-sm text-gray-600">
                  {isClient 
                    ? order.freelancer.profile?.location || 'Location not specified'
                    : order.client.profile?.location || 'Location not specified'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/users/${isClient ? order.freelancer._id : order.client._id}`)}
              className="btn btn-outline w-full"
            >
              View Profile
            </button>
          </div>

          {/* Gig Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gig Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Gig Title</label>
                <p className="text-gray-900 text-sm">{order.gig.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <p className="text-gray-900">${order.gig.price}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Time</label>
                <p className="text-gray-900">{order.gig.deliveryTime} days</p>
              </div>
              <button
                onClick={() => navigate(`/gigs/${order.gig._id}`)}
                className="btn btn-outline w-full"
              >
                View Gig
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate This Order</h2>
            
            <form onSubmit={handleSubmit(onSubmitRating)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <select
                  {...register('score', { required: 'Rating is required' })}
                  className={`input ${errors.score ? 'border-red-500' : ''}`}
                >
                  <option value="">Select rating</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
                {errors.score && (
                  <p className="mt-1 text-sm text-red-600">{errors.score.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review (Optional)
                </label>
                <textarea
                  {...register('review')}
                  rows={3}
                  className="input"
                  placeholder="Share your experience..."
                  maxLength={1000}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rateOrderMutation.isLoading}
                  className="btn btn-primary flex-1"
                >
                  {rateOrderMutation.isLoading ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail; 