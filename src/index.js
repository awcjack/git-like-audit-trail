import _ from "lodash"
import { detailedDiff } from 'deep-object-diff'
import { getESClient, elasticsearchInsert, elasticsearchSearch } from "./elasticsearch"
import { v4 as uuid } from "uuid"
import crypto from "crypto"
import { yamlLikeStringParser, yamlLikeStringify, diffParser } from "./utils"

const auditTrail = function (options) {
    // audit trail database info
    this.auditTrailDBType = options?.DBType || "elasticsearch"
    this.auditTrailHost = options?.host || "http://localhost:9200"
    this.indexName = options?.indexName || "audit-trail"
    this.ESinfo = options?.ESinfo
    // custom database
    this.customClient = options?.customClient
    this.customAddData = options?.customAddData
    this.customQueryFunction = options?.customQueryFunction

    // target database (non audit trail database) manipulation (for revert)
    this.databaseAddOneRowFunction = options?.databaseAddOneRowFunction
    this.databaseUpdateOneRowFunction = options?.databaseUpdateOneRowFunction
    this.databaseDeleteOneRowFunction = options?.databaseDeleteOneRowFunction
    this.databaseCustomFunction = options?.databaseCustomActionFunction

    if (this.auditTrailDBType === "elasticsearch") {
        this.client = getESClient({ endpoint: this.auditTrailHost, ...this.ESinfo })
    } else if (this.auditTrailDBType === "CUSTOM") {
        console.log("[Audit Trail] Custom DB Client")
    }
}

function getRightmostIndexBeforeEnd({
    input = "",
    searchText = "",
    index = 0,
    end
}) {
    let i = 0
    while (i = input.indexOf(searchText, index)) {
        if (i >= end || i === -1) {
            break
        }
        index = i + 1
    }
    return index - 1
}

function createTreeDiagram({
    commitHashMap,
    index = 0,
    level = 0,
    size = 10,
    path = "",
    onlyCurrentBranch = false,
    before = 5,
    currentCommit
}) {
    if (size <= 0) {
        const result = {}
        _.set(result, path, {})
        return result
    }
    const currentIndex = index
    index = commitHashMap.indexOf(`^${level}_`, index)
    if (new RegExp('\\^[0-9]{1,}_').test(commitHashMap.substring(currentIndex + 2, index - 1))) { // currentIndex + 2 for handling getRightmostIndexBeforeEnd case
        const result = {}
        _.set(result, path, {})
        return result
    }
    if (index === -1) {
        return createTreeDiagram({
            commitHashMap,
            index,
            level: level + 1,
            size: 0,
            path,
            onlyCurrentBranch,
            before: before - 1
        })
    }
    let result = {}
    const commitHash = commitHashMap.substring(index + 1 + level.toString().length + 1, index + 1 + level.toString().length + 1 + 40)
    if (path) {
        path = `${path}.${commitHash}`
    } else {
        path = `${commitHash}`
    }
    if (onlyCurrentBranch && before > 0) {
        const targetIndex = commitHashMap.indexOf(`_${currentCommit}`)
        const closestIndex = getRightmostIndexBeforeEnd({
            input: commitHashMap.substring(0, targetIndex),
            searchText: `^${level + 1}_`,
            index,
            end: targetIndex
        })
        return createTreeDiagram({
            commitHashMap,
            index: closestIndex,
            level: level + 1,
            size: size - 1,
            path,
            onlyCurrentBranch,
            before: before - 1,
            currentCommit
        })
    }
    let nextTwoIndex = commitHashMap.indexOf(`^${level + 2}_`, index)
    if (nextTwoIndex === -1) {
        nextTwoIndex = commitHashMap.length
    }
    const nextSameLevelIndex = commitHashMap.indexOf(`^${level}_`, index + 1)
    let _indexArray = []
    let _index = commitHashMap.indexOf(`^${level + 1}_`, index)
    while (_index !== -1 && _index < (nextSameLevelIndex != - 1 ? nextSameLevelIndex : commitHashMap.length)) {
        _indexArray.push(_index)
        _index = commitHashMap.indexOf(`^${level + 1}_`, _index + 1)
    }
    if (_indexArray.length > 1) {
        // branch out --> array
        for (let i = 0; i < _indexArray.length; i++) {
            result = _.merge(result, createTreeDiagram({
                commitHashMap,
                index: _indexArray[i] - 1,
                level: level + 1,
                size: size - 1,
                path,
                onlyCurrentBranch,
                before: before - 1
            }))
        }
        return result
    } else {
        return createTreeDiagram({
            commitHashMap,
            index,
            level: level + 1,
            size: size - 1,
            path,
            onlyCurrentBranch,
            before: before - 1
        })
    }
}

