'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { LucideIcon } from 'lucide-react';
import { 
  Car, Calendar, History, User, Crown, Sparkles, ArrowRight, 
  Star, Clock, Shield, Users, CreditCard, TrendingUp, DollarSign,
  BarChart, CheckCircle, LogOut
} from 'lucide-react';
import { useToast } from '@/contexts/ToatsContext';

interface DashboardStat {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  change?: string;
}

interface CarItem {
  id: number;
  name: string;
  plateNumber: string;
  pricePerDay: number;
  status: string;
}

interface Rental {
  id: number;
  userId: number;
  carId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  car?: CarItem;
  user?: { id: number; name?: string; email?: string };
  payment?: {
    id: number;
    rentalId: number;
    amount: number;
    status: string;
    proofUrl: string | null;
    createdAt: string;
  };
}

interface PaymentItem {
  id: number;
  rentalId: number;
  amount: number;
  proofUrl: string | null;
  status: string;
  createdAt: string;
  rental?: Rental;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { showToast } = useToast();
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [cars, setCars] = useState<CarItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      try {
        if (isAdmin) {
          const [carsRes, rentalsRes, paymentsRes] = await Promise.all([
            api.get('/cars'),
            api.get('/rentals'),
            api.get('/payments')
          ]);

          setCars(carsRes.data ?? []);
          setRentals(rentalsRes.data ?? []);
          setPayments(paymentsRes.data ?? []);
        } else {
          const [rentalsRes, profileRes] = await Promise.all([
            api.get('/rentals/my'),
            api.get('/auth/profile')
          ]);

          setRentals(rentalsRes.data ?? []);
          setProfile(profileRes.data ?? null);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showToast('Gagal memuat data dashboard dari backend', 'error');
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isAdmin, showToast]);

  const formatCurrency = (value: number) => {
    return `Rp${value.toLocaleString('id-ID')}`;
  };

  const activeStatuses = ['active', 'ongoing'];
  const totalRentals = rentals.length;
  const activeRentalsCount = rentals.filter((r) =>
    activeStatuses.includes(r.status?.toLowerCase()) && new Date(r.endDate).getTime() > Date.now()
  ).length;
  const loyaltyPoints = profile?.loyaltyPoints ?? profile?.points ?? profile?.loyalty_points ?? 0;

  const totalVehicles = cars.length;
  const adminActiveRentals = rentals.filter((r) =>
    activeStatuses.includes(r.status?.toLowerCase())
  ).length;
  const uniqueUsersCount = new Set(rentals.map((r) => r.userId).filter(Boolean)).size;
  const revenueNumber = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const revenueLabel = revenueNumber > 0 ? formatCurrency(revenueNumber) : 'Rp0';
  const availableCarsCount = cars.filter((car) =>
    ['available', 'ready', 'idle'].includes(car.status?.toLowerCase() || '')
  ).length || Math.max(0, cars.length - adminActiveRentals);
  const pendingPaymentsCount = payments.filter((payment) => payment.status?.toLowerCase() === 'pending').length;
  const completionRate = rentals.length > 0
    ? Math.round((rentals.filter((r) => r.status?.toLowerCase() === 'completed').length / rentals.length) * 100)
    : 0;

