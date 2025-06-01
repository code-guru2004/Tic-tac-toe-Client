import React, { useEffect, useState } from 'react';
import socket from './socket';
import './App.css';

const emptyBoard = Array(9).fill("");

function App() {
  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState("X");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [winner, setWinner] = useState(null);

  const handleJoin = () => {
    if (!roomId) return;
    socket.emit('joinRoom', roomId);
    setJoined(true);
  };

  const handleClick = (index) => {
    if (winner || board[index] !== "") return;
    if (turn !== playerSymbol) return;

    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);
    const nextTurn = turn === "X" ? "O" : "X";
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
    for (let [a,b1,c] of wins) {
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
        setWinner(b[a]);
        return;
      }
    }
    if (!b.includes("")) {
      setWinner("Tie");
    }
  };

  const restartGame = () => {
    setBoard(emptyBoard);
    setTurn("X");
    setWinner(null);
    socket.emit('restartGame', roomId);
  };

  useEffect(() => {
    socket.on('playerJoined', ({ playerSymbol }) => {
      setPlayerSymbol(playerSymbol);
    });

    socket.on('updateGame', ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
      checkWinner(board);
    });

    socket.on('gameRestarted', () => {
      setBoard(emptyBoard);
      setTurn("X");
      setWinner(null);
    });

    socket.on('roomFull', () => {
      alert("Room is full. Only 2 players allowed.");
      setJoined(false);
    });

    return () => {
      socket.off();
    };
  }, []);

  return (
    <div className="container">
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
          {winner && (
            <div className="status">
              {winner === "Tie" ? "It's a Tie!" : `${winner} Wins!`}
            </div>
          )}
          <div className="board">
            {board.map((cell, idx) => (
              <div key={idx} className="cell" onClick={() => handleClick(idx)}>
                {cell}
              </div>
            ))}
          </div>
          {winner && <button onClick={restartGame} style={{ marginTop: '20px' }}>Restart Game</button>}
        </>
      )}
    </div>
  );
}

export default App;