async function createTreeDiagramD3({
    commitHashMap,
    index = 0,
    level = 0,
    size = 10,
    path = "",
    onlyCurrentBranch = false,
    before = 5,
    currentCommit,
    getCommitInfo,
    client
}) {
    const result = {}
    result.children = []
    const currentIndex = index
    const commitHash = commitHashMap.substring(index + 1 + level.toString().length + 1, index + 1 + level.toString().length + 1 + 40)
    result.name = commitHash
    if (getCommitInfo) {
        const _result = await queryElasticseaerch({
            commitHashArray: [commitHash],
            client
        })
        result.info = _result?.body?.hits?.hits?.[0]?._source
    }

    index = commitHashMap.indexOf(`^${level + 1}_`, index)
    if (new RegExp('\\^[0-9]{1,}_').test(commitHashMap.substring(currentIndex + 2, index - 1)) || index === -1 || size <= 0) { // currentIndex + 2 for handling getRightmostIndexBeforeEnd case
        // if have other level between current level & next level or no next level --> current level is branch out / head --> no children --> return 
        delete result.children
        return result
    }
    console.log("result", result)

    if (onlyCurrentBranch && before > 0) {
        const targetIndex = commitHashMap.indexOf(`_${currentCommit}`)
        const closestIndex = getRightmostIndexBeforeEnd({
            input: commitHashMap.substring(0, targetIndex),
            searchText: `^${level + 1}_`,
            index,
            end: targetIndex
        })
        const child = await createTreeDiagramD3({
            commitHashMap,
            index: closestIndex,
            level: level + 1,
            size: size - 1,
            path,
            onlyCurrentBranch,
            before: before - 1,
            getCommitInfo,
            currentCommit,
            client
        })
        result.children.push(child)
        return result
    }

    // branch out checking
    let nextTwoIndex = commitHashMap.indexOf(`^${level + 2}_`, index)
    console.log("nextTwoIndex", nextTwoIndex)
    if (nextTwoIndex === -1) {
        nextTwoIndex = commitHashMap.length
    }
    const nextSameLevelIndex = commitHashMap.indexOf(`^${level}_`, index + 1)
    console.log("nextSameLevelIndex", nextSameLevelIndex)
    let _indexArray = []
    let _index = commitHashMap.indexOf(`^${level + 1}_`, index)
    console.log("_index", _index)
    while (_index !== -1 && _index < (nextSameLevelIndex != - 1 ? nextSameLevelIndex : commitHashMap.length)) {
        _indexArray.push(_index)
        _index = commitHashMap.indexOf(`^${level + 1}_`, _index + 1)
    }
    console.log("_indexArray", _indexArray)
    if (_indexArray.length > 1) {
        // branch out --> array
        for (let i = 0; i < _indexArray.length; i++) {
            console.log("_indexArray[i]", `${i} ${_indexArray[i]}`)
            const child = await createTreeDiagramD3({
                commitHashMap,
                index: _indexArray[i],
                level: level + 1,
                size: size - 1,
                path,
                onlyCurrentBranch,
                before: before - 1,
                getCommitInfo,
                currentCommit,
                client
            })
            result.children.push(child)
        }
        console.log("result.children", result.children)
        return result
    } else {
        const child = await createTreeDiagramD3({
            commitHashMap,
            index,
            level: level + 1,
            size: size - 1,
            path,
            onlyCurrentBranch,
            before: before - 1,
            getCommitInfo,
            currentCommit,
            client
        })
        result.children.push(child)
        return result
    }
}

async function queryElasticseaerch({
    commitHashArray,
    client
}) {
    const result = await elasticsearchSearch({
        commitHashArray: commitHashArray,
        size: commitHashArray.length,
        client
    })
    return result
}

