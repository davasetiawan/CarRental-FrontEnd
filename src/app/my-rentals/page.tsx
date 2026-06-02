'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Car, Calendar, CreditCard, AlertCircle, CheckCircle, XCircle, Clock, ArrowRight, Eye, Trash2, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToatsContext';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface Rental {
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
  payment: {
    id: number;
    rentalId: number;
    amount: number;
    proofUrl: string | null;
    status: string;
  };
}

// Styles untuk PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#D4AF37',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    padding: 8,
    marginBottom: 10,
    color: '#D4AF37',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 11,
    color: '#666666',
    width: '40%',
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    width: '60%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 20,
  },
  thankYou: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginTop: 20,
  },
});

// Komponen PDF Invoice
const RentalInvoice = ({ rental }: { rental: Rental }) => {
  const days = Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const invoiceNumber = `INV-${rental.id}-${new Date(rental.createdAt).getFullYear()}`;
  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CARRENTAL</Text>
          <Text style={styles.subtitle}>Luxury Car Rental Invoice</Text>
          <Text style={styles.subtitle}>Invoice #: {invoiceNumber}</Text>
          <Text style={styles.subtitle}>Date: {date}</Text>
        </View>

        {/* Rental Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RENTAL DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Rental ID:</Text>
            <Text style={styles.value}>#{rental.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Car Name:</Text>
            <Text style={styles.value}>{rental.car.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Plate Number:</Text>
            <Text style={styles.value}>{rental.car.plateNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rental Period:</Text>
            <Text style={styles.value}>
              {new Date(rental.startDate).toLocaleDateString('id-ID')} - {new Date(rental.endDate).toLocaleDateString('id-ID')}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duration:</Text>
            <Text style={styles.value}>{days} day{days !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment ID:</Text>
            <Text style={styles.value}>#{rental.payment?.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Status:</Text>
            <Text style={styles.value}>{rental.payment?.status?.toUpperCase() || 'PAID'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Price per Day:</Text>
            <Text style={styles.value}>Rp{rental.car.pricePerDay.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Number of Days:</Text>
            <Text style={styles.value}>{days}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>Rp{rental.totalPrice.toLocaleString()}</Text>
          </View>
        </View>

        {/* Thank You */}
        <Text style={styles.thankYou}>Thank you for choosing CarRental!</Text>
        <Text style={styles.footer}>
          CarRental Luxury • Jl. Danau Ranau Raya G6 B5 • support@carrental.com • +62857-3157-7074
        </Text>
      </Page>
    </Document>
  );
};

