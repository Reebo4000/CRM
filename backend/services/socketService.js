const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Socket.IO Service for real-time notifications
 */
class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
  }

  /**
   * Initialize Socket.IO with authentication
   */
  initialize(server) {
    const { Server } = require('socket.io');
    const { verifyToken } = require('../utils/jwt');
    const { User } = require('../models');

    console.log('🔌 Initializing Socket.IO server with authentication...');

    this.io = new Server(server, {
      cors: {
        origin: ['http://localhost:5173', 'https://chigger-definite-nominally.ngrok-free.app'],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Add authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          console.log('❌ Socket connection rejected: No token provided');
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = verifyToken(token);

        // Fetch user from database
        const user = await User.findByPk(decoded.id);

        if (!user) {
          console.log('❌ Socket connection rejected: User not found');
          return next(new Error('Authentication error: User not found'));
        }

        // Attach user to socket
        socket.user = user;
        socket.userId = user.id;
        socket.userRole = user.role;

        console.log(`🔐 Socket authenticated: User ${user.id} (${user.firstName} ${user.lastName}) - Role: ${user.role}`);
        next();
      } catch (error) {
        console.log('❌ Socket authentication failed:', error.message);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // CONNECTION HANDLER WITH PROPER AUTHENTICATION
    this.io.on('connection', (socket) => {
      console.log(`🔌✅ Authenticated connection: User ${socket.user.firstName} ${socket.user.lastName} (ID: ${socket.userId}) via socket ${socket.id}`);

      // Call the proper connection handler
      this.handleConnection(socket);

      socket.emit('welcome', {
        message: 'Connected to Socket.IO server!',
        user: {
          id: socket.user.id,
          name: `${socket.user.firstName} ${socket.user.lastName}`,
          role: socket.user.role
        }
      });
    });

    console.log('🔌 Socket.IO service initialized with authentication');
    return this.io;
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    const userId = socket.userId;
    const userRole = socket.userRole;
    const user = socket.user;

    console.log(`👤✅ SOCKET CONNECTION HANDLER - User ${user.firstName} ${user.lastName} (ID: ${userId}, Role: ${userRole}) connected via socket ${socket.id}`);

    // Store user connection
    this.connectedUsers.set(userId, socket.id);

    // Join user-specific room
    socket.join(`user_${userId}`);

    // Join role-based rooms
    socket.join(`role_${userRole}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to notification service',
      userId,
      role: userRole,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      }
    });

    // Handle notification acknowledgment
    socket.on('notification_received', (data) => {
      console.log(`📨 User ${userId} acknowledged notification ${data.notificationId}`);
    });

    // Handle mark as read
    socket.on('mark_notification_read', async (data) => {
      try {
        const notificationService = require('./notificationService');
        await notificationService.markAsRead(data.notificationId, userId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });

    // Handle mark all as read
    socket.on('mark_all_notifications_read', async () => {
      try {
        const notificationService = require('./notificationService');
        await notificationService.markAllAsRead(userId);
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        socket.emit('error', { message: 'Failed to mark all notifications as read' });
      }
    });

    // Handle get unread count
    socket.on('get_unread_count', async () => {
      try {
        const notificationService = require('./notificationService');
        const count = await notificationService.getUnreadCount(userId);
        socket.emit('unread_count', { count });
      } catch (error) {
        console.error('Error getting unread count:', error);
        socket.emit('error', { message: 'Failed to get unread count' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`👤❌ User ${user.firstName} ${user.lastName} (ID: ${userId}) disconnected: ${reason}`);
      this.connectedUsers.delete(userId);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  /**
   * Send notification to users with specific role
   */
  sendToRole(role, event, data) {
    if (this.io) {
      this.io.to(`role_${role}`).emit(event, data);
    }
  }

  /**
   * Send notification to all connected users
   */
  sendToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get Socket.IO instance
   */
  getIO() {
    return this.io;
  }

  /**
   * Broadcast notification to multiple users
   */
  broadcastNotification(userIds, notificationData) {
    if (this.io && Array.isArray(userIds)) {
      userIds.forEach(userId => {
        this.io.to(`user_${userId}`).emit('notification', notificationData);
      });
    }
  }

  /**
   * Broadcast notification to all connected users
   */
  broadcastNotificationToAll(notificationData) {
    if (this.io) {
      this.io.emit('notification', notificationData);
    }
  }

  /**
   * Broadcast notification to users with specific roles
   */
  broadcastNotificationToRoles(roles, notificationData) {
    if (this.io && Array.isArray(roles)) {
      roles.forEach(role => {
        this.io.to(`role_${role}`).emit('notification', notificationData);
      });
    }
  }

  /**
   * Send notification read status update
   */
  sendNotificationReadUpdate(userId, notificationId, userNotificationId) {
    this.sendToUser(userId, 'notification_read', {
      notificationId,
      userNotificationId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send mark all as read update
   */
  sendMarkAllAsReadUpdate(userId, updatedCount) {
    this.sendToUser(userId, 'notifications_all_read', {
      updatedCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast system announcement
   */
  broadcastSystemAnnouncement(message, priority = 'medium') {
    this.sendToAll('system_announcement', {
      message,
      priority,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send maintenance notice
   */
  sendMaintenanceNotice(message, scheduledTime) {
    this.sendToAll('maintenance_notice', {
      message,
      scheduledTime,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send real-time order update
   */
  sendOrderUpdate(orderData, targetRoles = ['admin', 'staff']) {
    targetRoles.forEach(role => {
      this.sendToRole(role, 'order_update', {
        orderId: orderData.id,
        status: orderData.status,
        customerName: orderData.customer ? `${orderData.customer.firstName} ${orderData.customer.lastName}` : 'Unknown',
        totalAmount: orderData.totalAmount,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Send real-time customer update
   */
  sendCustomerUpdate(customerData, targetRoles = ['admin', 'staff']) {
    targetRoles.forEach(role => {
      this.sendToRole(role, 'customer_update', {
        customerId: customerData.id,
        customerName: `${customerData.firstName} ${customerData.lastName}`,
        email: customerData.email,
        phone: customerData.phone,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Send real-time inventory update
   */
  sendInventoryUpdate(productData, alertType, targetRoles = ['admin', 'staff']) {
    targetRoles.forEach(role => {
      this.sendToRole(role, 'inventory_update', {
        productId: productData.id,
        productName: productData.name,
        currentStock: productData.stockQuantity,
        alertType, // 'low', 'out', 'medium'
        category: productData.category,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Send customer registration notification
   */
  sendCustomerRegistration(customerData, targetRoles = ['admin', 'staff']) {
    targetRoles.forEach(role => {
      this.sendToRole(role, 'customer_registered', {
        customerId: customerData.id,
        customerName: `${customerData.firstName} ${customerData.lastName}`,
        email: customerData.email,
        timestamp: new Date().toISOString()
      });
    });
  }
}

module.exports = new SocketService();
