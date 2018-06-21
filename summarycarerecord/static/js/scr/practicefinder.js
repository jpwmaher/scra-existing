////////////////////////////////////////////////////////////////////////
//NAMESPACE scr.practicefinder
////////////////////////////////////////////////////////////////////////
//ensure namespace exists
if (typeof scr === "undefined") {
    var scr = {};
}
if (typeof scr.practicefinder === "undefined") {
    scr.practicefinder = {
        CONTAINER_ID : "#practiceFinderContainer",
        DUMMY_FLASH_BANNER_ID : "#dummyFlashBannerPractice",
        SEARCH_PANEL_ID : "#practiceFinderPanel",
        FORM_ID : "#practiceFinderForm",
        SEARCH_BUTTON_ID : "#practiceCodeFinderFindBtn",

        RESULT_PANEL_ID : "#practiceFinderResultsPanel",
        RESULT_VALUES_ID : "#practiceCodeFinderResultsValues",
        RESULTS : "#practiceCodeFinderResultsTable",

        CLEAR_BUTTON : '#practiceFinderClearBtn',
        RETRY_BUTTON : '#practiceFinderRetryBtn',
        CANCEL_BUTTON : 'practiceFinderCancelBtn',

        PRACTICE_LOOKUP : ".practicelookup",

        activatedBy : null        
    };
}
////////////////////////////////////////////////////////////////////////


scr.practicefinder.initalise = function(hide) {
    scr.util.replaceFormDefaultKeyboardSubmit(scr.practicefinder.FORM_ID,
            function() {
                scr.practicefinder
                        ._post($(scr.practicefinder.SEARCH_BUTTON_ID));
            });

    $(scr.practicefinder.FORM_ID).off("click");
    $(scr.practicefinder.FORM_ID).on("click", ":submit", function(e) {
        e.preventDefault();
        scr.practicefinder._post($(this));
    });

    $(scr.practicefinder.CLEAR_BUTTON).off("click");
    $(scr.practicefinder.CLEAR_BUTTON).on("click", function(e) {
        e.preventDefault();
        scr.practicefinder.clear();
        $(document).trigger("practiceFinder:clear", []);
    });

    $(scr.practicefinder.RETRY_BUTTON).off("click");
    $(scr.practicefinder.RETRY_BUTTON).on("click", function(e) {
        e.preventDefault();
        if (scr.practicefinder._isResultsOpen()) {
            $(scr.practicefinder.RESULT_PANEL_ID).hide();
            $(scr.practicefinder.SEARCH_PANEL_ID).show();
            scr.util.recalcContentMargin();
        }
    });

    var cancelBtnName = "input[name = '" + scr.practicefinder.CANCEL_BUTTON + "']";
    $(cancelBtnName).off("click");
    $(cancelBtnName).on("click", function(e) {
        e.preventDefault();
        scr.practicefinder.cancel();
        $(document).trigger("practiceFinder:cancel", []);
    });

    $(scr.practicefinder.RESULT_VALUES_ID).off("click");
    $(scr.practicefinder.RESULT_VALUES_ID).on(
            'click',
            'tr',
            function(event) {
                $(document).trigger("practiceFinderResult:changed",
                        [ this, scr.practicefinder.activatedBy ]);
                scr.practicefinder.cancel();
                return false;
            });

    $(scr.practicefinder.PRACTICE_LOOKUP).off("click");
    $(scr.practicefinder.PRACTICE_LOOKUP).on("click", function(e) {
        e.preventDefault();
        var buttonId = $(this).attr('id');
        var activatedBy = this.getAttribute("data-activatedBy");
        if (!activatedBy) {
            activatedBy = buttonId;
        }
        scr.practicefinder.show(activatedBy, true);
    });

    $(scr.practicefinder.RESULTS).dataTable(scr.util.dataTableDefaultStyle());

    if (hide) {
        scr.practicefinder.hide();
        scr.practicefinder.clear();
    }
};

scr.practicefinder.show = function(activatedBy, focus) {
    scr.practicefinder.activatedBy = activatedBy;
    if (!scr.practicefinder.isvisible()) {
        scr.practicefinder.hide();
        scr.practicefinder.clear();
        $(scr.practicefinder.SEARCH_PANEL_ID).show();
        $(scr.practicefinder.CONTAINER_ID).show();
    }
    scr.util.enablePlaceholderText();
    scr.util.recalcContentMargin();
    $(document).trigger("practiceFinder:show", []);

    if (focus) {
        scr.util.focusFirstField(scr.practicefinder.FORM_ID);
    }
};

scr.practicefinder.hide = function() {
    if (!scr.practicefinder.isvisible()) {
        return;
    }

    $(scr.practicefinder.CONTAINER_ID).hide();
    $(scr.practicefinder.SEARCH_PANEL_ID).hide();
    $(scr.practicefinder.RESULT_PANEL_ID).hide();
    scr.util.recalcContentMargin();
    $(document).trigger("practiceFinder:hide", []);
};

scr.practicefinder.clear = function() {
    scr.util.clearFormValidation(scr.practicefinder.FORM_ID);
};

scr.practicefinder.retry = function() {
    $(scr.practicefinder.RESULT_PANEL_ID).hide();
    $(scr.practicefinder.SEARCH_PANEL_ID).show();
    scr.util.recalcContentMargin();
};

scr.practicefinder.cancel = function() {
    scr.practicefinder.hide();
    scr.practicefinder.clear();
    scr.practicefinder.activatedBy = null;
};

scr.practicefinder._post = function(self) {
    var formData = self.closest('form').serializeArray();
    formData.push({
        name : self.attr('id'),
        value : true
    });
    scr.util.showLoadingModal();
    $.ajax({
        type : "POST",
        url : "practicefinder",
        data : formData,
        headers : {'X-SessionTokenId': sessionTokenId},
        success : function(data) {
            $(scr.practicefinder.CONTAINER_ID).replaceWith(data);
            $('#flashBanner').empty().append(
                    $(scr.practicefinder.DUMMY_FLASH_BANNER_ID).html());
            $(scr.practicefinder.DUMMY_FLASH_BANNER_ID).remove();
        },
        error : function(request, status, error) {
            common.session.flash('error', 'Sorry, there was a server error: '
                    + error);
        },
        complete : function() {
            scr.util.hideLoadingModal();
            if ($(scr.practicefinder.RESULT_PANEL_ID).length > 0) {
                $(scr.practicefinder.RESULT_PANEL_ID).show();
                $(scr.practicefinder.SEARCH_PANEL_ID).hide();
            } else {
                $(scr.practicefinder.RESULT_PANEL_ID).hide();
                $(scr.practicefinder.SEARCH_PANEL_ID).show();
            }

            scr.practicefinder.initalise(false);
            scr.practicefinder.show(scr.practicefinder.activatedBy, false);
        }
    });
};

scr.practicefinder.isvisible = function() {
    return scr.practicefinder._isSearchOpen()
            || scr.practicefinder._isResultsOpen();
};

scr.practicefinder._isSearchOpen = function() {
    return $(scr.practicefinder.CONTAINER_ID).is(':visible')
            && $(scr.practicefinder.SEARCH_PANEL_ID).is(':visible');
};

scr.practicefinder._isResultsOpen = function() {
    return $(scr.practicefinder.CONTAINER_ID).is(':visible')
            && $(scr.practicefinder.RESULT_PANEL_ID).is(':visible');
};

$(document).ready(scr.practicefinder.initalise(true));
