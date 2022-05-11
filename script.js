var canvas = document.createElement("canvas"),
ctx = canvas.getContext("2d");
CanvasRenderingContext2D.prototype.zoom = function(x, y, l=1, w=1, r, h, k) {
    if(r != undefined) {
        if(!h) {
            h = x + l/2;
            k = y + w/2;
        }
        var c = cos(r);
        var s = sin(r);
        this.setTransform(c * l, s * l, -s * w, c * w, h, k);
        this.translate(-(h-x)/l, -(k-y)/w);
    }else{
        this.setTransform(l, 0, 0, w, x, y);
    }
};
var {
	abs,
	random,
	round,
	ceil,
	floor,
	PI,
	min,
	max,
	sqrt,
	atan2: atan,
	tan,
	cos,
	sin,
	sign,
	pow
} = Math;

var rand = (t = 1, b = 0) => b + random() * (t - b);
var distance = (x, y) => sqrt(x ** 2 + y ** 2);
var gate = i => (i + 2) % 4;
var randomOf = ([...items]) => items[floor(rand(items.length))];
var sameArray = (arr, arr2) => {
	if(arr.length != arr2.length) return false;
	for(let i in arr) {
		if(arr[i] != arr2[i]) {
			return false;
		}
	}
	return true;
};

var loop = (value, max) => (value % max + max) % max;
var rotate = (value, range) => {
	if(value > +range/2) value -= range;
	if(value < -range/2) value += range;
	return value;
}
var rDis = (a, b, c=(PI * 2)) => rotate(loop(b - a, c), c);
var powR = (x, y) => (pow(x, y) - 1)/(x - 1);

var debug = {
	showBuild: 1,
	showBuildFlow: {
		enabled: false,
		flowTime: 1,
		afterFlow: 10
	},
	showConnect: {
		enabled: 1,
		settleTick: 1,
		afterSettle: 100
	},
	showFlowtest: 0
};
const SIZE = 15;
var count = 100;

