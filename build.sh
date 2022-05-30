#
#lsof -i:8080 -t | xargs kill
#
#osascript -e '
#delay .5
#tell application "Chrome" to tell the active tab of its first window
#    reload
#end tell ' &

npx ts-node qu.ts

