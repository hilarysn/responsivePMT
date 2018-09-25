var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.DASHBOARD = CKO.DASHBOARD || {};
CKO.DASHBOARD.CHARTS = CKO.DASHBOARD.CHARTS || {};
CKO.DASHBOARD.CHARTS.VARIABLES = CKO.DASHBOARD.CHARTS.VARIABLES || {};

CKO.DASHBOARD.CHARTS.VARIABLES.Authority = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    qry: null,
    url: null,
    data: null,
    json: null,
    chartdata: null,
    authorities: null,
    standards: null,
    totalhours: 0,
    ThisFY: null,
    directives: null
}

CKO.DASHBOARD.CHARTS.Authority = function () {

    var v = CKO.DASHBOARD.CHARTS.VARIABLES.Authority;

    function Init(site, qry) {
        var inDesignMode = document.forms[MSOWebPartPageFormName].MSOLayout_InDesignMode.value;
        if (inDesignMode === "1") {
            $("#Authority").html("").append("<div style='margin:5px;text-align:center;font-weight:bold;font-size:14px;font-style:italic;'>Query Suspended During Page Edit Mode</div>");
        }
        else {
            v.authorities = new Array();
            v.standards = new Array();
            v.directives = new Array();
            v.site = site;
            v.qry = qry;
            v.data = [];
            v.json = null;
            v.url = null;
            if (moment().quarter() === 4) {
                v.ThisFY = moment().add('year', 1).format("YYYY");
            } else {
                v.ThisFY = moment().format("YYYY");
            };
            var monkey = LoadLists();
            jQuery.when.apply(null, monkey).done(function () {
                ListsLoaded();
            });
        }
    }

    function LoadLists() {
        logit("LoadLists Called For Authority Chart!");
        var deferreds = [];
        // Just get the functions and build the initial array.
        var urlString = v.site + "/_vti_bin/listdata.svc/Alignment?";
        urlString += "$select=Id,Authority,Reference";
        urlString += "&$orderby=Authority";
        logit("ALIGNMENTS: " + urlString);
        deferreds.push($.when(CKO.REST.GetListItems.getitems(urlString)).then(function (data) {
            var results = data.d.results;
            var j = jQuery.parseJSON(JSON.stringify(results));
            var unique = '';
            for (var i = 0, length = j.length; i < length; i++) {
                if (j[i]["Authority"] !== unique) {
                    v.authorities.push({
                        "auth": j[i]["Authority"],
                        "ref": j[i]["Reference"],
                        "hours": 0
                    });
                    unique = j[i]["Authority"];
                }
            }
        }, function (data) { logit(data); }));

        urlString = v.site + "/_vti_bin/listdata.svc/Standards?";
        urlString += "$select=Id,Title,SourceAuthority,SourceReference,Standard";
        logit("STANDARDS: " + urlString);
        deferreds.push($.when(CKO.REST.GetListItems.getitems(urlString)).then(function (data) {
            var results = data.d.results;
            var j = jQuery.parseJSON(JSON.stringify(results));
            for (var i = 0, length = j.length; i < length; i++) {
                v.standards.push({
                    "title": j[i]["Standard"],
                    "auth": j[i]["SourceAuthority"],
                    "ref": j[i]["SourceReference"]
                })
            }
        }, function (data) { logit(data); }));

        urlString = v.site + "/_vti_bin/listdata.svc/Directives?";
        urlString += "$select=Id,Title,SourceAuthority,SourceReference,Directive";
        logit("DIRECTIVES: " + urlString);
        deferreds.push($.when(CKO.REST.GetListItems.getitems(urlString)).then(function (data) {
            var results = data.d.results;
            var j = jQuery.parseJSON(JSON.stringify(results));
            for (var i = 0, length = j.length; i < length; i++) {
                v.directives.push({
                    "title": j[i]["Directive"],
                    "auth": j[i]["SourceAuthority"],
                    "ref": j[i]["SourceReference"]
                })
            }
        }, function (data) { logit(data); }));

        return deferreds;
    }

    function ListsLoaded() {
        // Get Actions based on qry
        GetActions();
    }

    function GetActions() {
        if (v.url === null) {
            var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
            urlString += "$select=Id,Title,Expended,DateCompleted,EffortTypeValue,FY,Quarter,StartOfWeek,Function";
            logit("ACTIONS: " + urlString);
            var today = new Date();
            var month, quarter, weekstart, weekend;
            var quarters = { "Jan": 2, "Feb": 2, "Mar": 2, "Apr": 3, "May": 3, "Jun": 3, "Jul": 4, "Aug": 4, "Sep": 4, "Oct": 1, "Nov": 1, "Dec": 1 }
            month = today.format("MMM");
            quarter = quarters[month];
            weekstart = moment(today).startOf('week');
            weekend = moment(today).endOf('week');

            switch (v.qry) {
                case "Y":                    
                    urlString += "&$filter=(DateCompleted ge datetime'" + moment().subtract(1, 'years').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";
                    break;

                case "Q":
                    urlString += "&$filter=(DateCompleted ge datetime'" + moment().subtract(90, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";
                    break;

                case "M":
                    urlString += "&$filter=(DateCompleted ge datetime'" + moment().subtract(30, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";
                    break;

                case "W":
                    urlString += "&$filter=(DateCompleted ge datetime'" + moment().subtract(7, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "')";
                    break;
            }
            v.url = urlString;
            logit("Authority Chart Query urlString: " + urlString);
        }
        jQuery.ajax({
            url: v.url,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Authority Chart: Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                v.data = v.data.concat(data.d.results);
                if (data.d.__next) {
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
        logit("Authority Chart: All Data Loaded");
        v.totalhours = 0;
        var numitems = v.json.length;
        // Now loop through the data to get the different Authority based on the action
        var j = v.json;
        for (var i = 0, length = j.length; i < length; i++) {
            // This is all of the actions from the qry so now update the hours for each Function by adding the hours to that array
            switch(j[i]["EffortTypeValue"]) {
                case "Standard":
                    for (var k = 0; k < v.standards.length; k++) {
                        if (j[i]["Title"] === v.standards[k].title) {
                            var aut = v.standards[k].auth
                            for (var m = 0; m < v.authorities.length; m++) {
                                if (v.authorities[m].auth === aut) {
                                    v.authorities[m].hours += j[i]["Expended"];
                                    v.totalhours += j[i]["Expended"];
                                }
                            }
                        }
                    }
                    break;

                case "Directive":
                    for (k = 0; k < v.directives.length; k++) {
                        if (j[i]["Title"] === v.directives[k].title) {
                            aut = v.directives[k].auth
                            for (m = 0; m < v.authorities.length; m++) {
                                if (v.authorities[m].auth === aut) {
                                    v.authorities[m].hours += j[i]["Expended"];
                                    v.totalhours += j[i]["Expended"];
                                }
                            }
                        }
                    }
                    break;
            }
        }
        // Create data for the series using the abbreviations
        v.chartdata = [];
        for (var n = 0; n < v.authorities.length; n++) {
            v.chartdata.push({
                "name": v.authorities[n].auth,
                "y": v.authorities[n].hours
            })
        }
        DrawPieChart();
        $("#Authority").find("text:contains(" + v.qry + ")").parent().find(".highcharts-button-box").attr("fill", "#ff0000");

        $("#Authority").find(".highcharts-root").attr("id", "AuthoritySVG");
        var xmlns = "http://www.w3.org/2000/svg";
        var TotalBox = document.createElementNS(xmlns, "text");

        TotalBox.setAttributeNS(null, "x", 80);
        TotalBox.setAttributeNS(null, "y", 24);
        TotalBox.setAttributeNS(null, "text-anchor", "middle");
        TotalBox.setAttributeNS(null, "style", "font-size: 16px; fill: #333333;");
        var TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        TotalBox.appendChild(TotalText);
        document.getElementById("AuthoritySVG").appendChild(TotalBox);
    }

    function DrawPieChart() {
        Highcharts.chart('Authority', {
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
                            CKO.DASHBOARD.CHARTS.Authority().Init(v.site, 'Y');
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
                            CKO.DASHBOARD.CHARTS.Authority().Init(v.site, 'Q');
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
                            CKO.DASHBOARD.CHARTS.Authority().Init(v.site, 'M');
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
                            CKO.DASHBOARD.CHARTS.Authority().Init(v.site, 'W');
                        }
                    }
                }
            },
            title: {
                text: 'Authority'
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

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_Dashboard_Charts_Authority.js');