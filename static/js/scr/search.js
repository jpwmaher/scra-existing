////////////////////////////////////////////////////////////////////////
// NAMESPACE scr.search
// Functions used in the search forms
////////////////////////////////////////////////////////////////////////

// ensure namespace exists
if (typeof scr === "undefined") {
    var scr = {};
}
if (typeof scr.search === "undefined") {
    scr.search = {};
}

// //////////////////////////////////////////////////////////////////////


scr.search.initialise = function() {
    scr.search.initialisePracticeFinder();
    scr.search.initialiseAddressFinder();
    
    $('#clearBasicSearchBtn').off("click").on("click", function(event) {
        scr.util.clearFormValidation('#basicSearchForm');
        scr.util.removeFlashMessage();
        $('#addresssummary_basicsearch').html('');
    });
    
    $('#nhsNumberClearBtn').off("click").on("click", function(event) {
        scr.util.clearFormValidation('#nhsNumberSearchForm');
        scr.util.removeFlashMessage();
    });
};

scr.search.initialisePracticeFinder = function() {
    $(document).off("practiceFinder:show");
    $(document).on("practiceFinder:show", function(event) {
        $('.help-panel').hide();
        scr.addressfinder.cancel();
    });

    $(document).off("practiceFinder:hide");
    $(document).on("practiceFinder:hide", function(event) {
        scr.search.showHelpIfRequired();
    });

    $(document).off("practiceFinder:clear");
    $(document).on("practiceFinder:clear", function(event) {
        scr.util.removeFlashMessage();
    });

    $(document).off("practiceFinder:cancel");
    $(document).on("practiceFinder:cancel", function(event) {
        scr.util.removeFlashMessage();
    });

    $(document).off('practiceFinderResult:changed');
    $(document)
            .on(
                    'practiceFinderResult:changed',
                    function(event, row, activatedBy) {
                        var $row = $(row);

                        // extract data stored on the row
                        var practiceCode = $row.data("code");
                        var summary = $row.data("summary");

                        // apply information back on the search form
                        $('#practicecode').val(practiceCode);
                        $('#practiceSummary').val(summary);
                        $('#practicesummary')
                                .text(summary)
                                .append(
                                        '<input name="gpPracticeCodeClearBtn" id="gpPracticeCodeClearBtn" type="submit" title="Clear" class="btn btn-link" value="Clear"/>');

                        $('#gpPracticeCodeClearBtn').bind('click',
                                function(event) {
                                    event.preventDefault();
                                    $('#practicecode').val('');
                                    $('#practiceSummary').val('');
                                    $('#practicesummary').text('').empty();
                                    $(this).unbind('click');
                                });
                    });
};

scr.search.initialiseAddressFinder = function() {
    $(document).off("addressFinder:show");
    $(document).on("addressFinder:show", function(event) {
        $('.help-panel').hide();
        scr.practicefinder.cancel();
    });

    $(document).off("addressFinder:hide");
    $(document).on("addressFinder:hide", function(event) {
        scr.search.showHelpIfRequired();
    });

    $(document).off("addressFinder:clear");
    $(document).on("addressFinder:clear", function(event) {
        scr.util.removeFlashMessage();
    });

    $(document).off("addressFinder:cancel");
    $(document).on("addressFinder:cancel", function(event) {
        scr.util.removeFlashMessage();
    });

    $(document).off('addressFinderResult:changed');
    $(document).on('addressFinderResult:changed',
            function(event, row, activatedBy) {
                var $row = $(row);

                // extract data stored on the row
                var postcode = $row.data('postcode');
                var paf = $row.data('paf');
                var summary = $row.data('summary');

                // apply it to the relevant form fields
                $('input[name=postcode]').val(postcode);

                $('#addressPaf_basicsearch').val(paf);
                $('#addressPaf_advancedsearch').val(paf);
                $('#addressPaf_postcodesearch').val(paf);
                $('#addressPaf_allocatesearch').val(paf);

                $('#addressSummary_basicsearch').val(summary);
                $('#addressSummary_advancedsearch').val(summary);
                $('#addressSummary_postcodesearch').val(summary);
                $('#addressSummary_allocatesearch').val(summary);

                $('#addresssummary_basicsearch').text(summary);
                $('#addresssummary_advancedsearch').text(summary);
                $('#addresssummary_postcodesearch').text(summary);
                $('#addresssummary_allocatesearch').text(summary);

                // allocate
                $('#address1_allocatesearch').val($row.data('address1'));
                $('#address2_allocatesearch').val($row.data('address2'));
                $('#address3_allocatesearch').val($row.data('address3'));
                $('#town_allocatesearch').val($row.data('town'));
            });
};

