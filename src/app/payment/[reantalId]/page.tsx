'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

import { 
  Car, Calendar, CreditCard, Upload, FileImage, 
  CheckCircle, AlertCircle, ArrowLeft, Loader2,
  X, Eye
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToatsContext';

interface Rental {
  id: number;
  carId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  car: {
    id: number;
    name: string;
    plateNumber: string;
    pricePerDay: number;
  };
  payment: {
    id: number;
    amount: number;
    proofUrl: string | null;
    status: string;
  };
}

export default function UploadPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // AMBIL RENTAL ID DARI URL MANUAL (PASTI BISA)
  const pathname = window.location.pathname;
  const rentalIdFromPath = pathname.split('/').pop();
  
  console.log('=== DEBUG ===');
  console.log('Pathname:', pathname);
  console.log('Rental ID from path:', rentalIdFromPath);
  console.log('Params:', params);

  const rentalId = rentalIdFromPath || (params?.rentalId as string);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    // CEK APAKAH ADA DATA DARI URL PARAMETERS
    const carName = searchParams.get('carName');
    const carPlate = searchParams.get('carPlate');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const totalPrice = searchParams.get('totalPrice');
    const pricePerDay = searchParams.get('pricePerDay');

    if (carName && startDate && endDate && totalPrice && rentalId) {
      console.log('Using data from URL params');
      const rentalData: Rental = {
        id: parseInt(rentalId),
        carId: 0,
        startDate: startDate,
        endDate: endDate,
        totalPrice: parseInt(totalPrice),
        status: 'PENDING',
        car: {
          id: 0,
          name: decodeURIComponent(carName),
          plateNumber: carPlate ? decodeURIComponent(carPlate) : '-',
          pricePerDay: parseInt(pricePerDay || '0'),
        },
        payment: {
          id: 0,
          amount: parseInt(totalPrice),
          proofUrl: null,
          status: 'PENDING'
        }
      };
      setRental(rentalData);
      setLoading(false);
      return;
    }

    // FALLBACK: Ambil dari API jika tidak ada data di URL
    const fetchRentalFromMyRentals = async () => {
      if (!rentalId) {
        console.error('No rentalId available');
        showToast('Invalid rental ID', 'error');
        router.push('/my-rentals');
        return;
      }

      setLoading(true);
      
      try {
        console.log('Fetching from API...');
        const response = await api.get('/rentals/my', { timeout: 10000 });
        const rentals: Rental[] = response.data;
        
        const rentalIdNum = parseInt(rentalId);
        console.log('Looking for rental ID:', rentalIdNum);
        console.log('Available rentals:', rentals.map(r => r.id));
        
        const foundRental = rentals.find(r => r.id === rentalIdNum);
        
        if (foundRental) {
          console.log('Rental found:', foundRental);
          setRental(foundRental);
        } else {
          console.error('Rental not found for ID:', rentalIdNum);
          showToast('Rental not found', 'error');
          router.push('/my-rentals');
        }
      } catch (error: any) {
        console.error('Error fetching rentals:', error);
        showToast('Failed to load rental data', 'error');
        router.push('/my-rentals');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRentalFromMyRentals();
    }
  }, [user, rentalId, router, showToast, searchParams]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
  };

 const handleUpload = async () => {
  if (!selectedFile) {
    showToast('Please select a payment proof image', 'error');
    return;
  }

  if (!rentalId) {
    showToast('Invalid rental ID', 'error');
    return;
  }

  setUploading(true);
  
  const formData = new FormData();
  formData.append('file', selectedFile); // sesuaikan nama field

  try {
    const response = await api.patch(`/payments/${rentalId}/upload-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log('Upload response:', response.data);
    
    // Cek apakah sudah pernah upload
    if (response.data.message?.toLowerCase().includes('already')) {
      showToast('Payment proof has already been uploaded!', 'info');
    } else {
      showToast('Payment proof uploaded successfully!', 'success');
    }
    
    setTimeout(() => {
      router.push('/my-rentals');
    }, 2000);
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Cek error message dari backend
    const errorMsg = error.response?.data?.message || 'Failed to upload payment proof';
    
    if (errorMsg.toLowerCase().includes('already')) {
      showToast('Payment proof has already been uploaded!', 'info');
    } else {
      showToast(errorMsg, 'error');
    }
  } finally {
    setUploading(false);
  }
};

  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp${amount.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Rental Not Found</h2>
          <Link href="/my-rentals" className="text-[#D4AF37] hover:underline mt-4 inline-block">
            Back to My Rentals
          </Link>
        </div>
      </div>
    );
  }

  const hasUploaded = rental.payment?.proofUrl !== null;
  const days = Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/my-rentals" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#D4AF37] transition mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to My Rentals
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4AF37]/10 rounded-2xl mb-3">
              <CreditCard className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Payment</h1>
            <p className="text-gray-500 mt-1">Complete your booking by uploading payment proof</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Rental Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-5 py-3">
                <h2 className="text-lg font-bold text-white">Rental Details</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                  <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                    <Car className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{rental.car.name}</p>
                    <p className="text-xs text-gray-400">{rental.car.plateNumber}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Rental Period</p>
                      <p className="text-sm text-gray-800">
                        {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{days} day{days !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Total Payment</p>
                      <p className="text-2xl font-bold text-[#D4AF37]">
                        {formatCurrency(rental.totalPrice)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(rental.car.pricePerDay)} × {days} days
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-blue-800 text-sm mb-2">Payment Instructions</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-blue-700">1. Transfer to:</p>
                    <div className="bg-white rounded-lg p-2">
                      <p className="font-mono text-blue-800">Bank BCA - 1234567890</p>
                      <p className="text-xs text-blue-600">a.n. CarRental Luxury</p>
                    </div>
                    <p className="text-blue-700 mt-2">2. Upload your transfer proof</p>
                    <p className="text-blue-700">3. Wait for admin verification</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Upload Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-5 py-3">
                <h2 className="text-lg font-bold text-white">Upload Payment Proof</h2>
              </div>
              <div className="p-5">
                {hasUploaded ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Proof Uploaded</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Your payment proof has been submitted. Admin will verify it soon.
                    </p>
                    {rental.payment?.proofUrl && (
                      <a 
                        href={rental.payment.proofUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        View Uploaded Proof
                      </a>
                    )}
                    <div className="mt-6">
                      <Link href="/my-rentals">
                        <button className="text-gray-500 hover:text-[#D4AF37] transition">
                          Back to My Rentals
                        </button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {!previewUrl ? (
                      <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#D4AF37] transition block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Click to upload payment proof</p>
                        <p className="text-gray-400 text-sm mt-1">JPG, PNG, or WEBP (Max 5MB)</p>
                      </label>
                    ) : (
                      <div className="border rounded-xl overflow-hidden">
                        <div className="relative">
                          <img 
                            src={previewUrl} 
                            alt="Payment proof preview" 
                            className="w-full h-48 object-cover"
                          />
                          <button
                            onClick={removeSelectedFile}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-4 bg-gray-50">
                          <div className="flex items-center gap-2 mb-2">
                            <FileImage className="w-4 h-4 text-[#D4AF37]" />
                            <span className="text-sm text-gray-600">{selectedFile?.name}</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {(selectedFile?.size ? selectedFile.size / 1024 / 1024 : 0).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}

                    {previewUrl && (
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full mt-4 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-semibold py-3 rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Upload Payment Proof
                          </>
                        )}
                      </button>
                    )}

                    <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <p className="text-xs text-yellow-700">
                          Make sure the proof clearly shows the transfer amount, date, and destination account.
                          Payment will be verified within 1x24 hours.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}