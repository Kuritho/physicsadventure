import React, { useState, useRef, useEffect } from 'react';

const TowerOfGravity = ({ onComplete, navigate }) => {
  const [isDropping, setIsDropping] = useState(false);
  const [time, setTime] = useState(0);
  const [height, setHeight] = useState(0);
  const [trials, setTrials] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentTrialHeight, setCurrentTrialHeight] = useState(50);
  const [showReward, setShowReward] = useState(false);
  const [assessment, setAssessment] = useState({
    heightCalculation: null,
    errorReflection: '',
    submitted: false,
    score: 0
  });
  
  // New assessment states
  const [currentAssessment, setCurrentAssessment] = useState(0);
  const [assessments, setAssessments] = useState([
    {
      type: 'heightCalculation',
      completed: false,
      score: 0
    },
    {
      type: 'errorReflection',
      completed: false,
      score: 0
    },
    {
      type: 'graphInterpretation',
      completed: false,
      score: 0,
      userAnswer: '',
      correctAnswer: 'quadratic'
    },
    {
      type: 'gravityCalculation',
      completed: false,
      score: 0,
      userAnswer: '',
      correctAnswer: null
    },
    {
      type: 'realWorldApplication',
      completed: false,
      score: 0,
      userAnswer: '',
      correctAnswer: 'time'
    },
    {
      type: 'experimentalDesign',
      completed: false,
      score: 0,
      userAnswer: ''
    }
  ]);

  const sphereRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);
  const isDroppingRef = useRef(false);

  const GRAVITY = 9.81;
  const PIXELS_PER_METER = 6; // Reduced for better visibility
  const MAX_TOWER_HEIGHT = 100;
  const SIMULATION_SCALE = 0.8; // Scale factor to zoom out

  const calculateTheoreticalTime = (h) => {
    return Math.sqrt((2 * h) / GRAVITY);
  };

  const calculateHeightFromTime = (t) => {
    return 0.5 * GRAVITY * t * t;
  };

  const calculateGravityFromData = (h, t) => {
    return (2 * h) / (t * t);
  };

  const startDrop = () => {
    if (isDroppingRef.current) return;
    
    setIsDropping(true);
    isDroppingRef.current = true;
    setTime(0);
    setHeight(0);
    startTimeRef.current = performance.now();

    const theoreticalTime = calculateTheoreticalTime(currentTrialHeight);

    const animate = (currentTime) => {
      if (!isDroppingRef.current) return;
      
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      const currentHeight = 0.5 * GRAVITY * elapsed * elapsed;
      
      if (currentHeight >= currentTrialHeight) {
        setTime(theoreticalTime);
        setHeight(currentTrialHeight);
        
        if (sphereRef.current) {
          sphereRef.current.style.transform = `translateX(-50%) translateY(${currentTrialHeight * PIXELS_PER_METER}px) scale(${SIMULATION_SCALE})`;
        }
        
        const experimentalHeight = calculateHeightFromTime(theoreticalTime);
        const error = Math.abs(currentTrialHeight - experimentalHeight) / currentTrialHeight * 100;
        
        const newTrial = {
          trialNumber: trials.length + 1,
          towerHeight: currentTrialHeight,
          fallTime: theoreticalTime,
          calculatedHeight: experimentalHeight,
          error: error
        };
        
        setTrials(prev => [...prev, newTrial]);
        setIsDropping(false);
        isDroppingRef.current = false;
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        return;
      }
      
      setTime(elapsed);
      setHeight(currentHeight);
      
      if (sphereRef.current) {
        sphereRef.current.style.transform = `translateX(-50%) translateY(${currentHeight * PIXELS_PER_METER}px) scale(${SIMULATION_SCALE})`;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopDrop = () => {
    if (!isDroppingRef.current) return;
    
    setIsDropping(false);
    isDroppingRef.current = false;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (time > 0) {
      const experimentalHeight = calculateHeightFromTime(time);
      const error = Math.abs(currentTrialHeight - experimentalHeight) / currentTrialHeight * 100;
      
      const newTrial = {
        trialNumber: trials.length + 1,
        towerHeight: currentTrialHeight,
        fallTime: time,
        calculatedHeight: experimentalHeight,
        error: error
      };
      
      setTrials(prev => [...prev, newTrial]);
    }
  };

  const resetExperiment = () => {
    setIsDropping(false);
    isDroppingRef.current = false;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setTime(0);
    setHeight(0);
    
    if (sphereRef.current) {
      sphereRef.current.style.transform = `translateX(-50%) translateY(0px) scale(${SIMULATION_SCALE})`;
      sphereRef.current.style.bottom = `${((currentTrialHeight / MAX_TOWER_HEIGHT) * 60)}%`;
    }
  };

  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value);
    setCurrentTrialHeight(newHeight);
    resetExperiment();
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const completeQuest = () => {
    if (trials.length >= 3) {
      if (!assessment.submitted) {
        alert('Please complete all assessments before claiming your reward!');
      } else if (assessment.score >= 70) {
        setShowReward(true);
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        alert('Please review your assessments. You need a score of at least 70% to earn the Gravity Gauge!');
      }
    } else {
      alert('Please complete at least 3 trials to master free fall calculations!');
    }
  };

  const handleAssessmentSubmit = () => {
    if (currentAssessment < assessments.length - 1) {
      setCurrentAssessment(prev => prev + 1);
    } else {
      calculateFinalScore();
    }
  };

  const calculateFinalScore = () => {
    let totalScore = 0;
    let maxScore = 0;

    assessments.forEach((assess, index) => {
      let score = 0;
      const maxPoints = 20;

      switch (assess.type) {
        case 'heightCalculation':
          const lastTrial = trials[trials.length - 1];
          const userAnswer = parseFloat(assessment.heightCalculation);
          const correctAnswer = lastTrial.calculatedHeight;
          const tolerance = correctAnswer * 0.1;
          
          if (Math.abs(userAnswer - correctAnswer) <= tolerance) {
            score = maxPoints;
          }
          break;

        case 'errorReflection':
          const reflection = assessment.errorReflection.toLowerCase();
          const keywords = ['error', 'accuracy', 'measurement', 'experimental', 'deviation', 'precision', 'gravity'];
          const keywordCount = keywords.filter(keyword => reflection.includes(keyword)).length;
          
          if (assessment.errorReflection.length >= 50 && keywordCount >= 2) {
            score = maxPoints;
          } else if (assessment.errorReflection.length >= 30) {
            score = maxPoints * 0.5;
          }
          break;

        case 'graphInterpretation':
          if (assess.userAnswer.toLowerCase().includes(assess.correctAnswer)) {
            score = maxPoints;
          }
          break;

        case 'gravityCalculation':
          const calculatedG = calculateGravityFromData(trials[0].towerHeight, trials[0].fallTime);
          const userG = parseFloat(assess.userAnswer);
          if (userG && Math.abs(userG - calculatedG) <= 1.0) {
            score = maxPoints;
          }
          break;

        case 'realWorldApplication':
          if (assess.userAnswer.toLowerCase().includes(assess.correctAnswer)) {
            score = maxPoints;
          }
          break;

        case 'experimentalDesign':
          if (assess.userAnswer.length >= 40) {
            score = maxPoints;
          } else if (assess.userAnswer.length >= 20) {
            score = maxPoints * 0.5;
          }
          break;
      }

      assessments[index].score = score;
      totalScore += score;
      maxScore += maxPoints;
    });

    const finalScore = Math.round((totalScore / maxScore) * 100);
    setAssessment({...assessment, submitted: true, score: finalScore});
  };

  const handleAssessmentAnswer = (answer) => {
    const updatedAssessments = [...assessments];
    updatedAssessments[currentAssessment].userAnswer = answer;
    setAssessments(updatedAssessments);
  };

  const renderCurrentAssessment = () => {
    const current = assessments[currentAssessment];
    
    switch (current.type) {
      case 'heightCalculation':
        return (
          <div style={styles.assessmentCard}>
            <h4 style={styles.assessmentTitle}>Question 1: Height Calculation (20 points)</h4>
            <p style={styles.assessmentQuestion}>
              Based on your last trial (Fall Time: {trials[trials.length - 1].fallTime.toFixed(2)}s), 
              calculate the height using the formula h = ½gt²:
            </p>
            <input
              type="number"
              step="0.1"
              placeholder="Enter calculated height in meters"
              value={assessment.heightCalculation || ''}
              onChange={(e) => setAssessment({...assessment, heightCalculation: e.target.value})}
              disabled={assessment.submitted}
              style={styles.assessmentInput}
            />
          </div>
        );

      case 'errorReflection':
        return (
          <div style={styles.assessmentCard}>
            <h4 style={styles.assessmentTitle}>Question 2: Reflection on Experimental Error (20 points)</h4>
            <p style={styles.assessmentQuestion}>
              Your average experimental error is {(trials.reduce((sum, trial) => sum + trial.error, 0) / trials.length).toFixed(1)}%. 
              Reflect on what factors might cause experimental errors in free fall measurements.
            </p>
            <textarea
              placeholder="Discuss sources of error such as air resistance, measurement accuracy, reaction time, etc."
              value={assessment.errorReflection}
              onChange={(e) => setAssessment({...assessment, errorReflection: e.target.value})}
              disabled={assessment.submitted}
              style={styles.assessmentTextarea}
              rows="4"
            />
          </div>
        );

      case 'graphInterpretation':
        return (
          <div style={styles.assessmentCard}>
            <h4 style={styles.assessmentTitle}>Question 3: Graph Interpretation (20 points)</h4>
            <p style={styles.assessmentQuestion}>
              Based on your experimental data, what is the relationship between fall time and tower height?
              How would a graph of height vs. time squared look?
            </p>
            <div style={styles.multipleChoice}>
              <label style={styles.choiceLabel}>
                <input
                  type="radio"
                  name="graphType"
                  value="linear"
                  onChange={(e) => handleAssessmentAnswer(e.target.value)}
                  disabled={assessment.submitted}
                />
                Linear relationship
              </label>
              <label style={styles.choiceLabel}>
                <input
                  type="radio"
                  name="graphType"
                  value="quadratic"
                  onChange={(e) => handleAssessmentAnswer(e.target.value)}
                  disabled={assessment.submitted}
                />
                Quadratic relationship (time squared)
              </label>
              <label style={styles.choiceLabel}>
                <input
                  type="radio"
                  name="graphType"
                  value="exponential"
                  onChange={(e) => handleAssessmentAnswer(e.target.value)}
                  disabled={assessment.submitted}
                />
                Exponential relationship
              </label>
            </div>
          </div>
        );

      case 'gravityCalculation':
        const sampleTrial = trials[0];
        return (
          <div style={styles.assessmentCard}>
            <h4 style={styles.assessmentTitle}>Question 4: Gravity Calculation (20 points)</h4>
            <p style={styles.assessmentQuestion}>
              Using your first trial data (Height: {sampleTrial.towerHeight}m, Time: {sampleTrial.fallTime.toFixed(2)}s),
              calculate the experimental value of gravity using the formula: g = 2h/t²
            </p>
            <input
              type="number"
              step="0.01"
              placeholder="Enter calculated gravity in m/s²"
              value={current.userAnswer}
              onChange={(e) => handleAssessmentAnswer(e.target.value)}
              disabled={assessment.submitted}
              style={styles.assessmentInput}
            />
            <p style={styles.hintText}>
              Hint: Rearrange the free fall equation to solve for g
            </p>
          </div>
        );

      case 'realWorldApplication':
        return (
          <div style={styles.assessmentCard}>
            <h4 style={styles.assessmentTitle}>Question 5: Real-World Application (20 points)</h4>
            <p style={styles.assessmentQuestion}>
              Imagine you're an engineer needing to measure the height of a cliff. You drop a rock and hear it hit 
              the bottom after 3 seconds. What measurement is most critical for accurate height calculation?
            </p>
            <div style={styles.multipleChoice}>
              <label style={styles.choiceLabel}>
                <input
                  type="radio"
                  name="criticalMeasurement"
                  value="mass"
                  onChange={(e) => handleAssessmentAnswer(e.target.value)}
                  disabled={assessment.submitted}
                />
                Mass of the rock
              </label>
              <label style={styles.choiceLabel}>
                <input
                  type="radio"
                  name="criticalMeasurement"
                  value="time"
                  onChange={(e) => handleAssessmentAnswer(e.target.value)}
                  disabled={assessment.submitted}
                />
                Accurate time measurement
              </label>
              <label style={styles.choiceLabel}>
                <input
                  type="radio"
                  name="criticalMeasurement"
                  value="air"
                  onChange={(e) => handleAssessmentAnswer(e.target.value)}
                  disabled={assessment.submitted}
                />
                Air temperature
              </label>
              <label style={styles.choiceLabel}>
                <input
                  type="radio"
                  name="criticalMeasurement"
                  value="shape"
                  onChange={(e) => handleAssessmentAnswer(e.target.value)}
                  disabled={assessment.submitted}
                />
                Shape of the rock
              </label>
            </div>
          </div>
        );

      case 'experimentalDesign':
        return (
          <div style={styles.assessmentCard}>
            <h4 style={styles.assessmentTitle}>Question 6: Experimental Design (20 points)</h4>
            <p style={styles.assessmentQuestion}>
              Propose an improvement to this experiment that would reduce experimental error. 
              Consider measurement techniques, equipment, or procedural changes.
            </p>
            <textarea
              placeholder="Describe your improved experimental design..."
              value={current.userAnswer}
              onChange={(e) => handleAssessmentAnswer(e.target.value)}
              disabled={assessment.submitted}
              style={styles.assessmentTextarea}
              rows="4"
            />
            <p style={styles.hintText}>
              Consider: electronic timing, multiple trials, error analysis, or accounting for air resistance
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const theoreticalTime = calculateTheoreticalTime(currentTrialHeight);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('menu')}>
          ← Back to Menu
        </button>
        <h1 style={styles.title}>🪂 Tower of Gravity</h1>
        <p style={styles.subtitle}>Measure the tower's height using only a falling sphere and time measurements!</p>
      </div>

      <div style={styles.experimentArea}>
        <div style={styles.controlsPanel}>
          <h3 style={styles.sectionTitle}>Experiment Controls</h3>
          
          <div style={styles.controlGroup}>
            <label style={styles.label}>Tower Height: {currentTrialHeight}m</label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={currentTrialHeight}
              onChange={handleHeightChange}
              disabled={isDropping}
              style={styles.slider}
            />
            <div style={styles.heightPresets}>
              <button style={styles.presetButton} onClick={() => { setCurrentTrialHeight(25); resetExperiment(); }} disabled={isDropping}>25m</button>
              <button style={styles.presetButton} onClick={() => { setCurrentTrialHeight(50); resetExperiment(); }} disabled={isDropping}>50m</button>
              <button style={styles.presetButton} onClick={() => { setCurrentTrialHeight(75); resetExperiment(); }} disabled={isDropping}>75m</button>
            </div>
          </div>

          <div style={styles.physicsInfo}>
            <h4 style={styles.physicsTitle}>Free Fall Physics</h4>
            <div style={styles.theoryItem}>
              <span>Formula:</span>
              <strong style={styles.valueText}>h = ½gt²</strong>
            </div>
            <div style={styles.theoryItem}>
              <span>Gravity (g):</span>
              <strong style={styles.valueText}>{GRAVITY} m/s²</strong>
            </div>
            <div style={styles.theoryItem}>
              <span>Expected Time:</span>
              <strong style={styles.valueText}>{theoreticalTime.toFixed(2)} s</strong>
            </div>
            <div style={styles.theoryItem}>
              <span>Final Speed:</span>
              <strong style={styles.valueText}>{(GRAVITY * theoreticalTime).toFixed(1)} m/s</strong>
            </div>
          </div>

          <div style={styles.controlButtons}>
            <button 
              onClick={startDrop} 
              disabled={isDropping}
              style={{...styles.button, ...styles.dropButton, ...(isDropping ? styles.buttonDisabled : {})}}
            >
              🪂 Drop Sphere
            </button>
            <button 
              onClick={stopDrop} 
              disabled={!isDropping}
              style={{...styles.button, ...styles.stopButton, ...(!isDropping ? styles.buttonDisabled : {})}}
            >
              ⏹️ Stop
            </button>
            <button 
              onClick={resetExperiment}
              style={{...styles.button, ...styles.resetButton}}
            >
              🔄 Reset
            </button>
          </div>

          <div style={styles.liveData}>
            <h4 style={styles.physicsTitle}>Live Measurements</h4>
            <div style={styles.dataGrid}>
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Fall Time:</span>
                <span style={styles.dataValue}>{time.toFixed(2)} s</span>
              </div>
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Distance Fallen:</span>
                <span style={styles.dataValue}>{height.toFixed(1)} m</span>
              </div>
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Current Speed:</span>
                <span style={styles.dataValue}>{(GRAVITY * time).toFixed(1)} m/s</span>
              </div>
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Status:</span>
                <span style={styles.dataValue}>
                  {isDropping ? '🔽 Falling...' : height >= currentTrialHeight ? '🏁 Landed!' : '⏸️ Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.simulationArea}>
          <div style={styles.towerContainer}>
            <div style={{...styles.tower, height: `${(currentTrialHeight / MAX_TOWER_HEIGHT) * 60}%`}}>
              <div style={styles.towerStructure}>
                <div style={styles.towerWindows}>
                  {[...Array(Math.floor(currentTrialHeight / 5))].map((_, i) => (
                    <div key={i} style={{...styles.window, bottom: `${(i * 5 / currentTrialHeight) * 100}%`}}></div>
                  ))}
                </div>
              </div>
              <div style={styles.towerTop}>
                <div style={styles.observationDeck}></div>
              </div>
              
              <div 
                style={{
                  ...styles.currentHeightIndicator,
                  bottom: `${(currentTrialHeight / MAX_TOWER_HEIGHT) * 60}%`
                }}
              >
                <div style={styles.indicatorLine}></div>
                <span style={styles.indicatorLabel}>← Start: {currentTrialHeight}m</span>
              </div>
            </div>
            
            <div 
              ref={sphereRef}
              style={{
                ...styles.fallingSphere,
                bottom: `${((currentTrialHeight / MAX_TOWER_HEIGHT) * 60)}%`,
                transform: `translateX(-50%) translateY(0px) scale(${SIMULATION_SCALE})`
              }}
            >
              <div style={styles.sphereInner}>⚪</div>
            </div>

            <div style={styles.ground}></div>
          </div>

          <div style={styles.physicsOverlay}>
            <div style={styles.formula}>h = ½·g·t²</div>
            <div style={styles.formula}>v = g·t</div>
          </div>
        </div>
      </div>

      <div style={styles.dataSection}>
        <div style={styles.trialsContainer}>
          <h3 style={styles.sectionTitle}>Experimental Results</h3>
          {trials.length > 0 ? (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Trial</th>
                    <th style={styles.th}>Actual Height</th>
                    <th style={styles.th}>Fall Time</th>
                    <th style={styles.th}>Calculated Height</th>
                    <th style={styles.th}>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map((trial) => (
                    <tr key={trial.trialNumber}>
                      <td style={styles.td}>{trial.trialNumber}</td>
                      <td style={styles.td}>{trial.towerHeight}m</td>
                      <td style={styles.td}>{trial.fallTime.toFixed(2)}s</td>
                      <td style={styles.td}>{trial.calculatedHeight.toFixed(1)}m</td>
                      <td style={{...styles.td, color: trial.error > 5 ? '#ef4444' : '#22c55e', fontWeight: '600'}}>
                        {trial.error.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.noData}>
              <p>🏗️ No measurements yet</p>
              <p>Drop the sphere to calculate tower height using free fall!</p>
            </div>
          )}
        </div>

        <div style={styles.analysisControls}>
          <button 
            onClick={() => setShowResults(!showResults)}
            disabled={trials.length === 0}
            style={{...styles.button, ...styles.resultsButton, ...(trials.length === 0 ? styles.buttonDisabled : {})}}
          >
            {showResults ? '📈 Hide Analysis' : '📈 Show Analysis'}
          </button>
          
          <button 
            onClick={completeQuest}
            style={{...styles.button, ...styles.completeButton, ...(trials.length < 3 ? styles.buttonDisabled : {})}}
            disabled={trials.length < 3}
          >
            {trials.length >= 3 ? '⚖️ Get Gravity Gauge' : `Complete ${3 - trials.length} more trials`}
          </button>
        </div>

        {showResults && trials.length > 0 && (
          <div style={styles.analysisSection}>
            <h4 style={styles.physicsTitle}>Free Fall Analysis</h4>
            <div style={styles.keyFindings}>
              <div style={styles.finding}>
                <h5 style={styles.findingTitle}>🧪 Experimental Verification</h5>
                <p style={styles.findingText}>Using h = ½gt², we can accurately determine height from fall time.</p>
                <p style={styles.findingText}>Average Error: <strong style={styles.valueText}>
                  {(trials.reduce((sum, trial) => sum + trial.error, 0) / trials.length).toFixed(1)}%
                </strong></p>
              </div>
              
              <div style={styles.finding}>
                <h5 style={styles.findingTitle}>📊 Time-Height Relationship</h5>
                <p style={styles.findingText}>Fall time increases with the square root of height: t ∝ √h</p>
                <p style={styles.findingText}>Doubling the height increases fall time by √2 ≈ 1.41 times</p>
              </div>
              
              <div style={styles.finding}>
                <h5 style={styles.findingTitle}>⚖️ Gravity Measurement</h5>
                <p style={styles.findingText}>From your data, calculated g ≈ {
                  (trials.reduce((sum, trial) => {
                    return sum + (2 * trial.towerHeight) / (trial.fallTime * trial.fallTime);
                  }, 0) / trials.length).toFixed(2)
                } m/s²</p>
              </div>
            </div>
          </div>
        )}

        {trials.length >= 3 && (
          <div style={styles.assessmentSection}>
            <h3 style={styles.sectionTitle}>📝 Comprehensive Assessment & Evaluation</h3>
            <p style={{marginBottom: '20px', fontSize: '14px'}}>
              Complete all 6 assessments to earn your Gravity Gauge! 
              Progress: {currentAssessment + 1}/6 ({Math.round(((currentAssessment + 1) / 6) * 100)}%)
            </p>
            
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${((currentAssessment + 1) / 6) * 100}%`
                }}
              ></div>
            </div>

            {renderCurrentAssessment()}

            {!assessment.submitted ? (
              <div style={styles.assessmentNavigation}>
                <button 
                  onClick={handleAssessmentSubmit}
                  style={{...styles.button, ...styles.submitButton}}
                  disabled={
                    (currentAssessment === 0 && !assessment.heightCalculation) ||
                    (currentAssessment === 1 && !assessment.errorReflection.trim()) ||
                    (currentAssessment >= 2 && !assessments[currentAssessment].userAnswer.trim())
                  }
                >
                  {currentAssessment < assessments.length - 1 ? '➡️ Next Question' : '📤 Submit All Assessments'}
                </button>
                
                {currentAssessment > 0 && (
                  <button 
                    onClick={() => setCurrentAssessment(prev => prev - 1)}
                    style={{...styles.button, ...styles.backButton}}
                  >
                    ⬅️ Previous Question
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.scoreCard}>
                <h4 style={styles.scoreTitle}>Comprehensive Assessment Results</h4>
                <div style={styles.scoreDisplay}>
                  <span style={styles.scoreLabel}>Overall Score:</span>
                  <span style={{...styles.scoreValue, color: assessment.score >= 70 ? '#22c55e' : '#ef4444'}}>
                    {assessment.score}%
                  </span>
                </div>
                
                <div style={styles.detailedScores}>
                  <h5 style={styles.detailedTitle}>Breakdown by Question:</h5>
                  {assessments.map((assess, index) => (
                    <div key={index} style={styles.scoreItem}>
                      <span style={styles.scoreQuestion}>Q{index + 1}:</span>
                      <span style={{...styles.scorePoints, color: assess.score >= 10 ? '#22c55e' : '#ef4444'}}>
                        {assess.score}/20
                      </span>
                    </div>
                  ))}
                </div>

                <p style={styles.scoreMessage}>
                  {assessment.score >= 70 
                    ? '🎉 Excellent work! You have demonstrated comprehensive understanding of free fall physics!' 
                    : '📚 Keep learning! Review the concepts and consider retaking the assessments.'}
                </p>
                
                {assessment.score < 70 && (
                  <button 
                    onClick={() => {
                      setAssessment({heightCalculation: null, errorReflection: '', submitted: false, score: 0});
                      setCurrentAssessment(0);
                      setAssessments(assessments.map(a => ({...a, userAnswer: '', score: 0})));
                    }}
                    style={{...styles.button, ...styles.retryButton}}
                  >
                    🔄 Retry All Assessments
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showReward && (
        <div style={styles.rewardModal}>
          <div style={styles.rewardContent}>
            <div style={styles.rewardIcon}>⚖️</div>
            <h2 style={styles.rewardTitle}>Congratulations!</h2>
            <p style={styles.rewardText}>You've earned the</p>
            <h3 style={styles.rewardName}>Gravity Gauge</h3>
            <p style={styles.rewardDescription}>
              You've demonstrated comprehensive understanding of free fall physics and experimental methods!
            </p>
            <div style={styles.rewardStats}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Trials Completed:</span>
                <span style={styles.statValue}>{trials.length}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Assessment Score:</span>
                <span style={styles.statValue}>{assessment.score}%</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Average Error:</span>
                <span style={styles.statValue}>{(trials.reduce((sum, trial) => sum + trial.error, 0) / trials.length).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '16px',
    color: 'white',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e1b4b 100%)',
    maxWidth: '100%',
    overflowX: 'hidden',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    padding: '0 10px',
  },
  backButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '16px',
    fontSize: '14px',
    width: '100%',
    maxWidth: '200px',
  },
  title: {
    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
    marginBottom: '8px',
    background: 'linear-gradient(45deg, #60a5fa, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: 'clamp(14px, 3vw, 16px)',
    opacity: 0.9,
    maxWidth: '600px',
    margin: '0 auto',
  },
  experimentArea: {
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: '20px',
    marginBottom: '20px',
  },
  controlsPanel: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '20px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  controlGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '12px',
    fontWeight: '600',
    fontSize: '16px',
  },
  slider: {
    width: '100%',
    height: '40px',
    marginBottom: '12px',
  },
  heightPresets: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'space-between',
  },
  presetButton: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  physicsInfo: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '15px',
    borderRadius: '8px',
    margin: '15px 0',
    borderLeft: '4px solid #60a5fa',
  },
  physicsTitle: {
    marginBottom: '12px',
    color: '#60a5fa',
  },
  sectionTitle: {
    marginBottom: '16px',
    color: 'white',
  },
  theoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '14px',
  },
  valueText: {
    color: '#f59e0b',
  },
  controlButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '10px',
    marginBottom: '20px',
  },
  button: {
    padding: '14px 12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    minHeight: '50px',
  },
  dropButton: {
    background: '#22c55e',
    color: 'white',
  },
  stopButton: {
    background: '#ef4444',
    color: 'white',
  },
  resetButton: {
    background: '#6b7280',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  liveData: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '16px',
    borderRadius: '8px',
  },
  dataGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
  },
  dataItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  dataLabel: {
    fontWeight: '600',
    fontSize: '14px',
  },
  dataValue: {
    fontWeight: '700',
    color: '#f59e0b',
    fontSize: '14px',
  },
  simulationArea: {
    position: 'relative',
    background: 'linear-gradient(180deg, #1e40af 0%, #1e1b4b 100%)',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    margin: '0 auto',
    width: '100%',
    height: '500px',
    minHeight: '500px',
    touchAction: 'none',
  },
  towerContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    transform: 'scale(0.8)',
    transformOrigin: 'center',
  },
  tower: {
    position: 'absolute',
    bottom: '0',
    width: '90px',
    background: 'linear-gradient(90deg, #4b5563, #6b7280)',
    borderRadius: '8px 8px 0 0',
    zIndex: 2,
    left: '50%',
    transform: 'translateX(-50%)',
    transition: 'height 0.3s ease',
  },
  towerStructure: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  towerWindows: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  window: {
    position: 'absolute',
    width: '18px',
    height: '25px',
    background: '#60a5fa',
    borderRadius: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    border: '2px solid #1e40af',
  },
  towerTop: {
    position: 'absolute',
    top: '-30px',
    left: '-10px',
    width: '110px',
    height: '30px',
    background: '#374151',
    borderRadius: '8px 8px 0 0',
  },
  observationDeck: {
    position: 'absolute',
    top: '8px',
    left: '10px',
    right: '10px',
    height: '18px',
    background: '#60a5fa',
    borderRadius: '4px',
  },
  currentHeightIndicator: {
    position: 'absolute',
    right: '-70px',
    transform: 'translateY(50%)',
    zIndex: 5,
  },
  indicatorLine: {
    width: '60px',
    height: '2px',
    background: '#f59e0b',
    position: 'relative',
  },
  indicatorLabel: {
    position: 'absolute',
    top: '-25px',
    left: '0',
    fontSize: '11px',
    color: '#f59e0b',
    fontWeight: 'bold',
    background: 'rgba(0, 0, 0, 0.6)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  fallingSphere: {
    position: 'absolute',
    left: '50%',
    fontSize: '2.5rem',
    zIndex: 10,
    transition: 'transform 0.1s linear',
    willChange: 'transform',
  },
  sphereInner: {
    display: 'inline-block',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6))',
  },
  ground: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    height: '70px',
    background: 'linear-gradient(to top, #374151, #4b5563)',
    zIndex: 1,
  },
  physicsOverlay: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'rgba(0, 0, 0, 0.6)',
    padding: '12px',
    borderRadius: '8px',
    borderLeft: '4px solid #f59e0b',
  },
  formula: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: '6px',
    fontFamily: "'Courier New', monospace",
  },
  dataSection: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '20px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  trialsContainer: {
    marginBottom: '20px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    overflow: 'hidden',
    minWidth: '500px',
  },
  th: {
    padding: '12px 8px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(99, 102, 241, 0.3)',
    fontWeight: '600',
    fontSize: '14px',
  },
  td: {
    padding: '12px 8px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '14px',
  },
  noData: {
    textAlign: 'center',
    padding: '40px 20px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
  },
  analysisControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  resultsButton: {
    background: '#8b5cf6',
    color: 'white',
  },
  completeButton: {
    background: 'linear-gradient(45deg, #f59e0b, #eab308)',
    color: 'white',
  },
  analysisSection: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '20px',
    borderRadius: '8px',
  },
  keyFindings: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
  },
  finding: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '16px',
    borderRadius: '8px',
    borderLeft: '4px solid #f59e0b',
  },
  findingTitle: {
    marginBottom: '8px',
    color: '#f59e0b',
    fontSize: '16px',
  },
  findingText: {
    marginBottom: '8px',
    fontSize: '14px',
    lineHeight: '1.4',
  },
  assessmentSection: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '20px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    marginTop: '20px',
  },
  assessmentCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    borderLeft: '4px solid #8b5cf6',
  },
  assessmentTitle: {
    color: '#8b5cf6',
    marginBottom: '12px',
    fontSize: '16px',
  },
  assessmentQuestion: {
    marginBottom: '15px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  assessmentInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: '16px',
    marginBottom: '10px',
  },
  assessmentTextarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: '10px',
  },
  multipleChoice: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '15px',
  },
  choiceLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  hintText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: '8px',
    fontStyle: 'italic',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    marginBottom: '20px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #10b981, #3b82f6)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  assessmentNavigation: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  submitButton: {
    background: '#8b5cf6',
    color: 'white',
    width: '100%',
  },
  scoreCard: {
    background: 'rgba(139, 92, 246, 0.2)',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '2px solid #8b5cf6',
  },
  scoreTitle: {
    color: '#8b5cf6',
    marginBottom: '15px',
    fontSize: '18px',
  },
  scoreDisplay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '15px',
  },
  scoreLabel: {
    fontSize: '16px',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: '32px',
    fontWeight: 'bold',
  },
  detailedScores: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '15px',
    borderRadius: '8px',
    margin: '15px 0',
  },
  detailedTitle: {
    marginBottom: '10px',
    color: '#60a5fa',
    fontSize: '14px',
  },
  scoreItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  scoreQuestion: {
    fontSize: '14px',
    fontWeight: '600',
  },
  scorePoints: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  scoreMessage: {
    fontSize: '14px',
    marginBottom: '15px',
    lineHeight: '1.5',
  },
  retryButton: {
    background: '#6b7280',
    color: 'white',
  },
  rewardModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.5s ease',
  },
  rewardContent: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px',
    borderRadius: '20px',
    textAlign: 'center',
    maxWidth: '500px',
    border: '3px solid #f59e0b',
    boxShadow: '0 0 50px rgba(245, 158, 11, 0.5)',
  },
  rewardIcon: {
    fontSize: '100px',
    marginBottom: '20px',
    animation: 'bounce 1s infinite',
  },
  rewardTitle: {
    fontSize: '36px',
    marginBottom: '10px',
    color: 'white',
  },
  rewardText: {
    fontSize: '16px',
    marginBottom: '10px',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  rewardName: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#f59e0b',
    textShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
  },
  rewardDescription: {
    fontSize: '16px',
    marginBottom: '30px',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: '1.5',
  },
  rewardStats: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '20px',
    borderRadius: '12px',
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '16px',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statValue: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
};

export default TowerOfGravity;