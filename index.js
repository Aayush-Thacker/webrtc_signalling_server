

let port = process.env.PORT || 5000;

let IO = require("socket.io")(port, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

IO.use((socket, next) => {
  if (socket.handshake.query) {
    let callerId = socket.handshake.query.callerId;
    socket.user = callerId;
    next();
  } else {
    // Handle the case where no query parameters are provided
    next(new Error('No callerInfo provided'));
  }
});

IO.on("connection", (socket) => {
  console.log(socket.user, "Connected");
  socket.join(socket.user);

  socket.on("makeCall", (data) => {
    let calleeId = data.calleeId.toString();
    let callerInfo = data.callerInfo;
    let sdpOffer = data.sdpOffer;

    console.log(socket.user, " is CALLING ", calleeId);

    socket.to(calleeId).emit("newCall", {
      callerInfo: callerInfo,
      sdpOffer: sdpOffer,
      callId: data.callId,
      callBackRequestId: data.callBackRequestId,
    });
  });


  socket.on("answerCall", (data) => {
    let callerId = data.callerId.toString();
    let sdpAnswer = data.sdpAnswer;

    console.log(socket.user, " is ANSWERING CALL FOR ", callerId);

    socket.to(callerId).emit("callAnswered", {
      callee: socket.user,
      sdpAnswer: sdpAnswer,
    });
  });

  socket.on("declineCall", (data) => {
    let callerId = data.callerId.toString();
    let reasonSlug = data.reasonSlug;

    console.log(socket.user, " is DECLINING CALL FROM ", callerId, " WITH REASON: ", reasonSlug);

    socket.to(callerId).emit("callDeclined", {
      callee: socket.user,
      reason: reasonSlug,
    });
  });

  socket.on("requestCallBack", (data) => {
    let callerId = data.callerId.toString();

    console.log(socket.user, " is SENDING RECALL REQUEST TO ", callerId);

    socket.to(callerId).emit("resendCall", {
      toUserId:socket.user,
    });
  });


  socket.on("IceCandidate", (data) => {
    let calleeId = data.calleeId.toString();
    let iceCandidate = data.iceCandidate;

    console.log(socket.user, " is SENDING ICE CANDIDATE TO ", calleeId);

    socket.to(calleeId).emit("IceCandidate", {
      sender: socket.user,
      iceCandidate: iceCandidate,
    });
  });
});


