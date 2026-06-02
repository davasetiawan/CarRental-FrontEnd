'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Car, Search, Sparkles, Crown, Star, ArrowRight, Shield } from 'lucide-react';

interface Car {
  id: number;
  name: string;
  plateNumber: string;
  pricePerDay: number;
  status: string;
  imageUrl: string | null;
}

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/cars')
      .then(res => {
        console.log('Cars data:', res.data);
        setCars(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredCars = cars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(search.toLowerCase()) ||
      car.plateNumber.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading luxury fleet...</p>
        </div>
      </div>
    );
  }

  const isAvailable = (status: string) => {
    return status?.toLowerCase() === 'available';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white overflow-hidden">
        <div className="container mx-auto px-6 py-12 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm tracking-wider font-semibold">OUR COLLECTION</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Dream Car</h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Explore our hand-picked selection of luxury and performance vehicles
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by car name or plate number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-12 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">
            Showing <span className="font-semibold text-gray-800">{filteredCars.length}</span> of{' '}
            <span className="font-semibold text-gray-800">{cars.length}</span> vehicles
          </p>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
            <span className="text-sm text-gray-600">Premium selection</span>
          </div>
        </div>
      </div>

      {/* Cars Grid */}
      <div className="container mx-auto px-6 pb-16">
        {filteredCars.length === 0 ? (
          <div className="text-center py-20">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No vehicles found</h3>
            <p className="text-gray-500">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCars.map((car) => {
              const available = isAvailable(car.status);
              return (
                <div key={car.id} className="group">
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-[#D4AF37]/30 group-hover:-translate-y-1">
                    {/* Car Image Area */}
                    <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {car.imageUrl ? (
                        <img 
                          src={car.imageUrl} 
                          alt={car.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-20 h-20 text-gray-400 group-hover:scale-110 transition-all duration-500 group-hover:text-[#D4AF37]/50" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${
                        available 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {available ? 'Available' : 'Rented'}
                      </div>
                      
                      {/* Premium Badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-1 bg-[#D4AF37]/90 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Crown className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-semibold">Premium</span>
                      </div>
                    </div>

                    {/* Car Details */}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#D4AF37] transition">
                            {car.name}
                          </h3>
                          <p className="text-gray-500 text-sm">{car.plateNumber}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                          <span className="text-sm font-semibold">4.9</span>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                        <div>
                          <span className="text-2xl font-bold text-[#D4AF37]">
                            Rp{car.pricePerDay.toLocaleString()}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">/day</span>
                        </div>
                        <Link href={`/booking/${car.id}`}>
                          <button
                            className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-all duration-300 ${
                              available
                                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white hover:shadow-lg hover:scale-105'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!available}
                          >
                            {available ? 'Rent Now' : 'Unavailable'}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="bg-gray-50 border-t border-gray-100 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm text-gray-600">Verified by Trustpilot</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm text-gray-600">4.9/5 from 2,500+ reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm text-gray-600">Premium Member Benefits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}