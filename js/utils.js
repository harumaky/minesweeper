'use strict';


/**
 * Set Dom Function
 * ターゲットはDOMそのものでも、IDでもいい
 * @param {} target dom id or elm
 * @param {String} type ex. click
 * @param {Function} func callback
 */
export function SDF(target, type, func) {
	let elm = typeof target === 'string' ? document.getElementById(target) : target;
	if (elm === null) {
		console.error(`${target} not found`);
		return;
	}
	elm.addEventListener(type, func);
}

/**
 * Get Dom by id
 * @param {String} id dom id
 * @returns {DOMElement}
 */
export function getDOM(id) {
	let elm = document.getElementById(id);
	if (elm === null) {
		console.error(`${id} not found`);
		return;
	}
	return elm;
}