function addCurrentCommit({
    input,
    currentCommit
}) {
    const result = {}
    const inputKeys = Object.keys(input)
    for (let i = 0; i < inputKeys.length; i++) {
        const _tmp = addCurrentCommit({
            input: input[inputKeys[i]],
            currentCommit
        })
        if (currentCommit === inputKeys[i]) {
            result[inputKeys[i]] = {
                ..._tmp,
                currentCommit: true
            }
        } else {
            result[inputKeys[i]] = {
                ..._tmp,
            }
        }
    }
    return result
}

async function getCommitHashInfo({
    input,
    client,
    currentCommit
}) {
    const result = {}
    const inputKeys = Object.keys(input)
    for (let i = 0; i < inputKeys.length; i++) {
        const info = await queryElasticseaerch({
            commitHashArray: [inputKeys[i]],
            client
        })
        const _tmp = await getCommitHashInfo({
            input: input[inputKeys[i]],
            client,
            currentCommit
        })
        if (currentCommit === inputKeys[i]) {
            result[inputKeys[i]] = {
                ..._tmp,
                info: info?.body?.hits?.hits?.[0]?._source,
                currentCommit: true
            }
        } else {
            result[inputKeys[i]] = {
                ..._tmp,
                info: info?.body?.hits?.hits?.[0]?._source
            }
        }
    }
    return result
}

function getChanges({
    changed = {
        added: {},
        deleted: {},
        updated: {}
    },
    revert
}) {
    const addedChange = diffParser(changed.added, "after")
    const deletedChange = diffParser(changed.deleted, "before")
    let updatedChange
    if (revert) {
        updatedChange = diffParser(changed.updated, "before")
    } else {
        updatedChange = diffParser(changed.updated, "after")
    }
    return {
        addedChange,
        deletedChange,
        updatedChange
    }
}

function getShortestPath({
    commitHashMap,
    commitHash,
    currentCommit,
}) {
    const currentLevel = parseInt((commitHashMap.match(new RegExp(`\\^([0-9]+)_${currentCommit}`))?.[1] ?? 0), 10) ?? 0
    const targetLevel = parseInt((commitHashMap.match(new RegExp(`\\^([0-9]+)_${commitHash}`))?.[1] ?? 0), 10) ?? 0
    const currentIndex = commitHashMap.indexOf(`^${currentLevel}_${currentCommit}`)
    const targetIndex = commitHashMap.indexOf(`^${targetLevel}_${commitHash}`)
    const forward = []
    const backward = []
    if (currentLevel > targetLevel) {
        // current level revert to target level ---> same = end & different = find common point
        const difference = currentLevel - targetLevel
        for (let i = 0; i < difference; i++) {
            const _tmp = getRightmostIndexBeforeEnd({
                input: commitHashMap.substring(0, currentIndex),
                searchText: `^${currentLevel - 1 - i}_`,
                end: currentIndex
            })
            backward.push(commitHashMap.substring(_tmp + 1 + (currentLevel - 1 - i).toString().length + 1, _tmp + 1 + (currentLevel - 1 - i).toString().length + 1 + 40))
        }
        if (backward[backward.length - 1] === commitHash) {
            return {
                backward
            }
        }
        const result = getShortestPath({
            commitHashMap: commitHashMap.substring(0, Math.max(commitHashMap.indexOf(`^${currentLevel - difference}_${backward[backward.length - 1]}`) + 2 + (currentLevel - difference) + 40, targetIndex + 2 + targetLevel.toString().length + 40)),
            commitHash,
            currentCommit: backward[backward.length - 1],
        })
        return {
            forward: result.forward,
            backward: backward.concat(result.backward)
        }

    } else if (currentLevel < targetLevel) {
        // target revert to same level --> same = end & diffent = find common point
        forward.push(commitHash)
        const difference = targetLevel - currentLevel
        for (let i = 0; i < difference; i++) {
            const _tmp = getRightmostIndexBeforeEnd({
                input: commitHashMap.substring(0, targetIndex),
                searchText: `^${targetLevel - 1 - i}_`,
                end: targetIndex
            })
            forward.push(commitHashMap.substring(_tmp + 1 + (targetLevel - 1 - i).toString().length + 1, _tmp + 1 + (targetLevel - 1 - i).toString().length + 1 + 40)) //reversed
        }
        if (forward[forward.length - 1] === currentCommit) {
            return {
                forward
            }
        }
        const result = getShortestPath({
            commitHashMap: commitHashMap.substring(0, Math.max(commitHashMap.indexOf(`^${targetLevel - difference}_${forward[forward.length - 1]}`) + 2 + (targetLevel - difference).toString().length + 40, currentIndex + 2 + currentLevel.toString().length + 40)),
            commitHash: forward[forward.length - 1],
            currentCommit,
        })
        forward.pop()
        return {
            forward: forward.concat(result.forward ?? []),
            backward: result.backward
        }
    } else if (currentLevel === targetLevel) {
        if (currentIndex === targetIndex) {
            return {}
        }
        // both backward 10 --> check same or not --> same = remove duplicated value & diff = re run
        for (let i = 0; i < 10; i++) {
            const _tmp = getRightmostIndexBeforeEnd({
                input: commitHashMap.substring(0, currentIndex),
                searchText: `^${currentLevel - 1 - i}_`,
                end: currentIndex
            })
            if (_tmp !== -1) {
                backward.push(commitHashMap.substring(_tmp + 1 + (currentLevel - 1 - i).toString().length + 1, _tmp + 1 + (currentLevel - 1 - i).toString().length + 1 + 40))
            } else {
                break
            }
        }
        forward.push(commitHash)
        for (let i = 0; i < 10; i++) {
            const _tmp = getRightmostIndexBeforeEnd({
                input: commitHashMap.substring(0, targetIndex),
                searchText: `^${targetLevel - 1 - i}_`,
                end: targetIndex
            })
            if (_tmp !== -1) {
                forward.push(commitHashMap.substring(_tmp + 1 + (targetLevel - 1 - i).toString().length + 1, _tmp + 1 + (targetLevel - 1 - i).toString().length + 1 + 40))
            } else {
                break
            }
        }
        while (forward[forward.length - 2] === backward[backward.length -2] && (backward[backward.length -2] !== undefined || isNaN(backward[backward.length -2]))) {
            forward.pop()
            backward.pop()
        }
        if (forward[forward.length - 1] === backward[backward.length - 1]) {
            return {
                forward,
                backward
            }
        }
        return getShortestPath({
            commitHashMap: commitHashMap.substring(0, Math.max(forward[forward.length - 1], backward[backward.length - 1])),
            commitHash: commitHashMap.substring(forward[forward.length - 1] + 1 + (targetLevel - 1 - 10).toString().length + 1, forward[forward.length - 1] + 1 + (targetLevel - 1 - 10).toString().length + 1 + 40),
            currentCommit: commitHashMap.substring(backward[backward.length - 1] + 1 + (currentLevel - 1 - 10).toString().length + 1, backward[backward.length - 1] + 1 + (currentLevel - 1 - 10).toString().length + 1 + 40),
        })
    }
}

