/*
Handle all the game api calls

 */
const controllerGamesAPI = {};

async function playCard(req, res, next) {
    // TODO VALIDATE IF USER IS IN THAT GAME
    // TODO VALIDATE REQUEST

    const {
        card_id,
        lobby_id,
    } = req.body;

    res.json({
        status: 'success',
        message: 'you played a card',
    });
}

controllerGamesAPI.playCard = playCard;

async function drawCard(req, res, next) {
    res.json({
        status: 'success',
        message: 'you drawed a card',
    });
}

controllerGamesAPI.drawCard = drawCard;

module.exports = controllerGamesAPI;
