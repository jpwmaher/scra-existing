////////////////////////////////////////////////////////////////////////
// NAMESPACE scr.util
// General utility functions available across the site
////////////////////////////////////////////////////////////////////////

// ensure namespace exists
if (typeof scr === "undefined") { var scr = {}; }
if (typeof scr.util === "undefined") { scr.util = {}; }

scr.util.keyboardClickHandler = function(event) {
    // this is a handler for keyDown events that triggers a click event on the
    // same
    // element if enter or space is pressed.
    // This is primarily useful for making elements act like buttons, which
    // wouldn't
    // normally act like buttons, eg. links

    // NOTE: we use keyDown instead of keyUp because forms have a default submit
    // action
    // on enter, that would be triggered before the keyUp could be caught

    // if key is enter (13) or space (32) then trigger click event
    var keyCode = event.which;
    if ((keyCode == 13) || (keyCode == 32)) {
        // swallow event
        event.preventDefault();
        event.stopPropagation();
        $(this).click();
    }
};

scr.util.createEnterKeyRedirectHandler = function(callback) {
    // This is a keypress handler that will capture the <enter> key being
    // pressed,
    // stop the default action, if any, and trigger a user-defined callback.
    // This is useful, for example, to prevent the default submit action on
    // forms.
    var handler = function(event) {
        if (event.which == 13) {
            // swallow event
            event.preventDefault();
            if (typeof callback !== 'undefined') {
                callback(event);
            }
        }
    };
    return handler;
};

scr.util.setFormDefaultSubmitButton = function(formId, buttonId) {
    // make the default <enter> action on the named form to click the specified button
    scr.util.replaceFormDefaultKeyboardSubmit('#' + formId, function() {
        $('#' + buttonId).click();
    });
};

scr.util.replaceFormDefaultKeyboardSubmit = function(formSelector, callback) {
    // Replace the default submit action on forms when <enter> is pressed with a
    // custom
    // callback function.
    // This is useful in two situations:
    // - when the default (ie. first) submit button is not the appropriate
    // default
    // - in IE7, default submission does not post the button value in the form
    // Args:
    // - formSelector - CSS selector expression for the form to affect
    // - callback(event) - (optional) callback to trigger instead of default
    // submit
    // - the original keypress event is forward for further interrogation
    //
    // NOTE: this only prevents the default submission action on the form, it
    // won't
    // prevent the keypress event from bubbling up

    var form = $(formSelector);

    // find form inputs, excluding buttons - these should retain their default
    // action
    var inputs = $('input', form).not('input[type=button]').not(
            'input[type=submit]');

    // create an appropriate handler and install it on relevant inputs
    var handler = scr.util.createEnterKeyRedirectHandler(callback);
    inputs.keypress(handler);
};


scr.util.tablesorterGetSortOrder = function(table) {
    // Extract the current sort order from a Tablesorter-wrapped table.
    // Args:
    // - table: the table DOM or jquery element to get the sort order of
    // Returns:
    // - the sort order as an array of arrays, suitable for passing to a
    // Tablesorter
    // 'sorton' event - see Tablesorter docs
    // then sets the 'aria-sort' attribute for screen readers.
    table = $(table);
    var sorts = [];
    $('th', table).each(function(index) {
        var headerCell = $(this);
        if (headerCell.hasClass('tablesorter-headerAsc')) {
            sorts.push([ index, 0 ]);
            headerCell.attr("aria-sort", "ascending");
        } else if (headerCell.hasClass('tablesorter-headerDesc')) {
            sorts.push([ index, 1 ]);
            headerCell.attr("aria-sort", "descending");
        }
    });
    return sorts;
};

