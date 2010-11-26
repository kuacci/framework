﻿<%@ Control Language="C#" Inherits="System.Web.Mvc.ViewUserControl" %>
<%@ Import Namespace="Signum.Web" %>
<%@ Import Namespace="Signum.Utilities" %>
<%
    Context context = (Context)Model;
    FindOptions findOptions = (FindOptions)ViewData[ViewDataKeys.FindOptions];
%>
<div id="<%=context.Compose("externalPopupDiv")%>">
<div id="<%=context.Compose("modalBackground")%>" class="transparent popupBackground"></div>
  
<div id="<%=context.Compose("panelPopup")%>" class="popupWindow">
    <%if (ViewData[ViewDataKeys.OnCancel] != null){ %>
        <div class="closebox" id="<%=context.Compose(ViewDataKeys.BtnCancel)%>" onclick="<%=ViewData[ViewDataKeys.OnCancel]%>"></div>
    <%} else { %>
        <div class="closebox" id="<%=context.Compose(ViewDataKeys.BtnCancel)%>"></div>
    <%} %>
    <div id="<%=context.Compose("divPopupDragHandle")%>" class="dragHandle">
        <span class="popupTitle"><%= (string)ViewData[ViewDataKeys.PageTitle] ?? "" %></span>
    </div>    
        <div id="<%=context.Compose("divButtonBar")%>" class="buttonBar">
            <% 
              if(ViewData[ViewDataKeys.OnOk]!=null) { %>
            <input type="button" id="<%=context.Compose(ViewDataKeys.BtnOk)%>" value="OK" onclick="<%=ViewData[ViewDataKeys.OnOk]%>" />
        <%} else{ %>
            <input type="button" id="<%=context.Compose(ViewDataKeys.BtnOk)%>" value="OK" />
         <%} %>               
    </div> 
    <div class="popup-body">
        <%Html.RenderPartial(ViewData[ViewDataKeys.PartialViewName].ToString(), Model); %>
        <%= Html.ValidationSummaryAjax(context) %>
    </div>
</div>
</div>

<%: Html.DynamicJs("~/signum/Scripts/SF_DragAndDrop.js").Callback(@"function () {{
     SF.DragAndDrop(document.getElementById(""{0}""), document.getElementById(""{1}""));}}"
        .Formato(context.Compose("divPopupDragHandle"), context.Compose("panelPopup"))) %> 