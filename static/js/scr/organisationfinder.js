////////////////////////////////////////////////////////////////////////
//NAMESPACE scr.orgfinder
////////////////////////////////////////////////////////////////////////
//ensure namespace exists
if (typeof scr === "undefined") {
    var scr = {};
}
if (typeof scr.orgfinder === "undefined") {
    scr.orgfinder = {
        CONTAINER_ID : "#organisationFinderContainer",
        DUMMY_FLASH_BANNER_ID : "#dummyFlashBannerOrganisation",
    
        SEARCH_PANEL_ID : "#organisationFinderPanel",
        FORM_ID : "#organisationFinderForm",
        SEARCH_BUTTON_ID : "#organisationFinderFindBtn",
    
        RESULT_PANEL_ID : "#organisationFinderResultsPanel",
        RESULT_VALUES_ID : "#organisationFinderResultsValues",
        RESULTS : "#organisationFinderResults",
    
        CLEAR_BUTTON : '#organisationFinderClearBtn',
        RETRY_BUTTON : '#organisationFinderRetryBtn',
        CANCEL_BUTTON : 'organisationFinderCancelBtn',
        DESCRIPTION : "#organisationFinderDescription",
    
        ORG_ONLY_FIELD_ID : "#orgOnly",
    
        ORGANISATION_LOOKUP : ".organisationlookup",
    
        orgOnly : false,
        activatedBy : null
    };
}
////////////////////////////////////////////////////////////////////////


scr.orgfinder.initalise = function(hide) {
    scr.util.replaceFormDefaultKeyboardSubmit(scr.orgfinder.FORM_ID,
            function() {
                scr.orgfinder._post($(scr.orgfinder.SEARCH_BUTTON_ID));
            });

    $(scr.orgfinder.FORM_ID).off("click");
    $(scr.orgfinder.FORM_ID).on("click", ":submit", function(e) {
        e.preventDefault();
        scr.orgfinder._post($(this));
    });

    $(scr.orgfinder.CLEAR_BUTTON).off("click");
    $(scr.orgfinder.CLEAR_BUTTON).on("click", function(e) {
        e.preventDefault();
        scr.orgfinder.clear();
        $(document).trigger("organisationFinder:clear", []);
    });

    $(scr.orgfinder.RETRY_BUTTON).off("click");
    $(scr.orgfinder.RETRY_BUTTON).on("click", function(e) {
        e.preventDefault();
        if (scr.orgfinder._isResultsOpen()) {
            $(scr.orgfinder.RESULT_PANEL_ID).hide();
            $(scr.orgfinder.SEARCH_PANEL_ID).show();
            scr.util.recalcContentMargin();
        }
    });

    var cancelBtnName = "input[name = '" + scr.orgfinder.CANCEL_BUTTON + "']";
    $(cancelBtnName).off("click");
    $(cancelBtnName).on("click", function(e) {
        e.preventDefault();
        scr.orgfinder.cancel();
        $(document).trigger("organisationFinder:cancel", []);
    });

    $(scr.orgfinder.RESULT_VALUES_ID).off("click");
    $(scr.orgfinder.RESULT_VALUES_ID).on(
            'click',
            'tr',
            function(event) {
                $(document).trigger("organisationFinderResult:changed",
                        [ this, scr.orgfinder.activatedBy ]);
                scr.orgfinder.cancel();
                return false;
            });

    $(scr.orgfinder.ORGANISATION_LOOKUP).off("click");
    $(scr.orgfinder.ORGANISATION_LOOKUP)
            .on(
                    "click",
                    function(e) {
                        e.preventDefault();
                        var buttonId = $(this).attr('id');
                        var hasOrg = this.getAttribute("data-orgOnly");
                        var orgBy = this.getAttribute("data-orgBy");
                        if (!orgBy) {
                            orgBy = buttonId;
                        }

                        var orgOnly = (hasOrg && (hasOrg == "true" || hasOrg == true));
                        scr.orgfinder.show(orgBy, orgOnly, true);
                    });

    $(scr.orgfinder.RESULTS).dataTable(scr.util.dataTableDefaultStyle());

    if (hide) {
        scr.orgfinder.hide();
        scr.orgfinder.clear();
    }
};

