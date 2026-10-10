const Api = (() => {
  let csrfToken = sessionStorage.getItem('csrfToken') || '';

  function setCsrf(token) {
    csrfToken = token || '';
    if (csrfToken) sessionStorage.setItem('csrfToken', csrfToken);
  }

  async function request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (csrfToken && options.method && options.method !== 'GET') {
      headers['X-CSRF-Token'] = csrfToken;
    }
    const res = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers,
      body:
        options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
          ? JSON.stringify(options.body)
          : options.body,
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) {
      if (res.status === 401) {
        window.location.href = '/login.html';
        throw new Error('Authentication required');
      }
      return res;
    }

    const json = await res.json().catch(() => ({ success: false, message: 'Unexpected response' }));
    if (json.data?.csrfToken) setCsrf(json.data.csrfToken);
    if (res.status === 401 && !path.includes('/api/auth/login')) {
      window.location.href = '/login.html';
      throw new Error(json.message || 'Authentication required');
    }
    if (!res.ok || json.success === false) {
      const error = new Error(json.message || 'Request failed');
      error.status = res.status;
      error.payload = json;
      throw error;
    }
    return json;
  }

  return {
    setCsrf,
    get: (path) => request(path, { method: 'GET' }),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    delete: (path) => request(path, { method: 'DELETE' }),
    download: (path) => request(path, { method: 'GET' }),
  };
})();

window.Api = Api;
