require('dotenv').config();
const dotenv = require('dotenv');
const AsteriskManager = require('asterisk-manager');
const { excludeAdvisors, queue, members, searchPrefijo } = require('./utils/querys');
const { findQueuesForMember, findIdForQueue, findPrefijo, removePrefix, selectQuery } = require('./utils/functions');
const { executeQuery } = require('./db/database');
const { history_call } = require('./model/historycall_model');
const { history_user_call } = require('./model/historyUserCall_model');
const { handleCall2 } = require('./utils/functionsCountsCalls');
const { commandEvent } = require('./utils/useSocket');
dotenv.config({ path: '.env' });

const hostAMI = process.env.HOSTAMI;
const usuario = process.env.USENAME;
const clave = process.env.PASSLOCK;

const ami = new AsteriskManager(5038, hostAMI, usuario, clave, true);
const client = new AsteriskManager(5038, hostAMI, usuario, clave, true);
const event = new AsteriskManager(5038, hostAMI, usuario, clave, true);

ami.setMaxListeners(1050);
client.setMaxListeners(1050);
event.setMaxListeners(1050);

ami.on('connect', () => console.log('Conectado a Asterisk'));
client.on('connect', () => console.log('Conectado a Asterisk'));
event.on('connect', () => console.log('Conectado a Asterisk'));

ami.on('error', (err) => console.log('Error: ', err));
client.on('error', (err) => console.log('Error: ', err));
event.on('error', (err) => console.log('Error: ', err));

ami.on('disconnect', () => console.log('Desconectado de Asterisk'));
client.on('disconnect', () => console.log('Desconectado de Asterisk'));
event.on('disconnect', () => console.log('Desconectado de Asterisk'));

let excludeAdvisorsArray = [];
let arregloDidQueue = [];
let membersQueue = [];
let usersPrefijo = [];

const lastDialTimes = {};
let numberId = [];
let ActionsArray = [];
let arrayFirstType = [];

let extensionState = {};
const callAttempts = {};
const timechannel = {};
const handledEvents = {};

let lastCallAttemptTime = {};

