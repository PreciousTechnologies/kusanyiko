import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../hooks/redux';
import { Search, User, Phone, Mail, MapPin, Calendar, Filter } from 'lucide-react';
import { userManagementAPI, membersAPI } from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/search-members.css';

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

interface SystemUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
}

const SearchMembers: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all users for filtering
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userManagementAPI.getUsers();
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim() && !selectedUser) {
      toast.warning('Please enter a search term or select a user');
      return;
    }

    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (selectedUser) {
        params.created_by = selectedUser;
      }

      const response = await membersAPI.getMembers(params);
      setMembers(response.data);
      setSelectedMember(null);

      if (response.data.length === 0) {
        toast.info('No members found matching your search criteria');
      }
    } catch (error) {
      console.error('Error searching members:', error);
      toast.error('Failed to search members');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="search-members-container">
      <div className="search-header">
        <h1 className="search-title">Member Search Engine</h1>
        <p className="search-subtitle">Search and view all registered members across the system</p>
      </div>

      {/* Search Controls */}
      <div className="search-controls">
        <div className="search-input-group">
          <div className="relative flex-1">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="search-input"
            />
          </div>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="user-filter-select"
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id.toString()}>
                {user.first_name} {user.last_name} ({user.username})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="filter-toggle-btn"
          >
            <Filter size={20} />
            Filters
          </button>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="search-btn"
          >
            {loading ? (
              <>
                <div className="search-spinner" />
                Searching...
              </>
            ) : (
              <>
                <Search size={20} />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="search-results">
        {members.length > 0 && (
          <div className="results-header">
            <h3 className="results-count">Found {members.length} member{members.length !== 1 ? 's' : ''}</h3>
          </div>
        )}

        <div className="members-grid">
          {members.map((member) => (
            <div
              key={member.id}
              className="member-card"
              onClick={() => setSelectedMember(member)}
            >
              <div className="member-header">
                <div className="member-avatar">
                  {member.picture ? (
                    <img src={member.picture} alt="Profile" className="avatar-image" />
                  ) : (
                    <User size={24} className="avatar-icon" />
                  )}
                </div>
                <div className="member-info">
                  <h3 className="member-name">
                    {member.first_name} {member.middle_name} {member.last_name}
                  </h3>
                  <p className="member-registered-by">
                    Registered by: {(member as any).created_by_name || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="member-details">
                <div className="detail-item">
                  <Phone size={16} />
                  <span>{member.mobile_no}</span>
                </div>
                {member.email && (
                  <div className="detail-item">
                    <Mail size={16} />
                    <span>{member.email}</span>
                  </div>
                )}
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{member.residence}</span>
                </div>
                <div className="detail-item">
                  <Calendar size={16} />
                  <span>Joined: {formatDate(member.attending_date)}</span>
                </div>
              </div>

              <div className="member-status">
                <span className={`status-badge ${member.saved ? 'saved' : 'unsaved'}`}>
                  {member.saved ? 'Saved' : 'Not Saved'}
                </span>
                <span className="gender-badge">
                  {member.gender}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Member Details</h2>
              <button
                onClick={() => setSelectedMember(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="member-profile-section">
                <div className="profile-image">
                  {selectedMember.picture ? (
                    <img src={selectedMember.picture} alt="Profile" className="profile-img" />
                  ) : (
                    <div className="profile-placeholder">
                      <User size={48} />
                    </div>
                  )}
                </div>
                <div className="profile-info">
                  <h3 className="profile-name">
                    {selectedMember.first_name} {selectedMember.middle_name} {selectedMember.last_name}
                  </h3>
                  <p className="profile-meta">Age: {selectedMember.age} • {selectedMember.gender}</p>
                  <p className="profile-meta">Status: {selectedMember.marital_status}</p>
                  <p className="profile-registered">
                    Registered by: {(selectedMember as any).created_by_name || 'Unknown'}
                    {' '}on {formatDate(selectedMember.created_at)}
                  </p>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-section">
                  <h4>Contact Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedMember.mobile_no}</span>
                  </div>
                  {selectedMember.email && (
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedMember.email}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedMember.postal_address || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Location Details</h4>
                  <div className="detail-row">
                    <span className="detail-label">Country:</span>
                    <span className="detail-value">{selectedMember.country}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Region:</span>
                    <span className="detail-value">{selectedMember.region}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Zone:</span>
                    <span className="detail-value">{selectedMember.zone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Cell:</span>
                    <span className="detail-value">{selectedMember.cell}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Church Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Registration #:</span>
                    <span className="detail-value">{selectedMember.church_registration_number || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Position:</span>
                    <span className="detail-value">{selectedMember.church_position || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Origin:</span>
                    <span className="detail-value">{selectedMember.origin}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Visitors:</span>
                    <span className="detail-value">{selectedMember.visitors_count}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Career:</span>
                    <span className="detail-value">{selectedMember.career || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Attending Date:</span>
                    <span className="detail-value">{formatDate(selectedMember.attending_date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Saved:</span>
                    <span className={`status-indicator ${selectedMember.saved ? 'saved' : 'unsaved'}`}>
                      {selectedMember.saved ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchMembers;