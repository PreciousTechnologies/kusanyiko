import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateMember, fetchMember } from '../../store/slices/membersSlice';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CameraIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  DocumentCheckIcon,
  GlobeAltIcon,
  HomeIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Member } from '../../types';
import ProfilePicture from '../../components/ui/ProfilePicture';
import Camera from '../../components/ui/Camera';
import { dialog } from '../../components/ui/Dialog';
import { PageHeader } from '../../components/app-shell';
import { SectionCard, ClayButton, StatusPill, Stepper } from '../../components/ui-bits';
import { motion } from 'motion/react';
import { variants } from '../../lib/motion-tokens';
import '../../styles/forms.css';
import '../../styles/mobile-members.css';

// All Tanzania regions (mainland and Zanzibar)
const ALL_TANZANIA_REGIONS = [
  'Arusha',
  'Dodoma', 
  'Geita',
  'Iringa',
  'Kagera',
  'Katavi',
  'Kigoma',
  'Kilimanjaro',
  'Lindi',
  'Manyara',
  'Mara',
  'Mbeya',
  'Morogoro',
  'Mtwara',
  'Mwanza',
  'Njombe',
  'Pwani',
  'Rukwa',
  'Ruvuma',
  'Shinyanga',
  'Simiyu',
  'Singida',
  'Songwe',
  'Tabora',
  'Tanga',
  'Mwenge',
  'Imara',
  'Kinondoni',
  'Kisukulu',
  'Temeke',
  'Ushindi',
  'Yombo',
  'Kusini Unguja',
  'Kaskazini Unguja',
  'Mjini Magharibi',
  'Kaskazini Pemba',
  'Kusini Pemba'
];

// Centers grouped by region (Dar es Salaam zones each have their own list;
// other regions fall back to the region name itself)
const REGION_CENTERS: Record<string, string[]> = {
  Mwenge: [
    'Yerusalemu', 'Utukufu', 'Amani', 'Nazareth', 'Shalom', 'Sayuni',
    'Bethlehem', 'Upendo', 'Tumaini'
  ],
  Imara: [
    'Kwembe', 'Gilgali', 'Makurunge', 'Mpigi Mheza', 'Sweet Corner',
    'Mbezi Msakuzi', 'Kibwegere', 'Mwanabwito', 'Boko Mnemela',
    'Malamba Mawili', 'Mwendakasi', 'Maili Moja', 'Makabe', 'Kibamba',
    'Msangani', 'Kongowe', 'Kiluvya', 'Mbezi Luis', 'Matosa', 'Soga',
    'Mamlaka Pangani', 'Mlaneno', 'Imara Mbezi'
  ],
  Kinondoni: [
    'Nazareth', 'Msata', 'Makurunge', 'Madesa', 'Zinga', 'Kiwangwa',
    'Mbweni', 'Fukayosi', 'Ubena', 'Utulivu', 'Kiembeni', 'Miale ya Moto',
    'Salasala', 'Lugoba', 'Chalinze', 'Boko', 'Bagamoyo', 'Bubujiko', 'Mwenge'
  ],
  Kisukulu: [
    'Makoka', 'Bonyokwa', 'Kisukulu'
  ],
  Temeke: [
    'Kilakala', 'Tuangoma', 'Gezaulole', 'Kisarawe II', 'Kimbilio',
    'Kijichi', 'Kimanzichana', 'Bungu', 'Vikunai', 'Kibiti', 'Mbutu',
    'Changamkeni', 'Mbande', 'Ikwiriri', 'Mkuranga', 'Mbagala', 'Kigamboni'
  ],
  Ushindi: [
    'Pugu', 'Kivule Ebeneza', 'Msongola', 'Kisarawe', 'Mongolandege',
    'Magole Amani', 'Bangulo', 'Chanika Ukombozi', 'Mvuti', 'Kivule Shalom',
    'Ulongoni', 'Magole B', 'Kifuru', 'Kiyombo', 'Mbondole', 'Mbombambili',
    'Viwege', 'Chanika Buyuni', 'Majohe', 'Mazizini', 'Kinyerezi', 'Matunda'
  ],
  Yombo: [
    'Yombo'
  ],
};

