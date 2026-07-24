/**
 * Worker-side message handler that attaches listeners to manage WebSocket and SSE connections.
 * Call this inside your web worker file.
 *
 * @param globalScope The worker global scope (defaults to `self`).
 */
export function attachRealtimeWorker(
  globalScope: any = typeof self !== 'undefined' ? self : {},
): void {
  const wsConnections = new Map<string, WebSocket>();
  const sseConnections = new Map<string, EventSource>();

  const wsReconnectTimers = new Map<string, any>();
  const wsHeartbeatTimers = new Map<string, any>();

  globalScope.addEventListener('message', (event: MessageEvent) => {
    const msg = event.data;
    if (!msg || !msg.type || !msg.connectionId) return;

    const { type, connectionId } = msg;

    if (type === 'connect-ws') {
      connectWebSocket(msg);
    } else if (type === 'send-ws') {
      const socket = wsConnections.get(connectionId);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(msg.data);
      }
    } else if (type === 'close-ws') {
      closeWebSocket(connectionId);
    } else if (type === 'connect-sse') {
      connectSse(msg);
    } else if (type === 'close-sse') {
      closeSse(connectionId);
    }
  });

  function postToMain(payload: any) {
    if (typeof globalScope.postMessage === 'function') {
      globalScope.postMessage(payload);
    }
  }

  function connectWebSocket(config: any) {
    const {
      connectionId,
      url,
      protocols,
      reconnectInterval = 0,
      maxReconnectAttempts = 0,
      maxReconnectDelay = 30000,
      heartbeatInterval,
      heartbeatMessage,
    } = config;

    let reconnectAttempts = 0;
    let disposed = false;

    function openSocket() {
      if (disposed) return;
      postToMain({ type: 'ws-status', connectionId, state: 'connecting', error: null });

      try {
        const socket = new WebSocket(url, protocols || undefined);
        wsConnections.set(connectionId, socket);

        socket.onopen = () => {
          reconnectAttempts = 0;
          postToMain({
            type: 'ws-status',
            connectionId,
            state: 'open',
            error: null,
            reconnectAttempts: 0,
          });
          startHeartbeat();
        };

        socket.onclose = (e) => {
          stopHeartbeat();
          if (disposed) return;
          postToMain({
            type: 'ws-status',
            connectionId,
            state: 'closed',
            error: e.wasClean ? null : `closed: ${e.code} ${e.reason}`,
          });
          if (!e.wasClean) {
            scheduleReconnect();
          }
        };

        socket.onerror = () => {
          postToMain({ type: 'ws-status', connectionId, error: 'WebSocket connection error' });
        };

        socket.onmessage = (e) => {
          postToMain({ type: 'ws-message', connectionId, data: e.data });
        };

        let heartbeatTimer: any = null;
        function startHeartbeat() {
          if (!heartbeatInterval || heartbeatMessage === undefined) return;
          stopHeartbeat();
          heartbeatTimer = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              try {
                socket.send(
                  typeof heartbeatMessage === 'string'
                    ? heartbeatMessage
                    : JSON.stringify({ type: 'heartbeat', data: heartbeatMessage }),
                );
              } catch {
                /* ignore */
              }
            }
          }, heartbeatInterval);
          wsHeartbeatTimers.set(connectionId, heartbeatTimer);
        }

        function stopHeartbeat() {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            wsHeartbeatTimers.delete(connectionId);
            heartbeatTimer = null;
          }
        }
      } catch (error: any) {
        postToMain({
          type: 'ws-status',
          connectionId,
          state: 'closed',
          error: error.message || 'WebSocket open failed',
        });
        scheduleReconnect();
      }
    }

    function scheduleReconnect() {
      if (disposed) return;
      if (reconnectInterval <= 0 || maxReconnectAttempts <= 0) return;
      if (reconnectAttempts >= maxReconnectAttempts) {
        postToMain({
          type: 'ws-status',
          connectionId,
          state: 'closed',
          error: `Max reconnect attempts (${maxReconnectAttempts}) reached`,
        });
        return;
      }

      reconnectAttempts += 1;
      const delay = computeBackoffDelay(reconnectAttempts, reconnectInterval, maxReconnectDelay);

      postToMain({
        type: 'ws-status',
        connectionId,
        state: 'reconnecting',
        reconnectAttempts,
      });

      const timer = setTimeout(() => {
        wsReconnectTimers.delete(connectionId);
        openSocket();
      }, delay);
      wsReconnectTimers.set(connectionId, timer);
    }

    openSocket();

    globalScope[`_cleanup_ws_${connectionId}`] = () => {
      disposed = true;
      const timer = wsReconnectTimers.get(connectionId);
      if (timer) {
        clearTimeout(timer);
        wsReconnectTimers.delete(connectionId);
      }
      const hb = wsHeartbeatTimers.get(connectionId);
      if (hb) {
        clearInterval(hb);
        wsHeartbeatTimers.delete(connectionId);
      }
    };
  }

  function computeBackoffDelay(attempt: number, interval: number, maxDelay: number): number {
    const exp = Math.min(maxDelay, interval * Math.pow(2, attempt - 1));
    return Math.floor(Math.random() * exp);
  }

  function closeWebSocket(connectionId: string) {
    const cleanup = globalScope[`_cleanup_ws_${connectionId}`];
    if (cleanup) {
      cleanup();
      delete globalScope[`_cleanup_ws_${connectionId}`];
    }

    const socket = wsConnections.get(connectionId);
    if (socket) {
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      wsConnections.delete(connectionId);
    }
  }

  function connectSse(config: any) {
    const { connectionId, url, withCredentials, events } = config;
    postToMain({ type: 'sse-status', connectionId, state: 'connecting', error: null });

    try {
      const sse = new EventSource(url, { withCredentials });
      sseConnections.set(connectionId, sse);

      sse.onopen = () => {
        postToMain({ type: 'sse-status', connectionId, state: 'open', error: null });
      };

      sse.onerror = () => {
        postToMain({
          type: 'sse-status',
          connectionId,
          state: 'connecting',
          error: 'EventSource connection error, reconnecting...',
        });
      };

      sse.onmessage = (e) => {
        postToMain({
          type: 'sse-message',
          connectionId,
          id: e.lastEventId || null,
          event: e.type || 'message',
          data: e.data,
          lastEventId: e.lastEventId || null,
        });
      };

      if (events && Array.isArray(events)) {
        for (const eventName of events) {
          sse.addEventListener(eventName, (e: any) => {
            postToMain({
              type: 'sse-message',
              connectionId,
              id: e.lastEventId || null,
              event: eventName,
              data: e.data,
              lastEventId: e.lastEventId || null,
            });
          });
        }
      }
    } catch (error: any) {
      postToMain({
        type: 'sse-status',
        connectionId,
        state: 'closed',
        error: error.message || 'EventSource open failed',
      });
    }
  }

  function closeSse(connectionId: string) {
    const sse = sseConnections.get(connectionId);
    if (sse) {
      try {
        sse.close();
      } catch {
        /* ignore */
      }
      sseConnections.delete(connectionId);
    }
    postToMain({ type: 'sse-status', connectionId, state: 'closed', error: null });
  }
}
