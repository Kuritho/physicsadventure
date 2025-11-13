import React, { useState, useRef, useEffect } from 'react';

const RisingOrb = ({ onComplete, navigate }) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [airTime, setAirTime] = useState(0);
  const [calculatedHeight, setCalculatedHeight] = useState(0);
  const [trials, setTrials] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedVelocity, setSelectedVelocity] = useState(25);
  const [orbPosition, setOrbPosition] = useState(0);
  const [success, setSuccess] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [targetHeight, setTargetHeight] = useState(30);
  const [orbLandedOnPlatform, setOrbLandedOnPlatform] = useState(false);
  const [landingVelocity, setLandingVelocity] = useState(0);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(0);

  // Physics constants
  const GRAVITY = 9.81;
  const PIXELS_PER_METER = 5;
  const SUCCESS_THRESHOLD = 1.0;
  const PLATFORM_TOLERANCE = 0.5;

  // Platform height options (randomly selected)
  const platformHeights = [20, 25, 30, 35, 40, 45, 50];

  // Velocity options
  const velocityOptions = [
    { value: 15, label: '15 m/s', description: 'Very Low', icon: '🐌' },
    { value: 20, label: '20 m/s', description: 'Low', icon: '🚶' },
    { value: 25, label: '25 m/s', description: 'Medium', icon: '🏃' },
    { value: 30, label: '30 m/s', description: 'High', icon: '⚡' },
    { value: 35, label: '35 m/s', description: 'Very High', icon: '🚀' },
    { value: 40, label: '40 m/s', description: 'Extreme', icon: '🌠' }
  ];

  const timerRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);
  const isMobile = window.innerWidth <= 768;

  // Initialize random platform height
  useEffect(() => {
    generateRandomHeight();
  }, []);

  const generateRandomHeight = () => {
    const randomIndex = Math.floor(Math.random() * platformHeights.length);
    setTargetHeight(platformHeights[randomIndex]);
    resetLaunch();
  };

  // Calculate required velocity for the platform height
  const calculateRequiredVelocity = (height) => {
    return Math.sqrt(2 * GRAVITY * height);
  };

  // Calculate max height from velocity
  const calculateMaxHeight = (velocity) => {
    return (velocity * velocity) / (2 * GRAVITY);
  };

  // Calculate airtime from velocity
  const calculateAirtimeFromVelocity = (velocity) => {
    return (2 * velocity) / GRAVITY;
  };

  // Calculate velocity at specific height
  const calculateVelocityAtHeight = (initialVelocity, height) => {
    const maxHeight = (initialVelocity * initialVelocity) / (2 * GRAVITY);
    if (height > maxHeight) {
      return 0;
    }
    return Math.sqrt(Math.abs(initialVelocity * initialVelocity - 2 * GRAVITY * height));
  };

  // Calculate assessment score based on performance
  const calculateAssessmentScore = () => {
    if (trials.length === 0) return 0;
    
    const recentTrials = trials.slice(-5);
    const successfulTrials = recentTrials.filter(t => t.success).length;
    const accuracyScores = recentTrials.map(t => t.accuracy);
    const averageAccuracy = accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length;
    
    const successScore = (successfulTrials / recentTrials.length) * 50;
    const accuracyScore = Math.min(averageAccuracy / 2, 50);
    
    return Math.round(successScore + accuracyScore);
  };

  // Get performance feedback based on score
  const getPerformanceFeedback = (score) => {
    if (score >= 90) return { 
      level: "Expert", 
      color: "#22c55e",
      feedback: "Outstanding! You've mastered the physics of projectile motion and can consistently calculate the perfect velocity."
    };
    if (score >= 80) return { 
      level: "Advanced", 
      color: "#3b82f6",
      feedback: "Excellent work! You understand the relationship between velocity and height very well."
    };
    if (score >= 70) return { 
      level: "Proficient", 
      color: "#8b5cf6", 
      feedback: "Good job! You're developing strong skills in velocity calculation and prediction."
    };
    if (score >= 60) return { 
      level: "Developing", 
      color: "#f59e0b",
      feedback: "You're making progress! Keep practicing to improve your accuracy and consistency."
    };
    return { 
      level: "Beginner", 
      color: "#ef4444",
      feedback: "Keep trying! Focus on understanding how different velocities affect the maximum height."
    };
  };

  // Assessment component
  const AssessmentPanel = () => {
    const score = assessmentScore;
    const feedback = getPerformanceFeedback(score);
    
    return (
      <div style={styles.assessmentOverlay}>
        <div style={styles.assessmentContent}>
          <div style={styles.assessmentHeader}>
            <h2>🎯 Performance Assessment</h2>
            <p>Based on your recent launches</p>
          </div>
          
          <div style={styles.scoreSection}>
            <div style={styles.scoreCircle(score)}>
              <div style={styles.scoreValue}>{score}</div>
              <div style={styles.scoreLabel}>SCORE</div>
            </div>
            <div style={styles.performanceLevel(feedback.color)}>
              {feedback.level}
            </div>
          </div>
          
          <div style={styles.feedbackSection}>
            <h3>Performance Feedback</h3>
            <p>{feedback.feedback}</p>
          </div>
          
          <div style={styles.detailedAnalysis}>
            <h3>📊 Detailed Analysis</h3>
            <div style={styles.analysisGrid}>
              <div style={styles.analysisItem}>
                <span>Total Launches:</span>
                <strong>{trials.length}</strong>
              </div>
              <div style={styles.analysisItem}>
                <span>Successful Landings:</span>
                <strong>{trials.filter(t => t.success).length}</strong>
              </div>
              <div style={styles.analysisItem}>
                <span>Success Rate:</span>
                <strong>{trials.length > 0 ? Math.round((trials.filter(t => t.success).length / trials.length) * 100) : 0}%</strong>
              </div>
              <div style={styles.analysisItem}>
                <span>Average Accuracy:</span>
                <strong>{trials.length > 0 ? (trials.reduce((sum, t) => sum + t.accuracy, 0) / trials.length).toFixed(1) : 0}%</strong>
              </div>
            </div>
          </div>
          
          <div style={styles.physicsUnderstanding}>
            <h3>🧠 Physics Understanding</h3>
            <div style={styles.conceptCheck}>
              <p><strong>Key Concept Mastered:</strong> Relationship between launch velocity and maximum height</p>
              <p><strong>Formula Applied:</strong> h = v² ÷ (2g) where g = 9.81 m/s²</p>
              <p><strong>Skills Demonstrated:</strong> Velocity prediction, Height calculation, Precision adjustment</p>
            </div>
          </div>
          
          <div style={styles.improvementTips}>
            <h3>💡 Tips for Improvement</h3>
            <ul style={styles.tipsList}>
              {score < 80 && <li>• Practice with different platform heights to build intuition</li>}
              {score < 70 && <li>• Pay attention to how small velocity changes affect the maximum height</li>}
              {score < 90 && <li>• Try to land 3 perfect landings in a row to master precision</li>}
              <li>• Remember: Higher velocity = Higher maximum height</li>
            </ul>
          </div>
          
          <div style={styles.assessmentActions}>
            <button 
              style={styles.continueButton}
              onClick={() => setShowAssessment(false)}
            >
              Continue Practicing
            </button>
            <button 
              style={styles.restartButton}
              onClick={() => {
                setTrials([]);
                setShowAssessment(false);
                generateRandomHeight();
              }}
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  };

  const startLaunch = () => {
    if (isLaunching) return;
    
    setIsLaunching(true);
    setSuccess(false);
    setOrbLandedOnPlatform(false);
    setOrbPosition(0);
    setAirTime(0);
    setShowResults(false);
    setLandingVelocity(0);
    
    // Start timer
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const currentTime = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
      setAirTime(currentTime);
    }, 100);

    // Start animation
    animateOrb();
  };

  const animateOrb = () => {
    const requiredVelocity = calculateRequiredVelocity(targetHeight);
    const totalTime = calculateAirtimeFromVelocity(selectedVelocity);
    let startTime = Date.now();
    let hasLandedOnPlatform = false;
    let hasPassedPlatformHeight = false;

    const animateFrame = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;
      
      if (elapsed > totalTime && !hasLandedOnPlatform) {
        finishLaunch(false);
        return;
      }

      const position = Math.max(0, (selectedVelocity * elapsed) - (0.5 * GRAVITY * elapsed * elapsed));
      const currentVelocity = selectedVelocity - (GRAVITY * elapsed);
      
      const heightDifference = Math.abs(position - targetHeight);
      const isAtPlatformHeight = heightDifference < PLATFORM_TOLERANCE;
      
      if (position >= targetHeight && !hasPassedPlatformHeight) {
        hasPassedPlatformHeight = true;
      }
      
      const velocityDifference = Math.abs(selectedVelocity - requiredVelocity);
      const canLandOnPlatform = velocityDifference <= SUCCESS_THRESHOLD;
      
      if (isAtPlatformHeight && canLandOnPlatform && !hasLandedOnPlatform) {
        hasLandedOnPlatform = true;
        setOrbLandedOnPlatform(true);
        
        const velocityAtPlatform = calculateVelocityAtHeight(selectedVelocity, targetHeight);
        setLandingVelocity(velocityAtPlatform);
        setOrbPosition(targetHeight);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        setTimeout(() => {
          finishLaunch(true);
        }, 1000);
        return;
      }
      
      setOrbPosition(position);
      
      if (!hasLandedOnPlatform) {
        animationRef.current = requestAnimationFrame(animateFrame);
      }
    };

    animationRef.current = requestAnimationFrame(animateFrame);
  };

  const stopLaunch = () => {
    finishLaunch(false);
  };

  const finishLaunch = (landedOnPlatform = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsLaunching(false);
    
    const maxHeight = calculateMaxHeight(selectedVelocity);
    const requiredVelocity = calculateRequiredVelocity(targetHeight);
    
    setCalculatedHeight(maxHeight);
    
    const velocityDifference = Math.abs(selectedVelocity - requiredVelocity);
    const isSuccessful = landedOnPlatform && velocityDifference <= SUCCESS_THRESHOLD;
    setSuccess(isSuccessful);
    
    const newTrial = {
      trialNumber: trials.length + 1,
      targetHeight,
      selectedVelocity,
      calculatedHeight: maxHeight,
      requiredVelocity,
      airTime: parseFloat(airTime),
      velocityDifference,
      landingVelocity: landedOnPlatform ? landingVelocity : 0,
      landedOnPlatform,
      accuracy: Math.max(0, 100 - (velocityDifference / requiredVelocity) * 100),
      success: isSuccessful,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setTrials(prev => [...prev, newTrial]);
    setShowResults(true);
    
    // Update assessment score
    setAssessmentScore(calculateAssessmentScore());
    
    const successfulTrials = trials.filter(t => t.success).length + (isSuccessful ? 1 : 0);
    if (successfulTrials >= 3) {
      setTimeout(() => {
        setShowReward(true);
      }, 2000);
    }

    // Show assessment after 5 trials
    if (trials.length >= 4) {
      setTimeout(() => {
        setShowAssessment(true);
      }, 3000);
    }
  };

  const resetLaunch = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsLaunching(false);
    setAirTime(0);
    setOrbPosition(0);
    setShowResults(false);
    setSuccess(false);
    setOrbLandedOnPlatform(false);
    setLandingVelocity(0);
  };

  const completeQuest = () => {
    setShowReward(false);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const requiredVelocity = calculateRequiredVelocity(targetHeight);
  const successfulTrials = trials.filter(t => t.success).length;
  const currentMaxHeight = calculateMaxHeight(selectedVelocity);

  return (
    <div style={styles.container(isMobile)}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTopRow}>
          <button style={styles.backButton} onClick={() => navigate && navigate('menu')}>
            ← Back
          </button>
          {trials.length >= 3 && (
            <button 
              style={styles.assessmentButton}
              onClick={() => setShowAssessment(true)}
            >
              📊 View Assessment
            </button>
          )}
        </div>
        <h1 style={styles.title}>🚀 Rising Orb Challenge</h1>
        <p style={styles.subtitle}>Find the perfect velocity for each platform!</p>
        <div style={styles.questInfo}>
          Perfect Landings: {successfulTrials}/3
          {trials.length > 0 && (
            <span style={styles.trialCount}> • Trials: {trials.length}</span>
          )}
        </div>
      </div>

      {/* Mission Briefing */}
      <div style={styles.missionBriefing}>
        <h3>🎯 Mission Objective</h3>
        <p>Launch the orb to land perfectly on the floating platform!</p>
        <p>Each platform has a random height - find the exact velocity needed!</p>
        <div style={styles.platformInfo}>
          <strong>Current Platform: {targetHeight} meters</strong>
          <button 
            style={styles.newPlatformButton}
            onClick={generateRandomHeight}
            disabled={isLaunching}
          >
            🔄 New Platform
          </button>
        </div>
      </div>

      {/* Mobile Layout */}
      {isMobile ? (
        <div style={styles.mobileContent}>
          {/* Simulation Area - Mobile */}
          <div style={styles.simulationAreaMobile}>
            {/* Platform */}
            <div 
              style={{
                ...styles.platform,
                bottom: `${targetHeight * PIXELS_PER_METER + 50}px`,
                ...(orbLandedOnPlatform ? styles.platformActive : {}),
                ...(currentMaxHeight >= targetHeight - 2 && currentMaxHeight <= targetHeight + 2 ? styles.platformHighlight : {})
              }}
            >
              {/* Orb on Platform when landed */}
              {orbLandedOnPlatform && (
                <div style={styles.orbOnPlatform}>
                  <div style={styles.platformOrbGlow}></div>
                  <div style={styles.platformOrb}>⚪</div>
                  <div style={styles.landingVelocity}>
                    {landingVelocity.toFixed(1)} m/s
                  </div>
                </div>
              )}
            </div>

            {/* Orb */}
            {!orbLandedOnPlatform && (
              <div 
                style={{
                  ...styles.orb,
                  bottom: `${orbPosition * PIXELS_PER_METER + 50}px`,
                  opacity: isLaunching ? 1 : 0.7,
                  transition: isLaunching ? 'none' : 'bottom 0.3s ease',
                  ...(selectedVelocity >= 30 ? styles.orbHighPower : 
                      selectedVelocity >= 25 ? styles.orbMediumPower : styles.orbLowPower)
                }}
              >
                <div style={styles.orbGlow}></div>
                {isLaunching && orbPosition > 0 && (
                  <div style={styles.velocityDisplay}>
                    {Math.abs(selectedVelocity - (GRAVITY * (airTime || 0))).toFixed(1)} m/s
                  </div>
                )}
              </div>
            )}

            {/* Ground */}
            <div style={styles.ground}>
              <div style={styles.launchPad}>
                {showResults && success && (
                  <div style={styles.successMessage}>🎯 Perfect Landing!</div>
                )}
                {showResults && !success && (
                  <div style={styles.missMessage}>
                    {selectedVelocity < requiredVelocity ? '⚠️ Too Low!' : '⚠️ Too High!'}
                  </div>
                )}
              </div>
            </div>

            {/* Height Scale */}
            <div style={styles.heightScale}>
              {[0, 10, 20, 30, 40, 50, 60].map(height => (
                <div 
                  key={height}
                  style={{
                    ...styles.scaleMarker,
                    bottom: `${height * PIXELS_PER_METER + 50}px`,
                    ...(height === targetHeight ? styles.scaleTarget : {})
                  }}
                >
                  {height}m
                </div>
              ))}
            </div>
          </div>

          {/* Controls - Mobile */}
          <div style={styles.controlsMobile}>
            {/* Velocity Selection */}
            <div style={styles.controlSection}>
              <label style={styles.controlLabel}>Launch Velocity</label>
              <div style={styles.velocityOptionsMobile}>
                {velocityOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedVelocity(option.value)}
                    disabled={isLaunching}
                    style={{
                      ...styles.velocityButtonMobile,
                      ...(selectedVelocity === option.value ? styles.velocityButtonActive : {}),
                      ...(option.value >= 30 ? styles.velocityHigh : 
                          option.value >= 25 ? styles.velocityMedium : styles.velocityLow)
                    }}
                  >
                    <div style={styles.velocityIcon}>{option.icon}</div>
                    <div style={styles.velocityValue}>{option.value}</div>
                    <div style={styles.velocityDesc}>{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Info */}
            <div style={styles.quickInfoMobile}>
              <div style={styles.infoRow}>
                <span>Platform Height:</span>
                <strong style={{color: '#f59e0b'}}>{targetHeight} m</strong>
              </div>
              <div style={styles.infoRow}>
                <span>Perfect Velocity:</span>
                <strong style={{color: '#22c55e'}}>{requiredVelocity.toFixed(1)} m/s</strong>
              </div>
              <div style={styles.infoRow}>
                <span>Your Velocity:</span>
                <strong style={{
                  color: Math.abs(selectedVelocity - requiredVelocity) < 1 ? '#22c55e' : 
                         Math.abs(selectedVelocity - requiredVelocity) < 3 ? '#f59e0b' : '#ef4444'
                }}>{selectedVelocity} m/s</strong>
              </div>
              <div style={styles.infoRow}>
                <span>Expected Height:</span>
                <strong style={{
                  color: currentMaxHeight >= targetHeight - 1 && currentMaxHeight <= targetHeight + 1 ? '#22c55e' : 
                         currentMaxHeight >= targetHeight ? '#f59e0b' : '#ef4444'
                }}>{currentMaxHeight.toFixed(1)} m</strong>
              </div>
            </div>

            {/* Timer Display */}
            <div style={styles.timerSectionMobile}>
              <div style={styles.timerLabel}>Airtime</div>
              <div style={styles.timerDisplay}>{airTime}s</div>
              <div style={styles.timerHint}>
                {isLaunching ? 'Orb in motion...' : 
                 orbLandedOnPlatform ? 'Landed on platform!' : 'Ready to launch'}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={styles.actionButtonsMobile}>
              <button
                onClick={isLaunching ? stopLaunch : startLaunch}
                disabled={orbLandedOnPlatform}
                style={isLaunching ? styles.stopButtonMobile : 
                       orbLandedOnPlatform ? {...styles.launchButtonMobile, opacity: 0.5} : styles.launchButtonMobile}
              >
                {isLaunching ? '⏹️ Stop' : 
                 orbLandedOnPlatform ? '✅ Landed' : '🚀 Launch Orb'}
              </button>
              
              <button
                onClick={resetLaunch}
                style={styles.resetButtonMobile}
                disabled={isLaunching}
              >
                🔄 Reset
              </button>

              <button
                onClick={generateRandomHeight}
                style={styles.newPlatformButtonMobile}
                disabled={isLaunching}
              >
                🎯 New
              </button>
            </div>
          </div>

          {/* Results - Mobile */}
          {showResults && (
            <div style={{
              ...styles.resultsPanelMobile,
              ...(success ? styles.resultsSuccess : styles.resultsMiss)
            }}>
              <h3 style={styles.resultsTitle}>
                {success ? '🎯 Perfect Landing!' : '📊 Launch Results'}
              </h3>
              
              <div style={styles.resultsGridMobile}>
                <div style={styles.resultItemMobile}>
                  <span>Your Velocity:</span>
                  <strong>{selectedVelocity} m/s</strong>
                </div>
                <div style={styles.resultItemMobile}>
                  <span>Max Height:</span>
                  <strong>{calculatedHeight.toFixed(1)} m</strong>
                </div>
                <div style={styles.resultItemMobile}>
                  <span>Platform:</span>
                  <strong>{targetHeight} m</strong>
                </div>
                <div style={styles.resultItemMobile}>
                  <span>Accuracy:</span>
                  <strong>{trials[trials.length - 1]?.accuracy.toFixed(1)}%</strong>
                </div>
              </div>

              {orbLandedOnPlatform && (
                <div style={styles.landingInfo}>
                  <p><strong>Landing Velocity: {landingVelocity.toFixed(1)} m/s</strong></p>
                  <p>Orb successfully landed on platform!</p>
                </div>
              )}

              <div style={styles.velocityAnalysis}>
                <p><strong>Perfect Velocity: {requiredVelocity.toFixed(1)} m/s</strong></p>
                <p>Your Selection: {selectedVelocity} m/s</p>
                <p>Difference: {Math.abs(selectedVelocity - requiredVelocity).toFixed(1)} m/s</p>
                {success ? (
                  <p style={styles.congrats}>Perfect! Exact velocity matched! 🎯</p>
                ) : (
                  <p style={styles.suggestion}>
                    {selectedVelocity < requiredVelocity ? 'Try higher velocity' : 'Try lower velocity'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Trials History - Mobile */}
          <div style={styles.historyPanelMobile}>
            <h3 style={styles.historyTitle}>Recent Launches</h3>
            {trials.length > 0 ? (
              <div style={styles.trialsListMobile}>
                {trials.slice(-3).reverse().map(trial => (
                  <div 
                    key={trial.trialNumber}
                    style={{
                      ...styles.trialItemMobile,
                      ...(trial.success ? styles.trialSuccess : styles.trialMiss)
                    }}
                  >
                    <div style={styles.trialHeaderMobile}>
                      <span>#{trial.trialNumber}</span>
                      <span>{trial.success ? '🎯' : '⚠️'}</span>
                      <span style={styles.platformHeightBadge}>{trial.targetHeight}m</span>
                    </div>
                    <div style={styles.trialDetailsMobile}>
                      <span>V:{trial.selectedVelocity}</span>
                      <span>H:{trial.calculatedHeight.toFixed(1)}</span>
                      <span>A:{trial.accuracy.toFixed(0)}%</span>
                    </div>
                    {trial.landedOnPlatform && (
                      <div style={styles.landedBadge}>Landed</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noTrials}>
                Launch the orb to see data
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <div style={styles.content}>
          {/* Simulation Area */}
          <div style={styles.simulationArea}>
            {/* Platform */}
            <div 
              style={{
                ...styles.platform,
                bottom: `${targetHeight * PIXELS_PER_METER + 60}px`,
                ...(orbLandedOnPlatform ? styles.platformActive : {}),
                ...(currentMaxHeight >= targetHeight - 2 && currentMaxHeight <= targetHeight + 2 ? styles.platformHighlight : {})
              }}
            >
              <div style={styles.platformLabel}>
                {targetHeight} Meter Platform
                <div style={styles.requiredVelocity}>
                  Perfect Velocity: {requiredVelocity.toFixed(1)} m/s
                </div>
              </div>
              
              {/* Orb on Platform when landed */}
              {orbLandedOnPlatform && (
                <div style={styles.orbOnPlatform}>
                  <div style={styles.platformOrbGlow}></div>
                  <div style={styles.platformOrb}>⚪</div>
                  <div style={styles.landingVelocity}>
                    Landing: {landingVelocity.toFixed(1)} m/s
                  </div>
                </div>
              )}
            </div>

            {/* Max Height Indicator */}
            {!isLaunching && !orbLandedOnPlatform && (
              <div 
                style={{
                  ...styles.maxHeightIndicator,
                  bottom: `${currentMaxHeight * PIXELS_PER_METER + 60}px`,
                  opacity: currentMaxHeight > targetHeight ? 0.8 : 0.4
                }}
              >
                <div style={styles.heightLine}></div>
                <div style={styles.heightLabel}>
                  Expected Max: {currentMaxHeight.toFixed(1)}m
                </div>
              </div>
            )}

            {/* Orb */}
            {!orbLandedOnPlatform && (
              <div 
                style={{
                  ...styles.orb,
                  bottom: `${orbPosition * PIXELS_PER_METER + 60}px`,
                  opacity: isLaunching ? 1 : 0.7,
                  transition: isLaunching ? 'none' : 'bottom 0.3s ease',
                  ...(selectedVelocity >= 30 ? styles.orbHighPower : 
                      selectedVelocity >= 25 ? styles.orbMediumPower : styles.orbLowPower)
                }}
              >
                <div style={styles.orbGlow}></div>
                {isLaunching && orbPosition > 0 && (
                  <div style={styles.velocityDisplay}>
                    {Math.abs(selectedVelocity - (GRAVITY * (airTime || 0))).toFixed(1)} m/s
                  </div>
                )}
              </div>
            )}

            {/* Ground */}
            <div style={styles.ground}>
              <div style={styles.launchPad}>
                {!isLaunching && !showResults && (
                  <div style={styles.launchHint}>Select velocity and launch!</div>
                )}
                {showResults && success && (
                  <div style={styles.successMessage}>🎯 Perfect Landing on Platform!</div>
                )}
                {showResults && !success && (
                  <div style={styles.missMessage}>
                    {selectedVelocity < requiredVelocity ? '⚠️ Too Low - Increase Velocity!' : '⚠️ Too High - Decrease Velocity!'}
                  </div>
                )}
              </div>
            </div>

            {/* Height Scale */}
            <div style={styles.heightScale}>
              {[0, 10, 20, 30, 40, 50, 60, 70].map(height => (
                <div 
                  key={height}
                  style={{
                    ...styles.scaleMarker,
                    bottom: `${height * PIXELS_PER_METER + 60}px`,
                    ...(height === targetHeight ? styles.scaleTarget : {})
                  }}
                >
                  {height}m
                </div>
              ))}
            </div>
          </div>

          {/* Controls Panel */}
          <div style={styles.controlsPanel}>
            {/* Mission Info */}
            <div style={styles.missionInfo}>
              <h3 style={styles.missionTitle}>🎯 Random Platform Challenge</h3>
              <p style={styles.missionText}>
                Each platform has a random height! Find the exact velocity needed to land on it.
              </p>
              <div style={styles.platformControl}>
                <span>Current Platform: <strong>{targetHeight} meters</strong></span>
                <button 
                  style={styles.newPlatformButton}
                  onClick={generateRandomHeight}
                  disabled={isLaunching}
                >
                  🔄 New Random Platform
                </button>
              </div>
              <div style={styles.perfectVelocity}>
                Perfect Velocity: <strong>{requiredVelocity.toFixed(1)} m/s</strong>
              </div>
            </div>

            {/* Velocity Selection */}
            <div style={styles.controlSection}>
              <label style={styles.controlLabel}>Select Launch Velocity</label>
              <div style={styles.velocityOptions}>
                {velocityOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedVelocity(option.value)}
                    disabled={isLaunching}
                    style={{
                      ...styles.velocityButton,
                      ...(selectedVelocity === option.value ? styles.velocityButtonActive : {}),
                      ...(option.value >= 30 ? styles.velocityHigh : 
                          option.value >= 25 ? styles.velocityMedium : styles.velocityLow)
                    }}
                  >
                    <div style={styles.velocityIcon}>{option.icon}</div>
                    <div style={styles.velocityValue}>{option.value} m/s</div>
                    <div style={styles.velocityDesc}>{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Info */}
            <div style={styles.quickInfo}>
              <div style={styles.infoRow}>
                <span>Platform Height:</span>
                <strong style={{color: '#f59e0b', fontSize: '1.1rem'}}>{targetHeight} m</strong>
              </div>
              <div style={styles.infoRow}>
                <span>Selected Velocity:</span>
                <strong style={{
                  color: Math.abs(selectedVelocity - requiredVelocity) < 1 ? '#22c55e' : 
                         Math.abs(selectedVelocity - requiredVelocity) < 3 ? '#f59e0b' : '#ef4444',
                  fontSize: '1.1rem'
                }}>{selectedVelocity} m/s</strong>
              </div>
              <div style={styles.infoRow}>
                <span>Expected Height:</span>
                <strong style={{
                  color: currentMaxHeight >= targetHeight - 1 && currentMaxHeight <= targetHeight + 1 ? '#22c55e' : 
                         currentMaxHeight >= targetHeight ? '#f59e0b' : '#ef4444',
                  fontSize: '1.1rem'
                }}>{currentMaxHeight.toFixed(1)} m</strong>
              </div>
              <div style={styles.infoRow}>
                <span>Velocity Accuracy:</span>
                <strong style={{
                  color: Math.abs(selectedVelocity - requiredVelocity) < 1 ? '#22c55e' : 
                         Math.abs(selectedVelocity - requiredVelocity) < 3 ? '#f59e0b' : '#ef4444'
                }}>
                  {Math.abs(selectedVelocity - requiredVelocity).toFixed(1)} m/s off
                </strong>
              </div>
            </div>

            {/* Timer Display */}
            <div style={styles.timerSection}>
              <div style={styles.timerLabel}>Airtime</div>
              <div style={styles.timerDisplay}>{airTime}s</div>
              <div style={styles.timerHint}>
                {isLaunching ? 'Orb in motion...' : 
                 orbLandedOnPlatform ? 'Orb landed on platform!' : 'Ready to launch'}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={styles.actionButtons}>
              <button
                onClick={isLaunching ? stopLaunch : startLaunch}
                disabled={orbLandedOnPlatform}
                style={isLaunching ? styles.stopButton : 
                       orbLandedOnPlatform ? {...styles.launchButton, opacity: 0.5} : styles.launchButton}
              >
                {isLaunching ? '⏹️ Stop & Analyze' : 
                 orbLandedOnPlatform ? '✅ Successfully Landed' : '🚀 Launch Orb'}
              </button>
              
              <button
                onClick={resetLaunch}
                style={styles.resetButton}
                disabled={isLaunching}
              >
                🔄 Reset
              </button>

              <button
                onClick={generateRandomHeight}
                style={styles.newPlatformButton}
                disabled={isLaunching}
              >
                🎯 New Platform
              </button>
            </div>

            {/* Results */}
            {showResults && (
              <div style={{
                ...styles.resultsPanel,
                ...(success ? styles.resultsSuccess : styles.resultsMiss)
              }}>
                <h3 style={styles.resultsTitle}>
                  {success ? '🎯 Perfect Velocity Found!' : '📊 Launch Analysis'}
                </h3>
                
                <div style={styles.resultsGrid}>
                  <div style={styles.resultItem}>
                    <span>Selected Velocity:</span>
                    <strong>{selectedVelocity} m/s</strong>
                  </div>
                  <div style={styles.resultItem}>
                    <span>Maximum Height:</span>
                    <strong>{calculatedHeight.toFixed(1)} m</strong>
                  </div>
                  <div style={styles.resultItem}>
                    <span>Platform Height:</span>
                    <strong>{targetHeight} m</strong>
                  </div>
                  <div style={styles.resultItem}>
                    <span>Perfect Velocity:</span>
                    <strong>{requiredVelocity.toFixed(1)} m/s</strong>
                  </div>
                  <div style={styles.resultItem}>
                    <span>Accuracy:</span>
                    <strong>{trials[trials.length - 1]?.accuracy.toFixed(1)}%</strong>
                  </div>
                </div>

                {orbLandedOnPlatform && (
                  <div style={styles.landingInfo}>
                    <h4>🏆 Successful Platform Landing!</h4>
                    <p><strong>Landing Velocity: {landingVelocity.toFixed(1)} m/s</strong></p>
                    <p>The orb successfully landed on the platform with precise velocity matching!</p>
                  </div>
                )}

                <div style={styles.physicsExplanation}>
                  <h4>Physics Formula:</h4>
                  <p><strong>h = v² ÷ (2g)</strong></p>
                  <p>Where: g = 9.81 m/s², v = launch velocity</p>
                  <p>Your calculation: {selectedVelocity}² ÷ (2 × 9.81) = <strong>{calculatedHeight.toFixed(1)} m</strong></p>
                  {success ? (
                    <p style={styles.congrats}>Excellent! Perfect velocity matching! The orb landed precisely on the platform! 🎯</p>
                  ) : (
                    <div style={styles.suggestionBox}>
                      <p><strong>Try This:</strong></p>
                      <p>
                        {selectedVelocity < requiredVelocity 
                          ? `Increase velocity to ~${requiredVelocity.toFixed(1)} m/s` 
                          : `Decrease velocity to ~${requiredVelocity.toFixed(1)} m/s`}
                      </p>
                      <p><em>The orb will only land on the platform with the exact velocity!</em></p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Trials History */}
      {!isMobile && (
        <div style={styles.historyPanel}>
          <h3 style={styles.historyTitle}>Launch History</h3>
          {trials.length > 0 ? (
            <div style={styles.trialsList}>
              {trials.slice(-5).reverse().map(trial => (
                <div 
                  key={trial.trialNumber}
                  style={{
                    ...styles.trialItem,
                    ...(trial.success ? styles.trialSuccess : styles.trialMiss)
                  }}
                >
                  <div style={styles.trialHeader}>
                    <span>Trial #{trial.trialNumber}</span>
                    <span>{trial.success ? '🎯' : '⚠️'}</span>
                    <span style={styles.platformHeightBadge}>{trial.targetHeight}m Platform</span>
                  </div>
                  <div style={styles.trialDetails}>
                    <span>Velocity: {trial.selectedVelocity}m/s</span>
                    <span>Height: {trial.calculatedHeight.toFixed(1)}m</span>
                    <span>Accuracy: {trial.accuracy.toFixed(1)}%</span>
                  </div>
                  {trial.landedOnPlatform && (
                    <div style={styles.landedBadge}>🏆 Landed on Platform</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.noTrials}>
              No launches yet. Select velocity and launch the orb!
            </div>
          )}
        </div>
      )}

      {/* Reward Popup */}
      {showReward && (
        <div style={styles.rewardOverlay}>
          <div style={styles.rewardContent}>
            <div style={styles.rewardIcon}>🚀</div>
            <h2 style={styles.rewardTitle}>Precision Launch Master!</h2>
            <p style={styles.rewardText}>
              You've mastered the art of precision velocity calculation! 
              Your ability to land the orb on randomly placed platforms is now perfectly calibrated.
            </p>
            <div style={styles.rewardStats}>
              <div style={styles.rewardStat}>
                <span>Trials:</span>
                <strong>{trials.length}</strong>
              </div>
              <div style={styles.rewardStat}>
                <span>Success Rate:</span>
                <strong>{((successfulTrials / trials.length) * 100).toFixed(0)}%</strong>
              </div>
              <div style={styles.rewardStat}>
                <span>Platforms Mastered:</span>
                <strong>{[...new Set(trials.filter(t => t.success).map(t => t.targetHeight))].length}</strong>
              </div>
            </div>
            <button 
              style={styles.rewardButton}
              onClick={completeQuest}
            >
              Continue Journey
            </button>
          </div>
        </div>
      )}

      {/* Assessment Panel */}
      {showAssessment && <AssessmentPanel />}
    </div>
  );
};

const styles = {
  container: (isMobile) => ({
    padding: isMobile ? '10px' : '20px',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0c4a6e 0%, #1e40af 50%, #1e1b4b 100%)',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: isMobile ? '80px' : '20px'
  }),
  header: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  headerTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  backButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  assessmentButton: {
    background: 'linear-gradient(45deg, #8b5cf6, #a855f7)',
    border: 'none',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  title: {
    fontSize: '2rem',
    margin: '0 0 8px 0',
    background: 'linear-gradient(45deg, #60a5fa, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '1rem',
    opacity: 0.9,
    margin: '0 0 12px 0'
  },
  questInfo: {
    background: 'rgba(245, 158, 11, 0.2)',
    padding: '6px 12px',
    borderRadius: '15px',
    display: 'inline-block',
    fontSize: '0.8rem',
    border: '1px solid rgba(245, 158, 11, 0.5)'
  },
  trialCount: {
    fontSize: '0.8rem',
    opacity: 0.8,
    marginLeft: '8px'
  },
  missionBriefing: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px',
    textAlign: 'center',
    border: '2px solid rgba(96, 165, 250, 0.3)'
  },
  platformInfo: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    marginTop: '10px',
    flexWrap: 'wrap'
  },
  newPlatformButton: {
    background: 'rgba(168, 85, 247, 0.3)',
    border: '1px solid #a855f7',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  newPlatformButtonMobile: {
    background: 'rgba(168, 85, 247, 0.3)',
    border: '1px solid #a855f7',
    color: 'white',
    padding: '12px 8px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    flex: 1
  },

  // Platform with landing state
  platformActive: {
    boxShadow: '0 0 40px rgba(34, 197, 94, 0.8)',
    border: '3px solid #22c55e',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  platformHighlight: {
    boxShadow: '0 0 25px rgba(34, 197, 94, 0.6)',
    border: '2px solid #22c55e'
  },

  // Orb on Platform
  orbOnPlatform: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 15
  },
  platformOrbGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '50px',
    height: '50px',
    background: 'radial-gradient(circle, rgba(34, 197, 94, 0.6) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'pulse 2s ease-in-out infinite'
  },
  platformOrb: {
    position: 'relative',
    fontSize: '1.8rem',
    filter: 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.8))',
    zIndex: 16
  },
  landingVelocity: {
    position: 'absolute',
    top: '-25px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.8)',
    color: '#22c55e',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '0.7rem',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },

  // Landing Info
  landingInfo: {
    background: 'rgba(34, 197, 94, 0.2)',
    padding: '12px',
    borderRadius: '8px',
    margin: '10px 0',
    borderLeft: '4px solid #22c55e'
  },

  // Platform Control
  platformControl: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '10px 0',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px'
  },

  // Badges
  platformHeightBadge: {
    background: 'rgba(168, 85, 247, 0.3)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '600'
  },
  landedBadge: {
    background: 'rgba(34, 197, 94, 0.3)',
    color: '#22c55e',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '600',
    marginTop: '5px',
    textAlign: 'center'
  },

  // Desktop Styles
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    alignItems: 'start'
  },
  simulationArea: {
    position: 'relative',
    height: '500px',
    background: 'linear-gradient(180deg, #1e40af 0%, #0c4a6e 100%)',
    borderRadius: '12px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden'
  },

  // Mobile Styles
  mobileContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  simulationAreaMobile: {
    position: 'relative',
    height: '400px',
    background: 'linear-gradient(180deg, #1e40af 0%, #0c4a6e 100%)',
    borderRadius: '12px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden'
  },

  // Mission Info
  missionInfo: {
    background: 'rgba(96, 165, 250, 0.2)',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px',
    border: '2px solid rgba(96, 165, 250, 0.4)',
    textAlign: 'center'
  },
  missionTitle: {
    margin: '0 0 10px 0',
    color: '#60a5fa'
  },
  missionText: {
    margin: '0 0 10px 0',
    fontSize: '0.9rem',
    lineHeight: '1.4'
  },
  perfectVelocity: {
    background: 'rgba(34, 197, 94, 0.2)',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#22c55e',
    border: '1px solid rgba(34, 197, 94, 0.4)'
  },

  // Platform
  platform: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '180px',
    height: '15px',
    background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)',
    transition: 'all 0.3s ease'
  },
  platformLabel: {
    position: 'absolute',
    top: '-35px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.8)',
    padding: '5px 10px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  requiredVelocity: {
    fontSize: '0.8rem',
    opacity: 0.8,
    marginTop: '2px'
  },

  // Max Height Indicator
  maxHeightIndicator: {
    position: 'absolute',
    left: '0',
    right: '0',
    height: '2px',
    background: 'rgba(245, 158, 11, 0.6)',
    zIndex: 5,
    transition: 'bottom 0.3s ease'
  },
  heightLine: {
    position: 'absolute',
    left: '0',
    right: '0',
    height: '2px',
    background: 'currentColor',
    border: '1px dashed rgba(245, 158, 11, 0.8)'
  },
  heightLabel: {
    position: 'absolute',
    left: '10px',
    top: '-18px',
    background: 'rgba(245, 158, 11, 0.9)',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '600'
  },

  // Orb
  orb: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '35px',
    height: '35px',
    background: 'radial-gradient(circle, #60a5fa, #3b82f6)',
    borderRadius: '50%',
    boxShadow: '0 0 20px rgba(96, 165, 250, 0.8)',
    zIndex: 10,
    transition: 'all 0.3s ease'
  },
  orbLowPower: {
    background: 'radial-gradient(circle, #60a5fa, #3b82f6)',
    boxShadow: '0 0 15px rgba(96, 165, 250, 0.8)'
  },
  orbMediumPower: {
    background: 'radial-gradient(circle, #f59e0b, #d97706)',
    boxShadow: '0 0 20px rgba(245, 158, 11, 0.8)'
  },
  orbHighPower: {
    background: 'radial-gradient(circle, #ef4444, #dc2626)',
    boxShadow: '0 0 25px rgba(239, 68, 68, 0.8)'
  },
  orbGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '50px',
    height: '50px',
    background: 'radial-gradient(circle, rgba(96, 165, 250, 0.4), transparent 70%)',
    borderRadius: '50%'
  },
  velocityDisplay: {
    position: 'absolute',
    top: '-25px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.8)',
    color: '#60a5fa',
    padding: '2px 8px',
    borderRadius: '8px',
    fontSize: '0.7rem',
    fontWeight: '600'
  },

  // Ground
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: 'linear-gradient(to top, #374151, #4b5563)'
  },
  launchPad: {
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80px',
    height: '6px',
    background: 'linear-gradient(90deg, #6b7280, #9ca3af)',
    borderRadius: '3px'
  },
  launchHint: {
    position: 'absolute',
    top: '-25px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.8rem',
    opacity: 0.7
  },
  successMessage: {
    position: 'absolute',
    top: '-30px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(34, 197, 94, 0.9)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  missMessage: {
    position: 'absolute',
    top: '-30px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(245, 158, 11, 0.9)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '600'
  },

  // Height Scale
  heightScale: {
    position: 'absolute',
    right: '8px',
    top: 0,
    bottom: 0
  },
  scaleMarker: {
    position: 'absolute',
    right: '0',
    transform: 'translateY(50%)',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '600'
  },
  scaleTarget: {
    background: 'rgba(245, 158, 11, 0.8)',
    color: 'white'
  },

  // Control Sections
  controlSection: {
    marginBottom: '20px'
  },

  // Desktop Controls
  controlsPanel: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '20px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  controlLabel: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: '600',
    fontSize: '1rem'
  },

  // Velocity Selection
  velocityOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
  },
  velocityButton: {
    padding: '15px 10px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    textAlign: 'center',
    transition: 'all 0.3s ease'
  },
  velocityButtonActive: {
    borderWidth: '3px',
    fontWeight: '600',
    transform: 'scale(1.05)'
  },
  velocityLow: {
    borderColor: '#60a5fa',
    background: 'rgba(96, 165, 250, 0.2)'
  },
  velocityMedium: {
    borderColor: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.2)'
  },
  velocityHigh: {
    borderColor: '#ef4444',
    background: 'rgba(239, 68, 68, 0.2)'
  },
  velocityIcon: {
    fontSize: '1.5rem',
    marginBottom: '6px'
  },
  velocityValue: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  velocityDesc: {
    fontSize: '0.8rem',
    opacity: 0.8
  },

  // Quick Info
  quickInfo: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '15px',
    borderRadius: '10px',
    margin: '20px 0',
    borderLeft: '4px solid #8b5cf6'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '0.9rem'
  },

  // Timer
  timerSection: {
    textAlign: 'center',
    margin: '25px 0',
    padding: '15px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    border: '2px solid rgba(96, 165, 250, 0.3)'
  },
  timerLabel: {
    fontSize: '1rem',
    marginBottom: '8px',
    opacity: 0.9
  },
  timerDisplay: {
    fontSize: '2.8rem',
    fontWeight: 'bold',
    color: '#60a5fa',
    marginBottom: '8px'
  },
  timerHint: {
    fontSize: '0.8rem',
    opacity: 0.7,
    lineHeight: '1.4'
  },

  // Action Buttons
  actionButtons: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  launchButton: {
    flex: 2,
    padding: '15px',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(45deg, #f59e0b, #eab308)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    cursor: 'pointer'
  },
  stopButton: {
    flex: 2,
    padding: '15px',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(45deg, #ef4444, #dc2626)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    cursor: 'pointer'
  },
  resetButton: {
    flex: 1,
    padding: '15px',
    border: 'none',
    borderRadius: '10px',
    background: '#6b7280',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer'
  },

  // Mobile Controls
  controlsMobile: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '15px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  velocityOptionsMobile: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  velocityButtonMobile: {
    padding: '10px 6px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    textAlign: 'center'
  },

  // Mobile Quick Info
  quickInfoMobile: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '12px',
    borderRadius: '8px',
    margin: '15px 0',
    borderLeft: '3px solid #8b5cf6'
  },

  // Mobile Timer
  timerSectionMobile: {
    textAlign: 'center',
    margin: '15px 0',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    border: '2px solid rgba(96, 165, 250, 0.3)'
  },

  // Mobile Action Buttons
  actionButtonsMobile: {
    display: 'flex',
    gap: '10px'
  },
  launchButtonMobile: {
    flex: 3,
    padding: '14px',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(45deg, #f59e0b, #eab308)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer'
  },
  stopButtonMobile: {
    flex: 3,
    padding: '14px',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(45deg, #ef4444, #dc2626)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer'
  },
  resetButtonMobile: {
    flex: 1,
    padding: '14px',
    border: 'none',
    borderRadius: '10px',
    background: '#6b7280',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer'
  },

  // Results Panels
  resultsPanel: {
    padding: '20px',
    borderRadius: '10px',
    marginTop: '20px'
  },
  resultsPanelMobile: {
    padding: '15px',
    borderRadius: '8px',
    marginTop: '15px'
  },
  resultsSuccess: {
    background: 'rgba(34, 197, 94, 0.2)',
    border: '2px solid #22c55e'
  },
  resultsMiss: {
    background: 'rgba(251, 191, 36, 0.2)',
    border: '2px solid #f59e0b'
  },
  resultsTitle: {
    margin: '0 0 15px 0',
    textAlign: 'center',
    fontSize: '1.1rem'
  },
  resultsGrid: {
    display: 'grid',
    gap: '10px',
    marginBottom: '15px'
  },
  resultsGridMobile: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '0.9rem'
  },
  resultItemMobile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '6px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    fontSize: '0.8rem',
    textAlign: 'center'
  },

  // Physics Explanation
  physicsExplanation: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '15px',
    borderRadius: '8px',
    fontSize: '0.9rem'
  },
  velocityAnalysis: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    textAlign: 'center',
    marginTop: '12px'
  },
  congrats: {
    color: '#22c55e',
    fontWeight: '600',
    marginTop: '10px',
    fontSize: '0.9rem'
  },
  suggestion: {
    color: '#f59e0b',
    fontWeight: '600',
    marginTop: '10px',
    fontSize: '0.9rem'
  },
  suggestionBox: {
    background: 'rgba(245, 158, 11, 0.1)',
    padding: '10px',
    borderRadius: '6px',
    borderLeft: '3px solid #f59e0b',
    marginTop: '10px'
  },

  // History Panels
  historyPanel: {
    maxWidth: '1200px',
    margin: '30px auto 0',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '20px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  historyPanelMobile: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '15px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  historyTitle: {
    margin: '0 0 15px 0',
    textAlign: 'center',
    fontSize: '1.1rem'
  },
  trialsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  trialsListMobile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  trialItem: {
    padding: '15px',
    borderRadius: '8px',
    background: 'rgba(0, 0, 0, 0.3)'
  },
  trialItemMobile: {
    padding: '10px',
    borderRadius: '6px',
    background: 'rgba(0, 0, 0, 0.3)'
  },
  trialSuccess: {
    borderLeft: '4px solid #22c55e'
  },
  trialMiss: {
    borderLeft: '4px solid #f59e0b'
  },
  trialHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  trialHeaderMobile: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    fontWeight: '600',
    fontSize: '0.8rem'
  },
  trialDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    opacity: 0.9
  },
  trialDetailsMobile: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    opacity: 0.9
  },
  noTrials: {
    textAlign: 'center',
    padding: '25px',
    opacity: 0.7,
    fontSize: '0.9rem'
  },

  // Reward Popup
  rewardOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  rewardContent: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 100%)',
    padding: '30px',
    borderRadius: '15px',
    textAlign: 'center',
    maxWidth: '450px',
    width: '100%',
    border: '2px solid rgba(255, 255, 255, 0.3)'
  },
  rewardIcon: {
    fontSize: '3.5rem',
    marginBottom: '20px'
  },
  rewardTitle: {
    fontSize: '1.8rem',
    marginBottom: '15px',
    color: '#f59e0b'
  },
  rewardText: {
    marginBottom: '25px',
    lineHeight: '1.6',
    fontSize: '1rem'
  },
  rewardStats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '25px',
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px'
  },
  rewardStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontSize: '0.9rem'
  },
  rewardButton: {
    padding: '15px 30px',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(45deg, #f59e0b, #eab308)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    cursor: 'pointer'
  },

  // Assessment Styles
  assessmentOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    padding: '20px'
  },
  assessmentContent: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 100%)',
    padding: '30px',
    borderRadius: '15px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '2px solid rgba(255, 255, 255, 0.3)'
  },
  assessmentHeader: {
    textAlign: 'center',
    marginBottom: '25px'
  },
  scoreSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px'
  },
  scoreCircle: (score) => ({
    position: 'relative',
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: `conic-gradient(
      ${score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'} ${score * 3.6}deg,
      rgba(255, 255, 255, 0.2) 0deg
    )`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }),
  scoreValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 100%)',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scoreLabel: {
    position: 'absolute',
    bottom: '-25px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.8rem',
    fontWeight: '600',
    opacity: 0.8
  },
  performanceLevel: (color) => ({
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: color,
    textAlign: 'center'
  }),
  feedbackSection: {
    marginBottom: '25px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px'
  },
  detailedAnalysis: {
    marginBottom: '25px'
  },
  analysisGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginTop: '15px'
  },
  analysisItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    fontSize: '0.9rem'
  },
  physicsUnderstanding: {
    marginBottom: '25px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px'
  },
  conceptCheck: {
    marginTop: '15px',
    fontSize: '0.9rem',
    lineHeight: '1.5'
  },
  improvementTips: {
    marginBottom: '25px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px'
  },
  tipsList: {
    marginTop: '15px',
    paddingLeft: '20px',
    fontSize: '0.9rem',
    lineHeight: '1.6'
  },
  assessmentActions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center'
  },
  continueButton: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(45deg, #22c55e, #16a34a)',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  restartButton: {
    padding: '12px 24px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    background: 'transparent',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem'
  }
};

// Add CSS animations
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default RisingOrb;