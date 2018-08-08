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
    html2: "", //
    html3: "", //
    tblinit: 0,
    user: null,
    userID: null,
    Org: null,
    directive: null,
    selects: null,
    skills: [],
    hours: 0,
    baselinedate: null,          //
    currentexpendedhours: null,  //aka currenttotalhours for baseline
    archivedexpendedhours: null, //
    totalexpendedhours: null,    //
    totalprojectedhours: null,   // 
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
        // hsn 7/16/18
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var target = $(e.target).attr("href"); // activated tab
            if (target === "#tabPhases") {
                //var h = $("#ViewForm").height() - 50 + "px";
                var h = "500px";
                var w = $("#ViewForm").width() - 10 + "px";
                logit("w: " + w + ", h: " + h);
                $("#Phases").css({ height: h }, { width: w });
                GetPhases();
            }
        });
        // end hsn

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

            GetSkills();
            $("#btnAddSkill").click(function (e) {
                e.preventDefault();
                var zurl = fixurl('/Lists/DirectiveSkills/NewForm.aspx?DirectiveID=' + v.directiveid + '&Action=EditForm&IsDlg=1');
                CKODialog(zurl, 'Add Skill', '800', '500', 'NotificationCallback');
            });
        }
        return deferreds;
    }

    function GetSkills() {
        if (v.parentid === null) {
            v.parentid = v.directiveid;
        }

        v.html = "";
        v.hours = 0;
        logit("GetSkills Called: ParentID - " + v.parentid);

        //v.directive = String($("input[title='Directive Required Field']").val());
        // // Identify the directive, then display the Estimated Skills and hours for the Directive on the Skills tab
        // // in the Estimated Skills and Hours table - ID = tblSkills
        // // Managed Metadata not really supported by REST so using CSOM here

        var inc = "Include(";
        var xml = "<View><Method Name='Read List' /><Query><OrderBy><FieldRef Name='Hours' /></OrderBy><Where><Eq><FieldRef Name='ParentID' /><Value Type='Text'>" + v.parentid + "</Value></Eq></Where></Query>";
        //var xml = "<View><Method Name='Read List' /><Query><OrderBy><FieldRef Name='Hours' /></OrderBy><Where><Eq><FieldRef Name='ParentID' /><Value Type='Text'>" + v.directiveid + "</Value></Eq></Where></Query>";
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
                v.totalprojectedhours = 0;
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
                v.totalprojectedhours = v.hours; //for baselines

                $(".btnEditSkill").on("click", function () {
                    var id = $(this).attr("data-id");
                    var zurl = fixurl('/Lists/DirectiveSkills/EditForm.aspx?ID=' + id + '&Action=EditForm&IsDlg=1');
                    CKODialog(zurl, 'Edit Skill', '800', '500', 'NotificationCallback');
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

                // Enable click function to add baseline. This will open the form for adding a baseline
                GetBaselines(v.directiveid, v.totalprojectedhours, v.totalexpendedhours);// How to send the total hours to form?
                $("#btnAddBaseline").click(function (e) {
                    e.preventDefault();
                    //e.preventDefault(v.directiveid,v.totalprojectedhours,v.totalexpendedhours);
                    var zurl = fixurl('/Lists/DirectiveSkillsBaselines/NewForm.aspx?DirectiveID=' + v.directiveid + '&Action=EditForm&IsDlg=1');
                    CKODialog(zurl, 'Add Baseline', '800', '500', 'NotificationCallback');
                });
            }
        }, function (sender, args) {
            logit("Error getting data from DirectiveSkills list : " + args.get_message());
        });
    }

    function GetBaselines() {
        logit("GetBaselines Called");
        v.html3 = "";
        var numitems = 0;
        // 1. Get the directives's baseline data from DirectiveSkillsBaselines: ParentID, BaselineDate, TotalProjectedHours, TotalExpendedHours
        // 2. Write baseline date, total projected hours, total expended hours to baselines table
        var urlString = v.site + "/_vti_bin/listdata.svc/DirectiveSkillsBaselines?";
        urlString += "$select=Id,ParentID,BaselineDate,TotalProjectedHours,TotalExpendedHours";
        urlString += "&$filter=(ParentID eq '" + v.directiveid + "')";
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
                    for (var i = 0, length = j.length; i < length; i++) {
                        v.html3 += "<tr>";
                        // + /*prop.get_id()*/ + 
                        v.html3 += "<td><button type='button' data-id='" + j[i]["ParentID"] + "' class='btn btn-danger btnDeleteBaseline'>Delete</button></td>";
                        var a = moment(j[i]["BaselineDate"]).add(8, 'hours'); // adding 8 hours because the rest endpoint is subtracting the timezone offset
                        v.html3 += "<td class='tdDate'>" + a.format("DD-MMM-YY") + "</td>";
                        v.html3 += "<td class='tdHours'>" + j[i]["TotalProjectedHours"] + "</td>";
                        v.html3 += "<td class='tdHours'>" + j[i]["TotalExpendedHours"] + "</td>";
                        v.html3 += "</tr>";
                    }
                }
                v.html3 += "</tbody></table>";
                $("#tblSkillsBaselineBody").html("").append(v.html3);

                //$(".btnEditBaseline").on("click", function () {
                //    var id = $(this).attr("data-id");
                //    var zurl = fixurl('/Lists/DirectiveSkillsBaselines/EditForm.aspx?ID=' + id + '&Action=EditForm&IsDlg=1');
                //    CKODialog(zurl, 'Edit Baseline', '800', '500', 'NotificationCallback');
                //});

                $("#btnDeleteBaseline").click(function (e) {
                    if (data - id !== null) {
                        e.preventDefault();
                        v.id = $(this).attr("data-id"); //data-id = parentID
                        alert("data-id: " + data - id);
                        v.ctx = new SP.ClientContext.get_current();
                        v.list = v.ctx.get_web().get_lists().getByTitle("DirectiveSkillsBaseline");
                        v.id = v.id.trim();    //delete?
                        v.id = parseInt(v.id); //delete?
                        v.listItem = v.list.getItemById(v.id);
                        v.listItem.deleteObject();
                        v.ctx.executeQueryAsync(DeleteSkillSucceeded, DeleteSkillFailed);
                    }
                });
            }
        }, function (sender, args) {
            logit("Error getting data from DirectiveSkillsBaselines list : " + args.get_message());
        });
    }

    function GetPhases() {
        logit("Get Phases Called");
        var demo_tasks = {
            data: [
                { "id": 1, "text": "Office itinerancy", "type": 'gantt.config.types.project', "order": "10", progress: 0.4, open: false },
                { "id": 2, "text": "Office facing", "type": 'gantt.config.types.project', "start_date": "02-04-2018", "duration": "8", "order": "10", progress: 0.6, "parent": "1", open: true },
                { "id": 3, "text": "Furniture installation", "type": 'gantt.config.types.project', "start_date": "11-04-2018", "duration": "8", "order": "20", "parent": "1", progress: 0.6, open: true },
                { "id": 4, "text": "The employee relocation", "type": 'gantt.config.types.project', "start_date": "13-04-2018", "duration": "6", "order": "30", "parent": "1", progress: 0.5, open: true },
                { "id": 5, "text": "Interior office", "start_date": "02-04-2018", "duration": "7", "order": "3", "parent": "2", progress: 0.6, open: true },
                { "id": 6, "text": "Air conditioners check", "start_date": "03-04-2018", "duration": "7", "order": "3", "parent": "2", progress: 0.6, open: true },
                { "id": 7, "text": "Workplaces preparation", "start_date": "11-04-2018", "duration": "8", "order": "3", "parent": "3", progress: 0.6, open: true },
                { "id": 8, "text": "Preparing workplaces", "start_date": "14-04-2018", "duration": "5", "order": "3", "parent": "4", progress: 0.5, open: true },
                { "id": 9, "text": "Workplaces importation", "start_date": "14-04-2018", "duration": "4", "order": "3", "parent": "4", progress: 0.5, open: true },
                { "id": 10, "text": "Workplaces exportation", "start_date": "14-04-2018", "duration": "3", "order": "3", "parent": "4", progress: 0.5, open: true },
                { "id": 11, "text": "Product launch", "type": 'gantt.config.types.project', "order": "5", progress: 0.6, open: true },
                { "id": 12, "text": "Perform Initial testing", "start_date": "03-04-2018", "duration": "5", "order": "3", "parent": "11", progress: 1, open: true },
                { "id": 13, "text": "Development", "type": 'gantt.config.types.project', "start_date": "02-04-2018", "duration": "7", "order": "3", "parent": "11", progress: 0.5, open: true },
                { "id": 14, "text": "Analysis", "start_date": "02-04-2018", "duration": "6", "order": "3", "parent": "11", progress: 0.8, open: true },
                { "id": 15, "text": "Design", "type": 'gantt.config.types.project', "start_date": "02-04-2018", "duration": "5", "order": "3", "parent": "11", progress: 0.2, open: false },
                { "id": 16, "text": "Documentation creation", "start_date": "02-04-2018", "duration": "7", "order": "3", "parent": "11", progress: 0, open: true },
                { "id": 17, "text": "Develop System", "start_date": "03-04-2018", "duration": "2", "order": "3", "parent": "13", progress: 1, open: true },
                { "id": 25, "text": "Beta Release", "start_date": "06-04-2018", "order": "3", "type": 'gantt.config.types.milestone', "parent": "13", progress: 0, open: true },
                { "id": 18, "text": "Integrate System", "start_date": "08-04-2018", "duration": "2", "order": "3", "parent": "13", progress: 0.8, open: true },
                { "id": 19, "text": "Test", "start_date": "10-04-2018", "duration": "4", "order": "3", "parent": "13", progress: 0.2, open: true },
                { "id": 20, "text": "Marketing", "start_date": "10-04-2018", "duration": "4", "order": "3", "parent": "13", progress: 0, open: true },
                { "id": 21, "text": "Design database", "start_date": "03-04-2018", "duration": "4", "order": "3", "parent": "15", progress: 0.5, open: true },
                { "id": 22, "text": "Software design", "start_date": "03-04-2018", "duration": "4", "order": "3", "parent": "15", progress: 0.1, open: true },
                { "id": 23, "text": "Interface setup", "start_date": "03-04-2018", "duration": "5", "order": "3", "parent": "15", progress: 0, open: true },
                { "id": 24, "text": "Release v1.0", "start_date": "15-04-2018", "order": "3", "type": 'gantt.config.types.milestone', "parent": "11", progress: 0, open: true }
            ],
            links: [
                { id: "1", source: "1", target: "2", type: "1" },

                { id: "2", source: "2", target: "3", type: "0" },
                { id: "3", source: "3", target: "4", type: "0" },
                { id: "4", source: "2", target: "5", type: "2" },
                { id: "5", source: "2", target: "6", type: "2" },
                { id: "6", source: "3", target: "7", type: "2" },
                { id: "7", source: "4", target: "8", type: "2" },
                { id: "8", source: "4", target: "9", type: "2" },
                { id: "9", source: "4", target: "10", type: "2" },

                { id: "10", source: "11", target: "12", type: "1" },
                { id: "11", source: "11", target: "13", type: "1" },
                { id: "12", source: "11", target: "14", type: "1" },
                { id: "13", source: "11", target: "15", type: "1" },
                { id: "14", source: "11", target: "16", type: "1" },

                { id: "15", source: "13", target: "17", type: "1" },
                { id: "16", source: "17", target: "25", type: "0" },
                { id: "23", source: "25", target: "18", type: "0" },
                { id: "17", source: "18", target: "19", type: "0" },
                { id: "18", source: "19", target: "20", type: "0" },
                { id: "19", source: "15", target: "21", type: "2" },
                { id: "20", source: "15", target: "22", type: "2" },
                { id: "21", source: "15", target: "23", type: "2" },
                { id: "22", source: "13", target: "24", type: "0" }
            ]
        };

        var getListItemHTML = function (type, count, active) {
            return '<li' + (active ? ' class="active"' : '') + '><a href="#">' + type + 's <span class="badge">' + count + '</span></a></li>';
        };

        var updateInfo = function () {
            var state = gantt.getState();
            var tasks = gantt.getTaskByTime(state.min_date, state.max_date);
            var types = gantt.config.types;
            var result = {};
            var html = "";
            var active = false;

            // get available types
            for (var t in types) {
                result[types[t]] = 0;
            }

            // sort tasks by type
            for (var i = 0, l = tasks.length; i < l; i++) {
                if (tasks[i].type && result[tasks[i].type] !== "undefined")
                    result[tasks[i].type] += 1;
                else
                    result[types.task] += 1;
            }

            // render list items for each type
            for (var j in result) {
                if (j === types.task) {
                    active = true;
                }

                else {
                    active = false;
                }

                html += getListItemHTML(j, result[j], active);
            }
            document.getElementById("gantt_info").innerHTML = html;
        };

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
                name: "text", label: "Task name", width: "*", tree: true
            },
            {
                name: "start_time", label: "Start time", template: function (obj) {
                    return gantt.templates.date_grid(obj.start_date);
                }, align: "center", width: 60
            },
            {
                name: "duration", label: "Duration", align: "center", width: 60
            },
            {
                name: "add", label: "", width: 44
            }
        ];

        gantt.config.grid_width = 390;
        gantt.config.date_grid = "%F %d";
        gantt.config.scale_height = 60;
        gantt.config.subscales = [
            { unit: "month", step: 1, date: "Month #%M" }
        ];

        gantt.attachEvent("onAfterTaskAdd", function (id, item) {
            updateInfo();
        });

        gantt.attachEvent("onAfterTaskDelete", function (id, item) {
            updateInfo();
        });

        gantt.init("Phases"); //div name
        gantt.parse(demo_tasks);   //json series data
        //updateInfo();       //limit to edit and new forms
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
        GetPhases: GetPhases,
        changeme: changeme,
        GetSkills: GetSkills,
        GetArchivedActions: GetArchivedActions,
        GetBaselines: GetBaselines
    }
}

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Forms_NewDirectiveForm.js');