import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, Trash2, Upload, X } from 'lucide-react';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_DIMENSION = 640;
const IMAGE_COMPRESSION_QUALITY = 0.82;
const SUCCESS_MESSAGE_DURATION_MS = 1800;
let cachedWebpSupport: boolean | null = null;

interface ProfilePhotoUploaderProps {
  photoUrl?: string;
  initials: string;
  avatarColor: string;
  onSave: (photoUrl?: string) => void;
  title?: string;
  compact?: boolean;
}

export default function ProfilePhotoUploader({
  photoUrl,
  initials,
  avatarColor,
  onSave,
  title = 'Profile Photo',
  compact = false,
}: ProfilePhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const successTimeoutRef = useRef<number | null>(null);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setPendingPhotoUrl(undefined);
    setError('');
  }, [photoUrl]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const previewPhoto = pendingPhotoUrl ?? photoUrl;
  const hasUnsavedChanges = pendingPhotoUrl !== undefined && pendingPhotoUrl !== photoUrl;

  const processFile = async (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Use JPG, PNG, or WebP image files.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess(false);
    try {
      const compressed = await compressImageToDataUrl(file);
      setPendingPhotoUrl(compressed);
    } catch (err) {
      console.error('Failed to process selected profile image', { error: err });
      setError('Failed to process image. Please check the file or try a different browser.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!hasUnsavedChanges) return;
    onSave(pendingPhotoUrl);
    setPendingPhotoUrl(undefined);
    showSuccessMessage();
  };

  const handleRemove = () => {
    setPendingPhotoUrl(undefined);
    onSave(undefined);
    showSuccessMessage();
    setError('');
  };

  const showSuccessMessage = () => {
    setSuccess(true);
    if (successTimeoutRef.current) {
      window.clearTimeout(successTimeoutRef.current);
    }
    successTimeoutRef.current = window.setTimeout(() => setSuccess(false), SUCCESS_MESSAGE_DURATION_MS);
  };

  const openFilePicker = () => inputRef.current?.click();

  return (
    <div className={compact ? 'space-y-2' : 'bg-[#FDF8FF] border border-[#E9DDF3] rounded-2xl p-4 space-y-3'}>
      {!compact && (
        <div>
          <h3 className="text-[#51396B] text-sm font-body font-semibold">{title}</h3>
          <p className="text-[#7A678F] text-xs font-body mt-0.5">Upload a photo to personalize your profile.</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openFilePicker}
          className="relative group"
          aria-label="Edit profile photo"
        >
          <AvatarDisplay photoUrl={previewPhoto} initials={initials} avatarColor={avatarColor} />
          <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={16} className="text-white" aria-hidden="true" />
          </span>
        </button>

        <div className="flex-1">
          <button
            type="button"
            onClick={openFilePicker}
            className="inline-flex items-center gap-2 text-sm font-body font-semibold text-[#51396B] bg-[#F3E9FA] hover:bg-[#E7D6F5] px-3 py-2 rounded-lg transition-colors"
          >
            <Upload size={14} aria-hidden="true" />
            Edit Photo
          </button>
          {(photoUrl || pendingPhotoUrl) && !compact && (
            <button
              type="button"
              onClick={handleRemove}
              className="ml-2 inline-flex items-center gap-1 text-xs font-body text-[#A14F6B]"
            >
              <Trash2 size={12} aria-hidden="true" />
              Remove
            </button>
          )}
        </div>
      </div>

      {!compact && (
        <label
          onDragOver={e => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={e => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files[0];
            if (file) {
              void processFile(file);
            }
          }}
          className={`block border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
            dragActive ? 'border-[#C6A7DF] bg-[#F8EFFD]' : 'border-[#D9C4EA] bg-white/70'
          }`}
        >
          <p className="text-xs font-body text-[#7A678F]">
            Drag & drop an image here, or <span className="font-semibold text-[#51396B]">browse files</span>
          </p>
        </label>
      )}

      {hasUnsavedChanges && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 text-xs font-body font-semibold bg-[#A8D5BA] text-[#1F5134] px-3 py-1.5 rounded-lg"
          >
            <Check size={12} aria-hidden="true" />
            Save Photo
          </button>
          <button
            type="button"
            onClick={() => setPendingPhotoUrl(undefined)}
            className="inline-flex items-center gap-1.5 text-xs font-body font-semibold bg-[#FCE5DF] text-[#8A3E32] px-3 py-1.5 rounded-lg"
          >
            <X size={12} aria-hidden="true" />
            Cancel
          </button>
        </div>
      )}

      {(photoUrl || pendingPhotoUrl) && compact && (
        <button
          type="button"
          onClick={handleRemove}
          className="inline-flex items-center gap-1 text-xs font-body text-slate-400"
        >
          <Trash2 size={12} aria-hidden="true" />
          Remove
        </button>
      )}

      {isLoading && (
        <p className="text-xs font-body text-[#7A678F] inline-flex items-center gap-1.5">
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          Processing photo...
        </p>
      )}
      {error && <p className="text-xs font-body text-red-400">{error}</p>}
      {success && <p className="text-xs font-body text-green-500">✓ Photo updated</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            void processFile(file);
          }
          e.currentTarget.value = '';
        }}
      />
    </div>
  );
}

function AvatarDisplay({ photoUrl, initials, avatarColor }: { photoUrl?: string; initials: string; avatarColor: string }) {
  return photoUrl ? (
    <img
      src={photoUrl}
      alt="Profile"
      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
    />
  ) : (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-white shadow-sm"
      style={{ backgroundColor: avatarColor }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const imageBitmap = await createImageBitmap(file);
  const largestSide = Math.max(imageBitmap.width, imageBitmap.height);
  const scale = largestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largestSide : 1;
  const width = Math.round(imageBitmap.width * scale);
  const height = Math.round(imageBitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error(
      'Failed to get 2D canvas context. This can happen when canvas APIs are unavailable.'
    );
  }
  ctx.drawImage(imageBitmap, 0, 0, width, height);
  imageBitmap.close();

  const mimeType = supportsWebp() ? 'image/webp' : 'image/jpeg';
  return canvas.toDataURL(mimeType, IMAGE_COMPRESSION_QUALITY);
}

function supportsWebp(): boolean {
  if (cachedWebpSupport !== null) {
    return cachedWebpSupport;
  }
  const canvas = document.createElement('canvas');
  cachedWebpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  return cachedWebpSupport;
}
