var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.FORMS = CKO.FORMS || {};
CKO.FORMS.ACTIONS = CKO.FORMS.ACTIONS || {};

CKO.FORMS.ACTIONS.VARIABLES = {
    newform: null,
    site: null,
    loc: String(window.location),
    waitmsg: null,
    ctx: null,
    web: null,
    list: null,
    listitem: null,
    user: null,
    userID: null,
    Org: null,
    customer: null,
    directives: null,
    standards: null,
    alignmentrequired: true,
    actionid: jQuery.QueryString["ID"],
    actiondate: jQuery.QueryString["Date"],
    selects: null
}

CKO.FORMS.ACTIONS.EditForm = function () {

    var v = CKO.FORMS.ACTIONS.VARIABLES;

    function Init(site) {
        SP.SOD.executeOrDelayUntilScriptLoaded(function () {
            RegisterSod('core.js', site + "/_layouts/1033/core.js");
            RegisterSod('cko.forms.overrides.js', site + "/SiteAssets/js/cko.forms.overrides.js");
            RegisterSodDep('core.js', 'sp.js');
            RegisterSodDep('cko.forms.overrides.js', 'core.js');
            EnsureScriptFunc("cko.forms.overrides.js", null, function () {
                CKO.FORMS.OVERRIDES().Init();
                FormLoaded(site);
            });
        }, "sp.js");
    }

    function FormLoaded(site) {
        v.site = site;
        loadCSS(site + '/SiteAssets/css/CEWP_Forms_ActionForms.css');
        v.directives = new Array();
        v.standards = new Array();
        $("input").addClass("form-control");
        $("select").addClass("form-control");
        $("div[role='textbox']").addClass("form-control");
        $("textarea").addClass("form-control");
        $("input[Title='Customer']").prop('readonly', true);

        $(".ms-cui-group").each(function () {
            switch ($(this).attr("id")) {
                case "Ribbon.ListForm.Edit.Commit":
                    $(this).css({ "display": "none" });
                    break;

                //case "Ribbon.ListForm.Edit.Actions":
                //    $(this).css({ "display": "none" });
                //    break;
            }
        });

        v.selects = new Array(); // hsn added
        // First build an array for the select controls for cascading functions

        $("select").each(function () {
            if ($(this).attr("data-function") === "cascadeselect") {
                var fields = null;
                if ($(this).attr("data-ddFields")) {
                    fields = String($(this).attr("data-ddFields"));
                    fields = fields.split(", ");
                }
                v.selects.push({
                    "id": $(this).attr("id"),
                    "cascadeto": $(this).attr("data-cascadeto"),
                    "cascadeval": "", // hsn
                    //"cascadeval": String($("input[title*='" + $("#" + $(this).attr("data-cascadeto")).attr("data-sourcefield") + "']").val()),
                    //set casdcade val based on non existant value. Instaed, loop thru select and find cascade val... in changeme
                    "source": $(this).attr("data-sourcefield"),
                    "sourceval": String($("input[title*='" + $(this).attr("data-sourcefield") + "']").val()),
                    "orderby": $(this).attr("data-orderby"), // not currently ordering just the field to display in the dropdown
                    "filter": $(this).attr("data-filterfield"),
                    "list": $(this).attr("data-lookuplist"),
                    "fields": fields,
                    "items": null
                })
            } else {
                if ($(this).attr("data-function") === "select") {
                    // update the select with the hidden field value if set
                    var selectval = String($("input[title*='" + $(this).attr("data-sourcefield") + "']").val());
                    if (selectval !== "null") {
                        $("#" + $(this).attr("id") + " option").each(function () {
                            if ($(this).html() === selectval) {
                                $(this).prop('selected', true);
                            }
                        });
                    }
                }
            }
        });

        // go get all dropdown data
        var monkey = LoadDropdowns();
        jQuery.when.apply(null, monkey).done(function () {
            logit("LoadDropdowns complete.");
            $("input[title='Title Required Field']").hide();
            $("select[title='EffortType']").on("change", function () {
                var type = $("#" + $(this).attr("id") + " option:selected").val();
                switch (type) {
                    case "Directive":
                        GetDirectives();
                        $("#ddDirective").show();
                        $("#ddStandard").hide();
                        $("#ddAlignment").hide();
                        $(".sagroup").hide();
                        $(".sogroup").hide();
                        $(".phase").show();
                        $("Phase").show();
                        break;

                    case "Standard":
                        GetStandards();
                        $("#ddDirective").hide();
                        $("#ddStandard").show();
                        $("#ddAlignment").show();
                        $(".sagroup").show();
                        $(".sogroup").show();
                        $(".phase").hide();
                        $("Phase").hide();
                        break;
                }
            });

            // Now load either the standards or directives based on the selected effortype
            var et = $("select[title='EffortType'] option:selected").val();
            switch (et) {
                case "Directive":
                    GetDirectives();
                    $("#ddDirective").show();
                    $("#ddStandard").hide();
                    $("#ddAlignment").hide();
                    $(".sagroup").hide();
                    $(".sogroup").hide();
                    $(".phase").show();
                    $("Phase").show();
                    break;

                case "Standard":
                    GetStandards();
                    $("#ddDirective").hide();
                    $("#ddStandard").show();
                    $("#ddAlignment").show();
                    $(".sagroup").show();
                    $(".sogroup").show();
                    $(".phase").hide();
                    $("Phase").hide();

                    var tortellini = String($("input[title*='Customer']").val());
                    tortellini = tortellini.split("|");

                    $("#ddSupportedOrg option").each(function () { // hsn
                        if ($(this).html() === tortellini[0]) {
                            $(this).prop('selected', true);
                        }
                    });

                    $("#ddSupportedOrg").attr("cval", tortellini[1]).change(); 
                    $(".sogroup").show(); // hsn/
                    break;
            }
            DataLoaded();
        });
    }

    function GetStandards() {
        // Load Standards from REST
        v.standards = [];
        var urlString = v.site + "/_vti_bin/listdata.svc/Standards?";
        urlString += "$select=Id,Standard,Task,StandardStatusValue,SupportParagraph,SupportedOrg,SupportedSubOrg";
        urlString += "&$filter=(StandardStatusValue eq 'Ongoing')";
        urlString += "&$orderby=Standard";

        jQuery.ajax({
            url: urlString,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                // to do implement logging to a central list
                logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                var numitems = data.d.results.length;
                logit("Standards Count: " + numitems);
                var opts = "<option value='666'>Select...</option>";
                for (var i = 0, length = j.length; i < length; i++) {
                    // Add to standard array so that we can display info based on selected standard
                    v.standards.push({
                        "ParentID": "STD" + j[i]["Id"],
                        "standard": j[i]["Standard"],
                        "description": j[i]["Task"],
                        "status": j[i]["StandardStatusValue"],
                        "paragraph": j[i]["SupportParagraph"],
                        "org": j[i]["SupportedOrg"],
                        "suborg": j[i]["SupportedSubOrg"]
                    });
                }
                // Now just loop back through the array to create the dropdown and pass the index as the value so we know which standard to get data for.
                for (i = 0; i < v.standards.length; i++) {
                    // if the title matches the option, select it
                    if (v.standards[i]["standard"] === $("input[title^='Title']").val()) {
                        opts += "<option selected value='" + i + "'>" + v.standards[i]["standard"] + "</option>";
                        // also need to set the description field
                        $("#divDescription").html("").append(v.standards[i]["description"]);
                    }
                    else {
                        opts += "<option value='" + i + "'>" + v.standards[i]["standard"] + "</option>";
                    }
                }
                $("#ddStandard").html("").append(opts);
                GetAlignments(); // hsn/
            }
        });
    }

    function GetDirectives() {
        // Load Directives From REST
        var urlString = v.site + "/_vti_bin/listdata.svc/Directives?";
        urlString += "$select=Id,Directive,DirectiveDescription,DirectiveStatusValue,ProjectedManHours,Expended,SupportParagraph,SupportReference";
        urlString += "&$filter=(DirectiveStatusValue eq 'InProgress') or (DirectiveStatusValue eq 'Complete') or (DirectiveStatusValue eq 'Pending Leadership Approval')";
        urlString += "&$orderby=Directive";

        jQuery.ajax({
            url: urlString,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                var numitems = data.d.results.length;
                logit("Directives Count: " + numitems);
                var opts = "<option value='Select...'>Select...</option>";
                for (var i = 0; i < j.length; i++) {
                    // Add to directive array so that we can display info based on selected directive
                    v.directives.push({
                        "ParentID": "DIR" + j[i]["Id"],
                        "directive": j[i]["Directive"],
                        "description": j[i]["DirectiveDescription"],
                        "status": j[i]["DirectiveStatusValue"],
                        "org": j[i]["SupportedOrg"],
                        "suborg": j[i]["SupportedSubOrg"],
                        "alignment": j[i]["SupportParagraph"] + " " + j[i]["SupportReference"]
                    });
                }
                // Now just loop back through the array to create the dropdown and pass the index as the value so we know which directive to get data for.
                for (i = 0; i < v.directives.length; i++) {
                    // if the title matches the option, select it
                    if (v.directives[i]["directive"] === $("input[title^='Title']").val()) {
                        opts += "<option selected value='" + i + "'>" + v.directives[i]["directive"] + "</option>";
                        // also need to set the description field
                        $("#divDescription").html("").append(v.directives[i]["description"]);
                    }
                    else {
                        opts += "<option value='" + i + "'>" + v.directives[i]["directive"] + "</option>";
                    }
                }
                $("#ddDirective").html("").append(opts);
            }
        });
    }

    function LoadDropdowns() {
        var deferreds = [];
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "Functions", "Title")).then(function (items) { CKO.CSOM.FillDropdowns2(items, "Title", ["ddFunction"], "Function"); }, function (sender, args) { logit("GetLookupData Failed 1, " + args.get_message()); }));
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "Enablers", "Title")).then(function (items) { CKO.CSOM.FillDropdowns2(items, "Title", ["ddEnabler"], "Enabler"); }, function (sender, args) { logit("GetLookupData Failed 2, " + args.get_message()); }));
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "Orgs", "Title")).then(function (items) { CKO.CSOM.FillDropdowns(items, "Title", ["ddSupportedOrg"]); }, function (sender, args) { logit("GetLookupData Failed 3, " + args.get_message()); }));
        return deferreds;
    }

    function Cascade() { // hsn added
        logit("Cascade Started");
        // All data loaded except need to get the dropdowns filtered and cascaded based on selected items
        var deferreds = [];
        for (var i = 0; i < v.selects.length; i++) {
            // If there is a source val then get the items to filter the cascaded select
            if (v.selects[i].sourceval !== "null") {
                $("#" + v.selects[i].id + " option").each(function () {
                    if ($(this).html() === v.selects[i].sourceval) {
                        $(this).prop('selected', true);
                    }
                });
                if (v.selects[i].fields !== null) {
                    deferreds.push($.when(CKO.CSOM.GetListItems.getitemsfilteredorderedandpassfieldstoelement("current", v.selects[i].list, v.selects[i].filter, v.selects[i].sourceval, v.selects[i].orderby, i, v.selects[i].fields)).then(function (items, i) {
                        if (items.get_count() > 0) {
                            v.selects[i].items = items;
                            var opts = "<option selected value='Select...'>Select...</option>";
                            var enumerator = items.getEnumerator();
                            var unique = "";
                            var text;
                            while (enumerator.moveNext()) {
                                var current = enumerator.get_current();
                                for (var z = 0; z < v.selects[i].fields.length; z++) {
                                    if (z === 0) {
                                        text = current.get_item(v.selects[i].fields[z]);
                                    }
                                    else {
                                        text += "-" + current.get_item(v.selects[i].fields[z]);
                                    }
                                }
                                // if there is a selected value set it here
                                if (v.selects[i].cascadeval === current.get_item(v.selects[i].orderby)) {
                                    opts += "<option selected value='" + current.get_item(v.selects[i].orderby) + "'>" + text + "</option>";
                                }
                                else {
                                    opts += "<option value='" + current.get_item(v.selects[i].orderby) + "'>" + text + "</option>";
                                }
                            }
                            // populate the child select with the options
                            $("#" + v.selects[i].cascadeto).html("").append(opts);
                        }
                    }, function (sender, args) {
                        logit("Error getting data for child dropdown: " + args.get_message());
                    }));
                }
                else {
                    deferreds.push($.when(CKO.CSOM.GetListItems.getitemsfilteredorderedandpasstoelement("current", v.selects[i].list, v.selects[i].filter, v.selects[i].sourceval, v.selects[i].orderby, i)).then(function (items, i) {
                        if (items.get_count() > 0) {
                            v.selects[i].items = items;
                            var opts = "<option selected value='Select...'>Select...</option>";
                            var enumerator = items.getEnumerator();
                            var unique = "";
                            while (enumerator.moveNext()) {
                                var current = enumerator.get_current();
                                // if there is a selected value set it here
                                if (v.selects[i].cascadeval === current.get_item(v.selects[i].orderby)) {
                                    opts += "<option selected value='" + current.get_item(v.selects[i].orderby) + "'>" + current.get_item(v.selects[i].orderby) + "</option>";
                                }
                                else {
                                    opts += "<option value='" + current.get_item(v.selects[i].orderby) + "'>" + current.get_item(v.selects[i].orderby) + "</option>";
                                }
                            }
                            // populate the child select with the options
                            $("#" + v.selects[i].cascadeto).html("").append(opts);
                        }
                    }, function (sender, args) {
                        logit("Error getting data for child dropdown: " + args.get_message());
                    }));
                }
            }
        }
        return deferreds;
    }

    function DataLoaded() {

        //$("#divMaintenance").show();

        logit("Data Loaded");

        $("#btnSave").on("click", function () {
            SaveAction();
        });

        $("#btnCancel").on("click", function () {
            CancelAction();
        });

        $("#imgSkill").on("click", function () {
            $.fn.SPSTools_TermSetDialog({
                title: 'Select Skill',
                termstoreid: '0f9c5a00-81d6-4d7b-97c4-19319874f189',
                termsetid: '9f921997-cab1-47fd-9eb4-cb775840fdf6',
                weburl: _spPageContextInfo.webServerRelativeUrl,
                initialtext: $("input[title*='SkillTitle']").val(),
                callback: function (result) {
                    $("input[title*='SkillTitle']").val(result);
                }
            });
        });

        $(".ms-cui-ctl-large").each(function () {
            switch ($(this).attr("id")) {
                case "Ribbon.ListForm.Edit.Actions.DeleteItem-Large":
                    //$(this).css({ "border": "1px solid red" });
                    var $cloned = $(this).clone();
                    $cloned.attr("id", "Sausage")
                    $(this).parent().append($cloned);
                    $(this).remove();
                    break;
            }
        });

        // user assistance hide
        $(".ms-description").each(function (idx) {
            $(this).hide();
        });

        //user assistance show and hide
        $("input[title='Enabler']").hide();
        $("input[title*='Function']").hide();
        $("span").each(function () {
            if ($(this).html().indexOf("Displays your user name.") === 0) { $(this).hide(); }
        });

        //user assistance show and hide
        $("#toggleHelp").click(function (e) {
            e.preventDefault();
            if ($(this).hasClass("showing")) {
                $(".ms-description").hide();
                $(this).removeClass("showing");
            }
            else {
                $(".ms-description").show();
                $(this).addClass("showing");
            }
        });

        $("#Sausage").attr("onclick", "").attr("href", "#").on("click", function (e) {
            e.preventDefault();
            //alert("Delete Item: " + v.actionid);
            $().SPSTools_Notify({
                type: 'yesno',
                content: 'Are you sure you want to delete the item?<br/><br/>',
                callback: function (r) {
                    switch (r) {
                        case "Yes":
                            v.ctx = new SP.ClientContext.get_current();
                            v.list = v.ctx.get_web().get_lists().getByTitle("Actions");
                            v.listitem = v.list.getItemById(v.actionid);
                            v.listitem.deleteObject();
                            v.ctx.executeQueryAsync(function () {
                                var returndata = [];
                                returndata[0] = "Refresh";
                                returndata[1] = "Action Deleted";
                                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.OK, returndata);
                            }, function (sender, args) { alert("Error Deleting Item"); });
                            break;

                        case "No":
                            // TODO: Do we cancel here or just do nothing?
                            break;
                    }
                }
            });
        });
    }

    function AlignmentsLoaded() {
        logit("Alignments Loaded");
        $("#ddAlignment").on("change", function () {
            var salignment = $("#ddAlignment option:selected").val();
            $("input[title='SupportAlignment']").val(salignment);
            var ld = $("#ddAlignment option:selected").attr("data-ld");
            $("#divSADescription").html("").append(ld);
        });
    }

    function GetAlignments() {
        var idx = $("#ddStandard option:selected").val();
        var standard = v.standards[idx]["standard"];
        var paragraph = v.standards[idx]["paragraph"];
        logit("GetAlignments: standard-" + standard + ", paragraph-" + paragraph);
        if (v.standards[idx]["paragraph"] !== "N/A") {
            // Now get the support alignments from the Alignments table using REST
            var urlString = v.site + "/_vti_bin/listdata.svc/Alignments?";
            urlString += "$select=Id,Parent,Paragraph,Reference,Description,ShortDescription";
            //urlString += "&$filter=(Parent eq '" + paragraph + "')";
            urlString += "&$filter=startswith(Parent, '" + paragraph + "')";
            logit("Alignments urlString: " + urlString);

            jQuery.ajax({
                url: urlString,
                method: "GET",
                headers: { 'accept': 'application/json; odata=verbose' },
                error: function (jqXHR, textStatus, errorThrown) {
                    //to do implement logging to a central list
                    logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
                },
                success: function (data) {
                    var results = data.d.results;
                    var j = jQuery.parseJSON(JSON.stringify(results));
                    var numitems = data.d.results.length;
                    logit("Alignments Count: " + numitems);
                    var alignment = String($("input[title='SupportAlignment']").val());
                    var opts = "";
                    if (alignment !== "undefined" && alignment !== "null" && alignment !== "") {
                        for (var i = 0, length = j.length; i < length; i++) {
                            var opt = j[i]["Paragraph"] + " " + j[i]["ShortDescription"];
                            logit("alignment: " + alignment + ", opt: " + opt);
                            if (opt === alignment) {
                                opts += "<option data-ld='" + j[i]["Description"] + "' selected value='" + opt + "'>" + opt + "</option>";
                                $("#divSADescription").html("").append(j[i]["Description"]);

                            }
                            else {
                                opts += "<option data-ld='" + j[i]["Description"] + "' value='" + opt + "'>" + opt + "</option>";
                            }
                        }
                    }
                    else {
                        opts += "<option selected value='Select...'>Select...</option>";
                        for (i = 0; i < j.length; i++) {
                            opt = j[i]["Paragraph"] + " " + j[i]["ShortDescription"];
                            opts += "<option data-ld='" + j[i]["Description"] + "' value='" + opt + "'>" + opt + "</option>";

                        }
                    }
                    $("#ddAlignment").html("").append(opts);

                    var salignment = $("#ddAlignment option:selected").val(); // hsn
                    $("input[title='SupportAlignment']").val(salignment);
                    var ld = $("#ddAlignment option:selected").attr("data-ld");
                    $("#divSADescription").html("").append(ld); // hsn/

                    $(".sagroup").show();
                    AlignmentsLoaded();
                }
            });
        }
        else {
            // Support alignment would not be required for this standard
            logit("ALIGNMENT NOT REQUIRED");
            v.alignmentrequired = false;
            $(".sagroup").hide();
            $("input[title^='SupportAlignment']").val("N/A").closest(".form-group").hide(); // just set the support alignment to NA
        }
    }

    function changeme(obj) {
        var f = $("#" + obj.id).attr("data-function");
        var cval = $("#" + obj.id).attr("cval") !== null || $("#" + obj.id).attr("cval") !== '' ? $("#" + obj.id).attr("cval") : null;
        logit("cval: " + cval);
        logit("Change called on: " + obj.id + ", function: " + f);
        switch (f) {
            case "cascadeselect":
                // loop through the selects array and then do another query and update of the values. Then update the source value to the changed select value( this is the hidden form field)
                for (var i = 0; i < v.selects.length; i++) {
                    if (v.selects[i].id === obj.id) {
                        // this is the changed select update the source value and get the new items
                        v.selects[i].sourceval = $("#" + obj.id + " option:selected").val();
                        $("input[title*='" + $("#" + obj.id).attr("data-sourcefield") + "']").val(v.selects[i].sourceval);
                        if (v.selects[i].fields !== null) {
                            $.when(CKO.CSOM.GetListItems.getitemsfilteredorderedandpassfieldstoelement("current", v.selects[i].list, v.selects[i].filter, v.selects[i].sourceval, v.selects[i].orderby, i, v.selects[i].fields)).then(function (items, i) {
                                if (items.get_count() > 0) {
                                    v.selects[i].items = items;
                                    if (cval === null) {
                                        var opts = "<option selected value='Select...'>Select...</option>";
                                    }
                                    else {
                                        var opts = "<option value='Select...'>Select...</option>";
                                    }
                                    var enumerator = items.getEnumerator();
                                    var unique = "";
                                    var text;
                                    while (enumerator.moveNext()) {
                                        var current = enumerator.get_current();
                                        for (var z = 0; z < v.selects[i].fields.length; z++) {
                                            if (z === 0) {
                                                text = current.get_item(v.selects[i].fields[z]);
                                            }
                                            else {
                                                text += "-" + current.get_item(v.selects[i].fields[z]);
                                            }
                                        }
                                        if (cval === null) {
                                            opts += "<option value='" + current.get_item(v.selects[i].orderby) + "'>" + text + "</option>";
                                        }
                                        else {
                                            if (current.get_item(v.selects[i].orderby) === cval) {
                                                opts += "<option selected value='" + current.get_item(v.selects[i].orderby) + "'>" + text + "</option>";
                                            }
                                            else {
                                                opts += "<option value='" + current.get_item(v.selects[i].orderby) + "'>" + text + "</option>";
                                            }
                                        }
                                    }
                                    // populate the child select with the options
                                    $("#" + v.selects[i].cascadeto).html("").append(opts);
                                }
                            }, function (sender, args) {
                                logit("Error getting data for child dropdown: " + args.get_message());
                            });
                        } else {
                            $.when(CKO.CSOM.GetListItems.getitemsfilteredorderedandpasstoelement("current", v.selects[i].list, v.selects[i].filter, v.selects[i].sourceval, v.selects[i].orderby, i)).then(function (items, i) {
                                if (items.get_count() > 0) {
                                    v.selects[i].items = items;
                                    if (cval === null) {
                                        var opts = "<option selected value='Select...'>Select...</option>";
                                    }
                                    else {
                                        var opts = "<option value='Select...'>Select...</option>";
                                    }
                                    var enumerator = items.getEnumerator();
                                    var unique = "";
                                    while (enumerator.moveNext()) {
                                        var current = enumerator.get_current();
                                        if (current.get_item(v.selects[i].orderby) === cval) {
                                            opts += "<option selected value='" + current.get_item(v.selects[i].orderby) + "'>" + current.get_item(v.selects[i].orderby) + "</option>";
                                        }
                                        else {
                                            opts += "<option value='" + current.get_item(v.selects[i].orderby) + "'>" + current.get_item(v.selects[i].orderby) + "</option>";
                                        }
                                    }
                                    // populate the child select with the options
                                    $("#" + v.selects[i].cascadeto).html("").append(opts);
                                }
                            }, function (sender, args) {
                                logit("Error getting data for child dropdown: " + args.get_message());
                            });
                        }
                    }
                }
                break;

            case "updatesource": // hsn
                // If the update source attr = Change Customer to change how input works

                if ($("#" + obj.id).attr("data-sourcefield") === "Customer") {
                    $("input[title*='" + $("#" + obj.id).attr("data-sourcefield") + "']").val($("#ddSupportedOrg option:selected").val() + "|" + $("#ddSupportedSubOrg option:selected").val());
                } else {
                    // update the source field with the selected value
                    $("input[title*='" + $("#" + obj.id).attr("data-sourcefield") + "']").val($("#" + obj.id + " option:selected").val());
                }
                break;

            case "select":
                // update the source field with the selected value
                $("input[title*='" + $("#" + obj.id).attr("data-sourcefield") + "']").val($("#" + obj.id + " option:selected").val());
                break;
        }

        switch (obj.id) {
            case "ddStandard":
                // Set the hidden title field to the selected Standard
                var idx = $("#" + obj.id + " option:selected").val();
                var standard = v.standards[idx]["standard"];
                $("input[title^='Title']").val(standard);
                $("#divDescription").html("").append(v.standards[idx]["description"]);
                $("input[title*='Customer']").val(v.standards[idx]["org"] + "|" + v.standards[idx]["suborg"]);
                $("input[title*='ParentID']").val(v.standards[idx]["ParentID"]);

                $("#ddSupportedOrg option").each(function () { // hsn
                    if ($(this).html() === v.standards[idx]["org"]) {
                        $(this).prop('selected', true);
                    }
                });

                $("#ddSupportedOrg").attr("cval", v.standards[idx]["suborg"]).change(); // hsn
                $(".sogroup").show(); // hsn/
                $(".phase").show();
                $("Phase").show();

                GetAlignments();
                break;

            case "ddDirective":
                // Set the hidden title field to the selected Directive and display the description
                idx = $("#" + obj.id + " option:selected").val();
                $("input[title='Title Required Field']").val(v.directives[idx]["directive"]);
                $("#divDescription").html("").append(v.directives[idx]["description"]);
                $("input[title*='Customer']").val(v.directives[idx]["org"] + "|" + v.directives[idx]["suborg"]);
                $("input[title='SupportAlignment']").val(v.directives[idx]["alignment"]);
                $("input[title*='ParentID']").val(v.directives[idx]["ParentID"]);
                $("input[title*='Phase']").val(v.directives[idx]["Phase"]);
                break;

            case "ddEnabler":
                $("input[title='Enabler Required Field']").val($("#ddEnabler option:selected").val());
                break;

            case "ddFunction":
                $("input[title='Function Required Field']").val($("#ddFunction option:selected").val());
                break;

            //case "Phase":
            //    $("input[title='Phase']").val($("#Phase option:selected").val());
            //    break;
        }
    }

    function SaveAction() {
        $("#FormError").remove();
        v.errortext = "Please fill out the fields: ";
        var goon = true;
        if ($("input[title='SupportAlignment']").val() === "" && $("select[title='EffortType'] option:selected").val() === "Standard") {
            if (v.alignmentrequired === true) {
                goon = false;
                v.errortext += "Support Alignment ";
            }
            else {
                $("input[title='SupportAlignment']").val("N/A").parent().parent().hide(); // just set the support alignment to NA
            }
        }
        if ($("#ddStandard option:selected").val() === "Select..." && $("select[title='EffortType'] option:selected").val() === "Standard") {
            goon = false;
            v.errortext += "Objective ";
        }
        if ($("#ddDirective option:selected").val() === "Select..." && $("select[title='EffortType'] option:selected").val() === "Directive") {
            goon = false;
            v.errortext += "Objective ";
        }
        if ($("#Phase option:selected").val() === "" && $("select[title='EffortType'] option:selected").val() === "Directive") {
            goon = false;
            v.errortext += "Phase ";
        }
        var skill = $("div[data-field='Skill']").find(".valid-text").text();
        if ($("input[title='Enabler Required Field']").val() === "Select..." || $("input[title='Enabler Required Field']").val() === "") {
            goon = false;
            v.errortext += "Enabler ";
        }
        if ($("input[title='Function Required Field']").val() === "Select..." || $("input[title='Function Required Field']").val() === "") {
            goon = false;
            v.errortext += "Function ";
        }
        if ($("textarea[title*='Comments']").val().trim().length <= 5) {
            goon = false;
            v.errortext += "Comments ";
        }
        if ($("input[title*='Date Completed']").val() === "") {
            goon = false;
            v.errortext += "Date Completed ";
        }
        if ($("input[title*='Expended']").val() === "") {
            goon = false;
            v.errortext += "Time ";
        }
        var picker = String($("div [title='People Picker']").html());
        if (picker.length <= 0) {
            goon = false;
            v.errortext += "User ";
        }
        if ($("select[title='Organization Required Field']").val() === "") {
            goon = false;
            v.errortext += "User Org ";
        }
        if ($("select[title='PersonType Required Field']").val() === "") {
            goon = false;
            v.errortext += "User Type ";
        }
        if (goon === true) {
            $(window).on('unload', function () {
                var returndata = [];
                returndata[0] = "Refresh";
                returndata[1] = "Action Added";
                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.OK, returndata);
            });
            $("input[id*='SaveItem']").trigger('click');
        }
        else {
            var ehtml = "<li id='FormError' class='ms-cui-group' style='width: 400px; background-color: red;'>";
            ehtml += "<div class='container-fluid' style='padding: 36px; text-align: center; color: black; font-size: 16px;'>";
            ehtml += v.errortext + "</div></li>";
            $("ul[id='Ribbon.ListForm.Edit']").append(ehtml);
            v.errortext = "Please fill out the fields: ";
        }
    }

    function CancelAction() {
        SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.cancel);
    }

    return {
        Init: Init,
        changeme: changeme
    }
}

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Forms_EditActionForm.js');