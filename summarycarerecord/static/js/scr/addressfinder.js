////////////////////////////////////////////////////////////////////////
//NAMESPACE scr.addressfinder
////////////////////////////////////////////////////////////////////////
//ensure namespace exists
if (typeof scr === "undefined") {
    var scr = {};
}
if (typeof scr.addressfinder === "undefined") {
    scr.addressfinder = {
        CONTAINER_ID : "#addressFinderContainer",
        DUMMY_FLASH_BANNER_ID : "#dummyFlashBannerAddress",

        SEARCH_PANEL_ID : "#addressFinderPanel",
        FORM_ID : "#addressFinderForm",
        SEARCH_BUTTON_ID : "#addressFinderFindBtn",

        RESULT_PANEL_ID : "#addressFinderResultsPanel",
        RESULT_VALUES_ID : "#addressFinderResultsValues",
        RESULTS : "#addressFinderResults",

        CLEAR_BUTTON : '#addressFinderClearBtn',
        RETRY_BUTTON : '#addressFinderRetryBtn',
        CANCEL_BUTTON : 'addressFinderCancelBtn',
        DESCRIPTION : "#addressFinderDescription",

        POSTCODE_FIELD : "#postcode",
        POSTCODE_FIELD_LABEL : "#postcode_label",
        POSTCODE_LOOKUP : ".postcodelookup",

        showpostcode : false,
        activatedBy : null
    };
}
// //////////////////////////////////////////////////////////////////////


scr.addressfinder.initalise = function(hide) {
    scr.util.replaceFormDefaultKeyboardSubmit(scr.addressfinder.FORM_ID,
            function() {
                scr.addressfinder._post($(scr.addressfinder.SEARCH_BUTTON_ID));
            });

    $(scr.addressfinder.FORM_ID).off("click");
    $(scr.addressfinder.FORM_ID).on("click", ":submit", function(e) {
        e.preventDefault();
        scr.addressfinder._post($(this));
    });

    $(scr.addressfinder.CLEAR_BUTTON).off("click");
    $(scr.addressfinder.CLEAR_BUTTON).on("click", function(e) {
        e.preventDefault();
        scr.addressfinder.clear();
        $(document).trigger("addressFinder:clear", []);
    });

    $(scr.addressfinder.RETRY_BUTTON).off("click");
    $(scr.addressfinder.RETRY_BUTTON).on("click", function(e) {
        e.preventDefault();
        if (scr.addressfinder._isResultsOpen()) {
            $(scr.addressfinder.RESULT_PANEL_ID).hide();
            $(scr.addressfinder.SEARCH_PANEL_ID).show();
            scr.util.recalcContentMargin();
        }
    });

    var cancelBtnName = "input[name = '" + scr.addressfinder.CANCEL_BUTTON + "']";
    $(cancelBtnName).off("click");
    $(cancelBtnName).on("click", function(e) {
        e.preventDefault();
        scr.addressfinder.cancel();
        $(document).trigger("addressFinder:cancel", []);
    });

    $(scr.addressfinder.RESULT_VALUES_ID).off("click");
    $(scr.addressfinder.RESULT_VALUES_ID).on(
            'click',
            'tr',
            function(event) {
                $(document).trigger("addressFinderResult:changed",
                        [ this, scr.addressfinder.activatedBy ]);
                scr.addressfinder.cancel();
                return false;
            });

    $(scr.addressfinder.POSTCODE_LOOKUP).off("click");
    $(scr.addressfinder.POSTCODE_LOOKUP)
            .on(
                    "click",
                    function(e) {
                        e.preventDefault();
                        var buttonId = $(this).attr('id');
                        var hasPostcode = this.getAttribute("data-showpostcode");
                        var postcodeBy = this.getAttribute("data-postcodeBy");
                        if (!postcodeBy) {
                            postcodeBy = buttonId;
                        }

                        var showPostCode = (hasPostcode && (hasPostcode == "true" || hasPostcode == true));
                        scr.addressfinder.show(postcodeBy, showPostCode, true);
                    });

    $(scr.addressfinder.RESULTS).dataTable(scr.util.dataTableDefaultStyle());

    if (hide) {
        scr.addressfinder.hide();
        scr.addressfinder.clear();
    }
};

