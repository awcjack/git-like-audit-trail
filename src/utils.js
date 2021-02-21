import _ from "lodash";

export function diffParser(diff, type, change = {}, path = []) {
    if (diff !== null && typeof diff === "object") {
        const keys = Object.keys(diff)
        for (const key of keys) {
            if (key.toLowerCase() === type.toLowerCase()) {
                diff = diff[key]
                change[path.join(".")] = diff
                break
            } else {
                diff[key] = diffParser(diff[key], type, change, [...path, key]).diff
            }
        }
    } else {
        diff = diff[type]
    }
    return {
        diff,
        change
    }
}

export function yamlLikeStringify({
    input,
    index = 0
}) {
    let result = ""
    for (var i = 0; i < Object.keys(input)?.length ?? 0 ; i++) {
        const key = Object.keys(input)?.[i]
        if (_.isArrayLikeObject(input[key])) {
            const tmp = []
            tmp.push(yamlLikeStringify({
                input: input[key],
                index: index + 1
            }))
            result = `${result}^${index}_${encodeURIComponent(key)}:[${tmp.join(",")}]$`
        } else if (_.isObjectLike(input[key])) {
            result = `${result}^${index}_${encodeURIComponent(key)}:{${yamlLikeStringify({
                input: input[key],
                index: index + 1
            })}}$`
            console.log(input[key])
        } else {
            result = `${result}^${index}_${encodeURIComponent(key)}:${encodeURIComponent(input[key])}$`
        }
    }
    return result
}

export function yamlLikeStringParser({
    input = "{}",
    index = 0
}) {
    const result = {}
    const regex = new RegExp(`${index}_(.*?):(.*)`)
    const searchTerm = `^${index}_`;
    const indexOfArray = []
    let _index = 0
    while (input.indexOf(searchTerm, _index) > -1) {
        indexOfArray.push(input.indexOf(searchTerm, _index))
        _index = input.indexOf(searchTerm, _index) + 1
    }
    for (let i = 0; i < indexOfArray.length; i++) {
        const substringEnd = indexOfArray[i + 1] || input.length - 1
        const _substring = input.substring(indexOfArray[i] + 1, substringEnd - 1)
        const found = _substring.match(regex)
        if (found && found.length > 0) {
            if (found[2][found[2].length - 1] === "]") {
                result[found[1]] = Object.values(yamlLikeStringParser({
                    input: found[2],
                    index: index + 1,
                }))
            } else if (found[2][found[2].length - 1] === "}") {
                result[found[1]] = yamlLikeStringParser({
                    input: found[2],
                    index: index + 1
                })
            } else {
                result[found[1]] = decodeURIComponent(found[2])
            }
        }
    }
    return result
}