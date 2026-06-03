'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Car, Calendar, DollarSign, Fuel, Users, Shield, Sparkles, ArrowLeft, Crown, CheckCircle, Star } from 'lucide-react';

interface CarDetail {
  id: number;
  name: string;
  plateNumber: string;
  pricePerDay: number;
  status: string;
  imageUrl: string | null;
  brand?: string;
  year?: number;
  seatCapacity?: number;
  transmission?: string;
  fuelType?: string;
  description?: string;
}

export default function CarDetailPage() {
  const params = useParams();
  const id = params.id;
  
  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rentalDays, setRentalDays] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api.get(`/cars/${id}`)
        .then(res => {
          console.log('Car detail:', res.data);
          setCar(res.data);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load car details');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const isAvailable = car?.status?.toLowerCase() === 'available';
  const totalPrice = car ? car.pricePerDay * rentalDays : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 mx-auto mb-4 w-fit">
            <Car className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Car Not Found</h2>
          <p className="text-gray-500 mb-6">{error || 'The car you are looking for does not exist'}</p>
          <Link href="/cars">
            <button className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition">
              Back to Cars
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Back Button */}
      <div className="container mx-auto px-6 py-6">
        <Link href="/cars">
          <button className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to all cars</span>
          </button>
        </Link>
      </div>

      <div className="container mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Image */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-video">
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
              
              {/* Status Badge */}
              <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-semibold ${
                isAvailable 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {isAvailable ? 'Available Now' : 'Currently Rented'}
              </div>

              {/* Premium Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#D4AF37]/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Crown className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-semibold">Premium Selection</span>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-[#D4AF37]" />
                <span>Insured</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>Free Cancellation</span>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div>
            {/* Car Title */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{car.name}</h1>
              <p className="text-gray-500">{car.plateNumber}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                  <span className="font-semibold">4.9</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500 text-sm">2,500+ reviews</span>
              </div>
            </div>

            {/* Description */}
            {car.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">{car.description}</p>
            )}

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-gray-50 rounded-xl">
              {car.brand && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <Car className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Brand</p>
                    <p className="font-semibold text-gray-800">{car.brand}</p>
                  </div>
                </div>
              )}
              
              {car.year && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Year</p>
                    <p className="font-semibold text-gray-800">{car.year}</p>
                  </div>
                </div>
              )}
              
              {car.seatCapacity && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Seats</p>
                    <p className="font-semibold text-gray-800">{car.seatCapacity}</p>
                  </div>
                </div>
              )}
              
              {car.transmission && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <Car className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Transmission</p>
                    <p className="font-semibold text-gray-800">{car.transmission}</p>
                  </div>
                </div>
              )}
              
              {car.fuelType && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <Fuel className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fuel</p>
                    <p className="font-semibold text-gray-800">{car.fuelType}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Price & Rental Duration */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-3xl font-bold text-[#D4AF37]">
                    Rp{car.pricePerDay.toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-sm">per day</p>
                </div>
                
                {/* Rental Days Selector */}
                <div className="flex items-center gap-3">
                  
                </div>
              </div>

              
              {/* Book Now Button */}
              {isAvailable ? (
                <Link href={`/booking/${car.id}?days=${rentalDays}`}>
                  <button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Book Now
                  </button>
                </Link>
              ) : (
                <button className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center gap-2">
                  Not Available for Rent
                </button>
              )}
            </div>

            {/* Additional Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 text-center">
                Secure booking • Free cancellation up to 24 hours • No hidden fees
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}