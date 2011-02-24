/*
HttpFox - An HTTP analyzer addon for Firefox
Copyright (C) 2008 Martin Theimer
	
This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
	
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
	
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
*/

// HttpFoxController
function HttpFoxController()
{
	this.init();
}
HttpFoxController.prototype =
{
	HttpFoxService: null,

	StringBundleService: null,

	StringBundle: null,

	RequestTree: null,

	SelectedRequestDetailsTab: null,

	IntervalChecker: null,

	QuickFilterText: "",

	FilteredRequests: null,

	WindowMode: null,

	PostDataViewMode: 0,

	ContentViewMode: 0,

	XMLPrettyPrintXSLT: null,

	// constructor
	init: function ()
	{
		this.FilteredRequests = new Array();

		this.HttpFoxService = Components.classes["@decoded.net/httpfox;1"].getService().wrappedJSObject;

		this.StringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);

		this.stringBundle = this.StringBundleService.createBundle("chrome://httpfox/locale/HttpFox.properties");

		if (!this.stringBundle || !this.stringBundle.getSimpleEnumeration().hasMoreElements()) throw "Could not load localized strings!";

		this.loadXMLPrettyPrintXSL();
	},

	initGraphics: function (wmode)
	{
		this.WindowMode = wmode;
		this.clearRequestTree();
		this.clearRequestInfoTabs();
		this.selectionChange_ContentDisplayTypePretty();
		this.selectionChange_PostDataDisplayTypePretty();
		if (!this.HttpFoxService.Preferences.ShowDebugTab)
		{
			document.getElementById("hf_DebugTabHeader").collapsed = "true";
			document.getElementById("hf_DebugTabHeader").disabled = "true";
		}

		this.HttpFoxService.addController(this);
		this.initFilteredRequests(this.HttpFoxService.Requests);
		if (this.HttpFoxService.IsWatching)
		{
			this.disableButton_startWatching();
		}
		this.RequestTree.setCurrentToNewest();

		if (this.WindowMode)
		{
			this.HttpFoxService.HttpFoxWindow = this;
			document.getElementById("hf_TopBarButton_Detach").collapsed = true;
			document.getElementById("hf_TopBarButton_Detach").disabled = true;
		}

	},

	loadXMLPrettyPrintXSL: function ()
	{
		var xslDoc = document.implementation.createDocument("", "", null);
		xslDoc.async = false;

		// default xsl from firefox
		//xslDoc.load("chrome://global/content/xml/XMLPrettyPrint.xsl");
		var test = xslDoc.load("chrome://httpfox/content/XMLPrettyPrint.xsl");

		var processor = new XSLTProcessor();
		processor.importStylesheet(xslDoc);
		this.XMLPrettyPrintXSLT = processor;
	},

	cmd_hf_showAbout: function ()
	{
		alert("HttpFox");
	},

	//C BUTTON
	onClickStatusIcon: function (event)
	{
		if (event.button != 0)
		{
			return;
		}
		else
		{
			this.cmd_hf_togglePanel();
		}
	},

	cmd_hf_close: function ()
	{
		if (this.WindowMode)
		{
			// close button in detached window
			window.close();
		}
		else
		{
			this.cmd_hf_togglePanel();
		}
	},

	//G
	cmd_hf_togglePanel: function ()
	{
		var HttpFoxPanel = document.getElementById("hf_PanelNormal");
		var HttpFoxPanelSplitter = document.getElementById("hf_PanelSplitter");

		// if already opened detached, switch to opened window
		if (this.switchToDetachedWindowIfOpened())
		{
			return;
		}

		// if always open detached, open detached
		if (this.HttpFoxService.Preferences.AlwaysOpenDetached)
		{
			this.cmd_hf_detach();

			return;
		}

		this.togglePanel();
	},

	//C INPUT
	cmd_hf_quickFilterChanged: function ()
	{
		var sb = document.getElementById("hf_QuickFilterBox");
		this.QuickFilterText = sb.value;
		this.applyFilter();
	},

	setFocus: function ()
	{
		window.focus();
	},

	//CG
	applyFilter: function ()
	{
		this.FilteredRequests = new Array();
		for (var i = 0; i < this.HttpFoxService.Requests.length; i++)
		{
			if (this.HttpFoxService.Requests[i].Url.indexOf(this.QuickFilterText) != -1)
			{
				// filter matched
				this.FilteredRequests.push(this.HttpFoxService.Requests[i]);
			}
		}

		this.clearRequestTree();
		this.clearRequestInfoTabs();
	},

	isAutoScroll: function ()
	{
		return document.getElementById("hf_AutoScrollCheckbox").checked;
	},

	filterRequest: function (parameterArray)
	{
		var request = parameterArray["p1"];

		if (request.Url.indexOf(this.QuickFilterText) != -1)
		{
			this.FilteredRequests.push(request);

			this.redrawRequestTreePlusOne();
		}
	},

	initFilteredRequests: function (requests)
	{
		for (var r in requests)
		{
			if (requests[r].Url.indexOf(this.QuickFilterText) != -1)
			{
				this.FilteredRequests.push(requests[r]);
				this.redrawRequestTreePlusOne();
			}
		}
	},

	cmd_hf_toggleWatching: function ()
	{
		if (this.HttpFoxService.IsWatching)
		{
			this.cmd_hf_stopWatching();
		}
		else
		{
			this.cmd_hf_startWatching();
		}
	},

	//C BUTTON (on all controllers)
	cmd_hf_startWatching: function ()
	{
		if (!this.HttpFoxService.IsWatching)
		{
			this.HttpFoxService.startWatching();
		}

		this.HttpFoxService.callControllerMethod("disableButton_startWatching");
	},

	disableButton_startWatching: function ()
	{
		document.getElementById("cmd_hf_startWatching").setAttribute('disabled', 'true');
		document.getElementById("cmd_hf_stopWatching").removeAttribute('disabled');
	},

	//C BUTTON (on all controllers)
	cmd_hf_stopWatching: function ()
	{
		if (this.HttpFoxService.IsWatching)
		{
			this.HttpFoxService.stopWatching();
		}

		this.HttpFoxService.callControllerMethod("disableButton_stopWatching");
	},

	disableButton_stopWatching: function ()
	{
		document.getElementById("cmd_hf_stopWatching").setAttribute('disabled', 'true');
		document.getElementById("cmd_hf_startWatching").removeAttribute('disabled');
	},

	//C BUTTON (on all controllers)
	cmd_hf_clear: function ()
	{
		this.HttpFoxService.clearRequests();

		this.HttpFoxService.callControllerMethod("clear");
	},

	cmd_hf_detach: function ()
	{
		// switch to window if opened
		if (this.switchToDetachedWindowIfOpened())
		{
			return;
		}

		// if not, open new one
		this.OpenInWindow();

		// close panel
		this.closePanel();

		// command checked
		document.getElementById("cmd_hf_togglePanel").setAttribute("checked", true);
	},

	switchToDetachedWindowIfOpened: function ()
	{
		var HttpFoxPanel = document.getElementById("hf_PanelNormal");
		var HttpFoxPanelSplitter = document.getElementById("hf_PanelSplitter");

		// if already opened detached, switch to opened window
		if (this.HttpFoxService.HttpFoxWindow)
		{
			if (!HttpFoxPanel.collapsed)
			{
				// close open panel
				HttpFoxPanelSplitter.collapsed = HttpFoxPanel.collapsed = true;
			}

			// window already open. switch to that
			this.HttpFoxService.HttpFoxWindow.setFocus();

			// command checked
			document.getElementById("cmd_hf_togglePanel").setAttribute("checked", true);

			return true;
		}

		return false;
	},

	closePanel: function ()
	{
		var HttpFoxPanel = document.getElementById("hf_PanelNormal");
		var HttpFoxPanelSplitter = document.getElementById("hf_PanelSplitter");
		HttpFoxPanelSplitter.collapsed = HttpFoxPanel.collapsed = true;
	},

	windowIsClosed: function ()
	{
		// command checked
		document.getElementById("cmd_hf_togglePanel").setAttribute("checked", false);
	},

	togglePanel: function ()
	{
		var HttpFoxPanel = document.getElementById("hf_PanelNormal");
		var HttpFoxPanelSplitter = document.getElementById("hf_PanelSplitter");

		// normal panel toggle
		HttpFoxPanelSplitter.collapsed = HttpFoxPanel.collapsed = (HttpFoxPanel.collapsed) ? false : true;

		// command checked
		document.getElementById("cmd_hf_togglePanel").setAttribute("checked", !HttpFoxPanelSplitter.collapsed);
	},

	clear: function ()
	{
		this.FilteredRequests = new Array();

		this.clearRequestTree();
		this.clearRequestInfoTabs();
	},

	//G
	clearRequestTree: function ()
	{
		var treeElement = document.getElementById("hf_RequestTree");
		if (treeElement)
		{
			this.RequestTree = new HttpFoxTree(treeElement, this);
		}
	},

	//G
	clearRequestInfoTabs: function ()
	{
		// clear headers
		this.clearTreeEntries("hf_RequestHeadersChildren");
		this.clearTreeEntries("hf_ResponseHeadersChildren");

		// clear cookies
		this.clearTreeEntries("hf_CookiesSentChildren");
		this.clearTreeEntries("hf_CookiesReceivedChildren");

		// clear cache info
		//this.clearTreeEntries("hf_CacheInfoChildren");

		// clear querystring
		this.clearTreeEntries("hf_QueryStringChildren");

		// clear postdata
		this.clearTreeEntries("hf_PostDataChildren");
		document.getElementById("hf_PostDataRawOutput").value = "";
		document.getElementById("hf_PostDataPretty").contentDocument.body.innerHTML = "";

		// clear content
		document.getElementById("hf_RawContentOutput").value = "";
		document.getElementById("hf_PrettyContentOutput").contentDocument.body.innerHTML = "";

		// clear debug
		var debugPanel = document.getElementById("hf_DebugOutput");
		debugPanel.contentDocument.body.innerHTML = "";
	},

	//G
	redrawRequestTreePlusOne: function ()
	{
		this.RequestTree.invalidate();
		var count = this.RequestTree.rowCount;
		this.RequestTree.rowCountChanged(count, 1);
	},

	//G
	redrawRequestTree: function ()
	{
		this.RequestTree.invalidate();
	},

	//G
	redrawRequestTreeRow: function (index)
	{
		if (typeof (index) == "object")
		{
			index = index["p1"];
		}

		if (this.RequestTree.TreeElement.currentIndex == index)
		{
			this.redrawRequestDetails();
		}

		this.RequestTree.invalidateRow(index);
	},

	redrawRequestDetails: function ()
	{
		this.selectionChange_RequestTree();
	},

	selectionChange_PostDataDisplayTypePretty: function ()
	{
		if (document.getElementById("hf_PostDataRadioPretty").disabled)
		{
			return;
		}

		this.PostDataViewMode = 0;
		document.getElementById("hf_PostDataPrettyBox").collapsed = false;
		document.getElementById("hf_PostDataRawBox").collapsed = true;
	},

	selectionChange_PostDataDisplayTypeRaw: function ()
	{
		if (document.getElementById("hf_PostDataRadioPretty").disabled)
		{
			return;
		}

		this.PostDataViewMode = 1;
		document.getElementById("hf_PostDataPrettyBox").collapsed = true;
		document.getElementById("hf_PostDataRawBox").collapsed = false;
	},

	selectionChange_ContentDisplayTypePretty: function ()
	{
		if (document.getElementById("hf_ContentRadioPretty").disabled)
		{
			return;
		}

		this.ContentViewMode = 0;
		document.getElementById("hf_PrettyContentOutput").collapsed = false;
		document.getElementById("hf_RawContentOutput").collapsed = true;
	},

	selectionChange_ContentDisplayTypeRaw: function ()
	{
		if (document.getElementById("hf_ContentRadioPretty").disabled)
		{
			return;
		}

		this.ContentViewMode = 1;
		document.getElementById("hf_PrettyContentOutput").collapsed = true;
		document.getElementById("hf_RawContentOutput").collapsed = false;
	},

	disableContentDisplayTypePrettyRadio: function ()
	{
		document.getElementById("hf_ContentRadioGroup").selectedIndex = 1;
		document.getElementById("hf_ContentRadioPretty").disabled = true;
		document.getElementById("hf_ContentRadioGroup").disabled = true;
		document.getElementById("hf_PrettyContentOutput").collapsed = true;
		document.getElementById("hf_RawContentOutput").collapsed = false;
	},

	enableContentDisplayTypePrettyRadio: function ()
	{
		document.getElementById("hf_ContentRadioGroup").selectedIndex = this.ContentViewMode;
		document.getElementById("hf_ContentRadioPretty").disabled = false;
		document.getElementById("hf_ContentRadioGroup").disabled = false;
		if (this.ContentViewMode == 0)
		{
			this.selectionChange_ContentDisplayTypePretty();
		}
		else
		{
			this.selectionChange_ContentDisplayTypeRaw();
		}
	},

	disablePostDataDisplayTypePrettyRadio: function ()
	{
		document.getElementById("hf_PostDataRadioGroup").selectedIndex = 1;
		document.getElementById("hf_PostDataRadioPretty").disabled = true;
		document.getElementById("hf_PostDataRadioGroup").disabled = true;
		document.getElementById("hf_PostDataPrettyBox").collapsed = true;
		document.getElementById("hf_PostDataRawBox").collapsed = false;
	},

	enablePostDataDisplayTypePrettyRadio: function ()
	{
		document.getElementById("hf_PostDataRadioGroup").selectedIndex = this.PostDataViewMode;
		document.getElementById("hf_PostDataRadioPretty").disabled = false;
		document.getElementById("hf_PostDataRadioGroup").disabled = false;
		if (this.PostDataViewMode == 0)
		{
			this.selectionChange_PostDataDisplayTypePretty();
		}
		else
		{
			this.selectionChange_PostDataDisplayTypeRaw();
		}
	},

	//G TABCLICK
	selectionChange_RequestDetails: function ()
	{
		try
		{
			this.SelectedRequestDetailsTab = document.getElementById("hf_RequestDetailsTabs").selectedIndex;

			if (this.isSelectedTab_Debug() && !this.HttpFoxService.Preferences.ShowDebugTab)
			{
				document.getElementById("hf_RequestDetailsTabs").selectedIndex = 0;
			}

			var contentPanel = document.getElementById("hf_RawContentOutput");
			var currentRequest = this.RequestTree.getCurrent();
			if (currentRequest && this.isSelectedTab_Content())
			{
				if (currentRequest.isContentAvailable())
				{
					// async
					this.showRawContentLoading();
					currentRequest.startGetRawContent(this);
				}
				else
				{
					this.clearContentDisplay();
					this.showRawContentNotAvailable();
				}
				//if (currentRequest.getCachedResponse()) {
				//	contentPanel.value = currentRequest.getRawContent();
				//}
				//else {
				//	contentPanel.value = "BUSY / PROBLEM";
				//}
				//contentPanel.value = currentRequest.getRawContent();
				//contentPanel.value = currentRequest.getCachedResponse();
			}
			else
			{
				contentPanel.value = "";
			}

			var debugPanel = document.getElementById("hf_DebugOutput");
			if (currentRequest && this.isSelectedTab_Debug())
			{
				debugPanel.contentDocument.body.innerHTML = this.getDebugInfoContent(currentRequest);
			}
			else
			{
				debugPanel.contentDocument.body.innerHTML = "";
			}
		}
		catch (exc)
		{ }
	},

	//G
	selectionChange_RequestTree: function ()
	{
		var currentRequest = this.RequestTree.getCurrent();

		// update debug
		var debugPanel = document.getElementById("hf_DebugOutput");
		if (this.isSelectedTab_Debug())
		{
			debugPanel.contentDocument.body.innerHTML = this.getDebugInfoContent(currentRequest);
		}
		else
		{
			debugPanel.contentDocument.body.innerHTML = "";
		}

		// update cookie info
		this.showCookieInfo(currentRequest);

		// update cache info
		//this.showCacheInfo(currentRequest);

		// update post data info
		this.showPostData(currentRequest);

		// update querystring info
		this.showQueryStringParameters(currentRequest);

		// headers
		this.showRequestHeaders(currentRequest);
		this.showResponseHeaders(currentRequest);

		// update/get content
		var contentPanel = document.getElementById("hf_RawContentOutput");
		if (this.isSelectedTab_Content())
		{
			//net.decoded.utils.dumpall("curr-request", currentRequest);
			//alert("avail.? ");
			if (currentRequest.isContentAvailable())
			{
				// async
				this.showRawContentLoading();
				currentRequest.startGetRawContent(this);

				/*if (currentRequest.getCachedResponse()) {
				contentPanel.value = currentRequest.getRawContent();
				}
				else {
				// one more time.
				if (currentRequest.getCachedResponse()) {
				contentPanel.value = currentRequest.getRawContent();
				}
				else {
				contentPanel.value = "BUSY / PROBLEM (try again)";
				}
				}*/
			}
			else
			{
				this.clearContentDisplay();
				this.showRawContentNotAvailable();
			}
			//contentPanel.value = currentRequest.getRawContent();
		}
		else
		{
			contentPanel.value = "";
		}
	},

	clearContentDisplay: function ()
	{
		document.getElementById("hf_PrettyContentOutput").contentDocument.body.innerHTML = "";
		document.getElementById("hf_RawContentOutput").value = "";
		try
		{
			document.getElementById("hf_ContentTypeLabel").value = this.stringBundle.GetStringFromName("overlay.requestdetails.contenttab.raw.type.label");
		}
		catch (e)
		{
			alert('error:' + e)
		}
		this.disableContentDisplayTypePrettyRadio();
	},

	//G
	showRawContent: function (status)
	{
		var currentRequest = this.RequestTree.getCurrent();
		var contentPanelRaw = document.getElementById("hf_RawContentOutput");
		var contentPanelPretty = document.getElementById("hf_PrettyContentOutput");

		// clear first
		this.clearContentDisplay();

		// display content-type
		document.getElementById("hf_ContentTypeLabel").value = this.stringBundle.GetStringFromName("overlay.requestdetails.contenttab.raw.type.label") + " " + (currentRequest.ContentType ? currentRequest.ContentType : "");

		// not finished
		if (status == -1)
		{
			// not finished
			this.showRawContentNotFinished();
			return;
		}

		// error at getting content
		if (status > 0)
		{
			// error
			this.showRawContentError(status);
			return;
		}

		// fill raw content display
		contentPanelRaw.value = currentRequest.Content;

		// try to fill pretty print content
		if (net.decoded.utils.isContentTypeXml(currentRequest.ContentType))
		{
			// enable pretty
			this.enableContentDisplayTypePrettyRadio();

			// xml (by mimetype definition)
			this.getPrettyPrintXML(currentRequest.Content, "hf_PrettyContentOutput");

			// display if selected view
			if (this.ContentViewMode == 0)
			{
				this.selectionChange_ContentDisplayTypePretty();
			}

			return;
		}
	},

	//G
	showRawContentLoading: function ()
	{
		this.clearContentDisplay();

		document.getElementById("hf_RawContentOutput").value = this.stringBundle.GetStringFromName("overlay.requestdetails.contenttab.raw.loading");
	},

	showRawContentError: function (status)
	{
		this.clearContentDisplay();

		document.getElementById("hf_RawContentOutput").value = this.stringBundle.GetStringFromName("overlay.requestdetails.contenttab.raw.error") + net.decoded.utils.nsResultErrors[status.toString(16)] + ")";
	},

	showRawContentNotAvailable: function ()
	{
		this.clearContentDisplay();

		document.getElementById("hf_RawContentOutput").value = this.stringBundle.GetStringFromName("overlay.requestdetails.contenttab.raw.notavailable");
	},

	showRawContentNotFinished: function ()
	{
		this.clearContentDisplay();

		document.getElementById("hf_RawContentOutput").value = this.stringBundle.GetStringFromName("overlay.requestdetails.contenttab.raw.notready");
	},

	//G
	isSelectedTab_Content: function ()
	{
		if (this.SelectedRequestDetailsTab == 4)
		{
			return true;
		}
		return false;
	},

	//G
	isSelectedTab_Debug: function ()
	{
		if (this.SelectedRequestDetailsTab == 5)
		{
			return true;
		}
		return false;
	},

	//G
	addHeaderRow: function (elementid, name, value)
	{
		var tree = document.getElementById(elementid);
		var newRow = tree.appendChild(document.createElement('treeitem')).appendChild(document.createElement('treerow'));
		newRow.appendChild(document.createElement('treecell')).setAttribute('label', name);
		newRow.appendChild(document.createElement('treecell')).setAttribute('label', value);
	},

	//G
	addCookieRow: function (elementid, name, value, path, domain, expires)
	{
		var tree = document.getElementById(elementid);
		var newRow = tree.appendChild(document.createElement('treeitem')).appendChild(document.createElement('treerow'));
		newRow.appendChild(document.createElement('treecell')).setAttribute('label', name);
		newRow.appendChild(document.createElement('treecell')).setAttribute('label', value);
		newRow.appendChild(document.createElement('treecell')).setAttribute('label', path);
		newRow.appendChild(document.createElement('treecell')).setAttribute('label', domain);
		newRow.appendChild(document.createElement('treecell')).setAttribute('label', expires);
	},

	//G
	clearTreeEntries: function (elementid)
	{
		var tree = document.getElementById(elementid);
		var items = tree.getElementsByTagName('treeitem');
		while (items.length > 0)
		{
			tree.removeChild(items[0]);
		}
	},

	//G
	showRequestHeaders: function (request)
	{
		this.clearTreeEntries("hf_RequestHeadersChildren");

		// request line
		this.addHeaderRow("hf_RequestHeadersChildren", this.stringBundle.GetStringFromName("overlay.requestdetails.headerstab.request.headerrow.col.line"), request.RequestMethod + " " + request.URIPath + " HTTP/" + request.RequestProtocolVersion);

		for (i in request.RequestHeaders)
		{
			this.addHeaderRow("hf_RequestHeadersChildren", i, request.RequestHeaders[i]);
		}

		for (i in request.PostDataHeaders)
		{
			this.addHeaderRow("hf_RequestHeadersChildren", i, request.PostDataHeaders[i]);
		}
	},

	//G
	showResponseHeaders: function (request)
	{
		this.clearTreeEntries("hf_ResponseHeadersChildren");

		// response status and text
		if (request.ResponseHeaders != null)
		{
			this.addHeaderRow("hf_ResponseHeadersChildren", this.stringBundle.GetStringFromName("overlay.requestdetails.headerstab.response.headerrow.col.line"), "HTTP/" + request.ResponseProtocolVersion + " " + request.ResponseStatus + " " + request.ResponseStatusText);
		}

		for (i in request.ResponseHeaders)
		{
			if (i == "Set-Cookie")
			{
				// split into original multiple header values
				var setCookieHeaders = request.ResponseHeaders[i].split("\n");
				for (u in setCookieHeaders)
				{
					this.addHeaderRow("hf_ResponseHeadersChildren", i, setCookieHeaders[u]);
				}
			}
			else
			{
				this.addHeaderRow("hf_ResponseHeadersChildren", i, request.ResponseHeaders[i]);
			}
		}
	},

	//G
	showQueryStringParameters: function (request)
	{
		this.clearTreeEntries("hf_QueryStringChildren");

		if (request.QueryString == null)
		{
			this.addHeaderRow("hf_QueryStringChildren", this.stringBundle.GetStringFromName("overlay.requestdetails.querytab.headerrow.col.param"),
				this.stringBundle.GetStringFromName("overlay.requestdetails.querytab.headerrow.col.value"));
			return;
		}

		for (i in request.QueryStringParameters)
		{
			this.addHeaderRow("hf_QueryStringChildren", net.decoded.utils.urlDecode(request.QueryStringParameters[i][0]), net.decoded.utils.urlDecode(request.QueryStringParameters[i][1]));
		}
	},

	//G
	showCookieInfo: function (request)
	{
		this.clearTreeEntries("hf_CookiesSentChildren");
		this.clearTreeEntries("hf_CookiesReceivedChildren");

		if (request.CookiesSent == null && request.CookiesReceived == null)
		{
			// no cookies
			return;
		}

		var i;

		for (i in request.CookiesSent)
		{
			this.addCookieRow("hf_CookiesSentChildren", request.CookiesSent[i]["name"], request.CookiesSent[i]["value"], (request.CookiesSent[i]["path"]) ? request.CookiesSent[i]["path"] : "", (request.CookiesSent[i]["domain"]) ? request.CookiesSent[i]["domain"] : "", (request.CookiesSent[i]["expires"]) ? net.decoded.utils.formatDateTime(request.CookiesSent[i]["expires"]) : "End Of Session");
		}

		for (i in request.CookiesReceived)
		{
			this.addCookieRow("hf_CookiesReceivedChildren", request.CookiesReceived[i]["name"], request.CookiesReceived[i]["value"], request.CookiesReceived[i]["path"], (request.CookiesReceived[i]["domain"]) ? request.CookiesReceived[i]["domain"] : "", (request.CookiesReceived[i]["expires"]) ? request.CookiesReceived[i]["expires"] : "End Of Session");
		}
	},

	//G
	showCacheInfo: function (request)
	{
		this.clearTreeEntries("hf_CacheInfoChildren");

		//TODO: REFACTOR
		request.showCacheInfo();
	},

	//G
	showPostData: function (request)
	{
		if (this.PostDataViewMode == 0)
		{
			this.selectionChange_PostDataDisplayTypePretty();
		}
		else
		{
			this.selectionChange_PostDataDisplayTypeRaw();
		}

		// init
		document.getElementById("hf_PostDataPretty").collapsed = true;
		document.getElementById("hf_PostDataTree").collapsed = false;

		// fill raw data
		if (request.IsPostDataTooBig)
		{
			document.getElementById("hf_PostDataRawOutput").value = this.stringBundle.GetStringFromName("overlay.requestdetails.posttab.toobig");
		}
		else
		{
			document.getElementById("hf_PostDataRawOutput").value = request.PostData;
		}

		// fill pretty data
		// enable pretty
		this.enablePostDataDisplayTypePrettyRadio();

		var mimeLabel = document.getElementById("hf_PostDataMimeType");
		mimeLabel.value = this.stringBundle.GetStringFromName("overlay.requestdetails.posttab.pretty.type");
		this.clearTreeEntries("hf_PostDataChildren");

		if (request.PostData == null)
		{
			this.addHeaderRow("hf_PostDataChildren",
				this.stringBundle.GetStringFromName("overlay.requestdetails.posttab.headerrow.col.param"),
				this.stringBundle.GetStringFromName("overlay.requestdetails.posttab.headerrow.col.value"));

			document.getElementById("hf_PostDataRawOutput").value = this.stringBundle.GetStringFromName("overlay.requestdetails.posttab.headerrow.col.value");
			
			return;
		}

		var ctypedisplay = "";
		for (var y in request.PostDataHeaders)
		{
			if (y.toLowerCase() == "content-type")
			{
				ctypedisplay = request.PostDataHeaders[y];
			}
		}
		if (ctypedisplay == "")
		{
			for (var y in request.RequestHeaders)
			{
				if (y.toLowerCase() == "content-type")
				{
					ctypedisplay = request.RequestHeaders[y];
				}
			}
		}

		mimeLabel.value = this.stringBundle.GetStringFromName("overlay.requestdetails.posttab.mimetype") + " " + ctypedisplay;

		if (request.IsPostDataMIME)
		{
			// mime post data

			for (i in request.PostDataMIMEParts)
			{
				if (request.PostDataMIMEParts[i]["filename"] != null)
				{
					this.addHeaderRow("hf_PostDataChildren",
						request.PostDataMIMEParts[i]["varname"],
						request.PostDataMIMEParts[i]["filename"] + " " + request.PostDataMIMEParts[i]["ctype"]);
				}
				else
				{
					this.addHeaderRow("hf_PostDataChildren", request.PostDataMIMEParts[i]["varname"], request.PostDataMIMEParts[i]["value"]);
				}

			}
		}
		else if (request.PostDataParameters)
		{
			// standard url encoded post data

			for (i in request.PostDataParameters)
			{
				if (request.PostDataParameters[i][0] != null && request.PostDataParameters[i][0] != "")
				{
					this.addHeaderRow("hf_PostDataChildren", net.decoded.utils.urlDecode(request.PostDataParameters[i][0]), net.decoded.utils.urlDecode(request.PostDataParameters[i][1] != null ? request.PostDataParameters[i][1] : ""));
				}
			}
		}
		else
		{
			// check if url parameter style
			if (net.decoded.utils.isXml(request.PostData))
			{
				// display pretty plain content
				document.getElementById("hf_PostDataPretty").collapsed = false;
				document.getElementById("hf_PostDataTree").collapsed = true;
				this.getPrettyPrintXML(request.PostData, "hf_PostDataPretty");
			}
			else
			{
				// just raw...
				this.disablePostDataDisplayTypePrettyRadio();
			}
		}
	},

	getPrettyPrintXML: function (xmlData, browserBoxId)
	{
		var parser = new DOMParser();
		var doc = parser.parseFromString(xmlData, "text/xml");

		var HTMLOutput = this.XMLPrettyPrintXSLT.transformToFragment(doc, document);

		var debugPanel = document.getElementById(browserBoxId);
		debugPanel.contentDocument.body.innerHTML = "";
		var importedNode = debugPanel.contentDocument.importNode(HTMLOutput, true);
		debugPanel.contentDocument.body.appendChild(importedNode);
		debugPanel.contentDocument.body.style.margin = 0;
		debugPanel.contentDocument.body.style.padding = 0;
	},

	//G
	showDebugInfo: function (request)
	{
		var debugPanel = document.getElementById("hf_DebugOutput");
		debugPanel.contentDocument.body.innerHTML = this.getDebugInfoContent(request);
	},

	getDebugInfoContent: function (request)
	{
		var content = "";
		content = "<div style=\"font-family:Tahoma,Verdana,Arial,sans-serif; font-size:11px;\">";
		content += "<b>Url:</b> " + request.Url + "<br/>";
		content += "<b>RequestMethod:</b> " + request.RequestMethod + "<br/>";
		content += "<b>StartTimestamp:</b> " + request.StartTimestamp + "<br/>";
		content += "<b>EndTimestamp:</b> " + request.EndTimestamp + "<br/>";
		content += "<b>Loadflags: - request:</b> " + this.HttpFoxService.getStatusTextFromCode(this.HttpFoxService.HttpFoxStatusCodeType.LOADFLAGS_REQUEST, request.LoadFlags) + " (" + request.LoadFlags + ") <br/>";
		content += "<b>Loadflags: - channel:</b> " + this.HttpFoxService.getStatusTextFromCode(this.HttpFoxService.HttpFoxStatusCodeType.LOADFLAGS_CHANNEL, request.LoadFlags) + " (" + request.LoadFlags + ") <br/>";
		content += "<b>Loadflags: - caching:</b> " + this.HttpFoxService.getStatusTextFromCode(this.HttpFoxService.HttpFoxStatusCodeType.LOADFLAGS_CACHING, request.LoadFlags) + " (" + request.LoadFlags + ") <br/>";
		content += "<b>IsFromCache:</b> " + request.IsFromCache + "<br/>";
		content += "<b>BytesLoaded:</b> " + request.BytesLoaded + "<br/>";
		content += "<b>BytesLoadedTotal:</b> " + request.BytesLoadedTotal + "<br/>";
		content += "<b>ContentLength: </b>" + request.ContentLength + "<br/>";
		content += "<b>ContentType: </b>" + request.ContentType + "<br/>";
		content += "<b>ContentCharset: </b>" + request.ContentCharset + "<br/>";
		content += "<b>ResponseStatus: </b>" + request.ResponseStatus + "<br/>";
		content += "<b>ResponseStatusText: </b>" + request.ResponseStatusText + "<br/>";

		if (request.IsFromCache)
		{
			content += "<br/>";
			content += "<b>CacheToken:</b> " + request.CacheToken + "<br/>";
			content += "<b>CacheKey:</b> " + request.CacheKey + "<br/>";
			content += "<b>CacheAsFile:</b> " + request.CacheAsFile + "<br/>";
			content += "<b>CacheFile:</b> " + request.CacheFile + "<br/>";
		}

		// headers
		for (i in request.RequestHeaders)
		{
			content += "<br/>";
			content += "<b>Request header:</b> " + i + " : " + request.RequestHeaders[i];
		}
		for (i in request.ResponseHeaders)
		{
			content += "<br/>";
			content += "<b>Response header:</b> " + i + " : " + request.ResponseHeaders[i];
		}

		content += "<br/>";

		for (i in request.RequestLog)
		{
			content += "<br/>";
			content += "-> <b>EventLog " + i + ":</b> <br/>";
			content += "-------------------------------------------------------------------------<br/>";
			content += "<b> - Url: </b>" + request.RequestLog[i].Url + "<br/>";
			content += "<b> - ChannelStatus: </b>" + request.RequestLog[i].Status + "<br/>";
			content += "<b> - Statuscode: </b>" + request.RequestLog[i].ResponseStatus + "<br/>";
			content += "<b> - Timestamp: </b>" + request.RequestLog[i].Timestamp + "<br/>";
			content += "<b> - HttpFox starttime: </b>" + request.HttpFox.StartTime + "<br/>";
			//content += "- relative timestamp: " + net.decoded.utils.formatTime(new Date(this.RequestLog[i].Timestamp.getTime() - this.HttpFox.StartTime.getTime())) + "<br/>";
			content += "<b> - IsFromCache: </b>" + request.RequestLog[i].IsFromCache + "<br/>";
			content += "<b> - IsPending: </b>" + request.RequestLog[i].IsPending + "<br/>";
			content += "<b> - BytesLoaded: </b>" + request.RequestLog[i].BytesLoaded + "<br/>";
			content += "<b> - BytesLoadedTotal: </b>" + request.RequestLog[i].BytesLoadedTotal + "<br/>";
			content += "<b> - ContentLength: </b>" + request.RequestLog[i].ContentLength + "<br/>";
			content += "<b> - ContentType: </b>" + request.RequestLog[i].ContentType + "<br/>";
			content += "<b> - ContentCharset: </b>" + request.RequestLog[i].ContentCharset + "<br/>";
			content += "<b> - EventSource: </b>" + this.HttpFoxService.getEventSourceName(request.RequestLog[i].EventSource) + "<br/>";
			content += "<b> - EventSourceData: </b><br/>";
			for (u in request.RequestLog[i].EventSourceData)
			{
				if ((request.RequestLog[i].EventSource == this.HttpFoxService.HttpFoxEventSourceType.EVENTSINK_ON_STATUS ||
					request.RequestLog[i].EventSource == this.HttpFoxService.HttpFoxEventSourceType.WEBPROGRESS_ON_STATUS_CHANGED)
					&& u == "status")
				{
					content += "<b> -- " + u + ": </b>" + this.HttpFoxService.getStatusTextFromCode(this.HttpFoxService.HttpFoxStatusCodeType.SOCKETTRANSPORT, request.RequestLog[i].EventSourceData[u]) + "<br/>";
				}
				else if (request.RequestLog[i].EventSource == this.HttpFoxService.HttpFoxEventSourceType.WEBPROGRESS_ON_SECURITY_CHANGED && u == "state")
				{
					content += "<b> -- " + u + " - security: </b>" + this.HttpFoxService.getStatusTextFromCode(this.HttpFoxService.HttpFoxStatusCodeType.WEBPROGRESS_SECURITY, request.RequestLog[i].EventSourceData[u]) + "<br/>";
					content += "<b> -- " + u + " - strength: </b>" + this.HttpFoxService.getStatusTextFromCode(this.HttpFoxService.HttpFoxStatusCodeType.WEBPROGRESS_SECURITY_STRENGTH, request.RequestLog[i].EventSourceData[u]) + "<br/>";
				}
				else if (request.RequestLog[i].EventSource == this.HttpFoxService.HttpFoxEventSourceType.WEBPROGRESS_ON_STATE_CHANGED && u == "flags")
				{
					content += "<b> -- " + u + " - transition: </b>" + this.HttpFoxService.getStatusTextFromCode(this.HttpFoxService.HttpFoxStatusCodeType.WEBPROGRESS_TRANSITION, request.RequestLog[i].EventSourceData[u]) + "<br/>";
					content += "<b> -- " + u + " - type: </b>" + this.HttpFoxService.getStatusTextFromCode(this.HttpFoxService.HttpFoxStatusCodeType.WEBPROGRESS_TYPE, request.RequestLog[i].EventSourceData[u]) + "<br/>";
					content += "<b> -- " + u + " - modifier: </b>" + this.HttpFoxService.getStatusTextFromCode(this.HttpFoxService.HttpFoxStatusCodeType.WEBPROGRESS_MODIFIER, request.RequestLog[i].EventSourceData[u]) + "<br/>";
					content += "<b> -- " + u + " - security: </b>" + this.HttpFoxService.getStatusTextFromCode(this.HttpFoxService.HttpFoxStatusCodeType.WEBPROGRESS_SECURITY, request.RequestLog[i].EventSourceData[u]) + "<br/>";
					content += "<b> -- " + u + " - strength: </b>" + this.HttpFoxService.getStatusTextFromCode(this.HttpFoxService.HttpFoxStatusCodeType.WEBPROGRESS_SECURITY_STRENGTH, request.RequestLog[i].EventSourceData[u]) + "<br/>";
				}
				else if (request.RequestLog[i].EventSource == this.HttpFoxService.HttpFoxEventSourceType.WEBPROGRESS_ON_LOCATION_CHANGED && u == "uri")
				{
					content += "<b> -- " + u + ": </b>" + request.RequestLog[i].EventSourceData[u].asciiSpec + "<br/>";
				}
				else
				{
					content += "<b> -- " + u + ": </b>" + request.RequestLog[i].EventSourceData[u] + "<br/>";
				}
			}
			content += "<br/>";
		}

		content += "</div>";
		return content;
	},

	//G
	getCurrentInfoTreeElement: function ()
	{
		switch (this.SelectedRequestDetailsTab)
		{
			case 0:
				return "hf_RequestHeadersTree" + ";" + "hf_ResponseHeadersTree";

			case 1:
				return "hf_CookiesSentTree" + ";" + "hf_CookiesReceivedTree";

				//case 2:
				//return "hf_CacheInfoTree";

			case 2:
				return "hf_QueryStringTree";

			case 3:
				return "hf_PostDataTree";

			default:
				return "";
		}
	},

	//G
	// context menu stuff
	updateRequestContextMenu: function (event)
	{
		var row = {};
		var column = {};
		var part = {};
		if (event.currentTarget.id == "hf_RequestTreeContextMenu")
		{
			var tree = this.RequestTree.TreeElement;
			var boxobject = tree.boxObject;
			var menu = document.getElementById("hf_RequestTreeContextMenu");

			boxobject.QueryInterface(Components.interfaces.nsITreeBoxObject);
			boxobject.getCellAt(event.clientX, event.clientY, row, column, part);
		}
		else
		{
			var infoTreeIds = this.getCurrentInfoTreeElement().split(";");
			var tree;
			var boxobject;
			var menu = document.getElementById("hf_RequestDetailsContextMenu");
			for (i in infoTreeIds)
			{
				row = {};
				column = {};
				tree = document.getElementById(infoTreeIds[i]);
				boxobject = tree.boxObject;
				boxobject.QueryInterface(Components.interfaces.nsITreeBoxObject);
				boxobject.getCellAt(event.clientX, event.clientY, row, column, part);
				if (column.value != null)
				{
					// tree found
					break;
				}
			}
		}

		// set current tree
		this.currentContextTree = tree;

		if (column.value != null)
		{
			// column and row found. show those two entries
			var celltext = tree.view.getCellText(row.value, tree.columns.getColumnAt(column.value.index));
			this.currentCellText = celltext;

			// copy cell
			menu.firstChild.setAttribute("hidden", false);
			menu.firstChild.setAttribute("disabled", false);
			menu.firstChild.setAttribute("label", "Copy '" + celltext + "'");

			// copy row
			menu.firstChild.nextSibling.setAttribute("hidden", false);
			menu.firstChild.nextSibling.setAttribute("disabled", false);
		}
		else
		{
			//just show copy all rows
			this.currentCellText = null;

			// hide copy cell
			menu.firstChild.setAttribute("hidden", true);
			menu.firstChild.setAttribute("disabled", true);

			// hide copy row
			menu.firstChild.nextSibling.setAttribute("hidden", true);
			menu.firstChild.nextSibling.setAttribute("disabled", true);
		}
	},

	//G
	Clipboard_CopyTreeRowCell: function ()
	{
		if (this.currentCellText != null)
		{
			net.decoded.utils.toClipboard(this.currentCellText);
		}
	},

	//G
	Clipboard_CopyTreeRow: function ()
	{
		if (this.currentContextTree != null)
		{
			var copyString = "";
			for (var i = 0; i < this.currentContextTree.columns.count; i++)
			{
				copyString += this.currentContextTree.view.getCellText(this.currentContextTree.currentIndex, this.currentContextTree.columns.getColumnAt(i));
				if (i < this.currentContextTree.columns.count - 1)
				{
					copyString += "\t";
				}
			}
			net.decoded.utils.toClipboard(copyString);
		}
	},

	//G
	Clipboard_CopyTreeAllRows: function ()
	{
		if (this.currentContextTree != null)
		{
			var copyString = "";
			var rowCount = this.currentContextTree.view.rowCount;
			for (var u = 0; u < rowCount; u++)
			{
				for (var i = 0; i < this.currentContextTree.columns.count; i++)
				{
					copyString += this.currentContextTree.view.getCellText(u, this.currentContextTree.columns.getColumnAt(i));
					if (i < this.currentContextTree.columns.count - 1)
					{
						copyString += "\t";
					}
				}
				if (u < rowCount - 1)
				{
					copyString += "\r\n";
				}
			}
			net.decoded.utils.toClipboard(copyString);
		}
	},

	//G
	OpenInWindow: function ()
	{
		net.decoded.utils.openWindow("HttpFox", "chrome://httpfox/content/HttpFoxWindow.xul", "", null);
	},

	OpenOptions: function ()
	{
		openDialog("chrome://httpfox/content/HttpFoxOptions.xul", "HttpFox Options", "", null);
	}

}

var HttpFox = new HttpFoxController();

function shutdownHttpFox()
{
	HttpFox.clear();
	//HttpFox.cmd_stopWatching();

	HttpFox.HttpFoxService.removeController(HttpFox);

	if (HttpFox.WindowMode)
	{
		HttpFox.HttpFoxService.HttpFoxWindow = null;
		HttpFox.HttpFoxService.windowIsClosed();
	}

	HttpFox = null;
}