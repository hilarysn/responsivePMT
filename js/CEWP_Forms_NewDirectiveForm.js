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
    html: "",
    tblinit: 0,
    user: null,
    userID: null,
    Org: null,
    directive: null,
    selects: null,
    skills: [],
    hours: 0,
    alignmentrequired: true,
    errortext: "Please fill out the fields: ",
    actiondate: jQuery.QueryString["Date"]
}

CKO.FORMS.DIRECTIVES.NewForm = function () {

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
        resizeModalDialog();
        loadCSS(site + '/SiteAssets/css/CEWP_Forms_DirectiveForms.css');
        loadCSS(site + '/SiteAssets/css/responsive.bootstrap.min.css');
        loadscript(site + '/SiteAssets/js/jquery.dataTables.min.js', function () {
            loadscript(site + '/SiteAssets/js/dataTables.bootstrap.min.js', function () {
                LoadData();
            });
        });
    }

    function LoadData() {
        resizeModalDialog(); // just to be sure!!
        v.userID = _spPageContextInfo.userId;
        var monkey = LoadDropdowns();
        jQuery.when.apply(null, monkey).done(function () {
            logit("LoadDropdowns complete.");
            $("input").addClass("form-control");
            $("select").addClass("form-control");
            $("textarea").addClass("form-control");
            $("div[role='textbox']").addClass("form-control");

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
                    })
                }
            });

            // allow user to add skills. this is a new form and will not initially have any skills but will need to have ability to add multiple skills
            // Enable click function to add skill. This will open the form for adding a skill

            //$("#btnAddSkill").click(function (e) {
            //    e.preventDefault();
            //    v.directive = String($("input[title='Directive Required Field']").val());
            //    logit("ADD SKILL DIRECTIVE: " + v.directive);
            //    if (v.directive.length > 5) {
            //        //var zurl = fixurl('/Lists/DirectiveSkills/NewForm.aspx?Directive=' + v.directive + '&Action=EditForm&IsDlg=1');
            //        var zurl = fixurl('/Lists/DirectiveSkills/NewForm.aspx?DirectiveID=' + v.directiveid + '&Action=EditForm&IsDlg=1');
            //        CKODialog(zurl, 'Add Skill', '800', '500', 'NotificationCallback');
            //    }
            //    else {
            //        alert("You must have a directive name already filled out.");
            //    }
            //});
        });
    }

    /*function GetSkills() {
        logit("GetSkills Called");
        v.hours = 0;
        v.html = "";
        v.directive = String($("input[title='Directive Required Field']").val());
        // Load the Skills for this Directive on the Skills tab in a table
        // Managed Metadata not really supported by REST so using CSOM here

        var inc = "Include(";
        var xml = "<View><Method Name='Read List' /><Query><OrderBy><FieldRef Name='Hours' /></OrderBy><Where><Eq><FieldRef Name='Directive' /><Value Type='Text'>" + v.directive + "</Value></Eq></Where></Query>";
        var fields = ["Directive", "Skill", "Hours"];
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
    }*/

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
        for (var i = 0; i < v.selects.length; i++){
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
                        // 
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

        /* TODO: Staff Lead and Staff Assist fields are people fields so will need to find best way to validate they contain at least one user  */
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
                returndata[0] = "Refresh";
                returndata[1] = "Directive Added";
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

    //function DeleteSkillSucceeded() {
    //    SP.UI.Notify.addNotification("Skill Deleted.", false);
    //    GetSkills();
    //}

    //function DeleteSkillFailed(sender, args) {
    //    logit(args.get_message());
    //}

    return {
        Init: Init,
        //GetSkills: GetSkills,
        changeme: changeme
    }
}

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Forms_NewDirectiveForm.js');