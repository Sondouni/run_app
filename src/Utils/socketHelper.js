import {io} from 'socket.io-client';

const socket = io('http://172.30.1.35:8080');

export default socket;
