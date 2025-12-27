// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [role, setRole] = useState('');
  const [sccId, setSccId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!role || !sccId || !pin) {
      setError('All fields are required.');
      return;
    }

    if (pin.length !== 4 || isNaN(pin)) {
      setError('PIN must be a 4-digit number.');
      return;
    }

    onLogin({ role, sccId, pin });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          SCC Audit Management System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Login to access your dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Select Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                required
              >
                <option value="">Choose...</option>
                <option value="audit-clerk">Audit Clerk</option>
                <option value="client-staff">Client Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="sccId" className="block text-sm font-medium text-gray-700">
                SCC ID
              </label>
              <input
                id="sccId"
                name="sccId"
                type="text"
                value={sccId}
                onChange={(e) => setSccId(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your SCC ID"
                required
              />
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                PIN
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="••••"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </button>
            </div>
          </form>

          {/* Registration links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">New user? Register below:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
              {['audit-clerk', 'client-staff', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => navigate(`/register?role=${r}`)}
                  className="py-2 px-3 text-xs font-medium rounded border border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  Register as {r.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
