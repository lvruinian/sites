var stats = new Stats(),
	canvas = document.getElementById("canvas"),
	ctx = canvas.getContext("2d"),
	img = null,
	W = canvas.width,
	H = canvas.height,
	mouse = { x: 0, y: 0 },
	points = [],
	MAN = false,
	DRAG = 0.95, //扩散因子
	EASE = 0.25, //缓动因子
	THICKNESS = Math.pow(20, 2), //鼠标扩散范围
	start = 0,
	animateArray = [];

stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

class Particle {
	constructor(x, y, color, duration) {
		this.x = x;
		this.y = y;
		this.sx = x;
		this.sy = y;
		this.dx = x;
		this.dy = y;
		this.vx = 0;
		this.vy = 0;
		this.color = `rgba(${color.r},${color.g},${color.b},${color.a})`;
		this.time = new Date();
		this.duration = duration;
	}
	//初始化动画
	init() {
		if (new Date() - this.time > this.duration) return;
		this.x = Tween.Back.easeInOut(
			new Date() - this.time,
			this.dx,
			this.sx - this.dx,
			this.duration
		);
		this.y = Tween.Back.easeInOut(
			new Date() - this.time,
			this.dy,
			this.sy - this.dy,
			this.duration
		);
	}
	//鼠标位置扩散动画
	update() {
		//模拟鼠标滑动
		if (!MAN) {
			var t = +new Date() * 0.001;
			mouse.x =
				W * 0.5 + Math.cos(t * 2.1) * Math.cos(t * 0.9) * W * 0.45;
			mouse.y =
				H * 0.5 +
				Math.sin(t * 3.2) * Math.tan(Math.sin(t * 0.8)) * H * 0.45;
		}
		var dx = mouse.x - this.x,
			dy = mouse.y - this.y,
			d = dx * dx + dy * dy,
			f = -THICKNESS / d,
			t = 0;
		if (d < THICKNESS) {
			t = Math.atan2(dy, dx);
			this.vx += f * Math.cos(t);
			this.vy += f * Math.sin(t);
		}
		this.x += (this.vx *= DRAG) + (this.sx - this.x) * EASE;
		this.y += (this.vy *= DRAG) + (this.sy - this.y) * EASE;
	}
	draw(ctx) {
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.arc(this.x, this.y, 1, 0, Math.PI * 2, false);
		ctx.fill();
	}
}

function drawImg() {
	var imgCanvas = document.createElement("canvas"),
		imgCtx = imgCanvas.getContext("2d");
	imgCanvas.width = 320;
	imgCanvas.height = 120;
	var gradient = ctx.createLinearGradient(0, 0, imgCanvas.width, 0); //线性渐变
	gradient.addColorStop(0, "hsla(0,70%,50%,1)");
	gradient.addColorStop(0.5, "hsla(240,70%,50%,1");
	gradient.addColorStop(1, "hsla(270,70%,50%,1)");

	imgCtx.fillStyle = gradient;
	imgCtx.textAlign = "center";
	imgCtx.textBaseLine = "middle";
	imgCtx.font = "50px bold Lucida Sans";
	imgCtx.fillText("Hello,Canvas", imgCanvas.width / 2, imgCanvas.height / 2);
	return imgCanvas;
}

function getImageData() {
	img = drawImg();
	var imgData = img
		.getContext("2d")
		.getImageData(0, 0, img.width, img.height);

	// for(var i=0,len=imgData.data.length;i<len;i+=4){
	//  if(imgData.data[i+3]<128)continue;
	//  var x=Math.floor(i/4%img.width),
	//      y=Math.floor(i/4/img.width),
	//      color={
	//          r:imgData.data[i],
	//          g:imgData.data[i+1],
	//          b:imgData.data[i+2],
	//          a:imgData.data[i+3]
	//      };

	//  var point=new Particle(x,y,color,2000);
	//  point.dx=random(x-40,x+40);
	//  point.dy=random(y-80,y+80);
	//  points.push(point);
	// }

	for (var x = 0; x < img.width; x++) {
		for (var y = 0; y < img.height; y++) {
			var i = (y * imgData.width + x) * 4,
				color = {
					r: imgData.data[i],
					g: imgData.data[i + 1],
					b: imgData.data[i + 2],
					a: imgData.data[i + 3]
				};

			if (imgData.data[i + 3] < 128) continue;
			var x1 = (W - img.width) / 2 + x,
				y1 = (H - img.height) / 2 + y,
				point = new Particle(x1, y1, color, 1200);

			point.dx = random(x1 - 40, x1 + 40);
			point.dy = random(y1 - 80, y1 + 80);
			points.push(point);
		}
	}
}

getImageData();

canvas.addEventListener( "mousemove", function(e) {
    mouse = windowToCanvas(canvas, e.clientX, e.clientY);
    MAN = true;
}, false );

/**
 * 隔一段时间把粒子添加进动画队列animateArray
 */
(function run() {
	if (start > points.length) return;
	var arr = points.slice(start, start + 50);
	arr.forEach(a => {
		a.time = new Date();
	});
	animateArray = animateArray.concat(arr);
	start += 50;
	setTimeout(run, 64);
})();

/**
 * 初始化动画
 */
(function init() {
	var lastPoint = points.slice(-1)[0];
	if (
		animateArray.length == points.length &&
		new Date() - lastPoint.time > lastPoint.duration
	) {
		animate();
		return;
	}
	stats.begin();
	ctx.clearRect(0, 0, W, H);
	animateArray.forEach((p, i) => {
		p.init();
		p.draw(ctx);
	});
	stats.end();
	requestAnimationFrame(init);
})();

/**
 * 监控鼠标动画
 */
function animate() {
	stats.begin();
	ctx.clearRect(0, 0, W, H);
	animateArray.forEach((p, i) => {
		p.update();
		p.draw(ctx);
	});
	stats.end();
	requestAnimationFrame(animate);
}
