const axios = require('axios');
const btoa = require('btoa');

class Traccar{
	constructor(url){
		this.instance = axios.create({
  			baseURL: url,
  			timeout: 30000,
  			withCredentials: true,
  			validateStatus: function (status) {
    				return status < 300; // Resolve only if the status code is less than 500
  			}
		});
	}

	getSession(username,password){
		return new Promise((resolve,reject)=>{ 
			const params = new URLSearchParams();
      			params.append('email', username);
      			params.append('password', password);
      			params.append('undefined', 'false');

			this.instance.post('/api/session',params).then((r)=>{
				//var cookie = r.headers['set-cookie'];
				resolve(r.data);
			}).catch(()=>{ reject() });
		});
	}

	getDevices(username,password){
		var options = {};
		if(password==undefined){
			options = {headers: {Cookie: username}}
		}else{
			options = {headers: {authorization: 'Basic ' + btoa(username+':'+password)}}
		}

		return new Promise((resolve,reject)=>{ 
			this.instance.get('/api/devices',options).then((r)=>{
				resolve(r.data);
			}).catch(()=>{ reject() });
		});

	}


	getPositions(deviceId,username,password){
		var options = {};
		if(password==undefined){
			options = {headers: {Cookie: username}}
		}else{
			options = {headers: {authorization: 'Basic ' + btoa(username+':'+password)}}
		}

		return new Promise((resolve,reject)=>{ 
			this.instance.get('/api/positions?deviceId='+deviceId,options).then((r)=>{
				resolve(r.data);
			}).catch(()=>{ reject() });
		});

	}

	waitFor(deviceId,maxTry,delay,resolver,username,password){
		return new Promise((resolve,reject)=>{
			var tryes = 0;
			var timer = setInterval(()=>{

				this.getPositions(deviceId,username,password).then((r)=>{

					if(resolver(r[0])){

						clearInterval(timer);
						resolve(r[0]);
					}else{

						tryes++;
						if(tryes>maxTry){
							clearInterval(timer);
							reject();
						}
					}

				}).catch(()=>{
					tryes++;
					if(tryes>maxTry){
						clearInterval(timer);
						reject();
					}
				});


			},delay);


		});
	}

	sendCommand(deviceId,command,username,password){

		var options = {};
		if(password==undefined){
			options = {headers: {Cookie: username}}
		}else{
			options = {headers: {authorization: 'Basic ' + btoa(username+':'+password)}}
		}

		var data = {"id":0,"description":"Novo...","deviceId":deviceId,"type":command,"textChannel":false,"attributes":{}};

		return new Promise((resolve,reject)=>{
			this.instance.post('/api/commands/send?deviceId='+deviceId,data,options).then((r)=>{
				resolve(r.data);
			}).catch((r)=>{ console.log(r); reject() });
		});
	}

}


module.exports = Traccar;