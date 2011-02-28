/*
WatchPug
Copyright (C) 2010 Nico Steiner

Original source code came from:

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

// WatchPugController
function WatchPugController() {

	this.init();
  
}

WatchPugController.prototype = {

	StringBundleService: null,

	StringBundle: null,
  
  IsWatching: false,

	onClickStatusIcon: function(event) {
  
		if (event.button != 0) {
    
			return;
      
		} else {
    
			this.cmd_wp_togglePanel();
      
		}
    
  },

	cmd_wp_togglePanel: function() {

		var WatchPugPanel = document.getElementById("watchpug_PanelNormal");
		var WatchPugPanelSplitter = document.getElementById("watchpug_PanelSplitter");

		WatchPugPanelSplitter.collapsed = (WatchPugPanel.collapsed) ? false : true;
    
		WatchPugPanel.collapsed = (WatchPugPanel.collapsed) ? false : true;
    
	},

	cmd_wp_toggleWatching: function() {
  
		if (this.IsWatching) {
    
			this.cmd_wp_stopWatching();
      
		} else {
    
			this.cmd_wp_startWatching();
      
		}
    
	},

	cmd_wp_startWatching: function() {
  
		if (!this.IsWatching) {
    
			this.startWatching();
      
		}

		this.disableButton_startWatching();
    
	},

	disableButton_startWatching: function() {
  
		document.getElementById("cmd_wp_startWatching").setAttribute('disabled', 'true');
		document.getElementById("cmd_wp_stopWatching").removeAttribute('disabled');
    
	},

	cmd_hf_stopWatching: function() {
  
		if (this.IsWatching) {
    
			//this.stopWatching();
      
		}

		this.disableButton_stopWatching();
    
	},

	disableButton_stopWatching: function() {
  
		document.getElementById("cmd_wp_stopWatching").setAttribute('disabled', 'true');
		document.getElementById("cmd_wp_startWatching").removeAttribute('disabled');
    
	},

	cmd_hf_clear: function() {
  
		//this.clearRequests();

		//this.clear();
    
	},

	clearTreeEntries: function() {
  
		var tree = document.getElementById('watchpug_RequestListBox');
		var items = tree.getElementsByTagName('listitem');
    
		while (items.length > 0) {
    
			tree.removeChild(items[0]);
      
		}
    
	},

  addListItem: function(url, statusCode, htmlValidatorResult, firebugResult) {
  
    var tree = document.getElementById('watchpug_RequestListBox');
    
		var newListItem = document.createElement('listitem');
    
    newListItem.appendChild(document.createElement('listcell')).setAttribute('label', url);
    newListItem.appendChild(document.createElement('listcell')).setAttribute('label', statusCode);
    newListItem.appendChild(document.createElement('listcell')).setAttribute('label', htmlValidatorResult);
    newListItem.appendChild(document.createElement('listcell')).setAttribute('label', firebugResult);
    
    tree.appendChild(newListItem);
    
  },
  
  startWatching: function() {
  
    this.IsWatching = true;
    
    WatchPugUtils.loadSitemap(this);
    
  },
  
  loadSitemapCallback: function(sitemapUrlList) {
  
    this.clearTreeEntries();
    
    for (var i = 0; i < sitemapUrlList.length; i++) {
    
      this.addListItem(sitemapUrlList[i], '-', 'n/a', 'n/a');
    
    }
  
  },
  
	// constructor
	init: function () {

    /*
		this.WatchPugService = Components.classes["@decoded.net/watchpug;1"].getService().wrappedJSObject;

		this.StringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);

		this.stringBundle = this.StringBundleService.createBundle("chrome://watchpug/locale/WatchPug.properties");

		if (!this.stringBundle || !this.stringBundle.getSimpleEnumeration().hasMoreElements()) throw "Could not load localized strings!";
    */

	}

}

var WatchPug = new WatchPugController();