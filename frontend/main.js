const SIGNALING_SERVER_URL = 'http://localhost:5000';
const PC_CONFIG = {};

let socket = io(SIGNALING_SERVER_URL, { autoConnect: true });

socket.on('connected', () => {
    data = {'role': 'viewer', 'room_id': '123'};
    socket.emit('join', data);
});

socket.on('ready', () => {
    console.log('Ready');
});
