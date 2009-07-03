﻿//fixedInlineErrorText = "" for it to be populated from ModelState error messages
function TrySave(urlController, prefixToIgnore, showInlineError, fixedInlineErrorText) {
    var returnValue = false;
    $.ajax({
        type: "POST",
        url: urlController,
        async: false,
        data: $("form").serialize() + "&" + sfPrefixToIgnore + "=" + prefixToIgnore,
        success:
            function(result) {
                eval('var modelState=' + result);

                //Remove previous errors
                $('.' + sfFieldErrorClass).replaceWith("");
                $('.' + sfInputErrorClass).removeClass(sfInputErrorClass);
                $('.' + sfSummaryErrorClass).replaceWith("");

                var allErrors = "";
                var inlineErrorStart = "&nbsp;<span class=\"" + sfFieldErrorClass + "\">";
                var inlineErrorEnd = "</span>"
                for (var controlID in modelState) {
                    var errorsArray = modelState[controlID];
                    var errorMessage = "";
                    for (var j = 0; j < errorsArray.length; j++) {
                        errorMessage += errorsArray[j];
                        allErrors += "<li>" + errorsArray[j] + "</li>\n";
                    }
                    if (controlID != sfGlobalErrorsKey && controlID != "") {
                        var control = $('#' + controlID);

                        if (control.length == 0)
                        {   //radioButtons
                            control = $("input:radio[name='" + controlID + "']");
                        }

                        control.addClass(sfInputErrorClass);
                        if (showInlineError && control.hasClass(sfInlineErrorVal)) {
                            if (fixedInlineErrorText == "")
                                $('#' + controlID).after(inlineErrorStart + errorMessage + inlineErrorEnd);
                            else
                                $('#' + controlID).after(inlineErrorStart + fixedInlineErrorText + inlineErrorEnd);
                        }
                    }
                }

                if (allErrors != "") {
                    if (document.getElementById(sfGlobalValidationSummary) != null) {
                        document.getElementById(sfGlobalValidationSummary).innerHTML = "<ul class=\"" + sfSummaryErrorClass + "\">\n" + allErrors + "</ul>\n";
                    }
                    return;
                }
                returnValue = true;
                return;
            },
        error:
            function(XMLHttpRequest, textStatus, errorThrown) {
                ShowError(XMLHttpRequest, textStatus, errorThrown);
            }
    });
        return returnValue;
    }

    //fixedInlineErrorText = "" for it to be populated from ModelState error messages
    function TrySavePartial(urlController, prefix, prefixToIgnore, showInlineError, fixedInlineErrorText) {
        var typeName = $('#' + prefix + sfStaticType).val();
        var runtimeType = $('#' + prefix + sfRuntimeType).val(); //typeName is an interface
        if (runtimeType != null && runtimeType != "") {
            typeName = runtimeType;
        }
        return TypedTrySavePartial(urlController, prefix, prefixToIgnore, showInlineError, fixedInlineErrorText, typeName);
    }

    //fixedInlineErrorText = "" for it to be populated from ModelState error messages
    function TrySavePartialList(urlController, prefix, itemPrefix, prefixToIgnore, showInlineError, fixedInlineErrorText) {
        var typeName = $('#' + prefix + sfStaticType).val();
        var runtimeType = $('#' + itemPrefix + sfRuntimeType).val(); //typeName is an interface
        if (runtimeType != null && runtimeType != "") {
            typeName = runtimeType;
        }
        return TypedTrySavePartial(urlController, itemPrefix, prefixToIgnore, showInlineError, fixedInlineErrorText, typeName);
    }

    //fixedInlineErrorText = "" for it to be populated from ModelState error messages
    function TypedTrySavePartial(urlController, prefix, prefixToIgnore, showInlineError, fixedInlineErrorText, staticType, panelPopupKey) {
        if (panelPopupKey == "" || panelPopupKey == undefined)
            panelPopupKey = "panelPopup"
        var formChildren = $('#' + prefix + panelPopupKey + " *, #" + prefix + sfId + ", #" + prefix + sfRuntimeType + ", #" + prefix + sfStaticType + ", #" + prefix + sfIsNew);
        var idField = document.getElementById(prefix + sfId);
        var idQueryParam = "";
        if (idField != null && idField != undefined) {
            idQueryParam = "&sfId=" + idField.value;
        }

        var returnValue = false;
        $.ajax({
            type: "POST",
            url: urlController,
            async: false,
            data: formChildren.serialize() + "&prefix=" + prefix + "&" + sfPrefixToIgnore + "=" + prefixToIgnore + "&sfStaticType=" + staticType + idQueryParam,
            success:
            function(result) {
                eval('var result=' + result);
                var modelState = result["ModelState"];

                var toStr = result[sfToStr];
                var link = $("#" + prefix + sfLink);
                if (link.length > 0)
                    link.html(toStr); //EntityLine
                else {
                    var tost = $("#" + prefix + sfToStr);
                    if (tost.length > 0)
                        tost.html(toStr); //EntityList
                    else {
                        var combo = $("#" + prefix + sfCombo);
                        if (combo.length > 0) 
                            $('#' + prefix + sfCombo + " option:selected").html(toStr);
                    }
                }
                
                //Remove previous errors
                $('.' + sfFieldErrorClass).replaceWith("");
                $('.' + sfInputErrorClass).removeClass(sfInputErrorClass);
                $('.' + sfSummaryErrorClass).replaceWith("");

                var allErrors = "";
                var inlineErrorStart = "&nbsp;<span class=\"" + sfFieldErrorClass + "\">";
                var inlineErrorEnd = "</span>"

                for (var controlID in modelState) {
                    var errorsArray = modelState[controlID];
                    var errorMessage = "";
                    for (var j = 0; j < errorsArray.length; j++) {
                        errorMessage += errorsArray[j];
                        allErrors += "<li>" + errorsArray[j] + "</li>\n";
                    }
                    if (controlID != sfGlobalErrorsKey && controlID != "") {
                        var control = $('#' + controlID);
                        control.addClass(sfInputErrorClass);
                        if (showInlineError && control.hasClass(sfInlineErrorVal)) {
                            if (fixedInlineErrorText == "")
                                $('#' + controlID).after(inlineErrorStart + errorMessage + inlineErrorEnd);
                            else
                                $('#' + controlID).after(inlineErrorStart + fixedInlineErrorText + inlineErrorEnd);
                        }
                    }
                }

                if (allErrors != "") {
                    $('#' + prefix + sfToStr).addClass(sfInputErrorClass);
                    $('#' + prefix + sfLink).addClass(sfInputErrorClass);
                    if (document.getElementById(sfGlobalValidationSummary) != null) {
                        document.getElementById(sfGlobalValidationSummary).innerHTML = "<br /><ul class=\"" + sfSummaryErrorClass + "\">\n" + allErrors + "</ul><br />\n";
                    }
                    return;
                }
                returnValue = true;
                return;
            },
            error:
            function(XMLHttpRequest, textStatus, errorThrown) {
                ShowError(XMLHttpRequest, textStatus, errorThrown);
            }
        });
        return returnValue;
    }


    