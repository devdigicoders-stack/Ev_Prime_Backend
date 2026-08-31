const ChatMessage = require('../models/ChatMessage');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Partner or Admin joins their own room to receive messages
    socket.on('join_room', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    // Send a message
    socket.on('send_message', async (data) => {
      try {
        const { senderId, senderModel, receiverId, receiverModel, text } = data;
        
        // Save to DB
        const message = await ChatMessage.create({
          senderId,
          senderModel,
          receiverId,
          receiverModel,
          text,
          status: 'sent',
        });

        // Emit to receiver's room
        io.to(receiverId).emit('receive_message', message);
        
        // Acknowledge sender that message was delivered to server
        message.status = 'delivered';
        await message.save();
        socket.emit('message_status_update', { messageId: message._id, status: 'delivered' });
      } catch (error) {
        console.error('Socket send_message error:', error);
      }
    });

    // Mark messages as read
    socket.on('mark_read', async ({ messageIds, readerId, senderId }) => {
      try {
        await ChatMessage.updateMany(
          { _id: { $in: messageIds } },
          { $set: { status: 'read' } }
        );
        
        // Notify the original sender that their messages were read
        io.to(senderId).emit('messages_read_by_receiver', { messageIds });
      } catch (error) {
        console.error('Socket mark_read error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
