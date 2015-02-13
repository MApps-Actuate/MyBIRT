function createArfDialogs() {

	actuate.util.Package.define("arf");
	arf.consumer = actuate.Class.create();
	arf.consumer.prototype=actuate.Class.extend(new actuate.common.DialogConsumer(), {
		getHelpBase:function() {
			return "http://localhost/TEST";
		}
	});

	actuate.util.Package.define("arf");
	arf.utilityrpt=actuate.Class.create();
	arf.utilityrpt.superclass=actuate.iv.ui.dialog.AbstractIVDialog.prototype;
	arf.utilityrpt.prototype=actuate.Class.extend(
		new actuate.iv.ui.dialog.AbstractIVDialog(), {
		_classname:"arf.utilityrpt",
		_title:null,
		_width:null,
		_height:null,
		reportname:null,
		hiddenviewer:null,
		parmsloadedcallback:null,
		parameters:null,
		parmdefs:null,
		executioncallback:null,
		exitcallback:null,
		cancelcallback:null,
		parmfields:null,
		showhidden:false,
		hasAutoAdjustSize:false,
		parentParameters:null, // used for cascading
		multiSelectChildren:null,	// used for cascading
		initialLoad:true,		// used for cascading

		initialize:function(args){
			this._title=args.title;
			this._width = args.width + 20;
			var targetdiv = document.getElementById("arf_utilityrpt_content");
			targetdiv.innerHTML = "";
			targetdiv.style.width=args.width + "px";
			this.reportname = args.report;
			this.hiddenviewer = args.viewer;
			this.initialLoad = true;
			var id=this._getId(this._classname);
			this._consumer = new arf.consumer();
			actuate.iv.ui.dialog.AbstractIVDialog.prototype.initialize.call(this,id);
			//this._helpBtn.hide();
		},

		_preShow:function() {
			this.parameters = new actuate.Parameter("arf_utilityrpt_content");
			this.parameters.registerEventHandler(actuate.parameter.EventConstants.ON_EXCEPTION, $.proxy(this.exception, this));
			this.parameters.registerEventHandler(actuate.parameter.EventConstants.ON_CHANGE_COMPLETED, $.proxy(this.onChangeCompleted, this));
			this.parameters.setReportName(this.reportname);
			this.parameters.downloadParameters($.proxy(this.parmsLoaded, this));
		},

		exception:function(ex) {
			alert(ex);
		},

		onChangeCompleted:function(o) {
			if (this.parentParameters != null && this.parentParameters.length > 0) {
				console.log("afterRender:" + this.parentParameters.length);
				var parentparm = this.parentParameters.shift();
				var paramDisplayName = parentparm.getDisplayName();
				// Iterate over all parameters in the dialog
				$("tr.paramRow td").each(function(ix, el) {
					// Does this parameter display name match the parent we look for?
					if (el.innerText == paramDisplayName) {
						// Yes - get the corresponding selector element & fire change event
						var selector = $(el).next().children("select")[0];
						fireEvent(selector, "change");
						return false; //break the loop
					}
				});
			} else {
				// Handle any multiselects
				if (this.multiSelectChildren != null) {
					while (this.multiSelectChildren.length > 0) {
						var parm = this.multiSelectChildren.shift();
						var displayName = parm.displayname;
						var values = parm.values;

						$("tr.paramRow td").each(function(ix, el) {
							// Does this parameter display name match the parent we look for?
							if (el.innerText == displayName) {

								// Yes - get the corresponding selector element & fire change event
								var selector = $(el).next().children("select")[0];
								var valarr = values.split("|");

								for (var ix = 0; ix < valarr.length; ix++) {
									var newval = valarr[ix].replace(/\'/g, "");
									//$(selector).val(newval);
									$(selector).children("option").each(function(ix, el) {

										if (newval == el.value) {
											el.selected = true;
											return false;
										}
									});
								}
								return false; //break the loop
							}
						});
					}
				}

				if (this.initialLoad) {
					this.initialLoad = false;
					this.afterRender();
				}
			}
		},

		setParmsLoadedCallback:function(callback) {
			this.parmsloadedcallback = callback;
		},

		setExecutionCallback:function(callback) {
			this.executioncallback = callback;
		},

		setExitCallback:function(callback) {
			this.exitcallback = callback;
		},

		setCancelCallback:function(callback) {
			this.cancelcallback = callback;
		},

		parmsLoaded:function(parmdefs) {
			this.parmdefs = parmdefs;

			if (this.parmsloadedcallback != null)
				this.parmsloadedcallback(parmdefs);

			//var o = document.getElementById("arf_utilityrpt_content");


			// Check if any of the parameters are cascading => we need to fire cascade event
			this.parentParameters = new Array();
			for (var i=0; i < parmdefs.length; i++) {
				var parentname = parmdefs[i].getCascadingParentName();
				if (parentname != null && parentname != "") {
					// Get the display name for this parameter - used to find the element in which it is rendered
					for (j=0; j < parmdefs.length; j++) {
						if (parmdefs[j].getName() == parentname) {
							this.parentParameters.push(parmdefs[j]);
							break;
						}
					}
				}
			}

			this.parameters.renderContent(parmdefs, $.proxy(this.afterRender, this));

		},

		afterRender:function() {
			if (this.parentParameters != null && this.parentParameters.length > 0) {
				this.onChangeCompleted(null);
				return;
			}

			// Insert an extra column in all rows for required marker
				var o = $(".paramTable tr");
				o.append("<td style='color:red'></td>");

				o = $(".paramTable .paramDisplayName");
				o.removeClass("paramDisplayName");

				o.each(function(ix, el) {
					if (el.innerHTML == "BLANK") {
						var labelcell = $(el).parent();

						el.innerHTML = "";
					}

				});


				// Fix "Required" highlight from ugly red border
				var numRequired = 0;

				// Case where <td> has the style
				o = $("td.highlightRequiredParameters");
				numRequired += o.length;
				o.next().html("&nbsp*");
				o.removeClass("highlightRequiredParameters");

				// Case where contents of <td> have the style
				o = $("input.highlightRequiredParameters, fieldset.highlightRequiredParameters");
				numRequired += o.length;
				o.parent().next().html("&nbsp;*");
				o.removeClass("highlightRequiredParameters");

				// Case where fieldset has style
				//o = $("fieldset.highlightRequiredParameters");
				//numRequired += o.length;
				//o.parent().next().html("&nbsp;*");
				//o.removeClass("highlightRequiredParameters");

				// Draw radio boxes inline instead of in rows
				$(".paramTable .radio").parent().css("display", "inline").css("margin-left", "10px");

				// Remove paramCommon and controlRadioButton
				// These hardcode the <td> to 50%
				$(".paramCommon").removeClass("paramCommon");
				$(".controlRadioButton").removeClass("controlRadioButton");
				$(".controlCheckBox").removeClass("controlCheckBox");
				$(".controlList").removeClass("controlList");
				$(".controlListAllowNew").removeClass("controlListAllowNew");
//				$(".paramAdHoc").removeClass("paramAdHoc");

				// Add placeholder for error message
				if (numRequired > 0)
					$("#arf_utilityrpt_content").append("<div style='color:red;height:15px'>* " + i18n.msg_required + "</div>");

                if ($("#arf_utilityrpt_content #urmessagebox").length == 0)
				    $("#arf_utilityrpt_content").append("<div id='urmessagebox' style='color:red;height:15px;text-align:center'/>");

				this._fixDropShadow();

		},
/*
		_okPress:function(){
			// Gather parameter settings
			this.parametervalues = new Array(this.parmfields.length);
			for (var i=0; i < this.parmfields.length; i++) {
				var pv = new actuate.parameter.ParameterValue();
				pv.setName(this.parmdefs[i].getName());
				if (this.parmdefs[i].getControlType() == "ControlRadioButton")
					pv.setValue(this.parmfields[i].getGroupValue());
				else if (this.parmdefs[i].getControlType() == "ControlListAllowNew")
					pv.setValue(this.parmfields[i].getInputValue());
				else if (this.parmdefs[i].getControlType() == "ControlCheckBox") {
					var checked = this.parmfields[i].getValue();
					if (checked)
						pv.setValue("true");
						else
						pv.setValue("false");
				} else if (this.parmdefs[i].isMultiSelectControl()) {
					pv.setValue(this.parmfields[i].getSelectedValues());
				} else {
					//ADNP 2012-12-11 TEST DATE FIELDS
					var v = this.parmfields[i].getValue();
					if (this.parmdefs[i].getDataType() == 'DateOnly') {
						v = v.getFullYear() + "-" + (v.getMonth()+1) + "-" + v.getDate();
					}
					pv.setValue(v);
					//Previous
					//pv.setValue(this.parmfields[i].getValue());
				}
				this.parametervalues[i] = pv;
			}
			this.paramscallback(this.parametervalues);
		},
*/
		_okPress:function() {
			this.parameters.downloadParameterValues($.proxy(this.paramscallback, this));
	},

		paramscallback:function(parms) {

			//check for missing required parameters.
			// Assumes that the parametervalues array is in same order as parameterdefinitions array
			var missing = "";
			for (var i=0; i < parms.length; i++) {
				if (this.parmdefs[i].isRequired() && !this.parmdefs[i].isHidden()) {
					if (parms[i].getValue() == null || parms[i].getValue() == "") {
						missing += parms[i].getName() + "<br>";
					}
				}
			}

			if (missing == "") {
				this.parametervalues = parms;

				if (this.executioncallback == null) {
					if (this.hiddenviewer != null) {
						// Default action - run the report using the hidden viewer
						this.hiddenviewer.setReportName(this.reportname);
						this.hiddenviewer.setParameterValues(this.parametervalues);
						//$("urmessagebox").update("Running report...");
						showWaiting(true, "");
						//this.hiddenviewer.submit(function(){this.runcallback()}.bind(this));
						this.hiddenviewer.submit($.proxy(this.runcallback,this));
					} else {
						// No viewer and no execution callback - go straight to exit
						this._hide();
						this.exitcallback(parms);
					}
				} else {
					this._hide();
					this.executioncallback(parms);
				}
			} else {
				document.getElementById("urmessagebox").innerHTML = i18n.err_required_parms;
			}
		},

		runcallback:function() {
			showWaiting(false);
			this._hide();
			var outputText = this.hiddenviewer.getText("output");
			var output = null;
			if (outputText != null)
				output = outputText.getText();
			this.exitcallback(output);
		},

		_cancelPress:function(){
			this.parametervalues = null;
			this._hide();
			if (this.cancelcallback != null)
				this.cancelcallback();
		},

		__getHelpTopic:function(){
			var id=this._getId(this._classname);
			alert("Help: " + id);
			return "myhelp";
		},

	});
//*************************************************************************************************************

	actuate.util.Package.define("arf");
	arf.waiting=actuate.Class.create();
	arf.waiting.superclass=actuate.iv.ui.dialog.AbstractIVDialog.prototype;
	arf.waiting.prototype=actuate.Class.extend(
		new actuate.iv.ui.dialog.AbstractIVDialog(), {
		_classname:"arf.waiting",
		_title:i18n.msg_wait,
		_width:200,
		_height:140,
		hasCancelButton:false,
		hasHelpButton:false,
		hasFooter:false,
		isResizable:true,
		hasAutoAdjustSize:false,

		initialize:function(args){
			var id=this._getId(this._classname);
			this._consumer = new arf.consumer();
			actuate.iv.ui.dialog.AbstractIVDialog.prototype.initialize.call(this,id);
			//this._okBtn.hide();
		},

		_cancelPress:function() {
			//Cancel does nothing
			this._show();
		},

		setMessage:function(msg) {
			document.getElementById("arf_waiting_msg").innerHTML = msg;//update(msg);
			this._fixDropShadow();
		}
	});
//*************************************************************************************************************

	actuate.util.Package.define("arf");
	arf.confirm=actuate.Class.create();
	arf.confirm.superclass=actuate.iv.ui.dialog.AbstractIVDialog.prototype;
	arf.confirm.prototype=actuate.Class.extend(
		new actuate.iv.ui.dialog.AbstractIVDialog(), {
		_classname:"arf.confirm",
		_title:i18n.msg_confirm,
		_width:250,
		_height:150,
		hasHelpButton:false,
		hasAutoAdjustSize:false,
		exitcallback:null,
		hasCancelButton:true,

		initialize:function(args){
			this._title = args.title;
			this._width = args.width;
			this.exitcallback = args.exitcallback;
			var msg = args.msg;
			if (args.okonly == true)
				this.hasCancelButton = false;
			document.getElementById("arf_confirm_msg").innerHTML = msg;//update(msg);
			var id=this._getId(this._classname);
			this._consumer = new arf.consumer();
			actuate.iv.ui.dialog.AbstractIVDialog.prototype.initialize.call(this,id);
		},

		_cancelPress:function() {
			this.exitcallback(false);
		},

		_okPress:function() {
			this._hide();
			this.exitcallback(true);
		}
	});

//*************************************************************************************************************
	actuate.util.Package.define("arf");
	arf.showlink=actuate.Class.create();
	arf.showlink.superclass=actuate.iv.ui.dialog.AbstractIVDialog.prototype;
	arf.showlink.prototype=actuate.Class.extend(
		new actuate.iv.ui.dialog.AbstractIVDialog(), {
		_classname:"arf.showlink",
		_title:i18n.msg_reportLink,
		_width:470,
		_height:200,
		hasHelpButton:false,
		hasAutoAdjustSize:false,
		hasCancelButton:false,
		exitcallback:null,

		initialize:function(args){
			var url = args.url;
			var msg = args.msg;
			this._title = args.title;
			this.exitcallback = args.exitcallback;
			var textstyle={
				cls:actuate.iv.constant.CSS_INPUTBOX,
				readOnly:false,
				selectOnFocus:false,
				width:400,
				height:80
			};

			$("arf_showlink_url").update("");
			$("arf_showlink_msg").update(msg);

			var text = new actuate.widget.form.TextArea(textstyle);
			text.setValue(url);
			text.render(document.getElementById("arf_showlink_url"));
			var id = this._getId(this._classname);
			this._consumer = new arf.consumer();
			actuate.iv.ui.dialog.AbstractIVDialog.prototype.initialize.call(this,id);
		},

		_okPress:function() {
			this._hide();
			if (this.exitcallback != null)
				this.exitcallback();
		}
	});
//*************************************************************************************************************

	actuate.util.Package.define("arf");
	arf.helpwin=actuate.Class.create();
	arf.helpwin.superclass=actuate.iv.ui.dialog.AbstractIVDialog.prototype;
	arf.helpwin.prototype=actuate.Class.extend(
		new actuate.iv.ui.dialog.AbstractIVDialog(), {
		_classname:"arf.helpwin",
		_title:i18n.btn_help,
		_width:700,
		_height:550,
		isResizable:true,
		hasHelpButton:false,
		hasAutoAdjustSize:false,
		hasCancelButton:false,

		initialize:function(args){
			var id = this._getId(this._classname);
			this._consumer = new arf.consumer();
			actuate.iv.ui.dialog.AbstractIVDialog.prototype.initialize.call(this,id);
		},

		_okPress:function() {
			this._hide();
		},

		loadpage:function(page) {
			//CHANGEME - localise the help
			var ix = page.lastIndexOf(".");
			page = "help/" + page.substr(0, ix) + "_" + i18n.code + page.substring(ix);

			var ifr = document.getElementById("arf_helpwin_content");
			ifr.src=page;
			this._show();
		}
	});

//*************************************************************************************************************

	actuate.util.Package.define("arf");
	arf.RichTextEditorDialog=actuate.Class.create();
	arf.RichTextEditorDialog.superclass=actuate.iv.ui.dialog.AbstractIVDialog.prototype;
	arf.RichTextEditorDialog.prototype=actuate.Class.extend(
		new actuate.iv.ui.dialog.AbstractIVDialog(), {
		_classname:"arf.rteditor",
		_title:i18n.msg_annotationeditor,
		_width:750,
		_height:350,
		isResizable:false,
		hasHelpButton:false,
		hasAutoAdjustSize:false,
		hasCancelButton:true,
		initialtext:null,
		okCallback:null,
		slotid:null,
		layoutid:null,

		initialize:function(args){
			this.slotid = args.slotid;
			this.layoutid = args.layoutid;

			var id = this._getId(this._classname);
			this._consumer = new arf.consumer();
			actuate.iv.ui.dialog.AbstractIVDialog.prototype.initialize.call(this,id);

			// Allow select
			document.onselectstart = null;
		},

		setOKCallback:function(callback) {
			this.okCallback = callback;
		},


		_okPress:function(a, b, c) {
			// Prevent select once more
			document.onselectstart = function () { return false; }

			var rteditor = nicEditors.findEditor('arf_rteditor_content');
			var newtext = rteditor.getContent();
			newtext = escape(newtext);
			this._hide();
			var parms = new Array();

			var p3 = new actuate.parameter.ParameterValue();
			p3.setName("pAnnotation");
			p3.setValue(newtext);
			parms.push(p3);

			this.okCallback(parms);
		},

		_enter_key:function(obj, e) {
			if (e.keyCode == 13) {
				// User pressed ENTER - ignore, we want them to be able to carry on typing
				// This overrides the default functionality where ENTER triggers okPress.
				return;
				}
		},

		_cancelPress:function() {
			// Prevent select once more
			document.onselectstart = function () { return false; }
			this._hide();
		},

		showeditor:function(initialtext) {
			this._show();
			this.initialtext = unescape(initialtext);

			var rteditor = nicEditors.findEditor('arf_rteditor_content');
			if (rteditor == null) {
				new nicEditor({fullPanel:true,iconsPath:'images/nicEditorIcons.gif'}).panelInstance('arf_rteditor_content',{hasPanel : true});
				rteditor = nicEditors.findEditor('arf_rteditor_content');
			}
			rteditor.setContent(this.initialtext);
			rteditor.elm.focus();

			this._fixDropShadow();

		}
	});


//*************************************************************************************************************

	actuate.util.Package.define("arf");
	arf.LayoutDialog=actuate.Class.create();
	arf.LayoutDialog.superclass=actuate.iv.ui.dialog.AbstractIVDialog.prototype;
	arf.LayoutDialog.prototype=actuate.Class.extend(
		new actuate.iv.ui.dialog.AbstractIVDialog(), {
		_classname:"arf.layoutdlg",
		_title:i18n.msg_layout,
		_width:250,
		_height:200,
		isResizable:false,
		hasHelpButton:false,
		hasAutoAdjustSize:false,
		hasCancelButton:true,
		initialtext:null,
		okCallback:null,
		slotid:null,
		layoutid:null,

		initialize:function(args){
			this.slotid = args.slotid;
			this.layoutid = args.layoutid;

			var id = this._getId(this._classname);
			this._consumer = new arf.consumer();
			actuate.iv.ui.dialog.AbstractIVDialog.prototype.initialize.call(this,id);


		},

		chooseAlign:function(evt) {
			var id = evt.currentTarget.id;
			$(".alignment_button").css("backgroundColor", "");
			$(".selected_alignment").removeClass("selected_alignment");
			$(evt.currentTarget).addClass("selected_alignment");//.css("backgroundColor", "yellow");
		},

		setOKCallback:function(callback) {
			this.okCallback = callback;
		},


		_okPress:function() {

			this._hide();

			var o=$(".selected_alignment");
			var alignment = "";
			if (o.length > 0)
				alignment = o[0].id.substring(6);

			var width = $("#arf_layoutdlg_widthselect").val();
			var height = $("#arf_layoutdlg_heightselect").val();
			var layout = [alignment, width, height];
			this.okCallback(layout);
		},

		showdlg:function(alignment, width, height) {

			// Alignment
			$("#arf_layoutdlg_alignmentlabel").text(i18n.msg_alignment);

			var rows = ["T", "M", "B"];
			var cols = ["F", "L", "C", "R"];

			var table = $("<table></table");
			for (var i=0; i < rows.length; i++) {
				var row = $("<tr></tr>");
				for (var j=0; j < cols.length; j++) {
					var cell = $("<td></td>").addClass("alignment_button").attr("id", "align_" + rows[i] + cols[j]);
					cell.html("<img src=\"images/layout_" + rows[i] + cols[j] + ".png\"/>");
					row.append(cell);
				}
				table.append(row);
			}
			$("#arf_layoutdlg_alignmenttable").empty().append(table);//html(s);

			$(".alignment_button").unbind().bind('click', $.proxy(this.chooseAlign,this)) ;


			if (alignment == null || alignment == "null")
				alignment = "TF";

			$(".selected_alignment").removeClass("selected_alignment");
			this._show();
			var el = $("#align_" + alignment);
			if (el.length > 0)
				el.addClass("selected_alignment");

			// Width
			$("#arf_layoutdlg_widthlabel").text(i18n.msg_layoutwidth);
			var sel = $("#arf_layoutdlg_widthselect");
			sel.empty();//.append($("<option>", {value:0, text:i18n.msg_layoutdefault}));
			for (var i=1; i <= arfEd.numcolumns ; i++)
				sel.append($("<option>", {value:i, text:i}));

			sel.val(width);

			// Height
			$("#arf_layoutdlg_heightlabel").text(i18n.msg_layoutheight);
			sel = $("#arf_layoutdlg_heightselect");
			sel.empty();//.append($("<option>", {value:0, text:i18n.msg_layoutdefault}));
			for (var i=1; i < 6; i++)
				sel.append($("<option>", {value:i, text:i}));

			sel.val(height);

			// default
			$("#arf_layoutdlg_defaultbtn").attr("value",i18n.btn_defaultAll);
			$("#arf_layoutdlg_defaultbtn").addClass("actuate-widget-btn");
			$("#arf_layoutdlg_defaultbtn").unbind().bind('click', $.proxy(this.resetToDefault,this)) ;

			this._fixDropShadow();
		},
		resetToDefault:function() {
			this._hide();
			var layout = ["TF", 0, 0];
			this.okCallback(layout);
		}
	});


//*************************************************************************************************************
}
		function fireEvent(element,event){
			if (document.createEventObject){
				//IE
				var evt = document.createEventObject();
				return element.fireEvent('on'+event,evt)
			}
			else{
				//otherwise
				var evt = document.createEvent("HTMLEvents");
				evt.initEvent(event, true, true );
				return !element.dispatchEvent(evt);
			}
		}