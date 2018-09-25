var CKO = CKO || {};
CKO.KNOWLEDGEMAP = CKO.KNOWLEDGEMAP || {};
CKO.KNOWLEDGEMAP.MAP = CKO.KNOWLEDGEMAP.MAP || {};
CKO.KNOWLEDGEMAP.MAP.VARIABLES = CKO.KNOWLEDGEMAP.MAP.VARIABLES || {};

CKO.KNOWLEDGEMAP.MAP.VARIABLES = {
    site: null,
    SLASH: "/",
    mx: 0,
    my: 0,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    org: null,
    orgs: null,
    orgsenum: null,
    map: null,
    mapdata: null,
    mapenum: null,
    mapitems: null,
    markers: [],
    userID: null,
    html: ""
}

CKO.KNOWLEDGEMAP.MAP.Map = function () {

    var v = CKO.KNOWLEDGEMAP.MAP.VARIABLES;

    function Init(site) {
        v.site = site;
        SP.SOD.executeOrDelayUntilScriptLoaded(function () {
            RegisterSod('core.js', site + "/_layouts/1033/core.js");
            RegisterSodDep('core.js', 'sp.js');
            EnsureScriptFunc("CEWP_KM_Map2.js", null, function () {
                GetMapData(site);
            });
        }, "sp.js");
    }

    function GetMapData(site) {
        v.userID = _spPageContextInfo.userId;
        var inDesignMode = document.forms[MSOWebPartPageFormName].MSOLayout_InDesignMode.value;

        logit("Design Mode = " + inDesignMode);
        if (inDesignMode === "1") {
            $("#map_loading").html("").append("<div style='margin:5px;text-align:center;font-weight:bold;font-size:14px;font-style:italic;'>Query Suspended During Page Edit Mode</div>");
        }
        else {

            h1 = $(window).height();
            h2 = (Math.floor(h1 / 10) * 10) - 100;
            h3 = h2 - 150;

            $('#PMTModal').on('shown.bs.modal', function (event) {
                $(".pmtmodal").css({ height: h2 + "px" });
                $("#PMTModal .panel-body").css({ height: h3 + "px" });
                $("#PMTModal .row").css({ "margin-bottom": "10px" });
            });

            v.orgs = new Array();
            v.mapitems = new Array();
            v.markers = new Array();
            var monkey = getOrgData();
            jQuery.when.apply(null, monkey).done(function () {
                logit("Map getOrgData complete.");
                var dog = getMapPopupData();
                jQuery.when.apply(null, dog).done(function () {
                    logit("Map Data Loaded!");
                    var stop = "stop";
                    drawMap();
                });
            });
        }
    }

    function getOrgData() {
        var deferreds = [];

        var inc = "Include(";
        var xml = "<View><Method Name='Read List' /><Query><OrderBy><FieldRef Name='ChartOrder' /></OrderBy><Where><IsNotNull><FieldRef Name='Title' /></IsNotNull></Where></Query>";
        var fields = ["Title", "Base", "Level", "Latitude", "Longitude", "ChartOrder", "ShowOnKM", "ShowOnChart", "POC", "OrganizationType"];
        xml += "<ViewFields>";
        for (var z = 0; z <= fields.length - 1; z++) {
            xml += "<FieldRef Name='" + fields[z] + "'/>";
            if (z === fields.length - 1) {
                inc += fields[z] + ")";
            }
            else {
                inc += fields[z] + ", ";
            }
        }
        xml += "<FieldRef Name='ID'/>";
        xml += "</ViewFields>";
        xml += "</View>";

        deferreds.push($.when(CKO.CSOM.GetListItems.getitemsfilteredcomplex("current", "Organization", xml, inc)).then(function (items) {
            if (items.get_count() > 0) { //get map data
                v.mapenum = items.getEnumerator();
                while (v.mapenum.moveNext()) {
                    v.mapitem = v.mapenum.get_current();
                    if (v.mapitem.get_item("ShowOnKM") === true) {
                        v.mapitems.push({
                            "Title": v.mapitem.get_item("Title"),
                            "Base": v.mapitem.get_item("Base"),
                            "lat": v.mapitem.get_item("Latitude"),
                            "lon": v.mapitem.get_item("Longitude"),
                            "POC": v.mapitem.get_item("POC"),
                            "Level": v.mapitem.get_item("Level"),
                            "Type": v.mapitem.get_item("OrganizationType"),
                            "PopupData": ""
                        });
                    }
                }
            }
        }, function (sender, args) {
            logit("Error getting data from Organization list : " + args.get_message());
        }));
        return deferreds;
    }

    function getMapPopupData() {
        var deferreds = [];
        var fields = ["OrganizationType", "Level", "Base", "Title", "POC", "ChartOrder"];
        for (i = 0; i < v.mapitems.length; i++) {
            var base = v.mapitems[i].Base;
            deferreds.push($.when(CKO.CSOM.GetListItems.getitemsfilteredorderedandpassfieldstoelement("current", "Organization", "Base", base, "ChartOrder", i, fields)).then(function (items, i) {
                if (items.get_count() > 0) {
                    var enumerator = items.getEnumerator();
                    var cnt = 0;
                    while (enumerator.moveNext()) {
                        var current = enumerator.get_current();
                        if (cnt === 0) {
                            v.mapitems[i].PopupData = current.get_item("OrganizationType") + ";" + current.get_item("Level") + ";" + current.get_item("Base") + ";" + current.get_item("Title") + ";" + current.get_item("POC");
                        }
                        else {
                            v.mapitems[i].PopupData += "|" + current.get_item("OrganizationType") + ";" + current.get_item("Level") + ";" + current.get_item("Base") + ";" + current.get_item("Title") + ";" + current.get_item("POC");
                        }
                        cnt += 1;
                    }
                }
            }, function (sender, args) {
                logit("Error getting data from KnowledgeMap list: " + args.get_message());
            }));
        }
        return deferreds;
    }

    function drawMap() {
        logit("Drawing the map...");
        //var myOptions = {
        //    mapTypeId: google.maps.MapTypeId.ROADMAP,
        //    scrollwheel: false,
        //    zoomControl: false
        //};
        var myOptions = {
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map"), myOptions);
        var geocoder = new google.maps.Geocoder();
        var iconBase = 'https://maps.google.com/mapfiles/kml/paddle/';

        geocoder.geocode({ 'address': 'US' }, function (results, status) {
            var ne = results[0].geometry.viewport.getNorthEast();
            var sw = results[0].geometry.viewport.getSouthWest();
            map.fitBounds(results[0].geometry.viewport);
        });

        var redCircle = {
            path: 'M 8, 8 m -8, 0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0',
            scale: .7,
            strokeColor: 'red',
            fillColor: 'red',
            fillOpacity: 1
        }

        var bluegreenCircle = {
            path: 'M 8, 8 m -8, 0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0',
            scale: .7,
            strokeColor: '#00ff33',
            strokeWeight: 3,
            fillColor: '#0072bc',
            fillOpacity: 1
        }

        var blueCircle = {
            path: 'M 8, 8 m -8, 0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0',
            scale: .7,
            strokeColor: '#0072bc',
            fillColor: '#0072bc',
            fillOpacity: 1
        }

        var greenCircle = {
            path: 'M12 5.5c-4.688 0-8.5 3.813-8.5 8.5s3.813 8.5 8.5 8.5 8.5-3.813 8.5-8.5-3.813-8.5-8.5-8.5zM24 14c0 6.625-5.375 12-12 12s-12-5.375-12-12 5.375-12 12-12v0c6.625 0 12 5.375 12 12z', //  'M 8, 8 m -8, 0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0',
            scale: .5,
            strokeColor: '#00ff33', //'#40a542',
            fillColor: '#00ff33',
            fillOpacity: 1
        }

        var greenPin = {
            //path: 'M12 5.5c-4.688 0-8.5 3.813-8.5 8.5s3.813 8.5 8.5 8.5 8.5-3.813 8.5-8.5-3.813-8.5-8.5-8.5zM24 14c0 6.625-5.375 12-12 12s-12-5.375-12-12 5.375-12 12-12v0c6.625 0 12 5.375 12 12z', //  'M 8, 8 m -8, 0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0',
            path: 'M8 17c0.688 0 1.359-0.078 2-0.234v10.234c0 0.547-0.453 1-1 1h-2c-0.547 0-1-0.453-1-1v-10.234c0.641 0.156 1.312 0.234 2 0.234zM8 0c4.422 0 8 3.578 8 8s-3.578 8-8 8-8-3.578-8-8 3.578-8 8-8zM8 3.5c0.281 0 0.5-0.219 0.5-0.5s-0.219-0.5-0.5-0.5c-3.031 0-5.5 2.469-5.5 5.5 0 0.281 0.219 0.5 0.5 0.5s0.5-0.219 0.5-0.5c0-2.484 2.016-4.5 4.5-4.5z',
            scale: .5,
            strokeColor: '#40a542',
            fillColor: '#40a542',
            fillOpacity: 1
        }

        var goldStar = {
            path: 'M 16,5 H 10 L 8,0 6,5 H 0 L 4,10 2,16 8,12 14,16 12,10 16,5 z',
            strokeColor: 'black',
            fillColor: 'gold',
            fillOpacity: 1
        }

        var legend = document.getElementById('legend');

        map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(legend);

        // add the markers
        for (i = 0; i < v.mapitems.length; i++) {
            switch (v.mapitems[i].Type) {
                case "TRADOC HQ":
                    ico = goldStar;
                    break;

                case "Supported on site":
                    ico = blueCircle;
                    break;

                case "Supported by TRADOC HQ":
                    ico = greenCircle;
                    break;

                case "Not currently supported":
                    ico = redCircle;
                    break;
            }
            if (v.mapitems[i].Base === "Fort Leavenworth") {
                ico = bluegreenCircle;
            }
            var marker = new google.maps.Marker({
                position: { lat: v.mapitems[i].lat, lng: v.mapitems[i].lon },
                title: v.mapitems[i].Title,
                popupdata: v.mapitems[i].PopupData,
                icon: ico,
                base: v.mapitems[i].Base,
                map: map
            });
            marker.addListener('click', function (ev) {
                drawtooltip(this, ev);
            });
            v.markers.push(marker);
        }

        $("#map_loading").hide();
        logit("Drew the map");
    }

    function drawtooltip(obj, ev) {
        //var position = getPosition(obj);
        //v.mx = position.x;
        //v.my = position.y;
        v.mx = ev.va.clientX;
        v.my = ev.va.clientY;
        var title = obj.title;
        var data = obj.popupdata;
        var html = "<div class='popdata' id='popcontainer_" + title.replace(/ /g, "_") + "'>";
        if (data.indexOf("|") > 0) {
            // Multiple boxes
            var tmp1, tmp2, tmp3, tmp4;
            tmp1 = data.split("|");
            for (var z = 0; z < tmp1.length; z++) {
                tmp2 = tmp1[z].split(";");
                html += "<div id='popup_";
                tmp3 = tmp2[0];

                switch (tmp3) {
                    case "Supported on site":
                        html += tmp2[3].replace(/ /g, "_") + "' class='popBox alert alert-info' data-org='" + tmp2[3] + "' onclick='CKO.KNOWLEDGEMAP.MAP.Map().minidashboard(this)'>";
                        if (tmp2[1] > 0) {
                            html += "<div class='row popRow'>";
                            for (var y = 0; y < tmp2[1]; y++) {
                                html += "<svg class='fa fa-star'><use xlink:href='#fa-star'></use></svg>&nbsp;";
                            }
                            html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                            html += "</div>";
                        }
                        else {
                            html += "<div class='row popRow'>";
                            html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                            html += "</div>";
                        }
                        html += "<div class='row popRow'>" + tmp2[2] + "</div>";
                        html += "<div class='row popRow'>" + tmp2[3] + "</div>";
                        html += "<div class='row popRow'>" + tmp2[4] + "</div>";
                        html += "</div>";
                        break;

                    case "Supported by TRADOC HQ":
                        html += tmp2[3].replace(/ /g, "_") + "' class='popBox alert alert-success' data-org='" + tmp2[3] + "' onclick='CKO.KNOWLEDGEMAP.MAP.Map().minidashboard(this)'>";
                        if (tmp2[1] > 0) {
                            html += "<div class='row popRow'>";
                            for (y = 0; y < tmp2[1]; y++) {
                                html += "<svg class='fa fa-star'><use xlink:href='#fa-star'></use></svg>&nbsp;";
                            }
                            html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                            html += "</div>";
                        }
                        else {
                            html += "<div class='row popRow'>";
                            html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                            html += "</div>";
                        }
                        html += "<div class='row popRow'>" + tmp2[2] + "</div>";
                        html += "<div class='row popRow'>" + tmp2[3] + "</div>";
                        html += "<div class='row popRow'>" + tmp2[4] + "</div>";
                        html += "</div>";
                        break;

                    case "TRADOC HQ":
                        html += tmp2[3].replace(/ /g, "_") + "' class='popBox alert alert-warning' data-org='" + tmp2[3] + "' onclick='CKO.KNOWLEDGEMAP.MAP.Map().minidashboard(this)'>";
                        html += "<div class='row popRow'>";
                        for (y = 0; y < tmp2[1]; y++) {
                            html += "<svg class='fa fa-star'><use xlink:href='#fa-star'></use></svg>&nbsp;";
                        }
                        html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                        html += "</div>";
                        html += "<div class='row popRow'>" + tmp2[2] + "</div>";
                        html += "<div class='row popRow'>" + tmp2[3] + "</div>";
                        html += "<div class='row popRow'>" + tmp2[4] + "</div>";
                        html += "</div>";
                        break;

                    case "Not currently supported":
                        html += tmp2[3].replace(/ /g, "_") + "' class='popBox alert alert-danger' data-org='" + tmp2[3] + "' onclick='CKO.KNOWLEDGEMAP.MAP.Map().minidashboard(this)'>";
                        if (tmp2[1] > 0) {
                            html += "<div class='row popRow'>";
                            for (y = 0; y < tmp2[1]; y++) {
                                html += "<svg class='fa fa-star'><use xlink:href='#fa-star'></use></svg>&nbsp;";
                            }
                            html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                            html += "</div>";
                        }
                        else {
                            html += "<div class='row popRow'>";
                            html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                            html += "</div>";
                        }
                        html += "<div class='row popRow'>" + tmp2[2] + "</div>";
                        html += "<div class='row popRow'>" + tmp2[3] + "</div>";
                        html += "<div class='row popRow'>" + tmp2[4] + "</div>";
                        html += "</div>";
                        break;
                }
            }
        }
        else {
            // Only one box, built on semicolon
            tmp1 = data.split(";");
            html += "<div id='popup_";
            tmp3 = tmp1[0];
            switch (tmp3) {
                case "Supported on site":
                    html += tmp1[3].replace(/ /g, "_") + "' class='popBox alert alert-info' data-org='" + tmp1[3] + "' onclick='CKO.KNOWLEDGEMAP.MAP.Map().minidashboard(this)'>";
                    if (tmp1[1] > 0) {
                        html += "<div class='row popRow'>";
                        for (y = 0; y < tmp1[1]; y++) {
                            html += "<svg class='fa fa-star'><use xlink:href='#fa-star'></use></svg>&nbsp;";
                        }
                        html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                        html += "</div>";
                    }
                    else {
                        html += "<div class='row popRow'>";
                        html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                        html += "</div>";
                    }
                    html += "<div class='row popRow'>" + tmp1[2] + "</div>";
                    html += "<div class='row popRow'>" + tmp1[3] + "</div>";
                    html += "<div class='row popRow'>" + tmp1[4] + "</div>";
                    html += "</div>";
                    break;

                case "Supported by TRADOC HQ":
                    html += tmp1[3].replace(/ /g, "_") + "' class='popBox alert alert-success' data-org='" + tmp1[3] + "' onclick='CKO.KNOWLEDGEMAP.MAP.Map().minidashboard(this)'>";
                    if (tmp1[1] > 0) {
                        html += "<div class='row popRow'>";
                        for (y = 0; y < tmp1[1]; y++) {
                            html += "<svg class='fa fa-star'><use xlink:href='#fa-star'></use></svg>&nbsp;";
                        }
                        html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                        html += "</div>";
                    }
                    else {
                        html += "<div class='row popRow'>";
                        html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                        html += "</div>";
                    }
                    html += "<div class='row popRow'>" + tmp1[2] + "</div>";
                    html += "<div class='row popRow'>" + tmp1[3] + "</div>";
                    html += "<div class='row popRow'>" + tmp1[4] + "</div>";
                    html += "</div>";
                    break;

                case "TRADOC HQ":
                    html += tmp1[3].replace(/ /g, "_") + "' class='popBox alert alert-warning' data-org='" + tmp1[3] + "' onclick='CKO.KNOWLEDGEMAP.MAP.Map().minidashboard(this)'>";
                    html += "<div class='row popRow'>";
                    html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                    html += "</div>";
                    html += "<div class='row popRow'>" + tmp1[2] + "</div>";
                    html += "<div class='row popRow'>" + tmp1[3] + "</div>";
                    html += "<div class='row popRow'>" + tmp1[4] + "</div>";
                    html += "</div>";
                    break;

                case "Not currently supported":
                    html += tmp1[3].replace(/ /g, "_") + "' class='popBox alert alert-danger' data-org='" + tmp1[3] + "' onclick='CKO.KNOWLEDGEMAP.MAP.Map().minidashboard(this)'>";
                    html += "<div class='row popRow'>";
                    html += "<span class='info-right'><svg class='fa fa-info-circle'><use xlink:href='#fa-info-circle'></use></svg></span>";
                    html += "</div>";
                    html += "<div class='row popRow'>" + tmp1[2] + "</div>";
                    html += "<div class='row popRow'>" + tmp1[3] + "</div>";
                    html += "<div class='row popRow'>" + tmp1[4] + "</div>";
                    html += "</div>";
                    break;
            }
        }
        html += "</div>";
        //var infowindow = new google.maps.InfoWindow({
        //    content: html,
        //    disableAutoPan: true,
        //    maxWidth: 280
        //});
        //infowindow.open(map, obj);

        $("#MarkerBody").html("").append(html);
        var mph = $('#MarkerPanel').height();
        var mpt = v.my - (mph / 2);
        $(".markerpanel").css({ top: mpt + "px", left: v.mx + 10 + "px" }).show();
    }

    function minidashboard(obj) {
        var tmp1, tmp2, tmp3;
        tmp1 = $("#" + obj.id).attr('data-org');
        ahtml = '';
        $.when(CKO.CSOM.GetListItems.getitemsfiltered("current", "Organization", "Title", tmp1)).then(function (items) {
            var alertitems = items.getEnumerator();
            while (alertitems.moveNext()) {
                var alertitem = alertitems.get_current();
                ahtml += '<div class="row">';
                ahtml += '<div class="col-xs-3">';
                ahtml += "Last Updated: "
                ahtml += '</div>';
                ahtml += '<div class="col-xs-9">';
                ahtml += alertitem.get_item("Modified") + '</div>';
                ahtml += '</div>';
                ahtml += '</div>';
                ahtml += '<div class="row">';
                ahtml += '<div class="col-xs-3">';
                ahtml += "Major Achievements: "
                ahtml += '</div>';
                ahtml += '<div class="col-xs-9">';
                ahtml += '<textarea class="form-control" rows="6">' + alertitem.get_item("Achievements") + '</textarea>';
                ahtml += '</div>';
                ahtml += '</div>';
                ahtml += '<div class="row">';
                ahtml += '<div class="col-xs-3">';
                ahtml += "Issues: "
                ahtml += '</div>';
                ahtml += '<div class="col-xs-9">';
                ahtml += '<textarea class="form-control" rows="6">' + alertitem.get_item("Issues") + '</textarea>';
                ahtml += '</div>';
                ahtml += '</div>';
                ahtml += '<div class="row">';
                ahtml += '<div class="col-xs-3">';
                ahtml += "Events: "
                ahtml += '</div>';
                ahtml += '<div class="col-xs-9">';
                ahtml += '<textarea class="form-control" rows="6">' + alertitem.get_item("Events") + '</textarea>';
                ahtml += '</div>';
                ahtml += '</div>';
                ahtml += '<div class="row">';
                ahtml += '<div class="col-xs-3">';
                ahtml += "Future Challenges: "
                ahtml += '</div>';
                ahtml += '<div class="col-xs-9">';
                ahtml += '<textarea class="form-control" rows="6">' + alertitem.get_item("Challenges") + '</textarea>';
                ahtml += '</div>';
                ahtml += '</div>';
            }
            $("#PMTModalBody").html('').append(ahtml);
            $("#PMTModalTitle").html('').append(tmp1 + " Data");
            tmp2 = $("#PMTModal").modal({
                "backdrop": true,
                "keyboard": false,
                "show": true
            });
        }, function (sender, args) { logit("GetAlerts Failed, " + args.get_message()); });
    }

    function closemarker() {
        $(".markerpanel").hide();
    }

    function getPosition(el) {
        var xPosition = 0;
        var yPosition = 0;

        while (el) {
            if (el.tagName == "BODY") {
                // deal with browser quirks with body/window/document and page scroll
                var xScrollPos = el.scrollLeft || document.documentElement.scrollLeft;
                var yScrollPos = el.scrollTop || document.documentElement.scrollTop;

                xPosition += (el.offsetLeft - xScrollPos + el.clientLeft);
                yPosition += (el.offsetTop - yScrollPos + el.clientTop);
            } else {
                xPosition += (el.offsetLeft - el.scrollLeft + el.clientLeft);
                yPosition += (el.offsetTop - el.scrollTop + el.clientTop);
            }

            el = el.offsetParent;
        }
        return {
            x: xPosition,
            y: yPosition
        };
    }

    return {
        Init: Init,
        minidashboard: minidashboard,
        closemarker: closemarker
    }
}

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('CEWP_KM_Map2.js');