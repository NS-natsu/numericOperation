// ページの読み込みを待つ
window.addEventListener('DOMContentLoaded', init);

let curve;
let graph;
let updateEvent;
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

	graph.cls();
	const grafList = curve.getCrossSection();
	graph.beginPath();
	graph.lineStart(0, grafList[0]);
	for(let i = 0; i < grafList.length; i++){
		graph.lineto(i, grafList[i]);
	}
	graph.stroke();

	let str;
	if(cutType)
		str = defaultPartialDifferential.xAxisStr(cutPos, cutPos);
	else
		str = defaultPartialDifferential.zAxisStr(cutPos, cutPos);
	graph._context.font = "16px Arial";
	graph._context.fillText( str, 0, 16);
}
function init(){
	document.getElementById("curveFormula").innerHTML = defaultCurveStr();
	const can = document.getElementById('model');
	can.width = 480;
	can.height = 360;
	curve = new CurvedSurface(can, 480, 360, 1, 50);
	curve.createCurve();
	curve.createPlane();
	curve.draw();

	updateEvent = setInterval(update, 100);

	document.getElementById("cutPos").step = 2 / (curve.divistion - 1);

	graph = new Graph2d(document.getElementById("graph"), 480, 360);
	let h = curve.getMaxY() || 10;
	graph.scale(0, h, curve.divistion - 1, -2 * h);
}