// ページの読み込みを待つ
window.addEventListener('DOMContentLoaded', init);

let curve;
let graph;
let updateEvent;
let tList = new Array();
let old = null;
let tPoint = 99;
function update(){
	let elems = document.getElementById("rotateX").value;
	const rotateX = parseFloat(elems) * Math.PI;

	elems = document.getElementById("rotateY").value;
	const rotateY = parseFloat(elems) * Math.PI;

	elems = document.getElementById("cutPos").value;
	const cutPos = parseFloat(elems);

	elms = document.getElementsByName("cut");
	let cutType = 0;
	for(let i = 0; i <elms.length; i++){
		if(elms[i].checked == false) continue;
		cutType = (i == 1);
	}


	curve.rotation(rotateX, rotateY, 0);
	curve.planePosition(cutPos, cutType);


	if(old){
		tList = new Array();
		const getTold = function(i){
			if(i < 0 || tPoint <= i) return 0;
			return old[i];
		}
		const r = 10 / (tPoint - 1);
		for(let i = 0; i < tPoint; i++){
			tList.push(
				r*(getTold(i-1) + getTold(i+1)) + (1-2*r)*getTold(i)
			);
		}
	}
	old = tList;

	graph.cls();
	const grafList = curve.getCrossSection();
	graph.beginPath();
	graph.lineStart(0, grafList[0]);
	for(let i = 0; i < grafList.length; i++){
		graph.lineto(i, grafList[i]);
	}
	graph.stroke();
}
function init(){
	const can = document.getElementById('model');
	can.width = 480;
	can.height = 360;
	curve = new CurvedSurface(can, 480, 360, 1, 50);
	curve.getHeight = function(points, scale, vertices){
		let old = new Float32Array(points);
		let step = new Float32Array(points);

		for(let x = 0; x < points; x++){
			if((points >> 1) - Math.abs(x - (points >> 1)) < 10)
				vertices[3 * x + 1] = 0;
			else vertices[3 * x + 1] = 1;
			old[x] = step[x] = vertices[3 * x + 1];
		}

		const getT = function(i,j){
			if(i < 0 || points <= i) return 0;
			if(j < 0 || points <= j) return 0;
			return vertices[3 * (j * points + i) + 1];
		}

		const getTOld = function(i){
			if(i < 0 || points <= i) return 0;
			return old[i];
		}
		const r = 2 / (this.divistion - 1);
		for(let z = 1; z < points; z++){
			for(let x = 0; x < points; x++)
				old[x] = r*(getT(x-1,z-1) + getT(x+1,z-1)) + (1-2*r)*getT(x,z-1);

			for(let i = 0; i < points * 3; i++){
				for(let x = 0; x < points; x++){
					step[x] = r*(getTOld(x-1) + getTOld(x+1)) + (1-2*r)*getTOld(x);			let tmp = old;
					old = step;
				}
			}

			for(let x = 0; x < points; x++)
				vertices[3 * (z * points + x) + 1] = old[x];
		}
	}

	curve.createCurve();
	curve.createPlane();
	curve.draw();

	updateEvent = setInterval(update, 16);

	document.getElementById("cutPos").step = 2 / (curve.divistion - 1);

	graph = new Graph2d(document.getElementById("graph"), 480, 360);
	//let h = curve.getMaxY() || 10;
	graph.scale(0, 1.5, tPoint - 1, -3);


	for(let x = 0; x < tPoint; x++){
		if((tPoint >> 1) - Math.abs(x - (tPoint >> 1)) < 10) {
			tList.push(0);
		} else tList.push(1);
	}
}
