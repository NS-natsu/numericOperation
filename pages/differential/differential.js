// ページの読み込みを待つ
window.addEventListener('DOMContentLoaded', init);
const radius=.08;
CurvedSurface.prototype.createSphere = function(){
	if(this.mesh.children.length != 1) return;
	const geometry = new THREE.SphereGeometry(radius, 32, 16);
	const material = new THREE.MeshBasicMaterial( {color: 0xff0000});

	this.mesh.add(new THREE.Mesh(geometry, material));
}
CurvedSurface.prototype.positionSphere = function(x, z){
	if(this.mesh.children.length != 2) return;
	let coord = new Float32Array(2);
	coord[0] = x;
	coord[1] = z;
		
	this.mesh.children[1].position.set(coord[0],0,coord[1]);

	for(let i = 0; i < this.curve.attributes.position.array.length; i+=3){
		if(coord[0] != this.curve.attributes.position.array[i+0]) continue;
		if(coord[1] != this.curve.attributes.position.array[i+2]) continue;

		this.mesh.children[1].position.y = this.curve.attributes.position.array[i+1] + radius;
	}
}
CurvedSurface.prototype.moveSphere = function(x, y, z){
	if(this.mesh.children.length != 2) return;
	let coord = new Float32Array(3);
	coord[0] = x;
	coord[1] = y;
	coord[2] = z;
		
	this.mesh.children[1].position.x += coord[0];
	this.mesh.children[1].position.y += coord[1];
	this.mesh.children[1].position.z += coord[2];
}
CurvedSurface.prototype.getPosSphere = function(){
	if(this.mesh.children.length != 2) return [];
	return [this.mesh.children[1].position.x,this.mesh.children[1].position.y,this.mesh.children[1].position.z];
}

let curve;
let graph;
let updateEvent;
let isSimulate = false;
let partialDifferential = defaultPartialDifferential;
let curveStr = defaultCurveStr;



function changeCurveType(e){
	switch(parseInt(e.value)){
		case 1:
			curve.getHeight = function(points, scale, vertices){
				for(let z = 0; z < points; z++){
					for(let x = 0; x < points; x++){
						const off = 3 * (z * points + x) ;
						const offX = scale * vertices[off + 0];
						const offZ = scale * vertices[off + 2];

						vertices[3 * (z * points + x) + 1] = (offX**2 + offZ**2) / scale - .5;
					}
				}
			};
			partialDifferential = {
				xAxis : function(x, z){
					return 2 * x;
				},
				zAxis : function(x, z){
					return 2 * z;
				},
				xAxisStr : function(x, z){
					return "y = x * x + " + (z * z - .5);
				},
				zAxisStr : function(x, z){
					return "y = z * z + " + (x * x - .5) ;
				}
			};
			curveStr = function(){
				return "y = x * x + z * z - .5";
			}
		break;
		case 2:
			curve.getHeight = function(points, scale, vertices){
				for(let z = 0; z < points; z++){
					for(let x = 0; x < points; x++){
						const off = 3 * (z * points + x) ;
						const offX = scale * vertices[off + 0];
						const offZ = scale * vertices[off + 2];

						const R = 2*Math.PI*Math.sqrt(offX**2 + offZ**2+ .1);

						vertices[3 * (z * points + x) + 1] = (Math.sin(R)/R) / scale;
					}
				}
			};
			partialDifferential = {
				xAxis : function(x, z){
					const a = 2*Math.PI;
					const R = Math.sqrt(x**2 + z**2+ .1);
					return (a*R*Math.cos(a*R)-Math.sin(a*R))*x/(a*R**3);
				},
				zAxis : function(x, z){
					const a = 2*Math.PI;
					const R = Math.sqrt(x**2 + z**2+ .1);
					return (a*R*Math.cos(a*R)-Math.sin(a*R))*z/(a*R**3);
				},
				xAxisStr : function(x, z){
					let z2 = z*z;
					return "y = (2PIsqrt(x*x+"+(z2+.1)+")*cos(2PIsqrt(x*x+"+(z2+.1)+"))-sin(2PIsqrt(x*x+"+(z2+.1)+")))*x/((2PI*sqrt(x*x+"+(z2+.1)+")**3)";
				},
				zAxisStr : function(x, z){
					let x2 = x*x;
					return "y = (2PIsqrt(z*z+"+(x2+.1)+")*cos(2PIsqrt(z*z+"+(x2+.1)+"))-sin(2PIsqrt(z*z+"+(x2+.1)+")))*z/(2PI*sqrt(z*z+"+(x2+.1)+")**3)";
				}
			};
			curveStr = function(){
				return "y = sinc(sqrt(x*x + z*z + .1))";
			};
		break;
		default://case 0
			curve.getHeight = CurvedSurface.prototype.getHeight;
			partialDifferential = defaultPartialDifferential;
			curveStr = defaultCurveStr;
		break;
	}
	curve.updateHeight();
	document.getElementById("curveFormula").innerHTML = curveStr();
}

function simulate(){
	const elm = document.getElementById("simulation");
	if(isSimulate){
		elm.innerHTML = "開始";
		document.getElementById("config").style="";
	} else {
		elm.innerHTML = "停止";
		document.getElementById("config").style="display:none;";
	}
	isSimulate = !isSimulate;
}
function update(){
	let elems = document.getElementById("rotateX").value;
	const rotateX = parseFloat(elems) * Math.PI;

	elems = document.getElementById("rotateY").value;
	const rotateY = parseFloat(elems) * Math.PI;

	curve.rotation(rotateX, rotateY, 0);

	if(isSimulate){
		elems = document.getElementsByName("differential");
		let diff = 0;
		for(let i = 0; i <elems.length; i++){
			if(elems[i].checked == false) continue;
			diff = i + 1;
			break;
		}
		let pos = curve.getPosSphere();
		if(pos.length != 0){
			let dx = -partialDifferential.xAxis(pos[0], pos[2]);
			let dz = -partialDifferential.zAxis(pos[0], pos[2]);

			let amountdx = Math.exp(-Math.abs(dx)) / Math.abs(dx);
			let amountdz = Math.exp(-Math.abs(dz)) / Math.abs(dz);
			const late = 1 / (curve.divistion - 1);

			const move = {
				x: 0,
				y: 0,
				z: 0
			};

			if((diff&1) != 0){
				move.x = dx != 0 ? late / (dx * amountdx) : 0;
				move.y -= dx != 0 ? late / amountdx : 0;
			}

			if((diff&2) != 0){
				move.z = dz != 0 ? late / (dz * amountdz) : 0;
				move.y -= dz != 0 ? late / amountdz : 0;
			}

			curve.moveSphere(move.x, move.y, move.z);
			if(pos[1] - 2 * late < -5) simulate();
		} else simulate();
	} else {
		elems = document.getElementById("positionX").value;
		const posX = parseFloat(elems);

		elems = document.getElementById("positionZ").value;
		const posZ = parseFloat(elems);

		curve.positionSphere(posX, posZ);
	}
}
function init(){
	document.getElementById("curveFormula").innerHTML = curveStr();
	const can = document.getElementById('model');
	can.width = 480;
	can.height = 360;
	curve = new CurvedSurface(can, 480, 360, 1, 50);
	curve.createCurve();
	curve.createSphere();
	curve.positionSphere(0,0);
	curve.draw();

	updateEvent = setInterval(update, 100);
	document.getElementById("positionX").step = 2 / (curve.divistion - 1);
	document.getElementById("positionZ").step = 2 / (curve.divistion - 1);
}
