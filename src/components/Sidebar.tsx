import { 
  LayoutDashboard, 
  Droplet, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Bot, 
  Heart, 
  Bell,
  LogOut,
  Fish,
  ShoppingCart,
  Wheat,
  ShoppingBag,
  Scissors
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { User } from '../types';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  user: User;
}

export default function Sidebar({ currentPage, onPageChange, onLogout, user }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tanks', label: 'Tank Management', icon: Droplet },
    { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
    { id: 'harvest', label: 'Harvest', icon: Scissors },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
    { id: 'accounting', label: 'Accounting', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'fish-types', label: 'Fish Types', icon: Fish },
    { id: 'food-types', label: 'Food Types', icon: Wheat },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'health', label: 'Health Library', icon: Heart },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="w-64 bg-[#0A4D68] text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-[#088395] p-2 rounded-lg">
            <Fish className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold">FishFarm360</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-[#088395] text-white">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate font-medium">{user.name}</p>
            <p className="text-xs text-gray-300 capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                isActive 
                  ? 'bg-[#088395] text-white' 
                  : 'text-gray-200 hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}