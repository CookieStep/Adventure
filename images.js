var Images = {
	Block: new Image(),
	Chest: [new Image(), new Image()],
	async setupBlock() {
		var img = this.Block;
		var res = 1;
		var proms = [];
		var bitmap = (x, y) => {
			var arr = [];
			for(let a = 0; a < 2; a++) for(let b = 0; b < 2; b++) {
				var bitmap = createImageBitmap(img, (x * 8 + a * 4) * res, (y * 8 + b * 4) * res, 4 * res, 4 * res);
				arr.push(bitmap);
			}
			var p = Promise.all(arr);
			proms.push(p);
			return p;
		};
		var bitmaB = (x, y) => {
			p = createImageBitmap(img, (x * 8) * res, (y * 8) * res, 8 * res, 8 * res);
			proms.push(p);
			return p;
		};
		await img.loaded;
		var block = Bitmaps.Block;
		bitmap(0, 0).then(arr => block.baseRound = arr);
		bitmap(1, 0).then(arr => block.baseSquare = arr);
		bitmap(0, 1).then(arr => block.trimRound = arr);
		bitmap(1, 1).then(arr => block.trimCorner = arr);
		bitmap(2, 0).then(arr => block.trimHoriz = arr);
		bitmap(2, 1).then(arr => block.trimVerti = arr);
		bitmaB(3, 0).then(arr => block.slopeUp = arr);
		bitmaB(3, 1).then(arr => block.slopeDown = arr);
		bitmaB(4, 0).then(arr => block.slopeBack = arr);
		bitmaB(4, 1).then(arr => block.slopeUnder = arr);
		
		var names = ["baseRound", "baseSquare", "trimRound", "trimCorner", "trimHoriz", "trimVerti", "slopeUp", "slopeDown", "slopeBack", "slopeUnder"];
		
		var canvas = document.createElement("canvas");
		var ctx = canvas.getContext("2d");
		var maps = await Promise.all(proms);
		//await delay(10);
		
		for(let i = 0; i < names.length; i++) {
			let name = names[i];
			let map = maps[i];
			let arr = [];
			
			if(map.length) for(let m = 0; m < map.length; m++) {
				canvas.width = 4;
				canvas.height = 4;
				ctx.clearRect(0, 0, 4, 4);
				ctx.drawImage(map[m], 0, 0);
				let imagedata = ctx.getImageData(0, 0, 4, 4);
				arr[m] = imagedata;
			}else{
				canvas.width = 8;
				canvas.height = 8;
				ctx.clearRect(0, 0, 8, 8);
				ctx.drawImage(map, 0, 0);
				let imagedata = ctx.getImageData(0, 0, 8, 8);
				arr = imagedata;
			}
			
			block[name] = arr;
		}
	},
	Door: new Image(),
	async setupDoor() {
		var img = this.Door;
		var res = 1;
		var proms = [];
		var bitmap = (x, y) => {
			p = createImageBitmap(img, (x * 8) * res, (y * 8) * res, 8 * res, 8 * res);
			proms.push(p);
			return p;
		};
		await img.loaded;
		var door = Bitmaps.Door;
		bitmap(1, 0).then(map => door[0] = map);
		bitmap(0, 0).then(map => door[1] = map);
		bitmap(0, 1).then(map => door[2] = map);
		bitmap(1, 1).then(map => door[3] = map);
		
		var canvas = document.createElement("canvas");
		canvas.width = 8;
		canvas.height = 8;
		var ctx = canvas.getContext("2d");
		var maps = await Promise.all(proms);
		//await delay(10);
		
		for(let i = 0; i < 4; i++) {
			let map = maps[i];
			
			ctx.clearRect(0, 0, 8, 8);
			ctx.drawImage(map, 0, 0);
			let imagedata = ctx.getImageData(0, 0, 8, 8);
			
			door[i] = imagedata;
		}
	},
	Slime: new Image(),
	async setupSlime() {
		var img = this.Slime;
		var s = 18;
		var res = 1;
		var proms = [];
		var bitmap = (x, y) => {
			p = createImageBitmap(img, (x * s) * res, (y * s) * res, s * res, s * res);
			proms.push(p);
			return p;
		};
		await img.loaded;
		var slime = Bitmaps.Slime;
		bitmap(0, 0).then(map => slime.body = map);
		
		var canvas = document.createElement("canvas");
		canvas.width = s;
		canvas.height = s;
		var ctx = canvas.getContext("2d");
		var maps = await Promise.all(proms);
		var names = ["body"];
		//await delay(10);
		
		for(let i = 0; i < names.length; i++) {
			let map = maps[i];
			let name = names[i];
			
			ctx.clearRect(0, 0, s, s);
			ctx.drawImage(map, 0, 0);
			let imagedata = ctx.getImageData(0, 0, s, s);
			
			slime[name] = imagedata;
		}
	},
	Cookie: new Image(),
	Slot: new Image(),
	InUse: new Image()
};
var Bitmaps = {
	Block: {},
	Slime: {},
	Door: []
};
function loadImg(img, src) {
	img.src = src;
	img.loaded = new Promise(resolve => img.onload = resolve);
}
loadImg(Images.Block, "block.png");
Images.setupBlock();
loadImg(Images.Chest[0], "chest1.png");
loadImg(Images.Chest[1], "chest.png");
loadImg(Images.Door, "door.png");
Images.setupDoor();
loadImg(Images.Slime, "slime.png");
Images.setupSlime();
loadImg(Images.Cookie, "cookie.png");
loadImg(Images.Slot, "nslot.png");
loadImg(Images.InUse, "inuse.png");