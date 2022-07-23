class Graph2d extends VCanvas {
	constructor(element, width, height){
		element.style.width = width;
		element.style.height = height;
		element.children[0].width = width;
		element.children[0].height = height;
		element.children[1].width = width;
		element.children[1].height = height;

		super(element.children[0]);
		this.canvases = element;

		const ctx = element.children[1].getContext("2d");
		ctx.beginPath();
		ctx.moveTo( width >> 1, 0 );
		ctx.lineTo( width >> 1, height );

		ctx.moveTo( 0, height >> 1 );
		ctx.lineTo( width, height >> 1 );
		ctx.stroke();
  };
}