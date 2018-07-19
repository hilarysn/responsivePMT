var CKO = CKO || {};
CKO.DASHBOARDS = CKO.DASHBOARDS || {};
CKO.DASHBOARDS.ALLDASHBOARDS = CKO.DASHBOARDS.ALLDASHBOARDS || {};

CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES = {
    site: null,
    action: jQuery.QueryString["Action"],
    report: jQuery.QueryString["Report"],
    loc: String(window.location),
    title: null,
    charts: ["Authorities", "Paragraph", "Competencies", "Customers", "Enablers", "Functions", "Parent", "Skills", "SVD"],
    titles: ["Authorities", "Common Support","Competencies", "Customers", "Enablers", "Functions", "Standards", "Skills", "Standards vs Directives"],
    chart: null,
    firsttime: true,
    html: "",
    timefilter: null,
    persontypefilter: null,
    orgtypefilter: null,
    startdate: null,
    enddate: null,
    isdaterange: false,
    filter:
    '   <tr>' +
    '       <td>Time Period:&nbsp;&nbsp;</td>' +
    '       <td>' +
    '         <select class="form-control" id="TimeFilter" name="Time Period" onchange="CKO.DASHBOARDS.ALLDASHBOARDS.Reports().ChangeMe(this);">' +
    '               <option id="W" value="W">Week</option>' +
    '               <option id="M" selected value="M"">Month</option>' +
    '               <option id="Q" value="Q">Quarter</option>' +
    '               <option id="Y" value="Y">Year</option>' +
    '               <option id="R" value="R">Date Range</option>' +
    '         </select>' +
    '       </td>' +    
    '       <td><div class="input-group date hidden" data-provide="datepicker"><input type="text" title="From" placeholder="From" class="form-control" id="txtFrom"><div class="input-group-addon"><span class="glyphicon glyphicon-th"></span></div></div></td>' +
    '       <td><div class="input-group date hidden" data-provide="datepicker"><input type="text" title="To" placeholder="To" class="form-control" id="txtTo"><div class="input-group-addon"><span class="glyphicon glyphicon-th"></span></div></div></td>' +
    '       <td>&nbsp;&nbsp;Personnel Type:&nbsp;&nbsp;</td>' +
    '       <td>' +
    '          <select class="form-control" id="PersonTypeFilter" name="Personnel Type">' +
    '              <option id="All" selected value="All" >All</option>' +
    '              <option id="Contractor" value="Contractor">Contractor</option>' +
    '              <option id="Civilian" value="Civilian">Civilian</option>' +
    '              <option id="Military" value="Military">Military</option>' +
    '         </select>' +
    '       </td>' +
    '       <td>&nbsp;&nbsp;Organization:&nbsp;&nbsp;</td>' +
    '       <td>' +
    '            <select class="form-control" id="OrgFilter" name="Organization">' +
    '                <option id="All" selected value="All">All</option>' +
    '                <option id="ACoE" value="ACoE">ACoE</option>' +
    '                <option id="CASCOM" value="CASCOM">CASCOM</option>' +
    '                <option id="CCoE" value="CCoE">CCoE</option>' +
    '                <option id="FCoE" value="FCoE">FCoE</option>' +
    '                <option id="HQ-TRADOC" value="HQ TRADOC">HQ-TRADOC</option>' +
    '                <option id="ICoE" value="ICoE">ICoE</option>' +
    '                <option id="MCoE" value="MCoE">MCoE</option>' +
    '                <option id="MCCoE" value="MCCoE">MCCoE</option>' +
    '                <option id="MSCoE" value="MSCoE">MSCoE</option>' +
    '                <option id="SSI" value="SSI">SSI</option>' +
    '                <option id="USAREC" value="USAREC">USAREC</option>' +
    '                <option id="USACC" value="USACC">USACC</option>' +
    '            </select>' +
    '        </td> '
};

