import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';


interface ClientInfo {
  ws: WebSocket;
  userId: string;
}

const clients = new Map<string, ClientInfo>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('New client connected');
    let currentUserId: string ="";

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data);
        
        switch (message.type) {
          case 'auth':
            currentUserId = message.userId;
            clients.set(message.userId, { ws, userId: message.userId });
            console.log(`User ${message.userId} authenticated`);
            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'Connected successfully'
            }));
            break;

          case 'typing':
            const receiverClient = clients.get(message.receiverId);
            if (receiverClient && receiverClient.ws.readyState === WebSocket.OPEN) {
              receiverClient.ws.send(JSON.stringify({
                type: 'typing',
                senderId: currentUserId,
                isTyping: message.isTyping
              }));
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      if (currentUserId) {
        clients.delete(currentUserId);
        console.log(`User ${currentUserId} disconnected`);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}

export function sendMessageToClient(userId: string, message: any) {
  const client = clients.get(userId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}



