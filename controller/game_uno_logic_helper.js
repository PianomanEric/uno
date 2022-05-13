const e = require('express');
const debugPrinter = require('../util/debug_printer');
const dbEngineGameUno = require('./db_engine_game_uno');
const constants = require('../config/constants');
const constantsGameUno = require('../config/constants_game_uno');

const set = new Set(constantsGameUno.CARD_COLORS_SELECETABLE_LEGEAL);

function isValidSlectableColor(color) {
    return set.has(color);
}

const gameUnoLogicHelper = {};

/**
 * IMPORTANT NOTES:
 *      USE THIS FUNCTION IN THIS FILE ONLY
 *
 * @param game_id
 * @returns {Promise<void>}
 */
async function changeTurnAndGetPlayerRowDetailedByGameID(gameRow) {
    debugPrinter.printFunction(changeTurnAndGetPlayerRowDetailedByGameID.name);

    const result = {
        status: null,
        message: null,
        game: gameRow,
        game_data: null,
        players_active: null,
        player_id_turn: null,
        user_id_turn: null,
    };

    // May be empty
    let playerRowsActive = await dbEngineGameUno.getPlayerRowsGameIsActive(gameRow.game_id);

    if (!playerRowsActive.length) {
        result.status = constants.FAILURE;
        result.message = `No active players in game ${gameRow.game_id}`;
        return result;
    }

    // debugPrinter.printBackendWhite(playerRowsActive);

    // If there is no player_id for the game
    if (gameRow.player_id_turn === null) { // TODO: Maybe use "Players".player_index in the future
        await dbEngineGameUno.updateGameDatRowPlayerIDTurn(gameRow.game_id, playerRowsActive[0].player_id);
        result.status = constants.SUCCESS;
        result.message = `Game ${gameRow.game_id}'s player_id_turn was null, player ${playerRowsActive[0].player_id} will have the turn`;
        result.player_id_turn = playerRowsActive[0].player_id;
        result.user_id_turn = playerRowsActive[0].user_id;
        return result;
    }

    if (gameRow.is_clockwise !== false) {
        playerRowsActive = playerRowsActive.reverse();
    }

    result.players_active = playerRowsActive;

    let indexOfCurrentPlayer = null; // FIXME ME, MIGHT BE DANGEROUS

    playerRowsActive.forEach((playerRow, index) => {
        if (gameRow.player_id_turn === playerRow.player_id) {
            indexOfCurrentPlayer = index;
        }
    });

    const indexOfNextPlayerInPlayerRowsActive = ((indexOfCurrentPlayer + 1 + gameRow.skip_amount) % playerRowsActive.length);
    await dbEngineGameUno.updateGameDataRowSkipAmount(gameRow.game_id, 0);

    result.user_id_turn = playerRowsActive[indexOfNextPlayerInPlayerRowsActive].user_id;
    result.player_id_turn = playerRowsActive[indexOfNextPlayerInPlayerRowsActive].player_id;

    const gameData = await dbEngineGameUno.updateGameDatRowPlayerIDTurn(gameRow.game_id, result.player_id_turn);

    if (!gameData) {
        result.status = constants.FAILURE;
        result.message = `Game ${gameRow.game_id}'s GameData failed to update`;
        return result;
    }

    result.game_data = gameData;

    result.status = constants.SUCCESS;
    result.message = `Game ${gameRow.game_id}, player (player_id ${result.player_id}) has the turn`;

    return result;
}

gameUnoLogicHelper.changeTurnAndGetPlayerRowDetailedByGameID = changeTurnAndGetPlayerRowDetailedByGameID;

/**
 * Notes:
 *      This function DOES NOT check if soemthignsd TODO
 *
 *      Process:
 *          1. Update gameData stuff
 * @param gameRowDetailed
 * @param playObject
 * @returns {Promise<{game, message: null, status: null}>}
 */
