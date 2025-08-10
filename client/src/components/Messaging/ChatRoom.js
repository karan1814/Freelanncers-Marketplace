import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import { FaPaperPlane, FaPaperclip, FaSmile, FaImage, FaFile } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ChatRoom = ({ orderId }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { socket, isConnected, joinOrderRoom, leaveOrderRoom, sendMessage, sendTypingIndicator } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messagesData, isLoading } = useQuery(
    ['messages', orderId],
    () => axios.get(`/api/messages/order/${orderId}`).then(res => res.data),
    {
      refetchInterval: 5000, // Poll every 5 seconds as fallback
      staleTime: 1000,
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    (messageData) => axios.post('/api/messages', messageData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['messages', orderId]);
        setMessage('');
        setIsTyping(false);
        sendTypingIndicator(orderId, false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    }
  );

  // Mark message as read mutation
  const markAsReadMutation = useMutation(
    (messageId) => axios.put(`/api/messages/${messageId}/read`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['messages', orderId]);
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
        const fileUrl = data.data.data.url;
        const fileName = data.data.data.fileName;
        
        sendMessageMutation.mutate({
          orderId,
          message: `📎 ${fileName}`,
          messageType: 'file',
          attachments: [{
            fileName,
            fileUrl,
            fileSize: data.data.data.fileSize,
            fileType: data.data.data.format
          }]
        });
      },
      onError: (error) => {
        toast.error('Failed to upload file');
      }
    }
  );

  useEffect(() => {
    if (isConnected && orderId) {
      joinOrderRoom(orderId);
      
      // Listen for typing indicators
      socket.on('user_typing', (data) => {
        if (data.userId !== user._id) {
          setTypingUsers(prev => {
            const filtered = prev.filter(id => id !== data.userId);
            if (data.isTyping) {
              return [...filtered, data.userId];
            }
            return filtered;
          });
        }
      });

      return () => {
        leaveOrderRoom(orderId);
        socket.off('user_typing');
      };
    }
  }, [isConnected, orderId, user._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messagesData?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      orderId,
      message: message.trim(),
      messageType: 'text'
    });

    // Send via socket for real-time
    sendMessage(orderId, message.trim());
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(orderId, true);
    }
    
    // Clear typing indicator after 2 seconds of no typing
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(orderId, false);
    }, 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      uploadFileMutation.mutate(file);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      const formData = new FormData();
      formData.append('image', file);
      
      axios.post('/api/upload/image', formData)
        .then(response => {
          const imageUrl = response.data.data.url;
          sendMessageMutation.mutate({
            orderId,
            message: '📷 Image',
            messageType: 'image',
            attachments: [{
              fileName: 'image',
              fileUrl: imageUrl,
              fileType: 'image'
            }]
          });
        })
        .catch(error => {
          toast.error('Failed to upload image');
        });
    }
  };

  const isOwnMessage = (message) => message.sender._id === user._id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2">Loading messages...</span>
      </div>
    );
  }

  const messages = messagesData?.messages || [];

  return (
    <div className="flex flex-col h-96 bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Order Messages</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isOwnMessage(msg)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">
                  {msg.sender.profile?.firstName || msg.sender.username}
                </span>
                <span className="text-xs opacity-75">
                  {format(new Date(msg.createdAt), 'HH:mm')}
                </span>
              </div>

              {/* Message Content */}
              <div className="text-sm">
                {msg.messageType === 'file' ? (
                  <div className="flex items-center">
                    <FaFile className="mr-2" />
                    <a
                      href={msg.attachments?.[0]?.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      {msg.attachments?.[0]?.fileName}
                    </a>
                  </div>
                ) : msg.messageType === 'image' ? (
                  <div>
                    <img
                      src={msg.attachments?.[0]?.fileUrl}
                      alt="Shared image"
                      className="max-w-full rounded"
                    />
                  </div>
                ) : (
                  <p>{msg.message}</p>
                )}
              </div>

              {/* Read Status */}
              {isOwnMessage(msg) && (
                <div className="text-xs opacity-75 mt-1">
                  {msg.isRead ? '✓ Read' : '✓ Sent'}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600 ml-2">Typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          {/* File Upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Attach file"
          >
            <FaPaperclip className="w-4 h-4" />
          </button>

          {/* Image Upload */}
          <button
            type="button"
            onClick={() => document.getElementById('imageInput')?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Attach image"
          >
            <FaImage className="w-4 h-4" />
          </button>

          {/* Message Input */}
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={sendMessageMutation.isLoading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isLoading}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaPaperPlane className="w-4 h-4" />
          </button>
        </form>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.zip,.rar"
        />
        <input
          id="imageInput"
          type="file"
          onChange={handleImageUpload}
          className="hidden"
          accept="image/*"
        />
      </div>
    </div>
  );
};

export default ChatRoom; 