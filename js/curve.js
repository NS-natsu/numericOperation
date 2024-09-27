const defaultPartialDifferential = {
	xAxis : function(x, z){
		return 2 * x;
	},
	zAxis : function(x, z){
		return -2 * z;
	},
	xAxisStr : function(x, z){
		return "y = x * x - " + (z * z);
	},
	zAxisStr : function(x, z){
		return "y = - z * z + " + (x * x) ;
	}
};

const defaultCurveStr = function(){
	return "y = x * x - z * z";
}

class CurvedSurface {
	scene;camera;renderer;curve;scale;divistion;width;height;mesh;

	constructor(canvas, width, height, scale, divistion){
		this.scale = scale || 1;
		this.divistion = divistion || 50;
		this.divistion = this.divistion << 1 | 1;

		this.width = width || 480;
		this.height = height || 360;

		this.preparateRenderer(canvas);

		this.mesh = new THREE.Group();
		this.scene.add(this.mesh);
	}

	preparateRenderer(canvas){
		if(canvas){
			this.renderer = new THREE.WebGLRenderer({canvas: canvas});
			this.renderer.setPixelRatio(window.devicePixelRatio);
		} else{
			this.renderer = new THREE.WebGLRenderer();
			document.body.appendChild(this.renderer.domElement);
		}
		
		this.renderer.setSize(this.width, this.height);
		this.renderer.shadowMap.enabled = true;

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0x888888 );
		
		const ambient = new THREE.AmbientLight(0xFFFFFF, .2)
		
		this.camera = new THREE.PerspectiveCamera(45, this.width / this.height);
		this.camera.position.set(0, 0, 5);
		 
		let light = new THREE.DirectionalLight(0xffffff, 0.3);
		light.position.set(0, 10, -5);
		light.castShadow = true; 
		this.scene.add(light);
		
		light = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 20, 0.2);
		light.position.set(0,5, 0);
		light.castShadow = true;
		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 2048;
		this.scene.add(light);
		
		light = new THREE.DirectionalLight(0xffffff,0.3);
		light.position.set(-1, -1, 1);
		this.scene.add(light);
		
		const gridHelper = new THREE.GridHelper(2,10);
		this.scene.add(gridHelper);
		const axisHelper = new THREE.AxisHelper(5);
		this.scene.add(axisHelper);
	}

	getMaxY(){
		let max = undefined;
		const vert = this.curve.attributes.position.array;
		for(let i = 0; i < vert.length; i++){
			let n = Math.abs(vert[3 * i + 1]);
			if(!max) max = n;
			else if(max < n) max = n;
		}
		return max;
	}

	getHeight(points, scale, vertices){
		//default
		//y = x**2 - z **2
		for(let z = 0; z < points; z++){
			for(let x = 0; x < points; x++){
				const off = 3 * (z * points + x) ;
				const offX = scale * vertices[off + 0];
				const offZ = scale * vertices[off + 2];

				vertices[off + 1] = (offX**2 - offZ**2) / scale;
			}
		}
	}

	updateHeight(geometry){
		if(!geometry) geometry = this.curve;

		if(!geometry) return;
		this.getHeight(this.divistion, this.scale, geometry.attributes.position.array);
		geometry.computeVertexNormals();
		geometry.verticesNeedUpdate = true;
		geometry.attributes.position.needsUpdate = true;
	}

	rotation(x, y, z){
		this.mesh.rotation.set(x, y, z);
	}

	planePosition(p, r){
		if(this.mesh.children.length != 2) return;
		
		this.mesh.children[1].rotation.y = r ? 0 : Math.PI / 2;

		this.mesh.children[1].children[0].position.z = p;
	}

	createCurve(){
		if(this.mesh.children.length != 0) return;
		let geometry = new THREE.BufferGeometry();
		let material = new THREE.MeshLambertMaterial({color: 0x0000ff, side: THREE.DoubleSide});
		let mesh = new THREE.Mesh(geometry, material);

		let arr = new Array();
		for(let z = 0; z < this.divistion; z++){
			for(let x = 0; x < this.divistion; x++){
				arr.push(2 * x / (this.divistion - 1) - 1);
				arr.push(0);
				arr.push(2 * z / (this.divistion - 1) - 1);
			}
		}

		geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));

		arr = new Array();
		for(let z = 0; z < this.divistion - 1; z++){
			for(let x = 0; x < this.divistion - 1; x++){
				let lu = this.divistion * z + x;
				let lb = lu + this.divistion;
				let ru = lu + 1;
				let rb = lb + 1;

				arr.push(lu); arr.push(lb); arr.push(ru);
				arr.push(lb); arr.push(rb); arr.push(ru);
			}
		}
		geometry.addAttribute('index', new THREE.BufferAttribute(new Uint16Array(arr), 1));

		this.updateHeight(geometry);

		this.mesh.add(mesh);
		this.curve = geometry;
	}

	createPlane(){
		if(this.mesh.children.length != 1) return;
		const geometry = new THREE.PlaneGeometry(2.4, 5);
		const material = new THREE.MeshPhysicalMaterial( {
			color: 0x0, metalness: 0.25, roughness: 0,
			side: THREE.DoubleSide,
			opacity: .5, transparent: true
		});

		const cut = new THREE.Group();
		cut.add(new THREE.Mesh(geometry, material));

		this.mesh.add(cut);
	}

	getCrossSection(comp){
		let type = 1;
		if(!comp){
			if(this.mesh.children.length === 2){
				type = this.mesh.children[1].rotation.y === 0 ? 1 : 2;
				let z = new Float32Array(1);
				z[0] = this.mesh.children[1].children[0].position.z;
				z = z[0];
				comp = function(v){
					let p = type == 1 ? v.z : v.x;
					return z == p;
				}
			} else {
				comp = function(v){
					return false;
				}
			}
		}
		let vertices=[];

		let vert = this.curve.attributes.position.array;
		for(let i = 0; i < vert.length; i++){
			let v = {
				x : vert[3 * i + 0],
				y : vert[3 * i + 1],
				z : vert[3 * i + 2],
			}
			if(!comp(v)) continue;
			vertices.push(v.y);
		}

		return vertices;
	}

	draw(){
		const r = this.renderer;
		const s = this.scene;
		const c = this.camera;
		updateRender();
		function updateRender(){	
			r.render(s, c);
			requestAnimationFrame(updateRender);	
		}
	}
}
