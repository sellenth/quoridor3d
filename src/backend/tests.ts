import { assert } from "console";
import { Orientation } from "../shared/types";
import { game, Game } from "./game_logic"

export function PerformTests()
{
    TestAddingPlayers();
    TestRemovingPlayers();
    TestSinglePlayer();
    TestOddEven();
}

function TestAddingPlayers()
{
    const game = new Game();
    Test("No players upon just starting game", game.numPlayers() == 0);

    game.addPlayer({
        id: "8008",
        position: {row: 0,
                   col: Math.floor(game.getBoardSize() / 2),
                   layer: Math.floor(game.getBoardLayers() / 2)},
        numFences: 10,
        goalY: game.getBoardSize() - 1
    }   );
    game.addPlayer({
        id: "b4115",
        position: {row: game.getBoardSize() - 1,
                   col: Math.floor(game.getBoardSize() / 2),
                   layer: Math.floor(game.getBoardLayers() / 2)},
        numFences: 10,
        goalY: 0
    }  );

    Test("Adding two players", game.numPlayers() == 2);
}

function TestRemovingPlayers()
{
    const game = new Game();

    game.addPlayer({
        id: "8008",
        position: {row: 0,
                   col: Math.floor(game.getBoardSize() / 2),
                   layer: Math.floor(game.getBoardLayers() / 2)},
        numFences: 10,
        goalY: game.getBoardSize() - 1
    }   );
    game.addPlayer({
        id: "b4115",
        position: {row: game.getBoardSize() - 1,
                   col: Math.floor(game.getBoardSize() / 2),
                   layer: Math.floor(game.getBoardLayers() / 2)},
        numFences: 10,
        goalY: 0
    }  );

    Test("Curr player is 8008", game.currPlayer?.id == "8008");
    game.RemovePlayer("8008");
    Test("Curr player after removing 8008 is b4115", game.currPlayer?.id == "b4115");
    game.RemovePlayer("b4115");
    Test("After final player leaves, the curr player is undefined", game.currPlayer == undefined);
}

function TestSinglePlayer()
{
    const game = new Game();

    game.addPlayer({
        id: "8008",
        position: {row: 0,
                   col: Math.floor(game.getBoardSize() / 2),
                   layer: Math.floor(game.getBoardLayers() / 2)},
        numFences: 10,
        goalY: game.getBoardSize() - 1
    }   );

    game.switchPlayer();
    Test("Curr player after switching players on single player is undefined", game.currPlayer == undefined )
}

function TestOddEven()
{
    let x = 5;
    Test("Odd number is odd", x.IsOdd() == true);
    Test("Odd number is not even", x.IsEven() == false);
}

function Test(title: string, res: boolean )
{
    console.log(title, ": ", res ? "PASSED" : "FAILED")
}

const testPreconfiguredBoard = false;
if (testPreconfiguredBoard)
{

    assert(game.placeWall(Orientation.Vertical,     {row: 8,  col: 1,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Vertical,     {row: 8,  col: 3,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Vertical,     {row: 8,  col: 5,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Flat,         {row: 8,  col: 2,  layer: 3}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 11, col: 2,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 7,  col: 2,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 9,  col: 2,  layer: 0}) == false);


    assert(game.placeWall(Orientation.Horizontal,   {row: 5,  col: 0,  layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal,   {row: 5,  col: 2,  layer: 0}) == false);
    assert(game.placeWall(Orientation.Vertical,     {row: 5,  col: 5,  layer: 0}) == false);
    assert(game.placeWall(Orientation.Vertical,     {row: 6,  col: 5,  layer: 0}) == false);
    assert(game.placeWall(Orientation.Vertical,     {row: 4,  col: 5,  layer: 0}) == true);

    assert(game.placeWall(Orientation.Flat,         {row: 0,  col: 14,  layer: 1}) == true);
    assert(game.placeWall(Orientation.Flat,         {row: 2,  col: 14,  layer: 1}) == false);

//    assert(game.placeWall(Orientation.Flat,         {row: 7,  col: 5,  layer: 3}) == true);
    game.drawBoard();
    /*
    // in bounds and on proper row
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 14, layer: 0}) == true);
    //overlapping wall
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 14, layer: 0}) == false);

    //can't place horizontal wall on 0 row
    assert(game.placeWall(Orientation.Horizontal, {row: 0, col: 13, layer: 0}) == false);

    //block off bottom-left 2 squares
    assert(game.placeWall(Orientation.Vertical, {row: 0, col: 3, layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 0, layer: 0}) == true);

    //can't create overlapping walls
    assert(game.placeWall(Orientation.Vertical, {row: 0, col: 1, layer: 0}) == false);

    assert(game.pathExistsAfterWall(Orientation.Horizontal, {row: 1, col: 4, layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 4, layer: 0}) == true);
    assert(game.placeWall(Orientation.Horizontal, {row: 1, col: 8, layer: 0}) == true);

    assert(game.placeWall(Orientation.Vertical, {row: 4, col: 13, layer: 2}) == true);

    assert(game.placeWall(Orientation.Flat, {row: 2, col: 4, layer: 1}) == true);
    game.drawBoard();
    */
}