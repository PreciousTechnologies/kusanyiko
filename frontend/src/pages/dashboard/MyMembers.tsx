import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchMembers, setFilters, deleteMember } from '../../store/slices/membersSlice';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { Member } from '../../types';
import ProfilePicture from '../../components/ui/ProfilePicture';
import '../../styles/mobile-members.css';

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

  // Check if we should filter to only show admin's created members
  const showOnlyMyMembers = 
    location.pathname.includes('/my-members') || 
    searchParams.get('filter') === 'created_by_me' || 
    user?.role === 'registrant';

  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [selectedGender, setSelectedGender] = useState(filters.gender);
  const [selectedRegion, setSelectedRegion] = useState(filters.region);
  const [selectedCenterArea, setSelectedCenterArea] = useState(filters.center_area || '');
  const [selectedSaved, setSelectedSaved] = useState<boolean | null>(filters.saved);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch all members when component mounts and when filters change
  useEffect(() => {
    dispatch(fetchMembers({
      search: searchTerm,
      gender: selectedGender,
      region: selectedRegion,
      center_area: selectedCenterArea,
      saved: selectedSaved,
    }));
  }, [dispatch, searchTerm, selectedGender, selectedRegion, selectedCenterArea, selectedSaved]);

  // Filter members created by current admin (only when needed)
  const getMyMembers = (): Member[] => {
    if (!showOnlyMyMembers) {
      return members; // Show all members for admin "All Members" view
    }

    return members.filter(member => {
      const memberCreatedBy = member.created_by;
      const currentUserId = user?.id;
      const currentUsername = user?.username;
      
      // Check against user ID (number)
      if (typeof memberCreatedBy === 'number' && memberCreatedBy === currentUserId) {
        return true;
      }
      
      // Check against username (string)
      if (typeof memberCreatedBy === 'string' && memberCreatedBy === currentUsername) {
        return true;
      }
      
      // Additional check for registered_by field if created_by is not available
      if (!memberCreatedBy && member.registered_by === currentUserId) {
        return true;
      }
      
      return false;
    });
  };

  const displayedMembers = getMyMembers();
  const totalDisplayedMembers = showOnlyMyMembers ? displayedMembers.length : totalCount;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    dispatch(setFilters({ search: value }));
  };

  const handleFilterChange = (filterType: string, value: any) => {
    switch (filterType) {
      case 'gender':
        setSelectedGender(value);
        dispatch(setFilters({ gender: value }));
        break;
      case 'region':
        setSelectedRegion(value);
        dispatch(setFilters({ region: value }));
        break;
      case 'saved':
        setSelectedSaved(value);
        dispatch(setFilters({ saved: value }));
        break;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGender('');
    setSelectedRegion('');
    setSelectedCenterArea('');
    setSelectedSaved(null);
    dispatch(setFilters({
      search: '',
      gender: '',
      region: '',
      center_area: '',
      saved: null,
    }));
  };

  const centerAreaOptions = Array.from(
    new Set(
      displayedMembers
        .map((member) => member.center_area)
        .filter((value): value is string => Boolean(value && value.trim()))
    )
  ).sort();

  const handleViewMember = (memberId: number) => {
    // Navigate to member details page
    navigate(`${getBasePath()}/members/${memberId}`);
  };

  const handleEditMember = (memberId: number) => {
    // Navigate to edit member page
    navigate(`${getBasePath()}/members/${memberId}/edit`);
  };

  const handleDeleteMember = async (memberId: number) => {
    // Find the member to get their name for confirmation
    const member = members.find(m => m.id === memberId);
    const memberName = member ? `${member.first_name} ${member.last_name}` : 'this member';
    
    // Show confirmation dialog with member name
    const confirmed = window.confirm(
      `Are you sure you want to delete ${memberName}?\n\nThis action cannot be undone and will permanently remove all member data from the database.`
    );
    
    if (confirmed) {
      try {
        await dispatch(deleteMember(memberId)).unwrap();
        
        // Show success notification
        console.log(`${memberName} has been successfully deleted.`);
        
        // Optional: You could add a toast notification here
        // toast.success(`${memberName} has been successfully deleted.`);
        
      } catch (error: any) {
        console.error('Failed to delete member:', error);
        
        // Show error message with details
        const errorMessage = error?.message || 'An unexpected error occurred while deleting the member.';
        alert(`Failed to delete ${memberName}.\n\nError: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
      }
    }
  };

  const MemberCard: React.FC<{ member: Member }> = ({ member }) => (
    <div className="member-card-desktop-compact">
      {/* Compact Header with Profile and Key Info */}
      <div className="member-card-header-compact">
        <div className="member-profile-section">
          <div className="member-profile-picture-compact">
            <ProfilePicture
              src={member.picture}
              firstName={member.first_name}
              lastName={member.last_name}
              size="sm"
              className="!w-12 !h-12 !ring-0 !border-0"
            />
          </div>
          <div className="member-info-compact">
            <h3 className="member-name-compact">
              {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
            </h3>
            <div className="member-basic-info">
              <span className="member-age-gender">{member.gender}, {member.age}y</span>
              <span className="member-marital">• {member.marital_status}</span>
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`member-status-compact ${
          member.saved ? 'status-saved' : 'status-not-saved'
        }`}>
          {member.saved ? (
            <CheckCircleIcon className="h-3 w-3" />
          ) : (
            <XCircleIcon className="h-3 w-3" />
          )}
        </div>
      </div>

      {/* Compact Details Grid */}
      <div className="member-details-grid">
        <div className="detail-item">
          <PhoneIcon className="h-3.5 w-3.5 text-green-600 flex-shrink-0 inline-block" style={{ minWidth: '14px', minHeight: '14px' }} />
          <span className="detail-text">{member.mobile_no}</span>
        </div>
        
        <div className="detail-item">
          <MapPinIcon className="h-3.5 w-3.5 text-green-600 flex-shrink-0 inline-block" style={{ minWidth: '14px', minHeight: '14px' }} />
          <span className="detail-text">{member.region || member.country || 'Not specified'}</span>
        </div>
        
        <div className="detail-item">
          <CalendarIcon className="h-3.5 w-3.5 text-green-600 flex-shrink-0 inline-block" style={{ minWidth: '14px', minHeight: '14px' }} />
          <span className="detail-text">{new Date(member.attending_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>

        <div className="detail-item">
          <UserIcon className="h-3.5 w-3.5 text-green-600 flex-shrink-0 inline-block" style={{ minWidth: '14px', minHeight: '14px' }} />
          <span className="detail-text">{member.church_position || 'Member'}</span>
        </div>
      </div>

      {/* Compact Church Info */}
      <div className="church-info-compact">
        <div className="church-location">
          <span className="church-area">{member.center_area || member.zone || 'Area not specified'}</span>
          {member.center_area && member.zone && <span className="separator">•</span>}
          {member.center_area && member.cell && <span className="church-cell">{member.cell}</span>}
        </div>
        {member.church_registration_number && (
          <div className="church-reg">#{member.church_registration_number}</div>
        )}
      </div>

      {/* Compact Footer */}
      <div className="member-card-footer-compact">
        <div className="member-since">
          <span>Since {new Date(member.attending_date).getFullYear()}</span>
          {member.created_by && typeof member.created_by === 'string' && (
            <span className="created-by">by {member.created_by.split(' ')[0]}</span>
          )}
        </div>
        <div className="member-actions-compact">
          <button
            onClick={() => handleViewMember(member.id!)}
            className="action-btn action-view"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditMember(member.id!)}
            className="action-btn action-edit"
            title="Edit Member"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteMember(member.id!)}
            className="action-btn action-delete"
            title="Delete Member"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const MemberCardMobile: React.FC<{ member: Member }> = ({ member }) => (
    <div className="member-card-mobile enhanced">
      {/* Enhanced Mobile Card Header with Glass Effect */}
      <div className="member-card-header-mobile enhanced">
        <div className="member-card-main-info-mobile">
          <div className="member-profile-picture-mobile enhanced">
            <ProfilePicture
              src={member.picture}
              firstName={member.first_name}
              lastName={member.last_name}
              size="lg"
              className="!w-full !h-full !ring-0 !border-0"
            />
            {/* Status Indicator with Animation */}
            <div className="status-indicator-mobile enhanced"></div>
          </div>
          <div className="member-card-info-mobile enhanced">
            <h3 className="member-name-mobile enhanced">
              {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
            </h3>
            <div className="member-details-mobile enhanced">
              <div className="member-detail-badges-mobile">
                <div className="detail-badge-mobile gender">
                  <UserIcon className="member-detail-icon-mobile" />
                  <span>{member.gender}</span>
                </div>
                <div className="detail-badge-mobile age">
                  <span>{member.age}y</span>
                </div>
                <div className="detail-badge-mobile marital">
                  <span>{member.marital_status}</span>
                </div>
              </div>
              <div className="member-detail-item-mobile location">
                <MapPinIcon className="member-detail-icon-mobile" />
                <span className="location-text-mobile">{member.region || member.country}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Status Badge with Animation */}
        <div className={`member-status-mobile enhanced ${
          member.saved 
            ? 'member-status-saved-mobile' 
            : 'member-status-not-saved-mobile'
        }`}>
          <div className="status-icon-mobile">
            {member.saved ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <XCircleIcon className="h-4 w-4" />
            )}
          </div>
          <span className="status-text-mobile">
            {member.saved ? 'Saved' : 'Not Saved'}
          </span>
        </div>
      </div>

      {/* Enhanced Mobile Card Body with Improved Layout */}
      <div className="member-card-body-mobile enhanced">
        {/* Contact Information Section with Glass Effect */}
        <div className="contact-section-mobile enhanced">
          <div className="section-header-mobile">
            <PhoneIcon className="section-icon-mobile" />
            <span>Contact Info</span>
          </div>
          <div className="member-contact-info-mobile enhanced">
            <div className="member-contact-item-mobile enhanced">
              <div className="contact-icon-wrapper-mobile">
                <PhoneIcon className="member-contact-icon-mobile" />
              </div>
              <div className="contact-details-mobile">
                <span className="contact-label-mobile">Mobile</span>
                <span className="member-contact-text-mobile">{member.mobile_no}</span>
              </div>
              <button 
                className="quick-action-btn-mobile call enhanced"
                onClick={() => window.open(`tel:${member.mobile_no}`)}
              >
                <PhoneIcon className="h-4 w-4" />
              </button>
            </div>
            
            {member.email && (
              <div className="member-contact-item-mobile enhanced">
                <div className="contact-icon-wrapper-mobile">
                  <EnvelopeIcon className="member-contact-icon-mobile" />
                </div>
                <div className="contact-details-mobile">
                  <span className="contact-label-mobile">Email</span>
                  <span className="member-contact-text-mobile">{member.email}</span>
                </div>
                <button 
                  className="quick-action-btn-mobile email enhanced"
                  onClick={() => window.open(`mailto:${member.email}`)}
                >
                  <EnvelopeIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Church Information Section with Enhanced Design */}
        <div className="member-church-info-mobile enhanced">
          <div className="section-header-mobile">
            <div className="church-icon-mobile enhanced">⛪</div>
            <span>Church Details</span>
          </div>
          <div className="member-church-details-mobile enhanced">
            <div className="church-detail-grid-mobile">
              {member.church_registration_number && (
                <div className="member-church-detail-mobile">
                  <span className="member-church-label-mobile">Reg #</span>
                  <span className="church-value-mobile">{member.church_registration_number}</span>
                </div>
              )}
              <div className="member-church-detail-mobile">
                <span className="member-church-label-mobile">Area</span>
                <span className="church-value-mobile">{member.center_area || 'Not specified'}</span>
              </div>
              {member.zone && (
                <div className="member-church-detail-mobile">
                  <span className="member-church-label-mobile">Zone</span>
                  <span className="church-value-mobile">{member.zone}</span>
                </div>
              )}
              {member.cell && (
                <div className="member-church-detail-mobile">
                  <span className="member-church-label-mobile">Cell</span>
                  <span className="church-value-mobile">{member.cell}</span>
                </div>
              )}
              {member.church_position && (
                <div className="member-church-detail-mobile full-width">
                  <span className="member-church-label-mobile">Position</span>
                  <span className="church-value-mobile position">{member.church_position}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Member Stats with Visual Improvements */}
        <div className="member-stats-mobile enhanced">
          <div className="stat-item-mobile enhanced">
            <CalendarIcon className="stat-icon-mobile" />
            <div className="stat-content-mobile">
              <span className="stat-label-mobile">Joined</span>
              <span className="stat-value-mobile">
                {new Date(member.attending_date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
          {member.created_by && typeof member.created_by === 'string' && (
            <div className="stat-item-mobile enhanced">
              <UserIcon className="stat-icon-mobile" />
              <div className="stat-content-mobile">
                <span className="stat-label-mobile">Registered by</span>
                <span className="stat-value-mobile">{member.created_by.split(' ')[0]}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Mobile Actions with Better Touch Targets */}
      <div className="member-actions-mobile enhanced">
        <button
          onClick={() => handleViewMember(member.id!)}
          className="member-action-btn-mobile view enhanced"
        >
          <EyeIcon className="h-4 w-4" />
          <span>View Details</span>
        </button>
        <button
          onClick={() => handleEditMember(member.id!)}
          className="member-action-btn-mobile edit enhanced"
        >
          <PencilIcon className="h-4 w-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={() => handleDeleteMember(member.id!)}
          className="member-action-btn-mobile delete enhanced"
        >
          <TrashIcon className="h-4 w-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );

  const MemberListItem: React.FC<{ member: Member }> = ({ member }) => (
    <div className="member-list-item-desktop">
      <div className="member-list-profile-desktop">
        <div className="member-profile-picture">
          <ProfilePicture
            src={member.picture}
            firstName={member.first_name}
            lastName={member.last_name}
            size="sm"
            className="!w-full !h-full !ring-0 !border-0"
          />
        </div>
      </div>
      
      <div className="member-list-info-desktop">
        <h3 className="member-list-name-desktop">
          {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
        </h3>
        <div className="member-list-detail-desktop">
          <span>{member.gender} • {member.age} years</span>
          <span>{member.mobile_no}</span>
          <span>{member.region}, {member.country}</span>
        </div>
        {member.created_by && typeof member.created_by === 'string' && (
          <div className="text-green-600 text-xs mt-1 font-medium">
            Created by: {member.created_by}
          </div>
        )}
      </div>

      <div className="member-list-actions-desktop">
        <div className={`member-status-desktop ${
          member.saved 
            ? 'member-status-saved' 
            : 'member-status-not-saved'
        }`}>
          {member.saved ? (
            <>
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Saved
            </>
          ) : (
            <>
              <XCircleIcon className="h-3 w-3 mr-1" />
              Not Saved
            </>
          )}
        </div>

        <div className="member-actions-desktop">
          <button
            onClick={() => handleViewMember(member.id!)}
            className="member-action-btn-desktop text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors duration-200"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditMember(member.id!)}
            className="member-action-btn-desktop text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
            title="Edit Member"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteMember(member.id!)}
            className="member-action-btn-desktop text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
            title="Delete Member"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const MemberListItemMobile: React.FC<{ member: Member }> = ({ member }) => (
    <div className="member-list-item-mobile enhanced">
      <div className="member-list-header-mobile enhanced">
        <div className="member-list-main-info-mobile">
          <div className="member-list-picture-mobile enhanced">
            <ProfilePicture
              src={member.picture}
              firstName={member.first_name}
              lastName={member.last_name}
              size="sm"
              className="!w-full !h-full !ring-0 !border-0"
            />
          </div>
          <div className="member-list-info-mobile enhanced">
            <h3 className="member-list-name-mobile">
              {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
            </h3>
            <div className="member-list-details-mobile">
              <div className="member-list-contact-mobile">
                <PhoneIcon className="member-detail-icon-mobile" />
                <span>{member.mobile_no}</span>
              </div>
              <div className="member-list-location-mobile">
                <MapPinIcon className="member-detail-icon-mobile" />
                <span>{member.region}, {member.country}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Status Badge */}
        <div className={`member-list-status-mobile enhanced ${
          member.saved 
            ? 'member-list-status-saved-mobile' 
            : 'member-list-status-not-saved-mobile'
        }`}>
          {member.saved ? (
            <CheckCircleIcon className="h-3 w-3" />
          ) : (
            <XCircleIcon className="h-3 w-3" />
          )}
        </div>
      </div>

      {/* Enhanced List Actions */}
      <div className="member-list-actions-mobile enhanced">
        <button
          onClick={() => handleViewMember(member.id!)}
          className="member-list-action-btn-mobile view enhanced"
        >
          <EyeIcon className="h-4 w-4" />
          <span>View</span>
        </button>
        <button
          onClick={() => handleEditMember(member.id!)}
          className="member-list-action-btn-mobile edit enhanced"
        >
          <PencilIcon className="h-4 w-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={() => handleDeleteMember(member.id!)}
          className="member-list-action-btn-mobile delete enhanced"
        >
          <TrashIcon className="h-4 w-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`my-members-page enhanced min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 ${
      isMobile ? 'p-4' : 'p-6'
    }`}>
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-0' : ''}`}>
        {/* Enhanced Header */}
        <div className={`mb-8 ${isMobile ? 'mb-4' : ''}`}>
          <button
            onClick={() => {
              navigate(`${getBasePath()}/dashboard`);
            }}
            className={`flex items-center text-gray-600 hover:text-green-600 transition-all duration-300 hover:scale-105 ${
              isMobile ? 'mb-3' : 'mb-4'
            }`}
          >
            <ArrowLeftIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2`} />
            Back to Dashboard
          </button>
          
          <div className={`header-actions enhanced ${
            isMobile 
              ? 'flex-col gap-4' 
              : 'flex items-center justify-between flex-wrap gap-4'
          }`}>
            <div className={isMobile ? 'text-center' : ''}>
              <h1 className={`page-title enhanced ${
                isMobile 
                  ? 'text-2xl font-bold text-gray-900 flex items-center justify-center'
                  : 'text-4xl font-bold text-gray-900 flex items-center'
              }`}>
                <UsersIcon className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-green-500 mr-3 animate-pulse`} />
                {showOnlyMyMembers ? 'My Members' : 'All Members'}
              </h1>
              <p className={`page-subtitle enhanced text-gray-600 mt-2 ${
                isMobile ? 'text-sm' : 'text-lg'
              }`}>
                {user?.role === 'admin' 
                  ? 'Manage all registered church members' 
                  : user?.role === 'apostle'
                  ? 'View and manage members in your assigned kanda centers'
                  : 'View and manage members you have registered'
                }
              </p>
            </div>
            
            <button
              onClick={() => {
                navigate(`${getBasePath()}/members/add`);
              }}
              className={`add-member-btn enhanced ${
                isMobile 
                  ? 'w-full px-4 py-3 text-sm min-h-[48px]'
                  : 'px-6 py-3'
              } bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-green-200`}
            >
              <PlusIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2`} />
              Add New Member
            </button>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className={`search-filter enhanced bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 ${
          isMobile ? 'p-4 mb-4' : 'p-6 mb-8'
        }`}>
          <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-col lg:flex-row gap-4'}`}>
            {/* Enhanced Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className={`${
                  isMobile ? 'h-4 w-4' : 'h-5 w-5'
                } text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2`} />
                <input
                  type="text"
                  placeholder={isMobile ? "Search members..." : "Search members by name, phone, or email..."}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`w-full ${
                    isMobile 
                      ? 'pl-9 pr-4 py-3 text-base min-h-[48px]' 
                      : 'pl-10 pr-4 py-3'
                  } border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white focus:bg-white`}
                  style={{ fontSize: isMobile ? '16px' : 'inherit' }}
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                <select
                  value={selectedRegion}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Regions</option>
                  {Array.from(new Set(displayedMembers.map((member) => member.region).filter(Boolean))).map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>

                <select
                  value={selectedCenterArea}
                  onChange={(e) => {
                    setSelectedCenterArea(e.target.value);
                    dispatch(setFilters({ center_area: e.target.value }));
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Centers/Areas</option>
                  {centerAreaOptions.map((center) => (
                    <option key={center} value={center}>{center}</option>
                  ))}
                </select>

                <select
                  value={selectedGender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

                <select
                  value={selectedSaved === null ? '' : selectedSaved ? 'true' : 'false'}
                  onChange={(e) => handleFilterChange('saved', e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Saved + Not Saved</option>
                  <option value="true">Saved</option>
                  <option value="false">Not Saved</option>
                </select>
              </div>
            )}

            {/* Enhanced Filter Toggle and View Mode */}
            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col sm:flex-row gap-2'}`}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`${
                  isMobile 
                    ? 'w-full px-4 py-3 text-sm min-h-[44px]' 
                    : 'px-4 py-3'
                } border-2 rounded-xl font-medium transition-all duration-300 flex items-center justify-center ${
                  showFilters 
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                    : 'border-gray-200 text-gray-700 hover:border-green-300 hover:shadow-sm'
                }`}
              >
                <FunnelIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2`} />
                Filters
                <ChevronDownIcon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ml-2 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <div className="view-mode-toggle-desktop enhanced w-full sm:w-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`view-mode-btn-desktop enhanced ${
                    viewMode === 'grid' ? 'active' : ''
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`view-mode-btn-desktop enhanced ${
                    viewMode === 'list' ? 'active' : ''
                  }`}
                >
                  <ListBulletIcon className="h-4 w-4" />
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className={`mt-6 pt-6 border-t border-gray-200`}>
              <div className={`${
                isMobile 
                  ? 'grid grid-cols-1 gap-4' 
                  : 'grid grid-cols-1 md:grid-cols-3 gap-4'
              }`}>
                <div>
                  <label className={`block text-sm font-medium text-gray-700 ${
                    isMobile ? 'mb-1' : 'mb-2'
                  }`}>Gender</label>
                  <select
                    value={selectedGender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className={`w-full ${
                      isMobile ? 'px-3 py-3 text-base min-h-[44px]' : 'px-3 py-2'
                    } border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                    style={{ fontSize: isMobile ? '16px' : 'inherit' }} // Prevent zoom on iOS
                  >
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 ${
                    isMobile ? 'mb-1' : 'mb-2'
                  }`}>Salvation Status</label>
                  <select
                    value={selectedSaved === null ? '' : selectedSaved.toString()}
                    onChange={(e) => handleFilterChange('saved', e.target.value === '' ? null : e.target.value === 'true')}
                    className={`w-full ${
                      isMobile ? 'px-3 py-3 text-base min-h-[44px]' : 'px-3 py-2'
                    } border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                    style={{ fontSize: isMobile ? '16px' : 'inherit' }} // Prevent zoom on iOS
                  >
                    <option value="">All Members</option>
                    <option value="true">Saved</option>
                    <option value="false">Not Saved</option>
                  </select>
                </div>

                <div className={`${isMobile ? '' : 'flex items-end'}`}>
                  <button
                    onClick={clearFilters}
                    className={`w-full ${
                      isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-4 py-2'
                    } text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200`}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className={`stats-grid ${
          isMobile 
            ? 'grid grid-cols-1 gap-3 mb-4' 
            : 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'
        }`}>
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${
            isMobile ? 'p-4' : 'p-6'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Total Members</p>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>{totalDisplayedMembers}</p>
              </div>
              <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-green-100 rounded-lg flex items-center justify-center`}>
                <UsersIcon className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-green-600`} />
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${
            isMobile ? 'p-4' : 'p-6'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Saved Members</p>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>
                  {members.filter(m => m.saved).length}
                </p>
              </div>
              <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-green-100 rounded-lg flex items-center justify-center`}>
                <CheckCircleIcon className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-green-600`} />
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${
            isMobile ? 'p-4' : 'p-6'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>This Month</p>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-600`}>
                  {members.filter(m => {
                    const memberDate = new Date(m.created_at || m.attending_date);
                    const now = new Date();
                    return memberDate.getMonth() === now.getMonth() && 
                           memberDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-blue-100 rounded-lg flex items-center justify-center`}>
                <CalendarIcon className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-blue-600`} />
              </div>
            </div>
          </div>
        </div>

        {/* Members Display */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : displayedMembers.length === 0 ? (
          <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${
            isMobile ? 'p-8 mx-4' : 'p-12'
          } text-center`}>
            <UsersIcon className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} text-gray-300 mx-auto mb-4`} />
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-2`}>No Members Found</h3>
            <p className={`text-gray-600 ${isMobile ? 'mb-4 text-sm' : 'mb-6'}`}>
              {searchTerm || selectedGender || selectedRegion || selectedSaved !== null
                ? 'Try adjusting your search criteria or filters.'
                : user?.role === 'admin' 
                ? 'No members have been registered yet.'
                : "You haven't registered any members yet."
              }
            </p>
            <button
              onClick={() => {
                  navigate(`${getBasePath()}/members/add`);
              }}
              className={`${
                isMobile 
                  ? 'w-full px-4 py-3 text-sm' 
                  : 'px-6 py-3'
              } bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center ${
                isMobile ? 'justify-center' : 'mx-auto'
              }`}
            >
              <PlusIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2`} />
              Add First Member
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'members-grid-desktop' : 'members-list-responsive'}>
            {displayedMembers.map((member) => 
              viewMode === 'grid'
                ? <MemberCard key={member.id} member={member} />
                : <MemberListItem key={member.id} member={member} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMembers;