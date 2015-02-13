
var applicationRoot = "/myBIRT";
var debugon=false;
var arfEd = null;
var contentmanager = null;
var buttonbar = null;
var designchooser = null;
var reportDlg = null;
var login = null;
var componentDlg = null;
var helpwin = null;
var sep = "@"; //TODO - make json

var ArfEditor = actuate.Class.create();
ArfEditor.prototype = {
	firstView:true,
	viewer: null,
	hiddenviewer: null,
	pageCount:0,
	currentPage:0,
	currentMasterPage:null,
	numcolumns:0,
	currentTheme:null,
	layoutfile:null,
	currentsection:0,
	runtimeparms:null,
	mouseOverSlotID:null,
	floatPanel:null,
	uiReportFolder:null,
	reportFolder:null,
	waitingforjsapi:false,
	islocked:false,

	initialise:function() {
		arfEd.debug("ArfEditor.initialise");
		$("#mainmiddle").width((layouteditorwidth-24) + "px");

		// Initialise template area
		arfEd.debug("...initialise JSAPI");
		actuate.load("viewer");
		actuate.load("parameter");
		actuate.load("dialog");

		actuate.initialize("../",null,null,null,this.afterInit);
	},

	afterInit:function() {
		//TODO use "proper" jsapi method
		var o = $("#progress_animation_null");
		if (o != null) {
			o.css.display='none';
		}

		arfEd.uiReportFolder = applicationRoot + "/uireports/";
		arfEd.reportFolder = applicationRoot + "/draft/";
		// Initialise general purpose hidden viewer
		arfEd.hiddenviewer = new actuate.Viewer("hiddenviewer");
		arfEd.hiddenviewer.registerEventHandler(actuate.viewer.EventConstants.ON_EXCEPTION, arfEd.errorHandler);

		createArfDialogs();

		designchooser = new DesignChooser({viewer:arfEd.hiddenviewer,exitcallback:arfEd.loadAllWindows});

		// Attempt to load session state from cookie
		var lastdesign = null;
		var lastparms = null;
		var rtplist = new Array();

		if (!resetcookies) {
			lastdesign = readCookie("arf_last_design");
			lastparms = readCookie("arf_last_rtp");
		}
		if (lastparms) {
			// Convert parameters to parametervalue objects
			var parmlist = lastparms.split("@@@");
			for (var i=0; i < parmlist.length; i++) {
				if (parmlist[i] != null && parmlist[i].length > 0) {
					var parmdef = parmlist[i].split("=");
					var pv = new actuate.parameter.ParameterValue();
					pv.setName(parmdef[0]);
					pv.setValue(parmdef[1]);
					rtplist.push(pv);
				}
			}
		}
		arfEd.runtimeparms = rtplist;

		lastdesign = (lastdesign == null) ? "" : lastdesign;
		if (lastdesign.indexOf(".rptdesign") < 0) {
			//Shouldn't happen!
			lastdesign = "";
		}
		if (lastdesign.length == 0)
			designchooser.showDialog(false);
		else
			arfEd.loadAllWindows(lastdesign);
	},

	debug:function(msg) {
		if (!debugon)
			return;

		var console = $("#console");
		if (console) {
			console.height(layouteditorheight + "px");
			$("#consolepanel").show();
			console.append(msg + "<br>");
		}
	},

	wipeDebug:function(msg) {
		var console = $("#console");
		if (console) {
			console.html("");
		}
	},

	saveSessionState:function(design, runtimeparms) {
		var date = new Date();
		date.setMonth(date.getMonth()+1);

		document.cookie = "arf_last_design=" + design + ("; expires=" + date.toUTCString()); ;

		var s = "";
		if (runtimeparms) {
			for (var i=0; i < runtimeparms.length; i++) {
				s +=  runtimeparms[i].getName() + "=" + runtimeparms[i].getValue() + "@@@";
			}
		}
		document.cookie = "arf_last_rtp=" + s + ("; expires=" + date.toUTCString()); ;

	},

	loadAllWindows:function(design) {

		arfEd.debug("ArfEditor.loadAllWindows");
		arfEd.debug("Design file:" + design);
		$("#topcontainer").show();

		arfEd.layoutfile = design;
		arfEd.saveSessionState(design, arfEd.runtimeparms);
		showWaiting(true, i18n.msg_loading_windows);

		// Initialise contentmanager
		if (contentmanager == null) {
			contentmanager = new TemplateContentManager();
			contentmanager.initialise();
			animator.setOpacity(document.getElementById("leftbarouter"), 1);
		} else {
			contentmanager.refreshCompList();
		}

		// Initialise buttonbar
		if (buttonbar == null) {
			buttonbar = new ButtonBar();

			var leftbuttons = [
				{tag:"img", opts:{id:'btnopen', 	className:'menubutton', src:'images/folder3_document.png',	title:i18n.btn_open }, 		click:arfEd.openDesign },
				{tag:"img", opts:{id:'btncreatenew', 	className:'menubutton', src:'images/createnew.png',		title:i18n.btn_new }, 		click:arfEd.newDesign},
				{tag:"img", opts:{id:'btnsave', 	className:'menubutton', src:'images/floppy_disk.png',		title:i18n.btn_save }, 		click:arfEd.saveDesign },
				{tag:"img", opts:{id:'btnshowparms', 	className:'menubutton', src:'images/screwdriver.png',		title:i18n.btn_parms }, 	click:arfEd.showParms },
				{tag:"img", opts:{id:'btndelrpt', 	className:'menubutton', src:'images/delete.png',		title:i18n.btn_deleterpt },	click:arfEd.deleteDesign },
				{tag:"img", opts:{id:'btnpreview', 	className:'menubutton', src:'images/magnifying_glass.png',		title:i18n.btn_preview },	click:arfEd.previewReport },
				//{tag:"img", opts:{id:'btngotoportal', 	className:'menubutton', src:'images/magnifying_glass.png',	title:i18n.btn_gotoportal },	click:arfEd.goToPortal},
				{tag:"img", opts:{id:'btnlogout', 	className:'menubutton', src:'images/logout.png',	title:i18n.btn_logout },	click:arfEd.logout},
				{tag:"img", opts: {id:'btnhelp', style:'margin-left:40px',	className:'menubutton', src:'images/about.png',		title:i18n.btn_help}, click:arfEd.showhelp}
				];

			var mainbuttons = [
				{tag:"img", opts:{id:'btnrefresh', 	className:'menubutton', src:'images/refresh.png',		title:i18n.btn_refresh }, 	click:arfEd.loadTemplateReport},
				{tag:"img", opts:{id:'btnfirst',	className:'menubutton', src:'images/resultset_first.png',	title:i18n.btn_pageFirst }, 	click:arfEd.firstPage },
				{tag:"img", opts:{id:'btnprevious', 	className:'menubutton', src:'images/resultset_previous.png',	title:i18n.btn_pagePrevious },	click:arfEd.previousPage },
				{tag:"div", opts:{id:'txtpage',style:'margin-left:5px;'}, click:null },
				{tag:"img", opts:{id:'btnnext', 	className:'menubutton', src:'images/resultset_next.png',	title:i18n.btn_pageNext }, 	click:arfEd.nextPage },
				{tag:"img", opts:{id:'btnlast', 	className:'menubutton', src:'images/resultset_last.png',	title:i18n.btn_pageLast }, 	click:arfEd.lastPage },
				{tag:"img", opts:{style:'margin-left:5px', src:'images/topbarspacer.png'},click:null},
				{tag:"img", opts:{id:'btndelall', 	className:'menubutton', src:'images/bomb.png',			title:i18n.btn_deleteAll }, 	click:arfEd.deleteAll },
				{tag:"div", opts:{style:'margin-left:10px'},click:null},
				{tag:"div", opts:{id:'pageselectordiv'}},
				{tag:"img", opts:{id:'btnaddsec', 	className:'menubutton', src:'images/page_add.png',		title:i18n.btn_addSection }, 	click:arfEd.addNewSection },
				{tag:"img", opts:{id:'btndelsec', 	className:'menubutton', src:'images/delete.png',		title:i18n.btn_deleteSection }, click:arfEd.deleteSection },
//				{tag:"div", opts:{style:'margin-left:10px'},click:null},
				{tag:"img", opts:{style:'margin-left:5px', src:'images/topbarspacer.png'},click:null},
				{tag:"div", opts:{id:'themeselectordiv'}}
				];

			buttonbar.initialise(mainbuttons, leftbuttons);
			animator.setOpacity(document.getElementById("buttonbar"), 1, 0.5);
		}

		// Set filename in buttonbar
		var ix = design.lastIndexOf("/");
		$("#txtfilename").text(design.substr(ix+1));
		// Load template report
		arfEd.loadTemplateReport();

	},

	showhelp:function() {
		if (helpwin == null)
			helpwin = new arf.helpwin();
		helpwin.loadpage("arf.html");
	},

	loadTemplateReport:function(structurechange) {
		arfEd.currentPage = 0;
		showWaiting(true, i18n.msg_loading_template);

		arfEd.debug("ArfEditor.loadTemplateReport");

		if (arfEd.viewer == null) {
			// Initialise the viewer
			var scrollPanel = new actuate.viewer.ScrollPanel();
			//scrollPanel.setScrollControlEnabled(true);
			scrollPanel.setPanInOutEnabled(true);
			scrollPanel.setMouseScrollingEnabled(true);
			var config = new actuate.viewer.UIConfig();
			config.setContentPanel(scrollPanel);

			arfEd.viewer = new actuate.Viewer("mainviewer", config);

			arfEd.viewer.registerEventHandler(actuate.viewer.EventConstants.ON_EXCEPTION, arfEd.errorHandler);
			arfEd.viewer.registerEventHandler(actuate.viewer.EventConstants.ON_CONTENT_CHANGED , arfEd.contentChanged);
			arfEd.viewer.registerEventHandler(actuate.viewer.EventConstants.ON_SESSION_TIMEOUT , arfEd.sessionTimeout);

			var gap = 24; //TODO check purpose?
			arfEd.viewer.setWidth(layouteditorwidth-gap);
			arfEd.viewer.setHeight(layouteditorheight-gap);

			$("#mainviewer").width((layouteditorwidth-gap) + "px").height((layouteditorheight-gap) + "px");

			var uiopts = new actuate.viewer.UIOptions();
			uiopts.enableMainMenu(false);
			uiopts.enablePageNavigation(false);
			uiopts.enableToolBar(false);
			uiopts.enableToolbarContextMenu(false);
			uiopts.enableContentMargin(true);
			arfEd.viewer.setContentMargin({top:20, left:50, right:50, bottom:50});
			arfEd.viewer.setUIOptions(uiopts);
		}
		arfEd.viewer.setReportName(arfEd.layoutfile);

		var parms = arfEd.getParameters("Edit", structurechange);

		arfEd.viewer.setParameterValues(parms);
		arfEd.waitingforjsapi = true;
		arfEd.viewer.submit();//Control picked up by contentChanged

		$(".progress_animation").children().hide();

	},

	getParameters:function(mode, structurechange) {
		var parms = new Array();
		if (mode != null) {
			var p = new actuate.parameter.ParameterValue();
			p.setName("__Mode");
			p.setValue(mode);
			parms.push(p);
		}

		if (structurechange != null) {
			var p = new actuate.parameter.ParameterValue();
			p.setName("__StructureChange");
			p.setValue(structurechange);
			parms.push(p);
		}

		if (arfEd.runtimeparms != null)
			parms = parms.concat(arfEd.runtimeparms);

		return parms;
	},

	mouseOverSlot:function(event) {
		var slot = this.id;
		var oldslot = arfEd.mouseOverSlotID;
		if (slot != oldslot) {
			if (oldslot != null) {
				// hide previous buttons
				$("[id^=" + oldslot + "_B]").each(function(index, element){
					animator.setOpacity(element, 0, 0.2);
				});
			}
			arfEd.mouseOverSlotID = slot;

			// Show new buttons
			$("[id^=" + slot + "_B]").each(function(index, element){
				animator.setOpacity(element, 1, 0.2);
			});
		}
	},

	prepareTemplate:function() {

		if (arfEd.floatPanel == null) {
			// variable used in shared to get scrolloffset
			//TODO fix to remove global
			arfEd.floatPanel = $("#mainviewer .floatPanel")[0];
		}

		var prefix = arfEd.viewer.getId();

		// Make the main grid a little wider so the right hand border shows up - looks better
		var ch = $("#" + prefix + "___BIRT_ROOT > table");
		var newwidth = ch.width() + 2;
		ch.width(newwidth);
		ch.css("outline", "1px dotted #c0c0c0"); // outline is outside the page

		draghandler.removeAllDropTargets();
		arfEd.debug("ArfEditor.prepareTemplate");

		// Is the report locked ?
		var lockeditem = $(prefix + "__LOCKED");
		arfEd.islocked = (lockeditem.length > 0);

		if (!arfEd.islocked) {
			// Add edit buttons, drop targets etc
			// Find the root grid of the page

			var rootgrid = $("[id^=" + prefix + "__Grid]");

			if (rootgrid.length == 0) {
				// report not loaded yet; wait a little longer
				arfEd.debug("Failed to find root grid");
				setTimeout("arfEd.prepareTemplate()", 100);
				return;
			}
			arfEd.debug("Found root grid:" + rootgrid.attr("id"));

			// Get section metadata
			var meta = arfEd.getSectionMeta();
			arfEd.numcolumns = meta.columns;
			arfEd.currentMasterPage = meta.masterpage;

			arfEd.currentTheme = meta.theme;

			var start = (new Date()).getTime();
			rootgrid.find("table[id*='_Slot']").each(function(index, obj) {

				var slotid = obj.id;
				var keyix = slotid.indexOf("_Slot");

				slotid = slotid.substring(keyix+1);
				// Add drop target to component container - table cell
				// May need IE fixing!!
				obj = obj.parentNode;
				var slotinfo = slotid.split("_"); // Slot,sec,row,col,layout,type
				obj.id = slotid;//slotinfo.join("");//slotid;

				arfEd.debug("..." + slotid);
				draghandler.addDropTarget(obj);

				$(obj).addClass("slot");

				// Get the section id
				arfEd.currentsection = slotinfo[1] * 1;

				$(obj).bind("mouseover", arfEd.mouseOverSlot);
				if (slotinfo[4] != "B") {

					// This is not an empty slot

					// Get meta data
                    var text = $("#" + prefix + "_" + slotid + "Parms").text();
                    if (text == null || text == "")
                        text = $("#" + prefix + "_" + slotid + "AfterParms").text()
					var meta = $.parseJSON(text);

					if (debugon)
						$("#" + prefix + "_" + slotid).addClass("debug");

					// Make the contents draggable
					var AP = new arf.Draggable({objid:obj.id, type:'existingcomponent'});

					if (meta != null) {
						var btn;
						var pos = $(obj).position();

						var gap = 18;
						// Delete button
						var x = pos.left + $(obj).width() - gap;
						var y = pos.top + 5;
						var btntitle = i18n.btn_delete;

						if (debugon)
							btntitle = "*** " + meta.compname + "***";
						btn = mycreateElement("img", {id:obj.id + "_B0", src:'images/delete.png',title:btntitle,style:'position:absolute;cursor:pointer;opacity:0;top:' + y + 'px;left:' + x + 'px'});

						$(obj).parent().append(btn);
						btn.slot = obj.id;
						$(btn).bind('click', arfEd.wipeSlot);
						$(btn).bind('mouseover', buttonbar.mouseover);
						$(btn).bind('mouseout', buttonbar.mouseout);
						$(btn).addClass('contextbutton');

						// Layout button
						x -= gap;
						btn = mycreateElement("img", {id:obj.id + "_B1", src:'images/layout.png',title:i18n.btn_layout,style:'position:absolute;cursor:pointer;opacity:0;top:' + y + 'px;left:' + x + 'px'});
						$(obj).parent().append(btn);
						btn.slot = obj.id;
						$(btn).bind('click', arfEd.editComponentLayout);
						$(btn).bind('mouseover', buttonbar.mouseover);
						$(btn).bind('mouseout', buttonbar.mouseout);
						$(btn).addClass('contextbutton');


						// ADNP 2009-11-16 added handle for type P to launch component parameter editor
						if (slotinfo[4] == "P") {
							var btn2;
							var pos = $(obj).position();
							x -= gap;
							var btn2 = mycreateElement("img", {id:obj.id + "_B2", src:'images/screwdriver.png',title:i18n.btn_edit,style:'position:absolute;cursor:pointer;opacity:0;top:' + y + 'px;left:' + x + 'px'});
							$(obj).parent().append(btn2);
							btn2.slot = obj.id;
							$(btn2).bind('click', arfEd.editComponent);
							$(btn2).bind('mouseover', buttonbar.mouseover);
							$(btn2).bind('mouseout', buttonbar.mouseout);
							$(btn2).addClass('contextbutton');
						}
					} else {
						// No meta data
					}

				} else {
					// Must be a Blank - don't add the delete button & set the style
					$(obj).addClass("emptyslot");

				}
			});
		}
		//
		arfEd.mouseOverSlotID = null;

		var end = (new Date()).getTime();
		arfEd.debug("..." + (end-start) + "ms");

		contentmanager.setMasterPageSelection(arfEd.currentMasterPage);
		contentmanager.setThemeSelection(arfEd.currentTheme);
		arfEd.waitingforjsapi = false;

		showWaiting(false);
	},

	getSectionMeta:function() {
		var prefix = arfEd.viewer.getId();
		var meta_lbl = $(".birt-label-design[id^='" + prefix + "'][style='display: none;']");
		var meta = null;
		meta_lbl.each(function(index, element) {
			var met2 = jQuery.parseJSON($(element).text());
			if (met2.type == "section") {
				meta = met2;
				return false;
			}
		});
		return meta;
	},

	errorHandler:function(viewInstance, exception) {
		showWaiting(false);
		var msg = exception.getMessage();
		if (msg.indexOf("Cannot find the specified file or folder") > -1) {
			msg = i18n.msg_lostdesign.replace("%1", arfEd.layoutfile);
			var confirm = new arf.confirm({title:i18n.msg_error, msg:msg, exitcallback:arfEd.forceDesignChange, okonly:true, width:300});
			confirm.showDialog();
		} else {
			var confirm = new arf.confirm({title:i18n.msg_error, msg:msg, exitcallback:arfEd.forceDesignChange, okonly:true, width:300});
			confirm.showDialog();
		}
	},

	drop:function(draggeditem, droptarget) {
		var objectid = draggeditem.objid.substring(14);
		var slotid = droptarget.id;
		var objecttype = draggeditem.type;

		arfEd.debug("Drop " + objecttype + " " + objectid + " in " + slotid);

		if (objecttype == "component" || objecttype == "existingcomponent" ) {
			if (draggeditem.objid.indexOf("_draggable_") < 0) {
				// move
				arfEd.moveComponent(draggeditem.objid, slotid);
			} else
				arfEd.updateSlot(slotid, objectid, "component");
		}
	},

	wipeSlot:function(o) {
		var slot = o.target.slot;
		arfEd.debug("Set " + slot + "=Blank");
		arfEd.updateSlot(slot, "Blank", "component");
	},

	moveComponent:function(objectid, slot) {
		arfEd.currentPage = 0;
		arfEd.debug("ArfEditor.moveComponent:");
		var targetslotinfo = slot.split("_"); // move to
		var sourceslotinfo = objectid.split("_"); // move from
		var sameslot = true;
		var i = 0;
		while (sameslot && ++i < 4)
			sameslot &= (targetslotinfo[i] == sourceslotinfo[i]);

		if (sameslot) {
			return;
		}

		var cmd = "Component" + sep + "move" + sep+ sourceslotinfo[1]+ sep + sourceslotinfo[2]+ sep + sourceslotinfo[3] + sep + targetslotinfo[1] + sep + targetslotinfo[2] + sep + targetslotinfo[3] ;
		arfEd.debug("  " + cmd);
		arfEd.loadTemplateReport(cmd);
	},

	updateSlot:function(slot, objectid, objecttype) {
		arfEd.currentPage = 0;
		arfEd.debug("ArfEditor.updateSlot:");

		var slotinfo = slot.split("_");
		var cmd;
		if ("Blank" ==  objectid)
			cmd = "Component" + sep + "delete" + sep + slotinfo[1] + sep + slotinfo[2] + sep + slotinfo[3];
		else
			cmd = "Component" + sep + "update" + sep + slotinfo[1] + sep + slotinfo[2] + sep + slotinfo[3] + sep + objectid;
		arfEd.loadTemplateReport(cmd);
	},

	deleteAll:function() {
		var confirm = new arf.confirm({title:i18n.msg_confirm, msg:i18n.msg_deleteAll, exitcallback:arfEd.deleteAllAfter});
		confirm.showDialog();
	},

	deleteAllAfter:function(resp) {
		if (resp) {
			arfEd.currentPage = 0;
			arfEd.debug("ArfEditor.deleteAll");
			arfEd.loadTemplateReport("Section" + sep + "delall" + sep + "0" + sep + "0" + sep + "0");
		}
	},

	firstPage:function() {
		if (arfEd.viewer.getCurrentPageNum() > 1)
			arfEd.viewer.gotoPage(1);
	},

	previousPage:function() {
		if (arfEd.viewer.getCurrentPageNum() > 1)
			arfEd.viewer.gotoPage(arfEd.viewer.getCurrentPageNum() - 1);
	},

	nextPage:function() {
		if (arfEd.viewer.getCurrentPageNum() < arfEd.viewer.getTotalPageCount())
			arfEd.viewer.gotoPage(arfEd.viewer.getCurrentPageNum() + 1);
	},

	lastPage:function() {
		if (arfEd.viewer.getCurrentPageNum() < arfEd.viewer.getTotalPageCount())
			arfEd.viewer.gotoPage(arfEd.viewer.getTotalPageCount());
	},

	contentChanged:function(vwr, exx) {
		// Ignore ON_CONTENT_CHANGED for hidden viewer
		if (vwr != arfEd.viewer) {
			arfEd.debug("ArfEditor.contentChanged - wrong viewer");
			return;
		}
		arfEd.debug("ArfEditor.contentChanged");

		// Check whether page count has changed -
		var newcount = vwr.getTotalPageCount();
		arfEd.debug("...page " + arfEd.currentPage + " of " + newcount);
		if (newcount != arfEd.pageCount) {
			arfEd.debug("...page count=" + newcount);
			arfEd.pageCount = newcount;
		}


		if (arfEd.currentPage != -1) {
			var newpage = vwr.getCurrentPageNum();
			if (newpage != arfEd.currentPage) {
				arfEd.debug("...open page=" + newpage);
				arfEd.currentPage= newpage;

				// Deferred call to prepare template - gives framework a chance to draw the content
				//setTimeout("arfEd.prepareTemplate()", 50);
				arfEd.prepareTemplate();
			}
		}

		// Handle button state
		if (arfEd.currentPage <= 1) {
			arfEd.updateButton("btnfirst", false);
			arfEd.updateButton("btnprevious", false);
		} else {
			arfEd.updateButton("btnfirst", true);
			arfEd.updateButton("btnprevious", true);
		}

		if (arfEd.currentPage >= newcount)  {
			arfEd.updateButton("btnlast", false);
			arfEd.updateButton("btnnext", false);
			// Add/delete sections buttons are available

			arfEd.updateButton("btnaddsec", true);

			// Don't allow delete button if on first page since we must be in section 1
			arfEd.updateButton("btndelsec", arfEd.currentPage > 1);
		} else {
			arfEd.updateButton("btnlast", true);
			arfEd.updateButton("btnnext", true);

			// Add/delete sections buttons are disabled
			arfEd.updateButton("btndelsec", false);
			arfEd.updateButton("btnaddsec", false);
		}

		$("#txtpage").text(arfEd.currentPage + " " + i18n.btn_pagenOfm + " " + newcount);

	},


	updateButton:function(btn, enabled) {
		var obj = $("#" + btn);

		if (obj.length == 0)
			return;

		var fadelevel = 0.1;
		var durn = 0.2;

		if (enabled) {
			animator.setOpacity(obj[0], 1, durn);
			$(btn).removeClass("buttondisabled");
		} else {
			animator.setOpacity(obj[0], 0.1, durn);
			$(btn).addClass("buttondisabled");
		}
	},

	changeMasterPage:function() {
		var pagename = $("select#pageselector").val();
		var cmd = "Section" + sep + "update" + sep + arfEd.getCurrentSection() + sep + "0" + sep + "0" + sep + pagename;
		arfEd.loadTemplateReport(cmd);
	},

	changeTheme:function() {
		var themename = $("select#themeselector").val();
		var cmd = "Layout" + sep + "update" + sep + "0" + sep + "0" + sep + "0" + sep + themename;
		arfEd.loadTemplateReport(cmd);
	},

	addNewSection:function() {
		if ($("btnaddsec").hasClass("buttondisabled")) {
			// Button is disabled - don't do it
			return;
		}
		var pagename = contentmanager.defaultmasterpage;
		var secid = 1 + arfEd.getCurrentSection();

		var cmd = "Section" + sep + "insert" + sep + secid + sep + "0" + sep + "0" + sep+ pagename;
		arfEd.loadTemplateReport(cmd);


	},

	deleteSection:function() {
		if ($("btndelsec").hasClass("buttondisabled")) {
			// Button is disabled - don't do it
			return;
		}

		var secid = arfEd.getCurrentSection();

		var cmd = "Section" + sep + "delete" + sep + secid + sep + "0" + sep + "0";
		arfEd.loadTemplateReport(cmd);
	},

	getCurrentSection:function() {
		//Get section id
		return this.currentsection;
	},

	showParms:function() {
		var d = new DTPChooser({exitcallback:arfEd.updateRuntimeParms,layoutfile:arfEd.layoutfile});
		d.showDialog();
	},

	showDesignChooser:function() {
		designchooser.showDialog(true);
	},

	forceDesignChange:function() {
		showWaiting(false, "");

		designchooser.showDialog(false);
	},

	updateRuntimeParms:function(parms) {
		arfEd.runtimeparms = parms;
		arfEd.saveSessionState(arfEd.layoutfile, parms);
		arfEd.loadTemplateReport();
	},

	utilityParmsCallback:function(parms) {
		// Check for the pTemplateDesign parameter
		for (var i=0; i < parms.length; i++) {
			if (parms[i].getName().toLowerCase() == "ptemplatedesign") {
				// Set the value to the current template design (without path or suffix)
				var s = arfEd.templatedesign;
				s = s.substring(s.lastIndexOf("/") + 1);
				s = s.substring(0, s.indexOf(".rptdesign"));
				parms[i].setCurrentValue(s);
				parms[i].setDefaultValue(s);
				break;
			}
		}
	},

	getUrl:function(invokesubmit, savedfile) {

		var url = "";
		var port = window.location.port;
		url = window.location.href;
		// Find the slash just after the application context
		var ix = url.indexOf("//") + 3;
		ix = url.indexOf("/", ix) + 1;
		ix = url.indexOf("/", ix) + 1;
		url = url.substring(0, ix);
		url += "executereport.do?__executableName=";


		if (!savedfile)
			var path = arfEd.layoutfile;
		else {
			// Get URL for saved version of file
			var path = arfEd.layoutfile.substr(arfEd.layoutfile.lastIndexOf("/"));
			path = homefolder + path;
		}

		url += path;

		var parms = arfEd.getParameters(null, null);
		for (var i=0; i < parms.length; i++) {
			url += "&" + parms[i].getName() + "=" + parms[i].getValue();
		}

		if (invokesubmit)
			url +="&invokeSubmit=true";

		return url;
	},

	// 2013-06-28 rewritten to work with FF
	// 2013-07-15 Rewritten to remove eval
	editComponent:function(o) {
		var prefix = arfEd.viewer.getId();
		var slot = o.target.slot;

		var text = $("#" + arfEd.viewer.getId() + "_" + slot + "Parms").text();
        if (text == null || text == "")
            text = $("#" + arfEd.viewer.getId() + "_" + slot + "AfterParms").text();
		var setparms = $.parseJSON(text);

		o = $("#" + contentmanager.viewer.getId() + "_parms_" + setparms.compname);
		var usedparms  = o.text();

		var componentDlg = new ComponentParameterDialog();
		componentDlg.initialise(slot, usedparms, setparms.parameters);
	},

	editComponentLayout:function(o) {
		var prefix = arfEd.viewer.getId();
		var slot = o.target.slot;

		var text = $("#" + arfEd.viewer.getId() + "_" + slot + "Parms").text();
        if (text == null || text == "")
            text = $("#" + arfEd.viewer.getId() + "_" + slot + "AfterParms").text();
		var meta = $.parseJSON(text);

		var layoutDlg = new ComponentLayoutDialog();
		layoutDlg.initialise(slot, meta.alignment, meta.width, meta.height);
	},

	saveDesign:function() {
		var rpt = arfEd.uiReportFolder + "savemode.rptdesign";
		var d = new arf.utilityrpt({title:i18n.btn_save, width:500, report:rpt, viewer:null});
		d.setExitCallback(arfEd.afterChooseSaveMode);

		d.setParmsLoadedCallback($.proxy(arfEd.saveDesignParmsLoaded, arfEd));
		d.showDialog(true);
	},

	saveDesignParmsLoaded:function(parms) {
		// Remove path and extension from layoutfile
		var fn = this.layoutfile;
		//fn = fn.substring(0, fn.lastIndexOf(".rptdesign"));
		fn = fn.substring(fn.lastIndexOf("/") + 1);
		parms[0].setDefaultValue(fn);
	},


	afterChooseSaveMode:function(outparms) {
		showWaiting(true, i18n.msg_savingdesign);
		arfEd.viewer.setReportName(arfEd.layoutfile);

		var parms = arfEd.getParameters("Detach", null);
		var p = new actuate.parameter.ParameterValue();
		p.setName("__SaveAs");
		var saveargs = "versioning=" + outparms[1].getValue(); //"replace" or "new"

		var afterwards = outparms[2].getValue();
		saveargs += ";afterwards=" + afterwards;

		saveargs += ";filename=" + outparms[0].getValue();
		p.setValue(saveargs);
		parms.push(p);

		arfEd.viewer.setParameterValues(parms);
		if (afterwards == "continue") {
		//???!!!!!NO WONT WORK!!! NEED
			arfEd.viewer.submit(arfEd.afterSaveContinue);
		} else if (afterwards == "switch") {
			arfEd.viewer.submit(arfEd.afterSaveSwitch);
		} else {
			// exit
			arfEd.viewer.submit(arfEd.afterSaveExit);
		}
	},

	afterSaveSwitch:function(o) {
		arfEd.forceDesignChange();
	},

	afterSaveContinue:function() {
		arfEd.loadTemplateReport();
	},

	afterSaveExit:function() {
		arfEd.saveSessionState("", null);
		window.location = "../dashboard";
	},

	deleteDesign:function() {
		var confirm = new arf.confirm({title:i18n.btn_deleterpt, msg:i18n.msg_deleterpt, exitcallback:arfEd.deleteDesignAfter});
		confirm.showDialog();
	},

	deleteDesignAfter:function(resp) {
		if (resp) {
			arfEd.hiddenviewer.setReportName(arfEd.uiReportFolder + "deletedesign.rptdesign");
			var p = new actuate.parameter.ParameterValue();
			p.setName("pMultiDesignFile");
			p.setValue(arfEd.layoutfile);
			var parms = new Array();
			parms.push(p);
			showWaiting(true, i18n.msg_deletingdesign);
			arfEd.hiddenviewer.setParameterValues(parms);
			arfEd.hiddenviewer.submit(arfEd.forceDesignChange);
		}
	},


	openDesign:function() {
		designchooser.showopen(true);
	},

	newDesign:function() {
		designchooser.shownew(true);
	},

	previewReport:function() {
		var query="__executableName=" + arfEd.layoutfile + "&__MODE=View";
		var rtp = arfEd.runtimeparms;
		if (rtp != null) {
			for (var i=0; i < rtp.length; i++) {
				query += "&" + rtp[i].getName() + "=" + rtp[i].getValue();
			}
		}
		query += "&invokeSubmit=true";
		window.open("../executereport.do?" + query);
	},

	goToPortal:function() {
		window.open("../dashboard");
	},

	logout:function() {
		document.location.href="landing.jsp?logout";
	},
	sessionTimeout:function(vwr, ex) {
		document.location.reload(true);
	}

}

//*************************************************************************************************************
var ComponentParameterDialog = actuate.Class.create();
ComponentParameterDialog.prototype = {
	parameters:null,
	parametervalues:null,
	parmdefs:null,
	usedparms:null,
	setparms:null,
	slotid:null,
	reportname:null,
	dialog:null,
	initialise:function(slot, usedparms, setparms) {

		this.usedparms = usedparms;
		this.setparms = setparms;
		this.slotid = slot;

		// Get section metadata
		var meta = arfEd.getSectionMeta();

		var template = meta.template;
		// Work out parameter file name
		if (template != null)
			this.reportname = applicationRoot + "/templates/_" + template + ".rptdesign";
		else // Use shared parameter template
			this.reportname = applicationRoot + "/templates/_parameters.rptdesign";

		if (usedparms.indexOf("pAnnotation;") == 0) {
			// This component has annotation

			var richTextDlg = new arf.RichTextEditorDialog({slotid:slot, layoutid:arfEd.layoutid});
			richTextDlg.setOKCallback($.proxy(this.beforeExecute, this));
			if (setparms.pAnnotation == undefined || setparms.pAnnotation == null)
				richTextDlg.showeditor("");
			else
				richTextDlg.showeditor(setparms.pAnnotation);
		} else {
			var d = new arf.utilityrpt({title:i18n.msg_componentSettings, width:350, report:this.reportname, viewer:arfEd.hiddenviewer});
			this.dialog = d;
			d.setExecutionCallback($.proxy(this.beforeExecute, this));
			d.setParmsLoadedCallback($.proxy(this.parmsLoaded, this));
			d.showDialog(true);
		}
	},

	parmsLoaded:function(parms) {
		this.parmdefs = parms;
		var usedparmarray = this.usedparms.split(";");
		this.dialog.multiSelectChildren  = new Array();
		// Go through parameters and hide those that are not applicable / visible
		for (var i=0; i < parms.length; i++) {
			// Is the parameter in the list of those recognised by this component
			// TODO - handle cascade
			var found = false;
			var j=-1;
			while (!found && ++j < usedparmarray.length) {
				if (parms[i].getName() == usedparmarray[j]) {
					// Found a match!
					found = true;
					var newval = this.setparms[parms[i].getName()];
					if (newval != undefined) {
						if (!parms[i].isMultiSelectControl()) {
							// Simply set the value
							parms[i].setDefaultValueIsNull(false);
							parms[i].setCurrentValue(newval);
							parms[i].setDefaultValue(newval);
						} else {
							// Defer setting until after any cascading has been done
							// Add parameter to array in dialog
							var multiparm = {"displayname": parms[i].getDisplayName(), "values":newval};
							this.dialog.multiSelectChildren.push(multiparm);
						}
					}
				}
			}
			if (!found) {
				// This parameter is not used by the component => don't show it
				parms[i].setIsHidden(true);
			}
		}
	},

	beforeExecute:function(parms) {
		//check for missing required parameters.
		// Assumes that the parametervalues array is in same order as parameterdefinitions array
		var missing = "";

		// Merge all of the set values into a single string
		var usedparmarray = this.usedparms.split(";");
		var combinedval = "";
		for (var i=0; i < parms.length; i++) {
			// Is the parameter in the list of those recognised by this component
			var found = false;
			var j=-1;

			while (!found && ++j < usedparmarray.length) {
				if (parms[i].getName() == usedparmarray[j]) {
					// Found a match
					if (!parms[i].getValueIsNull()) {
						// Don't save null values
						if (combinedval.length > 0)
							combinedval += ";";
						combinedval += parms[i].getName();
						combinedval += "=";
						var val = parms[i].getValue();
						val = val.replace(/\|/g, ",");
						combinedval += parms[i].getValue();
					}
					found = true;
				}
			}
		}

		if (missing == "") {
			showWaiting(true, "");
			var slotinfo = this.slotid.split("_");
			var cmd = "Component" + sep + "setprm" + sep + slotinfo[1] + sep + slotinfo[2] + sep + slotinfo[3] + sep + combinedval;
			arfEd.loadTemplateReport(cmd);

		} else
			$("urmessagebox").update(i18n.err_required_parms);
	},

	runcallback:function() {
		// component parameters updated. Now refresh the template
		arfEd.loadTemplateReport();
		//Windows.closeAll();
	}
}


//*************************************************************************************************************
var ComponentLayoutDialog = actuate.Class.create();
ComponentLayoutDialog.prototype = {
	alignment:null,
	width:null,
	height:null,
	slotid:null,
	dialog:null,
	initialise:function(slot, alignment, width, height) {

		this.alignment = alignment;
		this.slotid = slot;

		var d = new arf.LayoutDialog({slotid:slot, layoutid:arfEd.layoutid});
		d.setOKCallback($.proxy(this.onOK, this));
		d.showdlg(alignment, width, height);
	},
	onOK:function(layout) {
		var slotinfo = this.slotid.split("_");
		var cmd = "Component" + sep + "layout" + sep + slotinfo[1] + sep + slotinfo[2] + sep + slotinfo[3] + sep + layout[0] + sep + layout[1] + sep + layout[2];
		arfEd.loadTemplateReport(cmd);
	}
}
//*************************************************************************************************************
var DesignChooser = actuate.Class.create();
DesignChooser.prototype = {
	dlg:null,
	templateid:null,
	layoutfile:null,
	hiddenviewer:null,
	exitcallback:null,
	cancancel:true,

	initialize:function(args){
		this.hiddenviewer = args.viewer;
		this.exitcallback = args.exitcallback;
	},

	showDialog:function(cancancel) {
		this.cancancel = cancancel;
		this.dlg = new arf.utilityrpt({title:i18n.msg_designchooser, width:400, height:50, report:arfEd.uiReportFolder+ "choosemode.rptdesign", viewer:null});
		if (!cancancel) {
			this.dlg._cancelBtn.hide();
			this.dlg.setCancelCallback($.proxy(this.cancel, this));
		} else {
			this.dlg._cancelBtn.show();
			this.dlg.setCancelCallback(null);
		}
		this.dlg.setExitCallback($.proxy(this.ok, this));
		this.dlg.showDialog(true);
	},

	cancel:function() {
		designchooser.showDialog(designchooser.cancancel);
	},

	showopen:function(cancancel) {
		var d = new arf.utilityrpt({title:i18n.btn_open, width:350, height:50, report:arfEd.uiReportFolder+ "opendesign.rptdesign", viewer:this.hiddenviewer});
		d.setExitCallback($.proxy(this.afterChooseLayout,this));
		d.setParmsLoadedCallback($.proxy(this.setDefaultPicklistValue,this));
		if (!cancancel)
			d.setCancelCallback($.proxy(this.cancel, this)); // on cancel on child return to this dialog
		d.showDialog(true);
	},

	shownew:function(cancancel) {
		var d = new arf.utilityrpt({title:i18n.btn_new, width:400, height:120, report:arfEd.uiReportFolder+ "newdesign.rptdesign", viewer:this.hiddenviewer});
		d.setExitCallback($.proxy(this.afterNewLayout, this));
		d.setParmsLoadedCallback($.proxy(this.setDefaultPicklistValue, this));
		d.setExecutionCallback($.proxy(this.afterNewLayout, this));
		if (!cancancel)
			d.setCancelCallback($.proxy(this.cancel, this)); // on cancel on child return to this dialog
		d.showDialog(true);
	},

	ok:function(parms) {
		var mode = parms[0].getValue();
		if (mode == "new")
			this.shownew(false);
		else if (mode == "open")
			this.showopen(false);
		else if (mode == "exit")
			window.location = "../dashboard";
	},

	setDefaultPicklistValue:function(parms) {
		// Remove first blank row
		for (var i=0; i < parms.length; i++) {
			var pname = parms[i].getName().toLowerCase();
			if (pname == "ptemplatefile" || pname == "pdesignfile") {
				var valuelist = parms[i].getSelectNameValueList();
				var newvalues = new Array();
				var namevalues = new Array();
				if (valuelist != null)
					namevalues = valuelist.slice();
				for (var j=0; j < namevalues.length; j++) {
					if (namevalues[j].getValue() != "" || namevalues.length == 1) {
						newvalues.push(namevalues[j]);
					}
				}
			parms[i].setSelectNameValueList(newvalues);
			}
		}
	},

	afterNewLayout:function(parms) {
		showWaiting(true, i18n.msg_savingdesign);
		var templatefile = parms[0].getValue();
		var saveas = parms[1].getValue();
		if (!saveas.toLowerCase().indexOf(".rptdesign") != saveas.length - 10) {
			// Doesn't end with rptdesign
			saveas += ".rptdesign";
		}
		var ix = saveas.lastIndexOf("/");
		if (ix > -1)
			saveas = saveas.substring(ix);

		// Prefix with home folder - NB report always saves to homefolder regardless of saveas parameter
		this.layoutfile = arfEd.reportFolder  + saveas;

		var parms = new Array();
		var p = new actuate.parameter.ParameterValue();
		p.setName("__Mode");
		p.setValue("Unlock");
		parms.push(p);
		p = new actuate.parameter.ParameterValue();
		p.setName("__SaveAs");
		p.setValue("filename=" + this.layoutfile);
		parms.push(p);

		this.hiddenviewer.setReportName(templatefile);
		this.hiddenviewer.setParameterValues(parms);

		this.hiddenviewer.submit($.proxy(this.afterNewLayoutSaved, this));
	},

	afterNewLayoutSaved:function() {
		this.exitcallback(this.layoutfile);
	},

	afterChooseLayout:function(parms) {
		if ("failed" == parms) {
			// Failed to open layout
			var msg = "Failed to open design. Most likely it wasn't created with the framework.";
			var confirm = new arf.confirm({title:i18n.msg_error, msg:msg, exitcallback:designchooser.cancel, okonly:true, width:300});
			confirm.showDialog();
			return;
		}

		var layoutid = parms
		this.exitcallback(layoutid);
	}

}


//*************************************************************************************************************
var DTPChooser = actuate.Class.create();
DTPChooser.prototype = {

	templatedesign:null,
	exitcallback:null,

	initialize:function(args){
		this.exitcallback = args.exitcallback;
		this.templatedesign = args.layoutfile;
	},

	showDialog:function(cancancel) {

	var d = new arf.utilityrpt({title:i18n.msg_parms, width:450, height:350, report:this.templatedesign, viewer:null});
		d.setExecutionCallback($.proxy(this.afterChoose, this));
		d.setParmsLoadedCallback($.proxy(this.filterParms, this));

		d.showDialog(true);

	},

	afterChoose:function(parms) {
		var newparms = new Array();
		// Exclude framework parameters
		for (var i=0; i < parms.length; i++) {
			var pname = parms[i].getName().toLowerCase();
			if (pname != "__mode" && pname != "__saveas" && pname != "__structurechange") {
				var p = new actuate.parameter.ParameterValue();
				p.setName(parms[i].getName());
				p.setValue(parms[i].getValue());
				newparms.push(p);
			}
		}

		this.exitcallback(newparms);
	},

	filterParms:function(parms) {
		// Remove layout and mode parameters
		var i=0;
		var currentvals = arfEd.runtimeparms;
		if (currentvals == null)
			currentvals = new Array();
		while ( i< parms.length) {
			var pname = parms[i].getName().toLowerCase();
			if (pname == "__saveas" || pname == "__mode" || pname == "__structurechange" )
				parms.splice(i, 1);
			else {
			 	// Do we have a value for this ?
			 	for (var j=0; j < currentvals.length; j++) {
			 		if (currentvals[j].getName().toLowerCase() == pname) {
			 			parms[i].setDefaultValue(currentvals[j].getValue());
			 			break;
			 		}
			 	}
				i++;
			}
		}
	}
}

//*************************************************************************************************************
var TemplateContentManager = actuate.Class.create();
TemplateContentManager.prototype = {
	viewer: null,
	//dropOkay:false,
//	pageselector: null,
	defaultmasterpage:null,
	waitingforjsapi:false,
	listMode:"Components2",
	scrolloffset:0,
	initialize:function(){},
	initialise:function() {

		arfEd.debug("contentmanager.initialise");
		// Draw the Component bar refresh button & scroll area

		// Check whether it is already there....
		if ($("#btnDown").length == 0) {
			var mb = $("#leftbarouter");
			var btnToggle = mycreateElement("img", {id:'btncomplisttype', src:'images/check_1.png',title:i18n.btn_complistType, className:'menubutton', style:'position:relative;z-index:500;float:right;margin-top:10px;margin-right:10px'});
			//$(btnToggle).bind('click', contentmanager.toggleComplistMode); // This is bound later on - needs to be done every time
			$(mb).append(btnToggle);

			var btnRefresh = mycreateElement("img", {id:'btnrefreshcomplist', src:'images/refresh.png',title:i18n.btn_refreshlist, className:'menubutton', style:'position:relative;z-index:500;float:right;margin-top:10px;'});
			$(btnRefresh).bind('click', contentmanager.refreshCompList);
			$(mb).append(btnRefresh);


			var compbar = mycreateElement("div", {});//mycreateElement("div", {});
			var div1 = mycreateElement("div", {style:'width:220px;background-image:url(images/sidebartop.png);height:26px'});
			$(compbar).append(div1);
			btn = mycreateElement("img", {id:'btnDown', src:'images/up.png',title:i18n.msg_more, style:'cursor:pointer;margin-left:60px;margin-top:8px'});
			$(btn).bind('click', function(){contentmanager.scroll(-1)});
			$(div1).append(btn);
			btn = mycreateElement("img", {id:'btnDownSpacer', src:'images/spacer.png', style:'display:none'});
			$(div1).append(btn);

			var compbarheight = layouteditorheight - 52;
			div1 = mycreateElement("div", {id:"componentbar", style:"overflow:hidden;width:220px;height:" + compbarheight + "px;padding-top:1px"});

			$(compbar).append(div1);

			div1 = mycreateElement("div", {style:'width:220px;background-image:url(images/sidebarbottom.png);height:25px'});
			$(compbar).append(div1);
			btn = mycreateElement("img", {id:'btnUp', src:'images/down.png',title:i18n.msg_more, style:'cursor:pointer;margin-left:10px;margin-top:8px'});
			$(btn).bind('click', function(){contentmanager.scroll(1)});
			$(div1).append(btn);
			btn = mycreateElement("img", {id:'btnUpSpacer', src:'images/spacer.png', style:'display:none'});
			$(div1).append(btn);

			$(mb).append(compbar);

			this.viewer = new actuate.Viewer("templatecontentviewer");
			this.viewer.registerEventHandler(actuate.viewer.EventConstants.ON_EXCEPTION, contentmanager.errorHandler);
			this.viewer.registerEventHandler(actuate.viewer.EventConstants.ON_SESSION_TIMEOUT , arfEd.sessionTimeout);

		}
		$("#btncomplisttype").bind('click', contentmanager.toggleComplistMode);
		this.viewer.setReportName(arfEd.layoutfile);
		// Set parameter values
		var parms = arfEd.getParameters("Components2");//contentmanager.listMode);
		this.viewer.setParameterValues(parms);

		arfEd.debug("...load component report");
		showWaiting(true, i18n.msg_loading_components);
		contentmanager.waitingforjsapi = true;
		this.viewer.submit(contentmanager.loadComponentList);

	},

	toggleComplistMode:function() {
		var prefix = contentmanager.viewer.getId();


		var allthumbnails = $("#componentbar img");
		$("#btncomplisttype").unbind("click");


		var numthumbs= allthumbnails.length;
		arfEd.debug("...checking " + numthumbs+ " elements");


		for (var i=0; i < numthumbs; i++) {
			var obj = allthumbnails[i];
			var speed = 250+(i*40);
			if (obj == null)
				break;
			if (obj.id.indexOf("_thumbnail_") > -1) {
				if (i == numthumbs-1)
					$(obj).slideToggle(speed, contentmanager.afterToggle);
				else
					$(obj).slideToggle(speed);

			}
		}

		if (contentmanager.listMode == "Components1") {
			contentmanager.listMode = "Components2";
			$("#btncomplisttype").attr("src", "images/check_1.png");
		} else {
			contentmanager.listMode = "Components1";
			$("#btncomplisttype").attr("src", "images/check_0.png");
		}

	},

	afterToggle:function() {
		contentmanager.scroll(-contentmanager.scrolloffset);
		$("#btncomplisttype").bind('click', contentmanager.toggleComplistMode);
	},


	errorHandler:function(viewInstance, exception) {
		showWaiting(false);

		var msg = exception.getMessage();

		var msg = exception.getMessage();
		if (msg.indexOf("Cannot find the specified file or folder") > -1) {
			// Can't find design - most likely that the error will show up in the main window
			// So don't duplicate it here
			//msg = i18n.msg_lostdesign.replace("%1", arfEd.layoutfile);
			//var confirm = new arf.confirm({title:i18n.msg_error, msg:msg, exitcallback:arfEd.forceDesignChange, okonly:true, width:300});
			//confirm.showDialog();
		} else {
			var confirm = new arf.confirm({title:i18n.msg_error, msg:msg, exitcallback:arfEd.forceDesignChange, okonly:true, width:300});
			confirm.showDialog();
		}


	},

	loadComponentList:function() {

		arfEd.debug("contentmanager.loadComponentList");
		var start = (new Date()).getTime();

		var prefix = contentmanager.viewer.getId();

		var alltables = $("#" + prefix + "_componentgrid table");

		var numtables = alltables.length;
		arfEd.debug("...checking " + numtables + " elements");

		for (var i=0; i < numtables; i++) {
			var obj = alltables[i];
			if (obj == null)
				break;
			if (obj.id.indexOf("_draggable_") > -1) {
				var AP = new arf.Draggable({objid:obj.id, type:'component'});
				obj.id = obj.id.substring(14);
//				var o = $("#componentbar");

				$("#componentbar").append(obj);
				 obj.style.width="200px";
				$(obj).addClass('drag1');

				arfEd.debug("..." + obj.id);
			}
		}
		draghandler.addListener(contentmanager);

		// Prevent IE from dragging image independently of component
		$("#componentbar img").mousedown(function(e){e.preventDefault();});
		$("#componentbar img").mousemove(function(e){e.preventDefault();});

		// Get library metadata
		var libmeta_lbl = $("#" + prefix + "_libmeta_lbl");
		var libmeta = jQuery.parseJSON(libmeta_lbl.text());
		var mpages = libmeta.masterpages;

		contentmanager.resetMasterPageList();
		for(var i=0; i < mpages.length; i++) {
			contentmanager.addMasterPage(mpages[i].localname, mpages[i].masterpage);
		}
		contentmanager.setMasterPageSelection(arfEd.currentMasterPage);

		// Get themes
		var themes = libmeta.themes;
		contentmanager.resetThemeList();
		for(var i=0; i < themes.length; i++) {
			contentmanager.addTheme(themes[i].localname, themes[i].theme);
		}
		contentmanager.setThemeSelection(arfEd.currentTheme);

		// Get version
		var ver = libmeta.version;
		$("#btnhelp").attr("title", "Author: " + ver.author + "\nBuild: " + ver.version + "\nDate: " + ver.timestamp);

		var end = (new Date()).getTime();
		arfEd.debug("...timer" + (end-start));

		// Initialise scroll buttons
		contentmanager.scroll(0);

		//this.viewer = null;

		contentmanager.waitingforjsapi= false;

		if (!arfEd.waitingforjsapi)
			showWaiting(false);
	},

	refreshCompList:function() {
		$("#btncomplisttype").unbind("click");
		showWaiting(true, i18n.msg_loading_components);
		contentmanager.scrolloffset = 0;
		//TODO - fix this - it removes all the in place components too!!!!
		draghandler.removeAllDraggables("component");

		contentmanager.initialise();
	},

	scroll:function (dirn) {
		var dy = -200 * dirn;
		contentmanager.scrolloffset += dirn;
		var components = draghandler.draggableitems;//Draggables.drags;
		var showup = false;
		var showdown = false;

		for (var i=0; i < components.length; i++) {
			var comp =components[i].obj;// .element;

			var o = $(comp);
			var newy = o.position().top + dy;

			if (newy < 20) //default top=21 pix
				showdown = true;
			else if (newy > layouteditorheight - (21 + o.height())) {
				// Height -20 offset -80 for height of a draggable
				showup = true;
			}

			animator.moveElement(comp, 0, dy, 0.5);
		}

		contentmanager.showscrollbuttons(showup,showdown);

	},

	showscrollbuttons:function(showup,showdown) {

		if (showup) {
			$('#btnUpSpacer').hide();
			$('#btnUp').fadeIn();//show();
		}
		else {
			$('#btnUpSpacer').show();
			$('#btnUp').fadeOut();//hide();
		}

		if (showdown) {
			$('#btnDownSpacer').hide();
			$('#btnDown').fadeIn();//show();
		}
		else {
			$('#btnDownSpacer').show();

			$('#btnDown').fadeOut();//hide();
		}
	},

	addMasterPage:function(localname, pagename) {
		var pageselector = $("select#pageselector");
		if (pageselector.length == 0) {
			$("#pageselectordiv").append($("<select></select>").attr("id", "pageselector").attr("title", i18n.msg_selectMasterPage));
			pageselector = $("select#pageselector");

			pageselector.bind('change', arfEd.changeMasterPage);
			contentmanager.defaultmasterpage = pagename;
		}
		pageselector.append($("<option></option>").attr("value", pagename).text(localname));

		if (arfEd.islocked) {
			pageselector.attr("disabled", "true");
		}
	},


	resetMasterPageList:function() {
		$("select#pageselector > option").remove();
	},

	setMasterPageSelection:function(pagename) {
		if (null == pagename)
			return;
		$("select#pageselector").val(pagename);
	},

	addTheme:function(localname, themename) {
		var themeselector = $("select#themeselector");
		if (themeselector.length == 0) {
			$("#themeselectordiv").append($("<select></select>").attr("id", "themeselector").attr("title", i18n.msg_selectTheme));
			themeselector = $("select#themeselector");
			themeselector.bind('change', arfEd.changeTheme);
		}
		themeselector.append($("<option></option>").attr("value", themename).text(localname));

		if (arfEd.islocked) {
			themeselector.attr("disabled", "true");
		}
	},

	setThemeSelection:function(themename) {
		if (null == themename)
			return;
		$("select#themeselector").val(themename);

		if ($("select#themeselector option").length < 2) {
			// 0 or 1 themes - no point offering selection
			$("select#themeselector").hide();
		} else
			$("select#themeselector").show();
	},
	resetThemeList:function() {
		$("select#themeselector > option").remove();
	}

}

//*************************************************************************************************************

$(document).ready(initialise);

function initialise() {
	// Prevent selection on float panel drag
	document.onselectstart = function () { return false; }

	arfEd = new ArfEditor();
	arfEd.initialise();

}