scr.orgfinder.show = function(activatedBy, orgOnly, focus) {

    var description = "";
    if (orgOnly) {
        description = "Organisation Code finder";
        scr.orgfinder.orgOnly = true;
    } else {
        description = "Organisation & Site Code finder";
        scr.orgfinder.orgOnly = false;
    }

    scr.orgfinder._updateHiddenField();

    $("#organisationFinderContainer .container-header h2").each(
            function(index, element) {
                $(element).html(description);
            });

    if (!scr.orgfinder.isvisible() || scr.orgfinder.activatedBy != activatedBy) {
        scr.orgfinder.hide();
        scr.orgfinder.clear();
        $(scr.orgfinder.SEARCH_PANEL_ID).show();
        $(scr.orgfinder.CONTAINER_ID).show();
    }
    scr.util.enablePlaceholderText();
    scr.util.recalcContentMargin();
    scr.orgfinder.activatedBy = activatedBy;
    $(document).trigger("organisationFinder:show", []);

    if (focus) {
        scr.util.focusFirstField(scr.orgfinder.FORM_ID);
    }
};

scr.orgfinder.hide = function() {
    if (!scr.orgfinder.isvisible()) {
        return;
    }

    $(scr.orgfinder.CONTAINER_ID).hide();
    $(scr.orgfinder.SEARCH_PANEL_ID).hide();
    $(scr.orgfinder.RESULT_PANEL_ID).hide();
    scr.util.recalcContentMargin();
    $(document).trigger("organisationFinder:hide", []);
};

scr.orgfinder.clear = function() {
    scr.util.clearFormValidation(scr.orgfinder.FORM_ID);
};

scr.orgfinder.retry = function() {
    $(scr.orgfinder.RESULT_PANEL_ID).hide();
    $(scr.orgfinder.SEARCH_PANEL_ID).show();
    scr.util.recalcContentMargin();
};

scr.orgfinder.cancel = function() {
    scr.orgfinder.hide();
    scr.orgfinder.clear();
    scr.orgfinder.activatedBy = null;
};

scr.orgfinder._post = function(self) {
    scr.orgfinder._updateHiddenField();

    var formData = self.closest('form').serializeArray();
    formData.push({
        name : self.attr('id'),
        value : true
    });
    scr.util.showLoadingModal();
    $.ajax({
        type : "POST",
        url : "organisationfinder",
        data : formData,
        headers : {'X-SessionTokenId': sessionTokenId},
        success : function(data) {
            $(scr.orgfinder.CONTAINER_ID).replaceWith(data);
            $('#flashBanner').empty();
            $('#flashBanner').append(
                    $(scr.orgfinder.DUMMY_FLASH_BANNER_ID).html());
            $(scr.orgfinder.DUMMY_FLASH_BANNER_ID).remove();
        },
        error : function(request, status, error) {
            common.session.flash('error', 'Sorry, there was a server error: '
                    + error);
        },
        complete : function() {
            scr.util.hideLoadingModal();
            if ($(scr.orgfinder.RESULT_PANEL_ID).length > 0) {
                $(scr.orgfinder.RESULT_PANEL_ID).show();
                $(scr.orgfinder.SEARCH_PANEL_ID).hide();
            } else {
                $(scr.orgfinder.RESULT_PANEL_ID).hide();
                $(scr.orgfinder.SEARCH_PANEL_ID).show();
            }

            scr.orgfinder.initalise(false);
            scr.orgfinder.show(scr.orgfinder.activatedBy,
                    scr.orgfinder.orgOnly, false);
        }
    });
};

scr.orgfinder._updateHiddenField = function() {
    if (scr.orgfinder.orgOnly) {
        $(scr.orgfinder.ORG_ONLY_FIELD_ID).val('true');
    } else {
        $(scr.orgfinder.ORG_ONLY_FIELD_ID).val('');
    }

};

scr.orgfinder.isvisible = function() {
    return scr.orgfinder._isSearchOpen() || scr.orgfinder._isResultsOpen();
};

scr.orgfinder._isSearchOpen = function() {
    return $(scr.orgfinder.CONTAINER_ID).is(':visible')
            && $(scr.orgfinder.SEARCH_PANEL_ID).is(':visible');
};

scr.orgfinder._isResultsOpen = function() {
    return $(scr.orgfinder.CONTAINER_ID).is(':visible')
            && $(scr.orgfinder.RESULT_PANEL_ID).is(':visible');
};

$(document).ready(scr.orgfinder.initalise(true));
