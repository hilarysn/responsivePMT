var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.DASHBOARD = CKO.DASHBOARD || {};
CKO.DASHBOARD.VARIABLES = CKO.DASHBOARD.VARIABLES || {};

CKO.DASHBOARD.VARIABLES = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    id: null,
    ctx: null,
    web: null,
    list: null,
    item: null,
    user: null,
    groups: null,
    LoginName: null,
    userID: null,
    directives: null,
    total: 0,
    count: 0,
    role: "Visitor",
    html: "",
    chtml: ""
}


CKO.DASHBOARD.Directives = function () {

    var v = CKO.DASHBOARD.VARIABLES;

    function Init(site) {
        v.site = site;
        var inDesignMode = document.forms[MSOWebPartPageFormName].MSOLayout_InDesignMode.value;
        if (inDesignMode === "1") {
            $("#Directives").html("").append("<div style='margin:5px;text-align:center;font-weight:bold;font-size:14px;font-style:italic;'>Query Suspended During Page Edit Mode</div>");
        }
        else {
            loadCSS(site + '/SiteAssets/css/CEWP_Dashboard_Directives.css');
            //loadCSS(site + '/SiteAssets/css/responsive.bootstrap.min.css');
            loadCSS(site + '/SiteAssets/css/jquery.qtip.css');
            loadscript(site + '/SiteAssets/js/jquery.qtip.min.js', function () {
                $.when(CKO.CSOM.GetUserInfo.isuseringroup("PMT Members")).then(function (found) {
                    if (found === true) { //user is in group
                        logit("You are a member of the PMT Members group.");
                        v.role = "Member";
                    }
                    LoadDirectives();
                }, function (sender, args) {
                    logit("Error getting user data : " + args.get_message());
                });
            });
        }
    }

    function LoadDirectives() {
        v.directives = [];
        v.props = [];
        //Load Directives From REST to filter archived ones out
        var urlString = v.site + "/_vti_bin/listdata.svc/Directives?";
        urlString += "$select=Id,Directive,DirectiveDescription,DirectiveStatusValue,LeadAssessmentValue,SuspenseDate,StaffLead,SupportedOrg,SupportingOrg,MannedValue,TrainedValue,EquippedValue,Expended,PercentExpended,ProjectedManHours,LeadComments,TeamComments";
        urlString += "&$expand=StaffLead";
        urlString += "&$filter=(DirectiveStatusValue eq 'InProgress')";
        urlString += "&$orderby=SuspenseDate";
        logit(urlString);
        jQuery.ajax({
            url: urlString,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                v.total = j.length;
                v.total = v.total * 2; // We will be getting 2 comment fields for each directive this ensures that we get all of them
                var resourced = "";
                v.html += "<table id='tblDirectives' cellspacing='0' cellpadding='0' class='table table-bordered table-hover'>"
                v.html += "<thead><tr><th class='squarekpi'>Lead<br/>Assessment</th><th colspan='2'>Team Comments</th><th class='titlecolumn'>Directive</th><th class='circlekpi'>Status</th><th>Suspense</th><th>Lead</th><th>Supported Org</th><th>Supporting Org</th><th class='circlekpi'>Resourced</th><th>Expended</th><th>Percent<br/>Expended</th></tr></thead>";
                v.html += "<tbody>";
                for (var i = 0, length = j.length; i < length; i++) {
                    v.html += "<tr>";
                    la = j[i]["LeadAssessmentValue"];
                    if (j[i]["MannedValue"] !== null || j[i]["MannedValue"] !== undefined) {
                        ap = j[i]["MannedValue"];
                    }
                    else {
                        ap = "Green;1";
                    }
                    pe = ((j[i]["PercentExpended"]) * 100).toFixed(1);
                    pe = Number(pe);
                    ped = null;
                    switch (true) {
                        case (pe > 90):
                            ped = "red";
                            break;

                        case (pe >= 80):
                            ped = "yellow";
                            break;

                        case (pe < 80):
                            ped = "green"
                            break;
                    }
                    e = j[i]["EquippedValue"];
                    e = e.split(";");
                    t = j[i]["TrainedValue"];
                    t = t.split(";");
                    la = la.split(";");
                    switch (la[0]) {
                        case "Green":
                            v.html += "<td class='greensquare latip' id='LeadComments2_" + j[i]["Id"] + "'></td>";
                            break;

                        case "Amber":
                            v.html += "<td class='yellowsquare latip' id='LeadComments2_" + j[i]["Id"] + "'></td>";
                            break;

                        case "Red":
                            v.html += "<td class='redsquare latip' id='LeadComments2_" + j[i]["Id"] + "'></td>";
                            break;

                        default:
                            v.html += "<td></td>";
                            break;
                    }

                    v.html += "<td class='tdTeamComments'><span class='spnComment' id='TeamComments_" + j[i]["Id"] + "'></span></td><td><button type='button' data-comment='" + j[i]["TeamComments"] + "' data-id='" + j[i]["Id"] + "' class='btn btn-sm btn-success btnComment'>Add</button></td>";
                    //v.html += "<td><span class='spnComment' id='TeamComments_" + j[i]["Id"] + "'>" + j[i]["TeamComments"] + "</span></td><td><button type='button' data-comment='" + j[i]["TeamComments"] + "' data-id='" + j[i]["Id"] + "' class='btn btn-sm btn-success btnComment'>Add</button></td>";
                    //v.html += "<td><table class='spnComment' id='TeamComments_" + j[i]["Id"] + "'></table></td><td><button type='button' data-comment='" + j[i]["TeamComments"] + "' data-id='" + j[i]["Id"] + "' class='btn btn-sm btn-success btnComment'>Add</button></td>";

                    v.html += "<td class='tdtip' data-ttip='" + EncodeHTML(j[i]["DirectiveDescription"]) + "'><a href='#' class='lnkDirective' data-id='" + j[i]["Id"] + "' data-directive='" + j[i]["Directive"] + "'>" + j[i]["Directive"] + "</a></td>";
                    
                    var a = moment(j[i]["SuspenseDate"]);
                    a.add(a.utcOffset() * -1, 'm');
                    var b = moment();
                    var c = a.diff(b, 'days');
                    var d;
                    var pt;
                    switch (true) {
                        case (c < 0):
                            d = "redcircle powerTip";
                            pt = Math.abs(c) + " days past due.";
                            break;

                        case (c === 0):
                            d = "yellowcircle powerTip";
                            pt = "due today."
                            break;

                        case (c <= 7):
                            d = "yellowcircle powerTip";
                            pt = c + " days left."
                            break;

                        case (c > 7):
                            d = "greencircle powerTip";
                            pt = c + " days left."
                            break;
                    }
                    v.html += "<td class='" + d + "' data-powertip='" + pt + "'></td>";
                    v.html += "<td>" + a.format("YYYY-MM-DD") + "</td>";
                    var sl = j[i]["StaffLead"]["LastName"];
                    v.html += "<td>" + sl + "</td>";
                    v.html += "<td>" + j[i]["SupportedOrg"] + "</td>";
                    v.html += "<td>" + j[i]["SupportingOrg"] + "</td>";
                    ap = ap.split(";");
                    //r = Math.round(((Number(la[1]) * 2) + Number(e[1]) + Number(t[1])) / 3);
                    r = Math.round(((Number(ap[1]) * 2) + Number(e[1]) + Number(t[1])) / 3);
                    switch (true) {
                        case (r === 1):
                            d = "greencircle powerTip";
                            break;

                        case (r === 2):
                            d = "yellowcircle powerTip";
                            break;

                        case (r === 3):
                            d = "redcircle powerTip";
                            break;
                    }
                    var imga = $("<img style='width:16px;'/>");
                    imga.attr("class", "powerTip");
                    imga.attr("src", "../SiteAssets/images/" + la[0].toLowerCase() + "dot.png");
                    var imgb = $("<img style='width:16px;'/>");
                    imgb.attr("class", "powerTip");
                    imgb.attr("src", "../SiteAssets/images/" + t[0].toLowerCase() + "dot.png");
                    var imgc = $("<img style='width:16px;'/>");
                    imgc.attr("class", "powerTip");
                    imgc.attr("src", "../SiteAssets/images/" + e[0].toLowerCase() + "dot.png");
                    resourced = "" + imga.prop('outerHTML') + "&nbsp;Manned<br/>" + imgb.prop('outerHTML') + "&nbsp;Trained<br/>" + imgc.prop('outerHTML') + "&nbsp;Equipped";

                    v.html += "<td class='" + d + "' data-powertip='" + resourced + "'></td>";
                    v.html += "<td>" + j[i]["Expended"] + "</td>";
                    v.html += "<td>" + ((j[i]["PercentExpended"]) * 100).toFixed(1) + "%</td>";
                    v.html += "</tr>";
                }
                v.html += "</tbody></table>";
                $("#Directives").html("").append(v.html);
                // Get comment history for all directives
                $(".spnComment").each(function (e) {
                    var tp1 = String($(this).attr("id"));
                    getFieldHistory(tp1.split("_")[1], tp1.split("_")[0]);
                });

                $(".latip").each(function (e) {
                    var tp1 = String($(this).attr("id"));
                    getFieldHistory(tp1.split("_")[1], tp1.split("_")[0]);
                });

                //DataLoaded();
            }
        });
    }

    function getFieldHistory(itemId, fieldName) { //Get each item version history with comment using SPServices
        var gfhdata = {};
        gfhdata.id = itemId;
        gfhdata.fieldname = fieldName;
        $().SPServices({
            operation: "GetVersionCollection",
            strlistID: "{CB5BAD9F-8013-4DF2-B3DD-4456F6A70A1C}", // Directives list GUID
            strlistItemID: itemId,
            strFieldName: fieldName,
            completefunc: gfhComplete.bind(gfhdata)
        });
    }

    function gfhComplete(xData, Status) {
        v.count += 1;
        var gfhdata = this;
        v.chtml = "<div class='tblComment'><table><tbody>";
        var xmlDoc = $.parseXML(xData.responseText);
        $xml = $(xmlDoc);
        $xml.find("Versions > Version").each(function (index) {
            AdditionalComments = $(this).attr(gfhdata.fieldname);
            var Editor = $(this).attr("Editor");
            Editor = Editor.substring(0, Editor.indexOf(','));
            Editor = Editor.split('#')[1];
            var Modified = moment($(this).attr("Modified")).add(8, "hours").format("MM-DD-YYYY");
            if (index === 0) {
                // This should be the latest comment so update the team comment if this is as team comment
                if (gfhdata.fieldname === "TeamComments") {
                    $("#" + gfhdata.fieldname + "_" + gfhdata.id).html(Editor + ' (' + Modified + '): ' + AdditionalComments);
                }
            }
            v.chtml += '<tr><td>' + Editor + ' (' + Modified + '): ' + AdditionalComments + '</td></tr>';
        });
        v.chtml += "</tbody></table></div>";
        //$("#" + gfhdata.fieldname + "_" + gfhdata.id).attr("data-ttip", EncodeHTML(v.chtml));
        $("#" + gfhdata.fieldname + "_" + gfhdata.id).attr("data-ttip", v.chtml);
        if (v.count === v.total) {
            DataLoaded();
        }
    }

    function DataLoaded() {
        logit("Data Loaded");
        $(".lnkDirective").on("click", function (e) {
            e.preventDefault();
            var zurl = fixurl('/Lists/Directives/DispForm.aspx?ID=' + $(this).attr("data-id") + '&Directive=' + $(this).attr("data-directive") + '&IsDlg=1');
            CKODialog(zurl, 'View Directive', '1100', '800', 'NotificationCallback');
        });

        $(".btnComment").on("click", function (e) {
            e.preventDefault();
            v.id = $(this).attr("data-id");
            var comment = $(this).attr("data-comment");
            v.html = "";
            v.html += "<textarea id='txtComments' cols='50' rows='8'>" + comment + "</textarea>";
            v.html += "<a href='#' type='button' class='btn btn-success btnAddComment'>Add</a>";
            $("#PMTModalBody").html('').append(v.html);
            v.html = "";
            $("#PMTModalTitle").html('Add Team Comment');
            tmp2 = $("#PMTModal").modal({
                "backdrop": true,
                "keyboard": false,
                "show": true
            });
            $(".btnAddComment").on("click", function (e) {
                var commentdata = {};
                commentdata.id = v.id;
                commentdata.comment = $("#txtComments").val();
                e.preventDefault();
                v.ctx = SP.ClientContext.get_current();
                v.list = v.ctx.get_web().get_lists().getByTitle("Directives");
                v.item = v.list.getItemById(v.id, "Include(EncodedAbsUrl, ContentType)");
                v.item.set_item('TeamComments', $("#txtComments").val());
                v.item.update();
                v.ctx.load(v.item);
                v.ctx.executeQueryAsync(AddItemsSucceeded.bind(commentdata), AddItemsFailed);
                $("#PMTModal").modal('hide');
            });
        });
        
        $(".powerTip").powerTip({
            placement: "n"
        });

        $(".tdtip").qtip({
            content: { attr: 'data-ttip' },
            position: {
                my: 'top left',
                at: 'top right'
            },
            style: { width: '400px' }
        });

        $(".spnComment").qtip({
            content: {
                text: function (api) {
                    var tbl = $(this).attr('data-ttip');
                    return tbl;
                }
            },
            position: {
                my: 'top left',
                at: 'top right'
            },
            style: { width: '400px' }
        });

        $(".latip").qtip({
            content: {
                text: function (api) {
                    var tbl = $(this).attr('data-ttip');
                    return tbl;
                }
            },
            position: {
                my: 'top left',
                at: 'top right'
            },
            style: { width: '400px' }
        });
    }

    function AddItemsSucceeded() {
        SP.UI.Notify.addNotification('Comment Added', false);
        $("#TeamComments_" + this.id).html(this.comment);
        //v.html = "<table style='height:100%;width:100%;'><tr><td align='center'><img src='/_layouts/images/gears_an.gif' /></td></tr><tr><td align='center'><div style='margin-top: 10px; font-size: 16px;'>Getting Data...Please wait.</div></td></tr></table >";
        //$("#Directives").html("").append(v.html);
        //LoadDirectives();
    }

    function AddItemsFailed() {
        alert("Comment could not be added.");
    }

    //task components{
