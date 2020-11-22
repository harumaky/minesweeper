'use strict';

const e = require('express');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server)
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));


let num_users = 0; // logged in users

io.on('connection', (socket) => {
	console.log(`Connected client id ${socket.id}`);
	let isLoggedin = false;

	socket.emit('initial info', {
		users: num_users
	});

	socket.on('login', (username) => {
		isLoggedin = true;
		num_users++;
		socket.username = username;
		console.log(`login ${username}`);
		io.emit('users change', num_users)

	})

	socket.on('disconnect', () => {
		console.log(`Disconnected client id ${socket.id}`);
		if (isLoggedin) {
			num_users--;
			console.log(`logout ${socket.username}`);
			io.emit('users change', num_users)
		}
	});
});

server.listen(PORT, () => {
	console.log(`Listening on ${PORT}`);
})