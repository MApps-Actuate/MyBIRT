var waitDlg = null;

//*************************************************************************************************************
	function showWaiting(wait, msg) {
		msg = (msg == null) ? "&nbsp;" : msg;

		if (wait) {
			if (waitDlg == null) {
				waitDlg = new arf.waiting();
			}
			waitDlg.showDialog();
			waitDlg.setMessage(msg);
		}
		else {
			if (waitDlg != null) {
				waitDlg._hide();//showDialog(false);
			}
		}
	}
//*************************************************************************************************************
	function readCookie(id) {

		var ck = document.cookie;
		ck = (ck == null) ? "" : ck;
		var val = "";

		var cks = ck.split("; ");

		for (var i=0; i < cks.length; i++) {
			if (cks[i].substring(0, id.length) == id) {
				val = cks[i].substring(id.length + 1);
				//alert(val);
				return val;
			}
		}
	}


//*************************************************************************************************************
var ButtonBar = actuate.Class.create();
ButtonBar.prototype = {
	mb: null,

	initialise:function(mainbuttons, leftbuttons) {
	//CHANGEME	arfEd.debug("ButtonBar.initialise");

	//CHANGEME - try to fix binding for this - esp first batched button
		if (mainbuttons != null) {
			mb = $("#buttonbar");
			for (var i=0; i < mainbuttons.length; i++) {
				var btn = mycreateElement(mainbuttons[i].tag, mainbuttons[i].opts);
				if (mainbuttons[i].click != null)
					//Event.observe(btn, 'click', mainbuttons[i].click);
					$(btn).bind('click', mainbuttons[i].click);
				var tblcell = mycreateElement("td");
				$(tblcell).append(btn);
				mb.append(tblcell);
//				tblcell.appendChild(btn);
//				mb.appendChild(tblcell);
			}
		}

		if (leftbuttons != null) {
			mb = $("#leftbuttonbar");
			for (var i=0; i < leftbuttons.length; i++) {
				var btn = mycreateElement(leftbuttons[i].tag, leftbuttons[i].opts);
				if (leftbuttons[i].click != null)
//					Event.observe(btn, 'click', leftbuttons[i].click);
					$(btn).bind('click', leftbuttons[i].click);
				var tblcell = mycreateElement("td");
//				tblcell.appendChild(btn);
//				mb.appendChild(tblcell);
				$(tblcell).append(btn);
				mb.append(tblcell);			}
		}

	},

	mouseover:function() {
		$(this).addClass("highlight");
	},

	mouseout:function() {
		$(this).removeClass("highlight");
	}

}

//*************************************************************************************************************
// Visual effects


actuate.util.Package.define("arf");
arf.Animator = actuate.Class.create();
arf.Animator.prototype = {
	events:null,
	running:false,
	interval:10,

	initialize:function() {
		this.events = new Array();
	},

	doevents:function() {
		var carryon = false;
		var i=0;
		while (i < animator.events.length) {
			var isactive = animator.events[i].doevent();
			if (isactive) {
				carryon = true;
				i++;
			} else {
				animator.events[i].finish();
				//remove
				animator.events.splice(i, 1);
			}
		}
		if (carryon)
			setTimeout("animator.doevents()", animator.interval);
		else {
			//arfEd.debug("Animator finished...");
			animator.running = false;
		}
	},

	start:function() {
		if (!animator.running) {
			//arfEd.debug("Animator started...");
			animator.running = true;
			animator.doevents();
		}
	},

	add:function(e) {
		animator.events.push(e);
		animator.start();
	},

	setOpacity:function(o, opacity, durn) {

		// Check if there's already a fader event on this object - if so, remove it
		var i=0;
		while (i < animator.events.length) {
			var ev = animator.events[i];
			if (ev.obj == o) {
				// This event is for the current object
				if (ev.isfader == true) {
					 // This is a fader event - remove it as it will be replaced by the new one
					 animator.events.splice(i, 1);
					 //alert(ev);
					 break;
				 }
			}
			i++;
		}

		durn  = (durn == undefined) ? 0 : durn;
		f = new arf.Fader({opacity:opacity, obj:o, duration:durn});
		animator.add(f);
	},

	fadeFrom:function(o, fromop, toop, durn) {

		// Check if there's already a fader event on this object - if so, remove it
		var i=0;
		while (i < animator.events.length) {
			var ev = animator.events[i];
			if (ev.obj == o) {
				// This event is for the current object
				if (ev.isfader == true) {
					 // This is a fader event - remove it as it will be replaced by the new one
					 animator.events.splice(i, 1);
					 //alert(ev);
					 break;
				 }
			}
			i++;
		}

		durn  = (durn == undefined) ? 0 : durn;
		f = new arf.Fader({opacity:toop, fromopacity:fromop, obj:o, duration:durn});
		animator.add(f);
	},

	moveElement:function(o, movex, movey, durn, opts) {
		durn  = (durn == undefined) ? 0 : durn;
		var m = new arf.MoveBy({obj:o, dx:movex, dy:movey, duration:durn, opts:opts});
		animator.add(m);
	}

}
var animator = new arf.Animator();

