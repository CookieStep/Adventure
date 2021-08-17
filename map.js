class MiniMap{
	/**@param {Room[]} rooms*/
	constructor(rooms) {
		this.rooms = rooms;
		this.conns = [];
		/**@type {Map<Room, MapBlob}*/
		this.blobs = new Map;
		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext("2d");
	}
	sync() {
		var {rooms} = this;
		for(let room of rooms) {
			if(!this.blobs.has(room)) {
				this.blobs.set(room, new MapBlob(room));
			}
		}
		for(let room of rooms) {
			let roomb = this.blobs.get(room);
			for(let entrance in room.door) {
				entrance = +entrance;
				let Conn = room.door[entrance];
				if(!Conn) continue;
				let door = Conn.other(room);
				if(!door) continue;
				let doorb = this.blobs.get(door);
				if(rooms.includes(door)) {
					if(!roomb.door[entrance]) {
						let conn = new Connection(this, roomb, doorb, entrance);
						this.conns.push(conn);
						if(!("x" in roomb)) {
							roomb.x = doorb.x;
							roomb.y = doorb.y;
						}
						roomb.door[entrance] = conn;
						roomb.conns.add(doorb);
						if(!("x" in doorb)) {
							doorb.x = roomb.x;
							doorb.y = roomb.y;
						}
						doorb.door[gate(entrance)] = conn;
						doorb.conns.add(roomb);
					}
				}
			}
		}
	}
	conns = [];
	/**@param {Room[]} active for use with flowTest*/
	draw(room, active) {
		this.sync();
		var {canvas, ctx} = this;
		var blobArr = [...this.blobs.values()];
		var minX = min(...blobArr.map(blob => blob.x)) - .5;
		var minY = min(...blobArr.map(blob => blob.y)) - .5;
		var maxX = max(...blobArr.map(blob => blob.x)) + .5;
		var maxY = max(...blobArr.map(blob => blob.y)) + .5;


		var width  = maxX - minX;
		var height = maxY - minY;
		// var mx = minX + width/2;
		// var my = minY + height/2;
		var s = min(canvas.width/width, canvas.height/height);
		// console.log(s);

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for(let blob of blobArr) {
			if(blob.room.tiles[0]) {
				ctx.drawImage(blob.room.canvas, (blob.x - minX - .5) * s, (blob.y - minY - .5) * s, s, s);
			}else{
				ctx.beginPath();
				ctx.rect((blob.x - minX - .5) * s, (blob.y - minY - .5) * s, s, s);
				ctx.fillStyle = `hsl(${blob.room.id/count * 360}, 100%, 50%)`;
				ctx.fill();
				if(blob.room == room) {
					ctx.lineWidth = 3;
					ctx.stroke();
				}
			}
		}
		for(let conn of this.conns) {
			conn.draw(minX, minY, s, active);
		}
	}
	async settle(tick, max, func) {
		for(let a = 0; a < max; a += tick) {
			for(let conn of this.conns) {
				conn.update();
			}
			var blobArr = [...this.blobs.values()];
			var c = blobArr.length;
			for(let a = 0; a < c; a++) {
				let blob = blobArr[a];
				for(let b = a + 1; b < c; b++) {
					let bloob = blobArr[b];
					let dis = distance(blob.x - bloob.x, blob.y - bloob.y);
					if(!blob.dis || blob.dis > dis) {
						blob.dis = dis;
						blob.closest = bloob;
					}
					if(!bloob.dis || bloob.dis > dis) {
						bloob.dis = dis;
						bloob.closest = blob;
					}
				}
			}
			for(let blob of blobArr) {
				blob.update();
			}
			this.draw();
			if(func) func();
			await delay(tick);
		}
	}
}
class MapBlob{
	constructor(room) {
		this.room = room;
	}
	conns = new Set;
	update() {
		if(!("x" in this)) {
			this.x = 0;
			this.y = 0;
		}
		if(this.closest) {
			var {dis, closest} = this;
			var rad = atan(this.y - closest.y, this.x - closest.x);
			rad += PI;
			if(!this.conns.has(closest) && dis < 1.5) {//Push away
				closest.vx += cos(rad);
				closest.vy += sin(rad);
				this.vx -= cos(rad);
				this.vy -= sin(rad);
			}

			// if(dis > 10) {//Move closer
			// 	this.vx += cos(rad);
			// 	this.vy += sin(rad);
			// 	closest.vx -= cos(rad);
			// 	closest.vy -= sin(rad);
			// }
			
			delete this.closest;
			delete this.dis;
		}

		this.x += this.vx/150;
		this.y += this.vy/150;
		this.vx *= .5;
		this.vy *= .5;
	}
	/**@type {Blob[]}*/
	door = [];
	vx = 0;
	vy = 0;
	static adds = [
		[-.5, 0],
		[0, .5],
		[.5, 0],
		[0, -.5]
	];
}
class Connection{
	/**@param {MapBlob} room @param {MapBlob} door*/
	constructor(map, room, door, type) {
		this.map = map;
		this.rooms = [room, door];
		this.type = type;
		this.id = map.conns.push(this) - 1;
	}
	draw(x, y, s, options=[]) {
		var {ctx} = this.map;
		var {type} = this;
		var add = MapBlob.adds[type];
		var [room, door] = this.rooms;
		var rooms = this.rooms.map(blob => blob.room);
		var rx = room.x + add[0];
		var ry = room.y + add[1];
		var dx = door.x - add[0];
		var dy = door.y - add[1];
		var bold = 2;
		for (let [start, fromRoom, toRoom] of options) {
			if(rooms.includes(fromRoom) && rooms.indexincludesOf(toRoom.other(fromRoom))) {
				bold += 10;
			}
		}
		ctx.beginPath();
		ctx.strokeStyle = `hsl(${this.id/this.map.conns.length * 360}, 100%, 30%)`;
		ctx.moveTo((rx - x) * s, (ry - y) * s);
		ctx.lineTo((dx - x) * s, (dy - y) * s);
		ctx.lineWidth = bold;
		ctx.stroke();
	}
	update() {
		var {type} = this;
		var add = MapBlob.adds[type];
		var [room, door] = this.rooms;
		var rx = room.x + add[0];
		var ry = room.y + add[1];
		var dx = door.x - add[0];
		var dy = door.y - add[1];

		var dis = distance(rx - dx, ry - dy);
		var rad2 = atan(-add[1], -add[0]);
		var rad = atan(ry - dy, rx - dx);
		var rdis = rDis(rad, rad2);

		if(abs(rdis) > PI/16 || dis < .5) {//Move away
			var f = 1;
			room.vx += cos(rad2) * f;
			room.vy += sin(rad2) * f;
			door.vx -= cos(rad2) * f;
			door.vy -= sin(rad2) * f;
		}
		if(dis > 1) {//Pull back
			door.vx += cos(rad);
			door.vy += sin(rad);
			room.vx -= cos(rad);
			room.vy -= sin(rad);
		}
		/*if(dis > 2) {//Pull back
			door.vx += cos(rad);
			door.vy += sin(rad);
			room.vx -= cos(rad);
			room.vy -= sin(rad);
		}*/
	}
}
async function initRooms() {
	let done = [];
	let rest = shuffle(rooms);
	done.push(rest.shift());
	let a = 0;
	let mappad = length * 0.05;
	let map = new MiniMap(done);
	map.canvas.width = length * .9;
	map.canvas.height = length * .9;
	function drawMap() {
		ctx.clearRect(0, 0, innerWidth, innerHeight);
		ctx.drawImage(map.canvas, mappad, mappad);
	}
	if(debug.showConnect.enabled) {
		map.draw();
		drawMap();
		//await delay(debug.showConnect.afterSettle);
	}
	while(rest.length && ++a < 50) {
		var conn = randomOf(done);
		var gates = conn.door.filter(a => a).length;
		var room = rest.shift();
		if(rand(4) > gates && room.connectTo(conn)) {
			done.push(room);
			a = 0;
			if(debug.showConnect.enabled) {
				await map.settle(debug.showConnect.settleTick, debug.showConnect.afterSettle, drawMap);
			}
		}else{
			rest.push(room);
		}
	}
	if(a == 50) return true;
	var {length: l} = rooms;
	done = shuffle(done);
	for(let room of rooms) {
		if(rand() < 1/5) {
			if(room.connectTo(room) && debug.showConnect.enabled) {
				map.draw();
				drawMap();
				await delay(debug.showConnect.afterSettle);
			}
		}
	}
	for(let a = 0; a < 5; a++) {
		for(let i = 0; i < l; i++) {
			let room = done[i];
			for(let j = i + 1; j < l; j++) {
				let conn = done[j];
				if(round(rand())) {
					if(room.connectTo(conn) && debug.showConnect.enabled) {
						map.draw();
						drawMap();
						await delay(debug.showConnect.afterSettle);
					}
				}
			}
		}
	}
	var array = shuffle(rooms);
	for (let room of array) {
		if(room.type == START) mroom = room;
		stable = await flowTest(room);
		await room.build(stable);
	}
	//rooms.forEach(room => room.draw());
	map.draw();
	mmap = map;
	drawWorldMap = drawMap;
	/**@param {Room} room*/
	async function flowTest(room) {
		var doors = room.door.filter(r => !r.self);
		/**@type {[Gate, Room, Gate][]}*/
		var options = doors.map(door => [door, room, door]);
		/**@type {Set<Room>}*/
		var finished = new Set;
		var had = [];
		function hasHad([start, toRoom]) {
			return had.filter(([s, t]) => s == start && t == toRoom).length;
		}
		while (options.length) {
			/**@type {[Gate, Room, Gate][]}*/
			var newOptions = [];
			for (let [start, fromRoom, toRoom] of options) {
				if(finished.has(start)) continue;
				if(hasHad([start, toRoom])) continue;
				else had.push([start, toRoom]);
				if(toRoom.other(fromRoom) == room) {
					finished.add(start);
					finished.add(toRoom);
				//}else if(toRoom == start) {
					//continue;
				}else{
					// var arr = fromRoom.pump(toRoom).filter(r => r != toRoom && r != fromRoom.other(toRoom) && r != start);
					var arr = fromRoom.pump(toRoom).filter(r => r != toRoom && r != start);
					newOptions.push(...arr.map(door => [start, toRoom.other(fromRoom), door]));
				}
			}
			options = newOptions;
			if(debug.showFlowtest) {
				map.draw(room, options);
				drawMap();
				await delay(debug.showFlowtest);
			}
		}
		return finished;
	}
}
var mmap;