import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { deleteMember } from '../../store/slices/membersSlice';
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon,
  IdentificationIcon,
  HeartIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
  HomeIcon,
  EllipsisVerticalIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { Member } from '../../types';
import ProfilePicture from '../../components/ui/ProfilePicture';
import '../../styles/mobile-members.css';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (id) {
      // Find member in the current state first
      const foundMember = members.find(m => m.id === parseInt(id));
      if (foundMember) {
        setMember(foundMember);
        setLoading(false);
      } else {
        // If not found, you could fetch individual member here
        // For now, we'll just show not found
        setLoading(false);
      }
    }
  }, [id, members]);

  const handleBack = () => {
    navigate(`${getBasePath()}/members`);
  };

  const handleEdit = () => {
    navigate(`${getBasePath()}/members/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      try {
        if (member?.id) {
          await dispatch(deleteMember(member.id)).unwrap();
          console.log('Member deleted successfully');
          handleBack();
        }
      } catch (error) {
        console.error('Failed to delete member:', error);
        alert('Failed to delete member. Please try again.');
      }
    }
  };

  const handleCall = () => {
    if (member?.mobile_no) {
      window.location.href = `tel:${member.mobile_no}`;
    }
  };

  const handleEmail = () => {
    if (member?.email) {
      window.location.href = `mailto:${member.email}`;
    }
  };

  const handleShare = async () => {
    if (member && navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${member.first_name} ${member.last_name}`,
          text: `Contact: ${member.mobile_no}${member.email ? ` | Email: ${member.email}` : ''}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Member Not Found</h2>
          <p className="text-gray-600 mb-6">The member you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Members
          </button>
        </div>
      </div>
    );
  }

  const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string | null; actionIcon?: React.ReactNode; onAction?: () => void }> = ({ 
    icon, label, value, actionIcon, onAction 
  }) => (
    <div className={`flex items-start space-x-3 p-4 rounded-lg ${isMobile ? 'bg-white border border-gray-100' : 'bg-gray-50'}`}>
      <div className="text-green-600 mt-1">{icon}</div>
      <div className="flex-1">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value || 'Not provided'}</dd>
      </div>
      {actionIcon && onAction && (
        <button
          onClick={onAction}
          className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors"
        >
          {actionIcon}
        </button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              
              <h1 className="text-lg font-semibold text-gray-900 truncate mx-4">
                Member Details
              </h1>
              
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <EllipsisVerticalIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Actions Menu */}
          {showActions && (
            <div className="absolute top-full right-4 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <button
                onClick={() => {
                  handleEdit();
                  setShowActions(false);
                }}
                className="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50"
              >
                <PencilIcon className="h-5 w-5 mr-3" />
                Edit Member
              </button>
              
              {navigator.share && typeof navigator.share === 'function' && (
                <button
                  onClick={() => {
                    handleShare();
                    setShowActions(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50"
                >
                  <ShareIcon className="h-5 w-5 mr-3" />
                  Share
                </button>
              )}
              
              <button
                onClick={() => {
                  handleDelete();
                  setShowActions(false);
                }}
                className="flex items-center w-full px-4 py-3 text-left text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="h-5 w-5 mr-3" />
                Delete Member
              </button>
            </div>
          )}
        </div>

        {/* Mobile Content */}
        <div className="p-4">
          {/* Profile Section */}
          <div className="bg-white rounded-xl p-6 mb-4 border border-gray-100">
            <div className="text-center">
              <ProfilePicture
                src={member.picture}
                firstName={member.first_name}
                lastName={member.last_name}
                size="lg"
                className="mx-auto mb-4 bg-green-100 text-green-600"
              />
              
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
              </h2>
              
              <p className="text-gray-600 mb-4">
                {member.gender} • {member.age} years
              </p>
              
              <div className="flex justify-center mb-4">
                {member.saved ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Saved
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    Not Saved
                  </span>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleCall}
                  className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  Call
                </button>
                
                {member.email && (
                  <button
                    onClick={handleEmail}
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    Email
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PhoneIcon className="h-5 w-5 mr-2 text-green-600" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <InfoItem 
                icon={<PhoneIcon className="h-5 w-5" />} 
                label="Phone Number" 
                value={member.mobile_no}
                actionIcon={<PhoneIcon className="h-4 w-4" />}
                onAction={handleCall}
              />
              {member.email && (
                <InfoItem 
                  icon={<EnvelopeIcon className="h-5 w-5" />} 
                  label="Email Address" 
                  value={member.email}
                  actionIcon={<EnvelopeIcon className="h-4 w-4" />}
                  onAction={handleEmail}
                />
              )}
              <InfoItem 
                icon={<MapPinIcon className="h-5 w-5" />} 
                label="Region" 
                value={member.region || null} 
              />
              <InfoItem 
                icon={<GlobeAltIcon className="h-5 w-5" />} 
                label="Country" 
                value={member.country} 
              />
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <IdentificationIcon className="h-5 w-5 mr-2 text-green-600" />
              Personal Information
            </h3>
            <div className="space-y-3">
              <InfoItem 
                icon={<UserIcon className="h-5 w-5" />} 
                label="Gender" 
                value={member.gender} 
              />
              <InfoItem 
                icon={<CalendarIcon className="h-5 w-5" />} 
                label="Age" 
                value={member.age?.toString()} 
              />
              <InfoItem 
                icon={<HeartIcon className="h-5 w-5" />} 
                label="Marital Status" 
                value={member.marital_status} 
              />
            </div>
          </div>

          {/* Church Information */}
          <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <HomeIcon className="h-5 w-5 mr-2 text-green-600" />
              Church Information
            </h3>
            <div className="space-y-3">
              <InfoItem 
                icon={<CalendarIcon className="h-5 w-5" />} 
                label="Attending Since" 
                value={member.attending_date ? new Date(member.attending_date).toLocaleDateString() : null} 
              />
              <InfoItem 
                icon={<CheckCircleIcon className="h-5 w-5" />} 
                label="Salvation Status" 
                value={member.saved ? 'Saved' : 'Not Saved'} 
              />
            </div>
          </div>

          {/* Additional Information - Only show if career is available */}
          {member.career && (
            <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2 text-green-600" />
                Additional Information
              </h3>
              <div className="space-y-3">
                <InfoItem 
                  icon={<BriefcaseIcon className="h-5 w-5" />} 
                  label="Career" 
                  value={member.career} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Members
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <ProfilePicture
                    src={member.picture}
                    firstName={member.first_name}
                    lastName={member.last_name}
                    size="lg"
                    className="bg-white text-green-600"
                  />
                  <div className="text-white">
                    <h1 className="text-3xl font-bold">
                      {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
                    </h1>
                    <p className="text-green-100 text-lg flex items-center mt-2">
                      <UserIcon className="h-5 w-5 mr-2" />
                      {member.gender} • {member.age} years • {member.marital_status}
                    </p>
                    <div className="flex items-center mt-2">
                      {member.saved ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Saved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Not Saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Edit Member
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <TrashIcon className="h-5 w-5 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <IdentificationIcon className="h-5 w-5 mr-2 text-green-600" />
                Personal Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <InfoItem 
                icon={<UserIcon className="h-5 w-5" />} 
                label="Full Name" 
                value={`${member.first_name} ${member.middle_name || ''} ${member.last_name}`.trim()} 
              />
              <InfoItem 
                icon={<CalendarIcon className="h-5 w-5" />} 
                label="Age" 
                value={member.age ? `${member.age} years` : null} 
              />
              <InfoItem 
                icon={<CalendarIcon className="h-5 w-5" />} 
                label="Attending Date" 
                value={member.attending_date} 
              />
              <InfoItem 
                icon={<UserIcon className="h-5 w-5" />} 
                label="Gender" 
                value={member.gender} 
              />
              <InfoItem 
                icon={<HeartIcon className="h-5 w-5" />} 
                label="Marital Status" 
                value={member.marital_status} 
              />
              <InfoItem 
                icon={<IdentificationIcon className="h-5 w-5" />} 
                label="Church Registration Number" 
                value={member.church_registration_number} 
              />
              <InfoItem 
                icon={<BriefcaseIcon className="h-5 w-5" />} 
                label="Occupation" 
                value={member.career || null} 
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2 text-green-600" />
                Contact Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <InfoItem 
                icon={<PhoneIcon className="h-5 w-5" />} 
                label="Mobile Number" 
                value={member.mobile_no} 
              />
              <InfoItem 
                icon={<EnvelopeIcon className="h-5 w-5" />} 
                label="Email Address" 
                value={member.email || null} 
              />
              <InfoItem 
                icon={<GlobeAltIcon className="h-5 w-5" />} 
                label="Country" 
                value={member.country} 
              />
              <InfoItem 
                icon={<MapPinIcon className="h-5 w-5" />} 
                label="Region" 
                value={member.region || null} 
              />
              <InfoItem 
                icon={<MapPinIcon className="h-5 w-5" />} 
                label="Center/Area" 
                value={member.center_area || null} 
              />
              <InfoItem 
                icon={<MapPinIcon className="h-5 w-5" />} 
                label="Zone" 
                value={member.zone} 
              />
              <InfoItem 
                icon={<MapPinIcon className="h-5 w-5" />} 
                label="Cell" 
                value={member.cell} 
              />
              <InfoItem 
                icon={<HomeIcon className="h-5 w-5" />} 
                label="Residence" 
                value={member.residence} 
              />
              <InfoItem 
                icon={<MapPinIcon className="h-5 w-5" />} 
                label="Postal Address" 
                value={member.postal_address || null} 
              />
            </div>
          </div>

          {/* Church Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2 text-green-600" />
                Church Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <InfoItem 
                icon={<BriefcaseIcon className="h-5 w-5" />} 
                label="Church Position" 
                value={member.church_position || null} 
              />
              <InfoItem 
                icon={<UserIcon className="h-5 w-5" />} 
                label="Visitors Count" 
                value={member.visitors_count ? `${member.visitors_count} visitors` : '0 visitors'} 
              />
              <InfoItem 
                icon={<MapPinIcon className="h-5 w-5" />} 
                label="Origin" 
                value={member.origin} 
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-green-600" />
                Additional Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <InfoItem 
                icon={<CalendarIcon className="h-5 w-5" />} 
                label="Registration Date" 
                value={member.created_at ? new Date(member.created_at).toLocaleDateString() : null} 
              />
              <InfoItem 
                icon={<CalendarIcon className="h-5 w-5" />} 
                label="Last Updated" 
                value={member.updated_at ? new Date(member.updated_at).toLocaleDateString() : null} 
              />
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-green-600 mt-1">
                  {member.saved ? <CheckCircleIcon className="h-5 w-5" /> : <XCircleIcon className="h-5 w-5" />}
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Salvation Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member.saved ? 'Saved' : 'Not Saved'}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetails;