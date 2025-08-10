import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { FaPlus, FaTimes } from 'react-icons/fa';

const CreateGig = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [features, setFeatures] = useState([{ name: '', included: true }]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const createGigMutation = useMutation(
    (gigData) => axios.post('/api/gigs', gigData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['my-gigs']);
        navigate('/dashboard');
      }
    }
  );

  const categories = [
    { value: 'web-development', label: 'Web Development' },
    { value: 'mobile-development', label: 'Mobile Development' },
    { value: 'design', label: 'Design' },
    { value: 'writing', label: 'Writing' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'video-animation', label: 'Video & Animation' },
    { value: 'music-audio', label: 'Music & Audio' },
    { value: 'programming-tech', label: 'Programming & Tech' },
    { value: 'business', label: 'Business' },
    { value: 'lifestyle', label: 'Lifestyle' }
  ];

  const subcategories = {
    'web-development': ['Frontend Development', 'Backend Development', 'Full Stack Development', 'WordPress', 'E-commerce'],
    'mobile-development': ['iOS Development', 'Android Development', 'React Native', 'Flutter', 'Cross-platform'],
    'design': ['Logo Design', 'Web Design', 'UI/UX Design', 'Graphic Design', 'Brand Identity'],
    'writing': ['Content Writing', 'Copywriting', 'Technical Writing', 'Creative Writing', 'Translation'],
    'marketing': ['Digital Marketing', 'Social Media Marketing', 'SEO', 'Email Marketing', 'PPC'],
    'video-animation': ['Video Editing', 'Motion Graphics', '3D Animation', 'Video Production', 'Whiteboard Animation'],
    'music-audio': ['Voice Over', 'Music Production', 'Audio Editing', 'Sound Design', 'Podcast Production'],
    'programming-tech': ['Software Development', 'Data Analysis', 'Machine Learning', 'Blockchain', 'DevOps'],
    'business': ['Business Consulting', 'Financial Analysis', 'Market Research', 'Business Plans', 'Legal Services'],
    'lifestyle': ['Fitness Training', 'Nutrition', 'Life Coaching', 'Travel Planning', 'Personal Styling']
  };

  const selectedCategory = watch('category');

  const addFeature = () => {
    setFeatures([...features, { name: '', included: true }]);
  };

  const removeFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index, field, value) => {
    const newFeatures = [...features];
    newFeatures[index][field] = value;
    setFeatures(newFeatures);
  };

  const addTag = () => {
    if (tagInput.trim() && tags.length < 10) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    const gigData = {
      ...data,
      features: features.filter(f => f.name.trim()),
      tags: tags,
      price: parseFloat(data.price),
      deliveryTime: parseInt(data.deliveryTime),
      revisions: parseInt(data.revisions) || 0
    };

    createGigMutation.mutate(gigData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Gig</h1>
        <p className="text-gray-600 mt-2">
          Showcase your skills and start earning by creating a compelling gig.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gig Title *
              </label>
              <input
                type="text"
                {...register('title', {
                  required: 'Title is required',
                  minLength: { value: 5, message: 'Title must be at least 5 characters' },
                  maxLength: { value: 100, message: 'Title must be less than 100 characters' }
                })}
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="e.g., I will create a professional website"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className={`input ${errors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          {selectedCategory && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory *
              </label>
              <select
                {...register('subcategory', { required: 'Subcategory is required' })}
                className={`input ${errors.subcategory ? 'border-red-500' : ''}`}
              >
                <option value="">Select a subcategory</option>
                {subcategories[selectedCategory]?.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              {errors.subcategory && (
                <p className="mt-1 text-sm text-red-600">{errors.subcategory.message}</p>
              )}
            </div>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 20, message: 'Description must be at least 20 characters' },
                maxLength: { value: 2000, message: 'Description must be less than 2000 characters' }
              })}
              rows={6}
              className={`input ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Describe what you will deliver, your process, and why clients should choose you..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Pricing & Delivery */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing & Delivery</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                {...register('price', {
                  required: 'Price is required',
                  min: { value: 1, message: 'Price must be at least $1' }
                })}
                className={`input ${errors.price ? 'border-red-500' : ''}`}
                placeholder="50"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Time (Days) *
              </label>
              <input
                type="number"
                min="1"
                {...register('deliveryTime', {
                  required: 'Delivery time is required',
                  min: { value: 1, message: 'Delivery time must be at least 1 day' }
                })}
                className={`input ${errors.deliveryTime ? 'border-red-500' : ''}`}
                placeholder="7"
              />
              {errors.deliveryTime && (
                <p className="mt-1 text-sm text-red-600">{errors.deliveryTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revisions
              </label>
              <input
                type="number"
                min="0"
                {...register('revisions')}
                className="input"
                placeholder="2"
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">What's Included</h2>
          
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4">
                <input
                  type="text"
                  value={feature.name}
                  onChange={(e) => updateFeature(index, 'name', e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Source files, 2 revisions, 24/7 support"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={feature.included}
                    onChange={(e) => updateFeature(index, 'included', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Included</span>
                </label>
                {features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addFeature}
              className="btn btn-outline flex items-center"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Add Feature
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tags</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="input flex-1"
                placeholder="Add a tag (press Enter)"
                maxLength={20}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 10}
                className="btn btn-outline disabled:opacity-50"
              >
                Add
              </button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="badge badge-info flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-1 text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            <p className="text-sm text-gray-500">
              Add up to 10 tags to help clients find your gig. {tags.length}/10
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createGigMutation.isLoading}
            className="btn btn-primary"
          >
            {createGigMutation.isLoading ? 'Creating...' : 'Create Gig'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGig; 