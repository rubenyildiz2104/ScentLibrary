import { supabase } from './supabase';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
console.log("API URL used:", API_URL);

async function authFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

export const api = {
  // Perfumes (public)
  getPerfumes: () => fetch(`${API_URL}/perfumes`).then(r => r.json()),
  getPerfume: (id: string) => fetch(`${API_URL}/perfumes/${id}`).then(r => r.json()),
  updatePerfume: (id: string, data: any) => authFetch(`/perfumes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.json()),
  searchPerfumes: (q: string) => fetch(`${API_URL}/perfumes/search?q=${encodeURIComponent(q)}`).then(r => r.json()),

  // Collection (protected)
  getCollection: () => authFetch('/collection').then(r => r.json()),
  addToCollection: (data: any) => authFetch('/collection', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json()),
  updateCollectionItem: (id: string, data: any) => authFetch(`/collection/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.json()),
  removeFromCollection: (id: string) => authFetch(`/collection/${id}`, { method: 'DELETE' }).then(r => r.json()),

  // Discovery (protected)
  getDiscovery: () => authFetch('/discovery').then(r => r.json()),
  addDiscovery: (data: any) => authFetch('/discovery', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json()),
  updateDiscovery: (id: string, data: any) => authFetch(`/discovery/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.json()),
  removeDiscovery: (id: string) => authFetch(`/discovery/${id}`, { method: 'DELETE' }).then(r => r.json()),
};
