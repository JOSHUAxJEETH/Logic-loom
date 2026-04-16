import { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card';
import TrendChart from '../components/TrendChart';
import RiskBadge from '../components/RiskBadge';
import styles from '../styles/FamilyDashboardPage.module.css';
import { ElderlyProfile, fetchProfiles } from '../api/admin';

interface FamilyDashboardPageProps {
  familyUsername: string;
}

const FamilyDashboardPage = ({ familyUsername }: FamilyDashboardPageProps) => {
  const [profiles, setProfiles] = useState<ElderlyProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<ElderlyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProfiles();
        setAllProfiles(data);
        const assigned = data.filter(
          (profile) => profile.familyContact.trim().toLowerCase() === familyUsername.trim().toLowerCase(),
        );
        setProfiles(assigned);
        if (!selectedProfileId) {
          setSelectedProfileId(assigned[0]?.id ?? data[0]?.id ?? '');
        }
      } catch (err) {
        setError('Unable to load elder profiles.');
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [familyUsername]);

  const summary = useMemo(() => {
    const total = profiles.length;
    const high = profiles.filter((profile) => profile.risk === 'High').length;
    const medium = profiles.filter((profile) => profile.risk === 'Medium').length;
    const low = profiles.filter((profile) => profile.risk === 'Low').length;
    return { total, high, medium, low };
  }, [profiles]);

  const selectedProfile = allProfiles.find((profile) => profile.id === selectedProfileId) ?? null;
  const activeProfile = selectedProfile ?? profiles[0] ?? null;

  return (
    <div className={styles.familyPage}>
      <section className={styles.profileSection}>
        <Card className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <span className={styles.tiny}>Family member dashboard</span>
              <h2>{familyUsername}</h2>
              <p>
                {summary.total
                  ? `${summary.total} elder profile${summary.total > 1 ? 's' : ''} assigned to your account.`
                  : 'No elder profiles have been assigned to your family username yet.'}
              </p>
            </div>
            <div className={styles.profileStatus}>
              <span className={styles.profileBadge}>Assigned family</span>
            </div>
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}
          {loading && <p>Loading elder profiles…</p>}
        </Card>
      </section>

      <section className={styles.selectionSection}>
        <Card title="Choose an Elder Profile" className={styles.selectionCard}>
          <p>Select any elder from the list below to review their profile. Assigned elders are shown first.</p>
          {allProfiles.length === 0 ? (
            <p>No elder profiles have been added yet.</p>
          ) : (
            <div className={styles.profileList}>
              {allProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className={`${styles.profileListItem} ${selectedProfileId === profile.id ? styles.selectedProfile : ''}`}
                  onClick={() => setSelectedProfileId(profile.id)}
                >
                  <div>
                    <strong>{profile.name}</strong>
                    <p>{profile.age} years • {profile.location}</p>
                    <p className={styles.assignedLabel}>
                      {profile.familyContact.trim().toLowerCase() === familyUsername.trim().toLowerCase()
                        ? 'Assigned to you'
                        : `Assigned to: ${profile.familyContact}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className={styles.metricsGrid}>
        <Card title="Assigned Elderly Summary" className={styles.conditionCard}>
          <div className={styles.conditionContent}>
            <div className={styles.metric}>
              <span className={styles.label}>Total elders</span>
              <span className={styles.value}>{summary.total}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>High risk</span>
              <span className={styles.value} style={{ color: '#dc2626' }}>{summary.high}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>Medium risk</span>
              <span className={styles.value} style={{ color: '#f59e0b' }}>{summary.medium}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>Low risk</span>
              <span className={styles.value} style={{ color: '#16a34a' }}>{summary.low}</span>
            </div>
            <p className={styles.insight}>
              This view is filtered for your family username only. You can see elders assigned to you and their current risk levels.
            </p>
          </div>
        </Card>

        <Card title="Primary Elder Profile" className={styles.activitiesCard}>
          {activeProfile ? (
            <div className={styles.profileDetail}>
              <div className={styles.profileRow}>
                <div>
                  <h3>{activeProfile.name}</h3>
                  <p>{activeProfile.age} years • {activeProfile.gender}</p>
                </div>
                <RiskBadge risk={activeProfile.risk} />
              </div>
              <div className={styles.profileMeta}>
                <span>Location: {activeProfile.location}</span>
                <span>Mobility: {activeProfile.mobility}</span>
                <span>Appetite: {activeProfile.appetite}</span>
                <span>Sleep quality: {activeProfile.sleepQuality}</span>
                <span>Loneliness score: {activeProfile.lonelinessScore}</span>
              </div>
              <div className={styles.profileNotes}>
                <h4>Care notes</h4>
                <p>{activeProfile.notes || 'No notes entered yet.'}</p>
              </div>
            </div>
          ) : (
            <p>No assigned elder profile is available yet.</p>
          )}
        </Card>
      </section>

      <section className={styles.engagementSection}>
        <Card title="Your Assigned Elders" className={styles.metricsCard}>
          {loading ? (
            <p>Loading assigned elders…</p>
          ) : profiles.length === 0 ? (
            <p>No elder profiles assigned to your account yet.</p>
          ) : (
            <div className={styles.entryList}>
              {profiles.map((profile) => (
                <div key={profile.id} className={styles.activityItem}>
                  <div>
                    <h4>{profile.name}</h4>
                    <p>{profile.age} years • {profile.location}</p>
                  </div>
                  <div className={styles.entryMeta}>
                    <RiskBadge risk={profile.risk} />
                    <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default FamilyDashboardPage;
