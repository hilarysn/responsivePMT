var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.MYDASHBOARD = CKO.MYDASHBOARD || {};
CKO.MYDASHBOARD.CHARTS = CKO.MYDASHBOARD.CHARTS || {};
CKO.MYDASHBOARD.CHARTS.VARIABLES = CKO.MYDASHBOARD.CHARTS.VARIABLES || {};

CKO.MYDASHBOARD.CHARTS.VARIABLES.Functions = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    qry: null,
    url: null,
    data: null,
    json: null,
    userID: null,
    chartdata: null,
    totalhours: 0,
    ThisFY: null,
    functions: null
}

CKO.MYDASHBOARD.CHARTS.Functions = function () {

    var v = CKO.MYDASHBOARD.CHARTS.VARIABLES.Functions;

    function Init(site, qry) {
        var inDesignMode = document.forms[MSOWebPartPageFormName].MSOLayout_InDesignMode.value;
        if (inDesignMode === "1") {
            $("#Functions").html("").append("<div style='margin:5px;text-align:center;font-weight:bold;font-size:14px;font-style:italic;'>Query Suspended During Page Edit Mode</div>");
        }
        else {
            v.functions = new Array();
            v.site = site;
            v.qry = qry;
            v.data = [];
            v.json = null;
            v.url = null;
            v.qry = qry;
            v.userID = _spPageContextInfo.userId;
            var zebra = LoadFunctions();
            jQuery.when.apply(null, zebra).done(function () {
                FunctionsLoaded();
            });
        }
    }

    function LoadFunctions() {
        var deferreds = [];
        // Just get the functions and build the initial array.
        var urlString = v.site + "/_vti_bin/listdata.svc/Functions?";
        urlString += "$select=Id,Title,Abbreviation";

        deferreds.push($.when(CKO.REST.GetListItems.getitems(urlString)).then(function (data) {
            var results = data.d.results;
            var j = jQuery.parseJSON(JSON.stringify(results));
            for (var i = 0, length = j.length; i < length; i++) {
                v.functions.push({
                    "title": j[i]["Title"],
                    "abbr": j[i]["Abbreviation"],
                    "hours": 0
                })
            }
        }, function (data) { logit("My Functions Chart Error: " + data); }));
        return deferreds;
    }

    function FunctionsLoaded() {
        if (v.url === null) {

            var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
            urlString += "$select=Id,Expended,PMTUser/Id,DateCompleted,Function";
            urlString += "&$expand=PMTUser";

            switch (v.qry) {
                case "Y":
                    urlString += "&$filter=(DateCompleted ge datetime'" + moment().subtract(1, 'years').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";
                    break;

                case "Q":
                    urlString += "&$filter=(DateCompleted ge datetime'" + moment().subtract(90, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";
                    break;

                case "M":
                    urlString += "&$filter=(DateCompleted ge datetime'" + moment().subtract(30, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";
                    break;

                case "W":
                    urlString += "&$filter=(DateCompleted ge datetime'" + moment().subtract(7, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")";
                    break;
            }
            v.url = urlString;
            logit("My Functions Query: " + v.url);
        }

        jQuery.ajax({
            url: v.url,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("My Functions Chart Ajax Error Getting Actions: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                v.data = v.data.concat(data.d.results);
                if (data.d.__next) {
                    v.url = data.d.__next;
                    FunctionsLoaded();
                }
                else {
                    var results = v.data;
                    v.json = jQuery.parseJSON(JSON.stringify(results));
                    FunctionDataLoaded();
                }
            }
        });
    }

    function FunctionDataLoaded() {
        logit("All Function Data Loaded");
        v.totalhours = 0;
        var numitems = v.json.length;
        // Now loop through the data to get the different functions based on the action
        var j = v.json;
        for (var i = 0, length = j.length; i < length; i++) {
            // This is all of the actions from the qry so now update the hours for each Function by adding the hours to that array
            for (var k = 0; k < v.functions.length; k++) {
                if (v.functions[k].title === j[i]["Function"]) {
                    v.functions[k].hours += j[i]["Expended"];
                    v.totalhours += j[i]["Expended"];
                }
            }
        }
        // Create data for the series using the abbreviations
        v.chartdata = [];
        for (k = 0; k < v.functions.length; k++) {
            v.chartdata.push({
                "name": v.functions[k]["abbr"],
                "y": v.functions[k]["hours"]
            })
        }
        DrawPieChart();
        $("#Functions").find("text:contains(" + v.qry + ")").parent().find(".highcharts-button-box").attr("fill", "#ff0000");

        $("#Functions").find(".highcharts-root").attr("id", "FunctionsSVG");
        var xmlns = "http://www.w3.org/2000/svg";
        var TotalBox = document.createElementNS(xmlns, "text");

        TotalBox.setAttributeNS(null, "x", 60);
        TotalBox.setAttributeNS(null, "y", 24);
        TotalBox.setAttributeNS(null, "text-anchor", "middle");
        TotalBox.setAttributeNS(null, "style", "font-size: 12px; fill: #333333;");
        var TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        TotalBox.appendChild(TotalText);
        document.getElementById("FunctionsSVG").appendChild(TotalBox);
    }

    function DrawPieChart() {
        Highcharts.chart('Functions', {
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
                    },
                    yearButton: {
                        text: 'Y',
                        theme: {
                            'stroke-width': 1,
                            stroke: 'black',
                            fill: '#cccccc',
                            r: 1,
                            states: {
                                hover: {
                                    fill: '#ff0000'
                                },
                                select: {
                                    fill: '#ff0000'
                                }
                            }
                        },
                        onclick: function () {
                            CKO.MYDASHBOARD.CHARTS.Functions().Init(v.site, 'Y');
                        }
                    },
                    quarterButton: {
                        text: 'Q',
                        theme: {
                            'stroke-width': 1,
                            stroke: 'black',
                            fill: '#cccccc',
                            r: 1,
                            states: {
                                hover: {
                                    fill: '#ff0000'
                                },
                                select: {
                                    fill: '#ff0000'
                                }
                            }
                        },
                        onclick: function () {
                            CKO.MYDASHBOARD.CHARTS.Functions().Init(v.site, 'Q');
                        }
                    },
                    monthButton: {
                        text: 'M',
                        theme: {
                            'stroke-width': 1,
                            stroke: 'black',
                            fill: '#cccccc',
                            r: 1,
                            states: {
                                hover: {
                                    fill: '#ff0000'
                                },
                                select: {
                                    fill: '#ff0000'
                                }
                            }
                        },
                        onclick: function () {
                            CKO.MYDASHBOARD.CHARTS.Functions().Init(v.site, 'M');
                        }
                    },
                    weekButton: {
                        text: 'W',
                        theme: {
                            'stroke-width': 1,
                            stroke: 'black',
                            fill: '#cccccc',
                            r: 1,
                            states: {
                                hover: {
                                    fill: '#ff0000'
                                },
                                select: {
                                    fill: '#ff0000'
                                }
                            }
                        },
                        onclick: function () {
                            CKO.MYDASHBOARD.CHARTS.Functions().Init(v.site, 'W');
                        }
                    }
                }
            },
            title: {
                text: 'Functions'
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

    return {
        Init: Init
    }
}

function getISODate(date) {
    function pad(n) { return n < 10 ? '0' + n : n }
    if (date !== null) {
        d = new Date(date);
    }
    else {
        d = new Date();
    }
    var s = "";
    s += d.getFullYear() + "-";
    s += pad(d.getMonth() + 1) + "-";
    s += pad(d.getDate());
    s += "T" + pad(d.getHours()) + ":";
    s += pad(d.getMinutes()) + ":";
    s += pad(d.getSeconds()) + "Z";
    return s;
}

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_MyDashboard_Charts_Functions.js');