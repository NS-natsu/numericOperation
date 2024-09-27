// ページの読み込みを待つ
window.addEventListener('DOMContentLoaded', init);

let graph1;
let graph2;
let updateEvent;
let tList;
let tPoint = 301;

function getColorTemper(tem,threshold) {
	const ReLU = function(x){
		return 0 < x ? x : 0;
	}
	const posi = ReLU(tem - threshold);
	const nega = ReLU(threshold - tem);
	
	return [
		255 * (Math.exp(-nega)),
		255 * (Math.exp(-nega*Math.log(2)) - posi*posi),
		255 * (1 - Math.sqrt(posi))
	];
}

function draw(){
	graph1.cls();
	graph1.beginPath();
	graph1.lineStart(0, tList[0]);
	for(let i = 0; i < tList.length; i++){
		graph1.lineto(i, tList[i]);
	}
	graph1.stroke();

	graph2.cls();
	for(let i = 0; i < tList.length; i++){
		const t = i / (tList.length - 1);
		const rgb = getColorTemper(tList[i], .5);
		graph2.forecolor(rgb[0],rgb[1],rgb[2]);
		if((tPoint >> 1) - Math.abs(i - (tPoint >> 1)) < tPoint/10)
			graph2.rect(i, .75, i + 1, -.75);
		else graph2.rect(i, .5, i + 1, -.5);
	}
}

function update(cnt){

	let elems = document.getElementById("amount").value;
	let amount = parseFloat(elems);

	if(cnt) amount = cnt;

	amount *= tPoint;

	if(tList){
		const getTold = function(i){
			if(i < 0 || tPoint <= i) return 0;
			return tList[i];
		}
		const r = 2 / (tPoint - 1);
		for(let loop = 0; loop <= amount; loop++){
			const step = new Array();
			for(let i = 0; i < tPoint; i++){
				step.push(
					r*(getTold(i-1) + getTold(i+1)) + (1-2*r)*getTold(i)
				);
			}
			tList = step;
		}
	}
	draw();
}

function changepCnt(e){
	let n = e.value;
	tPoint = parseInt(n);
	e.parentElement.children[2].innerHTML = tPoint;
	graph1.scale(0, 1.5, tPoint - 1, -3);
	graph2.scale(0, 1.5, tPoint, -3);
	initHeat();
}

function simulate(cnt){
	document.getElementById("execTrial").style="display:none;";
	if(cnt != 0){
		update(cnt);
		document.getElementById("execTrial").style="";
	} else {
		if(updateEvent){
			clearInterval(updateEvent);
			updateEvent = null;
			document.getElementById("simulation").innerHTML = "アニメーション";
			document.getElementById("execTrial").style="";
		} else {
			updateEvent = setInterval(update, 16);
			document.getElementById("simulation").innerHTML = "停止";
		}
	}
}


function initHeat(){
	tList = new Array();
	for(let x = 0; x < tPoint; x++){
		const diff = .5 - Math.abs(x / (tPoint - 1) - .5);

		if(diff < 1/10)
			tList.push(0);
		else tList.push(1);
	}
	draw();
}

function init(){
	graph1 = new Graph2d(document.getElementById("graph1"), 480, 360);
	graph1.scale(0, 1.5, tPoint - 1, -3);

	document.getElementById("graph2").width = 480;
	document.getElementById("graph2").height = 360;
	graph2 = new VCanvas(document.getElementById("graph2"));
	graph2.scale(0, 1.5, tPoint, -3);


	const can = document.getElementById("colTem");
	can.height = 480;
	const g = new VCanvas(can);
	g.scale(0, 0, 1, can.height);
	for(let i = 0; i < can.height; i++){
		const t = (.5 - i / (can.height-1)) * 2;
		const rgb = getColorTemper(t, .5);

		g.forecolor(rgb[0],rgb[1],rgb[2]);
		g.rect(0, i, 0.9, i + 1);
	}
	initHeat();
}
