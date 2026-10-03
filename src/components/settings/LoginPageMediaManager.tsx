import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Video,
  Upload,
  Trash2,
  Edit3,
  Plus,
  Building2,
  Check,
  Lock,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { toast } from 'sonner';
import {
  loginMediaService,
  LoginPageMediaSettings,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES
} from '../../services/loginMediaService';
import { CompanySettings } from '../../types';
import { useSecurity } from '../../context/SecurityContext';

interface LoginPageMediaManagerProps {
  localSettings: CompanySettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
}

export const LoginPageMediaManager: React.FC<LoginPageMediaManagerProps> = ({
  localSettings,
  setLocalSettings
}) => {
  const { currentUser, effectiveUser, hasPermission } = useSecurity();
  const activeUser = effectiveUser || currentUser;

  const isAdmin =
    !activeUser ||
    activeUser.roleId === 'role-superadmin' ||
    activeUser.adminAuthorityLevel === 'SUPER_ADMINISTRATOR' ||
    activeUser.roleId === 'role-enterprise-admin' ||
    activeUser.roleId === 'role-gm' ||
    hasPermission('security.admin') ||
    hasPermission('settings.manage');

  const [mediaConfig, setMediaConfig] = useState<LoginPageMediaSettings>(() =>
    loginMediaService.getSettings()
  );
  const [replacingSlideId, setReplacingSlideId] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const darkLogoInputRef = useRef<HTMLInputElement | null>(null);
  const addSlideInputRef = useRef<HTMLInputElement | null>(null);
  const replaceSlideInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return loginMediaService.subscribe(() => {
      setMediaConfig(loginMediaService.getSettings());
    });
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  // 1A. Company Logo Upload — Light Mode (Max 1MB)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file for the Light Mode logo.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(
        `Logo image exceeds 1 MB limit (${formatSize(file.size)}). Maximum allowed size is 1 MB.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      loginMediaService.updateSettings({ companyLogoUrl: dataUrl });
      setLocalSettings(prev => ({ ...prev, logo: dataUrl }));
      toast.success('Light Mode company logo updated (under 1 MB)');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    loginMediaService.updateSettings({ companyLogoUrl: '' });
    setLocalSettings(prev => ({ ...prev, logo: undefined }));
    toast.info('Light Mode company logo removed');
  };

  // 1B. Company Logo Upload — Dark Mode (Max 1MB)
  const handleDarkLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file for the Dark Mode logo.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(
        `Dark Mode logo exceeds 1 MB limit (${formatSize(file.size)}). Maximum allowed size is 1 MB.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      loginMediaService.updateSettings({ companyLogoDarkUrl: dataUrl });
      setLocalSettings(prev => ({ ...prev, logoDark: dataUrl }));
      toast.success('Dark Mode company logo updated (under 1 MB)');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDarkLogo = () => {
    loginMediaService.updateSettings({ companyLogoDarkUrl: '' });
    setLocalSettings(prev => ({ ...prev, logoDark: undefined }));
    toast.info('Dark Mode company logo removed');
  };

  // 2. Add New Slideshow Image(s) (Max 1MB each)
  const handleAddSlideFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (e.target) e.target.value = '';
    if (files.length === 0) return;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" is not an image.`);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(
          `"${file.name}" (${formatSize(file.size)}) exceeds the 1 MB maximum image size.`
        );
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        loginMediaService.addSlide({
          url: reader.result as string,
          fileName: file.name,
          sizeBytes: file.size
        });
        toast.success(`Added slide image "${file.name}"`);
      };
      reader.readAsDataURL(file);
    });
  };

  // 3. Edit / Replace Existing Slide Image (Max 1MB)
  const handleReplaceSlideFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    const targetId = replacingSlideId;
    setReplacingSlideId(null);
    if (!file || !targetId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(
        `"${file.name}" (${formatSize(file.size)}) exceeds the 1 MB maximum image size.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      loginMediaService.updateSlide(targetId, {
        url: reader.result as string,
        fileName: file.name,
        sizeBytes: file.size
      });
      toast.success(`Updated slide with "${file.name}"`);
    };
    reader.readAsDataURL(file);
  };

  const handleMoveSlide = (index: number, direction: -1 | 1) => {
    const slides = [...mediaConfig.slides];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const temp = slides[index];
    slides[index] = slides[targetIndex];
    slides[targetIndex] = temp;
    loginMediaService.updateSettings({ slides });
  };

  // 4. Upload / Replace Single Video (Max 10MB, Only 1 Video)
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error(
        `Video "${file.name}" (${formatSize(file.size)}) exceeds the 10 MB maximum video size.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      loginMediaService.setVideo({
        url: reader.result as string,
        fileName: file.name,
        sizeBytes: file.size,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Login video "${file.name}" uploaded (${formatSize(file.size)})`);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteVideo = () => {
    loginMediaService.setVideo(null);
    toast.info('Login video removed');
  };

  if (!isAdmin) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          Only Administrators can configure the Login Page logos, system name, slideshow images, and video.
        </span>
      </div>
    );
  }

  const activeLightLogo = mediaConfig.companyLogoUrl || localSettings.logo;
  const activeDarkLogo = mediaConfig.companyLogoDarkUrl || localSettings.logoDark;

  return (
    <div className="space-y-6">
      {/* Section 1: Right Side of Login Page — System Name & Light/Dark Mode Logos (Max 1MB each) */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Login Page & System Branding — Light Mode Logo, Dark Mode Logo & System Name
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure separate company logos for Light Mode and Dark Mode (maximum 1 MB per image).
          </p>
        </div>

        {/* System Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Name of the System
          </label>
          <input
            type="text"
            value={mediaConfig.systemName}
            onChange={e => {
              const val = e.target.value;
              loginMediaService.updateSettings({ systemName: val });
            }}
            placeholder="e.g. Innovista Precision Suite"
            className="w-full max-w-md px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Light Mode Logo & Dark Mode Logo Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Light Mode Logo (Max 1MB) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Company Logo — Light Mode</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">Max: 1 MB</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {activeLightLogo ? (
                  <img
                    src={activeLightLogo}
                    alt="Light Mode Logo"
                    className="w-12 h-12 rounded-lg object-contain border border-slate-200 bg-white p-1 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {activeLightLogo ? 'Light Mode Logo Active' : 'Default Icon Active'}
                  </p>
                  <p className="text-[11px] text-slate-400">Used when Light Mode is on</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{activeLightLogo ? 'Change' : 'Upload'}</span>
                </button>
                {activeLightLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 cursor-pointer"
                    title="Remove Light Mode Logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dark Mode Logo (Max 1MB) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Moon className="w-3.5 h-3.5 text-orange-500" />
                <span>Company Logo — Dark Mode</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">Max: 1 MB</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {activeDarkLogo ? (
                  <img
                    src={activeDarkLogo}
                    alt="Dark Mode Logo"
                    className="w-12 h-12 rounded-lg object-contain border border-slate-700 bg-black p-1 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-black border border-slate-700 text-orange-500 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {activeDarkLogo ? 'Dark Mode Logo Active' : 'Fallback to Light/Default'}
                  </p>
                  <p className="text-[11px] text-slate-400">Used when Dark Mode is on</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={darkLogoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDarkLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => darkLogoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{activeDarkLogo ? 'Change' : 'Upload'}</span>
                </button>
                {activeDarkLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveDarkLogo}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 cursor-pointer"
                    title="Remove Dark Mode Logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Left Side of Login Page — Image Slideshow OR Single Video */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Login Page (Left Side) — Slideshow or Video
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose an image-only slideshow (max 1 MB per image) or a single auto-playing video (max 10 MB).
            </p>
          </div>

          {/* Mode Selector */}
          <div className="inline-flex p-1 rounded-xl bg-slate-200/80">
            <button
              type="button"
              onClick={() => loginMediaService.updateSettings({ displayMode: 'slideshow' })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mediaConfig.displayMode === 'slideshow'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image Slideshow ({mediaConfig.slides.length})</span>
            </button>
            <button
              type="button"
              onClick={() => loginMediaService.updateSettings({ displayMode: 'video' })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mediaConfig.displayMode === 'video'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Single Video ({mediaConfig.video ? '1/1' : '0/1'})</span>
            </button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={addSlideInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleAddSlideFiles}
          className="hidden"
        />
        <input
          ref={replaceSlideInputRef}
          type="file"
          accept="image/*"
          onChange={handleReplaceSlideFile}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
        />

        {mediaConfig.displayMode === 'slideshow' ? (
          /* SLIDESHOW MANAGEMENT */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => addSlideInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Image(s) (Max 1 MB each)</span>
                </button>
                <span className="text-xs text-slate-500">
                  {mediaConfig.slides.length} slide(s) active
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 font-medium">Slide Speed:</span>
                <select
                  value={mediaConfig.slideIntervalSeconds || 4}
                  onChange={e =>
                    loginMediaService.updateSettings({
                      slideIntervalSeconds: Number(e.target.value) || 4
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                >
                  <option value={3}>3 Seconds</option>
                  <option value={4}>4 Seconds</option>
                  <option value={6}>6 Seconds</option>
                  <option value={8}>8 Seconds</option>
                </select>
              </div>
            </div>

            {mediaConfig.slides.length === 0 ? (
              <div className="p-8 rounded-xl bg-white border border-dashed border-slate-300 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-700">No slideshow images uploaded</p>
                <p className="text-xs text-slate-400">
                  Click "Add Image(s)" above to upload images (maximum 1 MB per image).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaConfig.slides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="rounded-xl bg-white border border-slate-200 overflow-hidden flex flex-col justify-between shadow-2xs"
                  >
                    <div className="relative aspect-video bg-slate-100 overflow-hidden">
                      <img
                        src={slide.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold">
                        Slide {idx + 1}
                      </span>
                    </div>

                    <div className="p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {slide.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formatSize(slide.sizeBytes)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {mediaConfig.slides.length > 1 && (
                          <>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveSlide(idx, -1)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-600 cursor-pointer"
                              title="Move Earlier"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === mediaConfig.slides.length - 1}
                              onClick={() => handleMoveSlide(idx, 1)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-600 cursor-pointer"
                              title="Move Later"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setReplacingSlideId(slide.id);
                            replaceSlideInputRef.current?.click();
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Replace Slide Image (Max 1 MB)"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            loginMediaService.deleteSlide(slide.id);
                            toast.info('Slide deleted');
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 cursor-pointer"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* SINGLE VIDEO MANAGEMENT (ONLY 1 VIDEO, MAX 10MB) */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {mediaConfig.video
                      ? 'Replace Video (Max 10 MB)'
                      : 'Upload Video (Max 10 MB)'}
                  </span>
                </button>
                <span className="text-xs text-slate-500">
                  Limit: Only 1 video allowed (maximum 10 MB) · Plays continuously without controls
                </span>
              </div>

              {mediaConfig.video && (
                <button
                  type="button"
                  onClick={handleDeleteVideo}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Video</span>
                </button>
              )}
            </div>

            {mediaConfig.video ? (
              <div className="rounded-xl bg-white border border-slate-200 overflow-hidden max-w-xl">
                <div className="aspect-video bg-black relative">
                  <video
                    key={mediaConfig.video.url}
                    src={mediaConfig.video.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    disablePictureInPicture
                    controlsList="nodownload nofullscreen noremoteplayback"
                    onContextMenu={e => e.preventDefault()}
                    className="w-full h-full object-cover pointer-events-none select-none"
                  />
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{mediaConfig.video.fileName}</p>
                    <p className="text-slate-400 font-mono text-[11px]">
                      Size: {formatSize(mediaConfig.video.sizeBytes)} / 10 MB max
                    </p>
                  </div>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Auto-Playing on Login Page
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-white border border-dashed border-slate-300 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-700">No login video uploaded</p>
                <p className="text-xs text-slate-400">
                  Upload 1 video file (MP4 or WebM, maximum 10 MB) to display on the left side of the login page.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