async function updateGameData(gameRowDetailed, color) {
    debugPrinter.printFunction(updateGameData.name);
    debugPrinter.printBackendCyan(gameRowDetailed);

    const result = {
        status: null,
        message: null,
        game_data: null,
    };

    if (!color && isValidSlectableColor(color)) {
        result.status = constants.FAILURE;
        result.message = `Improper color by game_id: ${gameRowDetailed.game_id} color: ${color}`;
        return result;
    }

    const collectionRowPlayTop = await dbEngineGameUno.getCollectionRowTopDetailedByGameIDAndCollectionInfoID(gameRowDetailed.game_id, 2);

    debugPrinter.printBackendGreen(collectionRowPlayTop);

    if (!collectionRowPlayTop) {
        result.status = constants.FAILURE;
        result.message = `Get Collection of the Top Card of the Play Stack failed, it's empty game_id: ${gameRowDetailed.game_id}`;
        return result;
    }

    const temp = {
        collection_index: collectionRowPlayTop.collection_index,
        color: collectionRowPlayTop.color,
        content: collectionRowPlayTop.content,
        type: collectionRowPlayTop.type,
    };
    debugPrinter.printBackendBlue(temp);

    // Use playObject's color by default if it exists
    if (color && temp.color === constantsGameUno.CARD_COLOR_BLACK) {
        temp.color = color;
    }
    // debugPrinter.printError(playObject);
    // debugPrinter.printBackendBlue(temp);

    // If temp.color is black

    // wildfour causes a draw of four cards, wild doesn't cause a draw. Both causes a change in color chosen by the player.
    if (temp.color === constantsGameUno.CARD_COLOR_BLACK) {
        result.status = constants.FAILURE;
        result.message = `Top Card of PLAY's collection is black for game ${gameRowDetailed.game_id}. No color is selected, suggest a reshuffle`;
        return result;
    }

    // May be undefined
    const gameDataRow = await dbEngineGameUno.updateGameDataRowCardLegal(gameRowDetailed.game_id, temp.type, temp.content, temp.color);

    debugPrinter.printError(gameDataRow);
    if (!gameDataRow) {
        result.status = constants.FAILURE;
        result.message = `Failed to update gameDate ${gameRowDetailed.game_id} legal card`;
        return result;
    }
    result.game_data = gameDataRow;

    // TODO: REMEMBER TO IMPLEMENT THE RESETTERS. JOSEPH FIX IT

    // Assume db queries will be successful since it lacks user input, guards preffered
    if (temp.content === constantsGameUno.CARD_CONTENT_WILDFOUR) {
        // await dbEngineGameUno.updateGameDataDrawAmount(gameRowDetailed.game_id, 4);
        if (gameRowDetailed.draw_amount > 1) {
            result.game_data = await dbEngineGameUno.updateGameDataRowDrawAmount(
                gameRowDetailed.game_id,
                gameRowDetailed.draw_amount + 4,
            );
        } else {
            result.game_data = await dbEngineGameUno.updateGameDataRowDrawAmount(
                gameRowDetailed.game_id,
                4,
            );
        }
    } else if (temp.content === constantsGameUno.CARD_CONTENT_DRAWTWO) {
        result.game_data = await dbEngineGameUno.updateGameDataRowDrawAmount(
            gameRowDetailed.game_id,
            2,
        );
    } else if (temp.content === constantsGameUno.CARD_CONTENT_REVERSE) {
        result.game_data = await dbEngineGameUno.updateGameDataRowIsClockwise(
            gameRowDetailed.game_id,
            !gameRowDetailed.is_clockwise,
        );
    } else if (temp.content === constantsGameUno.CARD_CONTENT_SKIP) {
        result.game_data = await dbEngineGameUno.updateGameDataRowSkipAmount(
            1,
        );
    }

    result.status = constants.SUCCESS;
    result.message = `Game ${gameRowDetailed.game_id}'s GameData was successfully updated`;
    return result;
}

gameUnoLogicHelper.updateGameData = updateGameData;

/**
 * Notes:
 *      Process:
 *          1. Check if can play card
 *              a. Check if card collection_index index exists
 *              b. Check against gameData
 *          2. Play card
 *              a. Update Player's collection & Update PLAY's collection
 *          3. Update gameData stuff
 *
 * @param gameRowDetailed
 * @param playerRow
 * @param collection_index
 * @param color
 * @returns {Promise<void>}
 */

// Helpers for : doMoveCardHandToPlayByCollectionIndexLogic

