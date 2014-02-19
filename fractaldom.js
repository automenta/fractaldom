/*$.widget( "ui.dialog", { _moveToTop: function() { console.log('x'); } });
$.widget( "ui.dialog", { moveToTop: function() { console.log('x'); } });*/


function fractaldom(options) {
	var nodes = { };
	var edges = [ ];

	if (!options) {
		options = { };
		options.iconSize = 64;
	}

	var x = $('<div/>');

	x.addClass('fractaldom_surface');

	var dragging = false;
	var lastPoint = null;
	var startDragPoint = null;
	x.mousedown(function(m) {
		if (m.which==1) { 
			dragging = true;
			startDragPoint = [m.clientX, m.clientY];
		}		
	});
	x.mouseup(function(m) {
		dragging = false;
	});
	x.mousemove(function(m) {
		if (!m.which==1) {
			dragging = false;
			lastPoint = null;
			return;
		}


		if (dragging) {
			if (lastPoint) {
				var dx = m.clientX - lastPoint[0];
				var dy = m.clientY - lastPoint[1];
				for (var n in nodes) {
					var W = nodes[n];
					var p = W.parent().position();
					var P = W.parent();
					P.css('left', p.left + dx );
					P.css('top', p.top + dy );
				}
			}

			lastPoint = [m.clientX, m.clientY];		
			updateUnderlayCanvas();
		}
	});

	var underlayCanvas = $('<canvas width="200" height="200"/>');
	x.append(underlayCanvas);

	function resizeUnderlayCanvas() {
		underlayCanvas.attr('width', x.width());
		underlayCanvas.attr('height', x.height());
	}

	function updateUnderlayCanvas() {
		var c = underlayCanvas.get(0);
		var ctx = c.getContext("2d");
		
		//ctx.clearRect(0,0,c.width,c.height);
		c.width = c.width;

		for (var i = 0; i < edges.length; i++) {
			var E = edges[i];
			var nA = nodes[E[0]];
			var nB = nodes[E[1]];

			var npa = nA.parent().position();
			var npaw = nA.parent().width();
			var npah = nA.parent().height();
			var npb = nB.parent().position();
			var npbw = nB.parent().width();
			var npbh = nB.parent().height();

			var lineWidth = 25;
			var lineColor = '#ffffff';
			var o = E[2];
			if (o) {
				lineWidth = o.lineWidth || lineWidth;
				lineColor = o.lineColor || lineColor;
			}
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = lineColor;
			ctx.moveTo(npa.left + (npaw/2),npa.top + (npah/2));
			ctx.lineTo(npb.left + (npbw/2),npb.top + (npbh/2));
			ctx.stroke();		
		}
	}

	$(window).resize(function() {
		resizeUnderlayCanvas();
		updateUnderlayCanvas();
	});

	x.init = function() {
		resizeUnderlayCanvas();
		updateUnderlayCanvas();
	}

	x.newEdge = function(a, b, opt) {
		edges.push([a,b,opt]);
		updateUnderlayCanvas();
	};

	x.layoutFD = function(affectX, affectY, iterations) {
		var R = 0.5;
		var A = 0.5;

		var nodePosition = { };

		for (var i in nodes) {
			var ip = nodes[i].parent().position();
			nodePosition[i] = [ ip.left, ip.top ]; //TODO consider width/height
		}

		for (var n = 0; n < iterations; n++) {
			//calculate repulsive forces
			for (var i  in nodes) {
				var ip = nodePosition[i];

				for (var j in nodes) {

					if (i == j) continue;

					var jp = nodePosition[j];

					var dx = parseFloat(ip[0] - jp[0]);
					var dy = parseFloat(ip[1] - jp[1]);

					var dist = 0;
					if (affectX) dist+=dx*dx;
					if (affectY) dist+=dy*dy;
					var D = Math.sqrt( dist );
					if (D == 0) continue;

					D = R / D;	
					dx*=D; dy*=D;

					if (!affectX) dx = 0;				
					if (!affectY) dy = 0;

					nodePosition[j] = [ jp[0] - dx, jp[1] - dy ];
				}	
			}

			//calculate attractive forces
			for (var j = 0; j < edges.length; j++) {
				var a = edges[j][0];
				var b = edges[j][1];
				var ap = nodePosition[a];
				var bp = nodePosition[b];

				var dx = parseFloat(ap[0] - bp[0]);
				var dy = parseFloat(ap[1] - bp[1]);

				var dist = 0;
				if (affectX) dist+=dx*dx;
				if (affectY) dist+=dy*dy;
				var D = Math.sqrt( dist );
				if (D == 0) continue;

				D = A / D;
				dx*=D; dy*=D;

				if (!affectX) dx = 0;				
				if (!affectY) dy = 0;

				nodePosition[b] = [ bp[0] + dx, bp[1] + dy ];
			}			
		}

		for (var i in nodes) {
			var ip = nodePosition[i];
			nodes[i].position( ip[0], ip[1]);
		}

		updateUnderlayCanvas();
	};

	//https://jqueryui.com/dialog/
	x.newNode = function(id, opt) {
		if (!opt) opt = { };

		var e = opt.element ? opt.element : $('<div/>');
		var etype = e.prop('tagName');

		if (etype == 'IFRAME') {
			e.attr('width','99%');
			e.attr('height','99%');
		}


		e.addClass('fractaldom');

		opt.minHeight = options.iconSize;
		opt.minWidth = options.iconSize;
		//opt.focus = function( event, ui ) { console.log(e, 'focus'); return false; };

		e.dialog(opt);


		var resized;
		if (!opt.element) {
			var f = $('<div/>');
			e.append(f);
			resized = f;
		}
		else {
			resized = e;
		}


		function updateSize() {
			var h = e.parent().height();
			var w = e.parent().width();

			var tb = e.parent().find(".ui-dialog-titlebar");
			var content = e.parent().find(".ui-dialog-content");
			var slider = e.parent().find(".zoomSlider");

			if ((w < 1.25 * options.iconSize) || (h < 1.25 * options.iconSize)) {
				content.hide();
				slider.hide();
				tb.css('height', '100%');
			}
			else {
				content.show();
				slider.show();
				tb.css('height', 'auto');
			}
		}
		//e.dialog({stack:false});
		e.dialog("widget").draggable("option","containment","none");
		e.dialog({
			  drag: function( event, ui ) {
				updateUnderlayCanvas();				
			  },
			  resize: function( event, ui ) {
				updateSize();
				updateUnderlayCanvas();
				return false;
			  },
			  close: function( event, ui ) {
				//
			  }
		});

		var titlebar = e.parent().find(".ui-dialog-titlebar span");

		var minZoom = 0.2;
		var maxZoom = 2.5;


		function correctIFrameSize() {
			var zoom = e.attr('zoom') || 1.0;
			var pwidth = e.parent().width();
			var pheight = e.parent().width();
			var newWidth = pwidth / zoom;
			var newHeight = pheight / zoom;
			
			e.css('width', newWidth);
			e.css('height', newHeight);
		}

		function setZoom(fs) {
			//e.css('font-size', (fs*100.0) + '%' );
			if (etype == 'IFRAME') {
				/*    zoom: 0.15;
					-moz-transform:scale(0.75);
					-moz-transform-origin: 0 0;
					-o-transform: scale(0.75);
					-o-transform-origin: 0 0;
					-webkit-transform: scale(0.75);
					-webkit-transform-origin: 0 0;*/
				e.css('-webkit-transform', 'scale(' + fs + ')');
				e.css('-webkit-transform-origin', '0 0');
				e.css('-moz-transform', 'scale(' + fs + ')');
				e.css('-moz-transform-origin', '0 0');
				e.css('-o-transform', 'scale(' + fs + ')');
				e.css('-o-transform-origin', '0 0');
				correctIFrameSize();
			}
			else {
				resized.css('zoom', (fs*100.0) + '%' );
			}
			resized.attr('zoom', fs);

			updateUnderlayCanvas();
		}
		function getZoom() {
			return parseFloat(e.attr('zoom'));
		}


		if (etype == 'IFRAME') {
			e.dialog({
			  resizeStop: function( event, ui ) { correctIFrameSize(); }
			});
		}

		var slider = $('<div>&nbsp;</div>');
		var mousedown = false;
		var startZoom = null;
		slider.mouseup(function(e) {
			mousedown = false;
			return false;
		});
		slider.mousedown(function(e) {
			if (e.which == 1) {
				mousedown = true;
				startZoom = getZoom();
			}
			return false;
		});			
		slider.mousemove(function(e) {
			if (e.which == 0) mousedown = false;
			if (mousedown) {
				var x = e.offsetX;

				var p = (parseFloat(x) / parseFloat($(this).width()));
				//var z = minZoom + p * (maxZoom - minZoom);
				var z = minZoom + (p*p) * (maxZoom - minZoom);

				setZoom(z);
			}
		});
		//slider.mouseleave(function(e) { mousedown = false; });
		slider.addClass('zoomSlider');

		titlebar.prepend("&nbsp;");
		titlebar.prepend(slider);

		nodes[id] = e;		

		updateUnderlayCanvas();


		var returnable = e;
		if (f) {
			returnable = f;
		}

		e.position = returnable.position = function(x, y) {	
			e.parent().css('top', y);
			e.parent().css('left', x);
		};
		e.setWidth = returnable.setWidth = function(w) {	e.parent().css('width', w);		}
		e.setHeight = returnable.setHeight = function(h) {	e.parent().css('height', h);		}

		return returnable;
	};

	return x;		
}

