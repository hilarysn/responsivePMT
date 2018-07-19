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
    actiondate: jQuery.QueryString["Date"]
};

CKO.FORMS.ACTIONS.EditForm = function () {

    var v = CKO.FORMS.ACTIONS.VARIABLES;

    function Init(site) {
        SP.SOD.executeOrDelayUntilScriptLoaded(function () {
            RegisterSod('core.js', site + "/_layouts/1033/core.js");
            RegisterSod('cko.forms.overrides2.js', site + "/SiteAssets/js/cko.forms.overrides2.js");
            RegisterSodDep('core.js', 'sp.js');
            RegisterSodDep('cko.forms.overrides2.js', 'core.js');
            EnsureScriptFunc("cko.forms.overrides2.js", null, function () {
                CKO.FORMS.OVERRIDES().Init();
                FormLoaded(site);
            });
        }, "sp.js");
    }

    function FormLoaded(site) {
        v.site = site;
        loadCSS(site + '/SiteAssets/css/CEWP_Forms_ActionForms.css');

        //qsdate = jQuery.QueryString["Date"];
        //v.userID = _spPageContextInfo.userId;
        //console.log("userID = " + v.UserID);

        v.directives = new Array();
        v.standards = new Array();
        $("input").addClass("form-control");
        $("select").addClass("form-control");
        $("div[role='textbox']").addClass("form-control");
        $("input[Title='Customer']").prop('readonly', true);

        $(".ms-cui-group").each(function () {
            switch ($(this).attr("id")) {
                case "Ribbon.ListForm.Edit.Commit":
                    $(this).css({ "display": "none" });
                    break;

                case "Ribbon.ListForm.Edit.Actions":
                    $(this).css({ "display": "none" });
                    break;
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
                        $("#ddStandard").hide();
                        $("#ddAlignment").parent().parent().hide();
                        $(".sagroup").hide();
                        $("#ddDirective").show();
                        $("#ddPhase").parent().parent().show();
                        $(".phgroup").show();
                        break;

                    case "Standard":
                        GetStandards();
                        $("#ddDirective").hide();
                        $("#ddPhase").parent().parent().hide();
                        $(".phgroup").hide();
                        $("#ddStandard").show();
                        $(".sagroup").show();
                        $("#ddAlignment").parent().parent().show();
                        break;
                }
            });
            // Now load either the standards or directives based on the selected effortype
            var et = $("select[title='EffortType'] option:selected").val();
            switch (et) {
                case "Directive":
                    GetDirectives();
                    $("#ddDirective").show();
                    $("#ddPhase").parent().parent().show();
                    $(".phgroup").show();
                    $("#ddStandard").hide();
                    $(".sagroup").hide();
                    break;

                case "Standard":
                    GetStandards();
                    $("#ddDirective").hide();
                    $("#ddPhase").parent().parent().hide();
                    $(".phgroup").hide();
                    $("#ddStandard").show();
                    $("#ddAlignment").parent().parent().show();
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
                        "parentID": "STD" + j[i]["Id"],
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
                GetAlignments();
            }
        });
    }

    function GetDirectives() {
        // Load Directives From REST
        var urlString = v.site + "/_vti_bin/listdata.svc/Directives?";
        urlString += "$select=Id,Directive,DirectiveDescription,DirectiveStatusValue,ProjectedManHours,Expended,SupportParagraph,SupportReference";
        urlString += "&$filter=(DirectiveStatusValue eq 'InProgress') or (DirectiveStatusValue eq 'Complete')";
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
                        "parentID": "DIR" + j[i]["Id"],
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
        if (idx !== "Select...") {
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
                                if (opt === alignment) {
                                    opts += "<option data-ld='" + j[i]["Description"] + "' selected value='" + opt + "'>" + opt + "</option>";
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
    }

    function LoadDropdowns() {
        var deferreds = [];
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "Functions", "Title")).then(function (items) { CKO.CSOM.FillDropdowns2(items, "Title", ["ddFunction"], "Function"); }, function (sender, args) { logit("GetLookupData Failed 1, " + args.get_message()); }));
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "Enablers", "Title")).then(function (items) { CKO.CSOM.FillDropdowns2(items, "Title", ["ddEnabler"], "Enabler"); }, function (sender, args) { logit("GetLookupData Failed 2, " + args.get_message()); }));
        return deferreds;
    }

    function DataLoaded() {
        logit("Data Loaded");

        $("#btnSave").on("click", function () {
            SaveAction();
        });

        $("#btnCancel").on("click", function () {
            CancelAction();
        });

        $(".ms-cui-ctl-large").each(function () {
            switch ($(this).attr("id")) {
                case "Ribbon.ListForm.Edit.Actions.DeleteItem-Large":
                    //$(this).css({ "border": "1px solid red" });
                    var $cloned = $(this).clone();
                    $cloned.attr("id", "Sausage");
                    $(this).parent().append($cloned);
                    $(this).remove();
                    break;
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

    function changeme(obj) {
        switch (obj.id) {
            case "ddStandard":
                // Set the hidden title field to the selected Standard
                var idx = $("#" + obj.id + " option:selected").val();
                var standard = v.standards[idx]["standard"];
                $("input[title^='Title']").val(standard);
                $("#divDescription").html("").append(v.standards[idx]["description"]);
                $("input[title*='Customer']").val(v.standards[idx]["org"] + "|" + v.standards[idx]["suborg"]);
                $("input[title*='ParentID']").val(v.standards[idx]["ParentID"]);
                $("#ddDirective").hide();
                $("#ddPhase").parent().parent().hide();
                $(".phgroup").hide();
                $("#ddStandard").show();
                $("#ddAlignment").parent().parent().show();
                GetAlignments();
                break;

            case "ddDirective":
                // Set the hidden title field to the selected Directive and display the description
                idx = $("#" + obj.id + " option:selected").val();
                $("input[title='Title Required Field']").val(v.directives[idx]["directive"]);
                $("#divDescription").html("").append(v.directives[idx]["description"]);
                $("input[title*='Customer']").val(v.directives[idx]["org"] + "|" + v.directives[idx]["suborg"]);
                $("input[title='SupportAlignment']").val(v.directives[idx]["alignment"]);
                $("input[title*='ParentID']").val(v.directives[idx]["parentid"]);
                $("#ddStandard").hide();
                $(".sagroup").hide();
                $("#ddDirective").show();
                $("#ddPhase").parent().parent().show();
                $(".phgroup").show();
                break;

            case "ddEnabler":
                $("input[title='Enabler Required Field']").val($("#ddEnabler option:selected").val());
                break;

            case "ddFunction":
                $("input[title='Function Required Field']").val($("#ddFunction option:selected").val());
                break;
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
        }
        if ($("#ddStandard option:selected").val() === "Select..." && $("select[title='EffortType'] option:selected").val() === "Standard") {
            goon = false;
            v.errortext += "Objective ";
        }
        if ($("#ddDirective option:selected").val() === "Select..." && $("select[title='EffortType'] option:selected").val() === "Directive") {
            goon = false;
            v.errortext += "Objective ";
        }
        if ($("#ddPhase option:selected").val() === null && $("select[title='EffortType'] option:selected").val() === "Directive"){
            goon = false;
            v.errortext += "Phase ";
        }
        var skill = $("div[data-field='Skill']").find(".valid-text").text();
        //if (skill <= 0) {
        //    goon = false;
        //    v.errortext += "Skill ";
        //}
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
        //if ($("div[role='textbox']").html().length <= 13) {
        //    goon = false;
        //    v.errortext += "Comments ";
        //}
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
    };
};

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Forms_EditActionForm2.js');