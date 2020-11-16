'use strict';
export class EventEmitter {
	constructor () {
		this._listeners = new Map();
	}

	addEventListener(type, listener) {
		if (!this._listeners.has(type)) {
			this._listeners.set(type, new Set());
		}
		const listenerSet = this._listeners.get(type);
		listenerSet.add(listener);
	}

	emit(type, debugname = "none") {
		console.log(`Emit "${type}" of ${debugname}`);
		const listenerSet = this._listeners.get(type);
		if (!listenerSet) return;
		listenerSet.forEach(listener => {listener.call(this)});
	}

	removeEventListener(type, listener) {
		const listenerSet = this._listeners.get(type);
		if (!listenerSet) return;
		listenerSet.forEach(ownListener => {
			if (ownListener === listener) {
				listenerSet.delete(listener);
			}
		})
	}
}