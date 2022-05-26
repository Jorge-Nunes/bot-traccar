
const venom = require('venom-bot');

const btoa = require('btoa');
const TraccarConnector = require('./libs/traccar');
const StorageLib = require('./libs/storage.js');

var Storage = new StorageLib();


var Traccar = new TraccarConnector('http://sniper5.lokaliza.tk');

const express = require('express');

const bodyParser = require('body-parser');
const app = express()
const port = 3000;

var lastQrCode = false;
var qrStatus = false;
var authed = '';
var mainClient = false;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/login', (req, res) => {
	Traccar.getSession(req.body.username,req.body.password).then((r)=> {
		if(r.administrator) {

			authed = btoa(req.body.username + ':' + req.body.password);
			res.send(JSON.stringify({'success': true, cookie: btoa(req.body.username + ':' + req.body.password)}))
		}else{
			res.send(JSON.stringify({'success': false, cookie: false,msg: 'Esta conta não é administradora.'}))
		}
	}).catch(()=>{
		res.send(JSON.stringify({'success': false, cookie: false,msg: 'Nome de usuário ou senha incorreto.'}))
	});
});

app.get('/api/qrcode',(req,res)=>{
	if(authed===req.headers['authorization']) {
		res.send(JSON.stringify({success: qrStatus, qrcode: lastQrCode}));
	}else{
		res.send(JSON.stringify({success: false, qrcode: false}));
	}
});


app.get('/api/disconnect',(req,res)=>{
	if(authed===req.headers['authorization']) {

		mainClient.logout();
		res.send(JSON.stringify({success: true}));
	}else{
		res.send(JSON.stringify({success: false, qrcode: false}));
	}
});


app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})



var messages = {
	welcome: 'Olá, seja bem vindo!',
	unregistered: 'Bom, para continuar, eu preciso que me ajude a confirmar alguns dados.',
	insert_username: 'Primeiro, me diga o seu e-mail ou nome de usuário, o mesmo que você usa para acessar o nosso painel de rastreamento.',
	insert_password: 'Ótimo, agora me diga a sua senha.',
	check_auth: 'Por favor, aguarde enquanto eu verifico seus dados. Logo te dou um retorno!',
	auth_success: 'Perfeito, agora eu já posso executar algumas ações relacionadas aos seus veiculos.',
	auth_error: 'Desculpe, mas não encontrei a sua combinação de usuário e senha em nosso banco de dados. Vamos tentar novamente...',
	load_error: 'Desculpe, nosso sistema está temporariamente indisponível.',
	valid_commands: "Você pode me pedir para:\n🚘 listar veiculos\n📍 localizar veiculo\n🛑 bloquear veiculo\n✅ desbloquear veiculo",
	list_head: 'Seus veiculos são:',
	list_helper: 'Você também pode me enviar apenas o emoji 🚘 ou simplesmente digitar *veiculos*',
	locate_helper: 'Você também pode me enviar apenas o emoji 📍 <VEICULO> ou simplesmente digitar *localizar <VEICULO>*\nNão esqueça de substituir <VEICULO> pelo nome do veiculo que deseja localizar.',
	locate_wrong: 'Você precisa me dizer qual veiculo deseja localizar. Por exemplo: \nlocalizar celta',
	locate_notfound: 'Não encontrei o veiculo que você estava procurando.',
	block_wrong: 'Você precisa me dizer qual veiculo deseja bloquear. Por exemplo: \nbloquear celta',
	block_send: 'Já solicitei o bloqueio de seu veiculo! Assim que eu tiver uma confirmação eu te aviso.',
	block_confirm: 'Seu veiculo foi bloqueado com sucesso.',
	block_error: 'Desculpe, não consegui confirmar se o seu veiculo foi bloqueado, você pode tentar novamente.',
	block_helper: '\'Você também pode me enviar apenas o emoji 🛑 <VEICULO> ou simplesmente digitar *bloquear <VEICULO>*\\nNão esqueça de substituir <VEICULO> pelo nome do veiculo que deseja localizar.\'',
	block_notfound: 'Não encontrei o veiculo que você estava procurando.',
	unblock_wrong: 'Você precisa me dizer qual veiculo deseja desbloquear. Por exemplo: \ndesbloquear celta',
	unblock_send: 'Já solicitei o desbloqueio de seu veiculo! Assim que eu tiver uma confirmação eu te aviso.',
	unblock_confirm: 'Seu veiculo foi desbloqueado com sucesso.',
	unblock_error: 'Desculpe, não consegui confirmar se o seu veiculo foi desbloqueado, você pode tentar novamente.',
	unblock_helper: '\'Você também pode me enviar apenas o emoji ✅ <VEICULO> ou simplesmente digitar *desbloquear <VEICULO>*\\nNão esqueça de substituir <VEICULO> pelo nome do veiculo que deseja localizar.\'',
	unblock_notfound: 'Não encontrei o veiculo que você estava procurando.',
}


var clients = {};




