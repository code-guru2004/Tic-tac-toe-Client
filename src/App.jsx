import React, { useEffect, useState } from "react";
import socket from "./socket";
import "./App.css";

function App() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("X");

  const handleJoin = () => {
    if (roomId.trim() !== "") {
      socket.emit("join_room", roomId);
      setJoined(true);
    }
  };

  const handleClick = (index) => {
    if (board[index]) return;
    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);
    socket.emit("make_move", { roomId, board: newBoard, turn: turn === "X" ? "O" : "X" });
    setTurn(turn === "X" ? "O" : "X");
  };

  useEffect(() => {
    socket.on("receive_move", ({ board: newBoard, turn }) => {
      setBoard(newBoard);
      setTurn(turn);
    });

    return () => {
      socket.off("receive_move");
    };
  }, []);

  return (
    <div className="container">
      {!joined ? (
        <div className="join">
          <input
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={handleJoin}>Join Room</button>
        </div>
      ) : (
        <div className="game">
          <h2>Room: {roomId}</h2>
          <div className="board">
            {board.map((cell, idx) => (
              <div key={idx} className="cell" onClick={() => handleClick(idx)}>
                {cell}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