arf.AnimBase = actuate.Class.create();
arf.AnimBase.prototype = {
	doevent:function() {arfEd.debug("Pure virtual");},
	finish:function()  {arfEd.debug("Pure virtual");}
}

arf.Fader = actuate.Class.create();
arf.Fader.prototype = actuate.Class.extend( new arf.AnimBase(), {
	isfader:true,
	isactive:false,
	obj:null,
	targetop:1,
	startop:0,
	opdelta:null,
	currentop:0,
	duration:0,

	initialize:function(args){
		this.obj = args.obj;
		this.targetop = args.opacity;
		this.duration = args.duration;

		var op = 1.0 * (this.obj.style.opacity);
		if (args.fromopacity != null)
			op = args.fromopacity;

		this.currentop = op;
		this.startop = op;
		var numsteps = 1 + (1000 * this.duration / animator.interval);
		this.opdelta = (this.targetop - this.currentop) / numsteps;
		this.isactive = (this.opdelta != 0);
	},

	doevent:function() {
		this.currentop += this.opdelta;
		if (this.currentop < 0) this.currentop = 0;
		if (this.currentop > 1) this.currentop = 1;
		this.obj.style.opacity = this.currentop;
		if (this.opdelta > 0 && this.currentop >= this.targetop)
			this.isactive = false;
		else if (this.opdelta < 0 && this.currentop <= this.targetop) {
			this.isactive = false;
}
		return this.isactive;
	},

	finish:function() {}
});


arf.MoveBy = actuate.Class.create();
arf.MoveBy.prototype = actuate.Class.extend( new arf.AnimBase(), {
	dx:0,
	dy:0,
	movex:0,
	movey:0,
	obj:null,
	duration:0,
	counter:0,
	numsteps:0,
	duration:0,
	startx:0,
	starty:0,
	onFinish:null,

	initialize:function(args){
		this.obj = args.obj;
		this.movex = args.dx;
		this.movey = args.dy;
		this.duration = args.duration;
		if (args.opts != null) {
			this.onFinish = args.opts.onFinish;
		}

		this.numsteps = 1 + (1000 * this.duration / animator.interval);

		this.dx = this.movex / this.numsteps;
		this.dy = this.movey / this.numsteps;

		this.isactive = (this.dx != 0 ) || (this.dy != 0);
		this.counter = 0;
		this.startx = this.obj.style.left;
		this.startx = this.startx.replace("px", "") * 1.0;
		this.starty = this.obj.style.top;
		this.starty = this.starty.replace("px", "") * 1.0;
	},

	doevent:function() {
		var t = this.counter / this.numsteps;
		var fac =  1.001 * (-Math.pow(2, -10*t) + 1);

		var x = this.startx + (this.movex * fac);
		var y = this.starty + (this.movey * fac);

		this.obj.style.left = x + "px";
		this.obj.style.top = y + "px";
		return (++this.counter <= this.numsteps);
	},

	finish:function() {
		if (this.onFinish != null)
			this.onFinish();
	}

});

//*************************************************************************************************************
// Drag and drop