  const userStats: DashboardStat[] = useMemo(() => [
    { label: 'Total Rentals', value: String(totalRentals), icon: Car, color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
    { label: 'Active Rentals', value: String(activeRentalsCount), icon: Clock, color: 'bg-green-50 text-green-600' },
    { label: 'Loyalty Points', value: String(loyaltyPoints), icon: Star, color: 'bg-purple-50 text-purple-600' },
  ], [totalRentals, activeRentalsCount, loyaltyPoints]);

  const adminStats: DashboardStat[] = useMemo(() => [
    { label: 'Total Vehicles', value: String(totalVehicles), icon: Car, color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
    { label: 'Active Rentals', value: String(adminActiveRentals), icon: Calendar, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Users', value: String(uniqueUsersCount), icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Revenue', value: revenueLabel, icon: DollarSign, color: 'bg-green-50 text-green-600' },
  ], [totalVehicles, adminActiveRentals, uniqueUsersCount, revenueLabel]);

  const quickStats = useMemo(() => [
    { label: 'Available Cars', value: String(availableCarsCount), icon: Car, color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
    { label: 'Rented Cars', value: String(adminActiveRentals), icon: Calendar, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Payments', value: String(pendingPaymentsCount), icon: CreditCard, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
  ], [availableCarsCount, adminActiveRentals, pendingPaymentsCount, completionRate]);

  const recentTransactions = useMemo(() => {
    return payments
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map((payment) => ({
        id: payment.id,
        user: payment.rental?.user?.name || payment.rental?.user?.email || String(payment.rental?.userId || 'Unknown'),
        car: payment.rental?.car?.name || payment.rental?.car?.plateNumber || 'Unknown',
        amount: formatCurrency(payment.amount),
        status: payment.status || 'unknown',
        date: payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('id-ID') : '',
      }));
  }, [payments]);

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
  };

  if (isLoading || dashboardLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = isAdmin ? adminStats : userStats;

  // Menu untuk User
  const userMenus = [
    { href: '/cars', icon: Car, label: 'Rent a Car', desc: 'Choose your dream car', color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
    { href: '/my-rentals', icon: Calendar, label: 'My Rentals', desc: 'View your booking history', color: 'bg-blue-50 text-blue-600' },
    { href: '/profile', icon: User, label: 'My Profile', desc: 'Manage your account', color: 'bg-purple-50 text-purple-600' },
  ];

  // Menu untuk Admin
  const adminMenus = [
    { href: '/admin/manage-cars', icon: Car, label: 'Manage Cars', desc: 'Add, edit, or remove vehicles', color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
    { href: '/admin/all-rentals', icon: Calendar, label: 'All Rentals', desc: 'View all bookings', color: 'bg-blue-50 text-blue-600' },
    { href: '/admin/verify-payments', icon: CreditCard, label: 'Verify Payments', desc: 'Confirm transactions', color: 'bg-yellow-50 text-yellow-600' },
    { href: '/admin/users', icon: Users, label: 'Manage Users', desc: 'User management', color: 'bg-purple-50 text-purple-600' },
  ];

  const menus = isAdmin ? adminMenus : userMenus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-[#D4AF37] to-[#C9A03D] text-white overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-black/5 rounded-full blur-[80px]"></div>
        
        <div className="container mx-auto px-6 py-12 relative">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                {isAdmin ? <Crown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                <span className="text-sm font-semibold">
                  {isAdmin ? 'ADMIN DASHBOARD' : 'PREMIUM MEMBER'}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {user.name}!
              </h1>
              <p className="text-white/90">
                {isAdmin 
                  ? 'Manage your fleet, rentals, and customers'
                  : 'Manage your rentals and explore our luxury fleet'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
                <div className="text-2xl font-bold">4.9</div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-white" />
                  <span>Member since 2026</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-6 py-8">
        <div className={`grid ${isAdmin ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-6 mb-10`}>
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                {isAdmin && 'change' in stat && (
                  <span className="text-green-600 text-sm font-semibold">{stat.change}</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Admin Chart Section */}
        {isAdmin && (
          <div className="grid lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                  Revenue Overview
                </h2>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 bg-white">
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Year</option>
                </select>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-center">
                  <BarChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Chart visualization will appear here</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-[#D4AF37]" />
                Quick Stats
              </h2>
              <div className="space-y-4">
                {quickStats.map((stat) => (
                  <div key={stat.label} className="flex justify-between items-center">
                    <span className="text-gray-600">{stat.label}</span>
                    <span className={`font-bold ${stat.label === 'Pending Payments' ? 'text-yellow-600' : stat.label === 'Rented Cars' ? 'text-blue-600' : 'text-green-600'}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button className="w-full text-[#D4AF37] font-semibold text-sm hover:underline flex items-center justify-center gap-1">
                  View Full Report <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {isAdmin ? 'Management Tools' : 'Quick Actions'}
        </h2>
        <div className={`grid ${isAdmin ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-6 mb-10`}>
          {menus.map((menu, idx) => (
            <Link key={idx} href={menu.href}>
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group border border-gray-100 hover:border-[#D4AF37]/30">
                <div className={`w-14 h-14 rounded-xl ${menu.color} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <menu.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold mb-1 text-gray-800">{menu.label}</h3>
                <p className="text-gray-500 text-sm">{menu.desc}</p>
                <div className="mt-4 text-[#D4AF37] text-sm font-medium group-hover:translate-x-1 transition inline-flex items-center gap-1">
                  {isAdmin ? 'Manage' : 'Go'} <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity / Transactions */}
        {isAdmin ? (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                Recent Transactions
              </h2>
              <Link href="/admin/all-rentals">
                <button className="text-[#D4AF37] text-sm font-semibold hover:underline">View All</button>
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr className="text-left text-gray-500 text-sm">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Car</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100">
                      <td className="py-3 text-sm font-medium text-gray-800">{tx.id}</td>
                      <td className="py-3 text-sm text-gray-600">{tx.user}</td>
                      <td className="py-3 text-sm text-gray-600">{tx.car}</td>
                      <td className="py-3 text-sm font-semibold text-gray-800">{tx.amount}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tx.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {tx.status === 'completed' ? <CheckCircle className="w-3 h-3 inline mr-1" /> : null}
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-500">{tx.date}</td>
                      <td className="py-3">
                        <button className="text-[#D4AF37] text-sm hover:underline">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-[#D4AF37]" />
              Recent Activity
            </h2>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500">No rental history yet</p>
              <Link href="/cars">
                <button className="mt-4 text-[#D4AF37] font-semibold hover:underline flex items-center gap-1 mx-auto">
                  Browse our fleet <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Benefits Section untuk User */}
        {!isAdmin && (
          <div className="mt-8 bg-gradient-to-r from-[#D4AF37]/10 to-transparent rounded-2xl p-6 border border-[#D4AF37]/20">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-[#D4AF37]" />
              <h3 className="font-semibold text-gray-800">Premium Member Benefits</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm text-gray-600">Priority Support 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm text-gray-600">Free Cancellation</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm text-gray-600">Exclusive Member Rates</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}