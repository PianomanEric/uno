/*

 */

const connectionContainer = require('../server/server');

const { io } = connectionContainer;

const debugPrinter = require('../util/debug_printer');
const dbEngineMessage = require('./db_engine_message');

io.on('connection', (socket) => {
    debugPrinter.printSuccess(`Client Socket 1: ${socket.id}`);

    socket.request.joseph = 'Joseph says hi';

    debugPrinter.printError(socket.request.joseph);

    // debugPrinter.printSuccess(socket.request);

    // socket.on('message', (message)=>{
    //     debugPrinter.printError(message)
    // })

    socket.emit('message', 'From Server'); // Client
    // socket.broadcast.emit('message', "Test") // Everyone but clietn
    // io.emit('message', "Test") // // all
});

// LOOKS LIKE .useExpressMiddleware ARE ALWAYS CALLED BEFORE ANY on is hit
io.use((socket, next) => {
    debugPrinter.printMiddleware('SOCKET MIDDLEWARE');
    next();
});

io.on('connection', (socket) => {
    debugPrinter.printSuccess(`Client Socket2 : ${socket.id}`);
    debugPrinter.printError(socket.request.joseph);
    debugPrinter.printError(socket.request.game);

    // debugPrinter.printDebug(socket.request.session.passport.user);
    debugPrinter.printDebug(socket.request.user);
    debugPrinter.printDebug(socket.request.url);
    debugPrinter.printDebug(socket.request.headers);
    debugPrinter.printDebug(socket.request.method);

    socket.on('temp', (string) => {
        debugPrinter.printDebug(string);
    });

    // socket.on('message', (message)=>{
    //     debugPrinter.printError(message)
    // })
});

async function socketHandlerMessage(socket) {
    debugPrinter.printMiddlewareSocketIO(socketHandlerMessage.name);

    /*
    THE BELOW VARIABLES MOST LIKELY CAME FROM EXPRESS MIDDLEWARE APPLIED TO THE
    SOCKET IO SERVER INSTANCE VIA io.use

    IF THE VARIABLES CAME FROM EXPRESS MIDDLEWARE THEN YOU CAN TREAT THEM SIMLAR TO
    HOW THEY ARE USED IN EXPRESS

     */
    const {
        user,
        game,
        player,
    } = socket.request;

    debugPrinter.printBackendYellow('#################################################################');
    debugPrinter.printBlue(user);
    debugPrinter.printBlue(game);
    debugPrinter.printBlue(player);
    debugPrinter.printBackendYellow('#################################################################');

    // If logged in
    if (user) {
        debugPrinter.printBackendCyan('USER');
        // If user is in a game, put them in a room based on game.game_id
        if (game) {
            debugPrinter.printBackendCyan('GAME');

            const room = game.game_id;

            socket.join(room);

            debugPrinter.printError(await io.in(room)
                .allSockets());

            socket.on('message', (message) => {
                // dbEngineMessage.createMessageRow(game.game_id, );

                // TODO ADD DB STUFF

                // socket.to(room)
                //     .emit(message);

                io.in(room)
                    .emit(message); // YOU WANT THIS ONE BECAUSE OF DB CALLS
            });
        } else {
            debugPrinter.printBackendCyan('NOT GAME');

            socket.on('message', (message) => {
                // dbEngineMessage.createMessageRow(game.game_id, );
                debugPrinter.printError(message);
                // TODO ADD DB STUFF

                // socket.to(room)
                //     .emit(message);

                io.emit(message); // YOU WANT THIS ONE BECAUSE OF DB CALLS
            });
        }

        // // make socket join room
        // socket.on('join-room', () => {
        //     // Join room based on their referer url
        //     socket.join(room);
        //
        //     debugPrinter.printSuccess(`${socket.id} joined room: ${room}`);
        //
        //     // callback(`${socket.id} join room: ${room}`);
        // });
    } else {

    }
}

io.on('connection', socketHandlerMessage);
