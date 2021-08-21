class Item extends Entity{
	constructor(room, x, y) {
		super(room);
		this.x = x + (1 - this.s)/2;
		this.y = y + (1 - this.s)/2;
		var rad = rand(PI * 2);
		this.vx = cos(rad) * .3;
		this.vy = sin(rad) * .3;
		this.friction **= 2;
	}
	draw(dx, dy, scale) {
		var {px: x, py: y} = this;
		var len = round(this.s * scale);
		ctx.drawImage(this.img, dx + x * scale, dy + y * scale, len, len);
	}
	collide(what) {
		if(what instanceof Player) {
			this.room.occupants.delete(this);
			what.inv.add(this.class);
		}
	}
	bounce = true;
	static s = 5/8;
	static rad = 0;
}
class Cookie extends Item{
	img = Images.Cookie;
	static img = Images.Cookie;
	class = Cookie;
}
class Sword extends Item{
	img = Images.Sword;
	static img = Images.Sword;
	draw(dx, dy, scale) {
		var {px: x, py: y} = this;
		var len = round(this.s * scale);
		ctx.drawImage(this.img, dx + x * scale, dy + y * scale, len, len);
	}
	collide(what) {
		super.collide(what);
	}
	s = 4/8;
	static melee = true;
	class = Sword;
	static s = 4/8;
	static rad = PI/4;
}