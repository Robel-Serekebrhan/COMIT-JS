import { useState, useRef, useEffect } from 'react'

/*import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg' */

import './App.css'

const GAME_DURATION_SECONDS = 5;

function App() {
  //useState 
  const [clicks, setClicks] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);

  //useRef
  const timerId = useRef(null);
  const finalScore = useRef(0);

  //fuction to start the game
  const startGame = () =>{
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(GAME_DURATION_SECONDS);
    setClicks(0);
    finalScore.current = 0;

    //clear any existint timer to prevernt multiple timer
    if(timerId.current){
      clearInterval(timerId.current);
      }
      //start count down
      timerId.current = setInterval(() =>
        {
          setTimeLeft((prevTime) => {
            if(prevTime <=1){
              setGameOver(true);
              setGameStarted(false);
              clearInterval(timerId.current!);
              finalScore.current = clicks
              return 0;
            }
            return prevTime - 1;
          });
          }, 1000);
          };
    //funtion to hundle click botton
    const handleClick = () =>{
      if(gameStarted && !gameOver){
        setClicks((prevClicks) =>prevClicks +1);
    }
    };
    //useffect for cleanup when component unmounts
    useEffect(() =>{
      return () =>{
        if(timerId.current){
          clearInterval(timerId.current);
        }
    };
    }, []); //empty dependancy arrary  means this runs once onmount and once on unmount


 }

    
  


  return (
    <>

    <div className='click-speed-test-app'>


      <h1>click speed test</h1>

      <div className='status-display'>
        {gameStarted && 
        <p className='timer'>time left : {timeLeft}s</p>}
      <p className='clicks'> clicks: {clicks}</p>
      </div>

      <div className='button-container'>

      <button onClick={startGme} disabled={gameStarted} className='start-button'>
        {gameStarted ? "game in progress..." : "Start test"}
        </button>

      <button onClick={handleButtonClick} disabled={!gameStarted} 
      className='click-button'>
      click me!

      </button>

      </div>
      {gameOver && (
        <div className='final-score'>
          <h2>Game over!</h2>
          <p>your final score is : <strong>{finalScore.current} clicks</strong></p>
          <button onClick={startGame} className='start-again-button'>play again</button>
        </div>
      )}
    
    </div>


    </>

      
    
  );
}

export default App
