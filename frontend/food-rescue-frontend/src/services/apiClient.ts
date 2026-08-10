const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const tokenStorage = {
  get: () => localStorage.getItem('fr_token'),
  set: (t: string) => localStorage.setItem('fr_token', t),
  clear: () => localStorage.removeItem('fr_token'),
};

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(`${data.message || 'Validation failed'}: ${data.errors.join('; ')}`);
    }
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

// Multipart/form-data request (for image uploads). No Content-Type header —
// the browser sets the multipart boundary automatically.
export async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const token = tokenStorage.get();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(`${data.message || 'Validation failed'}: ${data.errors.join('; ')}`);
    }
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

// Resolve a backend-relative upload path (e.g. /uploads/foods/x.png) to a full URL.
export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  const apiOrigin = new URL(BASE_URL).origin;
  return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
}