// Church position options
const CHURCH_POSITION_OPTIONS = [
  'Mtume Mkuu',
  'Msaidizi Binafsi wa Mtume Mkuu', 
  'Mtume',
  'Mchungaji Kiongozi',
  'Mchungaji',
  'Katibu',
  'Mtawala',
  'Askofu',
  'Cell Leader',
  'Mweka Hazina',
  'Mwanakamati',
  'Mjumbe wa Board',
  'Funguka',
  'ICT',
  'TV',
  'Sunday School Teacher',
  'Walinzi'
];

const schema = yup.object({
  first_name: yup.string().required('First name is required'),
  middle_name: yup.string().optional(),
  last_name: yup.string().required('Last name is required'),
  gender: yup.string().oneOf(['male', 'female'], 'Please select a gender').required('Gender is required'),
  age: yup.number().min(1, 'Age must be at least 1').max(120, 'Age must be less than 120').required('Age is required'),
  marital_status: yup.string().oneOf(['single', 'married', 'divorced', 'widowed'], 'Please select marital status').required('Marital status is required'),
  saved: yup.boolean().required('Please indicate salvation status'),
  church_registration_number: yup.string().optional(),
  country: yup.string().required('Country is required'),
  region: yup.string().when('country', {
    is: 'Tanzania',
    then: (schema) => schema.required('Region is required when Tanzania is selected'),
    otherwise: (schema) => schema.optional()
  }),
  center_area: yup.string().optional(),
  zone: yup.string().required('Zone is required'),
  cell: yup.string().required('Cell is required'),
  postal_address: yup.string().optional(),
  mobile_no: yup.string().required('Mobile number is required'),
  email: yup.string().email('Invalid email format').optional(),
  church_position: yup.string().optional(),
  visitors_count: yup.number().min(0, 'Visitors count cannot be negative').default(0),
  origin: yup.string().oneOf(['invited', 'efatha'], 'Please select origin').required('Origin is required'),
  residence: yup.string().required('Residence is required'),
  career: yup.string().optional(),
  attending_date: yup.string().required('Attending date is required')
});

interface EditMemberFormData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'male' | 'female';
  age: number;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  saved: boolean;
  church_registration_number?: string;
  country: string;
  region?: string;
  center_area?: string;
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

