var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.DASHBOARD = CKO.DASHBOARD || {};
CKO.DASHBOARDS.ALLDASHBOARDS = CKO.DASHBOARDS.ALLDASHBOARDS || {};
CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES || {};

CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.Paragraph = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    url: null,
    data: [],
    actions: [],
    json: null,
    totalhours: 0,
    chartdata: [],
    paragraphs: [],
    userID: null,
    phnum: ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "5.11", "5.12", "6.0", "6.1", "6.2"],
    timefilter: "M",
    html: null,  //BuildMeATable
    reporttable: null,  //BuildMeATable
    chart: null
};

CKO.DASHBOARDS.ALLDASHBOARDS.Paragraph2 = function () {

    var v = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.Paragraph;

    function Init(site, id, persontypefilter, orgfilter, timefilter) {
        v.site = site;
        v.timefilter = timefilter;
        v.userID = _spPageContextInfo.userId;

        if (persontypefilter !== "All" || orgfilter !== "All" || timefilter !== "M") {
            logit("doing filtered  " + id + " variables");
            totalhours = 0;
            v.paragraphs = [];
            v.data = [];
            v.actions = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.chartdata = [];
            v.chart = id;

            $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Filtered Content... Please wait...' });

        } else {

            logit("doing default " + id + " variables");
            totalhours = 0;
            v.paragraphs = [];
            v.data = [];
            v.actions = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.chartdata = [];
            v.chart = id;

            $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Default Content... Please wait...' });

        }

        for (var p = 0; p < v.phnum.length; p++){
            v.paragraphs.push({
                "title": v.phnum[p],  // will be id
                "hours": 0,           // will be y
                "children": []
            });
        }

        GetActions(); 
    }

    
    function GetActions() {

        if (v.url === null) {
            var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
            urlString += "$select=Id,Title,Expended,PMTUser/Id,DateCompleted,SupportAlignment,EffortTypeValue";
            urlString += "&$orderby=SupportAlignment";
            urlString += "&$expand=PMTUser";
            urlString += "&$filter=";
            logit("ACTIONS:  " + urlString);
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

            urlString += " and (startswith(SupportAlignment, '5') or startswith(SupportAlignment, '6'))";

            v.url = urlString;
            logit("Paragraph Chart Query urlString: " + v.url);
        }

        logit("V.URL: " + v.url);

        jQuery.ajax({
            url: v.url,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Paragraph Chart: Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
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
        logit("Paragraph Chart: All Data Loaded");
        v.totalhours = 0;
        var j = v.json;
        var tp1, tp2, tp3, title, compare, child;
        for (var r = 0; r < v.paragraphs.length; r++) {
            for (var s = 0; s < j.length; s++) {
                tp1 = j[s]["SupportAlignment"];
                tp2 = tp1.split(" ");
                tp3 = tp2[0].split(".");
                title = tp3[0] + "." + tp3[1];
                if (tp3[2] === undefined) {
                    child = title;
                }
                else {
                    // hq (5.1) and the 6.x objects have x.x.x pattern for children while the coe's have x.x.1.x as children
                    if (title !== "5.1" || title !== "6.0" || title !== "6.1" || title !== "6.1") {
                        child = tp3[0] + "." + tp3[1] + "." + tp3[2] + "." + tp3[3];
                    }
                    else {
                        child = tp3[0] + "." + tp3[1] + "." + tp3[2];
                    }
                }
                var compare = v.paragraphs[r].title;
                if (title === compare) {
                    v.paragraphs[r].hours += j[s]["Expended"]; // add hours to this paragraph
                    v.totalhours += j[s]["Expended"]; // add hours to the total
                    idx = findIndexInData(v.paragraphs[r].children, "name", child);
                    if (idx === -1) {
                        // child does not exist so create the child
                        v.paragraphs[r].children.push({
                            "name": child,
                            "hours": j[s]["Expended"]
                        });
                    }
                    else {
                        v.paragraphs[r].children[idx].hours += j[s]["Expended"];
                    }
                }
            }
        }
        var stop = "stop";

        BuildChart();

        $("#Paragraph_panel").find(".highcharts-root").attr("id", "ParagraphSVG");
        var xmlns = "http://www.w3.org/2000/svg";
        var TotalBox = document.createElementNS(xmlns, "text");

        TotalBox.setAttributeNS(null, "x", 80);
        TotalBox.setAttributeNS(null, "y", 24);
        TotalBox.setAttributeNS(null, "text-anchor", "middle");
        TotalBox.setAttributeNS(null, "style", "font-size: 16px; fill: #333333;");
        var TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        TotalBox.appendChild(TotalText);
        document.getElementById("ParagraphSVG").appendChild(TotalBox);

        v.reporttable = BuildMeATable(v.paragraphs);
        //v.reporttable = BuildMeATable(v.chartdata);
        $("#tblLegend_Paragraph").html("").append(v.reporttable);

        $("#SPSTools_Notify").fadeOut("2500", function () {
            $("#SPSTools_Notify").html("");
        });
    }

    function findIndexInData(data, property, value) {
        for (var i = 0, l = data.length; i < l; i++) {
            if (data[i][property] === value) {
                return i;
            }
        }
        return -1;
    }

    function getChildData(point) {
        var idx = findIndexInData(v.paragraphs, "title", point);
        var data = [];
        if (idx !== -1) {
            for (var i = 0; i < v.paragraphs[idx].children.length; i++) {
                data.push([
                    v.paragraphs[idx].children[i].name,
                    v.paragraphs[idx].children[i].hours
                ]);
            }
        }
        return data;
    }

    function BuildChart() {
        // create chart data from v.paragraphs
        for (var i = 0; i < v.paragraphs.length; i++) {
            v.chartdata.push({
                name: v.paragraphs[i].title,
                y: v.paragraphs[i].hours,
                drilldown: true
            });
        }

        Highcharts.chart('Paragraph_panel', {
            chart: {
                type: 'column',
                events: {
                    drilldown: function (e) {
                        if (!e.seriesOptions) {
                            logit("Drilldown: " + e.point.name);
                            var chart = this,
                                drilldowns = {
                                    'Hours': {
                                        name: e.point.name,
                                        data: getChildData(e.point.name)
                                    }
                                },
                                series = drilldowns['Hours'];

                            // Show the loading label
                            chart.showLoading('Getting Drilldown Data...');

                            setTimeout(function () {
                                chart.hideLoading();
                                chart.addSeriesAsDrilldown(e.point, series);
                            }, 1000);
                        }

                    }
                }
            },
            title: {
                text: 'Paragraph #'
            },
            xAxis: {
                type: 'category'
            },

            legend: {
                enabled: false
            },

            plotOptions: {
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true
                    }
                }
            },

            series: [{
                name: 'Hours',
                colorByPoint: true,
                data: v.chartdata
            }],

            drilldown: {
                series: []
            }
        });
    }


    function holdit() {

        $("#Paragraph_panel").find(".highcharts-root").attr("id", "ParagraphSVG");
        var xmlns = "http://www.w3.org/2000/svg";
        var TotalBox = document.createElementNS(xmlns, "text");

        TotalBox.setAttributeNS(null, "x", 80);
        TotalBox.setAttributeNS(null, "y", 24);
        TotalBox.setAttributeNS(null, "text-anchor", "middle");
        TotalBox.setAttributeNS(null, "style", "font-size: 16px; fill: #333333;");
        var TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        TotalBox.appendChild(TotalText);
        document.getElementById("ParagraphSVG").appendChild(TotalBox);


        v.reporttable = BuildMeATable(v.paragraphs);
        //v.reporttable = BuildMeATable(v.chartdata);
        $("#tblLegend_Paragraph").html("").append(v.reporttable);

        $("#SPSTools_Notify").fadeOut("2500", function () {
            $("#SPSTools_Notify").html("");
        });
    

        function DrawBarChart() {
            console.log(JSON.stringify(v.chartdata));
            Highcharts.chart('Paragraph_panel', {
                chart: {
                    //plotBackgroundColor: null,
                    //plotBorderWidth: null,
                    //plotShadow: false,
                    type: 'column'
                },
                exporting: {
                    buttons: {
                        contextButton: {
                            enabled: true
                        }
                    }
                },
                title: {
                    text: 'Paragraph #'
                },
                //subtitle: { //new
                //    text: 'Click the columns to view versions. Source: <a href="http://statcounter.com" target="_blank">statcounter.com</a>'
                //},
                xAxis: {
                    type: 'category'
                },
                yAxis: {
                    title: {
                        text: 'Total percent of hours'
                    }

                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                    pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}%</b> of total<br/>'
                },
                plotOptions: {
                    series: {
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            format: '{point.y:.1f}%'
                        }
                    }
                },
                series: [{
                    name: 'Paragraph #',
                    colorByPoint: true,
                    data: v.chartdata
                }]//,
                //"drilldown": {
                //    "series": [{
                //        "name": "Chrome",
                //        "id": "Chrome",
                //        "data": []
                //    }]
                //}
            });
        }
    }

    // function BuildMeATable(rows, keyses) {
    function BuildMeATable(rows) {
        var newtbl = "<br /><br /><table class='table table-bordered' align = 'CENTER' width = '600' >";
        // Write a header row with the key names as the headings
        //for (j = 0; j < keyses.length; j++) {} --could use this if there were more than two columns
        newtbl += "<tr>";
        newtbl += "<th class='table-heading'>";
        newtbl += "Paragraph Number";
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

    // Utility function to log the paragraphs variable

    function DumpParagraphs(pp) {
        for (var ii = 0; ii < pp.length; ++ii) { console.log("Content[" + ii + "] =" + JSON.stringify(pp[ii])); }
    }

    return {
        Init: Init
    };

};