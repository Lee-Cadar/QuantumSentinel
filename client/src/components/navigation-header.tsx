import { useState } from "react";
import { Bell, Menu, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function NavigationHeader() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts"],
  });

  const activeAlertCount = alerts.length;

  return (
    <header className="bg-white shadow-lg border-b-4" style={{ borderBottomColor: 'var(--emergency-red)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="text-white p-2 rounded-lg" style={{ backgroundColor: 'var(--emergency-red)' }}>
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AXIOM Sentinel</h1>
              <p className="text-sm text-neutral-gray">AI-Powered Emergency Management</p>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <a href="#dashboard" className="font-semibold border-b-2 pb-1" style={{ color: 'var(--emergency-red)', borderBottomColor: 'var(--emergency-red)' }}>
              Dashboard
            </a>
            <a href="#predictions" className="text-neutral-gray transition-colors" style={{ color: 'var(--neutral-gray)' }}>
              Predictions
            </a>
            <a href="#incidents" className="text-neutral-gray transition-colors" style={{ color: 'var(--neutral-gray)' }}>
              Incidents
            </a>
            <a href="#optimization" className="text-neutral-gray transition-colors" style={{ color: 'var(--neutral-gray)' }}>
              Routes
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <button className="text-white p-2 rounded-lg transition-colors" style={{ backgroundColor: 'var(--emergency-red)' }}>
                <Bell className="h-5 w-5" />
              </button>
              {activeAlertCount > 0 && (
                <span 
                  className="absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--warning-orange)' }}
                >
                  {activeAlertCount}
                </span>
              )}
            </div>
            
            <button 
              className="md:hidden text-neutral-gray"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-slate-200">
          <nav className="px-4 py-2 space-y-2">
            <a href="#dashboard" className="block py-2 font-semibold" style={{ color: 'var(--emergency-red)' }}>Dashboard</a>
            <a href="#predictions" className="block py-2" style={{ color: 'var(--neutral-gray)' }}>Predictions</a>
            <a href="#incidents" className="block py-2" style={{ color: 'var(--neutral-gray)' }}>Incidents</a>
            <a href="#optimization" className="block py-2" style={{ color: 'var(--neutral-gray)' }}>Routes</a>
          </nav>
        </div>
      )}
    </header>
  );
}
