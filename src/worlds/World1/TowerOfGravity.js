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
    submitted: false,
    score: 0,
    answers: {
      q1: '',
      q2: '',
      q3: ''
    }
  });
  
  // Assessment questions
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const questions = [
    {
      id: 1,
      question: "What is the velocity of the ball just before it hits the ground?",
      options: [
        { id: 'q1a', text: "v = g × t", value: 'v=gt' },
        { id: 'q1b', text: "v = g / t", value: 'v=g/t' },
        { id: 'q1c', text: "v = ½ × g × t²", value: 'v=halfgt2' },
        { id: 'q1d', text: "v = t / g", value: 'v=t/g' }
      ],
      correctAnswer: 'v=gt',
      explanation: "The velocity of a freely falling object just before hitting the ground is v = g × t, where g is acceleration due to gravity (9.81 m/s²) and t is the fall time."
    },
    {
      id: 2,
      question: "How will you compare the actual height of the building from the result of the experiment?",
      options: [
        { id: 'q2a', text: "Compare measured time with expected time", value: 'compareTime' },
        { id: 'q2b', text: "Use the formula h = ½gt² to calculate height from measured time", value: 'useFormula' },
        { id: 'q2c', text: "Measure the height directly with a ruler", value: 'directMeasure' },
        { id: 'q2d', text: "Guess based on the building's appearance", value: 'guess' }
      ],
      correctAnswer: 'useFormula',
      explanation: "Using the free fall formula h = ½gt², we can calculate the height from the measured fall time. The calculated height can then be compared with the actual height."
    },
    {
      id: 3,
      question: "What is the percentage error in your experiment?",
      options: [
        { id: 'q3a', text: "[(Actual - Calculated) / Actual] × 100%", value: 'errorFormula1' },
        { id: 'q3b', text: "[(Calculated - Actual) / Calculated] × 100%", value: 'errorFormula2' },
        { id: 'q3c', text: "Actual - Calculated", value: 'difference' },
        { id: 'q3d', text: "(Actual + Calculated) / 2", value: 'average' }
      ],
      correctAnswer: 'errorFormula1',
      explanation: "Percentage error = |(Actual Height - Calculated Height)| / Actual Height × 100%. This tells us how accurate our experimental measurement is compared to the known value."
    }
  ];

  const sphereRef = useRef(null);
  const towerContainerRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);
  const isDroppingRef = useRef(false);
  const [containerHeight, setContainerHeight] = useState(0);

  const GRAVITY = 9.81;
  const MAX_TOWER_HEIGHT = 100; // meters
  const GROUND_HEIGHT = 70; // pixels
  const SPHERE_SIZE = 40; // pixels (sphere diameter)

  // Calculate scale factor based on container height
  const getScaleFactor = () => {
    const availableHeight = containerHeight - GROUND_HEIGHT;
    return availableHeight / MAX_TOWER_HEIGHT;
  };

  const calculateTheoreticalTime = (h) => {
    return Math.sqrt((2 * h) / GRAVITY);
  };

  const calculateHeightFromTime = (t) => {
    return 0.5 * GRAVITY * t * t;
  };

  const calculateGravityFromData = (h, t) => {
    return (2 * h) / (t * t);
  };

  // Get pixel position for a given height in meters
  const getPixelPosition = (heightMeters) => {
    const scale = getScaleFactor();
    return heightMeters * scale;
  };

  useEffect(() => {
    // Update container height on mount and resize
    const updateContainerHeight = () => {
      if (towerContainerRef.current) {
        const height = towerContainerRef.current.clientHeight;
        setContainerHeight(height);
      }
    };

    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);

    return () => {
      window.removeEventListener('resize', updateContainerHeight);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset sphere position when height changes
    if (sphereRef.current) {
      const scale = getScaleFactor();
      const towerHeightPixels = getPixelPosition(currentTrialHeight);
      sphereRef.current.style.transform = `translateX(-50%) translateY(-${SPHERE_SIZE/2}px)`;
      sphereRef.current.style.bottom = `${GROUND_HEIGHT + towerHeightPixels}px`;
    }
  }, [currentTrialHeight, containerHeight]);

  const startDrop = () => {
    if (isDroppingRef.current) return;
    
    setIsDropping(true);
    isDroppingRef.current = true;
    setTime(0);
    setHeight(0);
    startTimeRef.current = performance.now();

    const theoreticalTime = calculateTheoreticalTime(currentTrialHeight);
    const scale = getScaleFactor();
    const towerHeightPixels = getPixelPosition(currentTrialHeight);

    const animate = (currentTime) => {
      if (!isDroppingRef.current) return;
      
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      const currentHeightMeters = 0.5 * GRAVITY * elapsed * elapsed;
      
      // Stop when the sphere reaches or exceeds the ground
      if (currentHeightMeters >= currentTrialHeight) {
        setTime(theoreticalTime);
        setHeight(currentTrialHeight);
        
        if (sphereRef.current) {
          // Position the sphere at ground level
          sphereRef.current.style.bottom = `${GROUND_HEIGHT}px`;
          sphereRef.current.style.transform = `translateX(-50%) translateY(${SPHERE_SIZE/2}px)`;
        }
        
        const experimentalHeight = calculateHeightFromTime(theoreticalTime);
        const error = Math.abs(currentTrialHeight - experimentalHeight) / currentTrialHeight * 100;
        
        const newTrial = {
          trialNumber: trials.length + 1,
          towerHeight: currentTrialHeight,
          fallTime: theoreticalTime,
          calculatedHeight: experimentalHeight,
          error: error,
          finalVelocity: (GRAVITY * theoreticalTime).toFixed(1)
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
      setHeight(currentHeightMeters);
      
      if (sphereRef.current) {
        // Update sphere position based on current height
        const fallenPixels = currentHeightMeters * scale;
        const currentBottom = GROUND_HEIGHT + towerHeightPixels - fallenPixels;
        sphereRef.current.style.bottom = `${currentBottom}px`;
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
        error: error,
        finalVelocity: (GRAVITY * time).toFixed(1)
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
      const scale = getScaleFactor();
      const towerHeightPixels = getPixelPosition(currentTrialHeight);
      // Reset sphere to top of pillar position
      sphereRef.current.style.transform = `translateX(-50%) translateY(-${SPHERE_SIZE/2}px)`;
      sphereRef.current.style.bottom = `${GROUND_HEIGHT + towerHeightPixels}px`;
    }
  };

  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value);
    setCurrentTrialHeight(newHeight);
    resetExperiment();
  };

  const completeQuest = () => {
    if (trials.length >= 3) {
      if (!assessment.submitted) {
        alert('Please complete the assessment before claiming your reward!');
      } else if (assessment.score >= 70) {
        setShowReward(true);
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        alert('Please review your assessment. You need a score of at least 70% to earn the Gravity Gauge!');
      }
    } else {
      alert('Please complete at least 3 trials to master free fall calculations!');
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAssessment(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      }
    }));
  };

  const calculateAssessmentScore = () => {
    let correctCount = 0;
    
    questions.forEach((question, index) => {
      const questionId = `q${index + 1}`;
      if (assessment.answers[questionId] === question.correctAnswer) {
        correctCount++;
      }
    });
    
    const score = Math.round((correctCount / questions.length) * 100);
    setAssessment(prev => ({
      ...prev,
      submitted: true,
      score: score
    }));
  };

  const handleAssessmentSubmit = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculateAssessmentScore();
    }
  };

  const theoreticalTime = calculateTheoreticalTime(currentTrialHeight);
  const scale = containerHeight > 0 ? getScaleFactor() : 1;
  const towerHeightPixels = getPixelPosition(currentTrialHeight);
  const towerHeightPercentage = (towerHeightPixels / (containerHeight - GROUND_HEIGHT)) * 100;

  // Calculate sphere position
  const sphereBottom = GROUND_HEIGHT + towerHeightPixels;

  // Get last trial data for assessment context
  const lastTrial = trials.length > 0 ? trials[trials.length - 1] : null;

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

        <div 
          ref={towerContainerRef}
          style={styles.simulationArea}
        >
          <div style={styles.towerContainer}>
            {/* Ground */}
            <div style={styles.ground}></div>
            
            {/* Pillar positioned on the ground */}
            <div style={{
              ...styles.tower,
              height: `${towerHeightPercentage}%`,
              bottom: '70px',
              transform: 'translateX(-50%)',
            }}>
              <div style={styles.towerStructure}>
                <div style={styles.towerWindows}>
                  {[...Array(Math.floor(currentTrialHeight / 5))].map((_, i) => (
                    <div key={i} style={{
                      ...styles.window,
                      bottom: `${(i * 5 / currentTrialHeight) * 100}%`
                    }}></div>
                  ))}
                </div>
              </div>
              <div style={styles.towerTop}>
                <div style={styles.observationDeck}></div>
              </div>
              
              {/* Height indicator at the top of the pillar */}
              <div 
                style={{
                  ...styles.currentHeightIndicator,
                  top: '0%',
                  transform: 'translateY(-50%)'
                }}
              >
                <div style={styles.indicatorLine}></div>
                <span style={styles.indicatorLabel}>← Height: {currentTrialHeight}m</span>
              </div>
            </div>
            
            {/* Falling sphere - positioned at the top of the pillar */}
            <div 
              ref={sphereRef}
              style={{
                ...styles.fallingSphere,
                bottom: `${sphereBottom}px`,
                left: '50%',
                transform: `translateX(-50%) translateY(-${SPHERE_SIZE/2}px)`
              }}
            >
              <div style={styles.sphereInner}>⚪</div>
            </div>

            {/* Grid lines for reference */}
            <div style={styles.referenceLines}>
              <div style={styles.referenceLine}></div>
              <div style={{...styles.referenceLine, bottom: '25%'}}></div>
              <div style={{...styles.referenceLine, bottom: '50%'}}></div>
              <div style={{...styles.referenceLine, bottom: '75%'}}></div>
            </div>
          </div>

          <div style={styles.physicsOverlay}>
            <div style={styles.formula}>h = ½·g·t²</div>
            <div style={styles.formula}>v = g·t</div>
            <div style={styles.scaleInfo}>
              Scale: 1m = {(scale * 100).toFixed(1)}px
            </div>
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
                    <th style={styles.th}>Final Velocity</th>
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
                      <td style={styles.td}>{trial.finalVelocity} m/s</td>
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
            <h3 style={styles.sectionTitle}>📝 Physics Assessment</h3>
            <p style={{marginBottom: '20px', fontSize: '14px'}}>
              Complete all 3 questions to earn your Gravity Gauge! 
              Progress: {currentQuestion + 1}/3 ({Math.round(((currentQuestion + 1) / 3) * 100)}%)
            </p>
            
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${((currentQuestion + 1) / 3) * 100}%`
                }}
              ></div>
            </div>

            <div style={styles.assessmentCard}>
              <h4 style={styles.assessmentTitle}>
                Question {currentQuestion + 1}: {questions[currentQuestion].question}
              </h4>
              
              {lastTrial && currentQuestion === 0 && (
                <div style={styles.experimentContext}>
                  <p style={styles.contextText}>
                    <strong>Experiment Data:</strong> For a {lastTrial.towerHeight}m tower, 
                    the sphere fell for {lastTrial.fallTime.toFixed(2)}s, 
                    reaching a final velocity of {lastTrial.finalVelocity} m/s.
                  </p>
                </div>
              )}
              
              {lastTrial && currentQuestion === 1 && (
                <div style={styles.experimentContext}>
                  <p style={styles.contextText}>
                    <strong>Experiment Data:</strong> Your last trial calculated the height as {lastTrial.calculatedHeight.toFixed(1)}m 
                    compared to the actual height of {lastTrial.towerHeight}m.
                  </p>
                </div>
              )}
              
              {lastTrial && currentQuestion === 2 && (
                <div style={styles.experimentContext}>
                  <p style={styles.contextText}>
                    <strong>Experiment Data:</strong> Your last trial had an error of {lastTrial.error.toFixed(1)}%.
                  </p>
                </div>
              )}

              <div style={styles.multipleChoice}>
                {questions[currentQuestion].options.map((option) => (
                  <label 
                    key={option.id}
                    style={{
                      ...styles.choiceLabel,
                      ...(assessment.answers[`q${currentQuestion + 1}`] === option.value ? styles.choiceSelected : {})
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion + 1}`}
                      value={option.value}
                      checked={assessment.answers[`q${currentQuestion + 1}`] === option.value}
                      onChange={() => handleAnswerSelect(`q${currentQuestion + 1}`, option.value)}
                      disabled={assessment.submitted}
                      style={styles.radioInput}
                    />
                    <span style={styles.choiceText}>{option.text}</span>
                  </label>
                ))}
              </div>

              {assessment.submitted && (
                <div style={{
                  ...styles.feedback,
                  backgroundColor: assessment.answers[`q${currentQuestion + 1}`] === questions[currentQuestion].correctAnswer 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : 'rgba(239, 68, 68, 0.2)',
                  borderColor: assessment.answers[`q${currentQuestion + 1}`] === questions[currentQuestion].correctAnswer 
                    ? '#22c55e' 
                    : '#ef4444'
                }}>
                  <h5 style={styles.feedbackTitle}>
                    {assessment.answers[`q${currentQuestion + 1}`] === questions[currentQuestion].correctAnswer 
                      ? '✅ Correct!' 
                      : '❌ Incorrect'}
                  </h5>
                  <p style={styles.feedbackText}>{questions[currentQuestion].explanation}</p>
                </div>
              )}
            </div>

            {!assessment.submitted ? (
              <div style={styles.assessmentNavigation}>
                <button 
                  onClick={handleAssessmentSubmit}
                  style={{...styles.button, ...styles.submitButton}}
                  disabled={!assessment.answers[`q${currentQuestion + 1}`]}
                >
                  {currentQuestion < questions.length - 1 ? '➡️ Next Question' : '📤 Submit Assessment'}
                </button>
                
                {currentQuestion > 0 && (
                  <button 
                    onClick={() => setCurrentQuestion(prev => prev - 1)}
                    style={{...styles.button, ...styles.backButton}}
                  >
                    ⬅️ Previous Question
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.scoreCard}>
                <h4 style={styles.scoreTitle}>Assessment Results</h4>
                <div style={styles.scoreDisplay}>
                  <span style={styles.scoreLabel}>Your Score:</span>
                  <span style={{...styles.scoreValue, color: assessment.score >= 70 ? '#22c55e' : '#ef4444'}}>
                    {assessment.score}%
                  </span>
                </div>
                
                <div style={styles.detailedScores}>
                  <h5 style={styles.detailedTitle}>Question Results:</h5>
                  {questions.map((question, index) => {
                    const questionId = `q${index + 1}`;
                    const isCorrect = assessment.answers[questionId] === question.correctAnswer;
                    return (
                      <div key={index} style={styles.scoreItem}>
                        <span style={styles.scoreQuestion}>Q{index + 1}:</span>
                        <span style={{
                          ...styles.scorePoints, 
                          color: isCorrect ? '#22c55e' : '#ef4444',
                          fontWeight: 'bold'
                        }}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p style={styles.scoreMessage}>
                  {assessment.score >= 70 
                    ? '🎉 Excellent work! You have demonstrated understanding of free fall physics!' 
                    : '📚 Keep learning! Review the concepts and consider retaking the assessment.'}
                </p>
                
                {assessment.score < 70 && (
                  <button 
                    onClick={() => {
                      setAssessment({
                        submitted: false,
                        score: 0,
                        answers: { q1: '', q2: '', q3: '' }
                      });
                      setCurrentQuestion(0);
                    }}
                    style={{...styles.button, ...styles.retryButton}}
                  >
                    🔄 Retry Assessment
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
    flexDirection: 'column',
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
    height: '8px',
    marginBottom: '12px',
    WebkitAppearance: 'none',
    background: 'linear-gradient(90deg, #60a5fa, #a855f7)',
    borderRadius: '4px',
    outline: 'none',
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
    fontSize: '16px',
  },
  sectionTitle: {
    marginBottom: '16px',
    color: 'white',
    fontSize: '18px',
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
    width: '100%',
    height: '500px',
    minHeight: '400px',
    touchAction: 'none',
  },
  towerContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  tower: {
    position: 'absolute',
    width: '80px',
    background: 'linear-gradient(90deg, #4b5563, #6b7280)',
    borderRadius: '8px 8px 0 0',
    zIndex: 2,
    left: '50%',
    transition: 'height 0.3s ease',
  },
  towerStructure: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  towerWindows: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  window: {
    position: 'absolute',
    width: '20px',
    height: '25px',
    background: '#60a5fa',
    borderRadius: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    border: '2px solid #1e40af',
  },
  towerTop: {
    position: 'absolute',
    top: '-20px',
    left: '-10px',
    width: '100px',
    height: '20px',
    background: '#374151',
    borderRadius: '8px 8px 0 0',
  },
  observationDeck: {
    position: 'absolute',
    top: '5px',
    left: '10px',
    right: '10px',
    height: '10px',
    background: '#60a5fa',
    borderRadius: '4px',
  },
  currentHeightIndicator: {
    position: 'absolute',
    right: '-80px',
    zIndex: 5,
  },
  indicatorLine: {
    width: '70px',
    height: '2px',
    background: '#f59e0b',
    position: 'relative',
  },
  indicatorLabel: {
    position: 'absolute',
    top: '-25px',
    left: '0',
    fontSize: '12px',
    color: '#f59e0b',
    fontWeight: 'bold',
    background: 'rgba(0, 0, 0, 0.6)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  fallingSphere: {
    position: 'absolute',
    fontSize: '2.5rem',
    zIndex: 10,
    transition: 'bottom 0.05s linear',
    willChange: 'bottom',
  },
  sphereInner: {
    display: 'inline-block',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6))',
    animation: 'pulse 2s infinite',
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
  referenceLines: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '70px',
    zIndex: 0,
  },
  referenceLine: {
    position: 'absolute',
    left: '0',
    right: '0',
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
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
  scaleInfo: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    marginTop: '8px',
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
  experimentContext: {
    background: 'rgba(96, 165, 250, 0.1)',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px',
    borderLeft: '3px solid #60a5fa',
  },
  contextText: {
    fontSize: '14px',
    margin: 0,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  multipleChoice: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '15px',
  },
  choiceLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
  },
  choiceSelected: {
    background: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8b5cf6',
  },
  radioInput: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  choiceText: {
    fontSize: '15px',
    flex: 1,
  },
  feedback: {
    marginTop: '20px',
    padding: '15px',
    borderRadius: '8px',
    borderLeft: '4px solid',
  },
  feedbackTitle: {
    marginBottom: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  feedbackText: {
    fontSize: '14px',
    lineHeight: '1.5',
    margin: 0,
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
