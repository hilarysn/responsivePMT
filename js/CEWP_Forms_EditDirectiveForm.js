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
    directiveid: "DIR" + jQuery.QueryString["ID"],
    itemid: jQuery.QueryString["ID"],
    ganttdata: null,
    startdate: null,
    suspensedate: null,
    phasesdrawn: false,
    parentid: null,
    html: "",   //
    html2: "",  //
    html3: "",  //
    items: [], //
    total: 0,  //
    count: 0,  //
    tblinit: 0,
    user: null,
    userID: null,
    //Org: null,
    hours: 0, //don't use
    skillsexpendedhours: null,   //
    projectedhours: null,   // 
    directive: null,
    directiveid: "DIR" + jQuery.QueryString["ID"],
    titlechanged: false,
    selects: null,
    alignmentrequired: true,
    actiondate: jQuery.QueryString["Date"],
    directivedata: {}
}

CKO.FORMS.DIRECTIVES.EditForm= function () {

    var v = CKO.FORMS.DIRECTIVES.VARIABLES;

    function Init(site) {
        loadCSS(site + '/SiteAssets/css/dhtmlxgantt.css');
        loadscript(site + '/SiteAssets/js/dhtmlxgantt.js', function () {
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
        });
    }

    function FormLoaded(site) {
        v.site = site;
        resizeModalDialog();
        loadCSS(site + '/SiteAssets/css/CEWP_Forms_DirectiveForms.css');
        //loadCSS(site + '/SiteAssets/css/responsive.bootstrap.min.css');
        loadCSS(site + '/SiteAssets/css/dhtmlxgantt.css');
        loadscript(site + '/SiteAssets/js/dhtmlxgantt.js', function () {
            loadscript(site + '/SiteAssets/js/jquery.dataTables.min.js', function () {
                loadscript(site + '/SiteAssets/js/dataTables.bootstrap.min.js', function () {
                    LoadData();
                });
            });
        });
    }

    function LoadData() {
        resizeModalDialog(); // just to be sure!!
        // drw 9/18/18
        // shortened code as there is no need to have 2 functions for this.
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var target = $(e.target).attr("href"); // activated tab
            if (target === "#tabPhases") {
                //var h = $("#ViewForm").height() - 50 + "px";
                var h = "500px";
                var w = $("#ViewForm").width() - 10 + "px";
                logit("w: " + w + ", h: " + h);
                $("#Phases").css({ height: h }, { width: w });
                if (!v.phasesdrawn) {
                    GetPhaseData();
                }
            }
            if (target === "#tabSkills") {
                var h = "500px";
                var w = $("#ViewForm").width() - 10 + "px";
                logit("w: " + w + ", h: " + h);
                $("#Skills").css({ height: h }, { width: w });
                logit("v.skillsexpendedhours: " + v.skillsexpendedhours);
                GetSkills();
            }
        });
        // end drw
         
        v.directive = $("input[title*='Directive']").val();
        v.title = v.directive;
        logit("Directive=" + v.directive);
        v.userID = _spPageContextInfo.userId;
        var monkey = LoadDropdowns();
        jQuery.when.apply(null, monkey).done(function () {
            logit("LoadDropdowns complete.");
            $("input").addClass("form-control form-control-sm");
            $("select").addClass("form-control form-control-sm");
            $("textarea").addClass("form-control");
            $("div[role='textbox']").addClass("form-control");
            $("div[data-field='PercentExpended']").html($("div[data-field='PercentExpended']").html().replace("%", ""));
            $("input[Title='Expended']").prop('readonly', true);
            $("input[Title='PercentExpended']").prop('readonly', true);
            $("textarea[title*='DirectiveData']").attr("id", "txtDirectiveData").css({ 'height': '500px' });

            try{
                SP.UI.UIUtility.setInnerText(parent.document.getElementById("dialogTitleSpan"), "Edit Directive");
            }
            catch (e) { /* do nothing */ }

            $("#btnSave").on("click", function () { // Save Action
                SaveAction();
            });

            $("#btnCancel").on("click", function () {// Cancel Edit-Save Action
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

            v.selects = [];
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

            var rabbit = Cascade();

            // Load the Actions for this Directive in a table on the Actions tab
            jQuery.when.apply(null, rabbit).done(function () {                 
                var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
                urlString += "$select=Id,Title,EffortTypeValue,DateCompleted,PMTUser,Expended,ActionComments,ParentID";
                urlString += "&$expand=PMTUser";
                urlString += "&$orderby=DateCompleted desc";
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
                        logit("Current Actions Count: " + numitems);
                        v.skillsexpendedhours = 0;
                        v.items = [];
                        //Build array to hold the current and archived actions for this directive
                        if (numitems > 0) {
                            for (var i = 0; i < j.length; i++) {
                                v.skillsexpendedhours += j[i]["Expended"];//for baselines
                                v.parentid = j[i]["ParentID"] //sets v.parentid correctly. STOP worrying about it!
                                v.items.push({
                                    "User": j[i]["PMTUser"]["Name"],
                                    "Date": j[i]["DateCompleted"],
                                    "Hours": j[i]["Expended"],
                                    "Comment": j[i]["ActionComments"]
                                });
                            }
                        }

                        GetArchivedActions(); // totals for second skills table

                        function GetArchivedActions() {
                            logit("GetArchivedeActions Called");
                            v.html2 = "";
                            // 1. Get total number of hours currently expended for the directive from the Actions 
                            //    list and the ArchivedActions list --> Display Total Hours Expended (v.expendedhours)
                            // 2. Get current total of estimated skill hours (projected hours) from DirectiveSkills list 
                            // 3. Write second row   td 1 v.hours   td 2 v.skillsexpendedhours

                            var urlString = v.site + "/_vti_bin/listdata.svc/ArchivedActions?";
                            urlString += "$select=Id,PMTUser,Expended,ParentID";
                            urlString += "&$expand=PMTUser";
                            urlString += "&$filter=(ParentID eq '" + v.parentid + "')";
                            logit("Archived Actions urlString: " + urlString);

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
                                    logit("Archived Actions Count: " + numitems);
                                    if (numitems > 0) {
                                        for (var i = 0; i < j.length; i++) {
                                            v.archivedexpendedhours += j[i]["Expended"];
                                            v.items.push({
                                                "User": j[i]["PMTUser"]["Name"],
                                                "Date": j[i]["DateCompleted"],
                                                "Hours": j[i]["Expended"],
                                                "Comment": j[i]["ActionComments"]
                                            });
                                        }
                                    }

                                    BuildSkillsActionsTable(); //Build Skills Tab table 1
                                    function BuildSkillsActionsTable() {
                                        // Build table showing both the current and archived actions for this directive. 
                                        var j = v.items;
                                        v.html = "<table id='tblActions' class='table table-bordered table-hover' style='width: 100%;'>";
                                        v.html += "<thead><tr><th class='thUser'>User</th><th class='thDate'>Date</th><th class='thHours'>Hours</th><th class='thComment'>Comment</th></tr></thead>";
                                        v.html += "<tbody>";
                                        for (var i = 0; i < j.length; i++) {
                                            v.html += "<tr>";
                                            v.html += "<td class='tdUser'>" + j[i]["User"] + "</td>";
                                            var a = moment(j[i]["Date"]).add(8, 'hours'); // adding 8 hours because the rest endpoint is subtracting the timezone offset
                                            v.html += "<td class='tdDate'>" + a.format("DD-MMM-YY") + "</td>";
                                            v.html += "<td class='tdHours'>" + j[i]["Hours"] + "</td>";
                                            v.html += "<td class='tdComment'>" + j[i]["Comment"] + "</td>";
                                            v.html += "</tr>";
                                        }
                                        v.html += "</tbody></table>";
                                        $("#tabActions").html("").append(v.html);
                                    }

                                    if (v.skillsexpendedhours === null) {
                                        GetSkills();
                                        logit("v.skillsexpendedhours: " + v.skillsexpendedhours);
                                    }

                                    //Enable click function to add multiple skills. Opens the DirectiveSkills list edit form.
                                    $("#btnAddSkill").click(function (e) {
                                        e.preventDefault();
                                        var zurl = fixurl('/Lists/DirectiveSkills/NewForm.aspx?DirectiveID=' + v.directiveid + '&Action=EditForm&IsDlg=1');
                                        CKODialog(zurl, 'Add Skill', '800', '500', 'NotificationCallback');
                                        GetSkills();                                      
                                    });
                                }
                            });
                        }
                    }
                });
            });

            logit("Update Dropdowns complete.");
        });
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

    function LoadDropdowns() {
        var deferreds = [];
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "PMTOrgs", "Title")).then(function (items) { CKO.CSOM.FillDropdowns(items, "Title", ["ddSupportingOrg"]); }, function (sender, args) { logit("GetLookupData Failed 1, " + args.get_message()); }));
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "Alignment", "Title")).then(function (items) { CKO.CSOM.FillDropdowns(items, "Title", ["ddSourceAuthority"]); }, function (sender, args) { logit("GetLookupData Failed 2, " + args.get_message()); }));
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "Orgs", "Title")).then(function (items) { CKO.CSOM.FillDropdowns(items, "Title", ["ddSupportedOrg"]); }, function (sender, args) { logit("GetLookupData Failed 3, " + args.get_message()); }));
        deferreds.push($.when(CKO.CSOM.GetLookupData.getvalues("current", "Alignments", "Reference")).then(function (items) { CKO.CSOM.FillDropdowns(items, "Reference", ["ddSupportReference"]); }, function (sender, args) { logit("GetLookupData Failed 4, " + args.get_message()); }));
        return deferreds;
        logit("Update Dropdowns complete.");
    }

    function GetSkills() {
        if (v.parentid === null) {
            v.parentid = v.directiveid;
        }
        v.html = "";
        v.hours = 0;
        logit("GetSkills Called for ParentID: " + v.parentid);

        // Identify the directive, then display the Estimated Skills and hours for the Directive on the Skills tab
        // in the Estimated Skills and Hours table - ID = tblSkills
        // Managed Metadata not really supported by REST so using CSOM here

        var inc = "Include(";
        var xml = "<View><Method Name='Read List' /><Query><OrderBy><FieldRef Name='Hours' /></OrderBy><Where><Eq><FieldRef Name='ParentID' /><Value Type='Text'>" + v.parentid + "</Value></Eq></Where></Query>";
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
                v.hours = 0;
                v.projectedhours = 0;
                while (enumerator.moveNext()) {
                    var prop = enumerator.get_current();
                    var hours = parseInt(prop.get_item("Hours"));
                    var skill = prop.get_item("Skill");
                    skill = skill.split("|");
                    v.html += "<tr>"; //build Skills Tab table 1
                    v.html += "<td><button type='button' data-id='" + prop.get_id() + "' class='btn btn-success btn-sm btnEditSkill'>Edit</button>";
                    v.html += "<button type='button' data-id='" + prop.get_id() + "' class='btn btn-danger btn-sm btnDeleteSkill'>Delete</button></td>";
                    v.html += "<td>" + skill[0] + "</td>";
                    v.html += "<td class='tdHours'>" + prop.get_item("Hours") + "</td>";
                    v.hours += hours;
                    v.html += "</tr>";
                }

                $("#tblSkillsBody").html("").append(v.html);
                $("#skilltotal").html("").append(v.hours);
                v.projectedhours = v.hours; //for baselines

                //build Skills Tab table 2
                if (v.skillsexpendedhours !== null) {
                    v.html2 = "";
                    v.html2 += "<tr class='info'>";
                    v.html2 += "<td class='tdblank'>" + "" + "</td>";
                    v.html2 += "<td class='tdlabeltotal'>" + v.projectedhours + "</td>";//Total Projected Hours
                    v.html2 += "<td class='tdhourtotal'>" + v.skillsexpendedhours + "</td>";  //Total Expended Hours
                    v.html2 += "</tr>";
                    $("#tblCurrentTotalsFoot").html("").append(v.html2);
                    logit("Get Archived Actions complete.");

                } else {
                    Cascade();
                    GetBaselines();
                }

                $(".btnEditSkill").on("click", function () {
                    var id = $(this).attr("data-id");
                    var zurl = fixurl('/Lists/DirectiveSkills/EditForm.aspx?ID=' + id + '&Action=EditForm&IsDlg=1');
                    CKODialog(zurl, 'Edit Skill', '800', '500', 'NotificationCallback');
                    GetSkills();
                });

                $(".btnDeleteSkill").on("click", function () {
                    v.id = $(this).attr("data-id");
                    v.ctx = new SP.ClientContext.get_current();
                    v.list = v.ctx.get_web().get_lists().getByTitle("DirectiveSkills");
                    v.id = v.id.trim();
                    v.id = parseInt(v.id);
                    v.listItem = v.list.getItemById(v.id);
                    v.listItem.deleteObject();
                    v.ctx.executeQueryAsync(DeleteSkillSucceeded, DeleteSkillFailed);
                });

                function DeleteSkillSucceeded() {
                    SP.UI.Notify.addNotification("Skill Deleted.", false);
                    alert("Skill Deleted.");
                    GetSkills();
                }

                function DeleteSkillFailed(sender, args) {
                    logit(args.get_message());
                }

                // Enable click function to add a baseline.
                $("#btnAddBaseline").click(function (e) {
                    e.preventDefault();
                    v.items = [];
                    //var baselinedate = moment().add(8, 'hours').format("MM-DD-YYYY"); // adding 8 hours because the rest endpoint is subtracting the timezone offset
                    var baselinedate = moment().format("MM-DD-YYYY");
                    v.items.push({
                        "ParentID": v.parentid,
                        "BaselineDate": baselinedate,
                        "TotalProjectedHours": v.projectedhours,
                        "TotalExpendedHours": v.skillsexpendedhours
                    });
                    AddBaseline(v.items[0]).success(AddBaselineSucceeded).fail(AddBaselineFail);
                });

                //Add a baseline
                function AddBaseline(itemProperties) {
                    return $.ajax({
                        type: 'POST',
                        url: "https://hq.tradoc.army.mil/sites/OCKO/PMT/_vti_bin/listdata.svc/DirectiveSkillsBaselines",
                        contentType: 'application/json',
                        processData: false,
                        headers: {
                            "Accept": "application/json;odata=verbose"
                        },
                        data: JSON.stringify(itemProperties)
                    });
                }

                function AddBaselineSucceeded() {
                    alert("Baseline added");
                    GetBaselines();
                }

                function AddBaselineFail(jqXHR, textStatus, errorThrown) {
                    v.count += 1;
                    if (v.count === v.total) {
                        alert("add baseline failed");
                        $("#SPSTools_Notify").fadeOut("2500", function () {
                            $("#SPSTools_Notify").html("");
                        });
                    } else {
                        console.log("Add baseline failed: " + errorThrown);
                        alert("Add baseline failed: " + errorThrown);
                    }
                }
            }

        }, function (sender, args) {
            logit("Error getting data from DirectiveSkills list : " + args.get_message());
        });

        GetBaselines();
    }

    function GetBaselines() {
        logit("GetBaselines Called");
        v.html3 = "";
        var numitems = 0;
        // 1. Get the directives's baseline data from DirectiveSkillsBaselines: ParentID, BaselineDate, TotalProjectedHours, TotalExpendedHours
        // 2. Write baseline date, total projected hours, total expended hours to baselines table
        var urlString = v.site + "/_vti_bin/listdata.svc/DirectiveSkillsBaselines?";
        urlString += "$select=Id,ParentID,BaselineDate,TotalProjectedHours,TotalExpendedHours";
        urlString += "&$filter=(ParentID eq '" + v.parentid + "')";
        logit("DirectiveSkillsBaselines urlString: " + urlString);

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
                numitems = data.d.results.length;
                logit("Baselines Count: " + numitems);
                if (numitems > 0) {
                    for (var i = 0; i < numitems; i++) {
                        v.html3 += "<tr>";
                        v.html3 += "<td><button type='button' data-id='" + j[i]["Id"] + "' class='btn btn-danger btnDeleteBaseline'>Delete</button></td>";
                        var a = moment(j[i]["BaselineDate"]).add(8, 'hours'); // adding 8 hours because the rest endpoint is subtracting the timezone offset
                        v.html3 += "<td class='tdDate'>" + a.format("DD-MMM-YY") + "</td>";
                        v.html3 += "<td class='tdHours'>" + j[i]["TotalProjectedHours"] + "</td>";
                        v.html3 += "<td class='tdHours'>" + j[i]["TotalExpendedHours"] + "</td>";
                        v.html3 += "</tr>";
                    }
                }

                v.html3 += "</tbody></table>";
                $("#tblSkillsBaselineBody").html("").append(v.html3);

                //Enable click function to delete a baseline.
                $(".btnDeleteBaseline").on('click', function (e) {
                    e.preventDefault();
                    DeleteBaseline($(this).attr("data-id")).success(DeleteBaselineSucceeded).fail(DeleteBaselineFail);
                });

                function DeleteBaseline(id) {
                    return $.ajax({
                        type: 'DELETE',
                        url: "https://hq.tradoc.army.mil/sites/OCKO/PMT/_vti_bin/listdata.svc/DirectiveSkillsBaselines(" + id + ")",
                        contentType: 'application/json',
                        processData: false,
                        headers: {
                            "Accept": "application/json;odata=verbose"
                        }
                    });
                }

                function DeleteBaselineSucceeded() {
                    alert("Baseline deleted");
                    GetBaselines();
                }

                function DeleteBaselineFail(jqXHR, textStatus, errorThrown) {
                    v.count += 1;
                    if (v.count === v.total) {
                        alert("delete item failed");
                        $("#SPSTools_Notify").fadeOut("2500", function () {
                            $("#SPSTools_Notify").html("");
                        });
                    } else {
                        console.log("Delete baseline failed: " + errorThrown);
                    }
                }
            }

        }, function (sender, args) {
            logit("Error getting data from DirectiveSkillsBaselines list : " + args.get_message());
        });
    }

    function GetPhaseData() {
        var urlString = v.site + "/_vti_bin/listdata.svc/Directives?";
        urlString += "$select=Id,DirectiveData,StartDate,SuspenseDate";
        urlString += "&$filter=(Id eq " + v.itemid + ")";

        jQuery.ajax({
            url: urlString,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                var results = data.d.results;
                var t0 = String(results[0].DirectiveData);
                logit("t0 TYPE: " + typeof t0);
                logit(t0);
                v.ganttdata = t0;
                //var a = moment(results[0].StartDate);
                //a.add(a.utcOffset() * -1, 'm');
                //var b = moment(results[0].SuspenseDate);
                //b.add(a.utcOffset() * -1, 'm');
                //v.startdate = new Date(a);
                //v.suspensedate = new Date(b);
                GetPhases();
            }
        });
    }

    function GetPhases() {
        logit("Get Phases Called");

        gantt.templates.scale_cell_class = function (date) {
            if (date.getDay() === 0 || date.getDay() === 6) {
                return "weekend";
            }
        };

        gantt.templates.task_cell_class = function (item, date) {
            if (date.getDay() === 0 || date.getDay() === 6) {
                return "weekend";
            }
        };

        gantt.templates.rightside_text = function (start, end, task) {
            if (task.type === gantt.config.types.milestone) {
                return task.text;
            }
            return "";
        };

        gantt.config.columns = [
            {
                name: "text", label: "Phase", width: "*", tree: true
            },
            {
                name: "start", label: "Start Date", template: function (obj) {
                    return gantt.templates.date_grid(obj.start_date);
                }, align: "center", width: 100
            },
            {
                name: "duration", label: "Duration", align: "center", width: 60
            },
            {
                name: "add", label: "", width: 44
            }
        ];
        
        gantt.config.grid_width = 346;
        gantt.config.xml_date = "%m/%d/%Y";
        gantt.config.scale_height = 30;
        gantt.config.fit_tasks = true;
        gantt.config.date_grid = "%M %d";
        gantt.config.scale_unit = "month";
        gantt.config.date_scale = "%M %Y";

        gantt.templates.task_class = function (start, end, task) {
            switch (task.text) {
                case "Assess":
                    return "assess";
                    break;

                case "Design":
                    return "design";
                    break;

                case "Develop":
                    return "develop";
                    break;

                case "Pilot":
                    return "pilot";
                    break;

                case "Implement":
                    return "implement";
                    break;
            }
        };

        gantt.init("Phases"); //div name

        gantt.attachEvent("onAfterTaskDrag", function (id, mode, e) {
            // serialize the phase data and save it to the phase textarea
            var json = JSON.stringify(gantt.serialize());
            $("#txtDirectiveData").val(json);
        });

        gantt.attachEvent("onAfterTaskMove", function (id, parent, tindex) {
            // serialize the phase data and save it to the phase textarea
            var json = JSON.stringify(gantt.serialize());
            $("#txtDirectiveData").val(json);
        });

        var taskId = null;

        gantt.showLightbox = function (id) {
            taskId = id;
            var task = gantt.getTask(id);

            if (task.$new) {
                $("#txtStart").datepicker();
            }
            else {
                $("#ddPhase option").each(function () {
                    if ($(this).html() === task.text) {
                        $(this).prop('selected', true);
                    }
                });
                $("#ddProgress option").each(function () {
                    var p = parseFloat($(this).val());
                    if (p === task.progress) {
                        $(this).prop('selected', true);
                    }
                });
                $("#txtStart").val(moment(task.start_date).format("MM/DD/YYYY")).datepicker();
                $("#txtDuration").val(task.duration);
            }

            var form = getForm(); // getting handle to the PhaseModal div

            $("#PhaseModal").modal({
                "backdrop": true,
                "keyboard": false,
                "show": true
            });

            form.querySelector("[name='save']").onclick = save;
            form.querySelector("[name='close']").onclick = cancel;
            form.querySelector("[name='delete']").onclick = remove;
        };

        gantt.hideLightbox = function () {
            getForm().style.display = "";
            taskId = null;
        }

        function getForm() {
            return document.getElementById("PhaseModal");
        };

        function save() {
            var task = gantt.getTask(taskId);

            task.text = $("#ddPhase option:selected").text();
            task.duration = parseInt($("#txtDuration").val());
            var d = new Date($("#txtStart").val());
            task.start_date = d;
            d = gantt.date.add(d, task.duration, "day");
            task.end_date = d;
            task.progress = $("#ddProgress option:selected").val();

            if (task.$new) {
                gantt.addTask(task, task.parent);
            } else {
                gantt.updateTask(task.id);
            }

            // serialize the phase data if there is any and save it to the phase textarea
            var json = JSON.stringify(gantt.serialize());
            $("#txtDirectiveData").val(json);

            $("#PhaseModal").modal("hide");
            gantt.hideLightbox();
        }

        function cancel() {
            var task = gantt.getTask(taskId);

            if (task.$new)
                gantt.deleteTask(task.id);
            gantt.hideLightbox();
            $("#PhaseModal").modal("hide");
        }

        function remove() {
            gantt.deleteTask(taskId);
            gantt.hideLightbox();
            $("#PhaseModal").modal("hide");
        }

        $("#btnDay").on("click", function () {
            var value = $(this).prop('value');
            setScaleConfig(value);
            gantt.render();
        });

        $("#btnWeek").on("click", function () {
            var value = $(this).prop('value');
            setScaleConfig(value);
            gantt.render();
        });

        $("#btnMonth").on("click", function () {
            var value = $(this).prop('value');
            setScaleConfig(value);
            gantt.render();
        });

        $("#btnYear").on("click", function () {
            var value = $(this).prop('value');
            setScaleConfig(value);
            gantt.render();
        });

        // Select gantt time scale
        function setScaleConfig(level) {
            switch (level) {
                case "day":
                    gantt.config.scale_unit = "day";
                    gantt.config.step = 1;
                    gantt.config.date_scale = "%M %d ";
                    gantt.templates.date_scale = null;
                    gantt.config.scale_height = 30;
                    gantt.config.subscales = [];
                    break;

                case "week":
                    var weekScaleTemplate = function (date) {
                        var dateToStr = gantt.date.date_to_str("Week of: %M %d");
                        var endDate = gantt.date.add(gantt.date.add(date, 1, "week"), -1, "day");
                        return dateToStr(date) + " - " + dateToStr(endDate);
                    };

                    gantt.config.scale_unit = "week";
                    gantt.config.step = 1;
                    gantt.templates.date_scale = weekScaleTemplate;
                    gantt.config.scale_height = 30;
                    gantt.config.subscales = [
                        { unit: "day", step: 1, date: "%D %M %j" }
                    ];
                    break;

                case "month":
                    gantt.config.scale_unit = "month";
                    gantt.config.date_scale = "%M %Y";
                    gantt.templates.date_scale = null;
                    gantt.config.scale_height = 30;
                    gantt.config.subscales = [
                        { unit: "week", step: 1, date: "Week #: %W" }
                    ];
                    break;

                case "year":
                    gantt.config.scale_unit = "year";
                    gantt.config.step = 1;
                    gantt.config.date_scale = "%Y";
                    gantt.templates.date_scale = null;
                    gantt.config.min_column_width = 50;
                    gantt.config.scale_height = 30;
                    gantt.config.subscales = [
                        { unit: "month", step: 1, date: "%M" }
                    ];
                    break;
            }
        }

        setScaleConfig("month");

        gantt.init("Phases"); //div name

        // drw 9/18/2018
        //if (v.ganttdata && v.ganttdata.length > 10) { // comment hsn
            gantt.parse(v.ganttdata);
        //}                                            // comment hsn

        v.phasesdrawn = true;
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
        $("#FormError").remove();
        $(".has-error").each(function () {
            $(this).removeClass("has-error");
        });
        v.errortext = "Please fill out the fields: ";
        var goon = true;

        // serialize the phase data if there is any and save it to the phase textarea
        //var json = gantt.serialize();
        //$("#txtDirectiveData").text(json);

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

    return {
        Init: Init,
        Cascade: Cascade,
        GetSkills: GetSkills,
        changeme: changeme
    }
}

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Forms_EditDirectiveForm.js');