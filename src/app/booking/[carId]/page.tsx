'use client';

import { SetStateAction, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Car, Calendar, ArrowLeft, CreditCard, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import DatePicker from 'react-datepicker';
import { useToast } from '@/contexts/ToatsContext';


interface CarDetail {
  id: number;
  name: string;
  plateNumber: string;
  pricePerDay: number;
  status: string;
}

export default function BookingPage({ params }: { params: { carId: string } }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const response = await api.get(`/cars/${params.carId}`);
        console.log('Car data:', response.data);
        setCar(response.data);
      } catch (error) {
        console.error('Error fetching car:', error);
        showToast('Failed to load car details', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (params.carId) {
      fetchCar();
    }
  }, [params.carId, showToast]);

  const calculateDays = () => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const calculateTotal = () => {
    if (car && startDate && endDate) {
      const days = calculateDays();
      const total = car.pricePerDay * days;
      console.log(`Price: ${car.pricePerDay}, Days: ${days}, Total: ${total}`);
      return total;
    }
    return 0;
  };

  const formatDateLocal = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      showToast('Please select both start and end dates', 'error');
      return;
    }

    if (startDate >= endDate) {
      showToast('End date must be after start date', 'error');
      return;
    }

    if (startDate < new Date()) {
      showToast('Start date cannot be in the past', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/rentals', {
        carId: parseInt(params.carId),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      console.log('Rental created:', response.data);
      showToast('Rental created successfully!', 'success');
      
      setTimeout(() => {
        router.push('/my-rentals');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating rental:', error);
      showToast(error.response?.data?.message || 'Failed to create rental', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Car not found</p>
          <Link href="/cars" className="text-[#D4AF37] hover:underline mt-4 inline-block">
            Back to Fleet
          </Link>
        </div>
      </div>
    );
  }

  const days = calculateDays();
  const totalPrice = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Link href={`/cars/${params.carId}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-[#D4AF37] transition mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Car Details
          </Link>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Car Info */}
            <div className="lg:w-1/2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
                <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-5 py-3">
                  <h2 className="text-lg font-bold text-white">Car Details</h2>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-center mb-5">
                    <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center">
                      <Car className="w-14 h-14 text-[#D4AF37]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-1">{car.name}</h3>
                  <p className="text-gray-500 text-center text-sm mb-4">{car.plateNumber}</p>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Price per day</span>
                      <span className="text-2xl font-bold text-[#D4AF37]">
                        Rp{car.pricePerDay.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700">Free cancellation within 24 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Booking Form */}
            <div className="lg:w-1/2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-5 py-3">
                  <h2 className="text-lg font-bold text-white">Book This Car</h2>
                </div>
                <div className="p-5">
                  <form onSubmit={handleSubmit}>
                    {/* Start Date */}
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-2 text-sm">
                        <Calendar className="w-4 h-4 inline mr-1 text-[#D4AF37]" />
                        Start Date
                      </label>
                      <DatePicker
                        selected={startDate}
                        onChange={(date: SetStateAction<Date | null>) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        minDate={new Date()}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition text-sm"
                        dateFormat="dd MMMM yyyy"
                        placeholderText="Select start date"
                      />
                    </div>

                    {/* End Date */}
                    <div className="mb-5">
                      <label className="block text-gray-700 font-medium mb-2 text-sm">
                        <Calendar className="w-4 h-4 inline mr-1 text-[#D4AF37]" />
                        End Date
                      </label>
                      <DatePicker
                        selected={endDate}
                        onChange={(date: SetStateAction<Date | null>) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate || new Date()}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition text-sm"
                        dateFormat="dd MMMM yyyy"
                        placeholderText="Select end date"
                      />
                    </div>

                    {/* Price Summary - TAMPILKAN SETIAP KALI ADA PERUBAHAN */}
                    {startDate && endDate && (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-5 border border-gray-200">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Price per day</span>
                            <span className="font-semibold">Rp{car.pricePerDay.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Number of days</span>
                            <span className="font-semibold">{days} day{days !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-800">Total Price</span>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-[#D4AF37]">
                                  Rp{totalPrice.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 text-right">
                              (Rp{car.pricePerDay.toLocaleString()} × {days} hari)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preview tanggal jika belum pilih */}
                    {(!startDate || !endDate) && (
                      <div className="bg-gray-50 rounded-xl p-4 mb-5 text-center">
                        <Clock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Select start and end dates to see price breakdown</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !startDate || !endDate}
                      className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-semibold py-3 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Confirm Booking
                        </span>
                      )}
                    </button>
                  </form>

                  <div className="mt-4 p-3 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-xs text-gray-600">Premium support available 24/7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}