import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, User, Phone, Mail, MapPin, CalendarDays, X } from 'lucide-react';
import { membersAPI } from '../../services/api';
import { toast } from 'sonner';
import { PageHeader } from '../../components/app-shell';
import { SectionCard, ClayButton, StatusPill, EmptyState } from '../../components/ui-bits';
import { DataTable } from '../../components/data-table';
import { TableSkeleton } from '../../components/skeleton-loaders';
import { springs, variants } from '../../lib/motion-tokens';
import ProfilePicture from '../../components/ui/ProfilePicture';

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

const MemberSearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.warning('Please enter a search term');
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await membersAPI.searchMembers(searchTerm.trim());
      const list = Array.isArray(response.data) ? response.data : [];
      setMembers(list);
      setSelectedMember(null);
      if (list.length === 0) {
        toast.info(`No members found with "${searchTerm.trim()}". Try a different search term.`);
      }
    } catch (error: any) {
      if (error.response) {
        toast.error(`Search failed: ${error.response.data?.detail || error.response.data?.message || 'Server error'}`);
      } else {
        toast.error('Network error: Unable to reach the server. Please try again.');
      }
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
      <PageHeader
        title="Member Verification"
        subtitle="Gate checkpoint — verify registrations by name, phone or email (read-only)"
      />

      <SectionCard
        title="Search the Register"
        subtitle="Results are verification-only; editing lives with registrars"
        action={<StatusPill stage="Checkpoint Active" tone="info" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              autoFocus
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-muted-foreground focus-ring"
            />
          </div>
          <ClayButton tone="primary" loading={loading} icon={<Search className="w-4 h-4" />}>
            Search Members
          </ClayButton>
        </form>
      </SectionCard>

      <SectionCard
        title={hasSearched ? `Results (${members.length})` : 'Results'}
        subtitle={hasSearched ? 'Click a row to verify details' : 'Run a search to populate'}
      >
        {loading ? (
          <TableSkeleton rows={6} />
        ) : !hasSearched ? (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title="Verify a member"
            message="Enter a name, phone number or email above, then Search."
          />
        ) : (
          <DataTable
            columns={[
              {
                key: 'member',
                label: 'Member',
                render: (_v, row: Member) => (
                  <button onClick={() => setSelectedMember(row)} className="flex items-center gap-3 min-w-0 text-left">
                    <span className="w-9 h-9 rounded-xl overflow-hidden bg-[var(--secondary)] flex-shrink-0 block">
                      <ProfilePicture
                        src={row.picture}
                        firstName={row.first_name}
                        lastName={row.last_name}
                        size="sm"
                        className="!w-full !h-full !ring-0 !border-0"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold truncate">
                        {row.first_name} {row.middle_name} {row.last_name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Age {row.age} • {row.gender} • {row.marital_status}
                      </span>
                    </span>
                  </button>
                ),
              },
              {
                key: 'mobile_no',
                label: 'Contact',
                render: (v, row: Member) => (
                  <span>
                    <span className="tnum flex items-center gap-1.5 text-[13px] font-semibold">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      {v}
                    </span>
                    {row.email && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        {row.email}
                      </span>
                    )}
                  </span>
                ),
              },
              {
                key: 'residence',
                label: 'Residence',
                render: (v, row: Member) => (
                  <span className="flex items-center gap-1.5 text-[13px]">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {v || row.region || '—'}
                  </span>
                ),
              },
              {
                key: 'attending_date',
                label: 'Attending',
                render: (v) => (
                  <span className="tnum flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatDate(v)}
                  </span>
                ),
              },
              {
                key: 'saved',
                label: 'Status',
                render: (v) => <StatusPill stage={v ? 'Saved' : 'Not Saved'} tone={v ? 'success' : 'warning'} />,
              },
            ]}
            data={members}
            searchPlaceholder="Filter these results…"
            defaultPageSize={10}
            emptyTitle="No Members Found"
            emptyMessage="No members match your search criteria. Try different keywords."
          />
        )}
      </SectionCard>

      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              variants={variants.backdropFade}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              variants={variants.modalPanel}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springs.gentle}
              className="glass-strong relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
                <div>
                  <h2 className="font-display text-base font-bold">Member Verification</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Read-only record for gate checks</p>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-2 rounded-full text-muted-foreground hover:bg-[var(--secondary)]"
                  aria-label="Close details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-5">
                <span className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--secondary)] flex-shrink-0 block">
                  {selectedMember.picture ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img
                      src={selectedMember.picture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('[data-fallback]') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span
                    data-fallback
                    className="w-full h-full items-center justify-center text-[var(--primary)]"
                    style={{ display: selectedMember.picture ? 'none' : 'flex' }}
                  >
                    <User className="w-8 h-8" />
                  </span>
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold truncate">
                    {selectedMember.first_name} {selectedMember.middle_name} {selectedMember.last_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Age {selectedMember.age} • {selectedMember.gender} • {selectedMember.marital_status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Registered {(selectedMember as any).created_by_name ? `by ${(selectedMember as any).created_by_name} ` : ''}on {formatDate(selectedMember.created_at)}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-[13px]">
                {[
                  {
                    h: 'Contact',
                    rows: [
                      ['Phone', selectedMember.mobile_no],
                      ['Email', selectedMember.email || 'N/A'],
                      ['Address', selectedMember.postal_address || 'N/A'],
                    ],
                  },
                  {
                    h: 'Location',
                    rows: [
                      ['Country', selectedMember.country],
                      ['Region', selectedMember.region],
                      ['Zone', selectedMember.zone],
                      ['Cell', selectedMember.cell],
                      ['Residence', selectedMember.residence],
                    ],
                  },
                  {
                    h: 'Church',
                    rows: [
                      ['Reg #', selectedMember.church_registration_number || 'N/A'],
                      ['Position', selectedMember.church_position || 'N/A'],
                      ['Origin', selectedMember.origin],
                      ['Saved', selectedMember.saved ? 'Yes' : 'No'],
                    ],
                  },
                  {
                    h: 'Additional',
                    rows: [
                      ['Career', selectedMember.career || 'N/A'],
                      ['Attending', formatDate(selectedMember.attending_date)],
                      ['Visitors', String(selectedMember.visitors_count ?? 0)],
                    ],
                  },
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

export default MemberSearchPage;