var doorcoord = [
	[-1, 0],
	[0, 1],
	[1, 0],
	[0, -1]
];
var rcm = [];/*
var rcs = new Set;
var rcx = 0, rcy = 0;*/
var rcb;
function update() {
	try{
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, innerWidth, innerHeight);
	game.update();
	//mroom.updateEntities();
	//mroom.updateEntityConns();
	//mroom.update();
	//mroom.updateConns();
	rooms.forEach(room => {
		if(room.life || mroom == room) room.updateEntities();
	});
	rooms.forEach(room => {
		if(room.life || mroom == room) room.update();
	});
	// rooms.forEach(room => room.load());
	//mroom.draw();
	if(player.goto && !player.goto.loading) {player.goto
		.loadFromDoor(player.door).then((a) => a && makeRCM());
	}
	mroom.reload();
	mroom.reloadConns();
	//mroom.loadConns();
	// mroom.drawConns();
	var x = (canvas.width)/2;
	var y = (canvas.height)/2;
	x -= (player.px + player.s/2) * scale;
	y -= (player.py + player.s/2) * scale;
	/*ctx.drawImage(mroom.canvas, x, y);
	var room;
	if((room = mroom.conn[0]) && room.drawn) {
		var dx = x - room.canvas.width;
		var dy = y;
		ctx.drawImage(room.canvas, dx, dy);
		if(room.life > 100) room.drawEntities(dx, dy);
	}
	if((room = mroom.conn[3]) && room.drawn) {
		var dx = x;
		var dy = y - room.canvas.height;
		ctx.drawImage(room.canvas, dx, dy);
		if(room.life > 100) room.drawEntities(dx, dy);
	}
	if((room = mroom.conn[2]) && room.drawn) {
		var dx = x + mroom.canvas.width;
		var dy = y;
		ctx.drawImage(room.canvas, dx, dy);
		if(room.life > 100) room.drawEntities(dx, dy);
	}
	if((room = mroom.conn[1]) && room.drawn) {
		var dx = x;
		var dy = y + mroom.canvas.height;
		ctx.drawImage(room.canvas, dx, dy);
		if(room.life > 100) room.drawEntities(dx, dy);
	}
	mroom.drawEntities(x, y);*/
	/*if(rcx || rcy) for(let arr of rcm) {
		arr[1] += rcx;
		arr[2] += rcy;
	}
	let any = false;
	for(let a in rcm) {
		if(mroom == rcm[a][0]) {
			any = true;
		}
	}
	if(!rcm[0] || mroom != rcm[0][0]) {
		rcs.add(mroom);
		rcm.push([mroom, 0, 0]);
	}
	rcx = 0;
	rcy = 0;*/
	function makeRCM() {
		rcm = [[mroom, 0, 0]];
		var active = [rcm[0]];
		var used = new Set();
		used.add([mroom.id, 0, 0].join());
		for(let i = 0; i < 2; i++) {
			var arr = [];
			for(let [room, x, y] of active) {
				for(let i in room.conn) {
					let nroom = room.conn[i];
					if(!nroom) continue;
					let coord = doorcoord[i];
					let rx = x + coord[0];
					let ry = y + coord[1];
					let id = [nroom.id, rx, ry].join();
					if(used.has(id)) continue;
					used.add(id);
					let item = [
						nroom,
						rx,
						ry
					];
					if(nroom.drawn) {
						arr.push(item);
					}
					rcm.push(item);
				}
			}
			active = arr;
		}
		//rcm.sort(() => -1);
	}
	if(!rcm[0] || rcm[0][0] != mroom) makeRCM();
	for(let [room, mx, my] of rcm) {
		if(room.drawn) {
			var dx = x + mroom.canvas.width * mx;
			var dy = y + mroom.canvas.height * my;
			ctx.drawImage(room.canvas, dx, dy);
		}
	}
	for(let [room, mx, my] of rcm) {
		if(room.life > 100) {
			var dx = x + mroom.canvas.width * mx;
			var dy = y + mroom.canvas.height * my;
			room.drawEntities(dx, dy);
		}
	}
	var arr = player.inv.hotbar;
	var {max} = arr;
	{
		let scale = floor(canvas.length/(8 * max * (9/8))) * 8;
		var slot = 9/8 * scale;
		var simg = 5/8 * scale;
		var num = simg + scale/8;
		var y = canvas.height - slot;
		var pad = (slot - simg)/2;
		var {selected} = player.inv;
		for(let i = 0; i < max; i++) {
			let spot = arr[i];
			if(spot) var [item, count] = spot;
			let x = (canvas.width - (max - i * 2) * slot)/2;
			ctx.drawImage((i == selected)? Images.InUse: Images.Slot, x, y, slot, slot);
			if(spot) {
				let simg2 = item.s * scale;
				let pad2 = (slot - simg2)/2;
				ctx.drawImage(item.img, x + pad2, y + pad2, simg2, simg2);
				if(count - 1) {
					ctx.font = `${pad}px Arial`;
					ctx.fillStyle = "#000";
					ctx.fillText(count, x + num, y + pad);
					ctx.lineWidth = 1;
					ctx.strokeStyle = "#000";
					ctx.strokeText(count, x + num, y + pad);
				}
			}
			var mx = x + slot;
			var my = y + slot;
			for(let [id, touch] of touches) {
				if(player._isTouching(mx, my, slot, touch.x, touch.y, 0)) {
					player.inv.selected = i;
				}
			}
		}
	}
	touches.forEach(touch => touch.draw());
	//drawWorldMap();
	}catch(err) {document.write(err.stack)}
}
addEventListener("keydown", ({code}) => keys.add(code));
addEventListener("keyup", ({code}) => keys.delete(code));

