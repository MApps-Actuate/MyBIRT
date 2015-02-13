<%@ page contentType="text/html; charset=utf-8"%>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=windows-1252">
		<script type="text/javascript" src="<%=request.getContextPath()%>/jsapi"></script>

		<script type="text/javascript" src="../iv/jquery/jquery.js"></script> 
		<script type="text/javascript" src="../iv/html5charts/html5charts.js"></script>

		<script type="text/javascript" src="i18n.jsp"></script>
		<link rel="stylesheet" type="text/css" href="css/arf.css"/>
		<script type="text/javascript" src="shared.js"></script>
		<script type="text/javascript" src="arfdialog.js"></script>
		<script defer="defer" type="text/javascript" src="layouteditor.js"></script>
		<script defer="defer" type="text/javascript" src="nicEdit.js"></script>
		<script>

<%
		// Get userinfobean
		com.actuate.reportcast.utils.AcRequestHandlerBean requestHandlerBean = new  com.actuate.reportcast.utils.AcRequestHandlerBean();
		requestHandlerBean.setRequest(request);
		com.actuate.activeportal.beans.UserInfoBean userinfobean = requestHandlerBean.getUserInfoBeanFromSession();
		String homefolder = userinfobean.getHomefolder();

		// Read args from URL
		String width = request.getParameter("w") == null ? "1000" : request.getParameter("w");
		String height = request.getParameter("h") == null ? "-1" : request.getParameter("h");
		boolean resetcookies = request.getParameter("start") == null ? false : true;
%>			var layouteditorwidth = <%=width%>;
			var layouteditorheight = (<%=height%>==-1 ? document.documentElement.clientHeight - 100 : <%=height%>);;
			var resetcookies = <%=resetcookies%>;
			var homefolder = "<%=homefolder%>";			
		</script>
	</head>
	<%--<body style="-webkit-user-select: none;user-select: none;-moz-user-select: none">--%>
	<body style="-moz-user-select: none">
		<input type='hidden' id='serverurl' value="<%=session.getServletContext().getInitParameter("SERVER_DEFAULT")%>"/>
		<input type='hidden' id='volume' value="<%=session.getServletContext().getInitParameter("DEFAULT_VOLUME")%>"/>
		<table id="topcontainer" cellpadding="0" cellspacing = "3" align="center" valign="middle" style="display:none">
			<tr valign="top">
				<td >
					<table border="0" cellspacing="0" cellpadding="0" style="width:220px">
						<tr valign="middle">
							<td class="panel topbar" style="border-right:none">
								<div><strong>&nbsp;</strong></div>
							</td>
							<td class="panel topbar" align="left" style="padding-right:10px;border-left:none">
								<table cellspacing="0" cellpadding="0" border="0" style="paddingRight:10px">
									<tr id="leftbuttonbar"></tr>
								</table>
							</td>
						</tr>
						<tr valign="top">
							<td class="panel" align='center' id='leftbarouter' colspan="2" >
							</td>
						</tr>
					</table>
				</td>
				<td>
					<div id="mainmiddle">
					<table border="0" cellspacing="0" cellpadding="0"  >
						<tr>
							<td class="panel topbar" >
								<table cellspacing="0" cellpadding="0" border="0" width="100%" >
									<tr><td>
										<table cellspacing="0" cellpadding="0" border="0" >
											<tr id="buttonbar"></tr>
										</table>
									<td style="padding-right:5px;text-align:right"><div id="txtfilename"/></td>
									</td>
									</tr>
								</table>
									
							</td>
						</tr>
						<tr>
							<td><div id="hiddenviewer" style="display:none"></div><div id="templatecontentviewer" style="display:none"></div></td>
						</tr>
						<tr>
							<td>
								<table cellspacing="0" cellpadding="0">
								<tr>
									<td><div  style='height:12px;width:12px;background-image:url(images/9box/tl.png)'/></td>
									<td style="background-image:url(images/9box/t.png)"></td>
									<td><div  style='height:12px;width:12px;background-image:url(images/9box/tr.png)'/></td>
								</tr>
								<tr>
									<td style="background-image:url(images/9box/l.png)"></td>
									<td><div id="mainviewer" style="position:relative" align="left"></div></td>
									<td style="background-image:url(images/9box/r.png)"></td>
								</tr>
								<tr>
									<td><div  style='height:12px;width:12px;background-image:url(images/9box/bl.png)'/></td>
									<td style="background-image:url(images/9box/b.png)"></td>
									<td><div  style='height:12px;width:12px;background-image:url(images/9box/br.png)'/></td>
								</tr>
								</table>
								
							</td>
						</tr>
					</table>
					</div>
				</td>
				<td class="panel" id="consolepanel" style="display:none">
					<table border="0" cellspacing="0" cellpadding="0">
						<tr>
							<td>

								<div id="console" style="overflow:scroll;width:300px;margin-left:30px"></div>
							</td>
						</tr>
						<tr>
							<td >
								<input type="button" value='Clear' onClick='arfEd.wipeDebug()' style="margin-left:30px"/>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
<%-- Fragments for dialog boxes --%>
		<div style='display:none'>
			<div class="dialogContainerRoot actuate_shared_resource actuate_shared_resource_global" id="arf_confirm">
				<center>
					<div id='arf_confirm_msg'>Message...</div>
				</center>
			</div>
			<div class="dialogContainerRoot actuate_shared_resource actuate_shared_resource_global" id="arf_utilityrpt">
				<div id="arf_utilityrpt_content"></div>
			</div>
			<div class="dialogContainerRoot actuate_shared_resource actuate_shared_resource_global" id="arf_waiting">
				<center>
					<div id='arf_waiting_msg'>Message...</div>
					<br>
					<img src="images/ajax-loader.gif">
				</center>
			</div>
			<div class="dialogContainerRoot actuate_shared_resource actuate_shared_resource_global" id="arf_showlink">
				<center>
					<div id='arf_showlink_url'></div>
					<div id='arf_showlink_msg'></div>
					<div></div>
				</center>
			</div>
			<div class="dialogContainerRoot actuate_shared_resource actuate_shared_resource_global" id="arf_helpwin">
				<center>
					<iframe style='width:100%;height:500px;' frameborder='0' scrolling='no' id='arf_helpwin_content'></iframe>
				</center>
			</div>
			<div class="dialogContainerRoot actuate_shared_resource actuate_shared_resource_global" id="arf_rteditor">
				<div id="arf_rteditor_content" style="width: 700px; height: 200px;"></div>
			</div>
			<div class="dialogContainerRoot actuate_shared_resource actuate_shared_resource_global" id="arf_layoutdlg">
				<div id="arf_layout_dlg_content" >
				<center>
					<table cellpadding="5px">
						<tr>
							<td><div id="arf_layoutdlg_alignmentlabel"></div></td><td id="arf_layoutdlg_alignmenttable"></td>
						</tr>
						<tr>
							<td><div id="arf_layoutdlg_widthlabel"/></td></td>
							<td>
								<select style="width:100%" id="arf_layoutdlg_widthselect"></select>
							</td>
						</tr>
						<tr>
							<td><div id="arf_layoutdlg_heightlabel"/></td></td>
							<td>
								<select style="width:100%" id="arf_layoutdlg_heightselect"></select>
							</td>
						</tr>
						<tr><td colspan="2" style="text-align:center"><input type="button" id="arf_layoutdlg_defaultbtn" value="xxx"></td></tr>
					</table>
				</center>
				</div>
			</div>
		</div>
	</body>
</html>