scr.search.activateTabPane = function(tabName) {
    // find the corresponding tab
    var tab = $('#searchTabs a[href="#' + tabName + 'search"]');

    // make sure screen readers know which tab is selected
    $('#searchTabs a').attr('aria-selected', 'false');
    tab.attr('aria-selected', 'true');
    tab.tab('show');
    if (tab.attr('id') === 'allocateTab') {
        scr.search.setAllocateTabHeaders();
    } else {
        scr.search.setSearchTabsHeaders(tabName);
    }

    scr.practicefinder.cancel();
    scr.addressfinder.cancel();
    scr.util.recalcContentMargin();

    // Only show the relevant help panel
    $('.help-panel>div').hide();
    var activeHelpPanel = '#' + tabName + 'SearchHelp';
    $(activeHelpPanel).show();

    $('meta[scra-help-link]').attr('scra-help-link', 'findpatient' + tabName);
};

scr.search.setAllocateTabHeaders = function() {
    // Set Title and headers for allocate tab
    $(document).attr('title',
            'NHS Summary Care Record - Allocate new NHS Number');
    // Set header
    $("div[role='banner'] h1").text("Allocate a new NHS number");
    // Set header description
    $("div[role='banner'] p.lead").text(
            "Please enter the patient's details to allocate a new NHS number");
};

scr.search.setSearchTabsHeaders = function(tabName) {
    // Set Title and headers for search tabs(Basic,Advanced,Postcode)
    $(document).attr('title',
            'NHS Summary Care Record - Find a patient (' + tabName + ')');
    // Set header
    $("div[role='banner'] h1").text("Find a patient");
    // Set header description
    $("div[role='banner'] p.lead")
            .html(
                    "Please search for a patient by either entering their details or <a href='#nhsNumber' id='linkNHSFocus'>NHS number</a>");
    // Attach tab handlers so that clicking on NHS number moves to basic tab and
    // moves the focus to NHS number text box
    scr.search.attachTabHandlers();
};

scr.search.attachTabHandlers = function() {
    // focus on the appropriate tab when the tab link is clicked
    $('#searchTabs a').unbind('click').bind('click', function(event) {
        // swallow event
        event.preventDefault();
        event.stopPropagation();

        // Do nothing else if the tab is disabled.
        if (!$(this).hasClass("disabled")) {
            scr.search.setCommonFields();
            // get the tab name from the tab link and activate it
            var tabName = event.target.id.replace('Tab', '');
            scr.search.activateTabPane(tabName);
            // if there was validation error then the error message should be
            // removed
            scr.util.removeFlashMessage();
            $('.help-panel').show();
            // return focus to the tab control
            // NOTE: we call this as an "instant" timeout to avoid this being
            // ignored in Chrome
            setTimeout(function() {
                $(event.target).focus();
            }, 0);
        }
    });

    // install keyboard handlers on the links to make them click like buttons
    $('#searchTabs a').keydown(scr.util.keyboardClickHandler);

    // make clicking on the "NHS Number" link text switch to basic search
    $('#linkNHSFocus').unbind('click').bind('click', function(event) {
        $('#searchTabs a[href="#basicsearch"]').click();
        // Because the click handler called above uses a timeout of zero to
        // ensure
        // that the focus is on the tab header, we need to delay a fraction of a
        // second to then switch focus to the input field.
        setTimeout(function() {
            $("input[id='nhsNumber']").focus();
        }, 50);
    });

    // Navigate to the advanced tab
    $('.advancedSearchTab').unbind('click').bind('click', function(event) {
        $("#advancedTab").click();
    });
};

