import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, Save, X, User } from 'lucide-react';
import { createMember, updateMember } from '../../store/slices/membersSlice';
import { RootState, AppDispatch } from '../../store';
import { Member } from '../../types';
import { Button, Input, Select, Card, Modal } from '../../components/ui';
import { TANZANIA_REGIONS, DAR_ES_SALAAM_AREAS } from '../../services/api';
import { toast } from 'sonner';

interface MemberFormData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'male' | 'female';
  age: number;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  saved: boolean;
  church_registration_number: string;
  country: string;
  region: string;
  center_area: string;
  zone: string;
  cell: string;
  postal_address?: string;
  mobile_no: string;
  email?: string;
  church_position?: string;
  visitors_count: number;
  origin: 'invited' | 'efatha';
  residence: string;
  career?: string;
  attending_date: string;
}

const schema = yup.object().shape({
  first_name: yup.string().required('First name is required'),
  middle_name: yup.string(),
  last_name: yup.string().required('Last name is required'),
  gender: yup.string().required('Gender is required'),
  age: yup.number().positive().integer().min(1).max(150).required('Age is required'),
  marital_status: yup.string().required('Marital status is required'),
  saved: yup.boolean().required('Salvation status is required'),
  church_registration_number: yup.string().required('Church registration number is required'),
  country: yup.string().required('Country is required'),
  region: yup.string().required('Region is required'),
  center_area: yup.string().required('Center/Area is required'),
  zone: yup.string().required('Zone is required'),
  cell: yup.string().required('Cell is required'),
  postal_address: yup.string(),
  mobile_no: yup.string().required('Mobile number is required'),
  email: yup.string().email('Invalid email format'),
  church_position: yup.string(),
  visitors_count: yup.number().min(0).integer().required('Visitors count is required'),
  origin: yup.string().required('Origin is required'),
  residence: yup.string().required('Residence is required'),
  career: yup.string(),
  attending_date: yup.string().required('Attending date is required'),
});