const EditMember: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const getBasePath = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'apostle') return '/apostle';
    return '/registrant';
  };
  const { members, loading } = useAppSelector((state) => state.members);
  
  const [member, setMember] = useState<Member | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFullForm, setShowFullForm] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    trigger,
    getValues,
  } = useForm<EditMemberFormData>({
    resolver: yupResolver(schema) as any,
    mode: 'onChange',
    defaultValues: {
      country: 'Tanzania',
      visitors_count: 0,
      origin: 'invited',
    },
  });

  const watchedCountry = watch('country');
  const watchedRegion = watch('region');
  const totalSteps = 4;

  const stepTitles = [
    'Personal Information',
    'Contact Details',
    'Church Information',
    'Review & Submit'
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!id) {
      setMember(null);
      setMemberNotFound(true);
      setLoadingMember(false);
      return;
    }
    const applyMember = (foundMember: Member) => {
      setMember(foundMember);
      setMemberNotFound(false);
      setLoadingMember(false);
      // Fresh photo state per member — never leak a preview/file/flag across members
      setProfileFile(null);
      setProfileImage(
        foundMember.picture && typeof foundMember.picture === 'string' ? foundMember.picture : null
      );
      setRemovePhoto(false);
      reset({
          first_name: foundMember.first_name,
          middle_name: foundMember.middle_name || '',
          last_name: foundMember.last_name,
          gender: foundMember.gender as 'male' | 'female',
          age: foundMember.age || 0,
          marital_status: foundMember.marital_status as any,
          saved: foundMember.saved,
          church_registration_number: foundMember.church_registration_number || '',
          country: foundMember.country || 'Tanzania',
          region: foundMember.region || '',
          center_area: foundMember.center_area || '',
          zone: foundMember.zone || '',
          cell: foundMember.cell || '',
          postal_address: foundMember.postal_address || '',
          mobile_no: foundMember.mobile_no,
          email: foundMember.email || '',
          church_position: foundMember.church_position || '',
          visitors_count: foundMember.visitors_count || 0,
          origin: foundMember.origin as 'invited' | 'efatha',
          residence: foundMember.residence || '',
          career: foundMember.career || '',
          attending_date: foundMember.attending_date || new Date().toISOString().split('T')[0]
        });
    };
    // IDs are uuid strings now (Django used ints) — compare as strings.
    const listed = members.find(m => String(m.id) === String(id));
    if (listed) {
      applyMember(listed);
      return;
    }
    // Not in the loaded list (direct URL, fresh reload) — fetch it.
    setLoadingMember(true);
    dispatch(fetchMember(id))
      .unwrap()
      .then((m) => applyMember(m))
      .catch(() => {
        setMember(null);
        setMemberNotFound(true);
        setLoadingMember(false);
      });
  }, [id, members, reset, dispatch]);

  const handleBack = () => {
    navigate(`${getBasePath()}/members`);
  };

  const handleCameraCapture = (imageFile: File) => {
    setProfileFile(imageFile);
    setRemovePhoto(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setProfileImage(result);
      }
    };
    reader.readAsDataURL(imageFile);
    setIsCameraOpen(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileFile(file);
      setRemovePhoto(false);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setProfileImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset the input so the same file can be picked again
    event.target.value = '';
  };

  // Remove the current photo (takes effect on Save)
  const handleRemovePhoto = async () => {
    const ok = await dialog.danger({
      title: 'Remove photo?',
      message: 'The member photo will be deleted when you save. You can upload a new one anytime.',
      confirmText: 'Remove photo',
    });
    if (!ok) return;
    setProfileFile(null);
    setProfileImage(null);
    setRemovePhoto(true);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof EditMemberFormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['first_name', 'last_name', 'gender', 'age', 'marital_status'];
        break;
      case 2:
        fieldsToValidate = ['mobile_no', 'country', 'residence', 'zone', 'cell'];
        if (watchedCountry === 'Tanzania') {
          fieldsToValidate.push('region');
        }
        break;
      case 3:
        fieldsToValidate = ['saved', 'origin', 'attending_date'];
        break;
      case 4:
        return;
      default:
        return;
    }
    
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      setShakeKey(k => k + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: EditMemberFormData) => {
    if (!member?.id) return;
    
    try {
      setIsSubmitted(true);
      
      let submitData: FormData | EditMemberFormData;
      
      if (profileFile) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'church_registration_number' && value === '') {
              return;
            }
            if (key === 'region' && value === '' && data.country !== 'Tanzania') {
              return;
            }
            if (typeof value === 'boolean') {
              formData.append(key, value.toString());
            } else if (typeof value === 'number') {
              formData.append(key, value.toString());
            } else if (typeof value === 'string') {
              const optionalFields = ['middle_name', 'church_registration_number', 'center_area', 'postal_address', 'email', 'church_position', 'career'];
              if (optionalFields.includes(key) && value.trim() === '') {
                return;
              }
              if (key === 'region' && value.trim() === '' && data.country !== 'Tanzania') {
                return;
              }
              formData.append(key, value);
            } else {
              formData.append(key, value.toString());
            }
          }
        });
        formData.append('picture', profileFile);
        submitData = formData;
      } else {
        const cleanedData = { ...data };
        if (cleanedData.church_registration_number === '') {
          delete cleanedData.church_registration_number;
        }
        if (removePhoto) {
          (cleanedData as any).picture_url = null;
        }
        submitData = cleanedData;
      }

      const result = await dispatch(updateMember({
        id: member.id,
        data: submitData
      }));

      if (updateMember.fulfilled.match(result)) {
        setMember(result.payload as Member);
        setProfileFile(null);
        setRemovePhoto(false);
        await dialog.success('Member updated', 'Member information (and photo, if changed) was saved successfully.');
        setTimeout(() => {
          handleBack();
        }, 800);
      } else {
        console.error('Failed to update member:', result.payload);
        await dialog.error('Update failed', 'Failed to update member. Please try again.');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      await dialog.error('Update failed', 'Failed to update member. Please try again.');
    } finally {
      setIsSubmitted(false);
    }
  };

  const handleFinalSubmit = async () => {
    const isFormValid = await trigger();
    
    if (isFormValid) {
      const formData = getValues();
      await onSubmit(formData);
    } else {
      setShakeKey(k => k + 1);
    }
  };

  if (loadingMember) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (memberNotFound || !member) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Member" subtitle="Record lookup" />
        <div className="surface max-w-md w-full mx-auto p-6 text-center">
          <h2 className="font-display text-xl font-bold">Member Not Found</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">The member you're trying to edit doesn't exist or has been removed.</p>
          <ClayButton
            tone="primary"
            className="w-full"
            onClick={handleBack}
          >
            Back to Members
          </ClayButton>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Member" subtitle="Update member information" />
        <motion.div variants={variants.fadeScaleIn} initial="initial" animate="animate" className="surface max-w-md w-full mx-auto p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Member Updated Successfully!</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            The member information has been updated in the system.
          </p>
          <div className="mb-6 flex justify-center">
            <StatusPill stage="Redirecting to members…" tone="success" />
          </div>
          <ClayButton
            tone="primary"
            className="w-full"
            onClick={handleBack}
          >
            Return to Members
          </ClayButton>
        </motion.div>
      </div>
    );
  }

  // Mobile rendering
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-[color-mix(in_srgb,var(--card)_90%,transparent)] backdrop-blur-md border-b border-[var(--border)] px-4 py-3 rounded-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-[var(--primary)] hover:opacity-80 transition-opacity"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <h1 className="font-display text-base font-bold text-center flex-1 mx-4">
              Edit Member
            </h1>
            
            <button
              onClick={() => setShowFullForm(!showFullForm)}
              className="flex items-center text-[var(--primary)] hover:opacity-80 transition-opacity"
            >
              <span className="text-sm font-medium mr-1">
                {showFullForm ? 'Simple' : 'Full'}
              </span>
              <ChevronRightIcon className={`h-4 w-4 transition-transform ${showFullForm ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="surface p-4 flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-[var(--secondary)]">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <ProfilePicture
                    src={removePhoto ? null : member.picture}
                    firstName={member.first_name}
                    lastName={member.last_name}
                    size="md"
                    className="w-14 h-14 text-[var(--primary)]"
                  />
                )}
              </div>
              
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <CameraIcon className="h-3 w-3 text-white" />
              </button>
              {(profileImage || member.picture) && !profileFile && !removePhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -bottom-1 -left-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                  title="Remove photo"
                >
                  <TrashIcon className="h-3 w-3 text-white" />
                </button>
              )}
              {removePhoto && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                  Removed on save
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-lg font-bold truncate">
                {member.first_name} {member.last_name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Update member information
              </p>
            </div>
        </div>

        {/* Mobile Form */}
        <div className="surface p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="efatha-form space-y-4">
            {!showFullForm ? (
              /* Quick Edit Section */
              <div className="space-y-4">
                <div className="surface p-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 text-[var(--primary)] mr-2" />
                    Personal Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        First Name *
                      </label>
                      <input
                        {...register('first_name')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter first name"
                      />
                      {errors.first_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Last Name *
                      </label>
                      <input
                        {...register('last_name')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter last name"
                      />
                      {errors.last_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        {...register('mobile_no')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter mobile number"
                      />
                      {errors.mobile_no && (
                        <p className="text-red-500 text-sm mt-1">{errors.mobile_no.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-[color-mix(in_srgb,var(--card)_95%,transparent)] backdrop-blur border-t border-[var(--border)] p-4 -mx-4 rounded-b-2xl">
                  <ClayButton
                    tone="primary"
                    type="submit"
                    loading={loading}
                    disabled={!isValid}
                    className="w-full !py-4 !text-base"
                  >
                    Update Member
                  </ClayButton>
                </div>
              </div>
            ) : (
              /* Full Mobile Form */
              <div className="space-y-4">
                {/* Personal Information Section */}
                <div className="surface p-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 text-[var(--primary)] mr-2" />
                    Personal Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          First Name *
                        </label>
                        <input
                          {...register('first_name')}
                          className="mobile-form-input w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="First name"
                        />
                        {errors.first_name && (
                          <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Last Name *
                        </label>
                        <input
                          {...register('last_name')}
                          className="mobile-form-input w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Last name"
                        />
                        {errors.last_name && (
                          <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Middle Name
                      </label>
                      <input
                        {...register('middle_name')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Middle name (optional)"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Gender *
                        </label>
                        <select
                          {...register('gender')}
                          className="mobile-form-input w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                        {errors.gender && (
                          <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Age *
                        </label>
                        <input
                          type="number"
                          {...register('age', { valueAsNumber: true })}
                          className="mobile-form-input w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Age"
                          min="1"
                          max="120"
                        />
                        {errors.age && (
                          <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Marital Status *
                      </label>
                      <select
                        {...register('marital_status')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select marital status</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                      {errors.marital_status && (
                        <p className="text-red-500 text-sm mt-1">{errors.marital_status.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                        Salvation Status *
                      </label>
                      <div className="flex space-x-6">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            {...register('saved')}
                            value="true"
                            className="w-4 h-4 text-[var(--primary)]"
                          />
                          <span className="text-sm">Saved</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            {...register('saved')}
                            value="false"
                            className="w-4 h-4 text-[var(--primary)]"
                          />
                          <span className="text-sm">Not Saved</span>
                        </label>
                      </div>
                      {errors.saved && (
                        <p className="text-red-500 text-sm mt-1">{errors.saved.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="surface p-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center">
                    <PhoneIcon className="h-5 w-5 text-[var(--primary)] mr-2" />
                    Contact Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        {...register('mobile_no')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter mobile number"
                      />
                      {errors.mobile_no && (
                        <p className="text-red-500 text-sm mt-1">{errors.mobile_no.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Email (optional)"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Postal Address
                      </label>
                      <textarea
                        {...register('postal_address')}
                        rows={2}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                        placeholder="Postal address (optional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="surface p-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center">
                    <MapPinIcon className="h-5 w-5 text-[var(--primary)] mr-2" />
                    Location Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Country *
                      </label>
                      <select
                        {...register('country')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select Country</option>
                        <option value="Tanzania">Tanzania</option>
                        <option value="Kenya">Kenya</option>
                        <option value="Malawi">Malawi</option>
                        <option value="Zambia">Zambia</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="Burundi">Burundi</option>
                        <option value="Republic of Congo">Republic of Congo</option>
                        <option value="Mozambique">Mozambique</option>
                        <option value="Botswana">Botswana</option>
                        <option value="South Africa">South Africa</option>
                        <option value="South Sudan">South Sudan</option>
                        <option value="UK">UK</option>
                        <option value="USA">USA</option>
                        <option value="Pakistan">Pakistan</option>
                        <option value="India">India</option>
                      </select>
                    </div>

                    {watchedCountry === 'Tanzania' && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Region *
                        </label>
                        <select
                          {...register('region')}
                          className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select region</option>
                          {ALL_TANZANIA_REGIONS.map((region) => (
                            <option key={region} value={region}>
                              {region}
                            </option>
                          ))}
                        </select>
                        {errors.region && (
                          <p className="text-red-500 text-sm mt-1">{errors.region.message}</p>
                        )}
                      </div>
                    )}

                    {watchedRegion && REGION_CENTERS[watchedRegion] && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Center/Area
                        </label>
                        <select
                          {...register('center_area')}
                          className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select center/area</option>
                          {REGION_CENTERS[watchedRegion].map((area) => (
                            <option key={area} value={area}>
                              {area}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Residence *
                      </label>
                      <input
                        type="text"
                        {...register('residence')}
                        placeholder="Enter your residence"
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      {errors.residence && (
                        <p className="text-red-500 text-sm mt-1">{errors.residence.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Zone *
                        </label>
                        <input
                          {...register('zone')}
                          className="mobile-form-input w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Zone"
                        />
                        {errors.zone && (
                          <p className="text-red-500 text-xs mt-1">{errors.zone.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Cell *
                        </label>
                        <input
                          {...register('cell')}
                          className="mobile-form-input w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Cell"
                        />
                        {errors.cell && (
                          <p className="text-red-500 text-xs mt-1">{errors.cell.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Church Information */}
                <div className="surface p-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center">
                    <HomeIcon className="h-5 w-5 text-[var(--primary)] mr-2" />
                    Church Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Church Registration Number
                      </label>
                      <input
                        {...register('church_registration_number')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Registration number (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Church Position
                      </label>
                      <select
                        {...register('church_position')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select position (optional)</option>
                        {CHURCH_POSITION_OPTIONS.map((position) => (
                          <option key={position} value={position}>
                            {position}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Career/Profession
                      </label>
                      <input
                        {...register('career')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Career (optional)"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Origin *
                        </label>
                        <select
                          {...register('origin')}
                          className="mobile-form-input w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select</option>
                          <option value="invited">Invited</option>
                          <option value="efatha">EFATHA</option>
                        </select>
                        {errors.origin && (
                          <p className="text-red-500 text-xs mt-1">{errors.origin.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Visitors Count
                        </label>
                        <input
                          type="number"
                          {...register('visitors_count', { valueAsNumber: true })}
                          className="mobile-form-input w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Attending Date *
                      </label>
                      <input
                        type="date"
                        {...register('attending_date')}
                        className="mobile-form-input w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      {errors.attending_date && (
                        <p className="text-red-500 text-sm mt-1">{errors.attending_date.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="sticky bottom-0 bg-[color-mix(in_srgb,var(--card)_95%,transparent)] backdrop-blur border-t border-[var(--border)] p-4 -mx-4 rounded-b-2xl">
                  <ClayButton
                    tone="primary"
                    type="submit"
                    loading={loading}
                    disabled={!isValid}
                    className="w-full !py-4 !text-base"
                  >
                    Update Member
                  </ClayButton>
                </div>

                {/* Bottom padding for mobile */}
                <div className="h-16"></div>
              </div>
            )}
          </form>
        </div>

        {/* Camera Component */}
        <Camera
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
        />
      </div>
    );
  }

  // Desktop rendering
  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title={`Edit Member: ${member.first_name} ${member.last_name}`}
          subtitle="Update member information"
          cta={
            <ClayButton tone="neutral" onClick={handleBack}>
              Back to Members
            </ClayButton>
          }
        />

        <Stepper stages={stepTitles} current={stepTitles[currentStep - 1]} />

        {/* Form Card */}
        <SectionCard
          title={stepTitles[currentStep - 1]}
          subtitle={`Step ${currentStep} of ${totalSteps} — update the required information for this section`}
        >
          <motion.form
            key={shakeKey}
            animate={shakeKey > 0 ? { x: [0, -6, 6, -6, 6, -3, 0] } : undefined}
            transition={{ duration: 0.5 }}
            className="efatha-form"
          >
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Profile Image Upload */}
                <div className="flex flex-col items-center mb-8 space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-[var(--card)] shadow-lg bg-[var(--secondary)]">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <ProfilePicture
                          src={removePhoto ? null : member.picture}
                          firstName={member.first_name}
                          lastName={member.last_name}
                          size="lg"
                          className="w-20 h-20"
                        />
                      )}
                    </div>
                    
                    {/* Upload from files button */}
                    <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 shadow-lg">
                      <CameraIcon className="h-4 w-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Camera capture button */}
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="absolute -bottom-2 -left-2 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 shadow-lg"
                      title="Take Photo"
                    >
                      <CameraIcon className="h-4 w-4 text-white" />
                    </button>

                    {/* Remove photo button */}
                    {(profileImage || member.picture) && !profileFile && !removePhoto && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 shadow-lg"
                        title="Remove photo"
                      >
                        <TrashIcon className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Click 📷 to upload from files or 📸 to take photo
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      First Name *
                    </label>
                    <input
                      {...register('first_name')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter first name"
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
                    )}
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Middle Name
                    </label>
                    <input
                      {...register('middle_name')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter middle name"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Last Name *
                    </label>
                    <input
                      {...register('last_name')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter last name"
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Gender *
                    </label>
                    <select
                      {...register('gender')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      {...register('age', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter age"
                      min="1"
                      max="120"
                    />
                    {errors.age && (
                      <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
                    )}
                  </div>

                  {/* Marital Status */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Marital Status *
                    </label>
                    <select
                      {...register('marital_status')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    >
                      <option value="">Select marital status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                    {errors.marital_status && (
                      <p className="text-red-500 text-sm mt-1">{errors.marital_status.message}</p>
                    )}
                  </div>
                </div>

                {/* Salvation Status */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
                    Salvation Status *
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-green-50 transition-colors">
                      <input
                        type="radio"
                        {...register('saved')}
                        value="true"
                        className="form-radio w-4 h-4 text-[var(--primary)] border-2 border-gray-300 focus:ring-green-500"
                      />
                      <span className="text-[var(--foreground)] font-medium text-sm">Saved</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-green-50 transition-colors">
                      <input
                        type="radio"
                        {...register('saved')}
                        value="false"
                        className="form-radio w-4 h-4 text-[var(--primary)] border-2 border-gray-300 focus:ring-green-500"
                      />
                      <span className="text-[var(--foreground)] font-medium text-sm">Not Saved</span>
                    </label>
                  </div>
                  {errors.saved && (
                    <p className="text-red-500 text-sm mt-1">{errors.saved.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Contact Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center">
                      <PhoneIcon className="h-4 w-4 text-green-500 mr-2" />
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      {...register('mobile_no')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter mobile number"
                    />
                    {errors.mobile_no && (
                      <p className="text-red-500 text-sm mt-1">{errors.mobile_no.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-green-500 mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Postal Address */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center">
                    <MapPinIcon className="h-4 w-4 text-green-500 mr-2" />
                    Postal Address
                  </label>
                  <textarea
                    {...register('postal_address')}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="Enter postal address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Country */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center">
                      <GlobeAltIcon className="h-4 w-4 text-green-500 mr-2" />
                      Country *
                    </label>
                    <select
                      {...register('country')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    >
                      <option value="">Select Country</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Malawi">Malawi</option>
                      <option value="Zambia">Zambia</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="Burundi">Burundi</option>
                      <option value="Republic of Congo">Republic of Congo</option>
                      <option value="Mozambique">Mozambique</option>
                      <option value="Botswana">Botswana</option>
                      <option value="South Africa">South Africa</option>
                      <option value="South Sudan">South Sudan</option>
                      <option value="UK">UK</option>
                      <option value="USA">USA</option>
                      <option value="Pakistan">Pakistan</option>
                      <option value="India">India</option>
                    </select>
                  </div>

                  {/* Region - Only show when Tanzania is selected */}
                  {watchedCountry === 'Tanzania' && (
                    <div>
                      <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                        Region *
                      </label>
                      <select
                        {...register('region')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      >
                        <option value="">Select region</option>
                        {ALL_TANZANIA_REGIONS.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                      {errors.region && (
                        <p className="text-red-500 text-sm mt-1">{errors.region.message}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Center/Area */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Center/Area
                    </label>
                    <select
                      {...register('center_area')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      disabled={!watchedRegion || !REGION_CENTERS[watchedRegion]}
                    >
                      <option value="">Select center/area</option>
                      {watchedRegion && REGION_CENTERS[watchedRegion] &&
                        REGION_CENTERS[watchedRegion].map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))
                      }
                      {watchedRegion && !REGION_CENTERS[watchedRegion] && (
                        <option value={watchedRegion}>{watchedRegion}</option>
                      )}
                    </select>
                  </div>

                  {/* Residence */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center">
                      <HomeIcon className="h-4 w-4 text-green-500 mr-2" />
                      Residence *
                    </label>
                    <input
                      type="text"
                      {...register('residence')}
                      placeholder="Enter your residence"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                    {errors.residence && (
                      <p className="text-red-500 text-sm mt-1">{errors.residence.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Zone */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Zone *
                    </label>
                    <input
                      {...register('zone')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter zone"
                    />
                    {errors.zone && (
                      <p className="text-red-500 text-sm mt-1">{errors.zone.message}</p>
                    )}
                  </div>

                  {/* Cell */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Cell *
                    </label>
                    <input
                      {...register('cell')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter cell"
                    />
                    {errors.cell && (
                      <p className="text-red-500 text-sm mt-1">{errors.cell.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Church Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Church Registration Number */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center">
                      <DocumentCheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      Church Registration Number
                    </label>
                    <input
                      {...register('church_registration_number')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter registration number (optional)"
                    />
                  </div>

                  {/* Church Position */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Church Position
                    </label>
                    <select
                      {...register('church_position')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    >
                      <option value="">Select church position</option>
                      {CHURCH_POSITION_OPTIONS.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Career */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center">
                      <BriefcaseIcon className="h-4 w-4 text-green-500 mr-2" />
                      Career/Profession
                    </label>
                    <input
                      {...register('career')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter career/profession"
                    />
                  </div>

                  {/* Visitors Count */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Visitors Count
                    </label>
                    <input
                      type="number"
                      {...register('visitors_count', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter visitors count"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Origin */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Origin *
                    </label>
                    <select
                      {...register('origin')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    >
                      <option value="">Select origin</option>
                      <option value="invited">Invited</option>
                      <option value="efatha">EFATHA</option>
                    </select>
                    {errors.origin && (
                      <p className="text-red-500 text-sm mt-1">{errors.origin.message}</p>
                    )}
                  </div>

                  {/* Attending Date */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 text-green-500 mr-2" />
                      Attending Date *
                    </label>
                    <input
                      type="date"
                      {...register('attending_date')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                    {errors.attending_date && (
                      <p className="text-red-500 text-sm mt-1">{errors.attending_date.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--secondary)_40%,transparent)] p-6">
                  <h3 className="font-display text-base font-bold mb-1 flex items-center gap-2">
                    <DocumentCheckIcon className="h-5 w-5 text-[var(--primary)]" />
                    Review Member Information
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Please review all the information before updating the member.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Full Name:</span>
                        <span className="ml-2 text-[var(--foreground)]">
                          {watch('first_name')} {watch('middle_name')} {watch('last_name')}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Gender:</span>
                        <span className="ml-2 text-[var(--foreground)] capitalize">{watch('gender')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Age:</span>
                        <span className="ml-2 text-[var(--foreground)]">{watch('age')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Marital Status:</span>
                        <span className="ml-2 text-[var(--foreground)] capitalize">{watch('marital_status')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Mobile:</span>
                        <span className="ml-2 text-[var(--foreground)]">{watch('mobile_no')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Email:</span>
                        <span className="ml-2 text-[var(--foreground)]">{watch('email') || 'Not provided'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Region:</span>
                        <span className="ml-2 text-[var(--foreground)]">{watch('region')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Center/Area:</span>
                        <span className="ml-2 text-[var(--foreground)]">{watch('center_area')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Church Reg. No:</span>
                        <span className="ml-2 text-[var(--foreground)]">{watch('church_registration_number')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Origin:</span>
                        <span className="ml-2 text-[var(--foreground)] capitalize">{watch('origin')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Attending Date:</span>
                        <span className="ml-2 text-[var(--foreground)]">{watch('attending_date')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--foreground)]">Salvation Status:</span>
                        <span className="ml-2 text-[var(--foreground)]">
                          {watch('saved') === true ? 'Saved' : watch('saved') === false ? 'Not Saved' : 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-amber-600 text-xs font-medium">
                    <strong>Note:</strong> Once submitted, the member information will be updated in the church database.
                    Make sure all information is correct before proceeding.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t border-[var(--border)]">
              <ClayButton tone="neutral" type="button" onClick={prevStep} disabled={currentStep === 1}>
                Previous
              </ClayButton>

              {currentStep < totalSteps ? (
                <ClayButton tone="primary" type="button" onClick={nextStep}>
                  Next Step
                </ClayButton>
              ) : (
                <ClayButton tone="primary" type="button" loading={loading} disabled={!isValid} onClick={handleFinalSubmit}>
                  Update Member
                </ClayButton>
              )}
            </div>
          </motion.form>
        </SectionCard>
      </div>

      {/* Camera Component */}
      <Camera
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};

export default EditMember;