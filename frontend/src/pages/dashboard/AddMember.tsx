import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createMember } from '../../store/slices/membersSlice';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CameraIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  GlobeAltIcon,
  HomeIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import Camera from '../../components/ui/Camera';
import { dialog } from '../../components/ui/Dialog';
import { PageHeader } from '../../components/app-shell';
import { SectionCard, ClayButton, StatusPill, Stepper } from '../../components/ui-bits';
import { motion } from 'motion/react';
import { variants } from '../../lib/motion-tokens';

// All Tanzania regions (mainland and Zanzibar)
const ALL_TANZANIA_REGIONS = [
  // Mainland Tanzania (26 regions)
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
  // Dar es Salaam zones (each with its own centers below)
  'Mwenge',
  'Imara',
  'Kinondoni',
  'Kisukulu',
  'Temeke',
  'Ushindi',
  'Yombo',
  // Zanzibar (5 regions)
  'Kusini Unguja',
  'Kaskazini Unguja',
  'Mjini Magharibi',
  'Kaskazini Pemba',
  'Kusini Pemba'
];

// Tanzania centers grouped by region for dynamic Center/Area dropdown
const TANZANIA_REGION_CENTERS: Record<string, string[]> = {
  Arusha: [
    'Ngaramtoni', 'Leguruki', 'Longido', 'Endabash', 'Buger', 'Manyara Kibaoni',
    'Mkonoo', 'Endamarariek', 'Tengeru', 'Kilala', 'Mbulumbulu', 'Kikatiti',
    "King'ori", 'Monduli', "Mang'ola", 'Engosheraton (Muriet)', 'Nkoansiyo',
    'Kiserian', 'USA River', 'Rhotia', 'Mto Yordan', 'Karatu', 'Namanga',
    'Yerusalemu', 'Sharon Zizi la Kondoo'
  ],
  // Dar es Salaam zones — each is its own region with its own centers
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
  Dodoma: [
    'Kibaigwa', 'Kinusi', 'Hogoro', 'Veyula', 'Mbande', 'Ihumwa',
    'Chamwino Ikulu', 'Sayuni (Dodoma Mjini)', 'Wota', 'Mvumi Makulu',
    'Mvumi Mission', 'Kondoa', 'Komboa', 'Winza', 'Mpwapwa', 'Kibakwe',
    'Bahi', 'Edeni', 'Kisasa'
  ],
  Geita: ['Katoro', 'Masumbwe', 'Chato', 'Runzewe', 'Ushirombo', 'Geita Mjini'],
  Iringa: [
    'Mtambula', 'Nyololo', 'Ipalamwa', 'Tungamalenga', 'Nyamihuu', 'Lulanzi',
    'Mwambao', 'Faraja Mufindi', 'Mlowa', 'N/Mgowelo', 'Uhambingeto', 'Ilula',
    'Kilolo', 'Pomerini', 'Ilamba', 'Kidabaga', 'Muwimbi', 'Lugoda', 'Igowole',
    'Sao Hill', 'Rungemba', 'Mafinga', 'Ihemi', 'Makete', 'Wenda', 'Ugwachanya',
    'Magubike', 'Nazareti', 'Iringa'
  ],
  Kagera: [
    'Kyerwa', 'Ruzenze', 'Rushe', 'Ilembo', 'Chivu', 'Benako', 'Nshamba',
    'Kishogo', 'Muleba', 'Ngara', 'Bukoba'
  ],
  Katavi: [
    'Mapili', 'Sibeswa', 'Kasekese', 'Majalila', 'Usenya', 'Sibwasa', 'Kakese',
    'Karema', 'Inyonga', 'Mpanda'
  ],
  Kigoma: ['Buhigwe', 'Uvinza', 'Kibondo', 'Kasulu', 'Kigoma Mjini'],
  Kilimanjaro: [
    'Rundugai', 'Kirima', 'Rombo Mkuu', 'Samanga', 'Machame', 'Maili Sita',
    'KCMC', 'Mwika', 'Boma Hai', 'Wandry', 'Himo', 'Chekereni', 'Mwanga',
    'Kivulini', 'Same', 'Galilaya', 'Ngare Nairobi', 'S/ Juu', 'Narum', 'Mbahe',
    'M/ Mwema', 'Ngare West', 'Tarakea', 'Sayuni'
  ],
  Lindi: ['Liwale', 'Nyangao', 'Namungo', 'Ruangwa', 'Nachingwea', 'Gilgali'],
  Manyara: ['Giting', 'Kiteto', 'Kainam', 'Mbulu', 'Magugu', 'Titiwi', 'Endasaki', 'Babati'],
  Mara: ['Kiabakari', 'Tarime', 'Etaro', 'Sirari', 'Bunda', 'Serengeti', 'Kamgendi', 'Musoma'],
  Mbeya: [
    'Mlowo', 'Nyalwela', 'Igoma', 'Kiwira', 'Tukuyu', 'Mpemba', 'Mkwajuni',
    'Ileje', 'Mswiswi', 'Sangambi', 'Chunya', 'Chitete', 'Rujewa', 'Ihanda',
    'Tunduma', 'Mbalizi', 'Chimala', 'Uyole', 'Kyela', 'Vwawa', 'Mbeya Mjini'
  ],
  Morogoro: [
    'Parakuyo', 'Kihonda', 'Msolwa', 'Minepa', 'Mlimba', 'Mangula', 'Mlali',
    'Gairo', 'Mikumi', 'Kilosa', 'Dumila', 'Mikese', 'Mbingu', 'Turiani',
    'Ifakara', 'Kilombero', 'Morogoro Mjini'
  ],
  Mtwara: [
    'Msijute', 'Mangaka', 'Masasi', 'Ndanda', 'Mchoti', 'Galilaya', 'Newala',
    'Chivilikiti', 'Tandahimba', 'Tangazo', 'Mtwara Mjini'
  ],
  Mwanza: [
    'Nyamikoma', 'Misungwi', 'Fumagile', 'Kishiri', 'Kwimba', 'Ukerewe',
    'Sengerema', 'Buswelu', 'Kisesa', 'Magu', 'Lamadi', 'Nundu'
  ],
  Njombe: [
    'Utelewe', "Wang'ing'ombe", 'Udonja', 'Tandala', 'Kidegembye', 'Mtambula',
    'Kifanya', 'Ludewa', 'Ilembula', 'Lupembe'
  ],
  Pwani: [
    'Precious Centre Kibaha', 'Gilgali', 'Sweet Corner', 'Mwanabwito',
    'Boko Mnemela', 'Mwendakasi', 'Maili Moja', 'Msangani', 'Kongowe', 'Soga',
    'Mamlaka Pangani', 'Msata', 'Makurunge/ Madesa/ Zinga', 'Kiwangwa',
    'Fukayosi', 'Ubena', 'Utulivu', 'Kiembeni', 'Miale ya Moto', 'Lugoba',
    'Chalinze', 'Bagamoyo', 'Kimanzichana', 'Bungu', 'Kibiti', 'Changamkeni',
    'Mbande', 'Ikwiriri', 'Mkuranga'
  ],
  Rukwa: ['Kabwe', 'Ulinji', 'Palamawe', 'Matai', 'Kirando', 'Laela', 'Sumbawanga'],
  Ruvuma: [
    'Luhagara', 'Lilondo', 'Tunduru', 'Namtumbo', 'Hanga', 'Madaba', 'Namswea',
    'Liuli', 'Kilosa', 'Mbinga', 'Songea'
  ],
  Shinyanga: [
    'Kishapu', 'Ukenyenge', 'Ishororo', 'Old Shy', 'Ndembezi', 'Bubiki',
    'Chapulwa', 'Tinde', 'Isaka', 'Kagongwa', 'Kahama', 'Mwasele'
  ],
  Simiyu: ['Meatu', 'Mwandoya', 'Maswa', 'Simiyu', 'Nyamikoma', 'Lamadi'],
  Singida: [
    'chemichemi', 'Ikungi', 'Issuna', 'Mitundu', 'Amani', 'Yeriko', 'Itigi',
    'Mtinko', 'Puma', 'Ndago', 'Mbelekasi', 'Shelui', 'Kinampanda', 'Nkungi',
    'Kiomboi', 'Londoni', 'Majiri', 'Solya', 'Manyoni', 'Singida'
  ],
  Songwe: ['Mlowo', 'Mpemba', 'Mkwajuni', 'Ileje', 'Chitete', 'Ihanda', 'Tunduma', 'Vwawa'],
  Tabora: [
    'Mabunduru', 'Ulyankulu', 'Loya', 'Kaliua', 'Urambo', 'Sikonge', 'Sayuni',
    'Nkinga', 'Nata', 'Igunga', 'Nzega', 'Tabora Mjini'
  ],
  Tanga: [
    'Muheza', 'Pangani', 'Lushoto', 'Handeni', 'Madumu Korogwe', 'Songa Mbele',
    'Mkata', 'Bumburi', 'Maramba', 'Gilgali', 'Mashewa', 'Kabuku', 'Michungwani',
    'Amani', 'Tanga Mjini'
  ]
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
  region: yup.string().required('Region is required'),
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
}) satisfies yup.ObjectSchema<MemberFormData>;

