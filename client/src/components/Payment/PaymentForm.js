import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { FaCreditCard, FaLock, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const PaymentForm = ({ order, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);

  // Create payment intent
  const createPaymentIntentMutation = useMutation(
    () => axios.post('/api/payments/create-payment-intent', { orderId: order._id }),
    {
      onSuccess: (data) => {
        setPaymentIntent(data.data);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create payment intent');
      }
    }
  );

  // Confirm payment
  const confirmPaymentMutation = useMutation(
    (paymentData) => axios.post('/api/payments/confirm-payment', paymentData),
    {
      onSuccess: (data) => {
        toast.success('Payment confirmed and held in escrow!');
        queryClient.invalidateQueries(['my-orders']);
        queryClient.invalidateQueries(['my-payments']);
        onSuccess(data.data);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Payment confirmation failed');
        setIsProcessing(false);
      }
    }
  );

  useEffect(() => {
    createPaymentIntentMutation.mutate();
  }, [order._id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
      paymentIntent.clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      }
    );

    if (error) {
      toast.error(error.message || 'Payment failed');
      setIsProcessing(false);
    } else {
      if (confirmedPaymentIntent.status === 'succeeded') {
        confirmPaymentMutation.mutate({
          paymentId: paymentIntent.paymentId,
          paymentIntentId: confirmedPaymentIntent.id
        });
      }
    }
  };

  if (!paymentIntent) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2">Preparing payment...</span>
      </div>
    );
  }

  const totalAmount = order.amount + (order.amount * 0.10); // Order amount + 10% platform fee

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
        <p className="text-gray-600">Secure payment powered by Stripe</p>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Gig:</span>
            <span className="font-medium">{order.gig?.title}</span>
          </div>
          <div className="flex justify-between">
            <span>Order Amount:</span>
            <span className="font-medium">${order.amount}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee (10%):</span>
            <span className="font-medium">${(order.amount * 0.10).toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total:</span>
            <span className="text-primary-600">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Security Badges */}
      <div className="flex items-center justify-center space-x-4 mb-6 text-sm text-gray-600">
        <div className="flex items-center">
          <FaShieldAlt className="mr-1" />
          <span>Secure</span>
        </div>
        <div className="flex items-center">
          <FaLock className="mr-1" />
          <span>Encrypted</span>
        </div>
        <div className="flex items-center">
          <FaCreditCard className="mr-1" />
          <span>PCI Compliant</span>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 rounded-md p-3">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>

        {/* Payment Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              `Pay $${totalAmount.toFixed(2)}`
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Payment Info */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>Your payment is held securely in escrow until the order is completed.</p>
        <p className="mt-1">You can request a refund if the work doesn't meet your requirements.</p>
      </div>
    </div>
  );
};

export default PaymentForm; 