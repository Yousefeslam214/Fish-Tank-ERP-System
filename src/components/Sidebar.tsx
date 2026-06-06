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
  Scissors,
  ShieldUser,
  ListChecks,
  Cpu,
  Tractor,
  Pill,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { User } from "../types";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  user: User;
  notifications: any[];
  allowedPages: string[];
  moduleLabelMap: Record<string, string>;
}

export default function Sidebar({
  currentPage,
  onPageChange,
  onLogout,
  user,
  notifications,
  allowedPages,
  moduleLabelMap,
}: SidebarProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const isTechnician = user.role.toLocaleLowerCase() === "technician";
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tanks", label: "Tank Management", icon: Droplet },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "harvest", label: "Harvest", icon: Scissors },
    { id: "fish-types", label: "Fish Types", icon: Fish },
    { id: "food-types", label: "Food Types", icon: Wheat },
    { id: "medicine-types", label: "Medicine Types", icon: Pill },
    { id: "health", label: "Health Library", icon: Heart },
    { id: "ai-assistant", label: "AI Assistant", icon: Bot },
    { id: "iot-management", label: "Sensors readings", icon: Cpu },
    { id: "farms", label: "Farms", icon: Tractor },
    { id: "users", label: "User Management", icon: ShieldUser },

    { id: "tasks", label: "Tasks", icon: ListChecks },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: "sales",
      label: "Sales",
      icon: ShoppingBag,
      comingSoon: true,
    },
    {
      id: "accounting",
      label: "Accounting",
      icon: DollarSign,
      comingSoon: true,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      comingSoon: true,
    },
    {
      id: "procurement",
      label: "Procurement",
      icon: ShoppingCart,
      comingSoon: true,
    },
  ];
  const visibleMenuItems = menuItems.filter(
    (item) =>
      (allowedPages.includes(item.id) || item.comingSoon) &&
      !(isTechnician && item.id === "tasks"),
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const normalizedId = item.id.toLowerCase();
          const baseLabel = moduleLabelMap[normalizedId] || item.label;
          const label = item.comingSoon
            ? `${baseLabel} (Coming Soon)`
            : baseLabel;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (!item.comingSoon) onPageChange(item.id);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 transition-colors ${item.comingSoon ? "opacity-50 cursor-not-allowed" : ""} ${
                isActive
                  ? "bg-[#088395] text-white"
                  : "text-gray-200 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="text-sm">{label}</span>
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
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
