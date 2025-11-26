// src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { socketService } from "../services/socketService";
import { NotificationData, SocketErrorData } from "../services/socketService";

interface UseWebSocketProps {
  userId?: number | null;
  onNotification?: (notification: NotificationData) => void;
  onConnectionChange?: (status: boolean) => void;
  onError?: (error: SocketErrorData) => void;
  autoConnect?: boolean;
  reconnectOnUserIdChange?: boolean;
}

interface UseWebSocketReturn {
  connect: (specificUserId?: number) => Promise<boolean>;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  socketId: string | null;
  reconnectAttempts: number;
  ping: () => void;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
}

export const useWebSocket = ({
  userId,
  onNotification,
  onConnectionChange,
  onError,
  autoConnect = true,
  reconnectOnUserIdChange = true,
}: UseWebSocketProps = {}): UseWebSocketReturn => {
  const isConnectingRef = useRef(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [socketId, setSocketId] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  // Connection status handler
  const handleConnectionChange = useCallback(
    (status: boolean) => {
      setIsConnected(status);
      setConnectionStatus(status ? "connected" : "disconnected");

      if (status) {
        setSocketId(socketService.getSocketId());
      } else {
        setSocketId(null);
      }

      onConnectionChange?.(status);
    },
    [onConnectionChange]
  );

  // Error handler
  const handleError = useCallback(
    (error: SocketErrorData) => {
      setConnectionStatus("error");
      onError?.(error);
    },
    [onError]
  );

  // Notification handler
  const handleNotification = useCallback(
    (notification: NotificationData) => {
      onNotification?.(notification);
    },
    [onNotification]
  );

  // Connect function
  const connect = useCallback(
    async (specificUserId?: number): Promise<boolean> => {
      const targetUserId = specificUserId || userId;

      if (!targetUserId) {
        console.warn("⚠️ No user ID provided for WebSocket connection");
        return false;
      }

      if (isConnectingRef.current) {
        console.log("🔄 Connection already in progress...");
        return false;
      }

      isConnectingRef.current = true;
      setConnectionStatus("connecting");

      try {
        const success = await socketService.connect(targetUserId);

        if (!success) {
          setConnectionStatus("error");
        }

        return success;
      } catch (error) {
        console.error("❌ WebSocket connection error:", error);
        setConnectionStatus("error");
        return false;
      } finally {
        isConnectingRef.current = false;
      }
    },
    [userId]
  );

  // Disconnect function
  const disconnect = useCallback((): void => {
    socketService.disconnect();
    setIsConnected(false);
    setConnectionStatus("disconnected");
    setSocketId(null);
  }, []);

  // Setup event listeners
  useEffect(() => {
    // Register event listeners
    socketService.onConnectionChange(handleConnectionChange);
    socketService.onError(handleError);

    if (onNotification) {
      socketService.onNotification(handleNotification);
    }

    // Initialize current state
    setIsConnected(socketService.getConnectionStatus());
    setSocketId(socketService.getSocketId());
    setReconnectAttempts(socketService.getReconnectAttempts());

    return () => {
      // Cleanup event listeners
      socketService.offConnectionChange(handleConnectionChange);
      socketService.offError(handleError);

      if (onNotification) {
        socketService.offNotification(handleNotification);
      }
    };
  }, [handleConnectionChange, handleError, handleNotification, onNotification]);

  // Auto-connect on mount and userId change
  useEffect(() => {
    if (!autoConnect || !userId) return;

    let mounted = true;

    const attemptConnect = async () => {
      if (mounted) {
        await connect();
      }
    };

    attemptConnect();

    return () => {
      mounted = false;
    };
  }, [autoConnect, connect, userId]);

  // Handle userId changes
  useEffect(() => {
    if (!reconnectOnUserIdChange || !userId || !autoConnect) return;

    // Only reconnect if we were previously connected with a different user
    if (isConnected && socketService.getSocketId()) {
      console.log("🔄 User ID changed, reconnecting WebSocket...");
      connect();
    }
  }, [userId, reconnectOnUserIdChange, autoConnect, isConnected, connect]);

  // Update reconnect attempts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setReconnectAttempts(socketService.getReconnectAttempts());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Memoized return value to prevent unnecessary re-renders
  const returnValue = useMemo(
    (): UseWebSocketReturn => ({
      connect,
      disconnect,
      isConnected,
      isConnecting: connectionStatus === "connecting",
      socketId,
      reconnectAttempts,
      ping: () => socketService.ping(),
      connectionStatus,
    }),
    [
      connect,
      disconnect,
      isConnected,
      connectionStatus,
      socketId,
      reconnectAttempts,
    ]
  );

  return returnValue;
};

// Hook for consuming WebSocket notifications with simpler API
export const useWebSocketNotification = (
  onNotification: (notification: NotificationData) => void
) => {
  const { isConnected, socketId } = useWebSocket({
    onNotification,
    autoConnect: true,
  });

  return {
    isConnected,
    socketId,
  };
};
