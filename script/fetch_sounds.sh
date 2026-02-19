#! /bin/bash

set -euo pipefail
trap "echo 'error: Script failed: see failed command above'" ERR

shopt -s nullglob  # Prevent literal *.mp3 if no matches
mkdir -p processed

{
    jq -c '.[]' ../data/animals.json| while read i; do
        # do stuff with $i
        echo "$i" | jq '.soundFilePath' | xargs -n1 curl -LO
    done


    for file in *.mp3; do
        echo "Processing: $file"

        tmp="${file%.mp3}.tmp.mp3"

        # Cut first 2 seconds
        ffmpeg -t 2 -i $file -acodec copy $tmp

        mv "$tmp" "processed/$file"
        rm "$file"
    done

}
