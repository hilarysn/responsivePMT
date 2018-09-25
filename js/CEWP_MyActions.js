var CKO = CKO || {};
CKO.ACTIONS = CKO.ACTIONS || {};
CKO.ACTIONS.VARIABLES = CKO.ACTIONS.VARIABLES || {};

CKO.ACTIONS.VARIABLES = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    type: "Month", // default
    standards: [],
    directives: [],
    events: [],
    calstart: null,
    calend: null,
    props: null,
    html: ""
}

CKO.ACTIONS.MyActions = function () {

    var v = CKO.ACTIONS.VARIABLES;

    function Init(site) {
        v.site = site;
        $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Actions...Please wait...' });
        loadCSS(site + '/SiteAssets/css/fullcalendar.min.css');
        loadCSS(site + '/SiteAssets/css/jquery.qtip.min.css');
        loadCSS(site + '/SiteAssets/css/myactions.css');
        loadscript(site + '/SiteAssets/js/fullcalendar.min.js', function () {
            loadscript(site + '/SiteAssets/js/jquery.qtip.min.js', function () {
                LoadMyActions();
            });
        });
    }

    function LoadMyActions() {
        $('#myactions').fullCalendar({
            eventSources: [{
                events: function (start, end, timezone, callback) {
                    // Directives
                    $().SPSTools_Notify({ type: 'wait', content: 'Loading Your Actions...Please wait...' });
                    v.directives = []; // Clear out existing
                    v.calstart = moment(start).startOf('month').subtract(7, 'days').format('YYYY-MM-DD');
                    v.calend = moment(end).endOf('month').format('YYYY-MM-DD');
                    var userId = _spPageContextInfo.userId;
                    var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
                    urlString += "$select=Id,Title,Expended,PMTUser/Id,ActionComments,Enabler,DateCompleted,EffortTypeValue";
                    urlString += "&$expand=PMTUser";
                    urlString += "&$filter=((PMTUser/Id eq " + userId + ") and (DateCompleted ge datetime'" + moment(start).startOf('month').subtract(7, 'days').format('YYYY-MM-DD[T]HH:MM:SS[Z]') + "') and (EffortTypeValue eq 'Directive'))";
                    logit("urlString: " + urlString);
                    jQuery.ajax({
                        url: urlString,
                        method: "GET",
                        headers: { 'accept': 'application/json; odata=verbose' },
                        error: function (jqXHR, textStatus, errorThrown) {
                            //to do implement logging to a central list
                            logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
                            $("#SPSTools_Notify").fadeOut("2500", function () {
                                $("#SPSTools_Notify").html("");
                            });
                        },
                        success: function (data) {
                            var results = data.d.results;
                            var j = jQuery.parseJSON(JSON.stringify(results));
                            var numitems = data.d.results.length;
                            logit("# of actions: " + numitems);
                            for (var i = 0; i < numitems; i++) {
                                var dc = moment(j[i]["DateCompleted"]).add(8, 'hours').format('YYYY-MM-DD');
                                v.directives.push({
                                    id: j[i]["Id"],
                                    title: j[i]["Title"],
                                    start: dc,
                                    starttext: dc,
                                    Hours: j[i]["Expended"],
                                    Enabler: j[i]["Enabler"],
                                    Type: j[i]["EffortTypeValue"],
                                    EndOfWeek: moment(dc).endOf('week').format('YYYY-MM-DD'),
                                    Comments: j[i]["ActionComments"]
                                });
                            }
                            callback(v.directives);
                        }
                    });
                },
                color: 'black', textColor: 'yellow'
            }, {
                events: function (start, end, timezone, callback) {
                    // Standards
                    v.standards = []; // Clear out existing
                    var userId = _spPageContextInfo.userId;
                    var urlString = v.site + "/_vti_bin/listdata.svc/Actions?";
                    urlString += "$select=Id,Title,Expended,PMTUser/Id,ActionComments,Enabler,DateCompleted,EffortTypeValue";
                    urlString += "&$expand=PMTUser";
                    urlString += "&$filter=((PMTUser/Id eq " + userId + ") and (DateCompleted ge datetime'" + moment(start).startOf('month').subtract(7, 'days').format('YYYY-MM-DD[T]HH:MM:SS[Z]') + "') and (EffortTypeValue eq 'Standard'))";
                    logit("urlString: " + urlString);
                    jQuery.ajax({
                        url: urlString,
                        method: "GET",
                        headers: { 'accept': 'application/json; odata=verbose' },
                        error: function (jqXHR, textStatus, errorThrown) {
                            //to do implement logging to a central list
                            logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
                            $("#SPSTools_Notify").fadeOut("2500", function () {
                                $("#SPSTools_Notify").html("");
                            });
                        },
                        success: function (data) {
                            var results = data.d.results;
                            var j = jQuery.parseJSON(JSON.stringify(results));
                            var numitems = data.d.results.length;
                            logit("# of actions: " + numitems);
                            for (var i = 0; i < numitems; i++) {
                                var dc = moment(j[i]["DateCompleted"]).add(8, 'hours').format('YYYY-MM-DD');
                                v.standards.push({
                                    id: j[i]["Id"],
                                    title: j[i]["Title"],
                                    start: dc,
                                    starttext: dc,
                                    Hours: j[i]["Expended"],
                                    Enabler: j[i]["Enabler"],
                                    Type: j[i]["EffortTypeValue"],
                                    EndOfWeek: moment(dc).endOf('week').format('YYYY-MM-DD'),
                                    Comments: j[i]["ActionComments"]
                                });
                            }
                            callback(v.standards);
                        }
                    });
                },
                color: 'blue', textColor: 'white'
            }],
            visibleRange: {
                start: v.calstart,
                end: v.calend
            },
            eventClick: function (event) {
                dhtml = "";
                dhtml += "<table class='table table-striped table-bordered table-hover'>";
                logit(event.start);
                dhtml += "<tr><td>Date</td><td>" + event.starttext + "</td></tr>";
                dhtml += "<tr><td>Type</td><td>" + event.Type + "</td></tr>";
                dhtml += "<tr><td>Hours</td><td>" + event.Hours + "</td></tr>";
                dhtml += "<tr><td>Enabler</td><td>" + event.Enabler + "</td></tr>";
                dhtml += "<tr><td>Comments</td><td>" + event.Comments + "</td></tr>";
                dhtml += "<tr><td>Tools</td><td><a href='#' type='button' data-actionid='" + event.id + "' class='btn btn-info btncopy'>Copy Action</a>&nbsp;<a href='#' type='button' data-actionid='" + event.id + "' class='btn btn-success btnedit'>Edit Action</a></td></tr>";
                dhtml += "</table>";
                $("#PMTModalBody").html('').append(dhtml);
                $("#PMTModalTitle").html('').append(event.title);
                tmp2 = $("#PMTModal").modal({
                    "backdrop": true,
                    "keyboard": false,
                    "show": true
                });
                $(".btncopy").on("click", function (e) {
                    $("#PMTModal").modal('hide');
                    e.preventDefault();
                    var zurl = fixurl('/Lists/Actions/NewAction.aspx?Action=Copy&CopyId=' + $(this).attr("data-actionid") + '&IsDlg=1');
                    CKODialog(zurl, 'New Action', '800', '820', 'NotificationCallback');
                });
                $(".btnedit").on("click", function (e) {
                    $("#PMTModal").modal('hide');
                    e.preventDefault();
                    var zurl = fixurl('/Lists/Actions/EditForm.aspx?ID=' + $(this).attr("data-actionid") + '&IsDlg=1');
                    CKODialog(zurl, 'Edit Action', '800', '820', 'NotificationCallback');
                });
            },
            viewRender: function (view) {
                if (view.name === 'month') {
                    $(".fc-day-number").each(function () {
                        var dd = $(this).parent().attr("data-date");
                        var add;
                        if ($(this).parent().hasClass("fc-sat")) {
                            add = "<div style='float:left;margin-right:20px;margin-top:5px;'>Total: <span data-date='" + dd + "'></span></div><div style='float:left;margin-right:15px;margin-top:5px;'>Week: <span data-end='" + dd + "'></span></div><a class='btn btn-default btn-xs btnadd' data-date='" + dd + "' href='#'>Add</a>&nbsp;";
                        }
                        else {
                            add = "<div style='float:left;margin-right:80px;margin-top:5px;'>Total: <span data-date='" + dd + "'></span></div><a class='btn btn-default btn-xs btnadd' data-date='" + dd + "' href='#'>Add</a>&nbsp;";
                        }    
                        $(this).prepend(add);
                    });
                   
                }
                
                $(".btnadd").on("click", function (e) {
                    e.preventDefault();
                    var zurl = fixurl('/Lists/Actions/NewAction.aspx?Action=New&Date=' + $(this).attr("data-date") + '&IsDlg=1');
                    CKODialog(zurl, 'Add New Action', '800', '820', 'NotificationCallback');
                });

                $(".fc-title").hover(function () {
                    $(this).css({ "cursor": "pointer" });
                }, function () {
                    $(this).css({ "cursor": "default" });
                });

                $("#SPSTools_Notify").fadeOut("2500", function () {
                    $("#SPSTools_Notify").html("");
                });
            },
            eventRender: function (event, element) {
                var start = event.start._i;
                var hours = event.Hours;
                var eow = event.EndOfWeek;
                var current = Number($("span[data-date='" + start + "']").text());
                var total = current + hours;
                $("span[data-date='" + start + "']").text(total);
                var wcurrent = Number($("span[data-end='" + eow + "']").text());
                var wtotal = wcurrent + hours;
                $("span[data-end='" + eow + "']").text(wtotal);
                v.html = event.title + "<br/>" + event.Comments + "<br/>" + event.Hours + " hour(s)";
                element.qtip({
                    content: {
                        text: v.html
                    }
                });
            }
        });
        $(".fc-center").html("<div style= 'border-color:black;color:yellow;background-color:black;padding:8px;'>Directive</div>&nbsp;<div style='border-color:blue;color:white;background-color:blue;padding:8px;'>Standard</div>");
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

    return {
        Init: Init
    }
}

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs("CEWP_MyActions.js");