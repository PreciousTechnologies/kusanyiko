import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, User, Phone, Mail, MapPin, CalendarDays, X } from 'lucide-react';
import { userManagementAPI, membersAPI } from '../../services/api';
import { toast } from 'sonner';
import { PageHeader } from '../../components/app-shell';
import { SectionCard, ClayButton, StatusPill, EmptyState } from '../../components/ui-bits';
import { DataTable } from '../../components/data-table';
import { TableSkeleton } from '../../components/skeleton-loaders';
import { springs, variants } from '../../lib/motion-tokens';

interface Member {
  id: any;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  age: number;
  marital_status: string;
  saved: boolean;
  church_registration_number: string;
  country: string;
  region: string;
  center_area: string;
  zone: string;
  cell: string;
  postal_address: string;
  mobile_no: string;
  email: string;
  church_position: string;
  visitors_count: number;
  origin: string;
  residence: string;
  career: string;
  attending_date: string;
  picture: string;
  created_at: string;
}

interface SystemUser {
  id: any;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
}

const SearchMembers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    userManagementAPI.getUsers().then(
      (r) => setUsers(r.data || []),
      () => undefined
    );
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim() && !selectedUser) {
      toast.warning('Please enter a search term or select a user');
      return;
    }
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedUser) params.created_by = selectedUser;
      const response = await membersAPI.getMembers(params);
      const list = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
      setMembers(list);
      setSelectedMember(null);
      setSearched(true);
      if (list.length === 0) toast.info('No members found matching your search criteria');
    } catch {
      toast.error('Failed to search members');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Member Search" subtitle="Cross-system lookup across all registrars" />

      <SectionCard title="Search Controls" subtitle="Name, phone, email or registrar filter">
        <div className="flex flex-col lg:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus-ring"
            />
          </div>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-semibold focus-ring lg:w-64">
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={String(u.id)} value={String(u.id)}>
                {u.first_name} {u.last_name} ({u.username})
              </option>
            ))}
          </select>
          <ClayButton tone="primary" loading={loading} icon={<Search className="w-4 h-4" />} onClick={handleSearch}>
            Search
          </ClayButton>
        </div>
      </SectionCard>

      <SectionCard title={`Results ${searched ? `(${members.length})` : ''}`} subtitle={searched ? 'Click a row to inspect' : 'Run a search to populate'}>
        {loading ? (
          <TableSkeleton rows={6} />
        ) : !searched ? (
          <EmptyState icon={<Search className="w-6 h-6" />} title="Search the register" message="Enter a name, phone or email — or pick a registrar — then Search." />
        ) : (
          <DataTable
            columns={[
              {
                key: 'member',
                label: 'Member',
                render: (_v, row: Member) => (
                  <button onClick={() => setSelectedMember(row)} className="flex items-center gap-3 min-w-0 text-left">
                    <span className="w-9 h-9 rounded-xl bg-[var(--secondary)] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {row.picture ? (
                        // eslint-disable-next-line jsx-a11y/img-redundant-alt
                        <img src={row.picture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold truncate">{row.first_name} {row.middle_name} {row.last_name}</span>
                      <span className="block text-xs text-muted-foreground">by {(row as any).created_by_name || 'Unknown'}</span>
                    </span>
                  </button>
                ),
              },
              {
                key: 'mobile_no',
                label: 'Contact',
                render: (v, row: Member) => (
                  <span>
                    <span className="tnum flex items-center gap-1.5 text-[13px] font-semibold"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{v}</span>
                    {row.email && <span className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5"><Mail className="w-3.5 h-3.5" />{row.email}</span>}
                  </span>
                ),
              },
              {
                key: 'residence',
                label: 'Residence',
                render: (v, row: Member) => (
                  <span className="flex items-center gap-1.5 text-[13px]"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{v || row.region || '—'}</span>
                ),
              },
              {
                key: 'attending_date',
                label: 'Joined',
                render: (v) => <span className="tnum flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="w-3.5 h-3.5" />{formatDate(v)}</span>,
              },
              {
                key: 'saved',
                label: 'Status',
                render: (v, row: Member) => (
                  <span className="flex items-center gap-1.5">
                    <StatusPill stage={v ? 'Saved' : 'Not Saved'} tone={v ? 'success' : 'warning'} />
                    <span className="text-[11px] text-muted-foreground capitalize">{row.gender}</span>
                  </span>
                ),
              },
            ]}
            data={members}
            searchPlaceholder="Filter these results…"
            defaultPageSize={10}
            emptyTitle="No members found"
            emptyMessage="Try a different term or registrar."
          />
        )}
      </SectionCard>

      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div variants={variants.backdropFade} initial="initial" animate="animate" exit="exit" onClick={() => setSelectedMember(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div variants={variants.modalPanel} initial="initial" animate="animate" exit="exit" transition={springs.gentle} className="glass-strong relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
                <h2 className="font-display text-base font-bold">Member Details</h2>
                <button onClick={() => setSelectedMember(null)} className="p-2 rounded-full text-muted-foreground hover:bg-[var(--secondary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-5">
                <span className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedMember.picture ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img src={selectedMember.picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">{selectedMember.first_name} {selectedMember.middle_name} {selectedMember.last_name}</h3>
                  <p className="text-xs text-muted-foreground">Age {selectedMember.age} • {selectedMember.gender} • {selectedMember.marital_status}</p>
                  <p className="text-xs text-muted-foreground">By {(selectedMember as any).created_by_name || 'Unknown'} on {formatDate(selectedMember.created_at)}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-[13px]">
                {[
                  { h: 'Contact', rows: [['Phone', selectedMember.mobile_no], ['Email', selectedMember.email || 'N/A'], ['Address', selectedMember.postal_address || 'N/A']] },
                  { h: 'Location', rows: [['Country', selectedMember.country], ['Region', selectedMember.region], ['Zone', selectedMember.zone], ['Cell', selectedMember.cell]] },
                  { h: 'Church', rows: [['Reg #', selectedMember.church_registration_number || 'N/A'], ['Position', selectedMember.church_position || 'N/A'], ['Origin', selectedMember.origin], ['Visitors', String(selectedMember.visitors_count)]] },
                  { h: 'Personal', rows: [['Career', selectedMember.career || 'N/A'], ['Attending', formatDate(selectedMember.attending_date)], ['Saved', selectedMember.saved ? 'Yes' : 'No']] },
                ].map((s) => (
                  <div key={s.h} className="rounded-2xl border border-[var(--border)] p-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{s.h}</h4>
                    {s.rows.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 py-1">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="tnum font-semibold text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchMembers;