async function dialNumber(asesor, didIds, prefijo, endpoint, recursionCount = 1) {
    try {
        console.log(`dialNumber ejecutado por ${asesor}, didId: ${didIds}`);
        let found = false;
        let rowsFound = false;
        let i = 0;

        while (!found && i < didIds.length) {

            if (extensionState[asesor] !== 'NOT_INUSE') {
                console.log(`Asesor ${asesor} ya no está libre. Estado actual: ${extensionState[asesor]}`);
                return;
            }

            const selectRows = await executeQuery(selectQuery, [didIds[i]]);

            if (selectRows.length > 0) {
                rowsFound = true; // Se encontraron filas
                lastCallAttemptTime[asesor] = Date.now();
                const numero = parseInt(selectRows[0].number);
                const id = selectRows[0].id;
                const did = selectRows[0].did;
                const marcaciones_asesor = selectRows[0].marcaciones_asesor;
                const firtsCalltype = selectRows[0].firtsCalltype !== undefined ? selectRows[0].firtsCalltype : null;

                const currentTime = Date.now();
                const lastDialTime = lastDialTimes[numero] || 0;
                const timeSinceLastDial = currentTime - lastDialTime;

                if (timeSinceLastDial >= 3000) {
                    found = true;
                    lastDialTimes[numero] = currentTime;

                    executeQuery('UPDATE call_me SET attempts = attempts + 1, on_call = 1, updatedAt = UTC_TIMESTAMP(), state_client = "", state_agent = "" WHERE id = ?', [id]);

                    const numbersInCall = numberId.some(i => i.id === id && i.numero === numero);
                    if (!numbersInCall) {
                        numberId.push({ id, numero, did });
                    }

                    const existsFirts = arrayFirstType.some(i => i.id === id && i.firtsCalltype === firtsCalltype && i.numero === numero && i.did === did);
                    if (!existsFirts) {
                        arrayFirstType.push({ id, firtsCalltype, numero, did })
                    }

                    const exists = ActionsArray.some(item => item.numero === numero && item.did === did);
                    if (!exists) {
                        ActionsArray.push({ numero, did });
                    }

                    const didObj = arregloDidQueue.find(i => i.did === did);

                    ami.action({
                        'action': 'Originate',
                        'channel': `PJSIP/${prefijo}${numero}@${endpoint}`,
                        'context': 'todo',
                        'exten': `${did}`,
                        'priority': '1',
                        'callerid': `<${numero}>`,
                        'timeout': '25000',
                        'async': 'yes'
                    }, async function (err, res) {
                        console.log(`\n--------------------------------------------------------\nNumero: ${numero}\nEjecutado por: ${asesor}\nCola: ${didObj.queueString}\n--------------------------------------------------------`);
                            
                        ami.on('managerevent', async function(evt){
                            if (evt.event === 'OriginateResponse') {
                                const eventKey = `${evt.actionid}-${evt.channel}-${evt.calleridnum}`;
                                    
                                if (!handledEvents[eventKey]) {
                                    handledEvents[eventKey] = true;

                                    const number_client_raw = evt.calleridnum;
                                    const numeroActualizar = removePrefix(number_client_raw);
                                    const searchId = numberId.find(i => i.numero === parseInt(numeroActualizar));
                            
                                    if (searchId) {
                                        const id = searchId.id;
                                        const number = searchId.numero;
                                
                                        if (evt.response === 'Success') {
                                            executeQuery('UPDATE call_me SET state_client = "Contesto" WHERE id = ?', [id]);
                                            console.log("ID: ", id + ' | Cliente Contesto: ', number + '\n');

                                        } else if (evt.response === 'Failure') {
                                            executeQuery('UPDATE call_me SET state_client = "No Contesto", on_call = 0 WHERE id = ?', [id]);
                                            console.log("ID: ", id + ' | Cliente No Contesto: ', number +"\n");
                                                
                                            // if (marcaciones_asesor === 1) {
                                            //     callAttempts[asesor] = setTimeout(() => {
                                            //         if (extensionState[extension] === 'NOT_INUSE' && Date.now() - (lastCallAttemptTime[extension] || 0) > 3000) {
                                            //             console.log(`${asesor} sigue libre, Volviendo a intentando.`);
                                            //             dialNumber(asesor, didIds, prefijo, endpoint);
                                            //         }
                                            //     }, 3000); 
                                            // }
                                        }
                                    }
                                }
                            }
                        });
                    });

                    if (recursionCount < parseInt(marcaciones_asesor)) {
                        await dialNumber(asesor, didIds, prefijo, endpoint, recursionCount + 1);
                    }

                    break;
                }
            } 
            i++;
        }

        // Si no se encontraron filas, volver a intentar después de un tiempo
        if (!rowsFound) {
            setTimeout(() => {
                if (extensionState[asesor] === 'NOT_INUSE' && Date.now() - (lastCallAttemptTime[asesor] || 0) > 3500) {
                    console.log(`Reintentando dialNumber para ${asesor} después de no encontrar filas.`);
                    dialNumber(asesor, didIds, prefijo, endpoint);
                }
            }, 2500);
        }

    } catch (error) {
        console.error('Error en dialNumber: ', error);
    }
}

const deviceRegex = /^PJSIP\/\d+$/;
let ActionsArrayString = ActionsArray.map(obj => `{ numero: ${obj.numero}, did: ${obj.did} }`).join(', ');

