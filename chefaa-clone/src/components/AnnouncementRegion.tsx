import React, { useEffect, useState } from 'react';

interface Announcement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

interface AnnouncementRegionProps {
  announcements?: Announcement[];
}

const AnnouncementRegion: React.FC<AnnouncementRegionProps> = ({ announcements = [] }) => {
  const [politeAnnouncements, setPoliteAnnouncements] = useState<Announcement[]>([]);
  const [assertiveAnnouncements, setAssertiveAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (announcements.length === 0) return;

    const latest = announcements[announcements.length - 1];
    
    if (latest.priority === 'assertive') {
      setAssertiveAnnouncements([latest]);
      // Clear after a short delay to allow screen reader to read
      setTimeout(() => setAssertiveAnnouncements([]), 1000);
    } else {
      setPoliteAnnouncements([latest]);
      setTimeout(() => setPoliteAnnouncements([]), 1000);
    }
  }, [announcements]);

  return (
    <>
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncements.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>

      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncements.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>
    </>
  );
};

export default AnnouncementRegion;
