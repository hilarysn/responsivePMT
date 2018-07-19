/*
* SPSTools.Calendar ---- SPSTools Calendar Module
* Version 0.0.1 (Alpha)
* Requires jQuery 1.7.1 or greater
 * Requires SPServices 0.7.0 or greater
* Requires datejs
* Copyright (c) 2012 Daniel Walker
* Licensed under the MIT license:
* http://www.opensource.org/licenses/mit-license.php
*/

(function ($) {

	// String constants
	var SLASH = "/";
	var cmlQry; // Internal variable for SPServices CAML Query
	var cmlVfs; // Internal variable for SPServices ViewFields
	var cmlQryOpts; // Internal variable for SPServices CAML Query Options
	var opt;
	var DayCells = [];
	var defarr = [];
	var EventObj = {};
	var thisDate = '';
	var WorkingDate = null;
	var DaysInMonth = 0;
	var FirstDayMonth = null;
	var LastDayMonth = null;
	var FirstDayWeek = null;
	var LastDayWeek = null;
	var CalOffset = 0;
	var TotalDays = 0;
	var GridRows = 0;
	var TotalBoxes = 0;
	var DateRange = { StartDate: null, EndDate: null };
	var EventCollection = [];
	var msg = "";
	var px, py, cw, cwpx, cellwidth, cellheight;
	var defaulthovercss = "position:absolute;background:#ffffff;display:none;";
	
	var whencomplete = function(pars) {
		window.status = "Action Complete!";
	}
	
	var defaults = {
		operation: '',                                  // Operation to perform (Notify, Dialog, TimeSpan, etc)
		action: '',                                     // action to perform with or after operation if any. Can be another operation
		CalendarList: 'Events',                         // Name of calendar list
		cqry: '',                                       // CAML query
		cvfs: '',                                       // CAML viewfields
		cqryopts: '',                                   // CAML query options
		CalendarUrl: '/sites/commsCatalog',              // webURL of site that contains the list
		SelectedDiv: '',
		width: '1000',
		CalContainer: 'SPSTools_Calendar',              // Default id of calendar. Used in CSS as well as code
		FirstDayOfWeek: 0,                              // Uses Sunday. This is set in the datejs code at the bottom 
		HeaderHeight: 48,                               // In px the height of the header
		navLinks: {
			p:'&lsaquo; Prev', 
			n:'Next &rsaquo;', 
			ww:'Show Work Week',
			showMore: 'Show More'
		},
		SelectedDate: '',
		CalType: 'Month',                               // Month, Week, Day, GanttMonth(Default?), Gantt3Month
		categories: [],
		categoryclass: [],
		categorycss: [],
		CalendarStartDate: new Date(),
		OnMonthChanging: function() {},
		OnMonthChanged: function() {},
		OnEventLinkClick: function() {},
		OnEventDivClick: function () {  },
		OnEventDivOver: function () {  },
		OnEventDivOut: function () {  },
		OnDayLinkClick: function () {  },
		OnDayCellClick: function () {  },
		OnDayCellDblClick: function () {  },
		OnShowMoreClick: function () { },
		callback: whencomplete                          // Function to run when complete
	};

	$(document).ready(function () {
	    px = ($(window).width()) / 2;
	    py = ($(window).height()) / 2;
	    $("body").append("<div id='SPSTools_Calendar_Hover' style=" + defaulthovercss + " />");
	});
	
	$.fn.SPSTools_Calendar = function (options) {
		opt = $.extend(true, {}, defaults, options);
		var pars = { p1:'default'};                         // Just used to ensure the callback runs
		opt.callback(pars);                                 // Just used to ensure the callback runs
	};
	
	$.fn.SPSTools_Calendar.Initialize = function (options, events) {
	    options = $.extend(true, {}, defaults, options);	
		if (events) { 
			$.fn.SPSTools_Calendar.ClearEventsOnCalendar();
			EventCollection = events;
		}
		options.SelectedDate = new Date();
		$.fn.SPSTools_Calendar.Render(options);
	};
	
	$.fn.SPSTools_Calendar.Render = function(options) {
		options = $.extend(true, {}, defaults, options);
		//var user = $().SPServices.SPGetCurrentUser({ fieldName: "Name", debug: false });
		var test = new String(window.location);
		$("#SPSTools_Calendar").html("");
		// Calculate the dates to add and draw the calendar
		// Will check to see if there is a date in the url later
		var today = options.CalendarStartDate;
        var now = new Date();


        ////////////////////////////////////////////////////////////////////////////
	   
		now.clearTime(); 

		$.fn.SPSTools_Calendar.SetupDates(options.SelectedDate);

		var isostart = getISODate(DateRange.StartDate);
		var isoend = getISODate(DateRange.EndDate);

		var container = $("#SPSTools_Calendar");
		var cal = $('<table class="SPSToolsCalendar" cellpadding="0" cellspacing="0"></table>');
		var calHeader = $.fn.SPSTools_Calendar.BuildHeaders(options);
		cal.append(calHeader);
		
		var calBody = $('<tbody id="CalendarBody"></tbody>');

		var calGrid = $('<table class="CalGrid" cellpadding="0" cellspacing="0"></table>');

		//calGrid.addClass(options.CalType);

		var calGridHeader = $.fn.SPSTools_Calendar.BuildGridHeader(options);
		var calGridBody = $.fn.SPSTools_Calendar.BuildGridBody(options);
		var calGridKey = $.fn.SPSTools_Calendar.BuildGridKey(options);

		calGrid.append(calGridHeader, calGridBody, calGridKey);

		var cb1 = $('<td></td>');
		cb1.append(calGrid);
		var cb2 = $('<tr></tr>');
		cb2.append(cb1);
		calBody.append(cb2);

		cal.append(calBody);

		container.append(cal);

		
		var owidth = $(".CalGrid").width();
		owidth += "px";
		//cwpx = cw + "px";
		cwpx = "994px";
		//alert("cwpx: " + cwpx + ", cellwidth: " + cellwidth);

		$("#SPSTools_Calendar").css({ border: '1px solid black', width: '994px' });

		$("#SPSTools_Calendar_TypeSelect").on("change", function () {
		    $.fn.SPSTools_Calendar.ClearEventsOnCalendar();
		    var ctype = $("#SPSTools_Calendar_TypeSelect option:selected").val();
			$.fn.SPSTools_Calendar.Initialize({
				CalType: ctype,
				categories: options.categories,
				categoryclass: options.categoryclass,
				categorycss: options.categorycss
			}, EventCollection);
		});
		
		var ItemCount = 0;

		// Get the events we need to draw on the calendar for this month. Will add this to defaults for filtering later.
		// This also returns recurring events and events that overlap the selected month in some way.

		cmlQry = "<Query><CalendarDate>" + isostart + "</CalendarDate>";
		cmlQry += "<Where><Or><Or><Or><Or><And><And><DateRangesOverlap><FieldRef Name='EventDate' /><FieldRef Name='EndDate' /><FieldRef Name='RecurrenceID' />";
		cmlQry += "<Value Type='DateTime'>" + isostart + "</Value></DateRangesOverlap><Eq><FieldRef Name='fRecurrence' /><Value Type='Text'>1</Value></Eq></And>";
		cmlQry += "<Leq><FieldRef Name='EventDate' /><Value Type='DateTime'>" + isoend + "</Value></Leq></And><And><And><Geq><FieldRef Name='EventDate' />";
		cmlQry += "<Value Type='DateTime'>" + isostart + "</Value></Geq><Leq><FieldRef Name='EndDate' /><Value Type='DateTime'>" + isoend + "</Value></Leq></And>";
		cmlQry += "<Eq><FieldRef Name='fRecurrence' /><Value Type='Text'>0</Value></Eq></And></Or><And><And><And><Geq><FieldRef Name='EventDate' />";
		cmlQry += "<Value Type='DateTime'>" + isostart + "</Value></Geq><Leq><FieldRef Name='EventDate' /><Value Type='DateTime'>" + isoend + "</Value></Leq></And><Gt>";
		cmlQry += "<FieldRef Name='EndDate' /><Value Type='DateTime'>" + isoend + "</Value></Gt></And><Eq><FieldRef Name='fRecurrence' /><Value Type='Text'>0</Value></Eq></And></Or>";
		cmlQry += "<And><And><And><Lt><FieldRef Name='EventDate' /><Value Type='DateTime'>" + isostart + "</Value></Lt><Leq><FieldRef Name='EndDate' /><Value Type='DateTime'>" + isoend + "</Value>";
		cmlQry += "</Leq></And><Gt><FieldRef Name='EndDate' /><Value Type='DateTime'>" + isostart + "</Value></Gt></And>";
		cmlQry += "<Eq><FieldRef Name='fRecurrence' /><Value Type='Text'>0</Value></Eq></And></Or>";
		cmlQry += "<And><And><Lt><FieldRef Name='EventDate' /><Value Type='DateTime'>" + isostart + "</Value></Lt><Gt><FieldRef Name='EndDate' /><Value Type='DateTime'>" + isoend + "</Value>";
		cmlQry += "</Gt></And><Eq><FieldRef Name='fRecurrence' /><Value Type='Text'>0</Value></Eq></And></Or></Where></Query>";

		cmlVfs = "<ViewFields><FieldRef Name='EventDate' /><FieldRef Name='EventDescription' /><FieldRef Name='EndDate' /><FieldRef Name='Location' /><FieldRef Name='PublishingRollupImage' /><FieldRef Name='EventType' /><FieldRef Name='Duration' /><FieldRef Name='ProductCatalogItemCategory' /><FieldRef Name='RecurrenceID' /><FieldRef Name='fRecurrence' /><FieldRef Name='RecurrenceData' /></ViewFields>";
		cmlQryOpts = "<QueryOptions><ExpandRecurrence>TRUE</ExpandRecurrence><RecurrencePatternXMLVersion>v3</RecurrencePatternXMLVersion><CalendarDate><Month /></CalendarDate><RecurrenceOrderBy>TRUE</RecurrenceOrderBy><ViewAttributes Scope='RecursiveAll' /></QueryOptions>";

		$().SPServices({
			operation: "GetListItems",
			async: false,
			webURL: options.CalendarUrl,
			listName: options.CalendarList,
			CAMLQuery: cmlQry,
			CAMLViewFields: cmlVfs,
			CAMLQueryOptions: cmlQryOpts,
			CAMLRowLimit: 0,
			completefunc: function (xData, Status) {
				var events = [];
				var settings = {
					mapping: { UniqueID: "ows_UniqueId", EventID: "ows_ID", EventType: "ows_EventType", RecurrenceData: "ows_RecurrenceData", StartDateTime: "ows_EventDate", EndDateTime: "ows_EndDate", Title: "ows_Title", Description: "ows_EventDescription", Category: "ows_ProductCatalogItemCategory", Location: "ows_Location", Image: "ows_PublishingRollupImage" }
				};
				var mapping = settings['mapping'];
				var ct = 100;
				$(xData.responseXML).SPFilterNode("z:row").each(function () {
					var etype = new String($(this).attr("ows_EventType"));
					if (etype != '1') {
						var $this = $(this);
						var event = {};
						for (var attr in mapping) {
							var column = mapping[attr];
							if (column) {
								var value = SanitizeColumnValue(column, $this.attr(column)) || "";
								event[attr] = value;
							}
						}
						if (event) { events.push(event); }
					}
					else {
						var rcdata = new String($(this).attr("ows_RecurrenceData"));
						var $this = $(this);
						var event = {};
						for (var attr in mapping) {
							var column = mapping[attr];
							if (column) {
								var value = SanitizeColumnValue(column, $this.attr(column)) || "";
								event[attr] = value;
							}
						}
						if (event) { events.push(event); }
					}
					ct += 1;
				});
				$.fn.SPSTools_Calendar.ReplaceEventCollection(options, events);
			}
		});
	}
	
	var FilterEventCollection = function() {
		if (EventCollection && EventCollection.length > 0) {
			var multi = [];
			var single = [];
			//Update and parse all the dates
			$.each(EventCollection, function(){
				var ev = this;
				this.StartDateTime = ev.StartDateTime;
				this.EndDateTime = ev.EndDateTime;				
				if (this.StartDateTime.clone().clearTime().compareTo(this.EndDateTime.clone().clearTime()) == 0) {
					single.push(this);
				} else if (this.StartDateTime.clone().clearTime().compareTo(this.EndDateTime.clone().clearTime()) == -1) {
					multi.push(this);
				}
			});
			multi.sort(EventSort);
			single.sort(EventSort);
			EventCollection = [];
			$.merge(EventCollection, multi);
			$.merge(EventCollection, single);
			//$().SPSTools_Notify({ type: 'XML', content: rprint(EventCollection) });
		}
	};

	var rprint = function (o) {
		var str = '';
		str = JSON.stringify(o, null, 4);
		return str;
	}

	var EventSort = function(a, dc) {
		return a.StartDateTime.compareTo(dc.StartDateTime);
	};
	
	var ClearBoxes = function() {
		ClearBoxEvents();
		DayCells = [];
	};
	
	var ClearBoxEvents = function() {
		for (var i = 0; i < DayCells.length; i++) {
			DayCells[i].clear();
		}
		EventObj = {};
	};
	
	$.fn.SPSTools_Calendar.SetupDates = function(sdate) {
		var options = $.extend({}, defaults);
		var today = options.CalendarStartDate;
		if(sdate == '') {
			WorkingDate = new Date(today.getFullYear(), today.getMonth(), 1);
		} else {
			WorkingDate = sdate;
			WorkingDate.setDate(1);
		}
		// Is this a month view or a week view?
		switch(options.CalType)
		{
			case "Month":
				DaysInMonth = WorkingDate.getDaysInMonth();
				FirstDayMonth = WorkingDate.clone().moveToFirstDayOfMonth();
				LastDayMonth = WorkingDate.clone().moveToLastDayOfMonth();
				CalOffset = FirstDayMonth.getDay() - options.FirstDayOfWeek;
				TotalDays = CalOffset + DaysInMonth;
				GridRows = Math.ceil(TotalDays / 7);
				TotalBoxes = GridRows * 7;
				DateRange.StartDate = FirstDayMonth.clone().addDays((-1) * CalOffset);
				DateRange.EndDate = LastDayMonth.clone().addDays(TotalBoxes - (DaysInMonth + CalOffset));
				break;

			case "GanttMonth":
				DaysInMonth = WorkingDate.getDaysInMonth();
				FirstDayMonth = WorkingDate.clone().moveToFirstDayOfMonth();
				LastDayMonth = WorkingDate.clone().moveToLastDayOfMonth();
				TotalDays = DaysInMonth;
				GridRows = 1;
				TotalBoxes = DaysInMonth + 1; // Adding 1 for event title cell
				DateRange.StartDate = FirstDayMonth;
				DateRange.EndDate = LastDayMonth;
				break;
				
			case "Week":
			
				break;
		}
	};
	
	$.fn.SPSTools_Calendar.BuildHeaders = function (options) {
		options = $.extend({}, defaults, options);
		// Create Previous Month link for later
		var prevMonth = WorkingDate.clone().addMonths(-1);
		var prevMLink = $('<div class="CalNavPrev"><input type="button" value="' + options.navLinks.p + '"/></div>').click(function () {
			options.SelectedDate = prevMonth;
			$.fn.SPSTools_Calendar.Render(options);
			return false;
		});
		//Create Next Month link for later
		var nextMonth = WorkingDate.clone().addMonths(1);
		var nextMLink = $('<div class="CalNavNext"><input type="button" value="' + options.navLinks.n + '"/></div>').click(function () {
			options.SelectedDate = nextMonth;
			$.fn.SPSTools_Calendar.Render(options);
			return false;
		});
		//Create CalType selector for later
		var oarray = ["GanttMonth", "Month", "Week", "Day"];
		var selhtml = "<div class='CalNavType'>Type: <select size='1' id='SPSTools_Calendar_TypeSelect'>";
		// Will need to get actual selection 
		for (var z = 0; z <= oarray.length - 1; z++) {
			if (options.CalType == oarray[z]) {
				selhtml += "<option selected value='" + oarray[z] + "'>" + oarray[z] + "</option>";
			}
			else {
				selhtml += "<option value='" + oarray[z] + "'>" + oarray[z] + "</option>";
			}
		}
		selhtml += "</select></div>";
		var CalTypeDiv = $(selhtml);

		// add another td element to fill out the rest of the tr?

		selhtml = $('<td class="lastTD">&nbsp;</td>');

		var ttlHdr = $('<td class="HeaderTitle"></td>');
		ttlHdr.append($('<div class="MonthName"></div>').append(Date.CultureInfo.monthNames[WorkingDate.getMonth()] + " " + WorkingDate.getFullYear()));
		var ttlRow = $('<tr class="hdrTitle"></tr>').append(ttlHdr);
		
		var navRow = $('<tr class="hdrNav"></tr>');
		var navCell = $('<td></td>');
		navCell.append(prevMLink, nextMLink, CalTypeDiv);
		navRow.append(navCell);
		var headRow = $("<thead id='CalendarHead'></thead>").css({ "height": options.HeaderHeight + "px" });
		headRow = headRow.prepend(ttlRow, navRow);
		return headRow;
	};

	$.fn.SPSTools_Calendar.BuildGridHeader = function (options) {
		options = $.extend({}, defaults, options);
		var gridHeader = $("<tr></tr>");
		switch (options.CalType) {
			case "GanttMonth":
				var dow = ["S", "M", "T", "W", "T", "F", "S"];
				cellwidth = parseInt((options.width - 200) / (TotalBoxes - 1)); // 200 is for the title cell
				cellheight = cellwidth;
				var tcw = "200px"; // This is the title cell for gantt events
				cw = 200;
				var now = new Date();
				now.clearTime();
				var titleBox = $("<td class='GridHeaderEventLabel'>Event</td>");
				titleBox.css({ "width": tcw });
				gridHeader.append(titleBox);
				for (var i = 0; i < TotalBoxes - 1; i++) {
					cw += cellwidth + 1; // + 1 for left border?
					var currentDate = DateRange.StartDate.clone().addDays(i);
					var weekday = currentDate.getDay();
					var atts = { 'id': "dayCell_" + i, 'class': "GridHeaderDateBox" + (weekday == 0 || weekday == 6 ? ' Weekend ' : ''), 'date': currentDate.toString("M/d/yyyy") };
					if (currentDate.compareTo(now) == 0) {
						atts['class'] += ' Today';
					}
					var dateDay = $('<div class="DayLink"><a>' + dow[weekday] + '</a></div>');
					var dayLink = $('<div class="DateLink"><a>' + currentDate.getDate() + '</a></div>');
					var dayCell = $("<td></td>").attr(atts).append(dateDay, dayLink);
					dayCell.css({ "width": cellwidth + "px" });
					gridHeader.append(dayCell);
				}
				break;

			case "Month":
				cw = 0;
				cellwidth = parseInt(options.width / 7);
				cellheight = cellwidth;
				for (var i = options.FirstDayOfWeek; i < options.FirstDayOfWeek + 7; i++) {
					var weekday = i % 7;
					var wordday = Date.CultureInfo.dayNames[weekday];
					// build weekdays. First and Last days have different classes
					if (i == 0) {
						gridHeader.append('<td class="GridHeaderWeekDayFirst Weekend" style="width: ' + cellwidth + 'px;"><span>' + wordday + '</span></td>');
						cw += cellwidth;
					}
					else {
						if (i == 6) {
							gridHeader.append('<td class="GridHeaderWeekDayLast Weekend" style="width: ' + cellwidth + 'px;"><span>' + wordday + '</span></td>');
						}
						else {
							gridHeader.append('<td class="GridHeaderWeekDay" style="width: ' + cellwidth + 'px;"><span>' + wordday + '</span></td>');
						}
						cw += cellwidth + 1; // + 1 for left border?
					}
				}
				break;
		}
		gridHeader = $("<thead id='GridHeader'></thead>").append(gridHeader);
		return gridHeader;
	}

	$.fn.SPSTools_Calendar.BuildGridBody = function (options) {
		options = $.extend({}, defaults, options);
		var gridBody = $("<tbody id='GridBody'></tbody>");
		switch (options.CalType) {
			case "GanttMonth":
				// Body fully built in event loop so just need GridBody
				break;

			case "Month":
				var today = options.CalendarStartDate;
				var now = new Date();
				now.clearTime();
				var ContainerHeight = 480;
				var RowHeight = parseInt(ContainerHeight / GridRows);
				RowHeight -= 1;
				var row = null;
				for (var i = 0; i < TotalBoxes; i++) {
					var currentDate = DateRange.StartDate.clone().addDays(i);
					if (i % 7 == 0 || i == 0) {
						row = $("<tr class='GridWeekRow'></tr>");
						row.css({ "height": cellheight + "px" });
						gridBody.append(row);
					}
					var weekday = (options.FirstDayOfWeek + i) % 7;
					var atts = { 'id': "dayCell_" + i, 'class': "DayCell" + (weekday == 0 || weekday == 6 ? ' Weekend ' : ''), 'date': currentDate.toString("M/d/yyyy") };
					// Are dates outside of month range?
					if (currentDate.compareTo(FirstDayMonth) == -1 || currentDate.compareTo(LastDayMonth) == 1) {
						atts['class'] += ' Inactive';
					}
					// Is current date = today?
					if (currentDate.compareTo(now) == 0) {
						atts['class'] += ' Today';
					}
					// Days
					var dayLink = $('<div class="DateLabel"><a>' + currentDate.getDate() + '</a></div>');
					dayLink.css({ "width": cellwidth + "px" });
					dayLink.bind('click', { Date: currentDate.clone() }, options.OnDayLinkClick);
					var dayCell = '';
					if (i % 7 == 0) {
						atts['class'] += ' GridCellWeekDayFirst';
						dayCell = $("<td></td>").attr(atts).append(dayLink);
					} else {
						if (i % 7 == 6) {
							atts['class'] += ' GridCellWeekDayLast';
							dayCell = $("<td></td>").attr(atts).append(dayLink);
						}
						else {
							atts['class'] += ' GridCellWeekDay';
							dayCell = $("<td></td>").attr(atts).append(dayLink);
						}
					}
					dayCell.css({ "height": cellheight + "px", "width": cellwidth + "px" });
					dayCell.bind('dblclick', { Date: currentDate.clone() }, options.OnDayCellDblClick);
					dayCell.bind('click', { Date: currentDate.clone() }, options.OnDayCellClick);
					DayCells.push(new DayCell(i, currentDate, dayCell, dayLink));
					row.append(dayCell);
				}
				break;
		}
		return gridBody;
	}

	$.fn.SPSTools_Calendar.BuildGridKey = function (options) {
		options = $.extend({}, defaults, options);
		var gridKey = $("<tr style='height:25px;'></tr>");
		var keyBox = $("<td class='GridKeyEventLabel' colspan='1'>Key</td>");
		var keywidth;
		if (cellwidth <= 30) {
			keywidth = 3;
		}
		if (cellwidth > 30) {
			keywidth = 2;
		}
		if (cellwidth > 90) {
			keywidth = 1;
		}
		// Find way to better calculate how to do the key area. For now just use colspan
		
		gridKey.append(keyBox);
		var styles = "<style type='text/css'>";
		for (var i = 0; i < options.categories.length; i++) {
			var catBox = $("<td colspan='" + keywidth + "'></td>");
			catBox.html(options.categories[i]);
			var tcss = options.categorycss[i];
			styles += "." + options.categoryclass[i] + ", ." + options.categoryclass[i] + " a { " + options.categorycss[i] + " }"
			if (i == options.categories.length - 1) {
				tcss = tcss + " text-align: center; height: 14px; padding: 4px 0px; border-left: 1px solid black; border-right: 1px solid black;";
			}
			else {
				tcss = tcss + " text-align: center; height: 14px; padding: 4px 0px; border-left: 1px solid black;";
			}
			catBox.attr("style", tcss);
			gridKey.append(catBox);
		}
		styles += "</style>";
		$("head").append(styles);
		gridKey = $("<tfoot id='GridKey'></tfoot>").append(gridKey);
		return gridKey;
	}
	
	$.fn.SPSTools_Calendar.DrawEventsOnCalendar = function(options) {
		options = $.extend({}, defaults, options);
		FilterEventCollection();
		ClearBoxEvents();
		if (EventCollection && EventCollection.length > 0) {
			var container = $("#GridBody");
			$.each(EventCollection, function (idx) {
				switch (options.CalType) {
					case "Month":
						var ev = this;
						var tempStartDT = ev.StartDateTime.clone().clearTime();
						var tempEndDT = ev.EndDateTime.clone().clearTime();
						var startI = new TimeSpan(tempStartDT.clearTime() - DateRange.StartDate.clearTime()).days;
						var endI = new TimeSpan(tempEndDT.clearTime() - DateRange.StartDate.clearTime()).days;
						var istart = (startI < 0) ? 0 : startI;
						var iend = (endI > DayCells.length - 1) ? DayCells.length - 1 : endI;
						for (var i = istart; i <= iend; i++) {
							var dc = DayCells[i];
							var startCellCompare = tempStartDT.compareTo(dc.date);
							var endCellCompare = tempEndDT.compareTo(dc.date);
							var continueEvent = ((i !== 0 && startCellCompare === -1 && endCellCompare >= 0 && dc.weekNumber !== DayCells[i - 1].weekNumber) || (i === 0 && startCellCompare === -1));
							var toManyEvents = (startCellCompare === 0 || (i === 0 && startCellCompare === -1) || continueEvent || (startCellCompare === -1 && endCellCompare >= 0)) && dc.vOffset >= (dc.getCellBox().height() - dc.getLabelHeight() - 32);
							if (toManyEvents) {
								if (!dc.isTooManySet) {
									var moreDiv = $('<div class="MoreEvents" id="ME_' + i + '">' + options.navLinks.showMore + '</div>');
									var pos = dc.getCellPosition();
									var index = i;
									moreDiv.css({
										"top": (pos.top + (dc.getCellBox().height() - dc.getLabelHeight())),
										"left": pos.left,
										"width": (dc.getCellWidth()),
										"position": "absolute"
									});
									moreDiv.click(function (e) { ShowMoreClick(e, index); });
									EventObj[moreDiv.attr("id")] = moreDiv;
									dc.isTooManySet = true;
								} //else update the +more to show??
								dc.events.push(ev);
							}
							if (startCellCompare === 0 || (i === 0 && startCellCompare === -1) || continueEvent) {
								var eventdiv = BuildEventDiv(ev, dc.weekNumber);
								var pos = dc.getCellPosition();
								var dwidth;
								if (continueEvent) {
									dwidth = 0;
								} else {
									dwidth = parseInt(dc.getCellWidth());
								}
								eventdiv.css({
									"top": (pos.top + dc.getLabelHeight() + dc.vOffset),
									"left": pos.left,
									"width": dwidth,
									"position": "absolute"
								});
								dc.vOffset += 19;
								//if (continueEvent) {
								//    eventdiv.prepend($('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-w"));
								//    var e = EventObj['Event_' + ev.EventID + '_' + (dc.weekNumber - 1)];
								//    if (e) { e.prepend($('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-e")); }
								//}
								EventObj[eventdiv.attr("id")] = eventdiv;
								eventdiv.addClass(ev.Category);
								dc.events.push(ev);
							}
							if (startCellCompare === -1 && endCellCompare >= 0) {
								var e = EventObj['Event_' + ev.EventID + '_' + dc.weekNumber];
								if (e) {
									var dwidth = e.css("width");
									dwidth = parseInt(dwidth) + parseInt(dc.getCellWidth() + 1);
									e.css({ "width": dwidth });
									dc.vOffset += 19;
									dc.events.push(ev);
								}
							}
							if (startCellCompare === -1 && endCellCompare === -1) {
								var eventdiv = BuildEventDiv(ev, dc.weekNumber);
								var pos = dc.getCellPosition();
								eventdiv.css({
									"top": (pos.top + dc.getLabelHeight() + dc.vOffset),
									"left": pos.left,
									"width": dc.getCellWidth(),
									"position": "absolute"
								});
								dc.vOffset += 19;
								//if (continueEvent) {
								//    eventdiv.prepend($('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-w"));
								//    var e = EventObj['Event_' + ev.EventID + '_' + (dc.weekNumber - 1)];
								//    if (e) { e.prepend($('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-e")); }
								//}
								EventObj[eventdiv.attr("id")] = eventdiv;
								eventdiv.addClass(ev.Category);
								dc.events.push(ev);
							}
							//end of month continue
							if (i === iend && endCellCompare > 0) {
								var e = EventObj['Event_' + ev.EventID + '_' + dc.weekNumber];
								//if (e) { e.prepend($('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-e")); }
								dc.events.push(ev);
							}
						}
						for (var o in EventObj) {
							EventObj[o].hide();
							container.append(EventObj[o]);
							EventObj[o].show();
						}
						break;

					case "GanttMonth":
						var tcw = "200px";
						var tcow = 200;
						var ev = this;
						var tempStartDT = ev.StartDateTime.clone().clearTime();
						var tempEndDT = ev.EndDateTime.clone().clearTime();
						var startI = new TimeSpan(tempStartDT.clearTime() - DateRange.StartDate.clearTime()).days;
						var endI = new TimeSpan(tempEndDT.clearTime() - DateRange.StartDate.clearTime()).days;
						var istart = (startI < 0) ? 0 : startI;
						var iend = endI > TotalBoxes - 2 ? TotalBoxes - 2 : endI;
						//alert("startI: " + startI + ", endI: " + endI + ", TotalBoxes - 1: " + TotalBoxes - 1);

						// Need to create a row with each cell first
						var row;
						var multi;
						var boxDiv, eventDiv;

						// Repeating Events exist as multiple single events. Should still only draw 1 line for these events so need to validate this

						var rowid = "row" + new String(ev.UniqueID);

						for (var i = 0; i < TotalBoxes; i++) {
							if (i === 0) {
								if ($("#" + rowid).length > 0) {
									// The row does exist so use it!
									row = $("#" + rowid);
								}
								else {
									row = $('<tr style="height: ' + cellheight + 'px;"></tr>');
									row.attr("id", rowid);
									var titleDiv = $('<td style="text-indent: 5px; height: ' + cellheight + 'px; width: ' + tcw + '; border-bottom: 1px solid black; ">' + ev.Title + '</div>');
									row.append(titleDiv);
								}
							}
							else {
								if (ev.EventType === "0") {
									boxDiv = $('<td></td>');
									boxDiv.attr("class", "GanttCell");
									boxDiv.attr("id", "row" + idx + "box" + i);
									boxDiv.css({ "height": cellheight + "px", "width": cellwidth + "px" });
									row.append(boxDiv);
								}
								if (ev.EventType === "5") {
									if ($("#" + rowid).length > 0) {
										// This row already exists so no need to redraw it
									}
									else {
										boxDiv = $('<td></td>');
										boxDiv.attr("class", "GanttCell");
										boxDiv.attr("id", rowid + "box" + i);
										boxDiv.css({ "height": cellheight + "px", "width": cellwidth + "px" });
										row.append(boxDiv);
									}
								}
							}
						}
						container.append(row);

						for (var i = 0; i < TotalBoxes; i++) {
							if (i === 0) { }
							else {
								if (ev.EventType === "0") {
									if ($("#event_" + ev.EventID).length > 0) { }
									else {
										var boxid = "row" + idx + "box" + i;
										boxDiv = $("#" + boxid);
										eventDiv = $('<div></div>');
										if (i >= istart + 1 && iend > istart) {
											// Need to get location to add new div.
											var pos = boxDiv.position();
											var posTop = pos.top;
											var posLeft = pos.left + 1;
											//alert("posTop: " + posTop + ", posLeft" + posLeft);
											eventDiv.attr("id", "event_" + ev.EventID);
											eventDiv.attr("class", ev.Category);
											var diff = (iend - istart) + 1; // ensures that it includes all of the cells due to counting the starting cell
											//alert("istart: " + istart + ", iend: " + iend + ", i: " + i + ", diff: " + diff);
											var adjwidth = (diff * (cellwidth + 1)) - 1; //ensures that it fits inside the cells 
											adjwidth = adjwidth + "px";
											var adjleft = tcow + (i * cellwidth);
											adjleft = adjleft + "px";
											eventDiv.css({ "height": cellheight + "px", "Width": adjwidth, "top": posTop + "px", "left": posLeft + "px", "position": "absolute" });
											eventDiv.on({ mouseenter: function (e) { OnEventDivHoverIn(e, ev); } });
											eventDiv.on({ mouseleave: function () { OnEventDivHoverOut(); } });
											//container.append(eventDiv);
											boxDiv.append(eventDiv);
										}
										else if (i >= istart + 1 && i <= iend + 1) {
											// Single Day Event so just add to the boxDiv
											eventDiv.attr("id", "event_" + ev.EventID);
											eventDiv.attr("class", ev.Category);
											eventDiv.css({ "height": cellheight + "px", "Width": cellwidth + "px" });
											eventDiv.on({ mouseenter: function (e) { OnEventDivHoverIn(e, ev); } });
											eventDiv.on({ mouseleave: function () { OnEventDivHoverOut(); } });
											boxDiv.append(eventDiv);
										}
									}
								}
								if (ev.EventType === "5") {
									if (i >= istart + 1 && i <= iend + 1) {
										// Recurring Event so just add to the boxDiv
										var boxid = rowid + "box" + i;
										boxDiv = $("#" + boxid);
										eventDiv = $('<div></div>');
										eventDiv.attr("id", "event_" + ev.EventID);
										eventDiv.attr("class", ev.Category);
										eventDiv.css({ "height": cellheight + "px", "Width": cellwidth + "px" });
										eventDiv.on({ mouseenter: function (e) { OnEventDivHoverIn(e, ev); } });
										eventDiv.on({ mouseleave: function () { OnEventDivHoverOut(); } });
										boxDiv.append(eventDiv);
									}
								}
							}
						}
						break;

				}
			});

			switch (options.CalType) {
				case "Month":
					for (var o in EventObj) {
						EventObj[o].hide();
						container.append(EventObj[o]);
						EventObj[o].show();
					}
					break;

				case "GanttMonth":

					break;
			}
		}
	}

	var BuildEventDiv = function (ev, weekNumber) {
		var opt = $.extend({}, defaults);
		var eventdiv = $('<div class="Event" id="Event_' + ev.EventID + '_' + weekNumber + '" eventid="' + ev.EventID + '"></div>');
		if (ev.Category) { eventdiv.addClass(ev.Category) }
		//eventdiv.bind('click', { Event: ev }, opt.OnEventDivClick);
		eventdiv.on({ mouseenter: function (e) { OnEventDivHoverIn(e, ev); } });
		eventdiv.on({ mouseleave: function () { OnEventDivHoverOut(); } });
		var link;
		if (ev.URL && ev.URL.length > 0) {
			link = $('<a href="' + ev.URL + '">' + ev.Title + '</a>');
		} else {
			link = $('<a>' + ev.Title + '</a>');
		}
		//link.bind('click', { Event: ev }, opt.OnEventLinkClick);
		eventdiv.append(link);
		return eventdiv;
	}
	
	var ShowMoreClick = function(e, boxIndex) {
		var box = DayCells[boxIndex];
		opt.OnShowMoreClick.call(this, box.events);
		e.stopPropagation();
	}
		
	$.fn.SPSTools_Calendar.ClearEventsOnCalendar = function() {
		ClearBoxEvents();
		$(".Event", $("#SPSTools_Calendar")).remove();
		$(".MoreEvents", $("#SPSTools_Calendar")).remove();
	}
	
	$.fn.SPSTools_Calendar.AddEvents = function(eventCollection) {
		if(eventCollection) {
			if(eventCollection.length > 0) {
				$.merge(EventCollection, eventCollection);
			} else {
				EventCollection.push(eventCollection);
			}
			$().SPSTools_Calendar.ClearEventsOnCalendar();
			$().SPSTools_Calendar.DrawEventsOnCalendar();
		}
	}
	
	$.fn.SPSTools_Calendar.ReplaceEventCollection = function(options, eventCollection) {
		if(eventCollection) {
			EventCollection = [];
			EventCollection = eventCollection;
		}
		else {
			alert("Error In ReplaceEventCollection");
		}
		$().SPSTools_Calendar.ClearEventsOnCalendar();
		$().SPSTools_Calendar.DrawEventsOnCalendar(options);
	}	
	
	$.fn.SPSTools_Calendar.ChangeMonth = function(dateIn) {
		var returned = opt.OnMonthChanging.call(this, dateIn);
		if (!returned) {
			$().SPSTools_Calendar.DrawCalendar(dateIn);
		}
	}
	
	$.fn.SPSTools_Calendar.DrawCalendar = function(dateIn, options) {
		$().SPSTools_Calendar({
			operation: 'Render',
			SelectedDate: dateIn 
		});
	}

	function OnEventDivHoverIn(e, evnt) {
	    var shtml = "";
	    shtml += "<div class='container-fluid'>";
	    shtml += "<div class='row'><div class='col-xs-12 hoverHeader " + evnt.Category + "'>Event Information</div></div>";
	    shtml += "<div class='row'><div class='col-xs-3 hoverLabel'>Title</div><div class='col-xs-9 hoverText'>" + evnt.Title + "</div></div>";
	    shtml += "<div class='row'><div class='col-xs-3 hoverLabel'>Start</div><div class='col-xs-9 hoverText'>" + evnt.StartDateTime + "</div></div>";
	    shtml += "<div class='row'><div class='col-xs-3 hoverLabel'>End</div><div class='col-xs-9 hoverText'>" + evnt.EndDateTime + "</div></div>";
	    shtml += "<div class='row'><div class='col-xs-3 hoverLabel'>Description</div><div class='col-xs-9 hoverText'>" + evnt.Description + "</div></div>";
	    shtml += "<div class='row'><div class='col-xs-3 hoverLabel'>Location</div><div class='col-xs-9 hoverText'>" + evnt.Location + "</div></div>";
	    shtml += "</div>";
		$("#SPSTools_Calendar_Hover").html("").append(shtml);
		var ph = $("#SPSTools_Calendar_Hover").height();
		var pw = $("#SPSTools_Calendar_Hover").width();
		var leftv = e.pageX - (pw / 2) + "px";
		var topv = e.pageY - (ph / 2) - 100 + "px";
		//$("#SPSTools_Calendar_Hover").css({ border: '2px #000000 solid', left: leftv, top: topv }).show();
		$("#SPSTools_Calendar_Hover").css({ border: '2px #000000 solid', position: 'relative', left: 0, bottom: 0 }).show();
	}

	function OnEventDivHoverOut() {
		$("#SPSTools_Calendar_Hover").hide();
	}
	
	var SanitizeColumnValue = function (column, value) {
		if (!value || value === "") return null;
		// Multiple, non-lookup values
		if (value.match(/^;#/)) {
			value = value.replace(/^;#/, "").replace(/;#$/, "").split(";#");
			return value;
		}
		// Lookup value, possibly multiple
		if (value.match(/;#/)) {
			if (value.split(";#").length > 2) {
				// Multiple values
				var tmpPropertyValueSplit = value.split(";#");
				value = [];
				propertyIndex = [];
				$.each(tmpPropertyValueSplit, function (index, val) {
					if (index % 2 == 0) {
						// Even index => lookup index
						propertyIndex.push(val);
					} else {
						// Odd index => lookup value
						value.push(val);
					}
				});
				return value;
			}
			// Single value
			// Possibly a Calculated field type;#value pair
			propertyIndex = value.split(";#")[0];
			value = value.split(";#")[1];
		}
		// Single, non-lookup value
		switch (column) {
			case "ows_EventDescription":
				value = value.replace("<div>", "");
				value = value.replace("</div>", "");
				break;

			case "ows_EventDate":
				value = value.replace(" ", "T");
				value = GetJSONDate(value);
				break;

			case "ows_EndDate":
				value = value.replace(" ", "T");
				value = GetJSONDate(value);
				break;

			case "ows_UniqueId":
				value = value.replace(/-/g, "");
				value = value.replace(/{/g, "");
				value = value.replace(/}/g, "");
				//alert(value);
				break;

			case "ows_ProductCatalogItemCategory":
				value = value.replace(/ /g, "");
				break;
		}
		return value;
	}
								
	function DayCell(id, boxDate, cell, label) {
		this.id = id;
		this.date = boxDate.clearTime();
		this.cell = cell;
		this.label = label;
		this.weekNumber = Math.floor(id / 7);
		this.events= [];
		this.isTooManySet = false;
		this.vOffset = 0;
		this.width = cell.width();
		
		this.echo = function() {
			alert("Date: " + this.date + " WeekNumber: " + this.weekNumber + " ID: " + this.id);
		}
		
		this.clear = function() {
			this.events = [];
			this.isTooManySet = false;
			this.vOffset = 0;
		}
		
		this.getCellPosition = function() {
			if (this.cell) { 
				return this.cell.position();
			}
			return;
		}
		
		this.getCellBox = function() {
			if (this.cell) { 
				return this.cell;
			}
			return;
		}

		this.getCellWidth = function () {
			return this.width;
		}
		
		this.getLabelWidth = function() {
			if (this.label) {
				return this.label.innerWidth();
			}
			return;
		}
		
		this.getLabelHeight = function() {
			if (this.label) { 
				return this.label.height();
			}
			return;
		}
		
		this.getDate = function() {
			return this.date;
		}
	}
	
	function getISODate(date) {
		if (date != null) {
			d = new Date(date);
		}
		else {
			d = new Date();
		}
		var s = "";
		s += d.getFullYear() + "-";
		s += d.getMonth() + 1 + "-";
		s += d.getDate();
		s += "T" + d.getHours() + ":";
		s += d.getMinutes() + ":";
		s += d.getSeconds() + "Z";
		return s;
	}

	var GetJSONDate = function (dateStr) {
		//check conditions for different types of accepted dates
		var k;
		if (typeof dateStr == "string") {
			var isoReg = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
			if (k = dateStr.match(isoReg)) {
				return new Date(k[1], k[2] - 1, k[3], k[4], k[5], k[6]);
			}
		}
	};

	// Escape string characters
	function escapeHTML(s) {
		return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function trimtotag(text, tagName) {
		var sTag = "<" + tagName + ">";
		var eTag = "</" + tagName + ">";
		var sTagIdx = text.indexOf(sTag);
		var eTagIdx = text.indexOf(eTag, sTagIdx + sTag.length);
		if ((sTagIdx >= 0) && (eTagIdx > sTagIdx))
			return text.substring(sTagIdx + sTag.length, eTagIdx);
		return null;
	}
})(jQuery);