class Entity{
	/**@param {Room} room*/
	constructor(room) {
		this.room = room;
		[this.x, this.y] = randomOf(room.air);
		this.x += (1 - this.s)/2;
		this.y += (1 - this.s)/2;
		room.occupants.add(this);
		this.friction = friction;
	}
	tick() {}
	update() {
		if(this.goto) {
			if(this.goto != this.room) this.goto.occupants.delete(this);
			delete this.goto;
			delete this.door;
		}
		this.tick();
		this.x += this.vx;
		this.inWall("x");
		this.y += this.vy;
		this.inWall("y");
		this.vx *= this.friction;
		this.vy *= this.friction;
		if(this.goto && this.inRoom() <= 2) {
			this.room.occupants.delete(this);
			var room = this.goto;
			room.occupants.add(this);
			var type = this.door;
			this.room = room;
			if(type == 0) {
				this.x += room.SIZE;
				//if(this instanceof Player) rcx = +1;
			}
			if(type == 3) {
				this.y += room.SIZE;
				//if(this instanceof Player) rcy = +1;
			}
			if(type == 2) {
				this.x -= room.SIZE;
				//if(this instanceof Player) rcx = -1;
			}
			if(type == 1) {
				this.y -= room.SIZE;
				//if(this instanceof Player) rcy = -1;
			}
			if(this.goto.life < 150) {
				this.goto.life = 150;
			}
			delete this.goto;
			delete this.door;
		}
		this.px = round(this.x * scale)/scale;
		this.py = round(this.y * scale)/scale;
	}
	inRoom() {
		var sx = floor(this.x);
		var sy = floor(this.y);
		var bx = floor(this.x + this.s);
		var by = floor(this.y + this.s);
		var {SIZE} = this.room;
		var a = 4;
		for(let v of [sx, sy, bx, by]) {
			if(v >= SIZE || v < 0) --a;
		}
		return a;
	}
	addToRoom() {
		/*
		var sx = floor(this.x);
		var sy = floor(this.y);
		var bx = floor(this.x + this.s);
		var by = floor(this.y + this.s);
		var {room} = this;
		var {SIZE} = room;
		var coords = [[sx, sy], [sx, by], [bx, sy], [bx, by]];
		for(let [x, y] of coords) {
			if(x >= SIZE || x < 0 || y >= SIZE || y < 0) ;
			else{
				room.addEntity(x, y, this);
			}
		}
		*/
		var x = floor(this.mx);
		var y = floor(this.my);
		var {room} = this;
		if(room.valid(x, y)) room.addEntity(x, y, this);
	}
	inWall(a) {
		var o = a == "x"? "y": "x";
		var n = ["x", "y"].indexOf(a);
		var va = "v" + a;
		var sx = floor(this.x);
		var sy = floor(this.y);
		var bx = floor(this.x + this.s);
		var by = floor(this.y + this.s);
		var {SIZE} = this.room;
		
		[sx, sy, bx, by] = [sx, sy, bx, by].map(n => {
			if(n < 0) return 0;
			if(n >= SIZE - 1) return SIZE - 1;
			return n;
	   });

		var dir = [0, 0];

		var coords = [[sx, sy], [sx, by], [bx, sy], [bx, by]];
		/**@type {[number, number][]}*/
		var blocks = [];
		for(let arr of coords) {
			let [x, y] = arr;
			var tile = this.room.getTile(x, y);
			if(tile && !tile.passable) {
				blocks.push(arr);
			}else{
				blocks.push(null);
				if(tile instanceof Door) {
					this.goto = tile.door;
					this.door = tile.type;
					tile.door.occupants.add(this);
				}
				if(tile instanceof Chest && this instanceof Player) {
					if(!tile.isOpen) tile.open();
					this.room.updateTile(x, y);
				}
			}
		}
		var barriers = blocks.filter(b => b);
		var total = barriers.length;
		// var xs = barriers.map(([x, y]) => x);
		// var ys = barriers.map(([x, y]) => y);
		// var lx = min(...xs);
		// var ly = min(...ys);
		// var tx = max(...xs);
		// var ty = max(...ys);
		var slopes = barriers.filter(tile => this.room.getTile(...tile) instanceof BlockSlope);

		if(total) {
			if(this[va] > 0) { //down
				this[a] = [sx, sy][n] + (1 - this.s - 0.001);
				this[va] = -abs(this[va]);
			}else{//up
				this[a] = [bx, by][n];
				this[va] = abs(this[va]);
			}
		}

		// if(dir[0] || dir[1]) {
		// 	var rad = atan(dir[1], dir[0]);

		// 	var force = 0.5;

		// 	this.vx += cos(rad) * force;
		// 	this.vy += sin(rad) * force;
		// }
	}
	get mx() {
		return this.x + this.s/2;
	}
	get my() {
		return this.y + this.s/2;
	}
	radianTo(what) {
		var arr = this.room.conn.map((val, id) => [val, id]).filter(([room]) => room == what.room);
		var room = what.room;
		if(room != this.room && arr.length == 0) throw Error("Rooms are not connected");
		if(room == this.room) {
			arr = [[room, -1]];
		}
		var dis = [];
		for(let type of arr.map(([room, type]) => type)) {
			let x = 0, y = 0;
			if(type == 0) {
				x -= room.SIZE;
			}
			if(type == 3) {
				y -= room.SIZE;
			}
			if(type == 2) {
				x += room.SIZE;
			}
			if(type == 1) {
				y += room.SIZE;
			}
			let rad = atan(what.my - this.my + y, what.mx - this.mx + x);
			let dist = distance(this.my - (what.my + y), this.mx - (what.mx + x));
			dis.push([dist, rad]);
		}
		return dis.reduce(([d, r], [d2, r2]) => {
			if(d > d2) return [d2, r2]
			else return [d, r];
		})[1];
	}
	distance(what) {
		var arr = this.room.conn.map((val, id) => [val, id]).filter(([room]) => room == what.room);
		var room = what.room;
		if(room != this.room && arr.length == 0) throw Error("Rooms are not connected");
		if(room == this.room) {
			arr = [[room, -1]];
		}
		var dis = [];
		for(let type of arr.map(([room, type]) => type)) {
			let x = 0, y = 0;
			if(type == 0) {
				x -= room.SIZE;
			}
			if(type == 3) {
				y -= room.SIZE;
			}
			if(type == 2) {
				x += room.SIZE;
			}
			if(type == 1) {
				y += room.SIZE;
			}
			dis.push(distance(this.my - (what.my + y), this.mx - (what.mx + x)));
		}
		return min(...dis);
	}
	isTouching(what) {
		var arr = this.room.conn.map((val, id) => [val, id]).filter(([room]) => room == what.room);
		var room = what.room;
		if(room != this.room && arr.length == 0) {
			console.error("Rooms are not connected");
			return false;
		}
		if(room == this.room) {
			arr = [[room, -1]];
		}
		for(let type of arr.map(([room, type]) => type)) {
			let x = 0, y = 0;
			if(type == 0) {
				x -= room.SIZE;
			}
			if(type == 3) {
				y -= room.SIZE;
			}
			if(type == 2) {
				x += room.SIZE;
			}
			if(type == 1) {
				y += room.SIZE;
			}
			var touch = this._isTouching(this.mx, this.my, this.s, what.mx + x, what.my + y, what.s);
			if(touch) return true;
		}
		return false;
	}
	_isTouching(x, y, s, x2, y2, s2) {
		var s = s + s2;
		var ax = x;
		var bx = x2;
		var ay = y;
		var by = y2;
		return(ax + s > bx
			&& bx + s > ax
			&& ay + s > by
			&& by + s > ay
		);
	}
	collide(what) {
		
	}
	spd = 3/50;
	x = 0;
	y = 0;
	vx = 0;
	vy = 0;
	s = 5/8;
}
var friction = 0.8;
class Player extends Entity{
	constructor(room) {
		super(room);
		this.canvas = document.createElement("canvas");
		this.ctx = this.canvas.getContext("2d");
		var map = Bitmaps.Slime.body;
		if(map instanceof ImageBitmap) {
			this.canvas = map;
			delete this.ctx;
		}
	}
	drawCanv(scale) {
		var map = Bitmaps.Slime.body;
		var {ctx} = this;
		for(let dx = 0, p = 0; dx < 18; dx++) for(let dy = 0; dy < 18; ++dy, ++p) {
			let vy = 0, vx = 0;
			if(dx >= 5) vx = 1;
			if(dx >= 10) vx = 2;
			if(dy >= 5) vy = 1;
			if(dy >= 10) vy = 2;
			let n = p * 4;
			let data = map.data;
			let r = data[n++];
			let g = data[n++];
			let cb = data[n++];
			let ca = data[n];
			//if(!r && !g && !cb) continue;
			if(!ca) continue;
			let {h, s, l} = RGBtoHSL(r, g, cb);
			// console.log(s, v);
			var str = `hsla(220, ${round(s * 100)}%, ${round(l * 100)}%, ${ca/255})`;
			ctx.fillStyle = str;
			// console.log(v);
			// ctx.fillStyle = `rgba(${r}, ${cb}, ${b}, ${ca/255})`;
			ctx.fillRect((dy/8) * scale + vy, (dx/8) * scale + vx, scale/8, scale/8);
		}
	}
	draw(dx, dy, scale) {
		var {px: x, py: y, s} = this;
		var len = s * scale;
		if(this.ctx && this.canvas.length != len) {
			this.canvas.width = len * 3 + 2;
			this.canvas.height = len * 3 + 2;
			this.canvas.length = len;
			this.drawCanv(scale);
		}
		var vx = round(this.vx * 10);
		var vy = round(this.vy * 10);
		if(vx < -1) vx = -1;
		if(vx > +1) vx = +1;
		if(vy < -1) vy = -1;
		if(vy > +1) vy = +1;
		++vx; ++vy;
		ctx.drawImage(this.canvas, vx * len + vx, vy * len + vy, len, len, dx + x * scale, dy + y * scale, len, len);
		var item = this.inv.hotbar[this.inv.selected];
		if(item) {
			item = item[0];
			var {rad} = this;
			var c = cos(rad), s = sin(rad);
			var px = this.mx + (this.s/2 + item.s) * c - item.s/2;
			var py = this.my + (this.s/2 + item.s) * s - item.s/2;
			var len = item.s * scale;
			px *= scale;
			py *= scale;
			
			ctx.zoom(dx + px, dy + py, len, len, rad + item.rad);
			ctx.drawImage(item.img, 0, 0, 1, 1);
			ctx.resetTransform();
		}
	}
	tick() {
		this.vx += game.mx * this.spd;
		this.vy += game.my * this.spd;
		this.room.life = 200;
		if(game.px || game.py) {
			this.dir = atan(game.py, game.px);
		}
		var f = friction ** 1.5;
		this.rad += this.vr;
		this.vr *= f;
		
		var dis = rDis(this.rad + this.vr * powR(f, 100), this.dir);
		var aDis = abs(dis);
		var lim = .07
		//if(weight) lim /= weight;
		if(aDis > lim) aDis = lim;
		this.vr += aDis * sign(dis);
		if(abs(rDis(this.dir, this.rad)) < lim) {
			this.vr = 0;
			this.rad = this.dir;
		}
	}
	update() {
		super.update();
		mroom = this.room;
		if(this.goto && this instanceof Player) {
			this.goto.life = 200;
		}
	}
	vr = 0;
	dir = 0;
	rad = 0;
	inv = new Inventory(this);
	collide(what) {
	}
}
function Inventory(parent) {
	var itemMap = new Map;
	var hotbar = [];
	hotbar.max = 7;
	var inv = [];
	inv.max = 7 * 3;
	this.hotbar = hotbar;
	this.inventory = inv;
	this.selected = 0;
	Object.defineProperty(this, "main", () => this.hotbar[this.selected]);
	this.add = function(item, count=1) {
		if(itemMap.has(item)) {
			var slot = itemMap.get(item);
			slot[1] += count;
			return true;
		}else{
			for(let i = 0; i < hotbar.max; i++) {
				if(!hotbar[i]) {
					addItem(hotbar, i);
					return true;
				}
			}
			for(let i = 0; i < inv.max; i++) {
				if(!inv[i]) {
					addItem(inv, i);
					return true;
				}
			}
			function addItem(arr, i) {
				var slot = [item, count];
				itemMap.set(item, slot);
				arr[i] = slot;
			}
		}
	}
}