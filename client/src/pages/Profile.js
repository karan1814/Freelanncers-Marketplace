import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { FaUser, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState(user?.profile?.skills || []);
  const [skillInput, setSkillInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    defaultValues: {
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      bio: user?.profile?.bio || '',
      hourlyRate: user?.profile?.hourlyRate || '',
      location: user?.profile?.location || '',
      phone: user?.profile?.phone || ''
    }
  });

  const updateProfileMutation = useMutation(
    (profileData) => axios.put('/api/users/profile', profileData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['user']);
        setIsEditing(false);
      }
    }
  );

  const addSkill = () => {
    if (skillInput.trim() && skills.length < 10) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    const profileData = {
      profile: {
        ...data,
        skills: skills,
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined
      }
    };

    updateProfileMutation.mutate(profileData);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setValue('firstName', user?.profile?.firstName || '');
    setValue('lastName', user?.profile?.lastName || '');
    setValue('bio', user?.profile?.bio || '');
    setValue('hourlyRate', user?.profile?.hourlyRate || '');
    setValue('location', user?.profile?.location || '');
    setValue('phone', user?.profile?.phone || '');
    setSkills(user?.profile?.skills || []);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSkills(user?.profile?.skills || []);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your profile information and preferences.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="card p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUser className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.profile?.firstName && user?.profile?.lastName
                  ? `${user.profile.firstName} ${user.profile.lastName}`
                  : user?.username
                }
              </h2>
              <p className="text-gray-600">@{user?.username}</p>
              <span className={`badge ${user?.role === 'freelancer' ? 'badge-success' : 'badge-info'} mt-2`}>
                {user?.role === 'freelancer' ? 'Freelancer' : 'Client'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              
              {user?.profile?.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="text-gray-900">{user.profile.location}</p>
                </div>
              )}

              {user?.profile?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{user.profile.phone}</p>
                </div>
              )}

              {user?.rating && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1 text-gray-900">
                      {user.rating.average || 0} ({user.rating.count || 0} reviews)
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <p className="text-gray-900">
                  {new Date(user?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="btn btn-outline flex items-center"
                >
                  <FaEdit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="btn btn-outline flex items-center"
                  >
                    <FaTimes className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={updateProfileMutation.isLoading}
                    className="btn btn-primary flex items-center"
                  >
                    <FaSave className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      {...register('firstName')}
                      className="input"
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      {...register('lastName')}
                      className="input"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={4}
                    className="input"
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {watch('bio')?.length || 0}/500 characters
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      {...register('location')}
                      className="input"
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="input"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {user?.role === 'freelancer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('hourlyRate')}
                      className="input"
                      placeholder="25.00"
                    />
                  </div>
                )}

                {user?.role === 'freelancer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills
                    </label>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          className="input flex-1"
                          placeholder="Add a skill (press Enter)"
                          maxLength={30}
                        />
                        <button
                          type="button"
                          onClick={addSkill}
                          disabled={!skillInput.trim() || skills.length >= 10}
                          className="btn btn-outline disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                      
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill, index) => (
                            <span
                              key={index}
                              className="badge badge-info flex items-center"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkill(index)}
                                className="ml-1 text-xs"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-500">
                        Add up to 10 skills to showcase your expertise. {skills.length}/10
                      </p>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <p className="text-gray-900">
                      {user?.profile?.firstName || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <p className="text-gray-900">
                      {user?.profile?.lastName || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <p className="text-gray-900">
                    {user?.profile?.bio || 'No bio provided'}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="text-gray-900">
                      {user?.profile?.location || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">
                      {user?.profile?.phone || 'Not specified'}
                    </p>
                  </div>
                </div>

                {user?.role === 'freelancer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                    <p className="text-gray-900">
                      {user?.profile?.hourlyRate ? `$${user.profile.hourlyRate}/hr` : 'Not specified'}
                    </p>
                  </div>
                )}

                {user?.role === 'freelancer' && user?.profile?.skills && user.profile.skills.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {user.profile.skills.map((skill, index) => (
                        <span key={index} className="badge badge-info">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 