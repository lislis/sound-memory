import midi_connect from './modules/midi.js';
import { Game } from './modules/launchpad.js';


//let midi, input, output = null;
const controller_name = "Launchpad Mini";

document.addEventListener('DOMContentLoaded', async () => {
  //console.log(`loaded ${ Date.now()}`);

  let [midi, input, output] = await midi_connect(controller_name);

  if (!input || !output) {
    alert("No launch device found :(");
    return;
  }

  console.log("MIDI input:", input);

  //game.start_game(output);
  let game = new Game(output, input);
  console.log("Game object:", game)
  game.start_game();
});
