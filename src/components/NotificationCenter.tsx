import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Bell,
  AlertTriangle,
  Info,
  Check,
  X,
  Mail,
  MessageSquare,
  Smartphone
} from 'lucide-react';
import { User } from '../types';
import { apiPatch } from '../api';

interface NotificationCenterProps {
  user: User;
  notifications: any[];
  onUpdateNotifications: (notifications: any[]) => void;
}

export default function NotificationCenter({ user, notifications, onUpdateNotifications }: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'tasks'>('all');

  // Notification preferences
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [inventoryAlerts, setInventoryAlerts] = useState(true);
  const [healthAlerts, setHealthAlerts] = useState(true);

  const isPendingTask = (status: any) =>
    status === 'not responded' || status === true || status === 'true';

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'critical') return notif.priority === 'critical';
    if (filter === 'tasks') return isPendingTask(notif.requiresAction);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length;
  const pendingTasksCount = notifications.filter(n => isPendingTask(n.requiresAction)).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiPatch(`/notifications/${id}/read`, {});
      onUpdateNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleAction = async (id: string, confirmed: boolean) => {
    console.log(`🎯 Sending action for ${id}: confirmed = ${confirmed}`);
    try {
      const resp = await apiPatch(`/notifications/${id}/action?confirmed=${confirmed}`, {});
      console.log("✅ Action Response:", resp);
      onUpdateNotifications(notifications.map(n =>
        n.id === id ? { ...n, requiresAction: String(confirmed) } : n
      ));
    } catch (err) {
      console.error("❌ Failed to handle action:", err);
      // Fallback for demo if API fails
      if (id.startsWith('debug-')) {
        onUpdateNotifications(notifications.map(n =>
          n.id === id ? { ...n, requiresAction: String(confirmed) } : n
        ));
      }
    }
  };

  const handleMarkAllAsRead = () => {
    onUpdateNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    onUpdateNotifications(notifications.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Notification Center</h1>
          <p className="text-gray-600">Manage alerts and communication preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-dashed border-blue-400 text-blue-600 hover:bg-blue-50"
            onClick={() => {
              const debugNotif = {
                id: 'debug-' + Date.now(),
                title: 'التنبيه التفاعلي - تجربة',
                message: 'هذا إشعار تجريبي لاختبار أزرار "تأكيد" و "رفض".',
                type: 'alert',
                priority: 'high',
                timestamp: new Date().toISOString(),
                read: false,
                requiresAction: 'not responded'
              };
              onUpdateNotifications([debugNotif, ...notifications]);
            }}
          >
            <Bell className="w-4 h-4 mr-2" />
            إشعار تجريبي
          </Button>
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Notifications</CardTitle>
            <Bell className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{notifications.length}</div>
            <p className="text-xs text-gray-600 mt-1">{unreadCount} unread</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Critical Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600">{criticalCount}</div>
            <p className="text-xs text-gray-600 mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Pending Tasks</CardTitle>
            <Check className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-orange-600">{pendingTasksCount}</div>
            <p className="text-xs text-gray-600 mt-1">Actions required</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences">
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'critical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('critical')}
                >
                  Critical ({criticalCount})
                </Button>
                <Button
                  variant={filter === 'tasks' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('tasks')}
                  className={pendingTasksCount > 0 ? "border-orange-500 text-orange-700 bg-orange-50" : ""}
                >
                  Tasks ({pendingTasksCount})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredNotifications.map(notification => {
                  const Icon = getNotificationIcon(notification.type);

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all ${getNotificationColor(notification.priority)
                        } ${!notification.read ? 'border-l-4' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${notification.priority === 'critical' ? 'text-red-600' :
                          notification.priority === 'high' ? 'text-orange-600' :
                            notification.priority === 'medium' ? 'text-yellow-600' :
                              'text-blue-600'
                          }`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                                {notification.title}
                              </p>
                              <Badge className={getPriorityBadgeColor(notification.priority)} variant="outline">
                                {notification.priority}
                              </Badge>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                          </div>

                          <p className="text-sm text-gray-700 mb-2">
                            {notification.message}
                          </p>

                          {isPendingTask(notification.requiresAction) && (
                            <div className="flex items-center gap-2 mb-3 bg-blue-50/50 p-2 rounded-md border border-blue-100">
                              <p className="text-xs font-medium text-blue-700 mr-2">Action Required:</p>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 h-8"
                                onClick={() => handleAction(notification.id, true)}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                                onClick={() => handleAction(notification.id, false)}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}

                          {(notification.requiresAction === 'true' || notification.requiresAction === true) && (
                            <div className="flex items-center gap-1 mb-2">
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                <Check className="w-3 h-3 mr-1" />
                                Action Confirmed
                              </Badge>
                            </div>
                          )}

                          {(notification.requiresAction === 'false' || notification.requiresAction === false) && (
                            <div className="flex items-center gap-1 mb-2">
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                                <X className="w-3 h-3 mr-1" />
                                Action Rejected
                              </Badge>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Mark Read
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredNotifications.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No notifications</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {filter === 'unread'
                        ? "You're all caught up!"
                        : filter === 'critical'
                          ? "No critical alerts at this time"
                          : "You'll see notifications here"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notification Channels</CardTitle>
              <p className="text-xs text-gray-600">
                Choose how you want to receive alerts
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm">Email Notifications</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>
                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm">SMS Alerts</p>
                    <p className="text-xs text-gray-600">{user.phone}</p>
                  </div>
                </div>
                <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-green-700" />
                  <div>
                    <p className="text-sm">WhatsApp</p>
                    <p className="text-xs text-gray-600">{user.phone}</p>
                  </div>
                </div>
                <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Alert Types</CardTitle>
              <p className="text-xs text-gray-600">
                Customize which alerts you want to receive
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm">Critical System Alerts</p>
                    <p className="text-xs text-gray-600">
                      Water quality issues, equipment failures
                    </p>
                  </div>
                </div>
                <Switch checked={criticalAlerts} onCheckedChange={setCriticalAlerts} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm">Inventory Alerts</p>
                    <p className="text-xs text-gray-600">
                      Low stock, expiring items
                    </p>
                  </div>
                </div>
                <Switch checked={inventoryAlerts} onCheckedChange={setInventoryAlerts} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm">Health & Disease Alerts</p>
                    <p className="text-xs text-gray-600">
                      Disease detection, mortality spikes
                    </p>
                  </div>
                </div>
                <Switch checked={healthAlerts} onCheckedChange={setHealthAlerts} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm">Daily Reports</p>
                    <p className="text-xs text-gray-600">
                      Performance summaries, growth updates
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm">Scheduled Tasks</p>
                    <p className="text-xs text-gray-600">
                      Feeding reminders, sampling schedules
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quiet Hours</CardTitle>
              <p className="text-xs text-gray-600">
                Set times when non-critical notifications are paused
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm">Enable Quiet Hours</p>
                  <p className="text-xs text-gray-600">
                    10:00 PM - 7:00 AM
                  </p>
                </div>
                <Switch />
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Note: Critical alerts will always be delivered immediately
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>Save Preferences</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
