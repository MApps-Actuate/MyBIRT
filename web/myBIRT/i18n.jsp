<%@ page language="java" contentType="text/javascript; charset=UTF-8" pageEncoding="UTF-8"%>
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
	String language = locale.getLanguage();
	
	if (language.equals("fr")) { %>
		<jsp:include page="i18n_fr.jsp" />
	<% } else { %>
		<jsp:include page="i18n_en.jsp" />
	<% } %>
