import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { toast } from 'sonner';
import { Mail, Send, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const EmailNotificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    dueToday: 0,
    dueTomorrow: 0,
    overdue: 0,
    totalBorrowed: 0
  });
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentNotifications();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: borrowed, error } = await supabase
        .from('asset_borrowing')
        .select(`
          id,
          expected_return_date,
          status,
          assets (
            asset_tag,
            name
          )
        `)
        .eq('status', 'active');

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const dueToday = borrowed.filter(item => 
        item.expected_return_date === today
      ).length;

      const dueTomorrow = borrowed.filter(item => 
        item.expected_return_date === tomorrow
      ).length;

      const overdue = borrowed.filter(item => 
        new Date(item.expected_return_date) < new Date(today)
      ).length;

      setStats({
        dueToday,
        dueTomorrow,
        overdue,
        totalBorrowed: borrowed.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select(`
          id,
          notification_type,
          recipient_email,
          sent_at,
          status,
          asset_borrowing (
            assets (
              asset_tag,
              name
            )
          )
        `)
        .order('sent_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const triggerManualReminders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('trigger_return_reminders');
      
      if (error) throw error;

      toast.success('Email reminders have been sent successfully!');
      fetchStats();
      fetchRecentNotifications();
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error('Failed to send email reminders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testEmailFunction = async () => {
    setLoading(true);
    try {
      // Test the email function with a sample email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'test@example.com', // Replace with your test email
          subject: 'Test Email - Asset Management System',
          html: `
            <h2>Test Email</h2>
            <p>This is a test email from the IT Asset Management System.</p>
            <p>If you receive this email, the email notification system is working correctly.</p>
            <p>Time sent: ${new Date().toLocaleString()}</p>
          `
        }
      });

      if (error) throw error;

      toast.success('Test email sent successfully!');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNotificationType = (type) => {
    switch (type) {
      case 'return_reminder_tomorrow':
        return 'Due Tomorrow';
      case 'return_reminder_overdue':
        return 'Overdue';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Due Today</p>
              <p className="text-2xl font-bold text-red-600">{stats.dueToday}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Due Tomorrow</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.dueTomorrow}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Total Borrowed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalBorrowed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-4">
        <Button 
          onClick={triggerManualReminders}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <Send className="h-4 w-4" />
          <span>{loading ? 'Sending...' : 'Send Reminders Now'}</span>
        </Button>

        <Button 
          onClick={testEmailFunction}
          disabled={loading}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Mail className="h-4 w-4" />
          <span>Test Email Function</span>
        </Button>

        <Button 
          onClick={() => {
            fetchStats();
            fetchRecentNotifications();
          }}
          variant="outline"
        >
          Refresh Data
        </Button>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Recent Email Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentNotifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications sent yet</p>
            ) : (
              recentNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded-full ${
                      notification.notification_type === 'return_reminder_overdue' 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {notification.notification_type === 'return_reminder_overdue' 
                        ? <AlertTriangle className="h-3 w-3" />
                        : <Clock className="h-3 w-3" />
                      }
                    </div>
                    <div>
                      <p className="font-medium">{formatNotificationType(notification.notification_type)}</p>
                      <p className="text-sm text-gray-600">
                        To: {notification.recipient_email}
                      </p>
                      {notification.asset_borrowing?.assets && (
                        <p className="text-sm text-gray-500">
                          Asset: {notification.asset_borrowing.assets.asset_tag} - {notification.asset_borrowing.assets.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(notification.sent_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(notification.sent_at).toLocaleTimeString()}
                    </p>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      notification.status === 'sent' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {notification.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Email Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium mb-2">1. Deploy the Email Function</h4>
            <code className="bg-gray-100 p-2 rounded block">
              supabase functions deploy send-email
            </code>
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Set Email Provider API Key</h4>
            <code className="bg-gray-100 p-2 rounded block">
              supabase secrets set RESEND_API_KEY=your_resend_api_key
            </code>
          </div>
          <div>
            <h4 className="font-medium mb-2">3. Run the Database Setup</h4>
            <p>Execute the <code>email_notifications_setup.sql</code> file in your Supabase SQL editor.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">4. Schedule Daily Execution</h4>
            <p>The system is configured to run daily at 9:00 AM. You can also trigger it manually using the button above.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailNotificationSettings;