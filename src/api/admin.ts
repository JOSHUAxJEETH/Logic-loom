export const API_BASE = '/api';

export interface ProfileInput {
  name: string;
  age: string;
  gender: string;
  location: string;
  familyContact: string;
  appetite: string;
  mood: string;
  mobility: string;
  sleepQuality: string;
  lonelinessScore: number;
  notes: string;
}

export interface ElderlyProfile extends ProfileInput {
  id: string;
  risk: 'Low' | 'Medium' | 'High';
  createdAt: string;
}

export async function fetchProfiles(familyContact?: string): Promise<ElderlyProfile[]> {
  let url = `${API_BASE}/profiles`;
  if (familyContact) {
    url += `?familyContact=${encodeURIComponent(familyContact)}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load profiles');
  }
  return response.json();
}

export async function createProfile(profile: ProfileInput): Promise<ElderlyProfile> {
  const response = await fetch(`${API_BASE}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });
  if (!response.ok) {
    throw new Error('Failed to save profile');
  }
  return response.json();
}

export async function updateProfile(profileId: string, profile: ProfileInput): Promise<ElderlyProfile> {
  const response = await fetch(`${API_BASE}/profiles/${profileId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  return response.json();
}
