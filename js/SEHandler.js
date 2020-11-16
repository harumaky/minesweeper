'use strict';
import { EventEmitter } from './EventEmitter.js';

export class SEHandler extends EventEmitter {
	constructor() {
		super();
		this.initTime = new Date();
		this.list = {
			bomb: new Audio("./sound/bomb.mp3"),
			cancel: new Audio("./sound/cancel.mp3"),
			dig: new Audio("./sound/dig.mp3"),
			flag: new Audio("./sound/flag.mp3"),
			unflag: new Audio("./sound/unflag.mp3"),
			select: new Audio("./sound/select.mp3"),
			bigdig: new Audio("./sound/bigdig.mp3"),
			tin: new Audio("./sound/tin.mp3"),
			win: new Audio("./sound/win.mp3"),
		}
		this.loadedAmount = 0;
		this.amount = Object.keys(this.list).length;
		this.allowed = false;
		this.state = "notloaded";
	}

	load() {
		for (const name in this.list) {
			this.list[name].load();
			this.list[name].addEventListener('abort', this.aborted.bind(this));
			this.list[name].addEventListener('error', this.errored.bind(this));
			this.list[name].addEventListener('stalled', this.stalled.bind(this));
			this.list[name].addEventListener('canplaythrough', this.addLoaded.bind(this));
		}
	}

	addLoaded() {
		this.loadedAmount++;
		if (this.loadedAmount === this.amount) {
			this.emitLoadCompleted();
		}
	}

	onLoadCompleted(listener) {
		this.addEventListener("loaded", listener);
	}
	emitLoadCompleted() {
		this.state = "loaded";
		this.emit("loaded", "SE");
	}

	play(name) {
		if (this.state === "loaded" && this.allowed) {
			this.list[name].play();
		} else {
			console.log("sound not playable");
		}
	}

	aborted() {
		console.error("load aborted");
	}
	errored() {
		console.error("load errored");
	}
	stalled() {
		console.error(`stalled ${this.loadedAmount}`);
	}
}