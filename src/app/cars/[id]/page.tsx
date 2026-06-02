'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';

import { Car, Calendar, Fuel, Gauge, ArrowLeft, CheckCircle, XCircle, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToatsContext';


interface CarDetail {
  id: number;
  name: string;
  plateNumber: string;
  pricePerDay: number;
  status: string;
  imageUrl: string | null;
  year?: number;
  color?: string;
  description?: string;
}

export default function CarDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [car, setCar] = useState<CarDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const response = await api.get(`/cars/${id}`);
        setCar(response.data);
      } catch (error) {
        console.error('Gagal mengambil detail mobil:', error);
        showToast('Failed to load car details', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCar();
    }
  }, [id, showToast]);

  const handleBooking = () => {
    if (!user) {
      showToast('Please login first', 'error');
      router.push('/login');
      return;
    }

    if (car?.status?.toLowerCase() !== 'available') {
      showToast('Car is not available', 'error');
      return;
    }

    router.push(`/booking/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Car not found</p>
        <Link href="/cars" className="text-[#D4AF37] hover:underline mt-2 inline-block">
          Back to Car List
        </Link>
      </div>
    );
  }

  const isAvailable = car.status?.toLowerCase() === 'available';

    function formatCurrency(pricePerDay: number): import("react").ReactNode {
        throw new Error('Function not implemented.');
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/cars" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#D4AF37] transition mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Car List
          </Link>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image Section */}
              <div className="h-80 md:h-auto bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {car.imageUrl ? (
                  <img 
                    src={car.imageUrl} 
                    alt={car.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-32 h-32 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{car.name}</h1>
                    <p className="text-gray-500">{car.plateNumber}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                    <span className="font-semibold text-gray-800">4.9</span>
                    <span className="text-gray-400 text-sm">(124 reviews)</span>
                  </div>
                </div>

                <div className="border-t border-b py-4 my-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price per day</span>
                    <span className="text-3xl font-bold text-[#D4AF37]">
                      {formatCurrency(car.pricePerDay)}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {isAvailable ? 'Available Now' : 'Currently Rented'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={!isAvailable || isBooking}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isAvailable
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white hover:shadow-lg hover:scale-[1.02]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {!user
                    ? 'Login to Rent'
                    : isAvailable
                    ? 'Rent Now'
                    : 'Not Available'}
                </button>

                <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">Free cancellation within 24 hours</span>
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