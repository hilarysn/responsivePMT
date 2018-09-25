var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.DASHBOARD = CKO.DASHBOARD || {};
CKO.DASHBOARDS.ALLDASHBOARDS = CKO.DASHBOARDS.ALLDASHBOARDS || {};
CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES || {};

CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.Paragraph2 = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    url: null,
    userID: null,
    data: [],
    actions: [],
    json: null,
    totalhours: 0,
    isdaterange: false, //
    startdate: null,    //
    enddate: null,      //
    chartdata: [],
    originaltable: null,
    originalhours: 0,
    TotalBox: null,
    TotalText: null,
    subtotalhours: 0,
    isdrilldown: false,
    paragraphs: [],
    phnum: ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "5.11", "5.12", "6.0", "6.1", "6.2"],
    timefilter: "M",
    html: null,  //BuildMeATable
    reporttable: null,  //BuildMeATable
    chart: null
};

CKO.DASHBOARDS.ALLDASHBOARDS.Paragraph2 = function () {

    var v = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.Paragraph2;

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

        if (timefilter !== "M") {
            logit("doing filtered  " + id + " variables");
            totalhours = 0;
            v.paragraphs = [];
            v.data = [];
            v.actions = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.chartdata = [];
            v.drilldown = false;

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
            v.drilldown = false;

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
            urlString += "$select=Id,Title,Expended,DateCompleted,SupportAlignment,EffortTypeValue";
            urlString += "&$orderby=SupportAlignment";
            var today = new Date();
            var month, quarter, weekstart, weekend;
            var quarters = { "Jan": 2, "Feb": 2, "Mar": 2, "Apr": 3, "May": 3, "Jun": 3, "Jul": 4, "Aug": 4, "Sep": 4, "Oct": 1, "Nov": 1, "Dec": 1 };
            month = today.format("MMM");
            quarter = quarters[month];
            weekstart = moment(today).startOf('week');
            weekend = moment(today).endOf('week');
            urlString += "&$expand=PMTUser";
            urlString += "&$filter=";   

            logit("ACTIONS:  " + urlString);
            switch (v.timefilter) {
                case "Y":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(1, 'years').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";
                    break;

                case "Q":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(90, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";
                    break;

                case "M":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(30, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";
                    break;

                case "W":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(7, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";
                    break;

                case "R":
                    urlString += "(DateCompleted ge datetime'" + moment(v.startdate).format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (DateCompleted le datetime'" + moment(v.enddate).format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser / Id eq " + v.userID + ")";
                    break;
            }

            urlString += " and (startswith(SupportAlignment, '5') or startswith(SupportAlignment, '6'))";
            v.url = urlString;
        }

        logit("Common Support Chart Query urlString: " + v.url);

        jQuery.ajax({
            url: v.url,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Common Support Chart: Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
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

    function findIndexInData(data, property, value) {
        for (var i = 0, l = data.length; i < l; i++) {
            if (data[i][property] === value) {
                return i;
            }
        }
        return -1;
    }

    function DataLoaded() {
        logit("Common Support Chart: All Data Loaded");
        v.totalhours = 0;
        var j = v.json;
        var tp1, tp2, tp3, tp4, tp5, title, compare, child;
        for (var r = 0; r < v.paragraphs.length; r++) {
            for (var s = 0; s < j.length; s++) {
                tp1 = j[s]["SupportAlignment"];
                tp2 = tp1.split(" ");
                tp3 = tp2[0].split(".");
                tp4 = tp2[1];
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
                compare = v.paragraphs[r].title;
                if (title === compare) {
                    v.paragraphs[r].hours += j[s]["Expended"]; // add hours to this paragraph
                    v.totalhours += j[s]["Expended"]; // add hours to the total
                    idx = findIndexInData(v.paragraphs[r].children, "name", child);
                    if (idx === -1) {
                        // child does not exist so create the child

                        v.paragraphs[r].children.push({
                            "name": child,
                            "hours": j[s]["Expended"],
                            "text": title,
                            "subtext": tp1
                        });
                    }
                    else {
                        v.paragraphs[r].children[idx].hours += j[s]["Expended"];
                    }
                }
            }
        }

        BuildChart();

        $(".highcharts-xaxis-labels").find("span").each(function () {
            $(this).css({ 'font-weight': 350 }, { 'font-size': '10px !important' }, { 'overflow': 'auto' });
        });

        $("#Paragraph_panel").find(".highcharts-root").attr("id", "ParagraphSVG");
        var xmlns = "http://www.w3.org/2000/svg";
        v.TotalBox = document.createElementNS(xmlns, "text");

        v.TotalBox.setAttributeNS(null, "x", 80);
        v.TotalBox.setAttributeNS(null, "y", 24);
        v.TotalBox.setAttributeNS(null, "text-anchor", "middle");
        v.TotalBox.setAttributeNS(null, "style", "font-size: 16px; fill: #333333;");
        v.TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        v.originalhours = v.totalhours;
        v.TotalBox.appendChild(v.TotalText);
        document.getElementById("ParagraphSVG").appendChild(v.TotalBox);

        v.reporttable = BuildMeATable(v.paragraphs, v.totalhours);
        v.originaltable = v.reporttable;
        $("#tblLegend_Paragraph").html("").append(v.reporttable);

        $("#SPSTools_Notify").fadeOut("2500", function () {
            $("#SPSTools_Notify").html("");
        });
    }

    function getChildData(point, type) {
        var idx = findIndexInData(v.paragraphs, "title", point);
        var data = [];
        if (idx !== -1) {
            if (type === "table") {
                for (var i = 0; i < v.paragraphs[idx].children.length; i++) {
                    data.push({
                        "title": v.paragraphs[idx].children[i].title,
                        "hours": v.paragraphs[idx].children[i].hours,
                        "text": v.paragraphs[idx].text,
                        "subtext": v.paragraphs[idx].children[i].subtext
                    });
                }
            }
            else {
                v.subtotalhours = 0;
                for (i = 0; i < v.paragraphs[idx].children.length; i++) {
                    v.subtotalhours += v.paragraphs[idx].children[i].hours;
                    var tp1 = v.paragraphs[idx].children[i].subtext;
                    tp1 = tp1.split(" ");
                    data.push({
                        "name": tp1[0],
                        "y": v.paragraphs[idx].children[i].hours,
                        "text": v.paragraphs[idx].title,
                        "subtext": v.paragraphs[idx].children[i].subtext
                    });
                }
            }
        }
        return data;
    }

    function drawcharttip(obj) {
        var html = "<div style='width: 100%'>";
        html += "<div style='text-align: center;'>" + obj.point.y + " Hours </div>";
        html += "<div style='text-align: center;'>" + obj.point.name + "</div></div>";
        if (v.isdrilldown) {
            html += "<div style='text-align: center;'>" + obj.point.subtext + "</div></div>";
        }
        return html;
    }

    function BuildChart() {
        // create chart data from v.paragraphs
        for (var i = 0; i < v.paragraphs.length; i++) {
            v.chartdata.push({
                name: v.paragraphs[i].title,
                y: v.paragraphs[i].hours,
                text: v.paragraphs[i].text,
                drilldown: true
            });
        }

        Highcharts.chart('Paragraph_panel', {
            chart: {
                type: 'column',
                events: {
                    drilldown: function (e) {
                        v.isdrilldown = true;
                        if (!e.seriesOptions) {
                            logit("Drilldown: " + e.point.name);
                            var ddata = getChildData(e.point.name, "chart");
                            var tdata = getChildData(e.point.name, "table");

                            var chart = this,
                                drilldowns = {
                                    'Hours': {
                                        name: e.point.name,
                                        data: ddata
                                    }
                                },
                                series = drilldowns['Hours'];

                                // Show the loading label
                            chart.showLoading('Getting Drilldown Data...');

                                // Build the data table for the drill down data
                            v.reporttable = BuildMeATable(tdata, v.subtotalhours);
                            $("#tblLegend_Paragraph").html("").append(v.reporttable);

                                // Build the table for the drill down data and replace the total hours area with the total for the drill down
                            document.getElementById("ParagraphSVG").removeChild(v.TotalBox);
                            v.TotalBox.removeChild(v.TotalText);
                            v.TotalText = document.createTextNode("Total Hours: " + v.subtotalhours);
                            v.TotalBox.appendChild(v.TotalText);
                            document.getElementById("ParagraphSVG").appendChild(v.TotalBox);

                            setTimeout(function () {
                                chart.hideLoading();
                                chart.addSeriesAsDrilldown(e.point, series);
                            }, 1000);
                        }
                        $(".highcharts-xaxis-labels").find("span").each(function () {
                            $(this).css({ 'font-weight': 350 }, { 'font-size': '10px !important' }, { 'overflow': 'auto' });
                        });
                        //v.isdrilldown = false;
                    },
                    drillup: function () {
                        v.isdrilldown = false;
                        // replace the table with the original one
                        $("#tblLegend_Paragraph").html("").append(v.originaltable);
                        document.getElementById("Common SupportSVG").removeChild(v.TotalBox);
                        v.TotalBox.removeChild(v.TotalText);
                        v.TotalText = document.createTextNode("Total Hours: " + v.originalhours);
                        v.TotalBox.appendChild(v.TotalText);
                        document.getElementById("Common SupportSVG").appendChild(v.TotalBox);
                        $(".highcharts-xaxis-labels").find("span").each(function () {
                            $(this).css({ 'font-weight': 350 }, { 'font-size': '10px !important' }, { 'overflow': 'auto' });
                        });
                    }
                }
            },
            title: {
                text: 'My Common Support'
            },
            xAxis: {
                type: 'category'
            },
            legend: {
                enabled: false
            },
            tooltip: {
                useHTML: true,
                formatter: function () {
                    var tt = drawcharttip(this);
                    return tt;
                }
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

    function BuildMeATable(rows, total) {
        var newtbl = "<br /><br /><table class='table table-bordered' align = 'CENTER' width = '600' >";
        // Write a header row with the key names as the headings
        newtbl += "<tr>";
        newtbl += "<th class='table-heading'>";
        if (v.isdrilldown) {
            //newtbl += rows[0].text;
            //newtbl += rows[0].title;
            if (rows[0].subtext === undefined) {
                newtbl += "Common Support";
            } else {
                newtbl += rows[0].subtext.substring(0, 3);
            }
        }
        else {
            newtbl += "Common Support";
        }
        newtbl += "</th>";
        newtbl += "<th class='table-heading'><span class = 'floatright'>";
        newtbl += "Hours";
        newtbl += "</span>";
        newtbl += "</th>";
        newtbl += "</tr>";
        newtbl += "<tbody>";

        // Write one row for each row                  
        for (var r = 0; r < rows.length; r++) {
            newtbl += "<tr><td>";
            if (v.isdrilldown) {
                newtbl += rows[r].subtext;
            }
            else {
                newtbl += rows[r].title;
            }
            newtbl += "</td>";
            newtbl += "<td><span class = 'floatright'>";
            newtbl += rows[r].hours;
            newtbl += "</span></td>";
            newtbl += "</tr>";
        }

        newtbl += "<tr>";
        newtbl += "<td><strong>Total Hours</strong></td><td><span class = 'floatright'><strong>" + total;
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