import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import RiskBadge from '../components/RiskBadge';
import styles from '../styles/ElderListPage.module.css';
import { ElderlyProfile, fetchProfiles } from '../api/admin';

const ElderListPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ElderlyProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProfiles();
        setProfiles(data);
      } catch (err) {
        setError('Unable to load elder profiles.');
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, []);

  return (
    <div className={styles.elderListPage}>
      <div className={styles.headerRow}>
        <div>
          <h1>All Elderly Profiles</h1>
          <p className={styles.description}>
            View all caregiver-added elder profiles in one place. Use this list to review existing elders and confirm family assignment.
          </p>
        </div>
        <Button onClick={() => navigate('/admin-dashboard')}>
          Add new elder
        </Button>
      </div>

      <Card className={styles.listCard}>
        {loading ? (
          <p>Loading elder profiles…</p>
        ) : error ? (
          <p className={styles.errorMessage}>{error}</p>
        ) : profiles.length === 0 ? (
          <p>No elder profiles have been added yet.</p>
        ) : (
          <div className={styles.profileGrid}>
            {profiles.map((profile) => (
              <div key={profile.id} className={styles.profileCard}>
                <div className={styles.profileHeader}>
                  <h3>{profile.name}</h3>
                  <RiskBadge risk={profile.risk} />
                </div>
                <p>{profile.age} years • {profile.gender}</p>
                <p>{profile.location}</p>
                <div className={styles.metaRow}>
                  <span>Family: {profile.familyContact}</span>
                  <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
                <p className={styles.notes}>{profile.notes || 'No notes entered yet.'}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ElderListPage;
