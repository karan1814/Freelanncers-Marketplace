import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaStar, FaEye, FaFilter } from 'react-icons/fa';

const GigList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Get current filters from URL
  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'createdAt';

  // Fetch gigs
  const { data, isLoading, error } = useQuery(
    ['gigs', page, search, category, minPrice, maxPrice, sort],
    () => {
      const params = new URLSearchParams();
      if (page > 1) params.append('page', page);
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sort) params.append('sort', sort);
      
      return axios.get(`/api/gigs?${params.toString()}`).then(res => res.data);
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const gigs = data?.gigs || [];
  const pagination = data?.pagination || {};

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

  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'orders', label: 'Most Popular' }
  ];

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set('page', '1'); // Reset to first page when filters change
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    updateFilters({
      search: formData.get('search'),
      category: formData.get('category'),
      minPrice: formData.get('minPrice'),
      maxPrice: formData.get('maxPrice'),
      sort: formData.get('sort')
    });
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading gigs. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Gigs</h1>
        <p className="text-gray-600">Find the perfect freelancer for your project</p>
      </div>

      {/* Search and Filters */}
      <div className="card p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search for gigs..."
                className="input pl-10"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline flex items-center"
            >
              <FaFilter className="w-4 h-4 mr-2" />
              Filters
            </button>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  defaultValue={category}
                  className="input"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={minPrice}
                  placeholder="0"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={maxPrice}
                  placeholder="1000"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  name="sort"
                  defaultValue={sort}
                  className="input"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(search || category || minPrice || maxPrice) && (
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              {search && (
                <span className="badge badge-info">
                  Search: {search}
                  <button
                    onClick={() => updateFilters({ search: '' })}
                    className="ml-1 text-xs"
                  >
                    ×
                  </button>
                </span>
              )}
              {category && (
                <span className="badge badge-info">
                  Category: {categories.find(c => c.value === category)?.label}
                  <button
                    onClick={() => updateFilters({ category: '' })}
                    className="ml-1 text-xs"
                  >
                    ×
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="badge badge-info">
                  Price: ${minPrice || 0} - ${maxPrice || '∞'}
                  <button
                    onClick={() => updateFilters({ minPrice: '', maxPrice: '' })}
                    className="ml-1 text-xs"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear all
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Results */}
      <div className="mb-6">
        <p className="text-gray-600">
          {isLoading ? 'Loading...' : `Showing ${gigs.length} of ${pagination.totalGigs || 0} gigs`}
        </p>
      </div>

      {/* Gigs Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : gigs.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-600 mb-4">No gigs found matching your criteria.</p>
          <button
            onClick={clearFilters}
            className="btn btn-primary"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig) => (
            <Link
              key={gig._id}
              to={`/gigs/${gig._id}`}
              className="card p-6 hover:shadow-lg transition-shadow"
            >
              {/* Gig Image Placeholder */}
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-400 text-2xl">📷</span>
              </div>

              {/* Gig Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                    {gig.title}
                  </h3>
                  <span className="text-lg font-bold text-primary-600 ml-2">
                    ${gig.price}
                  </span>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2">
                  {gig.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                    <span>{gig.rating.average || 0}</span>
                    <span className="ml-1">({gig.rating.count || 0})</span>
                  </div>
                  <div className="flex items-center">
                    <FaEye className="w-4 h-4 mr-1" />
                    <span>{gig.views}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>by {gig.freelancer.username}</span>
                  <span>{gig.deliveryTime} days</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => updateFilters({ page: page - 1 })}
              disabled={!pagination.hasPrev}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {[...Array(pagination.totalPages)].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => updateFilters({ page: pageNum })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    pageNum === page
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => updateFilters({ page: page + 1 })}
              disabled={!pagination.hasNext}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default GigList; 