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
    chartdata: null,
    paragraphs: [],
    phnum: ["1.6", "5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "5.11", "5.12", "6.0", "6.1", "6.2"],
    phmap: {},
    persontypefilter: "All",
    orgfilter: "All",
    timefilter: "M",
    html: null,  //BuildMeATable
    reporttable: null,  //BuildMeATable
    chart: null
};

CKO.DASHBOARDS.ALLDASHBOARDS.Paragraph = function () {

    var v = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.Paragraph;

    function Init(site, id, persontypefilter, orgfilter, timefilter) {
        v.site = site;
        v.persontypefilter = persontypefilter;
        v.orgfilter = orgfilter;
        v.timefilter = timefilter;

        if (persontypefilter !== "All" || orgfilter !== "All" || timefilter !== "M") {
            logit("doing filtered  " + id + " variables");
            totalhours = 0;
            v.paragraphs = [];
            v.data = [];
            v.actions = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.chartdata = null;
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
            v.chartdata = null;
            v.chart = id;
            $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Default Content... Please wait...' });

        }

        for (var p = 0; p < v.phnum.length; p++){
            v.paragraphs.push({
                "title": v.phnum[p],  // will be id
                "hours": 0,           // will be y
                "children": []
            });
            v.paragraphs[p].children.push({
                "title": v.phnum[p],  // will be id
                "name": null,  // will be id
                "childhours": 0            // will be y
            });
        }


        //var monkey = LoadLists(); //LoadChartListname
        //jQuery.when.apply(null, monkey).done(function () {
            GetActions();  //ListsLoaded() ActionsLoaded
        //});
    }

    // build the initial Alignments array
    //function LoadLists() {
    //    var deferreds = [];
    //    var urlString = v.site + "/_vti_bin/listdata.svc/Alignments?";
    //    urlString += "$select=Id,Reference,Paragraph";
    //    urlString += "&$orderby=Paragraph"
    //    logit("Alignments: " + urlString);
    //    deferreds.push($.when(CKO.REST.GetListItems.getitems(urlString)).then(function (data) {
    //        var results = data.d.results;
    //        var j = jQuery.parseJSON(JSON.stringify(results));
    //        logit(j);
    //        //if the value of paragraph  === a member of alignments, then get the values and push into v.paragraphs
    //        v.paragraphs = [{
    //                'category': "N/A",

    //                'hours': 0,
    //                'name' :"N/A",
    //                'id' :"N/A",
    //                'data': [null, 0]
    //        }];

    //        for (var aa = 0; aa < v.phnum.length; aa++) {
    //            v.phmap[v.phnum[aa]] = aa;
    //            var jt = findphnum(v.phnum[aa], j);
    //            v.paragraphs.push({
    //                'category': v.phnum[aa],

    //                'hours': 0,
    //                'name': v.phnum[aa],
    //                'id': v.phnum[aa],
    //                'data': [null, 0]
    //            });
    //        }

    //        DumpParagraphs(v.paragraphs);

    //            // Find the thing in the J variable that holds the information for the phnum item we're working with

    //        function findphnum(phnum, jthingie) {
    //            var jtemp = null;
    //            for (var k = 0; k < jthingie.length; k++) {
    //                var ss = jthingie[k]["Paragraph"].split(".");
    //                var ss2 = ss[0] + "." + ss[1];
    //                var ss3 = ss2;
    //                if (ss.length > 2) { ss3 = ss3 + "." + ss[2]; }if (jthingie[k]['Paragraph'] === phnum) {
    //                    console.log("Found '" + phnum + "', values = " + JSON.stringify(jthingie[k]));
    //                    return jthingie[k];
    //                }
    //                if (phnum === ss2) {
    //                    jtemp = jthingie[k];
    //                }
    //            }
    //            if (jtemp != null) {
    //                console.log("Found alternate '" + phnum + "', values = " + JSON.stringify(jtemp));
    //                return jtemp;
    //            }
    //            alert("Did not find match for '" + phnum + "'");
    //        }

    //    }, function (data) { logit(data); }));

    //    return deferreds;
    //}

    //Get Support Alignment data from PMT Actions table
    function GetActions() {

        if (v.url === null) {
            var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
            urlString += "$select=Id,Title,Expended,DateCompleted,SupportAlignment,EffortTypeValue,PersonTypeValue,OrganizationValue";
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

            //var ptf = pfe.options[pfe.selectedIndex].value;
            if (v.persontypefilter !== "All") {
                urlString += " and (PersonTypeValue eq '" + v.persontypefilter + "')";
            }

            //var otf= ofe.options[ofe.selectedIndex].value;
            if (v.orgfilter !== "All") {
                urlString += " and (OrganizationValue eq '" + v.orgfilter + "')";
            }

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
        for (var r = 0; r < v.paragraphs.length; r++) {
            for (var s = 0; s < j.length; s++) {
                if (j[s]["SupportAlignment"] === null || j[s]["SupportAlignment"] === "N/A" || j[s]["SupportAlignment"] === "") {
                } else {
                    var title = j[s]["Title"].substring(0, 3);
                    var childtitle = j[s]["Title"].substring(0, 5);
                    var compare = v.paragraphs[r].title;
                    
                    if (title === compare) {
                        for (u = 0; u < v.paragraphs[r].children; u++) {
                            v.paragraphs[r].hours += j[s]["Expended"];

                            for (var t = 0; t < v.paragraphs[r].children.length; t++) {
                                //var found = false;
                                var childcompare = v.paragraphs[r].children[t].name;

                                if (childtitle === childcompare) {
                                    v.paragraphs[r].children[t].childhours += j[s]["Expended"];
                                    //found = true;
                                }

                                //if (found === false) {
                                if ((childtitle !== null) && (childtitle !== title) && (childcompare === null)) {
                                    v.paragraphs[r].children[t].push({
                                        "name": childtitle,
                                        "childhours": j[s]["Expended"]
                                    });
                                }
                            }
                        }                            
                    }
                }
            }
        }
        var stop = "stop";
    }







    function holdit() {



            //var numitems = v.json.length;
            // Now loop through the data to get the different paragraphs based on the action

        var nullkeys = 0;
            // Loop over the data for the paragraph times
        logit("Total number of paragraph items = " + j.length);
        for (var i = 0, length = j.length; i < length; i++) {
            // console.log('Action ' + i + ' = ' + JSON.stringify(j[i]));  // Logs too much data!
            var pridx = null;
                // Get the next key from the SupportAlignment group; if it's null add it to the "N/A" list.
            var jkey = j[i]["SupportAlignment"];
            if (jkey == null) {
                jkey = "N/A"; console.log("Null jkey #" + i); nullkeys += 1; pridx = 0;
            } else {
                    // If the SupportAlignment starts with a digit we have a paragraph number; else
                    // we have something we cannot classify.
                var kk = jkey.charAt(0);
                if ((kk >= "0") && (kk <= "9")) {
                    jkey = jkey.replace("-", " ");  // make sure "6.0-stuff" becomes "6.0 stuff"
                    jkey = jkey.split(" ",1)[0];    // take just the numeric part off jkey
                    var ss = jkey.split(".");       // split the paragraph levels out
                    var ss2 = ss[0] + "." + ss[1];  // take only the first two levels
                    var pridx = v.phmap[ss2];       // get the paragraph index for this level
                    if (pridx == null) { logit("Did not find ph map item '" + ss2 + "'"); pridx = 0; }
                } else {
                    if (jkey != "N/A") { logit("Cannot classify '" + jkey + "'; assuming N/A"); }
                    pridx = 0;
                }
            }
                // Can't happen but did a couple of times...
            if (pridx === null) {
                logit("Holy undefined batman! Pridx is null!!");
                pridx = 0;
            }
                // Add the rollup hours for this paragraph and update the overall total number of hours
            v.paragraphs[pridx]["hours"] += j[i]["Expended"];
            v.paragraphs[pridx]["index"] = pridx;
            v.totalhours += j[i]["Expended"];

        }

        logit("Total null keys = " + nullkeys);

        DumpParagraphs(v.paragraphs);

        // Create data for the series using the paragraphs
        v.chartdata = [];
        for (var cd = 0; cd < v.paragraphs.length; cd++) {
            v.chartdata.push({
                "name": v.paragraphs[cd]["category"],
                "y": 100.0 * v.paragraphs[cd]["hours"] / v.totalhours,
                'name': v.phnum[aa],
                'id': v.phnum[aa],
                'data': [null, 0]
            });
        }
     
        console.log(JSON.stringify(v.chartdata));

        DrawBarChart();

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
            newtbl += rows[r].category;
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