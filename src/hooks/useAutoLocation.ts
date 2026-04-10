import { useEffect } from 'react';
import { STATES_DISTRICTS } from '@/utils/indiaStates';

// 🔥 FIX 2: Global lock to prevent Next.js Strict Mode from double-firing the API
let isFetchingLocation = false;

export function useAutoLocation() {
  useEffect(() => {
    // If a request is already in flight, don't fire another one
    if (isFetchingLocation) return;

    const savedState = localStorage.getItem('userState');
    const savedDistrict = localStorage.getItem('userDistrict');
    
    // Request location only if not previously saved
    if (!savedState || !savedDistrict) {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        
        isFetchingLocation = true; // Lock the request
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              
              // 🔥 FIX 1: Added email parameter to bypass OpenStreetMap's anonymous block
              const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&email=admin@krishimitra.in`;
              
              const res = await fetch(url, {
                headers: {
                  'Accept-Language': 'en'
                }
              });

              // Catch HTTP 429 Too Many Requests before trying to parse JSON
              if (!res.ok) {
                throw new Error(`Nominatim API rejected request: ${res.status}`);
              }

              const data = await res.json();
              
              if (data && data.address) {
                const apiState = data.address.state;
                const apiDistrict = data.address.state_district || data.address.county || data.address.city || "";
                
                // 1. Normalize State against our robust list
                const matchedState = Object.keys(STATES_DISTRICTS).find(
                  s => s.toLowerCase() === apiState?.toLowerCase()
                ) || apiState;

                // 2. Normalize District against the specific state's list
                let matchedDistrict = apiDistrict.replace(/District/i, '').trim();
                if (matchedState && STATES_DISTRICTS[matchedState]) {
                  const exactDistrict = STATES_DISTRICTS[matchedState].find(
                    d => d.toLowerCase() === matchedDistrict.toLowerCase()
                  );
                  if (exactDistrict) matchedDistrict = exactDistrict;
                }

                // Save to local storage and broadcast to active pages
                if (matchedState && matchedDistrict) {
                  localStorage.setItem('userState', matchedState);
                  localStorage.setItem('userDistrict', matchedDistrict);
                  window.dispatchEvent(new Event('locationUpdated'));
                }
              }
            } catch (err) {
              // Changed to console.warn so it doesn't break your terminal build logs
              console.warn("Location fetch blocked (likely rate-limited by OpenStreetMap).", err);
            } finally {
              // Release the lock after a 2-second cooldown to respect the API limits
              setTimeout(() => { isFetchingLocation = false; }, 2000);
            }
          },
          (error) => {
            console.warn("Geolocation permission denied or failed:", error);
            isFetchingLocation = false; // Release lock on error
          }
        );
      }
    }
  }, []);
}