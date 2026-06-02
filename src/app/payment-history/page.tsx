'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

import { 
  CreditCard, CheckCircle, XCircle, Clock, AlertCircle,
  Calendar, Car, Eye, ArrowLeft, Download
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToatsContext';

interface Payment {
  id: number;
  rentalId: number;
  amount: number;
  proofUrl: string | null;
  status: string;
  createdAt: string;
  rental: {
    id: number;
    userId: number;
    carId: number;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: string;
    createdAt: string;
    car: {
      id: number;
      name: string;
      plateNumber: string;
      pricePerDay: number;
      status: string;
    };
  };
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get('/payments/history');
        console.log('Payment history:', response.data);
        setPayments(response.data);
      } catch (error) {
        console.error('Error fetching payment history:', error);
        showToast('Failed to load payment history', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPayments();
    } else {
      setLoading(false);
    }
  }, [user, showToast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid' || statusLower === 'verified') {
      return {
        text: 'Paid',
        bg: 'bg-green-100 text-green-700',
        icon: <CheckCircle className="w-4 h-4" />
      };
    } else if (statusLower === 'pending') {
      return {
        text: 'Pending',
        bg: 'bg-yellow-100 text-yellow-700',
        icon: <Clock className="w-4 h-4" />
      };
    } else if (statusLower === 'cancelled') {
      return {
        text: 'Cancelled',
        bg: 'bg-red-100 text-red-700',
        icon: <XCircle className="w-4 h-4" />
      };
    }
    return {
      text: status,
      bg: 'bg-gray-100 text-gray-700',
      icon: <AlertCircle className="w-4 h-4" />
    };
  };

  const getRentalStatusBadge = (status: string) => {
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Stats
  const totalPayments = payments.length;
  const totalPaid = payments
    .filter(p => p.status?.toLowerCase() === 'paid' || p.status?.toLowerCase() === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status?.toLowerCase() === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4AF37]/10 rounded-2xl mb-3">
              <CreditCard className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-500 mt-1">Track all your payment transactions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{totalPayments}</span>
              </div>
              <h3 className="font-semibold text-gray-800">Total Transactions</h3>
              <p className="text-gray-500 text-sm">All time payments</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-gray-800">
                  Rp{(totalPaid / 1000000).toFixed(1)}M
                </span>
              </div>
              <h3 className="font-semibold text-gray-800">Total Paid</h3>
              <p className="text-gray-500 text-sm">Successful payments</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{pendingPayments}</span>
              </div>
              <h3 className="font-semibold text-gray-800">Pending</h3>
              <p className="text-gray-500 text-sm">Awaiting confirmation</p>
            </div>
          </div>

          {/* Payments List */}
          {payments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No payment history</h3>
              <p className="text-gray-500 mb-4">You haven't made any payments yet</p>
              <Link href="/cars">
                <button className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-semibold px-6 py-2 rounded-full hover:shadow-lg transition">
                  Browse Cars
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const paymentStatus = getPaymentStatusBadge(payment.status);
                const rentalStatus = getRentalStatusBadge(payment.rental?.status || 'pending');
                
                return (
                  <div key={payment.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition">
                    {/* Payment Header */}
                    <div className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent px-5 py-3 border-b border-gray-100 flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800">Payment #{payment.id}</span>
                          <p className="text-xs text-gray-400">{formatDate(payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${paymentStatus.bg}`}>
                          {paymentStatus.icon}
                          {paymentStatus.text}
                        </span>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="p-5">
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <Car className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-400">Car</p>
                            <p className="font-medium text-gray-800">{payment.rental?.car?.name || '-'}</p>
                            <p className="text-xs text-gray-400">{payment.rental?.car?.plateNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-400">Rental Period</p>
                            <p className="text-sm text-gray-800">
                              {payment.rental?.startDate ? formatDate(payment.rental.startDate).split(',')[0] : '-'} - {payment.rental?.endDate ? formatDate(payment.rental.endDate).split(',')[0] : '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-400">Amount</p>
                          <p className="text-2xl font-bold text-[#D4AF37]">
                            Rp{payment.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                         
                          {payment.proofUrl && (
                            <a href={payment.proofUrl} target="_blank" rel="noopener noreferrer">
                              <button className="text-blue-500 hover:text-blue-600 transition text-sm flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                Proof
                              </button>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Rental Status */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Rental Status</span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${rentalStatus.bg}`}>
                            {rentalStatus.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <Link href="/dashboard">
              <button className="text-gray-500 hover:text-[#D4AF37] transition inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}