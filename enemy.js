class Enemy extends Entity{
	brainMove() {
		var lines = [];
		var max;
		var add = (PI * 2)/64;
		for(let a = 0; a < PI * 2; a += add) {
			var num = 0;
			for(let [rad, pow] of this.brainPoints) {
				let n = pow < 0;
				num += abs(((cos(a - rad) + 1)/2) ** (n? 3: .7)) * pow;
			}
			if(isNaN(max) || num > max) {
				max = num;
			}
			lines.push([a, num]);
		}
		var [rad] = randomOf(lines.filter(([a, num]) => num == max));
		max = abs(max);
		if(max < .1) max = .1;
		if(max > 1) max = 1;
		this.vx += cos(rad) * this.spd;
		this.vy += sin(rad) * this.spd;
		this.crad = rad;
		this.cmax = max;
		this.lines = lines;
	}
	sightCheck() {
		var {mx, my, room} = this;
		var add = (PI * 2)/8;
		var lines = [];
		for(let a = 0; a < PI * 2; a += add) {
			lines.push([false, a, 0]);
		}
		var max = 2;
		for(let a = 0; a < max; a++) {
			for(let line of lines) {
				let [done, rad] = line;
				if(done) continue;
				let b = a;
				let x = floor(mx + cos(rad) * a);
				let y = floor(my + sin(rad) * a);
				let ty = y;
				let tx = x;
				if(room.valid(x, y)) {
					let tile = room.getTile(x, y);
					if(tile instanceof Block || (tile instanceof Door && !this.enemy)) {
						done = true;
						var bx = x + 1;
						var by = y + 1;

						let xs = [x, bx];
						let ys = [y, by];
						
						let hs = xs.map(x => tan(rad) * (x - mx) + my);
						let fs = ys.map(y => (y - my) / tan(rad) + mx);
						
						//(xs[n], hs[n]) (fs[n], ys[n])
						
						let dis;
						
						for(let i in xs) {
							let y = hs[i];
							let f = floor(y);
							if(f == ty || y == by) {
								let x = xs[i];
								let d = distance(x - mx, y - my);
								if(isNaN(dis)) dis = d;
								else if(dis > d) dis = d;
							}
						}
						
						for(let i in ys) {
							let x = fs[i];
							let f = floor(x);
							if(f == tx || y == bx) {
								let y = ys[i];
								let d = distance(x - mx, y - my);
								if(isNaN(dis)) dis = d;
								else if(dis > d) dis = d;
							}
						}
						if(isNaN(dis)) dis = a;
						
						b = dis;
					}else{
						
					}
				}
				if(done) {
					line[0] = true;
					line[2] = b;
				}
			}
		}
		lines = lines.filter(line => line[0]);
		this.collLines = lines;
		this.brainPoints.push(...lines.map(([done, rad, dis]) => [rad, -(1 - dis/max)/(1.5)]));
	}
	enemyCheck() {
		var {mx, my, room} = this;
		var add = (PI * 2)/16;
		var lines = [];
		for(let a = 0; a < PI * 2; a += add) {
			lines.push([false, a, 0]);
		}
		var entities = [];
		var max = 7;
		for(let a = 0; a < max; a++) {
			for(let line of lines) {
				let [done, rad] = line;
				if(done) continue;
				let b = a;
				let x = floor(mx + cos(rad) * a);
				let y = floor(my + sin(rad) * a);
				let ty = y;
				let tx = x;
				if(room.valid(x, y)) {
					if(room.getTile(x, y) instanceof Block) {
						done = true;
					}else var set = room.getEntities(x, y);
				}
				if(done) {
					line[0] = true;
					line[2] = b;
				}else if(set) {
					entities.push(...set);
				}
			}
		}
		this.entities = new Set(entities);
	}
	tick() {
		this.brainPoints = [];
		this.sightCheck();
		this.enemyCheck();
	}
}
class Slime extends Enemy{
	constructor(room) {
		super(room);
		this.rad = rand(PI * 2);
		this.pow = rand();
		this.hue = room.id/count * 360;
		if(!room.Slime) {
			room.Slime = document.createElement("canvas");
			room.SlimeCtx = room.Slime.getContext("2d");
		}
		this.canvas = room.Slime;
		this.ctx = room.SlimeCtx;
		var map = Bitmaps.Slime.body;
		if(map instanceof ImageBitmap) {
			this.canvas = map;
			delete this.ctx;
		}
		this.spd /= 2;
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
			var str = `hsla(${this.hue}, ${round(s * 100)}%, ${round(l * 80)}%, ${ca/255})`;
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
		/*if(this.enemy) {
			let player = this.enemy;
			ctx.strokeStyle = player.static > 1? "grey": "black";
			ctx.beginPath();
			ctx.moveTo(dx + this.mx * scale, dy + this.my * scale);
			let rad = this.radianTo(player);
			let dis = this.distance(player);
			var x = this.mx + cos(rad) * dis;
			var y = this.my + sin(rad) * dis;
			ctx.lineTo(dx + x * scale, dy + y * scale);
			ctx.stroke();
		}
		/*if(this.lines) for(let [rad, spd] of this.lines) {
			var dis = abs(spd) * 3;
			ctx.strokeStyle = spd > 0? "green": "red";
			ctx.beginPath();
			ctx.moveTo(dx + this.mx * scale, dy + this.my * scale);
			var x = this.mx + cos(rad) * dis;
			var y = this.my + sin(rad) * dis;
			ctx.lineTo(dx + x * scale, dy + y * scale);
			ctx.stroke();
		}
		if(this.collLines) for(let [d, rad, dis] of this.collLines) {
			ctx.fillStyle = "blue";
			ctx.beginPath();
			var x = this.mx + cos(rad) * dis;
			var y = this.my + sin(rad) * dis;
			ctx.arc(dx + x * scale, dy + y * scale, scale/16, 0, PI * 2);
			ctx.fill();
		}
		ctx.strokeStyle = "black";
		ctx.beginPath();
		ctx.moveTo(dx + this.mx * scale, dy + this.my * scale);
		var x = this.mx + cos(this.rad) * this.pow;
		var y = this.my + sin(this.rad) * this.pow;
		ctx.lineTo(dx + x * scale, dy + y * scale);
		ctx.stroke();
		/*ctx.lineWidth = 5;
		ctx.strokeStyle = "purple";
		ctx.beginPath();
		ctx.moveTo(dx + this.mx * scale, dy + this.my * scale);
		var x = this.mx + cos(this.crad) * this.cmax * 3;
		var y = this.my + sin(this.crad) * this.cmax * 3;
		ctx.lineTo(dx + x * scale, dy + y * scale);
		ctx.stroke();*/
		ctx.lineWidth = 1;
		//*/
	}
	tick() {
		super.tick();
		this.rad += rand(1, -1) * PI/16;
		this.pow += rand(1, -1) * 1/25;
		if(this.pow < 0) this.pow = 0;
		if(this.pow > 1) this.pow = 1;
		this.brainPoints.push([this.rad, this.pow * (this.enemy? .2: .7)]);
		{
			let rad = atan(this.vx, this.vy);
			this.brainPoints.push([rad, .3]);
		}
		if(this.entities.has(player)) {
			let {
				mx,
				my,
				x,
				y,
				vx,
				vy,
				room
			} = player;
			//vx = mx - this.mx;
			//vy = my - this.my;
			vx /= 2;
			vy /= 2;
			this.enemy = {x, y, mx, my, vx, vy, room, static: 0};
		}
		if(this.enemy) {
			let player = this.enemy;
			if(this.room == player.room || player.room.isConnectedTo(this.room)) {
				dis = this.distance(player);
				if(player.static && dis < 2) {
					let rad = this.radianTo(player);
					let vx = player.vx;
					let vy = player.vy;
					player.x += vx;
					player.y += vy;
					player.mx += vx;
					player.my += vy;
					if(this.room == player.room) {
						let x = floor(player.x);
						let y = floor(player.y);
						let {room} = this;
						let delet = false;
						if(!room.valid(x, y)) {
							delet = true;
						}else{
							let tile = room.getTile(x, y);
							delet = tile && !tile.passable;
						}
						if(delet) delete this.player;
					}
				}
				var dis, rad = this.radianTo(player);
				if(dis < 7) {
					this.brainPoints.push([rad, .8]);
					if(!player.static && dis < 3) {
						this.brainPoints.push([rad + PI, 1]);
					}
				}
				++player.static;
				if(player.static == 200) delete this.enemy;
			}else delete this.enemy;
		}
		this.brainMove();
	}
}