import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchMembers, setFilters, deleteMember } from '../../store/slices/membersSlice';
import { PageHeader } from '../../components/app-shell';
import { KpiCard, SectionCard, ClayButton, StatusPill } from '../../components/ui-bits';
import { DataTable } from '../../components/data-table';
import { TableSkeleton } from '../../components/skeleton-loaders';
import { Users, UserPlus, CheckCircle2, CalendarDays, Eye, Pencil, Trash2, SlidersHorizontal } from 'lucide-react';
import { Member } from '../../types';
import ProfilePicture from '../../components/ui/ProfilePicture';
import { dialog } from '../../components/ui/Dialog';
import { isOwnedByUser } from '../../lib/utils';

const MyMembers: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const { members, loading, totalCount, filters } = useAppSelector((state) => state.members);

  const getBasePath = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'apostle') return '/apostle';
    return '/registrant';
  };

  const showOnlyMyMembers =
    location.pathname.includes('/my-members') ||
    searchParams.get('filter') === 'created_by_me' ||
    user?.role === 'registrant';

  const [selectedGender, setSelectedGender] = useState(filters.gender);
  const [selectedRegion, setSelectedRegion] = useState(filters.region);
  const [selectedCenterArea, setSelectedCenterArea] = useState(filters.center_area || '');
  const [selectedSaved, setSelectedSaved] = useState<boolean | null>(filters.saved);
  const [showFilters, setShowFilters] = useState(false);
  const [headerQuery, setHeaderQuery] = useState('');

  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const membersRef = useRef(members);
  membersRef.current = members;

  useEffect(() => {
    dispatch(
      fetchMembers({
        search: debouncedSearch,
        gender: selectedGender,
        region: selectedRegion,
        center_area: selectedCenterArea,
        saved: selectedSaved,
        silent: membersRef.current.length > 0,
      })
    );
  }, [dispatch, debouncedSearch, selectedGender, selectedRegion, selectedCenterArea, selectedSaved]);

  const displayedMembers = useMemo((): Member[] => {
    let rows = members;
    if (headerQuery.trim()) {
      const q = headerQuery.toLowerCase().trim();
      rows = rows.filter((m) =>
        `${m.first_name} ${m.middle_name || ''} ${m.last_name} ${m.mobile_no} ${m.email || ''}`.toLowerCase().includes(q)
      );
    }
    if (!showOnlyMyMembers) return rows;
    return rows.filter((m) => isOwnedByUser(m as any, user as any));
  }, [members, headerQuery, showOnlyMyMembers, user]);

  const totalDisplayed = showOnlyMyMembers ? displayedMembers.length : totalCount;
  const savedCount = useMemo(() => members.filter((m) => m.saved).length, [members]);
  const monthCount = useMemo(() => {
    const now = new Date();
    return members.filter((m) => {
      const d = new Date((m.created_at || m.attending_date) as string);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [members]);

  const centerAreaOptions = useMemo(
    () =>
      Array.from(
        new Set(displayedMembers.map((m) => m.center_area).filter((v): v is string => Boolean(v && v.trim())))
      ).sort(),
    [displayedMembers]
  );
  const regionOptions = useMemo(
    () => Array.from(new Set(members.map((m) => m.region).filter(Boolean))).sort() as string[],
    [members]
  );

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGender('');
    setSelectedRegion('');
    setSelectedCenterArea('');
    setSelectedSaved(null);
    setHeaderQuery('');
    dispatch(setFilters({ search: '', gender: '', region: '', center_area: '', saved: null }));
  };

  const handleViewMember = (id: any) => navigate(`${getBasePath()}/members/${id}`);
  const handleEditMember = (id: any) => navigate(`${getBasePath()}/members/${id}/edit`);

  const handleDeleteMember = async (id: any) => {
    const member = members.find((m) => String(m.id) === String(id));
    const name = member ? `${member.first_name} ${member.last_name}` : 'this member';
    const confirmed = await dialog.danger({
      title: `Delete ${name}?`,
      message: 'This action cannot be undone and will permanently remove the member from all lists.',
      confirmText: 'Delete member',
    });
    if (!confirmed) return;
    try {
      await dispatch(deleteMember(id)).unwrap();
      await dialog.success('Member deleted', `${name} has been successfully deleted.`);
    } catch (error: any) {
      await dialog.error(`Failed to delete ${name}`, error?.message || 'An unexpected error occurred.');
    }
  };

  const title = showOnlyMyMembers ? 'My Members' : 'All Members';
  const subtitle =
    user?.role === 'admin'
      ? 'Full member register across all regions'
      : user?.role === 'apostle'
        ? 'Members in your assigned kanda scope'
        : 'Members you have registered';

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        onSearch={setHeaderQuery}
        searchPlaceholder="Filter by name, phone or email…"
        cta={
          <ClayButton tone="primary" icon={<UserPlus className="w-4 h-4" />} onClick={() => navigate(`${getBasePath()}/members/add`)}>
            Register Member
          </ClayButton>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <KpiCard label="Total Members" value={totalDisplayed} tint="primary" icon={<Users className="w-4 h-4" />} index={0} />
        <KpiCard label="Saved Members" value={savedCount} tint="success" icon={<CheckCircle2 className="w-4 h-4" />} index={1} />
        <KpiCard label="This Month" value={monthCount} tint="info" icon={<CalendarDays className="w-4 h-4" />} index={2} />
      </div>

      <SectionCard
        title={`${title} (${totalDisplayed.toLocaleString()})`}
        subtitle="Search, filter and manage the register"
        action={
          <ClayButton tone={showFilters ? 'primary' : 'neutral'} icon={<SlidersHorizontal className="w-4 h-4" />} onClick={() => setShowFilters((v) => !v)}>
            Filters
          </ClayButton>
        }
      >
        {showFilters && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mb-4 p-3.5 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--secondary)_40%,transparent)]">
            <input
              type="text"
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                dispatch(setFilters({ search: e.target.value }));
              }}
              className="h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs focus-ring"
            />
            <select value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); dispatch(setFilters({ region: e.target.value })); }} className="h-10 px-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-semibold focus-ring">
              <option value="">All Regions</option>
              {regionOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select value={selectedCenterArea} onChange={(e) => { setSelectedCenterArea(e.target.value); dispatch(setFilters({ center_area: e.target.value })); }} className="h-10 px-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-semibold focus-ring">
              <option value="">All Centers</option>
              {centerAreaOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={selectedGender} onChange={(e) => { setSelectedGender(e.target.value); dispatch(setFilters({ gender: e.target.value })); }} className="h-10 px-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-semibold focus-ring">
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <div className="flex gap-2">
              <select
                value={selectedSaved === null ? '' : selectedSaved ? 'true' : 'false'}
                onChange={(e) => { const v = e.target.value === '' ? null : e.target.value === 'true'; setSelectedSaved(v); dispatch(setFilters({ saved: v })); }}
                className="h-10 flex-1 px-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-semibold focus-ring"
              >
                <option value="">All Statuses</option>
                <option value="true">Saved</option>
                <option value="false">Not Saved</option>
              </select>
              <ClayButton tone="neutral" onClick={clearFilters}>Clear</ClayButton>
            </div>
          </div>
        )}

        {loading && displayedMembers.length === 0 ? (
          <TableSkeleton rows={8} />
        ) : (
          <DataTable
            columns={[
              {
                key: 'member',
                label: 'Member',
                render: (_v, row: Member) => (
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--secondary)]">
                      <ProfilePicture src={row.picture} firstName={row.first_name} lastName={row.last_name} size="sm" className="!w-full !h-full !ring-0 !border-0" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold truncate">
                        {row.first_name} {row.middle_name ? `${row.middle_name} ` : ''}{row.last_name}
                      </span>
                      <span className="block text-xs text-muted-foreground capitalize">{row.gender} • {row.age}y • {row.marital_status}</span>
                    </span>
                  </div>
                ),
              },
              {
                key: 'mobile_no',
                label: 'Contact',
                render: (v, row: Member) => (
                  <span>
                    <span className="tnum block text-[13px] font-semibold">{v}</span>
                    <span className="block text-xs text-muted-foreground truncate max-w-[200px]">{row.email || 'No email'}</span>
                  </span>
                ),
              },
              {
                key: 'region',
                label: 'Location',
                render: (v, row: Member) => (
                  <span>
                    <span className="block text-[13px] font-medium">{v || row.country || '—'}</span>
                    <span className="block text-xs text-muted-foreground truncate max-w-[200px]">
                      {[row.center_area, row.zone, row.cell].filter(Boolean).join(' • ') || 'Area not specified'}
                    </span>
                  </span>
                ),
              },
              {
                key: 'saved',
                label: 'Status',
                render: (v) => <StatusPill stage={v ? 'Saved' : 'Not Saved'} tone={v ? 'success' : 'warning'} />,
              },
              {
                key: 'created_by_name',
                label: 'Registered By',
                render: (v) => <span className="text-xs text-muted-foreground">{v || 'System'}</span>,
              },
            ]}
            data={displayedMembers}
            searchPlaceholder="Search this view…"
            initialSortColumn="member"
            defaultPageSize={10}
            emptyTitle="No Members Found"
            emptyMessage={searchTerm || selectedGender || selectedRegion || selectedSaved !== null ? 'Try adjusting your search or filters.' : 'No members registered yet. Add the first one.'}
            actions={(row: Member) => (
              <>
                <button onClick={() => handleViewMember(row.id)} title="View" className="p-2 rounded-lg text-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleEditMember(row.id)} title="Edit" className="p-2 rounded-lg text-cyan-600 hover:bg-cyan-500/10 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteMember(row.id)} title="Delete" className="p-2 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          />
        )}
      </SectionCard>
    </div>
  );
};

export default MyMembers;
