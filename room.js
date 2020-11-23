'use strict';
// custom/additional room info
module.exports = class Room {
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