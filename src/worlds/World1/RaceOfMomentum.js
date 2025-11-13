import React, { useState, useRef, useEffect } from 'react';

const RaceOfMomentum = ({ onComplete, navigate }) => {
  const [selectedCart, setSelectedCart] = useState('medium');
  const [mass, setMass] = useState(500);
  const [velocity, setVelocity] = useState(8);
  const [isRacing, setIsRacing] = useState(false);
  const [raceResults, setRaceResults] = useState(null);
  const [showCalculation, setShowCalculation] = useState(false);
  const [playerAnswer, setPlayerAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [raceTime, setRaceTime] = useState(0);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState({
    q1: '',
    q2: '',
    q3: '',
    q4: ''
  });
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [showAssessmentResults, setShowAssessmentResults] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const raceDataRef = useRef(null);

  const carts = {
    light: { name: 'Light Racer', baseMass: 300, color: '#60a5fa', icon: '🏎️' },
    medium: { name: 'Standard Kart', baseMass: 500, color: '#f59e0b', icon: '🚗' },
    heavy: { name: 'Heavy Cruiser', baseMass: 800, color: '#ef4444', icon: '🚙' }
  };

  const opponents = [
    { name: 'Swift Shadow', mass: 400, velocity: 10, color: '#8b5cf6' },
    { name: 'Steady Striker', mass: 600, velocity: 8, color: '#10b981' },
    { name: 'Mighty Mass', mass: 900, velocity: 6, color: '#f97316' }
  ];

  const currentCart = carts[selectedCart];
  const totalMass = currentCart.baseMass + mass;
  const momentum = totalMass * velocity;

  const TRACK_LENGTH = 100;
  const FRICTION_COEFFICIENT = 0.02;
  const AIR_RESISTANCE_COEFFICIENT = 0.001;

  // Assessment questions and answers
  const assessmentQuestions = [
    {
      id: 'q1',
      question: 'What is the formula for momentum?',
      options: [
        'p = m × v',
        'p = m ÷ v',
        'p = m + v',
        'p = m - v'
      ],
      correctAnswer: 'p = m × v',
      explanation: 'Momentum (p) is calculated by multiplying mass (m) by velocity (v).'
    },
    {
      id: 'q2',
      question: 'If you double the mass of your cart while keeping velocity constant, what happens to momentum?',
      options: [
        'Momentum doubles',
        'Momentum halves',
        'Momentum stays the same',
        'Momentum quadruples'
      ],
      correctAnswer: 'Momentum doubles',
      explanation: 'Since momentum = mass × velocity, doubling mass while velocity remains constant will double the momentum.'
    },
    {
      id: 'q3',
      question: 'Which cart would have the highest momentum: 500kg at 8m/s or 400kg at 10m/s?',
      options: [
        '500kg at 8m/s (4000 kg·m/s)',
        '400kg at 10m/s (4000 kg·m/s)',
        'They have equal momentum',
        'Cannot determine without more information'
      ],
      correctAnswer: 'They have equal momentum',
      explanation: '500 × 8 = 4000 kg·m/s and 400 × 10 = 4000 kg·m/s. Both have the same momentum.'
    },
    {
      id: 'q4',
      question: 'Why does a heavier cart maintain speed better on the track?',
      options: [
        'Heavier objects have less friction',
        'Momentum helps overcome friction forces',
        'Heavier objects are more aerodynamic',
        'Gravity pulls harder on heavier objects'
      ],
      correctAnswer: 'Momentum helps overcome friction forces',
      explanation: 'Higher momentum means more resistance to changes in motion, helping overcome friction and air resistance.'
    }
  ];

  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const containerWidth = container.clientWidth;
        const isMobile = window.innerWidth <= 768;
        const maxWidth = isMobile ? containerWidth - 20 : Math.min(800, containerWidth - 40);
        canvas.width = maxWidth;
        canvas.height = isMobile ? Math.max(200, maxWidth * 0.5) : Math.max(250, maxWidth * 0.4);
        drawRaceTrack();
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    drawRaceTrack();
  }, [selectedCart, mass, velocity, isRacing, raceResults, raceTime]);

  const calculateFinishTime = (mass, velocity) => {
    const g = 9.8;
    const dt = 0.016;
    let position = 0;
    let v = velocity;
    let time = 0;
    
    while (position < TRACK_LENGTH && time < 30) {
      const frictionForce = FRICTION_COEFFICIENT * mass * g;
      const airResistance = AIR_RESISTANCE_COEFFICIENT * v * v;
      const netForce = -(frictionForce + airResistance);
      const acceleration = netForce / mass;
      
      v += acceleration * dt;
      if (v < 0) v = 0;
      
      position += v * dt;
      time += dt;
    }
    
    return time;
  };

  const drawRaceTrack = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#10b981';
    for (let i = 0; i < 10; i++) {
      const stripeHeight = height / 10;
      if (i % 2 === 0) {
        ctx.fillRect(40, i * stripeHeight, 8, stripeHeight);
      }
    }

    ctx.fillStyle = '#fbbf24';
    const stripeHeight = height / 10;
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(width - 48, i * stripeHeight, 8, stripeHeight);
      }
    }

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    const laneHeight = height / 4;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(50, i * laneHeight);
      ctx.lineTo(width - 50, i * laneHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = `${Math.max(10, width * 0.015)}px Arial`;
    const markerCount = 5;
    for (let i = 1; i < markerCount; i++) {
      const x = 50 + ((width - 100) * i / markerCount);
      const distance = Math.round(TRACK_LENGTH * i / markerCount);
      ctx.fillText(`${distance}m`, x, height - 5);
    }

    ctx.fillStyle = '#10b981';
    ctx.font = `bold ${Math.max(12, width * 0.02)}px Arial`;
    ctx.fillText('START', 10, 20);
    
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('FINISH', width - 55, 20);

    if (isRacing && raceDataRef.current) {
      drawRacingState(ctx, width, height);
    } else if (raceResults) {
      drawFinalPositions(ctx, width, height);
    } else {
      drawStartingPositions(ctx, width, height);
    }
  };

  const drawStartingPositions = (ctx, width, height) => {
    const laneHeight = height / 4;
    const startX = 60;

    drawCart(ctx, startX, laneHeight * 0.5, currentCart.color, currentCart.icon, totalMass, velocity, true);
    
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold ${Math.max(10, width * 0.018)}px Arial`;
    ctx.fillText('YOU', startX - 20, laneHeight * 0.5 - 35);

    opponents.forEach((opponent, index) => {
      const y = laneHeight * (index + 1.5);
      drawCart(ctx, startX, y, opponent.color, '🚗', opponent.mass, opponent.velocity, false);
      
      ctx.fillStyle = opponent.color;
      ctx.font = `${Math.max(9, width * 0.015)}px Arial`;
      ctx.fillText(opponent.name, startX + 40, y - 20);
    });
  };

  const drawRacingState = (ctx, width, height) => {
    const raceData = raceDataRef.current;
    if (!raceData) return;

    const laneHeight = height / 4;
    const trackWidth = width - 100;

    const playerProgress = raceData.player.position / TRACK_LENGTH;
    const playerX = 60 + trackWidth * Math.min(playerProgress, 0.95);
    drawCart(ctx, playerX, laneHeight * 0.5, currentCart.color, currentCart.icon, totalMass, raceData.player.velocity, true);

    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold ${Math.max(10, width * 0.018)}px Arial`;
    ctx.fillText(`${raceData.player.velocity.toFixed(1)} m/s`, playerX, laneHeight * 0.5 - 40);

    opponents.forEach((opponent, index) => {
      const opponentData = raceData.opponents[index];
      const opponentProgress = opponentData.position / TRACK_LENGTH;
      const opponentX = 60 + trackWidth * Math.min(opponentProgress, 0.95);
      const y = laneHeight * (index + 1.5);
      
      drawCart(ctx, opponentX, y, opponent.color, '🚗', opponent.mass, opponentData.velocity, false);
      
      ctx.fillStyle = opponent.color;
      ctx.font = `${Math.max(9, width * 0.015)}px Arial`;
      ctx.fillText(`${opponentData.velocity.toFixed(1)} m/s`, opponentX, y - 30);
    });
  };

  const drawFinalPositions = (ctx, width, height) => {
    if (!raceResults) return;

    const laneHeight = height / 4;
    const finishX = width - 80;

    const allRacers = [
      { name: 'YOU', time: raceResults.playerTime, color: currentCart.color, icon: currentCart.icon, mass: totalMass, isPlayer: true },
      ...opponents.map((opp, idx) => ({
        name: opp.name,
        time: raceResults.opponentTimes[idx],
        color: opp.color,
        icon: '🚗',
        mass: opp.mass,
        isPlayer: false
      }))
    ];

    allRacers.sort((a, b) => a.time - b.time);

    allRacers.forEach((racer, index) => {
      const timeDiff = racer.time - allRacers[0].time;
      const spacing = Math.min(timeDiff * 20, 60);
      const x = finishX - spacing;
      const y = laneHeight * (0.5 + index);
      
      drawCart(ctx, x, y, racer.color, racer.icon, racer.mass, 0, racer.isPlayer);
      
      ctx.fillStyle = index === 0 ? '#fbbf24' : racer.color;
      ctx.font = `bold ${Math.max(12, width * 0.02)}px Arial`;
      ctx.fillText(`#${index + 1}`, x + 35, y - 20);
      
      ctx.font = `${Math.max(10, width * 0.016)}px Arial`;
      ctx.fillText(`${racer.time.toFixed(2)}s`, x + 35, y - 5);
    });
  };

  const shadeColor = (color, percent) => {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
      (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
      .toString(16).slice(1);
  };

  const drawCart = (ctx, x, y, color, icon, mass, velocity, isPlayer) => {
    const isMobile = ctx.canvas.width < 600;
    const cartWidth = isMobile ? Math.max(30, ctx.canvas.width * 0.08) : Math.max(40, ctx.canvas.width * 0.06);
    const cartHeight = cartWidth * 0.6;
    const fontSize = isMobile ? Math.max(14, cartWidth * 0.4) : Math.max(16, cartWidth * 0.35);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x - cartWidth/2 + 2, y + cartHeight/2 + 2, cartWidth, 4);

    const gradient = ctx.createLinearGradient(x - cartWidth/2, y - cartHeight/2, x - cartWidth/2, y + cartHeight/2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, shadeColor(color, -20));
    ctx.fillStyle = gradient;
    ctx.fillRect(x - cartWidth/2, y - cartHeight/2, cartWidth, cartHeight);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = isMobile ? 1.5 : 2;
    ctx.strokeRect(x - cartWidth/2, y - cartHeight/2, cartWidth, cartHeight);

    ctx.fillStyle = '#1f2937';
    const wheelWidth = cartWidth * 0.18;
    const wheelHeight = cartHeight * 0.25;
    
    ctx.fillRect(x - cartWidth/2 + 5, y + cartHeight/2 - 2, wheelWidth, wheelHeight);
    ctx.fillRect(x + cartWidth/2 - wheelWidth - 5, y + cartHeight/2 - 2, wheelWidth, wheelHeight);
    ctx.fillRect(x - cartWidth/2 + 5, y - cartHeight/2 - wheelHeight + 2, wheelWidth, wheelHeight);
    ctx.fillRect(x + cartWidth/2 - wheelWidth - 5, y - cartHeight/2 - wheelHeight + 2, wheelWidth, wheelHeight);

    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - cartWidth/2 + 5, y + cartHeight/2 - 2, wheelWidth, wheelHeight);
    ctx.strokeRect(x + cartWidth/2 - wheelWidth - 5, y + cartHeight/2 - 2, wheelWidth, wheelHeight);

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y);

    ctx.font = `bold ${Math.max(8, fontSize * 0.55)}px Arial`;
    ctx.fillStyle = '#fff';
    ctx.fillText(`${mass}kg`, x, y - cartHeight/2 - (isMobile ? 10 : 12));

    if (isPlayer) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = isMobile ? 2 : 3;
      ctx.strokeRect(x - cartWidth/2 - 4, y - cartHeight/2 - 4, cartWidth + 8, cartHeight + 8);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  };

  const animateRace = (currentTime) => {
    if (!startTimeRef.current) {
      startTimeRef.current = currentTime;
    }

    const elapsedTime = (currentTime - startTimeRef.current) / 1000;
    setRaceTime(elapsedTime);

    const g = 9.8;
    const dt = 0.016;

    const playerData = raceDataRef.current.player;
    const frictionForce = FRICTION_COEFFICIENT * totalMass * g;
    const airResistance = AIR_RESISTANCE_COEFFICIENT * playerData.velocity * playerData.velocity;
    const netForce = -(frictionForce + airResistance);
    const acceleration = netForce / totalMass;
    
    playerData.velocity = Math.max(0, playerData.velocity + acceleration * dt);
    playerData.position = Math.min(TRACK_LENGTH, playerData.position + playerData.velocity * dt);

    raceDataRef.current.opponents.forEach((oppData, idx) => {
      const oppMass = opponents[idx].mass;
      const frictionForce = FRICTION_COEFFICIENT * oppMass * g;
      const airResistance = AIR_RESISTANCE_COEFFICIENT * oppData.velocity * oppData.velocity;
      const netForce = -(frictionForce + airResistance);
      const acceleration = netForce / oppMass;
      
      oppData.velocity = Math.max(0, oppData.velocity + acceleration * dt);
      oppData.position = Math.min(TRACK_LENGTH, oppData.position + oppData.velocity * dt);
    });

    const allFinished = playerData.position >= TRACK_LENGTH &&
      raceDataRef.current.opponents.every(opp => opp.position >= TRACK_LENGTH);

    if (allFinished || elapsedTime > 30) {
      finishRace();
    } else {
      animationFrameRef.current = requestAnimationFrame(animateRace);
    }
  };

  const startRace = () => {
    if (isRacing) return;
    
    setIsRacing(true);
    setRaceResults(null);
    setShowCalculation(false);
    setPlayerAnswer('');
    setAttempts(prev => prev + 1);
    startTimeRef.current = null;
    setRaceTime(0);

    raceDataRef.current = {
      player: {
        position: 0,
        velocity: velocity,
        mass: totalMass
      },
      opponents: opponents.map(opp => ({
        position: 0,
        velocity: opp.velocity,
        mass: opp.mass
      }))
    };

    animationFrameRef.current = requestAnimationFrame(animateRace);
  };

  const finishRace = () => {
    setIsRacing(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const playerTime = calculateFinishTime(totalMass, velocity);
    const opponentTimes = opponents.map(opp => calculateFinishTime(opp.mass, opp.velocity));
    
    const allTimes = [playerTime, ...opponentTimes];
    const sortedTimes = [...allTimes].sort((a, b) => a - b);
    const playerRank = sortedTimes.indexOf(playerTime) + 1;
    
    const results = {
      playerTime,
      opponentTimes,
      playerRank,
      playerMomentum: momentum,
      opponentMomenta: opponents.map(opp => opp.mass * opp.velocity)
    };

    setRaceResults(results);
    setShowCalculation(true);
  };

  const checkAnswer = () => {
    const correctAnswer = momentum;
    const playerAnswerNum = parseFloat(playerAnswer);
    
    const percentError = Math.abs((playerAnswerNum - correctAnswer) / correctAnswer) * 100;
    
    if (percentError < 1) {
      const baseScore = raceResults.playerRank === 1 ? 100 : 
                        raceResults.playerRank === 2 ? 90 : 
                        raceResults.playerRank === 3 ? 80 : 70;
      setScore(baseScore);
    } else {
      setScore(Math.max(0, 50 - Math.floor(percentError)));
    }
  };

  const handleAssessmentAnswer = (questionId, answer) => {
    setAssessmentAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitAssessment = () => {
    let correctCount = 0;
    assessmentQuestions.forEach(question => {
      if (assessmentAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });
    
    const calculatedScore = Math.round((correctCount / assessmentQuestions.length) * 100);
    setAssessmentScore(calculatedScore);
    setShowAssessmentResults(true);
    
    // Mark as completed if score is high enough
    if (calculatedScore >= 80) {
      setAssessmentCompleted(true);
      setScore(prev => Math.max(prev, 85)); // Ensure minimum passing score
    }
  };

  const resetAssessment = () => {
    setAssessmentAnswers({
      q1: '',
      q2: '',
      q3: '',
      q4: ''
    });
    setAssessmentScore(0);
    setShowAssessmentResults(false);
    setShowAssessment(false);
  };

  const handleProceedToNextQuest = () => {
    onComplete(); // This will mark the quest as complete and proceed
  };

  const handleBackToMap = () => {
    navigate('menu'); // Navigate back to the map
  };

  const getRankSuffix = (rank) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      color: 'white',
      padding: isMobile ? '10px' : '20px',
      fontFamily: 'Arial, sans-serif'
    }} ref={containerRef}>
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '20px' : '30px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: isMobile ? '15px' : '25px',
        borderRadius: '15px',
        border: '3px solid #fbbf24'
      }}>
        <button onClick={() => navigate('menu')} style={{
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: isMobile ? '10px 20px' : '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginBottom: '15px',
          fontSize: isMobile ? '0.9rem' : '1rem'
        }}>
          ← Back to Map
        </button>
        <h1 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', margin: '10px 0', color: '#fbbf24' }}>🏁 Race of Momentum</h1>
        <p style={{ fontSize: isMobile ? '1rem' : '1.2rem', opacity: 0.9, lineHeight: '1.4' }}>
          Master the physics of momentum! Adjust mass and velocity to dominate the race track.
        </p>
        
        {/* Assessment Button */}
        <button
          onClick={() => setShowAssessment(true)}
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white',
            border: 'none',
            padding: isMobile ? '10px 20px' : '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '10px',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}
        >
          📝 Take Assessment
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: isMobile ? '10px' : '20px',
        marginBottom: isMobile ? '20px' : '30px',
        background: 'rgba(0, 0, 0, 0.5)',
        padding: isMobile ? '15px' : '20px',
        borderRadius: '12px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '5px' }}>ATTEMPTS</div>
          <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{attempts}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '5px' }}>RACE TIME</div>
          <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{raceTime.toFixed(2)}s</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '5px' }}>MOMENTUM</div>
          <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{momentum}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '5px' }}>SCORE</div>
          <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{score}%</div>
        </div>
      </div>

      {/* Assessment Modal */}
      {showAssessment && (
        <div style={{
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
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '15px',
            border: '3px solid #8b5cf6',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #8b5cf6'
            }}>
              <h2 style={{ color: '#8b5cf6', margin: 0, fontSize: isMobile ? '1.5rem' : '1.8rem' }}>
                📝 Momentum Assessment
              </h2>
              <button
                onClick={resetAssessment}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
            </div>

            {!showAssessmentResults ? (
              <div>
                <p style={{ marginBottom: '25px', fontSize: isMobile ? '0.95rem' : '1.1rem', lineHeight: '1.6' }}>
                  Test your understanding of momentum concepts. Answer all 4 questions to complete the assessment.
                </p>

                {assessmentQuestions.map((q, index) => (
                  <div key={q.id} style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    padding: isMobile ? '15px' : '20px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    border: '2px solid #374151'
                  }}>
                    <h3 style={{ color: '#fbbf24', marginBottom: '15px', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>
                      Question {index + 1}: {q.question}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {q.options.map((option, optIndex) => (
                        <label key={optIndex} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px',
                          background: assessmentAnswers[q.id] === option ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: assessmentAnswers[q.id] === option ? '2px solid #fbbf24' : '2px solid transparent'
                        }}>
                          <input
                            type="radio"
                            name={q.id}
                            value={option}
                            checked={assessmentAnswers[q.id] === option}
                            onChange={(e) => handleAssessmentAnswer(q.id, e.target.value)}
                            style={{ transform: 'scale(1.2)' }}
                          />
                          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={submitAssessment}
                  disabled={Object.values(assessmentAnswers).some(answer => answer === '')}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: Object.values(assessmentAnswers).some(answer => answer === '') 
                      ? '#6b7280' 
                      : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: Object.values(assessmentAnswers).some(answer => answer === '') ? 'not-allowed' : 'pointer',
                    marginTop: '10px'
                  }}
                >
                  Submit Assessment
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  background: assessmentScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  padding: '25px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  marginBottom: '25px',
                  border: assessmentScore >= 80 ? '2px solid #10b981' : '2px solid #ef4444'
                }}>
                  <h3 style={{ 
                    color: assessmentScore >= 80 ? '#10b981' : '#ef4444', 
                    marginBottom: '15px',
                    fontSize: isMobile ? '1.3rem' : '1.5rem'
                  }}>
                    {assessmentScore >= 80 ? '🎉 Excellent Work!' : '📚 Keep Learning!'}
                  </h3>
                  <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
                    {assessmentScore}%
                  </div>
                  <p style={{ marginTop: '10px', fontSize: isMobile ? '0.95rem' : '1.1rem' }}>
                    You got {Math.round(assessmentScore / 25)} out of 4 questions correct
                  </p>
                  
                  {/* Success Message for Passing */}
                  {assessmentScore >= 80 && (
                    <div style={{
                      marginTop: '15px',
                      padding: '12px',
                      background: 'rgba(251, 191, 36, 0.2)',
                      borderRadius: '8px',
                      border: '1px solid #fbbf24'
                    }}>
                      <p style={{ 
                        color: '#fbbf24', 
                        fontWeight: 'bold',
                        margin: 0,
                        fontSize: isMobile ? '0.9rem' : '1rem'
                      }}>
                        ✅ Quest Completed! You've mastered momentum concepts!
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <h4 style={{ color: '#60a5fa', marginBottom: '15px', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>
                    Question Review:
                  </h4>
                  {assessmentQuestions.map((q, index) => {
                    const isCorrect = assessmentAnswers[q.id] === q.correctAnswer;
                    return (
                      <div key={q.id} style={{
                        background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: isMobile ? '15px' : '20px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <span style={{ 
                            color: isCorrect ? '#10b981' : '#ef4444',
                            fontWeight: 'bold',
                            fontSize: isMobile ? '0.9rem' : '1rem'
                          }}>
                            {isCorrect ? '✓' : '✗'} Question {index + 1}
                          </span>
                        </div>
                        <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                          {q.question}
                        </p>
                        <p style={{ marginBottom: '5px', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                          <strong>Your answer:</strong> {assessmentAnswers[q.id]}
                        </p>
                        <p style={{ marginBottom: '5px', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                          <strong>Correct answer:</strong> {q.correctAnswer}
                        </p>
                        <p style={{ 
                          color: '#9ca3af', 
                          fontStyle: 'italic',
                          fontSize: isMobile ? '0.8rem' : '0.9rem',
                          margin: 0
                        }}>
                          {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* UPDATED NAVIGATION BUTTONS */}
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {/* Always show Close button */}
                  <button
                    onClick={resetAssessment}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      minWidth: '120px'
                    }}
                  >
                    Close
                  </button>
                  
                  {/* Show Retry button if failed */}
                  {assessmentScore < 80 && (
                    <button
                      onClick={() => {
                        setShowAssessmentResults(false);
                        setAssessmentAnswers({
                          q1: '',
                          q2: '',
                          q3: '',
                          q4: ''
                        });
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        minWidth: '120px'
                      }}
                    >
                      Retry Assessment
                    </button>
                  )}
                  
                  {/* Show Proceed and Map buttons if passed */}
                  {assessmentScore >= 80 && (
                    <>
                      <button
                        onClick={handleBackToMap}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          minWidth: '120px'
                        }}
                      >
                        Back to Map
                      </button>
                      <button
                        onClick={handleProceedToNextQuest}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          minWidth: '120px'
                        }}
                      >
                        Next Quest →
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '20px' : '30px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Race Track - Show first on mobile */}
        <div style={{
          order: isMobile ? 1 : 2,
          flex: isMobile ? 'none' : 1,
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '15px',
          padding: isMobile ? '10px' : '20px',
          border: '2px solid #374151',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          minHeight: isMobile ? '200px' : 'auto'
        }}>
          <canvas ref={canvasRef} style={{ borderRadius: '10px', maxWidth: '100%', width: '100%' }} />
          
          {isRacing && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.8)',
              padding: isMobile ? '10px 15px' : '15px 25px',
              borderRadius: '10px',
              border: '2px solid #fbbf24'
            }}>
              <div style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 'bold', color: '#fbbf24' }}>
                {raceTime.toFixed(2)}s
              </div>
              <div style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', color: '#9ca3af' }}>Race Time</div>
            </div>
          )}
        </div>

        {/* Controls - Show second on mobile */}
        <div style={{
          order: isMobile ? 2 : 1,
          width: isMobile ? '100%' : '400px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: isMobile ? '20px' : '25px',
          borderRadius: '15px',
          border: '2px solid #8b5cf6'
        }}>
          <h3 style={{ color: '#fbbf24', marginBottom: '15px', textAlign: 'center', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>Choose Your Racer</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
            {Object.entries(carts).map(([key, cart]) => (
              <button
                key={key}
                onClick={() => setSelectedCart(key)}
                disabled={isRacing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: isMobile ? '12px' : '15px',
                  background: selectedCart === key ? 'rgba(251, 191, 36, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                  border: selectedCart === key ? '2px solid #fbbf24' : '2px solid #374151',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              >
                <span style={{ fontSize: isMobile ? '1.3rem' : '1.5rem' }}>{cart.icon}</span>
                <span style={{ flex: 1, fontWeight: 'bold', color: '#fbbf24' }}>{cart.name}</span>
                <span style={{ color: '#9ca3af', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>{cart.baseMass} kg</span>
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#fbbf24', fontSize: isMobile ? '0.95rem' : '1rem' }}>
              Additional Mass: +{mass} kg
            </label>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              disabled={isRacing}
              style={{ width: '100%', height: isMobile ? '6px' : '8px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#9ca3af', marginTop: '5px' }}>
              <span>+0 kg</span>
              <span>+500 kg</span>
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#fbbf24', fontSize: isMobile ? '0.95rem' : '1rem' }}>
              Launch Velocity: {velocity} m/s
            </label>
            <input
              type="range"
              min="5"
              max="15"
              step="0.5"
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              disabled={isRacing}
              style={{ width: '100%', height: isMobile ? '6px' : '8px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#9ca3af', marginTop: '5px' }}>
              <span>5 m/s</span>
              <span>15 m/s</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            padding: isMobile ? '15px' : '20px',
            borderRadius: '10px',
            borderLeft: '4px solid #10b981',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: '#10b981', marginBottom: '15px', fontSize: isMobile ? '1rem' : '1.1rem' }}>Current Momentum</h4>
            <div style={{
              fontFamily: 'monospace',
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              color: '#fbbf24',
              textAlign: 'center',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '5px',
              wordBreak: 'break-word'
            }}>
              p = {totalMass} × {velocity} = <strong>{momentum}</strong>
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            padding: isMobile ? '15px' : '20px',
            borderRadius: '10px',
            borderLeft: '4px solid #ef4444',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: '#ef4444', marginBottom: '15px', fontSize: isMobile ? '1rem' : '1.1rem' }}>Competitors</h4>
            {opponents.map((opponent, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                borderBottom: index < opponents.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: opponent.color }}></div>
                <span style={{ fontWeight: 'bold', color: '#fbbf24', minWidth: isMobile ? '80px' : '100px' }}>{opponent.name}</span>
                <span style={{ color: '#9ca3af' }}>{opponent.mass}kg × {opponent.velocity}m/s</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>= {opponent.mass * opponent.velocity}</span>
              </div>
            ))}
          </div>

          <button
            onClick={startRace}
            disabled={isRacing}
            style={{
              width: '100%',
              padding: isMobile ? '14px' : '15px',
              background: isRacing ? '#6b7280' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: 'bold',
              cursor: isRacing ? 'not-allowed' : 'pointer',
              minHeight: '44px'
            }}
          >
            {isRacing ? '🏁 Racing...' : '🏁 Start Race!'}
          </button>
        </div>
      </div>

      {raceResults && showCalculation && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          padding: isMobile ? '20px' : '30px',
          borderRadius: '15px',
          border: '2px solid #10b981',
          marginTop: isMobile ? '20px' : '30px',
          maxWidth: '1400px',
          margin: `${isMobile ? '20px' : '30px'} auto 0`
        }}>
          <h3 style={{ color: '#10b981', textAlign: 'center', marginBottom: '25px', fontSize: isMobile ? '1.5rem' : '1.8rem' }}>
            Race Results
          </h3>

          <div style={{
            background: raceResults.playerRank === 1 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(30, 41, 59, 0.6)',
            padding: isMobile ? '20px' : '25px',
            borderRadius: '10px',
            border: raceResults.playerRank === 1 ? '2px solid #fbbf24' : '2px solid #374151'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <span style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 'bold', color: '#fbbf24' }}>
                {raceResults.playerRank}{getRankSuffix(raceResults.playerRank)} Place
              </span>
              {raceResults.playerRank === 1 && (
                <span style={{
                  background: '#fbbf24',
                  color: '#000',
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                  🏆 Winner!
                </span>
              )}
              <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', color: '#10b981' }}>
                Time: {raceResults.playerTime.toFixed(2)}s
              </span>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#60a5fa', marginBottom: '20px', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>Physics Analysis:</h4>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: isMobile ? '15px' : '20px',
                borderRadius: '10px',
                marginBottom: '15px'
              }}>
                <div style={{ marginBottom: '10px', fontSize: isMobile ? '1rem' : '1.1rem' }}>
                  <strong style={{ color: '#fbbf24' }}>Your Cart:</strong>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: isMobile ? '0.85rem' : '0.95rem', lineHeight: '1.8' }}>
                  • Mass: {totalMass} kg<br/>
                  • Initial Velocity: {velocity} m/s<br/>
                  • Momentum: {raceResults.playerMomentum} kg·m/s<br/>
                  • Finish Time: {raceResults.playerTime.toFixed(2)} seconds<br/>
                  • Average Speed: {(TRACK_LENGTH / raceResults.playerTime).toFixed(2)} m/s
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {opponents.map((opponent, index) => (
                  <div key={index} style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: isMobile ? '12px' : '15px',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    fontSize: isMobile ? '0.85rem' : '0.95rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: opponent.color }}></div>
                      <span style={{ fontWeight: 'bold', color: opponent.color }}>{opponent.name}</span>
                    </div>
                    <div style={{ fontFamily: 'monospace', color: '#9ca3af' }}>
                      {opponent.mass}kg × {opponent.velocity}m/s = {raceResults.opponentMomenta[index]}
                    </div>
                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                      {raceResults.opponentTimes[index].toFixed(2)}s
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: isMobile ? '15px' : '20px',
              borderRadius: '10px',
              borderLeft: '4px solid #f59e0b',
              marginBottom: '20px'
            }}>
              <h4 style={{ color: '#f59e0b', marginBottom: '15px', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>Prove Your Understanding:</h4>
              <p style={{ marginBottom: '15px', fontSize: isMobile ? '0.9rem' : '1rem' }}>Calculate your cart's momentum:</p>
              <div style={{
                fontFamily: 'monospace',
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                color: '#fbbf24',
                textAlign: 'center',
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '5px',
                marginBottom: '15px',
                wordBreak: 'break-word'
              }}>
                p = m × v = ?
                {/* p = {totalMass} × {velocity} = ? */}
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px' }}>
                <input
                  type="number"
                  value={playerAnswer}
                  onChange={(e) => setPlayerAnswer(e.target.value)}
                  placeholder="Enter momentum"
                  style={{
                    flex: 1,
                    padding: '12px 15px',
                    border: '2px solid #374151',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    fontSize: isMobile ? '16px' : '1.1rem',
                    fontFamily: 'monospace',
                    minHeight: '44px'
                  }}
                />
                <button
                  onClick={checkAnswer}
                  style={{
                    padding: '12px 25px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    minHeight: '44px'
                  }}
                >
                  Check Answer
                </button>
              </div>

              {score > 0 && (
                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  background: score >= 85 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: isMobile ? '1.1rem' : '1.2rem',
                  fontWeight: 'bold',
                  color: score >= 85 ? '#10b981' : '#ef4444'
                }}>
                  {score >= 85 ? '✓ Correct! ' : '✗ '} Score: {score}%
                </div>
              )}
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              padding: isMobile ? '15px' : '20px',
              borderRadius: '10px',
              borderLeft: '4px solid #8b5cf6'
            }}>
              <h4 style={{ color: '#8b5cf6', marginBottom: '15px', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>Physics Principles:</h4>
              <ul style={{ listStyle: 'none', padding: 0, lineHeight: '1.8', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                <li>• <strong>Momentum (p) = mass (m) × velocity (v)</strong></li>
                <li>• Higher momentum = harder to stop</li>
                <li>• <strong>Friction</strong> slows based on mass</li>
                <li>• <strong>Air resistance</strong> increases with v²</li>
                <li>• Heavier carts maintain speed better</li>
                <li>• Balance mass and velocity for best results</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* UPDATED MOMENTUM MASTER SCREEN WITH NAVIGATION BUTTONS */}
      {score >= 85 && (
        <div style={{
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
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            padding: isMobile ? '30px 20px' : '40px',
            borderRadius: '20px',
            textAlign: 'center',
            border: '4px solid #fbbf24',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{ fontSize: isMobile ? '3rem' : '4rem', marginBottom: '20px' }}>⚡</div>
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '15px' }}>Momentum Master!</h2>
            <p style={{ fontSize: isMobile ? '1rem' : '1.2rem', marginBottom: '25px', opacity: 0.9 }}>
              You've mastered the relationship between mass, velocity, and momentum!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '20px' : '40px', flexWrap: 'wrap', marginBottom: '30px' }}>
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '5px' }}>Final Score</div>
                <div style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{score}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '5px' }}>Races Completed</div>
                <div style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{attempts}</div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('menu')}
                style={{
                  padding: isMobile ? '12px 20px' : '15px 25px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minWidth: isMobile ? '100%' : '140px'
                }}
              >
                Back to Map
              </button>
              <button
                onClick={onComplete}
                style={{
                  padding: isMobile ? '12px 20px' : '15px 25px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minWidth: isMobile ? '100%' : '140px'
                }}
              >
                Next Quest →
              </button>
            </div>

            {/* Optional: Close button for the modal */}
            <button
              onClick={() => setScore(0)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close This Message
            </button>
          </div>
        </div>
      )}

      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        padding: isMobile ? '20px' : '30px',
        borderRadius: '15px',
        border: '2px solid #10b981',
        maxWidth: '1200px',
        margin: `${isMobile ? '20px' : '30px'} auto 0`
      }}>
        <h3 style={{ textAlign: 'center', color: '#10b981', marginBottom: '25px', fontSize: isMobile ? '1.3rem' : '1.5rem' }}>
          Learning Objectives
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {[
            { icon: '⚖️', text: 'Understand momentum formula: p = m × v' },
            { icon: '🚗', text: 'Explore mass-velocity tradeoffs in motion' },
            { icon: '📊', text: 'Calculate and compare momentum values' },
            { icon: '🎯', text: 'Apply physics concepts to predict outcomes' }
          ].map((objective, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              background: 'rgba(30, 41, 59, 0.6)',
              padding: isMobile ? '15px' : '20px',
              borderRadius: '10px',
              borderLeft: '4px solid #fbbf24'
            }}>
              <span style={{ fontSize: isMobile ? '1.3rem' : '1.5rem' }}>{objective.icon}</span>
              <p style={{ margin: 0, fontSize: isMobile ? '0.9rem' : '0.95rem', lineHeight: '1.4' }}>{objective.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RaceOfMomentum;