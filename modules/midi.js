// example code from mdn
function onMIDIMessage(event) {
  let str = `MIDI message received at timestamp ${event.timeStamp}[${event.data.length} bytes]: `;
  for (const character of event.data) {
    str += `0x${character.toString(16)} `;
  }
  console.log(str);
}

function startLoggingMIDIInput(midiAccess) {
  midiAccess.inputs.forEach((entry) => {
    entry.onmidimessage = onMIDIMessage;
  });
}


function listInputsAndOutputs(midiAccess) {
  for (const entry of midiAccess.inputs) {
    const input = entry[1];
    console.log(
      `Input port [type:'${input.type}']` +
        ` id:'${input.id}'` +
        ` manufacturer:'${input.manufacturer}'` +
        ` name:'${input.name}'` +
        ` version:'${input.version}'`,
    );
  }

  for (const entry of midiAccess.outputs) {
    const output = entry[1];
    console.log(
      `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`,
    );
  }
}

// actually used code

function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  return midiAccess;
}

function onMIDIFailure(msg) {
  console.error(`Failed to get MIDI access - ${msg}`);
}


async function midi_connect(controller_name) {
  let midiAccess = await navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  let input, output;

  midiAccess.inputs.forEach((entry) => {
    if (entry.name === controller_name) {
      input = entry;
      //input.onmidimessage = onMIDIMessage;
    }
  });
  midiAccess.outputs.forEach((entry) => {
    if (entry.name === controller_name) {
      output = entry;
    }
  });

  return new Array(midiAccess, input, output);
}


export default midi_connect;
