'use strict';

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server)
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));


io.on('connection', (socket) => {
	console.log('Client connected');
	socket.on('disconnect', () => console.log('Client disconnected'));
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);

server.listen(PORT, () => {
	console.log(`Listening on ${PORT}`);
})