// Get commit hash info by ID
auditTrail.prototype.queryByCommitHash = async function ({
    commitHash,
}) {
    const result = await queryElasticseaerch({
        commitHashArray: [commitHash],
        client: this.client
    })
    return result?.body?.hits?.hits?.[0]?._source
}

// Get multiple commit hash info by IDs
auditTrail.prototype.batchQueryByCommitHash = async function ({
    commitHashArray,
}) {
    const result = await queryElasticseaerch({
        commitHashArray,
        client: this.client
    })
    return result?.body?.hits?.hits?.map(data => data?._source)
}

// Query for tree object array
auditTrail.prototype.query = async function ({
    commitHashMap = "{}", // existing commit map
    commitHash = "", // query from hash (user current commit)
    before = 5, // include 5 commit (level) before
    after = 5,// include 5 commit (level) after
    onlyCurrentBranch = false, //only reveal current branch
    getCommitInfo = true // query commit info
}) {
    const commitMap = yamlLikeStringParser({
        input: commitHashMap
    })
    if (Object.keys(commitMap)?.length === 0 || !commitHash || (before === 0 && after === 0)) {
        console.log("CommitHashMap or commitHash empty or both before and after size set 0")
        return []
    }
    const currentLevel = parseInt((commitHashMap.match(new RegExp(`\\^([0-9]+)_${commitHash}`))?.[1] ?? 0), 10) ?? 0
    let startingIndexArray = []
    const currentIndex = commitHashMap.indexOf(`^${currentLevel}_${commitHash}`)
    if (!onlyCurrentBranch) {
        let _index = commitHashMap.indexOf(`^${(currentLevel - before) > 0 ? currentLevel - before : 0}_`)
        while (_index != -1) {
            startingIndexArray.push(_index)
            _index = commitHashMap.indexOf(`^${(currentLevel - before) > 0 ? currentLevel - before : 0}_`, _index + 1)
        }
    } else {
        const index = getRightmostIndexBeforeEnd({
            input: commitHashMap.substring(0, currentIndex),
            searchText: `^${currentIndex - before}_`,
            end: currentIndex
        })
        startingIndexArray = [index]
    }
    const realIndexArray = []
    for (let j = 0; j < startingIndexArray.length; j++) {
        let startingIndex = startingIndexArray[j]
        const realStart = ((currentLevel - before) > 0 ? currentLevel - before : 0)
        let result = createTreeDiagram({
            commitHashMap,
            index: startingIndex,
            level: realStart,
            size: before + after,
            path: "",
            onlyCurrentBranch,
            before: before > currentLevel ? currentLevel : before,
            currentCommit: commitHash
        })

        if (getCommitInfo) {
            result = await getCommitHashInfo({
                input: result,
                client: this.client,
                currentCommit: commitHash
            })
        } else {
            result = addCurrentCommit({
                input: result,
                currentCommit: commitHash
            })
        }

        realIndexArray.push(result)
    }

    return realIndexArray
}

