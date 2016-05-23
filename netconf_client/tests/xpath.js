/*
 * Copyright (C) 2016 Cisco Systems, Inc.
 *
 * Author: Mislav Novakovic <mislav.novakovic@sartura.hr>
 * Author: Luka Perkov <luka.perkov@sartura.hr>
 *
 * testconf is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * You should have received a copy of the GNU General Public License
 * along with testconf. If not, see <http://www.gnu.org/licenses/>.
 */

var netconf_client = require('../netconf_client')
var util = require('util')
var libxmljs = require("libxmljs");
var pd = require('pretty-data').pd;

var orig_xpath

process.argv.forEach(function (val, index, array) {
	if (index == 2)
		orig_xpath = process.argv[index]
});

if (orig_xpath == undefined) {
	console.log("please provide xpath parameter")
	return
}

// get standard xpath
xpath = orig_xpath.replace(/^(\/|\/\/)[^;]*:/g, '')

// get yang model name
name = xpath.replace(/\/.*/g, '')

xpath = '/' + xpath

var xml = '<get-config><source><running/></source><filter><' + name + '/></filter></get-config>'

netconf_client.create().then(function(client)
{
	client.send(xml).thenDefault(function(reply)
	{
		client.send_close().thenDefault()

		// remove xmlns, TODO parse with xmlns
		xml = reply.replace(/\sxmlns[^"]+"[^"]+"/g, '')

		var xmlDoc = libxmljs.parseXml(xml);

                xpath = "/rpc-reply/data/" + xpath
		var gchild = xmlDoc.get(xpath)

                xml_pp = pd.xml(gchild.childNodes().toString());
                console.log("\n" + xml_pp + "\n");
	})
})
