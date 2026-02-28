'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CloudRain, ShieldAlert, Users } from 'lucide-react'; // Example icons

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: <Home size={28} /> },
    { name: 'Weather', path: '/dashboard/weather', icon: <CloudRain size={28} /> },
    { name: 'Disease', path: '/dashboard/disease-detection', icon: <ShieldAlert size={28} /> },
    { name: 'Community', path: '/dashboard/community', icon: <Users size={28} /> },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe sm:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.name} href={item.path} className={`flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-krishi-green' : 'text-gray-500'}`}>
              {item.icon}
              <span className="text-xs font-medium mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}