scr.addressfinder.show = function(activatedBy, showPostcode, focus) {
    scr.addressfinder.activatedBy = activatedBy;
    if (showPostcode) {
        $(scr.addressfinder.DESCRIPTION)
                .html('<small><em>** You must fill in at least one of these fields, unless searching by Post Code only</em></small>');
        $(scr.addressfinder.POSTCODE_FIELD).show();
        $(scr.addressfinder.POSTCODE_FIELD_LABEL).show();
        scr.addressfinder.showpostcode = true;
    } else {
        $(scr.addressfinder.DESCRIPTION)
                .html('<small><em>** You must fill in at least one of these fields</em></small>');
        $(scr.addressfinder.POSTCODE_FIELD).hide();
        $(scr.addressfinder.POSTCODE_FIELD_LABEL).hide();
        scr.addressfinder.showpostcode = false;
    }

    if (!scr.addressfinder.isvisible()) {
        scr.addressfinder.hide();
        scr.addressfinder.clear();
        $(scr.addressfinder.SEARCH_PANEL_ID).show();
        $(scr.addressfinder.CONTAINER_ID).show();
    }
    scr.util.enablePlaceholderText();
    scr.util.recalcContentMargin();
    $(document).trigger("addressFinder:show", []);

    if (focus) {
        scr.util.focusFirstField(scr.addressfinder.FORM_ID);
    }
};

scr.addressfinder.hide = function() {
    if (!scr.addressfinder.isvisible()) {
        return;
    }

    $(scr.addressfinder.CONTAINER_ID).hide();
    $(scr.addressfinder.SEARCH_PANEL_ID).hide();
    $(scr.addressfinder.RESULT_PANEL_ID).hide();
    scr.util.recalcContentMargin();
    $(document).trigger("addressFinder:hide", []);
};

scr.addressfinder.clear = function() {
    scr.util.clearFormValidation(scr.addressfinder.FORM_ID);
};

scr.addressfinder.retry = function() {
    $(scr.addressfinder.RESULT_PANEL_ID).hide();
    $(scr.addressfinder.SEARCH_PANEL_ID).show();
    scr.util.recalcContentMargin();
};

scr.addressfinder.cancel = function() {
    scr.addressfinder.hide();
    scr.addressfinder.clear();
    scr.addressfinder.activatedBy = null;
};

scr.addressfinder._post = function(self) {
    var formData = self.closest('form').serializeArray();
    formData.push({
        name : self.attr('id'),
        value : true
    });
    scr.util.showLoadingModal();
    $.ajax({
        type : "POST",
        url : "addressfinder",
        data : formData,
        headers : { 'X-SessionTokenId': sessionTokenId},
        success : function(data) {
            $(scr.addressfinder.CONTAINER_ID).replaceWith(data);
            $('#flashBanner').empty();
            $('#flashBanner').append(
                    $(scr.addressfinder.DUMMY_FLASH_BANNER_ID).html());
            $(scr.addressfinder.DUMMY_FLASH_BANNER_ID).remove();
        },
        error : function(request, status, error) {
            common.session.flash('error', 'Sorry, there was a server error: ' + error);
        },
        complete : function() {
            scr.util.hideLoadingModal();
            if ($(scr.addressfinder.RESULT_PANEL_ID).length > 0) {
                $(scr.addressfinder.RESULT_PANEL_ID).show();
                $(scr.addressfinder.SEARCH_PANEL_ID).hide();
            } else {
                $(scr.addressfinder.RESULT_PANEL_ID).hide();
                $(scr.addressfinder.SEARCH_PANEL_ID).show();
            }

            scr.addressfinder.initalise(false);
            scr.addressfinder.show(scr.addressfinder.activatedBy,
                    scr.addressfinder.showpostcode, false);
        }
    });
};

scr.addressfinder.isvisible = function() {
    return scr.addressfinder._isSearchOpen()
            || scr.addressfinder._isResultsOpen();
};

scr.addressfinder._isSearchOpen = function() {
    return $(scr.addressfinder.CONTAINER_ID).is(':visible')
            && $(scr.addressfinder.SEARCH_PANEL_ID).is(':visible');
};

scr.addressfinder._isResultsOpen = function() {
    return $(scr.addressfinder.CONTAINER_ID).is(':visible')
            && $(scr.addressfinder.RESULT_PANEL_ID).is(':visible');
};

$(document).ready(scr.addressfinder.initalise(true));