scr.util.setGlobalGoToTopVisibility = function() {
    // Checks if the document height is larger than the current window size, and
    // if so
    // sets the go-to-top marker's visibility accordingly
    if ($(document).height() > $(window).height()) {

        if ($('#gototop').length === 0) {
            var $a = $(document.createElement('a'));
            $a.attr({
                id : 'gototop',
                href : '#'
            }).addClass('print-disabled').text('Go to top').bind('click',
                    function(event) {
                        event.preventDefault();
                        $('#content').ScrollTo({
                            offsetTop : 9999
                        });
                    });
            $('#content').append($a);
        }

        $('#gototop').show();
    } else {
        $('#gototop').hide();
    }
};

scr.util.setVerticalScrollbarGoToTopVisibility = function($elem) {

    // Tot up the combined inner height of the scrollable elements
    var innerHeight = 0;
    $elem.find('> *').each(function(idx, elem) {
        innerHeight += $(elem).height();
    });

    if (innerHeight > $elem.height()) {

        if ($elem.find('#gototop').length === 0) {
            var $a = $(document.createElement('a'));
            $a.attr({
                id : 'gototop',
                href : '#'
            }).addClass('print-disabled').text('Go to top').bind('click',
                    function(event) {
                        event.preventDefault();
                        $elem.find('> *').first().ScrollTo();
                    });
            $elem.append($a);
        }
        $elem.find('#gototop').show();
    } else {
        $elem.find('#gototop').hide();
    }
};

// //////////////////////////////////////////////////////////////////////

scr.util.getHelpLinkForCurrentPage = function() {
    // Scrapes the help-id from a meta tag: <meta scr-help-link='...'/>
    // (See master.html template for usage details - there is a block helpId
    // that can be added in every page)
    // else uses the last part of the path name
    var pageId = $('meta[scra-help-link]').attr('scra-help-link') || window.location.pathname;
    var idx = pageId.lastIndexOf('/');
    if (idx >= 0) {
        pageId = pageId.substring(idx + 1);
    }
    return pageId;
};

scr.util.setupGlobalHelp = function() {
    // Main navbar help link overridden to open help popup
	$(document).on('click', '#HelpLinkGlobal', function(event) {
        event.preventDefault();
        var helpId = scr.util.getHelpLinkForCurrentPage();
        scr.util.openHelpWindow(helpId);
        return false;
    });

    // Bind any anchors in an enclosing 'help-popup'-classed element to open the
    // help popup
    $(document).on('click', '.help-popup a', function(event) {
        event.preventDefault();
        var helpId = $(this).attr('href');
        scr.util.openHelpWindow(helpId);
        return false;
    });

    $('body').on('keydown', function(event) {
        var inInputField = $(event.target).is('input,textarea,select');

        if (!inInputField) {
            switch (event.which) {
            case 48: // '0'
                scr.util.openHelpWindow('shortcutkeystrokes');
                break;
            case 53: // '5'
                scr.util.openHelpWindow('frequentlyaskedquestions');
                break;
            case 54: // '6'
                scr.util.openHelpWindow('howtousehelp');
                break;
            case 81: // 'q'
            case 113: // 'Q'
                window.close();
                break;
            }
        }
    });
};

scr.util.openHelpWindow = function(helpId) {
    if (helpId.indexOf('#') === 0) {
        helpId = helpId.substring(1);
    }

    // Append the time in millis as a parameter onto the the help URL:
    // this has the effect of refreshing the help page content - which
    // will trigger the document ready event, which in turn will set
    // the correct visuals on the help subsystem
    var now = new Date().getTime();
    window.open("help?" + now + "#" + helpId, 'newwindow',
            'resizable=1,status=1,scrollbars=1,width=900,height=650').focus();
    return false;
};

scr.util.innerSize = function() {
    var w = 0, h = 0;
    if (typeof (window.innerWidth) == 'number') {
        // Non-IE
        w = window.innerWidth;
        h = window.innerHeight;
    } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        // IE 6+ in 'standards compliant mode'
        w = document.documentElement.clientWidth;
        h = document.documentElement.clientHeight;
    } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        // IE 4 compatible
        w = document.body.clientWidth;
        h = document.body.clientHeight;
    }
    return [ w, h ];
};

