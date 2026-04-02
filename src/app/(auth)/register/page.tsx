'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Loader2, User, Phone,
  Lock, ArrowRight, ShieldCheck,
  Leaf, Sun, Droplets, Eye, EyeOff
} from 'lucide-react';
import CreatableSelect from 'react-select/creatable';

// ─── Data ────────────────────────────────────────────────────────────────────

const INDIA_DATA: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Kakinada', 'Tirupati', 'Anantapur', 'Kadapa', 'Srikakulam', 'Vizianagaram', 'East Godavari', 'West Godavari', 'Krishna', 'Prakasam', 'Chittoor'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Mehsana', 'Patan', 'Banaskantha', 'Sabarkantha', 'Kutch', 'Amreli', 'Bharuch', 'Kheda'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Jind', 'Kurukshetra', 'Rewari', 'Mahendragarh', 'Nuh', 'Palwal'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha', 'Chhatarpur', 'Damoh'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Akola', 'Jalgaon', 'Latur', 'Dhule', 'Ahmednagar', 'Raigad', 'Ratnagiri', 'Sindhudurg', 'Satara', 'Sangli', 'Osmanabad', 'Beed', 'Jalna', 'Parbhani', 'Hingoli', 'Buldhana', 'Washim', 'Yavatmal', 'Wardha', 'Gadchiroli', 'Gondia', 'Bhandara', 'Chandrapur'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur', 'Hoshiarpur', 'Gurdaspur', 'Pathankot', 'Moga', 'Faridkot', 'Muktsar', 'Fazilka', 'Barnala', 'Mansa', 'Sangrur', 'Fatehgarh Sahib', 'Kapurthala', 'Nawanshahr', 'Rupnagar', 'Tarn Taran'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Hanumangarh', 'Chittorgarh', 'Tonk', 'Baran', 'Bundi', 'Jhalawar', 'Nagaur', 'Barmer', 'Jaisalmer', 'Jalore', 'Sirohi', 'Dungarpur', 'Banswara', 'Pratapgarh', 'Dausa', 'Dholpur', 'Karauli', 'Sawai Madhopur', 'Rajsamand', 'Churu', 'Jhunjhunu'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Loni', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Mau', 'Hapur', 'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli', 'Orai', 'Sitapur', 'Bahraich', 'Modinagar', 'Unnao', 'Jaunpur', 'Lakhimpur', 'Hathras', 'Banda', 'Pilibhit', 'Barabanki', 'Khurja', 'Gonda', 'Mainpuri', 'Lalitpur', 'Etah', 'Deoria', 'Badaun'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar', 'Nabadwip', 'Medinipur', 'Jalpaiguri', 'Balurghat', 'Basirhat', 'Bankura', 'Chakdaha', 'Darjeeling', 'Alipurduar', 'Cooch Behar', 'North 24 Parganas', 'South 24 Parganas', 'Hooghly', 'Nadia', 'Birbhum', 'Purulia', 'Murshidabad'],
};

const stateOptions = Object.keys(INDIA_DATA).map((s) => ({ value: s, label: s }));

const toOption = (v: string) => ({ value: v, label: v });

// ─── Custom react-select styles ───────────────────────────────────────────────