// Query for D3 tree object array
auditTrail.prototype.queryD3 = async function ({
    commitHashMap = "{}", // existing commit map
    commitHash = "", // query from hash (user current commit)
    before = 5, // include 5 commit (level) before
    after = 5,// include 5 commit (level) after
    onlyCurrentBranch = false, //only reveal current branch
    getCommitInfo = true // query commit info
}) {
    const commitMap = yamlLikeStringParser({
        input: commitHashMap
    })
    if (Object.keys(commitMap)?.length === 0 || !commitHash || (before === 0 && after === 0)) {
        console.log("CommitHashMap or commitHash empty or both before and after size set 0")
        return []
    }
    const currentLevel = parseInt((commitHashMap.match(new RegExp(`\\^([0-9]+)_${commitHash}`))?.[1] ?? 0), 10) ?? 0
    let startingIndexArray = []
    const currentIndex = commitHashMap.indexOf(`^${currentLevel}_${commitHash}`)
    if (!onlyCurrentBranch) {
        let _index = commitHashMap.indexOf(`^${(currentLevel - before) > 0 ? currentLevel - before : 0}_`)
        while (_index != -1) {
            startingIndexArray.push(_index)
            _index = commitHashMap.indexOf(`^${(currentLevel - before) > 0 ? currentLevel - before : 0}_`, _index + 1)
        }
    } else {
        const index = getRightmostIndexBeforeEnd({
            input: commitHashMap.substring(0, currentIndex),
            searchText: `^${currentIndex - before}_`,
            end: currentIndex
        })
        startingIndexArray = [index]
    }
    const realIndexArray = []
    for (let j = 0; j < startingIndexArray.length; j++) {
        let startingIndex = startingIndexArray[j]
        const realStart = ((currentLevel - before) > 0 ? currentLevel - before : 0)
        // create tree diagram with starting node starting level (current level - before level)
        let result = await createTreeDiagramD3({
            commitHashMap,
            index: startingIndex,
            level: realStart,
            size: before + after,
            path: "",
            onlyCurrentBranch,
            before: before > currentLevel ? currentLevel : before,
            currentCommit: commitHash,
            getCommitInfo,
            client: this.client,
        })

        realIndexArray.push(result)
    }

    return realIndexArray
}

