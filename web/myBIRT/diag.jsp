<%=session%>

<%
 
   for (java.util.Enumeration<String> e = session.getAttributeNames(); e.hasMoreElements();) {
       out.println(e.nextElement());
       out.println("<br>");
      }
%>


<%=request%>

<%
 
   for (java.util.Enumeration<String> e = request.getAttributeNames(); e.hasMoreElements();) {
       out.println(e.nextElement());
       out.println("<br>");
      }
%>