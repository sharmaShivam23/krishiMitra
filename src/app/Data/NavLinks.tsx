import { 
  LayoutDashboard, Leaf, CloudSun, 
  Activity, MessageSquare, FileText, Briefcase, Bot, Store 
} from 'lucide-react';

// Removed 'role' since DashboardLayout handles the role logic now!
export const getNavLinks = (t: any) => [
  { id: 'overview', name: t('nav.overview'), href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'cropIntel', name: t('nav.cropIntel'), href: '/dashboard/crop-intelligence', icon: <Leaf className="w-5 h-5" /> },
  { id: 'mandi', name: t('nav.mandi'), href: '/dashboard/mandi-prices', icon: <Activity className="w-5 h-5" /> },
  { id: 'disease', name: t('nav.disease'), href: '/dashboard/disease-detection', icon: <Bot className="w-5 h-5" /> }, 
  { id: 'products', name: t('nav.products'), href: '/dashboard/products', icon: <Store className="w-5 h-5" /> },
  { id: 'services', name: t('nav.services'), href: '/dashboard/Services', icon: <Briefcase className="w-5 h-5" /> }, 
  { id: 'weather', name: t('nav.weather'), href: '/dashboard/weather', icon: <CloudSun className="w-5 h-5" /> },
  { id: 'community', name: t('nav.community'), href: '/dashboard/community', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'schemes', name: t('nav.schemes'), href: '/dashboard/schemes', icon: <FileText className="w-5 h-5" /> },
];