// revert specific commit (will create audit trail during revert)
auditTrail.prototype.revertCommit = async function ({
    commitHash,
    parentTrail
}) {
    const search = await queryElasticseaerch({
        commitHashArray: [commitHash],
        client: this.client
    })
    const data = JSON.parse((search?.body?.hits?.hits?.[0]?._source?.change) ?? null)
    if (data) {
        const changes = getChanges({
            changed: data,
            revert: true
        })
        const result = {}
        if (search?.body?.hits?.hits?.[0]?._source?.action === "CREATE") {
            // new row --> delete
            result.deleted = await this.databaseDeleteOneRowFunction({
                data: search?.body?.hits?.hits?.[0]?._source,
                changedObj: changes.addedChange?.diff,
                flattedchanged: changes.addedChange?.change,
                auditTrail: true,
                parentTrail
            })
            return result
        } else if (search?.body?.hits?.hits?.[0]?._source?.action === "DELETE") {
            // removed row --> insert back
            result.added = await this.databaseAddOneRowFunction({
                data: search?.body?.hits?.hits?.[0]?._source,
                changedObj: changes.deletedChange?.diff,
                flattedchanged: changes.deletedChange?.change,
                auditTrail: true,
                parentTrail
            })
            return result
        } else if (search?.body?.hits?.hits?.[0]?._source?.action === "UPDATE") {
            result.updated = await this.databaseUpdateOneRowFunction({
                data: search?.body?.hits?.hits?.[0]?._source,
                changedObj: changes.updatedChange?.diff,
                flattedchanged: changes.updatedChange?.change,
                addChangedObj: changes.addedChange?.diff,
                addFlattedchanged: changes.addedChange?.change,
                deleteChangedObj: changes.deletedChange?.diff,
                deleteFlattedchanged: changes.deletedChange?.change
            })
            return result
        }
        // unknown action --> direct return data
        result.updated = await this.databaseCustomFunction({
            action: search?.body?.hits?.hits?.[0]?._source?.action ?? "ERROR",
            data: search?.body?.hits?.hits?.[0]?._source,
            changedObj: changes.updatedChange?.diff,
            flattedchanged: changes.updatedChange?.change,
            addChangedObj: changes.addedChange?.diff,
            addFlattedchanged: changes.addedChange?.change,
            deleteChangedObj: changes.deletedChange?.diff,
            deleteFlattedchanged: changes.deletedChange?.change
        })
        return result
    }
    return null
}

// revert multiple time to checkout previous commit or switch branch
auditTrail.prototype.checkout = async function ({
    commitHashMap,
    commitHash,
    currentCommit,
}) {
    console.log("commitHashMap", commitHashMap)
    console.log("commitHash", commitHash)
    console.log("currentCommit", currentCommit)
    if (commitHash === currentCommit) {
        return {}
    }
    const result = getShortestPath({
        commitHashMap,
        commitHash,
        currentCommit,
    })


    return result
}

// pick one commit to run again
auditTrail.prototype.cherryPick = async function ({
    commitHash,
    parentTrail
}) {
    const search = await queryElasticseaerch({
        commitHashArray: [commitHash],
        client: this.client
    })
    const data = JSON.parse((search?.body?.hits?.hits?.[0]?._source?.change) ?? null)
    if (data) {
        const changes = getChanges({
            changed: data
        })
        const result = {}
        if (search?.body?.hits?.hits?.[0]?._source?.action === "CREATE") {
            result.added = await this.databaseAddOneRowFunction({
                data: search?.body?.hits?.hits?.[0]?._source,
                changedObj: changes.deletedChange?.diff,
                flattedchanged: changes.deletedChange?.change,
                auditTrail: true,
                parentTrail
            })
            return result
        } else if (search?.body?.hits?.hits?.[0]?._source?.action === "DELETE") {
            result.deleted = await this.databaseDeleteOneRowFunction({
                data: search?.body?.hits?.hits?.[0]?._source,
                changedObj: changes.addedChange?.diff,
                flattedchanged: changes.addedChange?.change,
                auditTrail: true,
                parentTrail
            })
            return result
        } else if (search?.body?.hits?.hits?.[0]?._source?.action === "UPDATE") {
            result.updated = await this.databaseUpdateOneRowFunction({
                data: search?.body?.hits?.hits?.[0]?._source,
                changedObj: changes.updatedChange?.diff,
                flattedchanged: changes.updatedChange?.change,
                addChangedObj: changes.addedChange?.diff,
                addFlattedchanged: changes.addedChange?.change,
                deleteChangedObj: changes.deletedChange?.diff,
                deleteFlattedchanged: changes.deletedChange?.change,
                revert: false
            })
            return result
        }
        // unknown action --> direct return data
        result.updated = await this.databaseCustomFunction({
            action: search?.body?.hits?.hits?.[0]?._source?.action ?? "ERROR",
            data: search?.body?.hits?.hits?.[0]?._source,
            changedObj: changes.updatedChange?.diff,
            flattedchanged: changes.updatedChange?.change,
            addChangedObj: changes.addedChange?.diff,
            addFlattedchanged: changes.addedChange?.change,
            deleteChangedObj: changes.deletedChange?.diff,
            deleteFlattedchanged: changes.deletedChange?.change,
            revert: false
        })
        return result
    } else {
        return null
    }
}

