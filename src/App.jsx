import React, { useEffect, useState } from 'react';
import socket from './socket';
import './App.css';

const emptyBoard = Array(9).fill("");

function App() {
  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState("X");
  const [startingTurn, setStartingTurn] = useState("X");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  const [isGameReady, setIsGameReady] = useState(false); // ⬅️ New state

  const handleJoin = () => {
    if (!roomId) return;
    socket.emit('joinRoom', roomId);
    setJoined(true);
  };

  const handleClick = (index) => {
    if (!isGameReady) return; // ⬅️ Block moves until both players joined
    if (winner || board[index] !== "") return;
    if (turn !== playerSymbol) return;

    const newBoard = [...board];
    newBoard[index] = turn;
    const nextTurn = turn === "X" ? "O" : "X";
    setBoard(newBoard);
    setTurn(nextTurn);
    socket.emit('makeMove', { roomId, board: newBoard, turn: nextTurn });
    checkWinner(newBoard);
  };

  const checkWinner = (b) => {
    const wins = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];
    for (let i = 0; i < wins.length; i++) {
      const [a, b1, c] = wins[i];
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
        setWinner(b[a]);
        setWinningLine(i);
        return;
      }
    }
    if (!b.includes("")) {
      setWinner("Tie");
      setWinningLine(null);
    }
  };

  const restartGame = () => {
    const nextStartingTurn = startingTurn === "X" ? "O" : "X";
    setStartingTurn(nextStartingTurn);
    setBoard(emptyBoard);
    setTurn(nextStartingTurn);
    setWinner(null);
    setWinningLine(null);
    socket.emit('restartGame', roomId);
  };

  useEffect(() => {
    socket.on('playerJoined', ({ playerSymbol }) => {
      setPlayerSymbol(playerSymbol);
    });

    socket.on('updateGame', ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
      setIsGameReady(true); // ⬅️ Game is ready only when updateGame is triggered (2 players joined)
      checkWinner(board);
    });

    socket.on('gameRestarted', () => {
      const nextStartingTurn = startingTurn === "X" ? "O" : "X";
      setStartingTurn(nextStartingTurn);
      setBoard(emptyBoard);
      setTurn(nextStartingTurn);
      setWinner(null);
      setWinningLine(null);
    });

    socket.on('roomFull', () => {
      alert("Room is full. Only 2 players allowed.");
      setJoined(false);
    });

    return () => {
      socket.off();
    };
  }, [startingTurn]);

  return (
    <div className="container">
      <svg className="background-svg" viewBox="0 0 1440 320">
        <path fill="#c3ddff" fillOpacity="1" d="M0,96L80,101.3C160,107,320,117,480,138.7C640,160,800,192,960,202.7C1120,213,1280,203,1360,197.3L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
      </svg>

      {!joined ? (
        <>
          <h2>Join Tic Tac Toe</h2>
          <input
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={handleJoin}>Join Game</button>
        </>
      ) : (
        <>
          <h2>You are Player: {playerSymbol}</h2>
          <h3>Current Turn: {turn}</h3>
          {!isGameReady && <p>Waiting for another player to join...</p>}
          {winner && (
            <div className="status">
              {winner === "Tie" ? "It's a Tie!" : `${winner} Wins!`}
            </div>
          )}
          <div className="board-wrapper">
            <div className="board">
              {board.map((cell, idx) => (
                <div
                  key={idx}
                  className={`cell ${cell === 'X' ? 'x' : cell === 'O' ? 'o' : ''}`}
                  onClick={() => handleClick(idx)}
                >
                  {cell}
                </div>
              ))}
              {winner && winningLine !== null && (
                <div className={`win-line line-${winningLine}`}></div>
              )}
            </div>
          </div>
          {winner && (
            <button onClick={restartGame} style={{ marginTop: '20px' }}>
              Restart Game
            </button>
          )}
        </>
      )}

      {joined && (
        <div className="room-info">
          <div>Room ID: <strong>{roomId}</strong></div>
          <div>You are: <strong>{playerSymbol}</strong></div>
        </div>
      )}
    </div>
  );
}

export default App;