//{
//    "id": 25,                             //Parent ID
//    "text": "Beta Release",               //Directive
//    "start_date": "06-04-2018",           //StartDate
//    "order": "3",				            //* Order    //whole number
//    "type": gantt.config.types.milestone,	//* Type
//    "parent": "13", 				        //* Parent   //whole number
//    progress: 0, 				            //* Progress //number.XX
//    open: true                            //* Open     //true false
//},
//{
//    "id": 15,
//    "text": "Design",
//    "type": gantt.config.types.project,
//    "start_date": "02-04-2018",
//    "duration": "5", 			            //* Duration //whole number
//    "order": "3",
//    "parent": "11",
//    progress: 0.2,
//    open: false
//}, {                                      //Task link data
//    id: "2",                              //* LinkID
//        source: "2",                      //* Source
//        target: "3",                      //* Target
//        type: "0" 		                //* LinkType
//  },

    var demo_tasks = {
        //Get data from directives
        data: [
            { "id": 1, "text": "Office itinerancy", "type": gantt.config.types.project, "order": "10", progress: 0.4, open: false },
            { "id": 2, "text": "Office facing", "type": gantt.config.types.project, "start_date": "02-04-2018", "duration": "8", "order": "10", progress: 0.6, "parent": "1", open: true },
            { "id": 3, "text": "Furniture installation", "type": gantt.config.types.project, "start_date": "11-04-2018", "duration": "8", "order": "20", "parent": "1", progress: 0.6, open: true },
            { "id": 4, "text": "The employee relocation", "type": gantt.config.types.project, "start_date": "13-04-2018", "duration": "6", "order": "30", "parent": "1", progress: 0.5, open: true },
            { "id": 5, "text": "Interior office", "start_date": "02-04-2018", "duration": "7", "order": "3", "parent": "2", progress: 0.6, open: true },
            { "id": 6, "text": "Air conditioners check", "start_date": "03-04-2018", "duration": "7", "order": "3", "parent": "2", progress: 0.6, open: true },
            { "id": 7, "text": "Workplaces preparation", "start_date": "11-04-2018", "duration": "8", "order": "3", "parent": "3", progress: 0.6, open: true },
            { "id": 8, "text": "Preparing workplaces", "start_date": "14-04-2018", "duration": "5", "order": "3", "parent": "4", progress: 0.5, open: true },
            { "id": 9, "text": "Workplaces importation", "start_date": "14-04-2018", "duration": "4", "order": "3", "parent": "4", progress: 0.5, open: true },
            { "id": 10, "text": "Workplaces exportation", "start_date": "14-04-2018", "duration": "3", "order": "3", "parent": "4", progress: 0.5, open: true },
            { "id": 11, "text": "Product launch", "type": gantt.config.types.project, "order": "5", progress: 0.6, open: true },
            { "id": 12, "text": "Perform Initial testing", "start_date": "03-04-2018", "duration": "5", "order": "3", "parent": "11", progress: 1, open: true },
            { "id": 13, "text": "Development", "type": gantt.config.types.project, "start_date": "02-04-2018", "duration": "7", "order": "3", "parent": "11", progress: 0.5, open: true },
            { "id": 14, "text": "Analysis", "start_date": "02-04-2018", "duration": "6", "order": "3", "parent": "11", progress: 0.8, open: true },
            { "id": 15, "text": "Design", "type": gantt.config.types.project, "start_date": "02-04-2018", "duration": "5", "order": "3", "parent": "11", progress: 0.2, open: false },
            { "id": 16, "text": "Documentation creation", "start_date": "02-04-2018", "duration": "7", "order": "3", "parent": "11", progress: 0, open: true },
            { "id": 17, "text": "Develop System", "start_date": "03-04-2018", "duration": "2", "order": "3", "parent": "13", progress: 1, open: true },
            { "id": 25, "text": "Beta Release", "start_date": "06-04-2018", "order": "3", "type": gantt.config.types.milestone, "parent": "13", progress: 0, open: true },
            { "id": 18, "text": "Integrate System", "start_date": "08-04-2018", "duration": "2", "order": "3", "parent": "13", progress: 0.8, open: true },
            { "id": 19, "text": "Test", "start_date": "10-04-2018", "duration": "4", "order": "3", "parent": "13", progress: 0.2, open: true },
            { "id": 20, "text": "Marketing", "start_date": "10-04-2018", "duration": "4", "order": "3", "parent": "13", progress: 0, open: true },
            { "id": 21, "text": "Design database", "start_date": "03-04-2018", "duration": "4", "order": "3", "parent": "15", progress: 0.5, open: true },
            { "id": 22, "text": "Software design", "start_date": "03-04-2018", "duration": "4", "order": "3", "parent": "15", progress: 0.1, open: true },
            { "id": 23, "text": "Interface setup", "start_date": "03-04-2018", "duration": "5", "order": "3", "parent": "15", progress: 0, open: true },
            { "id": 24, "text": "Release v1.0", "start_date": "15-04-2018", "order": "3", "type": gantt.config.types.milestone, "parent": "11", progress: 0, open: true }
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
        var state = gantt.getState(),
            tasks = gantt.getTaskByTime(state.min_date, state.max_date),
            types = gantt.config.types,
            result = {},
            html = "",
            active = false;

        // get available types
        for (var t in types) {
            result[types[t]] = 0;
        }
        // sort tasks by type
        for (var i = 0, l = tasks.length; i < l; i++) {
            if (tasks[i].type && result[tasks[i].type] != "undefined")
                result[tasks[i].type] += 1;
            else
                result[types.task] += 1;
        }
        // render list items for each type
        for (var j in result) {
            if (j == types.task)
                active = true;
            else
                active = false;
            html += getListItemHTML(j, result[j], active);
        }

        document.getElementById("gantt_info").innerHTML = html;
    };

    gantt.templates.scale_cell_class = function (date) {
        if (date.getDay() == 0 || date.getDay() == 6) {
            return "weekend";
        }
    };
    gantt.templates.task_cell_class = function (item, date) {
        if (date.getDay() == 0 || date.getDay() == 6) {
            return "weekend";
        }
    };

    gantt.templates.rightside_text = function (start, end, task) {
        if (task.type == gantt.config.types.milestone) {
            return task.text;
        }
        return "";
    };

    gantt.config.columns = [
        { name: "text", label: "Task name", width: "*", tree: true },
        {
            name: "start_time", label: "Start time", template: function (obj) {
                return gantt.templates.date_grid(obj.start_date);
            }, align: "center", width: 60
        },
        { name: "duration", label: "Duration", align: "center", width: 60 },
        { name: "add", label: "", width: 44 }
    ];

    gantt.config.grid_width = 390;
    gantt.config.date_grid = "%F %d";
    gantt.config.scale_height = 60;
    gantt.config.subscales = [
        { unit: "week", step: 1, date: "Week #%W" }
    ];

    gantt.attachEvent("onAfterTaskAdd", function (id, item) {
        updateInfo();
    });
    gantt.attachEvent("onAfterTaskDelete", function (id, item) {
        updateInfo();
    });

    gantt.init("gantt_here");
    gantt.parse(demo_tasks);
    updateInfo();

}


    return {
        Init: Init
    }
}

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Dashboard_DirectivesExtended.js');