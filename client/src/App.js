import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GigList from './pages/GigList.js';
import GigDetail from './pages/GigDetail.js';
import CreateGig from './pages/CreateGig.js';
import EditGig from './pages/EditGig.js';
import Dashboard from './pages/Dashboard.js';
import Profile from './pages/Profile';
import OrderDetail from './pages/OrderDetail';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/gigs" element={<GigList />} />
            <Route path="/gigs/:id" element={<GigDetail />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/gigs/create" element={
              <PrivateRoute allowedRoles={['freelancer']}>
                <CreateGig />
              </PrivateRoute>
            } />
            <Route path="/gigs/:id/edit" element={
              <PrivateRoute allowedRoles={['freelancer']}>
                <EditGig />
              </PrivateRoute>
            } />
            <Route path="/orders/:id" element={
              <PrivateRoute>
                <OrderDetail />
              </PrivateRoute>
            } />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App; 