scr.util.preventClickthroughOnTooltips = function() {
    $(document).on('click', 'a[data-toggle="tooltip"]',
        function(event) {
            event.preventDefault();
            return false;
        });
};


scr.util.installFocusListeners = function() {
    // Ensures that as the user tabs through the screen elements the page
    // scrolls to ensure that the component is visible.
    $(document).on('focus', 'input, label, select',
		function() {
	        var padding = 50;
	
	        var elementBottom = $(this).offset().top + $(this).height();
	        var windowScroll = $(window).scrollTop();
	        var windowBottom = windowScroll + $(window).height();
	
	        if (elementBottom + padding > windowBottom) {
	            $(window).scrollTop(windowScroll + padding);
	        }
	    }
	);
};

scr.util.preventBackButtonNavigation = function() {
    // if we've moved back in the browser history, then move forward again
    window.history.forward();
    // install a pageshow handler to trigger when any pages are displayed from
    // the browser cache
    $(document).on("pageshow", "body",
        function(event) {
            var fromCache = (event.persisted || (event.originalEvent && event.originalEvent.persisted));
            if (fromCache) {
                window.history.forward();
            }
        });
};

scr.util.installSelectPlaceholder = function() {
    // JavaScript toggles the grey color of the control when the placeholder is
    // selected
    $(document).on('change', 'select:has(option[value=]:first-child)',
        function() {
            $(this).toggleClass("empty", $.inArray($(this).val(), [ '', null ]) >= 0);
        });

    // For those dropdowns with an empty value, set the empty class accordingly
    $("select[value=]").addClass('empty');
};

scr.util.isTopLeftOfElementInView = function(element) {

    //special bonus for those using jQuery
    if (typeof jQuery === "function" && element instanceof jQuery) {
        element = element[0];
    }

    var rect = element.getBoundingClientRect();

    return (
        rect.top >= parseInt($('#masterBody').css('padding-top')) &&
            rect.left >= 0 &&
            rect.top <= (window.innerHeight || document.documentElement.clientHeight)
        );
}

/* Ideally, the function should be renamed*/
scr.util.recalcContentMargin = function() {
    setTimeout(function() {
        scr.util.setGlobalGoToTopVisibility();
        var masterHeaderHeight = $('#masterHeader').height();
        $('#content #masterBody').css('padding-top', masterHeaderHeight);
        scr.util.recalculateFixedElementCoordinates();
    }, 100);
};

scr.util.recalculateFixedElementCoordinates = function() {
    // Empty placehodler function to be overridden by individual pages if reequired
};

scr.util.checkToDisplayPrefixOtherField = function() {
    // When entering or refreshing a page, ensure that the Other Prefix field is
    // hidden if OTHER is not selected in the Prefix dropdown menu.
    var prefixList = $("select[name*='NamePrefix']");
    for (var i = 0; i < prefixList.length; i++) {
        var prefix = prefixList[i];
        var value = prefix.options[prefix.selectedIndex].value;
        if (value !== 'OTHER') {
            var otherFieldName = prefix.id.replace("Prefix", "Other");
            $("#" + otherFieldName + "_row").hide();
        }
    }
};

scr.util.checkToDisplayOther = function(dropdown, otherField) {
    // When entering or refreshing a page, ensure that the Other Language field
    // is hidden if a recognised value is found in the dropdown list.
    var list = $("select[name*='" + dropdown + "']");
    var data = document.getElementById(otherField).value;

    var valuePresentInListOrNone = data === 'None';
    for (var i = 0; i < list.length; i++) {
        var opt = list[i];
        var value = opt.options[opt.selectedIndex].innerHTML;

        if (value !== 'Other') {
            $("#" + otherField + "_row").hide();
        }
    }
};

scr.util.checkToDisplayLanguageOtherField = function() {
    // When entering or refreshing a page, ensure that the Other Language field
    // is hidden if a recognised value is found in the dropdown list.
    scr.util.checkToDisplayOther('language', 'languageOther');
};