export default function MyRentalsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const response = await api.get('/rentals/my');
        setRentals(response.data);
      } catch (error) {
        console.error('Error fetching rentals:', error);
        showToast('Failed to load rental history', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRentals();
    } else {
      setLoading(false);
    }
  }, [user, showToast, refreshKey]);

  const handleCancelRental = async (rentalId: number) => {
    if (!confirm('Are you sure you want to cancel this rental?')) return;
    setCancellingId(rentalId);
    try {
      await api.patch(`/rentals/${rentalId}/cancel`);
      showToast('Rental cancelled successfully!', 'success');
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to cancel rental', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleUploadPayment = (rental: Rental) => {
    const params = new URLSearchParams({
      carName: rental.car.name,
      carPlate: rental.car.plateNumber,
      startDate: rental.startDate,
      endDate: rental.endDate,
      totalPrice: rental.totalPrice.toString(),
      pricePerDay: rental.car.pricePerDay.toString(),
    });
    router.push(`/payment/${rental.id}?${params.toString()}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const canCancel = (status: string) => status.toLowerCase() === 'pending';
  const isPendingPayment = (rentalStatus: string, paymentStatus: string) => 
    rentalStatus.toLowerCase() === 'pending' && paymentStatus.toLowerCase() === 'pending';
  const isPaymentVerified = (paymentStatus: string) => 
    ['paid', 'verified'].includes(paymentStatus.toLowerCase());
  const canDownloadInvoice = (rentalStatus: string, paymentStatus: string) => {
    // Bisa download jika rental sudah completed atau payment sudah verified
    return rentalStatus.toLowerCase() === 'completed' || 
           ['paid', 'verified'].includes(paymentStatus.toLowerCase());
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active' || s === 'ongoing') return { text: 'Active', bg: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> };
    if (s === 'pending') return { text: 'Pending', bg: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> };
    if (s === 'completed') return { text: 'Completed', bg: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-3 h-3" /> };
    if (s === 'cancelled') return { text: 'Cancelled', bg: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> };
    return { text: status, bg: 'bg-gray-100 text-gray-700', icon: <AlertCircle className="w-3 h-3" /> };
  };

  const getPaymentStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'verified') return { text: 'Verified', bg: 'bg-green-100 text-green-700' };
    if (s === 'pending') return { text: 'Pending', bg: 'bg-yellow-100 text-yellow-700' };
    if (s === 'cancelled') return { text: 'Cancelled', bg: 'bg-red-100 text-red-700' };
    return { text: status, bg: 'bg-gray-100 text-gray-700' };
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
        <p className="text-gray-500">Loading your rentals...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4AF37]/10 rounded-2xl mb-3">
              <Calendar className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">My Rentals</h1>
            <p className="text-gray-500 mt-1">View your booking history and rental status</p>
          </div>

          {rentals.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No rentals yet</h3>
              <p className="text-gray-500 mb-4">You haven't made any rental bookings</p>
              <Link href="/cars">
                <button className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-semibold px-6 py-2 rounded-full hover:shadow-lg transition">
                  Browse Cars
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {rentals.map((rental) => {
                const statusBadge = getStatusBadge(rental.status);
                const paymentBadge = getPaymentStatusBadge(rental.payment?.status || 'PENDING');
                const showCancel = canCancel(rental.status);
                const showUpload = isPendingPayment(rental.status, rental.payment?.status || 'PENDING');
                const showVerified = isPaymentVerified(rental.payment?.status || 'PENDING');
                const showDownload = canDownloadInvoice(rental.status, rental.payment?.status || 'PENDING');
                const days = Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div key={rental.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent px-5 py-3 border-b border-gray-100 flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                          <Car className="w-5 h-5 text-[#D4AF37]" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800">{rental.car.name}</span>
                          <p className="text-xs text-gray-400">{rental.car.plateNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg}`}>
                          {statusBadge.icon}
                          {statusBadge.text}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${paymentBadge.bg}`}>
                          {paymentBadge.text}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-400">Rental Period</p>
                            <p className="font-medium text-gray-800">
                              {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{days} day{days !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-400">Total Price</p>
                            <p className="font-bold text-xl text-[#D4AF37]">
                              Rp{rental.totalPrice.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              Rp{rental.car.pricePerDay.toLocaleString()} × {days} days
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Upload Payment Button */}
                      {showUpload && (
                        <button
                          onClick={() => handleUploadPayment(rental)}
                          className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition mb-3 cursor-pointer"
                        >
                          Upload Payment
                        </button>
                      )}

                      {/* Payment Verified */}
                      {showVerified && !showUpload && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700">Payment verified successfully!</span>
                          </div>
                        </div>
                      )}

                      {/* Download Invoice Button */}
                      {showDownload && (
                        <div className="mb-3">
                          <PDFDownloadLink
                            document={<RentalInvoice rental={rental} />}
                            fileName={`invoice_${rental.id}.pdf`}
                            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {({ loading }) => (
                              <>
                                <FileText className="w-4 h-4" />
                                {loading ? 'Generating PDF...' : 'Download Invoice (PDF)'}
                              </>
                            )}
                          </PDFDownloadLink>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center flex-wrap gap-2">
                        <div className="flex gap-3">
                          <Link href={`/cars/${rental.carId}`}>
                            <button className="text-gray-500 hover:text-[#D4AF37] transition text-sm flex items-center gap-1">
                              <Car className="w-4 h-4" /> View Car
                            </button>
                          </Link>
                          <Link href={`/my-rentals/${rental.id}`}>
                            <button className="text-gray-500 hover:text-[#D4AF37] transition text-sm flex items-center gap-1">
                              <Eye className="w-4 h-4" /> Details
                            </button>
                          </Link>
                        </div>
                        {showCancel && (
                          <button
                            onClick={() => handleCancelRental(rental.id)}
                            disabled={cancellingId === rental.id}
                            className="text-red-500 hover:text-red-600 transition text-sm flex items-center gap-1 disabled:opacity-50"
                          >
                            {cancellingId === rental.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}