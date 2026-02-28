'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sprout, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    state: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-agri-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-agri-600 rounded-2xl flex items-center justify-center shadow-lg shadow-agri-600/20">
          <Sprout className="h-8 w-8 text-white" />
        </div>
        <h2 className="mt-6 text-3xl font-black text-agri-900 tracking-tight">Initialize Account</h2>
        <p className="mt-2 text-sm text-gray-500 font-medium">
          Already deployed?{' '}
          <Link href="/login" className="text-agri-600 hover:text-agri-800 transition">
            Access Dashboard
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-gray-200/50 sm:rounded-3xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-bold text-agri-900">Full Name</label>
              <div className="mt-2">
                <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-agri-400 focus:border-transparent sm:text-base transition-all bg-gray-50 hover:bg-white"
                  placeholder="e.g. Ram Singh"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-agri-900">Phone Number</label>
              <div className="mt-2">
                <input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-agri-400 focus:border-transparent sm:text-base transition-all bg-gray-50 hover:bg-white"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-bold text-agri-900">State Region</label>
              <div className="mt-2">
                <select id="state" name="state" value={formData.state} onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-agri-400 focus:border-transparent sm:text-base transition-all bg-gray-50 hover:bg-white text-gray-700"
                >
                  <option value="">Select your operating state</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Maharashtra">Maharashtra</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-agri-900">Security Key (Password)</label>
              <div className="mt-2">
                <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-agri-400 focus:border-transparent sm:text-base transition-all bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-agri-900/20 text-base font-bold text-white bg-agri-900 hover:bg-agri-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-agri-900 transition-all disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Register Deployment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}