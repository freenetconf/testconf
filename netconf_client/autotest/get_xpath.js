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
var config = require('../../core/config')
var yang = require("libyang")

config.show_logs = false
yang_dir = __dirname + "/../../server_yang/"

var yang_import_path = "../../ietf-yangs"
var yang_module_name

var orig_xpath

process.argv.forEach(function (val, index, array) {
	if (index == 2)
		xpath = process.argv[index]
});

//TODO running hard coded
var left_xml = '<get-config><source><running/></source><filter>'
var right_xml = '</filter></get-config>'

// remove yang namespace
xpath = xpath.split(":")
namespace = xpath[0].slice(1)
xpath = xpath.pop()

// get namespace

var ctx = yang.ly_ctx_new(yang_dir)
var fs = require('fs');
var files = fs.readdirSync(yang_dir);

for (var i in files) {
	mod = yang.lys_parse_path(ctx, yang_dir + files[i], yang.LYS_IN_YANG);
	if (namespace == mod.name)
		namespace = mod.ns
}

nodes = xpath.split("\/")

nodes.forEach(function(value) {
	keys = value.split(/[\[,\]]+/)
	if (keys.length == 1) {
		left_xml = left_xml + '<' + value + ' xmlns="' + namespace + '">'
		right_xml = '</' + value + '>' + right_xml
	} else if (keys.length > 1 ) {
		left_xml = left_xml + '<' + keys[0] + '>'
		key = keys[1].split(/[=,\']+/)
		left_xml = left_xml + '<' + key[0] + '>' + key[1] + '</' + key[0] + '>'
		right_xml = '</' + keys[0] + '>' + right_xml

	}
})

xml = left_xml + right_xml

netconf_client.create().then(function(client)
{
	client.send(xml).thenDefault(function(reply)
	{
		client.send_close().then(function (resolve, reject) {

		// remove xmlns, TODO parse with xmlns
		xml = reply.replace(/\sxmlns[^"]+"[^"]+"/g, '')

		var xmlDoc = libxmljs.parseXml(xml);

                xpath = "/rpc-reply/data/" + xpath
		var gchild = xmlDoc.get(xpath)

                xml_pp = pd.xml(gchild.childNodes().toString());
                console.log(xml_pp);

		}).then(function (resolve, reject) {
			process.exit(0)
		}).catch(function (err) {
			console.error('ERROR: ', err);
		})
	})
})
