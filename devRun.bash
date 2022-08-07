#!/bin/bash
PWD=$(pwd)
golangServerLoc=$PWD/backend/server.go

#echo $golangServerLoc
go run $golangServerLoc > logs/localConsole_dev.log 2>&1 &

cd frontend

npm run serve