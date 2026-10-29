export interface WeddingDetails {
  brideName: string;
  groomName: string;
  coupleInitials: string;
  tagline: string;
  introHeading: string;
  weddingDate: string; // ISO date or '2027-07-17'
  dateFormatted: string; // 'Saturday, 17 July 2027'
  monthYear: string; // 'JULY 2027'
  dayNumber: number; // 17
  locationCity: string; // 'New York City'
  venueName: string; // 'The Plaza Hotel'
  venueAddress: string; // '768 5th Ave, New York, NY 10019'
  rsvpDeadline: string; // 'January 2027'
  contactEmail: string; // 'wedding@emmaandre.com'
  primaryColor: string; // burgundy '#4a0e17'
  envelopeBg: string;
  couplePhotoUrl?: string;
}

export interface InvitedGuest {
  id: string;
  name: string;
  allocatedInvitations: number; // e.g. 4 for John Padilla
  rsvpStatus?: 'pending' | 'accepted' | 'declined';
  attendingCount?: number;
  companionNames?: string[];
  email?: string;
  dietary?: string;
  wishes?: string;
}

export interface RSVPResponse {
  id: string;
  guestName: string;
  attending: 'accepted' | 'declined';
  guestCount: number;
  companionNames?: string[];
  email: string;
  dietary?: string;
  wishes?: string;
  submittedAt: string;
  allocatedInvitations?: number;
}