actuate.util.Package.define("arf");
arf.DragHandler = actuate.Class.create();
arf.DragHandler.prototype = {
	draggableitems:null,
	alldroptargets:null,
	singledroptarget:null,
	listeners:null,
	onmouseup:null,
	onmousemove:null,
	draggingitem:null,
	currenttarget:null,

	initialize:function() {

		this.draggableitems = new Array();
		this.alldroptargets = new Array();
		this.singledroptarget = null;
		this.listeners = new Array();

		$(document).bind("mouseup", $.proxy(this.endDrag, this));
		$(document).bind("mousemove", $.proxy(this.move, this));


//		this.onmouseup = this.endDrag.bindAsEventListener(this);
//		this.onmousemove = this.move.bindAsEventListener(this);

//		this.eventKeypress  = this.keyPress.bindAsEventListener(this);

//		Event.observe(document, "mouseup", this.onmouseup);
//		Event.observe(document, "mousemove", this.onmousemove);


//		Event.observe(document, "keypress", this.eventKeypress);

	},

	addDraggable:function(draggable) {
		this.draggableitems.push(draggable);
	},

	addDropTarget:function(target) {
		this.alldroptargets.push(target);
	},

	addListener:function(o) {
		// Don't add if this is already in the list
		for (var i=0; i < this.listeners.length; i++) {
			if (this.listeners[i] == o)
				return;
		}
		this.listeners.push(o);
	},

	removeAllDraggables:function(type) {
		if (type == undefined || type == null) {
			// Remove all draggables
			while (this.draggableitems.length > 0) {
				var d = this.draggableitems.pop();
				d.destroy();
			}
		} else {
			// Remove selected draggables
			var newlist = new Array();

			for (var i= this.draggableitems.length -1; i >=0 ; i--) {
				var d = this.draggableitems.pop();
				if (d.type == type)
					d.destroy();
				else
					newlist.push(d);
			}
			this.draggableitems = newlist;
		}
	},

	removeAllDropTargets:function() {
		this.alldroptargets = new Array();
	},

	startDrag:function(draggable) {
		draghandler.draggingitem = draggable;
	},

	endDrag:function(event) {
		if (this.currenttarget != null) {
			arfEd.drop(this.draggingitem, this.currenttarget);
			this.currenttarget = null;
		}

		if (this.draggingitem != null) {
			this.draggingitem.moveBack();
			this.draggingitem = null;
		}
	},

	restrictTargetsTo:function(target) {
		// Restrict drop targets to a single target. Call with null to reset
		var ignoreobj;
		var startop;
		var endop;

		if (target == null) {
			if (this.singledroptarget != null) {
				// Did have restricted targets - destrict them
				ignoreobj = this.singledroptarget[0];
				startop = 0.2;
				endop = 1;
				this.singledroptarget = null;
			} else {
				// Nothing restricted - do nothing
				return;
			}
		} else {
			if (this.singledroptarget != null) {
				// Already restricted
				if (this.singledroptarget[0] == target) {
					// Same as currently selected - do nothing
					return;
				}
			}
			// Restrict the targets
			ignoreobj = target;
			this.singledroptarget = new Array();
			this.singledroptarget.push(target);
			startop = 1;
			endop = 0.2;
		}

		// Animate the elements
		var i=0;
		while (i < this.alldroptargets.length) {
			var obj = this.alldroptargets[i];
			if (obj != ignoreobj) {
				// Fade this element - it is not the single drop target
				animator.fadeFrom(obj, startop, endop, 0.1);
			}
			i++;
		}

	},

	move:function(event) {
		if (this.draggingitem != null) {

			var x = event.pageX;
			var y = event.pageY;
			this.draggingitem.move(x, y);
			var overtarget = null;
			if (this.singledroptarget == null)
				overtarget =hitTest(this.draggingitem.dragoutline, this.alldroptargets);
			else
				overtarget =hitTest(this.draggingitem.dragoutline, this.singledroptarget);

			if (overtarget.length == 0) {
				overtarget = null;
			} else
				overtarget = overtarget[0];

			if (overtarget != null) {
				if (overtarget.id == this.draggingitem.objid) {
					// Can't drop draggable on itself
					overtarget = null;
				}
			}

			if (overtarget != null) {
				if (overtarget.className != null && overtarget.className.indexOf("emptyslot") > -1) {
					// Dropping on an empty slot - is this allowed ?
					if ("parameter" == this.draggingitem.type) {
						// Not allowed
						overtarget = null;
					}
				}
			}
console.log(this.currenttarget);
			if (overtarget != this.currenttarget) {
				if (this.currenttarget != null) {
					$(this.currenttarget).removeClass("hover1");
				$("#hoveroverlay").remove();
				}
				this.currenttarget = overtarget;
				if (overtarget != null) {
					$(this.currenttarget).addClass("hover1");

/*					$("<div />").attr("id", "hoveroverlay").css({
					    position: "absolute",
					    width: "100%",
					    height: "100%",
					    border: "1px solid #000000",
					    left: 0,
					    top: 0,
					    opacity:0.25,
					    zIndex: 1000000,  // to be on the safe side
					    backgroundColor: "#999999"
					}).appendTo($(this.currenttarget).css("position", "relative"));
*/
				}


			}
		}
	}
}

// Initialise global draghandler
var draghandler = new arf.DragHandler();


