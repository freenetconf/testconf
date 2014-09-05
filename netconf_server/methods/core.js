/*
 * Copyright (C) 2014 Cisco Systems, Inc.
 *
 * Author: Petar Koretic <petar.koretic@sartura.hr>
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

var fs = require('fs');
var path = require('path');
var json_path = require('JSONPath')
var config = require('../../core/config')
var debug = require('../../core/debug')
var netconf = require('../../core/netconf')

require('es6-shim')

var rpc_methods = {}

module.exports = rpc_methods

rpc_methods["get"] = function(oin, res)
{
	debug.write(JSON.stringify(oin))
	var data = {}

	var filters = oin["filter"] ? oin["filter"][0] : []

	if (oin["filter"])
	{
		for (f in filters)
		{
			debug.write("filter:" + f)

			var method = null
			try
			{
				// TODO: trigger reload when needed
				delete require.cache[__dirname + "/" + f + ".js"]
				method = require(config.server_methods_dir + f + ".js")
				method["get"].length
			}
			catch(e)
			{
				debug.write(e, true)

				return res(netconf.rpc_error("rcp method '" + f + "' not found ", "operation-not-supported"))
			}

			data[f] = { '$' : method["namespace"] }
			Object.assign(data[f], method["get"](filters[f]))
		}

		return res({'data' : data})
	}

	else
	fs.readdir(__dirname, function(error, files)
	{
		if (error)
			return res(netconf.rpc_error("rcp method '" + f + "' not found ", "operation-failed"))

		files.forEach(function(file)
		{
			if (file == "core.js")
				return

			var method = null
			try
			{
				// TODO: trigger reload when needed
				delete require.cache[__dirname + "/" + file]
				method = require(config.server_methods_dir + file)
				method["get"].length
			}
			catch(e)
			{
				debug.write(e, true)

				return res(netconf.rpc_error("rcp method '" + f + "' not found ", "operation-not-supported"))
			}

			var module = path.basename(file, ".js")

			data[module] = { '$' : method["namespace"] }
			Object.assign(data[module], method["get"]())
		})

		return res({'data' : data})
	})
}

rpc_methods["get-config"] = function(oin, res)
{
	debug.write(JSON.stringify(oin))
	var data = {}

	var filters = oin["filter"] ? oin["filter"][0] : []

	if (oin["filter"])
	{
		for (f in filters)
		{
			debug.write("filter:" + f)

			var method = null
			try
			{
				// TODO: trigger reload when needed
				delete require.cache[__dirname + "/" + f + ".js"]
				method = require(config.server_methods_dir + f + ".js")
				method["get-config"].length
			}
			catch(e)
			{
				debug.write(e, true)

				return res(netconf.rpc_error("rcp method '" + f + "' not found ", "operation-not-supported"))
			}

			data[f] = { '$' : method["namespace"] }
			Object.assign(data[f], method["get-config"](filters[f]))
		}

		return res({'data' : data})
	}

	else
	fs.readdir(__dirname, function(error, files)
	{
		if (error)
			return res(netconf.rpc_error("rcp method '" + f + "' not found ", "operation-failed"))

		files.forEach(function(file)
		{
			if (file == "core.js")
				return

			var method = null
			try
			{
				// TODO: trigger reload when needed
				delete require.cache[__dirname + "/" + file]
				method = require(config.server_methods_dir + file)
				method["get-config"].length
			}
			catch(e)
			{
				debug.write(e, true)

				return res(netconf.rpc_error("rcp method '" + f + "' not found ", "operation-not-supported"))
			}

			var module = path.basename(file, ".js")

			data[module] = { '$' : method["namespace"] }
			Object.assign(data[module], method["get-config"]())
		})

		return res({'data' : data})
	})
}

rpc_methods["edit-config"] = function(oin, res)
{
	var configs = oin["config"][0]
	for (c in configs)
	{
		var method = null
		try
		{
			// TODO: trigger reload when needed
			delete require.cache[__dirname + "/" + c + ".js"]
			method = require(config.server_methods_dir + c + ".js")["edit-config"]
			method["paths"].length
		}
		catch(e)
		{
			debug.write(e, true)

			return res(netconf.rpc_error("rcp method '" + c + "' not found ", "operation-not-supported"))
		}

		debug.write(JSON.stringify(configs[c]))

		method.paths.forEach(function(path)
		{
			var res = json_path.eval(configs[c], path.path)
			if (res.length && path.method)
			{
				var rc = path.method(res)
				if (rc.code)
					return res(netconf.rpc_error(rc.msg, "operation-failed"))
			}
		})
	}

	res({"ok" : ''})
}

rpc_methods["kill-session"] = function(oin, res)
{
	res({"ok" : ''})
}

rpc_methods["close-session"] = function(oin, res)
{
	res({"ok" : ''})
}

rpc_methods["lock"] = function(oin, res)
{
	res({"ok" : ''})
}

rpc_methods["unlock"] = function(oin, res)
{
	res({"ok" : ''})
}

rpc_methods["get-schema"] = function(oin, response)
{
	if (typeof oin.identifier === 'undefined')
		return self.emit('error', 'schema identifier missing')

	var file_name = config.yang_dir + oin.identifier
	var format = 'yang'

	if (typeof oin.version !== 'undefined')
		file_name += "@" + oin.version

	if (typeof oin.format !== 'undefined')
	{
		if (oin.format != 'yang')
			return self.emit('error', 'get-schema: only "yang" format supported')
	}

	file_name += "." + format

	fs.readFile(file_name, 'utf8', function(error, file) {
	if (error)
		return self.emit('error', error)

		var o_data = {"data" : {}}
		o_data.data['_'] = file
		o_data.data['$'] = { "xmlns": "urn:ietf:params:xml:ns:yang:ietf-netconf-monitoring"}

		response(o_data)
	});
}