interface MemberFormData {
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

const AddMember: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { loading } = useAppSelector((state) => state.members);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger,
    getValues,
  } = useForm<MemberFormData>({
    resolver: yupResolver(schema) as any,
    mode: 'onChange',
    defaultValues: {
      visitors_count: 0,
      attending_date: new Date().toISOString().split('T')[0],
    },
  });

  const watchedRegion = watch('region');
  const watchedCountry = watch('country');
  const watchedCenterArea = watch('center_area');
  const totalSteps = 4;

  const getBasePath = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'apostle') return '/apostle';
    return '/registrant';
  };

  const regionCenters = useMemo(() => {
    if (watchedCountry !== 'Tanzania' || !watchedRegion) {
      return [];
    }

    return TANZANIA_REGION_CENTERS[watchedRegion] ?? [];
  }, [watchedCountry, watchedRegion]);

  useEffect(() => {
    // Keep center/area selection valid when country/region changes.
    if (!watchedCenterArea) {
      return;
    }

    if (watchedCountry !== 'Tanzania') {
      return;
    }

    if (!watchedRegion || !regionCenters.includes(watchedCenterArea)) {
      setValue('center_area', '');
    }
  }, [watchedCountry, watchedRegion, watchedCenterArea, regionCenters, setValue]);

  const stepTitles = [
    'Personal Information',
    'Contact Details',
    'Church Information',
    'Review & Submit'
  ];

  const onSubmit = async (data: MemberFormData) => {
    try {
      // Process region based on country and center_area selection
      let processedData = { ...data };

      if (data.country !== 'Tanzania') {
        // For non-Tanzania countries, use the country name as region
        processedData.region = data.country;
      }

      // Create FormData to handle file upload
      const formData = new FormData();

      // Add all form fields to FormData with proper type handling
      Object.entries(processedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Skip empty church_registration_number since it's optional
          if (key === 'church_registration_number' && value === '') {
            return;
          }

          // Handle boolean values
          if (typeof value === 'boolean') {
            formData.append(key, value.toString());
          }
          // Handle numeric values
          else if (typeof value === 'number') {
            formData.append(key, value.toString());
          }
          // Handle string values - skip completely empty optional fields
          else if (typeof value === 'string') {
            // For optional fields, skip if empty
            const optionalFields = ['middle_name', 'church_registration_number', 'center_area', 'postal_address', 'email', 'church_position', 'career'];
            if (optionalFields.includes(key) && value.trim() === '') {
              return;
            }
            formData.append(key, value);
          }
          // Handle all other values
          else {
            formData.append(key, String(value));
          }
        }
      });

      // Add the profile picture file if uploaded
      if (profileFile) {
        formData.append('picture', profileFile);
      }

      await dispatch(createMember(formData)).unwrap();
      setIsSubmitted(true);
      await dialog.success('Member registered', 'The member (and photo, if added) was saved successfully.');
      // Navigate back after a beat so the confirmation reads
      setTimeout(() => {
        navigate(`${getBasePath()}/dashboard`);
      }, 1200);
    } catch (error: any) {
      console.error('Error creating member:', error);

      // Display user-friendly error message
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.message ||
                          'Failed to create member';
      await dialog.error('Registration failed', `${errorMessage}\n\nNo member was saved — check the highlighted fields and try again.`);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof MemberFormData)[] = [];
    
    // Define fields for each step
    switch (currentStep) {
      case 1: // Personal Information
        fieldsToValidate = ['first_name', 'last_name', 'gender', 'age', 'marital_status'];
        break;
      case 2: // Contact & Location
        fieldsToValidate = ['mobile_no', 'country', 'region', 'residence', 'zone', 'cell'];
        break;
      case 3: // Church Information
        fieldsToValidate = ['saved', 'origin', 'attending_date'];
        break;
      case 4: // Review step - this should not increment further, it should submit
        return; // Don't proceed further, let the submit button handle submission
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

  const handleFinalSubmit = async () => {
    // Validate the entire form before submitting
    const isFormValid = await trigger();
    
    if (isFormValid) {
      const formData = getValues();
      await onSubmit(formData);
    } else {
      setShakeKey(k => k + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Store the actual file for submission
      setProfileFile(file);
      
      // Create preview for display
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageFile: File) => {
    // Store the captured image file
    setProfileFile(imageFile);
    
    // Create preview for display
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
    };
    reader.readAsDataURL(imageFile);
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Register Member" subtitle="New church member intake" />
        <motion.div variants={variants.fadeScaleIn} initial="initial" animate="animate" className="surface max-w-md w-full mx-auto p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Member Added Successfully!</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            The new member has been registered and added to the system.
          </p>
          <div className="mb-6 flex justify-center">
            <StatusPill stage="Redirecting to dashboard…" tone="success" />
          </div>
          <ClayButton
            tone="primary"
            className="w-full"
            onClick={() => {
              navigate(`${getBasePath()}/dashboard`);
            }}
          >
            Return to Dashboard
          </ClayButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Register Member"
          subtitle="New church member intake"
          cta={
            <ClayButton tone="neutral" onClick={() => navigate(`${getBasePath()}/dashboard`)}>
              Back to Dashboard
            </ClayButton>
          }
        />

        <Stepper stages={stepTitles} current={stepTitles[currentStep - 1]} />

        {/* Form Card */}
        <SectionCard
          title={stepTitles[currentStep - 1]}
          subtitle={`Step ${currentStep} of ${totalSteps} — fill in the required information for this section`}
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
                        <UserIcon className="h-10 w-10 text-[var(--primary)]" />
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
                  </div>
                  
                  {/* Instructions - now properly positioned in the flow */}
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
                      <PhoneIcon className="h-4 w-4 text-[var(--primary)] mr-2" />
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
                      <EnvelopeIcon className="h-4 w-4 text-[var(--primary)] mr-2" />
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
                    <MapPinIcon className="h-4 w-4 text-[var(--primary)] mr-2" />
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
                      <GlobeAltIcon className="h-4 w-4 text-[var(--primary)] mr-2" />
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

                  {/* Region - Show for all countries */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Region {watchedCountry === 'Tanzania' ? '*' : '(Auto-filled)'}
                    </label>
                    {watchedCountry === 'Tanzania' ? (
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
                    ) : (
                      <input
                        type="text"
                        value={watchedCountry || ''}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                        placeholder="Region will be set to country name"
                      />
                    )}
                    {errors.region && watchedCountry === 'Tanzania' && (
                      <p className="text-red-500 text-sm mt-1">{errors.region.message}</p>
                    )}
                  </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Center/Area */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                      Center/Area
                    </label>
                    {watchedCountry === 'Tanzania' ? (
                      <select
                        {...register('center_area')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        disabled={!watchedRegion || regionCenters.length === 0}
                      >
                        <option value="">
                          {!watchedRegion
                            ? 'Select region first'
                            : regionCenters.length === 0
                            ? 'No centers available for selected region'
                            : 'Select center/area'}
                        </option>
                        {regionCenters.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        {...register('center_area')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        placeholder="Enter center/area"
                      />
                    )}
                    {errors.center_area && (
                      <p className="text-red-500 text-sm mt-1">{errors.center_area.message}</p>
                    )}
                  </div>

                  {/* Residence */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center">
                      <HomeIcon className="h-4 w-4 text-[var(--primary)] mr-2" />
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
                      <DocumentCheckIcon className="h-4 w-4 text-[var(--primary)] mr-2" />
                      Church Registration Number
                    </label>
                    <input
                      {...register('church_registration_number')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter registration number (optional)"
                    />
                    {errors.church_registration_number && (
                      <p className="text-red-500 text-sm mt-1">{errors.church_registration_number.message}</p>
                    )}
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
                      <BriefcaseIcon className="h-4 w-4 text-[var(--primary)] mr-2" />
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
                      <CalendarDaysIcon className="h-4 w-4 text-[var(--primary)] mr-2" />
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
                  <h3 className="font-display text-base font-bold flex items-center gap-2">
                    <DocumentCheckIcon className="h-5 w-5 text-[var(--primary)]" />
                    Review Member Information
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Please review all the information before submitting the registration.
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
                    <strong>Note:</strong> Once submitted, this member will be added to the church database.
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
                  Submit Registration
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

export default AddMember;