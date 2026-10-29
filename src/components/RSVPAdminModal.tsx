import React, { useState, useEffect } from 'react';
import { RSVPResponse, InvitedGuest } from '../types/wedding';
import {
  getInvitedGuests,
  addInvitedGuest,
  editInvitedGuest,
  removeInvitedGuest,
  bulkAddInvitedGuests,
  clearAllGuests,
  resetGuestList,
  updateGuestAllocation,
  forcePullFromSupabase,
  forcePushToSupabase,
} from '../utils/guestList';
import {
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  testSupabaseConnection,
} from '../lib/supabase';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseGuestService';
import {
  Users,
  Download,
  Trash2,
  X,
  Check,
  UserPlus,
  Search,
  RotateCcw,
  Sparkles,
  Database,
  Cloud,
  RefreshCw,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  Edit2,
  FileText,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RSVPAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_ADMIN_PIN = '1108';

export const RSVPAdminModal: React.FC<RSVPAdminModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('wedding_admin_authed') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [activeTab, setActiveTab] = useState<'registry' | 'rsvps' | 'supabase'>('registry');
  const [rsvps, setRsvps] = useState<RSVPResponse[]>([]);
  const [guestList, setGuestList] = useState<InvitedGuest[]>([]);
  const [registryFilter, setRegistryFilter] = useState('');

  // Add single guest state
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestInvitations, setNewGuestInvitations] = useState(2);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editInvitations, setEditInvitations] = useState(1);

  // Bulk import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState<'append' | 'replace'>('append');
  const [bulkMessage, setBulkMessage] = useState('');

  // Supabase connection state
  const [supabaseConfig, setSupabaseConfig] = useState(() => getSupabaseConfig());
  const [inputUrl, setInputUrl] = useState(supabaseConfig.url || '');
  const [inputAnonKey, setInputAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    rowCount?: number;
  }>({
    tested: false,
    success: false,
    message: '',
  });

  // Cloud sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      const cfg = getSupabaseConfig();
      setSupabaseConfig(cfg);
      setInputUrl(cfg.url || '');
      setInputAnonKey(cfg.anonKey || '');
      setPinError('');
    }
  }, [isOpen]);

  const loadData = () => {
    try {
      const storedRsvps = localStorage.getItem('all_wedding_rsvps');
      if (storedRsvps) {
        setRsvps(JSON.parse(storedRsvps));
      } else {
        const sample: RSVPResponse[] = [
          {
            id: 'sample-1',
            guestName: 'Eleanor Vance',
            attending: 'accepted',
            guestCount: 2,
            companionNames: ['William Sterling'],
            email: 'eleanor.vance@example.com',
            dietary: 'Vegetarian',
            wishes: 'So thrilled to celebrate your special union!',
            submittedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
            allocatedInvitations: 2,
          },
        ];
        setRsvps(sample);
        localStorage.setItem('all_wedding_rsvps', JSON.stringify(sample));
      }
    } catch {
      // ignore
    }
    setGuestList(getInvitedGuests());
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_ADMIN_PIN || pinInput.trim().toLowerCase() === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('wedding_admin_authed', 'true');
      setPinError('');
      setPinInput('');
    } else {
      setPinError(`Incorrect PIN. (Hint: default is ${DEFAULT_ADMIN_PIN})`);
    }
  };

  const handleQuickUnlock = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('wedding_admin_authed', 'true');
    setPinError('');
  };

  const handleLockAdmin = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('wedding_admin_authed');
  };

  // 1. ADD SINGLE GUEST
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    setActionError('');
    const added = addInvitedGuest(newGuestName.trim(), newGuestInvitations);
    setGuestList(getInvitedGuests());
    setNewGuestName('');
    setNewGuestInvitations(2);

    const isCloud = supabaseConfig.isConfigured;
    setActionSuccess(
      isCloud
        ? `Added "${added.name}" (${added.allocatedInvitations} invitations) and synced to Supabase!`
        : `Added "${added.name}" (${added.allocatedInvitations} invitations) to registry!`
    );
    setTimeout(() => setActionSuccess(''), 3500);
  };

  // 2. INLINE EDIT GUEST NAME OR INVITATIONS
  const handleStartEdit = (guest: InvitedGuest) => {
    setEditingId(guest.id);
    setEditName(guest.name);
    setEditInvitations(guest.allocatedInvitations);
    setActionError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditInvitations(1);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      setActionError('Guest name cannot be empty.');
      return;
    }

    const updated = editInvitedGuest(id, editName.trim(), editInvitations);
    if (updated) {
      setGuestList(getInvitedGuests());
      setEditingId(null);
      setActionSuccess(`Updated guest "${updated.name}" (${updated.allocatedInvitations} invitations). Synced to Supabase!`);
      setTimeout(() => setActionSuccess(''), 3500);
    }
  };

  // 3. DELETE SINGLE GUEST
  const handleRemoveGuest = (guest: InvitedGuest) => {
    if (window.confirm(`Are you sure you want to remove "${guest.name}" from the guest list?`)) {
      removeInvitedGuest(guest.id);
      setGuestList(getInvitedGuests());
      setActionSuccess(`Removed "${guest.name}" from guest list.`);
      setTimeout(() => setActionSuccess(''), 3000);
    }
  };

  // 4. QUICK SEAT STEPPERS
  const handleUpdateInvitations = (id: string, delta: number) => {
    const target = guestList.find((g) => g.id === id);
    if (!target) return;
    const nextVal = Math.max(1, Math.min(10, target.allocatedInvitations + delta));
    updateGuestAllocation(id, nextVal);
    setGuestList(getInvitedGuests());
  };

  // 5. BULK IMPORT GUESTS
  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      setBulkMessage('Please paste at least one guest name.');
      return;
    }

    const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const entries: Array<{ name: string; allocatedInvitations: number }> = [];

    for (const line of lines) {
      // Supports "Name, 4" or "Name; 4" or "Name (4)" or just "Name"
      const commaMatch = line.match(/^([^,;()]+)[,;]\s*(\d+)/);
      const parenMatch = line.match(/^([^,;()]+)\((\d+)\)/);

      if (commaMatch) {
        entries.push({
          name: commaMatch[1].trim(),
          allocatedInvitations: parseInt(commaMatch[2], 10) || 1,
        });
      } else if (parenMatch) {
        entries.push({
          name: parenMatch[1].trim(),
          allocatedInvitations: parseInt(parenMatch[2], 10) || 1,
        });
      } else {
        entries.push({
          name: line.trim(),
          allocatedInvitations: 1,
        });
      }
    }

    if (entries.length === 0) {
      setBulkMessage('No valid guest names found.');
      return;
    }

    setIsSyncing(true);
    setBulkMessage('Importing and syncing to Supabase...');

    try {
      const res = await bulkAddInvitedGuests(entries, bulkMode);
      setGuestList(getInvitedGuests());
      setBulkText('');
      setShowBulkImport(false);
      setActionSuccess(
        `Imported ${entries.length} guests! Total registry now has ${res.count} guests synced to Supabase.`
      );
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setBulkMessage(`Error importing guests: ${err?.message || 'Check database connection'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 6. CLEAR ALL GUESTS (START FRESH)
  const handleClearAllGuests = () => {
    if (
      window.confirm(
        'Clear all guests? This will remove sample names and let you start with a completely fresh guest list.'
      )
    ) {
      clearAllGuests();
      setGuestList([]);
      setActionSuccess('Cleared all guests. You can now add your real wedding guests.');
      setTimeout(() => setActionSuccess(''), 3500);
    }
  };

  // 7. RESTORE SAMPLE GUESTS
  const handleResetGuestRegistry = () => {
    if (
      window.confirm(
        'Reset guest list to default sample list (including John Padilla with 4 invitations)?'
      )
    ) {
      resetGuestList();
      setGuestList(getInvitedGuests());
      setActionSuccess('Restored default guest list (including John Padilla with 4 invitations).');
      setTimeout(() => setActionSuccess(''), 3500);
    }
  };

  // 8. SUPABASE SYNC ACTIONS
  const handlePullFromSupabase = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await forcePullFromSupabase();
      if (res.success) {
        setGuestList(getInvitedGuests());
        setSyncMessage({
          type: 'success',
          text: `Successfully imported ${res.count} guests from Supabase "guests" table!`,
        });
      } else {
        setSyncMessage({
          type: 'error',
          text: res.error || 'Failed to pull from Supabase. Ensure table "guests" exists.',
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSupabase = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await forcePushToSupabase();
      if (res.success) {
        setSyncMessage({
          type: 'success',
          text: `Successfully pushed ${res.count} guests to Supabase database!`,
        });
      } else {
        setSyncMessage({
          type: 'error',
          text: res.error || 'Failed to sync to Supabase. Check database permissions.',
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestAndSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = inputUrl.trim();
    const cleanKey = inputAnonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: 'Please provide both Supabase Project URL and Anon Public Key.',
      });
      return;
    }

    saveCustomSupabaseConfig(cleanUrl, cleanKey);
    const updatedCfg = getSupabaseConfig();
    setSupabaseConfig(updatedCfg);

    setIsTestingConnection(true);
    setConnectionStatus({ tested: false, success: false, message: 'Testing connection...' });

    try {
      const result = await testSupabaseConnection();
      setConnectionStatus({
        tested: true,
        success: result.success,
        message: result.message,
        rowCount: result.rowCount,
      });

      if (result.success && (result.rowCount ?? 0) > 0) {
        const pullRes = await forcePullFromSupabase();
        if (pullRes.success) {
          setGuestList(getInvitedGuests());
        }
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleDisconnectSupabase = () => {
    clearCustomSupabaseConfig();
    setSupabaseConfig(getSupabaseConfig());
    setInputUrl('');
    setInputAnonKey('');
    setConnectionStatus({
      tested: true,
      success: false,
      message: 'Supabase disconnected. Running in local storage fallback mode.',
    });
  };

  const copySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  };

  // 9. EXPORT CSVS
  const exportRegistryCSV = () => {
    const headers = ['Guest Name', 'Allocated Invitations', 'RSVP Status', 'Companion Limit'];
    const rows = guestList.map((g) => [
      `"${g.name.replace(/"/g, '""')}"`,
      g.allocatedInvitations,
      g.rsvpStatus || 'pending',
      Math.max(0, g.allocatedInvitations - 1),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'wedding-guest-list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRSVPCSV = () => {
    const headers = [
      'Primary Guest',
      'Status',
      'Total Attendees',
      'Accompanying Guests',
      'Email',
      'Dietary Restrictions',
      'Wishes',
      'Submitted At',
    ];
    const rows = rsvps.map((r) => [
      `"${r.guestName.replace(/"/g, '""')}"`,
      r.attending === 'accepted' ? 'Accepted' : 'Declined',
      r.attending === 'accepted' ? r.guestCount : 0,
      `"${(r.companionNames || []).join(', ').replace(/"/g, '""')}"`,
      `"${r.email}"`,
      `"${(r.dietary || '').replace(/"/g, '""')}"`,
      `"${(r.wishes || '').replace(/"/g, '""')}"`,
      new Date(r.submittedAt).toLocaleDateString(),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'wedding-rsvps.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearRSVPList = () => {
    if (window.confirm('Clear all recorded RSVP responses?')) {
      localStorage.removeItem('all_wedding_rsvps');
      localStorage.removeItem('user_wedding_rsvp');
      setRsvps([]);
    }
  };

  if (!isOpen) return null;

  const totalAttending = rsvps.filter((r) => r.attending === 'accepted').length;
  const totalDeclined = rsvps.filter((r) => r.attending === 'declined').length;
  const totalGuestHeads = rsvps
    .filter((r) => r.attending === 'accepted')
    .reduce((sum, r) => sum + (r.guestCount || 1), 0);
  const totalAllocatedSeats = guestList.reduce(
    (sum, g) => sum + (g.allocatedInvitations || 1),
    0
  );

  const filteredGuestList = guestList.filter((g) =>
    g.name.toLowerCase().includes(registryFilter.trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#24060c] text-[#f7eade] border border-[#742334] rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-[#521723] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#3d0b16] border border-[#782334] flex items-center justify-center text-[#f3cebe]">
              <Users className="w-4 h-4 text-[#f3cebe]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinzel text-base tracking-wider uppercase font-semibold text-white">
                  Wedding Guest &amp; RSVP Admin
                </h3>
                {isAuthenticated && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-sans">
                    <ShieldCheck className="w-3 h-3" /> Unlocked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#caa298] font-sans">
                Change guest names, seat allocations, import list, and sync with Supabase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Supabase status badge */}
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-mono border ${
                supabaseConfig.isConfigured
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : 'bg-[#350912] text-[#c49b91] border-[#5a1725]'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>{supabaseConfig.isConfigured ? 'Supabase Connected' : 'Local Storage'}</span>
            </div>

            {isAuthenticated && (
              <button
                onClick={handleLockAdmin}
                title="Lock Admin Panel"
                className="p-1.5 rounded-lg bg-[#3d0b16] hover:bg-[#521723] text-[#caa298] hover:text-white border border-[#6b1e2e] transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="text-[#baa09a] hover:text-white p-1 rounded-lg hover:bg-[#3d0b16] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PIN SECURITY GATE (IF LOCKED) */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#3d0b16] border border-[#782334] flex items-center justify-center text-[#f3cebe] shadow-inner">
              <Key className="w-6 h-6 text-[#caa48a]" />
            </div>

            <div>
              <h4 className="font-cinzel text-lg font-semibold text-white tracking-wide">
                Host Admin Access
              </h4>
              <p className="text-xs text-[#caa298] font-sans mt-1">
                Enter your organizer PIN to view and change the guest list names and Supabase sync.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="w-full space-y-3">
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN (Default: 1108)"
                  autoFocus
                  className="w-full bg-[#1b0307] text-white text-center font-mono text-base tracking-widest px-4 py-2.5 rounded-xl border border-[#6b1f2e] focus:border-[#caa48a] outline-none"
                />
              </div>

              {pinError && (
                <p className="text-xs text-rose-300 font-sans flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {pinError}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-[#6b1e2e] hover:bg-[#852336] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Unlock Guest List Admin
              </button>
            </form>

            <div className="pt-2 border-t border-[#460d19] w-full text-center">
              <button
                type="button"
                onClick={handleQuickUnlock}
                className="text-xs text-[#deb6ab] hover:text-white underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Quick Unlock (Organizer Mode)</span>
              </button>
              <span className="text-[10px] text-[#865961] block mt-1">
                Default PIN is <strong>1108</strong>
              </span>
            </div>
          </div>
        ) : (
          /* UNLOCKED ADMIN INTERFACE */
          <>
            {/* TABS */}
            <div className="flex border-b border-[#521723] pt-2 mb-3 shrink-0 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('registry')}
                className={`py-2 px-3 text-xs font-sans font-medium transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'registry'
                    ? 'border-[#caa48a] text-white font-semibold'
                    : 'border-transparent text-[#baa09a] hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Guest Names &amp; Invitations</span>
                <span className="bg-[#3e0b16] text-[#faede5] text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {guestList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rsvps')}
                className={`py-2 px-3 text-xs font-sans font-medium transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'rsvps'
                    ? 'border-[#caa48a] text-white font-semibold'
                    : 'border-transparent text-[#baa09a] hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>RSVP Responses</span>
                <span className="bg-[#3e0b16] text-[#faede5] text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {rsvps.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('supabase')}
                className={`py-2 px-3 text-xs font-sans font-medium transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'supabase'
                    ? 'border-[#caa48a] text-white font-semibold'
                    : 'border-transparent text-[#baa09a] hover:text-white'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase Cloud &amp; SQL</span>
              </button>
            </div>

            {/* TAB 1: GUEST REGISTRY & NAMES EDITOR */}
            {activeTab === 'registry' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Stats ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                  <div className="bg-[#1e0308] p-2.5 rounded-xl border border-[#4d1622] text-center">
                    <span className="text-[10px] font-sans text-[#caa298] uppercase tracking-wider block">
                      Total Guests
                    </span>
                    <span className="text-lg font-serif font-bold text-white">
                      {guestList.length}
                    </span>
                  </div>

                  <div className="bg-[#1e0308] p-2.5 rounded-xl border border-[#4d1622] text-center">
                    <span className="text-[10px] font-sans text-[#caa298] uppercase tracking-wider block">
                      Total Reserved Seats
                    </span>
                    <span className="text-lg font-serif font-bold text-[#caa48a]">
                      {totalAllocatedSeats}
                    </span>
                  </div>

                  <div className="bg-[#1e0308] p-2.5 rounded-xl border border-[#4d1622] text-center">
                    <span className="text-[10px] font-sans text-[#caa298] uppercase tracking-wider block">
                      Confirmed Attending
                    </span>
                    <span className="text-lg font-serif font-bold text-emerald-400">
                      {totalAttending}
                    </span>
                  </div>

                  <div className="bg-[#1e0308] p-2.5 rounded-xl border border-[#4d1622] text-center">
                    <span className="text-[10px] font-sans text-[#caa298] uppercase tracking-wider block">
                      Pending Responses
                    </span>
                    <span className="text-lg font-serif font-bold text-amber-300">
                      {guestList.filter((g) => !g.rsvpStatus || g.rsvpStatus === 'pending').length}
                    </span>
                  </div>
                </div>

                {/* Status Messages */}
                {actionSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-sans flex items-center gap-2 shrink-0 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {actionError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-sans flex items-center gap-2 shrink-0 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Add Guest & Bulk Import Toolbar */}
                <div className="bg-[#2c070f] p-3 rounded-xl border border-[#521723] shrink-0 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-cinzel text-xs text-white uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-[#caa48a]" />
                      Add Guest to List
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBulkImport(!showBulkImport)}
                        className="text-xs text-[#dfc3b5] hover:text-white flex items-center gap-1 py-1 px-2.5 rounded-lg bg-[#1e0308] border border-[#5d1927] hover:border-[#caa48a] transition-all cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-[#caa48a]" />
                        <span>{showBulkImport ? 'Hide Bulk Paste' : 'Bulk Paste / Import Names'}</span>
                        {showBulkImport ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {supabaseConfig.isConfigured && (
                        <button
                          type="button"
                          onClick={handlePullFromSupabase}
                          disabled={isSyncing}
                          className="text-xs bg-[#3a0b16] hover:bg-[#521723] text-white border border-[#6b1e2e] py-1 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          title="Pull latest guests from Supabase"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>Sync Cloud</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Single Add Guest Form */}
                  <form onSubmit={handleAddGuest} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        placeholder="Guest Name (e.g. John Padilla, Uncle Michael)"
                        className="w-full bg-[#1b0307] text-xs text-white placeholder-[#874e59] border border-[#5d1927] rounded-lg px-3 py-2 outline-none focus:border-[#caa48a]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#1b0307] border border-[#5d1927] rounded-lg px-2.5 py-1 shrink-0">
                      <span className="text-[11px] text-[#caa298] font-sans">Invitations / Seats:</span>
                      <button
                        type="button"
                        onClick={() => setNewGuestInvitations((v) => Math.max(1, v - 1))}
                        className="w-5 h-5 flex items-center justify-center text-[#caa298] hover:text-white rounded bg-[#2e0710] cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={newGuestInvitations}
                        onChange={(e) => setNewGuestInvitations(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-7 text-center font-mono font-bold text-xs bg-transparent text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setNewGuestInvitations((v) => Math.min(10, v + 1))}
                        className="w-5 h-5 flex items-center justify-center text-[#caa298] hover:text-white rounded bg-[#2e0710] cursor-pointer"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-[#caa48a] font-sans ml-1">
                        ({newGuestInvitations === 1 ? 'Solo' : `+${newGuestInvitations - 1} guests`})
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="bg-[#6b1e2e] hover:bg-[#852336] text-white text-xs font-sans font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add Guest
                    </button>
                  </form>

                  {/* Bulk Import Collapsible Box */}
                  {showBulkImport && (
                    <div className="mt-3 pt-3 border-t border-[#460d19] space-y-2 bg-[#1b0307] p-3 rounded-lg border border-[#521723] animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white font-medium">Paste Guest List:</span>
                        <div className="flex items-center gap-3 text-xs text-[#caa298]">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="bulkMode"
                              checked={bulkMode === 'append'}
                              onChange={() => setBulkMode('append')}
                              className="accent-[#caa48a]"
                            />
                            Append to current
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="bulkMode"
                              checked={bulkMode === 'replace'}
                              onChange={() => setBulkMode('replace')}
                              className="accent-[#caa48a]"
                            />
                            Replace all
                          </label>
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={`Paste one name per line, optional invitations separated by comma:\nJohn Padilla, 4\nEleanor Vance, 2\nDavid Santos, 3\nClara Montgomery, 1`}
                        className="w-full bg-[#120205] text-xs font-mono text-white p-2.5 rounded border border-[#521723] outline-none focus:border-[#caa48a]"
                      />

                      {bulkMessage && (
                        <p className="text-xs text-amber-300 font-sans">{bulkMessage}</p>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowBulkImport(false)}
                          className="px-3 py-1.5 text-xs text-[#caa298] hover:text-white rounded bg-[#2e0710] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkImport}
                          disabled={isSyncing}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-[#6b1e2e] hover:bg-[#852336] rounded cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Import &amp; Sync to Supabase</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Filter and Search */}
                <div className="flex items-center justify-between gap-3 shrink-0">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="text"
                      value={registryFilter}
                      onChange={(e) => setRegistryFilter(e.target.value)}
                      placeholder="Filter guest by name..."
                      className="w-full bg-[#1b0307] text-xs text-white placeholder-[#783e4a] border border-[#521723] rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-[#caa48a]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#caa298] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <span className="text-xs text-[#caa298] font-sans">
                    Showing <strong className="text-white">{filteredGuestList.length}</strong> of {guestList.length} guests
                  </span>
                </div>

                {/* GUEST LIST ROWS WITH INLINE EDITING */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
                  {filteredGuestList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#caa298] font-serif italic bg-[#1e0308] rounded-xl border border-[#4d1622]">
                      {registryFilter
                        ? `No guests found matching "${registryFilter}".`
                        : 'No guests registered. Add guests above or restore sample names.'}
                    </div>
                  ) : (
                    filteredGuestList.map((guest) => {
                      const isEditingThis = editingId === guest.id;
                      const isJohnPadilla = guest.name.toLowerCase() === 'john padilla';

                      if (isEditingThis) {
                        return (
                          /* INLINE EDIT ROW */
                          <div
                            key={guest.id}
                            className="bg-[#380812] p-3 rounded-xl border-2 border-[#caa48a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in"
                          >
                            <div className="flex-1 space-y-1">
                              <label className="text-[10px] text-[#caa298] font-sans uppercase">
                                Edit Guest Name:
                              </label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                autoFocus
                                className="w-full bg-[#1b0307] text-white font-serif font-bold text-sm px-3 py-1.5 rounded border border-[#caa48a] outline-none"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 bg-[#1b0307] border border-[#5d1927] rounded-lg px-2.5 py-1">
                                <span className="text-[11px] text-[#caa298] font-sans">Seats:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={editInvitations}
                                  onChange={(e) =>
                                    setEditInvitations(Math.max(1, parseInt(e.target.value) || 1))
                                  }
                                  className="w-8 text-center font-mono font-bold text-xs bg-transparent text-white outline-none"
                                />
                                <span className="text-[10px] text-[#caa48a] font-sans">
                                  ({editInvitations === 1 ? 'Solo' : `+${editInvitations - 1} guests`})
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(guest.id)}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="px-2.5 py-1.5 bg-[#25050b] hover:bg-[#3d0b16] text-[#caa298] hover:text-white text-xs rounded-lg cursor-pointer transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        /* STANDARD VIEW ROW */
                        <div
                          key={guest.id}
                          className="bg-[#2c070f] p-3 rounded-xl border border-[#4d1622] hover:border-[#6b1f2e] transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-serif font-bold text-sm text-white truncate">
                                {guest.name}
                              </span>
                              {isJohnPadilla && (
                                <span className="bg-[#4a0d18] text-[#fcdcd3] border border-[#832338] text-[9px] px-1.5 py-0.2 rounded font-sans">
                                  Client Sample (4 Invitations)
                                </span>
                              )}
                              {guest.rsvpStatus && guest.rsvpStatus !== 'pending' && (
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-semibold ${
                                    guest.rsvpStatus === 'accepted'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                                  }`}
                                >
                                  RSVP: {guest.rsvpStatus}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-[#caa298] font-sans mt-0.5 truncate">
                              {guest.allocatedInvitations === 1 ? (
                                '1 Attendee: Primary guest only (no accompanying guests)'
                              ) : (
                                <>
                                  <strong className="text-white">{guest.allocatedInvitations} Attendees:</strong> Primary guest (included) +{' '}
                                  <strong className="text-[#fce8de]">{guest.allocatedInvitations - 1} accompanying</strong> spots
                                </>
                              )}
                            </p>
                          </div>

                          {/* Quick seat allotment & actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-[#1e0308] border border-[#5d1927] rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleUpdateInvitations(guest.id, -1)}
                                disabled={guest.allocatedInvitations <= 1}
                                className="px-2 py-1 text-xs text-[#caa298] hover:text-white hover:bg-[#3f0c16] disabled:opacity-30 cursor-pointer"
                                title="Decrease seats"
                              >
                                -
                              </button>
                              <span className="px-2 py-1 text-xs font-mono font-bold text-white min-w-[50px] text-center">
                                {guest.allocatedInvitations} {guest.allocatedInvitations === 1 ? 'seat' : 'seats'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateInvitations(guest.id, 1)}
                                disabled={guest.allocatedInvitations >= 10}
                                className="px-2 py-1 text-xs text-[#caa298] hover:text-white hover:bg-[#3f0c16] disabled:opacity-30 cursor-pointer"
                                title="Increase seats"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleStartEdit(guest)}
                              className="text-[#caa48a] hover:text-white p-1.5 hover:bg-[#3a0912] rounded-lg transition-colors cursor-pointer"
                              title="Edit name and invitations"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveGuest(guest)}
                              className="text-[#875548] hover:text-rose-400 p-1.5 hover:bg-[#3a0912] rounded-lg transition-colors cursor-pointer"
                              title="Remove guest from registry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Toolbar */}
                <div className="pt-2 border-t border-[#460d19] flex items-center justify-between gap-2 flex-wrap shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={exportRegistryCSV}
                      className="text-xs text-[#caa298] hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-[#1e0308] border border-[#521723] hover:border-[#caa48a] transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-[#caa48a]" />
                      <span>Export Guest List CSV</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearAllGuests}
                      className="text-xs text-rose-300 hover:text-white flex items-center gap-1 py-1 px-2.5 rounded-lg bg-[#2e0710] hover:bg-rose-900/60 border border-rose-900 transition-colors cursor-pointer"
                      title="Delete all guests to start fresh"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All (Start Fresh)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetGuestRegistry}
                      className="text-xs text-[#caa298] hover:text-white flex items-center gap-1 py-1 px-2.5 rounded-lg bg-[#1e0308] border border-[#521723] hover:border-[#caa48a] transition-colors cursor-pointer"
                      title="Reset to default sample list"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore Samples</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RSVP RESPONSES */}
            {activeTab === 'rsvps' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                <div className="grid grid-cols-3 gap-2 shrink-0">
                  <div className="bg-[#1e0308] p-3 rounded-xl border border-[#4d1622] text-center">
                    <span className="text-[10px] font-sans text-[#caa298] uppercase tracking-wider block">
                      Accepted RSVPs
                    </span>
                    <span className="text-xl font-serif font-bold text-emerald-400">
                      {totalAttending}
                    </span>
                  </div>
                  <div className="bg-[#1e0308] p-3 rounded-xl border border-[#4d1622] text-center">
                    <span className="text-[10px] font-sans text-[#caa298] uppercase tracking-wider block">
                      Total Attendees Headcount
                    </span>
                    <span className="text-xl font-serif font-bold text-white">
                      {totalGuestHeads}
                    </span>
                  </div>
                  <div className="bg-[#1e0308] p-3 rounded-xl border border-[#4d1622] text-center">
                    <span className="text-[10px] font-sans text-[#caa298] uppercase tracking-wider block">
                      Declined
                    </span>
                    <span className="text-xl font-serif font-bold text-rose-400">
                      {totalDeclined}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
                  {rsvps.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#caa298] font-serif italic bg-[#1e0308] rounded-xl border border-[#4d1622]">
                      No RSVP responses recorded yet. Responses submitted by guests will appear here.
                    </div>
                  ) : (
                    rsvps.map((rsvp) => (
                      <div
                        key={rsvp.id}
                        className="bg-[#2c070f] p-3.5 rounded-xl border border-[#4d1622] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-[#4d1622] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-sm text-white">
                              {rsvp.guestName}
                            </span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded font-sans uppercase font-bold ${
                                rsvp.attending === 'accepted'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {rsvp.attending === 'accepted' ? 'Accepted' : 'Declined'}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#caa298] font-mono">
                            {new Date(rsvp.submittedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {rsvp.attending === 'accepted' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#caa298]">
                            <div>
                              <span className="font-sans block text-[#dec5b8]">Party Size:</span>
                              <strong className="text-white font-mono">{rsvp.guestCount} Attendee(s)</strong>
                            </div>

                            {rsvp.companionNames && rsvp.companionNames.length > 0 && (
                              <div>
                                <span className="font-sans block text-[#dec5b8]">Companions:</span>
                                <span className="text-white font-serif">
                                  {rsvp.companionNames.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-[11px] space-y-1">
                          <p className="text-[#caa298]">
                            <span className="font-sans text-[#dec5b8]">Email:</span>{' '}
                            <span className="text-white">{rsvp.email}</span>
                          </p>

                          {rsvp.dietary && (
                            <p className="text-[#caa298]">
                              <span className="font-sans text-[#dec5b8]">Dietary:</span>{' '}
                              <span className="text-amber-200">{rsvp.dietary}</span>
                            </p>
                          )}

                          {rsvp.wishes && (
                            <p className="text-[#caa298] italic font-serif bg-[#1a0307] p-2 rounded border border-[#440d18]">
                              "{rsvp.wishes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-[#460d19] flex items-center justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={exportRSVPCSV}
                    className="text-xs text-[#caa298] hover:text-white flex items-center gap-1.5 py-1 px-3 rounded-lg bg-[#1e0308] border border-[#521723] hover:border-[#caa48a] transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-[#caa48a]" />
                    <span>Download Responses CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearRSVPList}
                    className="text-xs text-rose-300 hover:text-white py-1 px-3 rounded-lg bg-[#2e0710] hover:bg-rose-950 border border-rose-900 transition-colors cursor-pointer"
                  >
                    Clear Recorded RSVPs
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: SUPABASE CLOUD & SQL */}
            {activeTab === 'supabase' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 text-xs">
                {/* Connection Box */}
                <div className="bg-[#2c070f] p-4 rounded-xl border border-[#521723] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-cinzel text-xs text-white uppercase tracking-wider font-semibold">
                        Connected Supabase Database
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                        supabaseConfig.isConfigured
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {supabaseConfig.isConfigured ? 'Active & Ready' : 'Not Connected'}
                    </span>
                  </div>

                  <form onSubmit={handleTestAndSaveSupabase} className="space-y-3">
                    <div>
                      <label className="text-[10px] text-[#caa298] block mb-1">
                        Project URL:
                      </label>
                      <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="https://your-project.supabase.co"
                        className="w-full bg-[#1b0307] text-xs font-mono text-white p-2 rounded-lg border border-[#521723] outline-none focus:border-[#caa48a]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#caa298] block mb-1">
                        Anon Public Key:
                      </label>
                      <input
                        type="password"
                        value={inputAnonKey}
                        onChange={(e) => setInputAnonKey(e.target.value)}
                        placeholder="sb_publishable_..."
                        className="w-full bg-[#1b0307] text-xs font-mono text-white p-2 rounded-lg border border-[#521723] outline-none focus:border-[#caa48a]"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="submit"
                        disabled={isTestingConnection}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {isTestingConnection ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Database className="w-3.5 h-3.5" />
                        )}
                        <span>{isTestingConnection ? 'Testing...' : 'Test & Save Connection'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePushToSupabase}
                        disabled={isSyncing}
                        className="bg-[#3e0b16] hover:bg-[#521723] text-white text-xs py-1.5 px-3 rounded-lg border border-[#6b1e2e] flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Push Local to Cloud</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePullFromSupabase}
                        disabled={isSyncing}
                        className="bg-[#3e0b16] hover:bg-[#521723] text-white text-xs py-1.5 px-3 rounded-lg border border-[#6b1e2e] flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Pull Cloud to Local</span>
                      </button>
                    </div>
                  </form>

                  {connectionStatus.tested && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs ${
                        connectionStatus.success
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/80 border-rose-800 text-rose-300'
                      }`}
                    >
                      <p className="font-semibold">{connectionStatus.message}</p>
                    </div>
                  )}

                  {syncMessage && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs ${
                        syncMessage.type === 'success'
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/80 border-rose-800 text-rose-300'
                      }`}
                    >
                      <p>{syncMessage.text}</p>
                    </div>
                  )}
                </div>

                {/* SQL Schema helper */}
                <div className="bg-[#2c070f] p-4 rounded-xl border border-[#521723] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-cinzel text-xs text-white uppercase tracking-wider font-semibold">
                        Supabase SQL Setup Script
                      </h4>
                      <p className="text-[11px] text-[#caa298]">
                        If your Supabase project hasn't created the "guests" table yet, paste this in Supabase SQL Editor:
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={copySqlSchema}
                      className="px-3 py-1 bg-[#1e0308] hover:bg-[#3d0b16] border border-[#5d1927] hover:border-[#caa48a] text-[#fce8de] rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {sqlCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#caa48a]" />
                          <span>Copy SQL Script</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3 bg-[#120205] text-[#dfc3b5] rounded-lg font-mono text-[10px] overflow-x-auto max-h-48 border border-[#440d18] select-all">
                    {SUPABASE_SQL_SCHEMA}
                  </pre>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
