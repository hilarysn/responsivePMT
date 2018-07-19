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
    directiveid: "DIR" + jQuery.QueryString["ID"],
    html: "",
    tblinit: 0,
    user: null,
    userID: null,
    skills: [],
    hours: 0,
    Org: null,
    directive: null
};

CKO.FORMS.DIRECTIVES.ViewForm = function () {

    var v = CKO.FORMS.DIRECTIVES.VARIABLES;

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
        var inDesignMode = document.forms[MSOWebPartPageFormName].MSOLayout_InDesignMode.value;
        if (inDesignMode === "1") {
            $("#Directives").html("").append("<div style='margin:5px;text-align:center;font-weight:bold;font-size:14px;font-style:italic;'>Query Suspended During Page Edit Mode</div>");
        }
        else {
            v.site = site;
            resizeModalDialog();
            loadCSS(site + '/SiteAssets/css/jquery.qtip.css');
            loadCSS(site + '/SiteAssets/css/dhtmlxgantt.css');
            loadCSS(site + '/SiteAssets/css/CEWP_Forms_DirectiveForms.css');
            loadCSS(site + '/SiteAssets/css/responsive.bootstrap.min.css');
            loadscript(site + '/SiteAssets/js/dhtmlxgantt.js', function () {
                //GetPhases();
                loadscript(site + '/SiteAssets/js/jquery.qtip.min.js', function () {
                    $.when(CKO.CSOM.GetUserInfo.isuseringroup("PMT Members")).then(function (found) {
                        if (found === true) { //user is in group
                            logit("You are a member of the PMT Members group.");
                            v.role = "Member";
                        }
                        LoadData();
                    }, function (sender, args) {
                        logit("Error getting user data : " + args.get_message());
                    });
                });
            });
        }
    }

    function LoadData() {
        //resizeModalDialog(); // just to be sure!!
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var target = $(e.target).attr("href"); // activated tab
            if (target === "#tabPhases") {
                var h = $("#tabPhases").height() + "px";
                var w = $("#tabPhases").width() + "px";
                logit("w: " + w + ", h: " + h);
                $("#Phases").css({ height: h }, { width: w  });
                GetPhases();
            }
        }); 

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

        // Load the Actions for this Directive on the Actions tab in a table
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
                    // Build out the table to show the actions for this directive.
                    v.html = "<table id='tblActions' cellspacing='0' cellpadding='0' class='table table-bordered table-hover' style='width: 100%;'>";
                    v.html += "<thead><tr><th class='thUser'>User</th><th class='thDate'>Date</th><th class='thHours'>Hours</th><th class='thComment'>Comment</th></tr></thead>";
                    v.html += "<tbody>";
                    for (var i = 0, length = j.length; i < length; i++) {
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
        // Load the Skills for this Directive on the Skills tab in a table

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
            }
        }, function (sender, args) {
            logit("Error getting data from DirectiveSkills list : " + args.get_message());
        });
    }

    function GetPhases() {
        logit("Get Phases Called");
        var tasks = {
            data: [
                {
                    id: 1, text: "Project #2", start_date: "01-04-2018", duration: 18, order: 10,
                    progress: 0.4, open: true
                },
                {
                    id: 2, text: "Task #1", start_date: "02-04-2018", duration: 8, order: 10,
                    progress: 0.6, parent: 1
                },
                {
                    id: 3, text: "Task #2", start_date: "11-04-2018", duration: 8, order: 20,
                    progress: 0.6, parent: 1
                }
            ],
            links: [
                { id: 1, source: 1, target: 2, type: "1" },
                { id: 2, source: 2, target: 3, type: "0" }
            ]
        };

        gantt.init("Phases");
        gantt.parse(tasks);
    }

    return {
        Init: Init
    };
};

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Forms_ViewDirectiveForm2.js');