import { getAccessToken, tryRefresh } from './api';

const UPLOAD_TIMEOUT_MS = 60000;

export function uploadFileViaXHR(url: string, formData: FormData, token: string | null): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
        return;
      }
      if (xhr.status === 401) {
        reject(Object.assign(new Error('Session expired. Please log in again.'), { status: 401 }));
        return;
      }
      let errorMsg = 'Upload failed';
      try {
        const body = JSON.parse(xhr.responseText);
        errorMsg = body.error || body.message || errorMsg;
      } catch {
        // ignore
      }
      reject(new Error(errorMsg));
    };
    xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again.'));
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.send(formData as any);
  });
}

/** Upload with one silent token refresh on 401. */
export async function uploadFileWithAuth(url: string, formData: FormData): Promise<any> {
  let token = await getAccessToken();
  try {
    return await uploadFileViaXHR(url, formData, token);
  } catch (err: any) {
    if (err?.status !== 401) throw err;
    const refreshed = await tryRefresh();
    if (!refreshed) throw err;
    return uploadFileViaXHR(url, formData, refreshed);
  }
}
