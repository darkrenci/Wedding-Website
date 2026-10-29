import { WeddingDetails } from '../types/wedding';

export function generateGoogleCalendarUrl(wedding: WeddingDetails): string {
  // Event starts at 4:00 PM (16:00) on July 17, 2027
  // Format: YYYYMMDDTHHmmssZ
  const startTime = '20270717T200000Z'; // 4:00 PM EDT is 20:00 UTC
  const endTime = '20270718T030000Z';   // 11:00 PM EDT is 03:00 UTC next day

  const title = encodeURIComponent(`${wedding.brideName} & ${wedding.groomName}'s Wedding`);
  const details = encodeURIComponent(
    `We can't wait to celebrate our special day with you!\n\nCeremony & Reception at ${wedding.venueName}, ${wedding.locationCity}.\nRSVP & Info: ${wedding.contactEmail}`
  );
  const location = encodeURIComponent(`${wedding.venueName}, ${wedding.venueAddress}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
}

export function downloadIcsFile(wedding: WeddingDetails): void {
  const title = `${wedding.brideName} & ${wedding.groomName}'s Wedding`;
  const description = `We can't wait to celebrate our special day with you! Ceremony & Reception at ${wedding.venueName}.`;
  const location = `${wedding.venueName}, ${wedding.venueAddress}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Emma and Andre Wedding//Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:wedding-emma-andre-2027@invitation',
    'DTSTAMP:20261026T000000Z',
    'DTSTART:20270717T200000Z',
    'DTEND:20270718T030000Z',
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${wedding.brideName.toLowerCase()}-${wedding.groomName.toLowerCase()}-wedding.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