CKO.DASHBOARDS.ALLDASHBOARDS.Reports = function () {
    var v = CKO.DASHBOARDS.ALLDASHBOARDS.VARIABLES;

    function Init(site) {
        v.site = site;
        v.persontypefilter = "All";
        v.orgfilter = "All";
        v.timefilter = "M";
        drawBaseUI();
    }

    function drawBaseUI() {
        v.html = "";
        for (var i = 0; i < v.charts.length; i++) {
            var chart = v.charts[i];
            var title = v.titles[i];
            v.html += "<div class='panel panel-info panel-" + chart + "'>";
            v.html += "<div class='panel-heading'>";
            v.html += "<h4 class='panel-title' id='panel-title_"+[i] + "'" + "><a data-toggle='collapse' data-parent='#AllDashboardsReports' href='#collapse_" + chart + "'>" + title + "</a></h4>";
            v.html += "<table id='filtertable_" + [i] + "'" + " class='allDashboardFilter'><tbody>"; 
            v.html += formatfilter(chart, v.filter);
            v.html += "<td>&nbsp;&nbsp;<a href='#' style='color: #ffffff !important;' class='btn btn-success' id='filter_" + chart + "' data-chart='" + chart + "' onclick='CKO.DASHBOARDS.ALLDASHBOARDS.Reports().SelectFilters(this);'>Select Filters</a></td></tr></tbody></table></div>";
            v.html += "<div id='" + chart + "'>";
            v.html += "<div id='collapse_" + chart + "' data-chart=" + chart + " class='panel-collapse collapse' data-drawn_='false' data-index_='" + chart + "'>";
            v.html += "<div class='panel-body' id='" + chart + "_panel'></div >";
            v.html += "<div class='panel-body' id='tblLegend_" + chart + "'></div ></div ></div ></div > ";
        }

        $("#AllDashboardReports").html("").append(v.html);

        // toggle display of the filters next to the headers
        $("#panel-title_0").click(function () {  //Authorities
            $('#filtertable_0').toggle();
        });

        $("#panel-title_1").click(function () {  //Competencies
            $('#filtertable_1').toggle();
        });

        $("#panel-title_2").click(function () {  //Customers
            $('#filtertable_2').toggle();
        });

        $("#panel-title_3").click(function () {  //Enablers
            $('#filtertable_3').toggle();
        });

        $("#panel-title_4").click(function () {  //Functions
            $('#filtertable_4').toggle();
        });

        $("#panel-title_5").click(function () { //Paragraph
            $('#filtertable_5').toggle();
        });

        $("#panel-title_6").click(function () { //Parent
            $('#filtertable_6').toggle();
        });

        $("#panel-title_7").click(function () { //Skills
            $('#filtertable_7').toggle();
        });

        $("#panel-title_8").click(function () { //Standards_vs_Directives - SVD
            $('#filtertable_8').toggle();
        });

        $(".collapse").on('shown.bs.collapse', function () {
            logit("Chart Expanded!");
            if ($(this).attr("data-drawn") === 'false') {
                $().SPSTools_Notify({ type: 'wait', content: 'Loading Chart...Please wait...' });
                var id = $(this).attr("id");
                var idx = $(this).attr("data-index");
                id = id.split("_");
                $(this).attr("data-drawn", "true");
                var selected = $(this).attr("data-chart");

            }
            $("#SPSTools_Notify").fadeOut("2500", function () {
                $("#SPSTools_Notify").html("");
            });
        });

        if (v.action === "Report") {
            $(".panel").hide();
            $(".panel-" + v.report).show();
            $("a[href*='" + v.report + "']").click();
        }
    }

    function formatfilter(title, filter) {
        filter = String(filter);
        filter = filter.replace("TimeFilter", "TimeFilter_" + title);
        filter = filter.replace("PersonTypeFilter", "PersonTypeFilter_" + title);
        filter = filter.replace("OrgFilter", "OrgFilter_" + title);
        filter = filter.replace("txtFrom", "txtFrom_" + title);
        filter = filter.replace("txtTo", "txtTo_" + title);
        return filter;
    }

    function ChangeMe(obj) {
        var id = $(obj).attr("id");
        var select = $("#" + id + " option:selected").val();
        if (select === "R") {
            tp1 = id.split("_");
            $("#txtFrom_" + tp1[1]).datepicker().parent().removeClass("hidden");
            $("#txtTo_" + tp1[1]).datepicker().parent().removeClass("hidden");
        }
    }

    function SelectFilters(obj) {
        var id = $(obj).attr("id");
        id = id.split("_");
        v.persontypefilter = $("#PersonTypeFilter_" + id[1] + " option:selected").val();
        v.orgfilter = $("#OrgFilter_" + id[1] + " option:selected").val();
        v.timefilter = $("#TimeFilter_" + id[1] + " option:selected").val();
        // if the start date field is present, then assume this is a daterange and pass it along
        if (v.timefilter === "R") {
            v.startdate = moment($("#txtFrom_" + id[1]).val());
            v.enddate = moment($("#txtTo_" + id[1]).val());
            if (v.startdate._isAMomentObject) {
                // do we need validation here?
                if (v.enddate._isAMomentObject) {
                    if (moment(v.enddate).isAfter(v.startdate)) {
                        v.isdaterange = true;
                    }
                    else {
                        alert("The FROM date must be less than the TO date");
                        return;
                    }
                }
                else {
                    alert("Please select a valid TO date and try again.");
                    return;
                }
            }
            else {
                alert("Please select valid dates and try again.");
                logit("Date Testing Failed");
            }
        }
        
        var selected = id[1];
        switch (selected) {


            case "Authorities":
                $("#Authorities_panel");
                if (v.isdaterange) {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Authorities().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, true, v.startdate, v.enddate);
                }
                else {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Authorities().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, false, null, null);
                }
                break;

            case "Paragraph":
                if (v.isdaterange) {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Paragraph2().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, true, v.startdate, v.enddate);
                }
                else {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Paragraph2().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, false, null, null);
                }
                $("#Paragraph_panel");
                break;

            case "Competencies":
                $("#Competencies_panel");
                if (v.isdaterange) {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Competencies().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, true, v.startdate, v.enddate);
                }
                else {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Competencies().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, false, null, null);
                }
                break;

            case "Customers":
                $("#Customers_panel");
                if (v.isdaterange) {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Customers().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, true, v.startdate, v.enddate);
                }
                else {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Customers().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, false, null, null);
                }
                break;

            case "Enablers":
                $("#Enablers_panel");
                if (v.isdaterange) {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Enablers().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, true, v.startdate, v.enddate);
                }
                else {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Enablers().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, false, null, null);
                }
                break;

            case "Functions":
                $("#Functions_panel");
                if (v.isdaterange) {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Functions().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, true, v.startdate, v.enddate);
                }
                else {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Functions().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, false, null, null);
                }
                break;

            case "Parent":
                $("#Parent_panel");
                if (v.isdaterange) {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Parent2().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, true, v.startdate, v.enddate);
                }
                else {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Parent2().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, false, null, null);
                }
                break;

            case "Skills":
                $("#Skills_panel");
                if (v.isdaterange) {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Skills().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, true, v.startdate, v.enddate);
                }
                else {
                    CKO.DASHBOARDS.ALLDASHBOARDS.Skills().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, false, null, null);
                }
                break;

            case "SVD":
                $("#SVD_panel");
                if (v.isdaterange) {
                    CKO.DASHBOARDS.ALLDASHBOARDS.SVD().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, true, v.startdate, v.enddate);
                }
                else {
                    CKO.DASHBOARDS.ALLDASHBOARDS.SVD().Init(v.site, id[1], v.persontypefilter, v.orgfilter, v.timefilter, false, null, null);
                }
                break;

            default:
                alert("strange case '" + selected + "'");
        }
    }

    return {
        Init: Init,
        SelectFilters: SelectFilters,
        ChangeMe: ChangeMe
    };
};

CKO.DASHBOARDS.ALLDASHBOARDS.Reports().Init("https://hq.tradoc.army.mil/sites/ocko/pmt");