import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Phone, Mail, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { membersAPI } from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/member-search-page.css';

interface Member {
  id: number;
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
  created_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

const MemberSearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const getImageUrl = (picturePath: string) => {
    if (!picturePath) return '';
    if (picturePath.startsWith('http')) return picturePath;
    
    // Get the API base URL dynamically
    const hostname = window.location.hostname;
    let baseURL = 'http://localhost:8000';
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      baseURL = `http://${hostname}:8000`;
    }
    
    return `${baseURL}${picturePath}`;
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.warning('Please enter a search term');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await membersAPI.searchMembers(searchTerm.trim());
      setMembers(response.data);
      setSelectedMember(null);

      if (response.data.length === 0) {
        toast.info(`No members found with "${searchTerm.trim()}". Try a different search term.`);
      } else {
        toast.success(`Found ${response.data.length} member${response.data.length !== 1 ? 's' : ''} matching "${searchTerm.trim()}"`);
      }
    } catch (error: any) {
      if (error.response) {
        // Server responded with error status
        toast.error(`Search failed: ${error.response.data.detail || error.response.statusText}`);
      } else if (error.request) {
        // Request was made but no response received
        toast.error('Network error: Unable to connect to the server. Please check if the server is running.');
      } else {
        // Something else happened
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSearch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="member-search-page">
      <div className="msp-bg msp-bg-1" aria-hidden="true" />
      <div className="msp-bg msp-bg-2" aria-hidden="true" />
      <div className="msp-grain" aria-hidden="true" />
      <div className="search-container">
        {/* Back to Login Link */}
        <Link to="/login" className="back-to-login">
          <ArrowLeft size={20} />
          Back to Login
        </Link>

        {/* Search Card - Similar to Login Form */}
        <div className="search-card">
          <div className="search-card-header">
            <h1 className="search-card-title">
              <Search size={26} />
              Member Search
            </h1>
            <p className="search-card-subtitle">
              Search for registered members in the EFATHA system
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="search-form">
            <div className="search-input-group">
              <div className="search-input-wrapper">
                <Search className="search-input-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="search-form-input"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSearchClick}
              disabled={loading}
              className="search-form-btn"
            >
              {loading ? (
                <>
                  <div className="search-loading-spinner" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Search Members
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="search-results-section">
            {members.length > 0 ? (
              <>
                <div className="results-summary">
                  <h3 className="results-title">
                    Found {members.length} member{members.length !== 1 ? 's' : ''}
                  </h3>
                </div>

                <div className="members-results-grid">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="member-result-card"
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="member-card-header">
                        <div className="member-avatar-container">
                          {member.picture ? (
                            <img 
                              src={getImageUrl(member.picture)} 
                              alt={`${member.first_name} ${member.last_name}'s Profile`} 
                              className="member-avatar-img"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = target.parentElement?.querySelector('.member-avatar-placeholder') as HTMLElement;
                                if (placeholder) {
                                  placeholder.classList.remove('hidden');
                                }
                              }}
                            />
                          ) : null}
                          <div className={`member-avatar-placeholder ${member.picture ? 'hidden' : ''}`}>
                            <User size={24} />
                          </div>
                        </div>
                        <div className="member-basic-info">
                          <h3 className="member-full-name">
                            {member.first_name} {member.middle_name} {member.last_name}
                          </h3>
                          <p className="member-registration-info">
                            Registered by: {(member as any).created_by_name || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <div className="member-contact-summary">
                        <div className="contact-item">
                          <Phone size={16} />
                          <span>{member.mobile_no}</span>
                        </div>
                        {member.email && (
                          <div className="contact-item">
                            <Mail size={16} />
                            <span>{member.email}</span>
                          </div>
                        )}
                        <div className="contact-item">
                          <MapPin size={16} />
                          <span>{member.residence}</span>
                        </div>
                        <div className="contact-item">
                          <Calendar size={16} />
                          <span>{formatDate(member.attending_date)}</span>
                        </div>
                      </div>

                      <div className="member-tags">
                        <span className={`status-tag ${member.saved ? 'saved' : 'unsaved'}`}>
                          {member.saved ? 'Saved' : 'Not Saved'}
                        </span>
                        <span className="gender-tag">{member.gender}</span>
                        <span className="age-tag">Age {member.age}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-results">
                <div className="no-results-content">
                  <Search size={48} className="no-results-icon" />
                  <h3 className="no-results-title">No Members Found</h3>
                  <p className="no-results-text">
                    No members match your search criteria. Try using different keywords.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Member Details Modal */}
        {selectedMember && (
          <div className="member-modal-overlay" onClick={() => setSelectedMember(null)}>
            <div className="member-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="member-modal-header">
                <h2 className="member-modal-title">Member Details</h2>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="member-modal-close"
                >
                  ×
                </button>
              </div>

              <div className="member-modal-body">
                <div className="member-profile-header">
                  <div className="profile-image-container">
                    {selectedMember.picture ? (
                      <img 
                        src={getImageUrl(selectedMember.picture)} 
                        alt={`${selectedMember.first_name} ${selectedMember.last_name}'s Profile`} 
                        className="profile-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.parentElement?.querySelector('.profile-image-placeholder') as HTMLElement;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={`profile-image-placeholder ${selectedMember.picture ? 'hidden' : ''}`}>
                      <User size={48} />
                    </div>
                  </div>
                  <div className="profile-main-info">
                    <h3 className="profile-full-name">
                      {selectedMember.first_name} {selectedMember.middle_name} {selectedMember.last_name}
                    </h3>
                    <p className="profile-basic-details">
                      {selectedMember.age} years old • {selectedMember.gender} • {selectedMember.marital_status}
                    </p>
                    <p className="profile-registration-details">
                      Registered by {(selectedMember as any).created_by_name || 'Unknown'}
                      on {formatDate(selectedMember.created_at)}
                    </p>
                  </div>
                </div>

                <div className="member-details-grid">
                  <div className="detail-group">
                    <h4 className="detail-group-title">Contact Information</h4>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{selectedMember.mobile_no}</span>
                    </div>
                    {selectedMember.email && (
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{selectedMember.email}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{selectedMember.postal_address || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="detail-group">
                    <h4 className="detail-group-title">Location</h4>
                    <div className="detail-item">
                      <span className="detail-label">Country:</span>
                      <span className="detail-value">{selectedMember.country}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Region:</span>
                      <span className="detail-value">{selectedMember.region}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Zone:</span>
                      <span className="detail-value">{selectedMember.zone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Cell:</span>
                      <span className="detail-value">{selectedMember.cell}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Residence:</span>
                      <span className="detail-value">{selectedMember.residence}</span>
                    </div>
                  </div>

                  <div className="detail-group">
                    <h4 className="detail-group-title">Church Information</h4>
                    <div className="detail-item">
                      <span className="detail-label">Registration #:</span>
                      <span className="detail-value">{selectedMember.church_registration_number || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Position:</span>
                      <span className="detail-value">{selectedMember.church_position || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Origin:</span>
                      <span className="detail-value">{selectedMember.origin}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Saved:</span>
                      <span className={`detail-value status-indicator ${selectedMember.saved ? 'saved' : 'unsaved'}`}>
                        {selectedMember.saved ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  <div className="detail-group">
                    <h4 className="detail-group-title">Additional Info</h4>
                    <div className="detail-item">
                      <span className="detail-label">Career:</span>
                      <span className="detail-value">{selectedMember.career || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Attending Date:</span>
                      <span className="detail-value">{formatDate(selectedMember.attending_date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Visitors Count:</span>
                      <span className="detail-value">{selectedMember.visitors_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberSearchPage;