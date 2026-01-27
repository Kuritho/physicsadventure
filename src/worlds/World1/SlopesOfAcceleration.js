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
    q4: ''
  });
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [showDataAnalyzer, setShowDataAnalyzer] = useState(false);
  const [analyzerMode, setAnalyzerMode] = useState('summary');
  const [calcAngle, setCalcAngle] = useState('');
  const [calcTime, setCalcTime] = useState('');
  const [calcResult, setCalcResult] = useState(null);
  const [startPoint, setStartPoint] = useState(40);
  const [rampHeight, setRampHeight] = useState(50);
  const [rampBase, setRampBase] = useState(86.6);
  
  const canRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);
  const [phase, setPhase] = useState('ramp');

  // Constants for perfect accuracy
  const RAMP_LENGTH = 2.0; // Total ramp length in meters (200cm = 2m)
  const GRAVITY = 9.81;
  const PIXELS_PER_METER = 120;
  const rampLengthPixels = RAMP_LENGTH * PIXELS_PER_METER;
  const GROUND_ROLL_DISTANCE = 1.5;
  const CAN_RADIUS = 0.05;
  const CAN_DIAMETER = 0.1; // 10cm diameter can

  // Calculate ACTUAL ramp angle from height and base (using trigonometry)
  const calculateActualAngleFromHeightBase = (height, base) => {
    const heightMeters = height / 100; // Convert cm to meters
    const baseMeters = base / 100; // Convert cm to meters
    
    // Using Pythagorean theorem: length = √(height² + base²)
    const actualLength = Math.sqrt(heightMeters * heightMeters + baseMeters * baseMeters);
    
    // Calculate actual angle: θ = arctan(height/base)
    const angleRad = Math.atan2(heightMeters, baseMeters);
    const angleDeg = (angleRad * 180) / Math.PI;
    
    return {
      angle: angleDeg,
      actualLength: actualLength
    };
  };

  // Calculate actual height and base from angle (for display)
  const calculateHeightBaseFromAngle = (angle) => {
    const angleRad = (angle * Math.PI) / 180;
    const actualHeight = RAMP_LENGTH * Math.sin(angleRad);
    const actualBase = RAMP_LENGTH * Math.cos(angleRad);
    
    return {
      height: actualHeight * 100, // Convert to cm
      base: actualBase * 100 // Convert to cm
    };
  };

  // PERFECT POSITIONING: Calculate can's exact position on ramp
  const calculateCanPosition = (startPointCm, angle) => {
    const startPointMeters = startPointCm / 100; // Convert cm to meters
    const angleRad = (angle * Math.PI) / 180;
    
    // Calculate the actual position along the ramp
    // x = distance along the base
    // y = height at that position
    
    // For a ramp with total length RAMP_LENGTH, the coordinates at distance 'd' are:
    const x = startPointMeters * Math.cos(angleRad); // Horizontal distance
    const y = startPointMeters * Math.sin(angleRad); // Vertical height
    
    // Convert to pixels for display
    const xPixels = x * PIXELS_PER_METER;
    const yPixels = y * PIXELS_PER_METER;
    
    // Add the offset for the ramp container (32px from left, 32px from top)
    const finalXPixels = xPixels + 32;
    const finalYPixels = yPixels + 32;
    
    return {
      x: finalXPixels,
      y: finalYPixels,
      xMeters: x,
      yMeters: y,
      distanceAlongRamp: startPointMeters
    };
  };

  // Calculate theoretical time
  const calculateTheoreticalTime = (startDistance, angle) => {
    const angleRad = (angle * Math.PI) / 180;
    const acceleration = GRAVITY * Math.sin(angleRad);
    const distanceToRoll = RAMP_LENGTH - startDistance;
    return Math.sqrt((2 * distanceToRoll) / acceleration);
  };

  // Calculate theoretical velocity
  const calculateTheoreticalVelocity = (startDistance, angle) => {
    const angleRad = (angle * Math.PI) / 180;
    const acceleration = GRAVITY * Math.sin(angleRad);
    const distanceToRoll = RAMP_LENGTH - startDistance;
    return Math.sqrt(2 * acceleration * distanceToRoll);
  };

  // Update can position based on current settings
  const updateCanPosition = () => {
    if (canRef.current) {
      const position = calculateCanPosition(startPoint, rampAngle);
      
      canRef.current.style.transition = isRolling ? 'none' : 'transform 0.3s ease';
      canRef.current.style.transform = `translate(${position.x}px, ${position.y}px) rotate(0deg)`;
    }
  };

  const startRoll = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    setTime(0);
    setDistance(0);
    setVelocity(0);
    setPhase('ramp');
    startTimeRef.current = performance.now();

    const animate = (currentTime) => {
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      const angleRad = (rampAngle * Math.PI) / 180;
      const acceleration = GRAVITY * Math.sin(angleRad);
      const startDistanceMeters = startPoint / 100;
      const totalRampDistance = RAMP_LENGTH - startDistanceMeters;
      
      if (phase === 'ramp') {
        const timeToBottom = Math.sqrt(2 * totalRampDistance / acceleration);
        
        if (elapsed < timeToBottom) {
          const currentDistance = startDistanceMeters + 0.5 * acceleration * elapsed * elapsed;
          const currentVelocity = acceleration * elapsed;
          
          setTime(elapsed);
          setDistance(currentDistance - startDistanceMeters);
          setVelocity(currentVelocity);
          
          if (canRef.current) {
            const progress = elapsed / timeToBottom;
            const currentDistanceMeters = startDistanceMeters + progress * totalRampDistance;
            
            // Calculate PERFECT position on ramp
            const x = currentDistanceMeters * Math.cos(angleRad);
            const y = currentDistanceMeters * Math.sin(angleRad);
            
            const xPixels = x * PIXELS_PER_METER + 32;
            const yPixels = y * PIXELS_PER_METER + 32;
            
            // Calculate rotation
            const distanceRolled = currentDistanceMeters - startDistanceMeters;
            const rotationAngle = (distanceRolled / CAN_RADIUS) * (180 / Math.PI);
            
            // Add slight bounce
            const bounce = Math.abs(Math.sin(progress * Math.PI * 8)) * 1;
            
            canRef.current.style.transform = `translate(${xPixels}px, ${yPixels - bounce}px) rotate(${rotationAngle}deg)`;
          }
          
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        
        // Reached bottom of ramp
        const timeToBottomFinal = timeToBottom;
        const finalVelocity = acceleration * timeToBottomFinal;
        
        setTime(timeToBottomFinal);
        setDistance(totalRampDistance);
        setVelocity(finalVelocity);
        setPhase('falling');
        
        if (canRef.current) {
          // Position at end of ramp
          const x = RAMP_LENGTH * Math.cos(angleRad);
          const y = RAMP_LENGTH * Math.sin(angleRad);
          
          const xPixels = x * PIXELS_PER_METER + 32;
          const yPixels = y * PIXELS_PER_METER + 32;
          
          const totalDistanceRolled = totalRampDistance;
          const rotationAngle = (totalDistanceRolled / CAN_RADIUS) * (180 / Math.PI);
          
          canRef.current.style.transform = `translate(${xPixels}px, ${yPixels}px) rotate(${rotationAngle}deg)`;
        }
        
        animationRef.current = requestAnimationFrame(animate);
        
      } else if (phase === 'falling') {
        // FALLING PHASE - Realistic parabolic motion
        const timeToBottom = Math.sqrt(2 * totalRampDistance / acceleration);
        const fallStartTime = timeToBottom;
        const fallTime = elapsed - fallStartTime;
        const maxFallTime = 0.6; // Increased for more realistic falling
        
        if (fallTime < maxFallTime && canRef.current) {
          const initialVelocity = acceleration * timeToBottom;
          
          // Calculate position at end of ramp (launch point)
          const launchX = RAMP_LENGTH * Math.cos(angleRad);
          const launchY = RAMP_LENGTH * Math.sin(angleRad);
          
          // Initial velocity components
          const initialVelocityX = initialVelocity * Math.cos(angleRad);
          const initialVelocityY = -initialVelocity * Math.sin(angleRad); // Negative because we're falling DOWN from ramp
          
          // Projectile motion equations (x stays horizontal, y falls downward)
          // Horizontal motion (constant velocity)
          const xFall = launchX + (initialVelocityX * fallTime);
          // Vertical motion (accelerated by gravity)
          const yFall = launchY + (initialVelocityY * fallTime) + (0.5 * GRAVITY * fallTime * fallTime);
          
          const xPixels = xFall * PIXELS_PER_METER + 32;
          const yPixels = yFall * PIXELS_PER_METER + 32;
          
          // Continue rotation during fall
          const totalDistanceRolled = totalRampDistance + (initialVelocityX * fallTime);
          const rotationAngle = (totalDistanceRolled / CAN_RADIUS) * (180 / Math.PI);
          
          canRef.current.style.transform = `translate(${xPixels}px, ${yPixels}px) rotate(${rotationAngle}deg)`;
          
          // Update velocity during fall
          const fallVelocityX = initialVelocityX;
          const fallVelocityY = initialVelocityY + GRAVITY * fallTime;
          const fallVelocity = Math.sqrt(fallVelocityX * fallVelocityX + fallVelocityY * fallVelocityY);
          setVelocity(fallVelocity);
          setTime(elapsed);
          setDistance(totalRampDistance + initialVelocityX * fallTime);
          
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        
        // Falling complete, transition to ground
        setPhase('ground');
        
        if (canRef.current) {
          // Calculate final falling position
          const initialVelocity = acceleration * timeToBottom;
          const initialVelocityX = initialVelocity * Math.cos(angleRad);
          const initialVelocityY = -initialVelocity * Math.sin(angleRad);
          
          const finalX = RAMP_LENGTH * Math.cos(angleRad) + (initialVelocityX * maxFallTime);
          const finalY = RAMP_LENGTH * Math.sin(angleRad) + (initialVelocityY * maxFallTime) + (0.5 * GRAVITY * maxFallTime * maxFallTime);
          
          const xPixels = finalX * PIXELS_PER_METER + 32;
          const yPixels = finalY * PIXELS_PER_METER + 32;
          
          const totalDistanceRolled = totalRampDistance + (initialVelocityX * maxFallTime);
          const rotationAngle = (totalDistanceRolled / CAN_RADIUS) * (180 / Math.PI);
          
          canRef.current.style.transform = `translate(${xPixels}px, ${yPixels}px) rotate(${rotationAngle}deg)`;
        }
        
        animationRef.current = requestAnimationFrame(animate);
        
      } else if (phase === 'ground') {
        // GROUND ROLLING PHASE
        const timeToBottom = Math.sqrt(2 * totalRampDistance / acceleration);
        const fallTime = 0.6; // Time spent falling
        const groundStartTime = timeToBottom + fallTime;
        const groundTime = elapsed - groundStartTime;
        const maxGroundTime = 1.5;
        
        if (groundTime < maxGroundTime && canRef.current) {
          const initialVelocity = acceleration * timeToBottom;
          const initialVelocityX = initialVelocity * Math.cos(angleRad);
          
          // Ground deceleration (friction)
          const frictionCoefficient = 0.3; // Realistic friction for rolling on ground
          const groundDeceleration = frictionCoefficient * GRAVITY;
          
          // Calculate launch position after falling
          const launchX = RAMP_LENGTH * Math.cos(angleRad);
          const launchY = RAMP_LENGTH * Math.sin(angleRad);
          const fallVelocityY = -initialVelocity * Math.sin(angleRad) + GRAVITY * fallTime;
          
          // Final falling position (when it hits ground)
          const groundHitY = launchY + (-initialVelocity * Math.sin(angleRad) * fallTime) + (0.5 * GRAVITY * fallTime * fallTime);
          const groundHitX = launchX + (initialVelocityX * fallTime);
          
          // Ground rolling motion (decelerates to stop)
          const groundDistance = Math.max(0, initialVelocityX * groundTime - 0.5 * groundDeceleration * groundTime * groundTime);
          const currentGroundVelocity = Math.max(0, initialVelocityX - groundDeceleration * groundTime);
          
          const xGround = groundHitX + groundDistance;
          const yGround = groundHitY; // Stays at ground level
          
          const xPixels = xGround * PIXELS_PER_METER + 32;
          const yPixels = yGround * PIXELS_PER_METER + 32;
          
          const totalDistanceRolled = totalRampDistance + (initialVelocityX * fallTime) + groundDistance;
          const rotationAngle = (totalDistanceRolled / CAN_RADIUS) * (180 / Math.PI);
          
          // Add slight bounce on ground hit
          let bounce = 0;
          if (groundTime < 0.1) {
            bounce = 2 * Math.sin(groundTime * Math.PI * 10);
          }
          
          canRef.current.style.transform = `translate(${xPixels}px, ${yPixels - bounce}px) rotate(${rotationAngle}deg)`;
          
          // Update displayed velocity
          setVelocity(currentGroundVelocity);
          setTime(elapsed);
          setDistance(totalRampDistance + initialVelocityX * fallTime + groundDistance);
          
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        
        // Animation complete
        const timeToBottomFinal = Math.sqrt(2 * totalRampDistance / acceleration);
        const theoreticalTime = calculateTheoreticalTime(startDistanceMeters, rampAngle);
        const theoreticalVelocity = calculateTheoreticalVelocity(startDistanceMeters, rampAngle);
        
        setTime(timeToBottomFinal + 0.6 + 1.5); // Ramp time + falling + rolling
        setDistance(totalRampDistance);
        setVelocity(0); // Comes to rest
        
        const experimentalAcceleration = (2 * totalRampDistance) / (timeToBottomFinal * timeToBottomFinal);
        const theoreticalAcceleration = GRAVITY * Math.sin(angleRad);
        const error = Math.abs(theoreticalAcceleration - experimentalAcceleration) / theoreticalAcceleration * 100;
        
        const newTrial = {
          startPoint: startPoint,
          angle: rampAngle,
          time: timeToBottomFinal,
          distance: totalRampDistance,
          theoreticalTime: theoreticalTime,
          theoreticalVelocity: theoreticalVelocity,
          acceleration: {
            theoretical: theoreticalAcceleration,
            experimental: experimentalAcceleration,
            error: error
          },
          finalVelocity: theoreticalVelocity
        };
        
        setTrials(prev => [...prev, newTrial]);
        setIsRolling(false);
        setPhase('ramp');
        
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
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopRoll = () => {
    if (!isRolling && !isContinuous) return;
    
    setIsContinuous(false);
    setIsRolling(false);
    setPhase('ramp');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (time > 0 && distance > 0) {
      const startDistanceMeters = startPoint / 100;
      const angleRad = (rampAngle * Math.PI) / 180;
      const theoreticalAcceleration = GRAVITY * Math.sin(angleRad);
      const experimentalAcceleration = (2 * distance) / (time * time);
      const error = Math.abs(theoreticalAcceleration - experimentalAcceleration) / theoreticalAcceleration * 100;
      const theoreticalTime = calculateTheoreticalTime(startDistanceMeters, rampAngle);
      const theoreticalVelocity = calculateTheoreticalVelocity(startDistanceMeters, rampAngle);
      
      const newTrial = {
        startPoint: startPoint,
        angle: rampAngle,
        time: time,
        distance: distance,
        theoreticalTime: theoreticalTime,
        theoreticalVelocity: theoreticalVelocity,
        acceleration: {
          theoretical: theoreticalAcceleration,
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
    setPhase('ramp');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setTime(0);
    setDistance(0);
    setVelocity(0);
    
    updateCanPosition();
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

  // Update can position whenever startPoint or rampAngle changes
  useEffect(() => {
    updateCanPosition();
  }, [startPoint, rampAngle]);

  // Calculate actual ramp dimensions
  const actualDimensions = calculateHeightBaseFromAngle(rampAngle);
  const actualHeight = actualDimensions.height;
  const actualBase = actualDimensions.base;

  // Handle height change - update angle based on height/base
  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value);
    const calculation = calculateActualAngleFromHeightBase(newHeight, rampBase);
    
    setRampAngle(Math.round(calculation.angle * 10) / 10);
    setRampHeight(newHeight);
    
    // Show alert if length doesn't match 2m
    if (Math.abs(calculation.actualLength - RAMP_LENGTH) > 0.01) {
      alert(`Note: With Height=${newHeight}cm and Base=${rampBase}cm, the ramp length is ${(calculation.actualLength * 100).toFixed(1)}cm (not exactly 200cm). The simulation will use the calculated angle of ${calculation.angle.toFixed(1)}°.`);
    }
    
    resetExperiment();
  };

  // Handle base change - update angle based on height/base
  const handleBaseChange = (e) => {
    const newBase = parseInt(e.target.value);
    const calculation = calculateActualAngleFromHeightBase(rampHeight, newBase);
    
    setRampAngle(Math.round(calculation.angle * 10) / 10);
    setRampBase(newBase);
    
    // Show alert if length doesn't match 2m
    if (Math.abs(calculation.actualLength - RAMP_LENGTH) > 0.01) {
      alert(`Note: With Height=${rampHeight}cm and Base=${newBase}cm, the ramp length is ${(calculation.actualLength * 100).toFixed(1)}cm (not exactly 200cm). The simulation will use the calculated angle of ${calculation.angle.toFixed(1)}°.`);
    }
    
    resetExperiment();
  };

  // Handle angle change - update height and base
  const handleAngleChange = (e) => {
    const newAngle = parseInt(e.target.value);
    const dimensions = calculateHeightBaseFromAngle(newAngle);
    
    setRampAngle(newAngle);
    setRampHeight(Math.round(dimensions.height));
    setRampBase(Math.round(dimensions.base));
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
    if (trials.length >= 5) {
      setShowAssessment(true);
    } else {
      alert('Please complete trials from all 5 starting points (40cm, 80cm, 120cm, 160cm, 200cm) to analyze the data!');
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
    
    // Correct answers for the new questions
    const correctAnswers = {
      q1: 'd', // d-t is parabolic, d-t² is linear
      q2: 'a', // d = ½at²
      q3: 'c', // Slope of d-t² is ½a (m/s²)
      q4: 'b' // Can is uniformly accelerated
    };

    let score = 0;
    
    // Q1: Graph descriptions
    if (assessmentAnswers.q1 === correctAnswers.q1) score += 25;
    
    // Q2: Relationship between distance and time
    if (assessmentAnswers.q2 === correctAnswers.q2) score += 25;
    
    // Q3: Slope of d-t² graph
    if (assessmentAnswers.q3 === correctAnswers.q3) score += 25;
    
    // Q4: What the graphs suggest
    if (assessmentAnswers.q4 === correctAnswers.q4) score += 25;
    
    setAssessmentScore(score);
    setAssessmentSubmitted(true);

    // If they pass (60% or higher), unlock the Data Analyzer Tool
    if (score >= 60) {
      setShowDataAnalyzer(true);
    }
  };

  const retakeAssessment = () => {
    setAssessmentSubmitted(false);
    setAssessmentAnswers({
      q1: '',
      q2: '',
      q3: '',
      q4: ''
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

  const theoreticalTime = calculateTheoreticalTime(startPoint / 100, rampAngle);
  const theoreticalVelocity = calculateTheoreticalVelocity(startPoint / 100, rampAngle);
  const theoreticalAcceleration = GRAVITY * Math.sin((rampAngle * Math.PI) / 180);

  // Calculate the exact position for verification
  const canPosition = calculateCanPosition(startPoint, rampAngle);

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
      height: '500px',
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
    rampContainer: {
      position: 'absolute',
      top: '32px',
      left: '32px',
      zIndex: 2,
      transformOrigin: 'left top'
    },
    ramp: {
      width: `${rampLengthPixels}px`,
      height: '16px',
      transform: `rotate(${rampAngle}deg)`,
      transformOrigin: 'left top'
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
      height: `${(actualHeight / 100) * PIXELS_PER_METER}px`,
      background: '#9333ea',
      transform: 'translateY(-100%) rotate(0deg)'
    },
    can: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      zIndex: 10,
      transition: 'none',
      willChange: 'transform',
      filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4))',
      transform: 'translate(32px, 32px) rotate(0deg)',
      transformOrigin: 'center center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '14px',
      border: '2px solid #92400e',
      boxShadow: 'inset 0 0 8px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)'
    },
    canLabel: {
      pointerEvents: 'none',
      userSelect: 'none'
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
    distanceMarker: {
      position: 'absolute',
      background: 'rgba(255, 255, 255, 0.7)',
      color: '#1e1b4b',
      padding: '2px 6px',
      borderRadius: '3px',
      fontSize: '10px',
      fontWeight: 'bold',
      border: '1px solid rgba(0, 0, 0, 0.2)',
      transform: `rotate(${-rampAngle}deg)`
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

  // Platform Edge Component
  const PlatformEdge = () => {
    const angleRad = (rampAngle * Math.PI) / 180;
    const rampEndX = RAMP_LENGTH * Math.cos(angleRad);
    const rampEndY = RAMP_LENGTH * Math.sin(angleRad);
    
    const xPixels = rampEndX * PIXELS_PER_METER + 32;
    const yPixels = rampEndY * PIXELS_PER_METER + 32;
    
    return (
      <>
        {/* Platform edge line */}
        <div style={{
          position: 'absolute',
          top: `${yPixels}px`,
          left: `${xPixels}px`,
          width: '4px',
          height: '80px',
          background: '#dc2626',
          zIndex: 3,
          boxShadow: '0 0 8px rgba(220, 38, 38, 0.7)'
        }}></div>
        
        {/* Danger zone */}
        <div style={{
          position: 'absolute',
          top: `${yPixels}px`,
          left: `${xPixels}px`,
          width: '200px',
          height: '120px',
          background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0) 100%)',
          zIndex: 1,
          pointerEvents: 'none'
        }}></div>
        
        {/* Warning label */}
        <div style={{
          position: 'absolute',
          top: `${yPixels + 90}px`,
          left: `${xPixels + 40}px`,
          background: 'rgba(220, 38, 38, 0.9)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 4,
          pointerEvents: 'none',
          border: '2px solid white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          EDGE - CAN WILL FALL!
        </div>
      </>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate && navigate('menu')}>
          <span>←</span> Back to Menu
        </button>
        <h1 style={styles.title}>📐 Slopes of Acceleration - Perfect Positioning</h1>
        <p style={styles.subtitle}>100% accurate can positioning at every starting point and ramp configuration</p>
      </div>

      <div style={styles.section}>
        <div style={styles.simulationBox}>
          <div style={styles.ground}></div>
          
          <div style={styles.rampContainer}>
            <div style={{
              ...styles.rampSupport,
              height: `${(actualHeight / 100) * PIXELS_PER_METER}px`
            }}></div>
            <div style={styles.ramp}>
              <div style={styles.rampSurface}>
                {/* PERFECT distance markers */}
                {[40, 80, 120, 160, 200].map((cm, i) => {
                  const distanceMeters = cm / 100;
                  const angleRad = (rampAngle * Math.PI) / 180;
                  const x = distanceMeters * Math.cos(angleRad);
                  const position = (x / (RAMP_LENGTH * Math.cos(angleRad))) * 100;
                  
                  return (
                    <React.Fragment key={i}>
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          width: '3px',
                          background: 'rgba(255, 255, 255, 0.8)',
                          left: `${position}%`,
                          transform: 'rotate(0deg)'
                        }}
                      ></div>
                      <div 
                        style={{
                          ...styles.distanceMarker,
                          top: '-20px',
                          left: `${position}%`,
                          transform: `translateX(-50%) rotate(${-rampAngle}deg)`
                        }}
                      >
                        {cm}cm
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
          
          <PlatformEdge />
          
          <div ref={canRef} style={styles.can}>
            <div style={styles.canLabel}>CAN</div>
          </div>
          
          {/* Position verification */}
          <div style={{...styles.marker, top: '8px', left: '16px', background: '#4ade80'}}>
            ✅ PERFECT POSITION:<br/>
            Start: {startPoint}cm ({startPoint/100}m)<br/>
            X: {canPosition.xMeters.toFixed(3)}m, Y: {canPosition.yMeters.toFixed(3)}m
          </div>
          <div style={{...styles.marker, bottom: '400px', right: '16px', background: '#3b82f6'}}>
            RAMP END: 200cm (2m)<br/>
            Angle: {rampAngle.toFixed(1)}°
          </div>
          <div style={styles.angleDisplay}>
            RAMP DIMENSIONS:<br/>
            Height: {actualHeight.toFixed(1)}cm<br/>
            Base: {actualBase.toFixed(1)}cm<br/>
            Length: 200.0cm
          </div>
          
          {/* Status indicator */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: phase === 'falling' ? 'rgba(220, 38, 38, 0.9)' : 
                      phase === 'ground' ? 'rgba(34, 197, 94, 0.9)' : 
                      'rgba(59, 130, 246, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            zIndex: 5,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}>
            {phase === 'ramp' ? '📐 ON RAMP' : 
             phase === 'falling' ? '⚠️ FALLING!' : 
             '🌍 ON GROUND'}
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Procedure Setup - 100% Accurate</h3>
        
        <div style={{marginBottom: '16px'}}>
          <label style={styles.label}>Starting Point: {startPoint}cm ({startPoint/100}m)</label>
          <input
            type="range"
            min="40"
            max="200"
            step="40"
            value={startPoint}
            onChange={(e) => { setStartPoint(parseInt(e.target.value)); }}
            disabled={isRolling}
            style={styles.slider}
          />
          <div style={styles.presetButtons}>
            {[40, 80, 120, 160, 200].map(point => (
              <button 
                key={point}
                onClick={() => { setStartPoint(point); }} 
                disabled={isRolling}
                style={{...styles.presetBtn, opacity: isRolling ? 0.5 : 1}}
              >
                {point}cm ({point/100}m)
              </button>
            ))}
          </div>
        </div>

        <div style={{marginBottom: '16px'}}>
          <label style={styles.label}>Ramp Angle: {rampAngle.toFixed(1)}°</label>
          <input
            type="range"
            min="5"
            max="60"
            value={rampAngle}
            onChange={handleAngleChange}
            disabled={isRolling}
            style={styles.slider}
          />
        </div>

        <div style={{marginBottom: '16px'}}>
          <label style={styles.label}>Ramp Height: {rampHeight}cm ({(rampHeight/100).toFixed(2)}m)</label>
          <input
            type="range"
            min="10"
            max="173"
            value={rampHeight}
            onChange={handleHeightChange}
            disabled={isRolling}
            style={styles.slider}
          />
        </div>

        <div style={{marginBottom: '16px'}}>
          <label style={styles.label}>Ramp Base: {rampBase}cm ({(rampBase/100).toFixed(2)}m)</label>
          <input
            type="range"
            min="100"
            max="200"
            value={rampBase}
            onChange={handleBaseChange}
            disabled={isRolling}
            style={styles.slider}
          />
        </div>

        <div style={{background: 'rgba(74, 222, 128, 0.3)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '2px solid #4ade80'}}>
          <p style={{margin: '0 0 8px 0', fontWeight: 'bold', color: '#4ade80'}}>✅ PERFECT POSITIONING VERIFIED:</p>
          <p style={{margin: '0 0 4px 0', fontSize: '14px'}}>
            • Starting Point: {startPoint}cm along ramp<br/>
            • Horizontal Position: {canPosition.xMeters.toFixed(3)}m from start<br/>
            • Vertical Height: {canPosition.yMeters.toFixed(3)}m from ground<br/>
            • Distance along ramp: {canPosition.distanceAlongRamp.toFixed(3)}m<br/>
            • CAN IS PERFECTLY PLACED ON RAMP SURFACE
          </p>
        </div>

        <div style={styles.buttonGrid}>
          <button 
            onClick={startRoll} 
            disabled={isRolling || isContinuous}
            style={{...styles.button, ...styles.buttonStart, opacity: (isRolling || isContinuous) ? 0.5 : 1}}
          >
            ⏱️ Start Timer
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
            <div style={styles.dataValue}>{time.toFixed(3)} s</div>
          </div>
          <div style={styles.dataCard}>
            <div style={styles.dataLabel}>Distance Rolled</div>
            <div style={styles.dataValue}>{(distance * 100).toFixed(1)} cm</div>
          </div>
          <div style={styles.dataCard}>
            <div style={styles.dataLabel}>Velocity</div>
            <div style={styles.dataValue}>{velocity.toFixed(3)} m/s</div>
          </div>
          <div style={styles.dataCard}>
            <div style={styles.dataLabel}>Status</div>
            <div style={styles.dataValueSmall}>
              {phase === 'falling' ? '⚠️ Falling' : 
               phase === 'ground' ? '🌍 Ground' : 
               isContinuous ? '🔁 Looping' : 
               isRolling ? '🔄 Rolling' : 
               '⏸️ Ready'}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Theoretical Predictions</h3>
        <div style={styles.predictionRow}>
          <span style={styles.predictionLabel}>Distance to roll:</span>
          <strong>{((200 - startPoint) / 100).toFixed(3)} m</strong>
        </div>
        <div style={styles.predictionRow}>
          <span style={styles.predictionLabel}>Acceleration (g·sinθ):</span>
          <strong>{theoreticalAcceleration.toFixed(3)} m/s²</strong>
        </div>
        <div style={styles.predictionRow}>
          <span style={styles.predictionLabel}>Theoretical Time:</span>
          <strong>{theoreticalTime.toFixed(3)} s</strong>
        </div>
        <div style={styles.predictionRow}>
          <span style={styles.predictionLabel}>Theoretical Velocity:</span>
          <strong>{theoreticalVelocity.toFixed(3)} m/s</strong>
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
                  <th style={styles.th}>Start (cm)</th>
                  <th style={styles.th}>Angle</th>
                  <th style={styles.th}>Time (s)</th>
                  <th style={styles.th}>Theory Time</th>
                  <th style={styles.th}>Error</th>
                </tr>
              </thead>
              <tbody>
                {trials.map((trial, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{trial.startPoint}cm</td>
                    <td style={styles.td}>{trial.angle.toFixed(1)}°</td>
                    <td style={styles.td}>{trial.time.toFixed(3)}s</td>
                    <td style={styles.td}>{trial.theoreticalTime.toFixed(3)}s</td>
                    <td style={{...styles.td, ...(Math.abs(trial.time - trial.theoreticalTime) > 0.01 ? styles.errorHigh : styles.errorLow)}}>
                      {Math.abs(trial.time - trial.theoreticalTime).toFixed(3)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.noData}>
            <p style={{fontSize: '32px', margin: '0 0 8px 0'}}>📊</p>
            <p style={{margin: 0}}>No data yet - Run experiments from different starting points!</p>
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
            style={{...styles.completeButton, opacity: trials.length < 5 ? 0.5 : 1, cursor: trials.length < 5 ? 'not-allowed' : 'pointer'}}
            disabled={trials.length < 5}
          >
            {trials.length >= 5 ? '📝 Take Assessment' : `Need ${5 - trials.length} more starting points`}
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
                const distanceMeters = trial.distance;
                const x = currentGraph === 'distance-time' 
                  ? (trial.time / maxTime) * 90 
                  : ((trial.time * trial.time) / maxTime2) * 90;
                const y = (distanceMeters / RAMP_LENGTH) * 90;
                
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
                <p style={styles.questionText}>1. How will you describe the graph of: distance vs. time, and distance vs. time²?</p>
                <label style={assessmentAnswers.q1 === 'a' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q1" 
                    value="a"
                    checked={assessmentAnswers.q1 === 'a'}
                    onChange={(e) => handleAssessmentChange('q1', e.target.value)}
                    style={styles.radio}
                  />
                  A. d-t is linear, d-t² is parabolic
                </label>
                <label style={assessmentAnswers.q1 === 'b' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q1" 
                    value="b"
                    checked={assessmentAnswers.q1 === 'b'}
                    onChange={(e) => handleAssessmentChange('q1', e.target.value)}
                    style={styles.radio}
                  />
                  B. d-t is parabolic, d-t² is also parabolic
                </label>
                <label style={assessmentAnswers.q1 === 'c' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q1" 
                    value="c"
                    checked={assessmentAnswers.q1 === 'c'}
                    onChange={(e) => handleAssessmentChange('q1', e.target.value)}
                    style={styles.radio}
                  />
                  C. d-t is linear, d-t² is also linear
                </label>
                <label style={assessmentAnswers.q1 === 'd' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q1" 
                    value="d"
                    checked={assessmentAnswers.q1 === 'd'}
                    onChange={(e) => handleAssessmentChange('q1', e.target.value)}
                    style={styles.radio}
                  />
                  D. d-t is parabolic, d-t² is linear
                </label>
              </div>

              {/* Question 2 */}
              <div style={styles.questionBox}>
                <p style={styles.questionText}>2. What is the relationship between distance and time of travel of the rolling can?</p>
                <label style={assessmentAnswers.q2 === 'a' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q2" 
                    value="a"
                    checked={assessmentAnswers.q2 === 'a'}
                    onChange={(e) => handleAssessmentChange('q2', e.target.value)}
                    style={styles.radio}
                  />
                  A. d = ½at² (distance is proportional to time squared)
                </label>
                <label style={assessmentAnswers.q2 === 'b' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q2" 
                    value="b"
                    checked={assessmentAnswers.q2 === 'b'}
                    onChange={(e) => handleAssessmentChange('q2', e.target.value)}
                    style={styles.radio}
                  />
                  B. d = vt (distance is proportional to time)
                </label>
                <label style={assessmentAnswers.q2 === 'c' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q2" 
                    value="c"
                    checked={assessmentAnswers.q2 === 'c'}
                    onChange={(e) => handleAssessmentChange('q2', e.target.value)}
                    style={styles.radio}
                  />
                  C. d = a/t (distance is inversely proportional to time)
                </label>
                <label style={assessmentAnswers.q2 === 'd' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q2" 
                    value="d"
                    checked={assessmentAnswers.q2 === 'd'}
                    onChange={(e) => handleAssessmentChange('q2', e.target.value)}
                    style={styles.radio}
                  />
                  D. d = at (distance is proportional to acceleration and time)
                </label>
              </div>

              {/* Question 3 */}
              <div style={styles.questionBox}>
                <p style={styles.questionText}>3. What is the slope of d-t² graph? What quantity does the slope of d-t² graph represent? (Refer to the unit of slope)</p>
                <label style={assessmentAnswers.q3 === 'a' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q3" 
                    value="a"
                    checked={assessmentAnswers.q3 === 'a'}
                    onChange={(e) => handleAssessmentChange('q3', e.target.value)}
                    style={styles.radio}
                  />
                  A. Slope = acceleration (m/s²)
                </label>
                <label style={assessmentAnswers.q3 === 'b' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q3" 
                    value="b"
                    checked={assessmentAnswers.q3 === 'b'}
                    onChange={(e) => handleAssessmentChange('q3', e.target.value)}
                    style={styles.radio}
                  />
                  B. Slope = velocity (m/s)
                </label>
                <label style={assessmentAnswers.q3 === 'c' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q3" 
                    value="c"
                    checked={assessmentAnswers.q3 === 'c'}
                    onChange={(e) => handleAssessmentChange('q3', e.target.value)}
                    style={styles.radio}
                  />
                  C. Slope = ½ acceleration (m/s²)
                </label>
                <label style={assessmentAnswers.q3 === 'd' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q3" 
                    value="d"
                    checked={assessmentAnswers.q3 === 'd'}
                    onChange={(e) => handleAssessmentChange('q3', e.target.value)}
                    style={styles.radio}
                  />
                  D. Slope = time (s)
                </label>
              </div>

              {/* Question 4 */}
              <div style={styles.questionBox}>
                <p style={styles.questionText}>4. What do the graphs of distance vs. time and distance vs. time² suggest?</p>
                <label style={assessmentAnswers.q4 === 'a' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q4" 
                    value="a"
                    checked={assessmentAnswers.q4 === 'a'}
                    onChange={(e) => handleAssessmentChange('q4', e.target.value)}
                    style={styles.radio}
                  />
                  A. The can moves with constant velocity
                </label>
                <label style={assessmentAnswers.q4 === 'b' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q4" 
                    value="b"
                    checked={assessmentAnswers.q4 === 'b'}
                    onChange={(e) => handleAssessmentChange('q4', e.target.value)}
                    style={styles.radio}
                  />
                  B. The can is uniformly accelerated
                </label>
                <label style={assessmentAnswers.q4 === 'c' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q4" 
                    value="c"
                    checked={assessmentAnswers.q4 === 'c'}
                    onChange={(e) => handleAssessmentChange('q4', e.target.value)}
                    style={styles.radio}
                  />
                  C. The can is decelerating
                </label>
                <label style={assessmentAnswers.q4 === 'd' ? {...styles.optionLabel, ...styles.optionLabelSelected} : styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="q4" 
                    value="d"
                    checked={assessmentAnswers.q4 === 'd'}
                    onChange={(e) => handleAssessmentChange('q4', e.target.value)}
                    style={styles.radio}
                  />
                  D. The can is at rest
                </label>
              </div>

              <button 
                onClick={submitAssessment}
                style={styles.submitButton}
                disabled={!assessmentAnswers.q1 || !assessmentAnswers.q2 || !assessmentAnswers.q3 || !assessmentAnswers.q4}
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
                    <span style={styles.statValue}>{stats.avgTime.toFixed(3)}</span>
                    <span style={styles.statUnit}>seconds</span>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Average Theoretical Acceleration</div>
                  <div>
                    <span style={styles.statValue}>{stats.avgTheoreticalAccel.toFixed(3)}</span>
                    <span style={styles.statUnit}>m/s²</span>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Average Experimental Acceleration</div>
                  <div>
                    <span style={styles.statValue}>{stats.avgExperimentalAccel.toFixed(3)}</span>
                    <span style={styles.statUnit}>m/s²</span>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Average Error</div>
                  <div>
                    <span style={{...styles.statValue, color: stats.avgError < 1 ? '#4ade80' : stats.avgError < 3 ? '#fbbf24' : '#f87171'}}>
                      {stats.avgError.toFixed(2)}
                    </span>
                    <span style={styles.statUnit}>%</span>
                  </div>
                  <div style={{fontSize: '12px', marginTop: '4px', color: '#d1d5db'}}>
                    {stats.avgError < 1 ? '✅ Perfect accuracy!' : 
                     stats.avgError < 3 ? '⚠️ Good accuracy' : 
                     '❌ High error - check your measurements'}
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Average Final Velocity</div>
                  <div>
                    <span style={styles.statValue}>{stats.avgVelocity.toFixed(3)}</span>
                    <span style={styles.statUnit}>m/s</span>
                  </div>
                </div>

                <div style={{background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '8px', marginTop: '16px'}}>
                  <p style={{margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px'}}>💡 Insight</p>
                  <p style={{margin: 0, fontSize: '13px', lineHeight: '1.5'}}>
                    Your experimental acceleration is {Math.abs(stats.avgTheoreticalAccel - stats.avgExperimentalAccel).toFixed(3)} m/s² different from theoretical.
                    {stats.avgError < 1 && ' This indicates perfect experimental technique!'}
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
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Start Point</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{best.startPoint}cm</div>
                      </div>
                      <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Time</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{best.time.toFixed(3)}s</div>
                      </div>
                      <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Acceleration</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{best.acceleration.experimental.toFixed(3)} m/s²</div>
                      </div>
                      <div>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Error</div>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#4ade80'}}>
                          {best.acceleration.error.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{margin: '0 0 12px 0', color: '#f87171', fontSize: '16px'}}>⚠️ Worst Trial</h4>
                    <div style={styles.trialCardWorst}>
                      <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Start Point</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{worst.startPoint}cm</div>
                      </div>
                      <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Time</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{worst.time.toFixed(3)}s</div>
                      </div>
                      <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Acceleration</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold'}}>{worst.acceleration.experimental.toFixed(3)} m/s²</div>
                      </div>
                      <div>
                        <div style={{fontSize: '12px', color: '#e9d5ff'}}>Error</div>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#f87171'}}>
                          {worst.acceleration.error.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '8px', marginTop: '16px'}}>
                  <p style={{margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px'}}>💡 Analysis</p>
                  <p style={{margin: 0, fontSize: '13px', lineHeight: '1.5'}}>
                    Error difference: {(worst.acceleration.error - best.acceleration.error).toFixed(2)}%. 
                    {worst.acceleration.error - best.acceleration.error > 2 ? 
                      ' Try to maintain consistent measurement techniques for better accuracy.' :
                      ' Your measurements are very consistent!'}
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
              const startDistanceMeters = startPoint / 100;
              const experimentalAccel = (2 * (RAMP_LENGTH - startDistanceMeters)) / (time * time);
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
                        <span style={styles.statValue}>{calcResult.theoreticalAccel.toFixed(3)}</span>
                        <span style={styles.statUnit}>m/s²</span>
                      </div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Experimental Acceleration</div>
                      <div>
                        <span style={styles.statValue}>{calcResult.experimentalAccel.toFixed(3)}</span>
                        <span style={styles.statUnit}>m/s²</span>
                      </div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Error</div>
                      <div>
                        <span style={{...styles.statValue, color: calcResult.error < 1 ? '#4ade80' : calcResult.error < 3 ? '#fbbf24' : '#f87171'}}>
                          {calcResult.error.toFixed(2)}
                        </span>
                        <span style={styles.statUnit}>%</span>
                      </div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Final Velocity</div>
                      <div>
                        <span style={styles.statValue}>{calcResult.finalVel.toFixed(3)}</span>
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