/**@type {Room[]}*/
var rooms = [];
var length;
var zoom = 10;
function resize(zm) {
	var len = length;
	rcm = [];
	if(isNaN(zm)) zm = zoom/SIZE;
	canvas.width = innerWidth;
	canvas.height = innerHeight;
	length = Math.min(innerWidth, innerHeight);
	canvas.length = length;
	scale = floor(length/(SIZE*zm*8)) * 8;
	length = scale * SIZE;
	if(len != length) rooms.forEach(room => {
		if(room.drawn) {
			room.drawd = false;
			room.draw();
		}
	});
}
var player;
async function start() {
	document.body.appendChild(canvas);
	resize(1);
	for (let i = 0; i < count; i++) rooms.push(new Room(i));
	let finished = await initRooms();
	while(finished) {
		for(let room of rooms) room.door = [];
		resetTypes();
		finished = await initRooms();
	}
	resize(zoom/SIZE);
	for(let room of rooms) {
		let b = ceil(rand(4, 1));
		for(let a = 0; a < b; a++) new Slime(room);
	}//*/
	new Slime(mroom);
	player = new Player(mroom);
	player.inv.add(Sword);
	//player.update();
	mroom.reload();
	console.log("ready");
	setInterval(update, 25);
}
addEventListener("load", start);
addEventListener("resize", resize);
/**@type {Room}*/
var mroom, stable, drawWorldMap;
function shuffle([...items]) {
	var {
		length: l
	} = items;
	for (let i = 0; i < l; i++) {
		let n = floor(rand((l, i)));
		[items[n],
			items[i]] = [items[i],
			items[n]];
	}
	return items;
}
var delay = time => new Promise(resolve => setTimeout(resolve, time));
const START = Symbol();
const CHEST = Symbol();
const EMPTY = Symbol();
const MAZE = Symbol();
const PATH = Symbol();
function resetTypes() {
	types = {
		[START]: 1,
		[CHEST]: 5,
		[MAZE]: 3,
		[PATH]: 2
	};
}
var types;
var keys = new Set;
resetTypes();
var getTypes = () => shuffle(Object.getOwnPropertySymbols(types).filter(type => types[type] > 0));

var game = {
	update() {
		var vx = 0, vy = 0;
		var px = 0, py = 0;
		var s = scale * 2;
		var dis2 = 0;
		if(touches.size) {
			let touch = touches.get(0);
			if(touch && touch.active) {
				vx += touch.mx / s;
				vy += touch.my / s;
			}
			touch = touches.get(1);
			if(touch && touch.active) {
				px += touch.mx / s;
				py += touch.my / s;
				dis2 = 1;
			}
			//Mouse
			touch = touches.get(-1);
			if(touch && touch.active) {
				touch.drawMode = "line";
				touch.sx = innerHeight/2;
				touch.sy = innerWidth/2;
				px += touch.mx / s;
				py += touch.my / s;
				dis2 = 1;
			}
		}
		if(keys.has("KeyA")) {
			vx -= 1;
		}
		if(keys.has("KeyD")) {
			vx += 1;
		}
		if(keys.has("KeyW")) {
			vy -= 1;
		}
		if(keys.has("KeyS")) {
			vy += 1;
		}
		if(keys.has("ArrowLeft")) {
			px -= 1;
			dis2 = 1;
		}
		if(keys.has("ArrowRight")) {
			px += 1;
			dis2 = 1;
		}
		if(keys.has("ArrowUp")) {
			py -= 1;
			dis2 = 1;
		}
		if(keys.has("ArrowDown")) {
			py += 1;
			dis2 = 1;
		}
		var rad = atan(vy, vx);
		var rad2 = atan(py, px);
		var dis = distance(vx, vy);
		if(dis > 1) dis = 1;
		this.mx = cos(rad) * dis;
		this.my = sin(rad) * dis;
		this.px = cos(rad2) * dis2;
		this.py = sin(rad2) * dis2;
	}
}
