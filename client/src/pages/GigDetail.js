import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { FaStar, FaEye, FaClock, FaUser, FaCheck } from 'react-icons/fa';

const GigDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isClient } = useAuth();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  // Fetch gig details
  const { data: gigData, isLoading, error } = useQuery(
    ['gig', id],
    () => axios.get(`/api/gigs/${id}`).then(res => res.data),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // Create order mutation
  const createOrderMutation = useMutation(
    (orderData) => axios.post('/api/orders', orderData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['my-orders']);
        navigate('/dashboard');
      }
    }
  );

  const gig = gigData?.gig;

  const onSubmitOrder = async (data) => {
    const orderData = {
      gigId: id,
      requirements: data.requirements,
      deliveryDate: data.deliveryDate
    };

    createOrderMutation.mutate(orderData);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-8"></div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="h-64 bg-gray-200 rounded mb-6"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-red-600">Error loading gig. Please try again.</p>
      </div>
    );
  }

  const isOwner = isAuthenticated && user._id === gig.freelancer._id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{gig.title}</h1>
        <div className="flex items-center space-x-4 text-gray-600">
          <span>by {gig.freelancer.username}</span>
          <div className="flex items-center">
            <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
            <span>{gig.rating.average || 0} ({gig.rating.count || 0} reviews)</span>
          </div>
          <div className="flex items-center">
            <FaEye className="w-4 h-4 mr-1" />
            <span>{gig.views} views</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Gig Images */}
          <div className="card p-6">
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-4xl">📷</span>
            </div>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Gig</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{gig.description}</p>
          </div>

          {/* Features */}
          {gig.features && gig.features.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Included</h2>
              <ul className="space-y-2">
                {gig.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <FaCheck className="w-4 h-4 text-green-500 mr-3" />
                    <span className="text-gray-700">{feature.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {gig.tags && gig.tags.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {gig.tags.map((tag, index) => (
                  <span key={index} className="badge badge-info">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <div className="card p-6">
            <div className="text-center mb-6">
              <span className="text-3xl font-bold text-primary-600">${gig.price}</span>
              <p className="text-gray-600">One-time purchase</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Delivery Time</span>
                <div className="flex items-center">
                  <FaClock className="w-4 h-4 mr-1" />
                  <span>{gig.deliveryTime} days</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Revisions</span>
                <span>{gig.revisions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Orders</span>
                <span>{gig.orders}</span>
              </div>
            </div>

            {isAuthenticated ? (
              isOwner ? (
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/gigs/${id}/edit`)}
                    className="btn btn-primary w-full"
                  >
                    Edit Gig
                  </button>
                  <p className="text-sm text-gray-500 text-center">
                    You cannot order your own gig
                  </p>
                </div>
              ) : isClient ? (
                <button
                  onClick={() => setShowOrderForm(true)}
                  className="btn btn-primary w-full"
                >
                  Order Now
                </button>
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  Only clients can place orders
                </p>
              )
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary w-full"
              >
                Login to Order
              </button>
            )}
          </div>

          {/* Freelancer Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Freelancer</h3>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <FaUser className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{gig.freelancer.username}</p>
                <p className="text-sm text-gray-600">
                  {gig.freelancer.profile?.location || 'Location not specified'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/users/${gig.freelancer._id}`)}
              className="btn btn-outline w-full"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Place Order</h2>
            
            <form onSubmit={handleSubmit(onSubmitOrder)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Requirements *
                </label>
                <textarea
                  {...register('requirements', {
                    required: 'Requirements are required',
                    minLength: { value: 10, message: 'Requirements must be at least 10 characters' }
                  })}
                  rows={4}
                  className={`input ${errors.requirements ? 'border-red-500' : ''}`}
                  placeholder="Describe your project requirements in detail..."
                />
                {errors.requirements && (
                  <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Date *
                </label>
                <input
                  type="date"
                  {...register('deliveryDate', {
                    required: 'Delivery date is required'
                  })}
                  min={new Date().toISOString().split('T')[0]}
                  className={`input ${errors.deliveryDate ? 'border-red-500' : ''}`}
                />
                {errors.deliveryDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliveryDate.message}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="text-xl font-bold text-primary-600">${gig.price}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrderMutation.isLoading}
                  className="btn btn-primary flex-1"
                >
                  {createOrderMutation.isLoading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigDetail; 