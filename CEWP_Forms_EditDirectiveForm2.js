var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.FORMS = CKO.FORMS || {};
CKO.FORMS.DIRECTIVES = CKO.FORMS.DIRECTIVES || {};
CKO.FORMS.DIRECTIVES.VARIABLES = CKO.FORMS.DIRECTIVES.VARIABLES || {};

CKO.FORMS.DIRECTIVES.VARIABLES = {
    newform: null,
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    ctx: null,
    web: null,
    list: null,
    listitem: null,
    id: null,
    html: "",
    tblinit: 0,
    user: null,
    userID: null,
    Org: null,
    directive: null,
    directiveid: "DIR" + jQuery.QueryString["ID"],
    titlechanged: false,
    hours: 0,
    selects: null,
    alignmentrequired: true,
    actiondate: jQuery.QueryString["Date"]
};

CKO.FORMS.DIRECTIVES.EditForm = function () {

    var v = CKO.FORMS.DIRECTIVES.VARIABLES;

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
        resizeModalDialog();
        loadCSS(site + '/SiteAssets/css/CEWP_Forms_DirectiveForms.css');
        //loadCSS(site + '/SiteAssets/css/jquery.dataTables.min.css');
        //loadscript(site + '/SiteAssets/js/jquery.dataTables.min.js', function () {
        //loadscript(site + '/SiteAssets/js/dataTables.bootstrap.min.js', function () {
        LoadData();
        //});
        //});
    }

    function LoadData() {
        resizeModalDialog(); // just to be sure!!
        v.directive = $("input[title*='Directive']").val();
        v.title = v.directive;
        logit("Directive=" + v.directive);
        v.userID = _spPageContextInfo.userId;
        var monkey = LoadDropdowns();
        jQuery.when.apply(null, monkey).done(function () {
            logit("LoadDropdowns complete.");
            $("input").addClass("form-control");
            $("select").addClass("form-control");
            $("textarea").addClass("form-control");
            $("div[role='textbox']").addClass("form-control");
            $("div[data-field='PercentExpended']").html($("div[data-field='PercentExpended']").html().replace("%", ""));
            $("input[Title='Expended']").prop('readonly', true);
            $("input[Title='PercentExpended']").prop('readonly', true);

            try {
                SP.UI.UIUtility.setInnerText(parent.document.getElementById("dialogTitleSpan"), "Edit Directive");
            }
            catch (e) { /* do nothing */ }

            $("#btnSave").on("click", function () {
                SaveAction();
            });

            $("#btnCancel").on("click", function () {
                CancelAction();
            });

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

            v.selects = new Array();
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
                        "cascadeval": String($("input[title*='" + $("#" + $(this).attr("data-cascadeto")).attr("data-sourcefield") + "']").val()),
                        "source": $(this).attr("data-sourcefield"),
                        "sourceval": String($("input[title*='" + $(this).attr("data-sourcefield") + "']").val()),
                        "orderby": $(this).attr("data-orderby"), // not currently ordering just the field to display in the dropdown
                        "filter": $(this).attr("data-filterfield"),
                        "list": $(this).attr("data-lookuplist"),
                        "fields": fields,
                        "items": null
                    });
                }
                else {
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

            // allow user to add skills. this is an edit form and will need to have ability to add multiple skills
            // Enable click function to add skill. This will open the form for adding a skill
            GetSkills(v.directiveid);
            $("#btnAddSkill").click(function (e) {
                e.preventDefault();
                var zurl = fixurl('/Lists/DirectiveSkills/NewForm.aspx?DirectiveID=' + v.directiveid + '&Action=EditForm&IsDlg=1');
                CKODialog(zurl, 'Add Skill', '800', '500', 'NotificationCallback');
                //v.directive = String($("input[title='Directive Required Field']").val());
                //logit("ADD SKILL DIRECTIVE: " + v.directive);
                //if (v.directive.length > 5) {
                //    var zurl = fixurl('/Lists/DirectiveSkills/NewForm.aspx?Directive=' + v.directive + '&Action=EditForm&IsDlg=1');
                //    var zurl = fixurl('/Lists/DirectiveSkills/NewForm.aspx?DirectiveID=' + v.directiveid + '&Action=EditForm&IsDlg=1');
                //    CKODialog(zurl, 'Add Skill', '800', '500', 'NotificationCallback');
                //}
                //else {
                //    alert("You must have a directive name already filled out.");
                //}
            });

            var rabbit = Cascade();
            jQuery.when.apply(null, rabbit).done(function () {
                // Load the Actions for this Directive on the Actions tab in a table
                var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
                urlString += "$select=Id,Title,EffortTypeValue,DateCompleted,PMTUser,Expended,ActionComments,ParentID";
                urlString += "&$expand=PMTUser";
                urlString += "&$orderby=DateCompleted desc";
                //urlString += "&$filter=(substringof('" + v.directive + "', Title)) and (EffortTypeValue eq 'Directive')";
                urlString += "&$filter=(ParentID eq '" + v.directiveid + "')";
                logit("urlString: " + urlString);

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
                        logit("Actions Count: " + numitems);
                        if (numitems > 0) {
                            // Build out the table to show the actions for this directive.
                            v.html = "<table id='tblActions' cellspacing='0' cellpadding='0' class='table table-bordered table-hover' style='width: 100%;'>";
                            v.html += "<thead><tr><th class='thUser'>User</th><th class='thDate'>Date</th><th class='thHours'>Hours</th><th class='thComment'>Comment</th></tr></thead>";
                            v.html += "<tbody>";
                            for (var i = 0; i < j.length; i++) {
                                v.html += "<tr>";
                                v.html += "<td class='tdUser'>" + j[i]["PMTUser"]["Name"] + "</td>";
                                var a = moment(j[i]["DateCompleted"]).add(8, 'hours'); // adding 8 hours because the rest endpoint is subtracting the timezone offset
                                v.html += "<td class='tdDate'>" + a.format("DD-MMM-YY") + "</td>";
                                v.html += "<td class='tdHours'>" + j[i]["Expended"] + "</td>";
                                v.html += "<td class='tdComment'>" + j[i]["ActionComments"] + "</td>";
                                v.html += "</tr>";
                            }
                            v.html += "</tbody></table>";
                            $("#tabActions").html("").append(v.html);
                        }

                        logit("Update Dropdowns complete.");
                        //var table = $("#tblActions").dataTable({
                        //    "scrollY": "500px",
                        //    "scrollCollapse": true,
                        //    "paging": false,
                        //    "searching": false,
                        //    "ordering": false
                        //});

                        //setTimeout(function () {
                        //    //table.columns.adjust().draw();
                        //    $(".thDate").click();
                        //    //$(".thDate").click();
                        //}, 4000);
                    }
                });
            });
        });
    }

    function GetSkills(parentid) {
        if (parentid === null) { parentid = v.directiveid; }
        logit("GetSkills Called: ParentID - " + parentid);
        v.html = "";
        v.hours = 0;
        //v.directive = String($("input[title='Directive Required Field']").val());
        // Load the Skills for this Directive on the Skills tab in a table
        // Managed Metadata not really supported by REST so using CSOM here

        var inc = "Include(";
        var xml = "<View><Method Name='Read List' /><Query><OrderBy><FieldRef Name='Hours' /></OrderBy><Where><Eq><FieldRef Name='ParentID' /><Value Type='Text'>" + parentid + "</Value></Eq></Where></Query>";
        var fields = ["Directive", "Skill", "Hours", "ParentID"];
        xml += "<ViewFields>";
        for (var z = 0; z <= fields.length - 1; z++) {
            xml += "<FieldRef Name='" + fields[z] + "'/>";
            if (z === fields.length - 1) {
                inc += fields[z] + ")";
            }
            else {
                inc += fields[z] + ", ";
            }
        }
        xml += "<FieldRef Name='ID'/>";
        xml += "</ViewFields>";
        xml += "</View>";

        $.when(CKO.CSOM.GetListItems.getitemsfilteredcomplex("current", "DirectiveSkills", xml, inc)).then(function (items) {
            if (items.get_count() > 0) { //get map data
                enumerator = items.getEnumerator();
                while (enumerator.moveNext()) {
                    var prop = enumerator.get_current();
                    var hours = parseInt(prop.get_item("Hours"));
                    var skill = prop.get_item("Skill");
                    skill = skill.split("|");
                    v.html += "<tr>";
                    v.html += "<td><button type='button' data-id='" + prop.get_id() + "' class='btn btn-success btnedit'>Edit</button>";
                    v.html += "<button type='button' data-id='" + prop.get_id() + "' class='btn btn-danger btndelete'>Delete</button></td>";
                    v.html += "<td>" + skill[0] + "</td>";
                    v.html += "<td class='tdHours'>" + prop.get_item("Hours") + "</td>";
                    v.hours += hours;
                    v.html += "</tr>";
                }
                $("#tblSkillsBody").html("").append(v.html);
                $("#skilltotal").html("").append(v.hours);

                $(".btnedit").on("click", function () {
                    var id = $(this).attr("data-id");
                    var zurl = fixurl('/Lists/DirectiveSkills/EditForm.aspx?ID=' + id + '&Action=EditForm&IsDlg=1');
                    CKODialog(zurl, 'Edit Skill', '800', '500', 'NotificationCallback');
                });

                $(".btndelete").on("click", function () {
                    v.id = $(this).attr("data-id");
                    v.ctx = new SP.ClientContext.get_current();
                    v.list = v.ctx.get_web().get_lists().getByTitle("DirectiveSkills");
                    v.id = v.id.trim();
                    v.id = parseInt(v.id);
                    v.listItem = v.list.getItemById(v.id);
                    v.listItem.deleteObject();
                    v.ctx.executeQueryAsync(DeleteSkillSucceeded, DeleteSkillFailed);
                });
            }
        }, function (sender, args) {
            logit("Error getting data from DirectiveSkills list : " + args.get_message());
        });
    }

    function LoadDropdowns() {
        var deferreds = [];
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "PMTOrgs", "Title")).then(function (items) { CKO.CSOM.FillDropdowns(items, "Title", ["ddSupportingOrg"]); }, function (sender, args) { logit("GetLookupData Failed 1, " + args.get_message()); }));
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "Alignment", "Title")).then(function (items) { CKO.CSOM.FillDropdowns(items, "Title", ["ddSourceAuthority"]); }, function (sender, args) { logit("GetLookupData Failed 2, " + args.get_message()); }));
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "Orgs", "Title")).then(function (items) { CKO.CSOM.FillDropdowns(items, "Title", ["ddSupportedOrg"]); }, function (sender, args) { logit("GetLookupData Failed 3, " + args.get_message()); }));
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "Alignments", "Reference")).then(function (items) { CKO.CSOM.FillDropdowns(items, "Reference", ["ddSupportReference"]); }, function (sender, args) { logit("GetLookupData Failed 4, " + args.get_message()); }));
        return deferreds;
    }

    function Cascade() {
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

    function changeme(obj) {
        var f = $("#" + obj.id).attr("data-function");
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
                                        opts += "<option value='" + current.get_item(v.selects[i].orderby) + "'>" + text + "</option>";
                                    }
                                    // populate the child select with the options
                                    $("#" + v.selects[i].cascadeto).html("").append(opts);
                                }
                            }, function (sender, args) {
                                logit("Error getting data for child dropdown: " + args.get_message());
                            });
                        }
                        else {
                            $.when(CKO.CSOM.GetListItems.getitemsfilteredorderedandpasstoelement("current", v.selects[i].list, v.selects[i].filter, v.selects[i].sourceval, v.selects[i].orderby, i)).then(function (items, i) {
                                if (items.get_count() > 0) {
                                    v.selects[i].items = items;
                                    var opts = "<option selected value='Select...'>Select...</option>";
                                    var enumerator = items.getEnumerator();
                                    var unique = "";
                                    while (enumerator.moveNext()) {
                                        var current = enumerator.get_current();
                                        opts += "<option value='" + current.get_item(v.selects[i].orderby) + "'>" + current.get_item(v.selects[i].orderby) + "</option>";
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

            case "updatesource":
                // update the source field with the selected value
                $("input[title*='" + $("#" + obj.id).attr("data-sourcefield") + "']").val($("#" + obj.id + " option:selected").val());
                break;

            case "select":
                // update the source field with the selected value
                $("input[title*='" + $("#" + obj.id).attr("data-sourcefield") + "']").val($("#" + obj.id + " option:selected").val());
                break;
        }
    }

    function SaveAction() {
        // first validate if the title(directive) name has changed and ask the user if this is what they want to do. 
        // They will have to wait for all actions to be updated with the new title before it saves the changes.


        $("#FormError").remove();
        $(".has-error").each(function () {
            $(this).removeClass("has-error");
        });
        v.errortext = "Please fill out the fields: ";
        var goon = true;
        if ($("input[title='Directive Required Field']").val() === "") {
            goon = false;
            $("input[title='Directive Required Field']").parent().addClass("has-error");
            v.errortext += "Directive ";
        }
        else {
            if ($("input[title='Directive Required Field']").val() !== v.title) {
                v.directive = $("input[title='Directive Required Field']").val();
                v.titlechanged = true;
            }
        }
        var dd = String($("div[data-field='DirectiveDescription']").find(".form-control").html());
        logit("dd: " + dd + ", " + dd.length);
        if (dd.length <= 8) {
            goon = false;
            $("div[data-field='DirectiveDescription']").find(".form-control").parent().addClass("has-error");
            v.errortext += "Description ";
        }
        var lc = String($("div[data-field='LeadComments']").find(".form-control").html());
        logit("lc: " + lc + ", " + lc.length);
        if (lc.length <= 8) {
            goon = false;
            $("div[data-field='LeadComments']").find(".form-control").parent().addClass("has-error");
            v.errortext += "LeadComments ";
        }
        /* Status, Equipped, and Trained can not be empty so they should never be blank or fail validation */
        if ($("input[title='ProjectedManHours']").val() === "") {
            goon = false;
            $("input[title='ProjectedManHours']").parent().addClass("has-error");
            v.errortext += "ProjectedManHours ";
        }
        if ($("input[title='AvailableManHours']").val() === "") {
            goon = false;
            $("input[title='AvailableManHours']").parent().addClass("has-error");
            v.errortext += "AvailableManHours ";
        }
        if ($("input[title='MOEQualitative Required Field']").val() === "") {
            goon = false;
            $("input[title='MOEQualitative Required Field']").parent().addClass("has-error");
            v.errortext += "MOEQualitative ";
        }
        if ($("input[title='MOEQuantitative Required Field']").val() === "") {
            goon = false;
            $("input[title='MOEQuantitative Required Field']").parent().addClass("has-error");
            v.errortext += "MOEQuantitative ";
        }

        /* Staff Lead and Staff Assist fields are people fields so will need to find best way to validate they contain at least one user  */
        var thisdiv = $("div[data-field='StaffLead']");
        var thisContents = thisdiv.find("div[name='upLevelDiv']");
        if (thisContents[0].innerHTML === "") {
            goon = false;
            thisdiv.find("div[name='upLevelDiv']").parent().addClass("has-error");
            v.errortext += "StaffLead ";
        }

        thisdiv = $("div[data-field='StaffAssist']");
        thisContents = thisdiv.find("div[name='upLevelDiv']");
        if (thisContents[0].innerHTML === "") {
            goon = false;
            thisdiv.find("div[name='upLevelDiv']").parent().addClass("has-error");
            v.errortext += "StaffAssist ";
        }

        /* LeadAssessment can not be empty so it should never be blank or fail validation */

        if ($("#ddSourceAuthority option:selected").val() === "Select...") {
            goon = false;
            $("#ddSourceAuthority").parent().addClass("has-error");
            v.errortext += "SourceAuthority ";
        }
        if ($("#ddSourceReference option:selected").val() === "Select..." || $("#ddSourceReference").html() === "") {
            goon = false;
            $("#ddSourceReference").parent().addClass("has-error");
            v.errortext += "SourceReference ";
        }
        if ($("#ddSupportedOrg option:selected").val() === "Select...") {
            goon = false;
            $("#ddSupportedOrg").parent().addClass("has-error");
            v.errortext += "SupportedOrg ";
        }
        if ($("#ddSupportedSubOrg option:selected").val() === "Select..." || $("#ddSupportedSubOrg").html() === "") {
            goon = false;
            $("#ddSupportedSubOrg").parent().addClass("has-error");
            v.errortext += "SupportedSubOrg ";
        }
        if ($("#ddSupportingOrg option:selected").val() === "Select...") {
            goon = false;
            $("#ddSupportingOrg").parent().addClass("has-error");
            v.errortext += "SupportingOrg ";
        }
        if ($("#ddSupportReference option:selected").val() === "Select...") {
            goon = false;
            $("#ddSupportReference").parent().addClass("has-error");
            v.errortext += "SupportReference ";
        }
        if ($("#ddSupportParagraph option:selected").val() === "Select..." || $("#ddSupportParagraph").html() === "") {
            goon = false;
            $("#ddSupportParagraph").parent().addClass("has-error");
            v.errortext += "SupportParagraph ";
        }
        if (goon === true) {
            $(window).on('unload', function () {
                var returndata = [];
                if (v.titlechanged === true) {
                    returndata[0] = "DirectiveTitle";
                    returndata[1] = v.directiveid;
                    returndata[2] = v.directive;
                }
                else {
                    returndata[0] = "Refresh";
                    returndata[1] = "Directive Saved";
                }
                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.OK, returndata);
            });
            $("input[id*='SaveItem']").trigger('click');
            //alert("Item has validated.");
        }
        else {
            var ehtml = "<li id='FormError' class='ms-cui-group' style='width: 600px; background-color: red;'>";
            ehtml += "<div class='container-fluid' style='padding: 10px 30px; text-align: center; color: black; font-size: 16px;'>";
            ehtml += v.errortext + "</div></li>";
            $("ul[id='Ribbon.ListForm.Edit']").append(ehtml);
            v.errortext = "Please fill out the fields: ";
        }
    }

    function CancelAction() {
        SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.cancel);
    }

    function DeleteSkillSucceeded() {
        SP.UI.Notify.addNotification("Skill Deleted.", false);
        GetSkills();
    }

    function DeleteSkillFailed(sender, args) {
        logit(args.get_message());
    }

    function GetPhasesData() {
        logit("GetPhasesData Called: Directive ID - " + v.directiveid);
        //Get data from directive if it exists -- read Phasestasks and build data[]
        var deferreds = [];
        var urlString = v.site + "/_vti_bin/listdata.svc/Directives?";
        urlString += "$select=Id,Directive,ParentID,StartDate,Phasestasks&$Id=" + v.directiveid;
        deferreds.push($.when(CKO.REST.GetListItems.getitems(urlString)).then(function (data) {
            var results = data.d.results;
            var j = jQuery.parseJSON(JSON.stringify(results));

            /// we need only one
            for (var i = 0, length = j.length; i < length; i++) {
                //if phasestasks is empty, fill it up with a new array
                if (j[i]["Phasestasks"] === "") {
                    v.gantt_tasks.push({
                        "gantt_tasks": j[i]["Phasestasks"],
                        //"directiveID": j[i]["ID"],//needed?
                        //"parentID": j[i]["ParentID"],//needed?
                        "id": 0, //PRIMARY KEY, auto_increment
                        '"text"': [],
                        '"text[0]"': j[i]["Directive"],
                        "'start_date'": [], //'2017-04-01 00:00:00',
                        "'start_date[0]'": j[i]["StartDate"],
                        "'duration'": j[i]["SuspenseDate"] - j[i]["StartDate"],
                        "'progress'": 0,
                        "'parent'": 0,
                        "'gantt_links'": []
                    });

                } else {
                    // read the existing gantt_tasks array values
                    v.gantt_tasks.push({
                        "gantt_tasks": j[i]["Phasestasks"]["gantt_tasks"],
                        //"directiveID": j[i]["ID"],//needed?
                        //"parentID": j[i]["ParentID"],//needed?
                        "id": j[i]["Phasestasks"]["gantt_tasks"]["id"],
                        '"text"': j[i]["Directive"],
                        "'start_date'": j[i]["StartDate"], //'2017-04-01 00:00:00', //should this read 
                        //the previously entered start date or overwrite with the actual directive start date ?
                        //"'start_date'": j[i]["Phasestasks"]["gantt_tasks"]["start_date"],
                        "'duration'": j[i]["SuspenseDate"] - j[i]["StartDate"],
                        "'progress'": j[i]["Phasestasks"]["gantt_tasks"]["progress"],
                        "'parent'": j[i]["Phasestasks"]["gantt_tasks"]["parent"],
                        "'gantt_links'": j[i]["Phasestasks"]["gantt_tasks"]["gantt_links"]
                    });
                }

                if (v.gantt_tasks.gantt_links !== null) {
                    // read the existing gantt_links array values
                    var k = v.gantt_tasks.gantt_links.length;
                    for (var m = 0; m < k; m++) {
                        v.gantt_tasks.gantt_links.push({
                            "'id'": j[i].gantt_tasks[k].id,
                            '"source"': j[i].gantt_tasks[k].source,
                            '"target"': j[i].gantt_tasks[k].target,
                            '"type"': j[i].gantt_tasks[k].type
                        });
                    }
                } else {
                    v.gantt_tasks.gantt_links.push({
                        "'id'": 0,
                        '"source"': 0,
                        '"target"': 0.0,
                        '"type"': 0.0
                    });
                };

                logit("Directives list Phasestasks data push: " + data);
            }

        }, function (data) {
            $("#SPSTools_Notify").fadeOut("2500", function () {
                $("#SPSTools_Notify").html("");
            });
            logit("Functions list data fade: " + data);
        }))
        return deferreds;
    };

    return {
        Init: Init,
        GetSkills: GetSkills,
        changeme: changeme
    };
};

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Forms_EditDirectiveForm.js');