venom.create('Traccar',
	(base64Qr, asciiQR, attempts, urlCode) => {
		console.log(asciiQR); // Optional to log the QR in the terminal
		lastQrCode = base64Qr;
	},
	(statusSession, session) => {
		qrStatus = statusSession;
	},
	{logQR: false}).then((client) => {

		mainClient = client;

	function sendDelayed(to,message){
		return new Promise((resolve,reject)=> {
			client.startTyping(to);
			var time = 300 + (message.length * 25);

			setTimeout(() => {

				client.sendText(to, message).then((result) => {
					client.stopTyping(to);
					setTimeout(()=> {
						resolve(result);
					},100);
				}).catch(()=>{ reject() })
			}, time);
		});
	}

	client.onMessage((message) => {
		var msg = message.body.toLowerCase();
		var cmd = msg.split(" ");

		console.log(message);

		client.sendSeen(message.from);

		var valid = false;

		if(clients[message.from]){
			valid = true;
		}else if(Storage.contactExists(message.from)){
			valid = true;
			clients[message.from] = Storage.contactRead(message.from);

		}

		if(valid) {
			if(clients[message.from].method>0){
				switch(clients[message.from].method){
					case 1:{
						// register
						switch(clients[message.from].step){
							case 0:{
								clients[message.from].username = msg;
								clients[message.from].step = 1;
								sendDelayed(message.from, messages.insert_password).then((result) => {

								});
							}
							break;
							case 1:{
								clients[message.from].password = msg;
								clients[message.from].step = 2;
								sendDelayed(message.from, messages.check_auth).then((result) => { });

								Traccar.getSession(clients[message.from].username,clients[message.from].password).then((r)=>{

									clients[message.from].method = 0;
									clients[message.from].step = 0;

									Storage.contactWrite(message.from,clients[message.from]);

									sendDelayed(message.from, messages.auth_success).then((result) => {
										sendDelayed(message.from, messages.valid_commands).then((result) => {

										});
									});
								}).catch(()=>{
									sendDelayed(message.from, messages.auth_error).then((result) => {
										sendDelayed(message.from, messages.insert_username).then((result) => {
											clients[message.from] = {
												method: 1,
												step: 0,
												username: '',
												password: ''
											}
										})
									});
								});
							}
						}
					}

				}

			}else if (msg.substring(0,1) === '🚘' || msg.match('veiculos')) {

				Traccar.getDevices(clients[message.from].username,clients[message.from].password).then((devices)=>{

					let tmp = messages.list_head+'\n\n';
					devices.map((v)=>{
						tmp+='🚘 '+v.name+' \n';
					});

					sendDelayed(message.from, tmp).then((result) => {
						if(msg.match('listar')) {
							sendDelayed(message.from, messages.list_helper).then((result) => {});
						}
					});
				}).catch(()=>{
					sendDelayed(message.from, messages.load_error).then((result) => {});
				});
			}else if (msg.substring(0,1) === '📍' || msg.match('localizar')) {
				var placa = msg.replace('📍','').replace('localizar','').replace('veiculo','').trim();

				if(placa.length<3){
					sendDelayed(message.from, messages.locate_wrong).then((result) => {});
				}else {

					Traccar.getDevices(clients[message.from].username, clients[message.from].password).then((devices) => {

						let tmp = '';
						var device = devices.find((v) => {
							return (v.name.toLowerCase().match(placa));
						});

						if(device){
							Traccar.getPositions(device.id,clients[message.from].username, clients[message.from].password).then((position)=>{

								let pos = position[0];

								tmp+='🚘 '+device.name+'\n';
								tmp+='🔑 *Ignição:* '+((pos.attributes.ignition)?'Ligada':'Desligada')+'\n';
								tmp+='🛑 *Bloqueio:* '+((pos.attributes.blocked)?'Ativado':'Desativado')+'\n';
								tmp+='🏁 *Velocidade:* '+pos.speed+'\n';
								tmp+='📍 *Endereço:* '+pos.address+'\n';

								sendDelayed(message.from, tmp).then((result) => {
									client.sendLocation(message.from, pos.latitude, pos.longitude, pos.address).then((result) => {
										if (msg.match('veiculo')) {
											sendDelayed(message.from, messages.locate_helper).then((result) => {
											});
										}
									});
								});

							}).catch(()=>{
								sendDelayed(message.from, messages.load_error).then((result) => {});
							});


						}else{
							sendDelayed(message.from, messages.locate_notfound).then((result) => {
								if (msg.match('veiculo')) {
									sendDelayed(message.from, messages.locate_helper).then((result) => {
									});
								}
							});
						}

					}).catch(() => {
						sendDelayed(message.from, messages.load_error).then((result) => {
						});
					});
				}
			}else if (msg.substring(0,1) === '✅' || msg.match('desbloquear')) {
				var placa = msg.replace('✅','').replace('desbloquear','').replace('veiculo','').trim();

				if(placa.length<3){
					sendDelayed(message.from, messages.unblock_wrong).then((result) => {});
				}else {

					Traccar.getDevices(clients[message.from].username, clients[message.from].password).then((devices) => {

						let tmp = '';
						var device = devices.find((v) => {
							return (v.name.toLowerCase().match(placa));
						});

						if(device){
							Traccar.sendCommand(device.id,'engineResume',clients[message.from].username, clients[message.from].password).then((position)=>{


								sendDelayed(message.from, messages.unblock_send).then((result) => {
									if (msg.match('veiculo')) {
										sendDelayed(message.from, messages.unblock_helper).then((result) => {});
									}

									Traccar.waitFor(device.id,6,10000,(i)=>{
										return !(i.attributes['blocked']?(i.attributes['blocked']===true):false);
									},clients[message.from].username, clients[message.from].password).then((r)=>{
										sendDelayed(message.from, messages.unblock_confirm).then((result) => {

											let pos = r;

											tmp+='🚘 '+device.name+'\n';
											tmp+='🔑 *Ignição:* '+((pos.attributes.ignition)?'Ligada':'Desligada')+'\n';
											tmp+='✅ *Bloqueio:* '+((pos.attributes.blocked)?'Ativado':'Desativado')+'\n';
											tmp+='🏁 *Velocidade:* '+pos.speed+'\n';
											tmp+='📍 *Endereço:* '+pos.address+'\n';

											sendDelayed(message.from, tmp).then((result) => {
												client.sendLocation(message.from, pos.latitude, pos.longitude, pos.address).then((result) => {

												});
											});

										});
									}).catch(()=>{
										sendDelayed(message.from, messages.unblock_error).then((result) => {});
									});
								});

							}).catch(()=>{
								sendDelayed(message.from, messages.load_error).then((result) => {});
							});


						}else{
							sendDelayed(message.from, messages.unblock_notfound).then((result) => {
								if (msg.match('veiculo')) {
									sendDelayed(message.from, messages.unblock_helper).then((result) => {
									});
								}
							});
						}

					}).catch(() => {
						sendDelayed(message.from, messages.load_error).then((result) => {
						});
					});
				}
			}else if (msg.substring(0,1) === '🛑' || msg.match('bloquear')) {
				var placa = msg.replace('🛑','').replace('bloquear','').replace('veiculo','').trim();

				if(placa.length<3){
					sendDelayed(message.from, messages.block_wrong).then((result) => {});
				}else {

					Traccar.getDevices(clients[message.from].username, clients[message.from].password).then((devices) => {

						let tmp = '';
						var device = devices.find((v) => {
							return (v.name.toLowerCase().match(placa));
						});

						if(device){
							Traccar.sendCommand(device.id,'engineStop',clients[message.from].username, clients[message.from].password).then((position)=>{


								sendDelayed(message.from, messages.block_send).then((result) => {

									if (msg.match('veiculo')) {
										sendDelayed(message.from, messages.block_helper).then((result) => {});
									}


									Traccar.waitFor(device.id,6,10000,(i)=>{
										return (i.attributes['blocked']?(i.attributes['blocked']===true):false);
									},clients[message.from].username, clients[message.from].password).then((r)=>{
										sendDelayed(message.from, messages.block_confirm).then((result) => {

											let pos = r;

											tmp+='🚘 '+device.name+'\n';
											tmp+='🔑 *Ignição:* '+((pos.attributes.ignition)?'Ligada':'Desligada')+'\n';
											tmp+='🛑 *Bloqueio:* '+((pos.attributes.blocked)?'Ativado':'Desativado')+'\n';
											tmp+='🏁 *Velocidade:* '+pos.speed+'\n';
											tmp+='📍 *Endereço:* '+pos.address+'\n';

											sendDelayed(message.from, tmp).then((result) => {
												client.sendLocation(message.from, pos.latitude, pos.longitude, pos.address).then((result) => {

												});
											});

										});
									}).catch(()=>{
										sendDelayed(message.from, messages.block_error).then((result) => {});
									});
								});

							}).catch(()=>{
								sendDelayed(message.from, messages.load_error).then((result) => {});
							});


						}else{
							sendDelayed(message.from, messages.block_notfound).then((result) => {
								if (msg.match('veiculo')) {
									sendDelayed(message.from, messages.block_helper).then((result) => {
									});
								}
							});
						}

					}).catch(() => {
						sendDelayed(message.from, messages.load_error).then((result) => {
						});
					});
				}
			}else if (msg === 'oi' && message.isGroupMsg === false) {


				client.sendText(message.from, messages.welcome).then((result) => {
					console.log('Result: ', result); //return object success
				}).catch((erro) => {
					console.error('Error when sending: ', erro); //return object error
				});
			}
		}else{
			sendDelayed(message.from, messages.welcome).then((result) => {
				sendDelayed(message.from, messages.unregistered).then((result) => {
					sendDelayed(message.from, messages.insert_username).then((result) => {
						clients[message.from] = {
							method: 1,
							step: 0,
							username: '',
							password: ''
						}
					})
				})
			})

		}
	});

}).catch((erro) => {
	console.log(erro);
});