async function doMoveCardHandToPlayByCollectionIndexLogic(gameRowDetailed, playerRow, collection_index, color) {
    debugPrinter.printFunction(doMoveCardHandToPlayByCollectionIndexLogic.name);

    const result = {
        status: null,
        message: null,
        collection: null,
        game_data: null,
        change_turn: null,
    };

    if (!color && isValidSlectableColor(color)) {
        result.status = constants.FAILURE;
        result.message = `Game ${gameRowDetailed.game_id}, player ${playerRow.display_name} (player_id ${playerRow.player_id}) played an invalid color ${color}`;
        return result;
    }

    // Check if card collection_index index exists (May be undefined)
    const collectionRowHandByCollectionIndex = await dbEngineGameUno.getCollectionRowHandDetailedByCollectionIndex(playerRow.player_id, collection_index);

    if (!collectionRowHandByCollectionIndex) {
        result.status = constants.FAILURE;
        result.message = `Game ${gameRowDetailed.game_id}, player ${playerRow.display_name} (player_id ${playerRow.player_id})'s \
        Card (collection_index ${collection_index}) does not exist`; // Can be used as a short circuit because the playerRow is based on the game_id (don't need to check if game exists)

        return result;
    }
    // TODO STUFF IN HERE START

    debugPrinter.printBackendWhite(collectionRowHandByCollectionIndex);
    debugPrinter.printGreen(gameRowDetailed);

    if ((gameRowDetailed.card_content_legal === constantsGameUno.CARD_CONTENT_WILDFOUR)
        && (gameRowDetailed.card_content_legal !== collectionRowHandByCollectionIndex.content)
        && gameRowDetailed.draw_amount > 1) {
        result.status = constants.FAILURE;
        result.message = `Game ${gameRowDetailed.game_id}, player ${playerRow.display_name} (player_id ${playerRow.player_id}) \
        must play a Card with content ${constantsGameUno.CARD_CONTENT_WILDFOUR} or must draw cards}`;
        debugPrinter.printBackendBlue(result.message);

        return result;
    }

    if ((gameRowDetailed.card_content_legal === constantsGameUno.CARD_CONTENT_DRAWTWO)
        && (gameRowDetailed.card_content_legal !== collectionRowHandByCollectionIndex.content)
        && gameRowDetailed.draw_amount > 1) {
        result.status = constants.FAILURE;
        result.message = `Game ${gameRowDetailed.game_id}, player ${playerRow.display_name} (player_id ${playerRow.player_id}) \
        must play a Card with content ${constantsGameUno.CARD_CONTENT_DRAWTWO} or must draw cards}`;
        debugPrinter.printBackendRed(result.message);
        return result;
    }

    // TODO STUFF IN HERE END

    // ?????????????????
    /**
     * grab the card at the top of the play stack
     * grab the card that the player wants to play
     *
     * if (the card is a black card {wildFour or wild}) {
     *   - verify the player's hand to see if the has no legal cards left to play // Leaves them open to 'challenge' in the future functionality
     *   - Accept the play.
     * } else if (the card's color is the same OR the card's content is the same) {
     *   - Accept the play.
     * } else {
     *   - Reject the play.
     * }
     *
     */
    const collectionRowNew = await dbEngineGameUno.updateCollectionRowHandToPlayByCollectionIndexAndGetCollectionRowDetailed(
        gameRowDetailed.game_id,
        playerRow.player_id,
        collection_index,
    );

    if (!collectionRowNew) {
        result.status = constants.FAILURE;
        result.message = `Game ${gameRowDetailed.game_id}, player ${playerRow.display_name} (player_id ${playerRow.player_id}), Update to the player's collection failed`;
    }
    result.collection = collectionRowNew;

    const gameData = await gameUnoLogicHelper.updateGameData(gameRowDetailed, color);

    if (gameData.status === constants.FAILURE) {
        result.status = gameData.status;
        result.message = gameData.message;
        return result;
    }

    const changeTurn = await gameUnoLogicHelper.changeTurnAndGetPlayerRowDetailedByGameID(gameRowDetailed);

    if (changeTurn.status === constants.FAILURE) {
        result.status = changeTurn.status;
        result.message = changeTurn.message;
        return result;
    }

    result.change_turn = changeTurn;

    result.message = `Game ${gameRowDetailed.game_id}, player ${playerRow.display_name} (player_id ${playerRow.player_id}) has successfully played their Card (collection_index ${collection_index})'`;
    result.game_data = gameData;

    return result;
}

gameUnoLogicHelper.doMoveCardHandToPlayByCollectionIndexLogic = doMoveCardHandToPlayByCollectionIndexLogic;

module.exports = gameUnoLogicHelper;