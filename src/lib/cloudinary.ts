export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

function getConfig(): CloudinaryConfig {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'kura_unsigned';
  return { cloudName, uploadPreset };
}

export function getCloudinaryConfig(): CloudinaryConfig {
  return getConfig();
}

export function isCloudinaryConfigured(): boolean {
  const { cloudName } = getConfig();
  return !!cloudName;
}

export async function uploadToCloudinary(
  file: File,
  folder: string = 'kura'
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = getConfig();
  if (!cloudName) throw new Error('Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Upload failed (${res.status})`);
  }

  return res.json();
}

export function getCloudinaryUrl(  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  }
): string {
  const { cloudName } = getConfig();
  if (!cloudName) return '';

  const { width, height, quality = 'auto', format = 'auto', crop = 'fit' } = options || {};

  const parts: string[] = [
    `https://res.cloudinary.com/${cloudName}/image/upload`,
    `q_${quality}`,
    `f_${format}`,
  ];

  if (crop) parts.push(`c_${crop}`);
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);

  return `${parts.join('/')}/${publicId}`;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { valid: false, error: 'Image must be under 20MB' };
  }
  return { valid: true };
}

/**
 * Rewrites a Cloudinary delivery URL to use automatic format/quality * (WebP/AVIF + smart compression) and an optional width cap.
 * Non-Cloudinary URLs (Supabase storage, data: previews, etc.) pass
 * through untouched, so this is safe to apply to any <img src>.
 */
export function optimizeImageUrl(url: string | null | undefined, options?: { width?: number }): string {
  if (!url) return '';
  const marker = '/image/upload/';
  const idx = url.indexOf(marker);
  if (!url.includes('res.cloudinary.com') || idx === -1) return url;
  // Don't double-transform URLs that already carry transformations.
  const after = url.slice(idx + marker.length);
  if (/^(f_|q_|w_|h_|c_)/.test(after.split('/')[0])) return url;
  const params = ['f_auto', 'q_auto'];
  if (options?.width) params.push(`w_${options.width}`, 'c_limit');
  return `${url.slice(0, idx + marker.length)}${params.join(',')}/${after}`;
}

/**
 * Unsigned Cloudinary upload with real progress events (XMLHttpRequest —
 * fetch cannot report upload progress). Falls back to plain fetch upload
 * when progress cannot be observed.
 */
export function uploadToCloudinaryWithProgress(
  file: File,
  folder: string = 'kura',
  onProgress?: (pct: number) => void
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = getConfig();
  if (!cloudName) {
    return uploadToCloudinary(file, folder).then(r => {
      onProgress?.(100);
      return r;
    });
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Upload failed'));
        }
      } else {
        try {
          const j = JSON.parse(xhr.responseText);
          reject(new Error(j?.error?.message || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed — check your connection'));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
    onProgress?.(0);
    xhr.send(formData);
  });
}
