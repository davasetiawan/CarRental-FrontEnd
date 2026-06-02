'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { 
  Car, Calendar, User, DollarSign, Search, 
  ChevronLeft, ChevronRight, Crown, 
  Eye, CheckCircle, XCircle, Clock, AlertCircle,
  CreditCard, RefreshCw, CheckSquare
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToatsContext';

interface Rental {
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

export default function AllRentalsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!isLoading && (!user || user.role?.toLowerCase() !== 'admin')) {
      showToast('Access denied. Admin only.', 'error');
      router.push('/dashboard');
    }
  }, [isLoading, user, router, showToast]);

  useEffect(() => {
    if (user?.role?.toLowerCase() === 'admin') {
      fetchRentals();
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...rentals];
    
    if (searchTerm) {
      filtered = filtered.filter(rental => 
        rental.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.car?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.car?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rental => 
        rental.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    setFilteredRentals(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, rentals]);

  const fetchRentals = async () => {
    try {
      const response = await api.get('/rentals');
      setRentals(response.data);
      setFilteredRentals(response.data);
    } catch (error) {
      console.error('Error fetching rentals:', error);
      showToast('Failed to load rentals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRental = async (rentalId: number) => {
    if (!confirm('Mark this rental as completed? The car will become available again.')) return;
    
    setCompletingId(rentalId);
    try {
      const response = await api.patch(`/rentals/${rentalId}/complete`);
      console.log('Complete response:', response.data);
      showToast('Rental completed successfully! Car is now available.', 'success');
      fetchRentals();
    } catch (error: any) {
      console.error('Error completing rental:', error);
      showToast(error.response?.data?.message || 'Failed to complete rental', 'error');
    } finally {
      setCompletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active' || s === 'ongoing') {
      return { text: 'Active', bg: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3 mr-1" /> };
    } else if (s === 'pending') {
      return { text: 'Pending', bg: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3 mr-1" /> };
    } else if (s === 'completed') {
      return { text: 'Completed', bg: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-3 h-3 mr-1" /> };
    } else if (s === 'cancelled') {
      return { text: 'Cancelled', bg: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3 mr-1" /> };
    }
    return { text: status, bg: 'bg-gray-100 text-gray-700', icon: <AlertCircle className="w-3 h-3 mr-1" /> };
  };

  const getPaymentStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'verified') return { text: 'Paid', bg: 'bg-green-100 text-green-700' };
    if (s === 'pending') return { text: 'Pending', bg: 'bg-yellow-100 text-yellow-700' };
    if (s === 'cancelled') return { text: 'Cancelled', bg: 'bg-red-100 text-red-700' };
    return { text: status, bg: 'bg-gray-100 text-gray-700' };
  };

  const canComplete = (status: string) => {
    const completableStatuses = ['active', 'ongoing'];
    return completableStatuses.includes(status.toLowerCase());
  };

  const totalPages = Math.ceil(filteredRentals.length / itemsPerPage);
  const paginatedRentals = filteredRentals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalRentals = rentals.length;
  const activeRentals = rentals.filter(r => r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'ongoing').length;
  const pendingRentals = rentals.filter(r => r.status?.toLowerCase() === 'pending').length;
  const completedRentals = rentals.filter(r => r.status?.toLowerCase() === 'completed').length;
  const cancelledRentals = rentals.filter(r => r.status?.toLowerCase() === 'cancelled').length;

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading rental data...</p>
        </div>
      </div>
    );
  }

  if (user?.role?.toLowerCase() !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white overflow-hidden">
        <div className="container mx-auto px-6 py-10 relative">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-semibold">ADMIN PANEL</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">All Rentals</h1>
            <p className="text-white/90">Manage and monitor all rental transactions</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-6 pt-8 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <span className="text-xl font-bold text-gray-800">{totalRentals}</span>
            </div>
            <p className="text-xs text-gray-500">Total Rentals</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xl font-bold text-gray-800">{activeRentals}</span>
            </div>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-xl font-bold text-gray-800">{pendingRentals}</span>
            </div>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xl font-bold text-gray-800">{completedRentals}</span>
            </div>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-xl font-bold text-gray-800">{cancelledRentals}</span>
            </div>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="container mx-auto px-6 pb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user name, email, car name, or plate number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pl-12 text-gray-800 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button onClick={fetchRentals} className="px-4 py-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl hover:bg-[#D4AF37]/20 transition flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Rentals Table */}
      <div className="container mx-auto px-6 pb-12">
        {paginatedRentals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No rentals found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-gray-500 text-sm">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Car</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRentals.map((rental) => {
                      const statusBadge = getStatusBadge(rental.status);
                      const paymentBadge = getPaymentStatusBadge(rental.payment?.status || 'pending');
                      const days = Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24));
                      const showComplete = canComplete(rental.status);
                      
                      return (
                        <tr key={rental.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 px-4 text-sm font-medium text-gray-800">#{rental.id}</td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-800">{rental.user?.name}</p>
                              <p className="text-xs text-gray-400">{rental.user?.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-800">{rental.car?.name}</p>
                              <p className="text-xs text-gray-400">{rental.car?.plateNumber}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-xs text-gray-400">{formatDate(rental.startDate)}</p>
                              <p className="text-xs text-gray-400">→ {formatDate(rental.endDate)}</p>
                              <p className="text-xs text-gray-400">{days} days</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#D4AF37]">Rp{rental.totalPrice.toLocaleString()}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.bg}`}>
                              {statusBadge.icon}
                              {statusBadge.text}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${paymentBadge.bg}`}>
                              <CreditCard className="w-3 h-3 mr-1" />
                              {paymentBadge.text}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setSelectedRental(rental); setIsDetailModalOpen(true); }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="View Details"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              {showComplete && (
                                <button
                                  onClick={() => handleCompleteRental(rental.id)}
                                  disabled={completingId === rental.id}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                                  title="Complete Rental"
                                >
                                  {completingId === rental.id ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                                  ) : (
                                    <CheckSquare className="w-5 h-5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                         </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 hover:border-[#D4AF37] disabled:opacity-50 transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg font-medium text-sm transition ${currentPage === page ? 'bg-[#D4AF37] text-white' : 'border border-gray-200 hover:border-[#D4AF37] text-gray-600'}`}>
                    {page}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 hover:border-[#D4AF37] disabled:opacity-50 transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedRental && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-6 py-4 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white">Rental Details</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-white hover:text-gray-200 transition">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" /> Rental Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Rental ID:</span> <span className="font-medium">#{selectedRental.id}</span></p>
                    <p><span className="text-gray-500">Created:</span> {formatDateTime(selectedRental.createdAt)}</p>
                    <p><span className="text-gray-500">Start Date:</span> {formatDate(selectedRental.startDate)}</p>
                    <p><span className="text-gray-500">End Date:</span> {formatDate(selectedRental.endDate)}</p>
                    <p><span className="text-gray-500">Total Price:</span> <span className="font-semibold text-[#D4AF37]">Rp{selectedRental.totalPrice.toLocaleString()}</span></p>
                    <p><span className="text-gray-500">Status:</span> <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getStatusBadge(selectedRental.status).bg}`}>{selectedRental.status}</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#D4AF37]" /> Car Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Car Name:</span> {selectedRental.car?.name}</p>
                    <p><span className="text-gray-500">Plate Number:</span> {selectedRental.car?.plateNumber}</p>
                    <p><span className="text-gray-500">Price/Day:</span> Rp{selectedRental.car?.pricePerDay?.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D4AF37]" /> User Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Name:</span> {selectedRental.user?.name}</p>
                    <p><span className="text-gray-500">Email:</span> {selectedRental.user?.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#D4AF37]" /> Payment Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Payment ID:</span> #{selectedRental.payment?.id}</p>
                    <p><span className="text-gray-500">Amount:</span> Rp{selectedRental.payment?.amount?.toLocaleString()}</p>
                    <p><span className="text-gray-500">Status:</span> <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getPaymentStatusBadge(selectedRental.payment?.status || 'pending').bg}`}>{selectedRental.payment?.status || 'PENDING'}</span></p>
                    {selectedRental.payment?.proofUrl && (
                      <p><span className="text-gray-500">Proof:</span> <a href={selectedRental.payment.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Proof</a></p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                {canComplete(selectedRental.status) && (
                  <button
                    onClick={() => { handleCompleteRental(selectedRental.id); setIsDetailModalOpen(false); }}
                    disabled={completingId === selectedRental.id}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                  >
                    <CheckSquare className="w-4 h-4" /> Complete Rental
                  </button>
                )}
                <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}