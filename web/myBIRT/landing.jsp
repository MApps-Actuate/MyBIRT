<%=request.getRequestURI()%>
<%
	// Get userinfobean
	com.actuate.reportcast.utils.AcRequestHandlerBean requestHandlerBean = new  com.actuate.reportcast.utils.AcRequestHandlerBean();
	requestHandlerBean.setRequest(request);
	com.actuate.activeportal.beans.UserInfoBean userinfobean = requestHandlerBean.getUserInfoBeanFromSession();
	response.setHeader("Cache-Control", "no-cache");

	String serverURL = userinfobean.getServerurl();
	String authId = userinfobean.getAuthid();

	String username = userinfobean.getUserid();
	java.util.Locale locale = userinfobean.getLocale();

	String dologout = request.getParameter("logout");
	if (dologout != null) {
		session.invalidate();
		response.sendRedirect(request.getContextPath() + "/login.jsp?targetpage=" + request.getRequestURI());
	} else if (null == username)
		response.sendRedirect(request.getContextPath() + "/login.jsp?targetpage=" + request.getRequestURI());
	else
		pageContext.forward("layouteditor.jsp");
		
%>	