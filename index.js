'use strict';
const version = require('./package.json').version;
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const Room = require('./room.js');
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.get('/', (req, res) => {
	res.render('index', {
		version: version
	});
});


let num_users = 0; // logged in users
let rooms = [];

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
			log(socket, `既に部屋に所属しているのに作成しようとしました`);
			return;
		}
		const room = new Room(data);
		room.id = socket.id; // room id is equal to owner's socket id
		rooms.push(room);
		socket.myroom = room;
		socket.join(room.id);
		socket.emit('created your room', room);
		io.emit('room added', room);
	});

	socket.on('join room', (id) => {
		const room = findRoom(id);
		if (socket.myroom !== undefined) {
			log(socket, `既に部屋に所属しているのに別の場所に入ろうとしました`);
			return;
		}
		if (room.status !== 'waiting') {
			log(socket, `既に成立した部屋に入ろうとしました`);
			return;
		}
		room.status = 'matched';
		room.player = socket.username;
		room.playerID = socket.id;
		socket.join(id);
		socket.myroom = room;
		io.in(id).emit('you got matched', room);
		io.emit('room matched', id);
	});

	socket.on('destroy room', (id) => {
		socket.myroom = undefined;
		socket.leave(id);
		destroyRoom(id);
		socket.emit('destroyed your room', id);
	});

	socket.on('game ready', (id) => {
		const room = findRoom(id);
		room.ready++;
		if (room.ready == 2) {
			room.status = 'ongame'
			io.in(id).emit('start your game', room);
			io.emit('room started', id);
		}
	})

	socket.on('game firstdata', (data) => {
		// const room = findRoom(data.id);
		socket.to(data.id).emit('opp firstdata', data);
	})
	socket.on('board change', (data) => {
		socket.to(data.id).emit('opp change', data);
	})

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

function findRoom(id) {
	return rooms.find(item => {
		return item.id === id;
	});
}

function log(socket, msg) {
	socket.emit('log', msg);
}


server.listen(PORT, () => {
	console.log(`Listening on ${PORT}`);
});