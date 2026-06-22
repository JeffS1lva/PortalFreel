const ls = {
  get: (k: string) => localStorage.getItem(k),
  set: (k: string, v: string | null) => v ? localStorage.setItem(k, v) : localStorage.removeItem(k),
};

let _token: string | null = ls.get('token');
let _authData: string | null = ls.get('authData');
let _isAuthenticated = ls.get('isAuthenticated') === 'true';

export const tokenStore = {
  getToken: () => _token,
  setToken: (t: string | null) => { _token = t; ls.set('token', t); },

  getAuthData: () => _authData,
  setAuthData: (d: string | null) => { _authData = d; ls.set('authData', d); },

  isAuthenticated: () => _isAuthenticated,
  setAuthenticated: (v: boolean) => {
    _isAuthenticated = v;
    ls.set('isAuthenticated', v ? 'true' : null);
  },

  clear: () => {
    _token = null;
    _authData = null;
    _isAuthenticated = false;
    ['token', 'authData', 'isAuthenticated', 'authToken', 'access_token', 'session-expiration-time-v2']
      .forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
  },
};