scr.util.checkToDisplayCountryOtherField = function() {
    // When entering or refreshing a page, ensure that the Other Country of
    // Birth field is hidden if
    // a recognised value is found in the dropdown list.
    scr.util.checkToDisplayOther('countryOfBirth', 'countryOfBirthOther');
};

scr.util.checkToDisplayContactMethodOtherField = function() {
    // When entering or refreshing a page, ensure that the Other Contact Method field
    // is hidden if a recognised value is found in the dropdown list.
    scr.util.checkToDisplayOther('contactMethod', 'contactMethodOther');
};

scr.util.enablePlaceholderText = function() {
    // trigger polyfill to enable placeholder text in input fields (affects IE)
    $('input, textarea').placeholder();
};

scr.util.tabModals = function() {
    $('#patientDetailsTab,#cpisDetailsTab').bind('click', function(event) {
        $('#cancelModal').modal('show');
        return false;
    });
};

scr.util.proceedToBirthNotifcationModal = function() {
    $('#birthNotificationPatient').bind('click', function(event) {
        $('#proceedToBirthNotificationModal').modal('show');
        return false;
    });
};

scr.util.proceedToAllocateModal = function() {
    $('#allocatePatient').bind('click', function(event) {
            $('#switchToAllocateWarningModal').modal('show');
           return false;
    });
};

scr.util.duplicatesScrollTo = function(element) {
    element.ScrollTo({
        offsetTop : -250,
        duration : 0,
        easing : 'none'
    });
};

scr.util.attachDuplicatesScrollHandler = function() {
    scr.util.duplicatesScrollTo($('#submitBtn1'));
};

scr.util.pdfPreviewGet = function(url) {
    if (spine2.browser.isIE() && spine2.browser.getIEVersion() < 10) {
        url = "pdfpreview?url=" + encodeURIComponent(url);
    }
    var printpreview = window.open(url, '_blank');
    printpreview.focus();
};

scr.util.pdfPreviewPost = function(url, data) {
   
	var params = JSON.stringify(data);
 	var newTab = window.open("","_blank");
 	var loadingHtml = "<div><h1 style='color: #215DC5;font-size: 30px;font-weight: normal;'>" + 
 			"Please wait</strong></h1>" + 
            "<p style='font-weight: 200;color: #777777;text-shadow: 0 1px 0 #ffffff;'>" +
            "Your request is being processed...</p></div>"

	newTab.document.write(loadingHtml);
 	
	var jqueryResponseHandler = function(data,  textStatus, jqXHR){
		newUrl = url + "?nidstoken=" + data.nidstoken;
		newTab.location.href = newUrl;
	}

	$.ajax({
        url : url,
	    type : 'POST',
	    data: data,
	    dataType: "json",
	    headers : {'X-SessionTokenId': sessionTokenId},
	    success: jqueryResponseHandler,
	    error : function(jqXHR, textStatus, errorThrown) {
	        debug.log("Problem loading pdf files", textStatus, errorThrown);
	    }
	});
	
};

scr.util.loadingModal = function (selector) {
    $(selector).click(function() {
        scr.util.showLoadingModal();
    });
};

scr.util.showLoadingModal = function (selector) {
    $('#loadingModal').modal();
    if (spine2.browser.isIE() && spine2.browser.getIEVersion() <= 8) {
        setTimeout(function() {
            $('.loading-bar').css('background-image', 'none').html('<img src="(../../common/static/img/loading_bar_animated.gif"/>');
        },20);
    }	
};

scr.util.hideLoadingModal = function () {
	$('#loadingModal').modal('hide');
};

scr.util.patientBannerPrintToggle=function(enablePrint){
    //Add the print-disabled class to patient banner if enablePrint is passed as false.
    //print-disabled class would disable printing of the patient banner 
    if (enablePrint){
        $('#patientBanner').removeClass('print-disabled');}
    else{
        $('#patientBanner').addClass('print-disabled');
    }
};