scr.search.setCommonFields = function() {
    var oldTab = $('#searchTabs li.active a');
    var oldSearchType = oldTab.attr('href').substring(1);

    var firstname = $('#givenname_' + oldSearchType).val();
    var surname = $('#surname_' + oldSearchType).val();
    // IE7 Fix - cannot use $("#basicsearch input[name='gender']:checked).val()
    // in IE7
    var gender = $("input[name='gender']:checked", $("#" + oldSearchType))
            .val();
    var postcode = $('#postcode_' + oldSearchType).val();
    var dateOfBirth = null;
    if (oldSearchType === 'basicsearch') {
        dateOfBirth = $('#dateofbirth_basicsearch').val();
        gender = $("input[name='gender_basicsearch']:checked",
                $("#" + oldSearchType)).val();
    } else if (oldSearchType === 'advancedsearch') {
        dateOfBirth = $('#dateofbirthfrom').val();
    } else if (oldSearchType === 'allocatesearch') {
        dateOfBirth = $('#dateofbirth_allocatesearch').val();
        gender = $("input[name='gender_allocatesearch']:checked",
                $("#" + oldSearchType)).val();
    }

    $('#givenname_basicsearch').val(firstname);
    $('#givenname_advancedsearch').val(firstname);
    $('#givenname_postcodesearch').val(firstname);
    $('#givenname_allocatesearch').val(firstname);

    $('#surname_basicsearch').val(surname);
    $('#surname_advancedsearch').val(surname);
    $('#surname_postcodesearch').val(surname);
    $('#surname_allocatesearch').val(surname);

    // IE7 Fix
    $("input[name='gender_basicsearch'][value='" + gender + "']",
            $("#basicsearch")).attr('checked', true);
    $("input[name='gender'][value='" + gender + "']", $("#advancedsearch"))
            .attr('checked', true);
    $("input[name='gender'][value='" + gender + "']", $("#postcodesearch"))
            .attr('checked', true);
    $("input[name='gender_allocatesearch'][value='" + gender + "']",
            $("#allocateSearchForm")).attr('checked', true);

    $('#postcode_basicsearch').val(postcode);
    $('#postcode_advancedsearch').val(postcode);
    $('#postcode_postcodesearch').val(postcode);
    $('#postcode_allocatesearch').val(postcode);

    if (dateOfBirth !== null) {
        $('#dateofbirth_basicsearch').val(dateOfBirth);
        $('#dateofbirthfrom').val(dateOfBirth);
        $('#dateofbirth_allocatesearch').val(dateOfBirth);
    }
};

scr.search.activateStartingTabPane = function() {
    // decide which tab to display on load - default to basic search
    var startTab = 'basic';
    // unless another tab has been remembered from a previous request
    if ($('#activeTab').val()) {
        startTab = $('#activeTab').val().replace('search', '');
    }
    scr.search.activateTabPane(startTab);
    if (scr.addressfinder.isvisible() || scr.practicefinder.isvisible()) {
        $('.help-panel').hide();
    } else {
        $('.help-panel').show();
    }
};

scr.search.installAllocateTabListener = function() {
    // decide which tab to display on load - default to basic search
    var enabled = 'False';
    // unless another tab has been remembered from a previous request
    if ($('#allocateEnabled').val()) {
        enabled = $('#allocateEnabled').val();
    }

    $('#allocateTab').toggleClass('disabled', enabled != 'True');
};

scr.search.replaceDefaultKeyboardSubmitHandlers = function() {
    // set up keyboard <enter> handlers to trigger the appropriate search buttons
    scr.util.setFormDefaultSubmitButton('basicSearchForm', 'basicSearchBtn');
    scr.util.setFormDefaultSubmitButton('nhsNumberSearchForm', 'nhsNumberSearchBtn');
    scr.util.setFormDefaultSubmitButton('advancedSearchForm', 'advancedSearchBtn');
    scr.util.setFormDefaultSubmitButton('postcodeSearchForm', 'postCodeSearchBtn');
    scr.util.setFormDefaultSubmitButton('allocateSearchForm', 'allocateNHSNumberBtn');
};

scr.search.isSidePanelOpen = function() {
    return ($('#sidePanel *').length > 0);
};

scr.search.focusOnSidePanelIfOpen = function() {
    if (scr.search.isSidePanelOpen()) {
        // focus on the first input field on the side panel form
        scr.util.focusFirstField('#sidePanel form');
    }
};

scr.search.showHelpIfRequired = function() {
    if (!scr.addressfinder.isvisible() && !scr.practicefinder.isvisible()) {
        $('.help-panel').show();
    }
};
