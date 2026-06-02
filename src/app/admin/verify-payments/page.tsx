'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { 
  Car, Calendar, CreditCard, CheckCircle, XCircle, 
  Clock, AlertCircle, Eye, Crown, Search, DollarSign,
  User, FileImage, RefreshCw, Ban
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
    user: {
      id: number;
      name: string;
      email: string;
    };
    car: {
      id: number;
      name: string;
      plateNumber: string;
      pricePerDay: number;
    };
  };
}

export default function VerifyPaymentsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Cek admin access
  useEffect(() => {
    if (!isLoading && (!user || user.role?.toLowerCase() !== 'admin')) {
      showToast('Access denied. Admin only.', 'error');
      router.push('/dashboard');
    }
  }, [isLoading, user, router, showToast]);

  // Fetch all payments (admin only)
  useEffect(() => {
    if (user?.role?.toLowerCase() === 'admin') {
      fetchAllPayments();
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...payments];
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.rental?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.rental?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.rental?.car?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.rental?.car?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPayments(filtered);
  }, [searchTerm, payments]);

  const fetchAllPayments = async () => {
    try {
      let response;
      try {
        response = await api.get('/payments');
      } catch {
        const rentalsResponse = await api.get('/rentals');
        const allPayments = [];
        for (const rental of rentalsResponse.data) {
          if (rental.payment) {
            allPayments.push({
              ...rental.payment,
              rental: rental
            });
          }
        }
        response = { data: allPayments };
      }
      
      console.log('All payments:', response.data);
      
      // Filter hanya yang:
      // 1. status PENDING
      // 2. memiliki proofUrl (sudah upload bukti)
      const pendingWithProof = response.data.filter((p: Payment) => 
        p.status?.toLowerCase() === 'pending' && p.proofUrl !== null
      );
      setPayments(pendingWithProof);
      setFilteredPayments(pendingWithProof);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (paymentId: number, rentalId: number) => {
    setProcessingId(paymentId);
    setActionType('confirm');
    try {
      const response = await api.patch(`/payments/${paymentId}/confirm`);
      console.log('Confirm response:', response.data);
      showToast('Payment confirmed successfully!', 'success');
      fetchAllPayments();
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      showToast(error.response?.data?.message || 'Failed to confirm payment', 'error');
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  const handleRejectPayment = async (paymentId: number, rentalId: number, reason: string) => {
    setProcessingId(paymentId);
    setActionType('reject');
    try {
      const response = await api.patch(`/payments/${paymentId}/reject`, { reason });
      console.log('Reject response:', response.data);
      showToast('Payment rejected successfully!', 'info');
      setShowRejectModal(false);
      setRejectReason('');
      fetchAllPayments();
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      showToast(error.response?.data?.message || 'Failed to reject payment', 'error');
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  const openRejectModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const openPaymentDetail = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
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

  const formatCurrency = (amount: number) => {
    return `Rp${amount.toLocaleString()}`;
  };

  const totalPending = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (user?.role?.toLowerCase() !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-black/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 py-10 relative">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-semibold">ADMIN PANEL</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Verify Payments</h1>
            <p className="text-white/90">Review and confirm customer payment proofs</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-6 pt-8 pb-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{totalPending}</span>
            </div>
            <h3 className="font-semibold text-gray-800">Pending Payments</h3>
            <p className="text-gray-500 text-sm">With proof uploaded</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{formatCurrency(totalAmount)}</span>
            </div>
            <h3 className="font-semibold text-gray-800">Total Pending Amount</h3>
            <p className="text-gray-500 text-sm">To be confirmed</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-6 pb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user name, email, or car..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pl-12 text-gray-800 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
          />
        </div>
      </div>

      {/* Payments List */}
      <div className="container mx-auto px-6 pb-12">
        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <CheckCircle className="w-20 h-20 text-green-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Pending Payments</h3>
            <p className="text-gray-500">All payments with proof have been verified</p>
            <button
              onClick={fetchAllPayments}
              className="mt-4 text-[#D4AF37] hover:underline flex items-center gap-1 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => {
              const days = Math.ceil((new Date(payment.rental?.endDate).getTime() - new Date(payment.rental?.startDate).getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={payment.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition">
                  {/* Payment Header */}
                  <div className="bg-gradient-to-r from-yellow-50 to-white px-5 py-3 border-b border-gray-100 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">Payment #{payment.id}</span>
                        <p className="text-xs text-gray-400">{formatDate(payment.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <Clock className="w-3 h-3" />
                        PENDING
                      </span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="p-5">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400">Customer</p>
                          <p className="font-medium text-gray-800">{payment.rental?.user?.name || '-'}</p>
                          <p className="text-xs text-gray-400">{payment.rental?.user?.email || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Car className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400">Car</p>
                          <p className="font-medium text-gray-800">{payment.rental?.car?.name || '-'}</p>
                          <p className="text-xs text-gray-400">{payment.rental?.car?.plateNumber || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400">Rental Period</p>
                          <p className="text-sm text-gray-800">
                            {payment.rental?.startDate ? formatDate(payment.rental.startDate) : '-'} - {payment.rental?.endDate ? formatDate(payment.rental.endDate) : '-'}
                          </p>
                          <p className="text-xs text-gray-400">{days} day{days !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400">Amount</p>
                          <p className="text-2xl font-bold text-[#D4AF37]">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {payment.rental?.car?.pricePerDay ? formatCurrency(payment.rental.car.pricePerDay) : '-'} × {days} days
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Proof - Pasti ada karena sudah difilter */}
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <FileImage className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700">Payment proof uploaded</span>
                        </div>
                        <a 
                          href={payment.proofUrl || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Proof
                        </a>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-3">
                      <button
                        onClick={() => openPaymentDetail(payment)}
                        className="px-4 py-2 text-gray-600 hover:text-[#D4AF37] border border-gray-200 rounded-lg hover:border-[#D4AF37] transition flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </button>
                      <button
                        onClick={() => openRejectModal(payment)}
                        disabled={processingId === payment.id}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1 disabled:opacity-50"
                      >
                        {processingId === payment.id && actionType === 'reject' ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Ban className="w-4 h-4" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={() => handleConfirmPayment(payment.id, payment.rentalId)}
                        disabled={processingId === payment.id}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition flex items-center gap-1 disabled:opacity-50"
                      >
                        {processingId === payment.id && actionType === 'confirm' ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Detail Modal */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-6 py-4 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white">Payment Details</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Payment Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Payment ID</p>
                      <p className="font-semibold text-gray-800">#{selectedPayment.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="text-gray-800">{formatDate(selectedPayment.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(selectedPayment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <Clock className="w-3 h-3" />
                        PENDING
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Name</p>
                      <p className="font-medium text-gray-800">{selectedPayment.rental?.user?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="text-gray-800">{selectedPayment.rental?.user?.email || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Car Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#D4AF37]" />
                    Car Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Car Name</p>
                      <p className="font-medium text-gray-800">{selectedPayment.rental?.car?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Plate Number</p>
                      <p className="text-gray-800">{selectedPayment.rental?.car?.plateNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Price per Day</p>
                      <p className="text-gray-800">{formatCurrency(selectedPayment.rental?.car?.pricePerDay || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Rental Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" />
                    Rental Information
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Rental ID</p>
                        <p className="font-medium text-gray-800">#{selectedPayment.rentalId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Status</p>
                        <p className="text-gray-800">{selectedPayment.rental?.status || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Rental Period</p>
                      <p className="text-gray-800">
                        {selectedPayment.rental?.startDate ? formatDate(selectedPayment.rental.startDate) : '-'} - {selectedPayment.rental?.endDate ? formatDate(selectedPayment.rental.endDate) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Price</p>
                      <p className="font-bold text-[#D4AF37]">{formatCurrency(selectedPayment.rental?.totalPrice || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Proof */}
                {selectedPayment.proofUrl && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-[#D4AF37]" />
                      Payment Proof
                    </h3>
                    <div className="flex justify-center">
                      <img 
                        src={selectedPayment.proofUrl} 
                        alt="Payment proof" 
                        className="rounded-xl border border-gray-200 max-h-64 w-auto object-contain"
                      />
                    </div>
                    <a 
                      href={selectedPayment.proofUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm mt-2"
                    >
                      <Eye className="w-4 h-4" />
                      Open in new tab
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium text-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(true);
                  setIsModalOpen(false);
                }}
                className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium flex items-center gap-2 shadow-md"
              >
                <Ban className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => {
                  handleConfirmPayment(selectedPayment.id, selectedPayment.rentalId);
                  setIsModalOpen(false);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition font-medium flex items-center gap-2 shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Reject Payment</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to reject payment for <span className="font-semibold">{selectedPayment.rental?.car?.name}</span>?
              </p>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2 text-sm">Reason (Optional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                  placeholder="Enter reason for rejection..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRejectPayment(selectedPayment.id, selectedPayment.rentalId, rejectReason)}
                  disabled={processingId === selectedPayment.id}
                  className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition disabled:opacity-50"
                >
                  {processingId === selectedPayment.id ? (
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Reject Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}