scr.util.patientContactNextOfKinPrintToggle=function(enablePrint){
	//Add the print-disabled class to patient banner if enablePrint is passed as false.
	//print-disabled class would disable printing of the next of kin page when printing the review changes modal dialog
	
	if (enablePrint){
		$('#contactnextofkin').removeClass('print-disabled');
		$('#reviewChangesPrintBody').addClass('print-disabled').empty();
		
	}
	else{
		$('#contactnextofkin').addClass('print-disabled');
		$('#reviewChangesPrintBody').removeClass('print-disabled');
	}
};

scr.util.closeImmigrationFlash = function() {
    // Sets the session value for displayImmigrationFlash message to false
    // Currently no success/failure feedback is provided, this is an async call
    // and will
    // return immediately.

    $.ajax({
        url : 'immigrationstatusflashclose',
        type : 'GET',
        error : function(jqXHR, textStatus, errorThrown) {
            debug.log("Problem updating session", textStatus, errorThrown);
        }
    });
};

$(document).ready(function() {
    scr.util.setupGlobalHelp();
    scr.util.preventClickthroughOnTooltips();
    scr.util.installSelectPlaceholder();
    scr.util.installFocusListeners();
    scr.util.recalcContentMargin();

    $(document).on('closed', '.alert', scr.util.recalcContentMargin);
    $(document).on('DOMNodeInserted', '.alert', scr.util.recalcContentMargin);

    // http://stackoverflow.com/a/11683448/260541
    var resizeTimeout;
    var actioning = false;
    $(window).resize(function() {
        if (!actioning) {
            actioning = true;
            resizeTimeout = setTimeout(function() {
                clearTimeout(resizeTimeout);
                scr.util.recalcContentMargin();
            }, 100);
        }
    });


    var errorText = $('#errorsMsg').text();
    if (errorText !== "") {
        setTimeout(function(){
            $('#errorsAlert').text(errorText);}, 2000);
    }
});

scr.util.initDatepicker = function () {
    $("input[datepicker]").datepicker({
        changeMonth: true, 
        changeYear: true, 
        yearRange: '1800:2100', 
        showOn: "button", 
        buttonImage: 'static/images/calendar_control.gif', 
        buttonImageOnly: true, 
        buttonText: "calendar", 
        dateFormat: 'dd-M-yy', 
        minDate: '-150Y', 
        maxDate: '+10Y'});
};

scr.util.scrollToName = function(element) {
    $(window).delay( 200 ).queue(function () {
        var header = $('h2:contains(' + element + ')').first();
        if (header.length) {
            header.focus();
            var top = $(window).scrollTop();
            $(window).scrollTop(top + 150);
        }
    });
};

scr.util.scrollToElementBelowNavbar = function(element) {
    $('#' + element).ScrollTo({offsetTop: 300, duration: 0,easing: 'none'});
};

scr.util.dataTableDefaultStyle = function() {
	
	return {
	        "sDom": "<'clearfix'<'pull-left'l><'pull-right'f>r>t<'clearfix'<'pull-left'i><'pull-right'p>>",
	        "sPaginationType": "bootstrap",
	        "oLanguage": {
	            "sLengthMenu": "_MENU_ per page",
	            "sInfo": "Showing _START_-_END_ of _TOTAL_",
	            "sInfoFiltered": "<br/>(filtered from _MAX_)"
	        }
	    };
};

scr.util.focusFirstField = function(formId) {
	var form = $(formId);
	 var firstField = $('input', form).not('[type=submit],[type=button]').filter(':visible').first();
     if (firstField) {
         firstField.focus();
     }	
};

scr.util.clearFormValidation = function(formId) {
	$(formId + " .control-group-error").removeClass('control-group-error');
	$(formId + " .errorText").remove();	
	$(formId).find('input[type=text], textarea').val('');
	$(formId).find('input[type=radio]').prop('checked', false);
};

scr.util.removeFlashMessage = function() {
	$('.flash-message-list').hide();
    scr.util.recalcContentMargin();
};
