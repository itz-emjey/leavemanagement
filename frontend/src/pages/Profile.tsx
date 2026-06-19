import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { User, Save, Lock, Upload, Camera, Pen, Trash2 } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user } = useAuth();
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(user?.employee?.profilePicture || null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [picMessage, setPicMessage] = useState('');

  const [sigFile, setSigFile] = useState<File | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(user?.employee?.signature || null);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [sigMessage, setSigMessage] = useState('');
  const [sigMessageType, setSigMessageType] = useState<'success' | 'error'>('success');

  const handleSignatureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSigFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSigPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setSigMessage('');
  };

  const handleUploadSignature = async () => {
    if (!sigFile) return;
    setUploadingSig(true);
    setSigMessage('');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(sigFile);
      });
      await api.patch('/employees/signature', { signature: base64 });
      setSigMessage('Signature uploaded successfully.');
      setSigMessageType('success');
      setSigFile(null);
    } catch (err: any) {
      setSigMessage(err.response?.data?.message || 'Failed to upload signature.');
      setSigMessageType('error');
    } finally {
      setUploadingSig(false);
    }
  };

  const handleClearSignature = async () => {
    try {
      await api.patch('/employees/signature', { signature: '' });
      setSigPreview(null);
      setSigFile(null);
      setSigMessage('Signature removed.');
      setSigMessageType('success');
    } catch {
      setSigMessage('Failed to remove signature.');
      setSigMessageType('error');
    }
  };

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.employee?.firstName || '',
      lastName: user?.employee?.lastName || '',
      phone: '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data: ProfileForm) => {
    setProfileMessage('');
    setProfileError('');
    try {
      await api.put('/auth/profile', data);
      setProfileMessage('Profile updated successfully.');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Update failed.');
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setPasswordMessage('');
    setPasswordError('');
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordMessage('Password changed successfully.');
      passwordForm.reset();
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Password change failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="card space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Personal Information</h2>
              <p className="text-sm text-gray-500">Update your personal details</p>
            </div>
          </div>

          {profileMessage && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {profileMessage}
            </div>
          )}
          {profileError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {profileError}
            </div>
          )}

          {/* Profile Picture */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#5B5FEF]/10 flex items-center justify-center overflow-hidden">
                {profilePicPreview ? (
                  <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-[#5B5FEF]">
                    {user?.employee?.firstName?.[0] || 'U'}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#5B5FEF] text-white flex items-center justify-center cursor-pointer shadow-sm hover:bg-[#4A4DE0] transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setProfilePic(file);
                    setPicMessage('');
                    // Show preview
                    const reader = new FileReader();
                    reader.onload = (ev) => setProfilePicPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);

                    // Auto-upload with current form values
                    setUploadingPic(true);
                    try {
                      const formData = new FormData();
                      formData.append('profilePicture', file);
                      formData.append('firstName', profileForm.getValues('firstName'));
                      formData.append('lastName', profileForm.getValues('lastName'));
                      formData.append('phone', profileForm.getValues('phone') || '');
                      await api.put('/auth/profile', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });
                      setPicMessage('Profile picture updated.');
                    } catch {
                      setPicMessage('Failed to upload picture.');
                    } finally {
                      setUploadingPic(false);
                    }
                  }}
                />
              </label>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.employee?.firstName} {user?.employee?.lastName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              {uploadingPic && <p className="text-xs text-[#5B5FEF] mt-1">Uploading...</p>}
              {picMessage && <p className="text-xs text-green-600 mt-1">{picMessage}</p>}
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input className="input-field" {...profileForm.register('firstName')} />
                {profileForm.formState.errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input-field" {...profileForm.register('lastName')} />
                {profileForm.formState.errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input-field" placeholder="+1 (555) 000-0000" {...profileForm.register('phone')} />
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={profileForm.formState.isSubmitting}>
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Change Password</h2>
              <p className="text-sm text-gray-500">Update your password</p>
            </div>
          </div>

          {passwordMessage && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {passwordError}
            </div>
          )}

          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" className="input-field" {...passwordForm.register('currentPassword')} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input-field" placeholder="Min. 6 characters" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input-field" {...passwordForm.register('confirmNewPassword')} />
              {passwordForm.formState.errors.confirmNewPassword && (
                <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.confirmNewPassword.message}</p>
              )}
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={passwordForm.formState.isSubmitting}>
              <Lock className="w-4 h-4" /> Change Password
            </button>
          </form>
        </div>
      </div>

      {/* Digital Signature */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Pen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Digital Signature</h2>
            <p className="text-sm text-gray-500">Upload your signature for printed leave documents</p>
          </div>
        </div>

        {sigMessage && (
          <div className={cn('p-3 rounded-lg border text-sm', sigMessageType === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700')}>
            {sigMessage}
          </div>
        )}

        <div className="flex items-start gap-6 flex-wrap">
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-500 mb-2 font-medium">Current Signature</p>
            <div className="w-48 h-24 rounded-lg border-2 border-dashed border-[#E8ECF1] flex items-center justify-center bg-gray-50 overflow-hidden">
              {sigPreview ? (
                <img src={sigPreview} alt="Signature" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <span className="text-xs text-gray-400">No signature uploaded</span>
              )}
            </div>
          </div>
          <div className="space-y-3 flex-1 min-w-[200px]">
            <p className="text-xs text-gray-500 mb-2 font-medium">Upload New Signature</p>
            <label className="flex items-center gap-2 px-4 py-2.5 border border-[#E8ECF1] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm text-gray-600">
              <Upload className="w-4 h-4" />
              Choose Image File
              <input
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/gif"
                onChange={handleSignatureFile}
              />
            </label>
            <p className="text-xs text-gray-400">Accepted: PNG, JPG, GIF — Max 500KB</p>
            <div className="flex gap-2">
              <button
                onClick={handleUploadSignature}
                disabled={uploadingSig || !sigFile}
                className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {uploadingSig ? 'Uploading...' : <><Upload className="w-4 h-4" /> Upload Signature</>}
              </button>
              {sigPreview && (
                <button
                  onClick={handleClearSignature}
                  className="btn-secondary text-sm flex items-center gap-2 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
