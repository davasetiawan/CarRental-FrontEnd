'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Car, User, Mail, Shield, Crown, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await api.get('/auth/profile');
        console.log('Profile data:', response.data);
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#D4AF37]/10 rounded-2xl mb-4">
              <User className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-2">Manage your account information</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-6 py-4">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">Premium Member</span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <User className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-xs text-gray-400">Full Name</p>
                    <p className="font-medium text-gray-800">{user.name || user.email?.split('@')[0]}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Mail className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-xs text-gray-400">Email Address</p>
                    <p className="font-medium text-gray-800">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Shield className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-xs text-gray-400">Account Type</p>
                    <p className="font-medium text-gray-800">
                      {user.role === 'ADMIN' ? 'Administrator' : 'Member'}
                    </p>
                  </div>
                </div>
                
                
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            <Link href="/dashboard" className="flex-1">
              <button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-semibold py-3 rounded-xl hover:shadow-lg transition">
                Back to Dashboard
              </button>
            </Link>
            <button 
              onClick={logout}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}