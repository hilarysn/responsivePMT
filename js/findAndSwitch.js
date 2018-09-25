$(".ms-description").each(function (idx) {
    var title = $(this).text();
    $(this).parent().find(".form-control").attr("data-title", title);
});

    //get field on-hover values
    var title = $(this).text();
    $(this).parent.find("span").children().attr("title", $(this).text());
    function getMSDescription(fieldName, text) { // Get each field's description text
        //
        var helptext = {};

        $(".ms-description").each(function (idx) {
            var title = $(this).parent.find("span").children().attr("title", $(this).text());
            helptext.fieldname = title;
            helptext.text = ms-description;
        });
    }

    function GetHelpText() {
        // LoadUserAssistance from REST
        v.userassistance = [];
        var urlString = v.site + "/_vti_bin/listdata.svc/UserAssistance?";
        urlString += "$select=Id,ListName,FieldOrder,UserAssistance";
        urlString += "&$filter=(ListName eq 'Actions')";
        urlString += "&$orderby=FieldOrder";

        jQuery.ajax({
            url: urlString,
            method: "GET",
            headers: { 'accept': 'application/json; odata=verbose' },
            error: function (jqXHR, textStatus, errorThrown) {
                // to do implement logging to a central list
                logit("Error Status: " + textStatus + ":: errorThrown: " + errorThrown);
            },
            success: function (data) {
                var results = data.d.results;
                var j = jQuery.parseJSON(JSON.stringify(results));
                var numitems = data.d.results.length;
                logit("UserAssistance Fields Count: " + numitems);

                for (var i = 0; i < j.length; i++) {
                    // Add to standard array so that we can display info based on selected standard
                    v.userassistance.push({
                        "field-order": j[i]["FieldOrder"],
                        "help": j[i]["UserAssistance"]
                    });
                }
            }
        });

        //// Pass the field-order as the value so we know which item ges what text.
        //var nohelp = document.getElementById('hover-content').innerHTML;
        //if (nohelp !== '') {
        //    var str = "#";
        //    var helpnum = document.getElementById('hover-content').getAttribute("fieldorder");
        //    alert(helpnum);
        //    str.replace("nohelp", v.userassistance[helpnum].help);
        //    alert(v.userassistance[fieldorder].helpnum);
        //}
    }

    // Pass the field-order as the value so we know which item ges what text.

    $("div").hover(function () {
        var nohelp = document.getElementById('hover-content').innerHTML;
        //var helpnum = content.data('order');
        var helpnum = $(this).data("#data-order");
        var helptext = v.userassistance[helpnum].help
        nohelp.replace(nohelp, helptext);
    });

    #hover-content { display: none; }
    span:hover + #hover-content {
        border: 3px solid lightgrey;
        padding: 10px;
        background-color: lightgoldenrodyellow;
        display: block;
        position: fixed;
        left: 120px;
        z-index: 999;
}

$("span").each(function () {
    if ($(this).html().indexOf("Displays your user name.") === 0) { $(this).hide(); }
});