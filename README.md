<h1 align="center">Git Like Audit Trail</h1>

<h2 align="center" style="color:Red"><b>This Project still under development & testing</b></h2>

A library that handling audit trail like git.
Using Elasticsearch (allow using custom client later) to store audit-trail data.

## Installation

`yarn add git-like-audit-trail`

## Demo
* [Backend](https://github.com/awcjack/git-like-audit-trail-backend-demo)
* FrontEnd (Preparing)

## Usage:
```javascript
import auditTrail from "git-like-audit-trail"

// content of below 3 function depends on database type
const databaseAddOneRowFunction = async ({
    data,
    auditTrail = true,
    parentTrail
}) => {
    ...
}

const databaseDeleteOneRowFunction = async ({
    data,
    auditTrail = true,
    parentTrail
}) => {
    ...
}

const databaseUpdateOneRowFunction = async ({
    data,
    changedObj,
    addChangedObj,
    deleteChangedObj,
    revert = true,
    auditTrail = true,
    parentTrail
}) => {
    ...
}

const _auditTrail = new auditTrail({
    DBType: "elasticsearch", // default
    host: "http://localhost:9200", //default
    ESinfo: { //default
        indexName: "audit-trail",
    },
    databaseAddOneRowFunction,
    databaseDeleteOneRowFunction,
    databaseUpdateOneRowFunction,
    // databaseCustomActionFunction, // custom action function
})
```

## Function available:

* [createData](#createData): Create audit trail data
* [appendCommitMap](#appendCommitMap): Append commitHash (obtained after createData) into CommitMap
* [query](#query): Query git tree structure
* [queryD3](#queryD3): Query git tree structure in D3 hierarchy
* [queryByCommitHash](#queryByCommitHash): Query commit info by commitHash
* [batchQueryByCommitHash](#batchQueryByCommitHash): Query commit info by commitHashArray
* [revertCommit](#revertCommit): Revert commit like git
* [cherryPick](#cherryPick): Cherry Pick like git
* [checkout](#checkout): checkout to other commit/branch <span style="color:yellow">**Not yet implemented**</span>

## Function usage
`await` need to execute in [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
### createData:
```javascript
const trail = await _auditTrail.createData({
    categoryId: "testTable", // target table name
    userId: "awcjack", // user id
    dataId: "1", // changes target data id
    name: "1", // extra info
    before: {}, // data before change
    after: {
        id: "1",
        name: "test1"
    }, // data after change
    parent, // parent commit id (for large trail that change multiple data)
    action: "CREATE", // "CREATE" || "UPDATE" || "DELETE" (allow extra action type but have to handled in databaseCustomActionFunction)
    ignore: [], // ignore in diff
    ...otherArgs // other args that want to log into this audit trail
})
console.log(trail)

/*
{
    categoryId: "testTable",
    userId: "awcjack",
    dataId: "1",
    name: "1",
    parent,
    action: "CREATE",
    ...otherArgs,
    change: "{\"added\":{\"id\":{\"after\":\"1\"},\"name\":{\"after\":\"test\"}},\"deleted\":{},\"updated\":{}}",
    time: 1613749903586,
    parentTrail: "04353794-da94-468d-abd9-1080426007a4",
    commitHash: "834cb604b1ce6ae0eb77b8a52aab60d913e4ede2
}
// commitHash work as index
*/
```
### appendCommitMap:
```javascript
const { commitHash } = trail // trail object from createData
const commitMap = _auditTrail.appendCommitMap({
    currentCommitMap: "{}", // existing commit map ("{}" for init)
    currentCommitHash: "", // current commit hash in category
    newCommitHash: commitHash //new commit hash from createData
})
console.log(commitMap)
/*
"{^0_834cb604b1ce6ae0eb77b8a52aab60d913e4ede2:834cb604b1ce6ae0eb77b8a52aab60d913e4ede2}"
// string type for storing into db
*/
```
### query:
```javascript
const tree = _auditTrail.query({
    commitHashMap: "{}", // existing commit map
    commitHash: "", // query from hash (user current commit)
    before: 5, // include 5 commit (level) before
    after: 5,// include 5 commit (level) after
    onlyCurrentBranch: false, //only reveal current branch
    getCommitInfo: false // query commit info
})
console.log(tree)
/*
[{"834cb604b1ce6ae0eb77b8a52aab60d913e4ede2":{"3e4c25f224e435372b9c1f92bc050fd3a9840d91":{},"34fc46d4e871605dcf1f3519f5f4ee0124dac4ed":{}}}]
// removed commit info prevent too long
*/
```

### queryD3:
```javascript
const tree = _auditTrail.queryD3({
    commitHashMap: "{}", // existing commit map
    commitHash: "", // query from hash (user current commit)
    before: 5, // include 5 commit (level) before
    after: 5,// include 5 commit (level) after
    onlyCurrentBranch: false, //only reveal current branch
    getCommitInfo: false // query commit info
})
console.log(tree)
/*
[{"children":[{"children":{"name":"da498b3a30a06db903cc25cfac07517e3e08216c", "info": {...}}],"name":"2a599a5d724d659b8ebb6565a626de40d52db10a","info":{"categoryId":"testTable","userId":"awcjack","dataId":"1","name":"test","action":"CREATE","change":"{\"added\":{\"id\":{\"after\":\"1\"},\"name\":{\"after\":\"test\"}},\"deleted\":{},\"updated\":{}}","time":1614433429834,"parentTrail":"b343ac62-7807-4d68-8518-f4d18e59e781","commitHash":"2a599a5d724d659b8ebb6565a626de40d52db10a"}}]
*/
```

### queryByCommitHash:
```javascript
const commit = _auditTrail.queryByCommitHash({
    commitHash: "b11b50b366f8477e8e9f5dea5344fc42eac63b06",
})
console.log(commit)
/*
{
    "categoryId": "testTable",
    "userId": "awcjack",
    "dataId": "3",
    "name": "test3",
    "action": "CREATE",
    "ignore": [],
    "change": "{\"added\":{\"id\":{\"after\":\"3\"},\"name\":{\"after\":\"test3\"}},\"deleted\":{},\"updated\":{}}",
    "time": 1613815197218,
    "parentTrail": "9aaf9a1c-7ccc-453a-9d3f-bd70a5e49c58",
    "commitHash": "b11b50b366f8477e8e9f5dea5344fc42eac63b06"
}
*/
```
### batchQueryByCommitHash:
```javascript
const commits = _auditTrail.batchQueryByCommitHash({
    commitHashArray: ["b11b50b366f8477e8e9f5dea5344fc42eac63b06"],
})
console.log(commits)
/*
[{
    "categoryId": "testTable",
    "userId": "awcjack",
    "dataId": "3",
    "name": "test3",
    "action": "CREATE",
    "ignore": [],
    "change": "{\"added\":{\"id\":{\"after\":\"3\"},\"name\":{\"after\":\"test3\"}},\"deleted\":{},\"updated\":{}}",
    "time": 1613815197218,
    "parentTrail": "9aaf9a1c-7ccc-453a-9d3f-bd70a5e49c58",
    "commitHash": "b11b50b366f8477e8e9f5dea5344fc42eac63b06"
}]
*/
```
### revertCommit:
```javascript
const result = await _auditTrail.revertCommit({
    commitHash: req.params.hash,
})
console.log(result)
/*
{
    "added": {
        "error": false,
        "content": {
            "id": "1",
            "name": "test"
        },
        "commitHash": "834cb604b1ce6ae0eb77b8a52aab60d913e4ede2"
    }
}
*/
```
### cherryPick:
```javascript
const result = await _auditTrail.cherryPick({
    commitHash: req.params.hash,
})
console.log(result)
/*
{
    "added": {
        "error": false,
        "content": {
            "id": "1",
            "name": "test"
        },
        "commitHash": "834cb604b1ce6ae0eb77b8a52aab60d913e4ede2"
    }
}
*/
```
### checkout <span style="color:yellow">**Not yet implemented**</span>:
```javascript
const result = await _auditTrail.checkout({
    commitHashMap: commitHashMap.commitMap,
    currentCommit: currentCommit.commitHash,
    commitHash: req.params.hash,
})
```

## To do
* verify tree structure & logic
* handle checkout
* handle merge (may or may not implement)
* custom client
* provide frontend demo
* handle batch CUD in demo
