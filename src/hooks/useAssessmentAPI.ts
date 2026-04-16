import { useState, useCallback } from 'react';
import { AIPrediction } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useAssessmentAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (assessmentData: {
      meals: string;
      outings: string;
      activities: string;
      interactions: string;
      mood: string;
      moodScore: number;
      socialConnections: string;
      familyContact: string;
      notes: string;
      uclaLoneliness: number;
    }): Promise<AIPrediction | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/assess`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assessmentData),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const result: AIPrediction = await response.json();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to analyze assessment';
        setError(message);
        console.error('Assessment API error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getTrends = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trends`);
      if (!response.ok) throw new Error('Failed to fetch trends');
      return await response.json();
    } catch (err) {
      console.error('Trends API error:', err);
      return null;
    }
  }, []);

  const getRecommendations = useCallback(async (riskLevel: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/${riskLevel}`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return await response.json();
    } catch (err) {
      console.error('Recommendations API error:', err);
      return null;
    }
  }, []);

  return { analyze, getTrends, getRecommendations, loading, error };
};
