class Entity{
	/**@param {Room} room*/
	constructor(room) {
		this.room = room;
		[this.x, this.y] = randomOf(room.air);
		this.x += (1 - this.s)/2;
		this.y += (1 - this.s)/2;
		this.ox = this.mx;
		this.oy = this.my;
		room.occupants.add(this);
		this.friction = friction;
	}
	tick() {}
	move(a) {
		this[a] += this["v" + a];
		this.inWall(a);
	}
	update() {
		if(this.goto) {
			if(this.goto != this.room) this.goto.occupants.delete(this);
			delete this.goto;
			delete this.door;
		}
		this.tick();
		this.ox = this.mx;
		this.oy = this.my;
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
					if(!tile.isOpen) {
						tile.open();
						this.room.updateTile(x, y);
					}
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
	set mx(x) {
		this.x = x - this.s/2;
	}
	get my() {
		return this.y + this.s/2;
	}
	set my(y) {
		this.y = y - this.s/2;
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
			var touch = this._isTouching(this.mx, this.my, this.s/2, what.mx + x, what.my + y, what.s/2);
			if(touch) return [x, y];
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
	/*collide(what) {
		var x = abs(what.ox - this.ox);
		var y = abs(what.oy - this.oy);
		
		if(x < y) a = "x";
		 else var a = "y";
		
		var va = "v"+a;
		var ma = "o"+a;
		
		var d = -this[ma] + what[ma];
		
		var m = this[va], w = what[va];
		
		this[va] = w * 1, what[va] = m * 1;
		
		//this[va] += 0.2 * sign(d);
		//what[va] += -.2 * sign(d);
	}*/
	static bounce(b, a) {
		//var {mass: bm} = b;
		//var {mass: am} = a;
		var bm = 0.01, am = 0.01;

		am = sqrt(am);
		bm = sqrt(bm);

		var hrad = a.radianTo(b);
		
		var as = a.s/2;
		var bs = b.s/2;
		
		//Center point
		var px = a.mx + as * cos(hrad);
		var py = a.my + as * sin(hrad);

		/*a.mx = px - cos(hrad) * as;
		a.my = py - sin(hrad) * as;
		b.mx = px + cos(hrad) * bs;
		b.my = py + sin(hrad) * bs;*/

		//Line radian
		var lrad = rDis(PI, hrad);
		
		var ar = atan(a.vy, a.vx);
		var br = atan(b.vy, b.vx);

		//Movement radian
		var amr = rDis(lrad, ar);
		var bmr = rDis(lrad, br);

		//Movement force
		var amf = cos(amr);
		var bmf = cos(bmr);

		if(sign(amf) > 0) amf = 0;
		if(sign(bmf) < 0) bmf = 0;

		//Movement saved
		var ams = abs(sin(amr));
		var bms = abs(sin(bmr));

		//Velocity force
		var avf = distance(a.vx, a.vy);
		var bvf = distance(b.vx, b.vy);

		var aforce = amf * avf;
		var bforce = bmf * bvf;

		var ab = 1;
		var ba = 1;

		var tm = am + bm;
		var abm = am/tm;
		var bam = bm/tm;

		//bms = bms + (1 - bms) * (bam - 1);
		//ams = ams + (1 - ams) * (abm - 1);

		b.vx = b.vx * bms - cos(hrad) * aforce * ab;
		b.vy = b.vy * bms - sin(hrad) * aforce * ab;
		a.vx = a.vx * ams - cos(hrad) * bforce * ba;
		a.vy = a.vy * ams - sin(hrad) * bforce * ba;
	}
	/*bounce(what) {
		var s = (this.s + what.s)/2;
		var test = (ax, bx, s) => (
			ax + s > bx &&
			bx + s > ax
		);
		var col = a => {
			var va = "v"+a;
			var oa = "o"+a;
			var ma = "m"+a;
			
			var d = what[oa] - this[oa];
			var b = this[va], c = what[va];
			var d = c + b;
			
			var f = b/d, h = c/d;
			
			var p = what[oa] * h + this[oa] * f;
			var s = -sign(d);
			
			this[ma] = p - s * (0.001 + this.s)/2;
			what[ma] = p + s * (0.001 + what.s)/2;
			
			this[va] = c;
			what[va] = b;
		};
		if(test(this.ox, what.ox, s)) {
			col("x");
		}else if(test(this.oy, what.oy, s)) {
			col("y");
		}else{
			col("x");
			col("y");
		}
	}*/
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
		this.melee = new Melee(this);
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
		var lim = .1;
		//if(weight) lim /= weight;
		if(aDis > lim) aDis = lim;
		this.vr += aDis * sign(dis);
		if(abs(rDis(this.dir, this.rad)) < lim) {
			this.vr = 0;
			this.rad = this.dir;
		}
		var item = this.inv.hotbar[this.inv.selected];
		if(item) item = item[0];
		if(item && item.melee) {
			this.melee.add();
			this.melee.s = item.s;
			this.inUse = true;
		}else if(this.melee.room) {
			this.melee.remove();
			this.inUse = false;
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
}
class Melee extends Entity{
	constructor(parent) {
		super(parent.room);
		this.room.occupants.delete(this);
		delete this.room;
		this.parent = parent;
	}
	tick() {
		var {parent} = this;
		var {rad} = parent;
		var c = cos(rad), s = sin(rad);
		var px = parent.mx + (parent.s/2 + this.s) * c - this.s/2;
		var py = parent.my + (parent.s/2 + this.s) * s - this.s/2;
		this.x = px;
		this.y = py;
		this.room = parent.room;
		var {lrad} = this;
		if(lrad) {
			this.lrad = rad;
			this.rad = atan(
				sin(rad) - sin(lrad),
				cos(rad) - cos(lrad)
			);
		}else{
			this.rad = rad;
			this.lrad = rad;
		}
	}
	draw() {}
	add() {
		var {parent} = this;
		if(parent.room != this.room) {
			this.room?.occupants.delete(this);
		}
		this.room = parent.room;
		this.room.occupants.add(this);
	}
	remove() {
		this.room.occupants.delete(this);
	}
	collide(what) {
		var {rad} = this;
		if(what instanceof Enemy) {
			//what.room.occupants.delete(what);
			what.vx += cos(rad) * player.vr;
			what.vy += sin(rad) * player.vr;
		}
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