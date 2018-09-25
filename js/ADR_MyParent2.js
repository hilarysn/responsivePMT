var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.DASHBOARD = CKO.DASHBOARD || {};
CKO.DASHBOARDS.ALLDASHBOARDS = CKO.DASHBOARDS.ALLDASHBOARDS || {};
CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES || {};
CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.Parent2 = {
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
    isdaterange: false,
    startdate: null,
    enddate: null,
    chartdata: [],
    originaltable: null,
    originalhours: 0,
    TotalBox: null,
    TotalText: null,
    subtotalhours: 0,
    isdrilldown: false,
    parents: [{
        "title": "5.1.3.4.2",
        "hours": 0, "subtext": "KPPM Websites, Portals, WfF, or Online Community support",
        "text": "KPPM Websites, Portals, WfF, or Online Community support",
        "children": [{ "title": "5.1.3.4.2", "hours": 0, "subtext": "HQ TRADOC KPPM" }, { "title": "5.2.1.1", "hours": 0, "subtext": "USAREC KPPM Websites, Portals, WfF, or Online Community support" }, { "title": "5.3.1.1", "hours": 0, "subtext": "CAC KPPM Websites, Portals, WfF, or Online Community support" }, { "title": "5.4.1.1", "hours": 0, "subtext": "MCCoE KPPM Websites, Portals, WfF, or Online Community support" }, { "title": "5.5.1.1", "hours": 0, "subtext": "SCoE KPPM Websites, Portals, WfF, or Online Community support" }, { "title": "5.6.1.1", "hours": 0, "subtext": "ACoE KPPM Websites, Portals, WfF, or Online Community support" }, { "title": "5.7.1.1", "hours": 0, "subtext": "CCoE KPPM Websites, Portals, WfF, or Online Community support" }, { "title": "5.8.1.1", "hours": 0, "subtext": "FCoE KPPM Websites, Portals, WfF, or Online Community support" }, { "title": "5.9.1.1", "hours": 0, "subtext": "ICoE KPPM Websites, Portals, WfF, or Online Community support" }, { "title": "5.10.1.1", "hours": 0, "subtext": "MCoE KPPM Websites, Portals, WfF, or Online Community support" }, { "title": "5.11.1.1", "hours": 0, "subtext": "MSCoE KPPM Websites, Portals, WfF, or Online Community support" }, { "title": "5.12.1.1", "hours": 0, "subtext": "USACC KPPM Websites, Portals, WfF, or Online Community support" }]
    },
    {
        "title": "5.1.3.4.5",
        "hours": 0, "subtext": "MS SharePoint and Strategic Management System (SMS) support",
        "text": "MS SharePoint and Strategic Management System (SMS) support",
        "children": [{ "title": "5.1.3.4.5", "hours": 0, "subtext": "HQ TRADOC MS SharePoint and Strategic Management System (SMS) support " }, { "title": "5.2.1.2", "hours": 0, "subtext": "USAREC Project Management Documentation and Support" }, { "title": "5.3.1.2", "hours": 0, "subtext": "CAC Project Management Documentation and Support" }, { "title": "5.4.1.2", "hours": 0, "subtext": "MCCoE MS SharePoint and Strategic Management System (SMS) support" }, { "title": "5.5.1.2", "hours": 0, "subtext": "SCoE MS SharePoint and Strategic Management System (SMS) support" }, { "title": "5.6.1.2", "hours": 0, "subtext": "ACoE MS SharePoint and Strategic Management System (SMS) support" }, { "title": "5.7.1.2", "hours": 0, "subtext": "CCoE MS SharePoint and Strategic Management System (SMS) support" }, { "title": "5.8.1.2", "hours": 0, "subtext": "FCoE MS SharePoint and Strategic Management System (SMS) support" }, { "title": "5.9.1.2", "hours": 0, "subtext": "ICoE MS SharePoint and Strategic Management System (SMS) support" }, { "title": "5.10.1.2", "hours": 0, "subtext": "MCoE MS SharePoint and Strategic Management System (SMS) support" }, { "title": "5.11.1.2", "hours": 0, "subtext": "MSCoE MS SharePoint and Strategic Management System (SMS) support" }, { "title": "5.12.1.2", "hours": 0, "subtext": "USACC MS SharePoint and Strategic Management System (SMS) support" }]
    },
    {
        "title": "5.1.1.5",
        "hours": 0, "subtext": "Program Management Support",
        "text": "Program Management Support",
        "children": [{ "title": "5.1.1.5.1", "hours": 0, "subtext": "HQ TRADOC KPPM Knowledge Map" }, { "title": "5.1.1.5.2", "hours": 0, "subtext": "Performance Management Tool (PMT)" }, { "title": "5.1.1.5.3", "hours": 0, "subtext": "Agile Project Management Plan (APMP)" }, { "title": "5.1.1.5.4", "hours": 0, "subtext": "HQ TRADOC Talent Management Plan (TMP)" }, { "title": "5.1.1.5.5", "hours": 0, "subtext": "Courses of Action (CoA)" }, { "title": "5.1.1.5.6", "hours": 0, "subtext": "HQ TRADOC Governance Documentation" }, { "title": "5.1.1.5.7", "hours": 0, "subtext": "HQ TRADOC Capabilities Adoption Plan (CAP)" }, { "title": "5.1.1.5.8", "hours": 0, "subtext": "Correspondence Documentation" }, { "title": "5.1.1.5.9", "hours": 0, "subtext": "HQ TRADOC Key Performance Indicators (KPI)" }, { "title": "5.2.1.3", "hours": 0, "subtext": "USAREC Project Management Documentation and Support" }, { "title": "5.3.1.3", "hours": 0, "subtext": "CAC Project Management Documentation and Support" }, { "title": "5.4.1.3", "hours": 0, "subtext": "MCCoE Project Management Documentation and Support" }, { "title": "5.5.1.3", "hours": 0, "subtext": "SCoE Project Management Documentation and Support" }, { "title": "5.6.1.3", "hours": 0, "subtext": "ACoE Project Management Documentation and Support" }, { "title": "5.7.1.3", "hours": 0, "subtext": "CCoE Project Management Documentation and Support" }, { "title": "5.8.1.3", "hours": 0, "subtext": "FCoE Project Management Documentation and Support" }, { "title": "5.9.1.3", "hours": 0, "subtext": "ICoE Project Management Documentation and Support" }, { "title": "5.10.1.3", "hours": 0, "subtext": "MCoE Project Management Documentation and Support" }, { "title": "5.11.1.3", "hours": 0, "subtext": "MSCoE Project Management Documentation and Support" }, { "title": "5.12.1.3", "hours": 0, "subtext": "USACC Project Management Documentation and Support" }]
    },
    {
        "title": "5.1.1.6",
        "hours": 0, "subtext": "Program Administrative Support",
        "text": "Program Administrative Support",
        "children": [{ "title": "5.1.1.6.1", "hours": 0, "subtext": "Taxonomy and File/Records" }, { "title": "5.1.1.6.2", "hours": 0, "subtext": "Meetings" }, { "title": "5.1.1.6.3", "hours": 0, "subtext": "Files/Record Keeping" }, { "title": "5.1.1.6.4", "hours": 0, "subtext": "Meeting Minutes" }, { "title": "5.1.1.6.5", "hours": 0, "subtext": "HQ TRADOC Strategies, Implementation Plans and other documents" }, { "title": "5.1.1.6.6", "hours": 0, "subtext": "Deviations or Out of Tolerance Metrics" }, { "title": "5.1.1.6.7", "hours": 0, "subtext": "KPPM News Letter" }, { "title": "5.1.1.6.8", "hours": 0, "subtext": "PMP / APMP" }, { "title": "5.1.1.6.9", "hours": 0, "subtext": "Program Administration Metrics" }, { "title": "5.2.1.4", "hours": 0, "subtext": "USAREC KPPM Strategy/Plans Support" }, { "title": "5.3.1.4", "hours": 0, "subtext": "CAC KPPM Strategy/Plans Support" }, { "title": "5.4.1.4", "hours": 0, "subtext": "MCCoE KPPM Strategy/Plans Support" }, { "title": "5.5.1.4", "hours": 0, "subtext": "SCoE KPPM Strategy/Plans Support" }, { "title": "5.6.1.4", "hours": 0, "subtext": "ACoE KPPM Strategy/Plans Support" }, { "title": "5.7.1.4", "hours": 0, "subtext": "CCoE KPPM Strategy/Plans Support" }, { "title": "5.8.1.4", "hours": 0, "subtext": "FCoE KPPM Strategy/Plans Support" }, { "title": "5.9.1.4", "hours": 0, "subtext": "ICoE KPPM Strategy/Plans Support" }, { "title": "5.10.1.4", "hours": 0, "subtext": "MCoE KPPM Strategy/Plans Support" }, { "title": "5.11.1.4", "hours": 0, "subtext": "MSCoE KPPM Strategy/Plans Support" }, { "title": "5.12.1.4", "hours": 0, "subtext": "USACC KPPM Strategy/Plans Support" }]
    },
    {
        "title": "5.1.7.7",
        "hours": 0, "subtext": "Training, Education, Professional Development and Performance Support",
        "text": "Training, Education, Professional Development and Performance Support",
        "children": [{ "title": "5.1.7.7.1", "hours": 0, "subtext": "TPS Plan Updates" }, { "title": "5.1.7.7.2", "hours": 0, "subtext": "TEP Updates" }, { "title": "5.1.7.7.3", "hours": 0, "subtext": "Whiteboard" }, { "title": "5.1.7.7.4", "hours": 0, "subtext": "Brochures" }, { "title": "5.1.7.7.5", "hours": 0, "subtext": "Documentary" }, { "title": "5.1.7.7.6", "hours": 0, "subtext": "Simulation" }, { "title": "5.1.7.7.7", "hours": 0, "subtext": "KPPM Training Support Package (TSP) Content" }, { "title": "5.1.7.7.8", "hours": 0, "subtext": "Platform instruction classes" }, { "title": "5.1.7.7.9", "hours": 0, "subtext": "Web or local recorded training" }, { "title": "5.1.7.7.10", "hours": 0, "subtext": "Community of Learning group" }, { "title": "5.1.7.7.11", "hours": 0, "subtext": "Performance Support system" }, { "title": "5.1.7.7.12", "hours": 0, "subtext": "Training KPI" }, { "title": "5.2.1.5", "hours": 0, "subtext": "USAREC KPPM Training, Education, Assistance and Performance Support" }, { "title": "5.3.1.5", "hours": 0, "subtext": "CAC KPPM Training, Education, Assistance and Performance Support" }, { "title": "5.4.1.5", "hours": 0, "subtext": "MCCoE KPPM Training, Education, Assistance and Performance Support" }, { "title": "5.5.1.5", "hours": 0, "subtext": "SCoE KPPM Training, Education, Assistance and Performance Support" }, { "title": "5.6.1.5", "hours": 0, "subtext": "ACoE KPPM Training, Education, Assistance and Performance Support" }, { "title": "5.7.1.5", "hours": 0, "subtext": "CCoE KPPM Training, Education, Assistance and Performance Support" }, { "title": "5.8.1.5", "hours": 0, "subtext": "FCoE KPPM Training, Education, Assistance and Performance Support" }, { "title": "5.9.1.5", "hours": 0, "subtext": "ICoE KPPM Training, Education, Assistance and Performance Support" }, { "title": "5.10.1.5", "hours": 0, "subtext": "MCoE KPPM Training, Education, Assistance and Performance Support" }, { "title": "5.11.1.5", "hours": 0, "subtext": "MSCoE KPPM Training, Education, Assistance and Performance Support" }, { "title": "5.12.1.5", "hours": 0, "subtext": "USACC KPPM Training, Education, Assistance and Performance Support" }]
    },
    {
        "title": "5.1.2.4.5",
        "hours": 0, "subtext": "Measurement, Analysis and Reporting System (MARS) support",
        "text": "Measurement, Analysis and Reporting System (MARS) support",
        "children": [{ "title": "5.1.2.4.5", "hours": 0, "subtext": "HQ TRADOC Measurement, Analysis and Reporting System (MARS) support " }, { "title": "5.2.1.6", "hours": 0, "subtext": "USAREC Measurement, Analysis and Reporting System (MARS) support" }, { "title": "5.3.1.6", "hours": 0, "subtext": "CAC Measurement, Analysis and Reporting System (MARS) support" }, { "title": "5.4.1.6", "hours": 0, "subtext": "MCCoE Measurement, Analysis and Reporting System (MARS) support" }, { "title": "5.5.1.6", "hours": 0, "subtext": "SCoE Measurement, Analysis and Reporting System (MARS) support" }, { "title": "5.6.1.6", "hours": 0, "subtext": "ACoE Measurement, Analysis and Reporting System (MARS) support" }, { "title": "5.7.1.6", "hours": 0, "subtext": "CCoE Measurement, Analysis and Reporting System (MARS) support" }, { "title": "5.8.1.6", "hours": 0, "subtext": "FCoE Measurement, Analysis and Reporting System (MARS) support" }, { "title": "5.9.1.6", "hours": 0, "subtext": "ICoE Measurement, Analysis and Reporting System (MARS) support" }, { "title": "5.10.1.6", "hours": 0, "subtext": "MCoE Measurement, Analysis and Reporting System (MARS) support" }, { "title": "5.11.1.6", "hours": 0, "subtext": "MSCoE Measurement, Analysis and Reporting System (MARS) support" }, { "title": "5.12.1.6", "hours": 0, "subtext": "USACC Measurement, Analysis and Reporting System (MARS) support" }]
    },
    {
        "title": "5.1.2.4.8a",
        "hours": 0, "subtext": "Performance Management Tool (PMT) Input and support",
        "text": "Performance Management Tool (PMT) Input and support",
        "children": [{ "title": "5.1.2.4.8", "hours": 0, "subtext": "HQ TRADOC Performance Management Tool (PMT) Input and support", "8a": true }, { "title": "5.2.1.7", "hours": 0, "subtext": "USAREC Performance Management Tool (PMT) Input and support" }, { "title": "5.3.1.7", "hours": 0, "subtext": "CAC Performance Management Tool (PMT) Input and support" }, { "title": "5.4.1.7", "hours": 0, "subtext": "MCCoE Performance Management Tool (PMT) Input and support" }, { "title": "5.5.1.7", "hours": 0, "subtext": "SCoE Performance Management Tool (PMT) Input and support" }, { "title": "5.6.1.7", "hours": 0, "subtext": "ACoE Performance Management Tool (PMT) Input and support" }, { "title": "5.7.1.7", "hours": 0, "subtext": "CCoE Performance Management Tool (PMT) Input and support" }, { "title": "5.8.1.7", "hours": 0, "subtext": "FCoE Performance Management Tool (PMT) Input and support" }, { "title": "5.9.1.7", "hours": 0, "subtext": "ICoE Performance Management Tool (PMT) Input and support" }, { "title": "5.10.1.7", "hours": 0, "subtext": "MCoE Performance Management Tool (PMT) Input and support" }, { "title": "5.11.1.7", "hours": 0, "subtext": "MSCoE Performance Management Tool (PMT) Input and support" }, { "title": "5.12.1.7", "hours": 0, "subtext": "USACC Performance Management Tool (PMT) Input and support" }]
    },
    {
        "title": "5.1.2.4.8b",
        "hours": 0, "subtext": "KPPM Metrics, Key Performance Indicators (KPI) and dashboard support",
        "text": "KPPM Metrics, Key Performance Indicators (KPI) and dashboard support",
        "children": [{ "title": "5.1.2.4.8", "hours": 0, "subtext": "HQ TRADOC KPPM Metrics, Key Performance Indicators (KPI)", "8b": true }, { "title": "5.2.1.8", "hours": 0, "subtext": "USAREC KPPM Metrics, Key Performance Indicators (KPI)" }, { "title": "5.3.1.8", "hours": 0, "subtext": "CAC KPPM Metrics, Key Performance Indicators (KPI)" }, { "title": "5.4.1.8", "hours": 0, "subtext": "MCCoE KPPM Metrics, Key Performance Indicators (KPI)" }, { "title": "5.5.1.8", "hours": 0, "subtext": "SCoE KPPM Metrics, Key Performance Indicators (KPI)" }, { "title": "5.6.1.8", "hours": 0, "subtext": "ACoE KPPM Metrics, Key Performance Indicators (KPI)" }, { "title": "5.7.1.8", "hours": 0, "subtext": "CCoE KPPM Metrics, Key Performance Indicators (KPI)" }, { "title": "5.8.1.8", "hours": 0, "subtext": "FCoE KPPM Metrics, Key Performance Indicators (KPI)" }, { "title": "5.9.1.8", "hours": 0, "subtext": "ICoE KPPM Metrics, Key Performance Indicators (KPI)" }, { "title": "5.10.1.8", "hours": 0, "subtext": "MCoE KPPM Metrics, Key Performance Indicators (KPI)" }, { "title": "5.11.1.8", "hours": 0, "subtext": "MSCoE KPPM Metrics, Key Performance Indicators (KPI)" }, { "title": "5.12.1.8", "hours": 0, "subtext": "USACC KPPM Metrics, Key Performance Indicators (KPI)" }]
    }
    ],
    timefilter: "M",
    html: null,  //BuildMeATable
    reporttable: null,  //BuildMeATable
    chart: null
};

