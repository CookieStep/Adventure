class Room {
	/**@type {Gate[]}*/
	door = [];
	/**@type {Room[]}*/
	conn = [];
	/**@type {Set<Gate>[]}*/
	groups;
	/**@type {(Door | Block)[]}*/
	tiles = [];
	entities = [];
	getTile(x, y) {
		var i = this.I(x, y);
		return this.tiles[i];
	}
	getEntities(x, y) {
		var i = this.I(x, y);
		if(!this.entities[i]) {
			this.entities[i] = new Set;
		}
		return this.entities[i];
	}
	addEntity(x, y, entity) {
		var i = this.I(x, y);
		if(!this.entities[i]) {
			this.entities[i] = new Set;
		}
		this.entities[i].add(entity);
	}
	/**@param {number} x @param {number} y*/
	I(x, y) {
		if (x >= SIZE || x < 0) {
			throw RangeError("(x: " + x + ") is not between 0 and " + SIZE);
		}
		if (y >= SIZE || y < 0) {
			throw RangeError("(y: " + y + ") is not between 0 and " + SIZE);
		}
		return x + y * SIZE;
	}
	isConnectedTo(room) {
		return this.conn.indexOf(room) != -1;
	}
	setTile(x, y, tile) {
		var i = this.I(x, y);
		this.tiles[i] = tile;
	}
	constructor(id) {
		this.id = id;
		var type = getTypes().pop();
		if (type) types[type]--;
		else type = null;
		this.type = type;
		this.SIZE = SIZE;
		this.canvas = document.createElement("canvas");
		this.ctx = this.canvas.getContext("2d");
	}
	/**@param {Room} room*/
	canConnectTo(room) {
		var gates = [];
		if ((this.type == MAZE) && room == this) return;
		var types = [this.type,
			room.type];
		var a = 0;
		if (types.includes(CHEST)) a++;
		if (types.includes(START)) a++;
		if (types.includes(EMPTY)) a++;
		if(a && types[0] == types[1]) a++;
		if (a == 2) return;
		for (let i = 0; i < 3; i++) {
			if (!this.door[i] && !room.door[gate(i)]) {
				gates.push(i);
			}
		}
		if (this.full() || room.full()) return;
		if (gates.length) return gates;
	}
	/**@param {Gate} gate*/
	pump(gate) {
		var room = gate.other(this);
		return room.getGroup(gate);
	}
	/**@param {Set<Room>} rooms*/
	async build(stableRooms) {try{
		//Setup border & doors
		/**@type {[number, number][]}*/
		var air = [];
		var {SIZE} = this;
		/**@type {[number, number, Room][]}*/
		var doors = [];
		var points = [];
		for (let x = 0; x < SIZE; x++) {
			for (let y = 0; y < SIZE; y++) {
				var tile = null;
				var door;
				let w = (SIZE - 1)/2;
				let blank = false;
				if (x == 0) {
					if((door = this.door[0]) && (y >= door.a && y <= door.b)) {
						tile = new Door(this, door, 0, x, y);
					} else tile = new Block(this, x, y);
				} else if (y == 0) {
					if((door = this.door[3]) && (x >= door.a && x <= door.b)) {
						tile = new Door(this, door, 3, x, y);
					} else tile = new Block(this, x, y);
				} else if (x == SIZE - 1) {
					if((door = this.door[2]) && (y >= door.a && y <= door.b)) {
						tile = new Door(this, door, 2, x, y);
					} else tile = new Block(this, x, y);
				} else if (y == SIZE - 1) {
					if((door = this.door[1]) && (x >= door.a && x <= door.b)) {
						tile = new Door(this, door, 1, x, y);
					} else tile = new Block(this, x, y);
				}
				if(!tile) {
					if (x == 1) {
						if((door = this.door[0]) && (y >= door.a && y <= door.b)) {
							blank = true;
						}
					}
					if (y == 1) {
						if((door = this.door[3]) && (x >= door.a && x <= door.b)) {
							blank = true;
						}
					}
					if (x == SIZE - 2) {
						if((door = this.door[2]) && (y >= door.a && y <= door.b)) {
							blank = true;
						}
					}
					if (y == SIZE - 2) {
						if((door = this.door[1]) && (x >= door.a && x <= door.b)) {
							blank = true;
						}
					}
				}
				if (!tile && !blank) air.push([x, y]);
				else if (tile instanceof Door) {
					doors.push([x, y, tile.gate]);
				}
				this.setTile(x, y, tile);
			}
		}
		this.doorTiles = doors;
		if (this.type == EMPTY) {
			this.air = air;
			return;
		}
		var ori = air;
		air = shuffle(air);
		if (this.type == CHEST) {
			var [x,
				y] = air.shift();
			var i = this.I(x, y);
			var chest = new Chest(this, i, x, y);
			this.tiles[i] = chest;
			points.push([x, y, chest]);
		}
		if (this.type == MAZE) {
			let a = floor(rand(11, 15));
			for (let i = 0; i < a; i++) {
				var [x, y] = air.shift();
				// var i = this.I(x, y);
				// var chest = new Chest(this, i);
				// this.tiles[i] = chest;
				points.push([x, y, {i: i/a}]);
			}
		}
		if(this.type == null) {
			let m = floor(rand(2, 6));
			for (let i = 0; i < m; i++) {
				var [x, y] = air.shift();
				// var i = this.I(x, y);
				// var chest = new Chest(this, i);
				// this.tiles[i] = chest;
				let a = {i: i/m};
				let b = {i: i/m};
				points.push([x, y, a]);
				var [x, y] = air.shift();
				points.push([x, y, b]);
				a.friend = b;
				b.friend = a;
			}
		}
		var draw = () => {
			this.draw(true);
			return delay(debug.showBuild);
		}
		if (debug.showBuild) await draw();
		//Place each block loop
		/**@type {Set<Gate>[]}*/
		var Groups;
		let first = true;
		let turns = 0;
		var order;
		if (this.type == MAZE) {
			order = air;
		}else if(this.type == CHEST) {
			order = dropletOrder(5, this);
		} else order = cornerDrops(0, this);
		if(this.type == START) {
			let set = new Set(this.door.filter(door => door));
			Groups = [set];
			this.entered = set;
		}else for (let [x, y] of order) {
			let i = this.I(x, y);
			let tiles = [...this.tiles];
			tiles[i] = new Block(this, x, y);
			/**@type {number[]}*/
			let spreadMap = new Array(tiles.length);
			let active = Array.from(doors);
			active.push(...points);
			/**@type {Set<Set<Room>>}*/
			let groups = new Map;
			this.door.forEach(room => groups.set(room, new Set([room])));
			points.forEach(([x, y, point]) => groups.set(point, new Set([point])));
			let drawFlow = () => {
					draw();
					for (let x = 0; x < SIZE; x++) {
						for (let y = 0; y < SIZE; y++) {
							let i = this.I(x, y);
							let tile = spreadMap[i];
							if (!tile) continue;
							if(tile instanceof Gate) ctx.fillStyle = `hsl(${tile.other(this).id/count * 360}, 100%, 50%)`;
							else if(tile instanceof Chest) ctx.fillStyle = "#5a2a10";
							else ctx.fillStyle = `hsl(${tile.i * 360}, 75%, 75%)`;
							ctx.fillRect(x * scale, y * scale, scale, scale);
						}
					}
					return delay(debug.showBuildFlow.flowTime);
				}
			turns = 0;
			var f = this.type == MAZE? alls: near;
			while (active.length) {
				let array = [];
				++turns;
				for (let [x, y, c] of active) {
					f(x, y).forEach(([x, y]) => {
						//Foreach nearby block
						let i = this.I(x, y);
						let tile = tiles[i];
						if (tile == null) {
							if (spreadMap[i]) {
								if (spreadMap[i] != c) {
									join(c, spreadMap[i]);
								}
							} else {
								spreadMap[i] = c;
								array.push([x, y, c]);
							}
						}
					});
				}
				if (debug.showBuildFlow.enabled) {
					await drawFlow();
				}
				active = array;
			}
			if (debug.showBuildFlow.enabled) {
				await delay(debug.showBuildFlow.afterFlow);
			}
			groups = new Set(groups.values());
			let stable;
			if (stableRooms.size) {
				stable = groups.size;
				for (let group of groups) {
					let groupStable = false;
					let friendStable = true;
					let doors = 0;
					for(let a of group) {
						if(stableRooms.has(a)) groupStable = true;
						if(a instanceof Gate) ++doors;
						if(a.friend && !group.has(a.friend)) friendStable = false;
					}
					if(doors < 2 || !groupStable || !friendStable) {
						stable = false;
						break;
					}
				}
			} else
			{
				stable = groups.size == 1;
				// if(this.door.filter(i => i).length == 1) stable = true;
			}
			if(this.type == START) {
				stable = groups.size == 1;
			}
			if (stable) {
				this.tiles = tiles;
				if(debug.showBuild) this.updateTile(x, y);
				Groups = [...groups];
			} else if (first) throw Error("unstable first try");

			first = false;
			/**@param {Room} a @param {Room} b*/
			function join(a, b) {
				var ga = groups.get(a) || new Set([a]);
				var gb = groups.get(b) || new Set([b]);
				var gc = new Set([...ga, ...gb]);
				gc.forEach(n => groups.set(n, gc));
			}
			if (debug.showBuild) await draw();
		}
		/**@param {Room} room*/
		function dropletOrder(drops, room, max = 0) {
			var airs = new Set(air.map(([x, y]) => room.I(x, y)));
			/**@type {[number, number][]}*/
			var arr = shuffle(air);
			arr.length = drops;
			if (room.groups) for (let group of room.groups) {
				if (group.size == 1) {
					let [room] = [...group];
					let drs = doors.filter(door => door[2] == room);
					let door = drs[floor(rand(drs.length))];
					arr.unshift([...randomOf(near(...door)), true]);
				}
			}
			if(room.type == CHEST) {
				arr.unshift([...points[0], true]);
			}
			var active = [...arr];
			let spreadMap = new Array(room.tiles.length);
			let a = 0;
			while (active.length) {
				let array = [];
				for (let [x, y] of active) {
					alls(x, y).forEach(([x, y]) => {
						//Foreach nearby block
						let i = room.I(x, y);
						if (!spreadMap[i]) {
							spreadMap[i] = 1;
							array.push([x, y]);
							if (airs.has(i)) arr.push([x, y]);
						}
					});
				}
				if (++a == max) break;
				active = shuffle(array);
			}
			return arr.filter(([x, y, d]) => !d);
		}
		/**@param {Room} room*/
		function cornerDrops(drops, room, max = 0) {
			var airs = new Set(air.map(([x, y]) => room.I(x, y)));
			var f = round(SIZE/2);
			/**@type {[number, number][]}*/
			var arr = [[2, 2], [2, SIZE - 3], [SIZE - 3, 2], [SIZE - 3, SIZE - 3], [f, f]];
			arr = shuffle(arr);
			arr.length = 3;
			//arr.length = drops;
			/*if (room.groups) for (let group of room.groups) {
				if (group.size == 1) {
					let [room] = [...group];
					let drs = doors.filter(door => door[2] == room);
					let door = drs[floor(rand(drs.length))];
					arr.unshift([...randomOf(near(...door)), true]);
				}
			}
			if(room.type == CHEST) {
				arr.unshift([...points[0], true]);
			}*/
			var active = [...arr];
			let spreadMap = new Array(room.tiles.length);
			let a = 0;
			while (active.length) {
				let array = [];
				for (let [x, y] of active) {
					alls(x, y).forEach(([x, y]) => {
						//Foreach nearby block
						let i = room.I(x, y);
						if (!spreadMap[i]) {
							spreadMap[i] = 1;
							array.push([x, y]);
							if (airs.has(i)) arr.push([x, y]);
						}
					});
				}
				if (++a == max) break;
				active = shuffle(array);
			}
			return arr.filter(([x, y, d]) => !d);
		}
		/**@param {number} x @param {number} y*/
		function near(x, y) {
			return nearby.map(([dx, dy]) => [x + dx, y + dy]).filter(([x, y]) => (x >= 0 && y >= 0 && x < SIZE && y < SIZE));
		}
		/**@param {number} x @param {number} y*/
		function alls(x, y) {
			return allby.map(([dx, dy]) => [x + dx, y + dy]).filter(([x, y]) => (x >= 0 && y >= 0 && x < SIZE && y < SIZE));
		}
		this.groups = [];
		//DO NOT ADD SELF CONNECTIONS TO GROUPS!!!
		//Do not add points to groups
		for (let group of Groups) {
			let set = new Set;
			group.forEach(gate => {
				if (gate instanceof Gate)
					if (!gate.self) set.add(gate);
			});
			this.groups.push(set);
		}
		/**@type {[number, number][]}*/
		let path = [];
		for(let x = 0; x < SIZE; x++) for(let y = 0; y < SIZE; y++) {
			if(!this.getTile(x, y)) {
				path.push([x, y]);
			}
		}
		air = shuffle(air);
		first = true;
		//Break useless blocks loop
		
		if (this.type == MAZE) {
			order = shuffle(air);
			//order = [...order, ...order];
			for (let [x, y] of order) {
				let i = this.I(x, y);
				
				let test = (a, b) => {
					if(a[0] == b[0] || a[1] == b[1]) return;
					else{
						let tile = this.getTile(
							a[0] + b[0] - x,
							a[1] + b[1] - y
						);
						if(!tile) return true;
					}
				}
				
				/*let ts = 0;
				while (active.length) {
					let array = [];
					++ts;
					for (let [x, y, c] of active) {
						near(x, y).forEach(([x, y]) => {
							//Foreach nearby block
							let i = this.I(x, y);
							let tile = newTiles[i];
							if (tile == null) {
								if (spreadMap[i]) {
									if (spreadMap[i] != c) {
										join(c, spreadMap[i]);
									}
								} else {
									spreadMap[i] = c;
									array.push([x, y, c]);
								}
							}
						});
					}
					//if(groups.size == Groups.length) break;
					if (debug.showBuildFlow.enabled) {
						await drawFlow();
					}
					active = array;
				}
				if (debug.showBuildFlow.enabled) {
					await delay(debug.showBuildFlow.afterFlow);
				}*/
				//let stable = true, fs = false;
				//if(first) turns = ts;
				//first = false;
				//if(this.tiles[i]) continue;
				var arr = near(x, y).filter(([x, y]) => !this.getTile(x, y));
				if(arr.length > 1) {
					if(arr.length == 2) {
						var [a, b] = arr;
						if(a[0] == b[0] || a[1] == b[1]) continue;
						else{
							let tile = this.getTile(
								a[0] + b[0] - x,
								a[1] + b[1] - y
							);
							if(!tile) continue;
						}
					}else if(arr.length == 3) {
						var a = test(arr[0], arr[1]);
						var b = test(arr[0], arr[2]);
						var c = test(arr[1], arr[2]);
						if(!(a || b || c)) continue;
					}
				}else continue;
				this.tiles[i] = null;
				/*/**@param {Room} a @param {Room} b
				function join(a, b) {
					var ga = groups.get(a) || new Set([a]);
					var gb = groups.get(b) || new Set([b]);
					var gc = new Set([...ga, ...gb]);
					gc.forEach(n => groups.set(n, gc));
				}*/
				if (debug.showBuild) {
					this.updateTile(x, y);
					let prom = draw();
					
					/*ctx.fillStyle = "black";*/
					ctx.fillStyle = "black";
					ctx.fillRect(x * scale, y * scale, scale, scale);
					await prom;
					//if(!stable) await delay(200);
				}
			}
		} else {
			var order;
			//if(this.type == CHEST) {
			if(false) {
				order = dropletOrder(1, this, 3);
				order = [...order, ...order];
			}else order = shuffle(air);
			if(this.type != START) for (let [x, y] of order) {
				let i = this.I(x, y);
				let newTiles = [...this.tiles];
				newTiles[i] = null;
				/**@type {number[]}*/
				let spreadMap = new Array(newTiles.length);
				let active = Array.from(doors);
				/**@type {Set<Set<Room>>}*/
				let groups = new Map;
				this.door.forEach(room => groups.set(room, new Set([room])));
				let drawFlow = () => {
					draw();
					for (let x = 0; x < SIZE; x++) {
						for (let y = 0; y < SIZE; y++) {
							let i = this.I(x, y);
							let tile = spreadMap[i];
							if (!tile) continue;
							if(tile instanceof Gate) ctx.fillStyle = `hsl(${tile.other(this).id/count * 360}, 100%, 50%)`;
							else if(tile instanceof Chest) ctx.fillStyle = "#5a2a10";
							else ctx.fillStyle = `hsl(${tile.i * 360}, 75%, 75%)`;
							ctx.fillRect(x * scale, y * scale, scale, scale);
						}
					}
					return delay(debug.showBuildFlow.flowTime);
				}
				let ts = 0;
				while (active.length) {
					let array = [];
					++ts;
					for (let [x, y, c] of active) {
						near(x, y).forEach(([x, y]) => {
							//Foreach nearby block
							let i = this.I(x, y);
							let tile = newTiles[i];
							if (tile == null) {
								if (spreadMap[i]) {
									if (spreadMap[i] != c) {
										join(c, spreadMap[i]);
									}
								} else {
									spreadMap[i] = c;
									array.push([x, y, c]);
								}
							}
						});
					}
					//if(groups.size == Groups.length) break;
					if (debug.showBuildFlow.enabled) {
						await drawFlow();
					}
					active = array;
				}
				if (debug.showBuildFlow.enabled) {
					await delay(debug.showBuildFlow.afterFlow);
				}
				let stable = true, fs = false;
				let arr = alls(x, y).filter(([x, y]) => {
					let tile = newTiles[this.I(x, y)]
					if(tile instanceof Block) return true;
					//if(tile instanceof Door) return true;
					if(tile instanceof Chest) fs = true;
				});
				if(first) turns = ts;
				first = false;
				if(this.type == PATH) {
					var dis = min(...path.map(([a, b]) => distance(x - a, y - b)));
					if(dis > 2.7) {
						stable = false;
						ts = "red";
					}
				}else{
					if(turns - ts > 4) {
						stable = false;
						ts = "green";
					}else if(ts - turns > 4) {
						stable = false;
						ts = "green";
					}else{
						turns = ts;
						ts = "blue";
					}
					if(arr.length >= 7) {
						stable = false;
						ts = "purple";
					}
					if(!spreadMap[i]) {
						stable = false;
						ts = "yellow";
					}
					var dis = min(...path.map(([a, b]) => distance(x - a, y - b)));
					if(dis > 2.7) {
						stable = false;
						ts = "red";
					}
				}
				if(fs) stable = true;
				groups = new Set(groups.values());
				if (stable && groups.size == Groups.length) {
					this.tiles = newTiles;
					if(debug.showBuild) this.updateTile(x, y);
				}
				/**@param {Room} a @param {Room} b*/
				function join(a, b) {
					var ga = groups.get(a) || new Set([a]);
					var gb = groups.get(b) || new Set([b]);
					var gc = new Set([...ga, ...gb]);
					gc.forEach(n => groups.set(n, gc));
				}
				if (debug.showBuild) {
					let prom = draw();
					ctx.fillStyle = "black";
					ctx.fillStyle = ts;
					ctx.fillRect(x * scale, y * scale, scale, scale);
					await prom;
					//if(!stable) await delay(200);
				}
			}
			for (let [x, y] of shuffle(air)) {
				let i = this.I(x, y);
				let newTiles = [...this.tiles];
				newTiles[i] = new BlockSlope(this, x, y);;
				/**@type {number[]}*/
				let spreadMap = new Array(newTiles.length);
				let active = Array.from(doors);
				/**@type {Set<Set<Room>>}*/
				let groups = new Map;
				this.door.forEach(room => groups.set(room, new Set([room])));
				let drawFlow = () => {
					draw();
					for (let x = 0; x < SIZE; x++) {
						for (let y = 0; y < SIZE; y++) {
							let i = this.I(x, y);
							let tile = spreadMap[i];
							if (!tile) continue;
							if(tile instanceof Gate) ctx.fillStyle = `hsl(${tile.other(this).id/count * 360}, 100%, 50%)`;
							else if(tile instanceof Chest) ctx.fillStyle = "#5a2a10";
							else ctx.fillStyle = `hsl(${tile.i * 360}, 75%, 75%)`;
							ctx.fillRect(x * scale, y * scale, scale, scale);
						}
					}
					return delay(debug.showBuildFlow.flowTime);
				}
				let ts = 0;
				while (active.length) {
					let array = [];
					++ts;
					for (let [x, y, c] of active) {
						near(x, y).forEach(([x, y]) => {
							//Foreach nearby block
							let i = this.I(x, y);
							let tile = newTiles[i];
							if (tile == null) {
								if (spreadMap[i]) {
									if (spreadMap[i] != c) {
										join(c, spreadMap[i]);
									}
								} else {
									spreadMap[i] = c;
									array.push([x, y, c]);
								}
							}
						});
					}
					//if(groups.size == Groups.length) break;
					if (debug.showBuildFlow.enabled) {
						await drawFlow();
					}
					active = array;
				}
				if (debug.showBuildFlow.enabled) {
					await delay(debug.showBuildFlow.afterFlow);
				}
				let stable = true, fs = false;
				if(first) turns = ts;
				first = false;
				if(this.tiles[i]) continue;
				var arr = near(x, y).filter(([x, y]) => {
					var tile = this.getTile(x, y);
					return tile && tile instanceof Block && !(tile instanceof BlockSlope);
				});
				near(x, y).forEach(([x, y]) => {
					let tile = newTiles[this.I(x, y)]
					if(tile instanceof Block) return true;
					//if(tile instanceof Door) return true;
					if(tile instanceof Chest) fs = true;
				});
				if(fs) continue;
				if(arr.length == 2 || arr.length == 3) {
					if(arr.length == 2) {
						var [a, b] = arr;
						if(a[0] == b[0] || a[1] == b[1]) continue;
					}
					//newTiles[i] = new BlockSlope(this, x, y);
				}else continue;
				groups = new Set(groups.values());
				if (stable && groups.size == Groups.length) {
					this.tiles = newTiles;
					if(debug.showBuild) this.updateTile(x, y);
				}
				/**@param {Room} a @param {Room} b*/
				function join(a, b) {
					var ga = groups.get(a) || new Set([a]);
					var gb = groups.get(b) || new Set([b]);
					var gc = new Set([...ga, ...gb]);
					gc.forEach(n => groups.set(n, gc));
				}
				if (debug.showBuild) {
					let prom = draw();
					ctx.fillStyle = "black";
					ctx.fillStyle = ts;
					ctx.fillRect(x * scale, y * scale, scale, scale);
					await prom;
					//if(!stable) await delay(200);
				}
			}
		}
		/**@type {[number, number][]}*/
		this.air = [];
		for(let [x, y] of air) {
			if(this.getTile(x, y) == null) {
				this.air.push([x, y]);
			}
		}
		{let tiles = this.tiles;
			this.tiles = [];
			for(let i in tiles) {
				let v = tiles[i];
				if(v) {
					this.tiles[i] = v;
				}
			}
		}
		}catch(err) {document.write(err.stack)}
	}
	/**@param {Gate} gate*/
	getGroup(gate) {
		//DO NOT ADD SELF CONNECTIONS TO GROUPS!!!
		if (!this.groups) return this.door.filter(door => !door.self);
		else {
			for (let group of this.groups) {
				if (group.has(gate)) return [...group].filter(door => !door.self);
			}
		}
	}
	full() {
		var doors = this.door.filter(door => door);
		if ((this.type == CHEST || this.type == EMPTY) && doors.length >= 1) return true;
		if (this.type == START && doors.length >= 2) return true;
	}
	/**@param {Room} room*/
	connectTo(room, conn) {
		if (!conn) {
			var conns = this.canConnectTo(room);
			if (!conns) return;
			var num = floor(rand(conns.length));
			conn = conns[num];
		}
		var goto = gate(conn);
		var Conn = new Gate(room, this);
		this.door[conn] = Conn;
		room.door[goto] = Conn;
		this.conn[conn] = room;
		room.conn[goto] = this;
		if (room == this) this.self = true;
		return true;
	}
	get drawn() {
		return this.drawd || this.loading;
	}
	draw(onscreen) {
		var {canvas, SIZE} = this;
		var scale = length/SIZE;
		if(!this.drawn) {
			this.drawd = true;
			canvas.width = length;
			canvas.height = length;
			canvas.length = length;
			
			for (let x = 0; x < SIZE; x++) {
				for (let y = 0; y < SIZE; y++) {
					this.drawTile(x, y, scale);
				}
			}
			/*for(let x = 0; x < SIZE; x++) {
				for (let y = 0; y < SIZE; y++) {
					if(!(this.getTile(x, y) instanceof Block)) {
						this.updateTile(x, y);
					}
				}
			}*/
			var r = true;
		}
		if(onscreen) {
			ctx.drawImage(canvas, 0, 0);
			this.drawEntities();
		}
		return r;
	}
	async load() {
		var {canvas, SIZE} = this;
		var scale = length/SIZE;
		if((!this.drawn && !this.loading) || canvas.length != length) {
			canvas.width = length;
			canvas.height = length;
			canvas.length = length;
			this.loading = true;
			var time = Date.now();
			
			for (let x = 0; x < SIZE; x++) {
				for (let y = 0; y < SIZE; y++) {
					if(canvas.length != length) return;
					this.drawTile(x, y, scale);
					if(this != mroom) await delay(0);
				}
			}
			this.loading = false;
			this.drawd = true;
		}
	}
	async loadFromDoor(type) {
		this.load();
		/*var {canvas, SIZE} = this;
		var scale = length/SIZE;
		/**@param {number} x @param {number} y
		function near(x, y) {
			return nearby.map(([dx, dy]) => [x + dx, y + dy]).filter(([x, y]) => (x >= 0 && y >= 0 && x < SIZE && y < SIZE));
		}
		if(!this.drawn) {
			canvas.width = length;
			canvas.height = length;
			canvas.length = length;
			this.reload();
		}
		let Gate = this.door[gate(type)];
		if(!this.entered.has(Gate)) {
			this.loading = true;
			
			let spreadMap = new Array(this.tiles.length);
			let active = this.doorTiles.filter(([x, y, gate]) => gate == Gate);
			this.entered.add(Gate);
			
			//let ts = 0;
			while (active.length) {
				let array = [];
				//++ts;
				for (let [x, y, c] of active) {
					this.updateTile(x, y);
					near(x, y).forEach(([x, y]) => {
						//Foreach nearby block
						let i = this.I(x, y);
						let tile = this.tiles[i];
						if (!tile || tile.passable) {
							if (spreadMap[i]) {
								
							} else {
								spreadMap[i] = c;
								array.push([x, y, c]);
							}
						}
						if(tile instanceof Door) {
							this.entered.add(tile.gate);
						}
					});
				}
				await delay(50);
				active = array;
			}
			this.loading = false;
			this.drawd = true;
			return true;
		}*/
	}
	async reload() {
		await this.load();
		/*var {canvas, SIZE} = this;
		var scale = length/SIZE;
		//@param {number} x @param {number} y
		function near(x, y) {
			return nearby.map(([dx, dy]) => [x + dx, y + dy]).filter(([x, y]) => (x >= 0 && y >= 0 && x < SIZE && y < SIZE));
		}
		if(!this.drawn) {
			canvas.width = length;
			canvas.height = length;
			canvas.length = length;
			this.loading = true;
			
			let spreadMap = new Array(this.tiles.length);
			let active = this.doorTiles.filter(([x, y, gate]) => this.entered.has(gate));
			
			let ts = 0;
			while (active.length) {
				let array = [];
				++ts;
				for (let [x, y, c] of active) {
					this.updateTile(x, y);
					near(x, y).forEach(([x, y]) => {
						//Foreach nearby block
						let i = this.I(x, y);
						let tile = this.tiles[i];
						if (!tile || tile.passable) {
							if (spreadMap[i]) {
								
							} else {
								spreadMap[i] = c;
								array.push([x, y, c]);
							}
						}
						if(tile instanceof Door) {
							this.entered.add(tile.gate);
						}
					});
				}
				await delay(50);
				active = array;
			}
			this.loading = false;
			this.drawd = true;
			return true;
		}*/
	}
	reloadConns() {
		for(let room of this.conn) {
			if(room) room.reload();
		}
	}
	entered = new Set;
	drawConns() {
		for(let room of this.conn) {
			if(room) room.draw();
		}
	}
	loadConns() {
		for(let room of this.conn) {
			if(room) room.load();
		}
	}
	drawEntities(x, y) {
		var {SIZE} = this;
		var scale = length/SIZE;
		for(let entity of this.occupants) {
			if(entity.inRoom() > 2 && entity.room != this) {
				this.occupants.delete(entity);
			}else entity.draw(x, y, scale);
		}
	}
	occupants = new Set;
	drawTile(x, y, scale) {
		let {ctx} = this;
		
		let i = this.I(x, y);
		let tile = this.tiles[i];
		ctx.fillStyle = `hsl(${this.id/count * 360}, 100%, 75%)`;
		ctx.fillRect(x * scale, y * scale, scale, scale);
		if(tile instanceof Door) ctx.fillStyle = `hsl(${tile.door.id/count * 360}, 100%, 50%)`;
		else if (tile instanceof Block) ctx.fillStyle = `hsl(${tile.room.id/count * 360}, 100%, 30%)`;
		else if (tile instanceof Chest) ctx.fillStyle = "#fa5";
		if(tile && (tile instanceof Door || tile instanceof Block || tile instanceof Chest)) {
			tile.draw(ctx, scale);
		}else ctx.fillRect(x * scale, y * scale, scale, scale);
	}
	updateTile(x, y) {
		let {SIZE} = this;
		let scale = length/SIZE;
		var sx = x - 1;
		var sy = y - 1;
		var ex = x + 1;
		var ey = y + 1;
		for(x = sx; x <= ex; x++) for(y = sy; y <= ey; y++) {
			if(!this.valid(x, y)) continue;
			this.drawTile(x, y, scale);
		}
	}
	valid(x, y) {
		if(x < 0) return;
		if(x >= SIZE) return;
		if(y < 0) return;
		if(y >= SIZE) return;
		return true;
	}
	life = 0;
	update() {
		if(this.life) --this.life;
		var set = new Set;
		for(let entity of this.occupants) {
			if(entity.room == this) {
				entity.update();
			}
			set.add(entity);
			for(let enemy of this.occupants) {
				if(set.has(enemy)) continue;
				if(entity.isTouching(enemy)) {
					//Entity.bounce(entity, enemy);
					entity.collide(enemy);
					enemy.collide(entity);
				}
			}
		}
	}
	updateEntities() {
		this.entities = [];
		for(let entity of this.occupants) {
			if(entity.room == this) entity.addToRoom();
		}
	}
	updateEntityConns() {
		let set = new Set;
		for(let room of this.conn) {
			if(room && room != this && !set.has(room)) {
				room.updateEntities();
				set.add(room);
			}
		}
	}
	updateConns() {
		let set = new Set;
		for(let room of this.conn) {
			if(room && room != this && !set.has(room)) {
				room.update();
				set.add(room);
			}
		}
	}
}
class Gate{
	constructor(room, door) {
		/**@type {[Room, Room]}*/
		this.rooms = [room, door];
		this.self = room == door;
		var arr = [
			rand(1, SIZE - 1),
			rand(1, SIZE - 1)
		];
		if(room.type == MAZE || door.type == MAZE) {
			this.a = floor(arr[0]);
			this.b = this.a;
		}else{
			this.a = floor(min(...arr));
			this.b = floor(max(...arr));
		}
	}
	other(room) {
		var {rooms} = this;
		var a = rooms.indexOf(room) + 1;
		if(a) {
			return rooms[a % 2];
		}
	}
}
/**@type {[[1, 0], [0, 1], [-1, 0], [0, -1]]}*/
var nearby = [[1, 0], [0, 1], [-1, 0], [0, -1]];
var allby = [[1, 1], [0, 1], [-1, 1], [1, 0], [-1, 0], [1, -1], [0, -1], [-1, -1]];
class Door {
	constructor(room, door, type, x, y) {
		this.room = room;
		this.gate = door;
		this.door = door.other(room);
		this.type = type;
		this.x = x;
		this.y = y;
	}
	locked = false;
	get passable() {
		return !this.locked;
	}
	draw(ctx, scale) {
		//return;
		//var near = this.near
		//var variant = [this.room.id, ...near];
		
		var {x, y, room, type} = this;
		var map = Bitmaps.Door[type];
		if(map instanceof ImageBitmap) ctx.drawImage(map, (x) * scale, (y) * scale, scale, scale);
		else for(let dx = 0, p = 0; dx < 8; dx++) for(let dy = 0; dy < 8; ++dy, ++p) {
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
			var str = `hsla(${this.door.id/count * 360}, ${round(s * 100)}%, ${round(l * 100)}%, ${ca/255})`;
			ctx.fillStyle = str;
			// console.log(v);
			// ctx.fillStyle = `rgba(${r}, ${cb}, ${b}, ${ca/255})`;
			ctx.fillRect((x + dy/8) * scale, (y + dx/8) * scale, scale/8, scale/8);
		}
	}
}
class Block {
	constructor(room, x, y) {
		this.room = room;
		this.x = x;
		this.y = y;
	}
	get near() {
		var {SIZE} = this.room;
		return nearby.map(([dx, dy]) => [x + dx, y + dy]).map(([x, y]) => {
			if(x < 0) return 0;
			if(x >= SIZE) return 0;
			if(y < 0) return 0;
			if(y >= SIZE) return 0;
			if(room.getTile(x, y) instanceof Block) return 1;
		});
	}
	get passable() {
		return false;
	}
	draw(ctx, scale) {
		//var near = this.near
		//var variant = [this.room.id, ...near];
		var {x, y, room} = this;
		var allCoords = [
			[[-1, 0], [0, -1], [-1, -1]],
			[[-1, 0], [0, 1], [-1, 1]],
			[[1, 0], [0, -1], [1, -1]],
			[[1, 0], [0, 1], [1, 1]]
		]
		var parts = [];
		for(let i = 0; i < 4; i++) {
			let coords = allCoords[i];
			let arr;
			let left = exists(coords[0]);
			let up = exists(coords[1]);
			let both = exists(coords[2]);
			
			if(left && up) {//both left and up
				if(both) {//middle
					arr = ["baseSquare"];
				}else{//no middle
					arr = ["baseSquare", "trimCorner"];
				}
			}else if(left) {//left only
				arr = ["baseSquare", "trimHoriz"];
			}else if(up) {//up only
				arr = ["baseSquare", "trimVerti"];
			}else{//none
				arr = ["baseRound", "trimRound"];
			}
			parts.push(arr);
		}
		let i = 0;
		for(let a = 0; a < 2; a++) {
			for(let b = 0; b < 2; b++) {
				for(let part of parts[i]) {
					var map = Bitmaps.Block[part][i];
					if(map instanceof ImageBitmap) ctx.drawImage(map, (x + a/2) * scale, (y + b/2) * scale, scale/2, scale/2);
					else for(let dx = 0, p = 0; dx < 4; dx++) for(let dy = 0; dy < 4; ++dy, ++p) {
						let n = p * 4;
						let data = map.data;
						let r = data[n++];
						let g = data[n++];
						let cb = data[n++];
						let ca = data[n];
						if(!ca) continue;
						//if(!r && !g && !cb) continue;
						let {h, s, l} = RGBtoHSL(r, g, cb);
						// console.log(s, v);
						var str = `hsla(${this.room.id/count * 360}, ${round(s * 100)}%, ${round(l * 100)}%, ${ca/255})`;
						ctx.fillStyle = str;
						// console.log(v);
						// ctx.fillStyle = `rgba(${r}, ${cb}, ${b}, ${ca/255})`;
						ctx.fillRect((x + a/2 + dy/8) * scale, (y + b/2 + dx/8) * scale, scale/8, scale/8);
					}
				}
				++i;
			}
		}
		BAA = 0;
		function exists([dx, dy]) {
			dx += x;
			dy += y;
			if(dx < 0) return 1;
			if(dx >= SIZE) return 1;
			if(dy < 0) return 1;
			if(dy >= SIZE) return 1;
			if(room.getTile(dx, dy) instanceof Block) return 1;
		}
	}
}
class BlockSlope extends Block {
	/*constructor(room, x, y) {
		super(room, x, y);
	}
	draw(ctx, scale) {
		//var near = this.near
		//var variant = [this.room.id, ...near];
		var {x, y, room} = this;
		
		let left = exists([-1, 0]);
		let right = exists([1, 0]);
		let up = exists([0, -1]);
		let down = exists([0, 1]);
		
		let name;
		
		if(down && right) {
			name = "slopeUp";
			this.type = 0;
		}
		if(down && left) {
			name = "slopeBack";
			this.type = 1;
		}
		if(up && right) {
			name = "slopeDown";
			this.type = 2;
		}
		if(up && left) {
			name = "slopeUnder";
			this.type = 3;
		}
		
		var map = Bitmaps.Block[name];
		if(map instanceof ImageBitmap) ctx.drawImage(map, (x + a/2) * scale, (y + b/2) * scale, scale/2, scale/2);
		else for(let dx = 0, p = 0; dx < 8; dx++) for(let dy = 0; dy < 8; ++dy, ++p) {
			let n = p * 4;
			let data = map.data;
			let r = data[n++];
			let g = data[n++];
			let cb = data[n++];
			let ca = data[n];
			if(!ca) continue;
			//if(!r && !g && !cb) continue;
			let {h, s, l} = RGBtoHSL(r, g, cb);
			// console.log(s, v);
			var str = `hsla(${this.room.id/count * 360}, ${round(s * 100)}%, ${round(l * 100)}%, ${ca/255})`;
			ctx.fillStyle = str;
			// console.log(v);
			// ctx.fillStyle = `rgba(${r}, ${cb}, ${b}, ${ca/255})`;
			ctx.fillRect((x + dy/8) * scale, (y + dx/8) * scale, scale/8, scale/8);
		}
		
		function exists([dx, dy]) {
			dx += x;
			dy += y;
			if(dx < 0) return 1;
			if(dx >= SIZE) return 1;
			if(dy < 0) return 1;
			if(dy >= SIZE) return 1;
			if(room.getTile(dx, dy) instanceof Block) return 1;
		}
	}*/
}
var BAA = 1
function RGBtoHSL(r, g, b){
	r /= 255, g /= 255, b /= 255;
	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, l = (max + min) / 2;

	if(max == min){
		h = s = 0; // achromatic
	}else{
		var d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch(max){
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}

	return {h, s, l};
}
class Chest {
	constructor(room, i, x, y) {
		this.room = room;
		this.i = i;
		this.x = x;
		this.y = y;
		this.isOpen = 0;
	}
	get passable() {
		return true;
	}
	open() {
		this.isOpen = 1;
		new Cookie(this.room, this.x, this.y);
	}
	draw(ctx, scale) {
		var {x, y} = this;
		var tile = Images.Chest[(this.isOpen + 1) % 2];
		ctx.drawImage(tile, x * scale, y * scale, scale, scale);
	}
}