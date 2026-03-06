export const getLocalISOString = (date: Date = new Date()): string => {
  const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, -1);
  return localISOTime;
};

export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalTimeString = (date: Date = new Date()): string => {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const formatDisplayTime = (timeString: string): string => {
  if (!timeString) return '';
  // Append a dummy date to parse the time string if needed, or just return it if it's already formatted
  // Assuming timeString is HH:MM:SS
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const calculateDuration = (checkIn: string, checkOut: string): string => {
  if (!checkIn || !checkOut) return '-';

  const [inHours, inMinutes] = checkIn.split(':').map(Number);
  const [outHours, outMinutes] = checkOut.split(':').map(Number);

  const start = new Date();
  start.setHours(inHours, inMinutes, 0);

  const end = new Date();
  end.setHours(outHours, outMinutes, 0);

  const diffMs = end.getTime() - start.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${diffHrs}h ${diffMins}m`;
};
