import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { useAdminAuth } from '../../features/auth/AdminAuthContext';
import adminAuthService from '../../services/adminAuthService';
import { useToast } from '../../context/ToastContext';

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
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Sync state if user context changes
  React.useEffect(() => {
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
  const isStaff = user?.role?.toLowerCase() === 'staff' || user?.user_type?.toLowerCase() === 'staff' || Boolean(user?.staff_code);
  const roleDisplay = isStaff ? 'Staff' : 'Administrator';

  // Date & Status formatting helpers (100% Dynamic from Database)
  const createdDate = user?.joining_date ? new Date(user.joining_date) : (user?.created_at ? new Date(user.created_at) : null);
  const sinceYear = createdDate && !isNaN(createdDate.getTime())
    ? createdDate.getFullYear()
    : '—';
  const formattedJoinedDate = createdDate && !isNaN(createdDate.getTime())
    ? createdDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  // Dynamic status from admins table (is_active / status)
  // ONLY active when status is explicitly 'active' (case-insensitive: active / Active)
  // If status is 'deactive', 'Deactive', 'inactive', 'blocked', etc., it is Deactive.
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
  const currentAvatarSrc = imagePreview || user?.image_url;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in font-sans">
      {/* Premium Header Card */}
      <div className="relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-gradient-to-tr from-sky-400/10 to-transparent rounded-full blur-xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Glowing Gradient Icon Emblem */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 ring-4 ring-blue-50/80 shrink-0">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900">
                  Profile
                </h1>
                <span className={`px-3 py-0.5 text-xs font-bold rounded-full border shadow-2xs ${
                  isStaff
                    ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                    : 'bg-blue-50 text-blue-700 border-blue-200/80'
                }`}>
                  {isStaff ? 'Staff Account' : 'Administrator'}
                </span>
                {isStaff && user?.department && (
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {user.department}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-normal">
                Manage your personal identity, contact details, and account security.
              </p>
            </div>
          </div>

          {/* Quick Session Status Pills */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Active Session</span>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold shadow-2xs ${
              isStaff
                ? 'bg-purple-50/80 border-purple-200/70 text-purple-700'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50/70 border-blue-200/60 text-blue-700'
            }`}>
              <ShieldCheck className="w-4 h-4 text-current" />
              <span>{isStaff ? (user?.staff_code || 'Staff') : 'Admin Verified'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Card Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT CARD: Profile Summary & Avatar Upload               */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 xl:col-span-3.5 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs flex flex-col items-center text-center">
          {/* Avatar with Camera Overlay */}
          <div className="relative mx-auto mb-4 group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-1 border-4 border-white shadow-md flex items-center justify-center relative">
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

            {/* Camera Badge button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Upload / Change Profile Photo"
            >
              {isUploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 font-medium -mt-2 mb-3">
            Click the camera icon to upload photo
          </p>

          {/* Full Name */}
          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight">
            {user?.name || (isStaff ? 'Staff' : 'Administrator')}
          </h2>

          {/* Role & Status Badge */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={`px-3.5 py-1 rounded-full text-xs font-semibold inline-flex items-center ${
              isStaff
                ? 'bg-purple-100 text-purple-700 border border-purple-200/70'
                : 'bg-sky-100 text-sky-700 border border-sky-200/70'
            }`}>
              {roleDisplay}
            </span>
            {!isActive && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200/70 inline-flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                <span>Deactive</span>
              </span>
            )}
          </div>

          {/* Bottom Stats Row (Since & Active - 100% Dynamic from Database) */}
          <div className="mt-7 pt-5 border-t border-slate-100 w-full grid grid-cols-2 gap-3 text-left">
            {/* Stat 1: Since (Dynamic from admins.created_at) */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block leading-tight">Since</span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5">{sinceYear}</span>
              </div>
            </div>

            {/* Stat 2: Active / Deactive (Dynamic from admins.is_active / status) */}
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200/70'
                    : 'bg-rose-50 text-rose-600 border-rose-200/70'
                }`}
              >
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block leading-tight">
                  {isActive ? 'Active' : 'Deactive'}
                </span>
                <span className={`text-sm font-bold block mt-0.5 ${isActive ? 'text-slate-800' : 'text-rose-600'}`}>
                  {statusDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT CARD: Inline Personal Information + Change Password */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 xl:col-span-8.5 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8">
          {/* ====================================================== */}
          {/* Section 1: Personal Information (Inline Editable)       */}
          {/* ====================================================== */}
          <div>
            <form onSubmit={handleProfileSubmit}>
              {/* Header bar with Save button */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-slate-900">
                      Personal Information
                    </h3>
                  </div>
                </div>

                {/* Save Profile Button */}
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer font-display disabled:opacity-50"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5">
                {/* Full Name Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sagar Lodhi"
                      required
                      className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        profileErrors.name ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {profileErrors.name && (
                    <p className="text-[10px] text-rose-500 mt-1">{profileErrors.name[0]}</p>
                  )}
                </div>

                {/* Email Address Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sagar@gmail.com"
                      required
                      className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        profileErrors.email ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {profileErrors.email && (
                    <p className="text-[10px] text-rose-500 mt-1">{profileErrors.email[0]}</p>
                  )}
                </div>

                {/* Mobile Number Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. +91 8439570292"
                      className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        profileErrors.mobile ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {profileErrors.mobile && (
                    <p className="text-[10px] text-rose-500 mt-1">{profileErrors.mobile[0]}</p>
                  )}
                </div>

                {/* Role (Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={roleDisplay}
                      readOnly
                      disabled
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Joined On (Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Joined On
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={formattedJoinedDate}
                      readOnly
                      disabled
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* ====================================================== */}
          {/* Section 2: Change Password                             */}
          {/* ====================================================== */}
          <div className="pt-2">
            {/* Header bar */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold font-display text-slate-900">
                Change Password
              </h3>
            </div>

            {/* Form */}
            <form onSubmit={handlePasswordSubmit} className="pt-5">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                      className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        passwordErrors.current_password ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {passwordErrors.current_password && (
                    <p className="text-[10px] text-rose-500 mt-1">{passwordErrors.current_password[0]}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        passwordErrors.password ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {passwordErrors.password && (
                    <p className="text-[10px] text-rose-500 mt-1">{passwordErrors.password[0]}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        passwordErrors.password_confirmation ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {passwordErrors.password_confirmation && (
                    <p className="text-[10px] text-rose-500 mt-1">{passwordErrors.password_confirmation[0]}</p>
                  )}
                </div>

                {/* Update Password Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 h-[38px] cursor-pointer whitespace-nowrap font-display"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
