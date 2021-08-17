class Pointer{
	/**@param {Touch} touch*/
	constructor(touch, fid) {
		var {pageX: x, pageY: y, identifier: id} = touch;
		this.sx = x;
		this.sy = y;
		this.x = x;
		this.y = y;
		this.id = fid || id;
		this.touch = touch;
		this.active = true;
	}
	get mx() {
		return this.x - this.sx;
	}
	get my() {
		return this.y - this.sy;
	}
	draw() {
		ctx.beginPath();
		ctx.arc(this.sx, this.sy, scale/4, 0, PI * 2);
		ctx.arc(this.x, this.y, scale/4, 0, PI * 2);
		ctx.fillStyle = `hsla(${this.id/touches.size * 360}, 100%, 50%, ${.2 + this.active * .8})`;
		ctx.fill();
	}
	update(touch) {
		touch = (touch || this.touch);
		var {pageX: x, pageY: y} = touch;
		this.x = x;
		this.y = y;
	}
}
let touches = new Map;
/**@param {(touch: Touch) => void} listener*/
function touchHandler(event, listener) {
	addEventListener("touch" + event, (ev) => {
		let {changedTouches: list} = ev;
		canvas.requestFullscreen();
		for(let touch of list) {
			listener(touch);
		}
	});
}
touchHandler("start", (touch) => {
	var pointer = new Pointer(touch);
	touches.set(pointer.id, pointer);
});
touchHandler("move", (touch) =>
	touches.get(touch.identifier).update(touch)
);
touchHandler("end", (tch) => {
	var touch = touches.get(tch.identifier);
	touch.update(tch);
	touch.active = false;
});
touchHandler("cancel", ({identifier: id}) => 
	touches.delete(id)
);
touches.find = func => {
	for(let [id, touch] of touches) {
		if(func(touch, id, touches)) {
			return touch;
		}
	}
};

addEventListener("mousedown", (touch) => {
	var pointer = new Pointer(touch, -1);
	touches.set(pointer.id, pointer);
});
addEventListener("mousemove", (touch) => {
	touches.get(-1)?.update(touch);
});
addEventListener("mouseup", (tch) => {
	var touch = touches.get(-1);
	touch.update(tch);
	touch.active = false;
});
/*
function endTouch(touch) {
	var ax = abs(touch.mx);
	var ay = abs(touch.my);
	var door = -1;
	if(Math.max(ax, ay) > scale) {
		if(ay > ax) {
			if(touch.my > 0) {
				door = 1;
			}else{
				door = 3;
			}
		}else{
			if(touch.mx > 0) {
				door = 2;
			}else{
				door = 0;
			}
		}
	}
	if(mroom.door[door]) mroom = mroom.door[door].other(mroom);
}
*/