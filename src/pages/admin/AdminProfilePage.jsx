import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Lock,
  Camera,
  Save,
  Loader2,
  Shield,
  Clock,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { useAdminAuth } from '../../features/auth/AdminAuthContext';
import adminAuthService from '../../services/adminAuthService';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../utils/imageUrl';

export default function AdminProfilePage() {
  const { user, updateUser } = useAdminAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Inline Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Sync state if user context changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setMobile(user.mobile || '');
    }
  }, [user]);

  // Handle Image File Selection & Immediate Upload
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    // Local instant preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploadingImage(true);

    try {
      const res = await adminAuthService.uploadAvatar(file);
      if (res.user) {
        updateUser(res.user);
      }
      toast.success(res.message || 'Profile picture updated successfully.');
    } catch (err) {
      setImagePreview(null);
      toast.error(err.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Direct Inline Profile Update Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    setIsSavingProfile(true);

    try {
      const res = await adminAuthService.updateProfile({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
      });
      if (res.user) {
        updateUser(res.user);
      }
      toast.success(res.message || 'Profile details saved successfully.');
    } catch (err) {
      if (err.response?.data?.errors) {
        setProfileErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to update profile.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password Submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors({});

    if (password.length < 8) {
      setPasswordErrors({ password: ['Password must be at least 8 characters.'] });
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (password !== passwordConfirmation) {
      setPasswordErrors({ password_confirmation: ['Password confirmation does not match.'] });
      toast.error('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await adminAuthService.changePassword({
        current_password: currentPassword,
        password: password,
        password_confirmation: passwordConfirmation,
      });

      toast.success(res.message || 'Password updated successfully.');
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
    } catch (err) {
      if (err.response?.data?.errors) {
        setPasswordErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to update password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Determine if logged-in user is Staff or Admin
  const isStaff =
    user?.role?.toLowerCase() === 'staff' ||
    user?.user_type?.toLowerCase() === 'staff' ||
    Boolean(user?.staff_code);
  const roleDisplay = isStaff ? 'Staff' : 'Administrator';

  // Date & Status formatting helpers (Dynamic from Database)
  const createdDate = user?.joining_date
    ? new Date(user.joining_date)
    : user?.created_at
    ? new Date(user.created_at)
    : null;
  const sinceYear =
    createdDate && !isNaN(createdDate.getTime()) ? createdDate.getFullYear() : '—';
  const formattedJoinedDate =
    createdDate && !isNaN(createdDate.getTime())
      ? createdDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

  // Dynamic status from admins table (is_active / status)
  const rawStatus = String(user?.status || '').trim().toLowerCase();
  const isActive = Boolean(
    (rawStatus === 'active' || (!rawStatus && user?.is_active)) &&
      rawStatus !== 'deactive' &&
      rawStatus !== 'inactive' &&
      rawStatus !== 'blocked' &&
      user?.is_active !== false &&
      user?.is_active !== 0 &&
      user?.is_active !== '0'
  );
  const statusDisplay = isActive ? 'Yes' : 'Deactive';

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';
  const currentAvatarSrc = imagePreview || getImageUrl(user?.image_url || user?.profile_photo || user?.image);

  return (
    <div className="w-full space-y-6 pb-12 animate-fade-in font-sans min-w-0">
      {/* Premium Header Card with 3D Emblem & Ambient Glow */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-gradient-to-tr from-sky-400/10 to-transparent rounded-full blur-xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5 min-w-0">
          <div className="flex items-center gap-4 min-w-0">
            {/* Glowing 3D Gradient Icon Emblem */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white flex items-center justify-center icon-3d shadow-md shadow-blue-500/25 ring-4 ring-blue-50 shrink-0">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-sm" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 truncate">
                  Profile
                </h1>
                <span
                  className={`px-3 py-0.5 text-xs font-bold rounded-full border shadow-2xs ${
                    isStaff
                      ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                      : 'bg-blue-50 text-blue-700 border-blue-200/80'
                  }`}
                >
                  {isStaff ? 'Staff Account' : 'Administrator'}
                </span>
                {isStaff && user?.department && (
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200 truncate">
                    {user.department}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal truncate">
                Manage your personal identity, contact details, and account security.
              </p>
            </div>
          </div>

          {/* Quick Session Status Pills */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Active Session</span>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold shadow-2xs ${
                isStaff
                  ? 'bg-purple-50/90 border-purple-200/80 text-purple-700'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/70 text-blue-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-current" />
              <span>{isStaff ? user?.staff_code || 'Staff' : 'Admin Verified'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Card Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0">
        {/* ======================================================== */}
        {/* LEFT CARD: Profile Summary & Avatar Upload               */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 xl:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:border-blue-200/70 transition-all duration-300 flex flex-col items-center text-center animate-slide-up stagger-1 min-w-0">
          {/* Avatar with Camera 3D Overlay */}
          <div className="relative mx-auto mb-4 group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-1 border-4 border-white shadow-lg flex items-center justify-center relative transition-transform duration-300 group-hover:scale-102">
              {currentAvatarSrc ? (
                <img
                  src={currentAvatarSrc}
                  alt={user?.name || (isStaff ? 'Staff' : 'Admin')}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl sm:text-4xl font-extrabold font-display">
                  {userInitial}
                </div>
              )}

              {/* Uploading Spinner Overlay */}
              {isUploadingImage && (
                <div className="absolute inset-0 bg-slate-950/60 rounded-full flex flex-col items-center justify-center text-white z-10 backdrop-blur-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <span className="text-[10px] font-semibold mt-1">Uploading...</span>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
              className="hidden"
              onChange={handleImageChange}
            />

            {/* 3D Camera Badge Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/30 border-2 border-white icon-3d transition-all cursor-pointer hover:scale-110 active:scale-95 disabled:opacity-50"
              title="Upload / Change Profile Photo"
            >
              {isUploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 drop-shadow-sm" />
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 font-medium -mt-2 mb-3">
            Click the camera icon to upload photo
          </p>

          {/* Full Name */}
          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight truncate max-w-full">
            {user?.name || (isStaff ? 'Staff' : 'Administrator')}
          </h2>

          {/* Role & Status Badge */}
          <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
            <span
              className={`px-3.5 py-1 rounded-full text-xs font-semibold inline-flex items-center ${
                isStaff
                  ? 'bg-purple-100 text-purple-700 border border-purple-200/80 shadow-2xs'
                  : 'bg-sky-100 text-sky-700 border border-sky-200/80 shadow-2xs'
              }`}
            >
              {roleDisplay}
            </span>
            {!isActive && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200/80 inline-flex items-center gap-1 shadow-2xs">
                <XCircle className="w-3.5 h-3.5" />
                <span>Deactive</span>
              </span>
            )}
          </div>

          {/* Bottom Stats Row (Since & Active - 3D Styled Cards) */}
          <div className="mt-7 pt-5 border-t border-slate-100 w-full grid grid-cols-2 gap-3 text-left">
            {/* Stat 1: Since */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-xs">
                <Calendar className="w-4 h-4 drop-shadow-xs" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">
                  Since
                </span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5 truncate">
                  {sinceYear}
                </span>
              </div>
            </div>

            {/* Stat 2: Active / Deactive */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 transition-colors">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white icon-3d shadow-xs transition-all ${
                  isActive
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-tr from-rose-500 to-red-600'
                }`}
              >
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 drop-shadow-xs" />
                ) : (
                  <XCircle className="w-4 h-4 drop-shadow-xs" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">
                  Active
                </span>
                <span
                  className={`text-sm font-bold block mt-0.5 truncate ${
                    isActive ? 'text-slate-800' : 'text-rose-600'
                  }`}
                >
                  {statusDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT CARD: Inline Personal Information + Change Password */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 xl:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-8 animate-slide-up stagger-2 min-w-0">
          {/* ====================================================== */}
          {/* Section 1: Personal Information (Inline Editable)       */}
          {/* ====================================================== */}
          <div className="group">
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* Header bar with 3D icon and Save button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center shrink-0 icon-3d shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                    <User className="w-5 h-5 drop-shadow-sm" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-display text-slate-900 uppercase tracking-wider">
                      Personal Information
                    </h3>
                    <p className="text-xs text-slate-400">
                      Update your account name, email, and mobile contact
                    </p>
                  </div>
                </div>

                {/* Save Profile Button (Responsive Touch Ready) */}
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer font-display disabled:opacity-50 shrink-0"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {/* Full Name Input */}
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Ramesh Kumar"
                      required
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                        profileErrors.name
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                          : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15'
                      }`}
                    />
                  </div>
                  {profileErrors.name && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      {profileErrors.name[0]}
                    </p>
                  )}
                </div>

                {/* Email Address Input */}
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ramesh@iniya.com"
                      required
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                        profileErrors.email
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                          : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15'
                      }`}
                    />
                  </div>
                  {profileErrors.email && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      {profileErrors.email[0]}
                    </p>
                  )}
                </div>

                {/* Mobile Number Input */}
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="9876543210"
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                        profileErrors.mobile
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                          : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15'
                      }`}
                    />
                  </div>
                  {profileErrors.mobile && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      {profileErrors.mobile[0]}
                    </p>
                  )}
                </div>

                {/* Role (Read-only) */}
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={roleDisplay}
                      readOnly
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold cursor-not-allowed shadow-2xs"
                    />
                  </div>
                </div>

                {/* Joined On (Read-only) */}
                <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Joined On
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={formattedJoinedDate}
                      readOnly
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold cursor-not-allowed shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* ====================================================== */}
          {/* Section 2: Change Password                             */}
          {/* ====================================================== */}
          <div className="pt-4 border-t border-slate-100 group">
            {/* Header bar with 3D icon */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-700 text-white flex items-center justify-center shrink-0 icon-3d shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <Lock className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold font-display text-slate-900 uppercase tracking-wider">
                  Change Password
                </h3>
                <p className="text-xs text-slate-400">
                  Rotate your account credentials with a strong password
                </p>
              </div>
            </div>

            {/* Form with Clean Responsive Grid & Non-wrapping Layout */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Current Password */}
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      required
                      className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                        passwordErrors.current_password
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/15'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.current_password && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      {passwordErrors.current_password[0]}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                        passwordErrors.password
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/15'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.password && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      {passwordErrors.password[0]}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmation ? 'text' : 'password'}
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                        passwordErrors.password_confirmation
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/15'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmation(!showConfirmation)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showConfirmation ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.password_confirmation && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      {passwordErrors.password_confirmation[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Update Password Action Row (No Overlap, Responsive) */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 transition-all disabled:opacity-50 cursor-pointer font-display"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
