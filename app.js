const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DBError:${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertIntoCamelCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
//1.Get All Players API
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT * FROM
    player_details 
    ORDER BY player_id;`;
  const getAllPlayersArray = await db.all(getAllPlayersQuery);
  response.send(
    getAllPlayersArray.map((player) => convertIntoCamelCase(player))
  );
});
//2.Get Player Based On PlayerId API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecialPlayerQuery = `
    SELECT player_id as playerId,
    player_name as playerName
    FROM player_details
    WHERE player_id=${playerId};`;
  const particularPlayer = await db.get(getSpecialPlayerQuery);
  response.send(particularPlayer);
});

//3.Update Details Of Specific Player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerDetailsQuery = `
    UPDATE player_details
    SET player_name='${playerName}'
    WHERE player_id=${playerId};`;
  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

//4.Get Match Details Of Specific Match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificMatchDetailsQuery = `
    SELECT match_id as matchId,
    match,year
    FROM
    match_details
    WHERE match_id=${matchId};`;
  const getParticularMatchDetails = await db.get(getSpecificMatchDetailsQuery);
  response.send(getParticularMatchDetails);
});

//5.Get Match Details Of A Player API
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetails = `
    SELECT match_details.match_id as matchId,
    match_details.match as match,match_details.year as year
    FROM (match_details JOIN player_match_score ON match_details.match_id=player_match_score.match_id) AS P JOIN player_details ON P.player_id=player_details.player_id
    WHERE player_details.player_id=${playerId};`;
  const getPlayerMatches = await db.all(getPlayerMatchDetails);
  response.send(getPlayerMatches);
});

//6.Get Player Details Of Specific Match API
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetailsOfMatchIdQuery = `
    SELECT player_details.player_id as playerId,
    player_details.player_name as playerName
     FROM
    (player_details JOIN player_match_score ON player_details.player_id=player_match_score.player_id) AS Q JOIN match_details ON Q.match_id=match_details.match_id
    WHERE match_details.match_id=${matchId};`;
  const getPlayerDetailsOfMatchId = await db.all(
    getPlayerDetailsOfMatchIdQuery
  );
  response.send(getPlayerDetailsOfMatchId);
});

//7.Get Statistics Of Specific Player Based On PlayerId API
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfSpecificPlayerQuery = `
    SELECT player_details.player_id as playerId,
    player_details.player_name as playerName,
    SUM(player_match_score.score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
    FROM player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id
    WHERE player_details.player_id=${playerId};`;
  const getStatsOfSpecificPlayer = await db.get(getStatsOfSpecificPlayerQuery);
  response.send(getStatsOfSpecificPlayer);
});
module.exports = app;
