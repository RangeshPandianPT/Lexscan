let socket: WebSocket | null = null;

export const getSocket = (): WebSocket => {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:8000/ws/feed";
    socket = new WebSocket(SOCKET_URL);

    socket.onopen = () => {
      console.log("Socket connected");
    };

    socket.onclose = () => {
      console.log("Socket disconnected");
    };
  }
  return socket;
};

