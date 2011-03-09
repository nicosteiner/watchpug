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
  
  player: null,

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
  
  cmd_wp_close: function() {

		var WatchPugPanel = document.getElementById("watchpug_PanelNormal");
		var WatchPugPanelSplitter = document.getElementById("watchpug_PanelSplitter");

		WatchPugPanelSplitter.collapsed = true;
    
		WatchPugPanel.collapsed = true;
    
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
  
		document.getElementById("watchpug_TopBarButton_Start").setAttribute('disabled', 'true');
		document.getElementById("watchpug_TopBarButton_Stop").removeAttribute('disabled');
    
	},

	cmd_wp_stopWatching: function() {
  
		if (this.IsWatching) {
    
			this.stopWatching();
      
		}

		this.disableButton_stopWatching();
    
	},

  stopWatching: function() {
  
    // this automattically stops watching
  
    this.IsWatching = false;
    
  },
  
	disableButton_stopWatching: function() {
  
		document.getElementById("watchpug_TopBarButton_Start").removeAttribute('disabled');
		document.getElementById("watchpug_TopBarButton_Stop").setAttribute('disabled', 'true');
    
	},
  
	cmd_wp_clear: function() {
  
		this.cmd_wp_stopWatching();

		this.clear();
    
	},

  clear: function() {
  
		this.clearTreeEntries();

	},
  
	clearTreeEntries: function() {
  
		var tree = document.getElementById('watchpug_RequestListBox');
		var items = tree.getElementsByTagName('listitem');
    
		while (items.length > 0) {
    
			tree.removeChild(items[0]);
      
		}
    
	},

  addListItem: function(url, statusClass, statusCode, htmlValidatorResult, firebugResult) {
  
    var tree = document.getElementById('watchpug_RequestListBox');
    
		var newListItem = document.createElement('listitem');
    
    newListItem.setAttribute('class', 'status_' + statusClass);
    
    newListItem.appendChild(document.createElement('listcell')).setAttribute('label', url);
    newListItem.appendChild(document.createElement('listcell')).setAttribute('label', statusCode);
    newListItem.appendChild(document.createElement('listcell')).setAttribute('label', htmlValidatorResult);
    newListItem.appendChild(document.createElement('listcell')).setAttribute('label', firebugResult);
    
    tree.appendChild(newListItem);
    
  },
  
  startWatching: function() {
  
    this.IsWatching = true;
    
    this.letPugBark();
    
    WatchPugUtils.loadSitemap(this);
    
  },
  
  letPugBark: function() {
  
    var ios = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
    
    // from: www.partnersinrhyme.com/soundfx/dog_sounds/chasdogwav.shtml
    
    var barkSound = ios.newURI('chrome://watchpug/content/bark.wav', null, null);
    
    this.player.play(barkSound);
  
  },
  
  loadSitemapCallback: function(sitemapUrlList) {
  
    this.clearTreeEntries();
    
    this.checkAllPages(sitemapUrlList);
    
  },
  
  checkAllPages: function(sitemapUrlList) {
  
    if (sitemapUrlList.length) {
  
      var sitemapUrl = sitemapUrlList[0];
  
      // check if host is part of location
      
      if (document.getElementById('watchpug_HostCheckbox').checked) {
  
        // search for start of pagename
        
        // search for first slash after http://
        
        var startSitemapPage = sitemapUrl.substring(8, sitemapUrl.length).indexOf('/');
    
        sitemapUrl = sitemapUrl.substring(8 + startSitemapPage, sitemapUrl.length);
      
        content.document.location.pathname = sitemapUrl;
        
      } else {
  
        content.document.location.href = sitemapUrl;
        
      }
      
      // check every second if loaded document is ready
      
      var intervalId = window.setInterval(function(scope, sitemapUrlList) {
      
        return function() {

            if (content.document.readyState == 'complete') {
        
              window.clearInterval(intervalId);
        
              // document is ready now
              
              // extensions check it's status right now
        
              scope.checkForErrors(sitemapUrlList);
        
            }
            
            // check for 'not found'
          
        };
        
      }(this, sitemapUrlList), 1000);
      
    } else {
    
      this.cmd_wp_stopWatching();
      
    }
    
  },
  
  checkForErrors: function(sitemapUrlList) {
  
    // wait for 1 second to be sure that extension results are ready

    if (this.IsWatching) {
    
      var timeoutId = window.setTimeout(function(scope, sitemapUrlList) {
      
        return function() {

          // check for html validator result
          
          var result = 'warning';
          
          var validatorExtendedResult = 'n/a';
        
          if (document.getElementById('tidy-status-bar-img')) {
          
            if (document.getElementById('tidy-status-bar-img').src == 'chrome://tidy/skin/good.png') {
            
              result = 'ok';
            
            } else {
            
              result = 'error';
            
            }
            
          }
        
          if (document.getElementById('tidy-browser-error') && document.getElementById('tidy-browser-error') != '') {
          
            validatorExtendedResult = document.getElementById('tidy-browser-error').value;
            
          }
        
          // check for firebug result
        
          var firebugExtendedResult = 'n/a';
          
          /*
          if (document.getElementById('tidy-status-bar-img')) {
          
            if (document.getElementById('tidy-status-bar-img').src == 'chrome://tidy/skin/good.png') {
            
              validatorResult = 'ok';
            
            } else {
            
              validatorResult = 'error';
            
            }
            
          }
          */
          
          if (document.getElementById('fbStatusText') && document.getElementById('fbStatusText').value != '') {
          
            firebugExtendedResult = document.getElementById('fbStatusText').value;
            
          }
          
          scope.addListItem(content.document.location.href, result, '200', validatorExtendedResult, firebugExtendedResult);
    
          scope.checkAllPages(sitemapUrlList.slice(1));
            
        };
        
      }(this, sitemapUrlList), 1000);
      
    }
    
  },
  
	// constructor
	init: function () {

    this.player = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
    
    this.player.init();

	}

}

var WatchPug = new WatchPugController();