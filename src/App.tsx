import { useState, useEffect, useMemo } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TankManagement from './components/TankManagement';
import Accounting from './components/Accounting';
import Inventory from './components/Inventory';
import Analytics from './components/Analytics';
import AIAssistant from './components/AIAssistant';
import HealthLibrary from './components/HealthLibrary';
import NotificationCenter from './components/NotificationCenter';
import Procurement from './components/Procurement';
import SalesModule from './components/SalesModule';
import FishTypeManagement from './components/FishTypeManagement';
import FoodTypeManagement from './components/FoodTypeManagement';
import { HarvestManagement } from './components/HarvestManagement';
import Tasks from './components/Tasks';
import Sidebar from './components/Sidebar';
import UserManagement from './components/UserManagement';
import { Toaster } from './components/ui/sonner';
import { User, Farm } from './types';
import { clearAuthSession, getStoredAppUser, getAccessToken } from './services/authSession';
import { apiGet, API_BASE } from './api';
import { mockFarms } from './mockData';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getMetadata } from './services/metaApi';
import { buildModuleLabelMap, isPageAllowed, resolveAllowedPages } from './services/moduleAccess';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [moduleLabelMap, setModuleLabelMap] = useState<Record<string, string>>({});

  const allowedPages = useMemo(() => {
    if (!currentUser) {
      return ['dashboard'];
    }
    return resolveAllowedPages(currentUser);
  }, [currentUser]);

  useEffect(() => {
    const user = getStoredAppUser();
    if (user) {
      setCurrentUser(user);
      fetchFarms(user);
    }
  }, []);



  useEffect(() => {
    if (!currentUser) return;

    const controller = new AbortController();

    const asRecord = (value: unknown): Record<string, unknown> =>
      value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

    const toText = (value: unknown): string => {
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      return '';
    };

    const formatMessage = (template: string, data: Record<string, unknown>) => {
      if (!template) return '';
      let formatted = template;
      Object.entries(data).forEach(([key, value]) => {
        formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return formatted;
    };

    const parseTimestampValue = (value: unknown): Date | null => {
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        const normalized = Math.abs(value) < 1e12 ? value * 1000 : value;
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
      }

      if (typeof value === 'string' && value.trim()) {
        const trimmed = value.trim();
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          const numericValue = Number(trimmed);
          if (Number.isFinite(numericValue)) {
            const normalized = Math.abs(numericValue) < 1e12 ? numericValue * 1000 : numericValue;
            const date = new Date(normalized);
            if (!Number.isNaN(date.getTime())) return date;
          }
        }

        const date = new Date(trimmed);
        return Number.isNaN(date.getTime()) ? null : date;
      }

      return null;
    };

    const pickTimestamp = (...values: unknown[]): string => {
      for (const value of values) {
        const parsed = parseTimestampValue(value);
        if (parsed) return parsed.toISOString();
      }
      return new Date().toISOString();
    };

    const mapIncomingNotification = (payload: unknown) => {
      const root = asRecord(payload);
      const nested = asRecord(root.notification);
      const notification = Object.keys(nested).length > 0 ? nested : root;

      const eventType = toText(root.type).toLowerCase();
      if (eventType === 'connected' || eventType === 'heartbeat') {
        return null;
      }

      const data = asRecord(notification.data);

      const subjectTemplate =
        toText(notification.subject) ||
        toText(root.subject) ||
        toText(data.subject) ||
        toText(notification.title);

      const bodyTemplate =
        toText(notification.body) ||
        toText(root.body) ||
        toText(notification.message) ||
        toText(root.message) ||
        toText(data.body);

      const subject = formatMessage(subjectTemplate, data).trim();
      const message = formatMessage(bodyTemplate, data).trim();
      const title =
        toText(notification.title) ||
        toText(root.title) ||
        subject ||
        toText(notification.templateName) ||
        toText(root.templateName) ||
        'Notification';

      if (!subject && !message && !toText(notification.id) && !toText(root.id)) {
        return null;
      }

      const statusKey = toText(data.status).toUpperCase();
      const priorityKey = toText(notification.priority).toLowerCase();
      const priorityMap: Record<string, string> = {
        CRITICAL: 'critical',
        HIGH: 'high',
        WARNING: 'medium',
        INFO: 'low',
      };

      const normalizedPriority =
        priorityKey === 'critical' || priorityKey === 'high' || priorityKey === 'medium' || priorityKey === 'low'
          ? priorityKey
          : (priorityMap[statusKey] || 'medium');

      return {
        id: toText(notification.id) || toText(root.id) || Math.random().toString(36).slice(2, 11),
        title,
        subject: subject || title,
        message,
        type: 'alert',
        priority: normalizedPriority,
        timestamp: pickTimestamp(
          notification.timestamp,
          root.timestamp,
          notification.createdAt,
          root.createdAt,
          notification.created_at,
          root.created_at,
          notification.sentAt,
          root.sentAt,
        ),
        read: false,
        data,
      };
    };

    const connectToSSE = async () => {
      console.log('Attempting to connect to Notification Stream...');
      try {
        const token = getAccessToken();
        await fetchEventSource(`${API_BASE}/notifications/stream`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
          async onopen(response) {
            if (!response.ok) {
              console.error('Failed to connect to notifications stream:', response.status, response.statusText);
            }
          },
          onmessage(ev) {
            const raw = typeof ev.data === 'string' ? ev.data.trim() : String(ev.data ?? '').trim();
            if (!raw || raw === '[DONE]') {
              return;
            }
            const looksLikeJson = raw.startsWith('{') || raw.startsWith('[');
            if (!looksLikeJson) {
              return;
            }

            try {
              const payload = JSON.parse(raw);
              const newNotification = mapIncomingNotification(payload);
              if (!newNotification) {
                return;
              }

              setNotifications((prev: any[]) => {
                const existingIndex = prev.findIndex((item) => item.id === newNotification.id);
                if (existingIndex === -1) {
                  return [newNotification, ...prev];
                }
                const next = [...prev];
                next[existingIndex] = { ...next[existingIndex], ...newNotification };
                return next;
              });
            } catch (err) {
              console.error('Failed to parse notification event:', err);
            }
          },
          onerror(err) {
            console.warn('SSE connection error, retrying...', err);
            throw err;
          },
        });
      } catch (err) {
        console.error('SSE fatal error:', err);
      }
    };

    void connectToSSE();

    return () => {
      controller.abort();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setModuleLabelMap({});
      return;
    }

    let cancelled = false;

    const loadMetadataModules = async () => {
      try {
        const metadata = await getMetadata();
        if (!cancelled) {
          setModuleLabelMap(buildModuleLabelMap(metadata.modules));
        }
      } catch {
        if (!cancelled) {
          setModuleLabelMap({});
        }
      }
    };

    void loadMetadataModules();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    if (!isPageAllowed(currentPage, allowedPages)) {
      setCurrentPage(allowedPages[0] || 'dashboard');
    }
  }, [allowedPages, currentPage, currentUser]);



  const fetchFarms = async (user: User) => {
    try {
      const res = await apiGet<any>('/farms');
      const apiFarms = res.data || (Array.isArray(res) ? res : []);

      if (apiFarms.length > 0) {
        const farm = apiFarms.find((f: any) => f.id === user.farmId) || apiFarms[0];
        setSelectedFarm(farm);
      } else if (user.farmId) {
        // Fallback to mock if needed, but only if they belong to one
        const mockFarm = mockFarms.find(f => f.id === user.farmId);
        if (mockFarm) setSelectedFarm(mockFarm);
      }
    } catch (err) {
      console.error('Failed to fetch farms:', err);
      // Fallback
      if (user.farmId) {
        const mockFarm = mockFarms.find(f => f.id === user.farmId);
        if (mockFarm) setSelectedFarm(mockFarm);
      }
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    fetchFarms(user);
  };

  const handlePageChange = (page: string) => {
    if (!isPageAllowed(page, allowedPages)) {
      return;
    }
    setCurrentPage(page);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    clearAuthSession();
    setCurrentPage('dashboard');
    setSelectedFarm(null);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLogout={handleLogout}
        user={currentUser}
        notifications={notifications}
        allowedPages={allowedPages}
        moduleLabelMap={moduleLabelMap}
      />

      <div className="flex-1 overflow-auto">
        {currentPage === 'dashboard' && (
          <Dashboard
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'tanks' && (
          <TankManagement
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'accounting' && (
          <Accounting
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'inventory' && (
          <Inventory
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'analytics' && (
          <Analytics
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'ai-assistant' && (
          <AIAssistant user={currentUser} />
        )}
        {currentPage === 'health' && (
          <HealthLibrary
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'notifications' && (
          <NotificationCenter
            user={currentUser}
            notifications={notifications}
            onUpdateNotifications={setNotifications}
          />
        )}
        {currentPage === 'tasks' && (
          <Tasks user={currentUser} />
        )}
        {currentPage === 'procurement' && (
          <Procurement
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'sales' && (
          <SalesModule
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'fish-types' && (
          <FishTypeManagement
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'food-types' && (
          <FoodTypeManagement
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'users' && (
          <UserManagement
            user={currentUser}
            selectedFarm={selectedFarm}
          />
        )}
        {currentPage === 'harvest' && (
          <HarvestManagement
            farmId={selectedFarm?.id || 'farm-1'}
          />
        )}
      </div>
      <Toaster />
    </div>
  );
}
