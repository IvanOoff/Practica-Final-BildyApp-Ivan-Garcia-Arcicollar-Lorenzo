export const emitToRoom = (io, room, event, data) => {
  io.to(room).emit(event, data);
};

export const registerDeliveryNoteHandlers = (io, socket) => {
  const joinCompanyRoom = (companyId) => {
    socket.join(`company:${companyId}`);
    console.log(`Socket ${socket.id} joined company:${companyId}`);
  };

  const leaveCompanyRoom = (companyId) => {
    socket.leave(`company:${companyId}`);
    console.log(`Socket ${socket.id} left company:${companyId}`);
  };

  socket.on('company:join', joinCompanyRoom);
  socket.on('company:leave', leaveCompanyRoom);

  socket.on('deliverynote:new', (data) => {
    const room = `company:${data.companyId}`;
    emitToRoom(io, room, 'deliverynote:created', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('deliverynote:signed', (data) => {
    const room = `company:${data.companyId}`;
    emitToRoom(io, room, 'deliverynote:signed', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('client:new', (data) => {
    const room = `company:${data.companyId}`;
    emitToRoom(io, room, 'client:created', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('project:new', (data) => {
    const room = `company:${data.companyId}`;
    emitToRoom(io, room, 'project:created', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
};

export default { emitToRoom, registerDeliveryNoteHandlers };