// add data into db
auditTrail.prototype.createData = async function ({
    categoryId, // expect target table name or type
    userId, // user id for tracking who change the data
    dataId, // target data id
    name, // extra target name info
    before = {}, // data before change
    after, // data after change
    parent, // parent commit id (for large trail that change multiple data)
    action, // "CREATE" || "UPDATE" || "DELETE", 3 type of audit trail action
    ignore = [], // ignore field in before and after that won't write in audit trail
    ...otherArgs // other args that want to log into this audit trail
}) {
    const indexName = this.indexName
    if ((_.isEmpty(action) || !action) && action !== "") {
        // guess action type (use "" to exclude action)
        if (!before && after) {
            action = "CREATE"
        }
        if (before && after) {
            action = "UPDATE"
        }
        if (before && !after) {
            action = "DELETE"
        }
    }
    let change
    for (let i = 0; i < ignore.length; i++) {
        delete before[ignore[i]]
        delete after[ignore[i]]
    }
    if (!_.isNull(after)) {
        let diff = detailedDiff(before, after)
        ignore?.forEach((key) => {
            if (diff.added[key]) {
                delete diff.added[key]
            }
            if (diff.deleted[key]) {
                delete diff.deleted[key]
            }
            if (diff.updated[key]) {
                delete diff.updated[key]
            }
        })
        change = JSON.stringify(diff)
    }
    let parentTrail
    let trailSession
    if (_.isNull(parent) || _.isUndefined(parent)) {
        parentTrail = uuid()
    } else {
        trailSession = parent
    }
    const hash = crypto.createHash('sha1')
    const data = hash.update(JSON.stringify({...change, time: Date.now()}), 'utf-8');
    const commitHash = data.digest('hex');

    const insertdata = {
        categoryId,
        userId,
        dataId,
        name,
        parent,
        action,
        ...otherArgs,
        change,
        time: Date.now(),
        parentTrail,
        trailSession,
        commitHash
    }
    await elasticsearchInsert({
        indexName,
        insertdata,
        client: this.client
    })
    return insertdata
}

// modify commit map object
auditTrail.prototype.appendCommitMap = function ({
    currentCommitMap = "{}", // existing commit map ("{}" for init)
    currentCommitHash = "", // current commit hash in category
    newCommitHash = "" //new commit hash from createData
}) {
    const commitMap = yamlLikeStringParser({
        input: currentCommitMap
    })
    if (!currentCommitHash) {
        if (Object.keys(commitMap)?.length === 0) {
            // first commit
            commitMap[newCommitHash] = newCommitHash
            return `{${yamlLikeStringify({ input: commitMap })}}`
        } else {
            // new commit but haven't info
            console.log("Append Commit map error, no current commit hash but commit map is not empty!!!")
            return currentCommitMap
        }
    } else {
        if (!currentCommitMap) {
            console.log("Append Commit map error, no commit map is found!!!")
            return "{}"
        }
        // append
        const currentLevel = parseInt((currentCommitMap.match(new RegExp(`\\^([0-9]+)_${currentCommitHash}`))?.[1] ?? 0), 10) ?? 0
        const currentIndex = currentCommitMap.indexOf(`^${currentLevel}_${currentCommitHash}`)
        let levelIndexArray = [currentIndex]
        for (let i = 0; i < currentLevel; i++) {
            levelIndexArray.push(getRightmostIndexBeforeEnd({
                input: currentCommitMap.substring(0, levelIndexArray[i]),
                searchText: `^${currentLevel - 1 - i}_`,
                end: levelIndexArray[i]
            }))
        }
        levelIndexArray = levelIndexArray.reverse()
        const path = []
        for (let i = 0; i < levelIndexArray.length; i++) {
            const substring = currentCommitMap.substring(levelIndexArray[i], levelIndexArray[i] + 40 + 4)
            path.push(substring.match(`\\^${i}_(.*?):`)?.[1] ?? 0)
        }
        let append = {}
        if (typeof _.get(commitMap, path) !== "string") {
            append = { ..._.get(commitMap, path) }
        }
        append[newCommitHash] = newCommitHash
        _.set(commitMap, path, append)
        return `{${yamlLikeStringify({ input: commitMap })}}`
    }
}

module.exports = auditTrail