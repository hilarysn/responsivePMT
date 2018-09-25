var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.MYDASHBOARD = CKO.MYDASHBOARD || {};
CKO.MYDASHBOARD.CHARTS = CKO.MYDASHBOARD.CHARTS || {};
CKO.MYDASHBOARD.CHARTS.VARIABLES = CKO.MYDASHBOARD.CHARTS.VARIABLES || {};

CKO.MYDASHBOARD.CHARTS.VARIABLES.SVD = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    ctx: null,
    web: null,
    list: null,
    data: null,
    json: null,
    standard: null,
    directive: null,
    listitem: null,
    totalhours: 0,
    user: null,
    userID: null,
    qry: null,
    ThisFY: null,
    html: ""
}

CKO.MYDASHBOARD.CHARTS.SVD = function () {

    var v = CKO.MYDASHBOARD.CHARTS.VARIABLES.SVD;

    function Init(site, qry) {
        var inDesignMode = document.forms[MSOWebPartPageFormName].MSOLayout_InDesignMode.value;
        if (inDesignMode === "1") {
            $("#SVD").html("").append("<div style='margin:5px;text-align:center;font-weight:bold;font-size:14px;font-style:italic;'>Query Suspended During Page Edit Mode</div>");
        }
        else {
            v.standard = 0;
            v.directive = 0;
            v.site = site;
            v.data = [];
            v.json = null;
            v.qry = qry;
            v.userID = _spPageContextInfo.userId;
            if (moment().quarter() === 4) {
                v.ThisFY = moment().add('year', 1).format("YYYY");
            } else {
                v.ThisFY = moment().format("YYYY");
            };
            LoadActions(qry, null);
        }
    }

    function LoadActions(qry, zurl) {
        if (zurl === null) {
            //Load Actions From REST and filter based on qry

            var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
            urlString += "$select=Id,Expended,PMTUser/Id,DateCompleted,EffortTypeValue";
            urlString += "&$expand=PMTUser";

            switch (qry) {
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
            zurl = urlString;
            logit("My SVD Query: " + zurl);
        }

        jQuery.ajax({
            url: zurl,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("My SVD Chart Ajax Error Getting Actions: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                v.data = v.data.concat(data.d.results);
                if (data.d.__next) {
                    zurl = data.d.__next;
                    //More than 1000 items
                    LoadActions(qry, zurl); // qry really wont matter here, but need to pass the next url.
                }
                else {
                    var results = v.data;
                    v.json = jQuery.parseJSON(JSON.stringify(results));
                    SVDDataLoaded();
                }
            }
        });
    }

    function SVDDataLoaded() {
        v.totalhours = 0;
        var numitems = v.json.length;
        // Now loop through the data to get the standards and directives to create the series for the chart
        var j = v.json;
        for (var i = 0, length = j.length; i < length; i++) {
            switch (j[i]["EffortTypeValue"]) {
                case "Directive":
                    v.directive += j[i]["Expended"];
                    v.totalhours += j[i]["Expended"];
                    break;

                case "Standard":
                    v.standard += j[i]["Expended"];
                    v.totalhours += j[i]["Expended"];
                    break;
            }
        }
        DrawPieChart();
        $("#SVD").find("text:contains(" + v.qry + ")").parent().find(".highcharts-button-box").addClass("active").attr("fill", "#ff0000");

        $("#SVD").find(".highcharts-root").attr("id", "SVDSVG");
        var xmlns = "http://www.w3.org/2000/svg";
        var TotalBox = document.createElementNS(xmlns, "text");

        TotalBox.setAttributeNS(null, "x", 60);
        TotalBox.setAttributeNS(null, "y", 24);
        TotalBox.setAttributeNS(null, "text-anchor", "middle");
        TotalBox.setAttributeNS(null, "style", "font-size: 12px; fill: #333333;");
        var TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        TotalBox.appendChild(TotalText);
        document.getElementById("SVDSVG").appendChild(TotalBox);
    }

    function DrawPieChart() {
        Highcharts.chart('SVD', {
            colors: ["black", "blue"],
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
                            CKO.MYDASHBOARD.CHARTS.SVD().Init(v.site, 'Y');
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
                            CKO.MYDASHBOARD.CHARTS.SVD().Init(v.site, 'Q');
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
                            CKO.MYDASHBOARD.CHARTS.SVD().Init(v.site, 'M');
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
                            CKO.MYDASHBOARD.CHARTS.SVD().Init(v.site, 'W');
                        }
                    }
                }
            },
            title: {
                text: 'Std/Dir'
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

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_MyDashboard_Charts_SVD.js');