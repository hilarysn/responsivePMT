var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.DASHBOARD = CKO.DASHBOARD || {};
CKO.DASHBOARDS.ALLDASHBOARDS = CKO.DASHBOARDS.ALLDASHBOARDS || {};
CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES || {};

CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.SVD = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    url: null,
    list: null,
    data: [],
    json: null,
    totalhours: 0,
    totalhours_directive: 0,
    totalhours_standard: 0,
    isdaterange: false, //
    startdate: null,    //
    enddate: null,      //
    chartdata: null,
    standard: null,
    directive: null,
    standards: [],
    directives: [],
    actions: [],
    listitem: null,
    userID: null,
    timefilter: "M",
    html: null,  //BuildMeATable
    reporttable: null,  //BuildMeATable
    chart: null
};

CKO.DASHBOARDS.ALLDASHBOARDS.SVD = function () {

    var v = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.SVD;

    function Init(site, id, timefilter, isdaterange, start, end) {                                  //
        loadCSS('https://hq.tradoc.army.mil/sites/ocko/SiteAssets/css/AllDashboardReports2.css');
        v.site = site;
        v.chart = id;
        v.timefilter = timefilter;
        v.userID = _spPageContextInfo.userId;                                                       //

        if (isdaterange) {                                                                          //
            v.startdate = start;                                                                    //
            v.enddate = end;                                                                        //
            v.isdaterange = true;                                                                   //
        }  

        if (v.standards.length <= 0) {
            GetStandards();
        }
        else {
            start();
        }
    }

    function start() {
        
        if (v.timefilter !== "M") {
            v.totalhours = 0;
            v.totalhours_directive = 0;
            v.totalhours_standard = 0;
            v.standard = null;
            v.directive = null;
            v.listitem = null;
            v.chartdata = null;
            v.data = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.actions = [];

            $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Filtered Content... Please wait...' });

        } else {

            v.totalhours = 0;
            v.totalhours_directive = 0;
            v.totalhours_standard = 0;
            v.listitem = null;
            v.chartdata = null;
            v.data = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.actions = [];

            $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Default Content... Please wait...' });
        }

        if (moment().quarter() === 4) {                                                                         //
            v.ThisFY = moment().add('year', 1).format("YYYY");                                                  //
        } else {                                                                                                //
            v.ThisFY = moment().format("YYYY");                                                                 //
        }    

        ActionsLoaded(); //LoadActions
    }

        //Get Standards_vs_Directives data from PMT Actions table
    function ActionsLoaded() {
        if (v.url === null) {
            //Load Actions From REST and filter based on qry
            var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
            urlString += "$select=Id,Expended,PMTUser/Id,DateCompleted,EffortTypeValue,Title&$orderby=Title";
            var today = new Date();                                                                                                                                             //
            var month, quarter, weekstart, weekend;                                                                                                                             //
            var quarters = { "Jan": 2, "Feb": 2, "Mar": 2, "Apr": 3, "May": 3, "Jun": 3, "Jul": 4, "Aug": 4, "Sep": 4, "Oct": 1, "Nov": 1, "Dec": 1 };                          //
            month = today.format("MMM");                                                                                                                                        //
            quarter = quarters[month];                                                                                                                                          //
            weekstart = moment(today).startOf('week');                                                                                                                          //
            weekend = moment(today).endOf('week');                                                                                                                              //
            urlString += "&$expand=PMTUser";                                                                                                                                    //
            urlString += "&$filter=";   

            logit("ACTIONS: " + urlString);
            switch (v.timefilter) {
                case "Y":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(1, 'years').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";  //
                    break;                                                                                                                                                      //
                
                case "Q":                                                                                                                                                       //
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(90, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";  //
                    break;                                                                                                                                                      //                                                                                                                                                  //
                
                case "M":                                                                                                                                                       //
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(30, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";  //
                    break;                                                                                                                                                      //
                
                case "W":                                                                                                                                                       //
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(7, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";   //
                    break;                                                                                                                                                      //
                
                case "R":                                                                                                                                                       //
                    urlString += "(DateCompleted ge datetime'" + moment(v.startdate).format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (DateCompleted le datetime'" + moment(v.enddate).format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser / Id eq " + v.userID + ")";    //
                    break;                                                                                                                                                      //
            }   

            v.url = urlString;
        }

        logit("My SVD Chart Query urlString: " + v.url);

        jQuery.ajax({
            url: v.url,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Standards_vs_Directives Chart: Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
                $("#SPSTools_Notify").fadeOut("2500", function () {
                    $("#SPSTools_Notify").html("");
                });
            },
            success: function (data) {
                v.data = v.data.concat(data.d.results);
                if (data.d.__next) { // loads the next URL until there is no next URL .__ is part of the URL
                    v.url = data.d.__next;
                    ActionsLoaded();
                }
                else {
                    var results = v.data;
                    v.json = jQuery.parseJSON(JSON.stringify(results));
                    DataLoaded();
                }
            }
        });
    }

    function DataLoaded() {
        logit("Standards vs Directives Chart: All Data Loaded");
        v.totalhours = 0;
        v.totalhours_directive = 0;
        v.totalhours_standard = 0;
        var numitems = v.json.length;
        // Now loop through the data to get the different enablers based on the action
        var j = v.json;
        for (var i = 0, length = j.length; i < length; i++) {

            if (v.json[i]["Expended"] !== 0) {
                v.actions.push({
                    title: j[i]["Title"],
                    hours: j[i]["Expended"]
                });

                switch (j[i]["EffortTypeValue"]) {
                    case "Directive":
                        v.title = j[i]["Title"];
                        v.directive += j[i]["Expended"];
                        v.totalhours_directive += j[i]["Expended"];
                        v.totalhours += j[i]["Expended"];
                        // create array set
                        break;

                    case "Standard":
                        v.title += j[i]["Title"];
                        v.standard += j[i]["Expended"];
                        v.totalhours_standard += j[i]["Expended"];
                        v.totalhours += j[i]["Expended"];
                        break;
                }
            }
        }

        DrawPieChart();

        $("#SVD_panel").find(".highcharts-root").attr("id", "SVDSVG");
        var xmlns = "http://www.w3.org/2000/svg";
        var TotalBox = document.createElementNS(xmlns, "text");

        TotalBox.setAttributeNS(null, "x", 80);
        TotalBox.setAttributeNS(null, "y", 24);
        TotalBox.setAttributeNS(null, "text-anchor", "middle");
        TotalBox.setAttributeNS(null, "style", "font-size: 16px; fill: #333333;");
        var TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        TotalBox.appendChild(TotalText);
        document.getElementById("SVDSVG").appendChild(TotalBox);

        v.reporttable = BuildMeATable(v.actions);
        $("#tblLegend_SVD").html("").append(v.reporttable);

        $("#SPSTools_Notify").fadeOut("2500", function () {
            $("#SPSTools_Notify").html("");
        });
    }

    function DrawPieChart() {
        Highcharts.chart('SVD_panel', {
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
                text: 'Standards vs. Directives'
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
                data: [{
                    name: 'Directives',
                    y: v.directive
                }, {
                    name: 'Standards',
                    y: v.standard
                }]
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
        newtbl += "Effort Type";
        newtbl += "</th>";
        newtbl += "<th class='table-heading'><span class = 'floatright'>";
        newtbl += "Hours";
        newtbl += "</span>";
        newtbl += "</th>";
        newtbl += "</tr>";
        newtbl += "<tbody>";
        newtbl += "<td>";
        newtbl += "Standards";
        newtbl += "</td>";
        newtbl += "<td><span class = 'floatright'>";
        newtbl += v.totalhours_standard;
        newtbl += "</span></td>";
        newtbl += "</tr>";
        newtbl += "<td>";
        newtbl += "Directives";
        newtbl += "</td>";
        newtbl += "<td><span class = 'floatright'>";
        newtbl += v.totalhours_directive;
        newtbl += "</span></td>";
        newtbl += "</tr>";
        newtbl += "<tr>";
        newtbl += "<td><strong>Total Hours</strong></td><td><span class = 'floatright'><strong>" + v.totalhours;
        newtbl += "</strong></td>";
        newtbl += "</tr>";
        newtbl += "</tbody>";
        newtbl += "</table>";
        return newtbl;
    }

    function GetStandards() {
        var deferred = jQuery.Deferred();
        // Load Standards from REST
        var urlString = v.site + "/_vti_bin/listdata.svc/Standards?";
        //urlString += "$select=Id,Standard,Task,StandardStatusValue,SupportParagraph,SupportedOrg,SupportedSubOrg";
        urlString += "$select=Id,Standard";
        urlString += "&$orderby=Standard";

        jQuery.ajax({
            url: urlString,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                // to do implement logging to a central list
                logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
                var err = textStatus + ", " + errorThrown;
                deferred.reject(err);
            },
            success: function (data) {
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                var numitems = data.d.results.length;
                logit("Standards Count: " + numitems);

                for (var i = 0, length = j.length; i < length; i++) {
                    // Add to standard array so that we can display info based on selected standard
                    v.standards.push({
                        "standard": j[i]["Standard"],
                        "hours": 0
                        //"status": j[i]["StandardStatusValue"],
                        //"paragraph": j[i]["SupportParagraph"],
                        //"org": j[i]["SupportedOrg"],
                        //"suborg": j[i]["SupportedSubOrg"]
                    });
                }

                GetDirectives();
            }
        });

        return deferred.promise();
    }

    function GetDirectives() {
        var deferred = jQuery.Deferred();
        // Load Directives From REST
        var urlString = v.site + "/_vti_bin/listdata.svc/Directives?";
        //urlString += "$select=Id,Directive,DirectiveDescription,DirectiveStatusValue,ProjectedManHours,Expended,SupportedOrg,SupportedSubOrg,SupportParagraph,SupportReference";
        urlString += "$select=Id,Directive";
        urlString += "&$orderby=Directive";

        jQuery.ajax({
            url: urlString,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
                var err = textStatus + ", " + errorThrown;
                deferred.reject(err);
            },
            success: function (data) {
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                var numitems = data.d.results.length;
                logit("Directives Count: " + numitems);
                var opts;
                for (var i = 0, length = j.length; i < length; i++) {
                    // Add to directive array so that we can display info based on selected directive
                    v.directives.push({
                        "directive": j[i]["Directive"],
                        "hours": 0
                    });
                }
                start();
            }
        });

        return deferred.promise();
    }

    return {
        Init: Init
    };
};