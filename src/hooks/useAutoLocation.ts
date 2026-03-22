import { useEffect } from 'react';
import { STATES_DISTRICTS } from '@/utils/indiaStates';

export function useAutoLocation() {
  useEffect(() => {
    const savedState = localStorage.getItem('userState');
    const savedDistrict = localStorage.getItem('userDistrict');
    
    // Request location only if not previously saved
    if (!savedState || !savedDistrict) {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
                headers: {
                  'Accept-Language': 'en'
                }
              });
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
              console.error("Failed to auto-detect location", err);
            }
          },
          (error) => {
            console.error("Geolocation permission denied or failed:", error);
          }
        );
      }
    }
  }, []);
}
