import Peer from 'peerjs';

class PeerService {
  constructor() {
    this.peer = null;
    this.connection = null;
    this.myPeerId = '';
    this.targetPeerId = '';

    this.onSubtitleCallbacks = [];
    this.onStatusChangeCallbacks = [];
  }

  /**
   * Initialize Peer instance safely
   * @param {string} optionalId - Custom Peer ID (e.g. TC-1234)
   * @returns {Promise<string>}
   */
  init(optionalId = '') {
    return new Promise((resolve, reject) => {
      const targetId = optionalId ? optionalId.trim().toUpperCase() : `TC-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. If already initialized with exact targetId and active, reuse it!
      if (this.peer && !this.peer.destroyed && this.myPeerId === targetId) {
        console.log('[PeerJS] Reusing active peer session:', this.myPeerId);
        this.emitStatus('ready', { peerId: this.myPeerId });
        resolve(this.myPeerId);
        return;
      }

      // 2. Safely destroy previous peer if ID changed
      if (this.peer) {
        try {
          this.peer.destroy();
        } catch (e) {}
        this.peer = null;
      }

      console.log('[PeerJS] Creating new peer session:', targetId);

      // Create new PeerJS connection
      const peer = new Peer(targetId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on('open', (id) => {
        console.log('[PeerJS] Peer successfully registered with ID:', id);
        this.peer = peer;
        this.myPeerId = id;
        this.emitStatus('ready', { peerId: id });
        resolve(id);
      });

      // Handle incoming connection (Host side)
      peer.on('connection', (conn) => {
        console.log('[PeerJS] Host received incoming P2P connection from:', conn.peer);
        this.setupConnection(conn);
      });

      peer.on('error', (err) => {
        console.error('[PeerJS] Peer error:', err);
        this.emitStatus('error', { error: err.message || err.type });
        reject(err);
      });

      peer.on('disconnected', () => {
        console.warn('[PeerJS] Disconnected from server, reconnecting...');
        if (peer && !peer.destroyed) {
          peer.reconnect();
        }
      });
    });
  }

  /**
   * Connect to target partner's Peer ID (Client side)
   */
  connect(targetId) {
    if (!this.peer || this.peer.destroyed) {
      console.error('[PeerJS] Cannot connect: Peer instance is not ready');
      return;
    }

    const cleanTargetId = targetId.trim().toUpperCase();
    this.targetPeerId = cleanTargetId;
    console.log('[PeerJS] Initiating P2P connection to target:', cleanTargetId);

    const conn = this.peer.connect(cleanTargetId, {
      reliable: true
    });

    this.setupConnection(conn);
  }

  /**
   * Setup connection listeners
   */
  setupConnection(conn) {
    this.connection = conn;
    this.targetPeerId = conn.peer;

    conn.on('open', () => {
      console.log('[PeerJS] P2P Data Channel Connected with:', conn.peer);
      this.emitStatus('connected', { partnerId: conn.peer });
      // Send handshake
      conn.send({ type: 'handshake', text: 'connected' });
    });

    conn.on('data', (data) => {
      console.log('[PeerJS] Data received:', data);
      if (data && data.type === 'subtitle') {
        this.emitSubtitle(data);
      } else if (data && data.type === 'handshake') {
        this.emitStatus('connected', { partnerId: conn.peer });
      }
    });

    conn.on('close', () => {
      console.warn('[PeerJS] P2P Data Channel Closed');
      this.connection = null;
      this.emitStatus('partner_disconnected');
    });

    conn.on('error', (err) => {
      console.error('[PeerJS] Data Channel Error:', err);
      this.emitStatus('error', { error: err.message });
    });
  }

  /**
   * Send Subtitle Payload to Partner
   */
  sendSubtitle(payload) {
    if (this.connection && this.connection.open) {
      console.log('[PeerJS] Sending subtitle payload to partner:', payload);
      this.connection.send({
        type: 'subtitle',
        timestamp: Date.now(),
        ...payload
      });
    } else {
      console.warn('[PeerJS] Send failed: Connection is not open yet!');
    }
  }

  disconnect() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  onSubtitle(callback) {
    this.onSubtitleCallbacks.push(callback);
  }

  onStatusChange(callback) {
    this.onStatusChangeCallbacks.push(callback);
  }

  emitSubtitle(data) {
    this.onSubtitleCallbacks.forEach(cb => cb(data));
  }

  emitStatus(status, extra = {}) {
    this.onStatusChangeCallbacks.forEach(cb => cb(status, extra));
  }
}

export const peerService = new PeerService();