const selectStyles = (hasError = false) => ({
  control: (base: any, state: any) => ({
    ...base,
    minHeight: '52px',
    border: hasError
      ? '1px solid #fca5a5'
      : state.isFocused
      ? '1px solid transparent'
      : '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    boxShadow: state.isFocused
      ? '0 0 0 2px #10b981'
      : '0 1px 2px 0 rgba(0,0,0,0.05)',
    backgroundColor: '#ffffff',
    paddingLeft: '0.5rem',
    fontSize: '0.9375rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': { borderColor: state.isFocused ? 'transparent' : '#d1d5db' },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.75rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    zIndex: 50,
  }),
  menuList: (base: any) => ({ ...base, padding: '4px' }),
  option: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.5rem',
    backgroundColor: state.isSelected
      ? '#10b981'
      : state.isFocused
      ? '#f0fdf4'
      : 'transparent',
    color: state.isSelected ? '#fff' : '#111827',
    fontWeight: state.isSelected ? 600 : 500,
    cursor: 'pointer',
    fontSize: '0.9375rem',
    padding: '8px 12px',
  }),
  singleValue: (base: any) => ({ ...base, color: '#111827' }),
  placeholder: (base: any) => ({ ...base, color: '#9ca3af' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base: any) => ({ ...base, color: '#9ca3af', padding: '0 8px 0 0' }),
  clearIndicator: (base: any) => ({ ...base, color: '#9ca3af' }),
  valueContainer: (base: any) => ({ ...base, paddingLeft: '0.75rem' }),
  noOptionsMessage: (base: any) => ({ ...base, fontSize: '0.875rem', color: '#6b7280' }),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    state: '',
    district: '',
  });

  const [selectedState, setSelectedState] = useState<{ value: string; label: string } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<{ value: string; label: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const districtOptions = selectedState
    ? (INDIA_DATA[selectedState.value] ?? []).map(toOption)
    : [];

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleStateChange = (option: any) => {
    setSelectedState(option);
    setSelectedDistrict(null);
    setFormData({ ...formData, state: option?.value ?? '', district: '' });
    if (error) setError('');
  };

  const handleDistrictChange = (option: any) => {
    setSelectedDistrict(option);
    setFormData({ ...formData, district: option?.value ?? '' });
    if (error) setError('');
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      window.location.href = '/login?registered=true';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariant: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-white flex font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden">

      {/* ── LEFT: Form ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:flex-none lg:w-[45%] xl:w-[40%] 2xl:w-[35%] relative z-10 bg-white">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />

        <div className="mx-auto w-full max-w-md relative z-10">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
              Join the future of farming.
            </h2>
            <p className="text-base text-gray-500 font-medium">
              Already a member?{' '}
              <a href="/login" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors underline-offset-2 hover:underline">
                Sign in here
              </a>
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 font-semibold flex items-start"
                >
                  <ShieldCheck className="w-5 h-5 mr-3 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Full Name */}
            <motion.div variants={itemVariant}>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium transition-all bg-white hover:border-gray-300 text-gray-900"
                  placeholder="e.g. Ram Singh"
                />
              </div>
            </motion.div>

            {/* Phone */}
            <motion.div variants={itemVariant}>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <div className="absolute inset-y-0 left-11 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium pl-1">+91</span>
                </div>
                <input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange}
                  className="block w-full pl-20 pr-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium transition-all bg-white hover:border-gray-300 text-gray-900"
                  placeholder="98765 43210"
                  maxLength={10}
                />
              </div>
            </motion.div>

            {/* ── State + District ROW ── */}
            <motion.div variants={itemVariant}>
              <div className="grid grid-cols-2 gap-3">

                {/* State */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    State <span className="text-red-400">*</span>
                  </label>
                  <CreatableSelect
                    inputId="state"
                    options={stateOptions}
                    value={selectedState}
                    onChange={handleStateChange}
                    placeholder="Select state…"
                    isClearable
                    formatCreateLabel={(v) => `Add "${v}"`}
                    styles={selectStyles()}
                    classNamePrefix="rselect"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    District <span className="text-red-400">*</span>
                  </label>
                  <CreatableSelect
                    inputId="district"
                    options={districtOptions}
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    placeholder={selectedState ? 'Select district…' : 'Pick state first'}
                    isDisabled={!selectedState}
                    isClearable
                    formatCreateLabel={(v) => `Add "${v}"`}
                    styles={selectStyles()}
                    classNamePrefix="rselect"
                    noOptionsMessage={() =>
                      selectedState ? 'Type to add a new district' : 'Select a state first'
                    }
                  />
                </div>
              </div>

              {/* Helper hint */}
              <p className="mt-1.5 text-xs text-gray-400 font-medium">
                Can't find your district? Type it in and press Enter to add it.
              </p>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariant}>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange}
                  className="block w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium transition-all bg-white hover:border-gray-300 text-gray-900"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div variants={itemVariant} className="pt-1">
              <button type="submit" disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-emerald-600/20 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] group overflow-hidden relative"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center">
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Account...</>
                  ) : (
                    <>Create Account <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </button>
            </motion.div>

            <motion.p variants={itemVariant} className="text-center text-sm text-gray-500 font-medium">
              By joining, you agree to our{' '}
              <a href="#" className="text-emerald-600 hover:text-emerald-700 hover:underline">Terms of Service</a>{' '}
              &{' '}
              <a href="#" className="text-emerald-600 hover:text-emerald-700 hover:underline">Privacy Policy</a>.
            </motion.p>
          </motion.form>
        </div>
      </div>

      {/* ── RIGHT: Brand Panel ── */}
      <div className="hidden lg:flex flex-1 relative bg-emerald-950 items-end justify-center overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transform hover:scale-105 transition-transform duration-[10000ms]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586771107445-d3afeb0dece5?q=80&w=2069&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-transparent" />
        <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply" />
        <div className="absolute top-20 right-20 text-white/10 animate-pulse"><Leaf size={120} /></div>
        <div className="absolute bottom-40 left-20 text-white/10 animate-bounce" style={{ animationDuration: '4s' }}><Sun size={80} /></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 w-full max-w-2xl p-12 lg:p-16 xl:p-20 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 lg:p-10 shadow-2xl">
            <h3 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-6">
              Empowering farmers with <span className="text-emerald-400">smart insights.</span>
            </h3>
            <ul className="space-y-5 mb-10">
              {[
                { text: 'Real-time Mandi market prices', icon: <Droplets className="w-5 h-5 text-emerald-400" /> },
                { text: 'AI-driven crop disease detection', icon: <Leaf className="w-5 h-5 text-emerald-400" /> },
                { text: 'Personalized weather & harvest alerts', icon: <Sun className="w-5 h-5 text-emerald-400" /> },
              ].map((item, i) => (
                <li key={i} className="flex items-center text-emerald-50 text-lg font-medium">
                  <div className="bg-white/10 p-2 rounded-lg mr-4 flex-shrink-0 border border-white/10">{item.icon}</div>
                  {item.text}
                </li>
              ))}
            </ul>
            <div className="pt-8 border-t border-white/10 flex items-center">
              <div className="flex -space-x-4 mr-5">
                {[
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
                  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
                ].map((src, i) => (
                  <img key={i} src={src} alt="Farmer" className="w-12 h-12 rounded-full border-2 border-emerald-900 object-cover" />
                ))}
              </div>
              <div>
                <div className="flex items-center mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white font-bold text-sm">Trusted by 50,000+ farmers</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
