var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.DASHBOARD = CKO.DASHBOARD || {};
CKO.DASHBOARDS.ALLDASHBOARDS = CKO.DASHBOARDS.ALLDASHBOARDS || {};
CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES || {};

CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.SKILLS = {
    userID: null,
    site: null,
    daterange: {}, //
    loc: String(window.location),
    waitmsg: null,
    data: [],
    json: null,         //delete?
    totalhours: 0,
    isdaterange: false, //
    startdate: null,    //
    enddate: null,      //
    chartdata: null,
    skills: [],
    //timefilter: "Q",
    timefilter: "M",
    html: null,  //BuildMeATable
    reporttable: null,  //BuildMeATable
    chart: null,
    test: null,
    list: null,  
    items: [],       //
    listitems: null  //
};

CKO.DASHBOARDS.ALLDASHBOARDS.Skills = function () {

    var v = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.SKILLS;

    function Init(site, id, timefilter, isdaterange, start, end) {     //
        loadCSS('https://hq.tradoc.army.mil/sites/ocko/SiteAssets/css/AllDashboardReports2.css');

        v.site = site;
        v.chart = id;
        v.timefilter = timefilter;
        v.userID = _spPageContextInfo.userId;  

        if (isdaterange) {
            v.startdate = start;
            v.enddate = end;
            v.isdaterange = true;
        }

        //check to see if this is not the first time querying
        if (persontypefilter !== "All" || orgfilter !== "All" || timefilter !== "M") {
            logit("doing default " + id + " variables");
            v.totalhours = 0;
            v.skills = [];
            v.data = [];
            v.items = [];     // new
            v.json = null;    // delete?
            v.url = null;     // delete?
            v.reporttable = null;
            v.chartdata = null;

            $().SPSTools_Notify({ type: 'wait', content: 'Loading your filtered content... Please wait a very long time...' });

        } else {

            logit("doing default " + id + " variables");
            v.totalhours = 0;
            v.skills = [];
            v.data = [];
            v.items = [];     // new
            v.json = null;    // delete?
            v.url = null;     // delete?
            v.reporttable = null;
            v.chartdata = null;
            v.chart = id;

            $().SPSTools_Notify({ type: 'wait', content: 'Loading your default content... Please wait a very long time...' });
        }

        if (moment().quarter() === 4) {                                 
            v.ThisFY = moment().add('year', 1).format("YYYY");          
        } else {                                                        
            v.ThisFY = moment().format("YYYY");                         
        }

        LoadItems();
    }

    function LoadItems() {

        var today = new Date();                                                                                                                         //
        var month, quarter, weekstart, weekend;                                                                                                         //
        var quarters = { "Jan": 2, "Feb": 2, "Mar": 2, "Apr": 3, "May": 3, "Jun": 3, "Jul": 4, "Aug": 4, "Sep": 4, "Oct": 1, "Nov": 1, "Dec": 1 };      //
        month = today.format("MMM");                                                                                                                    //
        quarter = quarters[month];                                                                                                                      //
        weekstart = moment(today).startOf('week');                                                                                                      //
        weekend = moment(today).endOf('week');

        var fc = 0    //filter count
        var ft = "";  //time
        var fo = "";  //org
        var fp = "";  //person
        var vf = "";
        var filterstart = "<View><Method Name='Read List' /><Query><OrderBy><FieldRef Name='Id' /></OrderBy><Where>";
        var filterend = "</Where>";
        var filter = "";              

        switch (v.timefilter) {                                                                                                        //
            case "Y":
                fc += 1; // to ensure graceful failure
                //ft += "<FieldRef Name='DateCompleted' />" ;
                //ft += "<Geq><Value Type='DateTime'>" + moment().subtract(1, 'years').format('YYYY-MM-DD[T]HH:MM:[00Z]') + ")";
                //ft += "</Value></Geq>";
                break;

            case "Q":
                fc += 1;
                ft += "<Geq><FieldRef Name='DateCompleted' />";
                ft += "<Value Type='DateTime'>" + moment().subtract(90, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]');
                ft += "</Value></Geq>";
                break;

            case "M":
                fc += 1;
                ft += "<Geq><FieldRef Name='DateCompleted' />";
                ft += "<Value Type='DateTime'>" + moment().subtract(30, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]');
                ft += "</Value></Geq>";
                break;

            case "W":
                fc += 1;
                ft += "<Geq><FieldRef Name='DateCompleted' />";
                ft += "<Value Type='DateTime'>" + moment().subtract(7, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]');
                ft += "</Value></Geq>";
                break;

            case "R":
                fc += 1; // to ensure graceful failure
                //ft += "<Geq><FieldRef Name='DateCompleted' />";
                //ft += "<Value Type='DateTime'>" + moment(v.startdate).format('YYYY-MM-DD[T]HH:MM:[00Z]');
                //ft += "</Value></Geq>";
                //ft += "<Leq><FieldRef Name='DateCompleted' />";
                //ft += "<Value Type='DateTime'>" + moment(v.enddate).format('YYYY-MM-DD[T]HH:MM:[00Z]');
                //ft += "</Value></Leq>";
                //ft += "</And >";
                break;                                                                                                                
        }

        filter += filterstart + ft + filterend;

        //switch (fc) {

        //    case 1:
        //        filter += filterstart + ft + filterend;
        //        break;

        //    case 2:
        //        filter += filterstart + "<And>" + ft +  fp + "</And>" + filterend;
        //        break;

        //    case 4:
        //        filter += filterstart + "<And><And>" + ft + fp + "</And>" + fo + "</And>" + filterend;
        //        break;
        //}

        var inc = "Include(";

        var fields = ["Id", "Title", "Expended", "DateCompleted", "PersonType", "Organization", "Skill"];
        vf += "<ViewFields>";
        for (var z = 0; z <= fields.length - 1; z++) {
            vf +=  "<FieldRef Name='" + fields[z] + "'/>";
            if (z === fields.length - 1) {
                inc += fields[z] + ")";
            }
            else {
                inc += fields[z] + ", ";
            }
        }

        vf += "<FieldRef Name='Id'/>";
        vf += "</ViewFields>";
        vf += "<RowLimit>2000</RowLimit></Query></View>";//

        filter += vf;
        logit("CAML Query: " + filter);

        v.ctx = new SP.ClientContext.get_current();
        v.list = v.ctx.get_web().get_lists().getByTitle("Actions");
        v.qry = new SP.CamlQuery();
        v.qry.set_viewXml(filter);
        v.listitems = v.list.getItems(v.qry);
        v.ctx.load(v.listitems);
        v.ctx.executeQueryAsync(LoadItemsSucceeded, LoadItemsFailed);
    };

    function LoadItemsSucceeded() {
        var enumerator = v.listitems.getEnumerator();
        while (enumerator.moveNext()) {
            var item = enumerator.get_current();
            var skill = item.get_item("Skill");
            if (skill !== null) {
                skill = skill.split("|")[0];
                v.items.push({
                    title: item.get_item("Title"),
                    skill: skill,
                    hours: item.get_item("Expended"),
                });
            }
        }
        var position = v.listitems.get_listItemCollectionPosition();
        if (position !== null) {
            v.qry.set_listItemCollectionPosition(position);
            v.listitems = v.list.getItems(v.qry);
            v.ctx.load(v.listitems);
            v.ctx.executeQueryAsync(LoadItemsSucceeded, LoadItemsFailed);
        }
        else {
            AllActionsLoaded();
        }
    }

    function LoadItemsFailed(sender, args) {
        logit("Error getting data from Actions list : " + args.get_message());
        $("#SPSTools_Notify").fadeOut("2500", function () {
            $("#SPSTools_Notify").html("");
        });
    }

    function AllActionsLoaded() {
        logit(v.items.length + " Actions Loaded.");
        DataLoaded();
    }

    function DataLoaded() { // for this function, changed  v.json to v.items v.listitems
        logit("Skills Chart: All Data Loaded");
        v.totalhours = 0;
        var j = v.items;
        //var numitems = v.items.length; // is this ever used again? I think not. Delete?

        // Now loop through the data to get the different skills based on the action
        // need to aggregate skills, then add up expended hours

        for (var k = 0; k < v.items.length; k++) {
            for (var i = 0; i < j.length; i++) {
                // This is all of the actions from the qry so now update the hours for each Function by adding the hours to that array
                var test = (j[i]["skill"]);

                if (v.items[k].skill === test) {
                    v.items[k].hours += j[i]["skill"];
                    v.totalhours += j[i]["hours"];
                }
            }
        }

        // Create data for the series using the functions
        v.chartdata = [];
        for (var cd = 0; cd < v.skills.length; cd++) {
            v.chartdata.push({
                "name": v.skills[cd]["skill"],
                "y": v.skills[cd]["hours"],
                "index": v.skills[cd]["index"]
            });
        }

        console.log(JSON.stringify(v.chartdata));
        DrawPieChart();

        $("#Skills_panel").find(".highcharts-root").attr("id", "SkillsSVG");
        var xmlns = "http://www.w3.org/2000/svg";
        var TotalBox = document.createElementNS(xmlns, "text");

        TotalBox.setAttributeNS(null, "x", 80);
        TotalBox.setAttributeNS(null, "y", 24);
        TotalBox.setAttributeNS(null, "text-anchor", "middle");
        TotalBox.setAttributeNS(null, "style", "font-size: 16px; fill: #333333;");
        var TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        TotalBox.appendChild(TotalText);
        document.getElementById("SkillsSVG").appendChild(TotalBox);

        v.reporttable = BuildMeATable(v.chartdata);
        $("#tblLegend_Skills").html("").append(v.reporttable);

        $("#SPSTools_Notify").fadeOut("2500", function () {
            $("#SPSTools_Notify").html("");
        });
    }
    
    function DrawPieChart() {
        Highcharts.chart('Skills_panel', {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            exporting: {
                buttons: {
                    contextButton: {
                        enabled: true
                    }
                }
            },
            title: {
                text: 'Skills'
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.y}</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.0f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        }
                    }
                }
            },
            series: [{
                name: 'Hours',
                colorByPoint: true,
                data: v.chartdata
            }]
        });
    }

    // function BuildMeATable(rows, keyses) {
    function BuildMeATable(rows) {
        var newtbl = "<br /><br /><table class='table table-bordered' align = 'CENTER' width = '600' >";
        // Write a header row with the key names as the headings
        //for (j = 0; j < keyses.length; j++) {} --could use this if there were more than two columns
        newtbl += "<tr>";
        newtbl += "<th class='table-heading'>";
        newtbl += "Skills";
        newtbl += "</th>";
        newtbl += "<th class='table-heading'><span class = 'floatright'>";
        newtbl += "Hours";
        newtbl += "</span>";
        newtbl += "</th>";
        newtbl += "</tr>";
        newtbl += "<tbody>";

        // Write one row for each row                  
        for (var r = 0; r < rows.length; r++) {
            newtbl += "<td>";
            newtbl += rows[r].name;
            newtbl += "</td>";
            newtbl += "<td><span class = 'floatright'>";
            newtbl += rows[r].y;
            newtbl += "</span></td>";
            newtbl += "</tr>";
        }

        newtbl += "<tr>";
        newtbl += "<td><strong>Total Hours</strong></td><td><span class = 'floatright'><strong>" + v.totalhours;
        newtbl += "</strong></td>";
        newtbl += "</tr>";
        newtbl += "</tbody>";
        newtbl += "</table>";
        return newtbl;
    }

    return {
        Init: Init
    };
};