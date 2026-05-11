/**
 * Editor RPC Bridge Client
 * Handles real-time communication between the PodMonetize Dashboard and the local editor.
 * Enables navigation commands like openAt, reveal, and peek.
 */
class EditorBridge {
  constructor(wsUrl = `ws://${window.location.hostname}:4000/ws/editor`) {
    this.wsUrl = wsUrl;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connectionStatusListeners = [];
  }

  connect() {
    console.log('[EditorBridge] Connecting to:', this.wsUrl);
    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        console.log('[EditorBridge] Connected ✅');
        this.reconnectAttempts = 0;
        this.notifyStatusListeners('connected');
      };

      this.socket.onclose = () => {
        console.log('[EditorBridge] Disconnected ❌');
        this.notifyStatusListeners('disconnected');
        this.handleReconnect();
      };

      this.socket.onerror = (err) => {
        console.error('[EditorBridge] WebSocket Error:', err);
        this.notifyStatusListeners('error');
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('[EditorBridge] Message received:', data);
      };
    } catch (e) {
      console.error('[EditorBridge] Connection failed:', e);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[EditorBridge] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    }
  }

  /**
   * Reveal a specific file and line in the editor
   * @param {string} file - Path to the file
   * @param {number} line - Line number (1-indexed)
   */
  reveal(file, line = 1) {
    this.sendCommand('reveal', { file, line });
  }

  /**
   * Open a file at a specific location
   */
  openAt(file, line = 1) {
    this.sendCommand('openAt', { file, line });
  }

  sendCommand(command, params = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload = { command, params, timestamp: Date.now() };
      this.socket.send(JSON.stringify(payload));
      console.log('[EditorBridge] Sent command:', command, params);
    } else {
      console.warn('[EditorBridge] Cannot send command: Not connected');
    }
  }

  onStatusChange(callback) {
    this.connectionStatusListeners.push(callback);
  }

  notifyStatusListeners(status) {
    this.connectionStatusListeners.forEach(cb => cb(status));
  }
}

// Export a singleton instance
const editorBridge = new EditorBridge();
window.editorBridge = editorBridge;
