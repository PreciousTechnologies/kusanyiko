import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { deleteMember, fetchMember } from '../../store/slices/membersSlice';
import { PageHeader } from '../../components/app-shell';
import { SectionCard, ClayButton, StatusPill, EmptyState } from '../../components/ui-bits';
import { DashboardSkeleton } from '../../components/skeleton-loaders';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Pencil,
  Trash2,
  Share2,
  Briefcase,
  Heart,
  IdCard,
  Globe,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { Member } from '../../types';
import ProfilePicture from '../../components/ui/ProfilePicture';
import { dialog } from '../../components/ui/Dialog';

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] row-hover">
    <span className="icon-badge !w-9 !h-9 !rounded-xl">{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="tnum block mt-0.5 text-[13px] font-semibold text-[var(--foreground)] break-words">{value || 'Not provided'}</span>
    </span>
  </div>
);

const MemberDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const getBasePath = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'apostle') return '/apostle';
    return '/registrant';
  };
  const { members } = useAppSelector((state) => state.members);

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setMember(null);
      setNotFound(true);
      setLoading(false);
      return;
    }
    const foundMember = members.find((m) => String(m.id) === String(id));
    if (foundMember) {
      setMember(foundMember);
      setNotFound(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    dispatch(fetchMember(id as any))
      .unwrap()
      .then((m) => {
        setMember(m);
        setNotFound(false);
      })
      .catch(() => {
        setMember(null);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id, members, dispatch]);

  const handleBack = () => navigate(`${getBasePath()}/members`);
  const handleEdit = () => navigate(`${getBasePath()}/members/${id}/edit`);

  const handleDelete = async () => {
    const name = member ? `${member.first_name} ${member.last_name}` : 'this member';
    const ok = await dialog.danger({
      title: `Delete ${name}?`,
      message: 'This removes the member from all lists. This action cannot be undone.',
      confirmText: 'Delete member',
    });
    if (!ok) return;
    try {
      if (member?.id) {
        await dispatch(deleteMember(member.id as any)).unwrap();
        handleBack();
      }
    } catch {
      await dialog.error('Delete failed', 'Failed to delete member. Please try again.');
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (notFound || !member) {
    return (
      <div className="space-y-6">
        <PageHeader title="Member Details" subtitle="Record lookup" />
        <EmptyState
          title="Member Not Found"
          message="The member you're looking for doesn't exist or has been removed."
          action={
            <ClayButton tone="primary" icon={<ArrowLeft className="w-4 h-4" />} onClick={handleBack}>
              Back to Members
            </ClayButton>
          }
        />
      </div>
    );
  }

  const fullName = `${member.first_name} ${member.middle_name ? `${member.middle_name} ` : ''}${member.last_name}`;
  const canShare = typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        subtitle={`${member.gender} • ${member.age} years • ${member.marital_status}`}
        cta={
          <>
            <ClayButton tone="neutral" icon={<ArrowLeft className="w-4 h-4" />} onClick={handleBack}>
              Back
            </ClayButton>
            <ClayButton tone="primary" icon={<Pencil className="w-4 h-4" />} onClick={handleEdit}>
              Edit
            </ClayButton>
            <ClayButton tone="danger" icon={<Trash2 className="w-4 h-4" />} onClick={handleDelete}>
              Delete
            </ClayButton>
          </>
        }
      />

      <SectionCard title="Profile" subtitle="Identity and salvation status">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <span className="w-20 h-20 rounded-3xl overflow-hidden bg-[var(--secondary)] flex-shrink-0 block">
            <ProfilePicture src={member.picture} firstName={member.first_name} lastName={member.last_name} size="lg" className="!w-full !h-full !ring-0 !border-0" />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold tracking-tight truncate">{fullName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {member.church_position || 'Member'}
              {member.church_registration_number ? ` • #${member.church_registration_number}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusPill stage={member.saved ? 'Saved' : 'Not Saved'} tone={member.saved ? 'success' : 'warning'} />
              <StatusPill stage={member.origin || 'invited'} tone="info" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ClayButton tone="success" icon={<Phone className="w-4 h-4" />} onClick={() => member.mobile_no && (window.location.href = `tel:${member.mobile_no}`)}>
              Call
            </ClayButton>
            {member.email && (
              <ClayButton tone="neutral" icon={<Mail className="w-4 h-4" />} onClick={() => (window.location.href = `mailto:${member.email}`)}>
                Email
              </ClayButton>
            )}
            {canShare && (
              <ClayButton
                tone="neutral"
                icon={<Share2 className="w-4 h-4" />}
                onClick={() =>
                  (navigator as any).share({
                    title: fullName,
                    text: `Contact: ${member.mobile_no}${member.email ? ` | Email: ${member.email}` : ''}`,
                    url: window.location.href,
                  }).catch(() => undefined)
                }
              >
                Share
              </ClayButton>
            )}
          </div>
        </div>
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Personal Information" subtitle="Identity record">
          <div className="grid gap-2.5">
            <DetailRow icon={<User className="w-4 h-4" />} label="Full Name" value={fullName} />
            <DetailRow icon={<CalendarDays className="w-4 h-4" />} label="Age" value={member.age ? `${member.age} years` : null} />
            <DetailRow icon={<CalendarDays className="w-4 h-4" />} label="Attending Since" value={member.attending_date ? new Date(member.attending_date).toLocaleDateString() : null} />
            <DetailRow icon={<Heart className="w-4 h-4" />} label="Marital Status" value={member.marital_status} />
            <DetailRow icon={<IdCard className="w-4 h-4" />} label="Church Reg. Number" value={member.church_registration_number} />
            <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Career" value={member.career} />
          </div>
        </SectionCard>

        <SectionCard title="Contact & Location" subtitle="How to reach and locate">
          <div className="grid gap-2.5">
            <DetailRow icon={<Phone className="w-4 h-4" />} label="Mobile Number" value={member.mobile_no} />
            <DetailRow icon={<Mail className="w-4 h-4" />} label="Email Address" value={member.email} />
            <DetailRow icon={<Globe className="w-4 h-4" />} label="Country" value={member.country} />
            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Region" value={member.region} />
            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Center / Area" value={member.center_area} />
            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Zone" value={member.zone} />
            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Cell" value={member.cell} />
            <DetailRow icon={<Home className="w-4 h-4" />} label="Residence" value={member.residence} />
          </div>
        </SectionCard>

        <SectionCard title="Church Life" subtitle="Ministry placement">
          <div className="grid gap-2.5">
            <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Church Position" value={member.church_position} />
            <DetailRow icon={<User className="w-4 h-4" />} label="Visitors Count" value={member.visitors_count != null ? `${member.visitors_count} visitors` : null} />
            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Origin" value={member.origin} />
            <DetailRow icon={<CheckCircle2 className="w-4 h-4" />} label="Salvation Status" value={member.saved ? 'Saved' : 'Not Saved'} />
          </div>
        </SectionCard>

        <SectionCard title="Record Meta" subtitle="Audit trail">
          <div className="grid gap-2.5">
            <DetailRow icon={<CalendarDays className="w-4 h-4" />} label="Registered" value={member.created_at ? new Date(member.created_at).toLocaleDateString() : null} />
            <DetailRow icon={<CalendarDays className="w-4 h-4" />} label="Last Updated" value={(member as any).updated_at ? new Date((member as any).updated_at).toLocaleDateString() : null} />
            <DetailRow icon={<User className="w-4 h-4" />} label="Registered By" value={(member as any).created_by_name || 'System'} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default MemberDetails;
