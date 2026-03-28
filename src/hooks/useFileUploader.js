import { useState, useCallback } from 'react';

export function useFileUploader(apiEndpoint, options = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const upload = useCallback(async (file) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/${apiEndpoint}`, true);
        if (options.headers) {
          Object.entries(options.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        }
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded * 100) / e.total));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.response));
          else reject(new Error(xhr.statusText));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [apiEndpoint, options.headers]);

  return { upload, uploading, progress, error };
}
