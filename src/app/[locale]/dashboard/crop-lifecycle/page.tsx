'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, Calendar, CheckCircle2, Circle, Loader2, Plus, Sprout,
  AlertCircle, TrendingUp, Trophy, Star, Sparkles, MapPin, ChevronDown, X
} from 'lucide-react';

/* ─── Full Indian States & Districts data ─── */
const INDIA_STATES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Tirupati","Rajahmundry","Kakinada","Eluru","Ongole","Anantapur","Chittoor","Srikakulam","Vizianagaram","West Godavari","East Godavari","Krishna","Prakasam","Sri Potti Sri Ramulu Nellore","YSR Kadapa"],
  "Arunachal Pradesh": ["Itanagar","Tawang","Bomdila","Pasighat","Naharlagun","Ziro","Along","Tezu","Aalo","Changlang"],
  "Assam": ["Guwahati","Dibrugarh","Jorhat","Silchar","Tezpur","Nagaon","Tinsukia","Bongaigaon","Dhubri","Sivasagar","Karimganj","Hailakandi","Cachar"],
  "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur","Darbhanga","Arrah","Begusarai","Katihar","Saharsa","Purnia","Munger","Nalanda","Saran","Vaishali","Sitamarhi"],
  "Chhattisgarh": ["Raipur","Bilaspur","Durg","Korba","Rajnandgaon","Jagdalpur","Raigarh","Ambikapur","Dhamtari","Kanker"],
  "Goa": ["North Goa","South Goa"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Gandhinagar","Junagadh","Anand","Mehsana","Patan","Banaskantha","Sabarkantha","Kheda","Amreli","Botad","Chhota Udaipur","Dahod","Dang","Devbhoomi Dwarka"],
  "Haryana": ["Gurugram","Faridabad","Rohtak","Hisar","Panipat","Ambala","Yamunanagar","Sonipat","Karnal","Bhiwani","Fatehabad","Jhajjar","Jind","Kaithal","Kurukshetra","Mahendragarh","Mewat","Palwal","Panchkula","Rewari","Sirsa"],
  "Himachal Pradesh": ["Shimla","Mandi","Solan","Dharamsala","Kullu","Hamirpur","Una","Bilaspur","Chamba","Kinnaur","Lahaul and Spiti","Sirmaur"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro","Hazaribagh","Dumka","Deoghar","Giridih","Ramgarh","Gumla","Lohardaga","Pakur","Palamu"],
  "Karnataka": ["Bengaluru","Mysuru","Hubballi","Mangaluru","Belagavi","Kalaburagi","Ballari","Vijayapura","Shivamogga","Tumakuru","Raichur","Udupi","Hassan","Dharwad","Chikkamagaluru","Chitradurga","Davangere","Kodagu","Kolar","Mandya"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam","Malappuram","Alappuzha","Kannur","Palakkad","Kasaragod","Kottayam","Idukki","Pathanamthitta","Wayanad"],
  "Madhya Pradesh": ["Bhopal","Indore","Jabalpur","Gwalior","Ujjain","Sagar","Ratlam","Satna","Murwara","Singrauli","Rewa","Burhanpur","Khandwa","Bhind","Chhindwara","Guna","Shivpuri","Vidisha","Chhatarpur","Damoh"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Thane","Aurangabad","Solapur","Amravati","Kolhapur","Nanded","Sangli","Jalgaon","Akola","Latur","Dhule","Ahmednagar","Chandrapur","Parbhani","Ratnagiri","Satara","Osmanabad","Beed","Hingoli","Jalna","Nandurbar","Wardha","Washim","Yavatmal"],
  "Manipur": ["Imphal","Thoubal","Bishnupur","Churachandpur","Senapati","Ukhrul","Chandel","Tamenglong","Jiribam"],
  "Meghalaya": ["Shillong","Tura","Jowai","Nongpoh","Baghmara","East Khasi Hills","West Khasi Hills","Ri Bhoi","East Garo Hills","West Garo Hills","East Jaintia Hills","West Jaintia Hills"],
  "Mizoram": ["Aizawl","Lunglei","Champhai","Kolasib","Lawngtlai","Mamit","Saiha","Serchhip"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung","Tuensang","Wokha","Mon","Zunheboto","Phek","Longleng","Kiphire","Peren"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Sambalpur","Puri","Berhampur","Balasore","Bhadrak","Baripada","Jeypore","Barbil","Jharsuguda","Angul","Bolangir","Dhenkanal","Kendujhar","Koraput","Rayagada","Sundargarh","Kandhamal"],
  "Punjab": ["Amritsar","Ludhiana","Jalandhar","Patiala","Bathinda","Mohali","Gurdaspur","Firozpur","Hoshiarpur","Ropar","Faridkot","Fazilka","Fatehgarh Sahib","Kapurthala","Mansa","Moga","Muktsar","Nawanshahr","Pathankot","Sangrur","Tarn Taran"],
  "Rajasthan": ["Jaipur","Jodhpur","Kota","Bikaner","Ajmer","Udaipur","Bhilwara","Alwar","Sikar","Sri Ganganagar","Pali","Barmer","Nagaur","Chittorgarh","Jhalawar","Dholpur","Dungarpur","Hanumangarh","Karauli","Sawai Madhopur","Tonk","Baran","Bundi","Churu","Dausa","Jaisalmer","Jalore","Jhunjhunu","Pratapgarh","Rajsamand","Sirohi"],
  "Sikkim": ["Gangtok","Mangan","Namchi","Gyalshing","East Sikkim","West Sikkim","North Sikkim","South Sikkim"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Tiruppur","Ranipet","Vellore","Erode","Thoothukudi","Dindigul","Thanjavur","Kancheepuram","Cuddalore","Nagercoil","Ariyalur","Chengalpattu","Dharmapuri","Kallakurichi","Karur","Krishnagiri","Mayiladuthurai","Nagapattinam","Namakkal","Perambalur","Pudukkottai","Ramanathapuram","Sivaganga","Tenkasi","The Nilgiris","Tirupattur","Tiruvannamalai","Virudhunagar"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam","Ramagundam","Mahabubnagar","Nalgonda","Adilabad","Suryapet","Siddipet","Vikarabad","Wanaparthy","Yadadri Bhuvanagiri","Jagtial","Jangaon","Jogulamba Gadwal","Kamareddy","Kumuram Bheem","Mahabubabad","Mancherial","Medchal-Malkajgiri","Mulugu","Nagarkurnool","Narayanpet","Nirmal","Pedapalli","Rajanna Sircilla","Sangareddy","Bhadradri Kothagudem","Hanamkonda","Medak"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar","Kailashahar","Ambassa","West Tripura","East Tripura","North Tripura","South Tripura","Dhalai","Gomati","Khowai","Sepahijala","Unakoti"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Allahabad","Meerut","Noida","Ghaziabad","Bareilly","Aligarh","Moradabad","Saharanpur","Gorakhpur","Firozabad","Jhansi","Muzaffarnagar","Mathura","Budaun","Rampur","Shahjahanpur","Farrukhabad","Mau","Hapur","Etawah","Mirzapur","Bulandshahr","Sambhal","Ambedkar Nagar","Fatehpur","Raebareli","Orai","Bahraich","Modinagar","Unnao","Jaunpur","Lakhimpur","Hathras","Banda","Pilibhit","Barabanki","Khurja","Gonda","Mainpuri","Lalitpur","Etah","Deoria","Bahraich","Hardoi"],
  "Uttarakhand": ["Dehradun","Haridwar","Roorkee","Haldwani","Rudrapur","Kashipur","Rishikesh","Pithoragarh","Almora","Nainital","Chamoli","Champawat","Pauri Garhwal","Tehri Garhwal","Ukhimath","Uttarkashi"],
  "West Bengal": ["Kolkata","Asansol","Siliguri","Durgapur","Bardhaman","Malda","Baharampur","Muzaffarpur","Habra","Bharatpur","Jalpaiguri","Kharagpur","Midnapore","Darjeeling","Cooch Behar","Alipurduar","Bankura","Birbhum","Dakshin Dinajpur","Hooghly","Howrah","Jhargram","Kalimpong","Murshidabad","Nadia","North 24 Parganas","Paschim Bardhaman","Paschim Medinipur","Purba Bardhaman","Purba Medinipur","Purulia","South 24 Parganas","Uttar Dinajpur"],
  "Delhi": ["New Delhi","Central Delhi","East Delhi","North Delhi","North East Delhi","North West Delhi","Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"],
  "Jammu and Kashmir": ["Srinagar","Jammu","Anantnag","Baramulla","Kathua","Sopore","Poonch","Rajouri","Bandipora","Budgam","Doda","Ganderbal","Kishtwar","Kulgam","Kupwara","Pulwama","Ramban","Reasi","Samba","Shopian","Udhampur"],
  "Ladakh": ["Leh","Kargil"],
  "Chandigarh": ["Chandigarh"],
  "Puducherry": ["Puducherry","Karaikal","Mahe","Yanam"],
};

const STATE_LIST = Object.keys(INDIA_STATES).sort();

export default function CropLifecyclePage() {
  const [activeCrops, setActiveCrops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [userProfile, setUserProfile] = useState<{ state?: string; district?: string } | null>(null);

  const [newCropData, setNewCropData] = useState({
    cropName: '',
    startDate: '',
    state: '',
    district: '',
  });

  // Districts filtered to selected state
  const districtList = newCropData.state ? (INDIA_STATES[newCropData.state] || []) : [];

  // Fetch user profile for default state/district (auth_token sent automatically as HttpOnly cookie)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            const u = data.user;
            setUserProfile({ state: u.state, district: u.district });
            setNewCropData(prev => ({
              ...prev,
              state: u.state || '',
              district: u.district || '',
            }));
          }
        }
      } catch (e) { console.error('Failed to load profile:', e); }
    };
    fetchProfile();
  }, []);

  const fetchActiveCrops = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/crop-lifecycle');
      const text = await res.text();
      if (!text) { setIsLoading(false); return; }
      const data = JSON.parse(text);
      if (data.success) setActiveCrops(data.activeCrops);
    } catch (e) {
      console.error('Failed to fetch crops:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchActiveCrops(); }, []);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/crop-lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCropData),
      });
      const text = await res.text();
      if (!text) throw new Error('Empty response');
      const data = JSON.parse(text);
      if (data.success) {
        setActiveCrops(prev => [data.activeCrop, ...prev]);
        setShowAddForm(false);
        setNewCropData(prev => ({ ...prev, cropName: '', startDate: '' }));
      } else {
        alert(data.error || 'Failed to generate plan.');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while generating the plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (cropId: string, taskId: string, currentStatus: boolean) => {
    setActiveCrops(prev =>
      prev.map(crop =>
        crop._id === cropId
          ? { ...crop, tasks: crop.tasks.map((t: any) => t._id === taskId ? { ...t, isCompleted: !currentStatus } : t) }
          : crop
      )
    );
    try {
      await fetch('/api/crop-lifecycle/task', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeCropId: cropId, taskId, isCompleted: !currentStatus }),
      });
    } catch (e) { console.error('Failed to update task', e); }
  };

  const inputClass = "w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal transition-all";
  const selectClass = "w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none text-gray-900 font-semibold transition-all appearance-none cursor-pointer";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-8 rounded-3xl shadow-xl gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <div className="bg-emerald-400/20 p-2 rounded-xl">
              <Sprout className="w-7 h-7 text-emerald-300" />
            </div>
            Smart Crop Manager
          </h1>
          <p className="text-emerald-200 font-medium">AI-powered day-by-day guides tailored to your field.</p>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-emerald-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center shadow-lg whitespace-nowrap gap-2"
        >
          {showAddForm ? <><X className="w-5 h-5" /> Cancel</> : <><Plus className="w-5 h-5" /> Add Crop</>}
        </button>
      </div>

      {/* ADD CROP FORM */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            key="add-form"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleGeneratePlan}
            className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-100 p-2 rounded-xl">
                <Leaf className="w-5 h-5 text-emerald-700" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Configure Your Field</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              {/* Crop Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">What are you planting? *</label>
                <input
                  required
                  value={newCropData.cropName}
                  onChange={e => setNewCropData(p => ({ ...p, cropName: e.target.value }))}
                  placeholder="e.g. Wheat, Sugarcane, Rice..."
                  className={inputClass}
                />
              </div>

              {/* Sowing Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Expected Sowing Date *</label>
                <input
                  required
                  type="date"
                  value={newCropData.startDate}
                  onChange={e => setNewCropData(p => ({ ...p, startDate: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  State *
                  {userProfile?.state && (
                    <span className="ml-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      from your profile
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    required
                    value={newCropData.state}
                    onChange={e => setNewCropData(p => ({ ...p, state: e.target.value, district: '' }))}
                    className={selectClass}
                  >
                    <option value="">— Select State —</option>
                    {STATE_LIST.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  District
                  {userProfile?.district && (
                    <span className="ml-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      from your profile
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={newCropData.district}
                    onChange={e => setNewCropData(p => ({ ...p, district: e.target.value }))}
                    disabled={!newCropData.state}
                    className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">— Select District —</option>
                    {districtList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Info banner */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-800 font-medium">
                Gemini AI will generate a personalized day-by-day farming schedule based on your crop, location, and sowing date.
              </p>
            </div>

            <button
              disabled={isGenerating}
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-4 rounded-xl flex justify-center items-center transition-all shadow-md disabled:opacity-70 gap-2"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> AI is building your custom plan...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate Smart Guide</>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* LOADING */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
          <p className="text-gray-500 font-semibold">Loading your crops...</p>
        </div>
      ) : activeCrops.length === 0 ? (
        /* EMPTY STATE */
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-emerald-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Leaf className="w-10 h-10 text-emerald-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Active Crops</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Click <strong>Add Crop</strong> to let KrishiMitra AI build your first farming schedule.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {activeCrops.map(crop => {
            const totalTasks = crop.tasks?.length || 0;
            const completedCount = crop.tasks?.filter((t: any) => t.isCompleted).length || 0;
            const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);
            const isAllDone = totalTasks > 0 && completedCount === totalTasks;

            return (
              <div key={crop._id} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">

                {/* Crop Header */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-emerald-100 flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-emerald-900 flex items-center gap-2">
                      <Sprout className="w-6 h-6 text-emerald-600" />
                      {crop.cropName}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <p className="text-emerald-700 font-semibold flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4" />
                        Started: {new Date(crop.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {(crop.location?.district || crop.location?.state) && (
                        <p className="text-emerald-600 font-semibold flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4" />
                          {[crop.location?.district, crop.location?.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                    isAllDone
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : 'bg-emerald-200 text-emerald-800'
                  }`}>
                    {isAllDone ? '🏆 Completed' : crop.status}
                  </span>
                </div>

                {/* PROGRESS BAR */}
                <div className="px-8 pt-6 pb-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-3 gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Overall Progress</h4>
                      <p className="text-4xl font-black text-emerald-600 leading-none mt-1">
                        {progressPercentage}%
                      </p>
                    </div>
                    <div className="text-left md:text-right flex flex-col gap-1 items-start md:items-end">
                      <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100 gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {completedCount}/{totalTasks} tasks completed
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${isAllDone ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* ✅ COMPLETION BANNER */}
                <AnimatePresence>
                  {isAllDone && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mx-6 mb-4 rounded-2xl overflow-hidden"
                    >
                      <div className="bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 p-8 text-center relative overflow-hidden">
                        {/* decorative circles */}
                        <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />

                        <div className="relative z-10">
                          <div className="flex justify-center mb-4">
                            <div className="bg-white/30 backdrop-blur-sm p-4 rounded-full shadow-lg">
                              <Trophy className="w-10 h-10 text-white" />
                            </div>
                          </div>
                          <h3 className="text-2xl font-black text-white mb-2">
                            🎉 Plan Complete!
                          </h3>
                          <p className="text-yellow-950/80 font-semibold text-sm mb-5 max-w-sm mx-auto">
                            Congratulations! You've successfully completed all <strong>{totalTasks} tasks</strong> for <strong>{crop.cropName}</strong>. Your field is on track for a great harvest!
                          </p>

                          {/* Stats Row */}
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Tasks Done', value: `${completedCount}/${totalTasks}` },
                              { icon: <Calendar className="w-5 h-5" />, label: 'Duration', value: (() => {
                                const start = new Date(crop.startDate);
                                const days = Math.round((Date.now() - start.getTime()) / 86400000);
                                return `${days} days`;
                              })() },
                              { icon: <Star className="w-5 h-5" />, label: 'Score', value: '100%' },
                            ].map((stat, i) => (
                              <div key={i} className="bg-white/25 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center gap-1">
                                <span className="text-white">{stat.icon}</span>
                                <span className="text-xl font-black text-white">{stat.value}</span>
                                <span className="text-xs text-yellow-950/70 font-bold">{stat.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Completed tasks summary strip */}
                      <div className="bg-emerald-900 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-200 text-sm font-semibold">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          All farming stages completed successfully
                        </div>
                        <span className="text-emerald-400 font-black text-sm">KrishiMitra AI ✓</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tasks Timeline */}
                <div className="p-8 pt-2">
                  <div className="relative border-l-2 border-emerald-100 ml-4 space-y-6">
                    {crop.tasks?.map((task: any) => {
                      const isOverdue = !task.isCompleted && new Date(task.scheduledDate) < new Date(new Date().setHours(0, 0, 0, 0));
                      const isToday = !task.isCompleted && new Date(task.scheduledDate).toDateString() === new Date().toDateString();

                      return (
                        <div key={task._id} className="relative pl-10">
                          {/* Timeline dot / checkbox */}
                          <button
                            onClick={() => handleToggleTask(crop._id, task._id, task.isCompleted)}
                            className="absolute -left-[18px] top-2 bg-white outline-none rounded-full hover:scale-110 transition-transform"
                          >
                            {task.isCompleted ? (
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 fill-emerald-50" />
                            ) : (
                              <Circle className="w-8 h-8 text-gray-300 hover:text-emerald-400 transition-colors" />
                            )}
                          </button>

                          <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                            task.isCompleted
                              ? 'bg-gray-50 border-gray-100 opacity-60'
                              : isToday
                                ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100 shadow-sm'
                                : isOverdue
                                  ? 'bg-red-50 border-red-200 shadow-sm'
                                  : 'bg-white border-gray-200 hover:border-emerald-200 hover:shadow-md shadow-sm'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                              <h3 className={`font-bold text-lg leading-snug ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {task.title}
                              </h3>
                              <span className={`text-xs font-bold px-3 py-1 rounded-full w-fit shrink-0 ${
                                task.isCompleted ? 'bg-emerald-100 text-emerald-700'
                                : isToday ? 'bg-emerald-500 text-white'
                                : isOverdue ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                              }`}>
                                {task.isCompleted ? '✓ Done' : isToday ? '📅 Due Today' : `Due: ${new Date(task.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                              </span>
                            </div>

                            <p className={`text-sm leading-relaxed ${task.isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                              {task.description}
                            </p>

                            {isOverdue && !task.isCompleted && (
                              <p className="text-red-600 text-xs font-bold mt-3 flex items-center gap-1.5 bg-red-100/60 w-fit px-3 py-1.5 rounded-lg">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                Overdue — please complete as soon as possible
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}