import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { FaExclamationTriangle, FaFileUpload, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import FileUpload from '../Upload/FileUpload';

const DisputeForm = ({ order, onSuccess, onCancel }) => {
  const [evidence, setEvidence] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const createDisputeMutation = useMutation(
    (disputeData) => axios.post('/api/disputes', disputeData),
    {
      onSuccess: (data) => {
        toast.success('Dispute created successfully');
        queryClient.invalidateQueries(['my-disputes']);
        queryClient.invalidateQueries(['my-orders']);
        onSuccess(data.data);
        reset();
        setEvidence([]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create dispute');
        setIsSubmitting(false);
      }
    }
  );

  const onSubmit = async (data) => {
    if (evidence.length === 0) {
      toast.error('Please provide at least one piece of evidence');
      return;
    }

    setIsSubmitting(true);
    
    const disputeData = {
      orderId: order._id,
      type: data.type,
      reason: data.reason,
      evidence: evidence.map(ev => ({
        type: ev.type,
        description: ev.description,
        fileUrl: ev.fileUrl
      }))
    };

    createDisputeMutation.mutate(disputeData);
  };

  const handleEvidenceUpload = (files) => {
    const newEvidence = files.map(file => ({
      type: 'file',
      description: `Evidence file: ${file.fileName}`,
      fileUrl: file.url,
      fileName: file.fileName
    }));
    setEvidence(prev => [...prev, ...newEvidence]);
  };

  const removeEvidence = (index) => {
    setEvidence(prev => prev.filter((_, i) => i !== index));
  };

  const addEvidence = () => {
    setEvidence(prev => [...prev, {
      type: 'other',
      description: '',
      fileUrl: ''
    }]);
  };

  const updateEvidence = (index, field, value) => {
    setEvidence(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <FaExclamationTriangle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Dispute</h2>
        <p className="text-gray-600">
          Please provide details about the issue with order #{order._id.slice(-8)}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Order Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Gig:</span>
              <p className="font-medium">{order.gig?.title}</p>
            </div>
            <div>
              <span className="text-gray-600">Amount:</span>
              <p className="font-medium">${order.amount}</p>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <p className="font-medium capitalize">{order.status}</p>
            </div>
            <div>
              <span className="text-gray-600">Created:</span>
              <p className="font-medium">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Dispute Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dispute Type *
          </label>
          <select
            {...register('type', { required: 'Please select a dispute type' })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select dispute type</option>
            <option value="quality">Quality Issues</option>
            <option value="delivery">Delivery Problems</option>
            <option value="communication">Communication Issues</option>
            <option value="payment">Payment Problems</option>
            <option value="other">Other</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Reason *
          </label>
          <textarea
            {...register('reason', { 
              required: 'Please provide a detailed reason',
              minLength: {
                value: 10,
                message: 'Reason must be at least 10 characters long'
              },
              maxLength: {
                value: 1000,
                message: 'Reason must be less than 1000 characters'
              }
            })}
            rows={4}
            placeholder="Please provide a detailed explanation of the issue..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
          )}
        </div>

        {/* Evidence Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Evidence *
          </label>
          <FileUpload
            type="document"
            multiple={true}
            maxFiles={5}
            onUploadSuccess={handleEvidenceUpload}
            className="mb-4"
          />
          
          {/* Manual Evidence Entry */}
          <div className="space-y-3">
            {evidence.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <select
                    value={item.type}
                    onChange={(e) => updateEvidence(index, 'type', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="message">Message</option>
                    <option value="file">File</option>
                    <option value="screenshot">Screenshot</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateEvidence(index, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEvidence(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addEvidence}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Evidence
            </button>
          </div>
        </div>

        {/* Resolution Request */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Resolution
          </label>
          <select
            {...register('preferredResolution')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select preferred resolution</option>
            <option value="refund_full">Full Refund</option>
            <option value="refund_partial">Partial Refund</option>
            <option value="continue_work">Continue Work</option>
            <option value="revision">Revision</option>
            <option value="cancelled">Cancel Order</option>
          </select>
        </div>

        {/* Warning */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <FaExclamationTriangle className="h-5 w-5 text-orange-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Important Information
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Disputes are reviewed by our support team within 24-48 hours</li>
                  <li>Please provide clear evidence to support your claim</li>
                  <li>False disputes may result in account suspension</li>
                  <li>Both parties will be notified of the dispute resolution</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || evidence.length === 0}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating Dispute...' : 'Create Dispute'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DisputeForm; 