CKO.DASHBOARDS.ALLDASHBOARDS.Parent2 = function () {

    var v = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES.Parent2;

    function Init(site, id, timefilter, isdaterange, start, end) {
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
            v.data = [];
            v.actions = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.chartdata = [];

            $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Filtered Content... Please wait...' });

        } else {

            logit("doing default " + id + " variables");
            totalhours = 0;
            v.data = [];
            v.actions = [];
            v.json = null;
            v.url = null;
            v.reporttable = null;
            v.chartdata = [];

            $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Default Content... Please wait...' });

        }

        GetActions();
    }

    //Get Support Alignment data from PMT Actions table
    function GetActions() {

        if (v.url === null) {
            var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
            urlString += "$select=Id,Title,Expended,DateCompleted,PMTUser/Id,SupportAlignment";
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

            urlString += " and (startswith(SupportAlignment, '5'))";
            v.url = urlString;
        }

        logit("Standards Chart Query urlString: " + v.url);

        jQuery.ajax({
            url: v.url,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Standards Chart: Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
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
        logit("Standards Chart: All Data Loaded");
        v.totalhours = 0;
        var j = v.json;
        // in this scenario we have the 'children' in the actions and we need to add their hours to their respective parents
        // for 5.1.2.4.8 if the alignment contains (PMT) it belongs to the 8a parent and if contains (KPI) it belongs to the 8b parent 
        var tp1, tp2, tp3, tp4, tp5, tp6, idx, cidx, title, compare, child;

        for (var s = 0; s < j.length; s++) {
            tp1 = j[s]["SupportAlignment"];
            tp2 = tp1.split(" ");
            tp3 = tp2[0];
            tp4 = tp1.substr(tp1.indexOf(" ") + 1); // This is to get the non numeric portion of the alignment
            tp5 = tp4.indexOf("PMT");
            tp6 = tp4.indexOf("KPI");
            if (tp3 === "5.1.2.4.8") {
                switch (true) {
                    case tp5 > 0:
                        idx = findIndexInData(v.parents, "title", "5.1.2.4.8a");
                        v.parents[idx].hours += j[s]["Expended"]; // add hours to this parent
                        v.parents[idx].children[0].hours += j[s]["Expended"]; // add hours to this child
                        v.totalhours += j[s]["Expended"]; // add hours to the total
                        // if the child does not have the subtext add it here
                        v.parents[idx].children[0].subtext = tp4;
                        break;

                    case tp6 > 0:
                        idx = findIndexInData(v.parents, "title", "5.1.2.4.8b");
                        v.parents[idx].hours += j[s]["Expended"]; // add hours to this parent
                        v.parents[idx].children[0].hours += j[s]["Expended"]; // add hours to this child
                        v.totalhours += j[s]["Expended"]; // add hours to the total
                        // if the child does not have the subtext add it here
                        v.parents[idx].children[0].subtext = tp4;
                        break;
                }
                tp5 = 0;
                tp6 = 0;
            }
            else {
                for (var r = 0; r < v.parents.length; r++) {
                    idx = findIndexInData(v.parents[r].children, "title", tp3);
                    if (idx !== -1) {
                        // this item belongs to this parent so add it to the parent hours and the child hours
                        v.parents[r].hours += j[s]["Expended"]; // add hours to this parent
                        v.parents[r].children[idx].hours += j[s]["Expended"]; // add hours to this child
                        v.totalhours += j[s]["Expended"]; // add hours to the total
                        // if the child does not have the subtext add it here
                        v.parents[r].children[idx].subtext = tp4;
                    }
                }
            }
        }
        
        BuildChart();

        $(".highcharts-xaxis-labels").find("span").each(function () {
            $(this).css({ 'font-weight': 350 }, { 'font-size': '10px !important' }, { 'overflow': 'auto' });
        });

        $("#Parent_panel").find(".highcharts-root").attr("id", "ParentSVG");
        var xmlns = "http://www.w3.org/2000/svg";
        v.TotalBox = document.createElementNS(xmlns, "text");

        v.TotalBox.setAttributeNS(null, "x", 100);
        v.TotalBox.setAttributeNS(null, "y", 24);
        v.TotalBox.setAttributeNS(null, "text-anchor", "middle");
        v.TotalBox.setAttributeNS(null, "style", "font-size: 16px; fill: #333333;");
        v.TotalText = document.createTextNode("Total Hours: " + v.totalhours);
        v.originalhours = v.totalhours;
        v.TotalBox.appendChild(v.TotalText);
        document.getElementById("ParentSVG").appendChild(v.TotalBox);

        v.reporttable = BuildMeATable(v.parents, v.totalhours);
        v.originaltable = v.reporttable;
        $("#tblLegend_Parent").html("").append(v.reporttable);

        $("#SPSTools_Notify").fadeOut("2500", function () {
            $("#SPSTools_Notify").html("");
        });
    }

    function getChildData(point, type) {
        var idx = findIndexInData(v.parents, "title", point);
        var data = [];
        if (idx !== -1) {
            if (type === "table") {
                for (var i = 0; i < v.parents[idx].children.length; i++) {
                    data.push({
                        "title": v.parents[idx].children[i].title,
                        "hours": v.parents[idx].children[i].hours,
                        "text": v.parents[idx].text,
                        "subtext": v.parents[idx].children[i].subtext
                    });
                }
            }
            else {
                v.subtotalhours = 0;
                for (i = 0; i < v.parents[idx].children.length; i++) {
                    v.subtotalhours += v.parents[idx].children[i].hours;
                    data.push({
                        "name": v.parents[idx].children[i].title,
                        "y": v.parents[idx].children[i].hours,
                        "text": v.parents[idx].text,
                        "subtext": v.parents[idx].children[i].subtext
                    });
                }
            }
        }
        return data;
    }

    function drawlabel(obj) {
        var label, flabel;
        label = obj.value;
        if (v.isdrilldown) {
            label = label.split(".");
            flabel = label[0] + "." + label[1];
            var html;
            switch (flabel) {
                case "5.1":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;

                case "5.2":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;

                case "5.3":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;

                case "5.4":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;

                case "5.5":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;

                case "5.6":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;

                case "5.7":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;

                case "5.8":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;

                case "5.9":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;

                case "5.10":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;

                case "5.11":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;

                case "5.12":
                    html = "<span class='parent_xaxis_label'>" + obj.value + "</span>";
                    break;
            }
            return html;
        }
        else {
            return label;
        }
    }

    function drawcharttip(obj) {
        var html = "<div style='width: 100%'>";
        html += "<div style='text-align: center;'>" + obj.point.y + " Hours </div>";
        html += "<div style='text-align: center;'>" + obj.point.text + "</div></div>";
        if (v.isdrilldown) {
            html += "<div style='text-align: center;'>" + obj.point.subtext + "</div></div>";
        }
        return html;
    }

    function BuildChart() {
        // create chart data from v.parents
        for (var i = 0; i < v.parents.length; i++) {
            v.chartdata.push({
                name: v.parents[i].title,
                y: v.parents[i].hours,
                text: v.parents[i].text,
                drilldown: true
            });
        }

        Highcharts.chart('Parent_panel', {
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
                                        data: ddata    //getChildData(e.point.name, "chart")
                                    }
                                },
                                series = drilldowns['Hours'];

                            // Show the loading label
                            chart.showLoading('Getting Drilldown Data...');

                            // Now build the table for the drill down data and replace the total hours area with the total for the drill down

                            v.reporttable = BuildMeATable(tdata, v.subtotalhours);
                            $("#tblLegend_Parent").html("").append(v.reporttable);

                            document.getElementById("ParentSVG").removeChild(v.TotalBox);
                            v.TotalBox.removeChild(v.TotalText);
                            v.TotalText = document.createTextNode("Total Hours: " + v.subtotalhours);
                            v.TotalBox.appendChild(v.TotalText);
                            document.getElementById("ParentSVG").appendChild(v.TotalBox);

                            setTimeout(function () {
                                chart.hideLoading();
                                chart.addSeriesAsDrilldown(e.point, series);
                            }, 1000);
                        }
                        $(".highcharts-xaxis-labels").find("span").each(function () {
                            $(this).css({ 'font-weight': 350 }, { 'font-size': '10px !important' }, { 'overflow': 'auto' });
                        });
                    },
                    drillup: function () {
                        v.isdrilldown = false;
                        // replace the table with the original one
                        $("#tblLegend_Parent").html("").append(v.originaltable);
                        document.getElementById("ParentSVG").removeChild(v.TotalBox);
                        v.TotalBox.removeChild(v.TotalText);
                        v.TotalText = document.createTextNode("Total Hours: " + v.originalhours);
                        v.TotalBox.appendChild(v.TotalText);
                        document.getElementById("ParentSVG").appendChild(v.TotalBox);
                        $(".highcharts-xaxis-labels").find("span").each(function () {
                            $(this).css({ 'font-weight': 350 }, { 'font-size': '10px !important' }, { 'overflow': 'auto' });
                        });
                    }
                }
            },
            title: {
                text: 'Standards'
            },
            xAxis: {
                type: 'category',
                labels: {
                    useHTML: true,
                    formatter: function () {
                        var xl = drawlabel(this);
                        return xl;
                    }
                }
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
            newtbl += rows[0].text;
        }
        else {
            newtbl += "Title";
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
                newtbl += rows[r].title + " - " + rows[r].subtext;
            }
            else {
                newtbl += rows[r].title + " - " + rows[r].text;
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