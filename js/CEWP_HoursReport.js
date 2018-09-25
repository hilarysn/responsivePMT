var CKO = CKO || {};
CKO.VIEWS = CKO.VIEWS || {};
CKO.VIEWS.VARIABLES = CKO.VIEWS.VARIABLES || {};

CKO.VIEWS.VARIABLES = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    type: "Month", // default
    actions: [],
    events: [],
    defarr: [],
    users: [],
    orgs: [],
    calstart: null,
    calend: null,
    props: null,
    html: ""
}

CKO.VIEWS.HoursReport = function () {

    var v = CKO.VIEWS.VARIABLES;

    function Init(site) {
        v.site = site;
        $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Report...Please wait...' });
        loadCSS(site + '/SiteAssets/css/fullcalendar.min.css');
        loadscript(site + '/SiteAssets/js/fullcalendar.min.js', function () {
            GetOrgs();
        });
    }

    function GetOrgs() {
        v.calstart = moment().startOf('month').subtract(7, 'days').format('YYYY-MM-DD');
        v.calend = moment().endOf('month').format('YYYY-MM-DD');
        v.orgs = [];
        // Get all of the orgs from the Organization list excluding those not supported
        var urlString = v.site + "/_vti_bin/listdata.svc/Organization?";
        urlString += "$select=Id,Title,OrganizationTypeValue";
        urlString += "&$orderby=Title";
        urlString += "&$filter=(OrganizationTypeValue ne 'Not currently supported')";
        logit("urlString: " + urlString);

        jQuery.ajax({
            url: urlString,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                var numitems = data.d.results.length;
                for (var i = 0; i < numitems; i++) {
                    v.orgs.push({
                        org: j[i]["Title"]
                    });
                }
                drawBaseUI();
            }
        });
    }

    function drawBaseUI() {
        v.html = "";
        for (var i = 0; i < v.orgs.length; i++) {
            var org = v.orgs[i].org;// trim the org!!
            org = org.replace(/\s/g, '');
            org = org.replace(/(\r\n|\n|\r)/gm, "");
            org = org.trim();
            v.html += "<div class='panel panel-success'>";
            v.html += "<div class='panel-heading'>";
            v.html += "<h4 class='panel-title'><a data-toggle='collapse' data-parent='#HoursReport' href='#collapse_" + org + "'>" + org + "</a></h4>";
            v.html += "</div>";
            v.html += "<div id='collapse_" + org + "' class='panel-collapse collapse'>";
            v.html += "<div class='panel-body' id='" + org + "_panel'></div></div></div>";
        }
        $("#HoursReport").html("").append(v.html);
        GetUsers();
    }

    function GetUsers() {
        var urlString = v.site + "/_vti_bin/listdata.svc/KnowledgeMap?";
        urlString += "$select=Id,Organization,SharePointUser,TDAOnhand";
        urlString += "&$expand=SharePointUser";
        urlString += "&$filter=(TDAOnhand eq true)";
        logit("urlString: " + urlString);

        jQuery.ajax({
            url: urlString,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                var numitems = data.d.results.length;
                logit("# of users: " + numitems);
                for (var i = 0; i < numitems; i++) {
                    var usertext = "";
                    if (j[i]["SharePointUser"] !== null) {
                        usertext = j[i]["SharePointUser"]["Name"];
                        var org = j[i]["Organization"];
                        if (org.indexOf("HQ") >= 0) {
                            org = "HQTRADOC";
                        }
                        v.users.push({
                            name: usertext,
                            id: j[i]["SharePointUser"]["Id"],
                            org: org,
                            actions: []
                        });
                    }
                }
                AddUsersToUI();
            }
        });
    }

    function AddUsersToUI() {
        for(var i = 0; i < v.users.length; i++) {
            v.html = "";
            var org = v.users[i].org;
            var id = v.users[i].id;
            v.html += "<div class='panel panel-success'>";
            v.html += "<div class='panel-heading'>";
            v.html += "<h4 class='panel-title'><a data-toggle='collapse' data-parent='#" + org + "_panel' href='#collapse_" + id + "'>" + v.users[i].name + "</a></h4>";
            v.html += "</div>";
            v.html += "<div id='collapse_" + id + "' data-index='" + i + "' data-drawn='false' class='panel-collapse collapse'>";
            v.html += "<div class='minical' id='minical_" + id + "'></div></div></div>";
            $("#" + org + "_panel").append(v.html);
            $("#collapse_" + id).on('shown.bs.collapse', function () {
                if ($(this).attr("data-drawn") === 'false') {
                    var id = $(this).attr("id");
                    var idx = $(this).attr("data-index");
                    id = id.split("_");
                    $(this).attr("data-drawn", "true");
                    drawCalendar(id[1], idx);
                }
            });
        }
        var def = getUserActions();
        jQuery.when.apply(null, def).done(function () {
            DataLoaded();
        });
        
    }

    function DataLoaded() {
        logit("DataLoaded");
        $("#SPSTools_Notify").fadeOut("2500", function () {
            $("#SPSTools_Notify").html("");
        });
    }

    function drawCalendar(id, idx) {
        var cal = "minical_" + id;
        $('#' + cal).html("").fullCalendar({
            height: "parent",
            events: v.users[idx].actions,
            visibleRange: {
                start: v.calstart,
                end: v.calend
            },
            viewRender: function (view) {
                if (view.name === 'month') {
                    $('#' + cal + " .fc-day-number").each(function () {
                        var dd = $(this).parent().attr("data-date");
                        var add;
                        if ($(this).parent().hasClass("fc-sat")) {
                            add = "<div style='float:left;margin-right:50px;'>Total: <span data-date='" + id + "_" + dd + "'></span></div><div style='float:left;margin-right:35px;'>Week: <span data-end='" + id + "_" + dd + "'></span></div>&nbsp;";
                        }
                        else {
                            add = "<div style='float:left;margin-right:100px;'>Total: <span data-date='" + id + "_" + dd + "'></span></div>&nbsp;";
                        }
                        $(this).prepend(add);
                    });
                }
            },
            eventRender: function (event, element) {
                var start = event.start._i;
                var hours = event.Hours;
                var eow = dateformat(event.EndOfWeek, "isoshort");
                var dd1, dd2;
                dd1 = id + "_" + start;
                dd2 = id + "_" + eow;
                var current = Number($("span[data-date='" + dd1 + "']").text());
                var total = current + hours;
                $("span[data-date='" + dd1 + "']").text(total);
                var wcurrent = Number($("span[data-end='" + dd2 + "']").text());
                var wtotal = wcurrent + hours;
                $("span[data-end='" + dd2 + "']").text(wtotal);
            }
        });
    }

    function getUserActions() {
        for (var i = 0; i < v.users.length; i++) {
            v.defarr.push($.when(CKO.REST.GetActionItems.getitemsbyidandpasstoelement(v.site, v.users[i]["id"], i)).then(function (data, element) {
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                var numitems = j.length;
                logit("# of actions: " + numitems);
                for (var i = 0; i < numitems; i++) {
                    //var dc = dateformat(j[i]["DateCompleted"], 'isoshort');
                    var dc = moment(j[i]["DateCompleted"]).add(8, 'hours').format('YYYY-MM-DD');
                    var idx = element;
                    v.users[idx]["actions"].push({
                        id: j[i]["Id"],
                        title: j[i]["Title"],
                        start: dc,
                        starttext: dc,
                        Hours: j[i]["Expended"],
                        Type: j[i]["EffortTypeValue"],
                        EndOfWeek: moment(dc).endOf('week').format('YYYY-MM-DD'),
                        backgroundColor: "black",
                        textColor: "white"
                    });
                }
            }, function () { logit("Error getting user actions data."); }));
        }
        return v.defarr;
    }

    return {
        Init: Init
    }
}

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs("CEWP_HoursReport.js");