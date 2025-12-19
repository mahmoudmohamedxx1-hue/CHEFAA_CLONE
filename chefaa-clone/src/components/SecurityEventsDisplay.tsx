import React, { useState, useEffect } from 'react';
import { SecurityAPI } from '../lib/securityAPI';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './ui/card';
import { Alert } from './ui/alert';

type SecurityEvent = {
  event_type: string;
  risk_level: string;
  anomaly_score: number;
  created_at: string;
  details: any;
};

export default function SecurityEventsDisplay() {
  const { user } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSecurityEvents();
    }
  }, [user]);

  const loadSecurityEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await SecurityAPI.getSecurityEvents(50);
      setEvents(result.events || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load security events');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'login':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'failed_login':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'password_change':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        );
      case 'account_access':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-gray-600">Please log in to view security events</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Security Events</h2>
        <button
          onClick={loadSecurityEvents}
          disabled={loading}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
          {error}
        </Alert>
      )}

      {loading && events.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="mt-2 text-gray-600">No security events recorded</p>
          <p className="text-sm text-gray-500">Your account activity will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold capitalize">
                        {event.event_type.replace(/_/g, ' ')}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRiskLevelColor(
                          event.risk_level
                        )}`}
                      >
                        {event.risk_level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(event.created_at)}
                    </p>
                    
                    {event.details && (
                      <div className="mt-2 text-sm text-gray-700">
                        {event.details.ip_address && (
                          <p>IP: {event.details.ip_address}</p>
                        )}
                        {event.details.location && (
                          <p>Location: {event.details.location}</p>
                        )}
                        {event.details.user_agent && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {event.details.user_agent}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ml-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Anomaly Score</p>
                    <p className="text-lg font-bold">
                      {(event.anomaly_score * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Understanding Risk Levels</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-gray-700">Low: Normal activity</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-gray-700">Medium: Unusual but likely safe</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="text-gray-700">High: Suspicious activity detected</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-gray-700">Critical: Immediate attention required</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
