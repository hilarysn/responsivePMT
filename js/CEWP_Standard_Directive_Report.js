var CKO = CKO || {};
CKO.AJAX = CKO.AJAX || {};
CKO.MIGRATIONS = CKO.MIGRATIONS || {};
CKO.MIGRATIONS.VARIABLES = CKO.MIGRATIONS.VARIABLES || {};

CKO.MIGRATIONS.VARIABLES = {
    site: null,
    loc: String(window.location),
    waitmsg: null,
    title: null,
    ctx: null,
    total: 0,
    count: 0,
    web: null,
    list: null,
    data: null,
    json: null,
    url: null,
    goon: false,
    listitems: null,
    user: null,
    userID: null,
    items: [],
    qry: null,
    terms: [],
    standards: [],
    directives: [],
    month: null,
    year: null,
    props: null,
    html: ""
};

CKO.MIGRATIONS.Migrate = function () {

    var v = CKO.MIGRATIONS.VARIABLES;

    function Init(site) {
        v.site = site;
        logit("PMT Migrations loaded.");
        var userId = _spPageContextInfo.userId;
        v.data = [];
        v.items = [];
        v.json = null;
        logit("_spPageContextInfo.webServerRelativeUrl: " + _spPageContextInfo.webServerRelativeUrl);
        v.url = _spPageContextInfo.webServerRelativeUrl;

        $("#btnArchive").click(function () {
            $().SPSTools_Notify({ type: 'wait', content: 'Getting Standards and Directives...Please wait...' });
            LoadStandards(null);
        });
    }

    //Rest query to go get standards from the alignments list on PMT
    function LoadStandards(zurl) {
        if (zurl === null) {
            var urlString = v.site + "/_vti_bin/ListData.svc/Alignments?";
            //urlString += "$select=*";
            urlString += "$select=Id,Parent,Paragraph,Reference,Description,ShortDescription";
            urlString += "&$filter=(ShortDescription ne null) and (Description ne null) and (Reference ne null)";
            urlString += "&$orderby=Paragraph";
            zurl = urlString;
        }

        jQuery.ajax({
            url: zurl,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Standards: Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                v.json = jQuery.parseJSON(JSON.stringify(data.d.results));
                StandardsLoaded();
            }           
        });
    }

    //Sets the Standard fields on the correport list
    function StandardsLoaded() {
        var j = v.json;
        var b = moment();
        var month = moment().format("MMMM");
        var year = moment().format("YYYY");
        console.log(month);
        console.log(year);
        v.total = j.length;
        console.log(v.total);
        for (i = 0; i < j.length; i++) {
            v.items.push({
                "Name": j[i]["ShortDescription"],
                "Coe": j[i]["Reference"],
                "PWSNumber": j[i]["Paragraph"],
                "ShortDescription": j[i]["ShortDescription"],
                "Description": j[i]["Description"],
                "EffortType": "Standard",
                "SupportedSubOrg": j[i]["Reference"],
                "SupportReference": j[i]["Reference"],
                "Month": month,
                "Year": year
            });
        }
        LoadDirectives(null);
        //AddItems();
    }

    //Rest query to get Directives from PMT Site
    function LoadDirectives(zurl) {
        if (zurl === null) {
            var urlString = v.site + "/_vti_bin/ListData.svc/Directives?";
            //urlString += "$select=*";
            urlString += "$select=Id,Title,Directive,DirectiveStatusValue,SupportedOrg,SupportParagraph,SupportReference,DirectiveDescription,ParentID,SupportedSubOrg";
            urlString += "&$filter=(DirectiveStatusValue eq 'InProgress')";
            urlString += "&$orderby=ParentID";
            zurl = urlString;
        }

        jQuery.ajax({
            url: zurl,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                //to do implement logging to a central list
                logit("Directive: Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                v.json = jQuery.parseJSON(JSON.stringify(data.d.results));
                DirectivesLoaded();
            }
        });
    }

    //Sets fields for Directives on the correport list
    function DirectivesLoaded() {
        var j = v.json;
        var b = moment();
        var month = moment().format("MMMM");
        var year = moment().format("YYYY");
        console.log(month);
        console.log(year);
        v.total = j.length;
        console.log(v.total);
        for (i = 0; i < j.length; i++) {
            v.items.push({
                "Name": j[i]["Directive"],
                "Coe": j[i]["SupportReference"],
                "PWSNumber": j[i]["SupportParagraph"],
                "ShortDescription": j[i]["Directive"],
                "Description": j[i]["DirectiveDescription"],
                "EffortType": "Directive",
                "SupportedSubOrg": j[i]["SupportedSubOrg"],
                "SupportReference": j[i]["SupportReference"],
                "Month": month,
                "Year": year
            });
        }
        AddItems();
    }

    function AddItems() {
        v.total = v.items.length;
        for (i = 0; i < v.items.length; i++) {
            AddItem(v.items[i]).success(AddItemSucceeded).fail(AddItemFail);
        }
    }

    function AddItem(itemProperties) {
        return $.ajax({
            type: 'POST',
            url: "https://hq.tradoc.army.mil/sites/OCKO/PMT/_vti_bin/listdata.svc/CORReport",
            contentType: 'application/json',
            processData: false,
            headers: {
                "Accept": "application/json;odata=verbose"
            },
            data: JSON.stringify(itemProperties)
        });
    }

    function AddItemSucceeded() {
        v.count += 1;
        if (v.count === v.total) {
            //alert("items added");
            $("#SPSTools_Notify").fadeOut("2500", function () {
                $("#SPSTools_Notify").html("");
            });
        }
    }

    function AddItemFail(jqXHR, textStatus, errorThrown) {
        v.count += 1;
        if (v.count === v.total) {
            alert("items failed");
            $("#SPSTools_Notify").fadeOut("2500", function () {
                $("#SPSTools_Notify").html("");
            });
        } else {
            console.log("add item failed: " + errorThrown);
        }
    }

    UpdateActionItemFail = function (data) {
        var updateitemdata = this;
    };
    
    return {
        Init: Init
    };
};

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs("CEWP_Standard_Directive_Report.js");