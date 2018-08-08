var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.FORMS = CKO.FORMS || {};
CKO.FORMS.DIRECTIVES = CKO.FORMS.DIRECTIVES || {};
CKO.FORMS.DIRECTIVES.VARIABLES = CKO.FORMS.DIRECTIVES.VARIABLES || {};

CKO.FORMS.DIRECTIVES.VARIABLES = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    directive: null,
    directiveid: "DIR" + jQuery.QueryString["ID"],
    parentid: null,
    html: "",
    html2: "",
    html3: "",
    userID: null,
    hours: 0,
    expendedhours: null,
    totalexpendedhours: null,
    currenttotalhours: null
};

CKO.FORMS.DIRECTIVES.ViewForm = function () {

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
        LoadData();
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

        $(".datafield").each(function (z) {
            var txt = $(this).text();
            txt = txt.replace(/\t/g, '');
            if ($(this).attr("data-field") === "Directive") {
                //org = org.replace(/\s/g, '');
                txt = txt.replace(/(\r\n|\n|\r)/gm, "");
                txt = txt.trim();
                v.directive = txt;
                logit("Directive: " + v.directive);
            }
            var field = $(this).attr("data-field");
            switch (field) {
                case "DirectiveDescription":
                    html = "<textarea rows='6' id='txt_" + z + "'></textarea>";
                    $(this).html("").append(html);
                    $("#txt_" + z).val(txt);
                    break;

                case "LeadComments":
                    html = "<textarea rows='8' id='txt_" + z + "'></textarea>";
                    $(this).html("").append(html);
                    $("#txt_" + z).val(txt);
                    break;

                case "Lead Comments":
                    html = "<textarea rows='8' id='txt_" + z + "'></textarea>";
                    $(this).html("").append(html);
                    $("#txt_" + z).val(txt);
                    break;

                case "TeamComments":
                    html = "<textarea rows='8' id='txt_" + z + "'></textarea>";
                    $(this).html("").append(html);
                    $("#txt_" + z).val(txt);
                    break;

                default:
                    html = "<input type='text' id='txt_" + z + "' />";
                    $(this).html("").append(html);
                    $("#txt_" + z).val(txt);
                    break;
            }
        });

        $("input").addClass("form-control");
        $("select").addClass("form-control");
        $("textarea").addClass("form-control");

        v.userID = _spPageContextInfo.userId;

        // Load the Actions for this Directive on the Actions tab
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
                logit("Actions Count: " + numitems);
                if (numitems > 0) {
                    // Build the table that shows the estimated skills used in this directive's actions.
                    v.expendedhours = 0;
                    v.html = "<table id='tblActions' cellspacing='0' cellpadding='0' class='table table-bordered table-hover' style='width: 100%;'>";
                    v.html += "<thead><tr><th class='thUser'>User</th><th class='thDate'>Date</th><th class='thHours'>Hours</th><th class='thComment'>Comment</th></tr></thead>";
                    v.html += "<tbody>";
                    for (var i = 0, length = j.length; i < length; i++) {
                        v.html += "<tr>";
                        v.html += "<td class='tdUser'>" + j[i]["PMTUser"]["Name"] + "</td>";
                        var a = moment(j[i]["DateCompleted"]).add(8, 'hours'); // adding 8 hours because the rest endpoint is subtracting the timezone offset
                        v.html += "<td class='tdDate'>" + a.format("DD-MMM-YY") + "</td>";
                        v.html += "<td class='tdHours'>" + j[i]["Expended"] + "</td>";
                        v.expendedhours += j[i]["Expended"];//for baselines
                        v.html += "<td class='tdComment'>" + j[i]["ActionComments"] + "</td>";
                        v.html += "</tr>";
                    }
                    v.html += "</tbody></table>";
                    $("#tabActions").html("").append(v.html);
                }

                $(".ms-descriptiontext").hide();

                logit("Update Dropdowns complete.");

                GetSkills();
            }
        });
    }

    function GetSkills() {
        logit("GetSkills Called");
        v.html = "";
        // v.directive = String($("input[title='Directive Required Field']").val());
        // // Identify the directive, then display the Estimated Skills and hours for the Directive on the Skills tab
        // // in the Estimated Skills and Hours table - ID = tblSkills
        // // Managed Metadata not really supported by REST so using CSOM here
        var inc = "Include(";
        var xml = "<View><Method Name='Read List' /><Query><OrderBy><FieldRef Name='Hours' /></OrderBy><Where><Eq><FieldRef Name='ParentID' /><Value Type='Text'>" + v.directiveid + "</Value></Eq></Where></Query>";
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
                while (enumerator.moveNext()) {
                    var prop = enumerator.get_current();
                    var hours = parseInt(prop.get_item("Hours"));
                    var skill = prop.get_item("Skill");
                    skill = skill.split("|");
                    v.html += "<tr>";
                    v.html += "<td>" + skill[0] + "</td>";
                    v.html += "<td class='tdHours'>" + prop.get_item("Hours") + "</td>";
                    v.hours += hours;
                    v.html += "</tr>";
                }
                $("#tblSkillsBody").html("").append(v.html);
                $("#skilltotal").html("").append(v.hours);
                v.currenttotalhours = v.hours;
            }

            GetArchivedActions(); // second skills table
            GetBaselines();       // third skills table

        }, function (sender, args) {
            logit("Error getting data from DirectiveSkills list : " + args.get_message());
        });
    }

    function GetArchivedActions() {
        logit("GetArchivedeActions Called");
        v.html2 = "";
        // 1. Get total number of hours currently expended for the directive from the Actions 
        //    list and the ArchivedActions list --> Display Total Hours Expended (v.expendedhours)
        // 2. Get current total of estimated skill hours (projected hours) from DirectiveSkills list 
        // 3. Write second row   td 1 v.hours   td 2 v.totalexpendedhours

        var urlString = v.site + "/_vti_bin/listdata.svc/ArchivedActions?";
        urlString += "$select=Id,PMTUser,Expended,ParentID";
        urlString += "&$expand=PMTUser";
        urlString += "&$filter=(ParentID eq '" + v.directiveid + "')";
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
                var archivedexpendedhours = 0;
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                var numitems = data.d.results.length;
                logit("Actions Count: " + numitems);
                if (numitems > 0) {
                    for (var i = 0, length = j.length; i < length; i++) {
                        archivedexpendedhours += j[i]["Expended"];
                    }
                }

                v.totalexpendedhours = archivedexpendedhours + v.expendedhours;

                v.html2 += "<tr class='info'>";
                v.html2 += "<td class='tdblank'>" + "" + "</td>";
                v.html2 += "<td class='tdlabeltotal'>" + v.currenttotalhours + "</td>";
                v.html2 += "<td class='tdhourtotal'>" + v.totalexpendedhours + "</td>";
                v.html2 += "</tr>";
                $("#tblCurrentTotalsFoot").html("").append(v.html2);
                logit("Get Archived Actions complete.");
            }
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
                        var a = moment(j[i]["BaselineDate"]).add(8, 'hours'); // adding 8 hours because the rest endpoint is subtracting the timezone offset
                        v.html3 += "<td class='tdDate'>" + a.format("DD-MMM-YY") + "</td>";
                        v.html3 += "<td class='tdHours'>" + j[i]["TotalProjectedHours"] + "</td>";
                        v.html3 += "<td class='tdHours'>" + j[i]["TotalExpendedHours"] + "</td>";
                        v.html3 += "</tr>";
                    }
                }
                v.html += "</tbody></table>";
                $("#tblSkillsBaselineBody").html("").append(v.html3);

            }
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

    return {
        Init: Init
    };
};

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Forms_ViewDirectiveForm.js');