import { FormEvent, useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import RiskBadge from '../components/RiskBadge';
import TrendChart from '../components/TrendChart';
import styles from '../styles/InputPanelPage.module.css';
import { AIPrediction } from '../types';
import { useAlarmSound } from '../hooks/useAlarmSound';
import { useAssessmentAPI } from '../hooks/useAssessmentAPI';

const moodMapping = {
  Happy: { score: 1, label: 'Happy' },
  Neutral: { score: 2, label: 'Neutral' },
  Sad: { score: 3, label: 'Sad' },
  Withdrawn: { score: 4, label: 'Withdrawn' },
};

const buildPrediction = (
  mood: keyof typeof moodMapping,
  interactions: number,
  supportNetwork: number,
): AIPrediction => {
  if (mood === 'Sad' || mood === 'Withdrawn' || interactions < 5 || supportNetwork < 2) {
    return {
      risk: 'High',
      summary: 'Recent indicators point to heightened loneliness risk. The resident needs more active engagement and social check-ins.',
      recommendations: [
        'Increase family or volunteer visits',
        'Schedule meaningful conversations and light activities',
        'Monitor mood changes throughout the week',
      ],
      alert: 'High risk alert: Immediate care attention recommended.',
    };
  }

  if (mood === 'Neutral' || interactions < 10 || supportNetwork < 4) {
    return {
      risk: 'Medium',
      summary: 'Moderate isolation signals were observed. Keep encouraging social routines and familiar interactions.',
      recommendations: [
        'Introduce a weekly group activity',
        'Confirm contact frequency with family',
        'Track daily mood and energy changes',
      ],
    };
  }

  return {
    risk: 'Low',
    summary: 'Positive social patterns are present. Continue nurturing supportive moments and maintain attention to changes.',
    recommendations: [
      'Keep the care routine consistent',
      'Encourage favorite hobbies and light outing plans',
      'Share uplifted updates with family members',
    ],
  };
};

const InputPanelPage = () => {
  const [meals, setMeals] = useState('');
  const [outings, setOutings] = useState('');
  const [activities, setActivities] = useState('');
  const [interactions, setInteractions] = useState('');
  const [mood, setMood] = useState<keyof typeof moodMapping>('Neutral');
  const [moodScore, setMoodScore] = useState('3');
  const [socialConnections, setSocialConnections] = useState('');
  const [familyContact, setFamilyContact] = useState('');
  const [notes, setNotes] = useState('');
  const [uclaQ1, setUclaQ1] = useState('2'); // Feel lack of companionship
  const [uclaQ2, setUclaQ2] = useState('2'); // Feel left out
  const [uclaQ3, setUclaQ3] = useState('2'); // Feel isolated
  const [uclaQ4, setUclaQ4] = useState('2'); // Feel lonely
  const [uclaQ5, setUclaQ5] = useState('2'); // Feel nobody knows me well
  const [result, setResult] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const { analyze, error: apiError } = useAssessmentAPI();
  const { playAlarm } = useAlarmSound();

  // Play alarm when high risk is detected
  useEffect(() => {
    if (result?.risk === 'High') {
      playAlarm();
    }
  }, [result, playAlarm]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Calculate UCLA Loneliness Score (sum of 5 questions, range 5-20)
      const uclaLoneliness = Number(uclaQ1) + Number(uclaQ2) + Number(uclaQ3) + Number(uclaQ4) + Number(uclaQ5);
      
      const analysisResult = await analyze({
        meals,
        outings,
        activities,
        interactions,
        mood,
        moodScore: Number(moodScore) || 1,
        socialConnections,
        familyContact,
        notes,
        uclaLoneliness,
      });
      setResult(analysisResult);
    } catch (err) {
      console.error('API error:', err);
      // Fallback to mock prediction on API failure
      setResult(buildPrediction(mood, Number(interactions) || 0, Number(socialConnections) || 0));
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(
    () => `Meals: ${meals || 'Not recorded'} | Outings: ${outings || 'Not recorded'} | Social interactions: ${interactions || 'Not recorded'} | Current mood: ${mood}`,
    [meals, outings, interactions, mood],
  );

  return (
    <div className={styles.inputPage}>
      <section className={styles.gridLayout}>
        <div className={styles.formWrapper}>
          <Card className={styles.formCard} title="Daily Assessment">
            <form className={styles.formBody} onSubmit={handleSubmit}>
              {/* Daily Activities Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle} style={{ borderColor: '#a78bfa' }}>
                  📋 Daily Activities
                </h3>
                <label className={styles.question}>
                  <span className={styles.questionText}>What did they eat today?</span>
                  <input
                    type="text"
                    value={meals}
                    onChange={(event) => setMeals(event.target.value)}
                    placeholder="e.g., Breakfast, lunch, and dinner"
                  />
                </label>
                <label className={styles.question}>
                  <span className={styles.questionText}>Where did they go this week?</span>
                  <input
                    type="text"
                    value={outings}
                    onChange={(event) => setOutings(event.target.value)}
                    placeholder="e.g., Grocery, park, doctor visit"
                  />
                </label>
                <label className={styles.question}>
                  <span className={styles.questionText}>What activities did they do?</span>
                  <textarea
                    value={activities}
                    onChange={(event) => setActivities(event.target.value)}
                    placeholder="e.g., Reading, gardening, watching TV"
                  />
                </label>
              </div>

              {/* Social Engagement Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle} style={{ borderColor: '#7dd3fc' }}>
                  👥 Social Engagement
                </h3>
                <label className={styles.question}>
                  <span className={styles.questionText}>How many social interactions did they have?</span>
                  <input
                    type="text"
                    value={interactions}
                    onChange={(event) => setInteractions(event.target.value)}
                    placeholder="e.g., 5 conversations, 2 visits"
                  />
                </label>
                <label className={styles.question}>
                  <span className={styles.questionText}>Who did they connect with?</span>
                  <input
                    type="text"
                    value={socialConnections}
                    onChange={(event) => setSocialConnections(event.target.value)}
                    placeholder="e.g., Family, friends, volunteering"
                  />
                </label>
                <label className={styles.question}>
                  <span className={styles.questionText}>How often do they contact family?</span>
                  <input
                    type="text"
                    value={familyContact}
                    onChange={(event) => setFamilyContact(event.target.value)}
                    placeholder="e.g., Daily calls, weekly visits"
                  />
                </label>
              </div>

              {/* Emotional Wellbeing Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle} style={{ borderColor: '#86efac' }}>
                  ❤️ Emotional Wellbeing
                </h3>
                <label className={styles.question}>
                  <span className={styles.questionText}>How is their current mood?</span>
                  <select value={mood} onChange={(event) => setMood(event.target.value as keyof typeof moodMapping)}>
                    <option value="Happy">😊 Happy & Engaged</option>
                    <option value="Neutral">😐 Neutral & Stable</option>
                    <option value="Sad">😔 Sad & Withdrawn</option>
                    <option value="Withdrawn">😞 Very Withdrawn</option>
                  </select>
                </label>
                <label className={styles.question}>
                  <span className={styles.questionText}>Rate their mood on a scale (1–5)</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={moodScore}
                    onChange={(event) => setMoodScore(event.target.value)}
                    className={styles.rangeSlider}
                  />
                  <div className={styles.rangeLabels}>
                    <span>Low</span>
                    <strong>{moodScore}/5</strong>
                    <span>High</span>
                  </div>
                </label>
              </div>

              {/* UCLA Loneliness Scale Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle} style={{ borderColor: '#fb7185' }}>
                  📊 UCLA Loneliness Scale
                </h3>
                <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '12px', fontStyle: 'italic' }}>
                  Rate each statement (1 = Never, 2 = Rarely, 3 = Sometimes, 4 = Always)
                </p>
                
                <label className={styles.question}>
                  <span className={styles.questionText}>I feel that I lack companionship</span>
                  <select value={uclaQ1} onChange={(event) => setUclaQ1(event.target.value)}>
                    <option value="1">Never</option>
                    <option value="2">Rarely</option>
                    <option value="3">Sometimes</option>
                    <option value="4">Always</option>
                  </select>
                </label>

                <label className={styles.question}>
                  <span className={styles.questionText}>I feel left out</span>
                  <select value={uclaQ2} onChange={(event) => setUclaQ2(event.target.value)}>
                    <option value="1">Never</option>
                    <option value="2">Rarely</option>
                    <option value="3">Sometimes</option>
                    <option value="4">Always</option>
                  </select>
                </label>

                <label className={styles.question}>
                  <span className={styles.questionText}>I feel isolated from others</span>
                  <select value={uclaQ3} onChange={(event) => setUclaQ3(event.target.value)}>
                    <option value="1">Never</option>
                    <option value="2">Rarely</option>
                    <option value="3">Sometimes</option>
                    <option value="4">Always</option>
                  </select>
                </label>

                <label className={styles.question}>
                  <span className={styles.questionText}>I feel lonely</span>
                  <select value={uclaQ4} onChange={(event) => setUclaQ4(event.target.value)}>
                    <option value="1">Never</option>
                    <option value="2">Rarely</option>
                    <option value="3">Sometimes</option>
                    <option value="4">Always</option>
                  </select>
                </label>

                <label className={styles.question}>
                  <span className={styles.questionText}>I feel that nobody really knows me well</span>
                  <select value={uclaQ5} onChange={(event) => setUclaQ5(event.target.value)}>
                    <option value="1">Never</option>
                    <option value="2">Rarely</option>
                    <option value="3">Sometimes</option>
                    <option value="4">Always</option>
                  </select>
                </label>

                <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', marginTop: '12px', fontSize: '0.9em', color: '#92400e' }}>
                  <strong>UCLA Score: {Number(uclaQ1) + Number(uclaQ2) + Number(uclaQ3) + Number(uclaQ4) + Number(uclaQ5)}/20</strong>
                  <p style={{ margin: '4px 0 0 0' }}>
                    {Number(uclaQ1) + Number(uclaQ2) + Number(uclaQ3) + Number(uclaQ4) + Number(uclaQ5) <= 9 && '✅ Low loneliness'}
                    {Number(uclaQ1) + Number(uclaQ2) + Number(uclaQ3) + Number(uclaQ4) + Number(uclaQ5) > 9 && Number(uclaQ1) + Number(uclaQ2) + Number(uclaQ3) + Number(uclaQ4) + Number(uclaQ5) <= 15 && '⚠️ Moderate loneliness'}
                    {Number(uclaQ1) + Number(uclaQ2) + Number(uclaQ3) + Number(uclaQ4) + Number(uclaQ5) > 15 && '🚨 High loneliness'}
                  </p>
                </div>
              </div>

              {/* Additional Notes Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle} style={{ borderColor: '#fbbf24' }}>
                  📝 Additional Observations
                </h3>
                <label className={styles.question}>
                  <span className={styles.questionText}>Any other behavioral observations?</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add any additional notes for the AI assessment..."
                  />
                </label>
              </div>

              <Button type="submit" disabled={loading} className={styles.analyzeButton}>
                {loading ? '⏳ Analyzing...' : '🔍 Analyze Assessment'}
              </Button>
            </form>
          </Card>
        </div>

        <Card className={`${styles.resultCard} ${result?.risk === 'High' ? styles.highRiskCard : ''}`} title="Risk Assessment">
          {loading && <p className={styles.loading}>✨ Generating risk summary...</p>}
          {!loading && !result && <p className={styles.hint}>Complete the form and tap "Analyze Assessment" to see the personalized risk profile.</p>}
          {result && (
            <div className={`${styles.resultPanel} ${result.risk === 'High' ? styles.highRiskPanel : ''}`}>
              <RiskBadge risk={result.risk} />
              {result.alert && <div className={`${styles.alertBadge} ${styles[`alert${result.risk}`]}`}>🚨 {result.alert}</div>}
              
              <div className={styles.chartSection}>
                <h4>📊 Weekly Trend Analysis</h4>
                <TrendChart type="line" />
              </div>
              
              <div className={styles.section}>
                <h4>Behavioral Summary</h4>
                <p>{result.summary}</p>
              </div>
              <div className={styles.section}>
                <h4>Recommended Actions</h4>
                <ul>
                  {result.recommendations.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.section}>
                <h4>Assessment Snapshot</h4>
                <p>{summary}</p>
              </div>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default InputPanelPage;
