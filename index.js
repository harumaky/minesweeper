'use strict';

const { log } = require('console');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server)
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));


let num_users = 0; // logged in users
let rooms = [];

// custom/additional room info
class Room {
	constructor(data) {
		this.owner = data.owner;
		this.width = data.width;
		this.height = data.height;
		this.bomb = data.bomb;
		this.created = new Date();
		this.id = undefined;
		this.status = 'waiting';
		this.player = undefined;
		this.playerID = undefined;
	}
}

io.on('connection', (socket) => {
	socket.isLoggedin = false;
	socket.myroom = undefined;

	socket.emit('initial info', {
		users: num_users,
		rooms: rooms,
		userid: socket.id
	});

	socket.on('login', (username) => {
		socket.isLoggedin = true;
		num_users++;
		socket.username = username;
		console.log(`login ${username}`);
		io.emit('users change', num_users);
	});

	socket.on('debug', () => {
		console.log(rooms);
	})

	// data -> owner, W, H, B
	socket.on('create room', (data) => {
		if (socket.myroom !== undefined) {
			console.log(`${socket.username}は既に部屋に所属しているのに作成しようとしました`);
			return;
		}
		const room = new Room(data);
		room.id = socket.id; // room id is equal to socket id
		rooms.push(room);
		socket.myroom = room;
		socket.join(room.id);
		socket.emit('created your room', room);
		io.emit('room added', room);
	});

	socket.on('join room', (id) => {
		const room = rooms.find(item => {
			return item.id === id;
		});
		if (socket.myroom !== undefined) {
			console.log(`${socket.username}は既に部屋に所属しているのに別の場所に入ろうとしました`);
			return;
		}
		if (room.status !== 'waiting') {
			console.log(`${socket.username}は既に成立した部屋に入ろうとしました`);
			return;
		}
		room.status = 'ready';
		room.player = socket.username;
		room.playerID = socket.id;
		socket.join(id);
		socket.myroom = room;
		io.emit('room matched', id);
		io.in(id).emit('you got matched', room);
	});

	socket.on('destroy room', (id) => {
		socket.myroom = undefined;
		socket.leave(id);
		destroyRoom(id);
		socket.emit('destroyed your room', id);
	});

	socket.on('disconnect', () => {
		if (socket.isLoggedin) {
			num_users--;
			console.log(`logout ${socket.username}`);
			io.emit('users change', num_users);
		}
		if (socket.myroom !== undefined) {
			destroyRoom(socket.myroom.id) // = socket.id if owner
			// 相手がいる場合、ソロプレイ化する
		}
	});

	
});

// 擬似的に削除するのであって、socket.ioのroomはクライアントがいる限り残る
function destroyRoom(id) {
	rooms = rooms.filter((room) => {
		return room.id !== id;
	});
	io.emit('room removed', id);
	io.in(id).emit('your room removed');
}

server.listen(PORT, () => {
	console.log(`Listening on ${PORT}`);
})