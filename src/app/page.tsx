'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Car, Shield, Clock, ArrowRight, Crown, Sparkles, Star, Headphones, Gem, Award, Zap, CheckCircle, TrendingUp, Users, MapPin } from 'lucide-react';
import { api } from '@/lib/api';

interface Car {
  id: number;
  name: string;
  plateNumber: string;
  pricePerDay: number;
  status: string;
  imageUrl: string | null;
}

export default function Home() {
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await api.get('/cars');
        // Ambil 3 mobil pertama untuk featured collection
        setFeaturedCars(response.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  // Mapping tag berdasarkan nama mobil
  const getCarTag = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('lamborghini') || nameLower.includes('ferrari')) return 'Supercar';
    if (nameLower.includes('porsche') || nameLower.includes('911')) return 'Sports';
    if (nameLower.includes('rolls') || nameLower.includes('bentley')) return 'Luxury';
    if (nameLower.includes('bmw') || nameLower.includes('mercedes')) return 'Executive';
    return 'Premium';
  };

  // Mapping power (mock - bisa ditambahkan ke backend nanti)
  const getCarPower = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('lamborghini')) return '640 HP';
    if (nameLower.includes('porsche')) return '572 HP';
    if (nameLower.includes('rolls')) return '563 HP';
    if (nameLower.includes('ferrari')) return '710 HP';
    if (nameLower.includes('bmw')) return '473 HP';
    return '400+ HP';
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] text-white overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[150px]"></div>
        
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-[#D4AF37]/30">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-sm tracking-wide">PREMIUM CAR RENTAL</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Experience 
              <span className="text-[#D4AF37] block">Luxury on Wheels</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-2xl">
              Discover our exclusive fleet of premium vehicles. From sports cars to luxury SUVs, 
              experience driving like never before.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login">
                <button className="bg-gradient-to-r from-[#D4AF37] to-[#C9A03D] text-[#0A0A0A] font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition">
                  Login to Rent
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/register">
                <button className="border-2 border-white/30 text-white hover:text-black px-6 py-3 rounded-xl font-semibold transition hover:bg-gradient-to-r hover:from-[#D4AF37] hover:to-[#C9A03D]"> 
                  Join Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-[#D4AF37]">150+</div>
              <div className="text-gray-500 text-sm">Luxury Vehicles</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#D4AF37]">98%</div>
              <div className="text-gray-500 text-sm">Client Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#D4AF37]">24/7</div>
              <div className="text-gray-500 text-sm">Concierge Support</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#D4AF37]">50+</div>
              <div className="text-gray-500 text-sm">Exclusive Locations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Why Choose <span className="text-[#D4AF37]">CarRental</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Experience excellence with every rental
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition text-center group">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-[#D4AF37] transition">
                <Car className="w-7 h-7 text-[#D4AF37] group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Premium Fleet</h3>
              <p className="text-gray-500 leading-relaxed">All vehicles meticulously maintained and less than 2 years old</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition text-center group">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-[#D4AF37] transition">
                <Shield className="w-7 h-7 text-[#D4AF37] group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Full Insurance</h3>
              <p className="text-gray-500 leading-relaxed">Comprehensive coverage for your peace of mind</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition text-center group">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-[#D4AF37] transition">
                <Clock className="w-7 h-7 text-[#D4AF37] group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Instant Booking</h3>
              <p className="text-gray-500 leading-relaxed">Reserve your dream car in minutes, not hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection - DINAMIS DARI DATABASE DENGAN GAMBAR */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Featured <span className="text-[#D4AF37]">Collection</span>
              </h2>
              <p className="text-gray-500 mt-2">Our most requested vehicles</p>
            </div>
            <Link href="/cars">
              <button className="text-[#D4AF37] hover:text-[#C9A03D] transition flex items-center gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredCars.map((car) => (
                <div key={car.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-[#D4AF37]/30 group">
                  {/* Car Image Area */}
                  <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {car.imageUrl ? (
                      <img 
                        src={car.imageUrl} 
                        alt={car.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gem className="w-24 h-24 text-gray-400 group-hover:scale-110 transition-all duration-500 group-hover:text-[#D4AF37]/50" />
                      </div>
                    )}
                    
                    {/* Tag Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="text-xs px-3 py-1 bg-[#D4AF37]/90 text-white rounded-full font-semibold">
                        {getCarTag(car.name)}
                      </span>
                    </div>
                    
                    {/* Status Badge */}
                    {car.status?.toLowerCase() !== 'available' && (
                      <div className="absolute top-4 right-4">
                        <span className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                          Rented
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#D4AF37] transition">
                          {car.name}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">{getCarPower(car.name)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-sm font-semibold">4.9</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-2xl font-bold text-[#D4AF37]">
                          Rp{car.pricePerDay.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">/day</span>
                      </div>
                      <Link href={`/login`}>
                        <button className={`text-gray-600 hover:text-[#D4AF37] transition font-medium flex items-center gap-1 ${
                          car.status?.toLowerCase() !== 'available' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}>
                          Rent Now <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#D4AF37] to-[#C9A03D]">
        <div className="container mx-auto px-6 text-center">
          <Crown className="w-16 h-16 text-white mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">The Ultimate Driving Experience</h2>
          <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
            Join our exclusive community of luxury car enthusiasts
          </p>
          <Link href="/register">
            <button className="bg-white text-[#D4AF37] font-bold px-10 py-4 rounded-full text-lg hover:shadow-xl transition-all duration-300">
              Start Your Journey
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}