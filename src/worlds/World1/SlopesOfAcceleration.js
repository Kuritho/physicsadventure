import React, { useState, useRef, useEffect } from 'react';

const SlopesOfAcceleration = ({ onComplete, navigate }) => {
  const [rampAngle, setRampAngle] = useState(30);
  const [isRolling, setIsRolling] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);
  const [time, setTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [trials, setTrials] = useState([]);
  const [showGraphs, setShowGraphs] = useState(false);
  const [currentGraph, setCurrentGraph] = useState('distance-time');
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState({
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: ''
  });
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [showDataAnalyzer, setShowDataAnalyzer] = useState(false);
  const [analyzerMode, setAnalyzerMode] = useState('summary'); // 'summary', 'compare', 'calculate'
  const [calcAngle, setCalcAngle] = useState('');
  const [calcTime, setCalcTime] = useState('');
  const [calcResult, setCalcResult] = useState(null);
  
  const canRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);

  const RAMP_LENGTH = 2.0;
  const GRAVITY = 9.81;
  const PIXELS_PER_METER = 120;
  const rampLengthPixels = RAMP_LENGTH * PIXELS_PER_METER;
  const GROUND_ROLL_DISTANCE = 1.5;

  const calculateTheoreticalValues = (angle) => {
    const angleRad = (angle * Math.PI) / 180;
    const acceleration = GRAVITY * Math.sin(angleRad);
    const timeToBottom = Math.sqrt((2 * RAMP_LENGTH) / acceleration);
    const finalVelocity = acceleration * timeToBottom;
    
    return { acceleration, timeToBottom, finalVelocity };
  };

  const startRoll = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    setTime(0);
    setDistance(0);
    setVelocity(0);
    startTimeRef.current = performance.now();

    const theoretical = calculateTheoreticalValues(rampAngle);
    const angleRad = (rampAngle * Math.PI) / 180;
    const acceleration = GRAVITY * Math.sin(angleRad);

    const animate = (currentTime) => {
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      const currentDistance = 0.5 * acceleration * elapsed * elapsed;
      const currentVelocity = acceleration * elapsed;
      
      if (currentDistance < RAMP_LENGTH) {
        setTime(elapsed);
        setDistance(currentDistance);
        setVelocity(currentVelocity);
        
        if (canRef.current) {
          const progress = currentDistance / RAMP_LENGTH;
          const xMove = progress * rampLengthPixels * Math.cos(angleRad);
          const yMove = progress * rampLengthPixels * Math.sin(angleRad);
          const rotation = progress * 720;
          
          canRef.current.style.transform = `translate(${xMove}px, ${yMove}px) rotate(${rotation}deg)`;
        }
        
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const timeOnRamp = theoretical.timeToBottom;
      const velocityAtBottom = theoretical.finalVelocity;
      const timeOnGround = elapsed - timeOnRamp;
      const groundDistance = velocityAtBottom * timeOnGround;
      
      const totalDistance = RAMP_LENGTH + groundDistance;
      
      if (groundDistance >= GROUND_ROLL_DISTANCE) {
        setTime(timeOnRamp + (GROUND_ROLL_DISTANCE / velocityAtBottom));
        setDistance(RAMP_LENGTH + GROUND_ROLL_DISTANCE);
        setVelocity(velocityAtBottom);
        
        if (canRef.current) {
          const xRamp = rampLengthPixels * Math.cos(angleRad);
          const yRamp = rampLengthPixels * Math.sin(angleRad);
          const xGround = xRamp + (GROUND_ROLL_DISTANCE * PIXELS_PER_METER);
          const rotation = ((RAMP_LENGTH + GROUND_ROLL_DISTANCE) / 0.05) * 36;
          
          canRef.current.style.transform = `translate(${xGround}px, ${yRamp}px) rotate(${rotation}deg)`;
        }
        
        const experimentalAcceleration = (2 * RAMP_LENGTH) / (timeOnRamp * timeOnRamp);
        const error = Math.abs(theoretical.acceleration - experimentalAcceleration) / theoretical.acceleration * 100;
        
        const newTrial = {
          angle: rampAngle,
          time: timeOnRamp,
          distance: RAMP_LENGTH,
          acceleration: {
            theoretical: theoretical.acceleration,
            experimental: experimentalAcceleration,
            error: error
          },
          finalVelocity: velocityAtBottom
        };
        
        setTrials(prev => [...prev, newTrial]);
        setIsRolling(false);
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        
        if (isContinuous) {
          setTimeout(() => {
            resetExperiment();
            setTimeout(() => startRoll(), 100);
          }, 500);
        }
        return;
      }
      
      setTime(elapsed);
      setDistance(totalDistance);
      setVelocity(velocityAtBottom);
      
      if (canRef.current) {
        const xRamp = rampLengthPixels * Math.cos(angleRad);
        const yRamp = rampLengthPixels * Math.sin(angleRad);
        const xGround = xRamp + (groundDistance * PIXELS_PER_METER);
        const rotation = ((RAMP_LENGTH + groundDistance) / 0.05) * 36;
        
        canRef.current.style.transform = `translate(${xGround}px, ${yRamp}px) rotate(${rotation}deg)`;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopRoll = () => {
    if (!isRolling && !isContinuous) return;
    
    setIsContinuous(false);
    setIsRolling(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (time > 0 && distance > 0 && distance < RAMP_LENGTH) {
      const theoretical = calculateTheoreticalValues(rampAngle);
      const experimentalAcceleration = (2 * distance) / (time * time);
      const error = Math.abs(theoretical.acceleration - experimentalAcceleration) / theoretical.acceleration * 100;
      
      const newTrial = {
        angle: rampAngle,
        time: time,
        distance: distance,
        acceleration: {
          theoretical: theoretical.acceleration,
          experimental: experimentalAcceleration,
          error: error
        },
        finalVelocity: velocity
      };
      
      setTrials(prev => [...prev, newTrial]);
    }
  };

  const resetExperiment = () => {
    setIsContinuous(false);
    setIsRolling(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setTime(0);
    setDistance(0);
    setVelocity(0);
    
    if (canRef.current) {
      canRef.current.style.transition = 'none';
      canRef.current.style.transform = 'translate(0px, 0px) rotate(0deg)';
      void canRef.current.offsetHeight;
    }
  };

  const toggleContinuous = () => {
    if (isContinuous) {
      setIsContinuous(false);
      stopRoll();
    } else {
      setIsContinuous(true);
      resetExperiment();
      setTimeout(() => startRoll(), 100);
    }
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
      setShowAssessment(true);
    } else {
      alert('Please complete at least 3 trials to analyze the data!');
    }
  };

  const handleAssessmentChange = (question, value) => {
    setAssessmentAnswers(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const submitAssessment = () => {
    // Calculate average experimental acceleration from trials
    const avgAcceleration = trials.reduce((sum, t) => sum + t.acceleration.experimental, 0) / trials.length;
    
    // Correct answers
    const correctAnswers = {
      q1: 'parabolic', // Distance-time graph shape
      q2: 'linear', // Distance-time² graph shape
      q3: Math.abs(avgAcceleration - parseFloat(assessmentAnswers.q3 || 0)) < 1 ? assessmentAnswers.q3 : avgAcceleration.toFixed(2), // Acceleration value
      q4: 'increases', // Steeper angle effect
      q5: 'gravity' // Force causing acceleration
    };

    let score = 0;
    
    // Q1: Graph shape (distance-time)
    if (assessmentAnswers.q1 === correctAnswers.q1) score += 20;
    
    // Q2: Graph shape (distance-time²)
    if (assessmentAnswers.q2 === correctAnswers.q2) score += 20;
    
    // Q3: Acceleration value (within 1 m/s² tolerance)
    const userAccel = parseFloat(assessmentAnswers.q3 || 0);
    if (Math.abs(userAccel - avgAcceleration) < 1) score += 20;
    
    // Q4: Angle effect
    if (assessmentAnswers.q4 === correctAnswers.q4) score += 20;
    
    // Q5: Force identification
    if (assessmentAnswers.q5 === correctAnswers.q5) score += 20;
    
    setAssessmentScore(score);
    setAssessmentSubmitted(true);

    // If they pass (60% or higher), unlock the Data Analyzer Tool
    if (score >= 60) {
      setShowDataAnalyzer(true);
      // Don't auto-complete - let user explore the tool and click button
    }
  };

  const retakeAssessment = () => {
    setAssessmentSubmitted(false);
    setAssessmentAnswers({
      q1: '',
      q2: '',
      q3: '',
      q4: '',
      q5: ''
    });
    setAssessmentScore(0);
  };

  // Data Analyzer Functions
  const calculateAverages = () => {
    if (trials.length === 0) return null;
    
    const avgTime = trials.reduce((sum, t) => sum + t.time, 0) / trials.length;
    const avgTheoreticalAccel = trials.reduce((sum, t) => sum + t.acceleration.theoretical, 0) / trials.length;
    const avgExperimentalAccel = trials.reduce((sum, t) => sum + t.acceleration.experimental, 0) / trials.length;
    const avgError = trials.reduce((sum, t) => sum + t.acceleration.error, 0) / trials.length;
    const avgVelocity = trials.reduce((sum, t) => sum + t.finalVelocity, 0) / trials.length;
    
    return {
      avgTime,
      avgTheoreticalAccel,
      avgExperimentalAccel,
      avgError,
      avgVelocity
    };
  };

  const findBestTrial = () => {
    if (trials.length === 0) return null;
    return trials.reduce((best, current) => 
      current.acceleration.error < best.acceleration.error ? current : best
    );
  };

  const findWorstTrial = () => {
    if (trials.length === 0) return null;
    return trials.reduce((worst, current) => 
      current.acceleration.error > worst.acceleration.error ? current : worst
    );
  };

  const handleAngleChange = (e) => {
    const newAngle = parseInt(e.target.value);
    setRampAngle(newAngle);
    resetExperiment();
  };

  const theoretical = calculateTheoreticalValues(rampAngle);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #1e1b4b 100%)',
      color: 'white',
      padding: '16px',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      marginBottom: '24px'
    },
    backButton: {
      marginBottom: '12px',
      padding: '8px 16px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '8px',
      margin: 0
    },
    subtitle: {
      color: '#e9d5ff',
      fontSize: '14px',
      margin: 0
    },
    section: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '24px'
    },
    simulationBox: {
      position: 'relative',
      height: '320px',
      overflow: 'visible',
      borderRadius: '8px',
      background: 'linear-gradient(to bottom, rgba(12, 74, 110, 0.2), rgba(20, 83, 45, 0.2))'
    },
    ground: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'linear-gradient(to top, #374151, #4b5563)'
    },
    ramp: {
      position: 'absolute',
      top: '32px',
      left: '32px',
      width: rampLengthPixels + 'px',
      height: '16px',
      transformOrigin: 'left top',
      transform: `rotate(${rampAngle}deg)`,
      zIndex: 2
    },
    rampSurface: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(to right, #a855f7, #60a5fa)',
      borderRadius: '0 8px 8px 0',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      position: 'relative'
    },
    rampSupport: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '4px',
      height: '48px',
      background: '#9333ea',
      transform: 'translateY(-100%)'
    },
    can: {
      position: 'absolute',
      top: '32px',
      left: '32px',
      fontSize: '36px',
      zIndex: 10,
      transition: 'none',
      willChange: 'transform',
      filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4))',
      transform: 'translate(0px, 0px) rotate(0deg)'
    },
    marker: {
      position: 'absolute',
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#581c87',
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 'bold'
    },
    angleDisplay: {
      position: 'absolute',
      top: '80px',
      left: '16px',
      fontSize: '12px',
      background: 'rgba(0, 0, 0, 0.6)',
      padding: '4px 8px',
      borderRadius: '4px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '16px',
      marginTop: 0
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '500'
    },
    slider: {
      width: '100%',
      height: '8px',
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      cursor: 'pointer',
      accentColor: '#a855f7'
    },
    presetButtons: {
      display: 'flex',
      gap: '8px',
      marginTop: '8px'
    },
    presetBtn: {
      flex: 1,
      padding: '6px 12px',
      background: 'rgba(168, 85, 247, 0.3)',
      border: 'none',
      borderRadius: '4px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px'
    },
    buttonGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px',
      marginBottom: '16px'
    },
    button: {
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.3s'
    },
    buttonStart: {
      background: '#22c55e',
      color: 'white'
    },
    buttonLoop: {
      background: '#3b82f6',
      color: 'white'
    },
    buttonLoopActive: {
      background: '#f97316',
      color: 'white'
    },
    buttonStop: {
      background: '#ef4444',
      color: 'white'
    },
    buttonReset: {
      background: '#6b7280',
      color: 'white'
    },
    dataGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px'
    },
    dataCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      padding: '12px'
    },
    dataLabel: {
      fontSize: '12px',
      color: '#e9d5ff',
      marginBottom: '4px'
    },
    dataValue: {
      fontSize: '20px',
      fontWeight: 'bold'
    },
    dataValueSmall: {
      fontSize: '14px',
      fontWeight: 'bold'
    },
    predictionRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '8px',
      fontSize: '14px'
    },
    predictionLabel: {
      color: '#e9d5ff'
    },
    table: {
      width: '100%',
      fontSize: '14px',
      borderCollapse: 'collapse',
      overflowX: 'auto',
      display: 'block'
    },
    tableInner: {
      width: '100%',
      display: 'table'
    },
    th: {
      padding: '8px',
      textAlign: 'left',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      fontSize: '12px'
    },
    td: {
      padding: '8px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '12px'
    },
    errorHigh: {
      color: '#f87171',
      fontWeight: 'bold'
    },
    errorLow: {
      color: '#4ade80',
      fontWeight: 'bold'
    },
    noData: {
      textAlign: 'center',
      padding: '32px 0',
      color: '#e9d5ff'
    },
    graphButton: {
      width: '100%',
      padding: '12px 16px',
      background: 'rgba(59, 130, 246, 0.3)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: '8px'
    },
    completeButton: {
      width: '100%',
      padding: '12px 16px',
      background: 'linear-gradient(to right, #a855f7, #ec4899)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      fontWeight: 'bold',
      cursor: 'pointer'
    },
    graphTabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px'
    },
    graphTab: {
      flex: 1,
      padding: '8px 16px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer'
    },
    graphTabActive: {
      flex: 1,
      padding: '8px 16px',
      background: '#a855f7',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer'
    },
    graphBox: {
      position: 'relative',
      height: '256px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      padding: '16px'
    },
    graphAxes: {
      position: 'absolute',
      top: '16px',
      left: '16px',
      right: '16px',
      bottom: '16px',
      borderLeft: '2px solid rgba(255, 255, 255, 0.3)',
      borderBottom: '2px solid rgba(255, 255, 255, 0.3)'
    },
    graphPoint: {
      position: 'absolute',
      width: '12px',
      height: '12px',
      background: '#fbbf24',
      border: '2px solid white',
      borderRadius: '50%',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
    },
    assessmentBox: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      padding: '20px',
      border: '2px solid #a855f7',
      marginTop: '24px'
    },
    assessmentTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '16px',
      marginTop: 0,
      color: '#fbbf24',
      textAlign: 'center'
    },
    assessmentIntro: {
      background: 'rgba(168, 85, 247, 0.2)',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '20px',
      fontSize: '14px',
      lineHeight: '1.6'
    },
    questionBox: {
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '16px'
    },
    questionText: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '12px',
      color: '#e9d5ff'
    },
    optionLabel: {
      display: 'block',
      padding: '10px 12px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '6px',
      marginBottom: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      border: '2px solid transparent'
    },
    optionLabelSelected: {
      background: 'rgba(168, 85, 247, 0.3)',
      borderColor: '#a855f7'
    },
    radio: {
      marginRight: '8px',
      accentColor: '#a855f7'
    },
    input: {
      width: '100%',
      padding: '10px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '6px',
      color: 'white',
      fontSize: '16px'
    },
    submitButton: {
      width: '100%',
      padding: '16px',
      background: 'linear-gradient(to right, #22c55e, #16a34a)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '16px',
      cursor: 'pointer',
      marginTop: '16px'
    },
    resultBox: {
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '24px',
      borderRadius: '12px',
      textAlign: 'center',
      marginTop: '16px'
    },
    scoreDisplay: {
      fontSize: '48px',
      fontWeight: 'bold',
      marginBottom: '16px'
    },
    feedbackText: {
      fontSize: '18px',
      marginBottom: '8px'
    },
    retakeButton: {
      padding: '12px 24px',
      background: '#6b7280',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '16px',
      marginRight: '8px'
    },
    continueButton: {
      padding: '12px 24px',
      background: 'linear-gradient(to right, #a855f7, #ec4899)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '16px'
    },
    dataAnalyzerBox: {
      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      padding: '20px',
      border: '2px solid #fbbf24',
      marginTop: '24px'
    },
    analyzerHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      flexWrap: 'wrap',
      gap: '12px'
    },
    analyzerTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0,
      color: '#fbbf24'
    },
    analyzerBadge: {
      background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#1e1b4b'
    },
    analyzerTabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      flexWrap: 'wrap'
    },
    analyzerTab: {
      flex: 1,
      minWidth: '100px',
      padding: '10px 16px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px'
    },
    analyzerTabActive: {
      flex: 1,
      minWidth: '100px',
      padding: '10px 16px',
      background: '#fbbf24',
      border: 'none',
      borderRadius: '8px',
      color: '#1e1b4b',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px'
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '12px'
    },
    statLabel: {
      fontSize: '12px',
      color: '#e9d5ff',
      marginBottom: '4px'
    },
    statValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#fbbf24'
    },
    statUnit: {
      fontSize: '14px',
      color: '#d1d5db',
      marginLeft: '4px'
    },
    compareGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px'
    },
    trialCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid transparent'
    },
    trialCardBest: {
      background: 'rgba(74, 222, 128, 0.2)',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #4ade80'
    },
    trialCardWorst: {
      background: 'rgba(248, 113, 113, 0.2)',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #f87171'
    },
    calculatorInput: {
      width: '100%',
      padding: '12px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      color: 'white',
      fontSize: '16px',
      marginBottom: '12px'
    },
    calculateBtn: {
      width: '100%',
      padding: '12px',
      background: '#fbbf24',
      border: 'none',
      borderRadius: '8px',
      color: '#1e1b4b',
      fontWeight: 'bold',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate && navigate('menu')}>
          <span>←</span> Back to Menu
        </button>
        <h1 style={styles.title}>🎢 Slopes of Acceleration</h1>
        <p style={styles.subtitle}>Roll the object down the ramp and collect data!</p>
      </div>

      <div style={styles.section}>
        <div style={styles.simulationBox}>
          <div style={styles.ground}></div>
          
          <div style={styles.ramp}>
            <div style={styles.rampSurface}>
              {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => (
                <div 
                  key={i}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: 'rgba(255, 255, 255, 0.4)',
                    left: `${pos * 100}%`
                  }}
                ></div>
              ))}
            </div>
            <div style={styles.rampSupport}></div>
          </div>
          
          <div ref={canRef} style={styles.can}>🥫</div>
          
          <div style={{...styles.marker, top: '8px', left: '16px'}}>START</div>
          <div style={{...styles.marker, bottom: '80px', right: '16px'}}>END</div>
          <div style={styles.angleDisplay}>θ = {rampAngle}°</div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Controls</h3>
        
        <div style={{marginBottom: '16px'}}>
          <label style={styles.label}>Ramp Angle: {rampAngle}°</label>
          <input
            type="range"
            min="5"
            max="60"
            value={rampAngle}
            onChange={handleAngleChange}
            disabled={isRolling}
            style={styles.slider}
          />
          <div style={styles.presetButtons}>
            {[15, 30, 45].map(angle => (
              <button 
                key={angle}
                onClick={() => { setRampAngle(angle); resetExperiment(); }} 
                disabled={isRolling}
                style={{...styles.presetBtn, opacity: isRolling ? 0.5 : 1}}
              >
                {angle}°
              </button>
            ))}
          </div>
        </div>

        <div style={styles.buttonGrid}>
          <button 
            onClick={startRoll} 
            disabled={isRolling || isContinuous}
            style={{...styles.button, ...styles.buttonStart, opacity: (isRolling || isContinuous) ? 0.5 : 1}}
          >
            🚀 Start
          </button>
          <button 
            onClick={toggleContinuous}
            style={{...styles.button, ...(isContinuous ? styles.buttonLoopActive : styles.buttonLoop)}}
          >
            {isContinuous ? '⏸️ Stop Loop' : '🔁 Loop'}
          </button>
          <button 
            onClick={stopRoll} 
            disabled={!isRolling && !isContinuous}
            style={{...styles.button, ...styles.buttonStop, opacity: (!isRolling && !isContinuous) ? 0.5 : 1}}
          >
            ⏹️ Stop
          </button>
          <button 
            onClick={resetExperiment}
            style={{...styles.button, ...styles.buttonReset}}
          >
            🔄 Reset
          </button>
        </div>

        <div style={styles.dataGrid}>
          <div style={styles.dataCard}>
            <div style={styles.dataLabel}>Time</div>
            <div style={styles.dataValue}>{time.toFixed(2)} s</div>
          </div>
          <div style={styles.dataCard}>
            <div style={styles.dataLabel}>Distance</div>
            <div style={styles.dataValue}>{distance.toFixed(2)} m</div>
          </div>
          <div style={styles.dataCard}>
            <div style={styles.dataLabel}>Velocity</div>
            <div style={styles.dataValue}>{velocity.toFixed(2)} m/s</div>
          </div>
          <div style={styles.dataCard}>
            <div style={styles.dataLabel}>Status</div>
            <div style={styles.dataValueSmall}>
              {isContinuous ? '🔁 Looping' : isRolling ? (distance < RAMP_LENGTH ? '🔄 On Ramp' : '🏃 On Ground') : distance >= RAMP_LENGTH + GROUND_ROLL_DISTANCE ? '✅ Done' : '⏸️ Ready'}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Theoretical Predictions</h3>
        <div style={styles.predictionRow}>
          <span style={styles.predictionLabel}>Acceleration:</span>
          <strong>{theoretical.acceleration.toFixed(2)} m/s²</strong>
        </div>
        <div style={styles.predictionRow}>
          <span style={styles.predictionLabel}>Time to Bottom:</span>
          <strong>{theoretical.timeToBottom.toFixed(2)} s</strong>
        </div>
        <div style={styles.predictionRow}>
          <span style={styles.predictionLabel}>Final Speed:</span>
          <strong>{theoretical.finalVelocity.toFixed(2)} m/s</strong>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Experimental Results ({trials.length} trials)</h3>
        
        {trials.length > 0 ? (
          <div style={styles.table}>
            <table style={styles.tableInner}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Angle</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Theory a</th>
                  <th style={styles.th}>Exp a</th>
                  <th style={styles.th}>Error</th>
                </tr>
              </thead>
              <tbody>
                {trials.map((trial, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{trial.angle}°</td>
                    <td style={styles.td}>{trial.time.toFixed(2)}s</td>
                    <td style={styles.td}>{trial.acceleration.theoretical.toFixed(2)}</td>
                    <td style={styles.td}>{trial.acceleration.experimental.toFixed(2)}</td>
                    <td style={{...styles.td, ...(trial.acceleration.error > 10 ? styles.errorHigh : styles.errorLow)}}>
                      {trial.acceleration.error.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.noData}>
            <p style={{fontSize: '32px', margin: '0 0 8px 0'}}>📊</p>
            <p style={{margin: 0}}>No data yet - Run experiments!</p>
          </div>
        )}
        
        <div style={{marginTop: '16px'}}>
          {trials.length > 0 && (
            <button style={styles.graphButton} onClick={() => setShowGraphs(!showGraphs)}>
              {showGraphs ? '📊 Hide Graphs' : '📊 Show Graphs'}
            </button>
          )}
          
          <button 
            onClick={completeQuest}
            style={{...styles.completeButton, opacity: trials.length < 3 ? 0.5 : 1, cursor: trials.length < 3 ? 'not-allowed' : 'pointer'}}
            disabled={trials.length < 3}
          >
            {trials.length >= 3 ? '📝 Take Assessment' : `Need ${3 - trials.length} more trials`}
          </button>
        </div>
      </div>

      {showGraphs && trials.length > 0 && (
        <div style={styles.section}>
          <div style={styles.graphTabs}>
            <button 
              style={currentGraph === 'distance-time' ? styles.graphTabActive : styles.graphTab}
              onClick={() => setCurrentGraph('distance-time')}
            >
              d vs t
            </button>
            <button 
              style={currentGraph === 'distance-time2' ? styles.graphTabActive : styles.graphTab}
              onClick={() => setCurrentGraph('distance-time2')}
            >
              d vs t²
            </button>
          </div>

          <div style={styles.graphBox}>
            <div style={styles.graphAxes}>
              {trials.map((trial, index) => {
                const maxTime = Math.max(...trials.map(t => t.time));
                const maxTime2 = Math.max(...trials.map(t => t.time * t.time));
                const x = currentGraph === 'distance-time' 
                  ? (trial.time / maxTime) * 90 
                  : ((trial.time * trial.time) / maxTime2) * 90;
                const y = (trial.distance / RAMP_LENGTH) * 90;
                
                return (
                  <div
                    key={index}
                    style={{
                      ...styles.graphPoint,
                      left: `${x}%`,
                      bottom: `${y}%`,
                      transform: 'translate(-50%, 50%)'
                    }}
                  />
                );
              })}
            </div>
            <div style={{position: 'absolute', bottom: 0, left: 0, fontSize: '12px', color: '#e9d5ff'}}>
              {currentGraph === 'distance-time' ? 'Time (s)' : 'Time² (s²)'}
            </div>
            <div style={{position: 'absolute', top: '100px', left: 0, fontSize: '12px', color: '#e9d5ff', transform: 'rotate(-90deg)', transformOrigin: 'top left'}}>
              Distance (m)
            </div>
          </div>
        </div>
      )}

      {showAssessment && (
        <div style={styles.assessmentBox}>
          <h2 style={styles.assessmentTitle}>📝 Quest Assessment</h2>
          
          {!assessmentSubmitted ? (
            <>
              <div style={styles.assessmentIntro}>
                <p style={{margin: '0 0 8px 0'}}><strong>Instructions:</strong></p>
                <p style={{margin: 0}}>
                  Answer the following questions based on your experiments. 
                  You need to score at least 60% to unlock the Data Analyzer Tool and complete this quest!
                </p>
              </div>

              {/* Question 1 */}
              <div style={styles.questionBox}>
                <p style={styles.questionText}>1. What shape does a distance-time graph show for uniformly accelerated motion?</p>
                <label style={assessmentAnswers.q1 === 'linear' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q1" 
                    value="linear"
                    checked={assessmentAnswers.q1 === 'linear'}
                    onChange={(e) => handleAssessmentChange('q1', e.target.value)}
                    style={styles.radio}
                  />
                  Linear (straight line)
                </label>
                <label style={assessmentAnswers.q1 === 'parabolic' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q1" 
                    value="parabolic"
                    checked={assessmentAnswers.q1 === 'parabolic'}
                    onChange={(e) => handleAssessmentChange('q1', e.target.value)}
                    style={styles.radio}
                  />
                  Parabolic (curved)
                </label>
                <label style={assessmentAnswers.q1 === 'horizontal' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q1" 
                    value="horizontal"
                    checked={assessmentAnswers.q1 === 'horizontal'}
                    onChange={(e) => handleAssessmentChange('q1', e.target.value)}
                    style={styles.radio}
                  />
                  Horizontal (flat line)
                </label>
              </div>

              {/* Question 2 */}
              <div style={styles.questionBox}>
                <p style={styles.questionText}>2. What shape does a distance-time² graph show for uniformly accelerated motion?</p>
                <label style={assessmentAnswers.q2 === 'parabolic' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q2" 
                    value="parabolic"
                    checked={assessmentAnswers.q2 === 'parabolic'}
                    onChange={(e) => handleAssessmentChange('q2', e.target.value)}
                    style={styles.radio}
                  />
                  Parabolic (curved)
                </label>
                <label style={assessmentAnswers.q2 === 'linear' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q2" 
                    value="linear"
                    checked={assessmentAnswers.q2 === 'linear'}
                    onChange={(e) => handleAssessmentChange('q2', e.target.value)}
                    style={styles.radio}
                  />
                  Linear (straight line)
                </label>
                <label style={assessmentAnswers.q2 === 'exponential' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q2" 
                    value="exponential"
                    checked={assessmentAnswers.q2 === 'exponential'}
                    onChange={(e) => handleAssessmentChange('q2', e.target.value)}
                    style={styles.radio}
                  />
                  Exponential (steep curve)
                </label>
              </div>

              {/* Question 3 */}
              <div style={styles.questionBox}>
                <p style={styles.questionText}>
                  3. Based on your experiments, what is the average experimental acceleration? (in m/s²)
                </p>
                <p style={{fontSize: '12px', color: '#e9d5ff', marginBottom: '8px'}}>
                  Hint: Check your results table and calculate the average of experimental acceleration values.
                </p>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="Enter acceleration (e.g., 4.90)"
                  value={assessmentAnswers.q3}
                  onChange={(e) => handleAssessmentChange('q3', e.target.value)}
                  style={styles.input}
                />
              </div>

              {/* Question 4 */}
              <div style={styles.questionBox}>
                <p style={styles.questionText}>4. What happens to the acceleration when you increase the ramp angle?</p>
                <label style={assessmentAnswers.q4 === 'increases' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q4" 
                    value="increases"
                    checked={assessmentAnswers.q4 === 'increases'}
                    onChange={(e) => handleAssessmentChange('q4', e.target.value)}
                    style={styles.radio}
                  />
                  It increases
                </label>
                <label style={assessmentAnswers.q4 === 'decreases' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q4" 
                    value="decreases"
                    checked={assessmentAnswers.q4 === 'decreases'}
                    onChange={(e) => handleAssessmentChange('q4', e.target.value)}
                    style={styles.radio}
                  />
                  It decreases
                </label>
                <label style={assessmentAnswers.q4 === 'stays-same' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q4" 
                    value="stays-same"
                    checked={assessmentAnswers.q4 === 'stays-same'}
                    onChange={(e) => handleAssessmentChange('q4', e.target.value)}
                    style={styles.radio}
                  />
                  It stays the same
                </label>
              </div>

              {/* Question 5 */}
              <div style={styles.questionBox}>
                <p style={styles.questionText}>5. What force causes the can to accelerate down the ramp?</p>
                <label style={assessmentAnswers.q5 === 'gravity' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q5" 
                    value="gravity"
                    checked={assessmentAnswers.q5 === 'gravity'}
                    onChange={(e) => handleAssessmentChange('q5', e.target.value)}
                    style={styles.radio}
                  />
                  Gravity (component along the slope)
                </label>
                <label style={assessmentAnswers.q5 === 'friction' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q5" 
                    value="friction"
                    checked={assessmentAnswers.q5 === 'friction'}
                    onChange={(e) => handleAssessmentChange('q5', e.target.value)}
                    style={styles.radio}
                  />
                  Friction
                </label>
                <label style={assessmentAnswers.q5 === 'normal-force' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q5" 
                    value="normal-force"
                    checked={assessmentAnswers.q5 === 'normal-force'}
                    onChange={(e) => handleAssessmentChange('q5', e.target.value)}
                    style={styles.radio}
                  />
                  Normal force
                </label>
              </div>

              <button 
                onClick={submitAssessment}
                style={styles.submitButton}
                disabled={!assessmentAnswers.q1 || !assessmentAnswers.q2 || !assessmentAnswers.q3 || !assessmentAnswers.q4 || !assessmentAnswers.q5}
              >
                Submit Assessment
              </button>
            </>
          ) : (
            <div style={styles.resultBox}>
              <div style={{
                ...styles.scoreDisplay,
                color: assessmentScore >= 60 ? '#4ade80' : '#f87171'
              }}>
                {assessmentScore}%
              </div>
              
              <p style={{...styles.feedbackText, fontWeight: 'bold', fontSize: '20px'}}>
                {assessmentScore >= 80 ? '🌟 Excellent!' : 
                 assessmentScore >= 60 ? '✅ Good Job!' : 
                 '📚 Keep Learning!'}
              </p>
              
              <p style={styles.feedbackText}>
                {assessmentScore >= 60 ? 
                  'You have successfully completed the assessment and unlocked the Data Analyzer Tool!' :
                  'You need at least 60% to pass. Review your experiments and try again!'}
              </p>

              {assessmentScore >= 60 ? (
                <>
                  <div style={{
                    background: 'rgba(74, 222, 128, 0.2)',
                    padding: '16px',
                    borderRadius: '8px',
                    marginTop: '16px'
                  }}>
                    <p style={{margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '18px'}}>
                      🎉 Assessment Passed!
                    </p>
                    <p style={{margin: 0, fontSize: '14px'}}>
                      You've unlocked the 🧮 Data Analyzer Tool! Scroll down to explore it.
                    </p>
                  </div>
                  <div style={{display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap'}}>
                    <button 
                      onClick={() => window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})}
                      style={{...styles.continueButton, flex: 1, minWidth: '150px'}}
                    >
                      📊 View Data Analyzer
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  onClick={retakeAssessment}
                  style={styles.retakeButton}
                >
                  Retake Assessment
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showDataAnalyzer && (
        <div style={styles.dataAnalyzerBox}>
          <div style={styles.analyzerHeader}>
            <h2 style={styles.analyzerTitle}>🧮 Data Analyzer Tool</h2>
            <div style={styles.analyzerBadge}>UNLOCKED ✨</div>
          </div>

          <p style={{fontSize: '14px', color: '#e9d5ff', marginBottom: '16px', background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '8px'}}>
            🎉 <strong>Congratulations!</strong> You've earned the Data Analyzer Tool! Use it to analyze your experimental data in detail.
          </p>

          <div style={styles.analyzerTabs}>
            <button 
              style={analyzerMode === 'summary' ? styles.analyzerTabActive : styles.analyzerTab}
              onClick={() => setAnalyzerMode('summary')}
            >
              📊 Summary
            </button>
            <button 
              style={analyzerMode === 'compare' ? styles.analyzerTabActive : styles.analyzerTab}
              onClick={() => setAnalyzerMode('compare')}
            >
              ⚖️ Compare
            </button>
            <button 
              style={analyzerMode === 'calculate' ? styles.analyzerTabActive : styles.analyzerTab}
              onClick={() => setAnalyzerMode('calculate')}
            >
              🔢 Calculate
            </button>
          </div>

          {/* Summary Mode */}
          {analyzerMode === 'summary' && (() => {
            const stats = calculateAverages();
            if (!stats) return <p>No data available</p>;
            
            return (
              <div>
                <p style={{fontSize: '14px', color: '#e9d5ff', marginBottom: '16px'}}>
                  Statistical analysis of your {trials.length} experimental trials
                </p>
                
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Average Time to Bottom</div>
                  <div>
                    <span style={styles.statValue}>{stats.avgTime.toFixed(2)}</span>
                    <span style={styles.statUnit}>seconds</span>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Average Theoretical Acceleration</div>
                  <div>
                    <span style={styles.statValue}>{stats.avgTheoreticalAccel.toFixed(2)}</span>
                    <span style={styles.statUnit}>m/s²</span>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Average Experimental Acceleration</div>
                  <div>
                    <span style={styles.statValue}>{stats.avgExperimentalAccel.toFixed(2)}</span>
                    <span style={styles.statUnit}>m/s²</span>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Average Error</div>
                  <div>
                    <span style={{...styles.statValue, color: stats.avgError < 5 ? '#4ade80' : stats.avgError < 10 ? '#fbbf24' : '#f87171'}}>
                      {stats.avgError.toFixed(2)}
                    </span>
                    <span style={styles.statUnit}>%</span>
                  </div>
                  <div style={{fontSize: '12px', marginTop: '4px', color: '#d1d5db'}}>
                    {stats.avgError < 5 ? '✅ Excellent accuracy!' : 
                     stats.avgError < 10 ? '⚠️ Good, but can improve' : 
                     '❌ High error - check your measurements'}
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Average Final Velocity</div>
                  <div>
                    <span style={styles.statValue}>{stats.avgVelocity.toFixed(2)}</span>
                    <span style={styles.statUnit}>m/s</span>
                  </div>
                </div>

                <div style={{background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '8px', marginTop: '16px'}}>
                  <p style={{margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px'}}>💡 Insight</p>
                  <p style={{margin: 0, fontSize: '13px', lineHeight: '1.5'}}>
                    Your experimental acceleration is {Math.abs(stats.avgTheoreticalAccel - stats.avgExperimentalAccel) < 0.5 ? 'very close to' : 'somewhat different from'} the theoretical prediction. 
                    {stats.avgError < 5 && ' This suggests your experimental technique is excellent!'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Compare Mode */}
          {analyzerMode === 'compare' && (() => {
            const best = findBestTrial();
            const worst = findWorstTrial();
            if (!best || !worst) return <p>Need more trials to compare</p>;
            
            return (
              <div>
                <p style={{fontSize: '14px', color: '#e9d5ff', marginBottom: '16px'}}>
                  Compare your best and worst trials
                </p>

                <div style={styles.compareGrid}>
                  <div>
                    <h4 style={{margin: '0 0 12px 0', color: '#4ade80', fontSize: '16px'}}>✅ Best Trial</h4>
                    <div style={styles.trialCardBest}>
                      <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Angle</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{best.angle}°</div>
                      </div>
                      <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Time</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{best.time.toFixed(2)}s</div>
                      </div>
                      <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Acceleration</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{best.acceleration.experimental.toFixed(2)} m/s²</div>
                      </div>
                      <div>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Error</div>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#4ade80'}}>
                          {best.acceleration.error.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{margin: '0 0 12px 0', color: '#f87171', fontSize: '16px'}}>⚠️ Worst Trial</h4>
                    <div style={styles.trialCardWorst}>
                      <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Angle</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{worst.angle}°</div>
                      </div>
                      <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Time</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{worst.time.toFixed(2)}s</div>
                      </div>
                      <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Acceleration</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{worst.acceleration.experimental.toFixed(2)} m/s²</div>
                      </div>
                      <div>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Error</div>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#f87171'}}>
                          {worst.acceleration.error.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '8px', marginTop: '16px'}}>
                  <p style={{margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px'}}>💡 Analysis</p>
                  <p style={{margin: 0, fontSize: '13px', lineHeight: '1.5'}}>
                    Error difference: {(worst.acceleration.error - best.acceleration.error).toFixed(1)}%. 
                    {worst.acceleration.error - best.acceleration.error > 5 ? 
                      ' Try to maintain consistent measurement techniques for better accuracy.' :
                      ' Your measurements are relatively consistent!'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Calculate Mode */}
          {analyzerMode === 'calculate' && (() => {
            const calculateAcceleration = () => {
              const angle = parseFloat(calcAngle);
              const time = parseFloat(calcTime);
              
              if (!angle || !time || time <= 0) {
                alert('Please enter valid values');
                return;
              }

              const angleRad = (angle * Math.PI) / 180;
              const theoreticalAccel = GRAVITY * Math.sin(angleRad);
              const experimentalAccel = (2 * RAMP_LENGTH) / (time * time);
              const error = Math.abs(theoreticalAccel - experimentalAccel) / theoreticalAccel * 100;
              const finalVel = experimentalAccel * time;

              setCalcResult({
                theoreticalAccel,
                experimentalAccel,
                error,
                finalVel
              });
            };

            return (
              <div>
                <p style={{fontSize: '14px', color: '#e9d5ff', marginBottom: '16px'}}>
                  Calculate acceleration from custom angle and time values
                </p>

                <div style={{marginBottom: '12px'}}>
                  <label style={{display: 'block', fontSize: '14px', marginBottom: '6px'}}>
                    Ramp Angle (degrees)
                  </label>
                  <input 
                    type="number"
                    placeholder="e.g., 30"
                    value={calcAngle}
                    onChange={(e) => setCalcAngle(e.target.value)}
                    style={styles.calculatorInput}
                  />
                </div>

                <div style={{marginBottom: '12px'}}>
                  <label style={{display: 'block', fontSize: '14px', marginBottom: '6px'}}>
                    Time (seconds)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="e.g., 0.90"
                    value={calcTime}
                    onChange={(e) => setCalcTime(e.target.value)}
                    style={styles.calculatorInput}
                  />
                </div>

                <button onClick={calculateAcceleration} style={styles.calculateBtn}>
                  Calculate
                </button>

                {calcResult && (
                  <div style={{marginTop: '16px'}}>
                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Theoretical Acceleration</div>
                      <div>
                        <span style={styles.statValue}>{calcResult.theoreticalAccel.toFixed(2)}</span>
                        <span style={styles.statUnit}>m/s²</span>
                      </div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Experimental Acceleration</div>
                      <div>
                        <span style={styles.statValue}>{calcResult.experimentalAccel.toFixed(2)}</span>
                        <span style={styles.statUnit}>m/s²</span>
                      </div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Error</div>
                      <div>
                        <span style={{...styles.statValue, color: calcResult.error < 5 ? '#4ade80' : calcResult.error < 10 ? '#fbbf24' : '#f87171'}}>
                          {calcResult.error.toFixed(2)}
                        </span>
                        <span style={styles.statUnit}>%</span>
                      </div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Final Velocity</div>
                      <div>
                        <span style={styles.statValue}>{calcResult.finalVel.toFixed(2)}</span>
                        <span style={styles.statUnit}>m/s</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {showDataAnalyzer && (
        <div style={{...styles.section, marginTop: '24px'}}>
          <h3 style={{...styles.sectionTitle, textAlign: 'center', color: '#fbbf24'}}>
            🏆 Quest Complete - What's Next?
          </h3>
          <p style={{textAlign: 'center', marginBottom: '20px', color: '#e9d5ff'}}>
            Great work! You've mastered Slopes of Acceleration. Choose your next step:
          </p>
          <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
            <button 
              onClick={() => navigate && navigate('menu')}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🏠 Back to Home
            </button>
            <button 
              onClick={() => onComplete && onComplete()}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '16px',
                background: 'linear-gradient(to right, #a855f7, #ec4899)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)'
              }}
            >
              ➡️ Next Quest
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlopesOfAcceleration;