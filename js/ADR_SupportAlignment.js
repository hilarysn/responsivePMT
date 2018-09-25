var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.DASHBOARD = CKO.DASHBOARD || {};
CKO.DASHBOARDS.ALLDASHBOARDS = CKO.DASHBOARDS.ALLDASHBOARDS || {};
CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES || {};

CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.SupportAlignment = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    url: null,
    data: [],
    json: null,
    totalhours: 0,
    chartdata: null,
    supportalignment: [],
    persontypefilter: "All",
    orgfilter: "All",
    timefilter: "M",
    //spt: null,
    html: null,  //BuildMeATable
    reporttable: null,  //BuildMeATable
    chart: null

}

CKO.DASHBOARDS.ALLDASHBOARDS.SupportAlignment = function () {

    var v = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.SupportAlignment ;

    function Init(site, id, persontypefilter, orgfilter, timefilter) {
        v.site = site;
        v.persontypefilter = persontypefilter;
        v.orgfilter = orgfilter;
        v.timefilter = timefilter;
        //var inDesignMode = document.forms[MSOWebPartPageFormName].MSOLayout_InDesignMode.value;
        //if (inDesignMode === "1") {
        //    $("#Enablers").html("").append("<div style='margin:5px;text-align:center;font-weight:bold;font-size:14px;font-style:italic;'>Query Suspended During Page Edit Mode</div>");
        //}

        //check to see if this is not the first time querying
        //if ($('#tblFilterEnablers').attr('data-isdrawn') != undefined) {
        if (persontypefilter != "All" || orgfilter != "All" || timefilter != "M") {
            logit("doing default " + id + "variables");
            v.totalhours = 0;
            v.supportalignment = [];
            v.site = site;
            v.data = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.chartdata = null;
            v.chart = id;
            $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Filtered Content... Please wait...' });

        } else {

            logit("doing default " + id + "variables");
            v.totalhours = 0;
            v.supportalignment = [];
            v.site = site;
            v.data = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.chartdata = null;
            v.chart = id;
            $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Default Content... Please wait...' });

        }

        var zebra = LoadSupportAlignment();
        jQuery.when.apply(null, zebra).done(function () {
            ActionsLoaded();
        });

    }

    function ApplyFilters() {
        v.data = [];
        v.supportalignment = [];
        v.json = null;
        v.url = null;
        v.reporttable = null;
        v.totalhours = 0;
        v.chartdata = null;
        ActionsLoaded();
    }

    function LoadSupportAlignment() {
        var deferreds = [];
        // Get the SupportAlignment from PMT SupportAlignment list and build the initial array.
        var urlString = v.site + "/_vti_bin/listdata.svc/SupportAlignment?";
        urlString += "$select=Id,Title&$orderby=Title";
        deferreds.push($.when(CKO.REST.GetListItems.getitems(urlString)).then(function (data) {
            var results = data.d.results;
            var j = jQuery.parseJSON(JSON.stringify(results));
            for (var i = 0, length = j.length; i < length; i++) {
                v.supportalignment.push({
                    "title": j[i]["Title"],
                    "hours": 0 // Need this
                });
                logit("SupportAlignment list data push: " + data);
            }
        }, function (data) {
            $("#SPSTools_Notify").fadeOut("2500", function () {
                $("#SPSTools_Notify").html("");
            });
            logit("SupportAlignment list data fade: " + data);
        }));
        return deferreds;
    }

    //Get SupportAlignment data from PMT Actions table
    function ActionsLoaded() {
        //var pfe = document.getElementById("PersonTypeFilter");
        //var ofe = document.getElementById("OrgFilter");
        //var tfe = document.getElementById("TimeFilter");

        //var pfe = PersonTypeFilter;
        //var ofe = OrgFilter;
        //var tfe = TimeFilter;

        //$().SPSTools_Notify({ type: 'wait', content: 'Loading Your Content... Please wait...' });

        if (v.url == null) {
            var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
            urlString += "$select=Id,Expended,DateCompleted,PersonTypeValue,SupportAlignment,OrganizationValue";
            urlString += "&$filter=";

            switch (v.timefilter) {
                case "Y":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(1, 'years').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";
                    break;

                case "Q":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(90, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";
                    break;

                case "M":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(30, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";
                    break;

                case "W":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(7, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";
                    break;
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
        }

        logit("V.URL: " + v.url);

        jQuery.ajax({
            url: v.url,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("SupportAlignment Chart: Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
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
        logit("SupportAlignment Chart: All Data Loaded");
        v.totalhours = 0;
        var numitems = v.json.length;
        // Now loop through the data to get the different SupportAlignment based on the action
        var j = v.json;
        for (var i = 0, length = j.length; i < length; i++) {
            // This is all of the actions from the qry so now update the hours for each enabler by adding the hours to that array
            for (var k = 0; k < v.supportalignment.length; k++) {
                if (v.supportalignment[k].title == j[i]["SupportAlignment"]) {
                    v.supportalignment[k].hours += j[i]["Expended"];
                    v.totalhours += j[i]["Expended"];
                }
            }
        }
        // Create data for the series using the SupportAlignment
        v.chartdata = [];
        for (var cd = 0; cd < v.supportalignment.length; cd++) {
            v.chartdata.push({
                "name": v.supportalignment[cd]["title"],
                "y": v.supportalignment[cd]["hours"],
                "index": v.supportalignment[cd]["index"]
            });
        }

        console.log(JSON.stringify(v.chartdata));
        DrawPieChart();
        //v.reporttable = BuildMeATable(v.supportalignment, ["title", "hours"]);
        v.reporttable = BuildMeATable(v.supportalignment);
        $("#tblLegend_SupportAlignment").html("").append(v.reporttable);

        $("#SupportAlignment_panel").find(".highcharts-root").attr("id", "SupportAlignmentSVG");
        var xmlns = "http://www.w3.org/2000/svg";
        var TotalBox = document.createElementNS(xmlns, "text");

        TotalBox.setAttributeNS(null, "x", 80);
        TotalBox.setAttributeNS(null, "y", 24);
        TotalBox.setAttributeNS(null, "text-anchor", "middle");
        TotalBox.setAttributeNS(null, "style", "font-size: 16px; fill: #333333;");
        var TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        TotalBox.appendChild(TotalText);
        document.getElementById("SupportAlignmentSVG").appendChild(TotalBox);

        $("#SPSTools_Notify").fadeOut("2500", function () {
            $("#SPSTools_Notify").html("");
        });
    }

    function DrawPieChart() {
        Highcharts.chart('SupportAlignment_panel', {
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
                text: 'SupportAlignment'
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
        newtbl += "SupportAlignment";
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
            newtbl += rows[r].title;
            newtbl += "</td>";
            newtbl += "<td><span class = 'floatright'>";
            newtbl += rows[r].hours;
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
        Init: Init,
        ApplyFilters: ApplyFilters
    };
};