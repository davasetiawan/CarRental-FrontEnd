'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Car, Plus, Edit, Trash2, X, Loader2, Search, ChevronLeft, ChevronRight, Crown, Sparkles, TrendingUp, DollarSign, Upload, Power, PowerOff, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToatsContext';


interface CarData {
  id: number;
  name: string;
  plateNumber: string;
  pricePerDay: number;
  status: string;
  imageUrl: string | null;
  createdAt: string;
}

const STORAGE_KEY = 'admin_cars_data';

export default function ManageCarsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  
  // State untuk semua mobil (termasuk yang INACTIVE)
  const [allCars, setAllCars] = useState<CarData[]>([]);
  const [filteredCars, setFilteredCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const itemsPerPage = 6;
  const [formData, setFormData] = useState({
    name: '',
    plateNumber: '',
    pricePerDay: '',
  });
  const [submitting, setSubmitting] = useState(false);
  
  // State untuk upload gambar
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Helper function untuk normalisasi status (case insensitive)
  const getNormalizedStatus = (status: string) => {
    if (!status) return 'UNKNOWN';
    const upper = status.toUpperCase();
    if (upper === 'AVAILABLE') return 'AVAILABLE';
    if (upper === 'RENTED') return 'RENTED';
    if (upper === 'INACTIVE') return 'INACTIVE';
    return upper;
  };

  // Simpan ke localStorage setiap kali allCars berubah
  useEffect(() => {
    if (allCars.length > 0 && !isInitialLoad) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allCars));
      console.log('Saved to localStorage:', allCars.length);
    }
  }, [allCars, isInitialLoad]);

  // Cek admin access
  useEffect(() => {
    if (!isLoading && (!user || user.role?.toLowerCase() !== 'admin')) {
      showToast('Access denied. Admin only.', 'error');
      router.push('/dashboard');
    }
  }, [isLoading, user, router, showToast]);

  // Fetch initial cars - PRIORITAS DARI LOCALSTORAGE DULU
  useEffect(() => {
    if (user?.role?.toLowerCase() === 'admin') {
      loadCarsData();
    }
  }, [user]);

  const loadCarsData = async () => {
    // Coba ambil dari localStorage dulu
    const cachedData = localStorage.getItem(STORAGE_KEY);
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        console.log('Loaded from localStorage:', parsedData.length);
        setAllCars(parsedData);
        setFilteredCars(parsedData);
        setIsInitialLoad(false);
        setLoading(false);
      } catch (e) {
        console.error('Error parsing localStorage data:', e);
      }
    }
    
    // Tetap fetch dari backend untuk sync (tanpa menimpa jika data sudah ada)
    try {
      const response = await api.get('/cars');
      console.log('Fetched from backend:', response.data.length);
      
      // Gabungkan data dari backend dengan data localStorage
      // Prioritaskan data yang sudah ada di localStorage (termasuk INACTIVE)
      setAllCars(prevCars => {
        const existingIds = new Set(prevCars.map(c => c.id));
        const newCarsFromBackend = response.data.filter((car: CarData) => !existingIds.has(car.id));
        const mergedCars = [...prevCars, ...newCarsFromBackend];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedCars));
        return mergedCars;
      });
      
      setFilteredCars(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newCarsFromBackend = response.data.filter((car: CarData) => !existingIds.has(car.id));
        return [...prev, ...newCarsFromBackend];
      });
    } catch (error) {
      console.error('Error fetching from backend:', error);
      if (!cachedData) {
        showToast('Failed to load cars', 'error');
      }
    } finally {
      setIsInitialLoad(false);
      setLoading(false);
    }
  };

  // Filter cars berdasarkan search dan status
  useEffect(() => {
    let filtered = [...allCars];
    
    if (searchTerm) {
      filtered = filtered.filter(car => 
        car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(car => 
        getNormalizedStatus(car.status) === statusFilter.toUpperCase()
      );
    }
    
    setFilteredCars(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, allCars]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Please select a valid image file (JPG, PNG, or WEBP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    setImageFile(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const resetImageForm = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setFormData({ name: '', plateNumber: '', pricePerDay: '' });
    resetImageForm();
  };

  // CREATE - Update state lokal dan localStorage
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('plateNumber', formData.plateNumber);
      formDataToSend.append('pricePerDay', formData.pricePerDay);
      if (imageFile) {
        formDataToSend.append('file', imageFile);
      }

      const response = await api.post('/cars', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('Create response:', response.data);
      
      // Update state lokal (tambah mobil baru di awal array)
      const newCar = response.data;
      setAllCars(prev => [newCar, ...prev]);
      
      showToast('Car created successfully!', 'success');
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating car:', error);
      showToast(error.response?.data?.message || 'Failed to create car', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // UPDATE - Update state lokal dan localStorage
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('plateNumber', formData.plateNumber);
      formDataToSend.append('pricePerDay', formData.pricePerDay);
      if (imageFile) {
        formDataToSend.append('file', imageFile);
      }

      const response = await api.patch(`/cars/${selectedCar.id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('Update response:', response.data);
      
      // Update state lokal
      const updatedCar = response.data;
      setAllCars(prev => prev.map(car => car.id === updatedCar.id ? updatedCar : car));
      
      showToast('Car updated successfully!', 'success');
      setIsModalOpen(false);
      setSelectedCar(null);
      resetForm();
    } catch (error: any) {
      console.error('Error updating car:', error);
      showToast(error.response?.data?.message || 'Failed to update car', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE - Hapus dari state lokal dan localStorage
  const handleDelete = async () => {
    if (!selectedCar) return;
    setSubmitting(true);

    try {
      await api.delete(`/cars/${selectedCar.id}`);
      
      // Update state lokal (hapus mobil)
      setAllCars(prev => prev.filter(car => car.id !== selectedCar.id));
      
      showToast('Car deleted successfully!', 'success');
      setIsDeleteModalOpen(false);
      setSelectedCar(null);
    } catch (error: any) {
      console.error('Error deleting car:', error);
      showToast(error.response?.data?.message || 'Failed to delete car', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // TOGGLE STATUS - Update state lokal dan localStorage
  const handleToggleStatus = async () => {
    if (!selectedCar) return;
    setSubmitting(true);

    try {
      const currentStatus = getNormalizedStatus(selectedCar.status);
      const newStatus = currentStatus === 'AVAILABLE' ? 'INACTIVE' : 'AVAILABLE';
      
      const response = await api.patch(`/cars/${selectedCar.id}`, { status: newStatus });
      
      console.log('Status update response:', response.data);
      
      // Update state lokal
      const updatedCar = response.data;
      setAllCars(prev => prev.map(car => car.id === updatedCar.id ? updatedCar : car));
      
      showToast(`Car ${newStatus === 'AVAILABLE' ? 'activated' : 'deactivated'} successfully!`, 'success');
      setIsDeactivateModalOpen(false);
      setSelectedCar(null);
    } catch (error: any) {
      console.error('Error updating car status:', error);
      showToast(error.response?.data?.message || 'Failed to update car status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Force sync dengan backend (hapus localStorage dan fetch ulang)
  const handleForceSync = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cars');
      console.log('Sync from backend:', response.data);
      setAllCars(response.data);
      setFilteredCars(response.data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
      showToast('Data synced with server!', 'success');
    } catch (error) {
      console.error('Error syncing:', error);
      showToast('Failed to sync data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setSelectedCar(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (car: CarData) => {
    setSelectedCar(car);
    setFormData({
      name: car.name,
      plateNumber: car.plateNumber,
      pricePerDay: car.pricePerDay.toString(),
    });
    setImagePreview(car.imageUrl);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (car: CarData) => {
    setSelectedCar(car);
    setIsDeleteModalOpen(true);
  };

  const openDeactivateModal = (car: CarData) => {
    setSelectedCar(car);
    setIsDeactivateModalOpen(true);
  };

  // Pagination
  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
  const paginatedCars = filteredCars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats - dari allCars (termasuk INACTIVE)
  const totalCars = allCars.length;
  const availableCars = allCars.filter(c => getNormalizedStatus(c.status) === 'AVAILABLE').length;
  const rentedCars = allCars.filter(c => getNormalizedStatus(c.status) === 'RENTED').length;
  const inactiveCars = allCars.filter(c => getNormalizedStatus(c.status) === 'INACTIVE').length;

  const getStatusColor = (status: string) => {
    const normalized = getNormalizedStatus(status);
    if (normalized === 'AVAILABLE') return 'bg-green-100 text-green-700';
    if (normalized === 'RENTED') return 'bg-red-100 text-red-700';
    if (normalized === 'INACTIVE') return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading fleet data...</p>
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
        <div className="container mx-auto px-6 py-10 relative">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-semibold">ADMIN PANEL</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Manage Fleet</h1>
              <p className="text-white/90">Add, edit, or remove vehicles from your luxury collection</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleForceSync}
                className="bg-white/20 backdrop-blur-sm text-white font-semibold px-4 py-3 rounded-xl hover:bg-white/30 transition flex items-center gap-2"
                title="Sync with server (will remove inactive cars from view)"
              >
                <RefreshCw className="w-4 h-4" />
                Sync
              </button>
              <button
                onClick={openCreateModal}
                className="bg-white text-[#D4AF37] font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add New Car
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-6 pt-8 pb-8">
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{totalCars}</span>
            </div>
            <h3 className="font-semibold text-gray-800">Total Vehicles</h3>
            <p className="text-gray-500 text-sm">In your fleet</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{availableCars}</span>
            </div>
            <h3 className="font-semibold text-gray-800">Available</h3>
            <p className="text-gray-500 text-sm">Ready for rental</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{rentedCars}</span>
            </div>
            <h3 className="font-semibold text-gray-800">Rented</h3>
            <p className="text-gray-500 text-sm">Currently on road</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <PowerOff className="w-6 h-6 text-gray-500" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{inactiveCars}</span>
            </div>
            <h3 className="font-semibold text-gray-800">Inactive</h3>
            <p className="text-gray-500 text-sm">In service/maintenance</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="container mx-auto px-6 pb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by car name or plate number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-12 text-gray-800 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
              >
                <option value="all">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="RENTED">Rented</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cars Grid */}
        {paginatedCars.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <Car className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No vehicles found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or add a new car</p>
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Car
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCars.map((car) => (
                <div key={car.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#D4AF37]/30">
                  {/* Car Image Area */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {car.imageUrl ? (
                      <img 
                        src={car.imageUrl} 
                        alt={car.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-16 h-16 text-gray-400 group-hover:scale-110 transition-all duration-500 group-hover:text-[#D4AF37]/50" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(car.status)}`}>
                      {getNormalizedStatus(car.status)}
                    </div>
                    
                    {/* Premium Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-1 bg-[#D4AF37]/90 px-2 py-1 rounded-full">
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
                      <span className="text-xs text-gray-400">ID: {car.id}</span>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-2xl font-bold text-[#D4AF37]">
                          Rp{car.pricePerDay.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">/day</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Tombol Deactivate/Activate */}
                        {(getNormalizedStatus(car.status) === 'AVAILABLE' || getNormalizedStatus(car.status) === 'INACTIVE') && (
                          <button
                            onClick={() => openDeactivateModal(car)}
                            className={`p-2 rounded-lg transition ${
                              getNormalizedStatus(car.status) === 'AVAILABLE'
                                ? 'text-orange-500 hover:bg-orange-50'
                                : 'text-green-500 hover:bg-green-50'
                            }`}
                            title={getNormalizedStatus(car.status) === 'AVAILABLE' ? 'Deactivate' : 'Activate'}
                          >
                            {getNormalizedStatus(car.status) === 'AVAILABLE' ? (
                              <PowerOff className="w-5 h-5" />
                            ) : (
                              <Power className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(car)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(car)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:border-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition ${
                      currentPage === page
                        ? 'bg-[#D4AF37] text-white'
                        : 'border border-gray-200 hover:border-[#D4AF37] text-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:border-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal (sama seperti sebelumnya) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {selectedCar ? 'Edit Car' : 'Add New Car'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={selectedCar ? handleUpdate : handleCreate} className="p-6">
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2 text-sm">Car Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
                  placeholder="e.g., Lamborghini Huracán"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2 text-sm">Plate Number</label>
                <input
                  type="text"
                  name="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
                  placeholder="e.g., B 1234 ABC"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2 text-sm">Price per Day (Rp)</label>
                <input
                  type="number"
                  name="pricePerDay"
                  value={formData.pricePerDay}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition"
                  placeholder="e.g., 1500000"
                  required
                />
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2 text-sm">Car Image</label>
                
                {imagePreview && (
                  <div className="relative mb-3 rounded-xl overflow-hidden border border-gray-200">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-[#D4AF37] transition group">
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#D4AF37]" />
                  <span className="text-gray-500 group-hover:text-[#D4AF37]">
                    {imagePreview ? 'Change Image' : 'Upload Image (Optional)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-1">Max 5MB, format: JPG, PNG, WEBP</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-semibold py-2.5 rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    selectedCar ? 'Update Car' : 'Create Car'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Delete Car</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete <span className="font-semibold">{selectedCar.name}</span>?
              </p>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Deleting...
                    </div>
                  ) : (
                    'Delete Car'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate/Activate Confirmation Modal */}
      {isDeactivateModalOpen && selectedCar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                {getNormalizedStatus(selectedCar.status) === 'AVAILABLE' ? 'Deactivate Car' : 'Activate Car'}
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to {getNormalizedStatus(selectedCar.status) === 'AVAILABLE' ? 'deactivate' : 'activate'} <span className="font-semibold">{selectedCar.name}</span>?
              </p>
              <p className="text-gray-500 text-sm mb-6">
                {getNormalizedStatus(selectedCar.status) === 'AVAILABLE' 
                  ? 'This car will not be available for rent during maintenance/service.'
                  : 'This car will be available for rent again.'}
              </p>
              <p className="text-xs text-gray-400">The car will remain in the list and can be activated again anytime.</p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setIsDeactivateModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleStatus}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    getNormalizedStatus(selectedCar.status) === 'AVAILABLE' ? 'Deactivate' : 'Activate'
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