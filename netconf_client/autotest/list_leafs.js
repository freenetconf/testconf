/*
 * Copyright (C) 2016 Deutsche Telekom AG.
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

var util = require('util')
var fs = require('fs')
var libxmljs = require("libxmljs");
var config = require('../../core/config')
var netconf_client = require('../netconf_client')
var exec = require('child-process-promise').exec;
var yang = require("libyang")
config.show_logs = false
var config_folder = ''
var ctx
var mod

var ignore = ['modules-state', 'netconf-state']

function randomfolder() {
	var length = 20
	var result = ''
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
	for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)]
	return result;
}

function iterate_xpaths(xml, namespace, result) {
	return new Promise((resolve, reject) => {
		if (xml.childNodes().length < 1) {
			result.push('/' + namespace + ':' + xml.parent().path().substring(1))
			return resolve()
		} else {
			var Schemas = xml.childNodes()
			return Promise.all(Schemas.map(function (element) {
				return iterate_xpaths(element, namespace, result)
			}));
		}
	})
}

function get_xpath(node, value) {
	return new Promise((resolve, reject) => {
		var orig = node
		var num = 0
		var head
		var top_ns = [] // write namespace only once

		var xpath = ''

		// check only leaf's
		if (node.schema.nodetype != yang.LYS_LEAF)
			return resolve()

		while (node) {
			s = node.schema.nodetype
			if (s == yang.LYS_LEAF || s == yang.LYS_CONTAINER || s == yang.LYS_LEAFLIST || s == yang.LYS_RFC) {
				if (node.parent && node.schema.module.name == node.parent.schema.module.name)
					xpath = '/' + node.schema.name + xpath
				else
					xpath = '/' + node.schema.module.name + ':' + node.schema.name + xpath
			}
			if (s == yang.LYS_LIST) {
				k = yang.cast_lys_node_list(node.schema)

				for (var i = 0; i < yang.get_uint8(k.keys_size); i++) {
					key = yang.get_lys_node_leaf(k.keys, 0)
					childs = node.child
					while (childs) {
						// TODO fix skiped key leafs
						if (orig.schema.name == key.name && num == 1)
							return resolve()

						if (key.name == childs.schema.name) {
							var el = yang.cast_lyd_node_leaf_list(childs)
							xpath = '[' + key.name + "='" + el.value_str + "']" + xpath
						}
						childs = childs.next
					}
				}
				if (node.parent && node.schema.module.name == node.parent.schema.module.name)
					xpath = '/' + node.schema.name + xpath
				else
					xpath = '/' + node.schema.module.name + ':' + node.schema.name + xpath
			}
			head = node
			node = node.parent
			++num
		}

		let ret = 'undefined'
		switch(value) {
			case yang.LY_TYPE_BOOL: ret = "bool"; break;
			case yang.LY_TYPE_DEC64: ret = "dec64"; break;
			case yang.LY_TYPE_STRING: ret = "string"; break;
			case yang.LY_TYPE_INT8: ret = "int8"; break;
			case yang.LY_TYPE_UINT8: ret = "uint8"; break;
			case yang.LY_TYPE_INT16: ret = "int16"; break;
			case yang.LY_TYPE_UINT16: ret = "uint16"; break;
			case yang.LY_TYPE_INT32: ret = "uint32"; break;
			case yang.LY_TYPE_UINT32: ret = "uint32"; break;
			case yang.LY_TYPE_INT64: ret = "uint64"; break;
			case yang.LY_TYPE_UINT64: ret = "uint64"; break;
			default: ret = "undefined";
		}

		console.log(xpath + ' ' + ret)
		resolve()
	})
}

function parse_yang() {
	return new Promise((resolve, reject) => {
		var fs = require('fs');
		var files = fs.readdirSync(config.remote_yang_dir);

		ctx = yang.ly_ctx_new(config.remote_yang_dir)
		for (var i in files) {
			mod = yang.lys_parse_path(ctx, config.remote_yang_dir + files[i], yang.LYS_IN_YANG);
		}
		return resolve()
	})
}

function get_type(xpath) {
	return new Promise((resolve, reject) => {

		config_file = xpath.split(/[:,\/]+/)[1]

		var node = yang.lyd_parse_path(ctx, config_folder + '/' + config_file + '.xml', yang.LYD_XML, yang.LYD_OPT_CONFIG);

		var set = yang.lyd_get_node(node, xpath);

		if (set) {
			var lyd = yang.get_lyd_node(set.set.d)
			if (lyd) {
				var lyd_leaf = yang.cast_lyd_node_leaf_list(lyd)

				if (lyd_leaf) {
					get_xpath(lyd, lyd_leaf.value_type)
				}
			}
		}

		return resolve()
	})
}

netconf_client.create().then(function(client)
{

        client.send_get().thenDefault(function(reply)
        {
		// cretae folder for netconf config data
		config_folder = "/tmp/testconf_configs_" + randomfolder()

		var xmlDoc = libxmljs.parseXml(reply);
		var configs = xmlDoc.root().childNodes()[0].childNodes()

		var result = []
		return Promise.all(configs.map(function (element) {
			namespace = element.namespace().href().split(/[:,\/]+/).pop()
			element = libxmljs.parseXml(element.toString().replace(/\sxmlns[^"]+"[^"]+"/g, '')).root()

			if (ignore.indexOf(element.name()) < 0) {
				iterate_xpaths(element, namespace, result)
			}
		})).then(function (resolve, reject) {

			// create folder
			if (!fs.existsSync(config_folder)){
				fs.mkdirSync(config_folder);
			}

			return exec('node ./download_configs.js ' + config_folder + '/ running')
			.then(function (result) {
			})
			.catch(function (err) {
			console.error('ERROR: ', err);
			});
		}).then(function (resolve, reject) {
			return parse_yang()
		}).then(function (resolve, reject) {
			return Promise.all(result.map(function (xpath) {
				return get_type(xpath)
			}))
		}).then(function (resolve, reject) {
			client.send_get()
		}).then(function (resolve, reject) {
			process.exit(0)
		}).catch(function (err) {
			console.error('ERROR: ', err);
		})
        })
})

