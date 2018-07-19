var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.DASHBOARD = CKO.DASHBOARD || {};
CKO.DASHBOARDS.ALLDASHBOARDS = CKO.DASHBOARDS.ALLDASHBOARDS || {};
CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES || {};

CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.Customers = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    url: null,
    data: [],
    json: null,
    totalhours: 0,
    isdaterange: false, //
    startdate: null,    //
    enddate: null,      //
    chartdata: null,
    customers: [],
    persontypefilter: "All",
    orgfilter: "All",
    timefilter: "M",
    html: null,  //BuildMeATable
    reporttable: null,  //BuildMeATable
    chart: null
};

CKO.DASHBOARDS.ALLDASHBOARDS.Customers = function () {

    var v = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.Customers;

    function Init(site, id, persontypefilter, orgfilter, timefilter, isdaterange, start, end) {     //
        loadCSS('https://hq.tradoc.army.mil/sites/ocko/SiteAssets/css/AllDashboardReports2.css');
        v.site = site;
        v.chart = id;
        v.persontypefilter = persontypefilter;
        v.orgfilter = orgfilter;
        v.timefilter = timefilter;

        if (isdaterange) {                                                                          //
            v.startdate = start;                                                                    //
            v.enddate = end;                                                                        //
            v.isdaterange = true;                                                                   //
        }                                                                                           //

        if (persontypefilter !== "All" || orgfilter !== "All" || timefilter !== "M") {
            logit("doing filtered " + id + "variables");
            v.totalhours = 0;
            v.customers = [];
            v.site = site;
            v.data = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.chartdata = null;

            $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Filtered Content... Please wait...' });

        } else {

            logit("doing default " + id + "variables");
            v.totalhours = 0;
            v.customers = [];
            v.site = site;
            v.data = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.chartdata = null;

            $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Default Content... Please wait...' });

        }

        if (moment().quarter() === 4) {                                                                                 //
            v.ThisFY = moment().add('year', 1).format("YYYY");                                                          //
        } else {                                                                                                        //
            v.ThisFY = moment().format("YYYY");                                                                         //
        }  

        var monkey = LoadLists(); //LoadChartListname
        jQuery.when.apply(null, monkey).done(function () {
            GetActions();  //ListsLoaded() ActionsLoaded
        });

    }

    function LoadLists() {
        var deferreds = [];
        urlString = v.site + "/_vti_bin/listdata.svc/Orgs?";
        urlString += "$select=Id,Title";
        logit("customers: " + urlString);
        deferreds.push($.when(CKO.REST.GetListItems.getitems(urlString)).then(function (data) {
            var results = data.d.results;
            var j = jQuery.parseJSON(JSON.stringify(results));
            for (var i = 0, length = j.length; i < length; i++) {
                v.customers.push({
                    "title": j[i]["Title"],
                    "hours": 0
                });
            }
        }, function (data) { logit(data); }));

        return deferreds;
    }

    //Get data from PMT Actions table
    function GetActions() {

        if (v.url === null) {
            var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
            urlString += "$select=Id,Title,Expended,Customer,DateCompleted,EffortTypeValue,Function";
            var today = new Date();                                                                                                                         //
            var month, quarter, weekstart, weekend;                                                                                                         //
            var quarters = { "Jan": 2, "Feb": 2, "Mar": 2, "Apr": 3, "May": 3, "Jun": 3, "Jul": 4, "Aug": 4, "Sep": 4, "Oct": 1, "Nov": 1, "Dec": 1 };      //
            month = today.format("MMM");                                                                                                                    //
            quarter = quarters[month];                                                                                                                      //
            weekstart = moment(today).startOf('week');                                                                                                      //
            weekend = moment(today).endOf('week');                                                                                                          //
            urlString += "&$filter=";                                                                                                                       // 

            logit("ACTIONS: " + urlString);
            switch (v.timefilter) {                                                                                                                         //
                case "Y":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(1, 'years').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";                   //
                    break;

                case "Q":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(90, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";                   //
                    break;

                case "M":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(30, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";                   //
                    break;

                case "W":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(7, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";                    //
                    break;

                case "R":
                    urlString += "(DateCompleted ge datetime'" + moment(v.startdate).format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (DateCompleted le datetime'" + moment(v.enddate).format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";  //
                    break;                                                                                                                                  //
            }   

            //var ptf = pfe.options[pfe.selectedIndex].value;
            if (v.persontypefilter !== "All") {
                urlString += " and (PersonTypeValue eq '" + v.persontypefilter + "')";
            }

            //var otf= ofe.options[ofe.selectedIndex].value;
            if (v.orgfilter !== "All") {
                urlString += " and (OrganizationValue eq '" + v.orgfilter + "')";
            }

            v.url = urlString;
            logit("Customers Chart Query urlString: " + urlString);
        }

        logit("V.URL: " + v.url);

        jQuery.ajax({
            url: v.url,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Customers Chart: Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
                $("#SPSTools_Notify").fadeOut("2500", function () {
                    $("#SPSTools_Notify").html("");
                });
            },
            success: function (data) {
                v.data = v.data.concat(data.d.results);
                if (data.d.__next) { // loads the next URL until there is no next URL .__ is part of the URL
                    v.url = data.d.__next;
                    GetActions();
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
        logit("Customers Chart: All Data Loaded");
        v.totalhours = 0;
        var numitems = v.json.length;
        // Now loop through the data to get the different Authority based on the action
        var j = v.json;
        for (var k = 0; k < v.customers.length; k++) {
            for (var i = 0; i < j.length; i++) {
            // This is all of the actions from the qry so now update the hours for each Function by adding the hours to that array
                var ac = String(j[i]["Customer"]);
                ac = ac.split("|");
                if (v.customers[k].title === ac[0]) {
                    v.customers[k].hours += j[i]["Expended"];
                    v.totalhours += j[i]["Expended"];
                }
            }
        }

        // Create data for the series using the abbreviations
        v.chartdata = [];
        for (n = 0; n < v.customers.length; n++) {
            v.chartdata.push({
                "name": v.customers[n].title,
                "y": v.customers[n].hours,
                "index": v.customers[n].index
            });
        }
        console.log(JSON.stringify(v.chartdata));

        DrawPieChart();
        $("#Customers_panel").find(".highcharts-root").attr("id", "CustomersSVG");

        var xmlns = "http://www.w3.org/2000/svg";
        var TotalBox = document.createElementNS(xmlns, "text");

        TotalBox.setAttributeNS(null, "x", 80);
        TotalBox.setAttributeNS(null, "y", 24);
        TotalBox.setAttributeNS(null, "text-anchor", "middle");
        TotalBox.setAttributeNS(null, "style", "font-size: 16px; fill: #333333;");
        var TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        TotalBox.appendChild(TotalText);
        document.getElementById("CustomersSVG").appendChild(TotalBox);

        v.reporttable = BuildMeATable(v.chartdata);
        $("#tblLegend_Customers").html("").append(v.reporttable);

        $("#SPSTools_Notify").fadeOut("2500", function () {
            $("#SPSTools_Notify").html("");
        });
    }

    function DrawPieChart() {
        Highcharts.chart('Customers_panel', {
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
                text: 'Customers'
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
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
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
        newtbl += "Customer";
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