ami.on('managerevent', async function(evt) {
    if (evt.event === 'DeviceStateChange' && deviceRegex.test(evt.device) || evt.event === 'UserEvent' && evt.eventstring === 'UserUpdateState' || evt.event === 'UserEvent' && evt.eventstring === 'DeviceStateChange') {

        const extensionMatch = /PJSIP\/(\d+)/.exec(evt.device);
        const stateExtension = evt.state;
        if (extensionMatch) {
            const extension = extensionMatch[1].trim();
    
            if (!excludeAdvisorsArray.includes(extension)) {
                if (extensionState[extension] !== stateExtension) {
                    if (evt.event === 'DeviceStateChange' && stateExtension !== 'NOT_INUSE') {
                        extensionState[extension] = stateExtension;
                        // console.log('Asesor no está libre: ', extension + ' Estado: ', stateExtension);
                        clearTimeout(callAttempts[extension]);
    
                    } else if (evt.event === 'UserEvent' && evt.eventstring === 'UserUpdateState') {
                        if (stateExtension === 'NOT_INUSE') {
                            extensionState[extension] = stateExtension;
                            console.log('Asesor Libre: ', extension + ' Estado: ', stateExtension);
    
                            const queues = findQueuesForMember(membersQueue, extension);
                            if (!queues) {
                                return;
                            }
    
                            let callmeIds = queues
                                .filter(queue => queue.includes('Callme'))
                                .map(queue => findIdForQueue(arregloDidQueue, queue))
                                .filter(id => id !== null);
    
                            let otherIds = queues
                                .filter(queue => !queue.includes('Callme'))
                                .map(queue => findIdForQueue(arregloDidQueue, queue))
                                .filter(id => id !== null);
    
                            let ids = [...callmeIds, ...otherIds];
                            const prefijos = findPrefijo(usersPrefijo, extension);
                            const currentTime = Date.now();

                            if (!lastCallAttemptTime[extension] || (currentTime - lastCallAttemptTime[extension] > 5000)) {
                                lastCallAttemptTime[extension] = currentTime;
                                dialNumber(extension, ids, prefijos.prefijo, prefijos.endpoint);
    
                                callAttempts[extension] = setTimeout(() => {
                                    if (extensionState[extension] === 'NOT_INUSE' && Date.now() - lastCallAttemptTime[extension] > 22000) {
                                        lastCallAttemptTime[extension] = Date.now();
                                        console.log(`${extension} sigue libre, Volviendo a intentar.`);
                                        dialNumber(extension, ids, prefijos.prefijo, prefijos.endpoint);
                                    }
                                }, 22000);
                            }
                            
                        } else {
                            extensionState[extension] = stateExtension;
                            // console.log('Asesor no está libre: ', extension + ' Estado: ', stateExtension);
                            clearTimeout(callAttempts[extension]);
                        }
                    }
                }
            }
        }      
    } else if (evt.event === 'DialEnd') {
        const isDifferentFromAll = !ActionsArray.some(i => i.numero === parseInt(evt.destcalleridnum));
        const isConnectedLineNum = ActionsArray.some(i => i.numero === parseInt(evt.destconnectedlinenum));

        if (isDifferentFromAll && isConnectedLineNum) {
            const number_client_raw = evt.destconnectedlinenum;
            const numeroActualizar = removePrefix(number_client_raw);

            const searchId = numberId.find(i => i.numero === parseInt(numeroActualizar));
            if (searchId) {
                const id = searchId.id;
                const number = searchId.numero;

                if (evt.dialstatus && evt.dialstatus === 'ANSWER') {
                    executeQuery('UPDATE call_me SET state_agent = "Contesto", connected_call = 1, on_call = 0 WHERE id = ?', [id]);
                    console.log("ID: ", id + ' | Asesor Contesto a: ', number);

                    ActionsArray = ActionsArray.filter(obj => obj.numero !== numeroActualizar);
                    ActionsArrayString = ActionsArray.map(obj => `{ numero: ${obj.numero}, did: ${obj.did} }`).join(', ');
                    numberId = numberId.filter(i => i.numero !== parseInt(numeroActualizar));
                    
                } else if (evt.dialstatus && evt.dialstatus !== 'ANSWER') {
                    executeQuery('UPDATE call_me SET state_agent = "No Contesto" WHERE id = ?', [id]);
                }
            }

        }
    } else if (evt.event === 'Hangup') {
        const hangupChannel = evt.channel;
        const isDifferentFromAll = !ActionsArray.some(obj => obj.numero === parseInt(evt.connectedlinenum));
        const isCallerIDNum = ActionsArray.some(obj => obj.numero === parseInt(evt.calleridnum));
        const isConnectedLineNum = ActionsArray.some(obj => obj.numero === parseInt(evt.connectedlinenum));

        if (timechannel[hangupChannel]) {
            const currentTime = new Date();
                currentTime.setHours(currentTime.getHours() + 5);
            const currentTimeMs = currentTime.getTime();
            const dialEndEventTime = timechannel[hangupChannel].dialEndEventTime;
            const durationMs = currentTimeMs - dialEndEventTime;
            const updatedBillSec = Math.floor(durationMs);

            history_call.update({
                billsec: updatedBillSec,
                hangup: true,
            }, { where: { channel: hangupChannel } }).then(() => {
                console.log('update duration call in channel: ', hangupChannel);
            }).catch(err => {
                console.error('Error in update duration call: ', err);
            });
            timechannel[hangupChannel].hangupEventTime = currentTime.getTime();
            delete timechannel[hangupChannel];
        }

        if (evt.channelstatedesc && evt.channelstatedesc === 'Up') {
            if (isDifferentFromAll && isCallerIDNum || isConnectedLineNum && isCallerIDNum) {
                const number_client_raw = evt.calleridnum;
                const numeroActualizar = removePrefix(number_client_raw);
                const searchId = numberId.find(i => i.numero === parseInt(numeroActualizar));
    
                if (searchId) {
                    const id = searchId.id;
                    const number = searchId.numero;
    
                    executeQuery('UPDATE call_me SET state_agent = "No Contesto", connected_call = 0, on_call = 0 WHERE id = ?', [id]);
                    console.log(`\nFin llamada | Asesor Contesto | numero: ${number} id: ${id}`);

                    ActionsArray = ActionsArray.filter(obj => obj.numero !== parseInt(numeroActualizar));
                    ActionsArrayString = ActionsArray.map(obj => `{ numero: ${obj.numero}, did: ${obj.did} }`).join(', ');
                    numberId = numberId.filter(i => i.numero !== parseInt(numeroActualizar));
                }
            }
        } 
        
        if (evt.channelstatedesc && evt.channelstatedesc === 'Ringing' || evt.channelstatedesc === 'Down') {
            if (isCallerIDNum && isConnectedLineNum) {
                const channel = evt.channel;
                const number_client_raw = evt.calleridnum;
                const number_client = removePrefix(number_client_raw);
                const didActionObj = ActionsArray.find(obj => obj.did && obj.numero === parseInt(number_client));

                if (didActionObj) {
                    const didAssociated = didActionObj.did;
                    const calltypeObj = arregloDidQueue.find(obj => obj.did === didAssociated);

                    const firtsCalltypeObj = arrayFirstType.find(i => i.numero === parseInt(number_client) && i.did === didAssociated);
                    const firtsCalltype = firtsCalltypeObj.firtsCalltype !== undefined ? firtsCalltypeObj.firtsCalltype: null;

                    const calltype = calltypeObj.queueString;
                    console.log('\n\rEl numero: ', didActionObj.numero + ' Con did: ', didActionObj.did + ' es de: ', calltype);
                    const uniqueid = evt.niqueid || evt.linkedid
                    const rec = `${uniqueid}-${number_client}.mp3`;
                    const createdAt = new Date();
                    createdAt.setHours(createdAt.getHours() + 5);

                    const existsCall = await history_call.findOne({ where: {uniqueid} });
        
                    if (existsCall) {
                        history_user_call.create({
                            dial_status: 'HANGUP',
                            state_client: 'No Contesto',
                            state_agent: '',
                            agent: '',
                            id_agent: 0,
                            number_client,
                            historyCallId: existsCall.id,
                            dst_channel: '',
                        }).then(() => {
                            console.log('client not answer add call in huc');
                        }).catch((error) => {
                            console.log('Error in client not answer add huc: ', error);
                        });
                    } else {
                        history_call.create({
                            firtsCalltype: firtsCalltype ? firtsCalltype : calltype,
                            calltype,
                            channel,
                            billsec: 0,
                            uniqueid,
                            rec
                        }).then((existsCall) => {
                            console.log('client not answer add call in hc con id: ', existsCall.id);
                            
                            history_user_call.create({
                                dial_status: 'HANGUP',
                                state_client: 'No Contesto',
                                state_agent: '',
                                agent: '',
                                id_agent: 0,
                                number_client,
                                historyCallId: existsCall.id,
                                dst_channel: '',
                            }).then(() => {
                                console.log('client not answer add call in huc');
                            }).catch((error) => {
                                console.log('Error in client not answer add huc: ', error);
                            });
                        
                        }).catch((error) => {
                            console.log('Error in client not answer add hc: ', error);
                        })
                    }  

                    ActionsArray = ActionsArray.filter(obj => obj.numero !== parseInt(number_client));          
                    ActionsArrayString = ActionsArray.map(obj => `{ numero: ${obj.numero}, did: ${obj.did} }`).join(', ');
                    numberId = numberId.filter(i => i.numero !== parseInt(number_client));
                    arrayFirstType = arrayFirstType.filter(i => i.numero !== parseInt(number_client))
                }
            } 
        }

    } if (evt.event === 'AgentConnect' || evt.event === 'AgentRingNoAnswer') {
        if (evt.queue && evt.queue.includes('Perdidas')) {
            const calltype = evt.queue || 'No llego';
            const Channel = evt.channel;
            const dst_channel = evt.destchannel;
            const uniqueid = evt.uniqueid || evt.linkedid;
            const createdAt = new Date();
                createdAt.setHours(createdAt.getHours() + 5);
            
            const agent = evt.connectedlinename;
            const id_agent = evt.connectedlinenum;
            const number_client_raw = evt.calleridnum;
            const number_client = removePrefix(number_client_raw);
    
            let InicialCola;
            const foundFirst = arrayFirstType.find(i => i.numero === parseInt(number_client));
    
            if (foundFirst && foundFirst.firtsCalltype !== undefined) {
                InicialCola = foundFirst.firtsCalltype;
            }
            
            let eventstring, DialStatus, state_client, state_agent;
            if (evt.event === 'AgentConnect') {
                eventstring = 'UserAnswerCall';
                DialStatus = 'ANSWER';
                state_client = 'Contesto';
                state_agent = 'Contesto';
                await handleCall2(evt, calltype);
    
                commandEvent(eventstring, id_agent, number_client, Channel, calltype);
    
            } else if (evt.event === 'AgentRingNoAnswer') {
                DialStatus = 'NOANSWER';
                state_client = 'Contesto';
                state_agent = 'No Contesto';
            }
    
            timechannel[Channel] = {
                dialEndEventTime: createdAt.getTime(),
                hangupEventTime: 0
            };
    
            const existsCall = await history_call.findOne({ where: {uniqueid} });
            const rec = `${uniqueid}-${number_client}.mp3`;
    
            if (existsCall) {
                history_user_call.create({
                    dial_status: DialStatus,
                    state_client,
                    state_agent,
                    agent,
                    id_agent,
                    number_client,
                    historyCallId: existsCall.id,
                    dst_channel,
                }).then(() => {
                    console.log('add call in huc');
                }).catch((error) => {
                    console.log('Error in add huc: ', error);
                });
            } else {
                history_call.create({
                    firtsCalltype: InicialCola ? InicialCola : calltype,
                    calltype,
                    channel: Channel,
                    billsec: 0,
                    uniqueid,
                    rec
                }).then((existsCall) => {
                    console.log('add call in hc con id: ', existsCall.id);
                    
                    history_user_call.create({
                        dial_status: DialStatus,
                        state_client,
                        state_agent,
                        agent,
                        id_agent,
                        number_client,
                        historyCallId: existsCall.id,
                        dst_channel,
                    }).then(() => {
                        console.log('add call in huc');
                    }).catch((error) => {
                        console.log('Error in add huc: ', error);
                    });
                
                }).catch((error) => {
                    console.log('Error in add hc: ', error);
                })
            }
        }
    }
});

function updateData() {
    excludeAdvisors(excludeAdvisorsArray)
        .then(returnAdvisors => {excludeAdvisorsArray = returnAdvisors})
        .catch(error => {console.error('Error al excluir asesores:', error)});

    queue(arregloDidQueue)
        .then(returnQueue => {arregloDidQueue = returnQueue})
        .catch(error => {console.error('Error al obtener las colas: ', error)});
}
updateData();
setInterval(updateData, 500000);

members(membersQueue)
    .then(returnMembers => {membersQueue = returnMembers})
    .catch(error => {console.error('Error al obtener members: ', error)});

searchPrefijo(usersPrefijo)
    .then(returnPrefijo => {usersPrefijo = returnPrefijo})
    .catch(error => {console.error('Error al obtener prefijos: ', error)});

setInterval(() => {
    const currentTime = Date.now();
    for (const key in handledEvents) {
        if (currentTime - handledEvents[key] > 60000) { 
            delete handledEvents[key];
        }
    }
}, 60000);