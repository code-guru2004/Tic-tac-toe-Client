import { io } from "socket.io-client";

// This will use the URL from .env file
const socket = io(import.meta.env.VITE_BACKEND_URL);

export default socket;
