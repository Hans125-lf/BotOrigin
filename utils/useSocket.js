require('dotenv').config();
const ioClient = require('socket.io-client');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL;
const socket = ioClient.connect(SOCKET_SERVER_URL);

socket.on('connect', () => {
    console.log('Conectado al servidor de sockets');
  });
  
  socket.on('disconnect', () => {
    console.log('Desconectado del servidor de sockets');
  });

function commandEventCalls(eventstring, Queue, Channel, CallerIDNum) {
    const actionId = Math.random().toString(36).substring(7);
  
    socket.emit(eventstring, {
      Queue: Queue,
      Channel: Channel,
      CallerIDNum: CallerIDNum,
      ActionID: actionId,
    })
  
    const commands = [
      `Action: UserEvent\nEventString: ${eventstring}\nQueue: ${Queue}\nChannel: ${Channel}\nCallerIDNum: ${CallerIDNum}\nAsync: yes\nActionID: ${actionId}\n\n`
    ];
    return  commands;
  }

  function commandOriginate(numero, did, prefijo, endpoint) {
    const actionId = Math.random().toString(36).substring(7);
  
    const commands = [
      `Action: Originate\nChannel:PJSIP/${prefijo}${numero}@${endpoint}\nContext:todo\nExten:${did}\nPriority:1\nCallerID:"<${numero}>"\nTimeout:25000\nAsync: yes\nActionID: ${actionId}\n\n`
    ];
    return  commands;
}
  
function Logoff() {
    const commandsoff = [
      `Action: Logoff\nActionID:1\n\n`
    ];
    return  commandsoff;
}

function commandEvent(eventstring, num_ase, num_cli, channels, calltypes) {
    const actionId = Math.random().toString(36).substring(7);
  
    socket.emit(eventstring, {
      Extension: num_ase,
      ClientNum: num_cli,
      Channel: channels,
      CallType: calltypes,
      ActionID: actionId,
    });
  
    const commands = [
      `Action: UserEvent\nEventString: ${eventstring}\nExtension: ${num_ase}\nClientNum: ${num_cli}\nChannel: ${channels}\nCallType: ${calltypes}\nAsync: yes\nActionID: ${actionId}\n\n`
    ];
    return  commands;
  }

function sendUserUpdateStateEvent(ami, extension) {
  ami.action({
        'action': 'UserEvent',
        'EventString': 'UserUpdateState',
        'Device': `PJSIP/${extension}`,
        'State': 'NOT_INUSE',
        'StateName': 'En Línea'
  });
}

module.exports = { commandEventCalls, commandOriginate, Logoff, commandEvent, sendUserUpdateStateEvent };