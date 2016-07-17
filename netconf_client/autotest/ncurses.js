var Promise = require('promise');
var blessed = require('blessed');
var fs = require('fs');
var exec = require('child-process-promise').exec;
var config = require('../../core/config')
config.show_logs = false

var prev = {}

function dfs(path) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var cur_path = path + "/" + file;
			if(fs.lstatSync(cur_path).isDirectory()) dfs(cur_path);
			else fs.unlinkSync(cur_path);
		});
		fs.rmdirSync(path);
	}
};

function download_server_schemas() {
	return exec('node ./download_schemas.js')
	.then(function (result) {
		return run()
	})
	.catch(function (err) {
		console.error('ERROR: ', err);
	});

}

function check_schemas(path) {
	return new Promise(function(resolve, reject) {
	return fs.open(path,'r',function(err,fd){
		if (err && err.code=='ENOENT') {
			fs.mkdirSync(path);
			return download_server_schemas()
		} else {
			dfs(path)
			fs.mkdirSync(path);
			return download_server_schemas()
		}
	});
	})
}


function run() {
	return exec('node ./list_values.js')
	.then(function (result) {
		res = result.stdout.slice(0, -2)
		data = '{' + res + '}'

		js = JSON.parse(data);

		var screen = blessed.screen({
			autoPadding: true,
			smartCSR: true
		});

		var items = 0
		var texts = Object.keys(js).forEach(function(key,index){
			prev[key] = js[key]
			items++;
		})

		var form = blessed.form({
			parent: screen,
			width: 120,
			height: items,
			keys: true
		});
		var texts = Object.keys(js).forEach(function(key,index){

			blessed.text({
				parent: form,
				top: index,
				content: key + ':',
				fg:'green'
			})
			blessed.textbox({
				parent: form,
				inputOnFocus: true,
				name: key,
				value: js[key],
				top: index,
				left: key.length + 2
			})
		})

		form.on('submit', function(data){

		var new_data = JSON.stringify(data)
		var convertedObjects = JSON.stringify(data);
		js = JSON.parse(convertedObjects);
		Object.keys(js).forEach(function(key,index){
			if (prev[key] != data[key]) {
				//console.log('node ./set_xpath.js "' + key + '" ' + data[key])
				return exec('node ./set_xpath.js "' + key + '" "' + data[key] + '"')
				.then(function (result) {
					prev[key] = data[key]
				})
				.catch(function (err) {
					console.error('ERROR: ', err);
				});
			};
		})

		screen.render();
		})
		screen.key(['enter'], function(){
			form.submit();
		});

		screen.key(['escape','C-c'], function(){
			screen.leave();
			process.exit(0);
		});

		screen.render();

})
}

Promise.resolve(check_schemas(config.remote_yang_dir))
