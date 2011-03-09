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

WatchPugUtils = {

  htmlValidatorContainer: null,
  
  req: null,
  
  callbackScope: null,

  loadSitemap: function(callbackScope) {
  
    WatchPugUtils.callbackScope = callbackScope;
  
    var url = WatchPugUtils.getSitemapUrl();
  
    WatchPugUtils.req = false;
      // branch for native XMLHttpRequest object
      if(window.XMLHttpRequest && !(window.ActiveXObject)) {
        try {
        WatchPugUtils.req = new XMLHttpRequest();
          } catch(e) {
        WatchPugUtils.req = false;
          }
      // branch for IE/Windows ActiveX version
      } else if(window.ActiveXObject) {
          try {
            WatchPugUtils.req = new ActiveXObject("Msxml2.XMLHTTP");
          } catch(e) {
            try {
                WatchPugUtils.req = new ActiveXObject("Microsoft.XMLHTTP");
            } catch(e) {
                WatchPugUtils.req = false;
            }
      }
      }
    if(WatchPugUtils.req) {
      WatchPugUtils.req.onreadystatechange = function() {
        WatchPugUtils.processReqChange();
      };
      WatchPugUtils.req.open("GET", url, true);
      WatchPugUtils.req.send("");
    }
    
  },
  
  getSitemapUrl: function() {

    var documentLocation = content.document.location;
  
    return documentLocation.protocol + '//' + documentLocation.host + '/sitemap.xml';
  
  },

  processReqChange: function() {
  // only if req shows "loaded"
      if (WatchPugUtils.req.readyState == 4) {
          // only if "OK"
          if (WatchPugUtils.req.status == 200) {
              WatchPugUtils.processResult(WatchPugUtils.req.responseText);
          } else {
              alert("There was a problem retrieving the sitemap.xml data:\n" +
                  WatchPugUtils.req.statusText);
          }
      }
  },

  StringtoXML: function(text){
    if (window.ActiveXObject){
      var doc=new ActiveXObject('Microsoft.XMLDOM');
      doc.async='false';
      doc.loadXML(text);
    } else {
      var parser=new DOMParser();
      var doc=parser.parseFromString(text,'text/xml');
    }
    return doc;
  },

  processResult: function(result) {

    var parser=new DOMParser();
    
    var sitemapDoc = parser.parseFromString(result,'text/xml');
    
    var sitemapDocNodes = sitemapDoc.documentElement.childNodes;
    
    var sitemapUrlList = new Array();
    
    for (var i = 0; i < sitemapDocNodes.length; i++) {
    
      if (sitemapDocNodes[i].nodeName.toString() == 'url') {
      
        var sitemapDocNodesChilds = sitemapDocNodes[i].childNodes;
      
        for (var j = 0; j < sitemapDocNodesChilds.length; j++) {
        
          if (sitemapDocNodesChilds[j].nodeName.toString() == 'loc') {
        
            var url = sitemapDocNodesChilds[j].childNodes[0].nodeValue.toString();
        
            sitemapUrlList.push(url);
        
          }
        
        }
      
      }
    
    }
    
    WatchPugUtils.retrieveSitemapUrls(sitemapUrlList);

  },

  retrieveSitemapUrls: function(sitemapUrlList) {

    WatchPugUtils.callbackScope.loadSitemapCallback(sitemapUrlList);
  
  }
  
}
