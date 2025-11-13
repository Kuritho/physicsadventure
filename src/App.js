import React, { useState, useEffect } from 'react';
import MainMenu from './components/MainMenu';
import SlopesOfAcceleration from './worlds/World1/SlopesOfAcceleration';
import AuthScreen from './components/AuthScreen';
import TowerOfGravity from './worlds/World1/TowerOfGravity';
import RisingOrb from './worlds/World1/RisingOrb';
import ArchersChallenge from './worlds/World1/ArchersChallenge';
import AimForTheStars from './worlds/World1/AimForTheStars';
import RaceOfMomentum from './worlds/World1/RaceOfMomentum';
import SkyboundMomentumRally from './worlds/World1/SkyboundMomentumRally';
import OperationCushionImpact from './worlds/World1/OperationCushionImpact';
import BounceOrBreak from './worlds/World1/BounceOrBreak';
import TheMomentumBeast from './worlds/World1/TheMomentumBeast';
import './App.css';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [currentUser, setCurrentUser] = useState(null);
  const [gameProgress, setGameProgress] = useState({
    world1: { 
      quest1: false, 
      quest2: false, 
      quest3: false, 
      quest4: false, 
      quest5: false,
      quest6: false,
      quest7: false,
      quest8: false,
      quest9: false,
      boss: false 
    },
    world2: { 
      quest1: false, 
      quest2: false, 
      quest3: false, 
      quest4: false, 
      quest5: false,
      quest6: false,
      quest7: false,
      quest8: false,
      quest9: false,
      boss: false 
    },
    world3: { 
      quest1: false, 
      quest2: false, 
      quest3: false, 
      quest4: false, 
      quest5: false,
      quest6: false,
      quest7: false,
      quest8: false,
      quest9: false,
      boss: false 
    },
    world4: { 
      quest1: false, 
      quest2: false, 
      quest3: false, 
      quest4: false, 
      quest5: false,
      quest6: false,
      quest7: false,
      quest8: false,
      quest9: false,
      boss: false 
    }
  });

  // Load user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      loadUserProgress(user.username);
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      saveUserProgress(currentUser.username, gameProgress);
    }
  }, [gameProgress, currentUser]);

  const loadUserProgress = (username) => {
    const savedProgress = localStorage.getItem(`progress_${username}`);
    if (savedProgress) {
      setGameProgress(JSON.parse(savedProgress));
    }
  };

  const saveUserProgress = (username, progress) => {
    localStorage.setItem(`progress_${username}`, JSON.stringify(progress));
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    loadUserProgress(user.username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentScreen('menu');
  };

  const handleRestartGame = () => {
    if (currentUser && window.confirm('Are you sure you want to restart your game? All progress will be reset!')) {
      const resetProgress = {
        world1: { 
          quest1: false, quest2: false, quest3: false, quest4: false, quest5: false,
          quest6: false, quest7: false, quest8: false, quest9: false, boss: false 
        },
        world2: { 
          quest1: false, quest2: false, quest3: false, quest4: false, quest5: false,
          quest6: false, quest7: false, quest8: false, quest9: false, boss: false 
        },
        world3: { 
          quest1: false, quest2: false, quest3: false, quest4: false, quest5: false,
          quest6: false, quest7: false, quest8: false, quest9: false, boss: false 
        },
        world4: { 
          quest1: false, quest2: false, quest3: false, quest4: false, quest5: false,
          quest6: false, quest7: false, quest8: false, quest9: false, boss: false 
        }
      };
      setGameProgress(resetProgress);
      saveUserProgress(currentUser.username, resetProgress);
      setCurrentScreen('menu');
    }
  };

  const updateProgress = (world, quest) => {
    setGameProgress(prev => ({
      ...prev,
      [world]: { ...prev[world], [quest]: true }
    }));
  };

  const navigate = (screen) => {
    setCurrentScreen(screen);
  };

  // Show auth screen if no user is logged in
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {currentScreen === 'menu' && (
        <MainMenu 
          navigate={navigate} 
          gameProgress={gameProgress}
          currentUser={currentUser}
          onLogout={handleLogout}
          onRestartGame={handleRestartGame}
        />
      )}
      
      {currentScreen === 'world1-quest1' && (
        <SlopesOfAcceleration 
          onComplete={() => {
            updateProgress('world1', 'quest1');
            navigate('menu');
          }}
          navigate={navigate}
        />
      )}

      {currentScreen === 'world1-quest2' && (
        <TowerOfGravity 
          onComplete={() => {
            updateProgress('world1', 'quest2');
            navigate('menu');
          }}
          navigate={navigate}
        />
      )}

      {currentScreen === 'world1-quest3' && (
        <RisingOrb 
          onComplete={() => {
            updateProgress('world1', 'quest3');
            navigate('menu');
          }}
          navigate={navigate}
        />
      )}

      {currentScreen === 'world1-quest4' && (
        <ArchersChallenge 
          onComplete={() => {
            updateProgress('world1', 'quest4');
            navigate('menu');
          }}
          navigate={navigate}
        />
      )}

      {currentScreen === 'world1-quest5' && (
        <AimForTheStars 
          onComplete={() => {
            updateProgress('world1', 'quest5');
            navigate('menu');
          }}
          navigate={navigate}
        />
      )}

      {currentScreen === 'world1-quest6' && (
        <RaceOfMomentum 
          onComplete={() => {
            updateProgress('world1', 'quest6');
            navigate('menu');
          }}
          navigate={navigate}
        />
      )}

      {currentScreen === 'world1-quest7' && (
        <SkyboundMomentumRally 
          onComplete={() => {
            updateProgress('world1', 'quest7');
            navigate('menu');
          }}
          navigate={navigate}
        />
      )}

      {currentScreen === 'world1-quest8' && (
        <OperationCushionImpact 
          onComplete={() => {
            updateProgress('world1', 'quest8');
            navigate('menu');
          }}
          navigate={navigate}
        />
      )}

      {currentScreen === 'world1-quest9' && (
        <BounceOrBreak 
          onComplete={() => {
            updateProgress('world1', 'quest9');
            navigate('menu');
          }}
          navigate={navigate}
        />
      )}

      {currentScreen === 'world1-boss' && (
        <TheMomentumBeast 
          onComplete={() => {
            updateProgress('world1', 'boss');
            navigate('menu');
          }}
          navigate={navigate}
        />
      )}
    </div>
  );
};

export default App;