interface MemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member;
  onSuccess?: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ 
  isOpen, 
  onClose, 
  member, 
  onSuccess 
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.members);

  const isEditing = !!member;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: member || {
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: 'male',
      age: 18,
      marital_status: 'single',
      saved: false,
      church_registration_number: '',
      country: 'Tanzania',
      region: '',
      center_area: '',
      zone: '',
      cell: '',
      postal_address: '',
      mobile_no: '',
      email: '',
      church_position: '',
      visitors_count: 0,
      origin: 'invited',
      residence: '',
      career: '',
      attending_date: new Date().toISOString().split('T')[0],
    },
  });

  const watchCountry = watch('country');
  const watchRegion = watch('region');

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Handle file upload
      const fileInput = fileInputRef.current;
      if (fileInput?.files?.[0]) {
        formData.append('picture', fileInput.files[0]);
      }

      let result;
      if (isEditing && member?.id) {
        result = await dispatch(updateMember({ id: member.id, data: formData }));
      } else {
        result = await dispatch(createMember(formData));
      }

      if (createMember.fulfilled.match(result) || updateMember.fulfilled.match(result)) {
        toast.success(isEditing ? 'Member updated successfully!' : 'Member registered successfully!');
        reset();
        setPreviewImage(null);
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.payload as string || 'Operation failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    reset();
    setPreviewImage(null);
    onClose();
  };

  const regionOptions = watchCountry === 'Tanzania' ? TANZANIA_REGIONS : [];
  const isDarEsSalaam = watchRegion === 'dar_es_salaam';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Member' : 'Register New Member'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-white/20 pb-2">
            Personal Information
          </h3>
          
          <div className="form-row-3">
            <Input
              label="First Name"
              placeholder="Enter first name"
              error={errors.first_name?.message}
              {...register('first_name')}
              required
            />
            <Input
              label="Middle Name"
              placeholder="Enter middle name (optional)"
              error={errors.middle_name?.message}
              {...register('middle_name')}
            />
            <Input
              label="Last Name"
              placeholder="Enter last name"
              error={errors.last_name?.message}
              {...register('last_name')}
              required
            />
          </div>

          <div className="form-row-3">
            <Select
              label="Gender"
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
              error={errors.gender?.message}
              {...register('gender')}
              required
            />
            <Input
              label="Age"
              type="number"
              min="1"
              max="150"
              placeholder="Enter age"
              error={errors.age?.message}
              {...register('age')}
              required
            />
            <Select
              label="Marital Status"
              options={[
                { value: 'single', label: 'Single' },
                { value: 'married', label: 'Married' },
                { value: 'divorced', label: 'Divorced' },
                { value: 'widowed', label: 'Widowed' },
              ]}
              error={errors.marital_status?.message}
              {...register('marital_status')}
              required
            />
          </div>
        </div>

        {/* Church Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-white/20 pb-2">
            Church Information
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Saved (Ameokoka) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="true"
                    {...register('saved')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="false"
                    {...register('saved')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
              {errors.saved && <span className="form-error">{errors.saved.message}</span>}
            </div>
            
            <Input
              label="Church Registration Number"
              placeholder="Enter registration number"
              error={errors.church_registration_number?.message}
              {...register('church_registration_number')}
              required
            />
          </div>

          <div className="form-row">
            <Input
              label="Church Position"
              placeholder="Enter church position (optional)"
              error={errors.church_position?.message}
              {...register('church_position')}
            />
            <Select
              label="Origin"
              options={[
                { value: 'invited', label: 'Invited' },
                { value: 'efatha', label: 'Efatha' },
              ]}
              error={errors.origin?.message}
              {...register('origin')}
              required
            />
          </div>

          <Input
            label="Visitors Count"
            type="number"
            min="0"
            placeholder="Number of visitors brought"
            error={errors.visitors_count?.message}
            {...register('visitors_count')}
            required
          />
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-white/20 pb-2">
            Location Information
          </h3>
          
          <div className="form-row">
            <Select
              label="Country"
              options={[
                { value: 'Tanzania', label: 'Tanzania' },
                { value: 'Kenya', label: 'Kenya' },
                { value: 'Uganda', label: 'Uganda' },
                { value: 'Other', label: 'Other' },
              ]}
              error={errors.country?.message}
              {...register('country')}
              required
            />
            
            {watchCountry === 'Tanzania' ? (
              <Select
                label="Region"
                options={regionOptions}
                placeholder="Select Tanzania region"
                error={errors.region?.message}
                {...register('region')}
                required
              />
            ) : (
              <Input
                label="Region/State"
                placeholder="Enter region or state"
                error={errors.region?.message}
                {...register('region')}
                required
              />
            )}
          </div>

          {isDarEsSalaam && (
            <Select
              label="Dar es Salaam Area"
              options={DAR_ES_SALAAM_AREAS}
              placeholder="Select area in Dar es Salaam"
              {...register('region')}
            />
          )}

          <div className="form-row-3">
            <Input
              label="Center/Area"
              placeholder="Enter center or area"
              error={errors.center_area?.message}
              {...register('center_area')}
              required
            />
            <Input
              label="Zone"
              placeholder="Enter zone"
              error={errors.zone?.message}
              {...register('zone')}
              required
            />
            <Input
              label="Cell"
              placeholder="Enter cell"
              error={errors.cell?.message}
              {...register('cell')}
              required
            />
          </div>

          <Input
            label="Residence"
            placeholder="Enter current residence"
            error={errors.residence?.message}
            {...register('residence')}
            required
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-white/20 pb-2">
            Contact Information
          </h3>
          
          <div className="form-row">
            <Input
              label="Mobile Number"
              type="tel"
              placeholder="Enter mobile number"
              error={errors.mobile_no?.message}
              {...register('mobile_no')}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="Enter email (optional)"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <Input
            label="Postal Address"
            placeholder="Enter postal address (optional)"
            error={errors.postal_address?.message}
            {...register('postal_address')}
          />
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-white/20 pb-2">
            Additional Information
          </h3>
          
          <div className="form-row">
            <Input
              label="Career"
              placeholder="Enter career/profession (optional)"
              error={errors.career?.message}
              {...register('career')}
            />
            <Input
              label="Attending Date"
              type="date"
              error={errors.attending_date?.message}
              {...register('attending_date')}
              required
            />
          </div>

          {/* Picture Upload */}
          <div className="form-group">
            <label className="form-label">Picture</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="glass-input"
                />
              </div>
              {previewImage && (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            <Save size={20} />
            {isEditing ? 'Update Member' : 'Register Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MemberForm;