actuate.util.Package.define("arf");
arf.Draggable = actuate.Class.create();
arf.Draggable.prototype = {
	onStartDrag:function(){},
	onDrop:function(){},
	onMove:function(){},
	zindex:1000,
	objid:null,
	obj:null,
	onmousedown:null,
	onmouseup:null,
	orgX:null,
	orgY:null,
	startX:null,
	startY:null,
	dragoutline:null,
	type:null,

	initialize:function(args) {
		this.objid = args.objid;
		this.type = args.type;
		this.obj = document.getElementById(this.objid);
		draghandler.addDraggable(this);

		$(this.obj).bind("mousedown", $.proxy(this.initDrag, this));
	},

	initDrag:function(event) {

		draghandler.startDrag(this);
		event.stopPropagation();

		var d = document.createElement("div");
		document.body.appendChild(d);

		d.style.border = "2px dashed gray";
		d.style.cursor="pointer";

		var h = $(event.currentTarget).height();
		var w = $(event.currentTarget).width();
		var voffset = 0;
		var hoffset = 0;
		if (h > 50) {
			voffset = event.clientY - $(event.currentTarget).offset().top - 25;
			h = 50;
		}
		if (w > 200) {
			hoffset = event.clientX - $(event.currentTarget).offset().left - 100;
			w = 200;
		}
		d.style.height = h + "px";
		d.style.width = w + "px";

		d.style.position="absolute";
		var p = $(event.currentTarget).offset();
		p.top += voffset;
		p.left += hoffset;
		d.style.left = p.left + "px";
		d.style.top= p.top + "px";
		this.startX = p.left;
		this.startY = p.top;
		d.style.zIndex = 1000;
		this.dragoutline = d;
		animator.setOpacity(event.currentTarget, 0.2, 0);

	},

	drop:function(event) {
		alert("!");
		Event.stop(event);
	},

	destroy:function() {
		// kill the element
		if (this.dragoutline != null)
			$(this.dragoutline).remove();

		$(this.obj).remove();
	},

	move:function(x, y) {
		if (this.orgX == null) {

			this.orgX = x;
			this.orgY = y;
	}
		this.obj.style.zIndex = 1000;

		var newx = this.startX + x - this.orgX;
		var newy = this.startY + y - this.orgY;

		this.dragoutline.style.left = newx + "px";
		this.dragoutline.style.top = newy + "px";
	},

	moveBack:function() {
		this.orgX = null;
		this.orgY = null;
		var x = this.dragoutline.style.left;
		x = x.replace("px", "") * 1.0;
		var y = this.dragoutline.style.top;
		y = y.replace("px", "") * 1.0;

//		animator.moveElement(this.dragoutline, this.startX - x, this.startY - y, 0.2, {onFinish:function(){this.removeOutline()}.bind(this)});
		animator.moveElement(this.dragoutline, this.startX - x, this.startY - y, 0.2, {onFinish:$.proxy(this.removeOutline, this)});
		animator.setOpacity(this.obj, 1, 0.2);
	},

	removeOutline:function() {
		$(this.dragoutline).remove();
//		Element.remove(this.dragoutline);
//		this.dragoutline.remove();
		this.dragoutline = null;
	}
}

hitTest = function(o, l){
	function getOffset(o){
	for(var r = {l: o.offsetLeft, t: o.offsetTop, r: o.offsetWidth,
	b: o.offsetHeight};
	o = o.offsetParent; r.l += o.offsetLeft, r.t +=
	o.offsetTop);


	return r.r += r.l, r.b += r.t, r;
	}

	function getOffsetInViewer(o) {
		var r = getOffset(o);
		// Adjust position to match float panel
		r.t -= arfEd.floatPanel.scrollTop;
		r.b -= arfEd.floatPanel.scrollTop;
		return r;
	}

	for(var b, s, r = [], a = getOffset(o), j = isNaN(l.length), i = (j
	? l = [l] : l).length; i;
	b = getOffsetInViewer(l[--i]), (a.l == b.l || (a.l > b.l ? a.l <= b.r :
	b.l <= a.r))
	&& (a.t == b.t || (a.t > b.t ? a.t <= b.b : b.t <= a.b)) &&
	(r[r.length] = l[i]));
	return j ? !!r.length : r;
};

function mycreateElement(tag, opts) {
	var el = document.createElement(tag);
	for (propid in opts) {
		if (propid == "className")
			el.setAttribute("class", opts[propid]);
		else
			el.setAttribute(propid, opts[propid]);
	}
	return el;
}