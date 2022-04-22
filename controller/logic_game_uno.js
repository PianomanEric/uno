const dbEngineGameUno = require('./db_engine_game_uno');
const debugPrinter = require('../util/debug_printer');

const logicGameUno = {};

async function createPlayer(user_id) {
    debugPrinter.printFunction(createPlayer.name);
    return dbEngineGameUno.createPlayerRow(user_id);
}

logicGameUno.createPlayer = createPlayer;

async function addPlayerToGame(game_id, player_id, is_host) {
    debugPrinter.printFunction(addPlayerToGame.name);
    return dbEngineGameUno.createPlayersRow(game_id, player_id, is_host);
}

logicGameUno.addPlayerToGame = addPlayerToGame;

/**
 * Generate the initial cards for a game
 *
 * Notes:
 *      Create Player Row
 *      Create Game Row
 *
 *      Create Players Row (Link Player Row to Game Row. The first player should be the host)
 *
 *      Create CardState Rows
 *          Create CardState Rows based on CardState.card_state_id and CardInfo.card_info_id
 *          Create Cards Rows based on CardState.card_state_id and Game.game_id
 *          Create Collection Rows based on CardState.card_state_id and CollectionInfo.collection_info_id
 *
 * @param game_id
 * @returns {Promise<void>}
 */
async function createGame(user_id) {
    debugPrinter.printFunction(createGame.name);

    // WARNING: DANGEROUS AND NOT ACID PROOF

    const player = await dbEngineGameUno.createPlayerRow(user_id);

    const game = await dbEngineGameUno.createGameRow();

    const players = await dbEngineGameUno.createPlayersRow(game.game_id, player.player_id, true);

    const cards = await dbEngineGameUno.createCardStateRowsAndCardsRows(game.game_id, 2);

    // TODO: ADDING TO THE Collection IS NOT WRITTEN
    // dbEngineGameUno.createCollectionRow(card_state_id, collection_info_id, collection_index);

    return {
        player,
        game,
        players,
        cards,
    };
}

logicGameUno.createGame = createGame;

module.exports = logicGameUno;