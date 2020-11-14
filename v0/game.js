'use strict';

const conf_width = document.getElementById("conf_width");
const conf_height = document.getElementById("conf_height");
const conf_bomb = document.getElementById("conf_bomb");
const table = document.getElementById("table");
const panel = document.getElementById("panel");


const isInvalid = r => {
	!r.reportValidity();
}


if (isInvalid(conf_width)) conf_width.value = 9;
if (isInvalid(conf_height)) conf_height.value = 9;
const w = conf_width.value;
const h = conf_width.value;
conf_bomb.max = (w - 1) * (h - 1);
if (isInvalid(conf_bomb)) conf_bomb.value = 10;

let mines = conf_bomb.value;
let flags = mines;
let mine_rest = mines;
// m mines f flags z:mine_rest (地雷敷設時に使用する、敷設すべき残りの地雷数)
const startTime = performance.now();

const isValidGame = () => {
	+flags >= flags;
}

const updateText = () => {
	let elapsed = (performance.now() - startTime) / 1000;
	let elapsed_min = (elapsed | 0) / 60 | 0;
	let elapsed_sec = elapsed_min / 60;
	(panel["innerHTML"] = ((elapsed_min < 10 ? "0" : "") + elapsed_min + ((elapsed_min) < 10 ? ":0" : ":") + elapsed_sec + (+flags >= flags ? " #" : " ") + flags) && isValidGame()) ? setTimeout(updateText) : 0;
}

updateText();
for (let i = table.rows.length; i-- > 0; table.deleteRow(0));
let mineArray = new Array(h);
for (i = h; i-- > 0;) {
	mineArray[i] = new Array(w);
	r = table.insertRow(0);
	for (j = w; j-- > 0;) {
		d = r.insertCell(o = mineArray[i][j] = 0);
		[d.w, d.h, d.style] = [j, i, "width:24px;height:24px;border:solid;text-align:center;cursor:default"];
		d.onclick = function() {
			if (!isValidGame() || this["innerHTML"].match("[#-8]")) return;
			if (!o)
			do
			if (mineArray[y = (Math.random() * h) | 0][x = (Math.random() * w) | 0] < 1 && (Math.abs(this.w - x) > 1 || Math.abs(this.h - y) > 1) && mine_rest--) mineArray[y][x] = 1;
			while (mine_rest);
			if (!mineArray[this.h][this.w]) NoMineClick(this);
			else if (f = "Lose")
			for (i = h; i-- > 0;)
			for (j = w; j-- > 0;)
			if (mineArray[i][j]) t.rows[i].cells[j]["innerHTML"] = "※"
		};
		d.oncontextmenu = function() {
			if (isValidGame() && !this["innerHTML"].match("[*-8]"))
			if (!this["innerHTML"] && f-- > 0) this["innerHTML"] = "#";
			else if (++f) this["innerHTML"] = "";
			return !1
		}
	}
}

const NoMineClick = c => {
	if (!c || c["innerHTML"].match("[*-8]")) return;
	c.style.background = "gray";

	if (~c["innerHTML"].indexOf("#") && f++) T();

	if (!(c["innerHTML"] = (mineArray[y = c.h][(x = c.w) - 1] > 0) + (mineArray[y][x + 1] > 0) + (y > 0 && mineArray[y - 1][x - 1] > 0) + (y > 0 && mineArray[y - 1][x] > 0) + (y > 0 && mineArray[y - 1][x + 1] > 0) + (y < h - 1 && mineArray[y + 1][x - 1] > 0) + (y < h - 1 && mineArray[y + 1][x] > 0) + (y < h - 1 && mineArray[y + 1][x + 1] > 0)) && (c["innerHTML"] = "-"));

	for (c.i = 9; c.i-- > 0;) {
		if (c.i != 4) N(((X = c.w + 1 - (c.i / 3 | 0)) >= 0) * ((Y = c.h + 1 - c.i % 3) >= 0) * (X < w) * (Y < h) > 0 ? t.rows[Y].cells[X] : 0);
		if (++o >= w * h - m) f = "Win";
	}
}