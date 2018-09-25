var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.MYDASHBOARD = CKO.MYDASHBOARD || {};
CKO.MYDASHBOARD.CHARTS = CKO.MYDASHBOARD.CHARTS || {};
CKO.MYDASHBOARD.CHARTS.VARIABLES = CKO.MYDASHBOARD.CHARTS.VARIABLES || {};

CKO.MYDASHBOARD.CHARTS.VARIABLES.Customers = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    url: null,
    data: [],
    json: null,
    totalhours: 0,
    userID: null,
    chartdata: null,
    customers: [],
    html: null,
    chart: null
};

CKO.MYDASHBOARD.CHARTS.Customer = function () {

    var v = CKO.MYDASHBOARD.CHARTS.VARIABLES.Customers;

    function Init(site, qry) { 
        var inDesignMode = document.forms[MSOWebPartPageFormName].MSOLayout_InDesignMode.value;
        if (inDesignMode === "1") {
            $("#Customer").html("").append("<div style='margin:5px;text-align:center;font-weight:bold;font-size:14px;font-style:italic;'>Query Suspended During Page Edit Mode</div>");
        }
        else {
            v.userID = _spPageContextInfo.userId;
            v.customers = [];
            v.site = site;
            v.qry = qry;
            v.data = [];
            v.json = null;
            v.url = null;
            var monkey = LoadLists();
            jQuery.when.apply(null, monkey).done(function () {
                GetActions();
            });
        }
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
            urlString += "$select=Id,Title,Expended,Customer,DateCompleted";
            urlString += "&$filter=";                                                                                                                        

            switch (v.qry) {                                                                                                                        
                case "Y":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(1, 'years').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")"                   
                    break;

                case "Q":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(90, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")"                   
                    break;

                case "M":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(30, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")"                   
                    break;

                case "W":
                    urlString += "(DateCompleted ge datetime'" + moment().subtract(7, 'days').format('YYYY-MM-DD[T]HH:MM:[00Z]') + "') and (PMTUser/Id eq " + v.userID + ")"                    
                    break;
                                                                                                                               
            }   

            v.url = urlString;
            logit("Customers Chart Query urlString: " + urlString);
        }

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
        $("#Customer").find(".highcharts-root").attr("id", "CustomersSVG");

        var xmlns = "http://www.w3.org/2000/svg";
        var TotalBox = document.createElementNS(xmlns, "text");

        TotalBox.setAttributeNS(null, "x", 60);
        TotalBox.setAttributeNS(null, "y", 24);
        TotalBox.setAttributeNS(null, "text-anchor", "middle");
        TotalBox.setAttributeNS(null, "style", "font-size: 12px; fill: #333333;");
        var TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        TotalBox.appendChild(TotalText);
        document.getElementById("CustomersSVG").appendChild(TotalBox);

        $("#SPSTools_Notify").fadeOut("2500", function () {
            $("#SPSTools_Notify").html("");
        });
    }

    function DrawPieChart() {
        Highcharts.chart('Customer', {
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
                            CKO.MYDASHBOARD.CHARTS.Customer().Init(v.site, 'Y');
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
                            CKO.MYDASHBOARD.CHARTS.Customer().Init(v.site, 'Q');
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
                            CKO.MYDASHBOARD.CHARTS.Customer().Init(v.site, 'M');
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
                            CKO.MYDASHBOARD.CHARTS.Customer().Init(v.site, 'W');
                        }
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
                        //useHTML: true,
                        enabled: true,
                        format: '{point.name}: {point.percentage:.0f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black',
                            fontSize: '10px',
                            fontWeight: 'normal'
                        }
                        //formatter: function () {
                        //    var tt = drawlabel(this);
                        //    return tt;
                        //}
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
    };
};

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_MyDashboard_Charts_Customer.js');