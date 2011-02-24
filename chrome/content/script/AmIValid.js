/*
AmIValid
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

// AmIValidController
function AmIValidController() {
	this.init();
}

AmIValidController.prototype = {

	StringBundleService: null,

	StringBundle: null,

	// constructor
	init: function () {

		this.AmIValidService = Components.classes["@decoded.net/amivalid;1"].getService().wrappedJSObject;

		this.StringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);

		this.stringBundle = this.StringBundleService.createBundle("chrome://amivalid/locale/AmIValid.properties");

		if (!this.stringBundle || !this.stringBundle.getSimpleEnumeration().hasMoreElements()) throw "Could not load localized strings!";

	}

}

var AmIValid = new AmIValidController();