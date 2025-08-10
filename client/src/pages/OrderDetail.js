import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaCreditCard,
  FaComments,
  FaFileAlt,
  FaDownload,
  FaStar,
  FaFlag
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// Components
import ChatRoom from '../components/Messaging/ChatRoom';
import PaymentForm from '../components/Payment/PaymentForm';
import DisputeForm from '../components/Disputes/DisputeForm';
import FileUpload from '../components/Upload/FileUpload';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('details');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Fetch order details
  const { data: order, isLoading, error } = useQuery(
    ['order', id],
    () => axios.get(`/api/orders/${id}`).then(res => res.data),
    {
      refetchInterval: 10000, // Poll every 10 seconds
    }
  );

  // Update order status mutation
  const updateStatusMutation = useMutation(
    (status) => axios.put(`/api/orders/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        queryClient.invalidateQueries(['my-orders']);
        toast.success('Order status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update order status');
      }
    }
  );

  // Rate order mutation
  const rateOrderMutation = useMutation(
    (ratingData) => axios.post(`/api/orders/${id}/rating`, ratingData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        toast.success('Rating submitted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit rating');
      }
    }
  );

  // File upload mutation
  const uploadFileMutation = useMutation(
    (file) => {
      const formData = new FormData();
      formData.append('document', file);
      return axios.post('/api/upload/document', formData);
    },
    {
      onSuccess: (data) => {
        toast.success('File uploaded successfully');
        queryClient.invalidateQueries(['order', id]);
      },
      onError: (error) => {
        toast.error('Failed to upload file');
      }
    }
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'bg-yellow-100 text-yellow-800', icon: FaClock, text: 'Pending' },
      'in-progress': { class: 'bg-blue-100 text-blue-800', icon: FaClock, text: 'In Progress' },
      completed: { class: 'bg-green-100 text-green-800', icon: FaCheckCircle, text: 'Completed' },
      cancelled: { class: 'bg-red-100 text-red-800', icon: FaTimesCircle, text: 'Cancelled' },
      disputed: { class: 'bg-orange-100 text-orange-800', icon: FaExclamationTriangle, text: 'Disputed' }
    };
    
    const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-800', icon: FaClock, text: status };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.text}
      </span>
    );
  };

  const isClient = order?.client?._id === user?._id;
  const isFreelancer = order?.freelancer?._id === user?._id;
  const canRate = isClient && order?.status === 'completed' && !order?.rating;
  const canUpdateStatus = isFreelancer && ['pending', 'in-progress'].includes(order?.status);
  const canPay = isClient && order?.status === 'pending';
  const canDispute = ['pending', 'in-progress', 'completed'].includes(order?.status);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2">Loading order details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Failed to load order details</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order._id.slice(-8)}
              </h1>
              <p className="text-gray-600">{order.gig?.title}</p>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(order.status)}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'details'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'messages'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'files'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Files
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {canPay && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <FaCreditCard className="w-4 h-4 mr-2" />
                  Pay Now
                </button>
              )}

              {canUpdateStatus && (
                <select
                  onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Update Status</option>
                  <option value="in-progress">Mark as In Progress</option>
                  <option value="completed">Mark as Completed</option>
                </select>
              )}

              {canDispute && (
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  <FaFlag className="w-4 h-4 mr-2" />
                  Dispute
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'details' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Gig Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Title:</span>
                      <p className="font-medium">{order.gig?.title}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <p className="font-medium capitalize">{order.gig?.category}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Price:</span>
                      <p className="font-medium">${order.amount}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Delivery Time:</span>
                      <p className="font-medium">{order.gig?.deliveryTime} days</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Order Date:</span>
                      <p className="font-medium">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Delivery Date:</span>
                      <p className="font-medium">{format(new Date(order.deliveryDate), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="mt-1">{getStatusBadge(order.status)}</div>
                    </div>
                    {order.completedDate && (
                      <div>
                        <span className="text-gray-600">Completed Date:</span>
                        <p className="font-medium">{format(new Date(order.completedDate), 'MMM dd, yyyy')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Requirements</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{order.requirements}</p>
                </div>
              </div>

              {/* Rating Section */}
              {canRate && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Rate this Order</h3>
                  <div className="flex items-center space-x-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => rateOrderMutation.mutate({ rating: star, review: '' })}
                        className="text-2xl text-yellow-400 hover:text-yellow-500"
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Rating */}
              {order.rating && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Rating</h3>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`w-5 h-5 ${
                          star <= order.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600">({order.rating}/5)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-lg shadow">
              <ChatRoom orderId={id} />
            </div>
          )}

          {activeTab === 'files' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Files & Deliverables</h2>
                <button
                  onClick={() => setShowFileUpload(true)}
                  className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <FaFileAlt className="w-4 h-4 mr-2" />
                  Upload File
                </button>
              </div>

              {order.deliverables && order.deliverables.length > 0 ? (
                <div className="space-y-3">
                  {order.deliverables.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FaFileAlt className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{file.fileName}</p>
                          <p className="text-sm text-gray-600">{file.fileSize}</p>
                        </div>
                      </div>
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary-600 hover:text-primary-700"
                      >
                        <FaDownload className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaFileAlt className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No files uploaded yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {isClient ? 'Freelancer' : 'Client'} Information
            </h3>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={isClient ? order.freelancer?.profile?.avatar : order.client?.profile?.avatar}
                alt="Avatar"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900">
                  {isClient 
                    ? `${order.freelancer?.profile?.firstName} ${order.freelancer?.profile?.lastName}`
                    : `${order.client?.profile?.firstName} ${order.client?.profile?.lastName}`
                  }
                </p>
                <p className="text-sm text-gray-600">
                  {isClient ? order.freelancer?.username : order.client?.username}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Rating:</span>
                <div className="flex items-center space-x-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (isClient ? order.freelancer?.rating?.average : order.client?.rating?.average)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-gray-600 ml-1">
                    ({isClient ? order.freelancer?.rating?.average : order.client?.rating?.average}/5)
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <p className="font-medium">
                  {isClient ? order.freelancer?.profile?.location : order.client?.profile?.location}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Amount:</span>
                <span className="font-medium">${order.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (10%):</span>
                <span className="font-medium">${(order.amount * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total:</span>
                <span>${(order.amount * 1.1).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <PaymentForm
              order={order}
              onSuccess={() => {
                setShowPaymentModal(false);
                queryClient.invalidateQueries(['order', id]);
              }}
              onCancel={() => setShowPaymentModal(false)}
            />
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <DisputeForm
              order={order}
              onSuccess={() => {
                setShowDisputeModal(false);
                queryClient.invalidateQueries(['order', id]);
              }}
              onCancel={() => setShowDisputeModal(false)}
            />
          </div>
        </div>
      )}

      {showFileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Files</h3>
              <button
                onClick={() => setShowFileUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <FileUpload
              type="document"
              multiple={true}
              maxFiles={10}
              onUploadSuccess={(files) => {
                setShowFileUpload(false);
                queryClient.invalidateQueries(['order', id]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail; 