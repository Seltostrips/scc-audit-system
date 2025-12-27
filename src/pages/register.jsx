// src/pages/Register.jsx
import React, { useState, useEffect } from '23/react';
import { useNavigate, useLocation } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    sccId: '',
    location: '',
    department: '',
    pin: '',
    pinConfirm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const roleParam = searchParams.get('role');
  const validRoles = ['audit-clerk', 'client-staff', 'admin'];
  const role = validRoles.includes(roleParam) ? roleParam : 'client-staff';

  const roleLabels = {
    'audit-clerk': 'Audit Clerk',
    'client-staff': 'Client Staff',
    'admin': 'Admin',
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { fullName, email, sccId, location, department, pin, pinConfirm } = formData;

    if (!fullName || !email || !sccId || !location || !department || !pin || !pinConfirm) {
      setError('All fields are required.');
      return;
    }

    if (pin !== pinConfirm) {
      setError('PINs do not match.');
      return;
    }

    if (pin.length !== 4 || isNaN(pin)) {
      setError('PIN must be a 4-digit number.');
      return;
    }

    // Simulate API call — in real app, send to /api/register
    const registrationData = {
      fullName,
      email,
      sccId: sccId.trim().toUpperCase(),
      role,
      pin, // In real app: send hashed PIN
      location: location.trim(),
      department: department.trim(),
      status: 'pending', // Must be approved by admin
      createdAt: new Date().toISOString(),
    };

    // Broadcast registration to parent (App.jsx will manage state)
    const event = new CustomEvent('userRegistered', { detail: registrationData });
    window.dispatchEvent(event);

    setSuccess('Registration submitted! Please wait for admin approval.');
    setTimeout(() => navigate('/'), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
          Register as {roleLabels[role]}
        </h2>
        {role === 'admin' && (
          <p className="mt-2 text-center text-sm text-red-600 font-medium">
            ⚠️ Admin registration is for demo only
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
          {success && <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{success}</div>}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SCC ID (e.g., AC1001, CS2001)</label>
              <input
                name="sccId"
                value={formData.sccId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Unique ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">PIN (4 digits)</label>
              <input
                name="pin"
                type="password"
                value={formData.pin}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm PIN</label>
              <input
                name="pinConfirm"
                type="password"
                value={formData.pinConfirm}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Submit for Approval
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
