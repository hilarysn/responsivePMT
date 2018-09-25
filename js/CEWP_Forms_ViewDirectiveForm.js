var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.FORMS = CKO.FORMS || {};
CKO.FORMS.DIRECTIVES = CKO.FORMS.DIRECTIVES || {};
CKO.FORMS.DIRECTIVES.VARIABLES = CKO.FORMS.DIRECTIVES.VARIABLES || {};

CKO.FORMS.DIRECTIVES.VARIABLES = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    directiveid: "DIR" + jQuery.QueryString["ID"],
    itemid: jQuery.QueryString["ID"],
    ganttdata: null,
    startdate: null,
    suspensedate: null,
    parentid: null,
    html: "",
    html2: "",
    html3: "",
    userID: null,
    hours: 0,
    baselinedate: null,        //
    skillsexpendedhours: null, //
    projectedhours: null,      // 
    items: [], //
    total: 0,  //
    count: 0,  //
    directive: null,
    directivedata: [],
    directivedataarray: {}
};

CKO.FORMS.DIRECTIVES.ViewForm = function () {

    var v = CKO.FORMS.DIRECTIVES.VARIABLES;

    function Init(site) {
        loadCSS(site + '/SiteAssets/css/dhtmlskins/terrace/dhtmlx.css');
        loadCSS(site + '/SiteAssets/css/dhtmlxgantt.css');
        loadscript(site + '/SiteAssets/js/dhtmlx.js', function () {
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
                var h = "500px";
                var w = $("#ViewForm").width() - 10 + "px";
                logit("w: " + w + ", h: " + h);
                $("#Phases").css({ height: h }, { width: w });
                GetPhaseData();
            }
        });

        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var target = $(e.target).attr("href"); // activated tab
            if (target === "#tabSkills") {
                var h = "500px";
                var w = $("#ViewForm").width() - 10 + "px";
                logit("w: " + w + ", h: " + h);
                $("#Skills").css({ height: h }, { width: w });
                GetSkills();
                logit("v.skillsexpendedhours: " + v.skillsexpendedhours);
            }
        });
        // end hsn

        $(".datafield").each(function (z) {
            var txt = $(this).text();
            txt = txt.replace(/\t/g, '');
            if ($(this).attr("data-field") === "Directive") {
                //org = org.replace(/\s/g, '');
                txt = txt.replace(/\/(\r\n|\n|\r)/gm, "");
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

                case "DirectiveData":
                    html = "<textarea rows='20' id='txtDirectiveData'></textarea>";
                    $(this).html("").append(html);
                    $("#txtDirectiveData").val(txt);
                    var directivedata = $("#txtDirectiveData").val(txt);
                    v.directivedataarray = $("#txtDirectiveData").val(txt);
                    directivedata = directivedata[0].innerText.replace(/(\|\r\n|\n|\r)/gm, "");
                    console.log("var directivedata: " + directivedata);
                    v.directivedata = directivedata;
                    break;

                case "LeadComments":
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
                logit("Error Status: " + textStatus + ": errorThrown: " + errorThrown);
            },
            success: function (data) {
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                var numitems = data.d.results.length;
                logit("Actions Count: " + numitems);
                if (numitems > 0) {
                    v.skillsexpendedhours = 0;

                    //Build array to hold the current and archived actions for this directive
                    if (numitems > 0) {
                        for (var i = 0; i < j.length; i++) {
                            v.skillsexpendedhours += j[i]["Expended"];//for baselines
                            v.parentid = j[i]["ParentID"]; //sets v.parentid correctly. STOP worrying about it!
                            v.items.push({
                                "User": j[i]["PMTUser"]["Name"],
                                "Date": j[i]["DateCompleted"],
                                "Hours": j[i]["Expended"],
                                "Comment": j[i]["ActionComments"]
                            });
                        }
                    }

                    GetArchivedActions(); // totals for second skills table
                }
            }
        });

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
                            v.skillsexpendedhours += j[i]["Expended"];
                            v.items.push({
                                "User": j[i]["PMTUser"]["Name"],
                                "Date": j[i]["DateCompleted"],
                                "Hours": j[i]["Expended"],
                                "Comment": j[i]["ActionComments"]
                            });
                        }
                    }

                    BuildActionsTable(); //first skills table
                    function BuildActionsTable() {
                        // Build table showing both the current and archived actions for this directive. 
                        var j = v.items;

                        v.html = "<table id='tblActions' cellspacing='0' cellpadding='0' class='table table-bordered table-hover' style='width: 100%;'>";
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

                    //GetSkills();
                    //logit("v.skillsexpendedhours: " + v.skillsexpendedhours);
                }
            });
        }

        $(".ms-descriptiontext").hide();

        logit("Update Dropdowns complete.");

        function GetSkills() {
            if (v.parentid === null) {
                v.parentid = v.directiveid;
            }
            v.html = "";
            v.hours = 0;
            logit("GetSkills Called for ParentID: " + v.parentid);

            // Identify the directive, then display the Estimated Skills and hours for the Directive on the Skills tab
            // in the Estimated Skills and Hours table - ID = tblSkills

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
                    v.projectedhours = v.hours; //for baselines

                    //build skills tab table 2
                    v.html2 += "<tr class='info'>";
                    v.html2 += "<td class='tdblank'>" + "" + "</td>";
                    v.html2 += "<td class='tdlabeltotal'>" + v.projectedhours + "</td>";//Total Projected Hours
                    v.html2 += "<td class='tdhourtotal'>" + v.skillsexpendedhours + "</td>";  //Total Expended Hours
                    v.html2 += "</tr>";
                    $("#tblCurrentTotalsFoot").html("").append(v.html2);
                    logit("Get Archived Actions complete.");

                    GetBaselines();
                }

            }, function (sender, args) {
                logit("Error getting data from DirectiveSkills list : " + args.get_message());
            });

            function GetBaselines() {
                logit("GetBaselines Called");
                v.html3 = "";
                var numitems = 0;
                var results = [];
                var j = "";
                var data = [];
                //v.items = [];
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
                        //implements logging to a central list
                        logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
                    },
                    success: function (data) {
                        results = data.d.results;
                        j = jQuery.parseJSON(JSON.stringify(results));
                        numitems = data.d.results.length;
                        logit("Baselines Count: " + numitems); 
                        if (numitems > 0) {
                            for (var i = 0; i < numitems; i++) {
                                v.html3 += "<tr>";
                                var a = moment(j[i]["BaselineDate"]).add(8, 'hours'); // adding 8 hours because the rest endpoint is subtracting the timezone offset
                                v.html3 += "<td class='tdDate'>" + a.format("DD-MMM-YY") + "</td>";
                                v.html3 += "<td class='tdHours'>" + j[i]["TotalProjectedHours"] + "</td>";
                                v.html3 += "<td class='tdHours'>" + j[i]["TotalExpendedHours"] + "</td>";
                                v.html3 += "</tr>";
                            }
                        }

                        v.html3 += "</tbody></table>";
                        $("#tblSkillsBaselineBody").html("").append(v.html3);                        
                    }

                }, function (sender, args) {
                    logit("Error getting data from DirectiveSkillsBaselines list : " + args.get_message());
                });
            }
        }
        logit("Update Dropdowns complete.");
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

        gantt.config.grid_width = 350;
        gantt.config.scale_height = 30;
        gantt.config.xml_date = "%m/%d/%Y";
        gantt.config.fit_tasks = true;
        gantt.config.scale_unit = "month";
        gantt.config.date_grid = "%M %d";
        gantt.config.date_scale = "%M %Y";
        //gantt.config.scale_unit = "week";
        //gantt.config.date_scale = "Month #%M";


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

        //var els = document.querySelectorAll("input[name='scale']");
        //for (var i = 0; i < els.length; i++) {
        //    els[i].onclick = function (e) {
        //        e = e || window.event;
        //        var el = e.target || e.srcElement;
        //        var value = el.value;
        //        setScaleConfig(value);
        //        gantt.render();
        //    };
        //}

        //$("#ddScale option").each(function () {
        //    if ($(this).html() === scale.text) {
        //        var value = $(this).prop('selected', true);
        //        e = e || window.event;
        //        var el = e.target || e.srcElement;
        //        var value = el.value;
        //        setScaleConfig(value);
        //        gantt.render();
        //    }
        //});       

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
                    gantt.config.scale_height = 40;
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
                    gantt.config.scale_height = 60;
                    gantt.config.subscales = [
                        { unit: "month", step: 1, date: "%M" }
                    ];
                    break;
            }
        }
        setScaleConfig("month");
        gantt.init("Phases"); //div name

        gantt.parse(v.ganttdata);
        gantt.config.readonly = false;
    }

    return {
        Init: Init,
        GetPhases: GetPhases
    };
};

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Forms_ViewDirectiveForm.js');