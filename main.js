import midi_connect from './modules/midi.js';
import { Game } from './modules/launchpad.js';

const controller_name = "Launchpad Mini";

document.addEventListener('DOMContentLoaded', async () => {
  //console.log(`loaded ${ Date.now()}`);

  let [midi, input, output] = await midi_connect(controller_name);

  if (!input || !output) {
    alert("No launch device found :(");
    return;
  }
  console.log("MIDI input:", input);


  let game = new Game(output, input);

  game.et.addEventListener('gameover', (e) => {
    //console.log(e);
    document.querySelector("#winner_banner").innerHTML = `${e.detail.winner} has won with ${e.detail.score} pairs! Congratulations!`;
    document.querySelector("#gameover_banner").style.visibility = "visible";

  });
  console.log("Game object:", game);

  document.querySelectorAll('.gridsize').forEach((btn) => {
    btn.addEventListener('click', (evt) => {
      //console.log(evt.target.dataset['size'])
      let size = evt.target.dataset['size'];
      game.setGridSize(size);
    });
  });


  document.querySelector('#game_start').addEventListener('click', (e) => {
    console.log("GAME START");
    game.start_game();
  });
});
