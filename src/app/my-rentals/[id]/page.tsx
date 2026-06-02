'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { CountdownTimer } from '@/components/CountdownTimer';
import { 
  Car, Calendar, CreditCard, AlertCircle, CheckCircle, 
  XCircle, Clock, ArrowLeft, Trash2, User, Phone, Mail
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToatsContext';

interface RentalDetail {
  id: number;
  userId: number;
  carId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  car: {
    id: number;
    name: string;
    plateNumber: string;
    pricePerDay: number;
    status: string;
  };
  payment: {
    id: number;
    rentalId: number;
    amount: number;
    proofUrl: string | null;
    status: string;
  };
}

export default function RentalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [rental, setRental] = useState<RentalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchRentalDetail = async () => {
      try {
        const response = await api.get(`/rentals/${params.id}`);
        console.log('Rental detail:', response.data);
        setRental(response.data);
      } catch (error) {
        console.error('Error fetching rental detail:', error);
        showToast('Failed to load rental details', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user && params.id) {
      fetchRentalDetail();
    }
  }, [user, params.id, showToast]);

  const handleCancelRental = async () => {
    if (!confirm('Are you sure you want to cancel this rental?')) return;
    
    setCancelling(true);
    try {
      const response = await api.patch(`/rentals/${params.id}/cancel`);
      console.log('Cancel response:', response.data);
      showToast('Rental cancelled successfully!', 'success');
      
      // Refresh data
      const updatedResponse = await api.get(`/rentals/${params.id}`);
      setRental(updatedResponse.data);
    } catch (error: any) {
      console.error('Error cancelling rental:', error);
      showToast(error.response?.data?.message || 'Failed to cancel rental', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active' || statusLower === 'ongoing') {
      return { text: 'Active', bg: 'bg-green-100 text-green-700' };
    } else if (statusLower === 'pending') {
      return { text: 'Pending', bg: 'bg-yellow-100 text-yellow-700' };
    } else if (statusLower === 'completed') {
      return { text: 'Completed', bg: 'bg-blue-100 text-blue-700' };
    } else if (statusLower === 'cancelled') {
      return { text: 'Cancelled', bg: 'bg-red-100 text-red-700' };
    }
    return { text: status, bg: 'bg-gray-100 text-gray-700' };
  };

  const canCancel = () => {
    if (!rental) return false;
    const cancelableStatuses = ['pending'];
    return cancelableStatuses.includes(rental.status.toLowerCase());
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading rental details...</p>
        </div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
        <div className="container mx-auto px-4 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Rental Not Found</h2>
          <Link href="/my-rentals" className="text-[#D4AF37] hover:underline mt-4 inline-block">
            Back to My Rentals
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(rental.status);
  const days = Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const showCancel = canCancel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/my-rentals" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#D4AF37] transition mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to My Rentals
          </Link>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-6 py-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <p className="text-white/80 text-sm">Rental ID: #{rental.id}</p>
                  <h1 className="text-2xl font-bold text-white">{rental.car.name}</h1>
                  <p className="text-white/80 text-sm">{rental.car.plateNumber}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg}`}>
                  {rental.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              {/* Rental Period */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  Rental Period
                </h2>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Start Date</p>
                      <p className="font-medium text-gray-800">{formatDate(rental.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">End Date</p>
                      <p className="font-medium text-gray-800">{formatDate(rental.endDate)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Duration: <span className="font-semibold">{days} day{days !== 1 ? 's' : ''}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Details */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                  Price Details
                </h2>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per day</span>
                      <span className="font-medium">Rp{rental.car.pricePerDay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number of days</span>
                      <span className="font-medium">{days} day{days !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-800">Total Price</span>
                        <span className="text-2xl font-bold text-[#D4AF37]">
                          Rp{rental.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Countdown for Active Rental */}
              {(rental.status.toLowerCase() === 'active' || rental.status.toLowerCase() === 'ongoing') && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#D4AF37]" />
                    Time Remaining
                  </h2>
                  <CountdownTimer endDate={rental.endDate} />
                </div>
              )}

              {/* Cancel Button */}
              {showCancel && (
                <div className="mt-6">
                  <button
                    onClick={handleCancelRental}
                    disabled={cancelling}
                    className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {cancelling ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                    Cancel Rental
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Cancellation only available for pending rentals
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}